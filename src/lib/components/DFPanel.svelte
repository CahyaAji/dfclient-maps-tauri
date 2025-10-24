<script>
  import { dfStore } from "../stores/dfStore.svelte";
  import ControlPanel from "./ControlPanel.svelte";
  import DFPlot from "./DFPlot.svelte";
  import StatusDF from "./StatusDF.svelte";
  import { udpState, udpStore } from "../stores/udpStore.svelte";
  import { signalState } from "../stores/signalState.svelte";
  import { setAntenna, setFreqGainApi } from "../utils/api_handler";

  let appInitialized = false;
  let frequencyDebounceTimer = null;
  const FREQUENCY_DEBOUNCE_MS = 150;
  const MIN_FREQUENCY_CHANGE = 0.001;

  let prevFreq = $state(0);
  let isChangingFreq = $state(false);
  let retryCount = $state(0);
  const MAX_RETRIES = 3;

  /**
   * @param {number} antSpace
   */
  async function handleSetAntenna(antSpace) {
    try {
      const result = await setAntenna(antSpace);
      if (result.success) {
        return true;
      } else {
        console.log(`Antenna setting failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.log("Error setting antenna:", error);
      return false;
    }
  }

  /**
   * @param {number} newFreq
   * @param {number} newGain
   * @param {number} antSpace
   */
  async function handleSetFreqAndGain(newFreq, newGain, antSpace) {
    try {
      const apiData = {
        center_freq: newFreq,
        uniform_gain: newGain,
        ant_spacing_meters: antSpace,
      };

      const result = await setFreqGainApi(apiData);
      if (result.success) {
        signalState.setFrequency(newFreq);
        signalState.setGain(newGain);
        return true;
      } else {
        console.error("Failed to set frequency and gain:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error setting frequency and gain:", error);
      return false;
    }
  }

  /**
   * @param {number} [newFreq]
   * @param {number} [newGain]
   */
  async function handleSetFreq(newFreq, newGain) {
    if (isChangingFreq) {
      console.log("Frequency change already in progress, skipping");
      return;
    }

    if (newFreq === prevFreq && retryCount === 0) {
      console.log("Frequency unchanged, skipping");
      return;
    }

    isChangingFreq = true;
    console.log(`handleSetFreq called, freq: ${newFreq}, retry: ${retryCount}`);

    const antSpace = newFreq >= 250 ? 0.25 : 0.45;
    let antennaSuccess = false;
    let frequencySuccess = false;

    try {
      // STEP 1: Always set antenna first
      console.log(
        `Setting antenna spacing to ${antSpace}m for frequency ${newFreq}MHz`
      );
      antennaSuccess = await handleSetAntenna(antSpace);

      if (!antennaSuccess) {
        console.log(
          "Antenna setting failed, but continuing with frequency setting"
        );
      }

      // STEP 2: Set frequency and gain
      frequencySuccess = await handleSetFreqAndGain(newFreq, newGain, antSpace);

      if (frequencySuccess) {
        prevFreq = newFreq;
        retryCount = 0;
        console.log(
          `All settings applied successfully - Antenna: ${antennaSuccess ? "OK" : "FAILED"}, Frequency: OK`
        );
      } else {
        throw new Error("Frequency setting failed");
      }
    } catch (error) {
      console.error("Error in frequency setting process:", error);

      // Retry logic - retry the entire process (antenna + frequency)
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(
          `Retrying entire process (attempt ${retryCount}/${MAX_RETRIES})`
        );

        setTimeout(
          () => {
            isChangingFreq = false;
            handleSetFreq(newFreq, newGain);
          },
          1000 + retryCount * 500
        );
        return;
      } else {
        console.error(`Failed after ${MAX_RETRIES} attempts`);
        retryCount = 0;
      }
    } finally {
      isChangingFreq = false;
      console.log("handleSetFreq finished");
    }
  }

  // UDP management
  $effect(() => {
    if (signalState.autoMode) {
      if (!udpState.isListening) {
        udpStore
          .startListening(49876)
          .then((result) => console.log("UDP started:", result))
          .catch((error) => console.log("UDP error:", error.message));
      }
    } else {
      if (udpState.isListening) {
        udpStore
          .stopListening()
          .then((result) => console.log("UDP stopped:", result))
          .catch((error) => console.log("UDP stop error:", error.message));
      }
    }
  });

  $effect(() => {
    if (!signalState.autoMode) {
      // Clear any pending debounced calls
      if (frequencyDebounceTimer) {
        clearTimeout(frequencyDebounceTimer);
        frequencyDebounceTimer = null;
      }
      return;
    }

    if (
      udpState.currentNumb < 24000000 ||
      udpState.currentNumb > 1000000000 ||
      !udpState.isListening
    ) {
      return;
    }

    const freqInMhz = Number((udpState.currentNumb / 1000000).toFixed(3));

    if (!Number.isFinite(freqInMhz) || Number.isNaN(freqInMhz)) {
      console.error(
        "Frequency conversion resulted in invalid number:",
        freqInMhz
      );
      return;
    }

    console.log(
      "Processing frequency:",
      freqInMhz,
      "prevFreq:",
      prevFreq,
      "difference:",
      Math.abs(freqInMhz - prevFreq)
    );

    const frequencyDifference = Math.abs(freqInMhz - prevFreq);
    if (frequencyDifference < MIN_FREQUENCY_CHANGE) {
      console.log("Frequency change too small, ignoring");
      return;
    }

    if (frequencyDebounceTimer) {
      clearTimeout(frequencyDebounceTimer);
    }

    frequencyDebounceTimer = setTimeout(() => {
      console.log("Debounced frequency change triggered:", freqInMhz);

      if (
        signalState.autoMode &&
        udpState.isListening &&
        !isChangingFreq &&
        Math.abs(freqInMhz - prevFreq) >= MIN_FREQUENCY_CHANGE
      ) {
        const currentGain = signalState.currentGain;
        console.log(
          "Calling handleSetFreq with:",
          freqInMhz,
          "gain:",
          currentGain
        );
        handleSetFreq(freqInMhz, currentGain);
      } else {
        console.log(
          "Conditions changed during debounce, skipping frequency update"
        );
      }

      frequencyDebounceTimer = null;
    }, FREQUENCY_DEBOUNCE_MS);

    return () => {
      if (frequencyDebounceTimer) {
        clearTimeout(frequencyDebounceTimer);
        frequencyDebounceTimer = null;
      }
    };
  });

  $effect(() => {
    console.log("DFPanel, appInitialized: ", appInitialized);

    if (appInitialized) {
      console.log("DFPanel already initialized, skipping");
      return () => {
        console.log("Skipped initialization cleanup - doing nothing");
      };
    }

    async function initialize() {
      appInitialized = true;

      //1. Load ConfigStore
      //2. Start DFStore
      if (!dfStore.isRunning) {
        console.log("Starting dfStore");
        dfStore.start();
        console.log("dfStore started");
      } else {
        console.log("dfStore already running");
      }

      //3. Start CompassStore
      //4 Load DF Setting
    }

    initialize();
    return async () => {
      //stop frequency debounce
      //stop dfStore
      dfStore.stop();

      //stop udp listening
    };
  });
</script>

<div class="container">
  <StatusDF />
  <DFPlot />
  <ControlPanel />
</div>

<style>
  .container {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 8px;
    top: 8px;
    right: 8px;
    width: 320px;
    background-color: transparent;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>

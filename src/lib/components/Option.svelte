<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { signalState } from "../stores/signalState.svelte.js";
  import { turnOffDf, restartDf, setStationId } from "../utils/api_handler";
  import { udpState, udpStore } from "../stores/udpStore.svelte.js";
  import { dfStore } from "../stores/dfStore.svelte.js";

  let message = $state("");
  let messageTimeout: ReturnType<typeof setTimeout> | null = null;
  let dfName = $state("");
  let isShuttingDown = $state(false);

  function showMessage(msg: string, duration: number = 1500) {
    message = msg;
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      message = "";
    }, duration);
  }

  async function closeApp() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log("Closing application...");

    try {
      if (udpState.isListening) {
        await udpStore.stopListening();
      }

      if (dfStore.isRunning) {
        dfStore.stop();
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }

    console.log("Waiting 2 seconds before closing...");
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error("Error closing window:", error);
    }
  }

  async function handleTurnOff() {
    if (isShuttingDown) return;

    console.log("Turning off DF...");
    turnOffDf().catch((error) => console.error("TurnOff DF error:", error));

    showMessage(
      "Unit DF akan mati dalam ±20 detik, jangan langsung matikan daya DF",
      2300
    );

    await closeApp();
  }

  async function handleRestart() {
    if (isShuttingDown) return;

    console.log("Restarting DF...");
    restartDf().catch((error) => console.error("Restart DF error:", error));

    showMessage(
      "Unit DF akan restart dalam ±60 detik, jangan langsung matikan daya DF",
      2300
    );
    await closeApp();
  }

  async function handleSetName() {
    if (!dfName) {
      showMessage("Error: Nama unit tidak boleh kosong");
      return;
    }

    try {
      const response = await setStationId(dfName);

      if (!response.success) {
        console.error("API call failed:", response.error);
        showMessage(`Error: Gagal mengatur nama unit - ${response.error}`);
        return;
      } else {
        console.log("Station name set successfully:", response.data);
        signalState.setStationName(dfName);
      }
    } catch (error) {
      console.error("error setStationName:", error);
      showMessage("Error: Gagal mengatur nama unit");
    }
  }

  $effect(() => {
    dfName = signalState.stationName;
  });
</script>

<div class="container">
  {#if message}
    <div>{message}</div>
  {:else}
    <div class="content">
      <label>
        <span>DF Unit Name :</span>
        <input type="text" bind:value={dfName} disabled={isShuttingDown} />
        <button disabled={isShuttingDown} onclick={handleSetName}>Set</button>
      </label>
      <div class="power-option">
        <div>Power Option :</div>
        <div class="option-btn">
          <button disabled={isShuttingDown} onclick={handleRestart}
            >Restart</button
          >
          <button disabled={isShuttingDown} onclick={handleTurnOff}
            >Power OFF</button
          >
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  button {
    padding: 4px 10px;
  }
  .content {
    display: flex;
    flex-direction: column;
    padding: 4px;
    color: white;
  }
  .content input {
    padding: 4px 8px;
    max-width: 120px;
  }
  .power-option {
    display: flex;
    margin-top: 10px;
    flex-direction: column;
    padding-right: 8px;
  }
  .option-btn {
    margin: 8px auto;
  }
</style>

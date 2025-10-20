<script>
  import { dfStore } from "../stores/dfStore.svelte";
  import ControlPanel from "./ControlPanel.svelte";
  import DFPlot from "./DFPlot.svelte";
  import StatusDF from "./StatusDF.svelte";

  let appInitialized = false;

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

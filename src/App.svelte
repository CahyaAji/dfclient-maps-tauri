<script>
  import DFPanel from "./lib/components/DFPanel.svelte";
  import MapsPanel from "./lib/components/MapsPanel.svelte";

  import { isTauriRuntime } from "./lib/utils/devhelper";

  isTauriRuntime().then(async (tauri) => {
    console.log("Running in:", tauri ? "Tauri" : "Browser");

    if (tauri) {
      const { fetch } = await import("@tauri-apps/plugin-http");
      console.log("Plugin fetch loaded:", typeof fetch);
    }
  });
</script>

<main>
  <MapsPanel />
  <DFPanel />
</main>

<style>
  main {
    position: relative;
    display: flex;
    height: 100vh;
    margin: 0;
  }
</style>

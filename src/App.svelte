<script>
  import DFPanel from "./lib/components/DFPanel.svelte";
  import Maps from "./lib/components/Maps.svelte";

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
  <Maps />
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

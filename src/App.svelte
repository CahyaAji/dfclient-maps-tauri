<script>
  import DFPanel from "./lib/components/DFPanel.svelte";
  import Maps from "./lib/components/Maps.svelte";
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

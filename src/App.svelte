<script>
  import DFPanel from "./lib/components/DFPanel.svelte";
  import Maps from "./lib/components/Maps.svelte";

  let lat, lon, acc, err;

  function getLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        acc = pos.coords.accuracy;
        err = null;
      },
      (e) => (err = e.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
    if (lat) {
      console.log(`gps data-> lat: ${lat}, lon: ${lon}, acc: ${acc}`);
    } else {
      console.log(`gps error: ${err}`);
    }
  }
</script>

<main>
  <Maps />
  <DFPanel />
  <button on:click={getLocation} class="bg-blue-600 text-white p-2 rounded">
    Get GPS Location
  </button>
</main>

<style>
  main {
    position: relative;
    display: flex;
    height: 100vh;
    margin: 0;
  }
</style>

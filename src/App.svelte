<script>
  import maplibregl, { AttributionControl } from "maplibre-gl";
  import DFPanel from "./lib/components/DFPanel.svelte";

  let mapDiv;

  $effect(() => {
    if (!mapDiv) return;

    const map = new maplibregl.Map({
      container: mapDiv,
      // style: "https://demotiles.maplibre.org/style.json",
      style:
        "https://api.maptiler.com/maps/openstreetmap/style.json?key=fB2eDjoDg2nlel5Kw6ym",
      center: [110.44058798765488, -7.77741598949885],
      zoom: 8,
      attributionControl: false,
    });
    map.addControl(
      new maplibregl.AttributionControl({ compact: false }),
      "bottom-left",
    );

    const navigationControl = new maplibregl.NavigationControl();
    map.addControl(navigationControl, "top-left");

    return () => map.remove();
  });
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://unpkg.com/maplibre-gl@5.3.0/dist/maplibre-gl.css"
  />
</svelte:head>

<main>
  <div bind:this={mapDiv} id="map"></div>
  <DFPanel />
</main>

<style>
  main {
    position: relative;
    display: flex;
    height: 100vh;
    margin: 0;
  }
  #map {
    display: flex;
    height: 100%;
    flex-grow: 1;
  }
</style>

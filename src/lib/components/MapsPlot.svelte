<script lang="ts">
  import "maplibre-gl/dist/maplibre-gl.css";
  import maplibregl from "maplibre-gl";
  import { onMount, onDestroy } from "svelte";
  import { locationStore } from "../stores/locationStore.svelte.js";

  type MapView = "normal" | "hybrid";
  let currentView: MapView = $state("normal");
  let mapDiv: HTMLDivElement;
  let map: maplibregl.Map | null = null;
  let lastlocUpdate = 0;
  let isMapLoaded = false;
  let lastUserLocation: { lat: number; lon: number } | null = null;

  const MAP_STYLES = {
    normal:
      "https://api.maptiler.com/maps/openstreetmap/style.json?key=fB2eDjoDg2nlel5Kw6ym",
    hybrid:
      "https://api.maptiler.com/maps/hybrid/style.json?key=aUOEn1bA48mz3xc3pL4N",
  };

  function initializeMapLayers() {
    if (!map) return;

    map.addSource("user-location", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [0, 0],
        },
      },
    });

    map.addLayer({
      id: "user-location-accuracy",
      type: "circle",
      source: "user-location",
      paint: {
        "circle-radius": 16,
        "circle-color": "#4A90E2",
        "circle-opacity": 0.2,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#4A90E2",
        "circle-stroke-opacity": 0.4,
      },
    });

    map.addLayer({
      id: "user-location-dot",
      type: "circle",
      source: "user-location",
      paint: {
        "circle-radius": 8,
        "circle-color": "#4A90E2",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
      },
    });

    console.log("✅ User location layer initialized");
  }

  function updateUserMarker(lat: number, lon: number) {
    if (!map || !isMapLoaded) {
      console.log("⚠️ updateMarkers aborted - map not ready");
      return;
    }

    const userLocSrc = map.getSource(
      "user-location"
    ) as maplibregl.GeoJSONSource;

    if (userLocSrc) {
      userLocSrc.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
      });
      console.log("✅ User marker updated", { lat, lon });
    }
  }

  $effect(() => {
    const userLoc = locationStore.data;

    if (!map || !isMapLoaded) {
      console.log("⚠️ Effect aborted - map not ready");
      return;
    }
    if (!userLoc || !userLoc.lat || !userLoc.lon) return;

    const now = Date.now();
    const elapsed = now - lastlocUpdate;
    if (elapsed < 500) {
      console.log("⏱️ Throttled - skipping update");
      return;
    }
    lastlocUpdate = now;
    lastUserLocation = { lat: userLoc.lat, lon: userLoc.lon };

    updateUserMarker(lastUserLocation.lat, lastUserLocation.lon);
  });

  onMount(() => {
    if (!mapDiv) return;

    map = new maplibregl.Map({
      container: mapDiv,
      style: MAP_STYLES.normal,
      center: [122, 0],
      zoom: 4,
      attributionControl: false,
    });

    map.on("load", () => {
      isMapLoaded = true;

      // Initialize user location layer BEFORE starting location updates
      initializeMapLayers();

      locationStore.start();

      map!.addControl(
        new maplibregl.AttributionControl({ compact: false }),
        "bottom-right"
      );

      const nav = new maplibregl.NavigationControl();
      map!.addControl(nav, "top-left");
    });
  });

  onDestroy(() => {
    locationStore.stop();
    if (map) {
      map.remove();
      map = null;
    }
    isMapLoaded = false;
  });
</script>

<div class="map-container">
  <div bind:this={mapDiv} id="map"></div>
</div>

<style>
  .map-container {
    position: relative;
    display: flex;
    flex-grow: 1;
    height: 100%;
  }

  #map {
    display: flex;
    flex-grow: 1;
    height: 100%;
  }
</style>

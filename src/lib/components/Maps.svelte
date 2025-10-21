<script lang="ts">
  import "maplibre-gl/dist/maplibre-gl.css";
  import maplibregl from "maplibre-gl";
  import { onMount, onDestroy } from "svelte";
  import { locationStore } from "../stores/locationStore.svelte.js";
  import { dfStore } from "../stores/dfStore.svelte";

  const EARTH_RADIUS = 6371000;
  const LINE_LENGTH = 3000;

  let mapDiv: HTMLDivElement;
  let map: maplibregl.Map | null = null;
  let lastlocUpdate = 0;

  function destinationPoint(
    lat1: number,
    lon1: number,
    bearingDeg: number,
    distance: number
  ) {
    const bearing = (bearingDeg * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lon1Rad = (lon1 * Math.PI) / 180;

    const lat2Rad = Math.asin(
      Math.sin(lat1Rad) * Math.cos(distance / EARTH_RADIUS) +
        Math.cos(lat1Rad) *
          Math.sin(distance / EARTH_RADIUS) *
          Math.cos(bearing)
    );

    const lon2Rad =
      lon1Rad +
      Math.atan2(
        Math.sin(bearing) *
          Math.sin(distance / EARTH_RADIUS) *
          Math.cos(lat1Rad),
        Math.cos(distance / EARTH_RADIUS) -
          Math.sin(lat1Rad) * Math.sin(lat2Rad)
      );

    const lat2 = (lat2Rad * 180) / Math.PI;
    const lon2 = (lon2Rad * 180) / Math.PI;

    return { lat: lat2, lon: lon2 };
  }

  // Initialize MapLibre
  onMount(() => {
    if (!mapDiv) return;

    map = new maplibregl.Map({
      container: mapDiv,
      style:
        "https://api.maptiler.com/maps/openstreetmap/style.json?key=fB2eDjoDg2nlel5Kw6ym",
      center: [110.4406, -7.7774],
      zoom: 21,
      attributionControl: false,
    });

    map.on("load", () => {
      map.addControl(
        new maplibregl.AttributionControl({ compact: false }),
        "bottom-left"
      );

      const nav = new maplibregl.NavigationControl();
      map.addControl(nav, "top-left");

      // 🛰️ Start GPS tracking
      locationStore.start();
      console.log("📡 Location tracking started");

      //user position marker
      map.addSource("user-location", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [110.4406, -7.7774],
          },
        },
      });

      map.addLayer({
        id: "user-location-layer",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 8,
          "circle-color": "#007cbf",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // add direction line
      map.addSource("bearing-line", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [110.4406, -7.7774],
              [110.9, -7.9],
            ],
          },
        },
      });

      map.addLayer({
        id: "bearing-line-layer",
        type: "line",
        source: "bearing-line",
        paint: {
          "line-color": "#ff0000",
          "line-width": 3,
        },
      });

      console.log("✅ Map loaded, ready for location updates");
    });

    onDestroy(() => {
      locationStore.stop();
      map?.remove();
      map = null;
    });
  });

  //update position
  $effect(() => {
    const user = locationStore.data;
    const angle = dfStore.data?.heading;

    if (!user || angle === null) return;

    const now = Date.now();
    const elapsed = now - lastlocUpdate;

    if (elapsed < 500) return;
    lastlocUpdate = now;

    const { lat, lon } = user;
    const startPoint = [lon, lat];

    const endPoint = destinationPoint(lat, lon, angle, LINE_LENGTH);
    const endLine = [endPoint.lon, endPoint.lat];

    //smooth draw
    requestAnimationFrame(() => {
      if (!map) return;

      const userSrc = map.getSource(
        "user-location"
      ) as maplibregl.GeoJSONSource;
      if (userSrc) {
        userSrc.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: startPoint,
          },
        });
      }

      const lineSrc = map.getSource("bearing-line") as maplibregl.GeoJSONSource;
      if (lineSrc) {
        lineSrc.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [startPoint, endLine],
          },
        });
      }
    });
  });

  //draw line
  $effect(() => {
    if (!map) return;

    const userLoc = locationStore.data;
    const angle = 45; // in degrees

    if (!userLoc || angle === null) return;

    const endPoint = destinationPoint(
      userLoc.lat,
      userLoc.lon,
      angle,
      LINE_LENGTH
    );

    const coords = [
      [userLoc.lon, userLoc.lat],
      [endPoint.lon, endPoint.lat],
    ];

    const src = map.getSource("bearing-line") as maplibregl.GeoJSONSource;
    if (src) {
      src.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      });
    }
  });
</script>

<div bind:this={mapDiv} id="map"></div>

<style>
  #map {
    display: flex;
    flex-grow: 1;
    height: 100%;
  }
</style>

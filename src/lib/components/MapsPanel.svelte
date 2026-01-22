<script lang="ts">
  import "maplibre-gl/dist/maplibre-gl.css";
  import maplibregl from "maplibre-gl";
  import { onMount, onDestroy } from "svelte";
  import { locationStore } from "../stores/locationStore.svelte.js";
  import { dfStore } from "../stores/dfStore.svelte";
  import { compassStore } from "../stores/compassStore.svelte.js";
  import { configStore } from "../stores/configStore.svelte.js";
  import MapViewControls from "./MapViewControls.svelte";
  import MarkerPanel from "./MarkerPanel.svelte";

  const EARTH_RADIUS = 6371000;
  const LINE_LENGTH = 10000;

  let compassOffset = $derived(configStore.compassOffset);

  // Map view types
  type MapView = "normal" | "hybrid";
  let currentView: MapView = $state("normal");

  // Custom marker type
  type CustomMarker = {
    id: string;
    title: string;
    lat: number;
    lon: number;
    angle: number;
    type: "direction" | "point"; // New: marker type
  };

  let mapDiv: HTMLDivElement;
  let map: maplibregl.Map | null = null;
  let lastlocUpdate = 0;
  let isMapLoaded = false;
  let lastUserLocation: { lat: number; lon: number } | null = null;
  let lastAngle: number | null = null;

  // Custom markers storage
  let customMarkers: CustomMarker[] = $state([]);

  // List panel state
  let showMarkerList = $state(false);

  // Inline editing state
  let editingMarkerId: string | null = $state(null);
  let isAddingNew = $state(false);
  let editForm = $state({
    title: "",
    lat: "",
    lon: "",
    angle: "",
    type: "point" as "direction" | "point", // Default to point marker
  });

  // Map picking state
  let isPickingFromMap = $state(false);
  let tempMarker: maplibregl.Marker | null = null;

  // Map style configurations
  const MAP_STYLES = {
    normal:
      "https://api.maptiler.com/maps/openstreetmap/style.json?key=fB2eDjoDg2nlel5Kw6ym",
    hybrid:
      "https://api.maptiler.com/maps/hybrid/style.json?key=aUOEn1bA48mz3xc3pL4N",
  };

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

  function initializeMapLayers() {
    if (!map) return;

    // User position marker - initialize with empty geometry
    if (!map.getSource("user-location")) {
      map.addSource("user-location", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [], // Empty coordinates - will be set when data arrives
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
    }

    // Direction line - initialize with empty geometry
    if (!map.getSource("bearing-line")) {
      map.addSource("bearing-line", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [], // Empty coordinates - will be set when data arrives
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
    }

    // Re-add all custom markers
    customMarkers.forEach((marker) => {
      addMarkerToMap(marker);
    });
  }

  function addMarkerToMap(marker: CustomMarker) {
    if (!map || !isMapLoaded) return;

    const sourceId = `marker-${marker.id}`;
    const layerId = `marker-layer-${marker.id}`;
    const lineSourceId = `marker-line-${marker.id}`;
    const lineLayerId = `marker-line-layer-${marker.id}`;

    // Choose color based on marker type
    const markerColor = marker.type === "point" ? "#4CAF50" : "#ff6b6b";

    // Add marker point
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: { title: marker.title },
          geometry: {
            type: "Point",
            coordinates: [marker.lon, marker.lat],
          },
        },
      });

      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": 10,
          "circle-color": markerColor,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Add label
      map.addLayer({
        id: `${layerId}-label`,
        type: "symbol",
        source: sourceId,
        layout: {
          "text-field": ["get", "title"],
          "text-offset": [0, 1.5],
          "text-anchor": "top",
          "text-size": 12,
        },
        paint: {
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });
    }

    // Only add direction line for "direction" type markers
    if (marker.type === "direction") {
      const endPoint = destinationPoint(
        marker.lat,
        marker.lon,
        marker.angle,
        LINE_LENGTH
      );

      if (!map.getSource(lineSourceId)) {
        map.addSource(lineSourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [marker.lon, marker.lat],
                [endPoint.lon, endPoint.lat],
              ],
            },
          },
        });

        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: lineSourceId,
          paint: {
            "line-color": markerColor,
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        });
      }
    }
  }

  function removeMarkerFromMap(markerId: string) {
    if (!map) return;

    const layerId = `marker-layer-${markerId}`;
    const labelLayerId = `${layerId}-label`;
    const lineLayerId = `marker-line-layer-${markerId}`;
    const sourceId = `marker-${markerId}`;
    const lineSourceId = `marker-line-${markerId}`;

    // Remove layers
    if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);

    // Remove sources
    if (map.getSource(sourceId)) map.removeSource(sourceId);
    if (map.getSource(lineSourceId)) map.removeSource(lineSourceId);
  }

  function switchMapView(view: MapView) {
    if (!map || currentView === view) return;

    console.log(
      "🔄 Switching to",
      view,
      "view. Current position:",
      lastUserLocation,
      "angle:",
      lastAngle
    );

    currentView = view;

    // Set flag to false during style change
    isMapLoaded = false;

    // Change map style
    map.setStyle(MAP_STYLES[view]);

    // Use 'data' event which fires when style data is loaded
    const onStyleData = () => {
      if (!map || !map.isStyleLoaded()) return;

      console.log("🎨 Style loaded, initializing layers...");

      // Remove the listener
      map.off("data", onStyleData);

      // Initialize layers
      isMapLoaded = true;
      initializeMapLayers();

      console.log("✅ Layers initialized");

      // Redraw user location and bearing line if we have data
      if (lastUserLocation && lastAngle !== null && !isNaN(lastAngle)) {
        console.log(
          "🎯 Redrawing markers at:",
          lastUserLocation,
          "angle:",
          lastAngle
        );
        updateMarkers(lastUserLocation.lat, lastUserLocation.lon, lastAngle);
      } else {
        console.log("⚠️ No position data to redraw");
      }
    };

    map.on("data", onStyleData);
  }

  // Initialize MapLibre
  onMount(() => {
    if (!mapDiv) return;

    map = new maplibregl.Map({
      container: mapDiv,
      style: MAP_STYLES.normal,
      center: [122, 0],
      zoom: 4,
      maxZoom: 17,
      attributionControl: false,
    });

    map.on("load", () => {
      // Start GPS tracking
      locationStore.start();
      console.log("📡 Location tracking started");

      isMapLoaded = true;

      map!.addControl(
        new maplibregl.AttributionControl({ compact: false }),
        "bottom-right"
      );

      const nav = new maplibregl.NavigationControl();
      map!.addControl(nav, "top-left");

      // Initialize map layers
      initializeMapLayers();

      console.log("✅ Map loaded, ready for location updates");
    });
  });

  onDestroy(() => {
    locationStore.stop();
    if (tempMarker) {
      tempMarker.remove();
      tempMarker = null;
    }
    map?.remove();
    map = null;
    isMapLoaded = false;
  });

  function updateMarkers(lat: number, lon: number, angle: number) {
    console.log(
      "📍 updateMarkers called - isMapLoaded:",
      isMapLoaded,
      "map exists:",
      !!map
    );

    if (!map || !isMapLoaded) {
      console.log("⚠️ updateMarkers aborted - map not ready");
      return;
    }

    const startPoint = [lon, lat];
    const endPoint = destinationPoint(lat, lon, angle, LINE_LENGTH);
    const endLine = [endPoint.lon, endPoint.lat];

    console.log("📍 Updating to startPoint:", startPoint, "endLine:", endLine);

    requestAnimationFrame(() => {
      if (!map || !isMapLoaded) {
        console.log("⚠️ RAF aborted - map not ready");
        return;
      }

      const userSrc = map.getSource(
        "user-location"
      ) as maplibregl.GeoJSONSource;
      console.log("🔍 User source exists:", !!userSrc);

      if (userSrc) {
        userSrc.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: startPoint,
          },
        });
        console.log("✅ User marker updated");
      }

      const lineSrc = map.getSource("bearing-line") as maplibregl.GeoJSONSource;
      console.log("🔍 Line source exists:", !!lineSrc);

      if (lineSrc) {
        lineSrc.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [startPoint, endLine],
          },
        });
        console.log("✅ Bearing line updated");
      }
    });
  }

  function zoomToUserLocation() {
    if (!map) {
      console.log("⚠️ Map not initialized");
      return;
    }

    const user = locationStore.data;

    if (!user || !user.lat || !user.lon) {
      console.log("⚠️ User location not available");
      return;
    }

    const { lat, lon } = user;

    // Zoom to user location
    map.flyTo({
      center: [lon, lat],
      zoom: 15,
      essential: true,
      duration: 1000,
    });

    console.log("📍 Zooming to user location:", { lat, lon });

    // Only draw the user marker (no angle/direction line)
    if (isMapLoaded) {
      console.log("✅ Drawing user marker only");
      const userSrc = map.getSource(
        "user-location"
      ) as maplibregl.GeoJSONSource;
      if (userSrc) {
        userSrc.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
        });
      }

      // Store location but don't update lastAngle
      lastUserLocation = { lat, lon };
    }
  }

  function toggleMarkerList() {
    showMarkerList = !showMarkerList;
    // Cancel any ongoing edits when closing the panel
    if (!showMarkerList) {
      cancelEdit();
    }
  }

  function startAddingMarker() {
    // Cancel any ongoing edit
    cancelEdit();

    isAddingNew = true;

    // Pre-fill with current location if available
    const user = locationStore.data;
    if (user) {
      editForm.lat = user.lat.toString();
      editForm.lon = user.lon.toString();
    } else {
      editForm.lat = "";
      editForm.lon = "";
    }
    editForm.title = "";
    editForm.angle = "";
    editForm.type = "point"; // Default to point marker
  }

  function startEditingMarker(marker: CustomMarker) {
    // Cancel adding new if in progress
    isAddingNew = false;

    editingMarkerId = marker.id;
    editForm = {
      title: marker.title,
      lat: marker.lat.toString(),
      lon: marker.lon.toString(),
      angle: marker.angle.toString(),
      type: marker.type,
    };
  }

  function cancelEdit() {
    editingMarkerId = null;
    isAddingNew = false;
    editForm = {
      title: "",
      lat: "",
      lon: "",
      angle: "",
      type: "point",
    };
    stopPickingFromMap();
  }

  function saveMarker() {
    const lat = parseFloat(editForm.lat);
    const lon = parseFloat(editForm.lon);
    const angle = parseFloat(editForm.angle);

    // Validate inputs
    if (!editForm.title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (isNaN(lat) || isNaN(lon)) {
      alert("Please enter valid numbers for latitude and longitude");
      return;
    }

    // Only validate angle for direction markers
    if (editForm.type === "direction" && isNaN(angle)) {
      alert("Please enter a valid angle for direction marker");
      return;
    }

    if (isAddingNew) {
      // Add new marker
      const newMarker: CustomMarker = {
        id: `marker-${Date.now()}`,
        title: editForm.title,
        lat,
        lon,
        angle: editForm.type === "direction" ? angle : 0,
        type: editForm.type,
      };

      customMarkers = [newMarker, ...customMarkers];
      addMarkerToMap(newMarker);

      console.log("✅ Marker added:", newMarker);
    } else if (editingMarkerId) {
      // Update existing marker
      const markerIndex = customMarkers.findIndex(
        (m) => m.id === editingMarkerId
      );
      if (markerIndex !== -1) {
        removeMarkerFromMap(editingMarkerId);

        customMarkers[markerIndex] = {
          ...customMarkers[markerIndex],
          title: editForm.title,
          lat,
          lon,
          angle: editForm.type === "direction" ? angle : 0,
          type: editForm.type,
        };

        addMarkerToMap(customMarkers[markerIndex]);

        console.log("✅ Marker updated:", customMarkers[markerIndex]);
      }
    }

    cancelEdit();
  }

  function removeMarker(markerId: string) {
    if (confirm("Are you sure you want to delete this marker?")) {
      removeMarkerFromMap(markerId);
      customMarkers = customMarkers.filter((m) => m.id !== markerId);
      console.log("🗑️ Marker removed:", markerId);
    }
  }

  function zoomToMarker(marker: CustomMarker) {
    if (!map) return;

    map.flyTo({
      center: [marker.lon, marker.lat],
      zoom: 15,
      essential: true,
      duration: 1000,
    });
  }

  // Map picking functions - NEW APPROACH WITH OVERLAY
  function startPickingFromMap() {
    if (!map) return;

    isPickingFromMap = true;

    // Disable map interactions
    map.dragPan.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();

    // Show temporary marker if coordinates exist
    const lat = parseFloat(editForm.lat);
    const lon = parseFloat(editForm.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      showTempMarker(lat, lon);
    }

    console.log("📍 Map picking mode enabled");
  }

  function stopPickingFromMap() {
    if (!map) return;

    isPickingFromMap = false;

    // Re-enable map interactions
    map.dragPan.enable();
    map.scrollZoom.enable();
    map.boxZoom.enable();
    map.doubleClickZoom.enable();
    map.touchZoomRotate.enable();

    // Remove temporary marker
    if (tempMarker) {
      tempMarker.remove();
      tempMarker = null;
    }

    console.log("📍 Map picking mode disabled");
  }

  function showTempMarker(lat: number, lon: number) {
    if (!map) return;

    // Remove existing temp marker
    if (tempMarker) {
      tempMarker.remove();
    }

    // Create new temp marker with custom color
    const el = document.createElement("div");
    el.style.width = "24px";
    el.style.height = "24px";
    el.style.borderRadius = "50% 50% 50% 0";
    el.style.backgroundColor = "#4CAF50";
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
    el.style.transform = "rotate(-45deg)";
    el.style.cursor = "pointer";

    tempMarker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([lon, lat])
      .addTo(map);
  }

  function handleOverlayClick(e: MouseEvent) {
    if (!map || !isPickingFromMap) return;

    // Get the map container's position
    const rect = mapDiv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel coordinates to geographic coordinates
    const point = map.unproject([x, y]);
    const lat = point.lat;
    const lng = point.lng;

    // Update form with clicked coordinates
    editForm.lat = lat.toFixed(6);
    editForm.lon = lng.toFixed(6);

    // Show temp marker at clicked location
    showTempMarker(lat, lng);

    console.log("📍 Picked coordinates:", { lat, lng });
  }

  // Update position (optimized with throttling) - FIXED VERSION
  $effect(() => {
    const user = locationStore.data;
    const angle =
      (360 + dfStore.data?.heading + compassStore.data + compassOffset) % 360;

    console.log(
      "🔄 Effect triggered - user:",
      user,
      "angle:",
      angle,
      "isMapLoaded:",
      isMapLoaded
    );

    if (!map || !isMapLoaded) {
      console.log("⚠️ Effect aborted - map not ready");
      return;
    }

    // If no user location at all, clear everything
    if (!user || !user.lat || !user.lon) {
      console.log("⚠️ No user location, clearing visualizations");
      lastUserLocation = null;
      lastAngle = null;

      const userSrc = map.getSource(
        "user-location"
      ) as maplibregl.GeoJSONSource;
      const lineSrc = map.getSource("bearing-line") as maplibregl.GeoJSONSource;

      if (userSrc) {
        userSrc.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [],
          },
        });
      }

      if (lineSrc) {
        lineSrc.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        });
      }
      return;
    }

    // We have user location - always show it
    const { lat, lon } = user;

    // Check if angle is valid
    const hasValidAngle =
      angle !== null && angle !== undefined && !isNaN(angle);

    // Throttle updates to 500ms
    const now = Date.now();
    const elapsed = now - lastlocUpdate;
    if (elapsed < 500) {
      console.log("⏱️ Throttled - skipping update");
      return;
    }
    lastlocUpdate = now;

    // Store last known position
    lastUserLocation = { lat, lon };

    if (hasValidAngle) {
      lastAngle = angle;
      console.log(
        "✅ Updating position with angle:",
        lastUserLocation,
        "angle:",
        lastAngle
      );
      updateMarkers(lat, lon, angle);
    } else {
      // Only update user marker, not the bearing line
      lastAngle = null;
      console.log("✅ Updating position without angle:", lastUserLocation);

      const userSrc = map.getSource(
        "user-location"
      ) as maplibregl.GeoJSONSource;
      const lineSrc = map.getSource("bearing-line") as maplibregl.GeoJSONSource;

      if (userSrc) {
        userSrc.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
        });
      }

      // Clear the bearing line when no valid angle
      if (lineSrc) {
        lineSrc.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        });
      }
    }
  });

  // Event handlers for child components
  function handleViewControls(event: CustomEvent) {
    const { type, detail } = event;
    switch (type) {
      case 'switchView':
        switchMapView(detail);
        break;
      case 'zoomToUser':
        zoomToUserLocation();
        break;
      case 'toggleMarkers':
        toggleMarkerList();
        break;
    }
  }

  function handleMarkerPanel(event: CustomEvent) {
    const { type, detail } = event;
    switch (type) {
      case 'startAddingMarker':
        startAddingMarker();
        break;
      case 'cancelEdit':
        cancelEdit();
        break;
      case 'saveMarker':
        saveMarker();
        break;
      case 'startEditingMarker':
        startEditingMarker(detail);
        break;
      case 'removeMarker':
        removeMarker(detail);
        break;
      case 'zoomToMarker':
        zoomToMarker(detail);
        break;
      case 'togglePicking':
        if (isPickingFromMap) {
          stopPickingFromMap();
        } else {
          startPickingFromMap();
        }
        break;
      case 'updateEditForm':
        editForm = { ...editForm, ...detail };
        break;
    }
  }
</script>

<div class="map-container">
  <div bind:this={mapDiv} id="map"></div>

  <!-- Transparent Overlay for Picking - NEW APPROACH -->
  {#if isPickingFromMap}
    <div
      class="pick-overlay"
      role="button"
      tabindex="0"
      onclick={handleOverlayClick}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // For keyboard, simulate a click at the center of the overlay
          if (map && mapDiv) {
            const rect = mapDiv.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const point = map.unproject([centerX, centerY]);
            editForm.lat = point.lat.toFixed(6);
            editForm.lon = point.lng.toFixed(6);
            showTempMarker(point.lat, point.lng);
            console.log("📍 Picked coordinates (keyboard):", { lat: point.lat, lng: point.lng });
          }
        }
      }}
      aria-label="Pick location from map"
    ></div>
  {/if}

  <!-- Picking Mode Message -->
  {#if isPickingFromMap}
    <div class="picking-message-container">
      <div class="picking-message">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>Click on the map to set location</span>
        <button class="btn-done-picking" onclick={stopPickingFromMap}
          >Done</button
        >
      </div>
    </div>
  {/if}

  <!-- View Controls -->
  <MapViewControls
    {currentView}
    {showMarkerList}
    on:switchView={handleViewControls}
    on:zoomToUser={handleViewControls}
    on:toggleMarkers={handleViewControls}
  />

  <!-- Marker Panel -->
  <MarkerPanel
    {customMarkers}
    {isPickingFromMap}
    {editingMarkerId}
    {isAddingNew}
    {showMarkerList}
    {editForm}
    on:startAddingMarker={handleMarkerPanel}
    on:cancelEdit={handleMarkerPanel}
    on:saveMarker={handleMarkerPanel}
    on:startEditingMarker={handleMarkerPanel}
    on:removeMarker={handleMarkerPanel}
    on:zoomToMarker={handleMarkerPanel}
    on:togglePicking={handleMarkerPanel}
    on:updateEditForm={handleMarkerPanel}
  />
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

  /* Transparent Overlay for Picking - NEW */
  .pick-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 6;
    cursor: crosshair;
    background: rgba(0, 0, 0, 0.05);
  }

  /* Picking Mode Message */
  .picking-message-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 7;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 80px;
  }

  .picking-message {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .btn-done-picking {
    background: #4caf50;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-done-picking:hover {
    background: #45a049;
  }
</style>

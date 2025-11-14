<script lang="ts">
    import "maplibre-gl/dist/maplibre-gl.css";
    import maplibregl from "maplibre-gl";
    import { onMount, onDestroy } from "svelte";
    import { locationStore } from "../stores/locationStore.svelte.js";
    import { dfStore } from "../stores/dfStore.svelte";

    const EARTH_RADIUS = 6371000;
    const LINE_LENGTH = 10000;

    // Map view types
    type MapView = "normal" | "hybrid";
    let currentView: MapView = $state("normal");

    let mapDiv: HTMLDivElement;
    let map: maplibregl.Map | null = null;
    let lastlocUpdate = 0;
    let isMapLoaded = false;
    let lastUserLocation: { lat: number; lon: number } | null = null;
    let lastAngle: number | null = null;

    // Map style configurations
    const MAP_STYLES = {
        normal: "https://api.maptiler.com/maps/openstreetmap/style.json?key=fB2eDjoDg2nlel5Kw6ym",
        hybrid: "https://api.maptiler.com/maps/hybrid/style.json?key=aUOEn1bA48mz3xc3pL4N",
    };

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
        
        // Smoothly fly to user location
        map.flyTo({
            center: [lon, lat],
            zoom: 15,
            essential: true,
            duration: 1000 // Animation duration in milliseconds
        });

        console.log("📍 Zooming to user location:", { lat, lon });
    }

    function destinationPoint(
        lat1: number,
        lon1: number,
        bearingDeg: number,
        distance: number,
    ) {
        const bearing = (bearingDeg * Math.PI) / 180;
        const lat1Rad = (lat1 * Math.PI) / 180;
        const lon1Rad = (lon1 * Math.PI) / 180;

        const lat2Rad = Math.asin(
            Math.sin(lat1Rad) * Math.cos(distance / EARTH_RADIUS) +
                Math.cos(lat1Rad) *
                    Math.sin(distance / EARTH_RADIUS) *
                    Math.cos(bearing),
        );

        const lon2Rad =
            lon1Rad +
            Math.atan2(
                Math.sin(bearing) *
                    Math.sin(distance / EARTH_RADIUS) *
                    Math.cos(lat1Rad),
                Math.cos(distance / EARTH_RADIUS) -
                    Math.sin(lat1Rad) * Math.sin(lat2Rad),
            );

        const lat2 = (lat2Rad * 180) / Math.PI;
        const lon2 = (lon2Rad * 180) / Math.PI;

        return { lat: lat2, lon: lon2 };
    }

    function initializeMapLayers() {
        if (!map) return;

        // User position marker
        if (!map.getSource("user-location")) {
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
        }

        // Direction line
        if (!map.getSource("bearing-line")) {
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
        }
    }

    function switchMapView(view: MapView) {
        if (!map || currentView === view) return;

        console.log(
            "🔄 Switching to",
            view,
            "view. Current position:",
            lastUserLocation,
            "angle:",
            lastAngle,
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
                    lastAngle,
                );
                updateMarkers(
                    lastUserLocation.lat,
                    lastUserLocation.lon,
                    lastAngle,
                );
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
            // center: [110.4406, -7.7774],
            // zoom: 13,
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
                "bottom-right",
            );

            const nav = new maplibregl.NavigationControl();
            map!.addControl(nav, "top-left");

            // Initialize map layers
            initializeMapLayers();

            // const { lat, lon } = locationStore.data;
            // console.log("latlon " + lat + " , " + lon);
            // map!.setCenter( [lon, lat]).setZoom(13);
            console.log("✅ Map loaded, ready for location updates");
        });
    });

    onDestroy(() => {
        locationStore.stop();
        map?.remove();
        map = null;
        isMapLoaded = false;
    });

    function updateMarkers(lat: number, lon: number, angle: number) {
        console.log(
            "📍 updateMarkers called - isMapLoaded:",
            isMapLoaded,
            "map exists:",
            !!map,
        );

        if (!map || !isMapLoaded) {
            console.log("⚠️ updateMarkers aborted - map not ready");
            return;
        }

        const startPoint = [lon, lat];
        const endPoint = destinationPoint(lat, lon, angle, LINE_LENGTH);
        const endLine = [endPoint.lon, endPoint.lat];

        console.log(
            "📍 Updating to startPoint:",
            startPoint,
            "endLine:",
            endLine,
        );

        requestAnimationFrame(() => {
            if (!map || !isMapLoaded) {
                console.log("⚠️ RAF aborted - map not ready");
                return;
            }

            const userSrc = map.getSource(
                "user-location",
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

            const lineSrc = map.getSource(
                "bearing-line",
            ) as maplibregl.GeoJSONSource;
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

    // Update position (optimized with throttling)
    $effect(() => {
        const user = locationStore.data;
        const angle = dfStore.data?.heading;

        if (!map || !isMapLoaded) return;

        // Clear line if no valid data
        if (!user || angle === null || angle === undefined || isNaN(angle)) {
            lastUserLocation = null;
            lastAngle = null;

            const lineSrc = map.getSource(
                "bearing-line",
            ) as maplibregl.GeoJSONSource;
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

        // Throttle updates to 500ms
        const now = Date.now();
        const elapsed = now - lastlocUpdate;
        if (elapsed < 500) return;
        lastlocUpdate = now;

        const { lat, lon } = user;

        // Store last known position and angle
        lastUserLocation = { lat, lon };
        lastAngle = angle;
        console.log("Storing position:", lastUserLocation, "angle:", lastAngle);

        updateMarkers(lat, lon, angle);
    });
</script>

<div class="map-container">
    <div bind:this={mapDiv} id="map"></div>

    <!-- View Toggle Buttons -->
    <div class="view-controls">
        <button class="loc-button" onclick={zoomToUserLocation}>
            <img src="/src/assets/icons8-my-location-32.png" alt="user location">
        </button>
        <button
            class="view-button"
            class:active={currentView === "normal"}
            onclick={() => switchMapView("normal")}
            title="Normal Map View"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18M9 3v18" />
            </svg>
            <span>Normal</span>
        </button>

        <button
            class="view-button"
            class:active={currentView === "hybrid"}
            onclick={() => switchMapView("hybrid")}
            title="Hybrid Map View"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 12h18M12 3v18" />
                <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Satellite</span>
        </button>
    </div>
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

    .view-controls {
        position: absolute;
        bottom: 20px;
        left: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1;
    }

    .loc-button {
        display: flex;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        align-items: center;
        justify-content: center;
        background: white;
        border: 0;
    }

    .loc-button:hover {
        background: #f5f5f5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .loc-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .view-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: #333;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        min-width: 120px;
    }

    .view-button:hover {
        background: #f5f5f5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .view-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .view-button.active {
        background: #007cbf;
        color: white;
    }

    .view-button.active:hover {
        background: #006aa8;
    }

    .view-button svg {
        flex-shrink: 0;
    }

    .view-button span {
        flex-grow: 1;
        text-align: left;
    }
</style>

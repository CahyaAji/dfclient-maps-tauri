<script>
    import "maplibre-gl/dist/maplibre-gl.css";
    import maplibregl, { AttributionControl } from "maplibre-gl";

    let mapDiv;

    $effect(() => {
        if (!mapDiv) return;

        const map = new maplibregl.Map({
            container: mapDiv,
            style: "https://api.maptiler.com/maps/openstreetmap/style.json?key=fB2eDjoDg2nlel5Kw6ym",
            center: [110.44058798765488, -7.77741598949885],
            zoom: 8,
            attributionControl: false,
        });

        map.on("load", () => {
            map.addControl(
                new maplibregl.AttributionControl({ compact: false }),
                "bottom-left",
            );

            const navigationControl = new maplibregl.NavigationControl();
            map.addControl(navigationControl, "top-left");
        });

        return () => map.remove();
    });
</script>

<div bind:this={mapDiv} id="map"></div>

<style>
    #map {
        display: flex;
        height: 100%;
        flex-grow: 1;
    }
</style>

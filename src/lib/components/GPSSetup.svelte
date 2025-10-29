<script>
    import { locationStore } from "../stores/locationStore.svelte.js";

    let lat = $state(0);
    let lng = $state(0);

    $effect(() => {
        lat = locationStore.data.lat;
        lng = locationStore.data.lon;
    });
</script>

<div class="container">
    <div class="input-panel">
        <div class="latlng-content">
            <div>
                <div>Latitude</div>
                <input type="number" bind:value={lat} readonly />
            </div>
            <div>
                <div>Longitude</div>
                <input type="number" bind:value={lng} readonly />
            </div>
        </div>
        <div class="utm-content">
            <div class="utm-field">
                <div>Zone :</div>
                <input type="text" />
            </div>
            <div class="utm-field">
                <div>Northing :</div>
                <input type="text" />
            </div>
            <div class="utm-field">
                <div>Easting :</div>
                <input type="text" />
            </div>
            <div class="utm-field">
                <div>CO :</div>
                <input type="text" />
            </div>
        </div>
    </div>
    <div class="button-panel"></div>
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        color: white;
    }
    .input-panel {
        flex: 1;
        display: grid;
        grid-template-columns: 2fr 3fr;
    }
    .latlng-content {
        padding: 4px 8px;
    }
    .latlng-content input {
        max-width: 110px;
    }
    .utm-content {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .utm-field {
        display: flex;
        align-items: center;
        padding: 2px 4px;
    }
    .utm-field > div {
        align-self: flex-end;
        min-width: 65px;
    }
    .utm-field > input {
        max-width: 100px;
    }
</style>

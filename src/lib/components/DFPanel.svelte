<script>
    import ControlPanel from "./ControlPanel.svelte";
    import DFPlot from "./DFPlot.svelte";
    import StatusDF from "./StatusDF.svelte";

    let appInitialized = false;

    $effect(() => {
        console.log("DFPanel, appInitialized: ", appInitialized);

        if (appInitialized) {
            console.log("DFPanel already initialized, skipping");
            return () => {
                console.log("Skipped initialization cleanup - doing nothing");
            };
        }

        async function initialize() {
            appInitialized = true;

            //1. Load ConfigStore

            //2. Start DFStore
            //3. Start CompassStore
            //4 Load DF Setting
        }
    });
</script>

<div class="container">
    <StatusDF />
    <DFPlot />
    <ControlPanel />
</div>

<style>
    .container {
        position: absolute;
        display: flex;
        flex-direction: column;
        gap: 8px;
        top: 8px;
        right: 8px;
        width: 360px;
        background-color: transparent;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
</style>

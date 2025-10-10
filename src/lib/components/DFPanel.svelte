<script>
    import ControlPanel from "./ControlPanel.svelte";
    import DFPlot from "./DFPlot.svelte";
    import StatusDF from "./StatusDF.svelte";
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
        width: 400px;
        background-color: transparent;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
</style>

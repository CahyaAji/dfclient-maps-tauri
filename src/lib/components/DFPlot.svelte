<script>
    import RelativePlot from "./RelativePlot.svelte";
</script>

<div class="container">
    <div class="content">
        <RelativePlot />
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: rgba(75, 83, 32, 0.6);
        border-radius: 10px;
    }
    .title {
        width: 100%;
        padding: 4px;
        color: white;
        font-size: 13pt;
        background-color: rgba(4, 61, 15, 0.5);
        border-radius: 10px 10px 0 0;
    }
    .content {
        padding: 8px 0;
    }
</style>

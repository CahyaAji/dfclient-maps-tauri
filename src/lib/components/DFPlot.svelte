<script>
    import RelativePlot from "./RelativePlot.svelte";
</script>

<div class="container">
    <div class="title">
        <div>DF Plot</div>
    </div>
    <div class="content">
        <RelativePlot />
    </div>
</div>

<style>
    .container {
        width: 400px;
        padding: 2px 8px 16px 8px;
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
    }
</style>

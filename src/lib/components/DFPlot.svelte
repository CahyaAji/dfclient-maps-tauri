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
    .content {
        padding: 8px 0;
    }
</style>

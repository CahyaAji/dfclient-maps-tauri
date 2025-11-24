<script>
    import { API_URL } from "../utils/api_handler.js";
</script>

<div class="container">
    <div class="title">Status</div>
    <iframe
        class="webview"
        src={`${API_URL}/config`}
        title="Example website"
        style="width: 100%; height: 100%; border: none; overflow-x: hidden;"
    ></iframe>
</div>

<style>
    .container {
        color: white;
        display: flex;
        flex-direction: column;
        height: 250px;
        background-color: rgba(75, 83, 32, 0.6);
        padding-bottom: 10px;
        border-radius: 10px;
        padding-left: 2px;
        padding-right: 2px;
    }
    .title {
        background-color: rgba(4, 61, 15, 0.5);
        font-size: 13pt;
        padding: 4px 0 2px 10px;
        border-radius: 10px 10px 0 0;
    }
    .webview {
        opacity: 1;
    }
</style>

<div class="container">
    <div class="compass-display">
        <div class="circle"></div>
    </div>
    <div class="compass-value">
        <div class="cmps-value">--</div>
        <button>Calibrate</button>
        <button disabled>Set</button>
    </div>
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: 2fr 3fr;
    }
    .compass-display {
        display: flex;
        flex-direction: column;
    }
    .circle {
        height: 100px;
        width: 100px;
        background-color: rgba(4, 61, 15, 0.5);
        justify-content: center;
        align-items: center;
        display: flex;
        margin: 8px auto;
        border-radius: 50%;
        border: 2px solid white;
    }
    .compass-value {
        margin: auto;
        display: flex;
        flex-direction: column;
    }
    .cmps-value {
        width: 80px;
        background-color: rgba(4, 61, 15, 0.5);
        border: 2px solid white;
        border-radius: 10px;
        margin: 4px auto 8px;
        text-align: center;
        padding: 4px 8px;
        color: white;
    }
    .compass-value > button {
        margin: 2px auto;
        padding: 4px 8px;
    }
</style>

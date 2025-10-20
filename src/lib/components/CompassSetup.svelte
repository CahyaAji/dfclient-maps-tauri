<div class="container">
    <div class="compass-display">
        <div class="circle"></div>
        <div class="cmps-value">--</div>
    </div>
    <div class="compass-correction">ini correction</div>
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
        margin: 4px auto 0;
        border-radius: 50%;
        border: 2px solid white;
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
    .compass-correction {
        background-color: pink;
    }
</style>

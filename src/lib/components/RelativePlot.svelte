<div class="container">
    <div class="rotating-circle" style="transform: rotate(45deg);">
        <div class="arrow"></div>
    </div>
    <div class="angle-text"><div>- - -</div></div>
</div>

<style>
    .container {
        display: flex;
        width: 250px;
        height: 250px;
        background-image: url("/src/assets/relative_circle.png");
        background-repeat: no-repeat;
        background-size: cover;
        background-color: rgba(4, 61, 15, 0.5);
        border-radius: 50%;
        position: relative;
        align-items: center;
        justify-content: center;
    }
    .rotating-circle {
        background-color: transparent;
        width: 190px;
        height: 190px;
        border-radius: 50%;
    }
    .arrow {
        width: 8px;
        height: 63px;
        background-color: yellow;
        margin: auto;
        border-radius: 4px;
    }
    .angle-text {
        width: 70px;
        height: 70px;
        display: flex;
        position: absolute;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 2px solid white;
        color: white;
        background-color: rgba(4, 61, 15, 0.5);
        color: yellow;
    }
</style>

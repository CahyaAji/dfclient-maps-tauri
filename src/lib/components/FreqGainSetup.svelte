<div class="container">
    <div class="content">
        <div class="input-field">
            <div class="label">Frequency</div>
            <input type="text" />
            <button>Set</button>
        </div>
        <div class="input-field">
            <div class="label">Gain</div>
            <select>
                <option value={0}>0.0</option>
                <option value={0.9}>0.9</option>
                <option value={1.4}>1.4</option>
                <option value={2.7}>2.7</option>
                <option value={3.7}>3.7</option>
                <option value={7.7}>7.7</option>
                <option value={8.7}>8.7</option>
                <option value={12.5}>12.5</option>
                <option value={14.4}>14.4</option>
                <option value={15.7}>15.7</option>
                <option value={16.6}>16.6</option>
                <option value={19.7}>19.7</option>
                <option value={20.7}>20.7</option>
                <option value={22.9}>22.9</option>
                <option value={25.4}>25.4</option>
                <option value={28.0}>28.0</option>
                <option value={29.7}>29.7</option>
                <option value={33.8}>33.8</option>
                <option value={36.4}>36.4</option>
                <option value={37.2}>37.2</option>
                <option value={38.6}>38.6</option>
                <option value={40.2}>40.2</option>
                <option value={42.1}>42.1</option>
                <option value={43.4}>43.4</option>
                <option value={44.5}>44.5</option>
                <option value={48.0}>48.0</option>
                <option value={49.6}>49.6</option>
            </select>
            <button>Set</button>
        </div>
    </div>
</div>

<style>
    .container {
        color: white;
        display: flex;
        flex-direction: column;
    }
    .content {
        margin-top: 2px;
        margin-left: 8px;
        margin-right: 8px;
    }
    .input-field {
        display: flex;
        padding: 4px 0 8px 0;
    }
    .input-field > button {
        padding: 4px 16px;
    }
    .input-field > input {
        padding: 4px 8px;
        width: 120px;
    }
    .label {
        min-width: 80px;
        align-self: center;
        padding: 4px 0;
    }
</style>

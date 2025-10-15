import { readDF } from "../utils/api_handler.js";

class DFStore {
    data = $state(null);
    error = $state(null);
    isLoading = $state(false);
    lastTimestamp = $state(null);

    #interval = null;

    get isRunning() {
        return this.#interval !== null;
    }

    async fetch() {
        this.isLoading = true;
        this.error = null;

        try {
            const result = await readDF();

            if (result.success) {
                const newTimestamp = result.data.time;

                if (
                    this.lastTimestamp === null ||
                    newTimestamp !== this.lastTimestamp
                ) {
                    this.data = result.data;
                    this.lastTimestamp = newTimestamp;
                    console.log("New DF data received, timestamp:", newTimestamp);
                } else {
                    console.log("Stale DF data detected, same timestamp:", newTimestamp);

                    this.data = null;
                    this.error = "No new data available";
                }
            } else {
                this.data = null;
                this.error = result.error;
                // Don't clear lastTimestamp on API errors - might be temporary network issue
            }

            this.isLoading = false;
            return result;
        } catch (error) {
            this.data = null;
            this.error = error.message;
            this.isLoading = false;
            // Don't clear lastTimestamp on network errors
            return { success: false, error: error.message };
        }
    }

    start() {
        if (this.#interval) {
            return;
        }

        this.fetch();
        this.#interval = setInterval(() => {
            this.fetch();
        }, 1000);

        console.log("DF Store started");
    }

    stop() {
        if (this.#interval) {
            clearInterval(this.#interval);
            this.#interval = null;
            console.log("DF monitoring stopped");
        }
    }

    clear() {
        this.data = null;
        this.error = null;
        this.isLoading = false;
        this.lastTimestamp = null; // Reset timestamp tracking
    }
}

export const dfStore = new DFStore();

import { readCompass } from "../utils/api_handler";

class CompassStore {
  data = $state(null);
  error = $state(null);
  isLoading = $state(false);

  #interval = null;

  get isRunning() {
    return this.#interval !== null;
  }

  async fetch() {
    this.isLoading = true;
    this.error = null;

    try {
      const result = await readCompass();

      if (result.success) {
        this.data = result.data;
        this.isLoading = false;
      } else {
        this.data = null;
        this.error = result.error;
        this.isLoading = false;
      }
    } catch (error) {
      this.data = null;
      this.error = error.message;
      this.isLoading = false;
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

    console.log("Compass store started");
  }

  stop() {
    if (this.#interval) {
      clearInterval(this.#interval);
      this.#interval = null;
      console.log("Compass store stopped");
    }
  }
  clear() {
    this.data = null;
    this.error = null;
    this.isLoading = false;
  }
}

export const compassStore = new CompassStore();

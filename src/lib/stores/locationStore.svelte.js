import { fetch } from "@tauri-apps/plugin-http";

class LocationStore {
  data = $state(null);
  error = $state(null);
  isLoading = $state(false);
  hasHardware = $state(true);
  #watchId = null;

  get isRunning() {
    return this.#watchId !== null;
  }

  start() {
    if (!("geolocation" in navigator)) {
      this.error = "Geolocation API not supported";
      this.hasHardware = false;
      return;
    }

    if (this.#watchId !== null) {
      //already running
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.hasHardware = true;

    this.#watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;

        this.data = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          acc,
          heading: pos.coords.heading ?? 0,
          timestamp: pos.timestamp,
        };

        this.isLoading = false;

        if (acc > 100) this.hasHardware = false;
      },
      (err) => {
        this.error = err.message;
        this.isLoading = false;
        this.hasHardware = false;

        // optional: fallback to IP-based lookup if location fails
        if (err.code === err.POSITION_UNAVAILABLE) {
          this.fallbackIP();
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
    console.log("📡 Location store started");
  }

  stop() {
    if (this.#watchId !== null) {
      navigator.geolocation.clearWatch(this.#watchId);
      this.#watchId = null;
      console.log("📡 Location store stopped");
    }
  }

  clear() {
    this.data = null;
    this.error = null;
    this.isLoading = false;
    this.hasHardware = true;
  }

  async fallbackIP() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const j = await res.json();

      this.data = {
        lat: j.latitude,
        lon: j.longitude,
        acc: 1000,
        speed: 0,
        heading: 0,
        timestamp: Date.now(),
      };

      this.error = null;
      this.isLoading = false;
      this.hasHardware = false;
      console.log("🌐 Using IP fallback location");
    } catch (e) {
      this.error = "Failed to get IP location: " + e.message;
    }
  }
}

export const locationStore = new LocationStore();

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

class UdpState {
    currentNumb = $state(0);
    currentMsg = $state(null);
    isListening = $state(false);
}

export const udpState = new UdpState();

let unlisten = null;
let listening = false; // internal guard

export const udpStore = {
    startListening: async (port = 8080) => {
        if (listening || udpState.isListening) {
            return `Already listening on port ${port}`;
        }

        try {
            const result = await invoke("start_udp_listener", { port });

            if (typeof result === "string" && result.includes("Already listening")) {
                listening = true;
                udpState.isListening = true;
                return result;
            }

            unlisten = await listen("udp-message", (event) => {
                const message = event.payload;
                udpState.currentMsg = message;
                if (message.type === "number") {
                    udpState.currentNumb = message.data.value;
                }
            });

            listening = true;
            udpState.isListening = true;
            return `Listening on port ${port}`;
        } catch (error) {
            if (String(error).includes("Already listening")) {
                listening = true;
                udpState.isListening = true;
                return `Already listening on port ${port}`;
            }

            listening = false;
            udpState.isListening = false;
            throw new Error(`Failed to start: ${error}`);
        }
    },

    stopListening: async () => {
        if (!listening && !udpState.isListening) {
            return "Not listening";
        }

        try {
            if (unlisten) {
                unlisten();
                unlisten = null;
            }
            await invoke("stop_udp_listener");
            listening = false;
            udpState.isListening = false;

            udpState.currentNumb = null;
            udpState.currentMsg = null;

            return "Stopped listening";
        } catch (error) {
            throw new Error(`Failed to stop: ${error}`);
        }
    },

    sendNumber: async (/** @type {number} */ number, port = 8080) => {
        if (number < 0 || number > 1000000) {
            throw new Error("Number must be between 0-1000000");
        }

        try {
            await invoke("send_udp_number", { number, port });
            return `Sent ${number}`;
        } catch (error) {
            throw new Error(`Failed to send: ${error}`);
        }
    },
};

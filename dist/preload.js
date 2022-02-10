"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld("api", {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = [
            "load-csv",
            "import-to-segment",
            "update-event-preview",
            "load-history"
        ];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
    on: (channel, func) => {
        let validChannels = [
            "csv-loaded",
            "event-preview-updated",
            "import-complete",
            "import-error",
            "history-loaded"
        ];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender`
            electron_1.ipcRenderer.on(channel, (_, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel, _) => {
        let validChannels = ["csv-loaded", "event-preview-updated", "import-complete", "import-error", "history-loaded"];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.removeAllListeners(channel);
        }
    }
});

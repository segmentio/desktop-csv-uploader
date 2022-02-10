import {contextBridge, ipcRenderer} from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel:string, data:object) => {
            // whitelist channels
            let validChannels = [
              "load-csv",
              "import-to-segment",
              "update-event-preview",
              "load-history"
            ];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        on: (channel:string, func:Function) => {
            let validChannels = [
              "csv-loaded",
              "event-preview-updated",
              "import-complete",
              "import-error",
              "history-loaded"
            ];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender`
                ipcRenderer.on(channel, (_, ...args) => func(...args));
            }
        },
        removeAllListeners: (channel:string, _:Function) => {
          let validChannels = ["csv-loaded", "event-preview-updated", "import-complete", "import-error", "history-loaded"];
          if (validChannels.includes(channel)) {
            ipcRenderer.removeAllListeners(channel)
          }
        }
    }
);

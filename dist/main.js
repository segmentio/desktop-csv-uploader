"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
console.log(__dirname);
let uiWindow;
let importerWindow;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.whenReady()
    .then(() => windowFactory())
    .then(() => registerIPC());
function windowFactory() {
    // uiWindow contains the react app
    uiWindow = createUIWindow();
    uiWindow.loadURL('http://localhost:8080');
    uiWindow.webContents.openDevTools();
    // Hidden Render Process that handles the data intensive importing tasks
    importerWindow = createImporterWindow();
    importerWindow.loadFile('templates/importerWindow.html');
    importerWindow.webContents.openDevTools();
}
function createUIWindow() {
    return (new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // preload script to expose ipcRenderer in Browser window, necessary since nodeintegration == false
        }
    }));
}
function createImporterWindow() {
    return (new electron_1.BrowserWindow({
        // show:false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    }));
}
function registerIPC() {
    // uiWindow --> main process --> importerWindow
    // A filepath is passed to the importer window which parses and loads the
    // the csv file into memory
    electron_1.ipcMain.on('load-csv', (_, filePath) => {
        importerWindow.webContents.send('load-csv', filePath);
        console.log('main-load-csv');
    });
    // importerWindow --> main process --> uiWindow
    // The head of the csv file is passed to the UI
    electron_1.ipcMain.on('csv-loaded', (_, data) => {
        uiWindow.webContents.send('csv-loaded', data);
        console.log('main-csv-loaded');
    });
    // uiwindow --> main process --> importerWindow
    // settings and csv data are passed to the importer
    electron_1.ipcMain.on('import-to-segment', (_, data) => {
        importerWindow.webContents.send('import-to-segment', data);
        console.log('main-import-to-segment');
    });
    electron_1.ipcMain.on('update-event-preview', (_, data) => {
        importerWindow.webContents.send('update-event-preview', data);
        console.log('main-update-event-preview');
    });
    electron_1.ipcMain.on('event-preview-updated', (_, previewEvents) => {
        uiWindow.webContents.send('event-preview-updated', previewEvents);
        console.log('main-event-preview-updated');
    });
    electron_1.ipcMain.on('import-complete', (_, count) => {
        uiWindow.webContents.send('import-complete', count);
        console.log('main-import-complete');
    });
    electron_1.ipcMain.on('import-error', (_, error) => {
        uiWindow.webContents.send('import-error', error);
        console.log('main-import-error');
    });
    electron_1.ipcMain.on('load-history', (_, data) => {
        importerWindow.webContents.send('load-history', data);
        console.log('main-load-history');
    });
    electron_1.ipcMain.on('history-loaded', (_, data) => {
        uiWindow.webContents.send('history-loaded', data);
        console.log('main-history-loaded');
    });
}
//OS SPECIFIC METHODS
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        windowFactory();
    }
});
module.exports = createImporterWindow;

"use strict";
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
// try {
// 	require('electron-reloader')(module);
// } catch {}
const path = require('path');
let uiWindow, importerWindow;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady()
    .then(() => windowFactory())
    .then(() => registerIPC());
function windowFactory() {
    // uiWindow contains the react app
    uiWindow = createUIWindow();
    uiWindow.loadURL('http://localhost:3000');
    uiWindow.webContents.openDevTools();
    // Hidden Render Process that handles the data intensive importing tasks
    importerWindow = createImporterWindow();
    importerWindow.loadFile('public/importer_window.html');
    importerWindow.webContents.openDevTools();
}
function createUIWindow() {
    return (new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js') // preload script to expose ipcRenderer in Browser window, necessary since nodeintegration == false
        }
    }));
}
function createImporterWindow() {
    return (new BrowserWindow({
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
    ipcMain.on('load-csv', (event, filePath) => {
        importerWindow.webContents.send('load-csv', filePath);
        console.log('main-load-csv');
    });
    // importerWindow --> main process --> uiWindow
    // The head of the csv file is passed to the UI
    ipcMain.on('csv-loaded', (event, data) => {
        uiWindow.webContents.send('csv-loaded', data);
        console.log('main-csv-loaded');
    });
    // uiwindow --> main process --> importerWindow
    // settings and csv data are passed to the importer
    ipcMain.on('import-to-segment', (event, data) => {
        importerWindow.webContents.send('import-to-segment', data);
        console.log('main-import-to-segment');
    });
    ipcMain.on('update-event-preview', (event, data) => {
        importerWindow.webContents.send('update-event-preview', data);
        console.log('main-update-event-preview');
    });
    ipcMain.on('event-preview-updated', (event, previewEvents) => {
        uiWindow.webContents.send('event-preview-updated', previewEvents);
        console.log('main-event-preview-updated');
    });
    ipcMain.on('import-complete', (event, count) => {
        uiWindow.webContents.send('import-complete', count);
        console.log('main-import-complete');
    });
    ipcMain.on('import-error', (event, error) => {
        uiWindow.webContents.send('import-error', error);
        console.log('main-import-error');
    });
    ipcMain.on('load-history', (event, data) => {
        importerWindow.webContents.send('load-history', data);
        console.log('main-load-history');
    });
    ipcMain.on('history-loaded', (event, data) => {
        uiWindow.webContents.send('history-loaded', data);
        console.log('main-history-loaded');
    });
}
//OS SPECIFIC METHODS
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        windowFactory();
    }
});
module.exports = createImporterWindow;
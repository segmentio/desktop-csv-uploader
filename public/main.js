const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser')

let uiWindow, importerWindow

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady()
.then(()=>windowFactory())
.then(()=>registerIPC())

function windowFactory() {
  // uiWindow contains the react app
  uiWindow = createUIWindow()
  uiWindow.loadURL('http://localhost:3000');
  uiWindow.webContents.openDevTools()

  // Hidden Render Process that handles the data intensive importing tasks
  importerWindow = createImporterWindow()
  importerWindow.loadFile('public/importer_window.html')
  importerWindow.webContents.openDevTools()
}

function createUIWindow() {
  return(
    new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false, // default, but explicit for securty
        contextIsolation: true, // protect against prototype pollution
        enableRemoteModule: false, // turn off remote, for security
        preload: path.join(__dirname, 'preload.js') // preload script to expose ipcRenderer in Browser window, necessary since nodeintegration == false
      }
    })
  )
}
function createImporterWindow() {
  return(
    new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    })
  )
}

function registerIPC() {
  // IPC Main event APIs

  // load-csv receives from uiWindow, opens the file via electron's builtins, parses
  // and returns the csv data to uiwindow in json format.
  ipcMain.on('load-csv', (event, args) => {
    dialog.showOpenDialog({
      properties: ['openFile']
    }).then((selection) => {
      if (!selection.canceled) {
        var csvResults = []
        fs.createReadStream(selection.filePaths[0])
          .pipe(csv({separator:'|'}))
          .on('data', (data) => csvResults.push(data))
          .on('end', () => {
            event.sender.send('csv-data-imported', csvResults)
          })
          .on('error', (err) => console.log(err))
      } else { console.log('no file selected')}
    })
    .catch(error => console.log(error))
  })


  // uiwindow --> main process --> importerWindow
  ipcMain.on('import-to-segment', (event, data) => {
    importerWindow.webContents.send('import-to-segment', data);
    console.log('main-import-to-segment')
  })

}





//OS SPECIFIC METHODS

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    windowFactory()
  }
})


module.exports = createImporterWindow

const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser')

function createUIWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // default, but explicit for securty
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote, for security
      preload: path.join(__dirname, 'preload.js') // preload script to expose ipcRenderer in Browser window
    }
  })

  //DEV load the index.html from a url
  win.loadURL('http://localhost:3000');

  // Open the DevTools.
  win.webContents.openDevTools()
}

// Hidden-window Render Process that handles supplying data to the UI process,
// and importing to the Segment workspace
function createImporterWindow(){
  const win = new BrowserWindow({
    show:false,
    nodeIntegration: true
  })

  win.loadFile('public/importer_window.html')
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady()
.then(createUIWindow)
.then(createImporterWindow)

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
    createUIWindow()
    createImporterWindow()
  }
})

// IPC API
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


ipcMain.on('import-to-segment', () => {
  console.log('test')
})

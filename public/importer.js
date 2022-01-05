const electron = require('electron');
const Analytics = require('analytics-node')
const ipcRenderer = electron.ipcRenderer;


// API

// config field for write key
//ipc render and ipc main events including preload for 'import-to-segment'
//    data must contain: all config fields
ipcRenderer.on('import-to-segment', (event, data) =>{
console.log('importing to segment')
  let analytics = new Analytics(data.writeKey)
  for (let i=0; i<data.csvData.length; i++) {
    if (data.eventType == 'track') {
      analytics.track(data.eventName)
    }
  }
})

// save settings
// retrieve settings

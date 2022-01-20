const electron = require('electron');
const fs = require('fs');
const csv = require('csv-parser')
const Analytics = require('analytics-node');
const ipcRenderer = electron.ipcRenderer;

// manual test write key HPzXrG6JTe3kf4a8McAo1eM8TGQnkm3e

// API

// config field for write key
//ipc render and ipc main events including preload for 'import-to-segment'
//    data must contain: all config fields
ipcRenderer.on('import-to-segment', (event, data) => {
  const analytics = new Analytics(data.writeKey)
  const {eventField, anonymousIdField, userIdField, timestampField, ...rest } = data
  const topLevelFields = {
    event:eventField,
    anonymousId:anonymousIdField,
    userId:userIdField,
    timestamp:timestampField
  }
  const propFields = distillPropFields([eventField, anonymousIdField, userIdField, timestampField], Object.keys(data.csvData[0]))

  let trackEvent
  for (let i=0; i<data.csvData.length; i++) {
    if (data.eventTypes['track']) {
      trackEvent = formatTrackEvent(data.csvData[i], topLevelFields, propFields)
      analytics.track(trackEvent)
    }
  }
  console.log('importer-importing-to-segment')
})


ipcRenderer.on('update-event-preview', (event, data) => {
  const {eventField, anonymousIdField, userIdField, timestampField, ...rest } = data
  const propFields = distillPropFields([eventField, anonymousIdField, userIdField, timestampField], Object.keys(data.csvData[0]))
  const topLevelFields = {
    event:eventField,
    anonymousId:anonymousIdField,
    userId:userIdField,
    timestamp:timestampField
  }

  let previewEvents = []
  for (let i=0; i<data.csvData.length; i++) {
    if (data.eventTypes['track']) {
      trackEvent = formatTrackEvent(data.csvData[i], topLevelFields, propFields)
      previewEvents.push(trackEvent)
    }
  }
  ipcRenderer.send('event-preview-updated', previewEvents)
})

function formatTrackEvent(csvRow, topLevelFields, propFields) {
  let properties = {}
  propFields.map( (field) => {properties[field] = csvRow[field]} )

  let topLevelData = {}
  if (topLevelFields.event){
    topLevelData['event'] = csvRow[topLevelFields.event]
  }

  if (topLevelFields.userId){
    topLevelData['userId'] = csvRow[topLevelFields.userId]
  }

  if (topLevelFields.anonymousId){
    topLevelData['anonymousId'] = csvRow[topLevelFields.anonymousId]
  }

  if (topLevelFields.timestamp){
    console.log(topLevelFields.timestamp)
    topLevelData['timestamp'] = new Date(csvRow[topLevelFields.timestamp])
    console.log(csvRow[topLevelFields.timestamp])
  }

  return({
    ...topLevelData,
    properties: properties,
  })
}

ipcRenderer.on('load-csv', (event, filePath) => {
  let csvResults = []
  fs.createReadStream(filePath)
    .pipe(csv({separator:'|'}))
    .on('data', (data) => csvResults.push(data))
    .on('end', () => {
      console.log('end');
      ipcRenderer.send('csv-loaded', csvResults)
    })
    .on('error', (err) => console.log(err))
    console.log('csv-loaded-test')
})


// TODO
// save settings
// retrieve settings

function distillPropFields(fieldsToIgnoreArray, fieldsArray){
  //super slow since each field gets deleted, but its only done once before then beginning of the import loop
  // TODO explore how we can ignore the irrelevant fields better
  let propFields = []
    for (const field of fieldsArray){
      if (!fieldsToIgnoreArray.includes(field)) {
        propFields.push(field)
      }
    }
  return propFields
}

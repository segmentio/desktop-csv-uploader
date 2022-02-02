const electron = require('electron');
const fs = require('fs');
const csv = require('csv-parser')
const Analytics = require('analytics-node');
const ipcRenderer = electron.ipcRenderer;
const sqlite3 = require('sqlite3').verbose()


  db = new sqlite3.Database('importer.db');

// manual test write key HPzXrG6JTe3kf4a8McAo1eM8TGQnkm3e

// IPC listeners
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


ipcRenderer.on('import-to-segment', (event, data) => {
  try {
    const analytics = new Analytics(data.writeKey)

    if (!data.eventTypes.track && !data.eventTypes.identify){
      throw new Error("No event types selected")
    }

    for (let i=0; i<data.csvData.length; i++) {
        events = formatSegmentCalls(data.csvData[i], data, transformations)
        try {
          if (events.track){
            analytics.track(events.track)
          }
          if (events.identify){
            analytics.identify(events.identify)
          }
        } catch (error){
            error.message = error.message + ' This error occurred on line: ' + i
            throw error
          break
        }
      }

      ipcRenderer.send('import-complete', data.csvData.length)
      sqlite3
      console.log('importer-importing-to-segment')
  } catch (error) {
    console.log(error)
    ipcRenderer.send('import-error', error.message)
  };


  })


ipcRenderer.on('update-event-preview', (event, data) => {
  transformations = sortTransformations(data.transformationList)
  let previewEvents = []
  for (let i=0; i<data.csvData.length; i++) {
    if (data.eventTypes['track']) {
      events = formatSegmentCalls(data.csvData[i], data, transformations)
      previewEvents.push(events)
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
    topLevelData['timestamp'] = new Date(csvRow[topLevelFields.timestamp])
  }

  return({
    ...topLevelData,
    properties: properties,
  })
}


function formatIdentifyEvent(csvRow, topLevelFields, propFields) {
  let traits = {}
  propFields.map( (field) => {traits[field] = csvRow[field]} )

  let topLevelData = {}

  if (topLevelFields.userId){
    topLevelData['userId'] = csvRow[topLevelFields.userId]
  }

  if (topLevelFields.anonymousId){
    topLevelData['anonymousId'] = csvRow[topLevelFields.anonymousId]
  }

  if (topLevelFields.timestamp){
    topLevelData['timestamp'] = new Date(csvRow[topLevelFields.timestamp])
  }

  return({
    ...topLevelData,
    traits: traits,
  })
}




// TODO
// save settings
// retrieve settings

function distillFields(fieldsToIgnoreArray, fieldsArray){
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


function sortTransformations(transformations){
  // Type.Conditional [Targets]
  let sorted = {
    'Ignore Column':{
      'Track Events':[],
      'Identify Events':[],
      'All Events':[]
    }, 'Ignore Row':[]
  }

  for (const transformation of transformations){
    switch(transformation.type) {
      case 'Ignore Column':
        switch(transformation.conditional) {
          case 'Track Events':
            sorted['Ignore Column']['Track Events'].push(transformation.target)
            break
          case 'Identify Events':
            sorted['Ignore Column']['Identify Events'].push(transformation.target)
            break
          case 'All Events':
            sorted['Ignore Column']['All Events'].push(transformation.target)
            break
      };

      case 'Ignore Row':
        switch(transformation.conditional){
          case 'test': console.log('test')
        }

    }
  }
  return sorted
}


function formatSegmentCalls(csvRow, config, transformations){
  formattedEvents = {}
  let sendTrack = false
  let sendIdentify = false
  // decide what calls to send in
  if (config.eventTypes['track']) { //need to implement an ignore row transform here
    sendTrack = true
  }
  if (config.eventTypes['identify']) { //need to implement an ignore row transform here
    sendIdentify = true
  }

  const allFields = Object.keys(config.csvData[0])
  const {eventField, anonymousIdField, userIdField, timestampField, ...rest } = config
  const fieldsToIgnore = [eventField, anonymousIdField, userIdField, timestampField]

  if (sendTrack){
    var trackFieldsToIgnoreArray = fieldsToIgnore + transformations['Ignore Column']['Track Events'] + transformations['Ignore Column']['All Events']
    const propFields = distillFields(trackFieldsToIgnoreArray, allFields)
    const topLevelTrackFields = {
      event:eventField,
      anonymousId:anonymousIdField,
      userId:userIdField,
      timestamp:timestampField
    }
    trackEvent = formatTrackEvent(csvRow, topLevelTrackFields, propFields)
    formattedEvents['track'] = trackEvent
  }

  if (sendIdentify){
    var identifyFieldsToIgnoreArray = fieldsToIgnore + transformations['Ignore Column']['Identify Events'] + transformations['Ignore Column']['All Events']
    const traitFields = distillFields(identifyFieldsToIgnoreArray, allFields)
    const topLevelIdentifyFields = {
      anonymousId:anonymousIdField,
      userId:userIdField,
      timestamp:timestampField
    }
    identifyEvent = formatIdentifyEvent(csvRow, topLevelIdentifyFields, traitFields)
    formattedEvents['identify'] = identifyEvent
  }
  return formattedEvents
}

//learnings:
  //need to parse the transformations upfront

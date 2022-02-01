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
  const analytics = new Analytics(data.writeKey)

  for (let i=0; i<data.csvData.length; i++) {
      events = formatSegmentCalls(data.csvData[i], data, transformations)
      if (events.track){
        console.log(events.track)
        analytics.track(events.track)
      }
      if (events.identify){
        console.log(events.track)
        analytics.identify(events.identify)
      }
    }

    console.log('importer-importing-to-segment')
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



  // OLD code

  //const {eventField, anonymousIdField, userIdField, timestampField, transformations, ...rest } = data
  // fieldsToIgnoreArray = [eventField, anonymousIdField, userIdField, timestampField]
  //
  // const propFields = distillFields(fieldsToIgnoreArray, Object.keys(data.csvData[0]))
  // const topLevelFields = {
  //   event:eventField,
  //   anonymousId:anonymousIdField,
  //   userId:userIdField,
  //   timestamp:timestampField
  // }
  //
  // let previewEvents = []
  // for (let i=0; i<data.csvData.length; i++) {
  //   if (data.eventTypes['track']) {
  //     trackEvent = formatTrackEvent(data.csvData[i], topLevelFields, propFields)
  //     previewEvents.push(trackEvent)
  //   }
  // }
  // ipcRenderer.send('event-preview-updated', previewEvents)
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
    console.log(transformation)
    switch(transformation.type) {
      case 'Ignore Column':
        switch(transformation.conditional) {
          case 'Track Events':
            sorted['Ignore Column']['Track Events'].push(transformation.target)
            console.log(transformation.conditional)
            break
          case 'Identify Events':
            sorted['Ignore Column']['Identify Events'].push(transformation.target)
            console.log(transformation.conditional)
            break
          case 'All Events':
            sorted['Ignore Column']['All Events'].push(transformation.target)
            console.log(transformation.conditional)
            break
      };

      case 'Ignore Row':
        switch(transformation.conditional){
          case 'test': console.log('test')
        }

    }
  }
  console.log(sorted)
  return sorted
}


function formatSegmentCalls(csvRow, config, transformations){
  formattedEvents = {}
  let sendTrack = false
  let sendidentify = false
  // decide what calls to send in
  if (config.eventTypes['track']) { //need to implement an ignore row transform here
    sendTrack = true
  } else { sendTrack = false }
  if (config.eventTypes['identify']) { //need to implement an ignore row transform here
    sendIdentify = true
  } else { sendIdentify = false }

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

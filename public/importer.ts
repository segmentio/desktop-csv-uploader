import {ipcRenderer} from 'electron';
import * as fs from 'fs';
import CsvParser from 'csv-parser';
import Analytics from 'analytics-node';
import {insertImportRecord, getAllImports} from './utils/dbQueries'

// manual test write key HPzXrG6JTe3kf4a8McAo1eM8TGQnkm3e

interface ImportConfig {
    csvData:Array<object>,
    userIdField: string,
    anonymousIdField: string,
    timestampField: string,
    eventField: string,
    writeKey: string,
    eventTypes: {
      track: string,
      identify: string
    },
    transformationList:Array<Transformation>
}

interface Transformation {
  type:string,
  conditional:string,
  target:string
}

interface SortedTransformations {
  ignoreColumn:{
    trackEvents:Array<string|never>,
    identifyEvents:Array<string|never>,
    allEvents:Array<string|never>
  },
  ignoreRow:{}
}

interface Properties {
  [index:string]:string|number|Date|boolean|object
}

interface TrackEvent {
  event:string,
  userId?:string,
  anonymousId?:string,
  timestamp:Date,
  properties:Properties
}

interface IdentifyEvent{
  event:string,
  userId?:string,
  anonymousId?:string,
  timestamp:Date,
  traits:Properties
}

interface Events {
    track:TrackEvent,
    identify:IdentifyEvent
}

// IPC listeners
ipcRenderer.on('load-csv', (_, filePath:string) => {
  let csvResults:Array<object> = []
  fs.createReadStream(filePath)
    .pipe(CsvParser({separator:'|'}))
    .on('data', (data:any) => csvResults.push(data))
    .on('end', () => {
      console.log('end');
      ipcRenderer.send('csv-loaded', csvResults)
    })
    .on('error', (err:Error) => console.log(err))
    console.log('csv-loaded-test')
})


ipcRenderer.on('import-to-segment', (_, config:ImportConfig) => {
  try {
    const analytics = new Analytics(config.writeKey)
    if (!config.eventTypes.track && !config.eventTypes.identify){
      throw new Error("No event types selected")
    }
    const transformations = sortTransformations(config.transformationList)
    for (let i=0; i<config.csvData.length; i++) {
        const events:Events = formatSegmentCalls(config.csvData[i], config, transformations)
        try {
          if (events.track){
            analytics.track(events.track)
          }
          if (events.identify){
            analytics.identify(events.identify)
          }
        } catch {
          (error:Error)=> {
            error.message = error.message + ' This error occurred on line: ' + i
            throw error
        }}
      }
      ipcRenderer.send('import-complete', config.csvData.length)
      const values = {config:JSON.stringify(config), size:config.csvData.length}
      insertImportRecord(values)
      console.log(values)
      console.log('importer-importing-to-segment')
  } catch {
    (error:Error)=>{
    console.log(error)
    ipcRenderer.send('import-error', error.message)
  }}
})


function formatSegmentCalls(csvRow:Properties, config:ImportConfig, transformations:SortedTransformations):Events {
  let formattedEvents:Events
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
  const fieldsToIgnore:Array<string> = [eventField, anonymousIdField, userIdField, timestampField]

  if (sendTrack){
    let trackFieldsToIgnoreArray = fieldsToIgnore.concat(transformations.ignoreColumn.trackEvents, transformations.ignoreColumn.allEvents)
    const propFields = distillFields(trackFieldsToIgnoreArray, allFields)
    const topLevelTrackFields = {
      event:eventField,
      anonymousId:anonymousIdField,
      userId:userIdField,
      timestamp:timestampField
    }
    const trackEvent = formatTrackEvent(csvRow, topLevelTrackFields, propFields)
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


ipcRenderer.on('update-event-preview', (_,config:ImportConfig) => {
  const transformations = sortTransformations(config.transformationList)
  let previewEvents = []
  for (let i=0; i<config.csvData.length; i++) {
    if (config.eventTypes['track']) {
      const events = formatSegmentCalls(config.csvData[i], config, transformations)
      previewEvents.push(events)
    }
  }
  ipcRenderer.send('event-preview-updated', previewEvents)
})

ipcRenderer.on('load-history', ()=>{
  const history = getAllImports()
  console.log(history)
  ipcRenderer.send('history-loaded', history)
})

function formatTrackEvent(csvRow:Properties, topLevelFields:Properties, propFields:Array<string>) {

  let properties:Properties = {}
  propFields.map( (field:string) => {properties[field] = csvRow[field]} )

  let trackEvent:TrackEvent
  if (topLevelFields.event){
    trackEvent.event = csvRow[topLevelFields.event]
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

  return trackEvent
  // return({
  //   ...topLevelData,
  //   properties: properties,
  // })
}

function formatIdentifyEvent(csvRow:Properties, topLevelFields:Properties, propFields:Array<string>) {
  let traits:Properties = {}
  propFields.map( (field:string) => {traits[field] = csvRow[field]} )

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

function distillFields(fieldsToIgnore:Array<string>, fields:Array<string>) {
  let propFields = []
    for (const field of fields){
      if (!fieldsToIgnore.includes(field)) {
        propFields.push(field)
      }
    }
  return propFields
}

function sortTransformations(transformations:Array<Transformation>):SortedTransformations{
  let sorted:SortedTransformations = {
    ignoreColumn: {
      trackEvents:[],
      identifyEvents:[],
      allEvents:[]
    },
    ignoreRow:{}
  }

  for (const transformation of transformations){
    switch(transformation.type) {
      case 'Ignore Column':
        switch(transformation.conditional) {
          case 'Track Events':
            sorted.ignoreColumn.trackEvents.push(transformation.target)
            break
          case 'Identify Events':
            sorted.ignoreColumn.identifyEvents.push(transformation.target)
            break
          case 'All Events':
            sorted.ignoreColumn.allEvents.push(transformation.target)
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

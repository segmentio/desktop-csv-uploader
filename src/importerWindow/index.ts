import {ipcRenderer} from 'electron';
import * as fs from 'fs';
import Writable from 'stream'
import CsvParser from 'csv-parser';
import Analytics from 'analytics-node';
//@ts-ignore
import {insertImportRecord, getAllImports} from '../utils/dbQueries';
import {ImportConfig, UpdateData, SpecObject, csvData} from '../types';
// manual test write key HPzXrG6JTe3kf4a8McAo1eM8TGQnkm3e

type TimeStampable = string|number|Date

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

interface TrackEvent {
  event:string,
  userId?:string,
  anonymousId?:string,
  timestamp?:any, // string is converted during the event formatting process
  properties?:SpecObject
}

interface IdentifyEvent{
  userId?:string,
  anonymousId?:string,
  timestamp?:any, // string is converted during the event formatting process
  traits?:SpecObject
}

interface Events {
    track?:TrackEvent,
    identify?:IdentifyEvent
}

window.onerror = function(error:any, url, line) {
  console.log(error)
  console.log(error)
  ipcRenderer.send('import-error', error)
}

function CSVStream(filePath:string, options?:{linesNeeded:number}):Writable{
  const csvStream = fs.createReadStream(filePath).pipe(CsvParser({separator:'|'})) // pipe converts read streams into writable streams
  let lineCounter = 0
  csvStream.on('data', ()=>{
    lineCounter++
    if (options != undefined && lineCounter == options.linesNeeded) {
      csvStream.destroy()
    }
  })
  return csvStream
}

// IPC listeners
ipcRenderer.on('load-csv', (_, filePath) => {
  let results:csvData = []
  console.log('importer-loading-csv' + filePath )
  const stream = CSVStream(filePath, {linesNeeded:10})
  stream.on('data', (data:SpecObject)=>{ results.push(data) })
  stream.on('close', ()=>ipcRenderer.send('csv-loaded', results))
})

ipcRenderer.on('import-to-segment', (_, config:ImportConfig) => {
  console.log('import-to-segment')
    const analytics = new Analytics(config.writeKey)
    const transformations = sortTransformations(config.transformationList)

    if (!config.eventTypes.track && !config.eventTypes.identify){
      throw new Error('No event types selected')
      console.log('No event types selected')
    }

    const stream = CSVStream(config.filePath)
    console.log('stream')

    stream.on('data', (row) => {
      const events:Events = formatSegmentCalls(row, config, transformations)
      console.log(events)
      try {
        if (events.track){
          analytics.track(events.track)
        }
        if (events.identify){
          analytics.identify(events.identify)
        }
      } catch {
        (error:Error)=> {
          console.log(error)
          error.message = error.message + ' This error occurred on line: '
          throw error
          ipcRenderer.send('import-error', error.message)
      }
    }
  })

  stream.on('error', ()=>{
    (error:Error)=>{
      throw error
    }
  })

    stream.on('close', ()=>{
      ipcRenderer.send('import-complete', config);
      // const values = {config:JSON.stringify(config)};
      // insertImportRecord(values);
      console.log('importer-stream complete');
    })

})

ipcRenderer.on('update-event-preview', (_, updateData:UpdateData) => {
  console.log(updateData)
  const rawTransformations:Transformation[] = updateData.config.transformationList
  const transformations:SortedTransformations = sortTransformations(rawTransformations)
  let previewEvents:csvData = []
  const eventTypes = updateData.config.eventTypes
  if (eventTypes.track || eventTypes.identify){
    for (let i=0; i<updateData.csvData.length; i++) {
        const events:Events = formatSegmentCalls(updateData.csvData[i], updateData.config, transformations)
        previewEvents.push(events)
      }
    } else {
      previewEvents = updateData.csvData
    }
  ipcRenderer.send('event-preview-updated', previewEvents)
  console.log(previewEvents)
})

ipcRenderer.on('load-history', ()=>{
  const history = getAllImports()
  console.log(history)
  ipcRenderer.send('history-loaded', history)
})

function formatSegmentCalls(csvRow:SpecObject, config:ImportConfig, transformations:SortedTransformations):Events {
  let formattedEvents:Events = {}
  let sendTrack = false
  let sendIdentify = false

  if (config.eventTypes.track) { //need to implement an ignore row transform here
    sendTrack = true
  }

  if (config.eventTypes.identify) { //need to implement an ignore row transform here
    sendIdentify = true
  }

  const allFields = Object.keys(csvRow)
  const {eventField, anonymousIdField, userIdField, timestampField, ...rest } = config
  const fieldsToIgnore:Array<string> = [eventField, anonymousIdField, userIdField, timestampField]

  if (sendTrack){
    let trackFieldsToIgnore = fieldsToIgnore.concat(transformations.ignoreColumn.trackEvents, transformations.ignoreColumn.allEvents)
    const propFields = distillFields(trackFieldsToIgnore, allFields)
    const trackEvent = formatTrackEvent(csvRow, config, propFields)
    formattedEvents.track = trackEvent
  }

  if (sendIdentify){
    var identifyFieldsToIgnore = fieldsToIgnore.concat(transformations.ignoreColumn.identifyEvents, transformations.ignoreColumn.allEvents)
    const traitFields = distillFields(identifyFieldsToIgnore, allFields)
    const identifyEvent = formatIdentifyEvent(csvRow, config, traitFields)
    formattedEvents.identify = identifyEvent
  }

  return formattedEvents
}

function formatTrackEvent(csvRow:SpecObject, config:ImportConfig, propFields:Array<string>):TrackEvent {
  // csvRow is the chunk of csv data (js object) coming from the read csvStream
  // topLevelFields are the fields that
  let properties:SpecObject = {}
  propFields.map( (field:string) => {properties[field] = csvRow[field]} )

  let topLevelData:TrackEvent = {event: csvRow[config.eventField]}

  if (config.userIdField){
    topLevelData.userId = csvRow[config.userIdField]
  }

  if (config.anonymousIdField){
    topLevelData.anonymousId = csvRow[config.anonymousIdField]
  }

  if (config.timestampField){
    if (isTimeStampable(csvRow[config.timestampField])){
      topLevelData.timestamp = new Date(csvRow[config.timestampField])
    }
  }

    function isTimeStampable(value:any): value is TimeStampable{
      return (value as TimeStampable) !== undefined
    }

  return({
    ...topLevelData,
    properties:properties
  })
}

function formatIdentifyEvent(csvRow:SpecObject, config:ImportConfig, propFields:Array<string>):IdentifyEvent {
  let traits:SpecObject = {}
  propFields.map( (field:string) => {traits[field] = csvRow[field]} )

  let topLevelData:SpecObject = {}

  if (config.userIdField){
    topLevelData.userId = csvRow[config.userIdField]
  }

  if (config.anonymousIdField){
    topLevelData.anonymousId = csvRow[config.anonymousIdField]
  }

  if (config.timestampField){
    try {
      topLevelData.timestamp = new Date(csvRow[config.timestampField])
    } catch{
      (error:Error)=>{throw error}
    }
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
  console.log('transformation-sorted')
  return sorted
}

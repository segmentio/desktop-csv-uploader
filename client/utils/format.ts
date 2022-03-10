import {ImportConfig, SpecObject} from '../types';

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

type TimeStampable = string|number|Date

export const formatEventsFromRow = (csvRow:SpecObject, config:ImportConfig, transformations:SortedTransformations):Events => {
  let formattedEvents:Events = {}
  let sendTrack = false
  let sendIdentify = false

  if (config.eventTypes.track) { //need to implement an ignore row transform here
    sendTrack = true
  }

  if (config.eventTypes.identify) { //need to implement an ignore row transform here
    sendIdentify = true
  }

  if (!sendTrack && !sendIdentify){
    return csvRow
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

export const sortTransformations = (transformations:Array<Transformation>):SortedTransformations => {
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

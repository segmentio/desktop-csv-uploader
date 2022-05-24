import expect from 'expect';
import {formatEventsFromRow, sortTransformations} from '../format'
import {ImportConfig} from  '../../types'

let csvRow = {
      'anonid':'s0nym-nuqf4-kscd2-sraqa-y1ism',
      'eventname': 'Signed Up',
      'name': 'Chuck',
      'town': 'Chebeague',
      'userid': '123456',
    }

let config:ImportConfig = {
  userIdField: 'userid',
  anonymousIdField: 'anonid',
  timestampField: '',
  eventField: 'eventname',
  writeKey: '', // workspace -> https://app.segment.com/segment-cli-testing/sources/csv-importer/overview
  eventTypes: {
    track: false,
    identify: false
  },
  transformationList:[]
}

describe('formatter', ()=>{
  describe('transformations', ()=>{

      beforeEach(()=>{
        config.eventTypes.track = false
        config.eventTypes.identify = false
        config.transformationList = []
      })

    it('should ignore column for properly per event type', () => {
      const correctEvents = {
        track:{
          event:'Signed Up',
          userId:'123456',
          anonymousId:'s0nym-nuqf4-kscd2-sraqa-y1ism',
          properties:{
            town:'Chebeague'
          }
        },
        identify: {
          userId:'123456',
          anonymousId:'s0nym-nuqf4-kscd2-sraqa-y1ism',
          traits: {
            name:'Chuck'
          }
        }
      }
      config.transformationList = [
        {type:'Ignore Column', target:'name', conditional:'Track Events', id:'1'},
        {type:'Ignore Column', target:'town', conditional:'Identify Events', id:'2'}
      ]
      config.eventTypes.track = true
      config.eventTypes.identify = true
      const sortedTransformations = sortTransformations(config.transformationList)
      const actualEvents = formatEventsFromRow(csvRow, config, sortedTransformations)
      expect(actualEvents).toEqual(correctEvents)
    })

    it('should insert custom event name to track events', ()=>{
      const correctEvents = {
        track:{
          event:'Boat Docked',
          userId:'123456',
          anonymousId:'s0nym-nuqf4-kscd2-sraqa-y1ism',
          properties:{
            town:'Chebeague',
            name:'Chuck'
          }
        }
      }
      config.transformationList = [
        {type:'Default Event Name', target:'Boat Docked', conditional:'Track Events', id:'1'},
      ]
      config.eventTypes.track = true
      const sortedTransformations = sortTransformations(config.transformationList)
      const actualEvents = formatEventsFromRow(csvRow, config, sortedTransformations)
      expect(actualEvents).toEqual(correctEvents)
    })

    it('should add a randomized anonymousId to track and identify calls', () => {
      config.transformationList = [
        {type:'Randomize', target:"anonymousId", conditional:'All Events',  id:'1'},
      ]
      config.eventTypes.track = true
      config.eventTypes.identify = true
      config.anonymousIdField = ''
      const sortedTransformations = sortTransformations(config.transformationList)
      const actualEvents = formatEventsFromRow(csvRow, config, sortedTransformations)
      expect(actualEvents.track?.anonymousId).not.toBe(undefined)
      expect(actualEvents.identify?.anonymousId).not.toBe(undefined)
    })
  })
})




// config passed into format Events From row should not contain the unsorted
// transformation List

//sorted transformations should be its own

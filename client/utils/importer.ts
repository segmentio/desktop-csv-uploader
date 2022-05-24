import Analytics from 'analytics-node';
import Papa from 'papaparse'
//@ts-ignore
import {ImportConfig, UpdateData, SpecObject, CSVData} from '../types';
import {formatEventsFromRow, sortTransformations} from './format'

window.onerror = function(error:any) {
  console.log(error)
}

export const importToSegment = (
  config:ImportConfig,
  file:File,
  startCallback:Function,
  endCallback:Function
):void => {

  console.log('import to segment')
  if (!config.eventTypes.track && !config.eventTypes.identify){
    throw new Error('No event types selected')
  }

  const analytics = new Analytics(config.writeKey)
  const sortedTransformations = sortTransformations(config.transformationList)
  let counter = 0
  console.time()
  startCallback()

  Papa.parse(file, {
    header:true,
    skipEmptyLines:true,
    step: function(row){
      console.log(counter)
      counter++
      //@ts-ignore
      const events = formatEventsFromRow(row.data, config, sortedTransformations)

      if (events.track){
        analytics.track(events.track)
      }
      if (events.identify){
        analytics.identify(events.identify)
      }
    },
    error: function(error){
      throw error
    },
    complete: function() {
      const importComplete = new Event('import-complete');
      console.timeEnd()
      endCallback()
      window.dispatchEvent(importComplete)
    }
  })
}

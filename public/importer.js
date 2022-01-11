const electron = require('electron');
const Analytics = require('analytics-node')
const ipcRenderer = electron.ipcRenderer;


// API

// config field for write key
//ipc render and ipc main events including preload for 'import-to-segment'
//    data must contain: all config fields
ipcRenderer.on('import-to-segment', (event, data) =>{
console.log('importing-to-segment')
  let analytics = new Analytics(data.writeKey)
  const {eventField, anonymousIdField, userIdField, timestampField, ...rest } = data
  propFields = distillPropFields([eventField, anonymousIdField, userIdField, timestampField], Object.keys(data.csvData[0]))

  let properties
  for (let i=0; i<data.csvData.length; i++) {
    properties = {}
    propFields.map((field) => {properties[field] = data.csvData[i][field]})

    if (data.eventTypes['track']) {
      analytics.track({
        event:data.csvData[i][eventField],
        anonymousId:data.csvData[i][anonymousIdField],
        userId:data.csvData[i][userIdField],
        timestamp: new Date(data.csvData[i][timestampField]),
        properites: properties
      })
    }


// HPzXrG6JTe3kf4a8McAo1eM8TGQnkm3e
    // if (data.eventTypes['identify']) {
    //   {anonymousIdField, userIdField, timestampField, ...traits } = data.csvData[i]
    //   analytics.identify({
    //     event:eventField,
    //     anonymousId:anonymousIDField,
    //     userId:userIdField,
    //     traits: {traits},
    //     timestamp:timestampField
    //   })
    // }


  }
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

  console.log(fieldsToIgnoreArray)
  console.log(fieldsArray)
  return propFields
}

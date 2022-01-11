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
  // propFields = distillPropFields({eventField, anonymousIdField, userIdField, timestampField}, data.csvData[0])



  for (let i=0; i<data.csvData.length; i++) {
    console.log(data.csvData[i])
    if (data.eventTypes['track']) {
      analytics.track({
        event:data.csvData[i][eventField],
        anonymousId:data.csvData[i][anonymousIdField],
        userId:data.csvData[i][userIdField],
        timestamp: new Date(data.csvData[i][timestampField]),
        // properites: {
        //   propertyfields: propFields.map()...
        // }
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

// function distillPropFields(fieldsToIgnore, anyEvent){
//   //super slow since each field gets deleted
//   // TODO explore how we can ignore the irrelevant fields better
//
//   const fieldsArray = Object.keys(anyEvent)
//   let propertiesFields = []
//     for (const field of fieldsArray){
//       if (fieldsToIgnore[field]) {
//       } else {
//         fieldsArray.append
//       }
//     }
//   return
// }

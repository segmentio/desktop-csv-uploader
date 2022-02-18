export interface UpdateData {
  config:ImportConfig,
  csvData:Array<SpecObject>|never
}
export interface ImportConfig {
    filePath:string,
    userIdField: string,
    anonymousIdField: string,
    timestampField: string,
    eventField: string,
    writeKey: string,
    eventTypes: {
      track: boolean,
      identify: boolean
    },
    transformationList:Array<Transformation>
}

export interface SpecObject{
    [index:string]:any
}

export interface History{
}

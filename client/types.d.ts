export interface UpdateData {
  config:ImportConfig,
  csvData:csvData|never
}
export interface ImportConfig {
    userIdField: string,
    anonymousIdField: string,
    timestampField: string,
    eventField: string,
    writeKey: string,
    eventTypes: {
      track: boolean,
      identify: boolean
    },
    transformationList:Array<Transformation>|never
}

export type CSVData = Array<SpecObject>

export interface SpecObject{
    [index:string]:any
}

export interface Transformation{
  type:string,
  target:string,
  conditional:string,
  id:string
}

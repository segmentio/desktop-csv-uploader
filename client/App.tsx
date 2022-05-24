import React, {useEffect, useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {json} from '@codemirror/lang-json';
import {v4 as uuidv4} from 'uuid';
import Papa from 'papaparse';
import { Pane, Menu, Table, Text, Button, Heading, SelectField, SideSheet,
  Position, TextInputField, Switch, FilePicker, majorScale, toaster,
  Spinner } from 'evergreen-ui';

import {ImportConfig, SpecObject, CSVData, Transformation} from './types'
import {formatEventsFromRow, sortTransformations, importToSegment} from './utils'
import {Transformations, StatefulRow} from './components'


window.onerror = function(error:any) {
  toaster.danger('Oops Something went wrong... ', {description:error})
}

window.addEventListener('import-complete', ()=> {
  toaster.success('Import Successful!', {description:'Check the source debugger in your Segment workspace!'})
});

function App() {
  const [csvData, setCSVData] = useState<CSVData | null>(null)
  const [eventSelection, setEventSelection] = useState<number>(0)
  const [eventIsSelected, setEventIsSelected] = useState<boolean>(false)
  const [menuSelection, setMenuSelection] = useState<'Importer'|'History'>('Importer')

  return (
    <div className="App">
        <Pane
        display="grid"
        gridTemplateColumns= "1fr 5fr">
          <CustomMenu setMenuSelection={setMenuSelection}/>
          <ViewWrapper
          csvData={csvData}
          setCSVData={setCSVData}
          eventSelection={eventSelection}
          setEventSelection={setEventSelection}
          eventIsSelected={eventIsSelected}
          setEventIsSelected={setEventIsSelected}
          menuSelection={menuSelection}/>
        </Pane>
    </div>
  );
}
export default App;

export interface CustomMenuProps {
  setMenuSelection:React.Dispatch<React.SetStateAction<'Importer'|'History'>>}
function CustomMenu(props:CustomMenuProps){
    return (
      <Menu>
        <Menu.Group>
          <Pane>
            <Menu.Item onSelect={() => {props.setMenuSelection('Importer')}}>
              Importer
            </Menu.Item>
          </Pane>
          <Pane>
              <Menu.Item onSelect={() => {props.setMenuSelection('History')}}>
                History
              </Menu.Item>
          </Pane>
        </Menu.Group>
      </Menu>
    );
}

function ViewWrapper(props:CSVWorkspaceProps){
  if (props.menuSelection == 'Importer') {
    return(
      <CSVWorkspace
      csvData={props.csvData}
      setCSVData={props.setCSVData}
      eventSelection={props.eventSelection}
      setEventSelection={props.setEventSelection}
      eventIsSelected={props.eventIsSelected}
      setEventIsSelected={props.setEventIsSelected}
      />
    )
  } else if (props.menuSelection == 'History'){
    return(
      <History/>
    )
  } else{ return null}
}

export interface CSVWorkspaceProps{
  csvData:CSVData | null,
  setCSVData: React.Dispatch<React.SetStateAction<CSVData|null>>,
  eventSelection:number,
  setEventSelection: React.Dispatch<React.SetStateAction<number>>,
  eventIsSelected:boolean,
  setEventIsSelected: React.Dispatch<React.SetStateAction<boolean>>,
  menuSelection?: 'Importer'|'History'}
function CSVWorkspace(props:CSVWorkspaceProps){
  const [previewedEvents, setPreviewedEvents] = useState<CSVData|null>(null)
  const [file, setFile] = useState<File|null>(null)

  if (props.csvData && file){
    return(
      <Pane
      display="grid"
      gridTemplateColumns="1fr 1fr"
      marginY={majorScale(4)}>
        <Pane>
        <Heading>CSV Events</Heading>
          <CSVTable
          csvData={props.csvData}
          setEventSelection={props.setEventSelection}
          setEventIsSelected={props.setEventIsSelected}/>
          <EventPreview
          csvData={previewedEvents == null ? props.csvData :previewedEvents}
          eventSelection={props.eventSelection}
          eventIsSelected={props.eventIsSelected}
          setEventIsSelected={props.setEventIsSelected}
          />
        </Pane>
        <Pane
        marginX={majorScale(4)}>
          <Configuration
          file={file}
          csvData={props.csvData}
          columnNames={Object.keys(props.csvData[0])}
          setPreviewedEvents={setPreviewedEvents}
          />
        </Pane>
      </Pane>
    )
  } else {
    return (
      <Pane
      text-align='center'
      margin={majorScale(10)}>
        <Text
        color="muted"
        size={600}
        display='inline-block'
        marginY={majorScale(2)}>
        Import a CSV file, or work from your Import History
        </Text>
        <FilePicker
        onChange={fileList => {
          readHead(fileList[0], props.setCSVData)
          setFile(fileList[0])
          }}
        />
      </Pane>
    )
  }
}

function readHead(localFile:File, callback:Function):any{
  let lineCounter = 0
  let csvRows:CSVData = []
  Papa.parse(localFile, {
    header:true,
    skipEmptyLines:true,
    step: function(row, parser){
        lineCounter++
        //@ts-ignore
        csvRows.push(row.data)
        if (lineCounter>=10){
          parser.abort()
        }
    },
    complete: function() {
      callback(csvRows)
    }
  })

}


function History() {
  const [history, setHistory] = useState<Array<object>|null>(null)

  if (history){
    return (
    <Pane
    marginY={majorScale(4)}>
    <Heading>Import History</Heading>
      <Table>
        <Table.Head>
            <Table.TextHeaderCell>
                Import Name
            </Table.TextHeaderCell>
            <Table.TextHeaderCell>
                Size
            </Table.TextHeaderCell>
            <Table.TextHeaderCell>
                Status
            </Table.TextHeaderCell>
        </Table.Head>
        <Table.Body height={240}>
  {history.map((row:any) => (
    <Table.Row key={row} isSelectable>
      <Table.TextCell>{row.size}</Table.TextCell>
      <Table.TextCell isNumber>{row.success}</Table.TextCell>
    </Table.Row>
  ))}
  </Table.Body>
      </Table>
    </Pane>
  )} else {
    return (
      <Heading>
      Coming Soon!
      </Heading>
    )
  }
}

export interface CSVTableProps{
  csvData: CSVData | null,
  setEventSelection:React.Dispatch<React.SetStateAction<number>>,
  setEventIsSelected: React.Dispatch<React.SetStateAction<boolean>>}
function CSVTable (props:CSVTableProps){
  let csvHeader = []
  let csvRows = []

  if (!props.csvData) {
    return( <Pane> no data </Pane>)
  }else {
    csvHeader = Object.keys(props.csvData[0])
    return(
      <Pane
      display='block'
      width='600px'
      height='auto'
      overflow='auto'>
      <Pane
      width='2000px'>
      <Table id='table'>
        <Table.Head id='table-head' padding='0px'>
          <Table.Row id='row' flexGrow={1} padding-right='0px'>
            {csvHeader.map(columnName =>
              <Table.TextHeaderCell>
              {columnName}
              </Table.TextHeaderCell>)
            }
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {
            props.csvData.map( (row:SpecObject, index:number) =>
                <StatefulRow
                isSelectable={true}
                index={index}
                key={uuidv4()}
                setRowSelection={props.setEventSelection}
                setRowIsSelected={props.setEventIsSelected}>
                  {Object.keys(row).map(
                    key =>
                      <Table.TextCell>
                        {row[key]}
                      </Table.TextCell>
                  )}
                </StatefulRow>
            )
          }
        </Table.Body>
      </Table>
      </Pane>
      </Pane>
    )
  }
}

export interface EventPreviewProps{
  eventIsSelected:boolean
  setEventIsSelected:React.Dispatch<React.SetStateAction<boolean>>
  eventSelection:number
  csvData:CSVData}
function EventPreview(props:EventPreviewProps) {
  if (!props.eventIsSelected) {
    return null
  } else {
    const eventData = props.csvData[props.eventSelection]
    return(
      <SideSheet
        isShown={props.eventSelection != null}
        onCloseComplete={() => props.setEventIsSelected(false)}
        position={Position.LEFT}>
          <CodeMirror
            value={JSON.stringify(eventData, null, 2)}
            extensions={[json()]}/>
        </SideSheet>
      )
  }
}

export interface ConfigurationProps{
  columnNames:Array<string>,
  csvData:CSVData,
  setPreviewedEvents:React.Dispatch<React.SetStateAction<CSVData|null>>
  file:File
}
function Configuration(props:ConfigurationProps) {
  const [userIDField, setUserIDField] = useState('')
  const [anonymousIDField, setAnonymousIDField] = useState('')
  const [timestampField, setTimestampField] = useState('')
  const [eventNameField, setEventNameField] = useState('')
  const [writeKey, setWriteKey] = useState('')
  const [hasTrack, setHasTrack] = useState(false)
  const [hasIdentify, setHasIdentify] = useState(false)
  const [transformationList, setTransformationList] = useState<Transformation[]|never>([])
  const [importInProgress, setImportInProgress] = useState(false)

  const config:ImportConfig = {
      userIdField: userIDField,
      anonymousIdField: anonymousIDField,
      timestampField: timestampField,
      eventField: eventNameField,
      writeKey: writeKey,
      eventTypes: {
        track: hasTrack,
        identify:hasIdentify
      },
      transformationList:transformationList
    };

  useEffect(
    function updateEventPreivew(){
      let previewedEvents:CSVData = []
      const sortedTransformations = sortTransformations(transformationList)
      props.csvData.map( (row)=> {
        previewedEvents.push(formatEventsFromRow(row, config, sortedTransformations))
      })
      props.setPreviewedEvents(previewedEvents)
    }, [
      userIDField,
      anonymousIDField,
      timestampField,
      eventNameField,
      hasTrack,
      hasIdentify,
      transformationList
    ]
  )

  return(
    <Pane>
      <Heading> Configuration </Heading>
      <WriteKeyForm label='Segment Write Key' onChange={setWriteKey}/>
      <Pane marginBottom={majorScale(4)}>
        <Heading> Event Types </Heading>
        <EventTypeSwitch label='Track' onChange={setHasTrack}/>
        <EventTypeSwitch label='Identify' onChange={setHasIdentify}/>
      </Pane>
      <SettingSelector
      options={props.columnNames}
      label="UserId Field"
      hint='Either a userId or anonymousId is required'
      required={anonymousIDField || userIDField ? false : true}
      onChange={setUserIDField}
      isShown={true}
      />
      <SettingSelector
      options={props.columnNames}
      label="AnonymousId Field"
      hint='Either a userId or anonymousId is required'
      required={anonymousIDField || userIDField ? false : true}
      onChange={setAnonymousIDField}
      isShown={true}
      />
      <SettingSelector
      options={props.columnNames}
      label="Timestamp Field"
      hint="If you don't provide a time stamp, Segment will use the current time"
      required={timestampField ? false : true}
      onChange={setTimestampField}
      isShown={true}
      />
      <SettingSelector
      options={props.columnNames}
      label="Event Field"
      hint="No event field, no worries! Just apply a transformation to attach a default event name to your track calls"
      required={false}
      onChange={setEventNameField}
      isShown={hasTrack? true : false}
      />
      <Transformations
      transformationList={transformationList}
      setTransformationList={setTransformationList}
      columnNames={props.columnNames}/>
      <Button
      appearance="primary"
      onClick={() =>{
        importToSegment(
          config,
          props.file,
          ()=>{setImportInProgress(true)},
          ()=>{setImportInProgress(false)}
        )
      }

      }>
        Import
      </Button>
      <ImportStatus status={importInProgress}/>
    </Pane>
  )
}

export interface ImportStatus{
  status: boolean
}
function ImportStatus(props:ImportStatus){
  if (props.status){
    return(
      <Pane height={40}>
        <Spinner delay={300} />
      </Pane>)
  } else return null
}
export interface EventTypeSwitch{
  label:string,
  onChange:React.Dispatch<React.SetStateAction<boolean>>
}
function EventTypeSwitch(props:EventTypeSwitch) {
  const [checked, setChecked] = React.useState(false)
  return (
    <Pane margin={majorScale(2)}>
      <Text size={400} color={'default'}>
        {props.label}
      </Text>
      <Switch
      checked={checked}
      onChange={
        (e) => {
          setChecked(e.target.checked)
          props.onChange(e.target.checked)
        }}/>
    </Pane>
  )
}

export interface WriteKeyFormProps{
  required?:boolean,
  label:string,
  onChange:React.Dispatch<React.SetStateAction<string>>}
function WriteKeyForm(props:WriteKeyFormProps) {
  const [value, setValue] = React.useState('')
  return (
    <TextInputField
    required={!props.required ? false : true}
    value={value}
    label='Write Key'
    onChange={(e:any) =>{
      setValue(e.target.value)
      props.onChange(e.target.value)
    }}/>
  )
}

export interface SettingSelectorProps{
  options:Array<string>
  label:string,
  required:boolean,
  hint:string,
  isShown:boolean
  onChange:React.Dispatch<React.SetStateAction<string>>}
function SettingSelector(props:SettingSelectorProps){
  if (props.isShown) {
    return (
      <Pane>
        <SelectField
          label={props.label}
          required={props.required}
          hint={props.hint}
          onChange={e => {
            props.onChange(e.target.value)
          }}>
          <option value="" selected></option>
            {
              props.options.map(option =>
              <option value={option}>
              {option}
              </option>)
            }
        </SelectField>
      </Pane>
    )
  } else {
    return null
  }
}

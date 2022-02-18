import React, {useEffect, useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {json} from '@codemirror/lang-json';
import {v4 as uuidv4} from 'uuid'
import {
  Pane,
  Menu,
  Table,
  Text,
  SelectMenu,
  Button,
  Heading,
  SelectField,
  SideSheet,
  Position,
  TextInputField,
  Switch,
  FilePicker,
  majorScale,
  toaster,
} from 'evergreen-ui';

import {ImportConfig, UpdateData, SpecObject} from '../types'

declare global{
  interface Window{
    api: {
      send: (channel: string, ...arg: any) => void;
      on: (channel: string, func: (event: any, ...arg: any) => void) => void;
      removeAllListeners: (channel:string, func?: (event:any, ...arg:any)=> void) => void;
    }
  }
}



function App() {
  const [csvData, setCSVData] = useState<UpdateData["csvData"] | null>(null)
  const [eventSelection, setEventSelection] = useState<number>(0)
  const [eventIsSelected, setEventIsSelected] = useState<boolean>(false)
  const [menuSelection, setMenuSelection] = useState<'Importer'|'History'>('Importer')

  useEffect( () => {
    window.api.on("csv-loaded", (data:UpdateData["csvData"]) => {
      console.log('csv-loaded');
      console.log(data)
      setCSVData(data)
    });
    return () => window.api.removeAllListeners("csv-loaded");
  }
)
  return (
    <div className="App">
        <Pane
        display="grid"
        gridTemplateColumns= "1fr 5fr">
          <CustomMenu setMenuSelection={setMenuSelection}/>
          <ViewWrapper
          csvData={csvData}
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
          <Pane>
              <Menu.Item>
                Settings
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
  csvData:SpecObject | null,
  eventSelection:number,
  setEventSelection: React.Dispatch<React.SetStateAction<number>>,
  eventIsSelected:boolean,
  setEventIsSelected: React.Dispatch<React.SetStateAction<boolean>>,
  menuSelection?: 'Importer'|'History'}
function CSVWorkspace(props:CSVWorkspaceProps){
  const [previewedEvents, setPreviewedEvents] = useState<UpdateData|null>(null)
  const [importComplete, setImportComplete] = useState(false)
  const [filePath, setFilePath] = useState<string>('')

  useEffect(()=>{
    window.api.on('event-preview-updated', (data:UpdateData) => {
      setPreviewedEvents(data)
      console.log('event-preview-updated')
    });

    window.api.on('import-complete', (count:number)=> {
      toaster.success('Import Successful!', {description:'Check the source debugger in your Segment workspace!'})
      console.log('import-complete')
    });

    window.api.on('import-error', (error:string)=> {
      console.log(error)
      toaster.danger('Oops Something went wrong... ', {description:error})
      console.log('import-error')
    });

    return () => {
      window.api.removeAllListeners('event-preview-updated')
      window.api.removeAllListeners('import-complete')
      window.api.removeAllListeners('import-error')
    }
  })

  if (props.csvData){
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
          columnNames={Object.keys(props.csvData[0])}
          filePath={filePath}
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
        onChange={filePath => {
          console.log("load-csv", filePath)
          window.api.send("load-csv", filePath[0].path)
          setFilePath(filePath[0].path)
          }}
        />
      </Pane>
    )
  }
}


function History() {
  const [history, setHistory] = useState<Array<object>|null>(null)

  useEffect( ()=>{
    window.api.send('load-history', null);
    window.api.on('history-loaded', (data)=>{
      console.log('history-loaded')
      setHistory(data)
    });

    return ()=>{
      window.api.removeAllListeners('load-history');
      window.api.removeAllListeners('history-loaded');
    }
  }, [])

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
      <Pane>
      no history
      </Pane>
    )
  }
}

export interface CSVTableProps{
  csvData: SpecObject | null,
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

export interface StatefulRowProps{
  index:number,
  key:string,
  isSelectable?:boolean,
  setRowSelection?:React.Dispatch<React.SetStateAction<number>>,
  setRowIsSelected?:React.Dispatch<React.SetStateAction<boolean>>,
  children:React.ReactNode
}
function StatefulRow(props:StatefulRowProps) {
  const [rowNumber, _] = useState(props.index)
  return(
    <Table.Row
    key={props.key}
    isSelectable={props.isSelectable? props.isSelectable: false}
    flexGrow={1}
    onSelect={() => {
      if (props.setRowSelection && props.setRowIsSelected){
        props.setRowSelection(rowNumber)
        props.setRowIsSelected(true)
      }
    }}>
      {props.children}
    </Table.Row>
  )

}


export interface EventPreviewProps{
  eventIsSelected:boolean
  setEventIsSelected:React.Dispatch<React.SetStateAction<boolean>>
  eventSelection:number
  csvData:SpecObject}
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
  filePath:string,
  columnNames:Array<string>
}
function Configuration(props:ConfigurationProps) {
  const [userIDField, setUserIDField] = useState('')
  const [anonymousIDField, setAnonymousIDField] = useState('')
  const [timestampField, setTimestampField] = useState('')
  const [eventNameField, setEventNameField] = useState('')
  const [writeKey, setWriteKey] = useState('')
  const [hasTrack, setHasTrack] = useState(false)
  const [hasIdentify, setHasIdentify] = useState(false)
  const [transformationList, setTransformationList] = useState<Transformation[] | never>([])

  const data:ImportConfig = {
    filePath:props.filePath,
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

  useEffect( ()=>{
    window.api.send('update-event-preview', data)
    console.log('ui-update-event-preview')
  }, [
    userIDField,
    anonymousIDField,
    timestampField,
    eventNameField,
    hasTrack,
    hasIdentify,
  ])

  const importToSegment = () => {
    window.api.send('import-to-segment', data)
    console.log('import-to-segment')
  }

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
      hint="No event field, no worries! Just apply a transformation to attach a defalut event name to your track calls"
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
      onClick={() => {importToSegment()}}>
        Import
      </Button>
      {console.log(data)}
    </Pane>
  )
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

export interface TransformationsProps{
  columnNames:Array<string>,
  transformationList:Array<Transformation>|never
  setTransformationList:React.Dispatch<React.SetStateAction<Array<Transformation>|never>>}
export interface Transformation{
  type:string,
  target:string,
  conditional:string,
  id:string}
function Transformations(props:TransformationsProps){
  const columns=Object.keys(props.columnNames)

  function handleAdd(item:Transformation){
    const newList = props.transformationList.concat(item);
    props.setTransformationList(newList)
  }

  function handleRemoval(id:string){
    const newList = props.transformationList.filter((transformation) => transformation.id !== id)
    props.setTransformationList(newList)
  }

  return(
      <Pane marginY={majorScale(2)}>
        <Heading> Transformations </Heading>
        {props.transformationList.map((transformation, index)=>(
          <TransformationDisplay
          index={index}
          transformation={transformation}
          handleRemoval={handleRemoval}
          />
        ))}
        <Pane marginY={majorScale(2)}>
          <AddTransformation transformationList={props.transformationList} columns={columns} handleAdd={handleAdd}/>
        </Pane>
      </Pane>
  )
}

export type TransformationDisplayProps = {index:number} & {transformation:Transformation} & {handleRemoval:(id:string)=>void}
function TransformationDisplay(props:TransformationDisplayProps){
  return (
    <StatefulRow key={props.transformation.id} index={props.index}>
      <Pane marginY={majorScale(3)} marginX={majorScale(1)}>
        <Button marginRight={majorScale(1)}>
        {props.transformation.type}
        </Button>

        <Button marginRight={majorScale(1)}>
        {props.transformation.target}
        </Button>
        <Text marginRight={majorScale(1)}>for</Text>
        <Button marginRight={majorScale(1)}>
        {props.transformation.conditional}
        </Button>
        <Button
          marginLeft={majorScale(1)}
          intent='danger'
          onClick={() => props.handleRemoval(props.transformation.id)}>
          delete
        </Button>
      </Pane>
    </StatefulRow>
  )
}

export interface AddTransformationProps{
  columns:Array<string>,
  handleAdd:(transformation:Transformation)=>void,
  transformationList:Array<Transformation>|never,
}
function AddTransformation(props:AddTransformationProps){
  const [addTransformation, setAddTransformation] = useState(false)
  const [transformationType, setTransformationType] = useState('')
  const [transformationTarget, setTransformationTarget] = useState('')
  const [transformationConditional, setTransformationConditional] = useState('')
  const [selected, setSelected] = useState('')

  if (addTransformation==true) {
    return(
      <Pane
      marginY={majorScale(2)}
      display="inline-flex"
      >
        <SelectMenu
          title="Transformation Type"
          options={['Ignore Column', ''].map((label) => ({ label, value: label }))}
          selected={transformationType}
          hasFilter={false}
          hasTitle={false}
          onSelect={(item) => {
            if (typeof item.value === 'string'){
              setTransformationType(item.value)
              setSelected(item.value)
            }
          }}>
          <Button>{selected || 'Select Transformation Type'}</Button>
        </SelectMenu>

        <TransformationTarget
         columns={props.columns}
         transformationType={transformationType}
         setTransformationTarget={setTransformationTarget}
         />
        <TransformationConditional
         transformationType={transformationType}
         setTransformationConditional={setTransformationConditional}/>
        <Button
          marginLeft={majorScale(2)}
          intent='danger'
          onClick={()=>{
            setTransformationType('')
            setTransformationTarget('')
            setTransformationConditional('')
            setAddTransformation(false)
          }}>
          delete
        </Button>
        <Button
          marginLeft={majorScale(1)}
          intent='success'
          onClick={()=>{
            if (transformationType && transformationTarget && transformationConditional){
                props.handleAdd({
                  type:transformationType,
                  target:transformationTarget,
                  conditional:transformationConditional,
                  id: uuidv4()
                })
            }
            setTransformationType('')
            setTransformationTarget('')
            setTransformationConditional('')
            setAddTransformation(false)
          }}>
          save
        </Button>
      </Pane>
    )
  } else {
    return (
      <Button
    onClick={()=>setAddTransformation(true)}>
    Add Transformation
      </Button>
  )}
}

export interface TransformationTarget{
  transformationType:string
  columns:Array<string>,
  setTransformationTarget:(value:string)=>void}
function TransformationTarget(props:TransformationTarget) {
  const [selected, setSelected] = React.useState('')

  if (!props.transformationType){
    return null
  } else if (props.transformationType == 'Ignore Column') {
    return(
      <Pane marginX={majorScale(1)}>

        <SelectMenu
          options={props.columns.map((label) => ({ label, value: label }))}
          selected={selected}
          hasFilter={false}
          hasTitle={false}
          onSelect={(item) => {
            if (typeof item.value == 'string'){
              setSelected(item.value)
              props.setTransformationTarget(item.value)
            }

          }}>
          <Button>{selected || 'Select Column...'}</Button>
        </SelectMenu>
      </Pane>
    )
  } else return null
}

export interface TransformationConditional{
  transformationType:string
  setTransformationConditional:(value:string)=>void}
function TransformationConditional(props:TransformationConditional) {
  const [selected, setSelected] = React.useState('')
  if (!props.transformationType){
    return null
  } else if (props.transformationType == 'Ignore Column') {
    return(
      <Pane
      marginX={majorScale(2)}
      display="inline-flex">
        <Text marginTop={majorScale(1)} marginRight={majorScale(1)} >
        For
        </Text>
        <SelectMenu
          title="columnName = "
          options={['All Events','Track Events', 'Identify Events'].map((label) => ({ label, value: label }))}
          selected={selected}
          hasFilter={false}
          hasTitle={false}
          onSelect={(item) => {
            if (typeof item.value == 'string'){
              setSelected(item.value)
              props.setTransformationConditional(item.value)
            }

          }}>
          <Button>{selected || 'Select Conditional...'}</Button>
        </SelectMenu>
      </Pane>
    )
  } else return null
}

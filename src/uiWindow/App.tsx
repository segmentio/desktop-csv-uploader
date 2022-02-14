import React, {useEffect, useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {json} from '@codemirror/lang-json';
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

import {ImportConfig, UpdateData} from '../types'

function App() {
  const [csvData, setCSVData] = useState(null)
  const [eventSelection, setEventSelection] = useState(null)
  const [eventIsSelected, setEventIsSelected] = useState(false)
  const [menuSelection, setMenuSelection] = useState('Importer')

  useEffect( () => {
    window.api.on("csv-loaded", (data:UpdateData) => {setCSVData(data.csvData)})
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

function CustomMenu(props){
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

function ViewWrapper(props){
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
  }
}

function CSVWorkspace(props){
  const [previewedEvents, setPreviewedEvents] = useState([])
  const [importComplete, setImportComplete] = useState(false)

  useEffect(()=>{
    window.api.on('event-preview-updated', (data) => {
      setPreviewedEvents(data)
      console.log('event-preview-updated')
    });

    window.api.on('import-complete', (count)=> {
      toaster.success('Import Successful!', {description:'Check the source debugger in your Segment workspace!'})
      console.log('import-complete')
    });

    window.api.on('import-error', (error)=> {
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
          csvData={previewedEvents.length > 0 ? previewedEvents : props.csvData}
          eventSelection={props.eventSelection}
          eventIsSelected={props.eventIsSelected}
          setEventIsSelected={props.setEventIsSelected}
          />
        </Pane>
        <Pane
        marginX={majorScale(4)}>
          <Configuration
          columnNames={Object.keys(props.csvData[0])}
          csvData={props.csvData}
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
          }}
        />
      </Pane>
    )
  }
}


function History() {
  const [history, setHistory] = useState(null)

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
  {history.map((row) => (
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

function CSVTable (props){
  let csvHeader = []
  let csvRows = []

  if (!props.csvData) {
    return( <Pane> no data </Pane>)
  }else {
    csvHeader = Object.keys(props.csvData[0])
    csvRows = props.csvData
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
            csvRows.map( (row, index) =>
                <StatefulRow
                isSelectable={true}
                index={index}
                setEventSelection={props.setEventSelection}
                setEventIsSelected={props.setEventIsSelected}>
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

function StatefulRow(props) {
  const [rowNumber, setRowNumber] = useState(props.index)

  return(
    <Table.Row
    key={props.index}
    isSelectable={props.isSelectable}
    flexGrow={1}
    onSelect={() => {
      props.setEventSelection(rowNumber)
      props.setEventIsSelected(true)
    }}>
      {props.children}
    </Table.Row>
  )

}

function EventPreview(props) {

  if (!props.eventIsSelected) {
    return null
  } else {
    const eventData = props.csvData[props.eventSelection]
    return(
      <SideSheet
        isShown={props.eventSelection != null}
        onCloseComplete={() => props.setEventIsSelected(false)}
        position={Position.LEFT}
        height='300px'>

          <CodeMirror
            value={JSON.stringify(eventData, null, 2)}
            extensions={[json()]}/>
        </SideSheet>
      )
  }
}

function Configuration(props) {

  const [userIDField, setUserIDField] = useState('')
  const [anonymousIDField, setAnonymousIDField] = useState('')
  const [timestampField, setTimestampField] = useState('')
  const [eventNameField, setEventNameField] = useState('')
  const [writeKey, setWriteKey] = useState('')
  const [hasTrack, setHasTrack] = useState(false)
  const [hasIdentify, setHasIdentify] = useState(false)
  const [transformationList, setTransformationList] = useState([])

  const data:ImportConfig = {
    filePath:props.csvData,
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
    <Pane borderLeft={majorScale(50)}>
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
      csvData={props.csvData}/>
      <Button
      appearance="primary"
      onClick={() => {importToSegment()}}>
        Import
      </Button>
      {console.log(data)}
    </Pane>
  )
}

function EventTypeSwitch(props) {
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

function WriteKeyForm(props) {
  const [value, setValue] = React.useState('')
  return (
    <TextInputField
    required={props.required | true}
    value={value}
    label='Write Key'
    onChange={e =>{
      setValue(e.target.value)
      props.onChange(e.target.value)
    }}/>
  )
}

function SettingSelector(props) {
  if (props.isShown) {
    return (
      <Pane>
        <SelectField
          options={props.options}
          label={props.label}
          required={props.required}
          hint={props.hint}
          description={props.description}
          onChange={e => {
            props.onChange(e.target.value)
          }}>
            <option value={null}/>
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

function Transformations(props){
  const columns=Object.keys(props.csvData[0])

  function handleAdd(item){
    const newList = props.transformationList.concat({...item, id: uuidv4()});
    props.setTransformationList(newList)
  }

  function handleRemoval(id){
    const newList = props.transformationList.filter((transformation) => transformation.id !== id)
    props.setTransformationList(newList)
  }

  return(
      <Pane marginY={majorScale(2)}>
        <Heading> Transformations </Heading>
        {props.transformationList.map((transformation)=>(
          <TransformationDisplay
          transformation={transformation}
          handleRemoval={handleRemoval}
          />
        ))}
        <Pane marginY={majorScale(2)}>
          <AddTransformation columns={columns} handleAdd={handleAdd}/>
        </Pane>
      </Pane>
  )
}

function TransformationDisplay(props){
  return (
    <StatefulRow key={props.transformation.index}>
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

function AddTransformation(props){
  const [addTransformation, setAddTransformation] = useState(false)

  if (addTransformation==true) {
    return(
      <Pane>
        <TransformationTypeMenu
        columns={props.columns}
        setAddTransformation={setAddTransformation}
        handleAdd={props.handleAdd}
        transformationList={props.transformationList}
        />
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

function TransformationTypeMenu (props) {
  const [transformationType, setTransformationType] = useState(null)
  const [transformationTarget, setTransformationTarget] = useState(null)
  const [transformationConditional, setTransformationConditional] = useState(null)
  const [selected, setSelected] = useState(null)

  return (
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
          setTransformationType(item.value)
          setSelected(item.value)
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
          setTransformationType(null)
          setTransformationTarget(null)
          setTransformationConditional(null)
          props.setAddTransformation(false)
        }}>
        delete
      </Button>
      <Button
        marginLeft={majorScale(1)}
        intent='success'
        onClick={()=>{
          if (transformationType && transformationTarget && transformationConditional){
              props.handleAdd({type:transformationType, target:transformationTarget, conditional:transformationConditional})
          }
          setTransformationType(null)
          setTransformationTarget(null)
          setTransformationConditional(null)
          props.setAddTransformation(false)
        }}>
        save
      </Button>
    </Pane>
  )
}
function TransformationTarget(props) {
  const [selected, setSelected] = React.useState(null)

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
            setSelected(item.value)
            props.setTransformationTarget(item.value)
          }}>
          <Button>{selected || 'Select Column...'}</Button>
        </SelectMenu>
      </Pane>
    )
  }
}

function TransformationConditional(props) {
  const [selected, setSelected] = React.useState(null)

  if (!props.transformationType){
    return null
  } else if (props.transformationType == 'Ignore Column') {
    return(
      <Pane
      marginx={majorScale(2)}
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
            setSelected(item.value)
            props.setTransformationConditional(item.value)
          }}>
          <Button>{selected || 'Select Conditional...'}</Button>
        </SelectMenu>
      </Pane>
    )
  }
}

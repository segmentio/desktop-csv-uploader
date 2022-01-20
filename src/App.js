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
  majorScale
} from 'evergreen-ui';



function App() {
  const [csvData, setCSVData] = useState(null)
  const [eventSelection, setEventSelection] = useState(null)
  const [eventIsSelected, setEventIsSelected] = useState(false)

  useEffect( () => {
    window.api.on("csv-loaded", (data) => {setCSVData(data)})
    return () => window.api.removeAllListeners("csv-loaded");
  }
)
  return (
    <div className="App">
        <Pane
        display="grid"
        gridTemplateColumns= "1fr 5fr">
          <CustomMenu/>
          <CSVWorkspace
          csvData={csvData}
          eventSelection={eventSelection}
          setEventSelection={setEventSelection}
          eventIsSelected={eventIsSelected}
          setEventIsSelected={setEventIsSelected}
          />
        </Pane>
    </div>
  );
}

export default App;

class CustomMenu extends React.Component {
  render() {
    return (
      <Menu>
        <Menu.Group>
          <Pane>
            <Menu.Item>
            Importer
            </Menu.Item>
          </Pane>
          <Pane>
              <Menu.Item
              onSelect={() => {console.log("history")}}>
              History
              </Menu.Item>
          </Pane>
          <Pane>
              <Menu.Item> Settings </Menu.Item>
          </Pane>
        </Menu.Group>
      </Menu>
    );
  }
}

function CSVWorkspace(props){
  const [previewedEvents, setPreviewedEvents] = useState([])
  useEffect(()=>{
    window.api.on('event-preview-updated', (data) => {
      setPreviewedEvents(data)
      console.log(data)
      console.log('event-preview-updated')
    });

    return () => window.api.removeAllListeners('event-preview-updated');
  })
  if (props.csvData){
    return(
      <Pane
      display="grid"
      gridTemplateColumns="1fr 1fr"
      marginY={majorScale(4)}>
        <Pane>
        <Heading>Historical Events</Heading>
          <CSVTable
          csvData={props.csvData}
          setEventSelection={props.setEventSelection}
          setEventIsSelected={props.setEventIsSelected}/>
          {console.log(previewedEvents)}
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
        size="500px"
        dispaly='inline-block'>
        Import CSV, or work from Your Import History
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
    isSelectable
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

  const [userIDField, setUserIDField] = useState(null)
  const [anonymousIDField, setAnonymousIDField] = useState(null)
  const [timestampField, setTimestampField] = useState(null)
  const [eventNameField, setEventNameField] = useState(null)
  const [writeKey, setWriteKey] = useState(null)
  const [hasTrack, setHasTrack] = useState(false)
  const [hasIdentify, setHasIdentify] = useState(false)

  const data = {
    csvData:props.csvData,
    userIdField: userIDField,
    anonymousIdField: anonymousIDField,
    timestampField: timestampField,
    eventField: eventNameField,
    writeKey: writeKey,
    eventTypes: {
      track: hasTrack,
      identify:hasIdentify
    },
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
      <SettingSelector options={props.columnNames} label="UserID Field" onChange={setUserIDField} />
      <SettingSelector options={props.columnNames} label="AnonymousID Field" onChange={setAnonymousIDField} />
      <SettingSelector options={props.columnNames} label="Timestamp Field" onChange={setTimestampField} />
      <SettingSelector options={props.columnNames} label="Event Field" onChange={setEventNameField} />
      <Transformation />
      <Button
      appearance="primary"
      onClick={() => importToSegment()}>
        Import
      </Button>
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

function Transformation(props){
  return <Text paddingY={majorScale(16)}>transformation</Text>
}

function WriteKeyForm(props) {
  const [value, setValue] = React.useState('')
  return (
    <TextInputField
    required
    value={value}
    label='Write Key'
    onChange={e =>{
    setValue(e.target.value)
    props.onChange(e.target.value)
  }}/>
)
}
function SettingSelector(props) {
  return (
    <SelectField
      options={props.options}
      label={props.label}
      required
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
  )
}

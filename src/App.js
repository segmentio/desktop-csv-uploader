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
  majorScale
} from 'evergreen-ui';



function App() {
  const [csvData, setCSVData] = useState(null)
  const [eventSelection, setEventSelection] = useState(null)
  const [eventIsSelected, setEventIsSelected] = useState(false)
  const [userIDField, setUserIDField] = useState(null)
  const [anonymousIDField, setAnonymousIDField] = useState(null)
  const [timestampField, setTimestampField] = useState(null)
  const [eventNameField, setEventNameField] = useState(null)
  const [writeKey, setWriteKey] = useState(null)
  const [eventType, setEventType] = useState(null)

  const importToSegment = () => {
    const data = {
      'csvData':csvData,
      'userIDField': userIDField,
      'anonymousIDField': anonymousIDField,
      'timestampField': timestampField,
      'EventNameField': eventNameField,
      //need to implement
      'writeKey': writeKey,
      'eventType': eventType
    }
    console.log(data)
    window.api.send('import-to-segment', data)
  }

  useEffect( () => {
    window.api.on("csv-data-imported", (data) => {setCSVData(data)})
    return () => window.api.removeAllListeners("csv-data-imported");
  }
)
  return (
    <div className="App">
    <h1>{userIDField} test</h1>
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
          setUserIDField={setUserIDField}
          setAnonymousIDField={setAnonymousIDField}
          setTimestampField={setTimestampField}
          setWriteKey={setWriteKey}
          setEventType={setEventType}
          importToSegment={importToSegment}
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
            <Menu.Item
            onSelect={() => {
              console.log("import-csv")
              window.api.send("import-csv")
              }}>
            Import CSV
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
  if (props.csvData){
    return(
      <Pane
      display="grid"
      gridTemplateColumns= "1fr 1fr"
      marginY={majorScale(4)}>
        <Pane>
          <CSVTable
          csvData={props.csvData}
          setEventSelection={props.setEventSelection}
          setEventIsSelected={props.setEventIsSelected}/>
          <EventPreview
          csvData={props.csvData}
          eventSelection={props.eventSelection}
          eventIsSelected={props.eventIsSelected}
          setEventIsSelected={props.setEventIsSelected}
          />
        </Pane>
        <Pane
        marginX={majorScale(4)}>
          <Configuration
          importToSegment={props.importToSegment}
          columnNames={Object.keys(props.csvData[0])}
          setUserIDField={props.setUserIDField}
          setAnonymousIDField={props.setAnonymousIDField}
          setTimestampField={props.setTimestampField}
          setWriteKey={props.writeKey}
          />
        </Pane>
      </Pane>
    )
  } else {
    return (
      <Pane
      text-align='center'>
        <Text
        color="muted"
        size="500px"
        margin="auto"
        dispaly='inline-block'>
        Import CSV, or work from Your Import History
        </Text>
      </Pane>
    )
  }
}
function CSVTable (props){
  let csvHeader = []
  let csvRows = []

  if (!props.csvData) {
    return( <Pane> no data {console.log(props)} </Pane>)
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
        position={Position.BOTTOM}
        height='300px'>

          <CodeMirror
            value={JSON.stringify(eventData, null, 2)}
            extensions={[json()]}

            // onChange={(value, viewUpdate) => {
            //     console.log('value:', value);
            //   }}
              />
        </SideSheet>
      )
  }
}

function Configuration(props) {

  return(
    <Pane borderLeft={majorScale(50)}>
      <Heading>
        Configuration
      </Heading>
      <WriteKeyForm label='Segment Write Key' onChange={props.setWriteKey}/>
      <SettingSelector options={props.columnNames} label="UserID Field" onChange={props.setUserIDField}/>
      <SettingSelector options={props.columnNames} label="AnonymousID Field" onChange={props.setAnonymousIDField}/>
      <SettingSelector options={props.columnNames} label="Timestamp Field" onChange={props.setTimestampField}/>
      <SettingSelector options={props.columnNames} label="Event Field" onChange={props.setEventNameField}/>
      <Transformation/>
      <Button
      appearance="primary"
      onClick={
        () => props.importToSegment()
      }>
        Import
      </Button>
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

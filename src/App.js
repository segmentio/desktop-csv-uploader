import React, {useEffect, useState} from 'react';
import {Pane, Menu, Table} from 'evergreen-ui';

function App() {
  const [csvData, setCSVData] = useState(null)

  useEffect( () => {
//     window.api.send(csvData)
    window.api.on("csv-data-imported", (data) => {
      window.console.log("csv-data-imported");
      setCSVData(data)
    })
    return () => window.api.removeAllListeners("csv-data-imported");
  }
)
  return (
    <div className="App">
        <Pane
        display="grid"
        gridTemplateColumns= "1fr 3fr 3fr">
          <CustomMenu/>
          <CSVGrid csvData={csvData}/>
          <EventPreview />
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
              }}
            >
            Import CSV
            </Menu.Item>
          </Pane>

          <Pane>
              <Menu.Item
              onSelect={() => {console.log("history")}}>
              Import History
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

function CSVGrid (props){
  let csvHeader = []
  let csvRows = []

  if (!props.csvData) {
    return( <Pane> no data {console.log(props)} </Pane>)
  }else {
    csvHeader = Object.keys(props.csvData[0])
    csvRows = props.csvData


    return(
      <Pane>
      <Table>
        <Table.Head>
          <Table.Row flexGrow={1}>
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
                <Table.Row key={index} isSelectable flexGrow={1}>
                  {Object.keys(row).map(
                    key =>
                      <Table.TextCell>
                        {row[key]}
                      </Table.TextCell>
                  )}
                </Table.Row>
            )
          }
        </Table.Body>
      </Table>
      </Pane>
)
  }
}

function EventPreview(props) {
  return(
  <Pane>
  preview
  </Pane>
)
}

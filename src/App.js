import React, {useEffect, useState} from 'react';
import {Pane, Menu} from 'evergreen-ui';

function App() {
  const [csvData, setCSVData] = useState(null)

  useEffect( () => {
//     window.api.send(csvData)
    window.api.on("csv-data-imported", (data) => {
      window.console.log("csv-data-imported");
      window.console.log(data)
    })
  }
)
  return (
    <div className="App">
        <Pane
        display="grid"
        gridTemplateColumns= "1fr 3fr 3fr">
          <CustomMenu/>
          <CSVGrid currentCSV={csvData}/>
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
  const csvHeader = []
  const csvRows = []

  if (!props) {
    return( <Pane> hey import some stuff </Pane>)
  }else {
    return(<Pane>{props.data}</Pane>)
  }
}

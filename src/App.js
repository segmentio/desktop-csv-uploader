import React from 'react';
import {Pane, Menu, MajorScale} from 'evergreen-ui';

function App() {
  const [currentCSV, setCurrentCSV] = React.useState(null)

  return (
    <div className="App">
      <header className="App-header">
      <Pane
      display="grid"
      gridTemplateColumns= "1fr 3fr 3fr">
        <CustomMenu/>
        <CSVSpace/>
      </Pane>
      </header>
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
          {window.api.on("response", (data) => {
    console.log(`Received ${data} from main process`);
})}

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

const CSVSpace = () => {
  return(
    <Pane>
    CSVDISPLAY
    </Pane>
  )
}

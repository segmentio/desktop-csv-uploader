"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const uuid_1 = require("uuid");
const react_codemirror_1 = __importDefault(require("@uiw/react-codemirror"));
const lang_json_1 = require("@codemirror/lang-json");
const evergreen_ui_1 = require("evergreen-ui");
function App() {
    const [csvData, setCSVData] = (0, react_1.useState)(null);
    const [eventSelection, setEventSelection] = (0, react_1.useState)(null);
    const [eventIsSelected, setEventIsSelected] = (0, react_1.useState)(false);
    const [menuSelection, setMenuSelection] = (0, react_1.useState)('Importer');
    (0, react_1.useEffect)(() => {
        window.api.on("csv-loaded", (data) => { setCSVData(data); });
        return () => window.api.removeAllListeners("csv-loaded");
    });
    return (<div className="App">
        <evergreen_ui_1.Pane display="grid" gridTemplateColumns="1fr 5fr">
          <CustomMenu setMenuSelection={setMenuSelection}/>
          <ViewWrapper csvData={csvData} eventSelection={eventSelection} eventIsSelected={eventIsSelected} menuSelection={menuSelection}/>
        </evergreen_ui_1.Pane>
    </div>);
}
exports.default = App;
function CustomMenu(props) {
    return (<evergreen_ui_1.Menu>
        <evergreen_ui_1.Menu.Group>
          <evergreen_ui_1.Pane>
            <evergreen_ui_1.Menu.Item onSelect={() => { props.setMenuSelection('Importer'); }}>
              Importer
            </evergreen_ui_1.Menu.Item>
          </evergreen_ui_1.Pane>
          <evergreen_ui_1.Pane>
              <evergreen_ui_1.Menu.Item onSelect={() => { props.setMenuSelection('History'); }}>
                History
              </evergreen_ui_1.Menu.Item>
          </evergreen_ui_1.Pane>
          <evergreen_ui_1.Pane>
              <evergreen_ui_1.Menu.Item>
                Settings
              </evergreen_ui_1.Menu.Item>
          </evergreen_ui_1.Pane>
        </evergreen_ui_1.Menu.Group>
      </evergreen_ui_1.Menu>);
}
function ViewWrapper(props) {
    if (props.menuSelection == 'Importer') {
        return (<CSVWorkspace csvData={props.csvData} eventSelection={props.eventSelection} setEventSelection={props.setEventSelection} eventIsSelected={props.eventIsSelected} setEventIsSelected={props.setEventIsSelected}/>);
    }
    else if (props.menuSelection == 'History') {
        return (<History />);
    }
}
function CSVWorkspace(props) {
    const [previewedEvents, setPreviewedEvents] = (0, react_1.useState)([]);
    const [importComplete, setImportComplete] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        window.api.on('event-preview-updated', (data) => {
            setPreviewedEvents(data);
            console.log('event-preview-updated');
        });
        window.api.on('import-complete', (count) => {
            evergreen_ui_1.toaster.success('Import Successful!', { description: 'Check the source debugger in your Segment workspace!' });
            console.log('import-complete');
        });
        window.api.on('import-error', (error) => {
            console.log(error);
            evergreen_ui_1.toaster.danger('Oops Something went wrong... ', { description: error });
            console.log('import-error');
        });
        return () => {
            window.api.removeAllListeners('event-preview-updated');
            window.api.removeAllListeners('import-complete');
            window.api.removeAllListeners('import-error');
        };
    });
    if (props.csvData) {
        return (<evergreen_ui_1.Pane display="grid" gridTemplateColumns="1fr 1fr" marginY={(0, evergreen_ui_1.majorScale)(4)}>
        <evergreen_ui_1.Pane>
        <evergreen_ui_1.Heading>CSV Events</evergreen_ui_1.Heading>
          <CSVTable csvData={props.csvData} setEventSelection={props.setEventSelection} setEventIsSelected={props.setEventIsSelected}/>
          <EventPreview csvData={previewedEvents.length > 0 ? previewedEvents : props.csvData} eventSelection={props.eventSelection} eventIsSelected={props.eventIsSelected} setEventIsSelected={props.setEventIsSelected}/>
        </evergreen_ui_1.Pane>
        <evergreen_ui_1.Pane marginX={(0, evergreen_ui_1.majorScale)(4)}>
          <Configuration columnNames={Object.keys(props.csvData[0])} csvData={props.csvData}/>
        </evergreen_ui_1.Pane>
      </evergreen_ui_1.Pane>);
    }
    else {
        return (<evergreen_ui_1.Pane text-align='center' margin={(0, evergreen_ui_1.majorScale)(10)}>
        <evergreen_ui_1.Text color="muted" size={600} display='inline-block' marginY={(0, evergreen_ui_1.majorScale)(2)}>
        Import a CSV file, or work from your Import History
        </evergreen_ui_1.Text>
        <evergreen_ui_1.FilePicker onChange={filePath => {
                console.log("load-csv", filePath);
                window.api.send("load-csv", filePath[0].path);
            }}/>
      </evergreen_ui_1.Pane>);
    }
}
function History(props) {
    const [history, setHistory] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        window.api.send('load-history', null);
        window.api.on('history-loaded', (data) => {
            console.log('history-loaded');
            setHistory(data);
        });
        return () => {
            window.api.removeAllListeners('load-history');
            window.api.removeAllListeners('history-loaded');
        };
    }, []);
    if (history) {
        return (<evergreen_ui_1.Pane marginY={(0, evergreen_ui_1.majorScale)(4)}>
    <evergreen_ui_1.Heading>Import History</evergreen_ui_1.Heading>
      <evergreen_ui_1.Table>
        <evergreen_ui_1.Table.Head>
            <evergreen_ui_1.Table.TextHeaderCell>
                Import Name
            </evergreen_ui_1.Table.TextHeaderCell>
            <evergreen_ui_1.Table.TextHeaderCell>
                Size
            </evergreen_ui_1.Table.TextHeaderCell>
            <evergreen_ui_1.Table.TextHeaderCell>
                Status
            </evergreen_ui_1.Table.TextHeaderCell>
        </evergreen_ui_1.Table.Head>
        <evergreen_ui_1.Table.Body height={240}>
  {history.map((row) => (<evergreen_ui_1.Table.Row key={row} isSelectable>
      <evergreen_ui_1.Table.TextCell>{row.size}</evergreen_ui_1.Table.TextCell>
      <evergreen_ui_1.Table.TextCell isNumber>{row.success}</evergreen_ui_1.Table.TextCell>
    </evergreen_ui_1.Table.Row>))}
        </evergreen_ui_1.Table.Body>
      </evergreen_ui_1.Table>
    </evergreen_ui_1.Pane>);
    }
    else {
        return (<evergreen_ui_1.Pane>
      no history
      </evergreen_ui_1.Pane>);
    }
}
function CSVTable(props) {
    let csvHeader = [];
    let csvRows = [];
    if (!props.csvData) {
        return (<evergreen_ui_1.Pane> no data </evergreen_ui_1.Pane>);
    }
    else {
        csvHeader = Object.keys(props.csvData[0]);
        csvRows = props.csvData;
        return (<evergreen_ui_1.Pane display='block' width='600px' height='auto' overflow='auto'>
      <evergreen_ui_1.Pane width='2000px'>
      <evergreen_ui_1.Table id='table'>
        <evergreen_ui_1.Table.Head id='table-head' padding='0px'>
          <evergreen_ui_1.Table.Row id='row' flexGrow={1} padding-right='0px'>
            {csvHeader.map(columnName => <evergreen_ui_1.Table.TextHeaderCell>
              {columnName}
              </evergreen_ui_1.Table.TextHeaderCell>)}
          </evergreen_ui_1.Table.Row>
        </evergreen_ui_1.Table.Head>
        <evergreen_ui_1.Table.Body>
          {csvRows.map((row, index) => <StatefulRow isSelectable={true} index={index} setEventSelection={props.setEventSelection} setEventIsSelected={props.setEventIsSelected}>
                  {Object.keys(row).map(key => <evergreen_ui_1.Table.TextCell>
                        {row[key]}
                      </evergreen_ui_1.Table.TextCell>)}
                </StatefulRow>)}
        </evergreen_ui_1.Table.Body>
      </evergreen_ui_1.Table>
      </evergreen_ui_1.Pane>
      </evergreen_ui_1.Pane>);
    }
}
function StatefulRow(props) {
    const [rowNumber, setRowNumber] = (0, react_1.useState)(props.index);
    return (<evergreen_ui_1.Table.Row key={props.index} isSelectable={props.isSelectable} flexGrow={1} onSelect={() => {
            props.setEventSelection(rowNumber);
            props.setEventIsSelected(true);
        }}>
      {props.children}
    </evergreen_ui_1.Table.Row>);
}
function EventPreview(props) {
    if (!props.eventIsSelected) {
        return null;
    }
    else {
        const eventData = props.csvData[props.eventSelection];
        return (<evergreen_ui_1.SideSheet isShown={props.eventSelection != null} onCloseComplete={() => props.setEventIsSelected(false)} position={evergreen_ui_1.Position.LEFT} height='300px'>

          <react_codemirror_1.default value={JSON.stringify(eventData, null, 2)} extensions={[(0, lang_json_1.json)()]}/>
        </evergreen_ui_1.SideSheet>);
    }
}
function Configuration(props) {
    const [userIDField, setUserIDField] = (0, react_1.useState)(null);
    const [anonymousIDField, setAnonymousIDField] = (0, react_1.useState)(null);
    const [timestampField, setTimestampField] = (0, react_1.useState)(null);
    const [eventNameField, setEventNameField] = (0, react_1.useState)(null);
    const [writeKey, setWriteKey] = (0, react_1.useState)(null);
    const [hasTrack, setHasTrack] = (0, react_1.useState)(false);
    const [hasIdentify, setHasIdentify] = (0, react_1.useState)(false);
    const [transformationList, setTransformationList] = (0, react_1.useState)([]);
    const data = {
        csvData: props.csvData,
        userIdField: userIDField,
        anonymousIdField: anonymousIDField,
        timestampField: timestampField,
        eventField: eventNameField,
        writeKey: writeKey,
        eventTypes: {
            track: hasTrack,
            identify: hasIdentify
        },
        transformationList: transformationList
    };
    (0, react_1.useEffect)(() => {
        window.api.send('update-event-preview', data);
        console.log('ui-update-event-preview');
    }, [
        userIDField,
        anonymousIDField,
        timestampField,
        eventNameField,
        hasTrack,
        hasIdentify,
    ]);
    const importToSegment = () => {
        window.api.send('import-to-segment', data);
        console.log('import-to-segment');
    };
    return (<evergreen_ui_1.Pane borderLeft={(0, evergreen_ui_1.majorScale)(50)}>
      <evergreen_ui_1.Heading> Configuration </evergreen_ui_1.Heading>
      <WriteKeyForm label='Segment Write Key' onChange={setWriteKey}/>
      <evergreen_ui_1.Pane marginBottom={(0, evergreen_ui_1.majorScale)(4)}>
        <evergreen_ui_1.Heading> Event Types </evergreen_ui_1.Heading>
        <EventTypeSwitch label='Track' onChange={setHasTrack}/>
        <EventTypeSwitch label='Identify' onChange={setHasIdentify}/>
      </evergreen_ui_1.Pane>
      <SettingSelector options={props.columnNames} label="UserId Field" hint='Either a userId or anonymousId is required' required={anonymousIDField || userIDField ? false : true} onChange={setUserIDField} isShown={true}/>
      <SettingSelector options={props.columnNames} label="AnonymousId Field" hint='Either a userId or anonymousId is required' required={anonymousIDField || userIDField ? false : true} onChange={setAnonymousIDField} isShown={true}/>
      <SettingSelector options={props.columnNames} label="Timestamp Field" hint="If you don't provide a time stamp, Segment will use the current time" required={timestampField ? false : true} onChange={setTimestampField} isShown={true}/>
      <SettingSelector options={props.columnNames} label="Event Field" hint="No event field, no worries! Just apply a transformation to attach a defalut event name to your track calls" required={false} onChange={setEventNameField} isShown={hasTrack ? true : false}/>
      <Transformations transformationList={transformationList} setTransformationList={setTransformationList} csvData={props.csvData}/>
      <evergreen_ui_1.Button appearance="primary" onClick={() => { importToSegment(); }}>
        Import
      </evergreen_ui_1.Button>
      {console.log(data)}
    </evergreen_ui_1.Pane>);
}
function EventTypeSwitch(props) {
    const [checked, setChecked] = react_1.default.useState(false);
    return (<evergreen_ui_1.Pane margin={(0, evergreen_ui_1.majorScale)(2)}>
      <evergreen_ui_1.Text size={400} color={'default'}>
        {props.label}
      </evergreen_ui_1.Text>
      <evergreen_ui_1.Switch checked={checked} onChange={(e) => {
            setChecked(e.target.checked);
            props.onChange(e.target.checked);
        }}/>
    </evergreen_ui_1.Pane>);
}
function WriteKeyForm(props) {
    const [value, setValue] = react_1.default.useState('');
    return (<evergreen_ui_1.TextInputField required={props.required | true} value={value} label='Write Key' onChange={e => {
            setValue(e.target.value);
            props.onChange(e.target.value);
        }}/>);
}
function SettingSelector(props) {
    if (props.isShown) {
        return (<evergreen_ui_1.Pane>
        <evergreen_ui_1.SelectField options={props.options} label={props.label} required={props.required} hint={props.hint} description={props.description} onChange={e => {
                props.onChange(e.target.value);
            }}>
            <option value={null}/>
            {props.options.map(option => <option value={option}>
              {option}
              </option>)}
        </evergreen_ui_1.SelectField>
      </evergreen_ui_1.Pane>);
    }
    else {
        return null;
    }
}
function Transformations(props) {
    const columns = Object.keys(props.csvData[0]);
    function handleAdd(item) {
        const newList = props.transformationList.concat(Object.assign(Object.assign({}, item), { id: (0, uuid_1.v4)() }));
        props.setTransformationList(newList);
    }
    function handleRemoval(id) {
        const newList = props.transformationList.filter((transformation) => transformation.id !== id);
        props.setTransformationList(newList);
    }
    return (<evergreen_ui_1.Pane marginY={(0, evergreen_ui_1.majorScale)(2)}>
        <evergreen_ui_1.Heading> Transformations </evergreen_ui_1.Heading>
        {props.transformationList.map((transformation) => (<TransformationDisplay transformation={transformation} handleRemoval={handleRemoval}/>))}
        <evergreen_ui_1.Pane marginY={(0, evergreen_ui_1.majorScale)(2)}>
          <AddTransformation columns={columns} handleAdd={handleAdd}/>
        </evergreen_ui_1.Pane>
      </evergreen_ui_1.Pane>);
}
function TransformationDisplay(props) {
    return (<StatefulRow key={props.transformation.index}>
      <evergreen_ui_1.Pane marginY={(0, evergreen_ui_1.majorScale)(3)} marginX={(0, evergreen_ui_1.majorScale)(1)}>
        <evergreen_ui_1.Button marginRight={(0, evergreen_ui_1.majorScale)(1)}>
        {props.transformation.type}
        </evergreen_ui_1.Button>

        <evergreen_ui_1.Button marginRight={(0, evergreen_ui_1.majorScale)(1)}>
        {props.transformation.target}
        </evergreen_ui_1.Button>
        <evergreen_ui_1.Text marginRight={(0, evergreen_ui_1.majorScale)(1)}>for</evergreen_ui_1.Text>
        <evergreen_ui_1.Button marginRight={(0, evergreen_ui_1.majorScale)(1)}>
        {props.transformation.conditional}
        </evergreen_ui_1.Button>
        <evergreen_ui_1.Button marginLeft={(0, evergreen_ui_1.majorScale)(1)} intent='danger' onClick={() => props.handleRemoval(props.transformation.id)}>
          delete
        </evergreen_ui_1.Button>
      </evergreen_ui_1.Pane>
    </StatefulRow>);
}
function AddTransformation(props) {
    const [addTransformation, setAddTransformation] = (0, react_1.useState)(false);
    if (addTransformation == true) {
        return (<evergreen_ui_1.Pane>
        <TransformationTypeMenu columns={props.columns} setAddTransformation={setAddTransformation} handleAdd={props.handleAdd} transformationList={props.transformationList}/>
      </evergreen_ui_1.Pane>);
    }
    else {
        return (<evergreen_ui_1.Button onClick={() => setAddTransformation(true)}>
    Add Transformation
      </evergreen_ui_1.Button>);
    }
}
function TransformationTypeMenu(props) {
    const [transformationType, setTransformationType] = (0, react_1.useState)(null);
    const [transformationTarget, setTransformationTarget] = (0, react_1.useState)(null);
    const [transformationConditional, setTransformationConditional] = (0, react_1.useState)(null);
    const [selected, setSelected] = (0, react_1.useState)(null);
    return (<evergreen_ui_1.Pane marginY={(0, evergreen_ui_1.majorScale)(2)} display="inline-flex">
      <evergreen_ui_1.SelectMenu title="Transformation Type" options={['Ignore Column', ''].map((label) => ({ label, value: label }))} selected={transformationType} hasFilter={false} hasTitle={false} onSelect={(item) => {
            setTransformationType(item.value);
            setSelected(item.value);
        }}>
        <evergreen_ui_1.Button>{selected || 'Select Transformation Type'}</evergreen_ui_1.Button>
      </evergreen_ui_1.SelectMenu>

      <TransformationTarget columns={props.columns} transformationType={transformationType} setTransformationTarget={setTransformationTarget}/>
      <TransformationConditional transformationType={transformationType} setTransformationConditional={setTransformationConditional}/>
      <evergreen_ui_1.Button marginLeft={(0, evergreen_ui_1.majorScale)(2)} intent='danger' onClick={() => {
            setTransformationType(null);
            setTransformationTarget(null);
            setTransformationConditional(null);
            props.setAddTransformation(false);
        }}>
        delete
      </evergreen_ui_1.Button>
      <evergreen_ui_1.Button marginLeft={(0, evergreen_ui_1.majorScale)(1)} intent='success' onClick={() => {
            if (transformationType && transformationTarget && transformationConditional) {
                props.handleAdd({ type: transformationType, target: transformationTarget, conditional: transformationConditional });
            }
            setTransformationType(null);
            setTransformationTarget(null);
            setTransformationConditional(null);
            props.setAddTransformation(false);
        }}>
        save
      </evergreen_ui_1.Button>
    </evergreen_ui_1.Pane>);
}
function TransformationTarget(props) {
    const [selected, setSelected] = react_1.default.useState(null);
    if (!props.transformationType) {
        return null;
    }
    else if (props.transformationType == 'Ignore Column') {
        return (<evergreen_ui_1.Pane marginX={(0, evergreen_ui_1.majorScale)(1)}>

        <evergreen_ui_1.SelectMenu options={props.columns.map((label) => ({ label, value: label }))} selected={selected} hasFilter={false} hasTitle={false} onSelect={(item) => {
                setSelected(item.value);
                props.setTransformationTarget(item.value);
            }}>
          <evergreen_ui_1.Button>{selected || 'Select Column...'}</evergreen_ui_1.Button>
        </evergreen_ui_1.SelectMenu>
      </evergreen_ui_1.Pane>);
    }
}
function TransformationConditional(props) {
    const [selected, setSelected] = react_1.default.useState(null);
    if (!props.transformationType) {
        return null;
    }
    else if (props.transformationType == 'Ignore Column') {
        return (<evergreen_ui_1.Pane marginx={(0, evergreen_ui_1.majorScale)(2)} display="inline-flex">
        <evergreen_ui_1.Text marginTop={(0, evergreen_ui_1.majorScale)(1)} marginRight={(0, evergreen_ui_1.majorScale)(1)}>
        For
        </evergreen_ui_1.Text>
        <evergreen_ui_1.SelectMenu title="columnName = " options={['All Events', 'Track Events', 'Identify Events'].map((label) => ({ label, value: label }))} selected={selected} hasFilter={false} hasTitle={false} onSelect={(item) => {
                setSelected(item.value);
                props.setTransformationConditional(item.value);
            }}>
          <evergreen_ui_1.Button>{selected || 'Select Conditional...'}</evergreen_ui_1.Button>
        </evergreen_ui_1.SelectMenu>
      </evergreen_ui_1.Pane>);
    }
}

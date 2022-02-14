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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const analytics_node_1 = __importDefault(require("analytics-node"));
//@ts-ignore
const dbQueries_1 = require("../dist/utils/dbQueries");
// IPC listeners
electron_1.ipcRenderer.on('load-csv', (_, filePath) => {
    let csvResults = [];
    const stream = CSVStream(filePath, { linesNeeded: 10 });
    stream.on('data', (data) => { csvResults.push(data); });
    stream.on('close', () => electron_1.ipcRenderer.send('csv-loaded', csvResults));
});
function CSVStream(filePath, options) {
    const csvStream = fs.createReadStream(filePath).pipe((0, csv_parser_1.default)({ separator: '|' })); // pipe converts read streams into writable streams
    let lineCounter = 0;
    csvStream.on('data', () => {
        lineCounter++;
        if (options != undefined && lineCounter == options.linesNeeded) {
            csvStream.destroy();
        }
    });
    return csvStream;
}
electron_1.ipcRenderer.on('import-to-segment', (_, config) => {
    try {
        const analytics = new analytics_node_1.default(config.writeKey);
        const stream = CSVStream(config.filePath);
        const transformations = sortTransformations(config.transformationList);
        if (!config.eventTypes.track && !config.eventTypes.identify) {
            throw new Error("No event types selected");
        }
        stream.on('data', (row) => {
            const events = formatSegmentCalls(row, config, transformations);
            try {
                if (events.track) {
                    analytics.track(events.track);
                }
                if (events.identify) {
                    analytics.identify(events.identify);
                }
            }
            catch (_a) {
                (error) => {
                    error.message = error.message + ' This error occurred on line: ';
                    throw error;
                };
            }
        });
        stream.on('close', () => {
            electron_1.ipcRenderer.send('import-complete', config);
            const values = { config: JSON.stringify(config) };
            (0, dbQueries_1.insertImportRecord)(values);
            console.log('importer-importing-to-segment');
        });
    }
    catch (_a) {
        (error) => {
            console.log(error);
            electron_1.ipcRenderer.send('import-error', error.message);
        };
    }
});
electron_1.ipcRenderer.on('update-event-preview', (_, updateData) => {
    const transformations = sortTransformations(updateData.config.transformationList);
    let previewEvents = [];
    for (let i = 0; i < updateData.csvData.length; i++) {
        if (updateData.config.eventTypes['track']) {
            const events = formatSegmentCalls(updateData.csvData[i], updateData.config, transformations);
            previewEvents.push(events);
        }
    }
    electron_1.ipcRenderer.send('event-preview-updated', previewEvents);
});
electron_1.ipcRenderer.on('load-history', () => {
    const history = (0, dbQueries_1.getAllImports)();
    console.log(history);
    electron_1.ipcRenderer.send('history-loaded', history);
});
function formatSegmentCalls(csvRow, config, transformations) {
    let formattedEvents = {};
    let sendTrack = false;
    let sendIdentify = false;
    if (config.eventTypes.track) { //need to implement an ignore row transform here
        sendTrack = true;
    }
    if (config.eventTypes.identify) { //need to implement an ignore row transform here
        sendIdentify = true;
    }
    const allFields = Object.keys(csvRow);
    const { eventField, anonymousIdField, userIdField, timestampField } = config, rest = __rest(config, ["eventField", "anonymousIdField", "userIdField", "timestampField"]);
    const fieldsToIgnore = [eventField, anonymousIdField, userIdField, timestampField];
    if (sendTrack) {
        let trackFieldsToIgnore = fieldsToIgnore.concat(transformations.ignoreColumn.trackEvents, transformations.ignoreColumn.allEvents);
        const propFields = distillFields(trackFieldsToIgnore, allFields);
        const trackEvent = formatTrackEvent(csvRow, config, propFields);
        formattedEvents.track = trackEvent;
    }
    if (sendIdentify) {
        var identifyFieldsToIgnore = fieldsToIgnore.concat(transformations.ignoreColumn.identifyEvents, transformations.ignoreColumn.allEvents);
        const traitFields = distillFields(identifyFieldsToIgnore, allFields);
        const identifyEvent = formatIdentifyEvent(csvRow, config, traitFields);
        formattedEvents.identify = identifyEvent;
    }
    return formattedEvents;
}
function formatTrackEvent(csvRow, config, propFields) {
    // csvRow is the chunk of csv data (js object) coming from the read csvStream
    // topLevelFields are the fields that
    let properties = {};
    propFields.map((field) => { properties[field] = csvRow[field]; });
    let topLevelData = { event: csvRow[config.eventField] };
    if (config.userIdField) {
        topLevelData.userId = csvRow[config.userIdField];
    }
    if (config.anonymousIdField) {
        topLevelData.anonymousId = csvRow[config.anonymousIdField];
    }
    if (config.timestampField) {
        if (isTimeStampable(csvRow[config.timestampField])) {
            topLevelData.timestamp = new Date(csvRow[config.timestampField]);
        }
    }
    function isTimeStampable(value) {
        return value !== undefined;
    }
    return (Object.assign(Object.assign({}, topLevelData), { properties: properties }));
}
function formatIdentifyEvent(csvRow, config, propFields) {
    let traits = {};
    propFields.map((field) => { traits[field] = csvRow[field]; });
    let topLevelData = {};
    if (config.userIdField) {
        topLevelData.userId = csvRow[config.userIdField];
    }
    if (config.anonymousIdField) {
        topLevelData.anonymousId = csvRow[config.anonymousIdField];
    }
    if (config.timestampField) {
        try {
            topLevelData.timestamp = new Date(csvRow[config.timestampField]);
        }
        catch (_a) {
            (error) => { throw error; };
        }
    }
    return (Object.assign(Object.assign({}, topLevelData), { traits: traits }));
}
function distillFields(fieldsToIgnore, fields) {
    let propFields = [];
    for (const field of fields) {
        if (!fieldsToIgnore.includes(field)) {
            propFields.push(field);
        }
    }
    return propFields;
}
function sortTransformations(transformations) {
    let sorted = {
        ignoreColumn: {
            trackEvents: [],
            identifyEvents: [],
            allEvents: []
        },
        ignoreRow: {}
    };
    for (const transformation of transformations) {
        switch (transformation.type) {
            case 'Ignore Column':
                switch (transformation.conditional) {
                    case 'Track Events':
                        sorted.ignoreColumn.trackEvents.push(transformation.target);
                        break;
                    case 'Identify Events':
                        sorted.ignoreColumn.identifyEvents.push(transformation.target);
                        break;
                    case 'All Events':
                        sorted.ignoreColumn.allEvents.push(transformation.target);
                        break;
                }
                ;
            case 'Ignore Row':
                switch (transformation.conditional) {
                    case 'test': console.log('test');
                }
        }
    }
    return sorted;
}

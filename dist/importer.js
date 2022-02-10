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
const dbQueries_1 = require("./utils/dbQueries");
// IPC listeners
electron_1.ipcRenderer.on('load-csv', (_, filePath) => {
    let csvResults = [];
    fs.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)({ separator: '|' }))
        .on('data', (data) => csvResults.push(data))
        .on('end', () => {
        console.log('end');
        electron_1.ipcRenderer.send('csv-loaded', csvResults);
    })
        .on('error', (err) => console.log(err));
    console.log('csv-loaded-test');
});
electron_1.ipcRenderer.on('import-to-segment', (_, config) => {
    try {
        const analytics = new analytics_node_1.default(config.writeKey);
        if (!config.eventTypes.track && !config.eventTypes.identify) {
            throw new Error("No event types selected");
        }
        const transformations = sortTransformations(config.transformationList);
        for (let i = 0; i < config.csvData.length; i++) {
            const events = formatSegmentCalls(config.csvData[i], config, transformations);
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
                    error.message = error.message + ' This error occurred on line: ' + i;
                    throw error;
                };
            }
        }
        electron_1.ipcRenderer.send('import-complete', config.csvData.length);
        const values = { config: JSON.stringify(config), size: config.csvData.length };
        (0, dbQueries_1.insertImportRecord)(values);
        console.log(values);
        console.log('importer-importing-to-segment');
    }
    catch (_b) {
        (error) => {
            console.log(error);
            electron_1.ipcRenderer.send('import-error', error.message);
        };
    }
});
electron_1.ipcRenderer.on('update-event-preview', (_, config) => {
    const transformations = sortTransformations(config.transformationList);
    let previewEvents = [];
    for (let i = 0; i < config.csvData.length; i++) {
        if (config.eventTypes['track']) {
            const events = formatSegmentCalls(config.csvData[i], config, transformations);
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
function formatTrackEvent(csvRow, topLevelFields, propFields) {
    let properties = {};
    propFields.map((field) => { [properties][field] = csvRow[field]; });
    let topLevelData = {};
    if (topLevelFields.event) {
        topLevelData['event'] = csvRow[topLevelFields.event];
    }
    if (topLevelFields.userId) {
        topLevelData['userId'] = csvRow[topLevelFields.userId];
    }
    if (topLevelFields.anonymousId) {
        topLevelData['anonymousId'] = csvRow[topLevelFields.anonymousId];
    }
    if (topLevelFields.timestamp) {
        topLevelData['timestamp'] = new Date(csvRow[topLevelFields.timestamp]);
    }
    return (Object.assign(Object.assign({}, topLevelData), { properties: properties }));
}
function formatIdentifyEvent(csvRow, topLevelFields, propFields) {
    let traits = {};
    propFields.map((field) => { traits[field] = csvRow[field]; });
    let topLevelData = {};
    if (topLevelFields.userId) {
        topLevelData['userId'] = csvRow[topLevelFields.userId];
    }
    if (topLevelFields.anonymousId) {
        topLevelData['anonymousId'] = csvRow[topLevelFields.anonymousId];
    }
    if (topLevelFields.timestamp) {
        topLevelData['timestamp'] = new Date(csvRow[topLevelFields.timestamp]);
    }
    return (Object.assign(Object.assign({}, topLevelData), { traits: traits }));
}
function distillFields(fieldsToIgnoreArray, fieldsArray) {
    //super slow since each field gets deleted, but its only done once before then beginning of the import loop
    // TODO explore how we can ignore the irrelevant fields better
    let propFields = [];
    for (const field of fieldsArray) {
        if (!fieldsToIgnoreArray.includes(field)) {
            propFields.push(field);
        }
    }
    return propFields;
}
function sortTransformations(transformations) {
    let sorted;
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
function formatSegmentCalls(csvRow, config, transformations) {
    const formattedEvents = {};
    let sendTrack = false;
    let sendIdentify = false;
    // decide what calls to send in
    if (config.eventTypes['track']) { //need to implement an ignore row transform here
        sendTrack = true;
    }
    if (config.eventTypes['identify']) { //need to implement an ignore row transform here
        sendIdentify = true;
    }
    const allFields = Object.keys(config.csvData[0]);
    const { eventField, anonymousIdField, userIdField, timestampField } = config, rest = __rest(config, ["eventField", "anonymousIdField", "userIdField", "timestampField"]);
    const fieldsToIgnore = [eventField, anonymousIdField, userIdField, timestampField];
    if (sendTrack) {
        var trackFieldsToIgnoreArray = fieldsToIgnore + transformations['Ignore Column']['Track Events'] + transformations['Ignore Column']['All Events'];
        const propFields = distillFields(trackFieldsToIgnoreArray, allFields);
        const topLevelTrackFields = {
            event: eventField,
            anonymousId: anonymousIdField,
            userId: userIdField,
            timestamp: timestampField
        };
        trackEvent = formatTrackEvent(csvRow, topLevelTrackFields, propFields);
        formattedEvents['track'] = trackEvent;
    }
    if (sendIdentify) {
        var identifyFieldsToIgnoreArray = fieldsToIgnore + transformations['Ignore Column']['Identify Events'] + transformations['Ignore Column']['All Events'];
        const traitFields = distillFields(identifyFieldsToIgnoreArray, allFields);
        const topLevelIdentifyFields = {
            anonymousId: anonymousIdField,
            userId: userIdField,
            timestamp: timestampField
        };
        identifyEvent = formatIdentifyEvent(csvRow, topLevelIdentifyFields, traitFields);
        formattedEvents['identify'] = identifyEvent;
    }
    return formattedEvents;
}
//learnings:
//need to parse the transformations upfront

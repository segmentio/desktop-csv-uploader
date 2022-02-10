"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllImports = exports.insertImportRecord = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const dbPath = './sqlite/importerV1.db';
function insertImportRecord(values, path) {
    if (!path) {
        path = dbPath;
    }
    const db = (0, better_sqlite3_1.default)(path);
    db.prepare("CREATE TABLE If NOT EXISTS history(config,size)").run();
    db.prepare("INSERT INTO history(config, size) VALUES ($config, $size)").run(values);
    db.close();
}
exports.insertImportRecord = insertImportRecord;
function getAllImports(path) {
    if (!path) {
        path = dbPath;
    }
    const db = (0, better_sqlite3_1.default)(path);
    const history = db.prepare("Select * FROM history").all();
    db.close();
    return history;
}
exports.getAllImports = getAllImports;

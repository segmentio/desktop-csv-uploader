const sqlite3 = require('better-sqlite3')

const dbPath = './public/sqlite/importerV1.db'

exports.insertImportRecord = (values, path) => {
  if (!path) {
    path = dbPath
  }
    const db = sqlite3(path);
    const createTable = db.prepare("CREATE TABLE If NOT EXISTS history(config,size)").run();
    const insertHistory = db.prepare("INSERT INTO history(config, size) VALUES ($config, $size)").run(values);
    db.close()
}

exports.getAllImports = (path) => {
    if (!path) {
      path = dbPath
    }
    const db = sqlite3(path);
    const history = db.prepare("Select * FROM history").all();
    return history
    db.close()
}

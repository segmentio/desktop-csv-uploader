import Database from 'better-sqlite3'

const dbPath = './sqlite/importerV1.db'

function insertImportRecord(values:object, path?:string):void {
    if (!path) {
    path = dbPath
  }
    const db = Database(path);
    db.prepare("CREATE TABLE If NOT EXISTS history(config,size)").run();
    db.prepare("INSERT INTO history(config, size) VALUES ($config, $size)").run(values);
    db.close()
}

function getAllImports(path?:string):Array<object>{
      if (!path) {
      path = dbPath
    }
    const db = Database(path);
    const history:Array<object> = db.prepare("Select * FROM history").all();
    db.close()
    return history
}

export {insertImportRecord, getAllImports}

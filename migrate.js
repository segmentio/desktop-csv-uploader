const sqlite3 = require('better-sqlite3')

const db = new sqlite3('importer.db');
const stmt = db.prepare("CREATE TABLE IF NOT EXISTS imports(config, size)")
stmt.run()

console.log('db migrated')

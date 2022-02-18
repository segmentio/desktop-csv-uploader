const assert = require('assert');
const {ipcMain} = require('electron');
const sqlite3 = require('better-sqlite3')
const fs = require('fs')
const {insertImportRecord, getAllImports} = require('../dist/utils/dbQueries')

const data = {
  'csvData': [
    {
      'anonid':'s0nym-nuqf4-kscd2-sraqa-y1ism',
      'campaign': 'Winback',
      'email': 'pescofier0@vkontakte.ru',
      'eventname': 'Signed Up',
      'first_name': 'Peg',
      'groupid': '6277172',
      'groupname': 'Kingold Jewelry Inc.',
      'ip': '83.752.371.87',
      'isnew': true,
      'last_name': 'Escofier',
      'signupdate': '2018-12-13T00:52:29Z',
      'userid': '123456',
    }
  ],
  'userIDField': 'userid',
  'anonymousIDField': 'anonid',
  'timestampField': 'signupdate',
  'EventNameField': 'eventname',
  'writeKey': 'HPzXrG6JTe3kf4a8McAo1eM8TGQnkm3e', // workspace -> https://app.segment.com/segment-cli-testing/sources/csv-importer/overview
  'trackData': false,
  'identifyData': true
}


describe('importerWindow', ()=>{
  describe('database-queries', ()=>{
    const path = './test/test.db'
    it('should insert and retrieve historical import data from "history" table', () => {
      const values = {config:JSON.stringify(data), size:data.csvData.length}
      const insert = insertImportRecord(values, path)
      const imports = getAllImports(path)
      assert(imports[0].config && imports[0].size)
      fs.unlinkSync(path)
    })
  })
})

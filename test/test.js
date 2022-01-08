const assert = require('assert');
const {ipcMain} = require('electron');
const chai = require('chai');
const spies  = require('chai-spies');
chai.use(spies);
const createImporterWindow = require('../../csvelectron')


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
      'source': 'Google Paid',
      'userid': '123456',
      'zip':'7350'
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
  describe('import-to-segment', ()=>{
    it('should return "successful-segment-import" event when "segment-import" event is sent with complete data', () => {
      const importerWindow = createImporterWindow()
      function handler() {
        console.log('YOOOOOOO')
      }
      const spy = chai.spy(handler);

      ipcMain.on('import-to-segment-success', spy)
      importerWindow.webContents.send('import-to-segment', data)
      chai.expect(spy).to.have.been.called
    })
  })
})

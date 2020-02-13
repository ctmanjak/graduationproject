const Router = require('koa-router')
const rfid = new Router()
const rfidControl = require('./control')
const searchroute = require('./search')

rfid.post('/register', rfidControl.Register)
rfid.post('/write', rfidControl.Write)
rfid.post('/getbooks', rfidControl.GetBooks)
rfid.post('/search', rfidControl.SearchBooksByTitle)
rfid.post('/getcategories', rfidControl.GetCategories)
rfid.post('/readrfid', rfidControl.ReadRFID)
rfid.post('/updatecategory', rfidControl.UpdateCategory)
rfid.post('/getinvalidbookinfo', rfidControl.GetInvalidBookInfo)
rfid.post('/getbooksinshelf', rfidControl.GetBooksInShelf)

rfid.use('/search', searchroute.routes())

module.exports = rfid
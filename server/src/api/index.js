const Router = require('koa-router')

const auth = require('./auth')
const rfid = require('./rfid')

const api = new Router()

api.use('/auth', auth.routes())
api.use('/rfid', rfid.routes())

api.get('/', (ctx, next) => {
  ctx.body = 'GET' + ctx.request.path
})

module.exports = api
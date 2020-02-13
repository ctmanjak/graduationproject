const Router = require('koa-router')
const auth = new Router()
const authControl = require('./control')

auth.post('/register', authControl.Register)
auth.post('/login', authControl.Login)
auth.post('/registerlibrary', authControl.RegisterLibrary)

module.exports = auth

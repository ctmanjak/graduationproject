require('dotenv').config()
const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')

const api = require('./api')

const DB = require('./models/DB')

const app = new Koa()
const router = new Router()

const rfidControl = require('./api/rfid/control')

app
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())

const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)

let socketlist = {}

app.context.io = io

io.socketlist = {'running':0}

const waitread = (socket, wait_time, ms) => {
  return new Promise((resolve, reject) => {
      let start_time = Date.now()
      let current_time
      
      var check_waitread = setInterval(function() {
          current_time = Date.now()
          if (socket.is_alive == true) {
            clearInterval(check_waitread)
            resolve()
          } else if (current_time - start_time > wait_time) {
            clearInterval(check_waitread)
            reject()
          }
      }, ms);
  })
}

io.on('connection', socket =>
{
  socket.on('init', async data => {
    if (!io.socketlist.hasOwnProperty(data)) {
      console.log(data, socket.id)
      io.socketlist[data] = { 'id': socket.id, 'status': 'idle', is_alive: true}
      socketlist[socket.id] = data
      socket.emit("init")
    } else {
      io.socketlist[data].is_alive = false
      io.sockets.sockets[io.socketlist[data].id].emit('ping')

      await waitread(io.socketlist[data], 5000, 100).then(() => {
        console.log("already connected", data)
        socket.emit("alreadycon")
      }).catch(() => {
        delete socketlist[io.socketlist[data].id]
        delete io.socketlist[data]

        console.log(data, socket.id)
        io.socketlist[data] = { 'id': socket.id, 'status': 'idle', is_alive: true}
        socketlist[socket.id] = data
        socket.emit("init")
      })
    }
  })

  socket.on('pong', data => {
    io.socketlist[data].is_alive = true
  })
  
  socket.on('returnread', async data => {
    console.log("returnread", data)
    io.socketlist[data].status = 'idle'
    if (io.socketlist.running > 0) io.socketlist.running--
    // if (data.hasOwnProperty("wait")) {
    //   rfidControl.test = data["wait"]
    // }
    // rfidControl.test++
    // if (data != 0) {
    //   rfidControl.test = [true]
    // } else {
    //   rfidControl.test = [false]
    // }
  })

  socket.on('disconnect', () => {
    console.log("disconnected", socket.id)
    delete io.socketlist[socketlist[socket.id]]
    delete socketlist[socket.id]
  })
})

server.listen(process.env.SERVER_PORT, () => {
  console.log(`Server is listening to port ` + process.env.SERVER_PORT)
})

DB.Users().sync()
DB.Books().sync()
DB.Categories().sync()
DB.Libraries().sync()

rfidControl._GetCategories()

router.get('/', (ctx, next) => {
  ctx.body = "Root Page"
})

router.use('/api', api.routes())

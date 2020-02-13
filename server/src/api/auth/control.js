require('dotenv').config()
const Users = require('../../models/DB').Users()
const Libraries = require('../../models/DB').Libraries()
const crypto = require('crypto')

function hash (password) {
  return crypto.createHmac('sha256', process.env.SECRET_KEY).update(password).digest('hex')
}

exports.Register = async (ctx) => {
  const { user_id, user_pw, username, library_id } = ctx.request.body
  
  console.log(ctx.request.body)
  console.log(user_id, user_pw, username, library_id)
  await Users.create({
    user_id: user_id,
    user_pw: hash(user_pw),
    username: username,
    library_id: library_id
  }).then(user => {
    if (user == null) {
      throw err
    } else {
      console.log(`Success Register: ` + user_id)
      ctx.body = "Success Register"
    }
  }).catch(err => {
    console.log(`Failed Register: ` + err)
    ctx.status = 500
    ctx.body = "Failed Register"
  })
}

exports.Login = async (ctx) => {
  const { user_id, user_pw } = ctx.request.body

  await Users.findOne({
      where: { user_id: user_id },
      include: {model: Libraries}
  }).then(user => {
    if (user.user_pw == hash(user_pw)) {
      console.log(`Success Login: `, user.user_id)
      ctx.body = {"username":user.username, "library_name":user.Library.library_name}
    } else {
      throw err
    }
  }).catch(err => {
    console.log(`Failed Login: Password not matched user_id ` + user_id)
    ctx.status = 500
    ctx.body = "Failed Login"
  })
}

exports.RegisterLibrary = async (ctx) => {
  const { library_name } = ctx.request.body
  
  await Libraries.create({
    library_name: library_name
  }).then(library => {
    if (library == null) {
      throw err
    } else {
      console.log(`Success Register: ` + library_name)
      ctx.body = "Success Register"
    }
  }).catch(err => {
    console.log(`Failed Register: ` + err)
    ctx.status = 500
    ctx.body = "Failed Register"
  })
}
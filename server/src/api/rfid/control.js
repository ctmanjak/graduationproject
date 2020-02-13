require('dotenv').config()
const Books = require('../../models/DB').Books()
const Categories = require('../../models/DB').Categories()
const sequelize = require("sequelize")
const Op = sequelize.Op
const fn = sequelize.fn

exports.book_list = null
exports.category_obj = null
exports.category_obj_reverse = null
exports.test = null

exports.Write = async (ctx) => {
  const { tag_id, title, author, category_name, publisher } = ctx.request.body

  console.log("Write")
  await Books.create({
    tag_id: tag_id,
    title: title,
    author: author,
    category_id: exports.category_obj[category_name].category_id,
    publisher: publisher,
    location: 0
  }).then(book => {
    if (book == null) {
      throw err
    } else {
      console.log(`Success Register: ` + tag_id)
      ctx.body = "Success Register"
    }
  }).catch(async err => {
    if (err.name == "SequelizeUniqueConstraintError")
    {
      await Books.update({
        title: title,
        author: author,
        category_id: exports.category_obj[category_name].category_id,
        publisher: publisher
      },
      {
        where: {tag_id: tag_id}
      }).then(result => {
        console.log("Success Update: " + tag_id)
        ctx.body = "Success Update"
      }).catch(err => {
        console.log("Failed Update: " + err)
        ctx.status = 500
        ctx.body = "Failed Update"
      })
    }
    else
    {
      ctx.status = 500
      ctx.body = "Failed Register"
    }
  })
}

const getKeyByValue = (object, value) => {
  return Object.keys(object).find(key => object[key] === value);
}

exports.GetInvalidBookInfo = async (ctx) =>
{
  let result_list = [], tag_ids

  console.log("GetInvalidBookInfo")
  await Books.findAll({
    attributes: [
      'location',
      // [fn('count', 'location'), 'count'],
      [fn('GROUP_CONCAT', sequelize.col('tag_id')), 'tag_ids']
    ],
    group: ['location'],
    where: {
      [Op.and] : {
        category_id: {
          [Op.ne]: { [Op.col]: 'Books.location' }
        }
      }
    }
  }).then(async (result) => {
    if (result == null) {
      throw err
    } else {
      console.log('Success Get Status')
      result.forEach(element => {
        if (element['location'] != 0) {
          // result_list.push({"category_name":getKeyByValue(exports.category_obj, element.dataValues.location), "count":element.dataValues.count})
          tag_ids = element.dataValues.tag_ids.split(',')
          result_list.push({"category_name":exports.category_obj_reverse[element.dataValues.location], "tag_ids":tag_ids})
        }
      });
      ctx.body = result_list
    }
  }).catch(err => {
    console.log(`Failed Get Status: ` + err)
    ctx.status = 500
    ctx.body = "Failed Get Status"
  })
}

exports.GetBooksInShelf = async (ctx) => {
  const { category_name } = ctx.request.body

  console.log("GetBooksInShelf")
  await Books.findAll({
    attributes: ['tag_id', 'title', 'author', 'publisher'],
    where: { location: exports.category_obj[category_name].category_id },
    include: {
      model: Categories,
      as: 'Category',
      attributes: ['category_name']
    }
  }).then(book => {
    if (book == null) {
      throw err
    } else {
      ctx.body = book
    }
  }).catch(err => {
    console.log("Failed Get Books: ", err)
    ctx.status = 500
    ctx.body = "Failed Get Books"
  })
}

exports.UpdateCategory = async (ctx) =>
{
  let { pi_serial, id_list } = ctx.request.body

  if (id_list === undefined) {
    id_list = ["undefined"]
  }

  await Categories.findOne({
    where: { pi_serial: pi_serial }
  }).then(async category => {
    if (category == null) {
      throw err
    } else {
      console.log("--- Update Category ---")
      console.log("Category: " + category.category_name)
      console.log("Serial: " + category.pi_serial)
      console.log("-----------------------")

      await Books.update({
        location: category.category_id
      }, {
        where: {
          location: {
            [Op.ne]: category.category_id
          },
          tag_id: {
            [Op.or]: [id_list]
          }
        }
      }).then(() => {
        console.log("Success Update 1")
        ctx.body = "Success Update"
      }).catch(err => {
        console.log("Failed Update 1: " + err)
        ctx.status = 500
        ctx.body = "Failed Update"
      })

      await Books.update({
        location: 0
      }, {
        where: {
          location: category.category_id,
          tag_id: {
            [Op.notIn]: [id_list]
          }
        }
      }).then(() => {
        console.log("Success Update 2")
        ctx.body = "Success Update"
      }).catch(err => {
        console.log("Failed Update 2: " + err)
        ctx.status = 500
        ctx.body = "Failed Update"
      })
    }
  }).catch(err => {
    console.log("Failed Read: " + err)
    ctx.status = 500
    ctx.body = "Failed Read"
  })
}

exports.ReadRFID = async (ctx) =>
{
  const { category_name } = ctx.request.body

  await Categories.findOne({
    where: { category_name: category_name }
  }).then(async (category) => {
    if (category == null) {
      throw err
    } else {
      let tmp = 'running'
      if (ctx.io.socketlist.hasOwnProperty(category.pi_serial)) {
        if (ctx.io.socketlist[category.pi_serial].status == 'idle') {
          tmp = 'idle'
          console.log("--- Read Category ---")
          console.log("Category: " + category.category_name)
          console.log("Serial: " + category.pi_serial)
          console.log("---------------------")
        }

        _ReadRFID(ctx, category.pi_serial)

        await waitread(ctx.io.socketlist[category.pi_serial], 5000, 100).then(() => {
          ctx.body = tmp
        })
      } else {
        throw "socket not found"
      }
    }
  }).catch(err => {
    console.log(`Failed Read: `, err)
    ctx.status = 500
    ctx.body = "Failed Read"
  })
}

const _ReadRFID = async (ctx, pi_serial) => {
  if(ctx.io.socketlist.hasOwnProperty(pi_serial)) {
    if (ctx.io.socketlist[pi_serial].status == 'idle') {
      ctx.io.socketlist[pi_serial].status = 'running'
      if (ctx.io.socketlist.running < Object.keys(ctx.io.socketlist).length - 1) ctx.io.socketlist.running++

      ctx.io.sockets.sockets[ctx.io.socketlist[pi_serial].id].emit('read', 1)
    }
  } else {
    throw "socket not found"
  }
}

const waitread = (socket, wait_time, ms) => {
  return new Promise((resolve, reject) => {
      let start_time = Date.now()
      let current_time
      
      var check_waitread = setInterval(function() {
          current_time = Date.now()
          if (socket.status == 'idle') {
            // console.log('------------------------------test')
            clearInterval(check_waitread)
            resolve()
          } else if (current_time - start_time > wait_time) {
            clearInterval(check_waitread)
            reject()
          }
      }, ms);
  })
}
// const delayed = (socket, wait_time, ms) => {
//   return new Promise((resolve, reject) => {
//       let start_time = Date.now()
//       let current_time
      
//       var check_delayed = setInterval(function() {
//           current_time = Date.now()
//           if (socket.status == 'idle') {
//             console.log('------------------------------test')
//             clearInterval(check_delayed)
//             resolve()
//           } else if (current_time - start_time > wait_time) {
//             clearInterval(check_delayed)
//             reject()
//           }
//       }, ms);
//   })
// }

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// exports.GetBooksByID = async (id_list) => {
//   var book_list = []

//   return await asyncForEach(id_list, async (tag_id) => {
//     await Books.findOne({
//       attributes: ['title', 'author', 'publisher'],
//       where: { tag_id: tag_id },
//       include: {
//         model: Categories,
//         attributes: ['category_name']
//       }
//     }).then(book => {
//       if (book == null) {
//         throw err
//       } else {
//         book_list.push(book)
//       }
//     }).catch(err => {
//       console.log("Failed Get Books by ID")
//     })
//   }).then(() => {
//     return book_list
//   })
// }

exports.GetBooks = async (ctx) => {
  const { category_name } = ctx.request.body
  await Books.findAll({
    attributes: ['tag_id', 'title', 'author', 'publisher'],
    where: { category_id: exports.category_obj[category_name].category_id },
    include: {
      model: Categories,
      as: 'Category',
      attributes: ['category_name']
    }
  }).then(book => {
    if (book == null) {
      throw err
    } else {
      ctx.body = book
    }
  }).catch(err => {
    console.log("Failed Get Books")
    ctx.status = 500
    ctx.body = "Failed Get Books"
  })
}

exports._GetCategories = async () => {
  Categories.findAll({
    attributes: ['category_id', 'category_name', 'pi_serial']
  }).then(category => {
    if (category == null) {
      throw err
    } else {
      exports.category_obj = {}
      exports.category_obj_reverse = {}
      category.forEach(element => {
        exports.category_obj[element.category_name] = {"category_id":element.category_id, "pi_serial":element.pi_serial}
        exports.category_obj_reverse[element.category_id] = element.category_name
      });
    }
  }).catch(err => {
    console.log("Failed Get Categories: ", err)
  })
}

exports.GetCategories = async (ctx) => {
  if (exports.category_obj == null) {
    ctx.status = 500
    ctx.body = "Failed Get Categories"
  } else {
    let result = []

    Object.keys(exports.category_obj).forEach(element => {
      if (!ctx.io.socketlist.hasOwnProperty(exports.category_obj[element].pi_serial)) console.log(element + " is not connected by socket")
      if (element != "NOTFOUND") result.push({"category_name":element})
    })
    
    if (Object.keys(ctx.io.socketlist).length > 1) {
      Object.keys(ctx.io.socketlist).forEach(element => {
        if (element != 'running' && ctx.io.socketlist[element].status == 'idle')
          _ReadRFID(ctx, element).catch(err => {
            console.log("Failed Read: " + err)
          })
      })

      await waitreadall(ctx.io.socketlist, 5000, 100).then(() => {
        ctx.body = result
      })
    }
    ctx.body = result
  }
}

const waitreadall = (socketlist, wait_time, ms) => {
  return new Promise((resolve, reject) => {
      let start_time = Date.now()
      let current_time
      
      var check_waitread = setInterval(function() {
          current_time = Date.now()
          if (socketlist.running <= 0) {
            // console.log('------------------------------test readall')
            clearInterval(check_waitread)
            resolve()
          } else if (current_time - start_time > wait_time) {
            clearInterval(check_waitread)
            reject()
          }
      }, ms);
  })
}

exports.SearchBooksByTitle = async (ctx) => {
  const { title } = ctx.request.body

  await Books.findAll({
    attributes: ['tag_id', 'title', 'author', 'publisher'],
    where: {
      title: {
        [Op.like]: "%" + title + "%"
      },
    },
    include: {
      model: Categories,
      as: 'Category',
      attributes: ['category_name']
    }
  }).then(book => {
    if (book == null) {
      throw err
    } else {
      ctx.body = book
    }
  }).catch(err => {
    console.log("Failed Search Books by Title")
    ctx.status = 500
    ctx.body = "Failed Search Books by Title"
  })
}

exports.Register = async (ctx) => {
  const { pi_serial, category_name } = ctx.request.body
  
  await Categories.create({
    pi_serial: pi_serial,
    category_name: category_name
  }).then(category => {
    if (category == null) {
      throw err
    } else {
      console.log(`Success Register: ` + pi_serial)
      exports.category_obj[category_name] = {"category_id":category.category_id, "pi_serial":category.pi_serial}
      exports.category_obj_reverse[category.category_id] = category_name
      ctx.body = "Success Register"
    }
  }).catch(async err => {
    if (err.name == "SequelizeUniqueConstraintError")
    {
      await Categories.update({
        category_name: category_name
      },
      {
        where: {pi_serial: pi_serial}
      }).then(result => {
        console.log("Success Update: " + pi_serial)
        ctx.body = "Success Update"
      }).catch(err => {
        console.log("Failed Update: " + err)
        ctx.status = 500
        ctx.body = "Failed Update"
      })
    }
    else
    {
      console.log("Failed Register")
      console.log(err)
      ctx.status = 500
      ctx.body = "Failed Register"
    }
  })
}
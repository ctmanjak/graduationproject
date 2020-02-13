require('dotenv').config()
const Router = require('koa-router')
const Books = require('../../../models/DB').Books()
const Categories = require('../../../models/DB').Categories()
const sequelize = require("sequelize")
const Op = sequelize.Op
const fn = sequelize.fn

const router = new Router()

router.post('/:filter(title|author|publisher|all)/:query(.*)', async (ctx) => {
  const { filter, query } = ctx.params
  let where_query
  if (filter == 'all') {
    where_query = {
      [Op.or] : {
        title: {
          [Op.like]: "%" + query + "%"
        },
        author: {
          [Op.like]: "%" + query + "%"
        },
        publisher: {
          [Op.like]: "%" + query + "%"
        }
      }
    }
  } else {
    where_query = {
      [filter]: {
        [Op.like]: "%" + query + "%"
      }
    }
  }
  await Books.findAll({
    attributes: ['tag_id', 'title', 'author', 'publisher'],
    where: where_query,
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
})

module.exports = router
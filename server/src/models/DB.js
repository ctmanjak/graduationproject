require('dotenv').config()
const Sequelize = require('sequelize')

let sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    define: {
      charset: 'utf8',
      collate: 'utf8_general_ci'
    },
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    timezone: process.env.DB_TIMEZONE
  }
)

DataTypes = Sequelize.DataTypes

exports.Users = function()
{
  const Users = sequelize.define('Users', {
    pk: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(32), allowNull: false },
    user_id: { type: DataTypes.STRING(32), unique: true, allowNull: false },
    user_pw: { type: DataTypes.STRING(64), allowNull: false },
    library_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    classMethods: {},
    tableName: 'Users',
    freezeTableName: false,
    underscored: true,
    timestamps: true,
    paranoid: true
  })

  Users.belongsTo(exports.Libraries(), {
    foreignKey: 'library_id',
    onDelete: 'cascade'
  })

  return Users
}

exports.Books = function()
{
  const Books = sequelize.define('Books', {
    tag_id: { type: DataTypes.STRING(16), primaryKey: true, allowNull: false },
    title: { type: DataTypes.STRING(128), allowNull: false },
    author: { type: DataTypes.STRING(128), allowNull: false },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    publisher: { type: DataTypes.STRING(128), allowNull: false },
    location: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    classMethods: {},
    tableName: 'Books',
    freezeTableName: false,
    underscored: true,
    timestamps: true,
    paranoid: true
  })

  Books.belongsTo(exports.Categories(), {
    as: 'Category',
    foreignKey: 'category_id',
    onDelete: 'cascade'
  })

  Books.belongsTo(exports.Categories(), {
    as: 'locate',
    foreignKey: 'location',
    onDelete: 'cascade'
  })
  return Books
}

exports.Categories = function()
{
  const Categories = sequelize.define('Categories', {
    category_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pi_serial: { type: DataTypes.STRING(16), unique: true, allowNull: false },
    category_name: { type: DataTypes.STRING(32), unique: true, allowNull: false }
  }, {
    classMethods: {},
    tableName: 'Categories',
    freezeTableName: false,
    underscored: true,
    timestamps: true,
    paranoid: true
  })

  return Categories
}

exports.Libraries = function()
{
  const Libraries = sequelize.define('Libraries', {
    library_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    library_name: { type: DataTypes.STRING(64), unique: true, allowNull: false }
  }, {
    classMethods: {},
    tableName: 'Libraries',
    freezeTableName: false,
    underscored: true,
    timestamps: true,
    paranoid: true
  })

  return Libraries
}

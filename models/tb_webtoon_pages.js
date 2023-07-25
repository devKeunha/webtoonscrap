const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tb_webtoon_pages', {
    webtoonID: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    pageNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    thumbnailUrl: {
      type: DataTypes.STRING(800),
      allowNull: true
    },
    serverUrl: {
      type: DataTypes.STRING(800),
      allowNull: true
    },
    updateAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    viewAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tb_webtoon_pages',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "webtoonID" },
          { name: "pageNo" },
        ]
      },
    ]
  });
};

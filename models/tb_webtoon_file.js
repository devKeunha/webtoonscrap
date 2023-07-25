const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tb_webtoon_file', {
    codeID: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    pageNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    pageIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    originName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    filePath: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    serverUrl: {
      type: DataTypes.STRING(8000),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tb_webtoon_file',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "codeID" },
          { name: "pageNo" },
          { name: "pageIndex" },
        ]
      },
    ]
  });
};

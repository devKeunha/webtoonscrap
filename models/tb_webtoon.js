const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tb_webtoon', {
    websiteCode: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    webtoonID: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    alias: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    updateAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    lastWebToonID: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "만화 - 목록\\n"
    },
    isDownload: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: "00"
    }
  }, {
    sequelize,
    tableName: 'tb_webtoon',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "websiteCode" },
          { name: "id" },
        ]
      },
    ]
  });
};

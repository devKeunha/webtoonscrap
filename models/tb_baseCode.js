const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tb_baseCode', {
    codeID: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    codeValue: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    bigo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tb_baseCodecol: {
      type: DataTypes.STRING(45),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'tb_baseCode',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "codeID" },
        ]
      },
    ]
  });
};

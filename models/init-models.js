var DataTypes = require("sequelize").DataTypes;
var _tb_baseCode = require("./tb_baseCode");
var _tb_webtoon = require("./tb_webtoon");
var _tb_webtoon_file = require("./tb_webtoon_file");
var _tb_webtoon_pages = require("./tb_webtoon_pages");

function initModels(sequelize) {
  var tb_baseCode = _tb_baseCode(sequelize, DataTypes);
  var tb_webtoon = _tb_webtoon(sequelize, DataTypes);
  var tb_webtoon_file = _tb_webtoon_file(sequelize, DataTypes);
  var tb_webtoon_pages = _tb_webtoon_pages(sequelize, DataTypes);


  return {
    tb_baseCode,
    tb_webtoon,
    tb_webtoon_file,
    tb_webtoon_pages,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;

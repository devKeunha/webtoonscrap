const SequelizeAuto = require("sequelize-auto");
const auto = new SequelizeAuto("db_dev", "root", "akdma25", {
  host: "172.30.1.50",
  port: "3306",
  dialect: "mysql",
});
auto.run((err) => {
  if (err) throw err;
});

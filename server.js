const express = require("express");
const cors = require("cors");
const fs = require("fs");
const webtoon = require("./business/webtoonBusiness");
const setting = require("./config/envirement");
const { config } = require("process");
const port = setting.config.SERVER_PORT;
const app = express();
const SCRP_INTERVEL = 1000 * 60 * 10;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static("data"));
app.use(cors());

app.get("/", async function (req, res) {
  res.send("Server lived");
});

// 폴더내 모든 파일 불러오기
app.get("/getfiles", (req, res) => {
  fs.readdir("./..", (error, fileList) => {
    console.log(fileList);
    res.send(fileList);
  });
});
app.use("/webtoon", require("./router/webtoon-router"));
app.listen(port, () => {
  console.log(`Start Service..... Port ${port}`);
});

setInterval(async () => {
  const hour = new Date().getHours() + 9;
  // if (hour >= 8 && hour <= 22) return;

  doScrapping();
}, SCRP_INTERVEL);

async function doScrapping() {
  await webtoon.getNaverWebtoons();
  setting.config.OTHER_SEVER_VALUES.forEach(async function (x) {
    await webtoon.getOtherWebtoons(x);
  });
  await webtoon.autoImageFileDownload(webtoon.saveFolder);
}

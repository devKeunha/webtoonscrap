const webtoon = require("./../business/webtoonBusiness");
const express = require("express");
const router = express.Router();
// const SAVE_FOLDER = "Z:/data/webtoon/";

router.get("/", async (req, res) => {
  const imageList = await webtoon.getWebToons();
  res.json(imageList);
});

router.get("/getList", async (req, res) => {
  const list = await webtoon.getWebToons();
  res.json(list);
});

router.get("/getPageList/:TOONID", async (req, res) => {
  const list = await webtoon.getWebtoonPages(req.params.TOONID);
  res.json(list);
});

router.get("/getAllList", async (req, res) => {
  const keyword = req.query.keyword ?? "";
  const list = await webtoon.getAllWebToons(1, keyword);
  res.json(list);
});

router.get("/getAllList/:PAGE", async (req, res) => {
  const keyword = req.query.keyword ?? "";
  const list = await webtoon.getAllWebToons(req.params.PAGE, keyword);
  res.json(list);
});

router.get("/getList/:ID", async (req, res) => {
  const list = await webtoon.getWebToonsFileList(req.params.ID, 1);
  res.send(list);
});

router.get("/getList/:ID/:PAGE", async (req, res) => {
  const list = await webtoon.getWebToonsFileList(
    req.params.ID,
    req.params.PAGE
  );
  res.send(list);
});

router.post("/updateStatus", async (req, res) => {
  const webtoonID = req.body.webtoonid;
  const statusCode = req.body.statusCode;
  await webtoon.updateStatusCode(webtoonID, statusCode);
  res.sendStatus(200);
});

router.post("/download/naver", async (req, res) => {
  const webtoonID = req.body.webtoonid;
  await webtoon.naverWebtoonFileDownload(webtoonID, webtoon.saveFolder);
  res.sendStatus(200);
});

router.post("/redownload/naver", async (req, res) => {
  const webtoonID = req.body.webtoonid;
  const pageNo = req.body.pageNo;
  await webtoon.naverWebtoonFileReDownload(
    webtoonID,
    pageNo,
    webtoon.saveFolder
  );
  res.sendStatus(200);
});

router.post("/download/newtoki", async (req, res) => {
  const webtoonID = req.body.webtoonid;
  await webtoon.newTokiWebtoonFileDownload(webtoonID, webtoon.saveFolder);
  res.sendStatus(200);
});

router.post("/redownload/newtoki", async (req, res) => {
  const webtoonID = req.body.webtoonid;
  const pageNo = req.body.pageNo;
  await webtoon.newTokiWebtoonrReFileDownload(
    webtoonID,
    pageNo,
    webtoon.saveFolder
  );
  res.sendStatus(200);
});

module.exports = router;

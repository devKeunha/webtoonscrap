const express = require("express");
const stock = require("./../business/stockBusiness");
const router = express.Router();

router.get("/", async (req, res) => {
  res.sendStatus(200);
});

router.get("/inquirebalance", async (req, res) => {
  const response = await stock.getInquireBalance();
  res.json(response);
});

router.get("/inquireprice/:ID", async (req, res) => {
  const stockID = req.params.ID;
  const response = await stock.getInqurePrice(stockID);
  res.json(response);
});

router.get("/searchinfo/:ID", async (req, res) => {
  const stockID = req.params.ID;
  const response = await stock.searchInfo(stockID);
  res.json(response);
});
module.exports = router;

const utils = require("./function");
const cheerio = require("cheerio");
const models = require("../models");
const setting = require("../config/envirement");
const WEBTOON_SERVER = setting.config.SERVER_URL;
const fs = require("fs");

exports.SERVER_URL = setting.config.SERVER_URL;

exports.BASE_URL = `${WEBTOON_SERVER}/webtoon`;

exports.fileDownload = async function (webToonID, folder) {
  const idList = await getOtherIDList(webToonID);
  console.log(`FileDownload ${webToonID} - START`);
  if (!idList) return;

  const document = {
    write: function () {},
  };

  const saveFolder = `${folder}/NE_${webToonID}`;
  if (!fs.existsSync(saveFolder)) {
    fs.mkdirSync(saveFolder);
  }

  const pageNum = await utils.getWebtoonLastPageNumber(webToonID);
  for (var i = pageNum; i <= idList.length; i++) {
    const url = `${WEBTOON_SERVER}/webtoon/${idList[i - 1]}`;
    console.log(`${new Date()}_${url}`);
    const urlPathList = await utils.getHTML(url).then((html) => {
      if (html === null || html === undefined) return;
      let $ = cheerio.load(html.data);
      const $bodyList = $("script");
      const srcList = [];
      $bodyList.each((i, elem) => {
        if ($(elem).toString().indexOf("html_data") <= 0) return;

        const str = $(elem).html();
        eval(str);
        const htmlStr = html_encoder(html_data);
        $ = cheerio.load(htmlStr);
        const imageList = $("img");
        imageList.each((idx, element) => {
          if (
            element.parent.name == "p" &&
            element.parent.attribs["class"] != undefined
          )
            return;
          const values = Object.values(element.attribs);
          for (var i = 0; i < values.length; i++) {
            if (values[i].indexOf("/data/file") < 0) continue;
            srcList.push(values[i]);
          }
        });
      });
      return srcList;
    });

    if (urlPathList.length <= 0) {
      await sleep(2000);
      continue;
    }

    const saveFilesList = await utils.saveFileList(
      webToonID,
      i,
      saveFolder,
      `NE_${webToonID}`,
      urlPathList
    );

    saveFilesList.forEach(
      async (data) => await utils.fileDownload(data.originName, data.filePath)
    );
    console.log(`FileDownload ${webToonID} - END`);
    await sleep(2000);
  }
};

exports.fileReDownload = async function (webToonID, pageNo, folder) {
  const idList = await getOtherIDList(webToonID);
  if (idList === null || idList == undefined || idList.length <= 0) return;

  const document = {
    write: function () {},
  };

  const saveFolder = `${folder}/NE_${webToonID}`;
  if (!fs.existsSync(saveFolder)) {
    fs.mkdirSync(saveFolder);
  }

  const i = pageNo;
  const url = `${WEBTOON_SERVER}/webtoon/${idList[i - 1]}`;
  console.log(`${new Date()}_${url}`);
  const urlPathList = await utils.getHTML(url).then((html) => {
    if (html === null || html === undefined) return;
    let $ = cheerio.load(html.data);
    const $bodyList = $("script");
    const srcList = [];
    $bodyList.each((i, elem) => {
      if ($(elem).toString().indexOf("html_data") <= 0) return;

      const str = $(elem).html();
      eval(str);
      const htmlStr = html_encoder(html_data);
      $ = cheerio.load(htmlStr);
      const imageList = $("img");
      imageList.each((idx, element) => {
        if (
          element.parent.name == "p" &&
          element.parent.attribs["class"] != undefined
        )
          return;
        const values = Object.values(element.attribs);
        for (var i = 0; i < values.length; i++) {
          if (values[i].indexOf("/data/file") < 0) continue;
          srcList.push(values[i]);
        }
      });
    });
    return srcList;
  });

  if (urlPathList.length <= 0) {
    await sleep(1000);
    return;
  }

  const saveFilesList = await utils.saveFileList(
    webToonID,
    i,
    saveFolder,
    `NE_${webToonID}`,
    urlPathList
  );

  saveFilesList.forEach(
    async (data) => await utils.fileDownload(data.originName, data.filePath)
  );
};

exports.webtoonLists = async function (toon) {
  let pageNo = 1;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const MINUS_TIME = 24 * 60 * 60 * 1000 * 3;
  const checkTime = today.getTime() - MINUS_TIME;
  const totalList = [];
  while (true) {
    const url = `${WEBTOON_SERVER}/webtoon/p${pageNo}?toon=${toon}`;
    console.log(`${new Date()}_${url}`);
    const html = await utils.getHTML(url);

    if (
      html === null ||
      html === undefined ||
      html.data === null ||
      html.data === undefined
    )
      return;

    const $ = cheerio.load(html.data);
    const $ulList = $("ul[id='webtoon-list-all']").children("li");
    if ($ulList.length <= 0) return;

    const list = [];
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    let isNextPage = true;
    $ulList.each(async function (i, elem) {
      const id = $(elem).find("div.in-lable").attr("rel");
      const utc = Number($(elem).attr("date-update")) * 1000;

      if (utc < checkTime) {
        isNextPage = false;
      }

      const item = {
        websiteCode: "WEB_TOKI",
        id: id,
        webtoonID: id,
        title: $(elem).attr("date-title"),
        alias: $(elem).attr("date-title"),
        updateAt: new Date(utc),
      };
      list.push(item);
      totalList.push(item);
    });
    await list.map(
      await ((data) => {
        models.tb_webtoon.upsert(data);
      })
    );
    pageNo++;
    await sleep(2000);
    if (!isNextPage) break;
  }
  return totalList;
};

async function getOtherIDList(webId) {
  const url = `${WEBTOON_SERVER}/webtoon/${webId}`;
  let idList = [];
  const webtoonidList = await utils.getHTML(url).then((html) => {
    if (!html) return;

    const $ = cheerio.load(html.data);
    const $bodyList = $("ul.list-body").children("li.list-item");
    $bodyList.each(function (i, elem) {
      const pageIndex = $(elem).find("div.wr-num").text();
      const innerItem = $(elem).find("a").attr("href");
      const idStartIndex = innerItem.indexOf("/webtoon/") + 9;
      const idEndIndex = innerItem.indexOf("/", idStartIndex + 1);
      const pageID = innerItem.substring(idStartIndex, idEndIndex);
      const textStartIdnex = innerItem.indexOf("/", idEndIndex) + 1;
      const textEndIdnex = innerItem.indexOf("?", textStartIdnex + 1);
      const title = innerItem.substring(textStartIdnex, textEndIdnex);
      const date = $(elem)
        .find("div.item-details")
        .children("span")
        .first()
        .text()
        .trim()
        .replaceAll(".", "-");
      const item = {
        webtoonID: webId,
        pageNo: pageIndex,
        title: title,
        thumbnailUrl: "",
        serverUrl: pageID,
        updateAt: new Date(date),
      };
      idList.push(item);
    });
    return idList.map((data) => data.serverUrl);
  });

  // if (idList.length <= 0) {
  //   idList = await getOtherIDListByFistPage(webId);
  // }

  await utils.savePageList(idList);
  if (webtoonidList === undefined || webtoonidList.length <= 0) return null;
  return webtoonidList.reverse();
}

async function getOtherIDListByFistPage(webId) {
  const firstId = await models.tb_webtoon_pages.findOne({
    where: [{ webtoonID: webId }, { pageNo: 1 }],
    attributes: ["serverUrl"],
  });

  const toonID = firstId.dataValues.serverUrl;
  const url = `${WEBTOON_SERVER}/webtoon/${toonID}`;
  let idList = [];
  await utils.getHTML(url).then((html) => {
    if (!html) return;

    const $ = cheerio.load(html.data);
    const $bodyList = $("select[name='wr_id']").children("option");
    if ($bodyList.length <= 0) return;

    $bodyList.each((i, elem) => {
      const pageID = elem.attribs["value"];
      const item = {
        webtoonID: webId,
        pageNo: $bodyList.length - i,
        title: `${$bodyList.length - i} 화`,
        thumbnailUrl: "",
        serverUrl: pageID,
        updateAt: null,
      };
      idList.push(item);
    });
  });
  return idList;
}

function html_encoder(s) {
  var i = 0,
    out = "";
  l = s.length;
  for (; i < l; i += 3) {
    out += String.fromCharCode(parseInt(s.substr(i, 2), 16));
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

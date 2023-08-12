const utils = require("./function");
const cheerio = require("cheerio");
const models = require("../models");
const setting = require("../config/envirement");
const WEBTOON_SERVER = utils.loadConfig().SERVER_COMIC_URL;
const fs = require("fs");

exports.BASE_URL = `${WEBTOON_SERVER}/comic`;

exports.fileDownload = async function (webToonID, folder) {
  const idList = await getComicIDList(webToonID);
  if (idList === null || idList == undefined || idList.length <= 0) return;

  const document = {
    write: function () {},
  };

  const saveFolder = `${folder}/NC_${webToonID}`;
  if (!fs.existsSync(saveFolder)) {
    fs.mkdirSync(saveFolder);
  }

  const pageNum = await utils.getWebtoonLastPageNumber(webToonID);
  for (var i = pageNum; i <= idList.length; i++) {
    const url = `${WEBTOON_SERVER}/comic/${idList[i - 1]}`;
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
      `NC_${webToonID}`,
      urlPathList
    );

    saveFilesList.forEach(
      async (data) => await utils.fileDownload(data.originName, data.filePath)
    );
  }
  await sleep(2000);
};

exports.fileReDownload = async function (webToonID, pageNo, folder) {
  const idList = await getComicIDList(webToonID);
  if (idList === null || idList == undefined || idList.length <= 0) return;

  const document = {
    write: function () {},
  };

  const saveFolder = `${folder}/NC_${webToonID}`;
  if (!fs.existsSync(saveFolder)) {
    fs.mkdirSync(saveFolder);
  }

  const i = pageNo;
  const url = `${WEBTOON_SERVER}/comic/${idList[i - 1]}`;
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

async function getComicIDList(webId) {
  const url = `${WEBTOON_SERVER}/comic/${webId}`;
  let idList = [];
  const webtoonidList = await utils.getHTML(url).then((html) => {
    if (html === null || html === undefined) return;
    const $ = cheerio.load(html.data);
    const $bodyList = $("ul.list-body").children("li.list-item");
    $bodyList.each(function (i, elem) {
      const pageIndex = $(elem).find("div.wr-num").text();
      const innerItem = $(elem).find("a").attr("href");
      const idStartIndex = innerItem.indexOf("/comic/") + 7;
      const idEndIndex = innerItem.indexOf("?", idStartIndex + 1);
      const pageID = innerItem.substring(idStartIndex, idEndIndex);
      const title = `${pageIndex} 화`;
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

  await utils.savePageList(idList);
  if (webtoonidList === undefined || webtoonidList.length <= 0) return null;
  return webtoonidList.reverse();
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

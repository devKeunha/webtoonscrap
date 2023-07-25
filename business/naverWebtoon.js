const utils = require("./function");
const models = require("./../models");
const cheerio = require("cheerio");
const NAVER_URL =
  "https://comic.naver.com/api/webtoon/titlelist/weekday?order=user";
const NAVER_API = "https://comic.naver.com/api";
const fs = require("fs");

exports.BASE_URL = "https://comic.naver.com/webtoon/list?titleId=";

exports.fileDownload = async function (webToonID, folder) {
  const pageList = await getPageList(webToonID);
  const lastPage = Math.max(...pageList.map((x) => Number(x.pageNo)));
  const saveFolder = `${folder}/NA_${webToonID}`;

  console.log(pageList, lastPage);
  if (!fs.existsSync(saveFolder)) {
    fs.mkdirSync(saveFolder);
  }

  let pageNum = await utils.getWebtoonLastPageNumber(webToonID);
  for (let i = pageNum; i <= lastPage; i++) {
    await fileDownloadPage(webToonID, i, saveFolder);
  }
};

exports.fileReDownload = async function (webToonID, pageNo, folder) {
  const saveFolder = `${folder}/NA_${webToonID}`;
  if (!fs.existsSync(saveFolder)) {
    fs.mkdirSync(saveFolder);
  }
  await fileDownloadPage(webToonID, pageNo, saveFolder);
};

exports.webtoonFinshedList = async function () {
  let pageNo = 1;
  while (true) {
    const url = `${NAVER_API}/webtoon/titlelist/finished?page=${pageNo}&order=UPDATE`;
    console.log(url);
    const html = await utils.getHTML(url);
    const lastPageNum = html.data.pageInfo.totalPages;
    if (pageNo > lastPageNum) break;
    const list = await webToonList(html.data.titleList);

    await list.map((data) => {
      models.tb_webtoon.upsert(data);
    });
    pageNo += 1;
    console.log("finished");
  }
};

exports.webtoonLists = async function () {
  const html = await utils.getHTML(NAVER_URL);
  let list = [];
  let listData = list.push(
    ...(await webToonList(html.data.titleListMap.SATURDAY))
  );
  listData = list.push(...(await webToonList(html.data.titleListMap.MONDAY)));
  listData = list.push(...(await webToonList(html.data.titleListMap.SUNDAY)));
  listData = list.push(...(await webToonList(html.data.titleListMap.THURSDAY)));
  listData = list.push(...(await webToonList(html.data.titleListMap.TUESDAY)));
  listData = list.push(
    ...(await webToonList(html.data.titleListMap.WEDNESDAY))
  );
  listData = list.push(...(await webToonList(html.data.titleListMap.FRIDAY)));
  await list.map((data) => {
    models.tb_webtoon.upsert(data);
  });
  return list;
};

async function fileDownloadPage(webToonID, pageNo, saveFolder) {
  const url = `https://comic.naver.com/webtoon/detail?titleId=${webToonID}&no=${pageNo}`;
  const imageList = await utils.getHTML(url).then((html) => {
    const urlList = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $("div[id='sectionContWide']").children("img");
    $bodyList.each(function (i, elem) {
      const imagePath = $(elem).attr("src");
      urlList.push(imagePath);
    });
    return urlList;
  });
  if (imageList.length <= 0) return;

  const saveFilesList = await utils.saveFileList(
    webToonID,
    pageNo,
    saveFolder,
    `NA_${webToonID}`,
    imageList
  );

  saveFilesList.forEach(
    async (data) => await utils.fileDownload(data.originName, data.filePath)
  );
}

async function webToonList(list) {
  const result = [];
  for (let i = 0; i < list.length; i++) {
    const data = list[i];
    const lastDate = await getLastUpdateTime(data.titleId);
    result.push({
      websiteCode: "WEB_NAVER",
      id: data.titleId,
      webtoonID: data.titleId,
      title: data.titleName,
      alias: data.titleName,
      updateAt: new Date(lastDate),
    });
  }
  return result;
}

async function getLastUpdateTime(webtoonID) {
  const url = `${NAVER_API}/article/list?titleId=${webtoonID}&page=1`;
  const response = await utils.getHTML(url).catch((err) => {
    return "2000-01-01";
  });
  if (
    response === null ||
    response === undefined ||
    response.data === null ||
    response.data.articleList === null ||
    response.data.articleList === undefined
  )
    return "2000-01-01";

  const webtoonList = response.data.articleList[0];
  if (
    webtoonList === null ||
    webtoonList === undefined ||
    webtoonList.length <= 0
  )
    return "2000-01-01";
  return String(`20${webtoonList.serviceDateDescription}`).replaceAll(".", "-");
}

async function getPageList(toonID) {
  const pageList = [];
  let pageNum = 1;

  let url = `${NAVER_API}/article/list?titleId=${toonID}&page=${pageNum}`;
  const mainPage = await utils.getHTML(url).then((html) => html.data);
  for (let i = 1; i <= mainPage.pageInfo.totalPages; i++) {
    let url = `${NAVER_API}/article/list?titleId=${toonID}&page=${i}`;
    let html = await utils.getHTML(url).then((html) => html.data);
    html.articleList.map((data) => {
      const date = `20${data.serviceDateDescription.replaceAll(".", "-")}`;
      const item = {
        webtoonID: toonID,
        pageNo: data.no,
        title: data.subtitle,
        thumbnailUrl: "",
        serverUrl: data.no,
        updateAt: new Date(date),
      };
      pageList.push(item);
    });
  }
  await utils.savePageList(pageList);
  return pageList;
}

const naver = require("./naverWebtoon");
const other = require("./otherWebtoon");
const comic = require("./comic");
const models = require("./../models");
const utils = require("./function");
const sequelize = require("sequelize");
const Op = sequelize.Op;
const PAGE_PER_COUNT = 100;
const SAVE_FOLDER = "/app/data/webtoon";

exports.saveFolder = SAVE_FOLDER;

exports.getWebToons = async function () {
  let result;
  await models.tb_webtoon
    .findAll({
      where: {
        isDownload: "10",
      },
      order: [["updateAt", "DESC"]],
      attributes: [
        "websiteCode",
        "webtoonID",
        "title",
        "alias",
        "updateAt",
        "isDownload",
      ],
    })
    .then((row) => {
      result = row;
    });

  const idList = result.map((data) => data.webtoonID);
  const pageInfoList = await models.tb_webtoon_pages
    .findAll({
      attributes: [
        "webtoonID",
        [sequelize.fn("max", sequelize.col("pageNo")), "pageNo"],
        [sequelize.fn("max", sequelize.col("updateAt")), "updateAt"],
      ],
      where: {
        webtoonID: {
          [Op.in]: idList,
        },
      },
      group: "webtoonID",
      order: [["updateAt", "DESC"]],
    })
    .then((data) => data);

  const readInfoList = await models.tb_webtoon_pages
    .findAll({
      attributes: ["webtoonID", "pageNo", "viewAt"],
      where: {
        webtoonID: {
          [Op.in]: idList,
        },
        viewAt: {
          [Op.ne]: null,
        },
      },
    })
    .then((result) =>
      result.map((data) => {
        return {
          webtoonID: data.webtoonID,
          pageNo: data.pageNo,
          viewAt: Number(Date.parse(data.viewAt)),
        };
      })
    );

  const joinResult = result.map((data) => {
    let pageLastDate = null;
    let lastPageNum = 1;
    let maxPageNum = 1;
    const pageInfo = pageInfoList.find((e) => data.webtoonID === e.webtoonID);
    if (pageInfo != undefined) {
      pageLastDate = pageInfo.dataValues.updateAt;
      maxPageNum = pageInfo.dataValues.pageNo;
    }

    const lastvIewInfo = readInfoList
      .filter((e) => data.webtoonID === e.webtoonID)
      .sort(function (temp1, temp2) {
        return temp2.viewAt - temp1.viewAt;
      })[0];
    if (lastvIewInfo != undefined) {
      lastPageNum = Number(lastvIewInfo.pageNo);
    }

    return {
      data: data.websiteCode,
      webtoonID: data.webtoonID,
      title: data.title,
      alias: data.alias,
      updateAt: data.updateAt,
      isDownload: data.isDownload,
      viewLastPageNo: lastPageNum,
      maxPageNum: maxPageNum,
      pageLastDate: pageLastDate,
    };
  });
  return joinResult;
};

exports.getWebtoonPages = async function (toonId) {
  let result;
  await models.tb_webtoon_pages
    .findAll({
      where: {
        webtoonID: toonId,
      },
      order: [["pageNo", "DESC"]],
      attributes: [
        "webtoonID",
        "pageNo",
        "title",
        "serverUrl",
        "updateAt",
        "viewAt",
      ],
    })
    .then((row) => {
      result = row;
    });
  return result;
};

exports.getAllWebToons = async function (page, keyword) {
  let result;
  await models.tb_webtoon
    .findAll({
      where: {
        isDownload: "00",
        title: { [Op.like]: `%${keyword}%` },
      },
      limit: PAGE_PER_COUNT,
      offset: (page - 1) * PAGE_PER_COUNT,
      attributes: [
        "websiteCode",
        "webtoonID",
        "title",
        "alias",
        "updateAt",
        "isDownload",
      ],
      order: [["updateAt", "DESC"]],
    })
    .then((row) => {
      result = row;
    });
  const list = result.map((data) => {
    const url =
      data.websiteCode === "WEB_NAVER"
        ? `${naver.BASE_URL}${data.webtoonID}`
        : `${other.BASE_URL}/${data.webtoonID}`;
    return {
      websiteCode: data.websiteCode,
      webtoonID: data.webtoonID,
      title: data.title,
      alias: data.alias,
      siteUrl: url,
      updateAt: data.updateAt,
      isDownload: data.isDownload,
    };
  });
  return list;
};

exports.getWebToonsFileList = async function (webToonID, startPage) {
  utils.saveReadPageDate(webToonID, startPage);
  const list = await models.tb_webtoon_file
    .findAll({
      attributes: ["serverUrl"],
      where: {
        codeID: webToonID,
        pageNo: startPage,
      },
      order: [
        ["codeID", "ASC"],
        ["pageNo", "ASC"],
        ["pageIndex", "ASC"],
      ],
    })
    .then((row) => row);
  // const html = utils.templateHTML(result);
  return list;
};

exports.updateStatusCode = async function (webToonID, status) {
  await models.tb_webtoon.update(
    {
      isDownload: status,
    },
    {
      where: {
        webtoonID: webToonID,
      },
    }
  );
};

exports.naverWebtoonFileReDownload = async function (
  webToonID,
  pageno,
  folder
) {
  await naver.fileReDownload(webToonID, pageno, folder);
};

exports.naverWebtoonFileDownload = async function (webToonID, folder) {
  await naver.fileDownload(webToonID, folder);
};

exports.getNaverWebtoons = async function () {
  return await naver.webtoonLists();
  // return await naver.webtoonFinshedList();
};

exports.otherWebtoonFileDownload = async function (webToonID, folder) {
  await other.fileDownload(webToonID, folder);
};

exports.comicFileDownload = async function (webToonID, folder) {
  await comic.fileDownload(webToonID, folder);
};

exports.otherWebtoonrReFileDownload = async function (
  webToonID,
  pageNo,
  folder
) {
  await other.fileReDownload(webToonID, pageNo, folder);
};

exports.getOtherWebtoons = async function (toon) {
  return await other.webtoonLists(toon);
};

exports.autoImageFileDownload = async function (folder) {
  const result = await models.sequelize
    .query(
      `
      SELECT 
      web.websiteCode, web.webtoonID
    FROM tb_webtoon web
    LEFT JOIN 
    (
      SELECT 
        webtoonID, MAX(updateAt) lastFile
        FROM tb_webtoon_pages 
        GROUP BY webtoonID
    ) AS F
    ON web.webtoonID = F.webtoonID
    WHERE 
    web.isDownload = '10'
    AND date_format(web.updateAt,'%Y%m%d') > date_format(IFNULL(F.lastFile, '2000-01-01'),'%Y%m%d');`,
      { type: sequelize.QueryTypes.SELECT }
    )
    .then((query) => query);

  result.forEach(async function (data) {
    if (data.websiteCode === "WEB_TOKI") {
      await exports.otherWebtoonFileDownload(data.webtoonID, SAVE_FOLDER);
    } else {
      await exports.naverWebtoonFileDownload(data.webtoonID, SAVE_FOLDER);
    }
  });
};

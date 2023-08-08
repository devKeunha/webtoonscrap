const axios = require("axios");
const models = require("./../models");
const download = require("image-downloader");
const SERVER_URL = "http://172.30.1.16:8080";

const instance = axios.create();
instance.defaults.withCredentials = true;

exports.getHTML = async function (url) {
  try {
    return await instance.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.3; WOW64; Trident/7.0)",
        Cookie:
          "PHPSESSID=d067d3eljfsd2udhd0o3lpfpbi05jep1rdgh3bmmtaau1ckq897e15hg7shh66qa",
      },
    });
  } catch (error) {
    return null;
  }
};

exports.getWebtoonLastPageNumber = async function (webtoonID) {
  let maxPageNum = await models.tb_webtoon_file.max("pageNo", {
    where: {
      codeID: webtoonID,
    },
  });
  if (maxPageNum === null) maxPageNum = 0;
  return maxPageNum + 1;
};

exports.templateHTML = function (imageList) {
  let html = `
<!DOCTYPE html>
    <html lang='en'>
    <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Document</title>
        <style>
        body {
            margin: 0;
            padding: 0;
        }
        
        .image-gallery {
            display: flex;
            flex-wrap: wrap;
            width: auto;      
            overflow-x: auto; /* 가로 스크롤을 위해 */
        }
        
        .image-container {
            flex: 0 0 100%; /* 이미지 컨테이너 너비를 100%로 설정 */
            width: 100%;
            overflow: hidden;
        }
        
        .image-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        </style>
    </head>
    <body>
        <div class='image-gallery'>`;

  imageList.forEach((image) => {
    html += `
            <div class='image-container'>
                <img class='lazy' src='${SERVER_URL}${image.serverUrl}' alt='이미지_설명'>
            </div>
            `;
  });

  html += `
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
            var lazyImages = [].slice.call(document.querySelectorAll('.lazy'));
    
            if ('IntersectionObserver' in window) {
                let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                    let lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy');
                    lazyImageObserver.unobserve(lazyImage);
                    }
                });
                });
    
                lazyImages.forEach(function(lazyImage) {
                lazyImageObserver.observe(lazyImage);
                });
            }
            });
        </script>
    </body>
    </html>`;
  return html;
};

exports.fileDownload = async function (url, filePath) {
  await download
    .image({
      url: url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.3; WOW64; Trident/7.0)",
      },
      dest: filePath,
    })
    .catch((err) => console.error(err));
};

exports.saveFileList = async function (
  webid,
  pageNum,
  saveFolder,
  folderName,
  imageList
) {
  const inputDataList = [];
  let index = 1;
  imageList.forEach((image) => {
    const imageName = `${pageNum.toString().padStart(3, "0")}_${index
      .toString()
      .padStart(5, "0")}_${webid}.jpg`;
    const savePath = `${saveFolder}/${imageName}`;
    const url = `/webtoon/${folderName}/${imageName}`;
    const data = {
      codeID: webid,
      pageNo: pageNum,
      pageIndex: index,
      originName: image,
      filePath: savePath,
      serverUrl: url,
    };
    index++;
    inputDataList.push(data);
  });
  await models.tb_webtoon_file.bulkCreate(inputDataList, {
    ignoreDuplicates: true,
  });
  return inputDataList;
};

exports.savePageList = async function (pageList) {
  await models.tb_webtoon_pages.bulkCreate(pageList, {
    ignoreDuplicates: true,
  });
  // await pageList.map((data) => {
  //   models.tb_webtoon_pages.upsert(data);
  // });
};

exports.saveReadPageDate = async function (id, no) {
  await models.tb_webtoon_pages.update(
    {
      viewAt: Date.now(),
    },
    {
      where: {
        webtoonID: id,
        pageNo: no,
      },
    }
  );
};

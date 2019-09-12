var https = require('https');
var fs = require('fs');
var path = require('path');
var pinyin = require('pinyin');

let baseDir = './provinces';
baseDir = path.resolve(baseDir);
let china = 'https://geo.datav.aliyun.com/areas/bound/100000_full.json';

getData(baseDir, china);
function getData(dirName, url) {
  https.get(url, (res) => {

    const {statusCode} = res;
    const contentType = res.headers['content-type'];

    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.error(error.message);
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        circle(parsedData, dirName);
      } catch (e) {
        console.error(e.message);
      }
    });
  }).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
  })
}

function circle(jsonData, httpUrl) {
  for (let i = 0; i<jsonData.features.length; i++) {
    let adressCode= jsonData.features[i].properties.adcode;
    let name = jsonData.features[i].properties.name;

    let pinyinArr = pinyin(name, {
      style: pinyin.STYLE_NORMAL
    });
    name = pinyinArr.join('');
    let jsonName = name + '.json';
    let ref = 'https://geo.datav.aliyun.com/areas/bound/'+ adressCode +'_full.json'

    // 发送http请求
    https.get(ref, (res) => {
      let rawData = '';
      res.on('data', (d) => {
        rawData += d;
      });

      res.on('end', () => {
        try {
          const newData = JSON.parse(rawData);

          // 写文件
          let newDir = path.join(httpUrl, name);
          let newJson = path.join(newDir, jsonName);
          console.log(newDir);
          fs.mkdirSync(newDir);
          fs.writeFileSync(newJson, JSON.stringify(newData) , function(error){
            if(error){
              console.log(error);
            }
          });
          if (name === 'taiwansheng') return;
          circle(newData, newDir);
        }catch(e){
          console.log('没有_full.json数据');
          let jsonUrl = 'https://geo.datav.aliyun.com/areas/bound/'+ adressCode +'.json'
          https.get(jsonUrl, (result) => {
            let rawData1 = '';
            result.on('data', (d) => {
              rawData1 += d;
            })
            result.on('end', () => {
              try {
                // const rawData1 = JSON.parse(rawData1);
                 // 写文件
                let newDir = path.join(httpUrl, name);
                let newJson = path.join(newDir, jsonName);
                console.log(newDir);
                fs.mkdirSync(newDir);
                fs.writeFileSync(newJson, rawData1, function(error){
                  if(error){
                    console.log(error);
                  }
                });
                return;
              } catch (e) {
                console.error(e.message);
              }
            })
          });
          console.error(e.message);
        }
      });

    }).on('error', (e) => {
      console.error(e);
    });
  }
}



import React from "react";
import { Modal } from "antd";
import CryptoJS from "crypto-js";
import moment from "moment";
import { parse, stringify } from "qs";

import { trans } from "./i18n";

/**
 *
 * @param value
 */
export function fixedZero(value) {
  return value * 1 < 10 ? `0${value}` : value;
}

/**
 *
 * @param value
 * @param type
 */
export function formatDate(value, type) {
  if (!value) return;
  let date = new Date(value);
  let y, m, day, hour, min, seconds;
  y = date.getFullYear();
  m = fixedZero(date.getMonth() + 1);
  ((day = fixedZero(date.getDate())),
    (hour = fixedZero(date.getHours())),
    (min = fixedZero(date.getMinutes())),
    (seconds = fixedZero(date.getSeconds())));
  if (type == 1) {
    return y + "-" + m + "-" + day;
  } else if (type == 2) {
    return m + "-" + day;
  } else if (type == 3) {
    return y + "/" + m + "/" + day;
  } else if (type == 4) {
    return hour + ":" + min;
  } else if (type == 5) {
    return m + "-" + day + " " + hour + ":" + min;
  } else if (type == 6) {
    return hour + ":" + min + ":" + seconds;
  } else if (type == 7) {
    return y + "-" + m + "-" + day + " " + hour + ":" + min;
  }
}

/**
 *
 * @param type
 */
export function getTimeDistance(type) {
  const now = new Date();
  const oneDay = 1000 * 60 * 60 * 24;

  if (type === "today") {
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    return [moment(now), moment(now.getTime() + (oneDay - 1000))];
  }

  if (type === "week") {
    let day = now.getDay();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);

    if (day === 0) {
      day = 6;
    } else {
      day -= 1;
    }

    const beginTime = now.getTime() - day * oneDay;

    return [moment(beginTime), moment(beginTime + (7 * oneDay - 1000))];
  }

  if (type === "month") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const nextDate = moment(now).add(1, "months");
    const nextYear = nextDate.year();
    const nextMonth = nextDate.month();

    return [
      moment(`${year}-${fixedZero(month + 1)}-01 00:00:00`),
      moment(
        moment(
          `${nextYear}-${fixedZero(nextMonth + 1)}-01 00:00:00`,
        ).valueOf() - 1000,
      ),
    ];
  }

  const year = now.getFullYear();
  return [moment(`${year}-01-01 00:00:00`), moment(`${year}-12-31 23:59:59`)];
}

/**
 *
 * @param nodeList
 * @param parentPath
 */
export function getPlainNode(nodeList, parentPath = "") {
  const array = [];
  for (const node of nodeList) {
    const item = node;
    item.path = `${parentPath}/${item.path || ""}`.replaceAll(/\/+/g, "/");
    item.exact = true;
    if (item.children && !item.component) {
      array.push(...getPlainNode(item.children, item.path));
    } else {
      if (item.children && item.component) {
        item.exact = false;
      }
      array.push(item);
    }
  }
  return array;
}
// export function setupWKWebViewJavascriptBridge(callback) {
//   //安卓桥连接
//   if (window.WebViewJavascriptBridge) {
//     if (window.WebViewJavascriptBridge.inited) {
//       console.log('android1')

//     } else { //告诉安卓 javascript已经准备就绪，可以互相通信了
//       console.log('android4')
//       document.addEventListener(
//         'WebViewJavascriptBridgeReady'
//         , function () {
//           console.log('comeandroid')
//           window.WebViewJavascriptBridge.init(function (message, responseCallback) {
//           })
//           callback(window.WebViewJavascriptBridge)
//         },
//         false
//       );
//     }
//     return callback(window.WebViewJavascriptBridge)
//   } else { //告诉安卓 javascript已经准备就绪，可以互相通信了
//     console.log('android7')
//     document.addEventListener(
//       'WebViewJavascriptBridgeReady'
//       , function () {
//         console.log('comeandroid')
//         window.WebViewJavascriptBridge.init(function (message, responseCallback) {
//         })
//         callback(window.WebViewJavascriptBridge)
//       },
//       false
//     );
//   }
//   //ios桥连接
//   if (window.WKWebViewJavascriptBridge) {
//     console.log('android5')
//     return callback(WKWebViewJavascriptBridge);
//   }
//   if (window.WKWVJBCallbacks) {
//     console.log('android6')
//     return window.WKWVJBCallbacks.push(callback);
//   }
//   window.WKWVJBCallbacks = [callback];
//   try {
//     //使用此方法,会报错,因此使用try-catch
//     window.webkit.messageHandlers.iOS_Native_InjectJavascript.postMessage(null);
//   } catch (error) {
//     console.log(error, 'WKWebView post message');
//   }
// }
/**
 *
 * @param callback
 */
export function setupWKWebViewJavascriptBridge(callback) {
  //安卓桥连接
  if (window.WebViewJavascriptBridge) {
    console.log("come1");
    if (window.WebViewJavascriptBridge.inited) {
      console.log("come2");
      return callback(window.WebViewJavascriptBridge);
    } else {
      //告诉安卓 javascript已经准备就绪，可以互相通信了
      console.log("come3");
      document.addEventListener(
        "WebViewJavascriptBridgeReady",
        function () {
          window.WebViewJavascriptBridge.init(
            function (message, responseCallback) {},
          );
          callback(window.WebViewJavascriptBridge);
        },
        false,
      );
    }
  } else {
    //ios桥连接
    if (window.WKWebViewJavascriptBridge) {
      console.log("come4");
      return callback(WKWebViewJavascriptBridge);
    }
    if (window.WKWVJBCallbacks) {
      console.log("come5");
      return window.WKWVJBCallbacks.push(callback);
    }
    window.WKWVJBCallbacks = [callback];
  }

  try {
    console.log("come6");
    //使用此方法,会报错,因此使用try-catch
    window.webkit.messageHandlers.iOS_Native_InjectJavascript.postMessage(null);
  } catch {
    console.log("come7");
    console.log("WKWebView post message");
  }
}
/**
 *
 * @param string1
 * @param str2
 * @param string2
 */
function getRelation(string1, string2) {
  if (string1 === string2) {
    console.warn("Two path are equal!");
  }
  const array1 = string1.split("/");
  const array2 = string2.split("/");
  if (array2.every((item, index) => item === array1[index])) {
    return 1;
  }
  if (array1.every((item, index) => item === array2[index])) {
    return 2;
  }
  return 3;
}

/**
 *
 * @param routes
 */
function getRenderArray(routes) {
  let renderArray = [];
  renderArray.push(routes[0]);
  for (let index = 1; index < routes.length; index += 1) {
    // 去重
    renderArray = renderArray.filter(
      (item) => getRelation(item, routes[index]) !== 1,
    );
    // 是否包含
    const isAdd = renderArray.every(
      (item) => getRelation(item, routes[index]) === 3,
    );
    if (isAdd) {
      renderArray.push(routes[index]);
    }
  }
  return renderArray;
}

/**
 * Get router routing configuration
 * { path:{name,...param}}=>Array<{name,path ...param}>
 * @param {string} path
 * @param {routerData} routerData
 */
export function getRoutes(path, routerData) {
  let routes = Object.keys(routerData).filter(
    (routePath) => routePath.indexOf(path) === 0 && routePath !== path,
  );
  // Replace path to '' eg. path='user' /user/name => name
  routes = routes.map((item) => item.replace(path, ""));
  // Get the route to be rendered to remove the deep rendering
  const renderArray = getRenderArray(routes);
  // Conversion and stitching parameters
  return renderArray.map((item) => {
    const exact = !routes.some(
      (route) => route !== item && getRelation(route, item) === 1,
    );
    return {
      exact,
      ...routerData[`${path}${item}`],
      key: `${path}${item}`,
      path: `${path}${item}`,
    };
  });
}

/**
 *
 */
export function getPageQuery() {
  return parse(window.location.href.split("?")[1]);
}

/**
 *
 * @param path
 * @param query
 */
export function getQueryPath(path = "", query = {}) {
  const search = stringify(query);
  if (search.length > 0) {
    return `${path}?${search}`;
  }
  return path;
}

/* eslint no-useless-escape:0 */
const reg =
  /(((^https?:(?:\/\/)?)(?:[\w$&+,:;=-]+@)?[\d.A-Za-z-]+(?::\d+)?|(?:www.|[\w$&+,:;=-]+@)[\d.A-Za-z-]+)((?:\/[\w%+./~-]*)?\??[\w%&+.;=@-]*(?:#\w*)?)?)$/;

/**
 *
 * @param path
 */
export function isUrl(path) {
  return reg.test(path);
}

/**
 *
 * @param value
 */
export function formatWan(value) {
  const v = value * 1;
  if (!v || Number.isNaN(v)) return "";

  let result = value;
  if (value > 10_000) {
    result = Math.floor(value / 10_000);
    result = (
      <span>
        {result}
        <span
          style={{
            position: "relative",
            top: -2,
            fontSize: 14,
            fontStyle: "normal",
            marginLeft: 2,
          }}
        >
          {trans("global.tenThousandCompactUnit", "万")}
        </span>
      </span>
    );
  }
  return result;
}

// 给官方演示站点用，用于关闭真实开发环境不需要使用的特性
/**
 *
 */
export function isAntdPro() {
  return window.location.hostname === "preview.pro.ant.design";
}

export const importCDN = (url, name) =>
  new Promise((resolve) => {
    const dom = document.createElement("script");
    dom.src = url;
    dom.type = "text/javascript";
    dom.addEventListener("load", () => {
      resolve(window[name]);
    });
    document.head.append(dom);
  });

//重定向 -- 登录失效
// export function loginRedirect() {
//   let currentUrl = window.location.href;
//   currentUrl = currentUrl.replace(/(\?|&)ticket\=([0-9A-z]+?&|[0-9A-z]+)/ig, '');
//   let host = currentUrl.indexOf('daily') > -1
//     ? 'https://login.daily.yungu-inc.org'
//     : 'https://login.yungu.org';
//   window.location.href = host + '/cas/login?service=' + encodeURIComponent(currentUrl);
// }

let ifReload = true;
/**
 *
 */
export function loginRedirect() {
  if (!ifReload) return;
  ifReload = false;
  let isPC = true;
  var userAgentInfo = navigator.userAgent;
  var Agents = [
    "Android",
    "iPhone",
    "SymbianOS",
    "Windows Phone",
    "iPad",
    "iPod",
  ];
  for (const Agent of Agents) {
    if (userAgentInfo.includes(Agent)) {
      isPC = false;
    }
  }
  if (isPC) {
    //原来的逻辑
    Modal.confirm({
      content: (
        <div>{trans("gloal.notLog", "当前登录已失效，请点击确认重新登录")}</div>
      ),
      onOk: () => {
        let currentUrl = `${window.location.origin}/?ifClose=true${window.location.hash}`;
        currentUrl = currentUrl.replaceAll(
          /([&?])ticket=([\dA-z]+&|[\dA-z]+)/gi,
          "",
        );
        let host = currentUrl.includes("daily")
          ? "https://login.daily.yungu-inc.org"
          : "https://login.yungu.org";
        let loginUrl =
          host + "/cas/login?service=" + encodeURIComponent(currentUrl);
        window.open(loginUrl);
        ifReload = true;
      },
      className: "loginModal",
      width: 560,
      okText: trans("global.ok", "确认"),
      cancelText: trans("global.cancel", "取消"),
      onCancel() {
        ifReload = true;
      },
    });
  } else {
    Modal.confirm({
      content: (
        <div id="loginModal">
          {trans("gloal.notLog", "当前登录已失效，请点击确认重新登录")}
        </div>
      ),
      onOk: () => {
        let currentUrl = `${window.location.origin}/?ifH5=true`;
        const loginModal = document.querySelector("#loginModal");
        loginModal.innerHTML = "";
        const childFrame = document.createElement("iframe");
        currentUrl = currentUrl.replaceAll(
          /([&?])ticket=([\dA-z]+&|[\dA-z]+)/gi,
          "",
        );
        let host = currentUrl.includes("daily")
          ? "https://login.daily.yungu-inc.org"
          : "https://login.yungu.org";
        let loginUrl =
          host + "/cas/login?service=" + encodeURIComponent(currentUrl);
        Modal.confirm({
          content: (
            <div id="loginModal">
              <iframe
                src={loginUrl}
                style={{ height: "500px", width: "300px", border: "0" }}
              ></iframe>
            </div>
          ),
          className: "loginModal",
        });
        ifReload = true;
      },
      className: "loginModal",
      okText: trans("global.ok", "确认"),
      cancelText: trans("global.cancel", "取消"),
      onCancel() {
        ifReload = true;
      },
    });
  }
}
// 比较两个百分比字符串的大小。
/**
 *
 * @param percentage1
 * @param percentage2
 */
export function comparePercentages(percentage1, percentage2) {
  const percent1 = Number.parseFloat(percentage1);
  const percent2 = Number.parseFloat(percentage2);

  if (percent1 > percent2) {
    return 1;
  } else if (percent1 < percent2) {
    return -1;
  } else {
    return 0;
  }
}

//将阿拉伯数字题号转换为汉字
/**
 *
 * @param number_
 */
export function convertToChineseNumber(number_) {
  const chineseNumbers = [
    "",
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
  ];
  const chineseUnits = ["", "十", "百", "千", "万"];

  if (number_ === 0) {
    return "零";
  }
  if (number_ === 10) {
    return "十";
  }

  let result = "";
  let unitIndex = 0;

  while (number_ > 0) {
    const digit = number_ % 10;
    if (digit === 0) {
      if (result !== "" && result[0] !== "零") {
        result = "零" + result;
      }
    } else {
      result =
        unitIndex === 1 && digit === 1 && result !== ""
          ? chineseUnits[unitIndex] + result
          : chineseNumbers[digit] + chineseUnits[unitIndex] + result;
    }

    number_ = Math.floor(number_ / 10);
    unitIndex++;
  }

  return result;
}

// 传入 date ｜ time 返回当前时间 格式为：YYYY-MM-DD
/**
 *
 * @param format
 */
export function getCurrentTime(format) {
  const now = new Date();
  if (format === "date") {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } else if (format === "time") {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } else if (format == "seconds") {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0"); // 秒 (0~59)
    return `${hours}:${minutes}:${seconds}`;
  } else {
    return "Invalid format specified.";
  }
}
// 全屏
/**
 *
 * @param element
 */
export function openFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    /* Firefox */
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    /* Chrome, Safari 和 Opera */
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    /* IE/Edge */
    element.msRequestFullscreen();
  }
}

// 退出全屏
/**
 *
 */
export function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    /* Chrome, Safari and Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    /* IE/Edge */
    document.msExitFullscreen();
  }
}

// 是否为选择 多选 判断
/**
 *
 * @param question
 */
export function switchingSupport(question) {
  if (question.sonQuestionList && question.sonQuestionList.length > 0) {
    let type = question.sonQuestionList[0].type;
    if (type == 1 || type == 2 || type == 4 || type == 7 || type == 8) {
      return false;
    }
    return true;
  } else {
    let type = question.type;
    if (type == 1 || type == 2 || type == 4 || type == 7 || type == 8) {
      return false;
    }
    return true;
  }
}
// 节流
/**
 *
 * @param function_
 * @param gapTime
 */
export function throttle(function_, gapTime) {
  let _lastTime = null;
  return function () {
    let _nowTime = Date.now();
    if (_nowTime - _lastTime > gapTime || !_lastTime) {
      Reflect.apply(function_, this, arguments);
      _lastTime = _nowTime;
    }
  };
}

// 调用示例：设置一个名为"user"的Cookie，有效期为7天
// setCookie("user", "John Doe", 7);

/**
 *
 * @param name
 * @param value
 * @param days
 * @param path
 */
export function setCookie(name, value, days, path = "/") {
  let expires = "";
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=" + path;
}

/**
 *
 * @param text
 * @param fontSize
 * @param fontFamily
 */
export function getTextWidth(text, fontSize, fontFamily = "Arial") {
  // Create a temporary canvas element
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  // Set the font properties on the canvas context
  context.font = `${fontSize} ${fontFamily}`;

  // Measure the text width
  const textMetrics = context.measureText(text);
  return textMetrics.width;
}

// 加密
/**
 *
 * @param data
 * @param secretKey
 */
export function aesEncrypt(data, secretKey) {
  return CryptoJS.AES.encrypt(data, secretKey).toString();
}

// 解密
/**
 *
 * @param encryptedData
 * @param secretKey
 */
export function aesDecrypt(encryptedData, secretKey) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

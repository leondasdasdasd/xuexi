import fetch from "dva/fetch";

/**
 *
 * @param response
 */
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

/**
 * Requests a URL, returning a promise.
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @param progress
 * @param stop
 * @returns {object}           An object containing either "data" or "err"
 */
export default function request(url, options, progress, stop) {
  const defaultOptions = {
    credentials: "include",
  };
  const newOptions = { ...defaultOptions, ...options };

  if (
    newOptions.method === "POST" ||
    newOptions.method === "PUT" ||
    newOptions.method === "PATCH"
  ) {
    if (newOptions.toNative) {
      newOptions.headers = {
        Accept: "application/json",
        ...newOptions.headers,
      };
      newOptions.body = JSON.stringify(newOptions.body);
    } else if (
      newOptions.body instanceof FormData ||
      newOptions.body instanceof ArrayBuffer ||
      newOptions.body instanceof Uint8Array
    ) {
      // newOptions.body is FormData
      newOptions.headers = {
        Accept: "application/json",
        ...newOptions.headers,
      };
    } else {
      newOptions.headers = {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        ...newOptions.headers,
      };
      newOptions.body = JSON.stringify(newOptions.body);
    }
  }

  return fetch(url, newOptions, progress, stop)
    .then(checkStatus)
    .then((response) => {
      if (newOptions.method === "DELETE" || response.status === 204) {
        return response.text();
      }
      return response.json();
    })
    .catch((error) => ({
      err: error,
      // 旧 model 使用 !ifLogin 判断登录态，非鉴权故障必须显式保留已登录语义。
      ifLogin: error.response?.status !== 401,
    }));
}

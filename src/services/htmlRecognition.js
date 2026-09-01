import fetchPolyfill from "dva/fetch";
import request from "../utils/request";

const LOCAL_AI_API_BASE_URL = "/center/api";
const DAILY_AI_API_BASE_URL = "https://ai.daily.yungu-inc.org/center/api";
const PRODUCTION_AI_API_BASE_URL = "https://ai.yungu.org/center/api";

const STREAM_DONE_PAYLOAD = "[DONE]";
const CURRENT_HOST =
  typeof window !== "undefined" && window.location
    ? (window.location.hostname || window.location.host || "").toLowerCase()
    : "";

const HTML_RECOGNITION_API_BASE_URL = getHtmlRecognitionApiBaseUrl(CURRENT_HOST);
const HTML_RECOGNITION_COMPLETIONS_URL =
  `${HTML_RECOGNITION_API_BASE_URL}/llm/v1/chat/completions`;
const HTML_RECOGNITION_MODEL_LIST_URL = `${HTML_RECOGNITION_API_BASE_URL}/models`;
const fetchRequest = /** @type {Window["fetch"]} */ (
  fetchPolyfill.default || fetchPolyfill
);

/**
 * HTML 识题按当前页面域名选择固定 AI 网关。
 * @param {string} currentHost 当前页面 host
 * @returns {string} AI 网关基础地址
 */
function getHtmlRecognitionApiBaseUrl(currentHost) {
  if (currentHost.includes("local")) {
    return LOCAL_AI_API_BASE_URL;
  }

  if (currentHost.includes("yungu.org")) {
    return PRODUCTION_AI_API_BASE_URL;
  }

  return DAILY_AI_API_BASE_URL;
}

/**
 * 保持 fetch 流式请求和项目 request 的失败返回结构一致。
 * @param {Response} response 流式请求响应
 * @returns {Response|{err: Error}} 成功响应或错误对象
 */
function checkStreamStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  return {
    err: new Error(response.statusText || "HTML 识题请求失败"),
  };
}

/**
 * 从 OpenAI content part 中提取文本。
 * @param {object|string} part content 数组元素
 * @returns {string} 文本片段
 */
function getContentPartText(part) {
  if (typeof part === "string") {
    return part;
  }

  if (!part || typeof part !== "object") {
    return "";
  }

  if (typeof part.text === "string") {
    return part.text;
  }

  if (part.text && typeof part.text.value === "string") {
    return part.text.value;
  }

  if (typeof part.content === "string") {
    return part.content;
  }

  return "";
}

/**
 * 将 OpenAI 字符串或 content parts 统一成文本。
 * @param {Array<object|string>|string} content 消息内容
 * @returns {string} 消息文本
 */
function getContentText(content) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map((part) => getContentPartText(part)).join("");
  }

  return "";
}

/**
 * 按 OpenAI completions 响应优先级读取单个 choice 的文本。
 * @param {object} choice choices 数组元素
 * @returns {string} 模型输出文本
 */
function getChoiceText(choice) {
  if (!choice || typeof choice !== "object") {
    return "";
  }

  const deltaText = getContentText(choice.delta && choice.delta.content);
  if (deltaText) {
    return deltaText;
  }

  const messageText = getContentText(choice.message && choice.message.content);
  if (messageText) {
    return messageText;
  }

  return typeof choice.text === "string" ? choice.text : "";
}

/**
 * 从 OpenAI SSE payload 中抽取模型输出文本。
 * @param {object|string} payload SSE data 解析结果
 * @returns {string} 模型输出文本
 */
function getPayloadText(payload) {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (Array.isArray(payload.choices)) {
    return payload.choices.map((choice) => getChoiceText(choice)).join("");
  }

  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  if (payload.message) {
    return getContentText(payload.message.content);
  }

  return getContentText(payload.content);
}

/**
 * 解析单行 SSE data，非 JSON 文本会原样保留给后续 JSON 规范化。
 * @param {string} dataText SSE data 内容
 * @returns {string} 当前 data 中的模型输出
 */
function parseDataText(dataText) {
  const normalizedDataText = String(dataText || "").trim();

  if (!normalizedDataText || normalizedDataText === STREAM_DONE_PAYLOAD) {
    return "";
  }

  try {
    return getPayloadText(JSON.parse(normalizedDataText));
  } catch {
    return normalizedDataText;
  }
}

/**
 * 取出一个 SSE event 中所有 data 行。
 * @param {string} eventText SSE event 原文
 * @returns {string[]} data 行内容列表
 */
function getEventDataTextList(eventText) {
  return String(eventText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s?/, ""));
}

/**
 * 解析一个完整 SSE event，识别结束标记并拼接模型文本。
 * @param {string} eventText SSE event 原文
 * @returns {{done: boolean, text: string}} event 解析结果
 */
function parseStreamEvent(eventText) {
  const dataTextList = getEventDataTextList(eventText);

  return {
    done: dataTextList.some(
      (dataText) => dataText.trim() === STREAM_DONE_PAYLOAD,
    ),
    text: dataTextList.map((dataText) => parseDataText(dataText)).join(""),
  };
}

/**
 * 将 SSE buffer 解析为增量文本和需要继续保留的半包。
 * @param {string} buffer 当前累计 buffer
 * @param {boolean} [flush] 是否强制消费所有剩余内容
 * @returns {{done: boolean, remainingBuffer: string, text: string}} 解析结果
 */
function parseStreamBuffer(buffer, flush = false) {
  const normalizedBuffer = String(buffer || "").split("\r\n").join("\n");
  const bufferPartList = normalizedBuffer.split("\n\n");
  const hasIncompleteTail = !flush && !normalizedBuffer.endsWith("\n\n");
  const eventTextList = hasIncompleteTail
    ? bufferPartList.slice(0, -1)
    : bufferPartList;
  const remainingBuffer = hasIncompleteTail ? bufferPartList.at(-1) || "" : "";
  const eventList = eventTextList
    .filter((eventText) => eventText.trim())
    .map((eventText) => parseStreamEvent(eventText));
  const done = eventList.some((event) => event.done);

  return {
    done,
    remainingBuffer: done ? "" : remainingBuffer,
    text: eventList.map((event) => event.text).join(""),
  };
}

/**
 * 处理不支持 ReadableStream 的响应文本。
 * @param {string} text 响应文本
 * @returns {string} 模型输出文本
 */
function parseResponseText(text) {
  const streamResult = parseStreamBuffer(text, true);

  if (streamResult.text) {
    return streamResult.text;
  }

  try {
    return getPayloadText(JSON.parse(text));
  } catch {
    return text;
  }
}

/**
 * 把增量文本同步给调用方并返回原文本。
 * @param {string} text 模型输出文本
 * @param {Function} [onText] 增量文本回调
 * @returns {string} 模型输出文本
 */
function emitText(text, onText) {
  if (text && onText) {
    onText(text);
  }

  return text;
}

/**
 * 按 ReadableStream 消费 HTML 识题 SSE，并保留跨 chunk 的半包内容。
 * @param {Response} response 流式响应
 * @param {Function} [onText] 增量文本回调
 * @returns {Promise<string>} 完整模型输出文本
 */
function readHtmlRecognitionStream(response, onText) {
  if (!response.body || !response.body.getReader) {
    return response
      .text()
      .then((text) => emitText(parseResponseText(text), onText));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf8");
  const readNext = (buffer = "", resultText = "") =>
    reader.read().then(({ done, value }) => {
      const decodedText = value ? decoder.decode(value, { stream: !done }) : "";
      const streamResult = parseStreamBuffer(`${buffer}${decodedText}`, done);

      emitText(streamResult.text, onText);

      const nextResultText = `${resultText}${streamResult.text}`;
      if (done || streamResult.done) {
        return nextResultText;
      }

      return readNext(streamResult.remainingBuffer, nextResultText);
    });

  return readNext();
}

/**
 * 获取 HTML 识题可用模型。
 * @param {object} [requestOptions] 请求配置
 * @returns {Promise<object>} 模型列表响应
 */
export async function getHtmlRecognitionModelList(requestOptions = {}) {
  return request(HTML_RECOGNITION_MODEL_LIST_URL, {
    credentials: "include",
    ...requestOptions,
  });
}

/**
 * 调用 OpenAI 接口规范的 HTML 识题 completions，并按 SSE 流式读取模型输出。
 * @param {object} parameters OpenAI chat completions 请求参数
 * @param {object} [options] 流式消费配置
 * @param {Function} [options.onText] 每次识别到 delta.content 时回调
 * @returns {Promise<string|object>} 完整模型文本，失败时返回 request 兼容的 err 对象
 */
export async function recognizeQuestionsByHtmlStream(parameters, options = {}) {
  const response = await fetchRequest(HTML_RECOGNITION_COMPLETIONS_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "text/event-stream, application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      ...parameters,
      stream: true,
    }),
  }).then(checkStreamStatus);

  if ("err" in response) {
    return response;
  }

  return readHtmlRecognitionStream(response, options.onText);
}

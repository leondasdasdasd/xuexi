import * as mammoth from "mammoth/mammoth.browser";
import * as pdfjsLib from "pdfjs-dist/es5/build/pdf";
import { recognizeQuestionsByHtmlStream } from "../../services/htmlRecognition";
import { uploadImportImage } from "../../services/inputQuestion";
import { trans } from "../../utils/i18n";

export const IMPORT_FILE_ACCEPT =
  ".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf";

const IMPORT_PROMPT_TEMPLATE = `你需要把我提供的内容整理成题库导入 JSON。
要求如下：
1. 只输出 JSON 数组，不要输出任何解释、说明、备注、注释或 Markdown。
2. 不要遗漏任何题目。
3. 必须严格按照指定 JSON Schema 输出。
4. 题目内容要忠实原文，但不要求机械保留原始 HTML 标签结构。
5. content 字段必须尽量整理为适合 Slate 富文本解析和保存的 HTML 字符串：
   - 文字尽量用 <p>...</p> 包裹
   - 图片尽量用 <p><img src="图片地址" alt="" /></p> 保留
   - 图片要尽量放在原题对应位置
   - 如果无法提取图片地址但能确认有图，写成 <p>[图片]</p>
   - 尽量不用复杂标签和样式，优先只保留 <p>、<img>、<strong>、<em>、<sub>、<sup>、<br>
   - 如果原文里有承载有效信息的简单表格，允许保留 <table>、<tbody>、<tr>、<td>、<th>，不要省略整张表
6. 如果题目中有题号，保留题号。
7. 不要编造答案、解析、选项、图片地址、小题、知识点、章节。
8. 没有标准答案时，按题型填默认值，不要猜测。
9. 没有解析时，analysis 统一填 "无"。
10. 无法识别章节/知识点时，对应字段统一留空。
11. 填空题题干中的每一个空都必须写成 ________。
12. 原文存在下划线空白时，应视为填空位；JSON 题干中转换为 ________，HTML 预览/编辑区保留下划线显示。
13. 输出必须是合法 JSON，可被 JSON.parse 直接解析。

题型规则：
- 1 = 单选题
- 2 = 多选题
- 3 = 填空题
- 4 = 判断题
- 5 = 问答题 / 解答题 / 简答题 / 应用题 / 操作题 / 计算题（无小题）
- 6 = 组合题

识别规则：
1. 有小题如“（1）（2）（3）”“1. 2. 3.” 且同属一道大题的，必须用组合题 type=6。
2. 计算题、应用题、操作题只要包含多个小问，也必须用组合题 type=6。
3. 单独一道解答题、应用题、操作题、计算题，没有显式小题时，用 type=5。
4. 选择题必须拆出 optionList，不要把选项塞进 content 里冒充普通段落。
5. 即使选项不完整，只要能判断是选择题，也要保留题干和已有选项。
6. 图形、示意图优先转为图片保留；表格如果承载题干、材料、数据、选项映射等有效信息，优先保留为简单表格 HTML。
7. 如果表格无法完整保留，至少把表格内容按行转写到 content 里，不要整张表直接丢弃。
8. 判断题 answer 必须是 true 或 false；无法判断时填 ""。
9. 单选题 answer 必须是单个大写字母，如 "A"。
10. 多选题 answer 必须是多个大写字母按升序拼接，如 "ACD"。
11. 问答题 type=5 的 answer 是字符串，可以为空字符串。
12. 填空题 type=3 不使用顶层 answer，answer 固定写 null，答案写入 gapFillingAnswer。
13. 组合题 type=6 的 answer 固定写 ""，子题写入 sonQuestionList。

通用默认值：
- "questionLevel": 1
- "questionLevelName": "简单"
- "analysis": "无"
- "chapterIds": []
- "chapterNameHints": []
- "knowledgeIds": []
- "knowledgeNameHints": []

JSON Schema：
最外层必须是数组：
[
  Question,
  Question
]

Question 对象允许且建议使用以下字段，不要额外输出无关字段：
{
  "type": 1 | 2 | 3 | 4 | 5 | 6,
  "content": "<p>题干 HTML</p>",
  "analysis": "无 或 解析 HTML/文本",
  "answer": "按题型填写",
  "optionList": [],
  "gapFillingAnswer": {
    "isOrder": false,
    "answerGroups": []
  },
  "sonQuestionList": [],
  "questionLevel": 1,
  "questionLevelName": "简单",
  "chapterIds": [],
  "chapterNameHints": [],
  "knowledgeIds": [],
  "knowledgeNameHints": []
}

字段详细约束：
1. content: 必填，字符串，必须是 HTML 字符串。
2. analysis: 必填，字符串；没有解析时填 "无"。
3. questionLevel: 必填，固定填 1，除非原文明确体现难度。
4. questionLevelName: 必填，通常填 "简单"，与 questionLevel 对应。
5. chapterIds / knowledgeIds:
   - 必须是数字数组
   - 无法识别时填 []
6. chapterNameHints / knowledgeNameHints:
   - 必须是字符串数组
   - 无法识别时填 []
7. optionList:
   - 仅 type=1 或 type=2 使用
   - 必须是数组
   - 每项结构为 { "key": "A", "answers": "<p>选项内容</p>", "knowledgeIds": [] }
   - key 优先使用 A/B/C/D...
   - answers 必须只放该选项内容，不要再带 "A." 前缀
8. gapFillingAnswer:
   - 仅 type=3 使用
   - 结构必须为：
     {
       "isOrder": false,
       "answerGroups": [
         {
           "answers": [
             { "content": "答案1" },
             { "content": "同义答案1-2" }
           ]
         },
         {
           "answers": [
             { "content": "答案2" }
           ]
         }
       ]
     }
   - answerGroups 的每一项代表一个空
   - 同一个空的多个可接受答案，放在同一个 group 的 answers 数组里
   - content 必须是字符串，可用简单 HTML
9. sonQuestionList:
   - 仅 type=6 使用
   - 必须是 Question 数组
   - 子题本身也必须完整包含 type/content/analysis/answer 等字段
   - 子题不要再嵌套无意义的大题壳

各题型输出模板：

1. 单选题 type=1
{
  "type": 1,
  "content": "<p>题干</p>",
  "analysis": "无",
  "answer": "A",
  "optionList": [
    { "key": "A", "answers": "<p>选项A</p>", "knowledgeIds": [] },
    { "key": "B", "answers": "<p>选项B</p>", "knowledgeIds": [] }
  ],
  "gapFillingAnswer": { "isOrder": false, "answerGroups": [] },
  "sonQuestionList": [],
  "questionLevel": 1,
  "questionLevelName": "简单",
  "chapterIds": [],
  "chapterNameHints": [],
  "knowledgeIds": [],
  "knowledgeNameHints": []
}

2. 多选题 type=2
{
  "type": 2,
  "content": "<p>题干</p>",
  "analysis": "无",
  "answer": "AC",
  "optionList": [
    { "key": "A", "answers": "<p>选项A</p>", "knowledgeIds": [] },
    { "key": "B", "answers": "<p>选项B</p>", "knowledgeIds": [] },
    { "key": "C", "answers": "<p>选项C</p>", "knowledgeIds": [] }
  ],
  "gapFillingAnswer": { "isOrder": false, "answerGroups": [] },
  "sonQuestionList": [],
  "questionLevel": 1,
  "questionLevelName": "简单",
  "chapterIds": [],
  "chapterNameHints": [],
  "knowledgeIds": [],
  "knowledgeNameHints": []
}

3. 填空题 type=3
{
  "type": 3,
  "content": "<p>题干 ________ ，第二空 ________ 。</p>",
  "analysis": "无",
  "answer": null,
  "optionList": [],
  "gapFillingAnswer": {
    "isOrder": false,
    "answerGroups": [
      { "answers": [{ "content": "答案1" }] },
      { "answers": [{ "content": "答案2" }] }
    ]
  },
  "sonQuestionList": [],
  "questionLevel": 1,
  "questionLevelName": "简单",
  "chapterIds": [],
  "chapterNameHints": [],
  "knowledgeIds": [],
  "knowledgeNameHints": []
}

4. 判断题 type=4
{
  "type": 4,
  "content": "<p>题干</p>",
  "analysis": "无",
  "answer": true,
  "optionList": [],
  "gapFillingAnswer": { "isOrder": false, "answerGroups": [] },
  "sonQuestionList": [],
  "questionLevel": 1,
  "questionLevelName": "简单",
  "chapterIds": [],
  "chapterNameHints": [],
  "knowledgeIds": [],
  "knowledgeNameHints": []
}

5. 问答题 type=5
{
  "type": 5,
  "content": "<p>题干</p>",
  "analysis": "无",
  "answer": "",
  "optionList": [],
  "gapFillingAnswer": { "isOrder": false, "answerGroups": [] },
  "sonQuestionList": [],
  "questionLevel": 1,
  "questionLevelName": "简单",
  "chapterIds": [],
  "chapterNameHints": [],
  "knowledgeIds": [],
  "knowledgeNameHints": []
}

6. 组合题 type=6
{
  "type": 6,
  "content": "<p>大题题干</p>",
  "analysis": "无",
  "answer": "",
  "optionList": [],
  "gapFillingAnswer": { "isOrder": false, "answerGroups": [] },
  "sonQuestionList": [
    {
      "type": 1,
      "content": "<p>（1）子题题干</p>",
      "analysis": "无",
      "answer": "B",
      "optionList": [
        { "key": "A", "answers": "<p>选项A</p>", "knowledgeIds": [] },
        { "key": "B", "answers": "<p>选项B</p>", "knowledgeIds": [] }
      ],
      "gapFillingAnswer": { "isOrder": false, "answerGroups": [] },
      "sonQuestionList": [],
      "questionLevel": 1,
      "questionLevelName": "简单",
      "chapterIds": [],
      "chapterNameHints": [],
      "knowledgeIds": [],
      "knowledgeNameHints": []
    }
  ],
  "questionLevel": 1,
  "questionLevelName": "简单",
  "chapterIds": [],
  "chapterNameHints": [],
  "knowledgeIds": [],
  "knowledgeNameHints": []
}

强约束：
1. 不要输出 questionList 包裹对象，最外层直接输出数组。
2. 不要输出 uid、id、sort、score、createdAt、updatedAt、remark、source 等无关字段。
3. 不要把答案写成“答案：A”“正确答案是A”，只保留纯值。
4. 不要把 optionList 写成对象映射，必须是数组。
5. 不要把填空题答案写成字符串数组，必须写成 gapFillingAnswer.answerGroups 结构。
6. 不要把组合题子题写到 content 里，子题必须拆到 sonQuestionList。
7. 如果原文没有明确章节/知识点，不要猜，相关字段保持空数组。
8. 如果原文中出现了有意义的表格，不要整张删掉；优先保留简单 table HTML，至少保留行列文本信息。

下面是待整理内容：{{}}`;

const INLINE_TAGS = new Set(["strong", "em", "sub", "sup", "br"]);
const PARAGRAPH_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
]);
const INLINE_FALLBACK_TAGS = new Set([
  "span",
  "font",
  "a",
  "b",
  "i",
  "u",
  "s",
  "small",
  "mark",
  "code",
  "label",
]);
const LIST_TAGS = new Set(["ul", "ol"]);
const CONTAINER_TAGS = new Set([
  "div",
  "section",
  "article",
  "main",
  "header",
  "footer",
  "aside",
  "figure",
  "figcaption",
  "tbody",
  "thead",
  "tfoot",
]);
const GRAPHIC_TAGS = new Set([
  "svg",
  "canvas",
  "math",
  "object",
  "embed",
  "iframe",
  "video",
  "audio",
  "shape",
]);
const IMAGE_PREFIX_REG = /^(data:|blob:|file:)/i;
const DOCX_EXTENSION_REG = /\.docx$/i;
const PDF_EXTENSION_REG = /\.pdf$/i;
const PNG_MIME_TYPE = "image/png";
const IMPORT_IMAGE_INLINE_STYLE =
  "max-width: 100%; max-height: 320px; width: auto; height: auto; object-fit: contain;";

let uploadSeed = 0;

// 当前 tsconfig 目标库不包含 String.replaceAll，导入清洗链路统一用 split/join 做全量替换。
const replaceAllText = (value, searchValue, replacement) =>
  String(value).split(searchValue).join(replacement);

const escapeHtml = (value) => {
  const text = String(value === undefined || value === null ? "" : value);
  const escapedAmpersandText = replaceAllText(text, "&", "&amp;");
  const escapedLessThanText = replaceAllText(escapedAmpersandText, "<", "&lt;");
  const escapedGreaterThanText = replaceAllText(
    escapedLessThanText,
    ">",
    "&gt;",
  );
  const escapedDoubleQuoteText = replaceAllText(
    escapedGreaterThanText,
    '"',
    "&quot;",
  );
  return replaceAllText(escapedDoubleQuoteText, "'", "&#39;");
};

const escapeAttribute = (value) => escapeHtml(value).split("\0").join("");

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", (event) =>
      resolve(event && event.target ? event.target.result : null),
    );
    reader.onerror = () =>
      reject(
        new Error(
          trans("jsonInput.fileReadFailed", "文件读取失败，请稍后重试"),
        ),
      );
    reader.readAsArrayBuffer(file);
  });

const getFileExtensionByMime = (mimeType = "") => {
  if (mimeType.includes("png")) {
    return "png";
  }
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return "jpg";
  }
  if (mimeType.includes("gif")) {
    return "gif";
  }
  if (mimeType.includes("bmp")) {
    return "bmp";
  }
  if (mimeType.includes("webp")) {
    return "webp";
  }
  if (mimeType.includes("svg")) {
    return "svg";
  }
  return "png";
};

const base64ToFile = (base64, fileName, mimeType) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, {
    type: mimeType || "application/octet-stream",
  });
};

const blobToFile = (blob, fileName) =>
  new File([blob], fileName, {
    type: blob.type || "application/octet-stream",
  });

const loadImageElement = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.onerror = () =>
      reject(new Error(trans("jsonInput.imageDecodeFailed", "图片解析失败")));
    image.src = source;
  });

const canvasToPngBlob = (canvas) =>
  new Promise((resolve, reject) => {
    if (!canvas || typeof canvas.toBlob !== "function") {
      reject(new Error(trans("global.uploadFailed", "图片上传失败")));
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(trans("global.uploadFailed", "图片上传失败")));
          return;
        }
        resolve(blob);
      },
      PNG_MIME_TYPE,
      1,
    );
  });

const createPlaceholderImageFile = async (fileName) => {
  const canvas = document.createElement("canvas");
  canvas.width = 240;
  canvas.height = 96;
  const context = canvas.getContext("2d");

  if (!context) {
    return new File(["[图片]"], fileName, {
      type: PNG_MIME_TYPE,
    });
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#d7deeb";
  context.lineWidth = 2;
  context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  context.fillStyle = "#50607a";
  context.font = "24px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("[图片]", canvas.width / 2, canvas.height / 2);

  const blob = await canvasToPngBlob(canvas);
  return blobToFile(blob, fileName);
};

const rasterizeImageFileToPng = async (file, fileName) => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageElement(objectUrl);
    const naturalWidth = image.naturalWidth || image.width || 1;
    const naturalHeight = image.naturalHeight || image.height || 1;
    const canvas = document.createElement("canvas");
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(trans("global.uploadFailed", "图片上传失败"));
    }

    context.drawImage(image, 0, 0, naturalWidth, naturalHeight);
    const blob = await canvasToPngBlob(canvas);
    return blobToFile(blob, fileName);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const normalizeImageFileForUpload = async (file, baseName) => {
  const fileName = `${baseName}.png`;

  try {
    return await rasterizeImageFileToPng(file, fileName);
  } catch {
    return createPlaceholderImageFile(fileName);
  }
};

const normalizeAssetUrl = (url) => {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("//")) {
    return `${window.location.protocol}${url}`;
  }

  if (url.startsWith("/")) {
    if (window.location.origin.includes("localhost")) {
      return `https://task.daily.yungu-inc.org${url}`;
    }
    return `${window.location.origin}${url}`;
  }

  return url;
};

const extractUrlFromPayload = (payload, visited = new Set()) => {
  if (!payload || visited.has(payload)) {
    return "";
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (!trimmed) {
      return "";
    }

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
      return trimmed;
    }

    const matchedUrl = trimmed.match(/https?:\/\/[^\s"'<>]+/i);
    if (matchedUrl) {
      return matchedUrl[0];
    }

    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return extractUrlFromPayload(JSON.parse(trimmed), visited);
      } catch {
        return "";
      }
    }

    return "";
  }

  if (typeof payload !== "object") {
    return "";
  }

  visited.add(payload);

  if (Array.isArray(payload)) {
    for (const element of payload) {
      const matched = extractUrlFromPayload(element, visited);
      if (matched) {
        return matched;
      }
    }
    return "";
  }

  const preferredKeys = [
    "url",
    "fileUrl",
    "filePath",
    "path",
    "src",
    "link",
    "data",
    "content",
  ];

  for (const key of preferredKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const matched = extractUrlFromPayload(payload[key], visited);
      if (matched) {
        return matched;
      }
    }
  }

  const keys = Object.keys(payload);
  for (const key of keys) {
    const matched = extractUrlFromPayload(payload[key], visited);
    if (matched) {
      return matched;
    }
  }

  return "";
};

const assertRequestSuccess = (response, fallbackMessage) => {
  if (!response) {
    throw new Error(fallbackMessage);
  }

  if (response.err) {
    throw new Error(response.err.message || fallbackMessage);
  }

  if (response.ifLogin === false) {
    throw new Error(
      response.message || trans("global.notLogin", "登录状态已失效"),
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(response, "status") &&
    response.status === false
  ) {
    throw new Error(response.message || fallbackMessage);
  }

  if (response.content && response.content.error) {
    throw new Error(response.content.error.message || fallbackMessage);
  }

  return response;
};

const uploadImportAsset = async (file) => {
  const response = assertRequestSuccess(
    await uploadImportImage(file),
    trans("global.uploadFailed", "图片上传失败"),
  );
  const uploadUrl = extractUrlFromPayload(
    response.content === undefined ? response : response.content,
  );
  if (!uploadUrl) {
    throw new Error(trans("global.uploadFailed", "图片上传失败"));
  }
  return normalizeAssetUrl(uploadUrl);
};

const shouldUploadAgain = (source) => IMAGE_PREFIX_REG.test(source || "");

const normalizeImportedImageSource = async (source) => {
  if (!source) {
    return "";
  }

  if (!shouldUploadAgain(source)) {
    return normalizeAssetUrl(source);
  }

  const response = await fetch(source);
  const blob = await response.blob();
  uploadSeed += 1;
  const file = blobToFile(
    blob,
    `json-question-import-${Date.now()}-${uploadSeed}.${getFileExtensionByMime(blob.type)}`,
  );
  const normalizedFile = await normalizeImageFileForUpload(
    file,
    `json-question-import-${Date.now()}-${uploadSeed}`,
  );
  return uploadImportAsset(normalizedFile);
};

const compactParagraphHtml = (html) => {
  const normalizedHtml = replaceAllText(String(html || ""), "​", "");
  const compactBreakHtml = replaceAllText(
    normalizedHtml,
    /(?:<br\s*\/?>\s*){3,}/i,
    "<br /><br />",
  );
  const trimmedStartHtml = replaceAllText(
    compactBreakHtml,
    /^(?:<br\s*\/?>\s*)+/i,
    "",
  );
  return replaceAllText(trimmedStartHtml, /(?:<br\s*\/?>\s*)+$/i, "").trim();
};

const isUnderlineNode = (node) => {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  const tagName = String(node.tagName || "").toLowerCase();
  if (tagName === "u") {
    return true;
  }

  const style = String(node.getAttribute("style") || "").toLowerCase();
  return /text-decoration(?:-line)?\s*:[^;]*underline/.test(style);
};

const buildUnderlineBlankHtml = (node) => {
  const text = String((node && node.textContent) || "");
  const blankLength = Math.min(
    16,
    Math.max(4, replaceAllText(text, /\S/, "").length || 4),
  );
  return `<u>${new Array(blankLength + 1).join("&nbsp;")}</u>`;
};

const sanitizeUnderlineNode = async (node) => {
  const innerHtml = await sanitizeInlineChildren(node);
  if (innerHtml) {
    return `<u>${innerHtml}</u>`;
  }

  const text = String((node && node.textContent) || "");
  if (text && !replaceAllText(text, /\s/, "")) {
    return buildUnderlineBlankHtml(node);
  }

  return "";
};

const sanitizeInlineChildren = async (node) => {
  let html = "";

  const children = [...(node.childNodes || [])];
  for (const child of children) {
    html += await sanitizeInlineNode(child);
  }

  return compactParagraphHtml(html);
};

const sanitizeImageNode = async (node) => {
  const source = node.getAttribute("src") || "";
  const normalizedSource = await normalizeImportedImageSource(source);
  if (!normalizedSource) {
    return "";
  }
  return `<img src="${escapeAttribute(
    normalizedSource,
  )}" alt="" style="${IMPORT_IMAGE_INLINE_STYLE}" />`;
};

const sanitizeInlineNode = async (node) => {
  if (!node) {
    return "";
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const text = replaceAllText(node.textContent || "", /\s+/, " ");
    return text.trim() ? escapeHtml(text) : "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const tagName = String(node.tagName || "").toLowerCase();

  if (tagName === "img") {
    return sanitizeImageNode(node);
  }

  if (tagName === "br") {
    return "<br />";
  }

  if (GRAPHIC_TAGS.has(tagName)) {
    return "[图片]";
  }

  if (isUnderlineNode(node)) {
    return sanitizeUnderlineNode(node);
  }

  if (INLINE_TAGS.has(tagName)) {
    if (tagName === "br") {
      return "<br />";
    }
    const innerHtml = await sanitizeInlineChildren(node);
    return innerHtml ? `<${tagName}>${innerHtml}</${tagName}>` : "";
  }

  const innerHtml = await sanitizeInlineChildren(node);
  return innerHtml || "";
};

const sanitizeTableNode = async (node) => {
  const rows = [...node.querySelectorAll("tr")];
  if (rows.length === 0) {
    return "";
  }

  const rowHtmlList = [];

  for (const rowNode of rows) {
    const cells = [...(rowNode.children || [])].filter((cellNode) => {
      const tagName = String(cellNode.tagName || "").toLowerCase();
      return tagName === "td" || tagName === "th";
    });

    if (cells.length === 0) {
      continue;
    }

    const cellHtmlList = [];
    for (const cellNode of cells) {
      const tagName =
        String(cellNode.tagName || "").toLowerCase() === "th" ? "th" : "td";
      const colspan = Number.parseInt(cellNode.getAttribute("colspan"), 10);
      const rowspan = Number.parseInt(cellNode.getAttribute("rowspan"), 10);
      const innerHtml = (await sanitizeInlineChildren(cellNode)) || "&nbsp;";
      const attributes = [];

      if (colspan > 1) {
        attributes.push(` colspan="${colspan}"`);
      }
      if (rowspan > 1) {
        attributes.push(` rowspan="${rowspan}"`);
      }

      cellHtmlList.push(
        `<${tagName}${attributes.join("")}>${innerHtml}</${tagName}>`,
      );
    }

    if (cellHtmlList.length > 0) {
      rowHtmlList.push(`<tr>${cellHtmlList.join("")}</tr>`);
    }
  }

  if (rowHtmlList.length === 0) {
    return "";
  }

  return `<table><tbody>${rowHtmlList.join("")}</tbody></table>`;
};

const sanitizeListNode = async (node) => {
  const itemNodes = [...(node.children || [])].filter(
    (childNode) => String(childNode.tagName || "").toLowerCase() === "li",
  );

  const blockList = [];
  for (const itemNode of itemNodes) {
    const itemHtml = await sanitizeInlineChildren(itemNode);
    if (itemHtml) {
      blockList.push(`<p>${itemHtml}</p>`);
    }
  }

  return blockList;
};

const sanitizeBlockNodes = async (node) => {
  const blocks = [];
  let inlineBuffer = "";

  const flushInlineBuffer = () => {
    const content = compactParagraphHtml(inlineBuffer);
    if (content) {
      blocks.push(`<p>${content}</p>`);
    }
    inlineBuffer = "";
  };

  const childNodes = [...(node.childNodes || [])];
  for (const childNode of childNodes) {
    if (childNode.nodeType === Node.TEXT_NODE) {
      inlineBuffer += await sanitizeInlineNode(childNode);
      continue;
    }

    if (childNode.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const tagName = String(childNode.tagName || "").toLowerCase();

    if (tagName === "img") {
      flushInlineBuffer();
      const imgHtml = await sanitizeImageNode(childNode);
      if (imgHtml) {
        blocks.push(`<p>${imgHtml}</p>`);
      }
      continue;
    }

    if (tagName === "table") {
      flushInlineBuffer();
      const tableHtml = await sanitizeTableNode(childNode);
      if (tableHtml) {
        blocks.push(tableHtml);
      }
      continue;
    }

    if (PARAGRAPH_TAGS.has(tagName)) {
      flushInlineBuffer();
      const paragraphHtml = await sanitizeInlineChildren(childNode);
      if (paragraphHtml) {
        blocks.push(`<p>${paragraphHtml}</p>`);
      }
      continue;
    }

    if (LIST_TAGS.has(tagName)) {
      flushInlineBuffer();
      const listBlocks = await sanitizeListNode(childNode);
      blocks.push(...listBlocks);
      continue;
    }

    if (GRAPHIC_TAGS.has(tagName)) {
      flushInlineBuffer();
      blocks.push("<p>[图片]</p>");
      continue;
    }

    if (INLINE_FALLBACK_TAGS.has(tagName) || INLINE_TAGS.has(tagName)) {
      inlineBuffer += await sanitizeInlineNode(childNode);
      continue;
    }

    if (CONTAINER_TAGS.has(tagName)) {
      flushInlineBuffer();
      const nestedBlocks = await sanitizeBlockNodes(childNode);
      if (nestedBlocks.length > 0) {
        blocks.push(...nestedBlocks);
      }
      continue;
    }

    const nestedInlineHtml = await sanitizeInlineChildren(childNode);
    if (nestedInlineHtml) {
      inlineBuffer += nestedInlineHtml;
    }
  }

  flushInlineBuffer();

  return blocks.filter(Boolean);
};

export const sanitizeImportedHtml = async (rawHtml) => {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
    `<div>${rawHtml || ""}</div>`,
    "text/html",
  );
  const rootNode = documentNode.body.firstElementChild || documentNode.body;
  const blocks = await sanitizeBlockNodes(rootNode);
  return blocks.join("");
};

const convertDocxFileToHtml = async (file) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const result = await mammoth.convertToHtml(
    {
      arrayBuffer,
    },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        uploadSeed += 1;
        const base64 = await image.read("base64");
        const extension = getFileExtensionByMime(image.contentType);
        const sourceFile = base64ToFile(
          base64,
          `json-question-import-docx-${Date.now()}-${uploadSeed}.${extension}`,
          image.contentType,
        );
        const uploadFile = await normalizeImageFileForUpload(
          sourceFile,
          `json-question-import-docx-${Date.now()}-${uploadSeed}`,
        );
        const imageUrl = await uploadImportAsset(uploadFile);
        return {
          alt: "",
          src: imageUrl,
        };
      }),
      ignoreEmptyParagraphs: false,
    },
  );

  return sanitizeImportedHtml(result.value);
};

const buildPdfLineList = (items) => {
  const normalizedItems = (items || [])
    .map((item) => ({
      text: String(item.str || "")
        .split(/\s+/)
        .join(" ")
        .trim(),
      x: Number(item.transform && item.transform[4]) || 0,
      y: Number(item.transform && item.transform[5]) || 0,
      width: Number(item.width) || 0,
    }))
    .filter((item) => item.text);

  normalizedItems.sort((previousItem, nextItem) => {
    if (Math.abs(previousItem.y - nextItem.y) > 2) {
      return nextItem.y - previousItem.y;
    }
    return previousItem.x - nextItem.x;
  });

  const lines = [];
  for (const item of normalizedItems) {
    const currentLine = lines.at(-1);
    if (!currentLine || Math.abs(currentLine.y - item.y) > 4) {
      lines.push({
        items: [item],
        y: item.y,
      });
      continue;
    }
    currentLine.items.push(item);
  }

  return lines
    .map((line) =>
      line.items
        .sort((previousItem, nextItem) => previousItem.x - nextItem.x)
        .map((item, index) => {
          if (index === 0) {
            return item.text;
          }
          const previousItem = line.items[index - 1];
          const gap = item.x - previousItem.x - Math.max(previousItem.width, 0);
          return `${gap > 6 ? " " : ""}${item.text}`;
        })
        .join("")
        .split(/\s+/)
        .join(" ")
        .trim(),
    )
    .filter(Boolean);
};

const pageHasGraphicContent = async (page, pdfjsLibrary) => {
  try {
    const operatorList = await page.getOperatorList();
    const graphicOps = new Set(
      [
        pdfjsLibrary.OPS.paintImageXObject,
        pdfjsLibrary.OPS.paintImageMaskXObject,
        pdfjsLibrary.OPS.paintInlineImageXObject,
        pdfjsLibrary.OPS.paintInlineImageXObjectGroup,
        pdfjsLibrary.OPS.paintImageMaskXObjectGroup,
        pdfjsLibrary.OPS.paintJpegXObject,
      ].filter((item) => item !== undefined),
    );

    return (operatorList.fnArray || []).some((item) => graphicOps.has(item));
  } catch {
    return false;
  }
};

const convertPdfFileToHtml = async (file) => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableWorker: true,
    useWorkerFetch: false,
  });
  const pdfDocument = await loadingTask.promise;
  const blockList = [];

  for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex += 1) {
    const page = await pdfDocument.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const lineList = buildPdfLineList(textContent.items || []);
    const hasGraphic = await pageHasGraphicContent(page, pdfjsLib);

    for (const line of lineList) {
      blockList.push(`<p>${escapeHtml(line)}</p>`);
    }

    if (lineList.length === 0 || hasGraphic) {
      blockList.push("<p>[图片]</p>");
    }
  }

  if (loadingTask && typeof loadingTask.destroy === "function") {
    loadingTask.destroy();
  }

  return sanitizeImportedHtml(blockList.join(""));
};

export const convertImportFileToHtml = async (file) => {
  if (!file) {
    throw new Error(trans("jsonInput.fileMissing", "请先选择需要导入的文件"));
  }

  if (DOCX_EXTENSION_REG.test(file.name || "")) {
    return convertDocxFileToHtml(file);
  }

  if (PDF_EXTENSION_REG.test(file.name || "")) {
    return convertPdfFileToHtml(file);
  }

  throw new Error(
    trans("jsonInput.fileTypeInvalid", "仅支持上传 docx 或 pdf 文件"),
  );
};

const normalizePromptText = (value) =>
  replaceAllText(
    value === undefined || value === null ? "" : value,
    /\s+/,
    " ",
  ).trim();

const summarizeTablesForPrompt = (html) => {
  if (!String(html || "").trim()) {
    return "";
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
    `<div>${String(html || "")}</div>`,
    "text/html",
  );
  const tableNodes = [...documentNode.querySelectorAll("table")];

  const tableBlocks = tableNodes
    .map((tableNode, tableIndex) => {
      const rowLines = [...tableNode.querySelectorAll("tr")]
        .map((rowNode, rowIndex) => {
          const cells = [...(rowNode.children || [])]
            .filter((cellNode) => {
              const tagName = String(cellNode.tagName || "").toLowerCase();
              return tagName === "td" || tagName === "th";
            })
            .map((cellNode) => {
              const text = normalizePromptText(cellNode.textContent || "");
              const hasImage = !!cellNode.querySelector("img");

              if (text && hasImage) {
                return `${text} [图片]`;
              }
              if (text) {
                return text;
              }
              if (hasImage) {
                return "[图片]";
              }
              return "";
            })
            .filter(Boolean);

          if (cells.length === 0) {
            return "";
          }

          return `第${rowIndex + 1}行：${cells.join(" | ")}`;
        })
        .filter(Boolean);

      if (rowLines.length === 0) {
        return "";
      }

      return [`[表格${tableIndex + 1}]`, ...rowLines].join("\n");
    })
    .filter(Boolean);

  if (tableBlocks.length === 0) {
    return "";
  }

  return `\n\n补充表格摘要（供表格结构识别失败时参考，若表格有意义请优先保留简单 table HTML）：\n${tableBlocks.join(
    "\n\n",
  )}`;
};

export const buildImportPrompt = (html) => {
  const sourceHtml = html || "";
  const tableSummary = summarizeTablesForPrompt(sourceHtml);
  return IMPORT_PROMPT_TEMPLATE.replace("{{}}", `${sourceHtml}${tableSummary}`);
};

const stripJsonCodeFence = (text) => {
  const matched = String(text || "")
    .trim()
    .match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return matched ? matched[1].trim() : String(text || "").trim();
};

const tryParseJsonCandidate = (text) => {
  const candidate = String(text || "").trim();
  if (!candidate) {
    return null;
  }

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
};

const normalizeAiJsonText = (rawText) => {
  const cleanedText = stripJsonCodeFence(rawText);
  const candidateList = [cleanedText];
  const arrayStart = cleanedText.indexOf("[");
  const arrayEnd = cleanedText.lastIndexOf("]");
  const objectStart = cleanedText.indexOf("{");
  const objectEnd = cleanedText.lastIndexOf("}");

  if (arrayStart > -1 && arrayEnd > arrayStart) {
    candidateList.push(cleanedText.slice(arrayStart, arrayEnd + 1));
  }
  if (objectStart > -1 && objectEnd > objectStart) {
    candidateList.push(cleanedText.slice(objectStart, objectEnd + 1));
  }

  for (const element of candidateList) {
    const parsed = tryParseJsonCandidate(element);
    if (parsed !== null) {
      return JSON.stringify(parsed, null, 2);
    }
  }

  throw new Error(
    trans("jsonInput.aiJsonInvalid", "AI 返回的内容不是合法 JSON"),
  );
};

export const recognizeQuestionsFromHtml = async (html, model, options = {}) => {
  const rawText = assertRequestSuccess(
    await recognizeQuestionsByHtmlStream(
      {
        messages: [
          {
            role: "system",
            content: "你是题库导入 JSON 整理助手，只输出合法 JSON。",
          },
          {
            role: "user",
            content: buildImportPrompt(html),
          },
        ],
        model,
        stream: true,
        temperature: 0,
      },
      {
        onText: options.onText,
      },
    ),
    trans("jsonInput.aiFailed", "题目识别失败，请稍后重试"),
  );

  if (!String(rawText || "").trim()) {
    throw new Error(
      trans("jsonInput.aiEmpty", "AI 未返回可用内容，请稍后重试"),
    );
  }

  let jsonText = "";
  let jsonError = "";

  try {
    jsonText = normalizeAiJsonText(rawText);
  } catch (error) {
    jsonText = stripJsonCodeFence(rawText);
    jsonError =
      error.message ||
      trans("jsonInput.aiJsonInvalid", "AI 返回的内容不是合法 JSON");
  }

  return {
    jsonError,
    jsonText,
    rawText,
  };
};

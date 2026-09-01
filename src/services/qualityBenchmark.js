import fetchPolyfill from "dva/fetch";
import { stringify } from "qs";

import request from "../utils/request";
import { recognizeQuestionsByHtmlStream } from "./htmlRecognition";

const fetchRequest = /** @type {Window["fetch"]} */ (
  fetchPolyfill.default || fetchPolyfill
);
const QUALITY_BENCHMARK_TEXT_ANALYSIS_URL =
  "https://ai.yungu.org/center/api/file-services/textAnalysis";
const QUALITY_BENCHMARK_TEXT_ANALYSIS_TYPE = "qualityBenchmarkTextImport";
const QUALITY_BENCHMARK_TEXT_ANALYSIS_MODEL = "qwen3-max";
const QUALITY_BENCHMARK_TEXT_ANALYSIS_PROCESSING_STATUS = 0;
const QUALITY_BENCHMARK_TEXT_ANALYSIS_FAILED_STATUS = 2;
const QUALITY_BENCHMARK_TAB_SEPARATED_NOTICE =
  "inputText 已尽量规范为 Tab 分隔表格，请严格按列解析，不要把相邻列合并到同一个字段。";
const QUALITY_BENCHMARK_SCORE_TEXT_JSON_SCHEMA = {
  type: "object",
  properties: {
    scoreRows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          schoolName: { type: "string" },
          subjectName: { type: "string" },
          studentCount: { type: "number" },
          avgScore: { type: "number" },
          passRate: { type: "number" },
          goodRate: { type: "number" },
          excellentRate: { type: "number" },
        },
        required: [
          "schoolName",
          "subjectName",
          "studentCount",
          "avgScore",
          "passRate",
          "goodRate",
          "excellentRate",
        ],
      },
    },
    targetLineRows: {
      type: "array",
      maxItems: 0,
      items: {
        type: "object",
        properties: {
          schoolName: { type: "string" },
          studentCount: { type: "number" },
          targetScore: { type: "number" },
          onlineCount: { type: "number" },
          onlineRate: { type: "number" },
        },
      },
    },
    warnings: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["scoreRows", "targetLineRows", "warnings"],
};
const QUALITY_BENCHMARK_TARGET_TEXT_JSON_SCHEMA = {
  type: "object",
  properties: {
    scoreRows: {
      type: "array",
      maxItems: 0,
      items: {
        type: "object",
        properties: {
          schoolName: { type: "string" },
          subjectName: { type: "string" },
          studentCount: { type: "number" },
          avgScore: { type: "number" },
          passRate: { type: "number" },
          goodRate: { type: "number" },
          excellentRate: { type: "number" },
        },
      },
    },
    targetLineRows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          schoolName: { type: "string" },
          studentCount: { type: "number" },
          targetScore: { type: "number" },
          onlineCount: { type: "number" },
          onlineRate: { type: "number" },
        },
        required: [
          "schoolName",
          "studentCount",
          "targetScore",
          "onlineCount",
          "onlineRate",
        ],
      },
    },
    warnings: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["scoreRows", "targetLineRows", "warnings"],
};
const QUALITY_BENCHMARK_TEXT_JSON_SCHEMA = {
  type: "object",
  properties: {
    scoreRows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          schoolName: { type: "string" },
          subjectName: { type: "string" },
          studentCount: { type: "number" },
          avgScore: { type: "number" },
          passRate: { type: "number" },
          goodRate: { type: "number" },
          excellentRate: { type: "number" },
        },
      },
    },
    targetLineRows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          schoolName: { type: "string" },
          studentCount: { type: "number" },
          targetScore: { type: "number" },
          onlineCount: { type: "number" },
          onlineRate: { type: "number" },
        },
      },
    },
    warnings: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
};

/**
 * 从下载响应头中解析文件名，解析失败时使用默认文件名。
 * @param {string} contentDisposition Content-Disposition 响应头。
 * @param {string} defaultFileName 默认文件名。
 * @returns {string} 下载文件名。
 */
function getDownloadFileName(contentDisposition, defaultFileName) {
  if (!contentDisposition) {
    return defaultFileName;
  }
  const utf8Match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
  const normalMatch = contentDisposition.match(/filename=([^;]+)/i);
  const fileName = utf8Match ? utf8Match[1] : normalMatch ? normalMatch[1] : "";
  if (!fileName) {
    return defaultFileName;
  }
  try {
    return decodeURIComponent(fileName.replaceAll(/["']/g, ""));
  } catch {
    return fileName.replaceAll(/["']/g, "");
  }
}

/**
 * 从后端错误响应中提取用户可读的失败原因。
 * @param {Response} response 下载响应。
 * @param {string} fallbackMessage 默认失败文案。
 * @returns {Promise<string>} 失败原因。
 */
async function getExportErrorMessage(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const result = await response.json();
    return result.message || result.msg || result.errMsg || fallbackMessage;
  }
  const errorText = await response.text();
  return errorText || fallbackMessage;
}

/**
 * 查询成绩汇总校内外对比数据。
 * @param {object} parameters 查询参数。
 * @returns {Promise<object>} 接口响应。
 */
export async function queryQualityBenchmark(parameters) {
  return request(`/api/exam/summary/qualityBenchmark?${stringify(parameters)}`);
}

/**
 * 保存成绩汇总校内外对比数据。
 * @param {object} parameters 保存参数。
 * @returns {Promise<object>} 接口响应。
 */
export async function saveQualityBenchmark(parameters) {
  return request("/api/exam/summary/qualityBenchmark/save", {
    method: "POST",
    body: parameters,
  });
}

/**
 * 导出成绩汇总校内外对比 xlsx 文件。
 * @param {object} parameters 导出参数。
 * @param {string} parameters.fileName 文件名。
 * @param {string} parameters.sheetName Sheet 名称。
 * @param {string[][]} parameters.rows 二维表格数据。
 * @returns {Promise<object>} 下载结果，成功时包含 blob 和 fileName。
 */
export async function exportQualityBenchmarkXlsx(parameters) {
  const defaultFileName = `${parameters.fileName || "校内外对比"}.xlsx`;
  const response = await fetchRequest(
    "/api/exam/summary/qualityBenchmark/export",
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json",
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(parameters),
    },
  );

  if (!response.ok) {
    return {
      success: false,
      message: await getExportErrorMessage(response, ""),
    };
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return {
      success: false,
      message: await getExportErrorMessage(response, ""),
    };
  }

  return {
    success: true,
    blob: await response.blob(),
    fileName: getDownloadFileName(
      response.headers.get("content-disposition"),
      defaultFileName,
    ),
  };
}

/**
 * 读取图片文件为 Data URL，供识图接口上传图片内容。
 * @param {File} file 图片文件。
 * @returns {Promise<string|ArrayBuffer>} 图片 Data URL。
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

/**
 * 从大模型返回文本中提取 JSON 对象。
 * @param {string} text 大模型返回文本。
 * @returns {object} 解析后的 JSON 对象。
 */
function extractJson(text) {
  const rawText = String(text || "").trim();
  if (!rawText) {
    return {};
  }
  const jsonStart = rawText.indexOf("{");
  const jsonEnd = rawText.lastIndexOf("}");
  const jsonText =
    jsonStart >= 0 && jsonEnd > jsonStart
      ? rawText.slice(jsonStart, jsonEnd + 1)
      : rawText;
  try {
    return JSON.parse(jsonText);
  } catch {
    return {};
  }
}

/**
 * 将用户粘贴的空格对齐表格规范化为 Tab 分隔文本，减少 AI 将相邻列拼接到同一字段的概率。
 * @param {string} text 用户粘贴的原始文本。
 * @returns {string} 适合提交给 AI 的表格文本。
 */
function normalizeQualityBenchmarkInputText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/).filter(Boolean).join("\t"))
    .filter(Boolean)
    .join("\n");
}

/**
 * 生成平均成绩 AI 解析指令，强约束模型不要遗漏成绩字段。
 * @param {object} parameters 指令上下文。
 * @param {string} parameters.examName 考试名称。
 * @param {string} parameters.gradeName 年级名称。
 * @returns {string} 文本分析指令。
 */
function buildQualityBenchmarkScoreAnalysisInstruction({
  examName,
  gradeName,
}) {
  return [
    "# Role",
    "你是一个高性能的成绩汇总校内外对比导入助手，专精于将 CSV/TSV 等纯文本表格精准解析为结构化的 JSON。",
    "",
    "# Task",
    "请将用户粘贴的 CSV/TSV 文本表格数据提取并转换为符合指定 JSON Schema 的结构化数据。",
    `当前考试：${examName || "本次考试"}。当前年级：${gradeName || "未提供"}。`,
    QUALITY_BENCHMARK_TAB_SEPARATED_NOTICE,
    "",
    "# Core Rules（严禁遗漏数据）",
    "1. 【完整性原则】：必须提取出表格中对应科目的所有数值（平均分、及格率、良好率、优秀率）。严禁只输出名称而丢弃具体的数值字段！",
    "2. 【记录拆分】：每一行学校数据必须按科目拆分成多条记录。",
    "   - “总分平均分、总分及格率、总分良好率、总分优秀率”对应一条记录，subjectName 填 “总分”。",
    "   - “语文平均分、语文及格率、语文良好率、语文优秀率”对应一条记录，subjectName 填 “语文”。",
    "   - 数学、英语等科目同理分别输出一条记录。",
    "3. 【数据过滤】：本次只解析平均成绩相关数据，写入 `scoreRows` 数组。`targetLineRows` 固定返回空数组 `[]`。",
    "",
    "# Field Mapping",
    "- schoolName: 学校名称 (string)",
    '- subjectName: 科目名称，如 "总分"、"语文"、"数学"、"英语" (string)',
    "- studentCount: 考试人数 (number)",
    "- avgScore: 对应科目的平均分 (number)",
    "- passRate: 对应科目的及格率，统一输出纯数字的百分数数值（如 80.74）",
    "- goodRate: 对应科目的良好率，统一输出纯数字的百分数数值（如 65.2）",
    "- excellentRate: 对应科目的优秀率，统一输出纯数字的百分数数值（如 24.23）",
    "",
    "# Output Format",
    "- 请【绝对只返回标准的 JSON 数据】，不要包含任何前言、解释、markdown 块外的文本。",
  ].join("\n");
}

/**
 * 生成分数线 AI 解析指令，强约束模型按宽表分数线展开完整记录。
 * @param {object} parameters 指令上下文。
 * @param {string} parameters.examName 考试名称。
 * @param {string} parameters.gradeName 年级名称。
 * @returns {string} 文本分析指令。
 */
function buildQualityBenchmarkTargetAnalysisInstruction({
  examName,
  gradeName,
}) {
  return [
    "# Role",
    "你是一个高性能的成绩汇总校内外对比分数线导入助手，专精于将 CSV/TSV 等纯文本宽表精准解析为结构化 JSON。",
    "",
    "# Task",
    "请将用户粘贴的分数线宽表数据提取并转换为符合指定 JSON Schema 的结构化数据。",
    `当前考试：${examName || "本次考试"}。当前年级：${gradeName || "未提供"}。`,
    QUALITY_BENCHMARK_TAB_SEPARATED_NOTICE,
    "",
    "# Core Rules（严禁拆散行）",
    "1. 【只解析分数线】：本次只解析分数线/总分上线数据，写入 `targetLineRows` 数组。`scoreRows` 固定返回空数组 `[]`。",
    "2. 【数字表头含义】：宽表第一行中，“学校”“考试人数”之后的数字表头就是分数线 `targetScore`（例如 650、600、550），请剔除可能存在的“分”等单位，仅提取纯数字。严禁把这些数字解析为科学计数法或上线人数。",
    "3. 【记录展开】：每一行学校数据必须按每个分数线展开成多条完整记录。",
    "   - 例如表头为“学校、考试人数、650、600、550”，数据行为“实验中学、423、88、156、238”。",
    "   - 必须输出 3 条记录：targetScore=650 onlineCount=88；targetScore=600 onlineCount=156；targetScore=550 onlineCount=238。",
    "4. 【完整对象】：每条 targetLineRows 记录必须同时包含 schoolName、studentCount、targetScore、onlineCount、onlineRate。严禁把 schoolName/studentCount/targetScore 和 onlineCount 拆成不同对象。",
    "5. 【异常兜底】：若解析过程中无业务或格式异常，`warnings` 字段固定返回空数组 `[]`。",
    "",
    "# Field Mapping & Computation",
    "- schoolName: 学校名称 (string)",
    "- studentCount: 考试人数 (number)",
    "- targetScore: 分数线，来自表头中的数字列，转换为纯数字 (number)",
    "- onlineCount: 当前学校在该分数线下的上线人数，来自数据行对应数字列 (number)",
    "- onlineRate: 上线率。计算公式：(onlineCount / studentCount) * 100。输出纯数字，保留4位小数，进行四舍五入。例如：20.8038 (number)",
    "",
    "# Output Format",
    "- 请【绝对只返回标准的 JSON 数据】，不要包含任何前言、解释、markdown 块外的文本。",
  ].join("\n");
}

/**
 * 生成校内外对比文本分析指令，明确导入类型和字段口径，避免模型混入解释性文本。
 * @param {object} parameters 指令上下文。
 * @param {string} parameters.importScope 导入类型，score 为平均成绩，target 为总分上线。
 * @param {string} parameters.examName 考试名称。
 * @param {string} parameters.gradeName 年级名称。
 * @returns {string} 文本分析指令。
 */
function buildQualityBenchmarkAnalysisInstruction({
  importScope,
  examName,
  gradeName,
}) {
  if (importScope === "score") {
    return buildQualityBenchmarkScoreAnalysisInstruction({
      examName,
      gradeName,
    });
  }
  if (importScope === "target") {
    return buildQualityBenchmarkTargetAnalysisInstruction({
      examName,
      gradeName,
    });
  }
  const scopeText =
    importScope === "target"
      ? "总分上线数据，写入 targetLineRows，scoreRows 返回空数组"
      : "平均成绩数据，写入 scoreRows，targetLineRows 返回空数组";
  return [
    "你是成绩汇总校内外对比导入助手。请根据用户粘贴的纯文本表格提取结构化 JSON，只返回 JSON，不要返回解释。",
    `当前考试：${examName || "本次考试"}。当前年级：${gradeName || "未提供"}。`,
    `本次只解析${scopeText}。`,
    QUALITY_BENCHMARK_TAB_SEPARATED_NOTICE,
    "scoreRows 字段包含 schoolName、subjectName、studentCount、avgScore、passRate、goodRate、excellentRate；subjectName 为空时总分数据使用“总分”。",
    "targetLineRows 字段包含 schoolName、studentCount、targetScore、onlineCount、onlineRate；目标线可以是 0 或 1 这类低分数线，不能按固定分数过滤。",
    "所有比例字段统一输出百分数数值，例如 80.5 表示 80.5%。无法确定的字段不要编造，可省略或返回 null。",
    "warnings 返回无法识别、疑似列错位、字段缺失等风险提示。",
  ].join("\n");
}

/**
 * 根据导入类型生成文本分析接口使用的 JSON Schema。
 * @param {string} importScope 导入类型，score 为平均成绩，target 为总分上线。
 * @returns {object} JSON Schema。
 */
function getQualityBenchmarkTextJsonSchema(importScope) {
  if (importScope === "score") {
    return QUALITY_BENCHMARK_SCORE_TEXT_JSON_SCHEMA;
  }
  if (importScope === "target") {
    return QUALITY_BENCHMARK_TARGET_TEXT_JSON_SCHEMA;
  }
  return QUALITY_BENCHMARK_TEXT_JSON_SCHEMA;
}

/**
 * 从文本分析接口响应中读取结构化结果，兼容 analysisJson 和 analysisText 两种返回形态。
 * @param {object} content 文本分析接口 content。
 * @returns {{scoreRows: Array, targetLineRows: Array, warnings: Array}} 结构化解析结果。
 */
function getQualityBenchmarkAnalysisResult(content = {}) {
  const analysisJson =
    typeof content.analysisJson === "string"
      ? extractJson(content.analysisJson)
      : content.analysisJson || extractJson(content.analysisText);
  return {
    scoreRows: Array.isArray(analysisJson.scoreRows)
      ? analysisJson.scoreRows
      : [],
    targetLineRows: Array.isArray(analysisJson.targetLineRows)
      ? analysisJson.targetLineRows
      : [],
    warnings: Array.isArray(analysisJson.warnings) ? analysisJson.warnings : [],
  };
}

/**
 * 调用文本分析接口，将用户粘贴的校内外对比文本交给当前登录学校绑定的 AI 模型解析。
 * @param {object} parameters 解析参数。
 * @param {string} parameters.inputText 用户粘贴的纯文本表格。
 * @param {string} parameters.importScope 导入类型，score 为平均成绩，target 为总分上线。
 * @param {string} parameters.examName 考试名称。
 * @param {string} parameters.gradeName 年级名称。
 * @returns {Promise<{scoreRows: Array, targetLineRows: Array, warnings: Array}>} AI 解析结果。
 */
export async function analyzeQualityBenchmarkText({
  inputText,
  importScope = "score",
  examName,
  gradeName,
}) {
  const response = await request(QUALITY_BENCHMARK_TEXT_ANALYSIS_URL, {
    method: "POST",
    body: {
      inputText: normalizeQualityBenchmarkInputText(inputText),
      analysisInstruction: buildQualityBenchmarkAnalysisInstruction({
        importScope,
        examName,
        gradeName,
      }),
      analysisType: QUALITY_BENCHMARK_TEXT_ANALYSIS_TYPE,
      jsonSchema: getQualityBenchmarkTextJsonSchema(importScope),
      model: QUALITY_BENCHMARK_TEXT_ANALYSIS_MODEL,
      forceAnalysis: false,
    },
  });

  if (response?.err) {
    throw response.err;
  }
  if (
    response?.success === false ||
    response?.status === QUALITY_BENCHMARK_TEXT_ANALYSIS_PROCESSING_STATUS ||
    response?.status === QUALITY_BENCHMARK_TEXT_ANALYSIS_FAILED_STATUS
  ) {
    throw new Error(response.message || "AI 解析失败，请稍后重试");
  }

  return getQualityBenchmarkAnalysisResult(response.content || {});
}

/**
 * 识别校内外对比截图中的成绩表格数据。
 * @param {object} root0 识别参数。
 * @param {File} root0.file 图片文件。
 * @param {string} root0.examName 考试名称。
 * @param {string} root0.gradeName 年级名称。
 * @param {string[]} root0.expectedTypes 期望识别的数据类型。
 * @returns {Promise<object>} 识别出的平均成绩和总分上线数据。
 */
export async function recognizeQualityBenchmarkImage({
  file,
  examName,
  gradeName,
  expectedTypes = ["score", "targetLine"],
}) {
  const imageUrl = await readFileAsDataUrl(file);
  const resultText = await recognizeQuestionsByHtmlStream({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "你是成绩表格识别助手。只输出 JSON，不输出解释。字段必须是 scoreRows、targetLineRows、warnings。",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `请从截图中识别校外质量对标数据。考试：${examName || ""}，年级：${gradeName || ""}，期望类型：${expectedTypes.join(",")}。scoreRows字段包括schoolName、subjectName、studentCount、avgScore、passRate、excellentRate；targetLineRows字段包括schoolName、studentCount、targetScore、onlineCount、onlineRate。`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ],
  });

  if (resultText?.err) {
    return resultText;
  }

  const data = extractJson(resultText);
  return {
    scoreRows: Array.isArray(data.scoreRows) ? data.scoreRows : [],
    targetLineRows: Array.isArray(data.targetLineRows)
      ? data.targetLineRows
      : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
  };
}

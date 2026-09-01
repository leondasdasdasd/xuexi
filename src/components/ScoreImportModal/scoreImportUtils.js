import { trans } from "../../utils/i18n";

export const IMPORT_MODE_CREATE = "create";
export const IMPORT_MODE_APPEND = "append";

export const IMPORT_SOURCE_STANDARD = "standard";
export const IMPORT_SOURCE_ZHIXUE = "zhixue";
export const IMPORT_SOURCE_XUEKE = IMPORT_SOURCE_ZHIXUE;

export const OVERWRITE_SKIP = "skipExistingQuestionScore";
export const OVERWRITE_REPLACE = "overwriteExistingQuestionScore";
export const SCORE_UPDATE_INCREMENTAL = "incrementalUpdate";
export const SCORE_UPDATE_OVERWRITE = "overwriteUpdate";
export const SCORE_UPDATE_RISK_THRESHOLD = 5;

const CHOICE_QUESTION_TYPES = ["单选", "多选", "选择题"];
const SCORE_IMPORT_MAX_FILE_SIZE_MB = 20;
const SCORE_IMPORT_SUPPORTED_EXTENSIONS = [".xlsx", ".xls"];
const SCORE_IMPORT_ZHIXUE_EXTENSIONS = [".xlsx", ".xls", ".zip"];
const SCORE_IMPORT_AI_PROMPT_REQUIREMENT_LINES = [
  "1. 保留模板的工作表名称、表头、列顺序、学生信息和已有公式，不要新增、删除或改名。",
  "2. 按学号/准考证号优先匹配学生；没有编号时，用班级+姓名匹配。无法唯一匹配的学生不要填，单独列出。",
  "3. 按学科、题号、大题题号、小题题号匹配小题数据；不要删除题型、满分、正确答案、学生作答等选择题相关信息。",
  "4. 选择题支持按选项解析：原始文件里如果有 A/B/C/D、AB、AC 等学生作答或正确答案，必须保留到模板对应单元格，不要清空、删除、改成空白，也不要把选项强行换算成分数。",
  "5. 选择题单元格可以填学生作答，也可以填明确得分；优先保留原始作答选项。只有原始文件没有作答选项、但有明确得分时，才填写分数。",
  "6. 多选题作答保留多个选项字母，如 AB、AC、BD、ABC；可以统一大写并去掉空格、逗号、顿号等分隔符，但不要丢失任何选项字母。",
  "7. 不要导入外部总分、排名、班次、校次等统计列，系统会自行计算总分。",
  "8. 不要编造分数。原始文件没有或无法判断的单元格留空，并在结果说明中列出位置。",
  "9. 单题没做不是缺考；只有该学生该学科所有小题都是 0、空、缺考/缺，且学科总分为空或 0，才按缺考处理。",
  "10. 完成后只返回填好的模板 Excel，并附一段简短说明：已匹配数量、未匹配学生、未匹配题目、留空位置。",
];

/**
 *
 * @param value
 */
function toScoreNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

/**
 *
 * @param row
 */
function createPreviewStudentKey(row) {
  return [
    row.studentId || "",
    row.studentNo || "",
    row.studentName || "",
    row.className || row.groupName || "",
  ].join("|");
}

/**
 *
 * @param value
 */
export function normalizeSelectedSubjects(value) {
  if (!value) {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return list
    .filter(Boolean)
    .map((item) => {
      if (typeof item === "object") {
        return {
          subjectId: item.subjectId || item.key || item.value,
          subjectName: item.subjectName || item.label,
          courseIdList: item.courseIdList || [],
          courseNameList: item.courseNameList || [],
          groupIdList: item.groupIdList || [],
          groupNameList: item.groupNameList || [],
          fullScore: item.fullScore ?? item.totalScore,
        };
      }
      return {
        subjectId: item,
        subjectName: undefined,
        courseIdList: [],
        courseNameList: [],
        groupIdList: [],
        groupNameList: [],
        fullScore: undefined,
      };
    })
    .filter((item) => item.subjectId !== undefined && item.subjectId !== null);
}

/**
 *
 * @param value
 */
export function joinIds(value) {
  if (!value) {
    return "";
  }
  return (Array.isArray(value) ? value : [value])
    .filter((item) => item !== undefined && item !== null && item !== "")
    .join(",");
}

/**
 *
 * @param selectedSubjects
 */
export function getSubjectIdList(selectedSubjects) {
  return normalizeSelectedSubjects(selectedSubjects).map(
    (item) => item.subjectId,
  );
}

/**
 *
 * @param selectedSubjects
 */
export function getSubjectConfigList(selectedSubjects) {
  return normalizeSelectedSubjects(selectedSubjects);
}

/**
 *
 * @param importMode
 */
export function getScoreImportAiPrompt(importMode = IMPORT_MODE_CREATE) {
  const introLines =
    importMode === IMPORT_MODE_APPEND
      ? [
          "你是成绩批量订正数据整理助手。",
          "我会提供两份文件：1. 学校原始成绩文件；2. 系统下载的当前考试原始成绩文件。",
          "请以系统下载文件为唯一输出结构，参考学校原始成绩文件，只修改能确认的成绩后返回新的 Excel 文件。",
        ]
      : [
          "你是成绩导入数据整理助手。",
          "我会提供两份文件：1. 原始成绩文件；2. 系统下载的成绩导入模板。",
          "请以系统模板为唯一输出结构，参考原始成绩文件，把能确认的成绩填入模板后返回新的 Excel 文件。",
        ];
  return [
    ...introLines,
    "",
    "整理要求：",
    ...SCORE_IMPORT_AI_PROMPT_REQUIREMENT_LINES,
  ].join("\n");
}

/**
 *
 * @param selectedSubjects
 */
export function getGroupIdListFromSubjectConfigs(selectedSubjects) {
  const groupIdList = [];
  for (const subject of normalizeSelectedSubjects(selectedSubjects)) {
    for (const groupId of subject.groupIdList || []) {
      if (
        groupId !== undefined &&
        groupId !== null &&
        groupId !== "" &&
        !groupIdList.some((item) => String(item) === String(groupId))
      ) {
        groupIdList.push(groupId);
      }
    }
  }
  return groupIdList;
}

/**
 *
 * @param value
 */
export function isAbsentValue(value) {
  return ["缺考", "缺", "未扫", "不计排名"].includes(
    String(value || "").trim(),
  );
}

/**
 *
 * @param row
 */
function createStudentSubjectKey(row) {
  return [
    createPreviewStudentKey(row),
    row.subjectId || "",
    row.subjectName || "",
  ].join("|");
}

/**
 *
 * @param row
 */
function isNoAnswerQuestionRow(row) {
  const rawText = String(row?.rawValue ?? "").trim();
  const score = toScoreNumber(row?.score);
  return (
    row?.status === "空值" ||
    isAbsentValue(row?.status) ||
    isAbsentValue(rawText) ||
    rawText === "" ||
    score === 0
  );
}

/**
 *
 * @param row
 */
function isBlankOrAbsentQuestionRow(row) {
  const rawText = String(row?.rawValue ?? "").trim();
  return (
    row?.status === "空值" ||
    isAbsentValue(row?.status) ||
    isAbsentValue(rawText) ||
    rawText === ""
  );
}

/**
 *
 * @param questionScoreRows
 * @param subjectScoreRows
 */
export function normalizeQuestionAbsentStatus(
  questionScoreRows = [],
  subjectScoreRows = [],
) {
  const subjectScoreMap = new Map();
  for (const row of subjectScoreRows) {
    subjectScoreMap.set(createStudentSubjectKey(row), toScoreNumber(row.score));
  }

  const questionGroupMap = new Map();
  for (const row of questionScoreRows) {
    const key = createStudentSubjectKey(row);
    const group = questionGroupMap.get(key) || [];
    group.push(row);
    questionGroupMap.set(key, group);
  }

  for (const [key, rows] of questionGroupMap.entries()) {
    const subjectScore = subjectScoreMap.get(key);
    const hasSubjectScore = subjectScoreMap.has(key) && subjectScore !== null;
    const hasPositiveSubjectScore = hasSubjectScore && subjectScore > 0;
    const allQuestionsNoAnswer =
      rows.length > 0 && rows.every(isNoAnswerQuestionRow);
    const shouldMarkAbsent =
      allQuestionsNoAnswer &&
      !hasPositiveSubjectScore &&
      (!hasSubjectScore || subjectScore === 0);

    for (const row of rows) {
      if (shouldMarkAbsent && isNoAnswerQuestionRow(row)) {
        row.status = "缺考";
        row.score = null;
        continue;
      }
      if (!shouldMarkAbsent && isBlankOrAbsentQuestionRow(row)) {
        row.status = "空值";
        row.score = null;
      }
    }
  }

  return questionScoreRows;
}

/**
 *
 * @param value
 */
export function normalizeChoiceAnswer(value) {
  const normalized = String(value || "")
    .trim()
    .replaceAll(/[\s,/;|，；]+/g, "")
    .toUpperCase();
  if (!normalized) {
    return "";
  }
  if (!/^[A-Z]+$/.test(normalized)) {
    return normalized;
  }
  return [...new Set(normalized.split(""))].sort().join("");
}

/**
 *
 * @param questionType
 */
export function isChoiceQuestionType(questionType) {
  return CHOICE_QUESTION_TYPES.some((type) =>
    String(questionType || "").includes(type),
  );
}

/**
 *
 * @param file
 * @param options
 */
export function validateScoreImportUploadFile(file, options = {}) {
  if (!file) {
    return "请选择要上传的成绩文件";
  }
  const fileName = String(file.name || "").trim();
  if (!fileName) {
    return "上传文件缺少文件名";
  }
  const lowerName = fileName.toLowerCase();
  const supportedExtensions = options.allowZip
    ? SCORE_IMPORT_ZHIXUE_EXTENSIONS
    : SCORE_IMPORT_SUPPORTED_EXTENSIONS;
  const isSupportedExtension = supportedExtensions.some((extension) =>
    lowerName.endsWith(extension),
  );
  if (!isSupportedExtension) {
    return options.allowZip
      ? "仅支持上传 Excel 文件（.xlsx/.xls）或智学网导出压缩包（.zip）"
      : "仅支持上传 Excel 文件（.xlsx 或 .xls）";
  }
  if (file.size === 0) {
    return "上传文件为空，请重新导出模板后填写";
  }
  if (
    Number.isFinite(file.size) &&
    file.size > SCORE_IMPORT_MAX_FILE_SIZE_MB * 1024 * 1024
  ) {
    return `上传文件不能超过 ${SCORE_IMPORT_MAX_FILE_SIZE_MB}MB`;
  }
  return "";
}

/**
 *
 * @param root0
 * @param root0.questionType
 * @param root0.rawValue
 * @param root0.correctAnswer
 * @param root0.fullScore
 */
export function calculateQuestionScore({
  questionType,
  rawValue,
  correctAnswer,
  fullScore,
}) {
  const maxScore = Number(fullScore);
  const rawText = String(
    rawValue === undefined || rawValue === null ? "" : rawValue,
  ).trim();

  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return {
      score: null,
      status: "缺少满分",
      blocking: true,
    };
  }

  if (!rawText) {
    return {
      score: null,
      status: "空值",
      blocking: false,
    };
  }

  if (isAbsentValue(rawText)) {
    return {
      score: null,
      status: rawText,
      blocking: false,
    };
  }

  if (isChoiceQuestionType(questionType)) {
    const answer = normalizeChoiceAnswer(rawText);
    const correct = normalizeChoiceAnswer(correctAnswer);
    const score = Number(rawText);
    if (Number.isFinite(score)) {
      if (score < 0) {
        return {
          score,
          status: "得分小于0",
          blocking: true,
        };
      }
      if (score > maxScore) {
        return {
          score,
          status: "得分超满分",
          blocking: true,
        };
      }
      return {
        score,
        status: "可导入",
        blocking: false,
      };
    }
    if (!correct) {
      return {
        score: null,
        status: "缺少正确答案",
        blocking: true,
      };
    }
    if (!/^[A-Z]+$/.test(answer)) {
      return {
        score: null,
        status: "选择题答案非法",
        blocking: true,
      };
    }
    if (String(questionType || "").includes("单选") && answer.length > 1) {
      return {
        score: null,
        status: "单选题只能填写一个选项",
        blocking: true,
      };
    }
    return {
      score: answer === correct ? maxScore : 0,
      status: "可导入",
      blocking: false,
    };
  }

  const score = Number(rawText);
  if (!Number.isFinite(score)) {
    return {
      score: null,
      status: "得分不是数字",
      blocking: true,
    };
  }
  if (score < 0) {
    return {
      score,
      status: "得分小于0",
      blocking: true,
    };
  }
  if (score > maxScore) {
    return {
      score,
      status: "得分超满分",
      blocking: true,
    };
  }
  return {
    score,
    status: "可导入",
    blocking: false,
  };
}

/**
 *
 * @param questionNo
 */
export function getParentQuestionNo(questionNo) {
  const match = String(questionNo || "").match(/^(.+?)\((.+)\)$/);
  return match ? match[1] : "";
}

/**
 *
 * @param questionNos
 */
export function getLeafQuestionColumns(questionNos) {
  const parentQuestionSet = new Set(
    (questionNos || []).map(getParentQuestionNo).filter(Boolean),
  );
  return (questionNos || []).filter(
    (questionNo) => !parentQuestionSet.has(String(questionNo)),
  );
}

/**
 *
 * @param formData
 */
export function validateScoreImportForm(formData) {
  const {
    importMode,
    existingExamId,
    examName,
    examTime,
    semesterId,
    gradeId,
    selectedSubjects,
    examType,
    fileId,
  } = formData;

  if (importMode === IMPORT_MODE_APPEND && !existingExamId) {
    return "批量订正需要先选择已有考试";
  }
  const subjectConfigList = normalizeSelectedSubjects(selectedSubjects);
  const duplicateSubject = subjectConfigList.find(
    (item, index) =>
      subjectConfigList.findIndex(
        (target) => String(target.subjectId) === String(item.subjectId),
      ) !== index,
  );
  if (duplicateSubject) {
    return "考试科目不能重复";
  }
  if (importMode === IMPORT_MODE_APPEND) {
    if (subjectConfigList.length === 0) {
      return "当前考试没有可订正成绩的学科";
    }
    if (!fileId) {
      return "请先上传成绩文件";
    }
    return "";
  }
  if (importMode === IMPORT_MODE_CREATE && !String(examName || "").trim()) {
    return "请输入考试名称";
  }
  if (!examTime) {
    return "请选择考试时间";
  }
  if (!semesterId && semesterId !== 0) {
    return "请选择学期";
  }
  if (!gradeId) {
    return "请选择年级";
  }
  if (subjectConfigList.length === 0) {
    return "请选择学科";
  }
  const incompleteSubjectConfig = subjectConfigList.find((item) => {
    const fullScoreValue = Number(item.fullScore);
    return (
      !item.courseIdList ||
      item.courseIdList.length === 0 ||
      !item.groupIdList ||
      item.groupIdList.length === 0 ||
      item.fullScore === undefined ||
      item.fullScore === null ||
      item.fullScore === "" ||
      !Number.isFinite(fullScoreValue) ||
      fullScoreValue <= 0
    );
  });
  if (incompleteSubjectConfig) {
    return "请完善每个考试科目的课程、班级和满分";
  }
  if (importMode === IMPORT_MODE_CREATE && !examType) {
    return "请选择考试类型";
  }
  if (!fileId) {
    return "请先上传成绩文件";
  }
  return "";
}

/**
 *
 * @param formData
 */
export function buildScoreImportPayload(formData) {
  const selectedSubjects = normalizeSelectedSubjects(formData.selectedSubjects);
  const subjectGroupIdList = getGroupIdListFromSubjectConfigs(selectedSubjects);
  return {
    fileId: formData.fileId,
    fileName: formData.fileName,
    importMode: formData.importMode,
    importSource: formData.importSource,
    updateMode:
      formData.importMode === IMPORT_MODE_APPEND
        ? formData.scoreUpdateMode
        : undefined,
    examId:
      formData.importMode === IMPORT_MODE_APPEND
        ? formData.existingExamId
        : undefined,
    examName: String(formData.examName || "").trim(),
    examTime: formData.examTime,
    semesterId: formData.semesterId,
    gradeId: formData.gradeId,
    groupIdList:
      subjectGroupIdList.length > 0
        ? subjectGroupIdList
        : formData.groupIdList || [],
    subjectIdList: selectedSubjects.map((item) => item.subjectId),
    subjectConfigList: selectedSubjects,
    examType: formData.examType,
    generateSummaryReport: Boolean(formData.generateSummaryReport),
  };
}

/**
 *
 * @param preview
 */
export function summarizePreview(preview) {
  const summary = preview?.summary || {};
  const errors = preview?.errors || [];
  const warnings = preview?.warnings || [];
  const scoreWorkbookRows = getScoreWorkbookRows(preview);
  const questionWorkbookGroups = getQuestionWorkbookGroups(preview);
  return {
    studentCount: summary.studentCount || 0,
    subjectScoreCount: summary.subjectScoreCount || 0,
    scoreWorkbookRowCount:
      summary.scoreWorkbookRowCount ?? scoreWorkbookRows.length,
    questionWorkbookCount:
      summary.questionWorkbookCount ?? questionWorkbookGroups.length,
    questionScoreCount: summary.questionScoreCount || 0,
    errorCount: summary.errorCount ?? errors.length,
    warningCount: summary.warningCount ?? warnings.length,
    importableCount: summary.importableCount || 0,
  };
}

/**
 *
 * @param value
 */
function toCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

/**
 *
 * @param value
 */
function countStudentList(value) {
  return Array.isArray(value) ? value.length : 0;
}

/**
 *
 * @param row
 */
function getRowStudentKey(row) {
  return [
    row?.studentId || "",
    row?.studentNo || "",
    row?.studentName || "",
    row?.className || row?.groupName || "",
  ].join("|");
}

/**
 *
 * @param preview
 */
export function getScoreCorrectionChangeSummary(preview) {
  const summary = preview?.changeSummary || preview?.summary || {};
  const added = Math.max(
    toCount(summary.addedStudentCount),
    toCount(summary.addCount),
    countStudentList(summary.addedStudents),
  );
  const updated = Math.max(
    toCount(summary.updatedStudentCount),
    toCount(summary.modifiedStudentCount),
    toCount(summary.updateCount),
    toCount(summary.modifyCount),
    countStudentList(summary.updatedStudents),
    countStudentList(summary.modifiedStudents),
  );
  const deleted = Math.max(
    toCount(summary.deletedStudentCount),
    toCount(summary.removedStudentCount),
    toCount(summary.deleteCount),
    toCount(summary.removeCount),
    countStudentList(summary.deletedStudents),
    countStudentList(summary.removedStudents),
  );
  const explicitTotal = Math.max(
    toCount(summary.changedStudentCount),
    toCount(summary.affectedStudentCount),
    toCount(summary.totalChangedStudentCount),
  );
  const diffTotal = added + updated + deleted;
  if (explicitTotal || diffTotal) {
    return {
      added,
      updated,
      deleted,
      total: Math.max(explicitTotal, diffTotal),
      source: "diff",
    };
  }

  // 覆盖更新如果缺少后端差异统计，前端用预览里出现的学生数做风险范围兜底。
  const studentKeys = new Set();
  for (const row of getScoreWorkbookRows(preview)) {
    studentKeys.add(getRowStudentKey(row));
  }
  for (const group of getQuestionWorkbookGroups(preview)) {
    for (const row of group.rows || []) {
      studentKeys.add(getRowStudentKey(row));
    }
  }
  return {
    added: 0,
    updated: studentKeys.size || toCount(preview?.summary?.studentCount),
    deleted: 0,
    total: studentKeys.size || toCount(preview?.summary?.studentCount),
    source: "preview",
  };
}

/**
 *
 * @param summary
 */
export function getPreviewSummaryCards(summary) {
  // 预览页的统计必须同时表达数量和业务单位，避免老师只看到裸数字。
  return [
    {
      key: "studentCount",
      value: summary.studentCount,
      unit: trans("scoreImport.unit.students", "名"),
      label: trans("scoreImport.preview.recognizedStudents", "识别学生"),
      description: trans(
        "scoreImport.preview.recognizedStudentsDescription",
        "可匹配到系统学生",
      ),
      tone: "normal",
    },
    {
      key: "scoreWorkbookRowCount",
      value: summary.scoreWorkbookRowCount,
      unit: trans("scoreImport.unit.records", "条"),
      label: trans("scoreImport.preview.multiSubjectScores", "多科成绩"),
      description: trans(
        "scoreImport.preview.multiSubjectScoresDescription",
        "来自学科成绩表",
      ),
      tone: "normal",
    },
    {
      key: "questionWorkbookCount",
      value: summary.questionWorkbookCount,
      unit: trans("scoreImport.unit.sheets", "张"),
      label: trans("scoreImport.preview.questionWorksheets", "小题表"),
      description: trans(
        "scoreImport.preview.questionWorksheetsDescription",
        "按学科拆分的表",
      ),
      tone: "normal",
    },
    {
      key: "questionScoreCount",
      value: summary.questionScoreCount,
      unit: trans("scoreImport.unit.records", "条"),
      label: trans("scoreImport.preview.questionScores", "单题成绩"),
      description: trans(
        "scoreImport.preview.questionScoresDescription",
        "小题分数记录",
      ),
      tone: "normal",
    },
    {
      key: "errorCount",
      value: summary.errorCount,
      unit: trans("scoreImport.unit.items", "个"),
      label: trans("scoreImport.preview.errors", "错误"),
      description: summary.errorCount
        ? trans("scoreImport.preview.errorsDescription", "需修改文件后重传")
        : trans("scoreImport.preview.noBlockingIssues", "暂无阻断问题"),
      tone: summary.errorCount ? "error" : "success",
    },
    {
      key: "warningCount",
      value: summary.warningCount,
      unit: trans("scoreImport.unit.records", "条"),
      label: trans("scoreImport.preview.warnings", "警告"),
      description: summary.warningCount
        ? trans("scoreImport.preview.warningsDescription", "请确认后再导入")
        : trans("scoreImport.preview.noExtraConfirmation", "无需额外确认"),
      tone: summary.warningCount ? "warning" : "success",
    },
    {
      key: "importableCount",
      value: summary.importableCount,
      unit: trans("scoreImport.unit.records", "条"),
      label: trans("scoreImport.preview.importableScores", "可导入成绩"),
      description: trans(
        "scoreImport.preview.importableScoresDescription",
        "学科成绩 + 单题成绩",
      ),
      tone: "primary",
    },
  ];
}

/**
 *
 * @param level
 * @param message
 */
function getIssueAction(level, message) {
  if (level === "错误") {
    if (/学号|学生|未匹配|不存在/.test(message)) {
      return trans(
        "scoreImport.issue.actionCheckStudent",
        "核对学号、姓名和班级，修改文件后重新上传。",
      );
    }
    if (/满分|分数|超出|格式|数字/.test(message)) {
      return trans(
        "scoreImport.issue.actionCheckScore",
        "按模板检查分数格式和满分范围，修改后重新上传。",
      );
    }
    return trans(
      "scoreImport.issue.actionFixBlocking",
      "修正文件中的阻断问题后重新上传。",
    );
  }

  if (/缺考|未扫/.test(message)) {
    return trans(
      "scoreImport.issue.actionConfirmAbsence",
      "确认该学生确实缺考；系统不会自动写入 0 分。",
    );
  }
  if (/覆盖|已有/.test(message)) {
    return trans(
      "scoreImport.issue.actionConfirmUpdateMode",
      "确认更新方式是否符合本次订正范围。",
    );
  }
  return trans(
    "scoreImport.issue.actionCheckUploadedRecord",
    "请按提示核对上传文件中的对应记录。",
  );
}

/**
 *
 * @param message
 */
function getIssueDisplayMessage(message) {
  const text = String(
    message || trans("scoreImport.issue.unspecified", "未说明"),
  );
  if (/总分\s*\d+(\.\d+)?\s*与叶子题汇总\s*\d+(\.\d+)?\s*不一致/.test(text)) {
    return trans(
      "scoreImport.issue.totalScoreMismatch",
      "总分与小题汇总分数不一致",
    );
  }
  if (/学科分\s*\d+(\.\d+)?\s*与小题汇总\s*\d+(\.\d+)?\s*不一致/.test(text)) {
    return trans(
      "scoreImport.issue.subjectScoreMismatch",
      "学科分与小题汇总分数不一致",
    );
  }
  if (/还有\s*\d+\s*条学科分与小题汇总不一致/.test(text)) {
    return trans(
      "scoreImport.issue.subjectScoreMismatch",
      "学科分与小题汇总分数不一致",
    );
  }
  if (/智学网小题明细未提供满分，当前用最高得分/.test(text)) {
    return trans(
      "scoreImport.issue.questionFullScoreMissing",
      "小题明细未提供满分，当前用最高得分作为建议满分",
    );
  }
  if (/识别到\s*\d+\s*个父题汇总列/.test(text)) {
    return trans(
      "scoreImport.issue.parentQuestionColumnsIgnored",
      "识别到父题汇总列，已只保留叶子题导入",
    );
  }
  if (/智学网考试名称与当前考试不一致/.test(text)) {
    return trans(
      "scoreImport.issue.examNameMismatch",
      "考试名称与当前考试不一致",
    );
  }
  if (/智学网小题明细与当前考试不一致/.test(text)) {
    return trans(
      "scoreImport.issue.questionDetailMismatch",
      "小题明细与当前考试不一致",
    );
  }
  if (/智学网学科.+无法匹配当前考试学科/.test(text)) {
    return trans(
      "scoreImport.issue.subjectMismatch",
      "小题明细学科无法匹配当前考试学科",
    );
  }
  return text.replace(/（录入值：.*，满分：.*）$/, "");
}

/**
 *
 * @param item
 * @param displayMessage
 */
function getIssueDetailText(item, displayMessage) {
  const position =
    item?.position || trans("scoreImport.fileSummaryItem", "文件汇总项");
  const message = item?.message || "";
  if (!message || message === displayMessage) {
    return position;
  }
  return `${position}：${message}`;
}

/**
 *
 * @param item
 */
function isItemizedIssue(item) {
  const position = String(item?.position || "");
  if (!position) {
    return false;
  }
  if (/第.+题/.test(position)) {
    return true;
  }
  if (
    /学号|学生|缺考|未扫|空值|超满分|未匹配|不存在/.test(item?.message || "")
  ) {
    return true;
  }
  if (/总分|小题汇总|叶子题汇总/.test(item?.message || "")) {
    return /不一致/.test(item?.message || "");
  }
  return position.split("/").length >= 3;
}

/**
 *
 * @param preview
 */
export function buildIssueOverview(preview) {
  // 同类校验问题合并展示，默认只给一个样例，避免老师先被重复明细淹没。
  const issueList = [
    ...(preview?.errors || []).map((item) => ({ ...item, level: "错误" })),
    ...(preview?.warnings || []).map((item) => ({
      ...item,
      level: "警告",
    })),
  ];
  const issueMap = new Map();

  for (const item of issueList) {
    const level = item.level;
    const message = getIssueDisplayMessage(item.message);
    const key = `${level}-${message}`;
    const issueType = isItemizedIssue(item) ? "item" : "description";
    const current = issueMap.get(key) || {
      key,
      level,
      message,
      issueType,
      action: getIssueAction(level, message),
      count: 0,
      positions: [],
      allPositions: [],
    };

    current.count += 1;
    const detailText = getIssueDetailText(item, message);
    if (detailText) {
      current.allPositions.push(detailText);
      if (current.positions.length === 0) {
        current.positions.push(detailText);
      }
    }
    issueMap.set(key, current);
  }

  return [...issueMap.values()].sort((first, second) => {
    if (first.level !== second.level) {
      return first.level === "错误" ? -1 : 1;
    }
    return second.count - first.count;
  });
}

/**
 *
 * @param preview
 */
export function getScoreWorkbookSubjectColumns(preview) {
  if (!preview) {
    return [];
  }
  if (Array.isArray(preview.scoreWorkbookColumns)) {
    return preview.scoreWorkbookColumns;
  }
  const subjectMap = new Map();
  for (const row of preview.scoreWorkbookRows || []) {
    for (const subjectName of Object.keys(row.subjectScoreMap || {})) {
      if (!subjectName || subjectMap.has(subjectName)) {
        continue;
      }
      subjectMap.set(subjectName, {
        subjectName,
      });
    }
  }
  for (const row of [
    ...(preview.subjectScoreRows || []),
    ...(preview.questionScoreRows || []),
  ]) {
    const subjectName = row.subjectName || row.sheetName;
    if (!subjectName || subjectMap.has(subjectName)) {
      continue;
    }
    subjectMap.set(subjectName, {
      subjectId: row.subjectId,
      subjectName,
    });
  }
  return [...subjectMap.values()];
}

/**
 *
 * @param preview
 */
export function getScoreWorkbookRows(preview) {
  if (!preview) {
    return [];
  }
  if (Array.isArray(preview.scoreWorkbookRows)) {
    return preview.scoreWorkbookRows;
  }

  const rowMap = new Map();
  const ensureRow = (sourceRow) => {
    const key = createPreviewStudentKey(sourceRow);
    const current = rowMap.get(key) || {
      status: "可导入",
      studentNo: sourceRow.studentNo,
      studentName: sourceRow.studentName,
      className: sourceRow.className,
      totalScore: 0,
      fullScore: 0,
      scoreSource: sourceRow.scoreSource || "1_学科得分",
      subjectScoreMap: {},
      subjectFullScoreMap: {},
    };
    rowMap.set(key, current);
    return current;
  };

  for (const row of preview.subjectScoreRows || []) {
    const score = toScoreNumber(row.score);
    const subjectName = row.subjectName;
    if (!subjectName || score === null) {
      continue;
    }
    const workbookRow = ensureRow(row);
    workbookRow.subjectScoreMap[subjectName] = score;
    workbookRow.subjectFullScoreMap[subjectName] =
      toScoreNumber(row.fullScore) || 0;
    workbookRow.totalScore += score;
    workbookRow.fullScore += toScoreNumber(row.fullScore) || 0;
  }

  if (rowMap.size > 0) {
    return [...rowMap.values()];
  }

  for (const row of preview.questionScoreRows || []) {
    const score = toScoreNumber(row.score);
    const subjectName = row.subjectName;
    if (row.status !== "可导入" || !subjectName || score === null) {
      continue;
    }
    const workbookRow = ensureRow({
      ...row,
      scoreSource: "小题得分汇总",
    });
    workbookRow.subjectScoreMap[subjectName] =
      (workbookRow.subjectScoreMap[subjectName] || 0) + score;
    workbookRow.subjectFullScoreMap[subjectName] =
      (workbookRow.subjectFullScoreMap[subjectName] || 0) +
      (toScoreNumber(row.fullScore) || 0);
    workbookRow.totalScore += score;
    workbookRow.fullScore += toScoreNumber(row.fullScore) || 0;
  }
  return [...rowMap.values()];
}

/**
 *
 * @param preview
 */
export function getQuestionWorkbookGroups(preview) {
  if (!preview) {
    return [];
  }
  if (Array.isArray(preview.questionWorkbookList)) {
    return preview.questionWorkbookList;
  }
  const groupMap = new Map();
  for (const row of preview.questionScoreRows || []) {
    const subjectName = row.subjectName || "未识别学科";
    if (!groupMap.has(subjectName)) {
      groupMap.set(subjectName, {
        subjectId: row.subjectId,
        subjectName,
        sheetName: `${subjectName}_小题得分`,
        rows: [],
      });
    }
    groupMap.get(subjectName).rows.push(row);
  }
  return [...groupMap.values()];
}

/**
 *
 * @param group
 * @param limit
 */
export function getQuestionWorkbookPreviewRows(group, limit) {
  if (!group) {
    return [];
  }
  const rows = group.rows || [];
  const rowMap = new Map();
  for (const row of rows) {
    const key = createPreviewStudentKey(row);
    const current = rowMap.get(key) || {
      status: row.status,
      studentNo: row.studentNo,
      studentName: row.studentName,
      className: row.className,
      questionScoreMap: {},
      rawValueMap: {},
    };
    if (current.status === "可导入" && row.status !== "可导入") {
      current.status = row.status;
    }
    if (row.questionScoreMap) {
      current.questionScoreMap = {
        ...current.questionScoreMap,
        ...row.questionScoreMap,
      };
    } else if (row.questionNo) {
      current.questionScoreMap[row.questionNo] = row.score;
    }
    if (row.rawValueMap) {
      current.rawValueMap = {
        ...current.rawValueMap,
        ...row.rawValueMap,
      };
    } else if (row.questionNo) {
      current.rawValueMap[row.questionNo] = row.rawValue;
    }
    rowMap.set(key, current);
  }
  const previewRows = [...rowMap.values()];
  return limit ? previewRows.slice(0, limit) : previewRows;
}

/**
 *
 * @param group
 */
export function getQuestionWorkbookColumns(group) {
  if (!group) {
    return [];
  }
  if (Array.isArray(group.questions) && group.questions.length > 0) {
    return group.questions;
  }
  const questionMap = new Map();
  for (const row of group.rows || []) {
    if (!row.questionNo || questionMap.has(row.questionNo)) {
      continue;
    }
    questionMap.set(row.questionNo, {
      questionNo: row.questionNo,
      moduleNo: row.moduleNo,
      subQuestionNo: row.subQuestionNo,
      questionType: row.questionType,
      fullScore: row.fullScore,
      correctAnswer: row.correctAnswer,
    });
  }
  return [...questionMap.values()];
}

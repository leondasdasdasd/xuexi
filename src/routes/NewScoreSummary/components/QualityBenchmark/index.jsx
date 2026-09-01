import React, { PureComponent } from "react";
import {
  Button,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Table,
} from "antd";
import ReactMarkdown from "react-markdown";

import {
  analyzeQualityBenchmarkText,
  exportQualityBenchmarkXlsx,
  queryQualityBenchmark,
  recognizeQualityBenchmarkImage,
  saveQualityBenchmark,
} from "../../../../services/qualityBenchmark";
import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

const { Option } = Select;
const { TextArea } = Input;

const TOTAL_SUBJECT_NAME = "总分";
const LOCAL_SCHOOL_NAME = "本校";
const DISTRICT_REFERENCE_NAME = "区平均";
const OUTSIDE_AVERAGE_NAME = "外校平均";
const AUTO_COMPARE_KEY = "__auto__";
const CURRENT_EXAM_NAME = "本次考试";
const DEFAULT_RATE_THRESHOLDS = {
  passRate: 60,
  goodRate: 75,
  excellentRate: 85,
};
const MIN_TARGET_SCORE = 0;
const SAVE_SCOPE_SCORE = "SCORE";
const SAVE_SCOPE_TARGET_LINE = "TARGET_LINE";
const SAVE_SCOPE_RATE_THRESHOLD = "RATE_THRESHOLD";

const METRIC_OPTIONS = [
  {
    key: "avgScore",
    labelKey: "qualityBenchmark.averageScore",
    defaultLabel: "平均分",
  },
  { key: "passRate", labelKey: "global.passRating", defaultLabel: "及格率" },
  { key: "goodRate", labelKey: "global.goodRate", defaultLabel: "良好率" },
  {
    key: "excellentRate",
    labelKey: "global.excellentRate",
    defaultLabel: "优秀率",
  },
];

/**
 *
 * @param metric
 */
function getMetricLabel(metric) {
  return trans(metric.labelKey, metric.defaultLabel);
}

/**
 *
 * @param value
 */
function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return;
  }
  const number = Number(String(value).replace("%", "").trim());
  return Number.isNaN(number) ? undefined : number;
}

/**
 *
 * @param value
 */
function normalizeRate(value) {
  const number = toNumber(value);
  if (number === undefined) {
    return;
  }
  return number > 1 ? number : number * 100;
}

/**
 *
 * @param value
 */
function normalizePercentValue(value) {
  return toNumber(value);
}

/**
 *
 * @param {...any} values
 */
function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

/**
 *
 * @param value
 * @param suffix
 */
function formatNumber(value, suffix = "") {
  const number = toNumber(value);
  if (number === undefined) {
    return "--";
  }
  const text = Number.isInteger(number) ? String(number) : number.toFixed(2);
  return `${text}${suffix}`;
}

/**
 *
 * @param value
 * @param metricKey
 */
function formatMetricValue(value, metricKey) {
  return formatNumber(value, metricKey === "avgScore" ? "" : "%");
}

/**
 *
 * @param value
 * @param metricKey
 */
function getSignedMetricText(value, metricKey) {
  const number = toNumber(value);
  if (number === undefined) {
    return "--";
  }
  return `${number >= 0 ? "+" : "-"}${formatMetricValue(
    Math.abs(number),
    metricKey,
  )}`;
}

/**
 *
 * @param blob
 * @param fileName
 */
function downloadExportBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 *
 * @param fileName
 * @param sheetName
 * @param rows
 */
async function exportRowsToXlsx(fileName, sheetName, rows) {
  if (rows.length === 0) {
    message.warning(trans("qualityBenchmark.noExportData", "暂无可导出的数据"));
    return;
  }

  try {
    const result = await exportQualityBenchmarkXlsx({
      fileName,
      sheetName,
      rows,
    });
    if (!result.success) {
      message.error(
        result.message ||
          trans("qualityBenchmark.exportFailed", "导出校内外对比失败"),
      );
      return;
    }
    downloadExportBlob(result.blob, result.fileName || `${fileName}.xlsx`);
    message.success(trans("qualityBenchmark.exportedExcel", "已导出 Excel"));
  } catch {
    message.error(
      trans(
        "qualityBenchmark.exportRetryFailed",
        "导出校内外对比失败，请稍后重试",
      ),
    );
  }
}

/**
 *
 * @param line
 */
function splitLine(line) {
  if (line.includes("\t")) {
    return line.split("\t");
  }
  if (line.includes(",")) {
    return line.split(",");
  }
  return line.trim().split(/\s{2,}/);
}

/**
 *
 * @param header
 */
function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .replaceAll(/\s/g, "");
}

const SCORE_HEADER_KEYWORDS = new Set([
  "学校",
  "学校名称",
  "科目",
  "学科",
  "平均分",
  "评价分",
  "均分",
  "及格率",
  "良好率",
  "优秀率",
  "考试人数",
  "人数",
  "参考人数",
]);

/**
 * 拆分用户从聊天或文档中复制后粘连的表头，例如“语文优秀率数学平均分”。
 * @param {string} cell 原始表头单元格。
 * @returns {string[]} 拆分后的表头列表。
 */
function expandPackedScoreHeaderCell(cell) {
  const normalizedCell = normalizeHeader(cell);
  if (!normalizedCell) {
    return [];
  }
  if (
    SCORE_HEADER_KEYWORDS.has(normalizedCell) ||
    toNumber(normalizedCell) !== undefined
  ) {
    return [normalizedCell];
  }

  const cells =
    normalizedCell.match(/.+?(?:平均分|评价分|及格率|良好率|优秀率|均分)/g) ||
    [];
  return cells.length > 1 ? cells : [normalizedCell];
}

/**
 * 标准化表头行，兼容空格、冒号、短横线和粘连字段。
 * @param {string[]} cells 原始表头单元格列表。
 * @returns {string[]} 标准化后的表头单元格列表。
 */
function normalizeHeaderCells(cells) {
  return cells.flatMap((cell) => expandPackedScoreHeaderCell(cell));
}

/**
 * 判断表头单元格是否包含成绩指标。
 * @param {string[]} cells 表头单元格。
 * @returns {boolean} 是否包含成绩指标。
 */
function hasScoreMetricHeaderCells(cells) {
  return cells.some((cell) =>
    ["平均分", "评价分", "均分", "及格率", "良好率", "优秀率"].some((label) =>
      cell.endsWith(label),
    ),
  );
}

/**
 * 判断是否为宽表表头续行，续行一般没有数字，只补充后续学科指标。
 * @param {string} line 原始行。
 * @returns {boolean} 是否为表头续行。
 */
function isScoreHeaderContinuationLine(line) {
  const cells = normalizeHeaderCells(splitLine(line));
  return (
    cells.length > 0 &&
    hasScoreMetricHeaderCells(cells) &&
    cells.every((cell) => toNumber(cell) === undefined)
  );
}

/**
 * 读取成绩宽表表头，兼容复制时表头被自动换成多行。
 * @param {string[]} lines 文本行。
 * @returns {{headerCells: string[], dataStartIndex: number}} 表头和数据开始行。
 */
function getScoreTableHeader(lines) {
  const headerCells = normalizeHeaderCells(splitLine(lines[0]));
  let dataStartIndex = 1;
  while (
    dataStartIndex < lines.length &&
    isScoreHeaderContinuationLine(lines[dataStartIndex])
  ) {
    headerCells.push(...normalizeHeaderCells(splitLine(lines[dataStartIndex])));
    dataStartIndex += 1;
  }
  return {
    headerCells,
    dataStartIndex,
  };
}

/**
 *
 * @param list
 */
function getHeaderRow(list) {
  return Array.isArray(list) && list.length > 0 ? list[0] : {};
}

/**
 *
 * @param reportDetail
 */
function getLocalSchoolName(reportDetail = {}) {
  return (
    reportDetail.schoolName ||
    reportDetail.orgName ||
    reportDetail.school?.schoolName ||
    reportDetail.school?.name ||
    reportDetail.organizationName ||
    LOCAL_SCHOOL_NAME
  );
}

/**
 *
 * @param subjectMap
 * @param subject
 */
function addSubject(subjectMap, subject) {
  const subjectName = String(subject?.subjectName || "").trim();
  if (!subjectName || subjectName === TOTAL_SUBJECT_NAME) {
    return;
  }
  const key = subjectName;
  if (!subjectMap[key]) {
    subjectMap[key] = {
      subjectId: String(subject.subjectId || subjectName),
      subjectName,
      fullScore: toNumber(subject.totalScore || subject.paperSubjectTotalScore),
    };
  } else if (!subjectMap[key].fullScore) {
    subjectMap[key].fullScore = toNumber(
      subject.totalScore || subject.paperSubjectTotalScore,
    );
  }
}

/**
 *
 * @param reportDetail
 * @param scoreSummary
 * @param classSummaryData
 */
function getSubjectsFromReport(reportDetail, scoreSummary, classSummaryData) {
  const scoredSubjectMap = {};
  const fallbackSubjectMap = {};
  const summaryHeader = getHeaderRow(classSummaryData);

  for (const subject of scoreSummary?.columnSet || []) {
    if (subject.subjectName !== TOTAL_SUBJECT_NAME) {
      addSubject(scoredSubjectMap, subject);
    }
  }

  for (const subject of summaryHeader.classSummarySubjects || []) {
    if (toNumber(subject.subjectTotalScore) !== undefined) {
      addSubject(scoredSubjectMap, subject);
    }
  }

  for (const gradeItem of reportDetail?.summaryDetail || []) {
    for (const subject of gradeItem.examDetails || []) {
      addSubject(fallbackSubjectMap, subject);
    }
    for (const mergeItem of gradeItem.subjectMergeRequest || []) {
      for (const subject of mergeItem.subjectDetail || []) {
        addSubject(fallbackSubjectMap, subject);
      }
    }
  }

  const subjectMap =
    Object.keys(scoredSubjectMap).length > 0
      ? scoredSubjectMap
      : fallbackSubjectMap;
  return Object.keys(subjectMap).map((key) => subjectMap[key]);
}

/**
 *
 * @param subject
 * @param columnSubject
 */
function getSubjectFullScore(subject = {}, columnSubject = {}) {
  return toNumber(
    columnSubject.totalScore ||
      columnSubject.paperSubjectTotalScore ||
      columnSubject.fullScore ||
      subject.fullScore ||
      subject.totalScore ||
      subject.paperSubjectTotalScore,
  );
}

/**
 *
 * @param student
 * @param subject
 * @param columnSubject
 */
function getStudentSubjectScore(student, subject, columnSubject) {
  const subjectName = String(
    subject?.subjectName || columnSubject?.subjectName || "",
  );
  if (subjectName === TOTAL_SUBJECT_NAME) {
    const directScore = [
      student.studentTotalScore,
      student.totalScore,
      student.score,
      student.summaryScore,
    ].find((value) => toNumber(value) !== undefined);
    if (directScore !== undefined) {
      return toNumber(directScore);
    }
  }

  const detailRows = student.examResultSummaryAnalyseRow || [];
  const subjectId = subject?.subjectId || columnSubject?.subjectId;
  const detail = detailRows.find((item) => {
    if (
      subjectId !== undefined &&
      String(item.subjectId) === String(subjectId)
    ) {
      return true;
    }
    return subjectName && String(item.subjectName || "") === subjectName;
  });
  return toNumber(detail?.score);
}

/**
 *
 * @param scores
 * @param fullScore
 * @param threshold
 */
function calculateRateByThreshold(scores, fullScore, threshold) {
  const thresholdNumber = toNumber(threshold);
  if (scores.length === 0 || !fullScore || thresholdNumber === undefined) {
    return;
  }
  const lineScore = (fullScore * thresholdNumber) / 100;
  return (
    (scores.filter((score) => score >= lineScore).length / scores.length) * 100
  );
}

/**
 *
 * @param scoreSummary
 * @param subjectList
 * @param thresholds
 */
function getLocalRateMap(scoreSummary, subjectList, thresholds) {
  const studentRows =
    scoreSummary?.studentExamResultSummaryAnalyseRowList || [];
  const columnSet = scoreSummary?.columnSet || [];
  if (studentRows.length === 0) {
    return {};
  }

  const totalColumn = columnSet.find((column) => {
    const subjectName = String(column.subjectName || "");
    return subjectName === TOTAL_SUBJECT_NAME || subjectName.includes("总分");
  });
  const subjectFullScoreTotal = subjectList.reduce(
    (sum, subject) => sum + (getSubjectFullScore(subject) || 0),
    0,
  );
  const rateMap = {};
  const rateSubjects = [
    {
      subjectName: TOTAL_SUBJECT_NAME,
      subjectId: totalColumn?.subjectId,
      fullScore:
        getSubjectFullScore({ subjectName: TOTAL_SUBJECT_NAME }, totalColumn) ||
        subjectFullScoreTotal,
    },
    ...subjectList,
  ];

  for (const subject of rateSubjects) {
    const columnSubject = columnSet.find(
      (column) =>
        String(column.subjectId) === String(subject.subjectId) ||
        String(column.subjectName) === String(subject.subjectName),
    );
    const fullScore =
      subject.subjectName === TOTAL_SUBJECT_NAME
        ? subject.fullScore
        : getSubjectFullScore(subject, columnSubject);
    const scores = studentRows
      .map((student) => getStudentSubjectScore(student, subject, columnSubject))
      .filter((score) => score !== undefined);
    rateMap[subject.subjectName] = {
      passRate: calculateRateByThreshold(
        scores,
        fullScore,
        thresholds.passRate,
      ),
      goodRate: calculateRateByThreshold(
        scores,
        fullScore,
        thresholds.goodRate,
      ),
      excellentRate: calculateRateByThreshold(
        scores,
        fullScore,
        thresholds.excellentRate,
      ),
    };
  }

  return rateMap;
}

/**
 *
 * @param root0
 * @param root0.reportDetail
 * @param root0.scoreSummary
 * @param root0.classSummaryData
 * @param root0.classRateData
 * @param root0.localSchoolName
 * @param root0.localRateThresholds
 */
function getLocalRows({
  reportDetail,
  scoreSummary,
  classSummaryData,
  classRateData,
  localSchoolName,
  localRateThresholds = DEFAULT_RATE_THRESHOLDS,
}) {
  const subjectList = getSubjectsFromReport(
    reportDetail,
    scoreSummary,
    classSummaryData,
  );
  const summaryHeader = getHeaderRow(classSummaryData);
  const rateHeader = getHeaderRow(classRateData);
  const columnMap = {};
  const localRateMap = getLocalRateMap(
    scoreSummary,
    subjectList,
    localRateThresholds,
  );

  for (const subject of scoreSummary?.columnSet || []) {
    columnMap[String(subject.subjectName)] = subject;
  }

  const rows = [
    {
      id: "local_total",
      type: "score",
      schoolName: localSchoolName || LOCAL_SCHOOL_NAME,
      subjectName: TOTAL_SUBJECT_NAME,
      avgScore: toNumber(summaryHeader.studentTotalScore),
      passRate: firstDefined(
        normalizeRate(localRateMap[TOTAL_SUBJECT_NAME]?.passRate),
        normalizeRate(rateHeader.passRate),
      ),
      goodRate: normalizeRate(localRateMap[TOTAL_SUBJECT_NAME]?.goodRate),
      excellentRate: firstDefined(
        normalizeRate(localRateMap[TOTAL_SUBJECT_NAME]?.excellentRate),
        normalizeRate(rateHeader.excellentRate),
      ),
      studentCount: toNumber(
        summaryHeader.studentTotal || rateHeader.studentTotal,
      ),
      source: "local",
      confirmed: true,
      isLocal: true,
    },
  ];

  for (const subject of subjectList) {
    const headerSubject = (summaryHeader.classSummarySubjects || []).find(
      (item) => String(item.subjectName) === String(subject.subjectName),
    );
    const columnSubject = columnMap[String(subject.subjectName)];
    const avgScore = toNumber(
      columnSubject?.avgScore || headerSubject?.subjectTotalScore,
    );
    if (avgScore === undefined) {
      continue;
    }
    rows.push({
      id: `local_${subject.subjectId}`,
      type: "score",
      schoolName: localSchoolName || LOCAL_SCHOOL_NAME,
      subjectName: subject.subjectName,
      avgScore,
      passRate: firstDefined(
        normalizeRate(localRateMap[subject.subjectName]?.passRate),
        normalizeRate(columnSubject?.passRate),
      ),
      goodRate: normalizeRate(localRateMap[subject.subjectName]?.goodRate),
      excellentRate: firstDefined(
        normalizeRate(localRateMap[subject.subjectName]?.excellentRate),
        normalizeRate(columnSubject?.excellentRate),
      ),
      studentCount: toNumber(
        scoreSummary?.studentTotalNum || summaryHeader.studentTotal,
      ),
      source: "local",
      confirmed: true,
      isLocal: true,
    });
  }

  return rows;
}

/**
 *
 * @param localRows
 * @param localSchoolName
 */
function getEffectiveLocalRows(localRows, localSchoolName) {
  const hasLocalScore = localRows.some((row) => row.avgScore !== undefined);
  if (hasLocalScore) {
    return localRows;
  }
  return [
    normalizeScoreRow({
      id: "local_empty_total",
      schoolName: localSchoolName || LOCAL_SCHOOL_NAME,
      subjectName: TOTAL_SUBJECT_NAME,
      source: "local_empty",
      confirmed: true,
      isLocal: true,
    }),
  ];
}

/**
 *
 * @param scoreSummary
 */
function getStudentScoreRows(scoreSummary) {
  const studentRows =
    scoreSummary?.studentExamResultSummaryAnalyseRowList || [];
  const columnSet = scoreSummary?.columnSet || [];
  const totalColumn = columnSet.find((column) => {
    const subjectName = String(column.subjectName || "");
    return subjectName === TOTAL_SUBJECT_NAME || subjectName.includes("总分");
  });

  return studentRows
    .map((student) => {
      const directScore = [
        student.studentTotalScore,
        student.totalScore,
        student.score,
        student.summaryScore,
      ].find((value) => toNumber(value) !== undefined);
      if (directScore !== undefined) {
        return toNumber(directScore);
      }

      const detailRows = student.examResultSummaryAnalyseRow || [];
      if (totalColumn) {
        const totalDetail = detailRows.find(
          (detail) =>
            String(detail.subjectId) === String(totalColumn.subjectId),
        );
        const totalScore = toNumber(totalDetail?.score);
        if (totalScore !== undefined) {
          return totalScore;
        }
      }

      const subjectIds = columnSet
        .filter((column) => column.subjectName !== TOTAL_SUBJECT_NAME)
        .map((column) => String(column.subjectId));
      const scoredRows = detailRows.filter((detail) => {
        const score = toNumber(detail.score);
        if (score === undefined) {
          return false;
        }
        return subjectIds.length > 0
          ? subjectIds.includes(String(detail.subjectId))
          : true;
      });
      const totalScore = scoredRows.reduce(
        (sum, detail) => sum + (toNumber(detail.score) || 0),
        0,
      );
      return scoredRows.length > 0 ? totalScore : undefined;
    })
    .filter((score) => score !== undefined);
}

/**
 *
 * @param schoolName
 */
function isReferenceSchool(schoolName) {
  const name = String(schoolName || "");
  return name.includes("平均") || name.includes("全区");
}

/**
 *
 * @param schoolName
 */
function isExternalAverageRow(schoolName) {
  return String(schoolName || "") === OUTSIDE_AVERAGE_NAME;
}

/**
 *
 * @param row
 * @param source
 */
function normalizeScoreRow(row = {}, source = row.source || "manual") {
  const passRate = normalizeRate(row.passRate);
  const excellentRate = normalizeRate(row.excellentRate);
  const goodRate = normalizeRate(row.goodRate);
  return {
    id: row.id || `${Date.now()}_${Math.random()}`,
    type: "score",
    schoolName: String(row.schoolName || "").trim(),
    subjectName: String(row.subjectName || TOTAL_SUBJECT_NAME).trim(),
    studentCount: toNumber(row.studentCount),
    avgScore: toNumber(row.avgScore),
    passRate,
    goodRate,
    excellentRate,
    source,
    confirmed: row.confirmed !== false,
    isEstimated: row.isEstimated,
  };
}

/**
 *
 * @param row
 * @param source
 */
function normalizeTargetLineRow(row = {}, source = row.source || "manual") {
  const studentCount = toNumber(row.studentCount);
  const onlineCount = toNumber(row.onlineCount);
  const inputRate = normalizePercentValue(row.onlineRate);
  const estimatedCount =
    onlineCount === undefined && inputRate !== undefined && studentCount
      ? Math.round((studentCount * inputRate) / 100)
      : onlineCount;
  const onlineRate =
    inputRate === undefined
      ? estimatedCount !== undefined && studentCount
        ? (estimatedCount / studentCount) * 100
        : undefined
      : inputRate;

  return {
    id: row.id || `${Date.now()}_${Math.random()}`,
    type: "targetLine",
    schoolName: String(row.schoolName || "").trim(),
    studentCount,
    targetScore: toNumber(row.targetScore),
    onlineCount: estimatedCount,
    onlineRate,
    source,
    confirmed: row.confirmed !== false,
    isEstimated:
      row.isEstimated ||
      (onlineCount === undefined && estimatedCount !== undefined),
    isLocal: row.isLocal,
    targetGroupId: row.targetGroupId,
  };
}

/**
 *
 * @param cells
 * @param headerMap
 * @param names
 */
function getByHeader(cells, headerMap, names) {
  for (const name_ of names) {
    const cellIndex = headerMap[name_];
    if (cellIndex !== undefined) {
      return cells[cellIndex];
    }
  }
  return;
}

/**
 *
 * @param text
 * @param source
 */
function parseScoreRowsFromText(text, source = "paste") {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return [];
  }

  const { headerCells: firstCells, dataStartIndex } =
    getScoreTableHeader(lines);
  const hasHeader = firstCells.some((cell) =>
    [
      "学校",
      "学校名称",
      "科目",
      "学科",
      "平均分",
      "评价分",
      "及格率",
      "良好率",
      "优秀率",
      "考试人数",
      "人数",
    ].includes(cell),
  );
  const headerMap = {};
  if (hasHeader) {
    for (const [index, cell] of firstCells.entries()) {
      headerMap[cell] = index;
    }
  }

  const metricHeaderMap = {
    平均分: "avgScore",
    评价分: "avgScore",
    均分: "avgScore",
    及格率: "passRate",
    良好率: "goodRate",
    优秀率: "excellentRate",
  };
  const scoreMetricHeaders = firstCells
    .map((cell, index) => {
      const metricLabel = Object.keys(metricHeaderMap).find((label) =>
        cell.endsWith(label),
      );
      if (!metricLabel) {
        return null;
      }
      const subjectName = cell
        .replace(metricLabel, "")
        .replaceAll(/[:_·：-]/g, "")
        .trim();
      return {
        index,
        subjectName: subjectName || TOTAL_SUBJECT_NAME,
        metricKey: metricHeaderMap[metricLabel],
      };
    })
    .filter(Boolean);
  const hasWideScoreTable =
    (firstCells.includes("学校") || firstCells.includes("学校名称")) &&
    !firstCells.includes("学科") &&
    !firstCells.includes("科目") &&
    scoreMetricHeaders.length > 1;
  if (hasWideScoreTable) {
    const schoolIndex = firstCells.includes("学校")
      ? firstCells.indexOf("学校")
      : firstCells.indexOf("学校名称");
    const countIndex = ["考试人数", "人数", "参考人数"]
      .map((name) => firstCells.indexOf(name))
      .find((index) => index > -1);
    return lines
      .slice(dataStartIndex)
      .flatMap((line) => {
        const cells = splitLine(line).map((cell) => cell.trim());
        const subjectMap = {};
        for (const header of scoreMetricHeaders) {
          if (!subjectMap[header.subjectName]) {
            subjectMap[header.subjectName] = {
              schoolName: cells[schoolIndex],
              subjectName: header.subjectName,
              studentCount: countIndex > -1 ? cells[countIndex] : undefined,
            };
          }
          subjectMap[header.subjectName][header.metricKey] =
            cells[header.index];
        }
        return Object.keys(subjectMap).map((subjectName) =>
          normalizeScoreRow(subjectMap[subjectName], source),
        );
      })
      .filter(
        (row) =>
          row.schoolName &&
          row.subjectName &&
          (row.avgScore !== undefined ||
            row.passRate !== undefined ||
            row.goodRate !== undefined ||
            row.excellentRate !== undefined),
      );
  }

  return (hasHeader ? lines.slice(dataStartIndex) : lines)
    .map((line) => {
      const cells = splitLine(line).map((cell) => cell.trim());
      return normalizeScoreRow(
        hasHeader
          ? {
              schoolName: getByHeader(cells, headerMap, ["学校", "学校名称"]),
              subjectName: getByHeader(cells, headerMap, ["科目", "学科"]),
              studentCount: getByHeader(cells, headerMap, [
                "考试人数",
                "人数",
                "参考人数",
              ]),
              avgScore: getByHeader(cells, headerMap, [
                "平均分",
                "评价分",
                "均分",
              ]),
              passRate: getByHeader(cells, headerMap, ["及格率"]),
              goodRate: getByHeader(cells, headerMap, ["良好率"]),
              excellentRate: getByHeader(cells, headerMap, ["优秀率"]),
            }
          : {
              schoolName: cells[0],
              subjectName: cells[1],
              avgScore: cells[2],
              passRate: cells[3],
              goodRate: cells.length > 6 ? cells[4] : undefined,
              excellentRate: cells.length > 6 ? cells[5] : cells[4],
              studentCount: cells.length > 6 ? cells[6] : cells[5],
            },
        source,
      );
    })
    .filter(
      (row) =>
        row.schoolName &&
        row.subjectName &&
        (row.avgScore !== undefined ||
          row.passRate !== undefined ||
          row.goodRate !== undefined ||
          row.excellentRate !== undefined),
    );
}

/**
 *
 * @param text
 * @param source
 */
function parseTargetRowsFromText(text, source = "paste") {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return [];
  }

  const firstCells = normalizeHeaderCells(splitLine(lines[0]));
  const targetLineHeaders = firstCells
    .map((cell, index) => ({ cell, index, value: toNumber(cell) }))
    .filter(
      (item) => item.value !== undefined && item.value >= MIN_TARGET_SCORE,
    );
  const hasWideTargetTable =
    (firstCells.includes("学校") || firstCells.includes("学校名称")) &&
    targetLineHeaders.length > 0;
  const hasHeader = firstCells.some((cell) =>
    [
      "学校",
      "学校名称",
      "考试人数",
      "人数",
      "目标线",
      "分数线",
      "上线人数",
      "上线率",
    ].includes(cell),
  );

  if (hasWideTargetTable) {
    const schoolIndex = firstCells.includes("学校")
      ? firstCells.indexOf("学校")
      : firstCells.indexOf("学校名称");
    const countIndex = ["考试人数", "人数", "参考人数"]
      .map((name) => firstCells.indexOf(name))
      .find((index) => index > -1);
    return lines
      .slice(1)
      .flatMap((line) => {
        const cells = splitLine(line).map((cell) => cell.trim());
        const schoolName = cells[schoolIndex];
        const studentCount = countIndex > -1 ? cells[countIndex] : undefined;
        return targetLineHeaders.map((targetHeader) =>
          normalizeTargetLineRow(
            {
              schoolName,
              studentCount,
              targetScore: targetHeader.value,
              onlineCount: cells[targetHeader.index],
            },
            source,
          ),
        );
      })
      .filter((row) => row.schoolName && row.targetScore !== undefined);
  }

  const headerMap = {};
  if (hasHeader) {
    for (const [index, cell] of firstCells.entries()) {
      headerMap[cell] = index;
    }
  }

  return (hasHeader ? lines.slice(1) : lines)
    .map((line) => {
      const cells = splitLine(line).map((cell) => cell.trim());
      return normalizeTargetLineRow(
        hasHeader
          ? {
              schoolName: getByHeader(cells, headerMap, ["学校", "学校名称"]),
              studentCount: getByHeader(cells, headerMap, [
                "考试人数",
                "人数",
                "参考人数",
              ]),
              targetScore: getByHeader(cells, headerMap, [
                "目标线",
                "分数线",
                "分值",
              ]),
              onlineCount: getByHeader(cells, headerMap, ["上线人数", "人数"]),
              onlineRate: getByHeader(cells, headerMap, [
                "上线率",
                "占比",
                "比例",
              ]),
            }
          : {
              schoolName: cells[0],
              studentCount: cells[1],
              targetScore: cells[2],
              onlineCount: cells[3],
              onlineRate: cells[4],
            },
        source,
      );
    })
    .filter((row) => row.schoolName && row.targetScore !== undefined);
}

/**
 * 判断粘贴文本是否存在基础分列问题。
 * @param text 粘贴文本。
 * @returns {boolean} 是否疑似没有正确分列。
 */
function hasSplitProblem(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return false;
  }
  return lines.every((line) => splitLine(line).length <= 1);
}

/**
 * 获取粘贴文本第一行的标准化表头。
 * @param text 粘贴文本。
 * @returns {string[]} 表头单元格列表。
 */
function getFirstHeaderCells(text) {
  const firstLine = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine ? normalizeHeaderCells(splitLine(firstLine)) : [];
}

/**
 * 判断文本是否像平均成绩表。
 * @param text 粘贴文本。
 * @returns {boolean} 是否包含成绩类表头。
 */
function hasScoreLikeHeader(text) {
  const firstCells = getFirstHeaderCells(text);
  return firstCells.some((cell) =>
    ["平均分", "评价分", "均分", "及格率", "良好率", "优秀率"].some((label) =>
      cell.endsWith(label),
    ),
  );
}

/**
 * 判断文本是否像总分上线表。
 * @param text 粘贴文本。
 * @returns {boolean} 是否包含目标线类表头。
 */
function hasTargetLikeHeader(text) {
  const firstCells = getFirstHeaderCells(text);
  return firstCells.some((cell) =>
    ["目标线", "分数线", "分值", "上线人数", "上线率"].includes(cell),
  );
}

/**
 * 生成解析成功时的反馈。
 * @param {boolean} isScoreScope 是否正在导入平均成绩。
 * @param {Array} scoreRows 平均成绩解析结果。
 * @param {Array} targetRows 总分上线解析结果。
 * @returns {string} 成功反馈，无法生成时返回空字符串。
 */
function buildSuccessImportNotice(isScoreScope, scoreRows, targetRows) {
  if (isScoreScope && scoreRows.length > 0) {
    const ignoredTargetNotice =
      targetRows.length > 0
        ? `；已忽略 ${targetRows.length} 条总分上线数据`
        : "";
    return `已识别 ${scoreRows.length} 条平均成绩数据${ignoredTargetNotice}，请在下方表格核对后保存。`;
  }
  if (!isScoreScope && targetRows.length > 0) {
    const ignoredScoreNotice =
      scoreRows.length > 0 ? `；已忽略 ${scoreRows.length} 条平均成绩数据` : "";
    return `已识别 ${targetRows.length} 条总分上线数据${ignoredScoreNotice}，请在下方表格核对后保存。`;
  }
  return "";
}

/**
 * 生成导入类型不匹配时的反馈。
 * @param {boolean} isScoreScope 是否正在导入平均成绩。
 * @param {Array} scoreRows 平均成绩解析结果。
 * @param {Array} targetRows 总分上线解析结果。
 * @returns {string} 类型不匹配反馈，无法生成时返回空字符串。
 */
function buildScopeMismatchNotice(isScoreScope, scoreRows, targetRows) {
  if (isScoreScope && targetRows.length > 0) {
    return "当前选择的是平均成绩导入，但粘贴内容更像总分上线表。请切换到“总分上线数据”后再同步。";
  }
  if (!isScoreScope && scoreRows.length > 0) {
    return "当前选择的是总分上线导入，但粘贴内容更像平均成绩表。请切换到“多校对比数据”后再同步。";
  }
  return "";
}

/**
 * 生成已识别表头但没有有效数据行时的反馈。
 * @param {string} text 粘贴文本。
 * @param {boolean} isScoreScope 是否正在导入平均成绩。
 * @returns {string} 表头失败反馈，无法生成时返回空字符串。
 */
function buildHeaderFailureNotice(text, isScoreScope) {
  if (isScoreScope && hasScoreLikeHeader(text)) {
    return "已识别到平均成绩表头，但没有有效成绩行。请检查平均分、及格率、良好率、优秀率和考试人数是否为数字。";
  }
  if (!isScoreScope && hasTargetLikeHeader(text)) {
    return "已识别到总分上线表头，但没有有效上线行。请检查目标线、上线人数、上线率和考试人数是否为数字。";
  }
  return "";
}

/**
 * 生成解析失败时的反馈。
 * @param {string} text 粘贴文本。
 * @param {boolean} isScoreScope 是否正在导入平均成绩。
 * @returns {string} 失败反馈。
 */
function buildFailedImportNotice(text, isScoreScope) {
  if (!String(text || "").trim()) {
    return "请先粘贴 Excel、CSV 或表格文本后再同步。";
  }
  if (hasSplitProblem(text)) {
    return "没有正确识别到列。请使用 Excel 复制、英文逗号分隔，或至少两个连续空格分隔列。";
  }
  return (
    buildHeaderFailureNotice(text, isScoreScope) ||
    (isScoreScope
      ? "当前内容没有识别到平均成绩数据。请确认包含学校、学科或总分平均分、及格率、良好率、优秀率等字段。"
      : "当前内容没有识别到总分上线数据。请确认包含学校、考试人数、目标线和上线人数，或使用目标线作为表头。")
  );
}

/**
 * 根据解析结果生成用户可理解的导入反馈。
 * @param text 粘贴文本。
 * @param importScope 当前导入类型。
 * @param scoreRows 平均成绩解析结果。
 * @param targetRows 总分上线解析结果。
 * @returns {string} 反馈文案。
 */
function buildImportNotice(text, importScope, scoreRows, targetRows) {
  const isScoreScope = importScope === "score";
  return (
    buildSuccessImportNotice(isScoreScope, scoreRows, targetRows) ||
    buildScopeMismatchNotice(isScoreScope, scoreRows, targetRows) ||
    buildFailedImportNotice(text, isScoreScope)
  );
}

/**
 * 解析校内外对比粘贴内容，并返回结果和可展示给用户的反馈。
 * @param text 粘贴文本。
 * @param importScope 当前导入类型：score 为平均成绩，target 为总分上线。
 * @returns {{scoreRows: Array, targetRows: Array, notice: string}} 解析结果。
 */
export function parseQualityBenchmarkImport(text, importScope = "score") {
  const scoreRows = parseScoreRowsFromText(text);
  const targetRows = parseTargetRowsFromText(text);
  const isScoreScope = importScope === "score";
  return {
    scoreRows: isScoreScope ? scoreRows : [],
    targetRows: isScoreScope ? [] : targetRows,
    notice: buildImportNotice(text, importScope, scoreRows, targetRows),
  };
}

/**
 * 构造校内外对比保存请求，未传的数据类型不会进入请求体，避免局部保存覆盖其它公共数据。
 * @param {object} parameters 报告定位参数。
 * @param {Array|undefined} scoreRows 平均成绩行。
 * @param {Array|undefined} targetLineRows 总分上线行。
 * @param {object|undefined} localRateThresholds 三率口径。
 * @param {string} saveScope 保存范围。
 * @returns {object} 保存请求体。
 */
export function buildQualityBenchmarkSaveRequest(
  parameters,
  scoreRows,
  targetLineRows,
  localRateThresholds,
  saveScope,
) {
  const requestBody = {
    ...parameters,
    saveScope,
  };
  if (scoreRows !== undefined) {
    requestBody.scoreRows = scoreRows;
  }
  if (targetLineRows !== undefined) {
    requestBody.targetLineRows = targetLineRows;
  }
  if (localRateThresholds !== undefined) {
    requestBody.localRateThresholds = localRateThresholds;
  }
  return requestBody;
}

/**
 *
 * @param subjectList
 * @param localRows
 * @param scoreRows
 */
function getMatrixSubjects(subjectList, localRows, scoreRows) {
  return [
    TOTAL_SUBJECT_NAME,
    ...subjectList.map((subject) => subject.subjectName),
    ...localRows.map((row) => row.subjectName),
    ...scoreRows.map((row) => row.subjectName),
  ].filter((item, index, array) => item && array.indexOf(item) === index);
}

/**
 *
 * @param localRows
 * @param scoreRows
 * @param matrixSubjects
 */
function buildSchoolMetricMatrix(localRows, scoreRows, matrixSubjects) {
  const localTotal = localRows.find(
    (row) => row.subjectName === TOTAL_SUBJECT_NAME,
  );
  const localRow = {
    id: "matrix_local",
    schoolName: localTotal?.schoolName || LOCAL_SCHOOL_NAME,
    studentCount: localTotal?.studentCount,
    rowType: "local",
    metricMap: {},
    rankMap: {},
  };

  for (const row of localRows) {
    localRow.metricMap[row.subjectName] = row;
  }

  const schoolMap = {};
  for (const row of scoreRows) {
    if (!schoolMap[row.schoolName]) {
      schoolMap[row.schoolName] = {
        id: `matrix_${row.schoolName}`,
        schoolName: row.schoolName,
        studentCount: undefined,
        rowType: isReferenceSchool(row.schoolName) ? "average" : "external",
        metricMap: {},
      };
    }
    schoolMap[row.schoolName].metricMap[row.subjectName] = row;
    if (
      row.subjectName === TOTAL_SUBJECT_NAME ||
      schoolMap[row.schoolName].studentCount === undefined
    ) {
      schoolMap[row.schoolName].studentCount = row.studentCount;
    }
  }

  const schoolRows = [
    localRow,
    ...Object.keys(schoolMap).map((key) => schoolMap[key]),
  ];
  const rankingRows = schoolRows.filter(
    (row) => row.rowType !== "average" && !isExternalAverageRow(row.schoolName),
  );

  const rankRow = {
    id: "matrix_rank",
    schoolName: "本校名次",
    rowType: "summary",
    metricMap: {},
  };
  const gapRow = {
    id: "matrix_gap",
    schoolName: "",
    rowType: "summary",
    metricMap: {},
  };

  for (const subjectName of matrixSubjects) {
    rankRow.metricMap[subjectName] = {};
    gapRow.metricMap[subjectName] = {};
    localRow.rankMap[subjectName] = {};

    for (const metric of METRIC_OPTIONS) {
      const localValue = localRow.metricMap[subjectName]?.[metric.key];
      const rankedRows = rankingRows
        .map((row) => {
          const value = row.metricMap[subjectName]?.[metric.key];
          return {
            schoolName: row.schoolName,
            rowType: row.rowType,
            value,
          };
        })
        .filter((row) => row.value !== undefined)
        .sort((a, b) => b.value - a.value);
      const localRankIndex = rankedRows.findIndex(
        (row) => row.rowType === "local",
      );

      if (localRankIndex > -1) {
        const localRank = localRankIndex + 1;
        rankRow.metricMap[subjectName][metric.key] = localRank;
        localRow.rankMap[subjectName][metric.key] = localRank;
      }

      if (localValue !== undefined && rankedRows.length > 1) {
        const target = localRankIndex === 0 ? rankedRows[1] : rankedRows[0];
        if (target?.value !== undefined) {
          gapRow.metricMap[subjectName][metric.key] = {
            diff: localValue - target.value,
            targetName: target.schoolName,
            mode: localRankIndex === 0 ? "leadSecond" : "gapFirst",
          };
        }
      }
    }
  }

  const [firstRow, ...restRows] = schoolRows;
  return [firstRow, gapRow, ...restRows, rankRow];
}

/**
 *
 * @param scoreSummary
 * @param targetScores
 * @param localStudentCount
 * @param localSchoolName
 */
function getLocalTargetRows(
  scoreSummary,
  targetScores,
  localStudentCount,
  localSchoolName,
) {
  const scores = getStudentScoreRows(scoreSummary);
  const effectiveStudentCount = scores.length || localStudentCount;
  return targetScores.map((targetScore) => {
    const computedCount =
      scores.length > 0
        ? scores.filter((score) => score >= targetScore).length
        : undefined;
    return normalizeTargetLineRow({
      id: `local_target_${targetScore}`,
      schoolName: localSchoolName || LOCAL_SCHOOL_NAME,
      studentCount: effectiveStudentCount,
      targetScore,
      onlineCount: computedCount,
      source: "local",
      confirmed: true,
      isLocal: true,
    });
  });
}

/**
 *
 * @param targetRows
 */
function getTargetScores(targetRows) {
  const scores = targetRows
    .map((row) => row.targetScore)
    .filter((score) => score !== undefined);
  return scores
    .filter((score, index, array) => array.indexOf(score) === index)
    .sort((a, b) => b - a);
}

/**
 *
 * @param localTargetRows
 * @param targetRows
 */
export function buildTargetLineMatrix(localTargetRows, targetRows) {
  const targetScores = getTargetScores([...localTargetRows, ...targetRows]);
  const schoolMap = {};
  for (const row of [...localTargetRows, ...targetRows]) {
    if (!schoolMap[row.schoolName]) {
      schoolMap[row.schoolName] = {
        id: `target_${row.schoolName}`,
        schoolName: row.schoolName,
        studentCount: row.studentCount,
        rowType: row.isLocal
          ? "local"
          : isReferenceSchool(row.schoolName)
            ? "average"
            : "external",
        targetMap: {},
      };
    }
    schoolMap[row.schoolName].targetMap[row.targetScore] = row;
    if (row.studentCount !== undefined) {
      schoolMap[row.schoolName].studentCount = row.studentCount;
    }
  }

  const rows = Object.keys(schoolMap).map((key) => schoolMap[key]);
  const externalRows = rows.filter((row) => row.rowType === "external");
  if (externalRows.length > 0) {
    const averageRow = {
      id: "target_outside_average",
      schoolName: OUTSIDE_AVERAGE_NAME,
      rowType: "average",
      studentCount: undefined,
      targetMap: {},
    };
    for (const targetScore of targetScores) {
      const rowsWithTarget = externalRows
        .map((row) => row.targetMap[targetScore])
        .filter((row) => row && row.onlineRate !== undefined);
      if (rowsWithTarget.length === 0) {
        continue;
      }
      const onlineCount = Math.round(
        rowsWithTarget.reduce((sum, row) => sum + (row.onlineCount || 0), 0) /
          rowsWithTarget.length,
      );
      const onlineRate =
        rowsWithTarget.reduce((sum, row) => sum + (row.onlineRate || 0), 0) /
        rowsWithTarget.length;
      averageRow.targetMap[targetScore] = normalizeTargetLineRow({
        id: `target_average_${targetScore}`,
        schoolName: OUTSIDE_AVERAGE_NAME,
        studentCount: averageRow.studentCount,
        targetScore,
        onlineCount,
        onlineRate,
        source: "computed",
        confirmed: true,
      });
    }
    rows.push(averageRow);
  }

  const orderWeight = {
    local: 0,
    external: 1,
    average: 2,
  };

  return {
    targetScores,
    rows: rows.sort(
      (a, b) => (orderWeight[a.rowType] ?? 9) - (orderWeight[b.rowType] ?? 9),
    ),
  };
}

/**
 *
 * @param value
 */
function getGapTone(value) {
  const number = toNumber(value);
  if (number === undefined) {
    return "";
  }
  return number >= 0 ? styles.goodText : styles.riskText;
}

/**
 *
 * @param matrixRows
 * @param matrixSubjects
 * @param targetRows
 * @param targetScores
 */
function getAnalysisItems(
  matrixRows,
  matrixSubjects,
  targetRows,
  targetScores,
) {
  const localRow = matrixRows.find((row) => row.rowType === "local");
  const rankRow = matrixRows.find((row) => row.id === "matrix_rank");
  const gapRow = matrixRows.find((row) => row.id === "matrix_gap");
  const metricItems = [];

  for (const subjectName of matrixSubjects) {
    for (const metric of METRIC_OPTIONS) {
      const gap = gapRow?.metricMap?.[subjectName]?.[metric.key];
      if (gap === undefined) {
        continue;
      }
      const gapValue = typeof gap === "object" ? gap.diff : gap;
      metricItems.push({
        key: `${subjectName}_${metric.key}`,
        subjectName,
        metricLabel: getMetricLabel(metric),
        metricKey: metric.key,
        gap: gapValue,
        targetName: typeof gap === "object" ? gap.targetName : undefined,
        mode: typeof gap === "object" ? gap.mode : undefined,
        rank: rankRow?.metricMap?.[subjectName]?.[metric.key],
      });
    }
  }

  const advantages = metricItems
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2);
  const risks = metricItems
    .filter((item) => item.gap < 0)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 2);
  const outsideAverage = targetRows.find(
    (row) => row.schoolName === OUTSIDE_AVERAGE_NAME,
  );
  const localTarget = targetRows.find((row) => row.rowType === "local");
  const targetScore = targetScores.find(
    (score) =>
      localTarget?.targetMap?.[score]?.onlineRate !== undefined &&
      outsideAverage?.targetMap?.[score]?.onlineRate !== undefined,
  );

  const items = [];
  if (advantages.length > 0) {
    items.push({
      key: "advantage",
      tone: "good",
      title: trans("qualityBenchmark.advantageMetrics", "优势指标"),
      content: advantages
        .map((item) =>
          trans(
            "qualityBenchmark.leadsComparison",
            "{$subject}{$metric}领先{$target}{$gap}",
            {
              subject: item.subjectName,
              metric: item.metricLabel,
              target:
                item.targetName ||
                trans("qualityBenchmark.secondPlace", "第二名"),
              gap: getSignedMetricText(
                Math.abs(item.gap),
                item.metricKey,
              ).replace("+", ""),
            },
          ),
        )
        .join("，"),
    });
  }
  if (risks.length > 0) {
    items.push({
      key: "risk",
      tone: "risk",
      title: trans("qualityBenchmark.improveFirst", "优先补短"),
      content: risks
        .map((item) =>
          trans(
            "qualityBenchmark.behindComparison",
            "{$subject}{$metric}距{$target}{$gap}",
            {
              subject: item.subjectName,
              metric: item.metricLabel,
              target:
                item.targetName ||
                trans("qualityBenchmark.firstPlace", "第一名"),
              gap: getSignedMetricText(
                Math.abs(item.gap),
                item.metricKey,
              ).replace("+", ""),
            },
          ),
        )
        .join("，"),
    });
  }
  if (targetScore !== undefined) {
    const local = localTarget.targetMap[targetScore];
    const average = outsideAverage.targetMap[targetScore];
    const rateGap = local.onlineRate - average.onlineRate;
    const needCount =
      rateGap < 0 && local.studentCount
        ? Math.ceil(
            ((average.onlineRate - local.onlineRate) * local.studentCount) /
              100,
          )
        : 0;
    items.push({
      key: "target",
      tone: rateGap >= 0 ? "good" : "risk",
      title: trans("qualityBenchmark.targetScoreOnline", "{$score}分上线", {
        score: targetScore,
      }),
      content:
        rateGap >= 0
          ? `本校上线率较外校平均${getSignedMetricText(rateGap, "passRate")}`
          : `本校上线率较外校平均${getSignedMetricText(rateGap, "passRate")}，追平约需增加${needCount}人`,
    });
  }
  if (items.length === 0) {
    items.push({
      key: "empty",
      tone: "normal",
      title: trans("qualityBenchmark.outsideDataNeeded", "待补充校外数据"),
      content:
        "添加外校平均成绩或目标线上线数据后，系统会自动生成优势、短板和追平建议。",
    });
  }

  const firstRankCount = metricItems.filter((item) => item.rank === 1).length;
  if (firstRankCount) {
    items.unshift({
      key: "rank",
      tone: "good",
      title: trans("qualityBenchmark.rankingPerformance", "排名表现"),
      content: `本校在已对标指标中有 ${firstRankCount} 项排名第一。`,
    });
  }

  return items.slice(0, 5);
}

/**
 *
 * @param items
 */
function getAnalysisMarkdown(items = []) {
  const validItems = items.filter((item) => item.key !== "empty");
  if (validItems.length === 0) {
    return "暂无可解读的校外对比数据。添加并确认校外数据后，AI 会基于本页表格生成分析报告。";
  }
  const lines = ["### 校内外对比分析报告", ""];
  for (const item of validItems) {
    lines.push(`- **${item.title}**：${item.content}`);
  }
  lines.push("", "### 建议关注");
  const riskItems = validItems.filter((item) => item.tone === "risk");
  if (riskItems.length > 0) {
    for (const item of riskItems) {
      lines.push(`- ${item.content}`);
    }
  } else {
    lines.push(
      "- 当前本校在主要对比项上表现稳定，可继续关注优势指标的稳定性。",
    );
  }
  return lines.join("\n");
}

class QualityBenchmark extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      scoreRows: [],
      targetLineRows: [],
      importVisible: false,
      importScope: "score",
      importText: "",
      imagePreviewUrl: "",
      imagePreviewUrls: [],
      imageFiles: [],
      recognitionNotice: "",
      recognizing: false,
      recognizingCount: 0,
      draftScoreRows: [],
      draftTargetRows: [],
      draftTargetScoreInput: undefined,
      askVisible: false,
      askContext: null,
      askQuestion: "",
      askAnswer: "",
      loadingExternalData: false,
      savingExternalData: false,
      localMetricModalVisible: false,
      localRateThresholds: DEFAULT_RATE_THRESHOLDS,
      localRateThresholdDraft: DEFAULT_RATE_THRESHOLDS,
    };
  }

  componentDidMount() {
    this.loadBenchmarkRows();
  }

  componentDidUpdate(previousProperties) {
    if (
      this.getBenchmarkRequestKey(previousProperties) !==
      this.getBenchmarkRequestKey(this.props)
    ) {
      this.loadBenchmarkRows();
    }
  }

  getBenchmarkRequestParams = (properties = this.props) => {
    const reportId = properties.reportId || properties.reportDetail?.id;
    if (reportId) {
      return { id: reportId };
    }
    return {
      gradeId: properties.gradeId,
      reportType: properties.reportType,
      semesterId: properties.semesterId,
    };
  };

  getBenchmarkRequestKey = (properties = this.props) => {
    const parameters = this.getBenchmarkRequestParams(properties);
    return [
      parameters.id || "",
      parameters.gradeId || "",
      parameters.reportType || "",
      parameters.semesterId || "",
    ].join("_");
  };

  hasBenchmarkRequestParams = (parameters) => {
    return (
      !!parameters.id ||
      (!!parameters.gradeId &&
        parameters.reportType !== undefined &&
        parameters.reportType !== null &&
        !!parameters.semesterId)
    );
  };

  normalizeRateThresholds = (thresholds = {}) => {
    return {
      passRate: firstDefined(
        toNumber(thresholds.passRate),
        DEFAULT_RATE_THRESHOLDS.passRate,
      ),
      goodRate: firstDefined(
        toNumber(thresholds.goodRate),
        DEFAULT_RATE_THRESHOLDS.goodRate,
      ),
      excellentRate: firstDefined(
        toNumber(thresholds.excellentRate),
        DEFAULT_RATE_THRESHOLDS.excellentRate,
      ),
    };
  };

  applyBenchmarkResponse = (content = {}) => {
    const normalizedThresholds = this.normalizeRateThresholds(
      content.localRateThresholds,
    );
    if (content.summaryReportId && this.props.onSummaryReportIdChange) {
      this.props.onSummaryReportIdChange(content.summaryReportId);
    }
    this.setState({
      scoreRows: (content.scoreRows || []).map((row) => normalizeScoreRow(row)),
      targetLineRows: (content.targetLineRows || []).map((row) =>
        normalizeTargetLineRow(row),
      ),
      localRateThresholds: normalizedThresholds,
      localRateThresholdDraft: normalizedThresholds,
    });
  };

  loadBenchmarkRows = () => {
    const parameters = this.getBenchmarkRequestParams();
    if (!this.hasBenchmarkRequestParams(parameters)) {
      return;
    }
    this.setState({ loadingExternalData: true });
    queryQualityBenchmark(parameters)
      .then((res) => {
        if (res.status) {
          this.applyBenchmarkResponse(res.content || {});
        } else {
          message.error(
            res.message ||
              trans(
                "qualityBenchmark.loadComparisonFailed",
                "校内外对比数据读取失败",
              ),
          );
        }
      })
      .finally(() => {
        this.setState({ loadingExternalData: false });
      });
  };

  saveRows = (rows, stateKey) => {
    if (stateKey === "scoreRows") {
      return this.saveBenchmarkRows(
        rows,
        undefined,
        undefined,
        SAVE_SCOPE_SCORE,
      );
    }
    return this.saveBenchmarkRows(
      undefined,
      rows,
      undefined,
      SAVE_SCOPE_TARGET_LINE,
    );
  };

  saveBenchmarkRows = (
    scoreRows,
    targetLineRows,
    localRateThresholds,
    saveScope,
  ) => {
    const parameters = this.getBenchmarkRequestParams();
    if (!this.hasBenchmarkRequestParams(parameters)) {
      message.error(
        trans(
          "qualityBenchmark.saveParametersMissing",
          "缺少年级、学期或报告类型，无法保存校内外对比",
        ),
      );
      return Promise.reject(new Error("缺少校内外对比保存参数"));
    }
    this.setState({ savingExternalData: true });
    const requestBody = buildQualityBenchmarkSaveRequest(
      parameters,
      scoreRows,
      targetLineRows,
      localRateThresholds,
      saveScope,
    );
    return saveQualityBenchmark(requestBody)
      .then((res) => {
        if (!res.status) {
          const saveFailedText = trans(
            "qualityBenchmark.saveComparisonFailed",
            "校内外对比保存失败",
          );
          message.error(res.message || saveFailedText);
          throw new Error(res.message || saveFailedText);
        }
        this.applyBenchmarkResponse(res.content || {});
        return res.content || {};
      })
      .finally(() => {
        this.setState({ savingExternalData: false });
      });
  };

  saveLocalRateThresholds = async (thresholds) => {
    const normalizedThresholds = {
      passRate: firstDefined(
        toNumber(thresholds.passRate),
        DEFAULT_RATE_THRESHOLDS.passRate,
      ),
      goodRate: firstDefined(
        toNumber(thresholds.goodRate),
        DEFAULT_RATE_THRESHOLDS.goodRate,
      ),
      excellentRate: firstDefined(
        toNumber(thresholds.excellentRate),
        DEFAULT_RATE_THRESHOLDS.excellentRate,
      ),
    };
    try {
      await this.saveBenchmarkRows(
        undefined,
        undefined,
        normalizedThresholds,
        SAVE_SCOPE_RATE_THRESHOLD,
      );
    } catch {
      return;
    }
    this.setState({
      localRateThresholds: normalizedThresholds,
      localRateThresholdDraft: normalizedThresholds,
      localMetricModalVisible: false,
    });
    message.success(
      trans("qualityBenchmark.rateThresholdSaved", "已保存三率口径"),
    );
  };

  getCurrentExamSubjectNames = () => {
    const {
      reportDetail,
      scoreSummary,
      localSummaryData: localSummaryDataProperty,
      localRateData: localRateDataProperty,
    } = this.props;
    const localSummaryData = Array.isArray(localSummaryDataProperty)
      ? localSummaryDataProperty
      : localSummaryDataProperty?.classSummaryData || [];
    const localRateData = Array.isArray(localRateDataProperty)
      ? localRateDataProperty
      : localRateDataProperty?.classRateData || [];
    const localSchoolName = getLocalSchoolName(reportDetail);
    const subjectList = getSubjectsFromReport(
      reportDetail,
      scoreSummary,
      localSummaryData,
    );
    const subjectNames = subjectList.map((subject) => subject.subjectName);
    const localRows = getEffectiveLocalRows(
      getLocalRows({
        reportDetail,
        scoreSummary,
        classSummaryData: localSummaryData,
        classRateData: localRateData,
        localSchoolName,
        localRateThresholds: this.state.localRateThresholds,
      }),
      localSchoolName,
    );

    if (subjectNames.length === 0) {
      for (const row of localRows) {
        if (row.subjectName && row.subjectName !== TOTAL_SUBJECT_NAME) {
          subjectNames.push(row.subjectName);
        }
      }
    }

    return subjectNames.filter(
      (subjectName, index, array) =>
        subjectName && array.indexOf(subjectName) === index,
    );
  };

  getAllowedScoreSubjectNames = () =>
    [TOTAL_SUBJECT_NAME, ...this.getCurrentExamSubjectNames()].filter(
      (subjectName, index, array) =>
        subjectName && array.indexOf(subjectName) === index,
    );

  filterScoreRowsByAllowedSubjects = (rows = []) => {
    const allowedSubjects = this.getAllowedScoreSubjectNames();
    const invalidSubjectNames = [];
    const validRows = rows.filter((row) => {
      const subjectName = String(row.subjectName || "").trim();
      const isAllowed = !subjectName || allowedSubjects.includes(subjectName);
      if (!isAllowed && !invalidSubjectNames.includes(subjectName)) {
        invalidSubjectNames.push(subjectName);
      }
      return isAllowed;
    });

    return { validRows, invalidSubjectNames };
  };

  openImportModal = (importScope = "score") => {
    const { validRows: scoreRows } = this.filterScoreRowsByAllowedSubjects(
      this.state.scoreRows,
    );
    this.setState({
      importVisible: true,
      importScope,
      importText: "",
      imagePreviewUrl: "",
      imagePreviewUrls: [],
      imageFiles: [],
      recognitionNotice: "",
      draftScoreRows:
        importScope === "score"
          ? scoreRows.map((row) =>
              normalizeScoreRow({ ...row, confirmed: false }, row.source),
            )
          : [],
      draftTargetRows:
        importScope === "target"
          ? this.state.targetLineRows.map((row) =>
              normalizeTargetLineRow({ ...row, confirmed: false }, row.source),
            )
          : [],
      draftTargetScoreInput: undefined,
    });
  };

  addDraftRows = (scoreRows = [], targetRows = [], feedbackNotice = "") => {
    const isScoreScope = this.state.importScope === "score";
    const effectiveScoreRows = isScoreScope ? scoreRows : [];
    const effectiveTargetRows = isScoreScope ? [] : targetRows;
    const normalizedScoreRows = scoreRows.map((row) =>
      normalizeScoreRow(row, row.source || "paste"),
    );
    const { validRows, invalidSubjectNames } =
      this.filterScoreRowsByAllowedSubjects(
        isScoreScope ? normalizedScoreRows : [],
      );
    const subjectNotice =
      invalidSubjectNames.length > 0
        ? `已忽略非本场考试学科：${invalidSubjectNames.join("、")}`
        : "";
    if (effectiveScoreRows.length === 0 && effectiveTargetRows.length === 0) {
      const notice = isScoreScope
        ? "当前内容没有识别到可用于多校对比的平均成绩数据。"
        : "当前内容没有识别到可用于总分上线对比的目标线数据。";
      this.setState({ recognitionNotice: notice });
      message.warning(notice);
      return;
    }
    if (isScoreScope && validRows.length === 0) {
      const notice = subjectNotice || "当前内容没有可用于本场考试的学科成绩。";
      this.setState({ recognitionNotice: notice });
      message.warning(notice);
      return;
    }
    this.setState({
      draftScoreRows: isScoreScope
        ? [...this.state.draftScoreRows, ...validRows]
        : this.state.draftScoreRows,
      draftTargetRows: isScoreScope
        ? this.state.draftTargetRows
        : effectiveTargetRows.map((row) =>
            normalizeTargetLineRow(row, row.source || "paste"),
          ),
      importText: "",
      recognitionNotice: [feedbackNotice, subjectNotice]
        .filter(Boolean)
        .join(" "),
    });
    if (subjectNotice) {
      message.warning(subjectNotice);
    }
  };

  parsePasteText = () => {
    const { importText } = this.state;
    this.setState({
      recognizing: true,
      recognitionNotice: "正在解析粘贴内容，并同步到下方表格...",
    });
    const parsedResult = parseQualityBenchmarkImport(
      importText,
      this.state.importScope,
    );
    setTimeout(() => {
      this.setState({ recognizing: false });
      const hasMatchedRows =
        parsedResult.scoreRows.length || parsedResult.targetRows.length;
      if (!hasMatchedRows) {
        this.setState({
          recognitionNotice: parsedResult.notice,
        });
        message.warning(parsedResult.notice);
        return;
      }
      this.addDraftRows(
        parsedResult.scoreRows,
        parsedResult.targetRows,
        parsedResult.notice,
      );
      message.success(parsedResult.notice);
    }, 500);
  };

  parsePasteTextByAi = () => {
    const { importText, importScope } = this.state;
    const { reportDetail } = this.props;
    this.setState({
      recognizing: true,
      recognitionNotice: "AI 正在解析粘贴内容，解析后会同步到下方表格...",
    });
    analyzeQualityBenchmarkText({
      inputText: importText,
      importScope,
      examName: reportDetail?.examName || CURRENT_EXAM_NAME,
      gradeName: reportDetail?.gradeName,
    })
      .then((result) => {
        const scoreRows = importScope === "score" ? result.scoreRows || [] : [];
        const targetRows =
          importScope === "score" ? [] : result.targetLineRows || [];
        const hasMatchedRows = scoreRows.length || targetRows.length;
        if (!hasMatchedRows) {
          const warningText = (result.warnings || []).join("；");
          const notice =
            warningText ||
            (importScope === "score"
              ? "AI 没有识别到可用于多校对比的平均成绩数据。"
              : "AI 没有识别到可用于总分上线对比的目标线数据。");
          this.setState({ recognitionNotice: notice });
          message.warning(notice);
          return;
        }
        const notice =
          importScope === "score"
            ? `AI 已识别 ${scoreRows.length} 条平均成绩数据，请在下方表格核对后保存。`
            : `AI 已识别 ${targetRows.length} 条总分上线数据，请在下方表格核对后保存。`;
        this.addDraftRows(scoreRows, targetRows, notice);
        if ((result.warnings || []).length > 0) {
          message.warning(result.warnings.join("；"));
        }
        message.success(notice);
      })
      .catch((error) => {
        const notice = error?.message || "AI 解析失败，请稍后重试";
        this.setState({ recognitionNotice: notice });
        message.error(notice);
      })
      .finally(() => {
        this.setState({ recognizing: false });
      });
  };

  processImageFiles = (files = []) => {
    const imageFiles = files.filter((file) =>
      String(file.type || "").startsWith("image/"),
    );
    if (imageFiles.length === 0) {
      message.warning(
        trans("qualityBenchmark.imageTypeHint", "请粘贴或拖入 PNG/JPG 图片"),
      );
      return;
    }
    const remainingCount = Math.max(0, 5 - this.state.imageFiles.length);
    const acceptedFiles = imageFiles.slice(0, remainingCount);
    if (acceptedFiles.length === 0) {
      message.warning(
        trans("qualityBenchmark.imageLimit", "最多支持 5 张图片"),
      );
      return;
    }
    if (imageFiles.length > remainingCount) {
      message.warning(
        trans(
          "qualityBenchmark.imageLimitTrimmed",
          "最多支持 5 张图片，已自动保留前 5 张",
        ),
      );
    }
    for (const file of acceptedFiles) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        this.setState((previousState) => ({
          imagePreviewUrl: reader.result,
          imagePreviewUrls: [...previousState.imagePreviewUrls, reader.result],
        }));
      });
      reader.readAsDataURL(file);
    }
    this.setState({
      imageFiles: [...this.state.imageFiles, ...acceptedFiles],
      recognitionNotice: `已添加 ${this.state.imageFiles.length + acceptedFiles.length} 张图片，点击识别后进入编辑确认。`,
    });
  };

  handleImagePaste = (event) => {
    const items = [...(event.clipboardData?.items || [])];
    const files = items
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (files.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      this.processImageFiles(files);
    }
  };

  handleImageUpload = (file) => {
    this.processImageFiles([...(file?.target?.files || [])]);
    if (file?.target) {
      file.target.value = "";
    }
  };

  handleImageDrop = (event) => {
    const files = [...(event.dataTransfer?.files || [])];
    if (files.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      this.processImageFiles(files);
    }
  };

  startRecognizeImages = () => {
    const { imageFiles } = this.state;
    if (imageFiles.length === 0) {
      message.warning(
        trans("qualityBenchmark.selectImageFirst", "请先粘贴、拖入或选择图片"),
      );
      return;
    }
    this.setState({
      recognizing: true,
      recognizingCount: imageFiles.length,
      recognitionNotice: `AI 正在识别 ${imageFiles.length} 张图片，识别后会追加到当前编辑表格。`,
    });
    for (const file of imageFiles) this.recognizeImageFile(file);
  };

  getFallbackImageDraftRows = () => {
    const scoreRows = [
      normalizeScoreRow({
        schoolName: "实验中学",
        subjectName: "语文",
        studentCount: 423,
        avgScore: 93.12,
        passRate: 96.21,
        excellentRate: 21.8,
        source: "ai_image",
        confirmed: false,
      }),
      normalizeScoreRow({
        schoolName: "华辰学校",
        subjectName: "数学",
        studentCount: 456,
        avgScore: 88.65,
        passRate: 81.98,
        excellentRate: 33.85,
        source: "ai_image",
        confirmed: false,
      }),
    ];
    const targetRows = [];
    return { scoreRows, targetRows };
  };

  recognizeImageFile = (file) => {
    const { reportDetail } = this.props;
    const isScoreScope = this.state.importScope === "score";
    recognizeQualityBenchmarkImage({
      file,
      examName: reportDetail?.examName || CURRENT_EXAM_NAME,
      gradeName: reportDetail?.gradeName,
      expectedTypes: isScoreScope ? ["score"] : ["targetLine"],
    })
      .then((result) => {
        const hasAiRows =
          result &&
          !result.err &&
          (isScoreScope
            ? (result.scoreRows || []).length
            : (result.targetLineRows || []).length);
        const rawRows = hasAiRows
          ? {
              scoreRows: isScoreScope ? result.scoreRows || [] : [],
              targetRows: isScoreScope ? [] : result.targetLineRows || [],
            }
          : this.getFallbackImageDraftRows();
        const fallbackRows = {
          scoreRows: isScoreScope ? rawRows.scoreRows : [],
          targetRows: isScoreScope ? [] : rawRows.targetRows,
        };
        const normalizedScoreRows = fallbackRows.scoreRows.map((row) =>
          normalizeScoreRow({ ...row, confirmed: false }, "ai_image"),
        );
        const { validRows, invalidSubjectNames } =
          this.filterScoreRowsByAllowedSubjects(normalizedScoreRows);
        const subjectNotice =
          invalidSubjectNames.length > 0
            ? `已忽略非本场考试学科：${invalidSubjectNames.join("、")}`
            : "";
        if (validRows.length === 0 && fallbackRows.targetRows.length === 0) {
          this.setState({
            recognizingCount: Math.max(0, this.state.recognizingCount - 1),
            recognizing: this.state.recognizingCount > 1,
            recognitionNotice:
              subjectNotice || "当前图片没有识别到可用于本场考试的学科成绩。",
          });
          message.warning(
            subjectNotice || "当前图片没有识别到可用于本场考试的学科成绩",
          );
          return;
        }
        this.setState({
          recognizingCount: Math.max(0, this.state.recognizingCount - 1),
          recognizing: this.state.recognizingCount > 1,
          recognitionNotice:
            subjectNotice ||
            (hasAiRows
              ? ""
              : "AI 未识别到稳定结构，已生成示例草稿；请在下方编辑确认。"),
          draftScoreRows: [...this.state.draftScoreRows, ...validRows],
          draftTargetRows: [
            ...this.state.draftTargetRows,
            ...fallbackRows.targetRows.map((row) =>
              normalizeTargetLineRow({ ...row, confirmed: false }, "ai_image"),
            ),
          ],
        });
        if (hasAiRows) {
          message.success(
            trans(
              "qualityBenchmark.editableDraftReady",
              "已识别为可编辑草稿，请确认后使用",
            ),
          );
        } else {
          message.warning(
            trans(
              "qualityBenchmark.aiFallbackDraft",
              "AI 识别暂不可用，已生成示例草稿用于确认流程",
            ),
          );
        }
        if (subjectNotice) {
          message.warning(subjectNotice);
        }
      })
      .catch(() => {
        const isScoreScope = this.state.importScope === "score";
        const rawFallbackRows = this.getFallbackImageDraftRows();
        const fallbackRows = {
          scoreRows: isScoreScope ? rawFallbackRows.scoreRows : [],
          targetRows: isScoreScope ? [] : rawFallbackRows.targetRows,
        };
        const { validRows, invalidSubjectNames } =
          this.filterScoreRowsByAllowedSubjects(fallbackRows.scoreRows);
        const subjectNotice =
          invalidSubjectNames.length > 0
            ? `已忽略非本场考试学科：${invalidSubjectNames.join("、")}`
            : "";
        this.setState({
          recognizingCount: Math.max(0, this.state.recognizingCount - 1),
          recognizing: this.state.recognizingCount > 1,
          recognitionNotice:
            subjectNotice ||
            "AI 识别暂不可用，已生成示例草稿；请在下方编辑确认。",
          draftScoreRows: [...this.state.draftScoreRows, ...validRows],
          draftTargetRows: [
            ...this.state.draftTargetRows,
            ...fallbackRows.targetRows,
          ],
        });
        message.warning(
          trans(
            "qualityBenchmark.aiFallbackDraft",
            "AI 识别暂不可用，已生成示例草稿用于确认流程",
          ),
        );
        if (subjectNotice) {
          message.warning(subjectNotice);
        }
      });
  };

  updateDraftRow = (type, id, key, value) => {
    const stateKey = type === "score" ? "draftScoreRows" : "draftTargetRows";
    const normalizer =
      type === "score" ? normalizeScoreRow : normalizeTargetLineRow;
    this.setState({
      [stateKey]: this.state[stateKey].map((row) =>
        row.id === id
          ? normalizer({ ...row, [key]: value, confirmed: false }, row.source)
          : row,
      ),
    });
  };

  removeDraftRow = (type, id) => {
    const stateKey = type === "score" ? "draftScoreRows" : "draftTargetRows";
    this.setState({
      [stateKey]: this.state[stateKey].filter((row) => row.id !== id),
    });
  };

  confirmDraftRows = async () => {
    const isScoreScope = this.state.importScope === "score";
    const normalizedScoreRows = this.state.draftScoreRows
      .map((row) => normalizeScoreRow({ ...row, confirmed: true }, row.source))
      .filter(
        (row) =>
          row.schoolName &&
          row.subjectName &&
          (row.avgScore !== undefined ||
            row.passRate !== undefined ||
            row.excellentRate !== undefined),
      );
    const { validRows: scoreRows, invalidSubjectNames } =
      this.filterScoreRowsByAllowedSubjects(normalizedScoreRows);
    const targetLineRows = this.state.draftTargetRows
      .map((row) =>
        normalizeTargetLineRow({ ...row, confirmed: true }, row.source),
      )
      .filter(
        (row) =>
          row.schoolName &&
          row.targetScore !== undefined &&
          (row.onlineCount !== undefined || row.onlineRate !== undefined),
      );

    if (isScoreScope && scoreRows.length === 0) {
      message.warning(
        invalidSubjectNames.length > 0
          ? `非本场考试学科不可上传：${invalidSubjectNames.join("、")}`
          : "请至少确认一条平均成绩数据",
      );
      return;
    }
    if (!isScoreScope && targetLineRows.length === 0) {
      message.warning(
        trans(
          "qualityBenchmark.targetRowRequired",
          "请至少确认一条总分上线数据",
        ),
      );
      return;
    }
    if (invalidSubjectNames.length > 0) {
      message.warning(
        `已忽略非本场考试学科：${invalidSubjectNames.join("、")}`,
      );
    }
    try {
      await (isScoreScope
        ? this.saveRows(scoreRows, "scoreRows")
        : this.saveRows(targetLineRows, "targetLineRows"));
    } catch {
      return;
    }
    this.setState({
      importVisible: false,
      draftScoreRows: [],
      draftTargetRows: [],
      draftTargetScoreInput: undefined,
      imagePreviewUrl: "",
      imagePreviewUrls: [],
      imageFiles: [],
      recognitionNotice: "",
    });
    message.success(
      trans("qualityBenchmark.comparisonUpdated", "已确认并更新校内外对比"),
    );
  };

  clearExternalRows = async () => {
    try {
      await (this.state.importScope === "score"
        ? this.saveRows([], "scoreRows")
        : this.saveRows([], "targetLineRows"));
    } catch {
      return;
    }
    this.setState({
      draftScoreRows: [],
      draftTargetRows: [],
      recognitionNotice: "",
    });
  };

  renderMatrixMetricCell = (record, subjectName, metricKey) => {
    const value = record.metricMap?.[subjectName]?.[metricKey];
    if (value === undefined) {
      return "--";
    }
    if (record.rowType === "summary") {
      const isGapRow = record.id === "matrix_gap";
      const isFirstRank = record.id === "matrix_rank" && value === 1;
      const gapValue =
        isGapRow && typeof value === "object" ? value.diff : value;
      const className = isGapRow
        ? getGapTone(gapValue)
        : `${styles.metricValue} ${isFirstRank ? styles.firstPlaceValue : ""}`;
      return (
        <span className={className}>
          {isGapRow ? getSignedMetricText(gapValue, metricKey) : value}
        </span>
      );
    }
    const isLocalFirst =
      record.rowType === "local" &&
      record.rankMap?.[subjectName]?.[metricKey] === 1;
    return (
      <span
        className={`${styles.metricValue} ${
          isLocalFirst ? styles.firstPlaceValue : ""
        }`}
      >
        {formatMetricValue(value, metricKey)}
      </span>
    );
  };

  renderSchoolName = (record) => (
    <span className={styles.schoolNameCell}>
      <span>{record.schoolName}</span>
    </span>
  );

  getMatrixCompareOptions = (matrixRows) =>
    matrixRows
      .filter((row) => row.rowType !== "local" && row.rowType !== "summary")
      .map((row) => row.schoolName)
      .filter(
        (schoolName, index, array) =>
          schoolName && array.indexOf(schoolName) === index,
      );

  getSelectedMatrixCompareName = (matrixRows) => {
    const options = this.getMatrixCompareOptions(matrixRows);
    const selected = this.state.matrixCompareName;
    if (selected && options.includes(selected)) {
      return selected;
    }
    if (options.includes(OUTSIDE_AVERAGE_NAME)) {
      return OUTSIDE_AVERAGE_NAME;
    }
    if (options.includes(DISTRICT_REFERENCE_NAME)) {
      return DISTRICT_REFERENCE_NAME;
    }
    return options[0];
  };

  getMatrixCompareRow = (matrixRows, compareName) =>
    matrixRows.find((row) => row.schoolName === compareName);

  getMatrixGapCompareRow = (matrixRows) => {
    const selectedName = this.state.matrixCompareName;
    if (selectedName) {
      return this.getMatrixCompareRow(matrixRows, selectedName);
    }
    return null;
  };

  getSelectedMatrixCompareMetric = () => {
    const selectedMetric = this.state.matrixCompareMetric;
    return METRIC_OPTIONS.find((metric) => metric.key === selectedMetric)
      ? selectedMetric
      : "avgScore";
  };

  getMatrixTopGapRows = (matrixRows, matrixSubjects) => {
    const localRow = matrixRows.find((row) => row.rowType === "local");
    const rankRow = matrixRows.find((row) => row.id === "matrix_rank");
    const gapRow = matrixRows.find((row) => row.id === "matrix_gap");
    if (!localRow || !gapRow) {
      return [];
    }
    return matrixSubjects
      .map((subjectName) => {
        const firstMetric = METRIC_OPTIONS.map((metric) => {
          const value = gapRow.metricMap?.[subjectName]?.[metric.key];
          const diff = typeof value === "object" ? value.diff : value;
          return {
            metric,
            diff,
            rank: rankRow?.metricMap?.[subjectName]?.[metric.key],
            targetName:
              typeof value === "object" ? value.targetName : undefined,
            mode: typeof value === "object" ? value.mode : undefined,
          };
        }).find((item) => item.diff !== undefined);
        return {
          subjectName,
          ...firstMetric,
        };
      })
      .filter((row) => row.diff !== undefined);
  };

  renderMatrixBenchmarkNote(matrixRows, matrixSubjects) {
    const selectedName = this.state.matrixCompareName
      ? this.getSelectedMatrixCompareName(matrixRows)
      : undefined;
    const selectedMetricKey = this.getSelectedMatrixCompareMetric();
    const selectedMetric = METRIC_OPTIONS.find(
      (metric) => metric.key === selectedMetricKey,
    );
    const compareRow = selectedName
      ? this.getMatrixCompareRow(matrixRows, selectedName)
      : null;
    const localRow = matrixRows.find((row) => row.rowType === "local");
    const topGapRows = this.getMatrixTopGapRows(matrixRows, matrixSubjects);
    const compareItems =
      compareRow && localRow
        ? matrixSubjects
            .map((subjectName) => {
              const localValue =
                localRow.metricMap?.[subjectName]?.[selectedMetricKey];
              const compareValue =
                compareRow.metricMap?.[subjectName]?.[selectedMetricKey];
              if (localValue === undefined || compareValue === undefined) {
                return;
              }
              return {
                subjectName,
                diff: localValue - compareValue,
              };
            })
            .filter(Boolean)
        : [];
    return (
      <div className={styles.benchmarkNotePanel}>
        <div className={styles.benchmarkNoteHead}>
          <div>
            <strong>
              {trans("qualityBenchmark.localPositionHint", "本校位置提示")}
            </strong>
            <span>
              {trans(
                "qualityBenchmark.localPositionDescription",
                "第一名展示领先第二名；非第一名展示距离第一名，默认按本校名次计算。",
              )}
            </span>
          </div>
          <Select
            size="small"
            value={selectedName || AUTO_COMPARE_KEY}
            style={{ width: 160 }}
            placeholder={trans(
              "qualityBenchmark.customComparePlaceholder",
              "自定义对比对象",
            )}
            onChange={(matrixCompareName) =>
              this.setState({
                matrixCompareName:
                  matrixCompareName === AUTO_COMPARE_KEY
                    ? undefined
                    : matrixCompareName,
              })
            }
          >
            <Option value={AUTO_COMPARE_KEY}>
              {trans("qualityBenchmark.defaultOption", "默认")}
            </Option>
            {this.getMatrixCompareOptions(matrixRows).map((schoolName) => (
              <Option key={schoolName} value={schoolName}>
                {schoolName}
              </Option>
            ))}
          </Select>
          <Select
            size="small"
            value={selectedMetricKey}
            style={{ width: 112 }}
            onChange={(matrixCompareMetric) =>
              this.setState({ matrixCompareMetric })
            }
          >
            {METRIC_OPTIONS.map((metric) => (
              <Option key={metric.key} value={metric.key}>
                {getMetricLabel(metric)}
              </Option>
            ))}
          </Select>
        </div>
        <div className={styles.benchmarkNoteGrid}>
          {topGapRows.slice(0, 6).map((item) => (
            <div
              key={`${item.subjectName}_${item.metric.key}`}
              className={styles.benchmarkNoteCard}
            >
              <span>
                {item.subjectName} · {getMetricLabel(item.metric)}
              </span>
              <strong className={getGapTone(item.diff)}>
                {item.rank === 1
                  ? trans("qualityBenchmark.leadsSecond", "领先第二名")
                  : trans("qualityBenchmark.gapFirst", "距第一名")}{" "}
                {getSignedMetricText(
                  Math.abs(item.diff),
                  item.metric.key,
                ).replace("+", "")}
              </strong>
              <em>{item.targetName || "--"}</em>
            </div>
          ))}
        </div>
        {compareItems.length > 0 ? (
          <div className={styles.customCompareStrip}>
            <span>
              {trans(
                "qualityBenchmark.customCompareStrip",
                "自定义对比：本校 vs {$name}（{$metric}）",
                {
                  name: selectedName,
                  metric:
                    selectedMetric?.label ||
                    trans("global.averageScore", "平均分"),
                },
              )}
            </span>
            {compareItems.slice(0, 5).map((item) => (
              <em key={item.subjectName} className={getGapTone(item.diff)}>
                {item.subjectName}{" "}
                {getSignedMetricText(item.diff, selectedMetricKey)}
              </em>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  getExportSchoolName = (record) => {
    if (record.id === "matrix_gap" || record.id === "target_gap") {
      return "对比差值";
    }
    return record.schoolName || "";
  };

  getMatrixGapValue = (record, subjectName, metricKey, matrixRows) => {
    const selectedCompareRow = this.getMatrixGapCompareRow(matrixRows);
    if (selectedCompareRow) {
      const localRow = matrixRows.find((row) => row.rowType === "local");
      const localValue = localRow?.metricMap?.[subjectName]?.[metricKey];
      const compareValue =
        selectedCompareRow.metricMap?.[subjectName]?.[metricKey];
      if (localValue === undefined || compareValue === undefined) {
        return;
      }
      return localValue - compareValue;
    }
    const value = record.metricMap?.[subjectName]?.[metricKey];
    return typeof value === "object" ? value.diff : value;
  };

  getMatrixExportCell = (record, subjectName, metricKey, matrixRows) => {
    if (record.id === "matrix_gap") {
      const gapValue = this.getMatrixGapValue(
        record,
        subjectName,
        metricKey,
        matrixRows,
      );
      return gapValue === undefined
        ? "--"
        : getSignedMetricText(gapValue, metricKey);
    }
    const value = record.metricMap?.[subjectName]?.[metricKey];
    if (value === undefined) {
      return "--";
    }
    if (record.rowType === "summary") {
      return value;
    }
    return formatMetricValue(value, metricKey);
  };

  exportMatrixTable = (matrixRows, matrixSubjects) => {
    const header = [
      "学校",
      "考试人数",
      ...matrixSubjects.flatMap((subjectName) =>
        METRIC_OPTIONS.map(
          (metric) => `${subjectName}-${getMetricLabel(metric)}`,
        ),
      ),
    ];
    const rows = matrixRows.map((record) => [
      this.getExportSchoolName(record),
      formatNumber(record.studentCount),
      ...matrixSubjects.flatMap((subjectName) =>
        METRIC_OPTIONS.map((metric) =>
          this.getMatrixExportCell(record, subjectName, metric.key, matrixRows),
        ),
      ),
    ]);
    exportRowsToXlsx("校内外对比-多校对比", "多校对比", [header, ...rows]);
  };

  openLocalMetricModal = () => {
    this.setState({
      localMetricModalVisible: true,
      localRateThresholdDraft: { ...this.state.localRateThresholds },
    });
  };

  updateLocalRateThresholdDraft = (key, value) => {
    this.setState({
      localRateThresholdDraft: {
        ...this.state.localRateThresholdDraft,
        [key]: value,
      },
    });
  };

  confirmLocalRateThresholds = () => {
    const passRate = toNumber(this.state.localRateThresholdDraft.passRate);
    const goodRate = toNumber(this.state.localRateThresholdDraft.goodRate);
    const excellentRate = toNumber(
      this.state.localRateThresholdDraft.excellentRate,
    );
    if (passRate > goodRate || goodRate > excellentRate) {
      message.warning(
        trans(
          "qualityBenchmark.rateThresholdOrder",
          "三率线需满足：及格率线 ≤ 良好率线 ≤ 优秀率线",
        ),
      );
      return;
    }
    this.saveLocalRateThresholds(this.state.localRateThresholdDraft);
  };

  resetLocalRateThresholds = () => {
    this.saveLocalRateThresholds(DEFAULT_RATE_THRESHOLDS);
  };

  renderOverview(matrixRows, matrixSubjects) {
    const matrixCompareName = this.state.matrixCompareName
      ? this.getSelectedMatrixCompareName(matrixRows)
      : undefined;
    const subjectColumns = matrixSubjects.map((subjectName) => ({
      title: subjectName,
      children: METRIC_OPTIONS.map((metric) => ({
        title: getMetricLabel(metric),
        width: metric.key === "avgScore" ? 78 : 82,
        align: "center",
        render: (_, record) =>
          record.id === "matrix_gap"
            ? this.renderMatrixGapCell(
                record,
                subjectName,
                metric.key,
                matrixRows,
              )
            : this.renderMatrixMetricCell(record, subjectName, metric.key),
      })),
    }));
    const columns = [
      {
        title: trans("qualityBenchmark.school", "学校"),
        dataIndex: "schoolName",
        width: 150,
        fixed: "left",
        render: (_, record) => this.renderSchoolName(record),
      },
      {
        title: trans("qualityBenchmark.examCount", "考试人数"),
        dataIndex: "studentCount",
        width: 82,
        align: "center",
        fixed: "left",
        render: (text) => formatNumber(text),
      },
      ...subjectColumns,
    ];
    return (
      <div className={styles.reportSection}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionTitle}>
              {trans("qualityBenchmark.multischoolComparison", "多校对比")}
            </div>
          </div>
          <div className={styles.sectionActions}>
            <Select
              size="small"
              value={matrixCompareName || AUTO_COMPARE_KEY}
              style={{ width: 160 }}
              onChange={(matrixCompareNameValue) =>
                this.setState({
                  matrixCompareName:
                    matrixCompareNameValue === AUTO_COMPARE_KEY
                      ? undefined
                      : matrixCompareNameValue,
                })
              }
            >
              <Option value={AUTO_COMPARE_KEY}>
                {trans("qualityBenchmark.defaultOption", "默认")}
              </Option>
              {this.getMatrixCompareOptions(matrixRows).map((schoolName) => (
                <Option key={schoolName} value={schoolName}>
                  {schoolName}
                </Option>
              ))}
            </Select>
            <Button
              size="small"
              icon="setting"
              onClick={this.openLocalMetricModal}
            >
              {trans("qualityBenchmark.rateThresholdTitle", "三率口径")}
            </Button>
            <Button
              size="small"
              icon="edit"
              onClick={() => this.openImportModal("score")}
            >
              {trans("qualityBenchmark.editData", "编辑数据")}
            </Button>
            <Button
              size="small"
              icon="download"
              onClick={() => this.exportMatrixTable(matrixRows, matrixSubjects)}
            >
              {trans("global.export", "导出")}
            </Button>
          </div>
        </div>
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={matrixRows}
          pagination={false}
          scroll={{ x: 232 + matrixSubjects.length * 324, y: 390 }}
          className={`${styles.comparisonTable} ${styles.matrixTable}`}
          rowClassName={(record) => {
            if (record.rowType === "local") {
              return styles.localBenchmarkRow;
            }
            if (record.rowType === "average") {
              return styles.averageBenchmarkRow;
            }
            if (record.rowType === "summary") {
              return styles.summaryBenchmarkRow;
            }
            return "";
          }}
        />
      </div>
    );
  }

  renderMatrixGapCell = (record, subjectName, metricKey, matrixRows) => {
    const gapValue = this.getMatrixGapValue(
      record,
      subjectName,
      metricKey,
      matrixRows,
    );
    if (gapValue === undefined) {
      return "--";
    }
    return (
      <span className={getGapTone(gapValue)}>
        {getSignedMetricText(gapValue, metricKey)}
      </span>
    );
  };

  renderTargetValueCell = (record, targetScore, valueKey) => {
    const row = record.targetMap?.[targetScore];
    if (!row || row[valueKey] === undefined) {
      return "--";
    }
    const isLocal = record.rowType === "local";
    const text =
      valueKey === "onlineRate"
        ? formatNumber(row[valueKey], "%")
        : formatNumber(row[valueKey]);
    return (
      <span className={isLocal ? styles.metricValue : ""}>
        {text}
        {row.isEstimated && valueKey === "onlineCount" ? (
          <em className={styles.estimateTag}>
            {trans("qualityBenchmark.estimatedTag", "估")}
          </em>
        ) : null}
      </span>
    );
  };

  getTargetCompareOptions = (targetRows) =>
    targetRows
      .filter((row) => row.rowType !== "local")
      .map((row) => row.schoolName)
      .filter(
        (schoolName, index, array) =>
          schoolName && array.indexOf(schoolName) === index,
      );

  getSelectedTargetCompareName = (targetRows) => {
    const options = this.getTargetCompareOptions(targetRows);
    const selected = this.state.targetCompareName;
    if (selected && options.includes(selected)) {
      return selected;
    }
    return;
  };

  getTargetComparisonRows = (targetRows, targetScores) => {
    const localRow = targetRows.find((row) => row.rowType === "local");
    const compareName = this.getSelectedTargetCompareName(targetRows);
    const compareRow = targetRows.find((row) => row.schoolName === compareName);
    if (!localRow) {
      return [];
    }
    return targetScores.map((targetScore) => {
      const rankInfo = this.getTargetRankInfo(targetRows, targetScore);
      const local = localRow.targetMap?.[targetScore];
      const compare = compareRow?.targetMap?.[targetScore];
      const localCount = local?.onlineCount || 0;
      const localRate = local?.onlineRate || 0;
      const compareCount = compare?.onlineCount || 0;
      const compareRate = compare?.onlineRate || 0;
      const countDiff = localCount - compareCount;
      const rateDiff = localRate - compareRate;
      const needCount =
        countDiff < 0
          ? Math.ceil((Math.abs(rateDiff) * (localRow.studentCount || 0)) / 100)
          : 0;
      return {
        id: `target_compare_${targetScore}`,
        targetScore,
        local,
        compare,
        compareName,
        countDiff,
        rateDiff,
        ...rankInfo,
        needCount,
      };
    });
  };

  getTargetRankInfo = (targetRows, targetScore) => {
    const rankingRows = targetRows
      .filter((row) => row.rowType !== "average")
      .map((row) => {
        const target = row.targetMap?.[targetScore];
        return {
          schoolName: row.schoolName,
          rowType: row.rowType,
          target,
          onlineCount: target?.onlineCount,
          onlineRate: target?.onlineRate,
        };
      })
      .filter((row) => row.onlineRate !== undefined)
      .sort((a, b) => {
        const rateDiffValue = (b.onlineRate || 0) - (a.onlineRate || 0);
        if (rateDiffValue !== 0) {
          return rateDiffValue;
        }
        return (b.onlineCount || 0) - (a.onlineCount || 0);
      });
    const localRankIndex = rankingRows.findIndex(
      (row) => row.rowType === "local",
    );
    const localRow = rankingRows[localRankIndex];
    const rankTarget = localRankIndex === 0 ? rankingRows[1] : rankingRows[0];
    return {
      rank: localRankIndex > -1 ? localRankIndex + 1 : undefined,
      rankTarget,
      rankMode: localRankIndex === 0 ? "leadSecond" : "gapFirst",
      rankCountDiff:
        localRow && rankTarget
          ? (localRow.onlineCount || 0) - (rankTarget.onlineCount || 0)
          : undefined,
      rankRateDiff:
        localRow && rankTarget
          ? (localRow.onlineRate || 0) - (rankTarget.onlineRate || 0)
          : undefined,
    };
  };

  renderTargetCompareStrip(targetRows, targetScores) {
    const compareName = this.getSelectedTargetCompareName(targetRows);
    const rows = this.getTargetComparisonRows(targetRows, targetScores);
    return (
      <div className={styles.targetAnalysisBlock}>
        <div className={styles.subSectionHead}>
          <strong>
            {trans("qualityBenchmark.targetPositionHint", "本校目标线位置提示")}
          </strong>
          <span>
            {trans(
              "qualityBenchmark.targetPositionDescription",
              "按上线率排名；第一名显示领先第二名，非第一名显示距第一名。",
            )}
          </span>
          <Select
            size="small"
            value={compareName}
            style={{ width: 160, marginLeft: "auto" }}
            onChange={(targetCompareName) =>
              this.setState({ targetCompareName })
            }
          >
            {this.getTargetCompareOptions(targetRows).map((schoolName) => (
              <Option key={schoolName} value={schoolName}>
                {schoolName}
              </Option>
            ))}
          </Select>
        </div>
        <div className={styles.targetCompareStrip}>
          {rows.map((row) => (
            <div key={row.id} className={styles.targetCompareCard}>
              <span>{row.targetScore}</span>
              {this.renderTargetRankGapCell(row)}
              <em className={getGapTone(row.rateDiff)}>
                {trans("qualityBenchmark.compareTo", "vs {$name}", {
                  name: compareName,
                })}{" "}
                {trans("qualityBenchmark.countWithPersonUnit", "{$count}人", {
                  count: getSignedMetricText(row.countDiff, "avgScore"),
                })}
                / {getSignedMetricText(row.rateDiff, "passRate")}
              </em>
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderTargetCompareCell = (row) => {
    if (!row) {
      return "--";
    }
    return (
      <div className={styles.targetCompareCell}>
        <strong>
          {trans("qualityBenchmark.countWithPersonUnit", "{$count}人", {
            count: formatNumber(row.onlineCount),
          })}
        </strong>
        <span>{formatNumber(row.onlineRate, "%")}</span>
      </div>
    );
  };

  renderTargetRankGapCell = (record) => {
    if (!record.rankTarget) {
      return "--";
    }
    const tone = getGapTone(record.rankRateDiff);
    return (
      <div className={styles.targetRankCell}>
        <strong className={tone}>
          {record.rankMode === "leadSecond"
            ? trans("qualityBenchmark.leadsSecond", "领先第二名")
            : trans("qualityBenchmark.gapFirst", "距第一名")}
        </strong>
        <span>{record.rankTarget.schoolName}</span>
        <em className={tone}>
          {trans("qualityBenchmark.countWithPersonUnit", "{$count}人", {
            count: getSignedMetricText(
              Math.abs(record.rankCountDiff || 0),
              "avgScore",
            ).replace("+", ""),
          })}
          /{" "}
          {getSignedMetricText(
            Math.abs(record.rankRateDiff || 0),
            "passRate",
          ).replace("+", "")}
        </em>
      </div>
    );
  };

  renderTargetMetricCell = (record, targetScore, valueKey, targetRows = []) => {
    if (record.rowType === "summary") {
      const compareName = this.getSelectedTargetCompareName(targetRows);
      const compareRow = compareName
        ? targetRows.find((row) => row.schoolName === compareName)
        : null;
      const localRow = targetRows.find((row) => row.rowType === "local");
      const localValue = localRow?.targetMap?.[targetScore]?.[valueKey];
      const compareValue = compareRow?.targetMap?.[targetScore]?.[valueKey];
      const rankInfo = this.getTargetRankInfo(targetRows, targetScore);
      const diff =
        compareRow && localValue !== undefined && compareValue !== undefined
          ? localValue - compareValue
          : valueKey === "onlineCount"
            ? rankInfo.rankCountDiff
            : rankInfo.rankRateDiff;
      if (diff === undefined) {
        return "--";
      }
      return (
        <div className={styles.targetGapCell}>
          <strong className={getGapTone(diff)}>
            {getSignedMetricText(
              diff,
              valueKey === "onlineCount" ? "avgScore" : "passRate",
            )}
            {valueKey === "onlineCount"
              ? trans("qualityBenchmark.personUnit", "人")
              : ""}
          </strong>
        </div>
      );
    }
    return this.renderTargetValueCell(record, targetScore, valueKey);
  };

  getTargetExportCell = (record, targetScore, valueKey, targetRows) => {
    if (record.rowType === "summary") {
      const compareName = this.getSelectedTargetCompareName(targetRows);
      const compareRow = compareName
        ? targetRows.find((row) => row.schoolName === compareName)
        : null;
      const localRow = targetRows.find((row) => row.rowType === "local");
      const localValue = localRow?.targetMap?.[targetScore]?.[valueKey];
      const compareValue = compareRow?.targetMap?.[targetScore]?.[valueKey];
      const rankInfo = this.getTargetRankInfo(targetRows, targetScore);
      const diff =
        compareRow && localValue !== undefined && compareValue !== undefined
          ? localValue - compareValue
          : valueKey === "onlineCount"
            ? rankInfo.rankCountDiff
            : rankInfo.rankRateDiff;
      if (diff === undefined) {
        return "--";
      }
      const metricKey = valueKey === "onlineCount" ? "avgScore" : "passRate";
      return `${getSignedMetricText(diff, metricKey)}${valueKey === "onlineCount" ? "人" : ""}`;
    }
    const row = record.targetMap?.[targetScore];
    if (!row || row[valueKey] === undefined) {
      return "--";
    }
    return valueKey === "onlineRate"
      ? formatNumber(row[valueKey], "%")
      : formatNumber(row[valueKey]);
  };

  exportTargetTable = (targetRows, targetScores) => {
    const gapRow = {
      id: "target_gap",
      schoolName: "",
      rowType: "summary",
    };
    const tableRows =
      targetRows.length > 0
        ? [targetRows[0], gapRow, ...targetRows.slice(1)]
        : [gapRow];
    const header = [
      trans("qualityBenchmark.school", "学校"),
      trans("qualityBenchmark.examCount", "考试人数"),
      ...targetScores.flatMap((targetScore) => [
        `${targetScore}-${trans("qualityBenchmark.countColumn", "人数")}`,
        `${targetScore}-${trans("qualityBenchmark.rateColumn", "占比")}`,
      ]),
    ];
    const rows = tableRows.map((record) => [
      this.getExportSchoolName(record),
      formatNumber(record.studentCount),
      ...targetScores.flatMap((targetScore) => [
        this.getTargetExportCell(
          record,
          targetScore,
          "onlineCount",
          targetRows,
        ),
        this.getTargetExportCell(record, targetScore, "onlineRate", targetRows),
      ]),
    ]);
    exportRowsToXlsx("校内外对比-总分上线情况对比", "总分上线情况对比", [
      header,
      ...rows,
    ]);
  };

  renderTargetTable(targetRows, targetScores) {
    const gapRow = {
      id: "target_gap",
      schoolName: "",
      rowType: "summary",
    };
    const tableRows =
      targetRows.length > 0
        ? [targetRows[0], gapRow, ...targetRows.slice(1)]
        : [gapRow];
    const columns = [
      {
        title: trans("qualityBenchmark.school", "学校"),
        dataIndex: "schoolName",
        width: 136,
        render: (_, record) => this.renderSchoolName(record),
      },
      {
        title: trans("qualityBenchmark.examCount", "考试人数"),
        dataIndex: "studentCount",
        width: 76,
        align: "center",
        render: (text) => formatNumber(text),
      },
      ...targetScores.map((targetScore) => ({
        title: targetScore,
        children: [
          {
            title: trans("qualityBenchmark.countColumn", "人数"),
            width: 68,
            align: "center",
            render: (_, record) =>
              this.renderTargetMetricCell(
                record,
                targetScore,
                "onlineCount",
                targetRows,
              ),
          },
          {
            title: trans("qualityBenchmark.rateColumn", "占比"),
            width: 68,
            align: "center",
            render: (_, record) =>
              this.renderTargetMetricCell(
                record,
                targetScore,
                "onlineRate",
                targetRows,
              ),
          },
        ],
      })),
    ];
    return (
      <div className={styles.targetTableBlock}>
        <Table
          rowKey={(record) => `target_${record.id}`}
          size="small"
          columns={columns}
          dataSource={tableRows}
          pagination={false}
          scroll={{ x: 212 + targetScores.length * 136 }}
          className={`${styles.comparisonTable} ${styles.targetTable}`}
          rowClassName={(record) => {
            if (record.rowType === "local") {
              return styles.localBenchmarkRow;
            }
            if (record.rowType === "average") {
              return styles.averageBenchmarkRow;
            }
            if (record.rowType === "summary") {
              return styles.summaryBenchmarkRow;
            }
            return "";
          }}
        />
      </div>
    );
  }

  renderTargetLineView(targetRows, targetScores) {
    const targetCompareName = this.getSelectedTargetCompareName(targetRows);
    return (
      <div className={styles.reportSection}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionTitle}>
              {trans(
                "qualityBenchmark.targetLineComparison",
                "校内外总分上线情况对比",
              )}
            </div>
          </div>
          <div className={styles.sectionActions}>
            <Select
              size="small"
              value={targetCompareName || AUTO_COMPARE_KEY}
              style={{ width: 160 }}
              onChange={(targetCompareNameValue) =>
                this.setState({
                  targetCompareName:
                    targetCompareNameValue === AUTO_COMPARE_KEY
                      ? undefined
                      : targetCompareNameValue,
                })
              }
            >
              <Option value={AUTO_COMPARE_KEY}>
                {trans("qualityBenchmark.defaultOption", "默认")}
              </Option>
              {this.getTargetCompareOptions(targetRows).map((schoolName) => (
                <Option key={schoolName} value={schoolName}>
                  {schoolName}
                </Option>
              ))}
            </Select>
            <Button
              size="small"
              icon="edit"
              onClick={() => this.openImportModal("target")}
            >
              {trans("qualityBenchmark.editData", "编辑数据")}
            </Button>
            <Button
              size="small"
              icon="download"
              onClick={() => this.exportTargetTable(targetRows, targetScores)}
            >
              {trans("global.export", "导出")}
            </Button>
          </div>
        </div>
        {this.renderTargetTable(targetRows, targetScores)}
      </div>
    );
  }

  openAskModal = (item) => {
    this.setState({
      askVisible: true,
      askContext: item,
      askQuestion: "",
      askAnswer: "",
    });
  };

  generateAskAnswer = () => {
    const { askContext, askQuestion } = this.state;
    if (!askQuestion.trim()) {
      message.warning(
        trans("qualityBenchmark.askQuestionRequired", "请输入追问内容"),
      );
      return;
    }
    this.setState({
      askAnswer: `围绕“${askContext?.title || "该结论"}”，建议先核对对应表格中的原始数字，再从班级和学生层定位原因。当前结论依据是：${askContext?.content || ""}。`,
    });
  };

  renderAnalysis(items) {
    const markdown = getAnalysisMarkdown(items);
    return (
      <div className={styles.reportSection}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionTitle}>
              {trans("qualityBenchmark.aiInterpretation", "AI解读")}
            </div>
          </div>
        </div>
        <div className={styles.aiReport}>
          <ReactMarkdown source={markdown} />
        </div>
      </div>
    );
  }

  getDraftScoreSubjects = () => {
    const allowedSubjects = this.getAllowedScoreSubjectNames();
    const draftSubjects = this.state.draftScoreRows
      .map((row) => row.subjectName)
      .filter(Boolean)
      .filter(
        (subjectName, index, array) => array.indexOf(subjectName) === index,
      );
    const subjects = [
      ...allowedSubjects,
      ...draftSubjects.filter((subjectName) =>
        allowedSubjects.includes(subjectName),
      ),
    ].filter(
      (subjectName, index, array) =>
        subjectName && array.indexOf(subjectName) === index,
    );
    return subjects.sort((a, b) => {
      if (a === TOTAL_SUBJECT_NAME) return -1;
      if (b === TOTAL_SUBJECT_NAME) return 1;
      return 0;
    });
  };

  getDraftScoreWideRows = () => {
    const schoolMap = {};
    for (const row of this.state.draftScoreRows) {
      const key = row.schoolName || row.id;
      if (!schoolMap[key]) {
        schoolMap[key] = {
          rowKey: key,
          rowIds: [],
          schoolName: row.schoolName,
          studentCount: row.studentCount,
          subjectMap: {},
        };
      }
      schoolMap[key].rowIds.push(row.id);
      if (row.studentCount !== undefined) {
        schoolMap[key].studentCount = row.studentCount;
      }
      schoolMap[key].subjectMap[row.subjectName] = row;
    }
    return Object.keys(schoolMap).map((key) => schoolMap[key]);
  };

  updateDraftScoreSchoolField = (record, key, value) => {
    this.setState({
      draftScoreRows: this.state.draftScoreRows.map((row) =>
        record.rowIds.includes(row.id)
          ? normalizeScoreRow(
              { ...row, [key]: value, confirmed: false },
              row.source,
            )
          : row,
      ),
    });
  };

  updateDraftScoreWideCell = (record, subjectName, key, value) => {
    const targetRow = record.subjectMap[subjectName];
    if (targetRow) {
      this.updateDraftRow("score", targetRow.id, key, value);
      return;
    }
    this.setState({
      draftScoreRows: [
        ...this.state.draftScoreRows,
        normalizeScoreRow(
          {
            schoolName: record.schoolName,
            subjectName,
            studentCount: record.studentCount,
            [key]: value,
            source: "manual",
            confirmed: false,
          },
          "manual",
        ),
      ],
    });
  };

  removeDraftScoreSchool = (record) => {
    this.setState({
      draftScoreRows: this.state.draftScoreRows.filter(
        (row) => !record.rowIds.includes(row.id),
      ),
    });
  };

  renderEditableScoreTable() {
    const subjects = this.getDraftScoreSubjects();
    const metricColumns = subjects.map((subjectName) => ({
      title: subjectName,
      children: [
        {
          title: trans("qualityBenchmark.averageScore", "平均分"),
          width: 92,
          render: (_, record) => (
            <InputNumber
              value={record.subjectMap[subjectName]?.avgScore}
              min={0}
              style={{ width: "100%" }}
              onChange={(value) =>
                this.updateDraftScoreWideCell(
                  record,
                  subjectName,
                  "avgScore",
                  value,
                )
              }
            />
          ),
        },
        {
          title: trans("global.passRating", "及格率"),
          width: 92,
          render: (_, record) => (
            <InputNumber
              value={record.subjectMap[subjectName]?.passRate}
              min={0}
              max={100}
              style={{ width: "100%" }}
              formatter={(value) => (value ? `${value}%` : "")}
              parser={(value) => value.replace("%", "")}
              onChange={(value) =>
                this.updateDraftScoreWideCell(
                  record,
                  subjectName,
                  "passRate",
                  value,
                )
              }
            />
          ),
        },
        {
          title: trans("global.goodRate", "良好率"),
          width: 92,
          render: (_, record) => (
            <InputNumber
              value={record.subjectMap[subjectName]?.goodRate}
              min={0}
              max={100}
              style={{ width: "100%" }}
              formatter={(value) => (value ? `${value}%` : "")}
              parser={(value) => value.replace("%", "")}
              onChange={(value) =>
                this.updateDraftScoreWideCell(
                  record,
                  subjectName,
                  "goodRate",
                  value,
                )
              }
            />
          ),
        },
        {
          title: trans("global.excellentRate", "优秀率"),
          width: 92,
          render: (_, record) => (
            <InputNumber
              value={record.subjectMap[subjectName]?.excellentRate}
              min={0}
              max={100}
              style={{ width: "100%" }}
              formatter={(value) => (value ? `${value}%` : "")}
              parser={(value) => value.replace("%", "")}
              onChange={(value) =>
                this.updateDraftScoreWideCell(
                  record,
                  subjectName,
                  "excellentRate",
                  value,
                )
              }
            />
          ),
        },
      ],
    }));
    const columns = [
      {
        title: trans("qualityBenchmark.school", "学校"),
        width: 150,
        fixed: "left",
        render: (_, record) => (
          <Input
            value={record.schoolName}
            onChange={(event) =>
              this.updateDraftScoreSchoolField(
                record,
                "schoolName",
                event.target.value,
              )
            }
          />
        ),
      },
      {
        title: trans("qualityBenchmark.examCount", "考试人数"),
        width: 100,
        fixed: "left",
        render: (_, record) => (
          <InputNumber
            value={record.studentCount}
            min={0}
            style={{ width: "100%" }}
            onChange={(value) =>
              this.updateDraftScoreSchoolField(record, "studentCount", value)
            }
          />
        ),
      },
      ...metricColumns,
      {
        title: trans("global.operation", "操作"),
        width: 70,
        render: (_, record) => (
          <Button
            type="link"
            size="small"
            onClick={() => this.removeDraftScoreSchool(record)}
          >
            {trans("global.delete", "删除")}
          </Button>
        ),
      },
    ];
    return (
      <Table
        rowKey="rowKey"
        size="small"
        columns={columns}
        dataSource={this.getDraftScoreWideRows()}
        pagination={false}
        scroll={{ x: 320 + Math.max(1, subjects.length) * 368, y: 300 }}
        className={styles.modalTable}
      />
    );
  }

  getDraftTargetScores = () =>
    this.state.draftTargetRows
      .map((row) => row.targetScore)
      .filter((targetScore) => targetScore !== undefined)
      .filter(
        (targetScore, index, array) => array.indexOf(targetScore) === index,
      )
      .sort((a, b) => b - a);

  getDraftTargetWideRows = () => {
    const schoolMap = {};
    for (const row of this.state.draftTargetRows) {
      const key = row.schoolName || row.targetGroupId || row.id;
      if (!schoolMap[key]) {
        schoolMap[key] = {
          rowKey: key,
          rowIds: [],
          schoolName: row.schoolName,
          studentCount: row.studentCount,
          targetGroupId: row.targetGroupId,
          targetMap: {},
        };
      }
      schoolMap[key].rowIds.push(row.id);
      if (row.studentCount !== undefined) {
        schoolMap[key].studentCount = row.studentCount;
      }
      schoolMap[key].targetMap[row.targetScore] = row;
    }
    return Object.keys(schoolMap).map((key) => schoolMap[key]);
  };

  updateDraftTargetSchoolField = (record, key, value) => {
    this.setState({
      draftTargetRows: this.state.draftTargetRows.map((row) =>
        record.rowIds.includes(row.id)
          ? normalizeTargetLineRow(
              { ...row, [key]: value, confirmed: false },
              row.source,
            )
          : row,
      ),
    });
  };

  updateDraftTargetWideCell = (record, targetScore, key, value) => {
    const targetRow = record.targetMap[targetScore];
    if (targetRow) {
      this.updateDraftRow("targetLine", targetRow.id, key, value);
      return;
    }
    this.setState({
      draftTargetRows: [
        ...this.state.draftTargetRows,
        normalizeTargetLineRow(
          {
            schoolName: record.schoolName,
            studentCount: record.studentCount,
            targetScore,
            targetGroupId: record.targetGroupId,
            [key]: value,
            source: "manual",
            confirmed: false,
          },
          "manual",
        ),
      ],
    });
  };

  addDraftTargetScore = () => {
    const targetScore = toNumber(this.state.draftTargetScoreInput);
    if (targetScore === undefined || targetScore <= 0) {
      message.warning(
        trans("qualityBenchmark.validTargetScoreRequired", "请输入有效分数线"),
      );
      return;
    }
    if (this.getDraftTargetScores().includes(targetScore)) {
      message.warning(
        trans("qualityBenchmark.targetScoreExists", "该分数线已存在"),
      );
      return;
    }
    const draftRows = this.getDraftTargetWideRows();
    const rows =
      draftRows.length > 0
        ? draftRows.map((record) =>
            normalizeTargetLineRow(
              {
                schoolName: record.schoolName,
                studentCount: record.studentCount,
                targetScore,
                targetGroupId: record.targetGroupId,
                source: "manual",
                confirmed: false,
              },
              "manual",
            ),
          )
        : [
            normalizeTargetLineRow(
              {
                schoolName: "",
                targetScore,
                targetGroupId: `target_group_${Date.now()}_${Math.random()}`,
                source: "manual",
                confirmed: false,
              },
              "manual",
            ),
          ];
    this.setState({
      draftTargetRows: [...this.state.draftTargetRows, ...rows],
      draftTargetScoreInput: undefined,
    });
  };

  addDraftTargetSchool = () => {
    const targetScores = this.getDraftTargetScores();
    if (targetScores.length === 0) {
      message.warning(
        trans("qualityBenchmark.addTargetScoreFirst", "请先新增分数线"),
      );
      return;
    }
    const targetGroupId = `target_group_${Date.now()}_${Math.random()}`;
    this.setState({
      draftTargetRows: [
        ...this.state.draftTargetRows,
        ...targetScores.map((targetScore) =>
          normalizeTargetLineRow(
            {
              schoolName: "",
              targetScore,
              targetGroupId,
              source: "manual",
              confirmed: false,
            },
            "manual",
          ),
        ),
      ],
    });
  };

  removeDraftTargetSchool = (record) => {
    this.setState({
      draftTargetRows: this.state.draftTargetRows.filter(
        (row) => !record.rowIds.includes(row.id),
      ),
    });
  };

  renderEditableTargetTable() {
    const targetScores = this.getDraftTargetScores();
    const targetColumns = targetScores.map((targetScore) => ({
      title: targetScore,
      children: [
        {
          title: trans("qualityBenchmark.onlineCount", "上线人数"),
          width: 96,
          render: (_, record) => (
            <InputNumber
              value={record.targetMap[targetScore]?.onlineCount}
              min={0}
              style={{ width: "100%" }}
              onChange={(value) =>
                this.updateDraftTargetWideCell(
                  record,
                  targetScore,
                  "onlineCount",
                  value,
                )
              }
            />
          ),
        },
        {
          title: trans("qualityBenchmark.onlineRate", "上线率"),
          width: 96,
          render: (_, record) => (
            <InputNumber
              value={record.targetMap[targetScore]?.onlineRate}
              min={0}
              max={100}
              style={{ width: "100%" }}
              formatter={(value) => (value ? `${value}%` : "")}
              parser={(value) => value.replace("%", "")}
              onChange={(value) =>
                this.updateDraftTargetWideCell(
                  record,
                  targetScore,
                  "onlineRate",
                  value,
                )
              }
            />
          ),
        },
      ],
    }));
    const columns = [
      {
        title: trans("qualityBenchmark.school", "学校"),
        width: 150,
        fixed: "left",
        render: (_, record) => (
          <Input
            value={record.schoolName}
            onChange={(event) =>
              this.updateDraftTargetSchoolField(
                record,
                "schoolName",
                event.target.value,
              )
            }
          />
        ),
      },
      {
        title: trans("qualityBenchmark.examCount", "考试人数"),
        width: 100,
        fixed: "left",
        render: (_, record) => (
          <InputNumber
            value={record.studentCount}
            min={0}
            style={{ width: "100%" }}
            onChange={(value) =>
              this.updateDraftTargetSchoolField(record, "studentCount", value)
            }
          />
        ),
      },
      ...targetColumns,
      {
        title: trans("global.operation", "操作"),
        width: 70,
        render: (_, record) => (
          <Button
            type="link"
            size="small"
            onClick={() => this.removeDraftTargetSchool(record)}
          >
            {trans("global.delete", "删除")}
          </Button>
        ),
      },
    ];
    return (
      <Table
        rowKey="rowKey"
        size="small"
        columns={columns}
        dataSource={this.getDraftTargetWideRows()}
        pagination={false}
        scroll={{ x: 320 + Math.max(1, targetScores.length) * 192, y: 300 }}
        className={styles.modalTable}
      />
    );
  }

  renderImportPanel() {
    const isScoreScope = this.state.importScope === "score";
    const placeholder = isScoreScope
      ? trans("qualityBenchmark.scoreImportPlaceholder")
      : trans("qualityBenchmark.targetImportPlaceholder");
    return (
      <div className={styles.smartImportArea}>
        <div className={styles.importEntryBlock}>
          <div className={styles.importEntryTitle}>
            {trans("qualityBenchmark.pasteTable", "粘贴表格")}
          </div>
          <TextArea
            rows={5}
            value={this.state.importText}
            onChange={(event) =>
              this.setState({ importText: event.target.value })
            }
            placeholder={placeholder}
          />
          <div className={styles.modalActions}>
            <Button
              type="primary"
              loading={this.state.recognizing}
              disabled={!this.state.importText.trim()}
              onClick={this.parsePasteText}
            >
              {trans("qualityBenchmark.clientParse", "前端解析")}
            </Button>
            <Button
              loading={this.state.recognizing}
              disabled={!this.state.importText.trim()}
              onClick={this.parsePasteTextByAi}
            >
              {trans("qualityBenchmark.aiParse", "AI解析")}
            </Button>
          </div>
        </div>
        {this.state.recognitionNotice ? (
          <div className={styles.recognitionNotice}>
            {this.state.recognitionNotice}
          </div>
        ) : null}
      </div>
    );
  }

  renderImportConfirmPanel() {
    const isScoreScope = this.state.importScope === "score";
    return (
      <div className={styles.confirmArea}>
        {isScoreScope ? (
          <>
            <div className={styles.modalLabel}>
              <span>{trans("qualityBenchmark.averageScores", "平均成绩")}</span>
              <Button
                size="small"
                onClick={() =>
                  this.addDraftRows([
                    {
                      schoolName: "",
                      subjectName: TOTAL_SUBJECT_NAME,
                      source: "manual",
                      confirmed: false,
                    },
                  ])
                }
              >
                {trans("qualityBenchmark.addRow", "新增行")}
              </Button>
            </div>
            {this.renderEditableScoreTable()}
          </>
        ) : (
          <>
            <div className={styles.modalLabel}>
              <span>
                {trans("qualityBenchmark.totalScoreOnline", "总分上线")}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <InputNumber
                  min={1}
                  value={this.state.draftTargetScoreInput}
                  placeholder={trans(
                    "qualityBenchmark.targetScorePlaceholder",
                    "如：650 / e.g. 650",
                  )}
                  style={{ width: 120 }}
                  onChange={(draftTargetScoreInput) =>
                    this.setState({ draftTargetScoreInput })
                  }
                />
                <Button size="small" onClick={this.addDraftTargetScore}>
                  {trans("qualityBenchmark.addTargetScore", "新增分数线")}
                </Button>
                <Button size="small" onClick={this.addDraftTargetSchool}>
                  {trans("qualityBenchmark.addSchool", "新增学校")}
                </Button>
              </div>
            </div>
            {this.renderEditableTargetTable()}
          </>
        )}
      </div>
    );
  }

  renderImportModal() {
    const isScoreScope = this.state.importScope === "score";
    const draftCount = isScoreScope
      ? this.state.draftScoreRows.length
      : this.state.draftTargetRows.length;
    return (
      <Modal
        title={
          isScoreScope
            ? trans(
                "qualityBenchmark.editScoreComparisonData",
                "编辑多校对比数据",
              )
            : trans("qualityBenchmark.editTargetLineData", "编辑总分上线数据")
        }
        visible={this.state.importVisible}
        width="calc(100vw - 96px)"
        className={styles.importModal}
        bodyStyle={{
          maxHeight: "calc(100vh - 170px)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        destroyOnClose={false}
        onCancel={() => this.setState({ importVisible: false })}
        footer={[
          <Popconfirm
            key="clear"
            title={trans(
              "qualityBenchmark.confirmClearConfirmedData",
              "确认清空当前报告下已确认的{$scope}数据吗？",
              {
                scope: isScoreScope
                  ? trans("qualityBenchmark.multischoolComparison", "多校对比")
                  : trans("qualityBenchmark.totalScoreOnline", "总分上线"),
              },
            )}
            okText={trans("qualityBenchmark.clear", "清空")}
            cancelText={trans("global.cancel", "取消")}
            onConfirm={this.clearExternalRows}
          >
            <Button>
              {trans("qualityBenchmark.clearConfirmedData", "清空已确认数据")}
            </Button>
          </Popconfirm>,
          <Button
            key="cancel"
            onClick={() => this.setState({ importVisible: false })}
          >
            {trans("global.cancel", "取消")}
          </Button>,
          <Button
            key="ok"
            type="primary"
            disabled={!draftCount}
            loading={this.state.savingExternalData}
            onClick={this.confirmDraftRows}
          >
            {trans("global.save", "保存")}
          </Button>,
        ]}
      >
        <div className={styles.importFlow}>
          {this.renderImportPanel()}
          {this.renderImportConfirmPanel()}
        </div>
      </Modal>
    );
  }

  renderLocalMetricModal() {
    const draft = this.state.localRateThresholdDraft || DEFAULT_RATE_THRESHOLDS;
    const thresholdItems = [
      { key: "passRate", label: trans("qualityBenchmark.passLine", "及格线") },
      { key: "goodRate", label: trans("qualityBenchmark.goodLine", "良好线") },
      {
        key: "excellentRate",
        label: trans("qualityBenchmark.excellentLine", "优秀线"),
      },
    ];

    return (
      <Modal
        title={trans("qualityBenchmark.localRateThreshold", "本校三率口径")}
        visible={this.state.localMetricModalVisible}
        width={520}
        onCancel={() =>
          this.setState({
            localMetricModalVisible: false,
          })
        }
        footer={[
          <Button
            key="cancel"
            onClick={() =>
              this.setState({
                localMetricModalVisible: false,
              })
            }
          >
            {trans("global.cancel", "取消")}
          </Button>,
          <Button
            key="ok"
            type="primary"
            loading={this.state.savingExternalData}
            onClick={this.confirmLocalRateThresholds}
          >
            {trans("qualityBenchmark.applyThreshold", "应用该口径")}
          </Button>,
        ]}
      >
        <div className={styles.rateOverrideTip}>
          {trans(
            "qualityBenchmark.rateThresholdTip",
            "按学生得分率重算本校及格率、良好率、优秀率，保存后对当前报告生效。",
          )}
        </div>
        <div className={styles.rateThresholdGrid}>
          {thresholdItems.map((item) => (
            <label key={item.key} className={styles.rateThresholdItem}>
              <span>{item.label}</span>
              <InputNumber
                value={draft[item.key]}
                min={0}
                max={100}
                precision={1}
                style={{ width: "100%" }}
                formatter={(value) => (value ? `${value}%` : "")}
                parser={(value) => String(value || "").replace("%", "")}
                onChange={(value) =>
                  this.updateLocalRateThresholdDraft(item.key, value)
                }
              />
            </label>
          ))}
        </div>
      </Modal>
    );
  }

  renderAskModal() {
    return (
      <Modal
        title={trans("qualityBenchmark.askAnalysis", "追问分析")}
        visible={this.state.askVisible}
        width={620}
        onCancel={() => this.setState({ askVisible: false })}
        footer={[
          <Button
            key="cancel"
            onClick={() => this.setState({ askVisible: false })}
          >
            {trans("qualityBenchmark.close", "关闭")}
          </Button>,
          <Button key="ask" type="primary" onClick={this.generateAskAnswer}>
            {trans("qualityBenchmark.generateAnswer", "生成回答")}
          </Button>,
        ]}
      >
        <div className={styles.askContext}>
          <strong>{this.state.askContext?.title}</strong>
          <p>{this.state.askContext?.content}</p>
        </div>
        <TextArea
          rows={3}
          value={this.state.askQuestion}
          onChange={(event) =>
            this.setState({ askQuestion: event.target.value })
          }
          placeholder={trans(
            "qualityBenchmark.askPlaceholder",
            "例如：这个短板应该怎么给备课组解释？",
          )}
        />
        {this.state.askAnswer ? (
          <div className={styles.askAnswer}>{this.state.askAnswer}</div>
        ) : null}
      </Modal>
    );
  }

  render() {
    const {
      reportDetail,
      scoreSummary,
      localSummaryData: localSummaryDataProperty,
      localRateData: localRateDataProperty,
      loadingLocalData,
    } = this.props;
    const localSummaryData = Array.isArray(localSummaryDataProperty)
      ? localSummaryDataProperty
      : localSummaryDataProperty?.classSummaryData || [];
    const localRateData = Array.isArray(localRateDataProperty)
      ? localRateDataProperty
      : localRateDataProperty?.classRateData || [];
    const subjectList = getSubjectsFromReport(
      reportDetail,
      scoreSummary,
      localSummaryData,
    );
    const localSchoolName = getLocalSchoolName(reportDetail);
    const localRows = getEffectiveLocalRows(
      getLocalRows({
        reportDetail,
        scoreSummary,
        classSummaryData: localSummaryData,
        classRateData: localRateData,
        localSchoolName,
        localRateThresholds: this.state.localRateThresholds,
      }),
      localSchoolName,
    );
    const matrixSubjects = getMatrixSubjects(
      subjectList,
      localRows,
      this.filterScoreRowsByAllowedSubjects(this.state.scoreRows).validRows,
    );
    const matrixRows = buildSchoolMetricMatrix(
      localRows,
      this.filterScoreRowsByAllowedSubjects(this.state.scoreRows).validRows,
      matrixSubjects,
    );
    const localTotal = localRows.find(
      (row) => row.subjectName === TOTAL_SUBJECT_NAME,
    );
    const targetScores = getTargetScores(this.state.targetLineRows);
    const localTargetRows = getLocalTargetRows(
      scoreSummary,
      targetScores,
      localTotal?.studentCount,
      localSchoolName,
    );
    const targetMatrix = buildTargetLineMatrix(
      localTargetRows,
      this.state.targetLineRows,
    );
    return (
      <div className={styles.qualityBenchmark}>
        <div className={styles.visualArea}>
          {loadingLocalData || this.state.loadingExternalData ? (
            <div className={styles.loadingText}>
              {trans(
                "qualityBenchmark.loadingCurrentSummary",
                "正在读取当前汇总数据...",
              )}
            </div>
          ) : null}
          {this.renderOverview(matrixRows, matrixSubjects)}
          {this.renderTargetLineView(
            targetMatrix.rows,
            targetMatrix.targetScores,
          )}
        </div>

        {this.renderImportModal()}
        {this.renderLocalMetricModal()}
      </div>
    );
  }
}

export default QualityBenchmark;

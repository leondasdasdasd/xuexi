import JSZip from "jszip";

import { trans } from "../../utils/i18n";

const SUMMARY_SHEET_KEYWORD = "全部考生成绩汇总";
const QUESTION_START_INDEX = 16;
const ABSENT_TEXT_LIST = ["缺考", "缺", "未扫", "不计排名"];

/**
 *
 * @param value
 */
function decodeXmlText(value = "") {
  return String(value)
    .replaceAll(/&#x([\dA-Fa-f]+);/g, (match, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replaceAll(/&#(\d+);/g, (match, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

/**
 *
 * @param cellReference
 */
function getColumnIndex(cellReference = "") {
  const letters = String(cellReference).replaceAll(/\d/g, "");
  let index = 0;
  for (let index_ = 0; index_ < letters.length; index_ += 1) {
    index = index * 26 + letters.charCodeAt(index_) - 64;
  }
  return index - 1;
}

/**
 *
 * @param value
 */
function cleanCellValue(value) {
  const text = String(
    value === undefined || value === null ? "" : value,
  ).trim();
  return text.replace(/\.0$/, "");
}

/**
 *
 * @param value
 */
function normalizeText(value) {
  return cleanCellValue(value).replaceAll(/\s+/g, "");
}

/**
 *
 * @param value
 */
function normalizeExamName(value) {
  return normalizeText(value)
    .replace(/^全部考生成绩汇总--?/, "")
    .replaceAll(/[(),.[\]_、。《》【】（），\-]/g, "");
}

/**
 *
 * @param value
 */
function toScoreNumber(value) {
  const text = cleanCellValue(value);
  if (!text) {
    return null;
  }
  const score = Number(text);
  return Number.isFinite(score) ? score : null;
}

const EMPTY_SCORE = toScoreNumber("");

/**
 *
 * @param value
 */
function isAbsentValue(value) {
  const text = cleanCellValue(value);
  return ABSENT_TEXT_LIST.some((item) => text.includes(item));
}

/**
 *
 * @param value
 */
function getAbsentStatus(value) {
  const text = cleanCellValue(value);
  const hit = ABSENT_TEXT_LIST.find((item) => text.includes(item));
  return hit || "空值";
}

/**
 *
 * @param value
 */
function isLikelyQuestionNo(value) {
  return /^\d+(\(\d+\))?$/.test(cleanCellValue(value));
}

/**
 *
 * @param questionNo
 */
export function getParentQuestionNo(questionNo) {
  const match = cleanCellValue(questionNo).match(/^(.+?)\((.+)\)$/);
  return match ? match[1] : "";
}

/**
 *
 * @param questionNos
 */
export function getLeafQuestionNos(questionNos) {
  const parentSet = new Set(
    (questionNos || []).map(getParentQuestionNo).filter(Boolean),
  );
  return (questionNos || []).filter(
    (questionNo) => !parentSet.has(cleanCellValue(questionNo)),
  );
}

/**
 *
 * @param fileExamName
 * @param currentExamName
 */
function isSameExamName(fileExamName, currentExamName) {
  if (!currentExamName) {
    return true;
  }
  const fileName = normalizeExamName(fileExamName);
  const examName = normalizeExamName(currentExamName);
  return fileName.includes(examName) || examName.includes(fileName);
}

/**
 *
 * @param row
 * @param index
 */
function getCell(row, index) {
  return cleanCellValue((row || [])[index]);
}

/**
 *
 * @param row
 * @param headerName
 */
function getHeaderIndex(row, headerName) {
  const target = normalizeText(headerName);
  return (row || []).findIndex((item) => normalizeText(item) === target);
}

/**
 *
 * @param row
 */
function getStudentKey(row) {
  return [
    row.studentId || "",
    row.studentNo || "",
    row.studentName || "",
    row.className || "",
  ].join("|");
}

/**
 *
 * @param row
 */
function getStudentSubjectKey(row) {
  return [getStudentKey(row), row.subjectName || ""].join("|");
}

/**
 *
 * @param row
 */
function isNoAnswerQuestionRow(row) {
  const rawText = cleanCellValue(row?.rawValue);
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
  const rawText = cleanCellValue(row?.rawValue);
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
    subjectScoreMap.set(getStudentSubjectKey(row), toScoreNumber(row.score));
  }

  const questionGroupMap = new Map();
  for (const row of questionScoreRows) {
    const key = getStudentSubjectKey(row);
    const rows = questionGroupMap.get(key) || [];
    rows.push(row);
    questionGroupMap.set(key, rows);
  }

  for (const [key, rows] of questionGroupMap) {
    const subjectScore = subjectScoreMap.get(key);
    const hasSubjectScore =
      subjectScoreMap.has(key) && subjectScore !== EMPTY_SCORE;
    const hasPositiveSubjectScore = hasSubjectScore && subjectScore > 0;
    const shouldMarkAbsent =
      rows.length > 0 &&
      rows.every((row) => isNoAnswerQuestionRow(row)) &&
      !hasPositiveSubjectScore &&
      (!hasSubjectScore || subjectScore === 0);

    for (const row of rows) {
      if (shouldMarkAbsent && isNoAnswerQuestionRow(row)) {
        row.status = "缺考";
        row.score = EMPTY_SCORE;
        continue;
      }
      if (!shouldMarkAbsent && isBlankOrAbsentQuestionRow(row)) {
        row.status = "空值";
        row.score = EMPTY_SCORE;
      }
    }
  }

  return questionScoreRows;
}

/**
 *
 * @param fileName
 * @param buffer
 */
async function readWorkbook(fileName, buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const sharedStringFile = zip.file("xl/sharedStrings.xml");
  const sharedStrings = [];

  if (sharedStringFile) {
    const sharedStringXml = await sharedStringFile.async("string");
    const siMatches = sharedStringXml.match(/<si[\s\S]*?<\/si>/g) || [];
    for (const siXml of siMatches) {
      const text = [...siXml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((match) => decodeXmlText(match[1]))
        .join("");
      sharedStrings.push(text);
    }
  }

  const workbookXml = await zip.file("xl/workbook.xml").async("string");
  const workbookRelsXml = await zip
    .file("xl/_rels/workbook.xml.rels")
    .async("string");
  const relTargetMap = new Map();
  for (const match of workbookRelsXml.matchAll(
    /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g,
  )) {
    relTargetMap.set(
      match[1],
      `xl/${match[2].replace(/^\//, "").replace(/^xl\//, "")}`,
    );
  }

  const sheets = [];
  const sheetMatches = [
    ...workbookXml.matchAll(
      /<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*>/g,
    ),
  ];

  for (const sheetMatch of sheetMatches) {
    const sheetName = decodeXmlText(sheetMatch[1]);
    const relId = sheetMatch[2];
    const targetPath = relTargetMap.get(relId);
    const sheetFile = targetPath && zip.file(targetPath);
    if (!sheetFile) {
      continue;
    }
    const sheetXml = await sheetFile.async("string");
    const rows = [];
    const rowMatches = [
      ...sheetXml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\S\s]*?)<\/row>/g),
    ];
    for (const rowMatch of rowMatches) {
      const rowIndex = Number(rowMatch[1]) - 1;
      const cells = [];
      for (const cellMatch of rowMatch[2].matchAll(
        /<c([^>]*)>([\s\S]*?)<\/c>/g,
      )) {
        const attributes = cellMatch[1];
        const body = cellMatch[2];
        const referenceMatch = attributes.match(/r="([^"]+)"/);
        const typeMatch = attributes.match(/t="([^"]+)"/);
        const valueMatch = body.match(/<v>([\S\s]*?)<\/v>/);
        const type = typeMatch ? typeMatch[1] : "";
        let value = "";

        if (type === "s" && valueMatch) {
          value = sharedStrings[Number(valueMatch[1])] || "";
        } else if (type === "inlineStr") {
          value = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
            .map((match) => decodeXmlText(match[1]))
            .join("");
        } else if (valueMatch) {
          value = decodeXmlText(valueMatch[1]);
        }

        cells[getColumnIndex(referenceMatch ? referenceMatch[1] : "")] =
          cleanCellValue(value);
      }

      rows[rowIndex] = cells;
    }
    sheets.push({
      fileName,
      sheetName,
      rows,
    });
  }

  return {
    fileName,
    sheets,
  };
}

/**
 *
 * @param fileItems
 */
async function expandUploadFiles(fileItems) {
  const expandedFiles = [];

  for (const [index, item] of fileItems.entries()) {
    const fileName = item.name || `上传文件${index + 1}.xlsx`;
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(item.buffer);
      const entries = Object.keys(zip.files).filter(
        (entryName) =>
          !zip.files[entryName].dir &&
          !entryName.includes("__MACOSX") &&
          !entryName.split("/").pop().startsWith("~$") &&
          entryName.toLowerCase().endsWith(".xlsx"),
      );
      for (const entryName of entries) {
        expandedFiles.push({
          name: entryName.split("/").pop(),
          buffer: await zip.file(entryName).async("arraybuffer"),
        });
      }
    } else {
      expandedFiles.push(item);
    }
  }

  return expandedFiles;
}

/**
 *
 * @param students
 */
function createStudentMatcher(students) {
  const byCustomNo = new Map();
  const byAdmissionNo = new Map();
  const byClassName = new Map();
  const duplicateClassNameSet = new Set();

  for (const student of students) {
    if (student.studentNo) {
      byCustomNo.set(String(student.studentNo), student);
    }
    if (student.admissionNo) {
      byAdmissionNo.set(String(student.admissionNo), student);
    }

    const classNameKey = `${student.className}|${student.studentName}`;
    if (byClassName.has(classNameKey)) {
      duplicateClassNameSet.add(classNameKey);
    } else {
      byClassName.set(classNameKey, student);
    }
  }

  return {
    duplicateClassNameSet,
    match(row) {
      if (row.studentNo && byCustomNo.has(String(row.studentNo))) {
        return byCustomNo.get(String(row.studentNo));
      }
      if (row.admissionNo && byAdmissionNo.has(String(row.admissionNo))) {
        return byAdmissionNo.get(String(row.admissionNo));
      }
      const classNameKey = `${row.className}|${row.studentName}`;
      if (duplicateClassNameSet.has(classNameKey)) {
        return null;
      }
      return byClassName.get(classNameKey) || null;
    },
  };
}

/**
 *
 * @param sheet
 * @param examConfig
 * @param errors
 * @param warnings
 */
function parseSummarySheet(sheet, examConfig, errors, warnings) {
  const rows = sheet.rows || [];
  const headerRowIndex = rows.findIndex(
    (row) =>
      getHeaderIndex(row, "准考证号") > -1 &&
      getHeaderIndex(row, "自定义考号") > -1 &&
      getHeaderIndex(row, "班级") > -1 &&
      getHeaderIndex(row, "姓名") > -1,
  );

  if (headerRowIndex < 0) {
    errors.push({
      position: sheet.fileName,
      message: trans(
        "zhixueScoreImport.parser.summaryHeaderMissing",
        "未识别到智学网学生成绩表头",
      ),
    });
    return null;
  }

  const title = getCell(rows[0], 0);
  if (!isSameExamName(title, examConfig.examName)) {
    errors.push({
      position: `${sheet.fileName} / ${sheet.sheetName}`,
      message: trans(
        "zhixueScoreImport.parser.examNameMismatch",
        "智学网考试名称与当前考试不一致（文件：{$fileExamName}，当前：{$currentExamName}）",
        {
          fileExamName: title || "-",
          currentExamName: examConfig.examName || "-",
        },
      ),
    });
  }

  const headerRow = rows[headerRowIndex] || [];
  const subHeaderRow = rows[headerRowIndex + 1] || [];
  const admissionNoIndex = getHeaderIndex(headerRow, "准考证号");
  const customNoIndex = getHeaderIndex(headerRow, "自定义考号");
  const classNameIndex = getHeaderIndex(headerRow, "班级");
  const nameIndex = getHeaderIndex(headerRow, "姓名");
  const propertyIndex = getHeaderIndex(headerRow, "学生属性");
  const subjectColumns = [];

  for (const [columnIndex, header] of headerRow.entries()) {
    const headerText = cleanCellValue(header);
    const subHeaderText = cleanCellValue(subHeaderRow[columnIndex]);
    if (
      headerText &&
      headerText !== "总分" &&
      headerText !== "校次" &&
      headerText !== "班次" &&
      subHeaderText === "得分"
    ) {
      subjectColumns.push({
        subjectName: headerText,
        columnIndex,
        fullScore: Number(examConfig.fullScore) || 100,
      });
    }
  }

  if (subjectColumns.length === 0) {
    errors.push({
      position: `${sheet.fileName} / ${sheet.sheetName}`,
      message: trans(
        "zhixueScoreImport.parser.subjectScoreColumnMissing",
        "未识别到学科得分列",
      ),
    });
  }

  const studentRows = rows.slice(headerRowIndex + 2).filter((row) => {
    return (
      getCell(row, admissionNoIndex) ||
      getCell(row, customNoIndex) ||
      (getCell(row, classNameIndex) && getCell(row, nameIndex))
    );
  });

  const students = studentRows.map((row, index) => ({
    studentId: `zhixue-${index + 1}`,
    studentNo: getCell(row, customNoIndex),
    admissionNo: getCell(row, admissionNoIndex),
    studentName: getCell(row, nameIndex),
    className: getCell(row, classNameIndex),
    studentProperty: getCell(row, propertyIndex),
    rawRow: row,
  }));

  const matcher = createStudentMatcher(students);
  for (const key of matcher.duplicateClassNameSet) {
    const [className, studentName] = key.split("|");
    const sameNameStudents = students.filter(
      (student) =>
        student.className === className && student.studentName === studentName,
    );
    if (
      sameNameStudents.some(
        (student) => !student.studentNo && !student.admissionNo,
      )
    ) {
      errors.push({
        position: `${className} / ${studentName}`,
        message: trans(
          "zhixueScoreImport.parser.duplicateStudentName",
          "同一班级存在重名学生，请提供自定义考号或准考证号区分",
        ),
      });
    }
  }

  const subjectScoreRows = [];
  for (const student of students) {
    for (const subject of subjectColumns) {
      const rawValue = getCell(student.rawRow, subject.columnIndex);
      const score = toScoreNumber(rawValue);
      const absent = isAbsentValue(rawValue);
      const status = absent ? getAbsentStatus(rawValue) : "可导入";
      if (absent) {
        warnings.push({
          position: `${student.className} / ${student.studentName} / ${subject.subjectName}`,
          message: trans(
            "zhixueScoreImport.parser.absentScoreSkipped",
            "识别为未扫或缺考，不会按 0 分自动写入",
          ),
        });
      }
      subjectScoreRows.push({
        status,
        studentId: student.studentId,
        studentNo: student.studentNo,
        admissionNo: student.admissionNo,
        studentName: student.studentName,
        className: student.className,
        subjectName: subject.subjectName,
        courseName: examConfig.courseName || "",
        fullScore: subject.fullScore,
        rawValue,
        score,
        scoreSource: "智学网学生成绩",
      });
    }
  }

  return {
    title,
    sheet,
    students,
    subjectColumns,
    subjectScoreRows,
    matcher,
  };
}

/**
 *
 * @param dataRows
 * @param columnIndex
 */
function inferQuestionFullScore(dataRows, columnIndex) {
  const maxScore = dataRows.reduce((max, row) => {
    const score = toScoreNumber(getCell(row, columnIndex));
    return score === null ? max : Math.max(max, score);
  }, 0);
  return maxScore || "";
}

/**
 *
 * @param sheet
 * @param summaryContext
 * @param examConfig
 * @param errors
 * @param warnings
 */
function parseQuestionSheet(
  sheet,
  summaryContext,
  examConfig,
  errors,
  warnings,
) {
  const rows = sheet.rows || [];
  const headerRowIndex = rows.findIndex(
    (row) =>
      getHeaderIndex(row, "序号") > -1 &&
      getHeaderIndex(row, "姓名") > -1 &&
      getHeaderIndex(row, "准考证号") > -1 &&
      getHeaderIndex(row, "自定义考号") > -1,
  );

  if (headerRowIndex < 0) {
    return null;
  }

  const title = getCell(rows[0], 0);
  if (!isSameExamName(title, examConfig.examName)) {
    errors.push({
      position: `${sheet.fileName} / ${sheet.sheetName}`,
      message: trans(
        "zhixueScoreImport.parser.questionDetailExamNameMismatch",
        "智学网小题明细与当前考试不一致（文件：{$fileExamName}，当前：{$currentExamName}）",
        {
          fileExamName: title || "-",
          currentExamName: examConfig.examName || "-",
        },
      ),
    });
  }

  const subjectName = sheet.sheetName || examConfig.subjectName || "未识别学科";
  const configuredSubjectName = examConfig.subjectName;
  if (
    configuredSubjectName &&
    normalizeText(configuredSubjectName) !== normalizeText(subjectName)
  ) {
    errors.push({
      position: `${sheet.fileName} / ${sheet.sheetName}`,
      message: trans(
        "zhixueScoreImport.parser.subjectMismatch",
        "智学网学科 {$fileSubject} 无法匹配当前考试学科 {$currentSubject}",
        {
          fileSubject: subjectName,
          currentSubject: configuredSubjectName,
        },
      ),
    });
  }

  const headerRow = rows[headerRowIndex] || [];
  const sequenceIndex = getHeaderIndex(headerRow, "序号");
  const nameIndex = getHeaderIndex(headerRow, "姓名");
  const admissionNoIndex = getHeaderIndex(headerRow, "准考证号");
  const customNoIndex = getHeaderIndex(headerRow, "自定义考号");
  const classNameIndex = getHeaderIndex(headerRow, "班级");
  const totalScoreIndex = getHeaderIndex(headerRow, "总分");
  const dataRows = rows.slice(headerRowIndex + 1).filter((row) => {
    return (
      /^\d+$/.test(getCell(row, sequenceIndex)) &&
      getCell(row, nameIndex) &&
      (getCell(row, admissionNoIndex) || getCell(row, customNoIndex))
    );
  });
  const questionColumns = headerRow
    .map((questionNo, columnIndex) => ({
      questionNo: cleanCellValue(questionNo),
      columnIndex,
    }))
    .filter(
      (item) =>
        item.columnIndex >= QUESTION_START_INDEX &&
        isLikelyQuestionNo(item.questionNo),
    );
  const leafQuestionNoSet = new Set(
    getLeafQuestionNos(questionColumns.map((item) => item.questionNo)),
  );
  const leafQuestionColumns = questionColumns.filter((item) =>
    leafQuestionNoSet.has(item.questionNo),
  );

  if (leafQuestionColumns.length === 0) {
    errors.push({
      position: `${sheet.fileName} / ${sheet.sheetName}`,
      message: trans(
        "zhixueScoreImport.parser.leafQuestionColumnMissing",
        "未识别到可导入的叶子题列",
      ),
    });
  }

  const removedParentCount =
    questionColumns.length - leafQuestionColumns.length;
  if (removedParentCount > 0) {
    warnings.push({
      position: `${sheet.sheetName} / 题目列`,
      message: trans(
        "zhixueScoreImport.parser.parentQuestionColumnsIgnored",
        "识别到 {$count} 个父题汇总列，已只保留叶子题导入",
        {
          count: removedParentCount,
        },
      ),
    });
  }

  const fullScoreMap = new Map();
  for (const question of leafQuestionColumns) {
    const fullScore = inferQuestionFullScore(dataRows, question.columnIndex);
    fullScoreMap.set(question.questionNo, fullScore);
    warnings.push({
      position: `${sheet.sheetName} / 第${question.questionNo}题`,
      message: trans(
        "zhixueScoreImport.parser.questionFullScoreMissing",
        "智学网小题明细未提供满分，当前用最高得分 {$score} 作为建议满分",
        {
          score: fullScore || "-",
        },
      ),
    });
  }

  const questionScoreRows = [];
  const detailStudentKeySet = new Set();

  for (const row of dataRows) {
    const detailStudent = {
      studentNo: getCell(row, customNoIndex),
      admissionNo: getCell(row, admissionNoIndex),
      studentName: getCell(row, nameIndex),
      className: getCell(row, classNameIndex),
    };
    const matchedStudent = summaryContext.matcher.match(detailStudent);
    if (!matchedStudent) {
      errors.push({
        position: `${detailStudent.className || "-"} / ${
          detailStudent.studentName || "-"
        }`,
        message: trans(
          "zhixueScoreImport.parser.studentDetailUnmatched",
          "小题明细中的学生无法在学生成绩汇总中唯一匹配",
        ),
      });
      continue;
    }

    detailStudentKeySet.add(getStudentKey(matchedStudent));
    let leafSum = 0;
    for (const question of leafQuestionColumns) {
      const rawValue = getCell(row, question.columnIndex);
      const score = toScoreNumber(rawValue);
      const fullScore = fullScoreMap.get(question.questionNo);
      let status = "可导入";
      if (!rawValue) {
        status = "空值";
      } else if (score === null) {
        status = getAbsentStatus(rawValue);
      } else if (Number(fullScore) && score > Number(fullScore)) {
        status = "得分超满分";
      }
      if (status === "可导入" && score !== null) {
        leafSum += score;
      }
      questionScoreRows.push({
        status,
        studentId: matchedStudent.studentId,
        studentNo: matchedStudent.studentNo,
        admissionNo: matchedStudent.admissionNo,
        studentName: matchedStudent.studentName,
        className: matchedStudent.className,
        subjectName,
        courseName: examConfig.courseName || "",
        moduleNo:
          getParentQuestionNo(question.questionNo) || question.questionNo,
        questionNo: question.questionNo,
        questionType: "",
        rawValue,
        correctAnswer: "",
        score,
        fullScore,
        scoreSource: "智学网小题明细",
      });
    }

    const totalScore = toScoreNumber(getCell(row, totalScoreIndex));
    if (totalScore !== null && Math.abs(totalScore - leafSum) > 0.01) {
      warnings.push({
        position: `${matchedStudent.className} / ${matchedStudent.studentName} / ${subjectName}`,
        message: trans(
          "zhixueScoreImport.parser.totalScoreMismatch",
          "智学网总分 {$totalScore} 与叶子题汇总 {$leafSum} 不一致",
          {
            totalScore,
            leafSum,
          },
        ),
      });
    }
  }

  for (const student of summaryContext.students) {
    const studentKey = getStudentKey(student);
    if (!detailStudentKeySet.has(studentKey)) {
      warnings.push({
        position: `${student.className} / ${student.studentName} / ${subjectName}`,
        message: trans(
          "zhixueScoreImport.parser.summaryOnlyStudent",
          "该学生只在总分文件中存在，没有小题明细，通常为未扫或缺考",
        ),
      });
    }
  }

  // 缺考按“学生 + 学科”整体判断，避免把单题未作答误判为整科缺考。
  normalizeQuestionAbsentStatus(
    questionScoreRows,
    summaryContext.subjectScoreRows || [],
  );

  return {
    subjectName,
    sheetName: `${subjectName}_小题得分`,
    rows: questionScoreRows,
    questionColumns: leafQuestionColumns,
  };
}

/**
 *
 * @param subjectScoreRows
 * @param questionScoreRows
 */
function createScoreWorkbookRows(subjectScoreRows, questionScoreRows) {
  const rowMap = new Map();
  const ensureRow = (row, scoreSource) => {
    const key = getStudentKey(row);
    const current = rowMap.get(key) || {
      status: "可导入",
      studentId: row.studentId,
      studentNo: row.studentNo,
      admissionNo: row.admissionNo,
      studentName: row.studentName,
      className: row.className,
      totalScore: 0,
      fullScore: 0,
      scoreSource,
      subjectScoreMap: {},
      subjectFullScoreMap: {},
    };
    rowMap.set(key, current);
    return current;
  };

  for (const row of subjectScoreRows) {
    const workbookRow = ensureRow(row, "智学网学生成绩");
    if (row.status !== "可导入") {
      workbookRow.status = row.status;
    }
    if (row.score !== null && row.score !== undefined) {
      workbookRow.subjectScoreMap[row.subjectName] = row.score;
      workbookRow.subjectFullScoreMap[row.subjectName] = Number(row.fullScore);
      workbookRow.totalScore += Number(row.score) || 0;
      workbookRow.fullScore += Number(row.fullScore) || 0;
    }
  }

  if (rowMap.size > 0) {
    return [...rowMap.values()];
  }

  for (const row of questionScoreRows) {
    if (
      row.status !== "可导入" ||
      row.score === null ||
      row.score === undefined
    ) {
      continue;
    }
    const workbookRow = ensureRow(row, "智学网小题汇总");
    workbookRow.subjectScoreMap[row.subjectName] =
      (workbookRow.subjectScoreMap[row.subjectName] || 0) + Number(row.score);
    workbookRow.subjectFullScoreMap[row.subjectName] =
      (workbookRow.subjectFullScoreMap[row.subjectName] || 0) +
      (Number(row.fullScore) || 0);
    workbookRow.totalScore += Number(row.score) || 0;
    workbookRow.fullScore += Number(row.fullScore) || 0;
  }

  return [...rowMap.values()];
}

/**
 *
 * @param questionScoreRows
 */
function groupQuestionRows(questionScoreRows) {
  const groupMap = new Map();
  for (const row of questionScoreRows) {
    const subjectName = row.subjectName || "未识别学科";
    if (!groupMap.has(subjectName)) {
      groupMap.set(subjectName, {
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
 * @param fileItems
 * @param examConfig
 */
export async function parseZhixueFilesFromBuffers(fileItems, examConfig = {}) {
  const errors = [];
  const warnings = [];

  if (!fileItems || fileItems.length === 0) {
    return {
      previewId: "",
      summary: {},
      scoreWorkbookRows: [],
      subjectScoreRows: [],
      questionWorkbookList: [],
      questionScoreRows: [],
      errors: [
        {
          position: "上传文件",
          message: trans(
            "zhixueScoreImport.parser.uploadScoreFileRequired",
            "请上传智学网成绩文件",
          ),
        },
      ],
      warnings: [],
    };
  }

  const expandedFiles = await expandUploadFiles(fileItems);
  const workbooks = [];
  for (const file of expandedFiles) {
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      errors.push({
        position: file.name,
        message: trans(
          "zhixueScoreImport.parser.unsupportedBrowserFileType",
          "当前浏览器解析工具只支持 .xlsx 文件，.xls 请先另存为 .xlsx",
        ),
      });
      continue;
    }
    workbooks.push(await readWorkbook(file.name, file.buffer));
  }

  const allSheets = workbooks.flatMap((workbook) => workbook.sheets);
  const summarySheet = allSheets.find(
    (sheet) =>
      sheet.sheetName === SUMMARY_SHEET_KEYWORD ||
      normalizeText(getCell(sheet.rows?.[0], 0)).includes(
        SUMMARY_SHEET_KEYWORD,
      ),
  );

  if (!summarySheet) {
    errors.push({
      position: "学生成绩.xlsx",
      message: trans(
        "zhixueScoreImport.parser.summaryFileMissing",
        "缺少智学网学生成绩汇总文件，无法还原完整学生范围",
      ),
    });
  }

  const summaryContext = summarySheet
    ? parseSummarySheet(summarySheet, examConfig, errors, warnings)
    : null;
  const questionWorkbookList = [];
  const questionScoreRows = [];

  if (summaryContext) {
    for (const sheet of allSheets.filter((sheet) => sheet !== summarySheet)) {
      const result = parseQuestionSheet(
        sheet,
        summaryContext,
        examConfig,
        errors,
        warnings,
      );
      if (!result) {
        continue;
      }
      questionWorkbookList.push(result);
      questionScoreRows.push(...result.rows);
    }
  }

  if (summaryContext && questionScoreRows.length === 0) {
    warnings.push({
      position: "小题明细",
      message: trans(
        "zhixueScoreImport.parser.questionDetailFileMissing",
        "未上传或未识别小题得分明细，本次只生成学科总分预览",
      ),
    });
  }

  const subjectScoreRows = summaryContext?.subjectScoreRows || [];
  const scoreWorkbookRows = createScoreWorkbookRows(
    subjectScoreRows,
    questionScoreRows,
  );
  const normalizedQuestionWorkbookList =
    questionWorkbookList.length > 0
      ? questionWorkbookList
      : groupQuestionRows(questionScoreRows);

  return {
    previewId: `zhixue-local-${Date.now()}`,
    source: "zhixue",
    exam: {
      examId: examConfig.examId,
      examName: examConfig.examName,
      examTime: examConfig.examTime,
      subjectName: examConfig.subjectName,
      fullScore: examConfig.fullScore,
    },
    files: expandedFiles.map((item) => ({ fileName: item.name })),
    summary: {
      studentCount: summaryContext?.students.length || 0,
      subjectScoreCount: subjectScoreRows.length,
      scoreWorkbookRowCount: scoreWorkbookRows.length,
      questionWorkbookCount: normalizedQuestionWorkbookList.length,
      questionScoreCount: questionScoreRows.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      importableCount:
        subjectScoreRows.filter((row) => row.status === "可导入").length +
        questionScoreRows.filter((row) => row.status === "可导入").length,
    },
    scoreWorkbookRows,
    subjectScoreRows,
    questionWorkbookList: normalizedQuestionWorkbookList,
    questionScoreRows,
    errors,
    warnings,
  };
}

/**
 *
 * @param preview
 */
export function summarizeZhixuePreview(preview) {
  const summary = preview?.summary || {};
  return {
    studentCount: summary.studentCount || 0,
    subjectScoreCount: summary.subjectScoreCount || 0,
    scoreWorkbookRowCount: summary.scoreWorkbookRowCount || 0,
    questionWorkbookCount: summary.questionWorkbookCount || 0,
    questionScoreCount: summary.questionScoreCount || 0,
    errorCount: summary.errorCount || 0,
    warningCount: summary.warningCount || 0,
    importableCount: summary.importableCount || 0,
  };
}

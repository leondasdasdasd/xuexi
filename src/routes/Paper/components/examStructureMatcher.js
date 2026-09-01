import { trans } from "../../../utils/i18n";

export const MATCH_FILTER_ALL_VALUE = "__all__";

const STAGE_BY_GRADE_ID = {
  8: { key: "primary" },
  9: { key: "primary" },
  10: { key: "primary" },
  11: { key: "primary" },
  12: { key: "primary" },
  13: { key: "primary" },
  14: { key: "junior" },
  15: { key: "junior" },
  16: { key: "junior" },
  20: { key: "senior" },
  21: { key: "senior" },
  22: { key: "senior" },
};

const STAGE_LABELS = {
  junior: ["paper.match.stage.junior", "初中"],
  primary: ["paper.match.stage.primary", "小学"],
  senior: ["paper.match.stage.senior", "高中"],
};

const HIGH_SCHOOL_GRADE_NAMES = [
  "十年级",
  "十一年级",
  "十二年级",
  "高一",
  "高二",
  "高三",
];
const JUNIOR_SCHOOL_GRADE_NAMES = [
  "七年级",
  "八年级",
  "九年级",
  "初一",
  "初二",
  "初三",
];
const PRIMARY_SCHOOL_GRADE_NAMES = [
  "一年级",
  "二年级",
  "三年级",
  "四年级",
  "五年级",
  "六年级",
];

const getFirstValue = (...values) => {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) {
      const firstValue = getFirstValue(...value);
      if (firstValue !== undefined) {
        return firstValue;
      }
    } else if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return;
};

const parseFirstDelimitedNumber = (value) => {
  const matched = String(value || "").match(/\d+/);
  return matched ? Number(matched[0]) : undefined;
};

const getRecordGradeId = (record = {}) =>
  getFirstValue(
    record.gradeId,
    record.gradeIds,
    record.gradeIdList,
    record.applyGrade && parseFirstDelimitedNumber(record.applyGrade),
  );

const getStageLabel = (stageKey) => {
  const stageLabel = STAGE_LABELS[stageKey];
  return stageLabel ? trans(stageLabel[0], stageLabel[1]) : "";
};

const getStageByGradeName = (gradeName) => {
  const normalizedGradeName = String(gradeName || "");

  if (
    HIGH_SCHOOL_GRADE_NAMES.some((name) => normalizedGradeName.includes(name))
  ) {
    return { key: "senior", label: getStageLabel("senior") };
  }

  if (
    JUNIOR_SCHOOL_GRADE_NAMES.some((name) => normalizedGradeName.includes(name))
  ) {
    return { key: "junior", label: getStageLabel("junior") };
  }

  if (
    PRIMARY_SCHOOL_GRADE_NAMES.some((name) =>
      normalizedGradeName.includes(name),
    )
  ) {
    return { key: "primary", label: getStageLabel("primary") };
  }

  return null;
};

const normalizeComparableText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const hasComparableValue = (value) =>
  value !== undefined && value !== null && value !== "";

const getSubjectProfile = (record = {}) => {
  const subjectId = getFirstValue(record.subjectId, record.subject?.id);
  const subjectName = getFirstValue(record.subjectName, record.subject?.name);
  const subjectKey =
    subjectId === undefined
      ? subjectName
        ? `name:${normalizeComparableText(subjectName)}`
        : ""
      : `id:${subjectId}`;

  return {
    subjectId,
    subjectKey,
    subjectName,
    subjectLabel:
      subjectName ||
      (subjectId === undefined
        ? trans("paper.match.notSet", "未设置")
        : trans("paper.match.subjectWithId", "学科{$id}", {
            id: subjectId,
          })),
  };
};

const getStageProfile = (record = {}) => {
  const explicitStageName = getFirstValue(
    record.stageName,
    record.stageText,
    record.stageTitle,
  );
  const gradeName = getFirstValue(record.gradeName, record.gradeNames);
  const stageByName = getStageByGradeName(explicitStageName || gradeName);

  if (stageByName) {
    return {
      gradeName,
      stageKey: stageByName.key,
      stageLabel: stageByName.label,
    };
  }

  const gradeId = Number(getRecordGradeId(record));
  const stageByGradeId = STAGE_BY_GRADE_ID[gradeId];

  if (stageByGradeId) {
    return {
      gradeName,
      stageKey: stageByGradeId.key,
      stageLabel: getStageLabel(stageByGradeId.key),
    };
  }

  const explicitStageId = getFirstValue(
    record.stageId,
    record.stageIds,
    record.stage,
  );

  return {
    gradeName,
    stageKey: explicitStageId === undefined ? "" : `stage:${explicitStageId}`,
    stageLabel:
      explicitStageName ||
      (explicitStageId === undefined
        ? trans("paper.match.notSet", "未设置")
        : trans("paper.match.stageWithId", "学段{$id}", {
            id: explicitStageId,
          })),
  };
};

export const getRecordMatchProfile = (record = {}) => ({
  ...getSubjectProfile(record),
  ...getStageProfile(record),
});

export const matchesRecordFilters = (record, filters = {}) => {
  const profile = getRecordMatchProfile(record);
  const { stageKey, subjectKey } = filters;
  const matchesStage =
    !stageKey ||
    stageKey === MATCH_FILTER_ALL_VALUE ||
    !profile.stageKey ||
    profile.stageKey === stageKey;
  const matchesSubject =
    !subjectKey ||
    subjectKey === MATCH_FILTER_ALL_VALUE ||
    !profile.subjectKey ||
    profile.subjectKey === subjectKey;

  return matchesStage && matchesSubject;
};

const getRecordTypeValue = (record = {}) =>
  getFirstValue(
    record.examTypeName,
    record.paperTypeName,
    record.typeName,
    record.examTypeCode,
    record.paperTypeCode,
    record.examType,
    record.paperType,
    record.type,
  );

const getRecordTypeLabel = (record = {}) =>
  getFirstValue(
    record.examTypeName,
    record.paperTypeName,
    record.typeName,
    record.examType,
    record.paperType,
    record.type,
  );

export const getRecordTypeProfile = (record = {}) => {
  const typeValue = getRecordTypeValue(record);
  const typeLabel = getRecordTypeLabel(record);

  return {
    typeKey: hasComparableValue(typeValue)
      ? `type:${normalizeComparableText(typeValue)}`
      : "",
    typeLabel: typeLabel || trans("paper.match.notSet", "未设置"),
  };
};

export const buildRecordTypeFilterOptions = (records = []) => {
  const optionMap = new Map();

  for (const record of records) {
    const profile = getRecordTypeProfile(record);

    if (!profile.typeKey || optionMap.has(profile.typeKey)) {
      continue;
    }

    optionMap.set(profile.typeKey, {
      label: profile.typeLabel,
      value: profile.typeKey,
    });
  }

  return [
    {
      label: trans("paper.match.filterAllTypes", "全部类型"),
      value: MATCH_FILTER_ALL_VALUE,
    },
    ...optionMap.values(),
  ];
};

export const matchesRecordTypeFilter = (record, typeKey) => {
  if (!typeKey || typeKey === MATCH_FILTER_ALL_VALUE) {
    return true;
  }

  return getRecordTypeProfile(record).typeKey === typeKey;
};

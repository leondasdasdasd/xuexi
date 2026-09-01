import { trans } from "../../utils/i18n";
import { FALL_TERM_ID, SPRING_TERM_ID, YEAR_OPTIONS } from "./constants";

const OPTION_VALUE_GETTERS = new Map([
  ["examTypeCode", (item) => item?.examTypeCode],
  ["examTypeName", (item) => item?.examTypeName],
  ["gradeEnName", (item) => item?.gradeEnName],
  ["gradeId", (item) => item?.gradeId],
  ["gradeName", (item) => item?.gradeName],
  ["id", (item) => item?.id],
  ["label", (item) => item?.label],
  ["name", (item) => item?.name],
  ["normalizedLabel", (item) => item?.normalizedLabel],
  ["value", (item) => item?.value],
]);

// 后端、旧组件和国际化场景会传入不同字段名，这里集中白名单读取，避免各处散落兼容逻辑。
const getKnownOptionValue = (item, key) => {
  const getValue = OPTION_VALUE_GETTERS.get(key);
  if (!getValue) {
    return;
  }

  return getValue(item);
};

const pickFirstPresentOptionValue = (item, keys) =>
  keys
    .map((key) => getKnownOptionValue(item, key))
    .find((value) => value !== undefined && value !== null && value !== "");

const normalizeOption = (item, labelKeys, valueKeys) => ({
  label: pickFirstPresentOptionValue(item, labelKeys),
  value: pickFirstPresentOptionValue(item, valueKeys),
});

const hasOptionValue = (option) =>
  option.label !== undefined && option.value !== undefined;

export const normalizeOptions = (list, labelKeys, valueKeys) =>
  (list || [])
    .map((item) => normalizeOption(item, labelKeys, valueKeys))
    .filter((option) => hasOptionValue(option));

export const buildYearOptions = () =>
  YEAR_OPTIONS.map((value) => ({ label: value, value }));

export const buildGradeOptions = (gradeOptions, isEnglish) => {
  // 年级选择在 UI 中合并展示学段和学期，提交时再拆回后端需要的 gradeId 与 termId。
  const semesterOptions = [
    { value: FALL_TERM_ID, label: trans("paper.upload.term.fall") },
    { value: SPRING_TERM_ID, label: trans("paper.upload.term.spring") },
  ];

  return (gradeOptions || []).flatMap((item) => {
    const gradeOption = normalizeOption(
      {
        ...item,
        normalizedLabel: isEnglish
          ? item.gradeEnName || item.label || item.gradeName
          : item.label || item.gradeName,
      },
      ["normalizedLabel"],
      ["value", "gradeId"],
    );

    if (!hasOptionValue(gradeOption)) {
      return [];
    }

    return semesterOptions.map((semester) => ({
      label: `${gradeOption.label} ${semester.label}`,
      value: `${gradeOption.value}-${semester.value}`,
      gradeId: gradeOption.value,
      termId: semester.value,
    }));
  });
};

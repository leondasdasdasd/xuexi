import React from "react";

import { trans } from "../../utils/i18n";
import { MODE_UPLOAD_AND_PARSE, MODE_UPLOAD_ONLY } from "./constants";
import { Icons } from "./icons";

export const buildModeOptions = () => [
  {
    value: MODE_UPLOAD_AND_PARSE,
    label: trans("paper.upload.parseAfterUpload", "AI 解析"),
    icon: <Icons.Sparkles />,
  },
  {
    value: MODE_UPLOAD_ONLY,
    label: trans("paper.upload.manualEntryOnly", "暂不解析"),
    icon: <Icons.EditSquare />,
  },
];

export const buildScoreFields = () => [
  {
    key: "totalScore",
    label: trans("paper.upload.totalScoreCompact", "总分"),
    placeholder: trans("paper.upload.totalScoreCompact", "总分"),
  },
  {
    key: "mainQuestionCount",
    label: trans("paper.upload.mainQuestionCountCompact", "大题"),
    placeholder: trans("paper.upload.mainQuestionCountCompact", "大题"),
  },
  {
    key: "subQuestionCount",
    label: trans("paper.upload.subQuestionCountCompact", "小题"),
    placeholder: trans("paper.upload.subQuestionCountCompact", "小题"),
  },
];

export const buildSelectFields = ({
  normalizedGradeOptions,
  normalizedPaperTypeOptions,
  normalizedSubjectOptions,
  yearOptions,
}) => [
  {
    key: "subjectId",
    label: trans("paper.upload.subject"),
    placeholder: trans("paper.upload.subjectPlaceholder"),
    options: normalizedSubjectOptions,
    required: true,
  },
  {
    key: "paperType",
    label: trans("paper.upload.paperType"),
    placeholder: trans("paper.upload.paperTypePlaceholder"),
    options: normalizedPaperTypeOptions,
    required: true,
  },
  {
    key: "gradeId",
    label: trans("global.grade"),
    placeholder: trans("global.selectGrade"),
    options: normalizedGradeOptions,
    required: true,
  },
  {
    key: "year",
    label: trans("paper.upload.year"),
    placeholder: trans("paper.upload.yearPlaceholder"),
    options: yearOptions,
    required: true,
  },
];

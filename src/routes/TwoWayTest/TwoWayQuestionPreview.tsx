import React from "react";

import QuestionPreviewContent from "../../components/QuestionPreviewContent";
import {
  createBusinessQuestionTypesById,
  createQuestionPreviewViewModel,
} from "../../utils/questionPreviewAdapter.js";
import type {
  BusinessQuestionTypeRegistryItem,
  V2QuestionAggregate,
} from "./segmentationPaperV2Adapter";

interface TwoWayQuestionPreviewProps {
  aggregate: V2QuestionAggregate;
  questionTypes: BusinessQuestionTypeRegistryItem[];
  showAnswer?: boolean;
}

/**
 * 使用题型平台注册表渲染双向细目表中的 v2 题目。
 * @param {TwoWayQuestionPreviewProps} properties v2 题目、题型定义与答案展示配置。
 * @param {object} properties.aggregate v2 题目聚合。
 * @param {object[]} properties.questionTypes 业务题型定义。
 * @param {boolean} properties.showAnswer 是否展示答案与解析。
 * @returns {React.ReactElement} v2 题目预览。
 */
function TwoWayQuestionPreview({
  aggregate,
  questionTypes,
  showAnswer = false,
}: TwoWayQuestionPreviewProps) {
  const viewModel = createQuestionPreviewViewModel(
    aggregate,
    createBusinessQuestionTypesById(questionTypes),
  );

  return (
    <QuestionPreviewContent
      showAnswerDetails={showAnswer}
      viewModel={viewModel}
    />
  );
}

export default TwoWayQuestionPreview;

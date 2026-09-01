import React, { useMemo } from "react";
import {
  createQuestionPreviewDraft,
  QuestionPreview,
} from "@yungu-fed/question-editor";
import { Empty } from "antd";
import PropTypes from "prop-types";

import { trans } from "../utils/i18n";

const PREVIEW_CONTENT_STYLE = {
  color: "rgba(1, 17, 61, 0.85)",
  fontFamily: "PingFangSC-Regular, sans-serif",
  marginBottom: "0.9375rem",
  overflowX: "auto",
};

const PREVIEW_UNAVAILABLE_STYLE = {
  background: "rgba(1, 17, 61, 0.03)",
  border: "1px dashed rgba(1, 17, 61, 0.16)",
  borderRadius: "0.5rem",
  marginBottom: "0.9375rem",
  padding: "1.25rem",
};

const getQuestionPreviewLocale = (_unusedReason = "default") =>
  (void _unusedReason,
  typeof window !== "undefined" &&
    String(window.globalLange || navigator.language || "").startsWith("en"))
    ? "en-US"
    : "zh-CN";

/**
 * V2 题目预览组件边界，只消费共享 adapter 产出的 editor view model。
 * @param {object} properties 组件属性。
 * @param {boolean} properties.showAnswerDetails 是否展示答案和附加属性。
 * @param {object} properties.viewModel 题目预览 view model。
 * @returns {React.ReactElement} 题目预览或空态。
 */
function QuestionPreviewContent({ showAnswerDetails, viewModel }) {
  const previewDraft = useMemo(() => {
    if (
      !viewModel.questionContent ||
      viewModel.questionTypeTemplates.length === 0
    ) {
      return;
    }

    return createQuestionPreviewDraft(
      viewModel.questionContent,
      viewModel.questionTypeTemplates,
    );
  }, [viewModel]);

  if (!previewDraft) {
    return (
      <div style={PREVIEW_UNAVAILABLE_STYLE}>
        <Empty
          description={trans(
            "newMyQuestion.previewUnavailable",
            "题目内容暂不可预览",
          )}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={PREVIEW_CONTENT_STYLE}>
      <QuestionPreview
        locale={getQuestionPreviewLocale()}
        questionTypeTemplates={viewModel.questionTypeTemplates}
        showAnswer={showAnswerDetails}
        showExtraAttributes={showAnswerDetails}
        value={previewDraft}
      />
    </div>
  );
}

QuestionPreviewContent.propTypes = {
  showAnswerDetails: PropTypes.bool.isRequired,
  viewModel: PropTypes.shape({
    questionContent: PropTypes.object,
    questionTypeTemplates: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
};

export default QuestionPreviewContent;

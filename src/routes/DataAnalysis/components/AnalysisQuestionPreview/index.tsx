import React, { useMemo } from "react";
import {
  createEmptyQuestionPlayerResponse,
  createQuestionPreviewDraft,
  QuestionPlayer,
  QuestionPreview,
} from "@yungu-fed/question-editor";
import { Empty } from "antd";

import { trans } from "../../../../utils/i18n";
import { mapV2AnswerJsonToQuestionPlayerResponse } from "../../../../utils/v2QuestionPlayerResponseAdapter";
import type { AnalysisQuestionCatalog } from "../../analysisQuestionCatalog";

interface Props {
  answerJson?: string | null;
  catalog: AnalysisQuestionCatalog;
  mode: "question" | "response";
  questionId: number;
  showAnswer?: boolean;
}

/**
 * 使用统一 V2 catalog 渲染冻结题目或某次学生作答。
 * @param {Props} root0 V2 分析题目渲染参数。
 * @param {Props["answerJson"]} root0.answerJson 学生作答 JSON。
 * @param {Props["catalog"]} root0.catalog 冻结试卷题目目录。
 * @param {Props["mode"]} root0.mode 题目或作答渲染模式。
 * @param {Props["questionId"]} root0.questionId 已归一化的冻结题目 ID。
 * @param {Props["showAnswer"]} root0.showAnswer 是否展示答案和附加属性。
 * @returns {React.ReactElement} V2 题目、作答或局部不可预览状态。
 */
function AnalysisQuestionPreview({
  answerJson,
  catalog,
  mode,
  questionId,
  showAnswer = false,
}: Props): React.ReactElement {
  const question = catalog.findQuestion(questionId);
  const preview = useMemo(
    () =>
      question
        ? createQuestionPreviewDraft(
            question.content,
            catalog.questionTypeTemplates,
          )
        : undefined,
    [catalog.questionTypeTemplates, question],
  );
  if (!question || !preview) {
    return (
      <div data-analysis-question-id={questionId}>
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
  const locale = String(Reflect.get(window, "globalLange") || "").startsWith(
    "en",
  )
    ? "en-US"
    : "zh-CN";
  if (mode === "response") {
    const empty = createEmptyQuestionPlayerResponse(
      preview,
      catalog.questionTypeTemplates,
    );
    return (
      <QuestionPlayer
        disabled
        locale={locale}
        onResponseChange={() => {}}
        questionTypeTemplates={catalog.questionTypeTemplates}
        response={mapV2AnswerJsonToQuestionPlayerResponse(answerJson, empty)}
        showAnswer={showAnswer}
        showExtraAttributes={showAnswer}
        value={preview}
      />
    );
  }
  return (
    <QuestionPreview
      locale={locale}
      questionTypeTemplates={catalog.questionTypeTemplates}
      rootQuestionNumber={Number(question.displayNumber.split(".")[0])}
      showAnswer={showAnswer}
      showExtraAttributes={showAnswer}
      value={preview}
    />
  );
}

export default AnalysisQuestionPreview;

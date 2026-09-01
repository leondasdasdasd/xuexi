import type { QuestionContentQuestionTypeTemplate } from "@yungu-fed/question-editor";
import { QuestionPlayer } from "@yungu-fed/question-editor";
import type { ReactElement } from "react";

import type { V2CorrectionQuestion } from "./v2MarkingAdapter";

type Props = {
  question: V2CorrectionQuestion;
  templates: QuestionContentQuestionTypeTemplate[];
};

/**
 * 使用冻结题目、题型和answer_json展示单个V2批改题。
 * @param {Props} props 组件属性。
 * @param {V2CorrectionQuestion} props.question 待展示的冻结题目与作答。
 * @param {QuestionContentQuestionTypeTemplate[]} props.templates 冻结题型模板。
 * @returns {ReactElement} 只读作答视图。
 */
function CorrectionQuestionPlayer({
  question,
  templates,
}: Props): ReactElement {
  return (
    <QuestionPlayer
      disabled
      locale={
        String(Reflect.get(window, "globalLange") || "").startsWith("en")
          ? "en-US"
          : "zh-CN"
      }
      onResponseChange={() => {}}
      questionTypeTemplates={templates}
      response={question.response}
      showAnswer
      showExtraAttributes
      value={question.content}
    />
  );
}

export default CorrectionQuestionPlayer;

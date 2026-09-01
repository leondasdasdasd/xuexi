import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";

import type { AnswerMode, ExamPaperView } from "../types";
import ExamPaperPanel from "./ExamPaperPanel";
import SingleQuestionExamPanel from "./SingleQuestionExamPanel";

type Properties = {
  answerMode: AnswerMode;
  onResponseChange: (
    placementId: string,
    response: QuestionPlayerResponse,
  ) => void;
  onSingleQuestionIndexChange: (index: number) => void;
  onSubmit: () => void;
  paper: ExamPaperView;
  singleQuestionIndex: number;
};

const StudentAnswerPaper = (properties: Properties) =>
  properties.answerMode === "single-question" ? (
    <SingleQuestionExamPanel
      currentIndex={properties.singleQuestionIndex}
      onIndexChange={properties.onSingleQuestionIndexChange}
      onResponseChange={properties.onResponseChange}
      onSubmit={properties.onSubmit}
      paper={properties.paper}
    />
  ) : (
    <ExamPaperPanel
      onResponseChange={properties.onResponseChange}
      paper={properties.paper}
    />
  );

export default StudentAnswerPaper;

import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";
import { Button } from "antd";

import { trans } from "../../../utils/i18n";
import {
  selectExamPaperPlacements,
  selectExamPaperQuestion,
} from "../examPaperView";
import type { ExamPaperView } from "../types";
import ExamPaperPanel from "./ExamPaperPanel";

import styles from "../explicitExam.module.less";

type Properties = {
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onResponseChange: (
    placementId: string,
    response: QuestionPlayerResponse,
  ) => void;
  onSubmit: () => void;
  paper: ExamPaperView;
};

const SingleQuestionExamPanel = ({
  currentIndex,
  onIndexChange,
  onResponseChange,
  onSubmit,
  paper,
}: Properties) => {
  const placements = selectExamPaperPlacements(paper);
  const questionPaper = selectExamPaperQuestion(paper, currentIndex);
  if (!questionPaper) return null;
  const isLast = currentIndex === placements.length - 1;
  return (
    <section>
      <ExamPaperPanel
        onResponseChange={onResponseChange}
        paper={questionPaper}
        showQuestionScore={false}
      />
      <div className={styles["question-navigation"]}>
        <Button
          disabled={currentIndex === 0}
          onClick={() => onIndexChange(currentIndex - 1)}
        >
          ← {trans("explicitExam.previousQuestion", "上一题")}
        </Button>
        <span className={styles["question-progress"]}>
          {trans(
            "explicitExam.questionProgress",
            "第 {$current} / {$total} 题",
            {
              current: currentIndex + 1,
              total: placements.length,
            },
          )}
        </span>
        <Button
          onClick={() =>
            isLast ? onSubmit() : onIndexChange(currentIndex + 1)
          }
          type="primary"
        >
          {isLast
            ? trans("explicitExam.submit", "提交试卷")
            : `${trans("explicitExam.nextQuestion", "下一题")} →`}
        </Button>
      </div>
    </section>
  );
};

export default SingleQuestionExamPanel;

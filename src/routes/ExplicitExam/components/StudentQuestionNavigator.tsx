import PaperStructureNavigation from "../../../common/PaperStructureNavigation";
import {
  mapExamPaperViewToStructureNavigation,
  selectExamPaperNavigationQuestionKey,
  selectExamPaperQuestionIndexByPlacementId,
} from "../examPaperView";
import { getExamQuestionAnchorId } from "../questionAnchor";
import type { AnswerMode, ExamPaperView } from "../types";

import styles from "../explicitExam.module.less";

type Properties = {
  answerMode: AnswerMode;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  paper: ExamPaperView;
};

const StudentQuestionNavigator = ({
  answerMode,
  currentIndex,
  onIndexChange,
  paper,
}: Properties) => {
  const modules = mapExamPaperViewToStructureNavigation(paper);
  return (
    <aside className={styles["question-card"]}>
      <PaperStructureNavigation
        activeQuestionKey={selectExamPaperNavigationQuestionKey(
          modules,
          currentIndex,
        )}
        modules={modules}
        onQuestionSelect={(question) => {
          if (answerMode === "single-question") {
            const questionIndex = selectExamPaperQuestionIndexByPlacementId(
              paper,
              question.key,
            );
            if (questionIndex >= 0) onIndexChange(questionIndex);
            return;
          }
          document
            .getElementById(getExamQuestionAnchorId(question.key))
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </aside>
  );
};

export default StudentQuestionNavigator;

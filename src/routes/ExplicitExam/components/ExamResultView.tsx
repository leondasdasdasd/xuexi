import PaperStructureNavigation from "../../../common/PaperStructureNavigation";
import { trans } from "../../../utils/i18n";
import { mapExamPaperViewToStructureNavigation } from "../examPaperView";
import { getExamQuestionAnchorId } from "../questionAnchor";
import type {
  ExamPaperView,
  ExamResultView as ExamResultViewModel,
} from "../types";
import ExamPaperMetadata from "./ExamPaperMetadata";
import ExamPaperPanel from "./ExamPaperPanel";
import ExamResultSummary from "./ExamResultSummary";

import styles from "../explicitExam.module.less";

type Properties = {
  headerActions?: ReactNode;
  onBack: () => void;
  paper: ExamPaperView;
  result: ExamResultViewModel;
  showAnswer: boolean;
};

const scrollToQuestion = (placementId: string) => {
  document
    .getElementById(getExamQuestionAnchorId(placementId))
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const ExamResultView = ({
  headerActions,
  onBack,
  paper,
  result,
  showAnswer,
}: Properties) => {
  return (
    <main className={styles.resultPage}>
      <header className={styles.resultHeader}>
        <button
          className={styles.resultBack}
          type="button"
          onClick={onBack}
          aria-label={trans("global.back", "返回")}
        >
          ‹
        </button>
        <div className={styles.resultHeading}>
          <h1>{paper.title || trans("explicitExam.result", "作答结果")}</h1>
          <ExamPaperMetadata
            dateMetadata={paper.dateMetadata}
            gradeName={paper.gradeName}
            totalScore={paper.totalScore}
          />
        </div>
        {headerActions ? (
          <div className={styles.resultHeaderActions}>{headerActions}</div>
        ) : null}
      </header>
      <div className={styles.resultWorkspace}>
        <section className={styles.resultMain}>
          <h2 className={styles.resultPaperTitle}>{paper.title}</h2>
          <ExamPaperPanel disabled paper={paper} showAnswer={showAnswer} />
        </section>
        <aside className={styles.resultSidebar}>
          <ExamResultSummary result={result} />
          <PaperStructureNavigation
            modules={mapExamPaperViewToStructureNavigation(paper)}
            onQuestionSelect={(question) => scrollToQuestion(question.key)}
          />
        </aside>
      </div>
    </main>
  );
};

export default ExamResultView;
import type { ReactNode } from "react";

import { trans } from "../../../utils/i18n";
import type { ExamResultView } from "../types";

import styles from "../explicitExam.module.less";

type Properties = { result: ExamResultView };

const ExamResultSummary = ({ result }: Properties) => {
  return (
    <section
      aria-label={trans("explicitExam.result", "作答结果")}
      className={styles.summary}
    >
      <div className={styles["summary-head"]}>
        <h2>{trans("explicitExam.result", "作答结果")}</h2>
      </div>
      <div className={styles["summary-grid"]}>
        <span>
          {trans("explicitExam.score", "得分")}：
          {result.totalScore === null
            ? trans("explicitExam.pending", "待批改")
            : `${result.totalScore} / ${result.fullScore}`}
        </span>
        <span>
          {trans("explicitExam.correct", "正确")}：{result.correctCount}
        </span>
        <span>
          {trans("explicitExam.error", "错误")}：{result.incorrectCount}
        </span>
        <span>
          {trans("explicitExam.pending", "待批改")}：{result.pendingCount}
        </span>
      </div>
    </section>
  );
};

export default ExamResultSummary;

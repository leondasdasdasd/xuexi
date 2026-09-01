import React from "react";

import { trans } from "../../utils/i18n";
import type {
  PaperStructureModuleView,
  PaperStructureQuestionView,
} from "./types";

import styles from "./paperStructureNavigation.module.less";

interface Props {
  activeQuestionKey?: string;
  modules: PaperStructureModuleView[];
  onQuestionSelect: (question: PaperStructureQuestionView) => void;
}

/**
 * 统一渲染试卷详情与答卷页的只读试卷结构。
 * @param {Props} properties 试卷结构展示属性。
 * @returns {React.ReactElement} 只读试卷结构。
 */
function PaperStructureNavigation({
  activeQuestionKey,
  modules,
  onQuestionSelect,
}: Props): React.ReactElement {
  return (
    <section className={styles.panel}>
      <h2 className={styles.heading}>
        {trans("paperEditor.structure", "试卷结构")}
      </h2>
      <div className={styles.grid}>
        {modules.map((module) => (
          <React.Fragment key={module.key}>
            <div className={styles["module-header"]}>
              <strong className={styles["module-name"]}>
                {module.order}.{" "}
                {module.name ||
                  trans("explicitExam.untitledModule", "未命名大题")}
              </strong>
              <span className={styles["module-summary"]}>
                <span>
                  {trans("paperEditor.moduleTitleScore", "（{$score}分）", {
                    score: module.score,
                  })}
                </span>
                <span className={styles["question-count"]}>
                  {trans("paperEditor.questionCountSummary", "共{$count}题", {
                    count: String(module.questionCount),
                  })}
                </span>
              </span>
            </div>
            {module.questions.map((question) => (
              <button
                aria-current={
                  question.key === activeQuestionKey ? "true" : undefined
                }
                className={`${styles.question} ${
                  question.key === activeQuestionKey ? styles.active : ""
                }`}
                key={question.key}
                type="button"
                onClick={() => onQuestionSelect(question)}
              >
                {question.number}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

export default PaperStructureNavigation;

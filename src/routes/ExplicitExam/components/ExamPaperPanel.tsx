import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";
import { QuestionPlayer } from "@yungu-fed/question-editor";

import { getPaperModuleDisplayNumber } from "../../../common/paperModuleDisplayNumber";
import { trans } from "../../../utils/i18n";
import { getExamQuestionAnchorId } from "../questionAnchor";
import type { ExamPaperView, ExamPlacementView } from "../types";
import ExamPaperMetadata from "./ExamPaperMetadata";

import styles from "../explicitExam.module.less";

type Properties = {
  disabled?: boolean;
  onResponseChange?: (
    placementId: string,
    response: QuestionPlayerResponse,
  ) => void;
  paper: ExamPaperView;
  showQuestionScore?: boolean;
  showAnswer?: boolean;
};

type ResultStatus = {
  className: string;
  label: string;
};

const getResultStatus = (
  isCorrect: number | null | undefined,
): ResultStatus | undefined => {
  switch (isCorrect) {
    case 0: {
      return {
        className: styles.pending,
        label: trans("explicitExam.pending", "待批改"),
      };
    }
    case 1: {
      return {
        className: styles.correct,
        label: trans("explicitExam.correct", "正确"),
      };
    }
    case 2: {
      return {
        className: styles.error,
        label: trans("explicitExam.error", "错误"),
      };
    }
    case 3: {
      return {
        className: styles.pending,
        label: trans("global.partiallyCorrect", "部分正确"),
      };
    }
    default: {
      return undefined;
    }
  }
};

const renderResultScore = (placement: ExamPlacementView) => {
  const status = getResultStatus(placement.isCorrect);
  if (!status) return null;
  return (
    <div className={styles["result-status"]}>
      <span className={status.className}>{status.label}</span>
      <span className={styles["result-score"]}>
        <span className={styles["result-score-label"]}>
          {trans("explicitExam.questionScore", "题目分值")}：
        </span>
        <span className={styles["result-score-earned"]}>
          {placement.studentScore ?? 0}
        </span>
        <span className={styles["result-score-separator"]}> / </span>
        <span className={styles["result-score-full"]}>{placement.score}</span>
      </span>
    </div>
  );
};

const ExamPaperPanel = ({
  disabled = false,
  onResponseChange,
  paper,
  showQuestionScore = true,
  showAnswer = false,
}: Properties) => (
  <section className={styles.paper}>
    <header className={styles["paper-header"]}>
      <h1>{paper.title || trans("explicitExam.untitled", "未命名试卷")}</h1>
      <ExamPaperMetadata
        dateMetadata={paper.dateMetadata}
        gradeName={paper.gradeName}
        totalScore={paper.totalScore}
      />
    </header>
    {paper.modules.map((module) => (
      <section
        className={styles.module}
        key={`${module.order}-${module.moduleName}`}
      >
        <header className={styles["module-header"]}>
          <h2>
            <span>
              {getPaperModuleDisplayNumber(
                module.order - 1,
                String(Reflect.get(window, "globalLange") || "").startsWith(
                  "en",
                )
                  ? "en-US"
                  : "zh-CN",
              )}
            </span>
            {module.moduleName ||
              trans("explicitExam.untitledModule", "未命名大题")}
          </h2>
          <div className={styles["module-stats"]}>
            <span>
              {trans("paperEditor.questionCountSummary", "共{$count}题", {
                count: String(module.moduleQuestionNumber),
              })}
            </span>
            <span>
              {trans("paperEditor.moduleScoreSummary", "共{$score}分", {
                score: module.moduleScore,
              })}
            </span>
          </div>
        </header>
        {module.placements.map((placement) => (
          <article
            className={styles.question}
            id={getExamQuestionAnchorId(placement.placementId)}
            key={placement.placementId}
          >
            <div className={styles["question-title"]}>
              <strong>{placement.order}.</strong>
            </div>
            <div className={styles["question-player"]}>
              <QuestionPlayer
                disabled={disabled}
                locale={
                  String(Reflect.get(window, "globalLange") || "").startsWith(
                    "en",
                  )
                    ? "en-US"
                    : "zh-CN"
                }
                onResponseChange={(response) =>
                  onResponseChange?.(placement.placementId, response)
                }
                questionTypeTemplates={paper.questionTypeTemplates}
                response={placement.response}
                rootQuestionNumber={placement.order}
                showAnswer={showAnswer}
                showExtraAttributes={showAnswer}
                value={placement.content}
              />
            </div>
            {showQuestionScore ? (
              <div className={styles["question-score"]}>
                {showAnswer && getResultStatus(placement.isCorrect) ? (
                  renderResultScore(placement)
                ) : (
                  <>
                    {trans("explicitExam.questionScore", "题目分值")}：
                    {placement.score}
                  </>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    ))}
  </section>
);

export default ExamPaperPanel;

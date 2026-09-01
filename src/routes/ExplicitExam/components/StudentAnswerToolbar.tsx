import { Button, Icon } from "antd";

import { trans } from "../../../utils/i18n";
import type { AnswerMode, ExamPaperView } from "../types";
import ExamPaperMetadata from "./ExamPaperMetadata";
import RemainingTime from "./RemainingTime";

import styles from "../explicitExam.module.less";

type Properties = {
  answerMode: AnswerMode;
  deadline: number | null;
  onDeadlineExpire: () => void;
  onModeChange: (mode: AnswerMode) => void;
  onBack: () => void;
  onSubmit: () => void;
  paper: ExamPaperView;
  unavailable: boolean;
};

const StudentAnswerToolbar = ({
  answerMode,
  deadline,
  onDeadlineExpire,
  onModeChange,
  onBack,
  onSubmit,
  paper,
  unavailable,
}: Properties) => (
  <header className={styles["answer-header"]}>
    <Button
      aria-label={trans("global.back", "返回")}
      className={styles["answer-back"]}
      icon="left"
      onClick={onBack}
      type="link"
    />
    <div className={styles["answer-heading"]}>
      <div className={styles["answer-title-row"]}>
        <h1>{paper.title}</h1>
        <Button
          className={styles["answer-mode-switch"]}
          disabled={unavailable}
          onClick={() =>
            onModeChange(
              answerMode === "continuous" ? "single-question" : "continuous",
            )
          }
          type="link"
        >
          <Icon type="swap" />
          {answerMode === "continuous"
            ? trans("explicitExam.switchToSingle", "切换成单题作答")
            : trans("explicitExam.switchToContinuous", "切换成连续作答")}
        </Button>
      </div>
      <ExamPaperMetadata
        dateMetadata={paper.dateMetadata}
        gradeName={paper.gradeName}
        totalScore={paper.totalScore}
      />
    </div>
    <div className={styles["answer-actions"]}>
      {unavailable ? (
        <span className={styles["paper-unavailable-label"]}>
          {trans("explicitExam.paperUnavailable", "当前试卷暂不可作答")}
        </span>
      ) : (
        <span className={styles["remaining-time"]}>
          {trans("explicitExam.remainingTime", "剩余时间")}：
          <RemainingTime deadline={deadline} onExpire={onDeadlineExpire} />
        </span>
      )}
      <Button
        disabled={unavailable}
        icon="check-circle"
        type="primary"
        onClick={onSubmit}
      >
        {trans("explicitExam.completeAnswer", "完成答题")}
      </Button>
    </div>
  </header>
);

export default StudentAnswerToolbar;

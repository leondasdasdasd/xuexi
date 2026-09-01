import { Button, Icon } from "antd";

import continuousImage from "../../../assets/矩形备份 4.png";
import singleQuestionImage from "../../../assets/矩形备份 5.png";
import { trans } from "../../../utils/i18n";
import type { AnswerMode, ExamPaperView } from "../types";
import ExamPaperMetadata from "./ExamPaperMetadata";

import styles from "../explicitExam.module.less";

type Properties = {
  errorMessage?: string;
  mode: AnswerMode;
  onBack: () => void;
  onModeChange: (mode: AnswerMode) => void;
  onStart: () => void;
  paper: ExamPaperView;
};

const StudentExamReadyPanel = ({
  errorMessage,
  mode,
  onBack,
  onModeChange,
  onStart,
  paper,
}: Properties) => {
  const duration =
    paper.deadlineTimestamp === null
      ? trans("explicitExam.unlimited", "不限时长")
      : trans("explicitExam.serverDeadline", "作答截止时间以服务器时间为准");
  const modes: Array<{
    description: string;
    image: string;
    title: string;
    value: AnswerMode;
  }> = [
    {
      description: trans(
        "explicitExam.continuousAnswerDescription",
        "所有试题同时可见，往下滚动页面答题",
      ),
      image: continuousImage,
      title: trans("explicitExam.continuousAnswer", "连续作答"),
      value: "continuous",
    },
    {
      description: trans(
        "explicitExam.singleAnswerDescription",
        "每次可见一道题，使用上一题、下一题按钮切换试题",
      ),
      image: singleQuestionImage,
      title: trans("explicitExam.singleAnswer", "单题作答"),
      value: "single-question",
    },
  ];

  return (
    <main className={styles["ready-page"]}>
      <header className={styles["ready-header"]}>
        <Button
          aria-label={trans("global.back", "返回")}
          className={styles["back-button"]}
          icon="left"
          onClick={onBack}
          type="link"
        />
        <div>
          <h1>{paper.title || trans("explicitExam.untitled", "未命名试卷")}</h1>
          <div className={styles["ready-metadata"]}>
            <ExamPaperMetadata
              dateMetadata={paper.dateMetadata}
              gradeName={paper.gradeName}
              totalScore={paper.totalScore}
            />
            <span>
              <Icon type="clock-circle" />
              {duration}
            </span>
          </div>
        </div>
      </header>
      <div className={styles["ready-layout"]}>
        <section className={styles["exam-cover"]}>
          <div>
            <p>{paper.title}</p>
            <h2>
              {trans("global.manfen", "满分")} {paper.totalScore}
            </h2>
            <strong>{duration}</strong>
          </div>
        </section>
        <aside className={styles["mode-sidebar"]}>
          <div
            aria-label={trans("explicitExam.answerMode", "作答模式")}
            className={styles["mode-options"]}
            role="radiogroup"
          >
            {modes.map((item) => (
              <button
                aria-checked={mode === item.value}
                className={`${styles["mode-card"]} ${
                  mode === item.value ? styles["mode-card-selected"] : ""
                }`}
                key={item.value}
                onClick={() => onModeChange(item.value)}
                role="radio"
                type="button"
              >
                <strong>{item.title}</strong>
                <span>{item.description}</span>
                <img alt="" src={item.image} />
              </button>
            ))}
          </div>
          {errorMessage ? (
            <p className={styles["start-error"]} role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button
            className={styles["start-button"]}
            onClick={onStart}
            type="primary"
          >
            {trans("explicitExam.start", "开始答题")}
          </Button>
        </aside>
      </div>
    </main>
  );
};

export default StudentExamReadyPanel;

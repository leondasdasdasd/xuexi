import type { ReactNode } from "react";

import { trans } from "../../../utils/i18n";

import styles from "../explicitExam.module.less";

type Properties = {
  action?: ReactNode;
  detail?: string;
  kind?: "error" | "loading" | "notice";
  title: string;
};

const ExamStatePanel = ({
  action,
  detail,
  kind = "notice",
  title,
}: Properties) => (
  <main className={styles.page}>
    <section
      aria-live="polite"
      className={`${styles["state-panel"]} ${
        kind === "error"
          ? styles.error
          : kind === "loading"
            ? styles.loading
            : styles.notice
      }`}
    >
      <h1>{title}</h1>
      {detail ? <p>{detail}</p> : null}
      {action}
      {kind === "loading" ? (
        <span className={styles["sr-only"]}>
          {trans("explicitExam.loading", "正在加载")}
        </span>
      ) : null}
    </section>
  </main>
);

export default ExamStatePanel;

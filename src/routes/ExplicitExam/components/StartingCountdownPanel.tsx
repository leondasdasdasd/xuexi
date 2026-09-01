import { useEffect, useState } from "react";

import { trans } from "../../../utils/i18n";

import styles from "../explicitExam.module.less";

type Properties = { onComplete: () => void };

const StartingCountdownPanel = ({ onComplete }: Properties) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (count === 1) onComplete();
      else setCount(count - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <main className={styles["ready-page"]}>
      <section className={styles["starting-countdown"]} aria-live="assertive">
        <span>{trans("explicitExam.countdown", "倒计时")}</span>
        <strong>{count}</strong>
      </section>
    </main>
  );
};

export default StartingCountdownPanel;

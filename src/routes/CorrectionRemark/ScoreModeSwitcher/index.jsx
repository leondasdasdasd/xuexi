import React from "react";

import styles from "./index.module.less";

// 你可以把这些模式配置抽离出来，方便多语言切换
const DEFAULT_MODES = [
  { value: 1, label: "加分", key: "bonusPoints" },
  { value: 2, label: "减分", key: "minusPoints" },
  { value: 3, label: "累加", key: "accumulation" },
  { value: 4, label: "累减", key: "subtractConsecutively" },
];

const ScoreModeSwitcher = ({
  value,
  onChange,
  modes = DEFAULT_MODES,
  trans = (key, fallback) => fallback,
}) => {
  return (
    <div className={styles.modeSwitcher}>
      {modes.map((mode) => (
        <span
          key={mode.value}
          className={styles.activeScore}
          style={value === mode.value ? { color: "#0445FC" } : {}}
          onClick={() => onChange?.(mode.value)}
        >
          {trans(`global.${mode.key}`, mode.label)}
        </span>
      ))}
    </div>
  );
};

export default ScoreModeSwitcher;

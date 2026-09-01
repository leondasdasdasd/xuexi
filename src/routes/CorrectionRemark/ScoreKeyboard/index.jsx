import React from "react";

import { trans } from "../../../utils/i18n";

import styles from "./index.module.less";

const ScoreKeyboard = (properties) => {
  const {
    value,
    onChange,
    keyboardMode = 1,
    max = 10,
    showHalf = true,
    showTotal = true,
    showZero = true,
    clearKeyboardValue,
  } = properties;

  const handleClick = (event, value_) => {
    onChange?.(event, value_);
  };

  return (
    <div className={styles.arithmetic}>
      {/* 1 - max */}
      {Array.from({ length: max }, (_, index) => index + 1).map((item) => (
        <span
          key={item}
          className={`${styles.scoreNum} ${value === item ? styles.active : ""}`}
          onClick={(event) => handleClick(event, item)}
        >
          {keyboardMode % 2 === 0 ? "-" : "+"} {item}
        </span>
      ))}

      {/* 满分 */}
      {showTotal && (
        <span
          className={`${styles.scoreNum} ${styles.scoreNumTotal} ${
            value === "满分" ? styles.active : ""
          }`}
          onClick={(event) => handleClick(event, "满分")}
        >
          {trans("global.manfen", "满分")}
        </span>
      )}

      {/* 零分 */}
      {showZero && (
        <span
          className={`${styles.scoreNum} ${styles.scoreNumZero} ${
            value === 0 ? styles.active : ""
          }`}
          onClick={(event) => handleClick(event, 0)}
        >
          {trans("global.zero", "零分")}
        </span>
      )}

      {/* 半分 */}
      {showHalf && (
        <span
          className={styles.scoreNum}
          onClick={(event) => handleClick(event, 0.5)}
        >
          .5
        </span>
      )}

      {/* 占位 */}
      <span
        className={styles.scoreNum}
        style={{ fontSize: "16px", color: "#4818C9" }}
      >
        {/* 问题卷 */}
      </span>

      {/* 清除 */}
      <span className={styles.scoreNum} onClick={clearKeyboardValue}>
        {trans("global.cleanUp", "清除")}
      </span>
    </div>
  );
};
export default ScoreKeyboard;

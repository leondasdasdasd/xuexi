import React from "react";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

const QuestionHeader = (properties) => {
  const { questionSerialNumber, questionScore, content, id } = properties;
  return (
    <div className={styles.questionHeader} id={id}>
      <div className={styles.questionSerialNumber}>{questionSerialNumber}.</div>
      <div style={{ flexGrow: 1 }}>
        <div className={styles.questionContent}>
          {questionScore ? (
            <span className={styles.scoreWarp}>
              {`（${questionScore} ${trans("global.point", "分")}）`}
            </span>
          ) : null}
          <div
            className={styles.questionContentWarp}
            dangerouslySetInnerHTML={{ __html: content }}
          ></div>
        </div>
      </div>
    </div>
  );
};
export default QuestionHeader;

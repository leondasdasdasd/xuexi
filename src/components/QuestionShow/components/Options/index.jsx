import React from "react";
import PropTypes from "prop-types";

import { getQuestionOptionDisplayKey } from "../../../../utils/questionOptionDisplay";

import styles from "./index.module.less";

const Options = ({ question }) => (
  <div className={styles["option-box"]}>
    {question.optionList && question.optionList.length > 0
      ? question.optionList.map((option, optionIndex) => (
          <div
            className={`${styles["option-list"]} ${styles["child-opt"]}`}
            key={`${getQuestionOptionDisplayKey(option, optionIndex)}-${optionIndex}`}
          >
            <span className={styles["op-list-key"]}>
              {getQuestionOptionDisplayKey(option, optionIndex)}.
            </span>
            <div
              className={styles["op-list-right"]}
              dangerouslySetInnerHTML={{ __html: option.answers }}
            ></div>
          </div>
        ))
      : undefined}
  </div>
);

Options.propTypes = {
  question: PropTypes.shape({
    optionList: PropTypes.arrayOf(
      PropTypes.shape({
        answers: PropTypes.string,
        key: PropTypes.string,
      }),
    ),
  }).isRequired,
};

export default Options;

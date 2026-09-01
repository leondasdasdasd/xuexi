import React from "react";
import PropTypes from "prop-types";

const renderDefaultAnswer = (answerHtml) => answerHtml;

const GapFillingAnswerDisplay = ({
  answerGroups,
  answerTextClassName,
  className,
  renderAnswer,
  styles,
}) => {
  const normalizedAnswerGroups = Array.isArray(answerGroups)
    ? answerGroups
    : [];

  if (normalizedAnswerGroups.length === 0) {
    return;
  }

  return (
    <span
      className={[styles["gap-filling-answer-list"], className || ""].join(" ")}
    >
      {normalizedAnswerGroups.map((group, groupIndex) => (
        <span
          key={`gap-filling-answer-group-${groupIndex + 1}`}
          className={styles["gap-filling-answer-group"]}
        >
          <span className={styles["gap-filling-answer-index"]}>
            {`${groupIndex + 1}.`}
          </span>
          <span className={styles["gap-filling-answer-content"]}>
            {group.map((answerHtml, answerIndex) => (
              <span
                key={`gap-filling-answer-group-${groupIndex + 1}-option-${
                  answerIndex + 1
                }`}
                className={styles["gap-filling-answer-option"]}
              >
                <span className={styles["gap-filling-answer-token"]}>
                  {renderAnswer(answerHtml, answerTextClassName)}
                </span>
                {answerIndex < group.length - 1 ? (
                  <span className={styles["gap-filling-answer-separator"]}>
                    {", "}
                  </span>
                ) : undefined}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
};

GapFillingAnswerDisplay.propTypes = {
  answerGroups: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string))
    .isRequired,
  answerTextClassName: PropTypes.string,
  className: PropTypes.string,
  renderAnswer: PropTypes.func,
  styles: PropTypes.object.isRequired,
};

GapFillingAnswerDisplay.defaultProps = {
  answerTextClassName: "",
  className: "",
  renderAnswer: renderDefaultAnswer,
};

export default GapFillingAnswerDisplay;

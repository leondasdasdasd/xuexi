import React from "react";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import { OPTION_INDEX_OFFSET } from "../domain/questionTaskShared";

import styles from "./QuestionCardsView.module.less";

const getSubQuestionActionButtonClassName = (disabled) =>
  `${styles["action-button"]} ${styles["action-icon-button"]} ${
    disabled ? styles["action-button-read-only"] : ""
  }`;

const SubQuestionMoveActions = ({
  canMoveDown,
  canMoveUp,
  onMoveDown,
  onMoveUp,
}) => (
  <span
    className={styles["sub-question-actions"]}
    data-question-card-interactive="true"
  >
    <button
      aria-label={trans("questionTask.moveSubQuestionUp", "上移小题")}
      className={getSubQuestionActionButtonClassName(!canMoveUp)}
      disabled={!canMoveUp}
      onClick={onMoveUp}
      title={trans("questionTask.moveSubQuestionUp", "上移小题")}
      type="button"
    >
      ↑
    </button>
    <button
      aria-label={trans("questionTask.moveSubQuestionDown", "下移小题")}
      className={getSubQuestionActionButtonClassName(!canMoveDown)}
      disabled={!canMoveDown}
      onClick={onMoveDown}
      title={trans("questionTask.moveSubQuestionDown", "下移小题")}
      type="button"
    >
      ↓
    </button>
  </span>
);

SubQuestionMoveActions.propTypes = {
  canMoveDown: PropTypes.bool.isRequired,
  canMoveUp: PropTypes.bool.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onMoveUp: PropTypes.func.isRequired,
};

export const renderSubQuestionMoveActions = ({
  handleSubQuestionMove,
  isQuestionReadOnly,
  question,
  subQuestion,
  subQuestionIndex,
}) => {
  void subQuestion;

  const subQuestions = Array.isArray(question.sonQuestionList)
    ? question.sonQuestionList
    : [];
  const questionReadOnly = isQuestionReadOnly(question.draftId);
  const canMoveUp = !questionReadOnly && subQuestionIndex > 0;
  const canMoveDown =
    !questionReadOnly &&
    subQuestionIndex < subQuestions.length - OPTION_INDEX_OFFSET;

  return (
    <SubQuestionMoveActions
      canMoveDown={canMoveDown}
      canMoveUp={canMoveUp}
      onMoveDown={(event) =>
        handleSubQuestionMove(question, subQuestionIndex, "down", event)
      }
      onMoveUp={(event) =>
        handleSubQuestionMove(question, subQuestionIndex, "up", event)
      }
    />
  );
};

export default SubQuestionMoveActions;

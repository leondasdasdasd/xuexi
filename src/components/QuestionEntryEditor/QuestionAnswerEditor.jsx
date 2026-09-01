import React from "react";
import { Radio } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import BlankAnswerEditor from "./BlankAnswerEditor";
import ChoiceOptionEditor from "./ChoiceOptionEditor";
import {
  addOptionToQuestionDraft,
  isChoiceQuestionType,
  moveOptionInQuestionDraft,
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_JUDGE,
  removeOptionFromQuestionDraft,
  toArray,
  toggleQuestionOptionAnswer,
} from "./questionEntryModel";
import { css } from "./questionEntryStyles";
import RichTextField from "./RichTextField";

const QuestionAnswerEditor = ({
  onEditorActive,
  onQuestionChange,
  onQuestionPatch,
  question,
  uploadImage,
}) => {
  if (isChoiceQuestionType(question.type)) {
    return (
      <ChoiceOptionEditor
        onAddOption={(event) => {
          if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
          }
          onQuestionPatch(addOptionToQuestionDraft);
        }}
        onEditorActive={onEditorActive}
        onMoveOption={(optionIndex, offset) =>
          onQuestionPatch((currentQuestion) =>
            moveOptionInQuestionDraft(currentQuestion, optionIndex, offset),
          )
        }
        onOptionAnswerChange={(optionKey, checked) =>
          onQuestionPatch((currentQuestion) =>
            toggleQuestionOptionAnswer(currentQuestion, optionKey, checked),
          )
        }
        onOptionChange={(optionIndex, patch) =>
          onQuestionChange({
            optionList: toArray(question.optionList).map((option, index) =>
              index === optionIndex ? { ...option, ...patch } : option,
            ),
          })
        }
        onRemoveOption={(optionIndex) =>
          onQuestionPatch((currentQuestion) =>
            removeOptionFromQuestionDraft(currentQuestion, optionIndex),
          )
        }
        question={question}
        uploadImage={uploadImage}
      />
    );
  }

  if (Number(question.type) === QUESTION_TYPE_BLANK) {
    return (
      <BlankAnswerEditor onChange={onQuestionChange} question={question} />
    );
  }

  if (Number(question.type) === QUESTION_TYPE_JUDGE) {
    return (
      <Radio.Group
        className={css.judgeGroup}
        onChange={(event) => onQuestionChange({ answer: event.target.value })}
        value={question.answer}
      >
        <Radio.Button value={true}>
          {trans("global.right", "正确")}
        </Radio.Button>
        <Radio.Button value={false}>
          {trans("global.wrong", "错误")}
        </Radio.Button>
      </Radio.Group>
    );
  }

  if (Number(question.type) === QUESTION_TYPE_ANSWER) {
    return (
      <RichTextField
        fieldId={`${question.editorId}-answer`}
        onActive={onEditorActive}
        onChange={(answer) => onQuestionChange({ answer })}
        placeholder={trans(
          "jsonInput.referenceAnswerPlaceholder",
          "请输入参考答案",
        )}
        uploadImage={uploadImage}
        value={String(question.answer || "")}
      />
    );
  }

  return false;
};

QuestionAnswerEditor.propTypes = {
  onEditorActive: PropTypes.func.isRequired,
  onQuestionChange: PropTypes.func.isRequired,
  onQuestionPatch: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  uploadImage: PropTypes.func,
};

export default QuestionAnswerEditor;

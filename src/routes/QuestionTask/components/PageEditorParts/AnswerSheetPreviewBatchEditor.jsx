import React from "react";
import { InputNumber } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../../utils/i18n";
import { getQuestionDisplayNumber } from "../../domain/questionTaskViewModel";
import {
  CompactTextField,
  formatScoreInputValue,
  getScoreInputValue,
  SCORE_INPUT_MIN,
  SCORE_INPUT_STEP,
  ScoreEditor,
} from "./AnswerEditors";
import AnswerRichTextToolbar from "./AnswerRichTextToolbar";
import {
  DUAL_COLUMN_COUNT,
  getQuestionDraftForEdit,
  getQuestionSelectHandler,
  getQuestionSelectKeyDownHandler,
  getSubQuestionDraft,
} from "./answerSheetPreviewModel";
import {
  buildSectionScorePlaceholder,
  DUAL_COLUMN_EDIT_SECTION_KEYS,
  getQuestionAnswerDraftField,
  getSectionUniformScoreText,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_COMBINATION,
  splitItemsIntoColumns,
  stopPropagation,
} from "./pageEditorData";

import styles from "./AnswerSheetPreview.module.less";

const ANALYSIS_PLACEHOLDER_KEY = "questionTask.answerSheetAnalysisPlaceholder";
const ANALYSIS_PLACEHOLDER_TEXT = "Analysis";
const ANSWER_EDITOR_BUTTON_GHOST_CLASS_NAME =
  styles["answer-editor-button-ghost"];
const ANSWER_EDITOR_BUTTON_PRIMARY_CLASS_NAME =
  styles["answer-editor-button-primary"];
const ANSWER_EDITOR_BUTTON_CLASS_NAME = styles["answer-editor-button"];
const ANSWER_EDITOR_BUTTON_SECONDARY_CLASS_NAME =
  styles["answer-editor-button-secondary"];
const ANSWER_EDITOR_COMPACT_ROW_CLASS_NAME =
  styles["answer-editor-compact-row"];
const ANSWER_EDITOR_COMPACT_ROW_BLANK_CLASS_NAME =
  styles["answer-editor-compact-row-blank"];
const ANSWER_EDITOR_COMPACT_BODY_CLASS_NAME =
  styles["answer-editor-compact-body"];

const getSectionMetaText = (section) =>
  section.rangeLabel
    ? trans("questionTask.answerSheetRangeLabel", "Questions {$range}", {
        range: section.rangeLabel,
      })
    : trans("questionTask.answerSheetQuestionCount", "{$count} questions", {
        count: section.totalCount,
      });

const AnalysisField = ({ onChange, placeholder, value }) => (
  <div className={ANSWER_EDITOR_COMPACT_ROW_CLASS_NAME}>
    <div className={styles["answer-editor-compact-meta"]}>
      {trans("questionTask.answerSheetAnalysisShort", "A")}
    </div>
    <div
      className={ANSWER_EDITOR_COMPACT_BODY_CLASS_NAME}
      role="presentation"
      onClick={stopPropagation}
    >
      <CompactTextField
        className={styles["answer-inline-input-analysis"]}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

AnalysisField.propTypes = {
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string,
};

const CombinationQuestionEditor = ({
  isAnalysisEditingEnabled,
  onQuestionSelect,
  question,
  questionDraft,
  questionNumber,
  renderAnswerControl,
  updateQuestionDraftField,
  updateSubQuestionDraftField,
}) => (
  <div className={styles["combination-editor-block"]}>
    {isAnalysisEditingEnabled ? (
      <AnalysisField
        placeholder={trans(
          "questionTask.answerSheetCombinationAnalysisPlaceholder",
          "Combination question analysis",
        )}
        value={questionDraft.analysisText}
        onChange={(value) =>
          updateQuestionDraftField(question.draftId, "analysisText", value)
        }
      />
    ) : undefined}
    <div className={styles["combination-sub-list"]}>
      {(Array.isArray(question.sonQuestionList)
        ? question.sonQuestionList
        : []
      ).map((subQuestion, subQuestionIndex) => {
        const subQuestionDraft = getSubQuestionDraft(
          questionDraft,
          subQuestion,
          subQuestionIndex,
        );
        const isBlankSubQuestion =
          Number(subQuestion && subQuestion.type) === QUESTION_TYPE_BLANK;
        const subQuestionWithParent = {
          ...subQuestion,
          draftId: question.draftId,
          parentSubQuestionIndex: subQuestionIndex,
        };

        return (
          <div
            key={`${question.draftId}-sub-${subQuestionIndex + 1}`}
            className={styles["combination-sub-item-compact"]}
            role="button"
            tabIndex="0"
            onClick={getQuestionSelectHandler(
              onQuestionSelect,
              question.draftId,
            )}
            onKeyDown={getQuestionSelectKeyDownHandler(
              onQuestionSelect,
              question.draftId,
            )}
          >
            <div
              className={`${ANSWER_EDITOR_COMPACT_ROW_CLASS_NAME} ${
                isBlankSubQuestion
                  ? ANSWER_EDITOR_COMPACT_ROW_BLANK_CLASS_NAME
                  : ""
              }`}
            >
              <div className={styles["answer-editor-compact-index"]}>
                {questionNumber}-{subQuestionIndex + 1}
              </div>
              <div
                className={`${ANSWER_EDITOR_COMPACT_BODY_CLASS_NAME} ${
                  isBlankSubQuestion
                    ? styles["answer-editor-compact-body-blank"]
                    : ""
                }`}
              >
                {renderAnswerControl(
                  subQuestionWithParent,
                  subQuestionDraft,
                  (value) =>
                    updateSubQuestionDraftField(
                      question.draftId,
                      subQuestionIndex,
                      getQuestionAnswerDraftField(subQuestion),
                      value,
                    ),
                )}
                <ScoreEditor
                  value={subQuestionDraft.scoreText}
                  onChange={(value) =>
                    updateSubQuestionDraftField(
                      question.draftId,
                      subQuestionIndex,
                      "scoreText",
                      value,
                    )
                  }
                />
              </div>
            </div>
            {isAnalysisEditingEnabled ? (
              <AnalysisField
                placeholder={trans(
                  ANALYSIS_PLACEHOLDER_KEY,
                  ANALYSIS_PLACEHOLDER_TEXT,
                )}
                value={subQuestionDraft.analysisText}
                onChange={(value) =>
                  updateSubQuestionDraftField(
                    question.draftId,
                    subQuestionIndex,
                    "analysisText",
                    value,
                  )
                }
              />
            ) : undefined}
          </div>
        );
      })}
    </div>
  </div>
);

CombinationQuestionEditor.propTypes = {
  isAnalysisEditingEnabled: PropTypes.bool.isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  questionDraft: PropTypes.object.isRequired,
  questionNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  renderAnswerControl: PropTypes.func.isRequired,
  updateQuestionDraftField: PropTypes.func.isRequired,
  updateSubQuestionDraftField: PropTypes.func.isRequired,
};

const EditableQuestionCard = ({
  isAnalysisEditingEnabled,
  onQuestionSelect,
  question,
  questionDraft,
  questionIndex,
  renderAnswerControl,
  updateQuestionDraftField,
  updateSubQuestionDraftField,
}) => {
  const questionNumber = getQuestionDisplayNumber(question, questionIndex);
  const isBlankQuestion = Number(question.type) === QUESTION_TYPE_BLANK;

  return (
    <div
      className={styles["answer-editor-card-compact"]}
      role="button"
      tabIndex="0"
      onClick={getQuestionSelectHandler(onQuestionSelect, question.draftId)}
      onKeyDown={getQuestionSelectKeyDownHandler(
        onQuestionSelect,
        question.draftId,
      )}
    >
      <div
        className={`${ANSWER_EDITOR_COMPACT_ROW_CLASS_NAME} ${
          isBlankQuestion ? ANSWER_EDITOR_COMPACT_ROW_BLANK_CLASS_NAME : ""
        }`}
      >
        <div className={styles["answer-editor-compact-index"]}>
          {questionNumber}
        </div>
        <div
          className={`${ANSWER_EDITOR_COMPACT_BODY_CLASS_NAME} ${
            isBlankQuestion ? styles["answer-editor-compact-body-blank"] : ""
          }`}
        >
          {Number(question.type) === QUESTION_TYPE_COMBINATION ? (
            <div className={styles["answer-editor-compact-marker"]}>
              {trans("questionTask.answerSheetCombinationMarker", "Combined")}
            </div>
          ) : (
            renderAnswerControl(question, questionDraft, (value) =>
              updateQuestionDraftField(
                question.draftId,
                getQuestionAnswerDraftField(question),
                value,
              ),
            )
          )}
          <ScoreEditor
            readOnly={Number(question.type) === QUESTION_TYPE_COMBINATION}
            value={questionDraft.scoreText}
            onChange={(value) =>
              updateQuestionDraftField(question.draftId, "scoreText", value)
            }
          />
        </div>
      </div>
      {Number(question.type) === QUESTION_TYPE_COMBINATION ? (
        <CombinationQuestionEditor
          isAnalysisEditingEnabled={isAnalysisEditingEnabled}
          onQuestionSelect={onQuestionSelect}
          question={question}
          questionDraft={questionDraft}
          questionNumber={questionNumber}
          renderAnswerControl={renderAnswerControl}
          updateQuestionDraftField={updateQuestionDraftField}
          updateSubQuestionDraftField={updateSubQuestionDraftField}
        />
      ) : isAnalysisEditingEnabled ? (
        <AnalysisField
          placeholder={trans(
            ANALYSIS_PLACEHOLDER_KEY,
            ANALYSIS_PLACEHOLDER_TEXT,
          )}
          value={questionDraft.analysisText}
          onChange={(value) =>
            updateQuestionDraftField(question.draftId, "analysisText", value)
          }
        />
      ) : undefined}
    </div>
  );
};

EditableQuestionCard.propTypes = {
  isAnalysisEditingEnabled: PropTypes.bool.isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  questionDraft: PropTypes.object.isRequired,
  questionIndex: PropTypes.number.isRequired,
  renderAnswerControl: PropTypes.func.isRequired,
  updateQuestionDraftField: PropTypes.func.isRequired,
  updateSubQuestionDraftField: PropTypes.func.isRequired,
};

const AnswerSheetPreviewBatchEditor = ({
  applySectionScore,
  activeEditorController,
  draftMap,
  editableSections,
  handleCancelBatchEditing,
  handleSaveBatchEdits,
  isAnalysisEditingEnabled,
  onQuestionSelect,
  onToggleAnalysisEditing,
  onBackToPreview,
  renderAnswerControl,
  updateQuestionDraftField,
  updateSubQuestionDraftField,
}) => (
  <div className={styles["answer-sheet-preview"]}>
    <div className={styles["answer-sheet-header"]}>
      <div className={styles["answer-sheet-title"]}>
        {trans("questionTask.answerSheetBatchEditTitle", "Batch Edit Answers")}
      </div>
      <div className={styles["answer-editor-actions"]}>
        <button
          className={`${ANSWER_EDITOR_BUTTON_CLASS_NAME} ${
            isAnalysisEditingEnabled
              ? ANSWER_EDITOR_BUTTON_SECONDARY_CLASS_NAME
              : ANSWER_EDITOR_BUTTON_GHOST_CLASS_NAME
          }`}
          type="button"
          onClick={onToggleAnalysisEditing}
        >
          {trans(
            isAnalysisEditingEnabled
              ? "questionTask.answerSheetAnalysisToggleOn"
              : "questionTask.answerSheetAnalysisToggleOff",
            isAnalysisEditingEnabled ? "Analysis On" : "Analysis Off",
          )}
        </button>
        <button
          className={`${ANSWER_EDITOR_BUTTON_CLASS_NAME} ${ANSWER_EDITOR_BUTTON_GHOST_CLASS_NAME}`}
          type="button"
          onClick={onBackToPreview}
        >
          {trans("questionTask.answerSheetBackToPreview", "Back to Preview")}
        </button>
        <button
          className={`${ANSWER_EDITOR_BUTTON_CLASS_NAME} ${ANSWER_EDITOR_BUTTON_GHOST_CLASS_NAME}`}
          type="button"
          onClick={handleCancelBatchEditing}
        >
          {trans("questionTask.answerSheetCancelChanges", "Discard Changes")}
        </button>
        <button
          className={`${ANSWER_EDITOR_BUTTON_CLASS_NAME} ${ANSWER_EDITOR_BUTTON_PRIMARY_CLASS_NAME}`}
          type="button"
          onClick={handleSaveBatchEdits}
        >
          {trans("questionTask.answerSheetSaveAnswers", "Save Answers")}
        </button>
      </div>
    </div>
    <AnswerRichTextToolbar activeEditorController={activeEditorController} />
    <div className={styles["answer-section-list"]}>
      {editableSections.map((section) => {
        const isDualColumnSection = DUAL_COLUMN_EDIT_SECTION_KEYS.includes(
          section.sectionTypeKey,
        );
        const sectionQuestions = section.items.map((item) => item.question);
        const isCombinationSection = sectionQuestions.every(
          (question) => Number(question.type) === QUESTION_TYPE_COMBINATION,
        );
        const sectionItemEntries = section.items.map((item, questionIndex) => ({
          ...item,
          question: item.question,
          questionIndex,
        }));
        const sectionColumns = isDualColumnSection
          ? splitItemsIntoColumns(sectionItemEntries, DUAL_COLUMN_COUNT)
          : [sectionItemEntries];

        return (
          <section
            key={section.key}
            className={`${styles["answer-section"]} ${
              isDualColumnSection
                ? styles["answer-section-dual-column"]
                : styles["answer-section-single-column"]
            }`}
          >
            <div className={styles["answer-section-header"]}>
              <div className={styles["answer-section-title"]}>
                {section.label}
              </div>
              <div className={styles["answer-section-header-aside"]}>
                <div className={styles["answer-section-meta"]}>
                  {getSectionMetaText(section)}
                </div>
                {isCombinationSection ? undefined : (
                  <span className={styles["answer-section-score-setter"]}>
                    <span>
                      {trans("questionTask.answerSheetPerQuestion", "Each")}
                    </span>
                    <InputNumber
                      formatter={formatScoreInputValue}
                      min={SCORE_INPUT_MIN}
                      placeholder={buildSectionScorePlaceholder(
                        sectionQuestions,
                        draftMap,
                      )}
                      step={SCORE_INPUT_STEP}
                      value={getSectionUniformScoreText(
                        sectionQuestions,
                        draftMap,
                      )}
                      onChange={(value) =>
                        applySectionScore(
                          sectionQuestions,
                          getScoreInputValue(value),
                        )
                      }
                    />
                    <span>
                      {trans("questionTask.answerSheetPointUnit", "pts")}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div className={styles["answer-editor-list"]}>
              {sectionColumns.map((columnItems, columnIndex) => (
                <div
                  key={`${section.key}-column-${columnIndex + 1}`}
                  className={styles["answer-editor-column"]}
                >
                  {columnItems.map(({ question, questionIndex }) => (
                    <EditableQuestionCard
                      key={question.draftId}
                      isAnalysisEditingEnabled={isAnalysisEditingEnabled}
                      onQuestionSelect={onQuestionSelect}
                      question={question}
                      questionDraft={getQuestionDraftForEdit(
                        draftMap,
                        question,
                      )}
                      questionIndex={questionIndex}
                      renderAnswerControl={renderAnswerControl}
                      updateQuestionDraftField={updateQuestionDraftField}
                      updateSubQuestionDraftField={updateSubQuestionDraftField}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  </div>
);

AnswerSheetPreviewBatchEditor.propTypes = {
  applySectionScore: PropTypes.func.isRequired,
  activeEditorController: PropTypes.shape({ editor: PropTypes.object }),
  draftMap: PropTypes.object.isRequired,
  editableSections: PropTypes.arrayOf(PropTypes.object).isRequired,
  handleCancelBatchEditing: PropTypes.func.isRequired,
  handleSaveBatchEdits: PropTypes.func.isRequired,
  isAnalysisEditingEnabled: PropTypes.bool.isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
  onToggleAnalysisEditing: PropTypes.func.isRequired,
  onBackToPreview: PropTypes.func.isRequired,
  renderAnswerControl: PropTypes.func.isRequired,
  updateQuestionDraftField: PropTypes.func.isRequired,
  updateSubQuestionDraftField: PropTypes.func.isRequired,
};

AnswerSheetPreviewBatchEditor.defaultProps = {
  activeEditorController: null,
};

export default AnswerSheetPreviewBatchEditor;

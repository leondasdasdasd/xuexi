import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "antd";
import PropTypes from "prop-types";

import {
  buildSharedToolbarController,
  isSameSharedToolbarState,
} from "../../../../components/SlateRichEditor/sharedToolbarState";
import { trans } from "../../../../utils/i18n";
import { ChoiceAnswerEditor, JudgeAnswerEditor } from "./AnswerEditors";
import AnswerRichTextField from "./AnswerRichTextField";
import AnswerSheetPreviewBatchEditor from "./AnswerSheetPreviewBatchEditor";
import {
  buildCombinationDraftWithScoreSum,
  buildDraftWithBlankAnswerGroups,
  buildSectionScoreDraftMap,
  countAnswerSections,
  getDraftBlankAnswerGroups,
  getDraftById,
  removeAnswerAtIndex,
  setDraftById,
  setDraftFieldValue,
} from "./answerSheetPreviewModel";
import AnswerSheetPreviewReadOnly from "./AnswerSheetPreviewReadOnly";
import {
  buildAnswerSections,
  buildEditableAnswerSections,
  buildQuestionReferencePatch,
  buildReferenceDraftMap,
  normalizeBlankAnswerDraftGroups,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_JUDGE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
} from "./pageEditorData";

import styles from "./AnswerSheetPreview.module.less";

const ANSWER_EDITOR_FIELD_COMPACT_CLASS_NAME =
  styles["answer-editor-field-compact"];
const ANSWER_MINI_BUTTON_CLASS_NAME = styles["answer-mini-button"];
const ANSWER_MINI_ICON_BUTTON_CLASS_NAME = styles["answer-mini-icon-button"];
const REMOVE_BLANK_ACCEPT_ANSWER_SYMBOL = "×";
const ADD_BLANK_ACCEPT_ANSWER_BUTTON_TEXT = trans(
  "questionTask.addBlankAcceptAnswerShort",
  "添答案",
);
const BLANK_ACCEPTED_ANSWER_SEPARATOR = trans(
  "questionTask.blankAcceptAnswerSeparator",
  "or",
);
const REMOVE_BLANK_ACCEPT_ANSWER_TEXT = trans(
  "questionTask.removeBlankAcceptAnswer",
  "Delete this accepted answer",
);
const ADD_BLANK_ACCEPT_ANSWER_TEXT = trans(
  "questionTask.addBlankAcceptAnswer",
  "Add accepted answer",
);
const DELETE_CURRENT_BLANK_TEXT = trans(
  "questionTask.answerSheetDeleteCurrentBlank",
  "Delete current blank",
);
const ADD_BLANK_ARIA_TEXT = trans(
  "questionTask.answerSheetAddBlankAria",
  "Add one blank",
);
const ADD_BLANK_BUTTON_TEXT = trans("questionTask.addBlankShort", "添空");

const getAnswerEditorFieldId = (question, suffix) =>
  [
    question.draftId,
    Number.isFinite(Number(question.parentSubQuestionIndex))
      ? `sub-${Number(question.parentSubQuestionIndex) + 1}`
      : "question",
    suffix,
  ].join("-");

const AnswerSheetPreview = ({
  onApplyReferenceEdits,
  onQuestionSelect,
  questions,
}) => {
  const answerSections = useMemo(
    () => buildAnswerSections(questions),
    [questions],
  );
  const editableSections = useMemo(
    () => buildEditableAnswerSections(questions),
    [questions],
  );
  const answerCount = useMemo(
    () => countAnswerSections(answerSections),
    [answerSections],
  );
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [isAnalysisEditingEnabled, setIsAnalysisEditingEnabled] =
    useState(false);
  const [isBatchDraftDirty, setIsBatchDraftDirty] = useState(false);
  const [draftMap, setDraftMap] = useState(() =>
    buildReferenceDraftMap(questions),
  );
  const [activeEditorController, setActiveEditorController] = useState(null);
  const [answerEditorStructureVersion, setAnswerEditorStructureVersion] =
    useState(0);

  useEffect(() => {
    if (!isBatchEditing || !isBatchDraftDirty) {
      setDraftMap(buildReferenceDraftMap(questions));
      setIsBatchDraftDirty(false);
      setActiveEditorController(null);
      setAnswerEditorStructureVersion((currentVersion) => currentVersion + 1);
    }
  }, [isBatchDraftDirty, isBatchEditing, questions]);

  const handleStartBatchEditing = useCallback(() => {
    setDraftMap(buildReferenceDraftMap(questions));
    setIsBatchDraftDirty(false);
    setIsBatchEditing(true);
    setActiveEditorController(null);
  }, [questions]);

  const handleCancelBatchEditing = useCallback(() => {
    setDraftMap(buildReferenceDraftMap(questions));
    setIsBatchDraftDirty(false);
    setIsBatchEditing(false);
    setActiveEditorController(null);
  }, [questions]);

  const updateQuestionDraftField = useCallback((draftId, field, value) => {
    setIsBatchDraftDirty(true);
    setDraftMap((currentDraftMap) =>
      setDraftById(
        currentDraftMap,
        draftId,
        setDraftFieldValue(
          getDraftById(currentDraftMap, draftId),
          field,
          value,
        ),
      ),
    );
  }, []);

  const updateSubQuestionDraftField = useCallback(
    (draftId, subQuestionIndex, field, value) => {
      setIsBatchDraftDirty(true);
      setDraftMap((currentDraftMap) => {
        const currentDraft = getDraftById(currentDraftMap, draftId);
        const nextSubQuestionDrafts = Array.isArray(
          currentDraft && currentDraft.subQuestionDrafts,
        )
          ? currentDraft.subQuestionDrafts.map(
              (subQuestionDraft, currentIndex) =>
                currentIndex === subQuestionIndex
                  ? setDraftFieldValue(subQuestionDraft, field, value)
                  : subQuestionDraft,
            )
          : [];
        const nextDraft =
          field === "scoreText"
            ? buildCombinationDraftWithScoreSum(
                currentDraft,
                nextSubQuestionDrafts,
              )
            : {
                ...currentDraft,
                subQuestionDrafts: nextSubQuestionDrafts,
              };

        return setDraftById(currentDraftMap, draftId, nextDraft);
      });
    },
    [],
  );

  const applySectionScore = useCallback((sectionQuestions, value) => {
    setIsBatchDraftDirty(true);
    setDraftMap((currentDraftMap) =>
      buildSectionScoreDraftMap(currentDraftMap, sectionQuestions, value),
    );
  }, []);

  const updateBlankAnswerGroups = useCallback(
    (draftId, subQuestionIndex, getNextBlankAnswerGroups) => {
      setIsBatchDraftDirty(true);
      setDraftMap((currentDraftMap) => {
        const currentDraft = getDraftById(currentDraftMap, draftId);
        const currentBlankAnswerGroups = getDraftBlankAnswerGroups(
          currentDraft,
          subQuestionIndex,
        );
        const nextBlankAnswerGroups = normalizeBlankAnswerDraftGroups(
          getNextBlankAnswerGroups(currentBlankAnswerGroups),
        );

        return setDraftById(
          currentDraftMap,
          draftId,
          buildDraftWithBlankAnswerGroups(
            currentDraft,
            subQuestionIndex,
            nextBlankAnswerGroups,
          ),
        );
      });
    },
    [],
  );

  const rebuildAnswerEditors = useCallback(() => {
    // 结构变化会改变后续答案索引，统一重建编辑器，避免 Slate 实例复用到错误答案。
    setActiveEditorController(null);
    setAnswerEditorStructureVersion((currentVersion) => currentVersion + 1);
  }, []);

  const handleAnswerEditorActive = useCallback((editorController) => {
    const nextController = buildSharedToolbarController(editorController);
    setActiveEditorController((currentController) =>
      isSameSharedToolbarState(currentController, nextController)
        ? currentController
        : nextController,
    );
  }, []);

  const removeBlankAnswer = useCallback(
    (draftId, subQuestionIndex, blankIndex, answerIndex) => {
      updateBlankAnswerGroups(
        draftId,
        subQuestionIndex,
        (currentBlankAnswerGroups) =>
          currentBlankAnswerGroups.map((group, currentBlankIndex) => {
            if (currentBlankIndex !== blankIndex) {
              return group;
            }

            if ((group.answers || []).length <= 1) {
              return group;
            }

            return {
              ...group,
              answers: removeAnswerAtIndex(group.answers || [], answerIndex),
            };
          }),
      );
      rebuildAnswerEditors();
    },
    [rebuildAnswerEditors, updateBlankAnswerGroups],
  );

  const handleSaveBatchEdits = useCallback(() => {
    const patches = (Array.isArray(questions) ? questions : [])
      .map((question) => ({
        draftId: question.draftId,
        patch: buildQuestionReferencePatch(
          question,
          getDraftById(draftMap, question.draftId),
        ),
      }))
      .filter((item) => Object.keys(item.patch).length);

    onApplyReferenceEdits(patches);
    setIsBatchDraftDirty(false);
    setIsBatchEditing(false);
  }, [draftMap, onApplyReferenceEdits, questions]);

  const renderAnswerControl = useCallback(
    (question, questionDraft, onChange) => {
      const type = Number(question && question.type);
      const answerText = questionDraft.answerText;

      if (
        type === QUESTION_TYPE_CHOICE ||
        type === QUESTION_TYPE_MULTIPLE_CHOICE
      ) {
        return (
          <div className={ANSWER_EDITOR_FIELD_COMPACT_CLASS_NAME}>
            <ChoiceAnswerEditor
              isMultiple={type === QUESTION_TYPE_MULTIPLE_CHOICE}
              options={question.optionList}
              value={answerText}
              onChange={onChange}
            />
          </div>
        );
      }

      if (type === QUESTION_TYPE_BLANK) {
        const blankAnswerGroups = normalizeBlankAnswerDraftGroups(
          questionDraft.blankAnswerGroups,
        );
        const addBlankGroup = (event) => {
          void event;
          updateBlankAnswerGroups(
            question.draftId,
            question.parentSubQuestionIndex,
            (currentBlankAnswerGroups) => [
              ...currentBlankAnswerGroups,
              { answers: [""] },
            ],
          );
        };

        return (
          <div className={ANSWER_EDITOR_FIELD_COMPACT_CLASS_NAME}>
            <div className={styles["answer-blank-list"]}>
              {blankAnswerGroups.map((group, blankIndex) => (
                <div
                  key={`blank-group-${blankIndex + 1}`}
                  className={styles["answer-blank-group-editor"]}
                >
                  <div className={styles["answer-blank-group-index"]}>
                    {trans("questionTask.blankIndex", "Blank {$index}", {
                      index: blankIndex + 1,
                    })}
                  </div>
                  <div className={styles["answer-blank-group-body"]}>
                    <div className={styles["answer-blank-answer-list"]}>
                      {(Array.isArray(group.answers) ? group.answers : []).map(
                        (answer, answerIndex) => (
                          <div
                            key={`blank-group-${blankIndex + 1}-answer-${
                              answerIndex + 1
                            }`}
                            className={styles["answer-blank-answer-row"]}
                          >
                            <AnswerRichTextField
                              ariaLabel={trans(
                                "questionTask.blankAcceptAnswerIndex",
                                "Accepted answer {$index}",
                                { index: answerIndex + 1 },
                              )}
                              fieldId={`${answerEditorStructureVersion}-${getAnswerEditorFieldId(
                                question,
                                `blank-${blankIndex + 1}-answer-${answerIndex + 1}`,
                              )}`}
                              onActive={handleAnswerEditorActive}
                              placeholder={trans(
                                "questionTask.blankAcceptAnswerIndex",
                                "Accepted answer {$index}",
                                { index: answerIndex + 1 },
                              )}
                              value={answer}
                              onChange={(nextAnswerValue) => {
                                updateBlankAnswerGroups(
                                  question.draftId,
                                  question.parentSubQuestionIndex,
                                  (currentBlankAnswerGroups) =>
                                    currentBlankAnswerGroups.map(
                                      (currentGroup, currentBlankIndex) =>
                                        currentBlankIndex === blankIndex
                                          ? {
                                              ...currentGroup,
                                              answers: (
                                                currentGroup.answers || []
                                              ).map(
                                                (
                                                  currentAnswer,
                                                  currentAnswerIndex,
                                                ) =>
                                                  currentAnswerIndex ===
                                                  answerIndex
                                                    ? nextAnswerValue
                                                    : currentAnswer,
                                              ),
                                            }
                                          : currentGroup,
                                    ),
                                );
                              }}
                            />
                            {answerIndex < (group.answers || []).length - 1 ? (
                              <span
                                className={
                                  styles["answer-blank-answer-separator"]
                                }
                              >
                                {BLANK_ACCEPTED_ANSWER_SEPARATOR}
                              </span>
                            ) : undefined}
                            <button
                              aria-label={REMOVE_BLANK_ACCEPT_ANSWER_TEXT}
                              className={ANSWER_MINI_ICON_BUTTON_CLASS_NAME}
                              disabled={(group.answers || []).length <= 1}
                              title={REMOVE_BLANK_ACCEPT_ANSWER_TEXT}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeBlankAnswer(
                                  question.draftId,
                                  question.parentSubQuestionIndex,
                                  blankIndex,
                                  answerIndex,
                                );
                              }}
                            >
                              {REMOVE_BLANK_ACCEPT_ANSWER_SYMBOL}
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                    <div className={styles["answer-blank-group-actions"]}>
                      <button
                        aria-label={ADD_BLANK_ACCEPT_ANSWER_TEXT}
                        className={ANSWER_MINI_BUTTON_CLASS_NAME}
                        title={ADD_BLANK_ACCEPT_ANSWER_TEXT}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          rebuildAnswerEditors();
                          updateBlankAnswerGroups(
                            question.draftId,
                            question.parentSubQuestionIndex,
                            (currentBlankAnswerGroups) =>
                              currentBlankAnswerGroups.map(
                                (currentGroup, currentBlankIndex) =>
                                  currentBlankIndex === blankIndex
                                    ? {
                                        ...currentGroup,
                                        answers: [
                                          ...(currentGroup.answers || []),
                                          "",
                                        ],
                                      }
                                    : currentGroup,
                              ),
                          );
                        }}
                      >
                        {ADD_BLANK_ACCEPT_ANSWER_BUTTON_TEXT}
                      </button>
                      <button
                        aria-label={DELETE_CURRENT_BLANK_TEXT}
                        className={ANSWER_MINI_ICON_BUTTON_CLASS_NAME}
                        disabled={blankAnswerGroups.length <= 1}
                        title={DELETE_CURRENT_BLANK_TEXT}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          rebuildAnswerEditors();
                          updateBlankAnswerGroups(
                            question.draftId,
                            question.parentSubQuestionIndex,
                            (currentBlankAnswerGroups) =>
                              currentBlankAnswerGroups.filter(
                                (item, currentBlankIndex) => {
                                  void item;
                                  return currentBlankIndex !== blankIndex;
                                },
                              ),
                          );
                        }}
                      >
                        <Icon type="delete" />
                      </button>
                      <button
                        aria-label={ADD_BLANK_ARIA_TEXT}
                        className={ANSWER_MINI_BUTTON_CLASS_NAME}
                        title={ADD_BLANK_ARIA_TEXT}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          addBlankGroup(event);
                        }}
                      >
                        {ADD_BLANK_BUTTON_TEXT}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (type === QUESTION_TYPE_JUDGE) {
        return (
          <div className={ANSWER_EDITOR_FIELD_COMPACT_CLASS_NAME}>
            <JudgeAnswerEditor value={answerText} onChange={onChange} />
          </div>
        );
      }

      return (
        <AnswerRichTextField
          ariaLabel={trans(
            "questionTask.answerSheetAnswerPlaceholder",
            "Answer",
          )}
          fieldId={`${answerEditorStructureVersion}-${getAnswerEditorFieldId(
            question,
            "answer",
          )}`}
          onActive={handleAnswerEditorActive}
          placeholder={trans(
            "questionTask.answerSheetAnswerPlaceholder",
            "Answer",
          )}
          value={questionDraft.answerHtml}
          onChange={onChange}
        />
      );
    },
    [
      answerEditorStructureVersion,
      handleAnswerEditorActive,
      rebuildAnswerEditors,
      removeBlankAnswer,
      updateBlankAnswerGroups,
    ],
  );

  const handleBackToPreview = useCallback((event) => {
    void event;
    setIsBatchEditing(false);
    setActiveEditorController(null);
  }, []);

  const handleToggleAnalysisEditing = useCallback((event) => {
    void event;
    setIsAnalysisEditingEnabled((current) => !current);
  }, []);

  return isBatchEditing ? (
    <AnswerSheetPreviewBatchEditor
      applySectionScore={applySectionScore}
      activeEditorController={activeEditorController}
      draftMap={draftMap}
      editableSections={editableSections}
      handleCancelBatchEditing={handleCancelBatchEditing}
      handleSaveBatchEdits={handleSaveBatchEdits}
      isAnalysisEditingEnabled={isAnalysisEditingEnabled}
      onBackToPreview={handleBackToPreview}
      onQuestionSelect={onQuestionSelect}
      onToggleAnalysisEditing={handleToggleAnalysisEditing}
      renderAnswerControl={renderAnswerControl}
      updateQuestionDraftField={updateQuestionDraftField}
      updateSubQuestionDraftField={updateSubQuestionDraftField}
    />
  ) : (
    <AnswerSheetPreviewReadOnly
      answerCount={answerCount}
      answerSections={answerSections}
      onQuestionSelect={onQuestionSelect}
      onStartBatchEditing={handleStartBatchEditing}
    />
  );
};

AnswerSheetPreview.propTypes = {
  onApplyReferenceEdits: PropTypes.func.isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
  questions: PropTypes.arrayOf(PropTypes.object),
};

AnswerSheetPreview.defaultProps = {
  questions: [],
};

export default AnswerSheetPreview;

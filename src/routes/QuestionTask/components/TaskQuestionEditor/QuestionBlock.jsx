import React, { useState } from "react";
import { Button, Checkbox, Icon, Radio, Select } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../../utils/i18n";
import { CHILD_TYPE_OPTIONS, css, MIN_OPTION_COUNT } from "./constants";
import {
  FieldLabel,
  MetaEditor,
  QuestionTypeSelect,
  RichTextField,
} from "./EditorFields";
import {
  getAnswerFieldExtra,
  getAnswerFieldTitle,
  getPathLabel,
  getQuestionStemLabel,
} from "./helpers";
import {
  addOptionToQuestionDraft,
  createBlankAnswerDraft,
  createEmptyQuestionDraft,
  isChoiceQuestionType,
  isRequiredChoiceAnswerType,
  moveOptionInQuestionDraft,
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_JUDGE,
  QUESTION_TYPE_OPTIONS,
  QUESTION_TYPE_SINGLE_VOTE,
  removeOptionFromQuestionDraft,
  resetQuestionDraftByType,
  toArray,
  toggleQuestionOptionAnswer,
} from "./questionEditorModel";

const BlankAnswerEditor = ({
  onChange,
  onEditorActive,
  question,
  uploadImage,
}) => {
  const gapFillingAnswer = question.gapFillingAnswer || {};
  const answerGroups = toArray(gapFillingAnswer.answerGroups);

  const updateGroups = (nextGroups) => {
    onChange({
      gapFillingAnswer: {
        ...gapFillingAnswer,
        answerGroups: nextGroups,
      },
    });
  };

  const updateGroupAnswers = (groupIndex, nextAnswers) => {
    updateGroups(
      answerGroups.map((group, currentIndex) =>
        currentIndex === groupIndex
          ? {
              ...group,
              answers: nextAnswers,
            }
          : group,
      ),
    );
  };

  return (
    <div className={css.blankEditor}>
      <Checkbox
        checked={!gapFillingAnswer.isOrder}
        onChange={(event) =>
          onChange({
            gapFillingAnswer: {
              ...gapFillingAnswer,
              isOrder: !event.target.checked,
            },
          })
        }
      >
        {trans(
          "questionTask.blankAnswerOrderToggle",
          "允许学生答案与参考答案顺序不一致",
        )}
      </Checkbox>
      {answerGroups.map((group, groupIndex) => (
        <div className={css.blankGroup} key={group.editorId}>
          <div className={css.blankGroupHeader}>
            <span>
              {trans("questionTask.blankIndex", "Blank {$index}", {
                index: groupIndex + 1,
              })}
            </span>
            {answerGroups.length > 1 ? (
              <Button
                size="small"
                type="link"
                onClick={(event) => {
                  event.preventDefault();
                  updateGroups(
                    answerGroups.filter((groupItem, index) => {
                      void groupItem;
                      return index !== groupIndex;
                    }),
                  );
                }}
              >
                {trans("global.delete", "删除")}
              </Button>
            ) : undefined}
          </div>
          <div className={css.blankAnswerList}>
            {(toArray(group.answers).length > 0
              ? toArray(group.answers)
              : [{ content: "", editorId: `${group.editorId}-answer-0` }]
            ).map((answer, answerIndex, visibleAnswers) =>
              (() => {
                const answerEditorKey =
                  answer.editorId || `${group.editorId}-${answerIndex}`;
                const answerFieldId = `${answerEditorKey}-content`;

                return (
                  <div className={css.blankAnswerRow} key={answerEditorKey}>
                    <div className={css.blankAnswerMeta}>
                      {trans(
                        "questionTask.blankAcceptAnswerIndex",
                        "可接受答案 {$index}",
                        {
                          index: answerIndex + 1,
                        },
                      )}
                    </div>
                    <div className={css.blankAnswerEditor}>
                      <RichTextField
                        fieldId={answerFieldId}
                        onActive={onEditorActive}
                        onChange={(content) =>
                          updateGroupAnswers(
                            groupIndex,
                            visibleAnswers.map((currentAnswer, currentIndex) =>
                              currentIndex === answerIndex
                                ? {
                                    ...currentAnswer,
                                    content,
                                    editorId:
                                      currentAnswer.editorId ||
                                      `${group.editorId}-answer-${currentIndex}`,
                                  }
                                : currentAnswer,
                            ),
                          )
                        }
                        placeholder={trans(
                          "questionTask.blankAnswersPlaceholder",
                          "支持图文和公式；同一空可录入多个可接受答案",
                        )}
                        uploadImage={uploadImage}
                        value={answer.content}
                      />
                    </div>
                    <div className={css.blankAnswerActions}>
                      <Button
                        icon="delete"
                        size="small"
                        title={trans(
                          "questionTask.removeBlankAcceptAnswer",
                          "删除该可接受答案",
                        )}
                        disabled={visibleAnswers.length <= 1}
                        onClick={(event) => {
                          event.preventDefault();
                          updateGroupAnswers(
                            groupIndex,
                            visibleAnswers.filter(
                              (groupAnswer, currentIndex) =>
                                currentIndex !== answerIndex && !!groupAnswer,
                            ),
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              })(),
            )}
          </div>
          <Button
            className={css.inlineAddButton}
            onClick={(event) => {
              event.preventDefault();
              updateGroupAnswers(groupIndex, [
                ...toArray(group.answers),
                createBlankAnswerDraft(""),
              ]);
            }}
          >
            <Icon type="plus" />
            {trans("questionTask.addBlankAcceptAnswer", "添加可接受答案")}
          </Button>
        </div>
      ))}
      <Button
        className={css.inlineAddButton}
        onClick={(event) => {
          event.preventDefault();
          updateGroups([
            ...answerGroups,
            {
              answers: [
                { content: "", editorId: `${question.editorId}-blank-new` },
              ],
              editorId: `${question.editorId}-blank-${answerGroups.length}`,
            },
          ]);
        }}
      >
        <Icon type="plus" />
        {trans("jsonInput.addBlank", "添加填空")}
      </Button>
    </div>
  );
};

BlankAnswerEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  onEditorActive: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  uploadImage: PropTypes.func,
};

const ChoiceOptionEditor = ({
  onAddOption,
  onEditorActive,
  onMoveOption,
  onOptionAnswerChange,
  onOptionChange,
  onRemoveOption,
  question,
  uploadImage,
}) => (
  <div className={css.optionList}>
    {toArray(question.optionList).map((option, optionIndex) => {
      const checked = String(question.answer || "").includes(option.key);
      const isSingleAnswer = [
        QUESTION_TYPE_CHOICE,
        QUESTION_TYPE_SINGLE_VOTE,
      ].includes(Number(question.type));
      const canRemove = question.optionList.length > MIN_OPTION_COUNT;

      return (
        <div className={css.optionRow} key={option.editorId}>
          <button
            aria-label={trans(
              "questionTask.setOptionAsAnswer",
              "设置 {$key} 为答案",
              {
                key: option.key,
              },
            )}
            className={`${css.answerToggle} ${checked ? css.answerToggleChecked : ""}`}
            onClick={(event) => {
              event.preventDefault();
              onOptionAnswerChange(option.key, !checked);
            }}
            title={trans(
              isRequiredChoiceAnswerType(question.type)
                ? "questionTask.setCorrectAnswer"
                : "questionTask.setDefaultVoteOption",
              isRequiredChoiceAnswerType(question.type)
                ? "设置正确答案"
                : "设置投票默认选项",
            )}
            type="button"
          >
            {isSingleAnswer ? (
              checked ? (
                <span className={css.radioDot} />
              ) : undefined
            ) : checked ? (
              <Icon type="check" />
            ) : undefined}
          </button>
          <div className={css.optionKey}>{option.key}</div>
          <div className={css.optionEditor}>
            <RichTextField
              fieldId={`${option.editorId}-answers`}
              onActive={onEditorActive}
              onChange={(answers) => onOptionChange(optionIndex, { answers })}
              placeholder={trans(
                "singleInput.placeholderTxt",
                "请输入选项内容",
              )}
              uploadImage={uploadImage}
              value={option.answers}
            />
          </div>
          <div className={css.optionActions}>
            <Button
              disabled={optionIndex === 0}
              icon="arrow-up"
              size="small"
              title={trans("questionTask.moveOptionUp", "上移选项")}
              onClick={(event) => {
                event.preventDefault();
                onMoveOption(optionIndex, -1);
              }}
            />
            <Button
              disabled={optionIndex === question.optionList.length - 1}
              icon="arrow-down"
              size="small"
              title={trans("questionTask.moveOptionDown", "下移选项")}
              onClick={(event) => {
                event.preventDefault();
                onMoveOption(optionIndex, 1);
              }}
            />
            <Button
              disabled={!canRemove}
              icon="delete"
              size="small"
              title={trans("questionTask.removeOption", "删除选项")}
              onClick={(event) => {
                event.preventDefault();
                onRemoveOption(optionIndex);
              }}
            />
          </div>
        </div>
      );
    })}
    <Button className={css.inlineAddButton} onClick={onAddOption}>
      <Icon type="plus" />
      {trans("singleInput.addOption", "添加更多选项")}
    </Button>
  </div>
);

ChoiceOptionEditor.propTypes = {
  onAddOption: PropTypes.func.isRequired,
  onEditorActive: PropTypes.func.isRequired,
  onMoveOption: PropTypes.func.isRequired,
  onOptionAnswerChange: PropTypes.func.isRequired,
  onOptionChange: PropTypes.func.isRequired,
  onRemoveOption: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  uploadImage: PropTypes.func,
};

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
      <BlankAnswerEditor
        onChange={onQuestionChange}
        onEditorActive={onEditorActive}
        question={question}
        uploadImage={uploadImage}
      />
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

const ChildQuestionActions = ({ onAddChild }) => {
  const [childType, setChildType] = useState(QUESTION_TYPE_CHOICE);

  return (
    <div className={css.childActions}>
      <Select
        className={css.childTypeSelect}
        onChange={setChildType}
        value={childType}
      >
        {CHILD_TYPE_OPTIONS.map((item) => (
          <Select.Option key={item.value} value={item.value}>
            {item.label}
          </Select.Option>
        ))}
      </Select>
      <Button
        onClick={(event) => {
          event.preventDefault();
          onAddChild(childType);
        }}
      >
        <Icon type="plus" />
        {trans("global.addChild", "添加子题")}
      </Button>
    </div>
  );
};

ChildQuestionActions.propTypes = {
  onAddChild: PropTypes.func.isRequired,
};

const getQuestionTypeLabel = (type) =>
  QUESTION_TYPE_OPTIONS.find((item) => item.value === Number(type))?.label;

const getChildEditorIndex = (isChild, path) =>
  isChild && path.length === 1 ? path[0] : undefined;

const moveArrayItem = (items, currentIndex, offset) => {
  const nextIndex = currentIndex + offset;

  if (
    currentIndex < 0 ||
    nextIndex < 0 ||
    currentIndex >= items.length ||
    nextIndex >= items.length
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, movedItem);
  return nextItems;
};

const moveQuestionAtPath = (onQuestionUpdate, targetPath, offset) => {
  const childIndex = targetPath.at(-1);
  const parentPath = targetPath.slice(0, -1);

  onQuestionUpdate(parentPath, (currentQuestion) => {
    const childQuestions = toArray(currentQuestion.sonQuestionList);
    const nextChildQuestions = moveArrayItem(
      childQuestions,
      childIndex,
      offset,
    );

    return childQuestions === nextChildQuestions
      ? currentQuestion
      : {
          ...currentQuestion,
          sonQuestionList: nextChildQuestions,
        };
  });
};

const renderAnnotationMeta = ({
  chapterTreeData,
  indicatorTreeData,
  isAnnotationCollapsed,
  isChild,
  knowledgeTreeData,
  onQuestionChange,
  popupContainer,
  question,
}) =>
  isAnnotationCollapsed ? undefined : (
    <MetaEditor
      chapterTreeData={chapterTreeData}
      indicatorTreeData={indicatorTreeData}
      isChild={isChild}
      knowledgeTreeData={knowledgeTreeData}
      onQuestionChange={onQuestionChange}
      popupContainer={popupContainer}
      question={question}
    />
  );

const AnalysisEditor = ({
  onEditorActive,
  onQuestionChange,
  question,
  uploadImage,
}) => (
  <div className={`${css.formField} ${css.analysisField}`}>
    <FieldLabel title={trans("singleInput.analysis", "答案解析")} />
    <RichTextField
      fieldId={`${question.editorId}-analysis`}
      onActive={onEditorActive}
      onChange={(analysis) => onQuestionChange({ analysis })}
      placeholder={trans(
        "jsonInput.analysisPlaceholder",
        "这里预留解析编辑空间",
      )}
      uploadImage={uploadImage}
      value={question.analysis}
    />
  </div>
);

AnalysisEditor.propTypes = {
  onEditorActive: PropTypes.func.isRequired,
  onQuestionChange: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  uploadImage: PropTypes.func,
};

AnalysisEditor.defaultProps = {
  uploadImage: undefined,
};

const ChildQuestionHeader = ({
  childQuestionCount,
  onQuestionMove,
  onQuestionRemove,
  path,
  question,
}) => {
  const childIndex = path.at(-1);
  const canMoveChildUp = childIndex > 0;
  const canMoveChildDown = childIndex < childQuestionCount - 1;

  return (
    <div className={css.blockHeader}>
      <div
        className={css.blockHeaderTitle}
        data-testid="child-question-editor-heading"
      >
        <div className={css.blockTitle}>{getPathLabel(path)}</div>
        <div className={css.blockSubTitle}>
          {getQuestionTypeLabel(question.type)}
        </div>
      </div>
      <div className={css.blockHeaderActions}>
        <Button
          aria-label={trans("questionTask.moveSubQuestionUp", "上移子题")}
          disabled={!canMoveChildUp}
          icon="arrow-up"
          size="small"
          title={trans("questionTask.moveSubQuestionUp", "上移子题")}
          onClick={(event) => {
            event.preventDefault();
            onQuestionMove(path, -1);
          }}
        />
        <Button
          aria-label={trans("questionTask.moveSubQuestionDown", "下移子题")}
          disabled={!canMoveChildDown}
          icon="arrow-down"
          size="small"
          title={trans("questionTask.moveSubQuestionDown", "下移子题")}
          onClick={(event) => {
            event.preventDefault();
            onQuestionMove(path, 1);
          }}
        />
        <Button
          icon="delete"
          size="small"
          onClick={(event) => {
            event.preventDefault();
            onQuestionRemove(path);
          }}
        >
          {trans("global.delete", "删除")}
        </Button>
      </div>
    </div>
  );
};

ChildQuestionHeader.propTypes = {
  childQuestionCount: PropTypes.number.isRequired,
  onQuestionMove: PropTypes.func.isRequired,
  onQuestionRemove: PropTypes.func.isRequired,
  path: PropTypes.arrayOf(PropTypes.number).isRequired,
  question: PropTypes.object.isRequired,
};

const QuestionBlock = ({
  chapterTreeData,
  childQuestionCount,
  indicatorTreeData,
  isAnnotationCollapsed,
  isChild,
  onQuestionMove,
  knowledgeTreeData,
  onEditorActive,
  onQuestionRemove,
  onQuestionUpdate,
  path,
  popupContainer,
  question,
  uploadImage,
}) => {
  const isCombinationQuestion =
    Number(question.type) === QUESTION_TYPE_COMBINATION;

  const onQuestionChange = (patch) => {
    onQuestionUpdate(path, (currentQuestion) => ({
      ...currentQuestion,
      ...patch,
    }));
  };

  const onQuestionPatch = (updater) => {
    onQuestionUpdate(path, updater);
  };

  const updateChild = (childPath, updater) => {
    onQuestionUpdate(childPath, updater);
  };

  return (
    <section
      className={isChild ? css.childQuestionBlock : css.questionBlock}
      data-question-editor-child-index={getChildEditorIndex(isChild, path)}
    >
      {isChild ? (
        <ChildQuestionHeader
          childQuestionCount={childQuestionCount}
          onQuestionMove={onQuestionMove}
          onQuestionRemove={onQuestionRemove}
          path={path}
          question={question}
        />
      ) : undefined}

      <div className={css.fieldStack}>
        <div className={css.formField}>
          <FieldLabel required title={getQuestionStemLabel(question.type)} />
          <RichTextField
            fieldId={`${question.editorId}-content`}
            onActive={onEditorActive}
            onChange={(content) => onQuestionChange({ content })}
            placeholder={trans("singleInput.fillQuestion", "请输入题目")}
            uploadImage={uploadImage}
            value={question.content}
          />
        </div>

        {isChild ? (
          <div className={css.formField}>
            <FieldLabel required title={trans("global.questionType", "题型")} />
            <QuestionTypeSelect
              onChange={(type) =>
                onQuestionPatch((currentQuestion) =>
                  resetQuestionDraftByType(currentQuestion, type),
                )
              }
              options={CHILD_TYPE_OPTIONS}
              value={Number(question.type)}
            />
          </div>
        ) : undefined}

        {isCombinationQuestion ? undefined : (
          <div className={css.formField}>
            <FieldLabel
              extra={getAnswerFieldExtra(question.type)}
              required={Number(question.type) !== QUESTION_TYPE_ANSWER}
              title={getAnswerFieldTitle(question.type)}
            />
            <QuestionAnswerEditor
              onEditorActive={onEditorActive}
              onQuestionChange={onQuestionChange}
              onQuestionPatch={onQuestionPatch}
              question={question}
              uploadImage={uploadImage}
            />
          </div>
        )}

        <AnalysisEditor
          onEditorActive={onEditorActive}
          onQuestionChange={onQuestionChange}
          question={question}
          uploadImage={uploadImage}
        />

        {isAnnotationCollapsed ? undefined : (
          <div>
            {renderAnnotationMeta({
              chapterTreeData,
              indicatorTreeData,
              isAnnotationCollapsed,
              isChild,
              knowledgeTreeData,
              onQuestionChange,
              popupContainer,
              question,
            })}
          </div>
        )}

        {isCombinationQuestion ? (
          <div className={css.childList}>
            <div className={css.childListHeader}>
              <span>{trans("jsonInput.childQuestionList", "子题列表")}</span>
              <ChildQuestionActions
                onAddChild={(childType) =>
                  onQuestionChange({
                    sonQuestionList: [
                      ...toArray(question.sonQuestionList),
                      createEmptyQuestionDraft(childType),
                    ],
                  })
                }
              />
            </div>
            {toArray(question.sonQuestionList).map(
              (childQuestion, childIndex) => (
                <QuestionBlock
                  key={childQuestion.editorId}
                  chapterTreeData={chapterTreeData}
                  childQuestionCount={toArray(question.sonQuestionList).length}
                  indicatorTreeData={indicatorTreeData}
                  isAnnotationCollapsed={isAnnotationCollapsed}
                  isChild
                  knowledgeTreeData={knowledgeTreeData}
                  onEditorActive={onEditorActive}
                  onQuestionMove={(targetPath, offset) =>
                    moveQuestionAtPath(onQuestionUpdate, targetPath, offset)
                  }
                  onQuestionRemove={onQuestionRemove}
                  onQuestionUpdate={updateChild}
                  path={[...path, childIndex]}
                  popupContainer={popupContainer}
                  question={childQuestion}
                  uploadImage={uploadImage}
                />
              ),
            )}
          </div>
        ) : undefined}
      </div>
    </section>
  );
};

QuestionBlock.propTypes = {
  chapterTreeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  childQuestionCount: PropTypes.number,
  indicatorTreeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  isAnnotationCollapsed: PropTypes.bool,
  isChild: PropTypes.bool,
  knowledgeTreeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEditorActive: PropTypes.func.isRequired,
  onQuestionMove: PropTypes.func,
  onQuestionRemove: PropTypes.func.isRequired,
  onQuestionUpdate: PropTypes.func.isRequired,
  path: PropTypes.arrayOf(PropTypes.number).isRequired,
  popupContainer: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  uploadImage: PropTypes.func,
};

QuestionBlock.defaultProps = {
  childQuestionCount: 0,
  isAnnotationCollapsed: false,
  isChild: false,
  onQuestionMove: (path, offset) => {
    void path;
    void offset;
  },
  uploadImage: undefined,
};

export default QuestionBlock;

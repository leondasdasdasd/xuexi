import React from "react";
import { Button, Checkbox, Icon, Radio, Select } from "antd";

import SlateRichEditor, {
  SlateRichPreview,
} from "../../components/SlateRichEditor";
import { trans } from "../../utils/i18n";
import {
  getGapAnswerFieldId,
  getOptionFieldId,
  getQuestionFieldId,
  getQuestionTypeLabel,
  getQuestionTypeOptions,
} from "./utils";

import styles from "./index.module.less";

const { Option } = Select;

const buildFieldLabel = (displayIndex, label) =>
  trans("jsonInput.questionFieldLabel", "第 {$displayIndex} 题 · {$label}", {
    displayIndex,
    label,
  });

/**
 *
 * @param properties
 */
function QuestionEditorCard(properties) {
  const {
    activeFieldId,
    allowRemove,
    chapterTreeData,
    displayIndex,
    getFieldSlateValue,
    isChild,
    knowledgeTreeData,
    mountedRichFieldIdMap,
    onAddBlank,
    onAddBlankAnswer,
    onAddChildQuestion,
    onAddOption,
    onBlankOrderChange,
    onFieldChange,
    onOptionAnswerToggle,
    onQuestionRemove,
    onQuestionTypeChange,
    onRemoveBlank,
    onRemoveBlankAnswer,
    onRemoveOption,
    onRichFieldChange,
    onRichFieldFocus,
    path,
    question,
    uploadImage,
  } = properties;

  const questionTypeOptions = getQuestionTypeOptions();
  const questionTitle = `${
    isChild
      ? trans("jsonInput.childQuestion", "子题")
      : trans("jsonInput.question", "题目")
  } ${displayIndex}`;
  const isChoiceQuestion = [1, 2].includes(Number(question.type));
  const isGapQuestion = Number(question.type) === 3;
  const isEssayQuestion = Number(question.type) === 5;

  const activateRichField = (fieldId, label) => {
    if (typeof onRichFieldFocus === "function") {
      onRichFieldFocus(fieldId, {
        label,
      });
    }
  };

  const renderRichField = (fieldId, label, placeholder) => {
    const value =
      typeof getFieldSlateValue === "function"
        ? getFieldSlateValue(fieldId)
        : undefined;

    const isActive = activeFieldId === fieldId;
    const shouldMountEditor =
      isActive || !!(mountedRichFieldIdMap && mountedRichFieldIdMap[fieldId]);

    return (
      <div className={styles.richFieldShell}>
        {shouldMountEditor ? (
          <div
            className={
              isActive ? styles.richEditorMount : styles.richEditorHidden
            }
            aria-hidden={!isActive}
          >
            <SlateRichEditor
              autoFocus={isActive}
              onChange={(nextValue) => {
                if (typeof onRichFieldChange === "function") {
                  onRichFieldChange(fieldId, nextValue);
                }
              }}
              placeholder={placeholder}
              uploadImage={uploadImage}
              value={value}
            />
          </div>
        ) : null}
        {isActive ? null : (
          <SlateRichPreview
            data-field-id={fieldId}
            onClick={() => activateRichField(fieldId, label)}
            onFocus={() => activateRichField(fieldId, label)}
            placeholder={placeholder}
            tabIndex={0}
            value={value}
          />
        )}
      </div>
    );
  };

  const renderOptionAnswerSelector = (option) => {
    const checked = String(question.answer || "").includes(option.key);

    if (Number(question.type) === 1) {
      return (
        <Radio
          checked={checked}
          onChange={(event) =>
            onOptionAnswerToggle(path, option.key, event.target.checked)
          }
        >
          {trans("jsonInput.correctAnswer", "正确答案")}
        </Radio>
      );
    }

    return (
      <Checkbox
        checked={checked}
        onChange={(event) =>
          onOptionAnswerToggle(path, option.key, event.target.checked)
        }
      >
        {trans("jsonInput.correctAnswer", "正确答案")}
      </Checkbox>
    );
  };

  return (
    <div
      className={[styles.questionCard, isChild ? styles.childCard : ""].join(
        " ",
      )}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderMain}>
          <div className={styles.cardTitle}>
            <span className={styles.indexTag}>{displayIndex}</span>
            <span>{questionTitle}</span>
            <span className={styles.typeTag}>
              {getQuestionTypeLabel(question.type)}
            </span>
          </div>
          <div className={styles.cardHeaderType}>
            <span className={styles.cardHeaderTypeLabel}>
              {trans("global.questionType", "题型")}
            </span>
            <Select
              size="small"
              className={styles.cardHeaderTypeSelect}
              value={question.type}
              onChange={(value) => onQuestionTypeChange(path, value)}
            >
              {questionTypeOptions.map((item) => (
                <Option value={item.value} key={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>
        {allowRemove ? (
          <Button
            type="link"
            className={styles.removeBtn}
            onClick={() => onQuestionRemove(path)}
          >
            {trans("global.delete", "删除")}
          </Button>
        ) : null}
      </div>

      <div className={styles.formGrid}>
        <div className={styles.fullRow}>
          <div className={styles.label}>
            {trans("jsonInput.questionStem", "题干")}
          </div>
          {renderRichField(
            getQuestionFieldId(question, "content"),
            buildFieldLabel(
              displayIndex,
              trans("jsonInput.questionStem", "题干"),
            ),
            trans("singleInput.fillQuestion", "请输入题目"),
          )}
        </div>

        {isChoiceQuestion ? (
          <div className={styles.fullRow}>
            <div className={styles.label}>
              {trans("singleInput.questionTips3", "选项描述")}
            </div>
            <div className={styles.optionList}>
              {(question.optionList || []).map((option, optionIndex) => (
                <div
                  key={option.uid || option.key}
                  className={styles.optionRow}
                >
                  <div className={styles.optionKey}>{option.key}</div>
                  <div className={styles.optionEditor}>
                    {renderRichField(
                      getOptionFieldId(question, option),
                      buildFieldLabel(
                        displayIndex,
                        `${trans("jsonInput.option", "选项")} ${option.key}`,
                      ),
                      trans("singleInput.placeholderTxt", "请输入选项内容"),
                    )}
                  </div>
                  <div className={styles.optionActions}>
                    {renderOptionAnswerSelector(option)}
                    {question.optionList.length > 2 ? (
                      <Button
                        type="link"
                        onClick={() => onRemoveOption(path, optionIndex)}
                      >
                        {trans("global.delete", "删除")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              <Button
                className={styles.addBtn}
                onClick={() => onAddOption(path)}
              >
                <Icon type="plus" />
                {trans("singleInput.addOption", "添加更多选项")}
              </Button>
            </div>
          </div>
        ) : null}

        {isGapQuestion ? (
          <div className={styles.fullRow}>
            <div className={styles.label}>
              {trans("jsonInput.blankAnswer", "填空答案")}
            </div>
            <div className={styles.blankList}>
              <Checkbox
                checked={
                  !!(
                    question.gapFillingAnswer &&
                    question.gapFillingAnswer.isOrder
                  )
                }
                onChange={(event) =>
                  onBlankOrderChange(path, event.target.checked)
                }
              >
                {trans("jsonInput.blankOrder", "按空位顺序匹配")}
              </Checkbox>

              {(
                (question.gapFillingAnswer &&
                  question.gapFillingAnswer.answerGroups) ||
                []
              ).map((group, groupIndex) => (
                <div
                  key={group.uid || `${displayIndex}-${groupIndex}`}
                  className={styles.blankGroup}
                >
                  <div className={styles.blankGroupHeader}>
                    <span className={styles.blankGroupTitle}>
                      {trans("jsonInput.blank", "空")} {groupIndex + 1}
                    </span>
                    <div className={styles.blankGroupActions}>
                      <Button
                        type="link"
                        onClick={() => onAddBlankAnswer(path, groupIndex)}
                      >
                        {trans("jsonInput.addAcceptAnswer", "添加可接受答案")}
                      </Button>
                      {question.gapFillingAnswer &&
                      question.gapFillingAnswer.answerGroups &&
                      question.gapFillingAnswer.answerGroups.length > 1 ? (
                        <Button
                          type="link"
                          onClick={() => onRemoveBlank(path, groupIndex)}
                        >
                          {trans("global.delete", "删除该空")}
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {(group.answers || []).map((answer, answerIndex) => (
                    <div
                      key={answer.uid || `${groupIndex}-${answerIndex}`}
                      className={styles.blankAnswerRow}
                    >
                      <div className={styles.blankAnswerEditor}>
                        {renderRichField(
                          getGapAnswerFieldId(question, group, answer),
                          buildFieldLabel(
                            displayIndex,
                            `${trans("jsonInput.blank", "填空")} ${
                              groupIndex + 1
                            } ${trans("jsonInput.answer", "的答案")} ${answerIndex + 1}`,
                          ),
                          trans(
                            "jsonInput.blankAnswerPlaceholder",
                            "请输入该空的可接受答案",
                          ),
                        )}
                      </div>
                      {(group.answers || []).length > 1 ? (
                        <Button
                          type="link"
                          className={styles.blankAnswerRemove}
                          onClick={() =>
                            onRemoveBlankAnswer(path, groupIndex, answerIndex)
                          }
                        >
                          {trans("global.delete", "删除")}
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}

              <Button
                className={styles.addBtn}
                onClick={() => onAddBlank(path)}
              >
                <Icon type="plus" />
                {trans("jsonInput.addBlank", "添加填空")}
              </Button>
            </div>
          </div>
        ) : null}

        {Number(question.type) === 4 ? (
          <div className={styles.fullRow}>
            <div className={styles.label}>
              {trans("jsonInput.judgeAnswer", "判断答案")}
            </div>
            <Radio.Group
              value={question.answer}
              onChange={(event) =>
                onFieldChange(path, "answer", event.target.value)
              }
            >
              <Radio value={true}>{trans("jsonInput.true", "正确")}</Radio>
              <Radio value={false}>{trans("jsonInput.false", "错误")}</Radio>
            </Radio.Group>
          </div>
        ) : null}

        {isEssayQuestion ? (
          <div className={styles.fullRow}>
            <div className={styles.label}>
              {trans("jsonInput.referenceAnswer", "参考答案")}
            </div>
            {renderRichField(
              getQuestionFieldId(question, "answer"),
              buildFieldLabel(
                displayIndex,
                trans("jsonInput.referenceAnswer", "参考答案"),
              ),
              trans("jsonInput.referenceAnswerPlaceholder", "请输入参考答案"),
            )}
          </div>
        ) : null}

        <div className={styles.fullRow}>
          <div className={styles.label}>
            {trans("singleInput.answerAnalysis", "答案解析")}
          </div>
          {renderRichField(
            getQuestionFieldId(question, "analysis"),
            buildFieldLabel(
              displayIndex,
              trans("singleInput.answerAnalysis", "答案解析"),
            ),
            trans("jsonInput.analysisPlaceholder", "这里预留解析编辑空间"),
          )}
        </div>

        {Number(question.type) === 6 ? (
          <div className={styles.childWrap}>
            <div className={styles.childHeader}>
              <span>{trans("jsonInput.childQuestionList", "子题列表")}</span>
              <Button
                className={styles.addBtn}
                onClick={() => onAddChildQuestion(path)}
              >
                <Icon type="plus" />
                {trans("jsonInput.addChildQuestion", "添加子题")}
              </Button>
            </div>
            {(question.sonQuestionList || []).map(
              (childQuestion, childIndex) => (
                <QuestionEditorCard
                  key={childQuestion.uid || `${displayIndex}-${childIndex}`}
                  activeFieldId={activeFieldId}
                  allowRemove={true}
                  chapterTreeData={chapterTreeData}
                  displayIndex={`${displayIndex}.${childIndex + 1}`}
                  getFieldSlateValue={getFieldSlateValue}
                  isChild={true}
                  knowledgeTreeData={knowledgeTreeData}
                  mountedRichFieldIdMap={mountedRichFieldIdMap}
                  onAddBlank={onAddBlank}
                  onAddBlankAnswer={onAddBlankAnswer}
                  onAddChildQuestion={onAddChildQuestion}
                  onAddOption={onAddOption}
                  onBlankOrderChange={onBlankOrderChange}
                  onFieldChange={onFieldChange}
                  onOptionAnswerToggle={onOptionAnswerToggle}
                  onQuestionRemove={onQuestionRemove}
                  onQuestionTypeChange={onQuestionTypeChange}
                  onRemoveBlank={onRemoveBlank}
                  onRemoveBlankAnswer={onRemoveBlankAnswer}
                  onRemoveOption={onRemoveOption}
                  onRichFieldChange={onRichFieldChange}
                  onRichFieldFocus={onRichFieldFocus}
                  path={path.concat(childIndex)}
                  question={childQuestion}
                  uploadImage={uploadImage}
                />
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default QuestionEditorCard;

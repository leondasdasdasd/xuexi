import React from "react";
import { Button } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import ChildQuestionActions from "./ChildQuestionActions";
import FieldLabel from "./FieldLabel";
import MetaEditor from "./MetaEditor";
import QuestionAnswerEditor from "./QuestionAnswerEditor";
import {
  createEmptyQuestionDraft,
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_OPTIONS,
  resetQuestionDraftByType,
  toArray,
} from "./questionEntryModel";
import { css } from "./questionEntryStyles";
import {
  CHILD_TYPE_OPTIONS,
  getAnswerFieldExtra,
  getAnswerFieldTitle,
  getPathLabel,
  getQuestionStemLabel,
} from "./questionEntryUiHelpers";
import QuestionTypeSelect from "./QuestionTypeSelect";
import RichTextField from "./RichTextField";

const QuestionBlock = ({
  chapterTreeData,
  indicatorTreeData,
  isChild,
  knowledgeTreeData,
  onEditorActive,
  onQuestionRemove,
  onQuestionUpdate,
  path,
  popupContainer,
  question,
  showInlineMeta,
  showInlineType,
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
    <section className={isChild ? css.childQuestionBlock : css.questionBlock}>
      {isChild ? (
        <div className={css.blockHeader}>
          <div>
            <div className={css.blockTitle}>{getPathLabel(path)}</div>
            <div className={css.blockSubTitle}>
              {
                QUESTION_TYPE_OPTIONS.find(
                  (item) => item.value === Number(question.type),
                )?.label
              }
            </div>
          </div>
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

        {showInlineType ? (
          <div className={css.formField}>
            <FieldLabel required title={trans("global.questionType", "题型")} />
            <QuestionTypeSelect
              onChange={(type) =>
                onQuestionPatch((currentQuestion) =>
                  resetQuestionDraftByType(currentQuestion, type),
                )
              }
              options={isChild ? CHILD_TYPE_OPTIONS : QUESTION_TYPE_OPTIONS}
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

        <div className={css.formField}>
          <FieldLabel
            extra={trans("singleInput.noRequired", "非必填项")}
            title={trans("singleInput.analysis", "答案解析")}
          />
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

        {showInlineMeta ? (
          <MetaEditor
            chapterTreeData={chapterTreeData}
            indicatorTreeData={indicatorTreeData}
            isChild={isChild}
            knowledgeTreeData={knowledgeTreeData}
            onQuestionChange={onQuestionChange}
            popupContainer={popupContainer}
            question={question}
          />
        ) : undefined}

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
                  indicatorTreeData={indicatorTreeData}
                  isChild
                  knowledgeTreeData={knowledgeTreeData}
                  onEditorActive={onEditorActive}
                  onQuestionRemove={onQuestionRemove}
                  onQuestionUpdate={updateChild}
                  path={[...path, childIndex]}
                  popupContainer={popupContainer}
                  question={childQuestion}
                  showInlineMeta
                  showInlineType
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
  indicatorTreeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  isChild: PropTypes.bool,
  knowledgeTreeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEditorActive: PropTypes.func.isRequired,
  onQuestionRemove: PropTypes.func.isRequired,
  onQuestionUpdate: PropTypes.func.isRequired,
  path: PropTypes.arrayOf(PropTypes.number).isRequired,
  popupContainer: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  showInlineMeta: PropTypes.bool,
  showInlineType: PropTypes.bool,
  uploadImage: PropTypes.func,
};

QuestionBlock.defaultProps = {
  showInlineMeta: true,
  showInlineType: true,
};

export default QuestionBlock;

import React from "react";
import { Empty } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import {
  createQuestionAssetQuestionTypeTemplates,
  isQuestionAssetEditorReady,
} from "../questionAssetContentAdapter";
import {
  createQuestionAssetGradeOptions,
  createQuestionAssetSubjectOptions,
  createQuestionAssetTreeOptions,
  createQuestionAssetTypeOptions,
} from "../questionAssetInputViewModel";
import QuestionAssetContentPanel from "./QuestionAssetContentPanel";
import QuestionAssetMetadataPanel from "./QuestionAssetMetadataPanel";
import QuestionAssetScopePanel from "./QuestionAssetScopePanel";
import QuestionAssetTypePanel from "./QuestionAssetTypePanel";

import styles from "../index.module.less";

/**
 * 复用独立题目录入页的四个编辑面板。
 * @param {object} properties 编辑器状态与事件。
 * @returns {React.ReactElement} 题目录入内容。
 */
const QuestionAssetEditorModalBody = (properties) => {
  const {
    allGradeList,
    chapterList,
    changeResource,
    draft,
    labelList,
    onGradeChange,
    onSubjectChange,
    onTypeChange,
    questionTypes,
    resource,
    scopeDisabled,
    selectedTypeId,
    setDraft,
    subjectList,
    treeData,
    uploadImage,
  } = properties;
  const questionTypeTemplates =
    createQuestionAssetQuestionTypeTemplates(questionTypes);
  const editorReady = isQuestionAssetEditorReady({
    draft,
    questionTypes,
    selectedTypeId,
  });
  return (
    <div className={styles.content}>
      {editorReady ? (
        <QuestionAssetContentPanel
          draft={draft}
          onChange={setDraft}
          questionTypeTemplates={questionTypeTemplates}
          uploadImage={uploadImage}
        />
      ) : (
        <section className={styles.editorPanel}>
          <Empty
            description={trans(
              "questionAssetInput.noQuestionType",
              "暂无可用题型，暂无法保存",
            )}
          />
        </section>
      )}
      <aside className={styles.sidePanel}>
        <QuestionAssetScopePanel
          disabled={scopeDisabled}
          gradeOptions={createQuestionAssetGradeOptions(allGradeList)}
          onGradeChange={onGradeChange}
          onSubjectChange={onSubjectChange}
          subjectOptions={createQuestionAssetSubjectOptions(subjectList)}
          value={resource}
        />
        <QuestionAssetTypePanel
          disabled={!editorReady}
          locked={scopeDisabled}
          onChange={onTypeChange}
          options={createQuestionAssetTypeOptions(questionTypes)}
          value={selectedTypeId}
        />
        <QuestionAssetMetadataPanel
          chapterOptions={createQuestionAssetTreeOptions(chapterList)}
          indicatorOptions={createQuestionAssetTreeOptions(labelList)}
          knowledgeOptions={createQuestionAssetTreeOptions(treeData)}
          onChange={changeResource}
          value={resource}
        />
      </aside>
    </div>
  );
};

QuestionAssetEditorModalBody.propTypes = {
  allGradeList: PropTypes.arrayOf(PropTypes.object).isRequired,
  chapterList: PropTypes.arrayOf(PropTypes.object).isRequired,
  changeResource: PropTypes.func.isRequired,
  draft: PropTypes.object,
  labelList: PropTypes.arrayOf(PropTypes.object).isRequired,
  onGradeChange: PropTypes.func.isRequired,
  onSubjectChange: PropTypes.func.isRequired,
  onTypeChange: PropTypes.func.isRequired,
  questionTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  resource: PropTypes.object.isRequired,
  scopeDisabled: PropTypes.bool.isRequired,
  selectedTypeId: PropTypes.number,
  setDraft: PropTypes.func.isRequired,
  subjectList: PropTypes.arrayOf(PropTypes.object).isRequired,
  treeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  uploadImage: PropTypes.func.isRequired,
};

export default QuestionAssetEditorModalBody;

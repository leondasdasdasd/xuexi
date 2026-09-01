import React, { useCallback, useEffect, useState } from "react";
import { message, Modal, Spin } from "antd";
import { connect } from "dva";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import {
  isQuestionAssetEditorReady,
  validateQuestionAssetScope,
} from "../questionAssetContentAdapter";
import {
  querySavedQuestionAsset,
  saveQuestionAsset,
  uploadQuestionAssetImage,
} from "../questionAssetEditorService";
import { useQuestionAssetEditorState } from "../useQuestionAssetEditorState";
import QuestionAssetEditorModalBody from "./QuestionAssetEditorModalBody";

import styles from "../index.module.less";

const FAILED_MESSAGE_KEY = "global.failed";
const FAILED_MESSAGE_TEXT = "操作失败";
const getFailedMessage = () => trans(FAILED_MESSAGE_KEY, FAILED_MESSAGE_TEXT);

const saveAndLoadQuestion = async (parameters) => {
  const savedId = await saveQuestionAsset(parameters);
  if (!savedId) throw new Error(getFailedMessage());
  const resource = await querySavedQuestionAsset(savedId);
  return { questionId: Number(savedId), resource };
};

const isSaveUnavailable = ({ editorReady, resource, saving }) =>
  !editorReady || Boolean(validateQuestionAssetScope(resource)) || saving;

/**
 * 在弹窗中承载与 QuestionAssetInput 页面一致的题目录入能力。
 * @param {object} properties 弹窗上下文、数据源和回调。
 * @returns {React.ReactElement} 题目录入弹窗。
 */
function QuestionAssetEditorModal(properties) {
  const {
    allGradeList,
    chapterList,
    dispatch,
    initialScope,
    labelList,
    onCancel,
    onSaved,
    questionId,
    subjectList,
    treeData,
    visible,
  } = properties;
  const {
    changeGrade,
    changeMetadata,
    changeSubject,
    changeType,
    draft,
    loading,
    questionTypes,
    resource,
    selectedTypeId,
    setDraft,
  } = useQuestionAssetEditorState({
    active: visible,
    allGradeList,
    initialScope,
    questionId,
  });
  const [saving, setSaving] = useState(false);
  const gradeId = resource?.gradeId;
  const subjectId = resource?.subjectId;
  const editorReady = isQuestionAssetEditorReady({
    draft,
    questionTypes,
    selectedTypeId,
  });

  useEffect(() => {
    if (!visible) return;
    dispatch({ type: "inputQuestion/getAllGradeList" });
  }, [dispatch, visible]);

  useEffect(() => {
    if (!visible || !gradeId) return;
    dispatch({ payload: { gradeId }, type: "inputQuestion/getSubjectList" });
  }, [dispatch, gradeId, visible]);

  useEffect(() => {
    if (!visible || !gradeId || !subjectId) return;
    const payload = { gradeId, subjectId };
    dispatch({
      payload: { ...payload, isSegmentation: true },
      type: "inputQuestion/getChapter",
    });
    dispatch({ type: "inputQuestion/getTree", payload });
    dispatch({ type: "inputQuestion/getLabel", payload });
  }, [dispatch, gradeId, subjectId, visible]);

  const save = useCallback(async () => {
    if (isSaveUnavailable({ editorReady, resource, saving })) return;
    setSaving(true);
    try {
      const result = await saveAndLoadQuestion({
        draft,
        questionId,
        questionTypes,
        resource,
      });
      onSaved({ ...result, questionTypes });
    } catch (error) {
      message.error(error?.message || getFailedMessage());
    } finally {
      setSaving(false);
    }
  }, [
    draft,
    editorReady,
    onSaved,
    questionId,
    questionTypes,
    resource,
    saving,
  ]);

  return (
    <Modal
      className={styles["editor-modal"]}
      destroyOnClose
      maskClosable={!saving}
      onCancel={saving ? undefined : onCancel}
      onOk={() => void save()}
      okButtonProps={{
        disabled:
          loading || isSaveUnavailable({ editorReady, resource, saving }),
      }}
      okText={trans("global.save", "保存")}
      title={
        questionId
          ? trans("global.editQuestion", "编辑题目")
          : trans("global.addQuestion", "新增题目")
      }
      visible={visible}
      width="min(96vw, 75rem)"
    >
      <Spin spinning={loading || saving}>
        <QuestionAssetEditorModalBody
          allGradeList={allGradeList}
          chapterList={chapterList}
          changeResource={changeMetadata}
          draft={draft}
          labelList={labelList}
          onGradeChange={changeGrade}
          onSubjectChange={changeSubject}
          onTypeChange={changeType}
          questionTypes={questionTypes}
          resource={resource || {}}
          scopeDisabled={Boolean(questionId)}
          selectedTypeId={selectedTypeId}
          setDraft={setDraft}
          subjectList={subjectList}
          treeData={treeData}
          uploadImage={uploadQuestionAssetImage}
        />
      </Spin>
    </Modal>
  );
}

QuestionAssetEditorModal.propTypes = {
  allGradeList: PropTypes.arrayOf(PropTypes.object),
  chapterList: PropTypes.arrayOf(PropTypes.object),
  dispatch: PropTypes.func.isRequired,
  initialScope: PropTypes.shape({
    gradeId: PropTypes.number,
    subjectId: PropTypes.number,
  }).isRequired,
  labelList: PropTypes.arrayOf(PropTypes.object),
  onCancel: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
  questionId: PropTypes.number,
  subjectList: PropTypes.arrayOf(PropTypes.object),
  treeData: PropTypes.arrayOf(PropTypes.object),
  visible: PropTypes.bool.isRequired,
};

export { QuestionAssetEditorModal as PureQuestionAssetEditorModal };
export default connect((state) => ({
  allGradeList: state.inputQuestion.allGradeList || [],
  chapterList: state.inputQuestion.chapterList || [],
  labelList: state.inputQuestion.labelList || [],
  subjectList: state.inputQuestion.subjectList || [],
  treeData: state.inputQuestion.treeData || [],
}))(QuestionAssetEditorModal);

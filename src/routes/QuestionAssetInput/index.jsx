import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Empty, Icon, message, Spin } from "antd";
import { connect } from "dva";
import PropTypes from "prop-types";

import { bindQuestionV2Basket } from "../../services/questionV2";
import { trans } from "../../utils/i18n";
import { getPageQuery, loginRedirect } from "../../utils/utils.jsx";
import QuestionAssetContentPanel from "./components/QuestionAssetContentPanel.jsx";
import QuestionAssetMetadataPanel from "./components/QuestionAssetMetadataPanel.jsx";
import QuestionAssetScopePanel from "./components/QuestionAssetScopePanel.jsx";
import QuestionAssetTypePanel from "./components/QuestionAssetTypePanel.jsx";
import {
  createQuestionAssetContentStructure,
  createQuestionAssetQuestionTypeTemplates,
  createQuestionAssetV2BasketPayload,
  getQuestionAssetTypeById,
  validateQuestionAssetScope,
} from "./questionAssetContentAdapter.js";
import {
  saveQuestionAsset,
  uploadQuestionAssetImage,
} from "./questionAssetEditorService.js";
import { parseQuestionAssetInputCreateScope } from "./questionAssetInputRoute.js";
import {
  createQuestionAssetGradeOptions,
  createQuestionAssetSubjectOptions,
  createQuestionAssetTreeOptions,
  createQuestionAssetTypeOptions,
} from "./questionAssetInputViewModel.js";
import { useQuestionAssetEditorState } from "./useQuestionAssetEditorState";

import styles from "./index.module.less";

const getQuestionAssetRouteId = (properties) => {
  const id = properties.match?.params?.id;

  return id && id !== "null" && id !== "undefined" && id !== "new"
    ? id
    : undefined;
};

const getQuestionAssetFailedMessage = (_unusedReason = "default") => (
  void _unusedReason,
  trans("global.failed", "操作失败")
);

const QUESTION_ASSET_NO_TYPE_MESSAGE_KEY = "questionAssetInput.noQuestionType";
const QUESTION_ASSET_NO_TYPE_MESSAGE_TEXT = "暂无可用题型，暂无法保存";

const getQuestionAssetNoTypeMessage = (_unusedReason = "default") => (
  void _unusedReason,
  trans(QUESTION_ASSET_NO_TYPE_MESSAGE_KEY, QUESTION_ASSET_NO_TYPE_MESSAGE_TEXT)
);

const validateQuestionAssetSaveResponse = (response) => {
  if (!response) {
    return false;
  }

  if (response?.err) {
    message.error(response.err.message || getQuestionAssetFailedMessage());
    return false;
  }

  if (!response.ifLogin) {
    loginRedirect();
    return false;
  }

  if (!response.status) {
    message.error(response.message || getQuestionAssetFailedMessage());
    return false;
  }

  return true;
};

/**
 * 题目录入页面容器，负责范围选择、题型切换和保存数据出口。
 * @param {object} properties 页面属性。
 * @returns {React.ReactElement} 页面。
 */
function QuestionAssetInput(properties) {
  const {
    allGradeList,
    chapterList,
    dispatch,
    history,
    labelList,
    subjectList,
    treeData,
  } = properties;
  const editQuestionId = getQuestionAssetRouteId(properties);
  const [bankSaving, setBankSaving] = useState(false);
  const initialScope = useMemo(
    () =>
      editQuestionId
        ? {}
        : parseQuestionAssetInputCreateScope(getPageQuery()) || {},
    [editQuestionId],
  );
  const {
    changeGrade,
    changeMetadata,
    changeSubject,
    changeType,
    draft,
    loading: questionTypesLoading,
    questionTypes,
    resource: resourceDraft,
    selectedTypeId,
    setDraft,
  } = useQuestionAssetEditorState({
    allGradeList,
    initialScope,
    questionId: editQuestionId,
  });
  const { gradeId: resourceGradeId, subjectId: resourceSubjectId } =
    resourceDraft;
  const selectedQuestionType = useMemo(
    () => getQuestionAssetTypeById(questionTypes, selectedTypeId),
    [questionTypes, selectedTypeId],
  );
  const structure = useMemo(
    () =>
      selectedQuestionType
        ? createQuestionAssetContentStructure(selectedQuestionType)
        : undefined,
    [selectedQuestionType],
  );
  const questionTypeTemplates = useMemo(
    () => createQuestionAssetQuestionTypeTemplates(questionTypes),
    [questionTypes],
  );
  const typeOptions = useMemo(
    () => createQuestionAssetTypeOptions(questionTypes),
    [questionTypes],
  );
  const gradeOptions = useMemo(
    () => createQuestionAssetGradeOptions(allGradeList),
    [allGradeList],
  );
  const subjectOptions = useMemo(
    () => createQuestionAssetSubjectOptions(subjectList),
    [subjectList],
  );
  const chapterOptions = useMemo(
    () => createQuestionAssetTreeOptions(chapterList),
    [chapterList],
  );
  const knowledgeOptions = useMemo(
    () => createQuestionAssetTreeOptions(treeData),
    [treeData],
  );
  const indicatorOptions = useMemo(
    () => createQuestionAssetTreeOptions(labelList),
    [labelList],
  );

  useEffect(() => {
    dispatch({ type: "inputQuestion/getAllGradeList" });
  }, [dispatch]);

  useEffect(() => {
    if (!resourceGradeId) {
      return;
    }

    dispatch({
      payload: { gradeId: resourceGradeId },
      type: "inputQuestion/getSubjectList",
    });
  }, [dispatch, resourceGradeId]);

  useEffect(() => {
    if (!resourceGradeId || !resourceSubjectId) {
      return;
    }

    const payload = {
      gradeId: resourceGradeId,
      subjectId: resourceSubjectId,
    };

    dispatch({
      payload: { ...payload, isSegmentation: true },
      type: "inputQuestion/getChapter",
    });
    dispatch({ type: "inputQuestion/getTree", payload });
    dispatch({ type: "inputQuestion/getLabel", payload });
  }, [dispatch, resourceGradeId, resourceSubjectId]);

  const goBack = useCallback(
    (event) => {
      event.preventDefault();
      history.go(-1);
    },
    [history],
  );

  const validateBeforeSave = useCallback(() => {
    if (!selectedQuestionType || !draft) {
      message.info(getQuestionAssetNoTypeMessage());
      return false;
    }

    const validationKey = validateQuestionAssetScope(resourceDraft);
    if (validationKey) {
      message.info(trans(validationKey, "年级、学科缺一不可哦~"));
      return false;
    }

    return true;
  }, [draft, resourceDraft, selectedQuestionType]);

  const saveToBank = useCallback(async () => {
    if (!validateBeforeSave() || bankSaving) {
      return;
    }

    setBankSaving(true);
    try {
      const questionId = await saveQuestionAsset({
        draft,
        questionId: editQuestionId,
        questionTypes,
        resource: resourceDraft,
      });
      message.success(trans("global.saveSuccess", "保存成功"));
      return questionId;
    } catch (error) {
      message.error(error?.message || getQuestionAssetFailedMessage());
    } finally {
      setBankSaving(false);
    }
  }, [
    bankSaving,
    draft,
    editQuestionId,
    questionTypes,
    resourceDraft,
    validateBeforeSave,
  ]);

  const saveToBasket = useCallback(async () => {
    const questionId = await saveToBank();
    if (!questionId) return;

    const basketResponse = await bindQuestionV2Basket(
      createQuestionAssetV2BasketPayload({
        gradeId: resourceGradeId,
        questionId,
        subjectId: resourceSubjectId,
      }),
    );

    if (validateQuestionAssetSaveResponse(basketResponse)) {
      message.success(trans("global.operateSuccess", "操作成功"));
    }

    return basketResponse;
  }, [saveToBank, resourceGradeId, resourceSubjectId]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Button onClick={goBack}>
            <Icon type="arrow-left" />
            {trans("global.cancle", "取消")}
          </Button>
          <h1 className={styles.title}>
            {editQuestionId
              ? trans("questionAssetInput.editTitle", "题目编辑")
              : trans("questionAssetInput.title", "题目录入")}
          </h1>
        </div>
        <div className={styles.actions}>
          <Button
            disabled={questionTypesLoading || !selectedQuestionType}
            onClick={(event) => {
              event.preventDefault();
              saveToBasket();
            }}
          >
            {trans("global.saveAddBasket", "保存并加入试题篮")}
          </Button>
          <Button
            disabled={
              questionTypesLoading || !selectedQuestionType || bankSaving
            }
            loading={bankSaving}
            type="primary"
            onClick={(event) => {
              event.preventDefault();
              saveToBank();
            }}
          >
            {trans("global.saveQuestion", "保存到题库")}
          </Button>
        </div>
      </header>
      <main className={styles.content}>
        {draft && structure ? (
          <QuestionAssetContentPanel
            draft={draft}
            onChange={setDraft}
            questionTypeTemplates={questionTypeTemplates}
            uploadImage={uploadQuestionAssetImage}
          />
        ) : (
          <section className={styles.editorPanel}>
            <Spin spinning={questionTypesLoading}>
              <Empty
                description={trans(
                  QUESTION_ASSET_NO_TYPE_MESSAGE_KEY,
                  QUESTION_ASSET_NO_TYPE_MESSAGE_TEXT,
                )}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Spin>
          </section>
        )}
        <aside className={styles.sidePanel}>
          <QuestionAssetScopePanel
            disabled={Boolean(editQuestionId)}
            gradeOptions={gradeOptions}
            onGradeChange={changeGrade}
            onSubjectChange={changeSubject}
            subjectOptions={subjectOptions}
            value={resourceDraft}
          />
          <QuestionAssetTypePanel
            disabled={questionTypesLoading || typeOptions.length === 0}
            locked={Boolean(editQuestionId)}
            onChange={changeType}
            options={typeOptions}
            value={selectedTypeId}
          />
          <QuestionAssetMetadataPanel
            chapterOptions={chapterOptions}
            indicatorOptions={indicatorOptions}
            knowledgeOptions={knowledgeOptions}
            onChange={changeMetadata}
            value={resourceDraft}
          />
        </aside>
      </main>
    </div>
  );
}

QuestionAssetInput.propTypes = {
  allGradeList: PropTypes.arrayOf(PropTypes.object),
  chapterList: PropTypes.arrayOf(PropTypes.object),
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.shape({
    go: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }),
  labelList: PropTypes.arrayOf(PropTypes.object),
  subjectList: PropTypes.arrayOf(PropTypes.object),
  treeData: PropTypes.arrayOf(PropTypes.object),
};

QuestionAssetInput.defaultProps = {
  allGradeList: [],
  chapterList: [],
  labelList: [],
  match: { params: {} },
  subjectList: [],
  treeData: [],
};

export { QuestionAssetInput as PureQuestionAssetInput };

export default connect((state) => ({
  allGradeList: state.inputQuestion.allGradeList,
  chapterList: state.inputQuestion.chapterList,
  labelList: state.inputQuestion.labelList,
  subjectList: state.inputQuestion.subjectList,
  treeData: state.inputQuestion.treeData,
}))(QuestionAssetInput);

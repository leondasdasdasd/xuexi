import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { message, Select } from "antd";
import { connect } from "dva";
import PropTypes from "prop-types";

import { richerUploadFile } from "../../services/global";
import { trans } from "../../utils/i18n";
import { createAntTreeSelectOptionsFromInputQuestionTree } from "../../utils/inputQuestionTreeSelectAdapter.js";
import {
  buildSharedToolbarController,
  isSameSharedToolbarState,
} from "../SlateRichEditor/sharedToolbarState";
import FieldLabel from "./FieldLabel";
import MetaEditor from "./MetaEditor";
import QuestionBlock from "./QuestionBlock";
import {
  buildQuestionEditorLocalSavePayload,
  buildQuestionEntrySavePayload,
  createQuestionEditorDraft,
  QUESTION_TYPE_OPTIONS,
  resetQuestionDraftByType,
  toArray,
  validateQuestionEditorDraft,
} from "./questionEntryModel";
import { css } from "./questionEntryStyles";
import QuestionTypeGroup from "./QuestionTypeGroup";
import SharedRichTextToolbar from "./SharedRichTextToolbar";

const { Option } = Select;

const updateQuestionAtPath = (question, path, updater) => {
  if (path.length === 0) {
    return updater(question);
  }

  const [childIndex, ...restPath] = path;
  return {
    ...question,
    sonQuestionList: toArray(question.sonQuestionList).map(
      (childQuestion, index) =>
        index === childIndex
          ? updateQuestionAtPath(childQuestion, restPath, updater)
          : childQuestion,
    ),
  };
};

const createInitialQuestionDraft = (initialQuestion, initialContext) =>
  createQuestionEditorDraft({
    ...initialContext,
    ...initialQuestion,
  });

/**
 * 题目录入编辑器，统一承载单题录入页面和试卷详情弹窗。
 * @param {object} properties 组件属性。
 * @returns {React.ReactElement} 题目录入编辑器。
 */
function QuestionEntryEditor(properties) {
  const {
    allGradeList,
    chapterList,
    dispatch,
    initialContext,
    initialQuestion,
    labelList,
    onControllerReady,
    onSubmit,
    subjectList,
    treeData,
  } = properties;
  const shellReference = useRef();
  const [activeEditorController, setActiveEditorController] = useState();
  const [questionDraft, setQuestionDraft] = useState(() =>
    createInitialQuestionDraft(initialQuestion, initialContext),
  );

  const popupContainer = useCallback(
    () => shellReference.current || document.body,
    [],
  );

  const knowledgeTreeData = useMemo(
    () => createAntTreeSelectOptionsFromInputQuestionTree(treeData),
    [treeData],
  );
  const chapterTreeData = useMemo(
    () => createAntTreeSelectOptionsFromInputQuestionTree(chapterList),
    [chapterList],
  );
  const indicatorTreeData = useMemo(
    () => createAntTreeSelectOptionsFromInputQuestionTree(labelList),
    [labelList],
  );

  useEffect(() => {
    setActiveEditorController();
    setQuestionDraft(
      createInitialQuestionDraft(initialQuestion, initialContext),
    );
  }, [initialQuestion, initialContext]);

  useEffect(() => {
    dispatch({ type: "inputQuestion/getAllGradeList" });
  }, [dispatch]);

  useEffect(() => {
    if (!questionDraft.gradeId) {
      return;
    }

    dispatch({
      type: "inputQuestion/getSubjectList",
      payload: { gradeId: questionDraft.gradeId },
    });
  }, [dispatch, questionDraft.gradeId]);

  useEffect(() => {
    if (!questionDraft.gradeId || !questionDraft.subjectId) {
      return;
    }

    const payload = {
      gradeId: questionDraft.gradeId,
      subjectId: questionDraft.subjectId,
    };

    dispatch({ type: "inputQuestion/getTree", payload });
    dispatch({ type: "inputQuestion/getLabel", payload });
    dispatch({ type: "inputQuestion/getChapter", payload });
  }, [dispatch, questionDraft.gradeId, questionDraft.subjectId]);

  const updateRootQuestion = (path, updater) => {
    setQuestionDraft((currentDraft) =>
      updateQuestionAtPath(currentDraft, path, updater),
    );
  };

  const removeQuestionAtPath = (path) => {
    if (path.length === 0) {
      return;
    }

    const parentPath = path.slice(0, -1);
    const removeIndex = path.at(-1);

    setQuestionDraft((currentDraft) =>
      updateQuestionAtPath(currentDraft, parentPath, (question) => ({
        ...question,
        sonQuestionList: toArray(question.sonQuestionList).filter(
          (_, index) => index !== removeIndex,
        ),
      })),
    );
  };

  const handleEditorActive = useCallback((editorController) => {
    const nextController = buildSharedToolbarController(editorController);
    setActiveEditorController((currentController) =>
      isSameSharedToolbarState(currentController, nextController)
        ? currentController
        : nextController,
    );
  }, []);

  const uploadRichImage = async (file) => {
    if (!file) {
      throw new Error(trans("global.uploadFailed", "图片上传失败"));
    }

    const response = await richerUploadFile(file);
    const fileUrl =
      response &&
      response.status &&
      response.content &&
      response.content[0] &&
      response.content[0].url;

    if (!fileUrl) {
      throw new Error(trans("global.uploadFailed", "图片上传失败"));
    }

    return `${window.location.origin}${fileUrl}`;
  };

  const handleGradeChange = (gradeId) => {
    setQuestionDraft((currentDraft) => ({
      ...currentDraft,
      chapterIds: [],
      chapterLabels: [],
      chapterSelections: [],
      gradeId,
      indicatorIds: [],
      indicatorLabels: [],
      indicatorSelections: [],
      knowledgeIds: [],
      knowledgeLabels: [],
      knowledgeSelections: [],
      subjectId: undefined,
    }));
  };

  const handleSubjectChange = (subjectId) => {
    setQuestionDraft((currentDraft) => ({
      ...currentDraft,
      chapterIds: [],
      chapterLabels: [],
      chapterSelections: [],
      indicatorIds: [],
      indicatorLabels: [],
      indicatorSelections: [],
      knowledgeIds: [],
      knowledgeLabels: [],
      knowledgeSelections: [],
      subjectId,
    }));
  };

  const handleRootQuestionChange = (patch) => {
    setQuestionDraft((currentDraft) => ({
      ...currentDraft,
      ...patch,
    }));
  };

  const handleRootQuestionPatch = (updater) => {
    setQuestionDraft((currentDraft) => updater(currentDraft));
  };

  const submitQuestion = useCallback(
    (action, event) => {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      // 录题入口直接保存到题库/试题篮，必须在前端先拦截业务必填项。
      const validationMessage = validateQuestionEditorDraft(questionDraft);
      if (validationMessage) {
        message.info(validationMessage);
        return;
      }

      const localPayload = buildQuestionEditorLocalSavePayload(questionDraft);
      const payload = buildQuestionEntrySavePayload(questionDraft);
      onSubmit({
        action,
        draft: localPayload.draft,
        payload,
      });
    },
    [onSubmit, questionDraft],
  );

  useEffect(() => {
    if (typeof onControllerReady !== "function") {
      return;
    }

    onControllerReady({
      submit: (action) => submitQuestion(action),
    });
  }, [onControllerReady, submitQuestion]);

  return (
    <div className={css.editorShell} ref={shellReference}>
      <div className={css.body}>
        <div className={css.questionLayout}>
          <div className={css.mainColumn}>
            {/* 共享工具栏只绑定当前激活的 Slate editor，避免每个富文本字段重复占用空间。 */}
            <SharedRichTextToolbar
              activeEditorController={activeEditorController}
              uploadImage={uploadRichImage}
            />
            <QuestionBlock
              chapterTreeData={chapterTreeData}
              indicatorTreeData={indicatorTreeData}
              knowledgeTreeData={knowledgeTreeData}
              onEditorActive={handleEditorActive}
              onQuestionRemove={removeQuestionAtPath}
              onQuestionUpdate={updateRootQuestion}
              path={[]}
              popupContainer={popupContainer}
              question={questionDraft}
              showInlineMeta={false}
              showInlineType={false}
              uploadImage={uploadRichImage}
            />
          </div>
          <aside className={css.sideColumn}>
            <div className={css.sideCard}>
              <div className={css.sideScopeGrid}>
                <div className={css.sideScopeTopRow}>
                  <div className={`${css.scopeField} ${css.sideCompactField}`}>
                    <FieldLabel
                      required
                      title={trans("global.grade", "年级")}
                    />
                    <Select
                      className={css.fullControl}
                      getPopupContainer={popupContainer}
                      onChange={handleGradeChange}
                      placeholder={trans("global.grade", "年级")}
                      value={questionDraft.gradeId}
                    >
                      {toArray(allGradeList).map((item) => (
                        <Option key={item.gradeId} value={item.gradeId}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <div className={`${css.scopeField} ${css.sideCompactField}`}>
                    <FieldLabel
                      required
                      title={trans("global.subject", "学科")}
                    />
                    <Select
                      className={css.fullControl}
                      getPopupContainer={popupContainer}
                      onChange={handleSubjectChange}
                      placeholder={trans("global.subject", "学科")}
                      value={questionDraft.subjectId}
                    >
                      {toArray(subjectList).map((item) => (
                        <Option key={item.id} value={item.id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className={`${css.scopeField} ${css.sideScopeWide}`}>
                  <FieldLabel
                    required
                    title={trans("global.questionType", "题型")}
                  />
                  <QuestionTypeGroup
                    onChange={(type) =>
                      handleRootQuestionPatch((currentQuestion) =>
                        resetQuestionDraftByType(currentQuestion, type),
                      )
                    }
                    options={QUESTION_TYPE_OPTIONS}
                    value={Number(questionDraft.type)}
                  />
                </div>
              </div>
              <div className={css.sideMetaStack}>
                <MetaEditor
                  chapterTreeData={chapterTreeData}
                  indicatorTreeData={indicatorTreeData}
                  knowledgeTreeData={knowledgeTreeData}
                  onQuestionChange={handleRootQuestionChange}
                  popupContainer={popupContainer}
                  question={questionDraft}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

QuestionEntryEditor.propTypes = {
  allGradeList: PropTypes.arrayOf(PropTypes.object),
  chapterList: PropTypes.arrayOf(PropTypes.object),
  dispatch: PropTypes.func.isRequired,
  initialContext: PropTypes.object,
  initialQuestion: PropTypes.object,
  labelList: PropTypes.arrayOf(PropTypes.object),
  onControllerReady: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  subjectList: PropTypes.arrayOf(PropTypes.object),
  treeData: PropTypes.arrayOf(PropTypes.object),
};

QuestionEntryEditor.defaultProps = {
  allGradeList: [],
  chapterList: [],
  initialContext: {},
  initialQuestion: {},
  labelList: [],
  onControllerReady: undefined,
  saving: false,
  subjectList: [],
  treeData: [],
};

export { QuestionEntryEditor as PureQuestionEntryEditor };
export { default as SectionMetaFields } from "./SectionMetaFields";

export default connect((state) => ({
  allGradeList: state.inputQuestion.allGradeList,
  chapterList: state.inputQuestion.chapterList,
  labelList: state.inputQuestion.labelList,
  subjectList: state.inputQuestion.subjectList,
  treeData: state.inputQuestion.treeData,
}))(QuestionEntryEditor);

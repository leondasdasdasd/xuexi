import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Icon, message, Select, Switch } from "antd";
import { connect } from "dva";
import PropTypes from "prop-types";

import {
  buildSharedToolbarController,
  isSameSharedToolbarState,
} from "../../../../components/SlateRichEditor/sharedToolbarState";
import { richerUploadFile } from "../../../../services/global";
import { trans } from "../../../../utils/i18n";
import { createAntTreeSelectOptionsFromInputQuestionTree } from "../../../../utils/inputQuestionTreeSelectAdapter.js";
import {
  css,
  Option,
  QUESTION_TASK_EDITOR_PREFERENCE_STORAGE_KEY,
} from "./constants";
import {
  FieldLabel,
  QuestionTypeSelect,
  SharedRichTextToolbar,
} from "./EditorFields";
import { getPathLabel, updateQuestionAtPath } from "./helpers";
import PageImageAssetPicker from "./PageImageAssetPicker";
import QuestionBlock from "./QuestionBlock";
import {
  buildQuestionEditorLocalSavePayload,
  createQuestionEditorDraft,
  QUESTION_TYPE_OPTIONS,
  resetQuestionDraftByType,
  toArray,
  validateQuestionEditorMetadata,
} from "./questionEditorModel";

const getDefaultEditorPreferences = (context) => {
  void context;

  return {
    isAnnotationCollapsed: false,
  };
};

const getMeasuredPixelSize = (size) =>
  Math.max(0, Math.ceil(Number(size) || 0));
const DEFAULT_SHARED_TOOLBAR_HEIGHT = 48;

const QUESTION_NAVIGATION_DIRECTION_NEXT = "next";
const QUESTION_NAVIGATION_DIRECTION_PREVIOUS = "previous";
const TEXT_EDITING_TARGET_SELECTOR = [
  "input",
  "textarea",
  "select",
  '[contenteditable="true"]',
  ".ant-input-number",
  ".ant-select",
  ".ant-select-dropdown",
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="textbox"]',
].join(",");

const QUESTION_NAVIGATION_KEYS = new Set(["ArrowUp", "ArrowDown"]);

const hasQuestionNavigationModifier = (event) =>
  event.repeat || event.ctrlKey || event.metaKey || event.shiftKey;

const getDirectionByArrowKey = (key) =>
  key === "ArrowUp"
    ? QUESTION_NAVIGATION_DIRECTION_PREVIOUS
    : QUESTION_NAVIGATION_DIRECTION_NEXT;

const getBrowserResizeObserver = (context) => {
  const targetWindow = context || window;

  return targetWindow && targetWindow["ResizeObserver"];
};

const readEditorPreferences = (context) => {
  void context;

  if (typeof window === "undefined" || !window.localStorage) {
    return getDefaultEditorPreferences();
  }

  try {
    return {
      ...getDefaultEditorPreferences(),
      ...JSON.parse(
        window.localStorage.getItem(
          QUESTION_TASK_EDITOR_PREFERENCE_STORAGE_KEY,
        ) || "{}",
      ),
    };
  } catch (error) {
    void error;
    return getDefaultEditorPreferences();
  }
};

const writeEditorPreferences = (preferences) => {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(
      QUESTION_TASK_EDITOR_PREFERENCE_STORAGE_KEY,
      JSON.stringify({
        ...readEditorPreferences(),
        ...preferences,
      }),
    );
  } catch (error) {
    void error;
  }
};

const getShortcutTargetElement = (target) =>
  target && typeof target.closest === "function"
    ? target
    : target?.parentElement;

const isTextEditingShortcutTarget = (target) => {
  const targetElement = getShortcutTargetElement(target);

  return !!(
    targetElement &&
    typeof targetElement.closest === "function" &&
    targetElement.closest(TEXT_EDITING_TARGET_SELECTOR)
  );
};

const isKeyboardEventInEditorShell = (event, shellNode) =>
  event.target === document.body || !!shellNode?.contains?.(event.target);

const getQuestionNavigationDirectionFromEvent = (event) => {
  if (
    hasQuestionNavigationModifier(event) ||
    !QUESTION_NAVIGATION_KEYS.has(event.key)
  ) {
    return "";
  }

  if (!event.altKey && isTextEditingShortcutTarget(event.target)) {
    return "";
  }

  return getDirectionByArrowKey(event.key);
};

/**
 * 编辑 OCR 题目草稿，并通过 QuestionTask 既有本地保存契约回写页面状态。
 * @param {object} properties 组件属性。
 * @returns {React.ReactElement} 题目编辑抽屉内容。
 */
function TaskQuestionEditor(properties) {
  const {
    allGradeList,
    chapterList,
    dispatch,
    editQuestion,
    hasNextQuestion,
    hasPreviousQuestion,
    labelList,
    onCancel,
    onLocalSave,
    onNavigateQuestion,
    onSaveAndNext,
    questionPosition,
    sourceImageAssets,
    subjectList,
    targetSubQuestionIndex,
    totalQuestionCount,
    treeData,
  } = properties;
  const shellReference = useRef();
  const sharedToolbarReference = useRef();
  const [activeEditorController, setActiveEditorController] = useState();
  const [isAnnotationCollapsed, setIsAnnotationCollapsed] = useState(
    (context) => {
      void context;

      return readEditorPreferences().isAnnotationCollapsed;
    },
  );
  const [isSourceImagePanelCollapsed, setIsSourceImagePanelCollapsed] =
    useState(false);
  const [sharedToolbarHeight, setSharedToolbarHeight] = useState(
    DEFAULT_SHARED_TOOLBAR_HEIGHT,
  );
  const [questionDraft, setQuestionDraft] = useState(() =>
    createQuestionEditorDraft(editQuestion),
  );
  const hasSourceImageAssets = useMemo(
    () => toArray(sourceImageAssets).some((asset) => asset && asset.imageUrl),
    [sourceImageAssets],
  );

  const popupContainer = useCallback(
    () => shellReference.current || document.body,
    [],
  );

  const syncSharedToolbarHeight = useCallback(() => {
    const toolbarNode = sharedToolbarReference.current;

    if (
      !toolbarNode ||
      typeof toolbarNode.getBoundingClientRect !== "function"
    ) {
      return;
    }

    // 配图 dock 吸附在编辑器外侧，需要跟随工具栏换行后的真实高度对齐。
    const nextHeight = getMeasuredPixelSize(
      toolbarNode.getBoundingClientRect().height,
    );
    if (!nextHeight) {
      return;
    }

    setSharedToolbarHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight,
    );
  }, []);

  const bindSharedToolbarReference = useCallback(
    (node) => {
      sharedToolbarReference.current = node;
      syncSharedToolbarHeight();
    },
    [syncSharedToolbarHeight],
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
    setIsSourceImagePanelCollapsed(false);
    setQuestionDraft(createQuestionEditorDraft(editQuestion));
  }, [editQuestion]);

  useLayoutEffect(() => {
    const toolbarNode = sharedToolbarReference.current;

    if (
      !toolbarNode ||
      typeof toolbarNode.getBoundingClientRect !== "function"
    ) {
      return;
    }

    syncSharedToolbarHeight();

    const ResizeObserverConstructor = getBrowserResizeObserver(window);
    const resizeObserver =
      typeof ResizeObserverConstructor === "function"
        ? new ResizeObserverConstructor(syncSharedToolbarHeight)
        : undefined;

    if (resizeObserver) {
      resizeObserver.observe(toolbarNode);
    }

    window.addEventListener("resize", syncSharedToolbarHeight);

    return (event) => {
      void event;

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      window.removeEventListener("resize", syncSharedToolbarHeight);
    };
  }, [activeEditorController, hasSourceImageAssets, syncSharedToolbarHeight]);

  useEffect(() => {
    if (!Number.isInteger(targetSubQuestionIndex)) {
      return;
    }

    const targetNode = shellReference.current?.querySelector(
      `[data-question-editor-child-index="${targetSubQuestionIndex}"]`,
    );

    if (targetNode && typeof targetNode.scrollIntoView === "function") {
      // 双击组合题子题进入编辑时，直接定位到对应子题，减少在抽屉内来回滚动。
      targetNode.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [editQuestion, targetSubQuestionIndex]);

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
      knowledgeIds: [],
      knowledgeLabels: [],
      knowledgeSelections: [],
      subjectId,
    }));
  };

  const handleQuestionTypeChange = (type) => {
    setQuestionDraft((currentDraft) =>
      resetQuestionDraftByType(currentDraft, type),
    );
  };

  const saveQuestionDraft = useCallback(
    (saveAction) => {
      // 当前题保存只拦截缺少年级/学科，其他录题完整性统一交给试卷层处理。
      const validationMessage = validateQuestionEditorMetadata(questionDraft);
      if (validationMessage) {
        message.info(validationMessage);
        return;
      }

      saveAction(buildQuestionEditorLocalSavePayload(questionDraft));
    },
    [questionDraft],
  );

  const handleSave = (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    saveQuestionDraft(onLocalSave);
  };

  const handleSaveAndNext = (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    saveQuestionDraft(onSaveAndNext);
  };

  const handleQuestionNavigation = useCallback(
    (direction) => {
      const canNavigatePrevious =
        direction === QUESTION_NAVIGATION_DIRECTION_PREVIOUS &&
        hasPreviousQuestion;
      const canNavigateNext =
        direction === QUESTION_NAVIGATION_DIRECTION_NEXT && hasNextQuestion;

      if (!canNavigatePrevious && !canNavigateNext) {
        return;
      }

      saveQuestionDraft((localSavePayload) =>
        onNavigateQuestion(direction, localSavePayload),
      );
    },
    [
      hasNextQuestion,
      hasPreviousQuestion,
      onNavigateQuestion,
      saveQuestionDraft,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isKeyboardEventInEditorShell(event, shellReference.current)) {
        return;
      }

      const direction = getQuestionNavigationDirectionFromEvent(event);

      if (!direction) {
        return;
      }

      event.preventDefault();
      handleQuestionNavigation(direction);
    };

    window.addEventListener("keydown", handleKeyDown);

    return (event) => {
      void event;

      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleQuestionNavigation]);

  const handleAnnotationCollapsedChange = (collapsed) => {
    setIsAnnotationCollapsed(collapsed);
    writeEditorPreferences({ isAnnotationCollapsed: collapsed });
  };

  const annotationToggleLabel = isAnnotationCollapsed
    ? trans("questionTask.expandAnnotation", "展开标注")
    : trans("questionTask.collapseAnnotation", "收起标注");
  const sourceImageDockStyle = useMemo(
    () =>
      hasSourceImageAssets
        ? {
            top: `-${sharedToolbarHeight}px`,
          }
        : undefined,
    [hasSourceImageAssets, sharedToolbarHeight],
  );

  return (
    <div className={css.editorShell} ref={shellReference}>
      <div className={css.header}>
        <button
          aria-label={trans("global.back", "返回")}
          className={css.iconButton}
          onClick={onCancel}
          title={trans("global.back", "返回")}
          type="button"
        >
          <Icon type="arrow-left" />
        </button>
        <div className={css.headerTitle}>
          <span>
            {trans("questionTask.editQuestionTitle", "Edit Question")}
          </span>
          <small>
            {questionPosition && totalQuestionCount
              ? trans(
                  "questionTask.editQuestionProgress",
                  "第 {$current} / {$total} 题",
                  {
                    current: questionPosition,
                    total: totalQuestionCount,
                  },
                )
              : getPathLabel([])}
          </small>
        </div>
        <div className={css.headerActions}>
          <span className={css.annotationToggle}>
            <Switch
              size="small"
              checked={isAnnotationCollapsed}
              aria-label={annotationToggleLabel}
              onChange={handleAnnotationCollapsedChange}
            />
            <span>{annotationToggleLabel}</span>
          </span>
          <Button disabled={!hasNextQuestion} onClick={handleSaveAndNext}>
            {trans("questionTask.saveAndEditNext", "保存并下一题")}
          </Button>
          <Button type="primary" onClick={handleSave}>
            {trans("global.save", "保存")}
          </Button>
        </div>
      </div>

      {/* 共享工具栏只绑定当前激活的 Slate editor，避免每个富文本字段重复占用空间。 */}
      <div
        data-question-editor-shared-toolbar="true"
        ref={bindSharedToolbarReference}
      >
        <SharedRichTextToolbar
          activeEditorController={activeEditorController}
          uploadImage={uploadRichImage}
        />
      </div>

      <div
        className={`${css.editorStage} ${
          hasSourceImageAssets ? css.editorStageWithImages : ""
        } ${
          hasSourceImageAssets && isSourceImagePanelCollapsed
            ? css.editorStageImagesCollapsed
            : ""
        }`}
        data-testid="task-question-editor-stage"
      >
        {hasSourceImageAssets ? (
          <div
            className={css.sourceImageDock}
            data-testid="source-image-dock"
            style={sourceImageDockStyle}
          >
            <PageImageAssetPicker
              activeEditorController={activeEditorController}
              isCollapsed={isSourceImagePanelCollapsed}
              onCollapsedChange={setIsSourceImagePanelCollapsed}
              sourceImageAssets={sourceImageAssets}
            />
          </div>
        ) : (
          false
        )}
        <div
          className={css.editorContent}
          data-testid="task-question-editor-content"
        >
          <div className={css.editorContentMain}>
            <div className={css.scopeBar}>
              <div className={css.scopeField}>
                <FieldLabel required title={trans("global.grade", "年级")} />
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
              <div className={css.scopeField}>
                <FieldLabel required title={trans("global.subject", "学科")} />
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
              <div className={css.scopeField}>
                <FieldLabel
                  required
                  title={trans("global.questionType", "题型")}
                />
                <QuestionTypeSelect
                  onChange={handleQuestionTypeChange}
                  options={QUESTION_TYPE_OPTIONS}
                  value={Number(questionDraft.type)}
                />
              </div>
            </div>

            <div className={css.body}>
              <QuestionBlock
                chapterTreeData={chapterTreeData}
                indicatorTreeData={indicatorTreeData}
                isAnnotationCollapsed={isAnnotationCollapsed}
                knowledgeTreeData={knowledgeTreeData}
                onEditorActive={handleEditorActive}
                onQuestionRemove={removeQuestionAtPath}
                onQuestionUpdate={updateRootQuestion}
                path={[]}
                popupContainer={popupContainer}
                question={questionDraft}
                uploadImage={uploadRichImage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

TaskQuestionEditor.propTypes = {
  allGradeList: PropTypes.arrayOf(PropTypes.object),
  chapterList: PropTypes.arrayOf(PropTypes.object),
  dispatch: PropTypes.func.isRequired,
  editQuestion: PropTypes.object.isRequired,
  hasNextQuestion: PropTypes.bool,
  hasPreviousQuestion: PropTypes.bool,
  labelList: PropTypes.arrayOf(PropTypes.object),
  onCancel: PropTypes.func.isRequired,
  onLocalSave: PropTypes.func.isRequired,
  onNavigateQuestion: PropTypes.func,
  onSaveAndNext: PropTypes.func,
  questionPosition: PropTypes.number,
  sourceImageAssets: PropTypes.arrayOf(PropTypes.object),
  subjectList: PropTypes.arrayOf(PropTypes.object),
  targetSubQuestionIndex: PropTypes.number,
  totalQuestionCount: PropTypes.number,
  treeData: PropTypes.arrayOf(PropTypes.object),
};

TaskQuestionEditor.defaultProps = {
  allGradeList: [],
  chapterList: [],
  hasNextQuestion: false,
  hasPreviousQuestion: false,
  labelList: [],
  onNavigateQuestion: (event) => {
    void event;
  },
  onSaveAndNext: (event) => {
    void event;
  },
  questionPosition: 0,
  sourceImageAssets: [],
  subjectList: [],
  targetSubQuestionIndex: undefined,
  totalQuestionCount: 0,
  treeData: [],
};

export { TaskQuestionEditor as PureTaskQuestionEditor };

export { SectionMetaFields } from "./EditorFields";

export default connect((state) => ({
  allGradeList: state.inputQuestion.allGradeList,
  chapterList: state.inputQuestion.chapterList,
  labelList: state.inputQuestion.labelList,
  subjectList: state.inputQuestion.subjectList,
  treeData: state.inputQuestion.treeData,
}))(TaskQuestionEditor);

export { default as PageImageAssetPicker } from "./PageImageAssetPicker";

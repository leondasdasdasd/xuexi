import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, message, Spin } from "antd";
import { connect } from "dva";

import { buildTeacherPaperTrialUrl } from "../../common/explicitExamRoutes";
import TeacherPaperTrialQrCodeModal from "../../common/TeacherPaperTrialQrCodeModal";
import ModalOnlineTest from "../../components/ModalOnlineTest";
import type { ExamPaperEditDisabledReasonCode } from "../../services/examPaperV2.types";
import { trans } from "../../utils/i18n";
import { getPageQuery } from "../../utils/utils";
import PaperEditorContent from "./components/PaperEditorContent";
import PaperEditorLibraryQuestions, {
  type QuestionLibraryTarget,
} from "./components/PaperEditorLibraryQuestions";
import PaperEditorQuestionModal from "./components/PaperEditorQuestionModal";
import {
  getPaperEditDisabledMessage,
  loadPaperDetailViewModel,
} from "./paperDetailViewModel";
import { getPaperQuestionScoreElementId } from "./paperEditorDomIds";
import {
  createPaperEditorDraft,
  createPaperSaveRequest,
  type PaperEditorValidationError,
  removePaperQuestion,
  validatePaperEditorDraft,
} from "./paperEditorModel";
import {
  buildPaperEditorEditPath,
  buildPaperEditorPreviewPath,
  parsePaperEditorPageContext,
  parsePaperEditorSearch,
} from "./paperEditorPageContext";
import {
  getPaperEditorDisplayError,
  loadPaperEditorSource,
  savePaperEditorDraft,
} from "./paperEditorService";
import { downloadExamPaperPdf } from "./paperPdf";
import type {
  GradeOption,
  PaperEditorDraft,
  PaperEditorPageContext,
  PaperTypeOption,
  SubjectOption,
} from "./types";

import styles from "./index.module.less";

interface Props {
  dispatch: (action: { payload?: unknown; type: string }) => void;
  history?: {
    goBack?: () => void;
    length?: number;
    push?: (path: string) => void;
  };
  location?: { search: string };
}

interface OnlineTestModalProps {
  dispatch: Props["dispatch"];
  history?: Props["history"];
  mode?: PaperEditorPageContext["mode"];
  onClose: () => void;
  paperId?: number;
  visible: boolean;
}

const getInitiateTestAction = (
  mode: PaperEditorPageContext["mode"] | undefined,
  onInitiateTest: () => void,
) => (mode === "preview" ? { onInitiateTest } : {});

const PaperEditorOnlineTestModal = (
  properties: OnlineTestModalProps,
): React.ReactElement | null => {
  const { dispatch, history, mode, onClose, paperId, visible } = properties;
  if (mode !== "preview" || !paperId || !visible) return null;

  const handleSuccess = () => {
    onClose();
    if (history?.push) {
      history.push("/examAnalysis");
      return;
    }
    window.location.hash = "/examAnalysis";
  };

  return (
    <ModalOnlineTest
      modalOnlineTestProps={{
        dispatch,
        options: {
          onCancel: onClose,
          onOk: handleSuccess,
          title: trans("global.launchOnlineQuiz", "发起线上测验"),
          visible: true,
          width: 700,
        },
        paperId,
        publicationContract: "V2",
      }}
    />
  );
};

const getValidationMessage = (
  error: Exclude<PaperEditorValidationError, { code: "missingScore" }>,
) => {
  switch (error) {
    case "emptyPaper": {
      return trans("paperEditor.emptyPaperError", "试卷至少需要一道题");
    }
    case "emptyModule": {
      return trans(
        "paperEditor.emptyModuleError",
        "试卷存在没有题目的题块，请添加题目或删除题块",
      );
    }
    case "emptyPlacement": {
      return trans(
        "paperEditor.unassociatedPlacementSaveError",
        "试卷存在未关联题位，暂不能保存",
      );
    }
    case "missingModuleTitle": {
      return trans("paperEditor.moduleTitleRequired", "请填写每个块的标题");
    }
    case "missingPaperTitle": {
      return trans("paperEditor.paperTitleRequired", "请填写试卷标题");
    }
    case "missingPaperType": {
      return trans("paperEditor.paperTypeRequired", "请选择试卷类型");
    }
    case "missingGrade": {
      return trans("paperEditor.gradeRequired", "请选择年级");
    }
  }
};

const getLocale = (): "en-US" | "zh-CN" =>
  typeof window !== "undefined" &&
  String(
    Reflect.get(window, "globalLange") || navigator.language || "",
  ).startsWith("en")
    ? "en-US"
    : "zh-CN";

const loadPaperEditorData = async (subjectId: number, locale: string) => {
  const source = await loadPaperEditorSource(subjectId);
  const draft = createPaperEditorDraft(
    source.basket,
    source.questionTypes,
    locale,
  );
  return {
    draft: { ...draft, paperType: source.paperTypes[0]?.code },
    grades: source.grades,
    paperTypes: source.paperTypes,
    subjects: source.subjects,
  };
};

const loadPaperEditorPageData = (
  context: NonNullable<ReturnType<typeof parsePaperEditorPageContext>>,
  locale: string,
) =>
  context.mode === "create"
    ? loadPaperEditorData(context.subjectId, locale)
    : loadPaperDetailViewModel(context.paperId, locale);

const isEditPermissionDowngraded = (
  context: NonNullable<ReturnType<typeof parsePaperEditorPageContext>>,
  result: Awaited<ReturnType<typeof loadPaperEditorPageData>>,
): boolean =>
  context.mode === "edit" && "updateAllowed" in result && !result.updateAllowed;

const openDownload = (url: string): void => {
  window.open(url, "_blank", "noopener,noreferrer");
};

const getPaperDownloadActions = (mode?: string, paperId?: number) =>
  mode === "preview" && paperId
    ? {
        onDownloadAnswerSheet: () =>
          openDownload(`/api/v2/exam-papers/${paperId}/answer-sheet`),
        onDownloadPaper: () => void downloadExamPaperPdf({ paperId }),
      }
    : {};

/**
 * 编排 V2 试题栏并映射到现有试卷保存边界。
 * @param {Props} properties 页面属性。
 * @returns {React.ReactElement} 试卷编辑页。
 */
export function PaperEditor(properties: Props): React.ReactElement {
  const { dispatch, history, location } = properties;
  const routeSearch = location?.search;
  const pageContext = useMemo(() => {
    return routeSearch === undefined
      ? parsePaperEditorPageContext(getPageQuery())
      : parsePaperEditorSearch(routeSearch);
  }, [routeSearch]);
  const locale = getLocale();
  const [draft, setDraft] = useState<PaperEditorDraft | null>(null);
  const [grades, setGrades] = useState<GradeOption[]>([]);
  const [paperTypes, setPaperTypes] = useState<PaperTypeOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [canEditPaper, setCanEditPaper] = useState(false);
  const [editDisabledReasonCode, setEditDisabledReasonCode] = useState<
    ExamPaperEditDisabledReasonCode | undefined
  >();
  const [permissionDowngraded, setPermissionDowngraded] = useState(false);
  const [questionEditorTargetId, setQuestionEditorTargetId] = useState<
    number | null | undefined
  >();
  const [questionLibraryTarget, setQuestionLibraryTarget] =
    useState<QuestionLibraryTarget>();
  const [ipadTrialPaperId, setIpadTrialPaperId] = useState<number>();
  const [onlineTestVisible, setOnlineTestVisible] = useState(false);

  useEffect(() => {
    // 路由上下文变化时清空上一份试卷状态，避免新详情返回前泄露旧权限或草稿。
    setLoading(true);
    setDraft(null);
    setCanEditPaper(false);
    setEditDisabledReasonCode(void 0);
    setPermissionDowngraded(false);
    setLoadError("");
    setIpadTrialPaperId(void 0);
    setOnlineTestVisible(false);
    if (!pageContext) {
      setLoadError(
        trans("paperEditor.invalidContext", "页面参数无效，无法加载试卷"),
      );
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const result = await loadPaperEditorPageData(pageContext, locale);
        if (!active) return;
        setGrades(result.grades);
        setPaperTypes(result.paperTypes);
        setSubjects(result.subjects);
        setDraft(result.draft);
        setCanEditPaper(
          "updateAllowed" in result ? result.updateAllowed : false,
        );
        setEditDisabledReasonCode(
          "updateDisabledReasonCode" in result
            ? result.updateDisabledReasonCode
            : undefined,
        );
        setPermissionDowngraded(
          isEditPermissionDowngraded(pageContext, result),
        );
      } catch (error) {
        const displayError = getPaperEditorDisplayError(
          error,
          trans("paperEditor.loadFailed", "试卷加载失败"),
        );
        if (active && displayError) {
          setLoadError(displayError);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [locale, pageContext]);

  const refreshLegacyBasket = useCallback(() => {
    dispatch({ type: "home/getCount" });
    dispatch({ type: "home/getBasketList" });
  }, [dispatch]);

  const handleDeleteQuestion = useCallback((questionKey: string) => {
    // 删除只修改当前试卷草稿，试题栏仍保留原题，便于用户重新组卷。
    setDraft((current) =>
      current ? removePaperQuestion(current, questionKey) : current,
    );
  }, []);

  const handleSave = async () => {
    if (!draft || saving) return;
    const validationError = validatePaperEditorDraft(draft);
    if (validationError) {
      if (typeof validationError === "object") {
        const firstMissingScore = validationError.missingScores[0];
        const scoreInput = document.getElementById(
          getPaperQuestionScoreElementId(firstMissingScore.leafQuestionKey),
        );
        scoreInput?.scrollIntoView({ behavior: "smooth", block: "center" });
        scoreInput?.focus();
        message.warning(trans("paperEditor.missingScorePrompt", "请填写分数"));
        return;
      }
      message.warning(getValidationMessage(validationError));
      return;
    }
    setSaving(true);
    try {
      const paperId = await savePaperEditorDraft(createPaperSaveRequest(draft));
      refreshLegacyBasket();
      message.success(trans("paperEditor.saveSuccess", "试卷保存成功"));
      history?.push?.(buildPaperEditorPreviewPath(paperId));
    } catch (error) {
      const displayError = getPaperEditorDisplayError(
        error,
        trans("paperEditor.saveFailed", "试卷保存失败"),
      );
      if (displayError) message.error(displayError);
    } finally {
      setSaving(false);
    }
  };

  const handleTrial = useCallback((paperId: number) => {
    window.open(
      buildTeacherPaperTrialUrl(paperId),
      "_blank",
      "noopener,noreferrer",
    );
  }, []);

  const handleIpadTrial = useCallback((paperId: number) => {
    setIpadTrialPaperId(paperId);
  }, []);

  const handleEdit = useCallback(
    (paperId: number) => history?.push?.(buildPaperEditorEditPath(paperId)),
    [history],
  );

  const handleClose = useCallback(() => {
    // 应用内组卷返回来源页；独立窗口缺少路由导航时由浏览器关闭当前页。
    if (
      pageContext?.mode !== "preview" &&
      history?.goBack &&
      (history.length || 0) > 1
    ) {
      history.goBack();
      return;
    }
    window.close();
  }, [history, pageContext]);

  if (loading) {
    return (
      <div className={styles["center-state"]}>
        <Spin tip={trans("paperEditor.loading", "正在加载试卷")} />
      </div>
    );
  }
  if (loadError || !draft) {
    return <Alert message={loadError} showIcon type="error" />;
  }

  const editable = pageContext?.mode !== "preview" && !permissionDowngraded;
  const editDisabledReason = getPaperEditDisabledMessage(
    editDisabledReasonCode,
  );
  const downloadActions = getPaperDownloadActions(
    pageContext?.mode,
    draft.paperId,
  );
  return (
    <>
      <PaperEditorContent
        draft={draft}
        editDisabledReason={editDisabledReason}
        {...(pageContext?.mode === "preview" && history?.push
          ? {
              editAction: {
                allowed: canEditPaper,
                disabledReason: editDisabledReason,
                onEdit: () => handleEdit(pageContext.paperId),
              },
            }
          : {})}
        editable={editable}
        grades={grades}
        locale={locale}
        onAddLibraryQuestions={(moduleKey, initialQuestionTypeKey) => {
          setQuestionLibraryTarget({ moduleKey, initialQuestionTypeKey });
        }}
        onDeleteQuestion={handleDeleteQuestion}
        onAddQuestion={() => setQuestionEditorTargetId(null)}
        onDraftChange={setDraft}
        {...downloadActions}
        onEditQuestion={setQuestionEditorTargetId}
        {...getInitiateTestAction(pageContext?.mode, () =>
          setOnlineTestVisible(true),
        )}
        onIpadTrial={handleIpadTrial}
        onClose={handleClose}
        onSave={handleSave}
        onTrial={handleTrial}
        paperTypes={paperTypes}
        permissionDowngraded={permissionDowngraded}
        saving={saving}
        subjects={subjects}
      />
      <PaperEditorQuestionModal
        draft={draft}
        editable={editable}
        onClose={() => setQuestionEditorTargetId(void 0)}
        setDraft={setDraft}
        targetQuestionId={questionEditorTargetId}
      />
      <PaperEditorLibraryQuestions
        draft={draft}
        grades={grades}
        locale={locale}
        onClose={() => setQuestionLibraryTarget(void 0)}
        setDraft={setDraft}
        subjects={subjects}
        target={questionLibraryTarget}
      />
      <TeacherPaperTrialQrCodeModal
        onClose={() => setIpadTrialPaperId(void 0)}
        paperId={ipadTrialPaperId}
      />
      <PaperEditorOnlineTestModal
        dispatch={dispatch}
        history={history}
        mode={pageContext?.mode}
        onClose={() => setOnlineTestVisible(false)}
        paperId={draft.paperId}
        visible={onlineTestVisible}
      />
    </>
  );
}

export default connect()(PaperEditor);

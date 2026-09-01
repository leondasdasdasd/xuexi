import React from "react";
import { Alert, Button, Empty, Input } from "antd";

import { trans } from "../../../utils/i18n";
import { getPaperModuleTitleElementId } from "../paperEditorDomIds";
import {
  appendPaperModule,
  getPaperTotalScore,
  movePaperModule,
  movePaperQuestion,
  removePaperModule,
  setLeafQuestionScore,
  setPaperModuleLeafScores,
  updateModuleTitle,
  updatePaperGrade,
  updatePaperSubject,
} from "../paperEditorModel";
import type {
  GradeOption,
  PaperEditorDraft,
  PaperTypeOption,
  SubjectOption,
} from "../types";
import ModuleList from "./ModuleList";
import PaperEditorToolbarActions, {
  type PaperEditorEditAction,
} from "./PaperEditorToolbarActions";
import PaperOutlineSidebar from "./PaperOutlineSidebar";
import ReadOnlyPaperDetailContent from "./ReadOnlyPaperDetailContent";

import styles from "../index.module.less";

interface Props {
  draft: PaperEditorDraft;
  editAction?: PaperEditorEditAction;
  editDisabledReason?: string;
  editable: boolean;
  grades: GradeOption[];
  locale: "en-US" | "zh-CN";
  onDeleteQuestion: (questionKey: string) => void;
  onAddLibraryQuestions: (
    moduleKey: string,
    initialQuestionTypeKey?: number,
  ) => void;
  onAddQuestion: () => void;
  onEditQuestion: (questionId: number) => void;
  onClose: () => void;
  onDraftChange: (draft: PaperEditorDraft) => void;
  onDownloadAnswerSheet?: () => void;
  onDownloadPaper?: () => void;
  onInitiateTest?: () => void;
  onIpadTrial: (paperId: number) => void;
  onSave: () => void;
  onTrial: (paperId: number) => void;
  paperTypes: PaperTypeOption[];
  permissionDowngraded: boolean;
  saving: boolean;
  subjects: SubjectOption[];
}

/**
 * 根据页面能力渲染可编辑或只读的试卷内容。
 * @param {Props} properties 已映射的草稿、选项和页面能力。
 * @returns {React.ReactElement} 试卷页面内容。
 */
function PaperEditorContent(properties: Props): React.ReactElement {
  const {
    draft,
    editAction,
    editDisabledReason,
    editable,
    grades,
    locale,
    onAddQuestion,
    onAddLibraryQuestions,
    onDeleteQuestion,
    onDraftChange,
    onDownloadAnswerSheet,
    onDownloadPaper,
    onEditQuestion,
    onInitiateTest,
    onClose,
    onIpadTrial,
    onSave,
    onTrial,
    paperTypes,
    permissionDowngraded,
    saving,
    subjects,
  } = properties;
  const pageTitle = editable
    ? trans("paperEditor.editPaper", "编辑试卷")
    : trans("paperEditor.previewPaper", "预览试卷");
  const totalScore = getPaperTotalScore(draft);
  const trialPaperId = draft.paperId;
  const onTrialAction = trialPaperId ? () => onTrial(trialPaperId) : undefined;
  const onIpadTrialAction = trialPaperId
    ? () => onIpadTrial(trialPaperId)
    : undefined;
  const addModule = () => {
    const nextDraft = appendPaperModule(draft);
    const moduleKey = nextDraft.modules.at(-1)?.key;
    onDraftChange(nextDraft);
    if (!moduleKey) return;
    window.requestAnimationFrame(() => {
      const titleInput = document.getElementById(
        getPaperModuleTitleElementId(moduleKey),
      );
      titleInput?.scrollIntoView({ behavior: "smooth", block: "center" });
      titleInput?.focus();
    });
  };
  return (
    <div className={styles["paper-editor"]}>
      <header className={styles["editor-toolbar"]}>
        <Button
          className={styles["toolbar-back"]}
          type="link"
          onClick={onClose}
        >
          <span aria-hidden="true" className={styles["close-symbol"]}>
            ×
          </span>
          {pageTitle}
        </Button>
        <strong className={styles["full-score"]}>
          {trans("paperEditor.fullScore", "满分")} {totalScore}
        </strong>
        <PaperEditorToolbarActions
          editAction={editAction}
          editable={editable}
          onAddQuestion={onAddQuestion}
          onDownloadAnswerSheet={onDownloadAnswerSheet}
          onDownloadPaper={onDownloadPaper}
          onInitiateTest={onInitiateTest}
          onSave={onSave}
          saving={saving}
        />
      </header>
      {editable ? (
        <div className={styles["editor-layout"]}>
          <main className={styles["paper-main"]}>
            <Input
              aria-label={trans("paperEditor.paperTitle", "试卷标题")}
              className={styles["paper-title"]}
              maxLength={59}
              placeholder={trans(
                "paperEditor.paperTitlePlaceholder",
                "请输入试卷标题",
              )}
              value={draft.title}
              onChange={(event) =>
                onDraftChange({ ...draft, title: event.target.value })
              }
            />
            {draft.modules.length === 0 ? (
              <div className={styles["center-state"]}>
                <Empty
                  description={trans("paperEditor.emptyBasket", "试卷暂无题目")}
                />
              </div>
            ) : (
              <ModuleList
                draft={draft}
                editable
                locale={locale}
                onBatchScore={(moduleKey, score, mode) =>
                  onDraftChange(
                    setPaperModuleLeafScores(draft, moduleKey, score, mode),
                  )
                }
                onDeleteQuestion={onDeleteQuestion}
                onEditQuestion={onEditQuestion}
                onScoreChange={(questionKey: string, score?: number) =>
                  onDraftChange(setLeafQuestionScore(draft, questionKey, score))
                }
                onTitleChange={(moduleKey: string, title: string) =>
                  onDraftChange(updateModuleTitle(draft, moduleKey, title))
                }
              />
            )}
          </main>
          <PaperOutlineSidebar
            draft={draft}
            editable
            grades={grades}
            locale={locale}
            onAddLibraryQuestions={onAddLibraryQuestions}
            onAddModule={addModule}
            onDeleteModule={(moduleKey: string) =>
              onDraftChange(removePaperModule(draft, moduleKey))
            }
            onGradeChange={(selectedGradeId: number) => {
              const grade = grades.find(
                (option) => option.gradeId === selectedGradeId,
              );
              if (grade) onDraftChange(updatePaperGrade(draft, grade));
            }}
            onMoveModule={(oldIndex: number, newIndex: number) =>
              onDraftChange(movePaperModule(draft, oldIndex, newIndex))
            }
            onMoveQuestion={(
              command: Parameters<typeof movePaperQuestion>[1],
            ) => onDraftChange(movePaperQuestion(draft, command))}
            onNavigate={(elementId) =>
              document
                .getElementById(elementId)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            onIpadTrial={onIpadTrialAction}
            onPaperTypeChange={(paperType: number) =>
              onDraftChange({ ...draft, paperType })
            }
            onTrial={onTrialAction}
            onSubjectChange={(selectedSubjectId: number) => {
              const subject = subjects.find(
                (option) => option.subjectId === selectedSubjectId,
              );
              if (subject) onDraftChange(updatePaperSubject(draft, subject));
            }}
            paperTypes={paperTypes}
            subjects={subjects}
          />
        </div>
      ) : (
        <ReadOnlyPaperDetailContent
          draft={draft}
          locale={locale}
          notice={
            permissionDowngraded ? (
              <Alert
                className={styles["permission-alert"]}
                message={
                  editDisabledReason ||
                  trans(
                    "paperEditor.readOnlyPermission",
                    "当前账号无试卷编辑权限，已切换为预览模式",
                  )
                }
                showIcon
                type="info"
              />
            ) : undefined
          }
          onTrial={onTrialAction}
          onIpadTrial={onIpadTrialAction}
          paperTypes={paperTypes}
        />
      )}
    </div>
  );
}

export default PaperEditorContent;

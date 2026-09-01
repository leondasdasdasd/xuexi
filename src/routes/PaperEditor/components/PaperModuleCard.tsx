import React from "react";
import { Icon, Input } from "antd";

import { getPaperModuleDisplayNumber } from "../../../common/paperModuleDisplayNumber";
import { trans } from "../../../utils/i18n";
import { getPaperModuleTitleElementId } from "../paperEditorDomIds";
import type { BatchScoreMode } from "../paperEditorModel";
import { getModuleScore } from "../paperEditorModel";
import type { PaperEditorDraft, PaperModuleDraft } from "../types";
import ModuleBatchScoreEditor from "./ModuleBatchScoreEditor";
import QuestionList from "./QuestionList";

import styles from "../index.module.less";

interface BaseProps {
  locale: "en-US" | "zh-CN";
  module: PaperModuleDraft;
  moduleIndex: number;
  templates: PaperEditorDraft["questionTypeTemplates"];
  questionNumberByKey: ReadonlyMap<string, number>;
}

type Props =
  | (BaseProps & {
      editable: true;
      onDeleteQuestion: (questionKey: string) => void;
      onBatchScore: (
        moduleKey: string,
        score: number,
        mode: BatchScoreMode,
      ) => void;
      onEditQuestion: (questionId: number) => void;
      onScoreChange: (questionKey: string, score?: number) => void;
      onTitleChange: (moduleKey: string, title: string) => void;
    })
  | (BaseProps & { editable: false });

/**
 *
 * @param root0
 * @param root0.locale
 * @param root0.module
 * @param root0.moduleIndex
 * @param root0.onDeleteQuestion
 * @param root0.onScoreChange
 * @param root0.onTitleChange
 * @param root0.templates
 */
/**
 * 渲染单个可编辑块及其块内题目。
 * @param {Props} properties 块编辑属性。
 * @returns {React.ReactElement} 试卷块。
 */
function PaperModuleCard(properties: Props): React.ReactElement {
  const {
    locale,
    module,
    moduleIndex,
    editable,
    templates,
    questionNumberByKey,
  } = properties;
  const editableProperties = editable ? properties : undefined;
  const displayNumber = getPaperModuleDisplayNumber(moduleIndex, locale);
  return (
    <section className={styles["module-card"]}>
      <header className={styles["module-header"]}>
        <div className={styles["module-title-editor"]}>
          <strong className={styles["module-number"]}>{displayNumber}</strong>
          {editable ? (
            <span className={styles["module-title-control"]}>
              <span
                aria-hidden="true"
                className={styles["module-title-measure"]}
              >
                {module.title || "\u00A0"}
              </span>
              <Input
                aria-label={trans(
                  "paperEditor.numberedModuleTitle",
                  "{$number}块标题",
                  { number: displayNumber },
                )}
                className={styles["module-title"]}
                id={getPaperModuleTitleElementId(module.key)}
                maxLength={59}
                value={module.title}
                onChange={(event) =>
                  editableProperties!.onTitleChange(
                    module.key,
                    event.target.value,
                  )
                }
              />
            </span>
          ) : (
            <strong className={styles["readonly-module-title"]}>
              {module.title}
            </strong>
          )}
          {editable ? (
            <Icon
              aria-hidden="true"
              className={styles["module-title-edit-icon"]}
              type="edit"
            />
          ) : null}
        </div>
        <div className={styles["module-stats"]} data-testid="module-stats">
          <span>
            {trans("paperEditor.questionCountSummary", "共{$count}题", {
              count: String(module.questions.length),
            })}
          </span>
          <span>
            {trans("paperEditor.moduleScoreSummary", "共{$score}分", {
              score: String(getModuleScore(module)),
            })}
          </span>
          {editable ? (
            <ModuleBatchScoreEditor
              onConfirm={(score, mode) =>
                editableProperties!.onBatchScore(module.key, score, mode)
              }
            />
          ) : null}
        </div>
      </header>
      <QuestionList
        locale={locale}
        module={module}
        {...(editable
          ? {
              editable: true as const,
              onDeleteQuestion: editableProperties!.onDeleteQuestion,
              onEditQuestion: editableProperties!.onEditQuestion,
              onScoreChange: editableProperties!.onScoreChange,
            }
          : { editable: false as const })}
        questionNumberByKey={questionNumberByKey}
        templates={templates}
      />
    </section>
  );
}

export default PaperModuleCard;

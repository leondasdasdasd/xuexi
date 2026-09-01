import React from "react";
import { Button, Select } from "antd";

import { trans } from "../../../utils/i18n";
import type {
  GradeOption,
  MoveQuestionCommand,
  PaperEditorDraft,
  PaperTypeOption,
  SubjectOption,
} from "../types";
import OutlineQuestionSortBoundary from "./OutlineQuestionSortBoundary";
import PaperOutlineTrialAction from "./PaperOutlineTrialAction";
import ReadOnlyOutlineContent from "./ReadOnlyOutlineContent";

import styles from "../index.module.less";

interface BaseProps {
  draft: PaperEditorDraft;
  locale: "en-US" | "zh-CN";
  onNavigate: (elementId: string) => void;
  onIpadTrial?: () => void;
  onTrial?: () => void;
  paperTypes: PaperTypeOption[];
}

type Props =
  | (BaseProps & {
      editable: true;
      grades: GradeOption[];
      onGradeChange: (gradeId: number) => void;
      onAddLibraryQuestions: (
        moduleKey: string,
        initialQuestionTypeKey?: number,
      ) => void;
      onAddModule: () => void;
      onDeleteModule: (moduleKey: string) => void;
      onMoveModule: (oldIndex: number, newIndex: number) => void;
      onMoveQuestion: (command: MoveQuestionCommand) => void;
      onPaperTypeChange: (paperType: number) => void;
      onSubjectChange: (subjectId: number) => void;
      subjects: SubjectOption[];
    })
  | (BaseProps & { editable: false });

type EditableProps = Extract<Props, { editable: true }>;

const getPaperTypeName = (option: PaperTypeOption, locale: string) =>
  locale === "en-US"
    ? option.typeEname || option.typeName || option.name || String(option.code)
    : option.typeName || option.name || option.typeEname || String(option.code);

const readonlyScopeValueClassName = styles["readonly-scope-value"];

/**
 * 渲染试卷基础属性与可定位的块目录。
 * @param {Props} properties 右侧栏属性。
 * @returns {React.ReactElement} 试卷结构侧边栏。
 */
function PaperOutlineSidebar(properties: Props): React.ReactElement {
  const {
    draft,
    locale,
    editable,
    onIpadTrial,
    onNavigate,
    onTrial,
    paperTypes,
  } = properties;
  const editableProperties: EditableProps | undefined = editable
    ? properties
    : undefined;
  return (
    <aside className={styles["paper-sidebar"]}>
      <section className={styles["scope-panel"]}>
        <dl className={styles["scope-grid"]}>
          <div>
            <dt>{trans("paperEditor.gradeLabel", "所属年级")}</dt>
            <dd>
              {editableProperties ? (
                <Select
                  aria-label={trans("global.grade", "年级")}
                  placeholder={trans("global.pleaseSelectGrade", "请选择年级")}
                  value={draft.gradeId}
                  onChange={editableProperties.onGradeChange}
                >
                  {editableProperties.grades.map((grade) => (
                    <Select.Option key={grade.gradeId} value={grade.gradeId}>
                      {grade.name}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <span className={readonlyScopeValueClassName}>
                  {draft.gradeName}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>{trans("paperEditor.subjectLabel", "所属学科")}</dt>
            <dd>
              {editableProperties ? (
                <Select
                  aria-label={trans("global.subject", "学科")}
                  placeholder={trans(
                    "global.pleaseSelectSubject",
                    "请选择学科",
                  )}
                  value={draft.subjectId}
                  onChange={editableProperties.onSubjectChange}
                >
                  {editableProperties.subjects.map((subject) => (
                    <Select.Option
                      key={subject.subjectId}
                      value={subject.subjectId}
                    >
                      {subject.name}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <span className={readonlyScopeValueClassName}>
                  {draft.subjectName}
                </span>
              )}
            </dd>
          </div>
          <div className={styles["type-field"]}>
            <dt>{trans("paperEditor.paperType", "试卷类型")}</dt>
            <dd>
              {editableProperties ? (
                <Select
                  aria-label={trans("paperEditor.paperType", "试卷类型")}
                  value={draft.paperType}
                  onChange={editableProperties.onPaperTypeChange}
                >
                  {paperTypes.map((option) => (
                    <Select.Option key={option.code} value={option.code}>
                      {getPaperTypeName(option, locale)}
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <span className={readonlyScopeValueClassName}>
                  {getPaperTypeName(
                    paperTypes.find(
                      (option) => option.code === draft.paperType,
                    ) || {
                      code: draft.paperType || 0,
                    },
                    locale,
                  )}
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>
      <section className={styles["outline-panel"]}>
        {editableProperties ? (
          <>
            <div className={styles["outline-heading"]}>
              <h2>{trans("paperEditor.structure", "试卷结构")}</h2>
              <div className={styles["outline-heading-actions"]}>
                <span className={styles["outline-hint"]}>
                  {trans("paperEditor.dragQuestionToSort", "拖拽题号排序")}
                </span>
                <Button
                  icon="plus"
                  size="small"
                  onClick={editableProperties.onAddModule}
                >
                  {trans("paperEditor.addModule", "新增题块")}
                </Button>
              </div>
            </div>
            <OutlineQuestionSortBoundary
              draft={draft}
              onAddLibraryQuestions={editableProperties.onAddLibraryQuestions}
              onDeleteModule={editableProperties.onDeleteModule}
              onMoveModule={editableProperties.onMoveModule}
              onMoveQuestion={editableProperties.onMoveQuestion}
              onNavigate={onNavigate}
            />
          </>
        ) : (
          <ReadOnlyOutlineContent draft={draft} onNavigate={onNavigate} />
        )}
        <PaperOutlineTrialAction onIpadTrial={onIpadTrial} onTrial={onTrial} />
      </section>
    </aside>
  );
}

export default PaperOutlineSidebar;

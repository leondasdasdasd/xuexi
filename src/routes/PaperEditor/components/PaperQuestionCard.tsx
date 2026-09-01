import React, { useMemo, useState } from "react";
import {
  createQuestionPreviewDraft,
  QuestionPreview,
} from "@yungu-fed/question-editor";
import { Button, Empty, Popconfirm } from "antd";

import { trans } from "../../../utils/i18n";
import { getPaperQuestionElementId } from "../paperEditorDomIds";
import type { PaperEditorDraft, PaperQuestionDraft } from "../types";
import QuestionAnswerToggleButton from "./QuestionAnswerToggleButton";
import QuestionScoreFields from "./QuestionScoreFields";
import ReadOnlyQuestionScores from "./ReadOnlyQuestionScores";

import styles from "../index.module.less";

interface BaseProps {
  locale: "en-US" | "zh-CN";
  number: number;
  question: PaperQuestionDraft;
  templates: PaperEditorDraft["questionTypeTemplates"];
}

type Props =
  | (BaseProps & {
      editable: true;
      onDeleteQuestion: (questionKey: string) => void;
      onEditQuestion: (questionId: number) => void;
      onScoreChange: (questionKey: string, score?: number) => void;
    })
  | (BaseProps & { editable: false });

const editQuestion = (
  questionId: number | null,
  onEditQuestion: (questionId: number) => void,
) => {
  if (questionId !== null) {
    onEditQuestion(questionId);
  }
};

const getUnavailableQuestionDescription = (question: PaperQuestionDraft) =>
  question.questionSnapshotStatus === "UNRESOLVED"
    ? trans("paperEditor.unresolvedQuestion", "题目已失效，内容不可用")
    : trans("paperEditor.unassociatedQuestionSlot", "未关联题位");

const isQuestionEditAvailable = (question: PaperQuestionDraft): boolean =>
  question.questionId !== null &&
  question.questionSnapshotStatus !== "UNRESOLVED";

/**
 *
 * @param root0
 * @param root0.locale
 * @param root0.number
 * @param root0.onDeleteQuestion
 * @param root0.onScoreChange
 * @param root0.question
 * @param root0.templates
 */
/**
 * 使用 question-editor 渲染单道试题及唯一分值入口。
 * @param {Props} properties 题目卡片属性。
 * @returns {React.ReactElement} 题目卡片。
 */
function PaperQuestionCard(properties: Props): React.ReactElement {
  const { locale, number, editable, question, templates } = properties;
  const editableProperties = editable ? properties : undefined;
  const questionId = question.questionId;
  const editAvailable = isQuestionEditAvailable(question);
  const [answerDetailsVisible, setAnswerDetailsVisible] = useState(false);
  const previewDraft = useMemo(
    () =>
      question.content
        ? createQuestionPreviewDraft(question.content, templates)
        : null,
    [question.content, templates],
  );
  const answerToggleButton = (
    <QuestionAnswerToggleButton
      available={Boolean(previewDraft)}
      visible={answerDetailsVisible}
      onToggle={() => setAnswerDetailsVisible((visible) => !visible)}
    />
  );

  return (
    <article
      className={styles["question-card"]}
      id={getPaperQuestionElementId(question.key)}
    >
      <div className={styles["question-body"]} data-testid="question-body">
        <strong className={styles["question-number"]}>{number}.</strong>
        <div className={styles["question-content"]}>
          {question.content === null ? (
            <Empty
              description={getUnavailableQuestionDescription(question)}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : previewDraft ? (
            <QuestionPreview
              locale={locale}
              questionTypeTemplates={templates}
              rootQuestionNumber={number}
              showAnswer={answerDetailsVisible}
              showExtraAttributes={answerDetailsVisible}
              value={previewDraft}
            />
          ) : (
            <Empty
              description={trans(
                "newMyQuestion.previewUnavailable",
                "题目内容暂不可预览",
              )}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </div>
      {editable ? (
        <footer
          className={styles["question-actions"]}
          data-testid="question-actions"
        >
          <div
            className={`${styles["question-score"]} ${
              question.children.length > 0
                ? styles["composite-question-score"]
                : ""
            }`}
          >
            <QuestionScoreFields
              onScoreChange={editableProperties!.onScoreChange}
              question={question}
            />
          </div>
          <Popconfirm
            cancelText={trans("global.cancle", "取消")}
            okText={trans("global.sure", "确定")}
            onConfirm={() => editableProperties!.onDeleteQuestion(question.key)}
            title={trans(
              "paperEditor.deleteQuestionConfirm",
              "确定删除这道题吗？",
            )}
          >
            <Button className={styles["question-action-button"]} type="link">
              {trans("paperEditor.deleteQuestion", "删除")}
            </Button>
          </Popconfirm>
          <Button
            className={styles["question-action-button"]}
            disabled={!editAvailable}
            type="link"
            onClick={() =>
              editQuestion(questionId, editableProperties!.onEditQuestion)
            }
          >
            {trans("global.edit", "编辑")}
          </Button>
          {answerToggleButton}
        </footer>
      ) : editable ? null : (
        <footer className={styles["readonly-question-actions"]}>
          <ReadOnlyQuestionScores question={question} />
          {answerToggleButton}
        </footer>
      )}
    </article>
  );
}

export default PaperQuestionCard;

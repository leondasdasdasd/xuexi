import React from "react";
import { Checkbox, Empty } from "antd";

import QuestionPreviewContent from "../../../components/QuestionPreviewContent";
import { trans } from "../../../utils/i18n";
import { createNewMyQuestionPreviewViewModel } from "../../V2QuestionList/questionPreviewAdapter";
import type {
  PaperQuestionLibraryAggregate,
  PaperQuestionLibraryPage,
} from "../paperQuestionLibraryService";

import styles from "./PaperQuestionLibraryModal.module.less";

interface Props {
  excludedIds: ReadonlySet<number>;
  loading: boolean;
  locale: "en-US" | "zh-CN";
  onToggle: (
    aggregate: PaperQuestionLibraryAggregate,
    checked: boolean,
  ) => void;
  page: PaperQuestionLibraryPage;
  selectedIds: ReadonlySet<number>;
}

/**
 * 渲染题库分页结果，并隔离已添加状态与预览 view model。
 * @param properties 当前页、选择状态和题目切换回调。
 * @returns 题库题目列表。
 */
function PaperQuestionLibraryList(properties: Props): React.ReactElement {
  const { excludedIds, loading, locale, onToggle, page, selectedIds } =
    properties;
  if (!loading && page.items.length === 0) {
    return (
      <div className={styles["library-list"]}>
        <Empty
          description={trans("paperEditor.libraryEmpty", "没有符合条件的题目")}
        />
      </div>
    );
  }
  return (
    <div className={styles["library-list"]}>
      {page.items.map((aggregate) => {
        const questionId = aggregate.question.id;
        const excluded = excludedIds.has(questionId);
        const previewViewModel = createNewMyQuestionPreviewViewModel(
          aggregate,
          page.questionTypesById,
          { locale: locale === "en-US" ? "en" : "zh" },
        );
        return (
          <label className={styles["library-item"]} key={questionId}>
            <span className={styles["library-select"]}>
              <Checkbox
                checked={selectedIds.has(questionId)}
                disabled={excluded}
                onChange={(event) => onToggle(aggregate, event.target.checked)}
              />
              {excluded ? (
                <span>{trans("paperEditor.alreadyAdded", "已添加")}</span>
              ) : null}
            </span>
            <QuestionPreviewContent
              showAnswerDetails={false}
              viewModel={previewViewModel}
            />
          </label>
        );
      })}
    </div>
  );
}

export default PaperQuestionLibraryList;

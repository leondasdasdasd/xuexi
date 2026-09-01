import React from "react";
import { Alert, Button, Empty, Spin } from "antd";

import { trans } from "../../../utils/i18n";
import type {
  PaperQuestionLibraryAggregate,
  PaperQuestionLibraryPage,
} from "../paperQuestionLibraryService";
import PaperQuestionLibraryList from "./PaperQuestionLibraryList";

import styles from "./PaperQuestionLibraryModal.module.less";

interface Props {
  confirming: boolean;
  excludedIds: Set<number>;
  hasQuestionType: boolean;
  hasTeachingScope: boolean;
  loadError: string;
  loading: boolean;
  locale: "en-US" | "zh-CN";
  onRetry: () => void;
  onToggle: (
    aggregate: PaperQuestionLibraryAggregate,
    checked: boolean,
  ) => void;
  page: PaperQuestionLibraryPage;
  selectedIds: Set<number>;
}

/**
 * 渲染题库筛选结果及其缺省、失败和分页状态。
 * @param {Props} properties 当前查询状态与列表交互入口。
 * @returns {React.ReactElement} 题库结果区。
 */
function PaperQuestionLibraryResults(properties: Props): React.ReactElement {
  const {
    confirming,
    excludedIds,
    hasQuestionType,
    hasTeachingScope,
    loadError,
    loading,
    locale,
    onRetry,
    onToggle,
    page,
    selectedIds,
  } = properties;
  if (!hasTeachingScope) {
    return (
      <Empty
        description={trans(
          "paperEditor.libraryScopeRequired",
          "请选择年级和学科后查看题目",
        )}
      />
    );
  }
  if (!hasQuestionType) {
    return (
      <Empty
        description={trans(
          "questionAssetInput.noQuestionType",
          "暂无可用题型，暂时无法保存",
        )}
      />
    );
  }
  return (
    <>
      {loadError ? (
        <Alert
          className={styles["library-alert"]}
          message={loadError}
          showIcon
          type="error"
        />
      ) : null}
      <Spin spinning={loading || confirming}>
        <PaperQuestionLibraryList
          excludedIds={excludedIds}
          loading={loading}
          locale={locale}
          onToggle={onToggle}
          page={page}
          selectedIds={selectedIds}
        />
      </Spin>
      {loadError ? (
        <Button className={styles["library-retry"]} onClick={onRetry}>
          {trans("global.retry", "重试")}
        </Button>
      ) : null}
    </>
  );
}

export default PaperQuestionLibraryResults;

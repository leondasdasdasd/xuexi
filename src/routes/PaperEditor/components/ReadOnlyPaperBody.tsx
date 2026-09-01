import React from "react";
import { Empty } from "antd";

import { trans } from "../../../utils/i18n";
import type { PaperEditorDraft } from "../types";
import ModuleList from "./ModuleList";

import styles from "../index.module.less";

interface Props {
  className?: string;
  draft: PaperEditorDraft;
  locale: "en-US" | "zh-CN";
  notice?: React.ReactNode;
  rootRef?: React.Ref<HTMLElement>;
}

/**
 * 渲染屏幕预览与 PDF 导出共用的唯一试卷正文。
 * @param {Props} properties 已映射的试卷草稿与展示上下文。
 * @returns {React.ReactElement} 不包含外层工具栏和结构侧栏的试卷正文。
 */
function ReadOnlyPaperBody(properties: Props): React.ReactElement {
  const { className, draft, locale, notice, rootRef } = properties;
  return (
    <main
      className={[styles["paper-main"], className].filter(Boolean).join(" ")}
      ref={rootRef}
    >
      {notice}
      <h1 className={styles["readonly-paper-title"]}>{draft.title}</h1>
      {draft.modules.length === 0 ? (
        <div className={styles["center-state"]}>
          <Empty
            description={trans("paperEditor.emptyBasket", "试卷暂无题目")}
          />
        </div>
      ) : (
        <ModuleList draft={draft} editable={false} locale={locale} />
      )}
    </main>
  );
}

export default ReadOnlyPaperBody;

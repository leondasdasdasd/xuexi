import React from "react";

import type { PaperEditorDraft, PaperTypeOption } from "../types";
import PaperOutlineSidebar from "./PaperOutlineSidebar";
import ReadOnlyPaperBody from "./ReadOnlyPaperBody";

import styles from "../index.module.less";

interface Props {
  className?: string;
  draft: PaperEditorDraft;
  locale: "en-US" | "zh-CN";
  notice?: React.ReactNode;
  onIpadTrial?: () => void;
  onTrial?: () => void;
  paperTypes: PaperTypeOption[];
}

/**
 * 渲染可嵌入不同业务页面的 V2 试卷只读正文。
 * @param {Props} properties 已完成边界映射的试卷视图模型。
 * @returns {React.ReactElement} 试卷题目与结构导航。
 */
function ReadOnlyPaperDetailContent(properties: Props): React.ReactElement {
  const { className, draft, locale, notice, onIpadTrial, onTrial, paperTypes } =
    properties;
  return (
    <div
      className={[styles["readonly-paper-detail"], className]
        .filter(Boolean)
        .join(" ")}
    >
      <ReadOnlyPaperBody draft={draft} locale={locale} notice={notice} />
      <PaperOutlineSidebar
        draft={draft}
        editable={false}
        locale={locale}
        onNavigate={(elementId) =>
          document
            .getElementById(elementId)
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        onIpadTrial={onIpadTrial}
        onTrial={onTrial}
        paperTypes={paperTypes}
      />
    </div>
  );
}

export default ReadOnlyPaperDetailContent;

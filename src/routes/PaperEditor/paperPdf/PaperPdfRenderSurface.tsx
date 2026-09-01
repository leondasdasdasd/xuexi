import React from "react";

import ReadOnlyPaperBody from "../components/ReadOnlyPaperBody";
import type { PaperEditorDraft } from "../types";

import styles from "./paperPdf.module.less";

interface Props {
  draft: PaperEditorDraft;
  locale: "en-US" | "zh-CN";
  rootRef: React.Ref<HTMLElement>;
}

/**
 * 在视口外按真实纸张宽度渲染共享试卷正文。
 * @param {Props} properties 试卷视图模型与渲染语言。
 * @returns {React.ReactElement} A4 宽度的临时渲染表面。
 */
function PaperPdfRenderSurface(properties: Props): React.ReactElement {
  const { draft, locale, rootRef } = properties;
  return (
    <div aria-hidden="true" className={styles.surface}>
      <ReadOnlyPaperBody
        className={styles.body}
        draft={draft}
        locale={locale}
        rootRef={rootRef}
      />
    </div>
  );
}

export default PaperPdfRenderSurface;

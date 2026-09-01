// copy-tex 会在复制公式选区时把纯文本剪贴板回写成原始 LaTeX。
import "katex/dist/contrib/copy-tex.js";

import React, { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";

import { trans } from "../../../../utils/i18n";
import { syncFormulaImageSizes } from "../formulaImageSizing";
import { buildAnswerSheetPreviewHtml } from "./answerSheetMarkdownRenderer";

import "katex/dist/katex.min.css";
import previewStyles from "./AnswerPaperPreview.module.less";
import styles from "./AnswerTextPreview.module.less";

const css = {
  markdownPreview: previewStyles["answer-markdown-preview"],
};

const AnswerTextPreview = ({ markdown, pages }) => {
  const previewReference = useRef(null);
  const markdownText = String(markdown || "").trim();
  const renderedHtml = useMemo(
    () => buildAnswerSheetPreviewHtml(markdownText),
    [markdownText],
  );

  useEffect(
    () => syncFormulaImageSizes(previewReference.current),
    [markdownText, pages, renderedHtml],
  );

  if (markdownText) {
    return (
      <div ref={previewReference} className={styles["answer-text-preview"]}>
        <div
          className={css.markdownPreview}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className={styles["empty-block"]}>
        {trans("questionTask.noAnswerText", "暂无解析后的文本")}
      </div>
    );
  }

  return (
    <div ref={previewReference} className={styles["answer-text-preview"]}>
      {pages.map((page, pageIndex) => (
        <section
          key={`${page.pageNumber || pageIndex}-${page.title}`}
          className={styles["answer-text-page"]}
        >
          <div className={styles["answer-text-page-title"]}>{page.title}</div>
          {(Array.isArray(page.sections) ? page.sections : []).map(
            (section, sectionIndex) => (
              <div
                key={`${page.pageNumber || pageIndex}-section-${sectionIndex}`}
                className={styles["answer-text-section"]}
              >
                <div className={styles["answer-text-section-header"]}>
                  <div className={styles["answer-text-section-title"]}>
                    {section.title}
                  </div>
                  {section.description ? (
                    <div className={styles["answer-text-section-desc"]}>
                      {section.description}
                    </div>
                  ) : undefined}
                </div>
                <div className={styles["answer-text-item-list"]}>
                  {(Array.isArray(section.items) ? section.items : []).map(
                    (item, itemIndex) => (
                      <div
                        key={`${page.pageNumber || pageIndex}-${sectionIndex}-${item.number || itemIndex}`}
                        className={styles["answer-text-item"]}
                      >
                        <div className={styles["answer-text-number"]}>
                          {item.number || itemIndex + 1}
                        </div>
                        <div className={styles["answer-text-body"]}>
                          {item.answer ? (
                            <div className={styles["answer-text-answer"]}>
                              <span className={styles["answer-text-label"]}>
                                {trans("questionTask.answerLabel", "答案：")}
                              </span>
                              <span className={styles["answer-text-content"]}>
                                {item.answer}
                              </span>
                            </div>
                          ) : undefined}
                          {item.analysis ? (
                            <div className={styles["answer-text-analysis"]}>
                              <span className={styles["answer-text-label"]}>
                                {trans("questionTask.analysisLabel", "解析：")}
                              </span>
                              <span className={styles["answer-text-content"]}>
                                {item.analysis}
                              </span>
                            </div>
                          ) : undefined}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ),
          )}
        </section>
      ))}
    </div>
  );
};

AnswerTextPreview.propTypes = {
  markdown: PropTypes.string,
  pages: PropTypes.arrayOf(PropTypes.object),
};

AnswerTextPreview.defaultProps = {
  markdown: "",
  pages: [],
};

export default AnswerTextPreview;

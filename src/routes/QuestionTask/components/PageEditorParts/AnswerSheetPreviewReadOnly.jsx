import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

import { trans } from "../../../../utils/i18n";
import { syncFormulaImageSizes } from "../formulaImageSizing";
import GapFillingAnswerDisplay from "../GapFillingAnswerDisplay";
import {
  getArrayItem,
  getQuestionSelectHandler,
} from "./answerSheetPreviewModel";
import {
  canUseCompactAnswerRow,
  canUsePreviewDualColumnLayout,
  formatCompactAnswerText,
  QUESTION_TYPE_COMBINATION,
} from "./pageEditorData";

import "katex/dist/katex.min.css";
import formulaStyles from "../QuestionCards.module.less";
import styles from "./AnswerSheetPreview.module.less";

const ANALYSIS_PREFIX_TEXT = trans(
  "questionTask.answerSheetAnalysisPrefix",
  "Analysis:",
);
const ANSWER_DETAIL_TEXT_CLASS = styles["answer-detail-text"];

const getScoreText = (score) =>
  trans("questionTask.answerSheetScore", "{$score} pts", { score });

const getSectionMetaText = (section) =>
  section.rangeLabel
    ? trans("questionTask.answerSheetRangeLabel", "Questions {$range}", {
        range: section.rangeLabel,
      })
    : trans("questionTask.answerSheetQuestionCount", "{$count} questions", {
        count: section.totalCount,
      });

const getRichTextClassName = (className) =>
  `${className} ${formulaStyles["formula-image-rich-text"]}`;

const renderRichHtml = (content, className) => (
  <span
    className={getRichTextClassName(className)}
    dangerouslySetInnerHTML={{ __html: content }}
  />
);

const renderAnalysisContent = (analysisHtml, analysisText) => {
  if (analysisHtml) {
    return (
      <span className={styles["answer-detail-analysis"]}>
        {ANALYSIS_PREFIX_TEXT}
        {renderRichHtml(analysisHtml, styles["answer-detail-analysis-content"])}
      </span>
    );
  }

  return analysisText ? (
    <span className={styles["answer-detail-analysis"]}>
      {ANALYSIS_PREFIX_TEXT}
      {analysisText}
    </span>
  ) : undefined;
};

const renderAnswerContent = ({
  answer,
  answerGroups,
  answerHtml,
  emptyText,
}) => {
  if (Array.isArray(answerGroups) && answerGroups.length > 0) {
    return (
      <GapFillingAnswerDisplay
        answerGroups={answerGroups}
        answerTextClassName={ANSWER_DETAIL_TEXT_CLASS}
        renderAnswer={renderRichHtml}
        styles={styles}
      />
    );
  }

  if (answerHtml) {
    return renderRichHtml(answerHtml, ANSWER_DETAIL_TEXT_CLASS);
  }

  return answer ? (
    <span className={ANSWER_DETAIL_TEXT_CLASS}>{answer}</span>
  ) : (
    <span className={styles["answer-detail-hint"]}>{emptyText}</span>
  );
};

const CombinationGroup = ({ group, onQuestionSelect }) => (
  <div className={styles["answer-detail-group"]}>
    {group.items.map((item) => (
      <button
        key={item.draftId}
        className={`${styles["answer-detail-item"]} ${styles["answer-detail-item-combination"]}`}
        type="button"
        onClick={getQuestionSelectHandler(onQuestionSelect, item.draftId)}
      >
        <span className={styles["answer-detail-number"]}>{item.number}</span>
        <span className={styles["answer-detail-body"]}>
          {item.score ? (
            <span className={styles["answer-detail-primary-row"]}>
              <span className={styles["answer-detail-score"]}>
                {getScoreText(item.score)}
              </span>
            </span>
          ) : undefined}
          <span className={styles["answer-combination-sub-list"]}>
            {(Array.isArray(item.subQuestions) ? item.subQuestions : []).map(
              (subItem) => (
                <span
                  key={`${item.draftId}-${subItem.number}`}
                  className={styles["answer-combination-sub-item"]}
                >
                  <span className={styles["answer-combination-sub-header"]}>
                    <span>{subItem.number}</span>
                    {subItem.score ? (
                      <span className={styles["answer-combination-sub-score"]}>
                        {getScoreText(subItem.score)}
                      </span>
                    ) : undefined}
                  </span>
                  {renderAnswerContent({
                    answer: subItem.answer,
                    answerGroups: subItem.answerGroups,
                    answerHtml: subItem.answerHtml,
                    emptyText: trans(
                      "questionTask.answerSheetNoStructuredAnswer",
                      "No structured answer yet",
                    ),
                  })}
                  {renderAnalysisContent(
                    subItem.analysisHtml,
                    subItem.analysis,
                  )}
                </span>
              ),
            )}
          </span>
        </span>
      </button>
    ))}
  </div>
);

CombinationGroup.propTypes = {
  group: PropTypes.object.isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
};

const DetailGroup = ({ group, onQuestionSelect }) => (
  <div className={styles["answer-detail-group"]}>
    <div className={styles["answer-detail-group-title"]}>
      {group.rangeLabel}
    </div>
    <div className={styles["answer-detail-list"]}>
      {group.items.map((item) => (
        <button
          key={item.draftId}
          className={styles["answer-detail-item"]}
          type="button"
          onClick={getQuestionSelectHandler(onQuestionSelect, item.draftId)}
        >
          <span className={styles["answer-detail-number"]}>{item.number}</span>
          <span className={styles["answer-detail-body"]}>
            <span className={styles["answer-detail-primary-row"]}>
              {renderAnswerContent({
                answer: item.answer,
                answerGroups: item.answerGroups,
                answerHtml: item.answerHtml,
                emptyText: trans(
                  "questionTask.answerSheetAnswerMissingButAnalysisExists",
                  "No structured answer yet, analysis has been added",
                ),
              })}
              {item.analysis && item.score ? (
                <span className={styles["answer-detail-score"]}>
                  {getScoreText(item.score)}
                </span>
              ) : undefined}
            </span>
            {renderAnalysisContent(item.analysisHtml, item.analysis)}
          </span>
        </button>
      ))}
    </div>
  </div>
);

DetailGroup.propTypes = {
  group: PropTypes.object.isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
};

const AnswerSectionPreview = ({ onQuestionSelect, section }) => (
  <section
    className={`${styles["answer-section"]} ${
      canUsePreviewDualColumnLayout(section)
        ? styles["answer-section-preview-dual-column"]
        : ""
    }`}
  >
    <div className={styles["answer-section-header"]}>
      <div className={styles["answer-section-title"]}>{section.label}</div>
      <div className={styles["answer-section-meta"]}>
        {getSectionMetaText(section)}
      </div>
    </div>
    <div className={styles["answer-section-groups"]}>
      {section.groups.map((group) =>
        section.mode === "compact" && canUseCompactAnswerRow(group.items) ? (
          <button
            key={group.key}
            className={styles["answer-compact-row"]}
            type="button"
            onClick={getQuestionSelectHandler(
              onQuestionSelect,
              getArrayItem(group.items, 0).draftId,
            )}
          >
            <span className={styles["answer-compact-range"]}>
              {group.rangeLabel}
            </span>
            <span className={styles["answer-compact-text"]}>
              {formatCompactAnswerText(group.items)}
            </span>
          </button>
        ) : Number(section.type) === QUESTION_TYPE_COMBINATION ? (
          <CombinationGroup
            key={group.key}
            group={group}
            onQuestionSelect={onQuestionSelect}
          />
        ) : (
          <DetailGroup
            key={group.key}
            group={group}
            onQuestionSelect={onQuestionSelect}
          />
        ),
      )}
    </div>
  </section>
);

AnswerSectionPreview.propTypes = {
  onQuestionSelect: PropTypes.func.isRequired,
  section: PropTypes.object.isRequired,
};

const AnswerSheetPreviewReadOnly = ({
  answerCount,
  answerSections,
  onQuestionSelect,
  onStartBatchEditing,
}) => {
  const previewReference = useRef(null);

  useEffect(() => {
    syncFormulaImageSizes(previewReference.current);
  }, [answerSections]);

  if (answerSections.length === 0) {
    return (
      <div className={styles["answer-sheet-preview"]} ref={previewReference}>
        <div className={styles["answer-sheet-header"]}>
          <div>
            <div className={styles["answer-sheet-title"]}>
              {trans("jsonInput.referenceAnswer", "Reference Answer")}
            </div>
            <div className={styles["answer-sheet-desc"]}>
              {trans(
                "questionTask.answerSheetEmptyDesc",
                "There is no structured answer or analysis to preview yet, but you can already open batch editing to add it.",
              )}
            </div>
          </div>
          <div className={styles["answer-sheet-header-aside"]}>
            <button
              className={`${styles["answer-editor-button"]} ${styles["answer-editor-button-primary"]}`}
              type="button"
              onClick={onStartBatchEditing}
            >
              {trans("questionTask.answerSheetBatchEdit", "Batch Edit")}
            </button>
          </div>
        </div>
        <div className={styles["empty-block"]}>
          {trans(
            "questionTask.answerSheetEmptyState",
            "No reference answer or analysis available for preview",
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles["answer-sheet-preview"]} ref={previewReference}>
      <div className={styles["answer-sheet-header"]}>
        <div className={styles["answer-sheet-title"]}>
          {trans("jsonInput.referenceAnswer", "Reference Answer")}
        </div>
        <div className={styles["answer-sheet-header-aside"]}>
          <div className={styles["answer-sheet-count"]}>
            {trans(
              "questionTask.answerSheetDisplayedCount",
              "{$count} answers currently shown",
              { count: answerCount },
            )}
          </div>
          <button
            className={`${styles["answer-editor-button"]} ${styles["answer-editor-button-primary"]}`}
            type="button"
            onClick={onStartBatchEditing}
          >
            {trans("questionTask.answerSheetBatchEdit", "Batch Edit")}
          </button>
        </div>
      </div>
      <div className={styles["answer-section-list"]}>
        {answerSections.map((section) => (
          <AnswerSectionPreview
            key={section.key}
            onQuestionSelect={onQuestionSelect}
            section={section}
          />
        ))}
      </div>
    </div>
  );
};

AnswerSheetPreviewReadOnly.propTypes = {
  answerCount: PropTypes.number.isRequired,
  answerSections: PropTypes.arrayOf(PropTypes.object).isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
  onStartBatchEditing: PropTypes.func.isRequired,
};

export default AnswerSheetPreviewReadOnly;

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import { getGapFillingAnswerGroups } from "../domain/questionTaskGapFillingAnswer";
import {
  getOneBasedIndex,
  getOptionKey,
  getQuestionDisplayNumber,
  OPTION_INDEX_OFFSET,
  QUESTION_TYPE_BLANK as FILL_BLANK_QUESTION_TYPE,
  QUESTION_TYPE_CHOICE as SINGLE_CHOICE_TYPE,
  QUESTION_TYPE_COMBINATION as COMBINATION_QUESTION_TYPE,
  QUESTION_TYPE_MULTIPLE_CHOICE as MULTIPLE_CHOICE_TYPE,
} from "../domain/questionTaskShared";
import {
  getQuestionAnswerText,
  getQuestionScoreText,
} from "../domain/questionTaskViewModel";
import GapFillingAnswerDisplay from "./GapFillingAnswerDisplay";

import formulaStyles from "./QuestionCards.module.less";
import styles from "./QuestionCardsView.module.less";

const TWO_COLUMN_COUNT = 2;
const THREE_COLUMN_COUNT = 3;
const FOUR_COLUMN_COUNT = 4;
const FIVE_COLUMN_COUNT = 5;
const SIX_COLUMN_COUNT = 6;
const SEVEN_COLUMN_COUNT = 7;
const EIGHT_COLUMN_COUNT = 8;
const NINE_COLUMN_COUNT = 9;
const TEN_COLUMN_COUNT = 10;
const ZERO_MILLISECONDS = 0;
const RECHECK_DELAY_SHORT_MILLISECONDS = 200;
const RECHECK_DELAY_LONG_MILLISECONDS = 600;
const OPTION_LAYOUT_OVERFLOW_TOLERANCE = 12;
const OPTION_LAYOUT_INITIAL_RECHECK_DELAYS = [
  ZERO_MILLISECONDS,
  RECHECK_DELAY_SHORT_MILLISECONDS,
  RECHECK_DELAY_LONG_MILLISECONDS,
];
const QUALITY_LEVEL_LABEL_MAP = {
  high: trans("questionTask.aiQualityHighLabel", "高风险"),
  low: trans("questionTask.aiQualityLowLabel", "低风险"),
  pass: trans("questionTask.aiQualityPassLabel", "质检通过"),
};
const OPTION_LAYOUT_SEQUENCE_MAP = new Map([
  [TWO_COLUMN_COUNT, [TWO_COLUMN_COUNT, OPTION_INDEX_OFFSET]],
  [THREE_COLUMN_COUNT, [THREE_COLUMN_COUNT, OPTION_INDEX_OFFSET]],
  [
    FOUR_COLUMN_COUNT,
    [FOUR_COLUMN_COUNT, TWO_COLUMN_COUNT, OPTION_INDEX_OFFSET],
  ],
  [FIVE_COLUMN_COUNT, [FIVE_COLUMN_COUNT, OPTION_INDEX_OFFSET]],
  [
    SIX_COLUMN_COUNT,
    [
      SIX_COLUMN_COUNT,
      THREE_COLUMN_COUNT,
      TWO_COLUMN_COUNT,
      OPTION_INDEX_OFFSET,
    ],
  ],
  [SEVEN_COLUMN_COUNT, [SEVEN_COLUMN_COUNT, OPTION_INDEX_OFFSET]],
  [
    EIGHT_COLUMN_COUNT,
    [
      EIGHT_COLUMN_COUNT,
      FOUR_COLUMN_COUNT,
      TWO_COLUMN_COUNT,
      OPTION_INDEX_OFFSET,
    ],
  ],
  [
    NINE_COLUMN_COUNT,
    [NINE_COLUMN_COUNT, THREE_COLUMN_COUNT, OPTION_INDEX_OFFSET],
  ],
  [
    TEN_COLUMN_COUNT,
    [
      TEN_COLUMN_COUNT,
      FIVE_COLUMN_COUNT,
      TWO_COLUMN_COUNT,
      OPTION_INDEX_OFFSET,
    ],
  ],
]);

const getOptionColumnLayoutSequence = (optionCount) =>
  OPTION_LAYOUT_SEQUENCE_MAP.get(optionCount) || [
    Math.max(OPTION_INDEX_OFFSET, optionCount),
    OPTION_INDEX_OFFSET,
  ];

const getOptionLayoutMode = (columnCount) => `cols-${columnCount}`;

const isOptionContentOverflowing = (contentNode) =>
  Boolean(
    contentNode &&
    contentNode.scrollWidth >
      contentNode.clientWidth + OPTION_LAYOUT_OVERFLOW_TOLERANCE,
  );

const measureSafeOptionLayoutMode = (gridNode, layoutSequence) => {
  if (!gridNode || layoutSequence.length === 0) {
    return getOptionLayoutMode(1);
  }

  const optionContentNodes = [
    ...gridNode.querySelectorAll("[data-option-content='true']"),
  ];
  const fallbackMode = getOptionLayoutMode(
    layoutSequence[layoutSequence.length - OPTION_INDEX_OFFSET],
  );

  if (optionContentNodes.length === 0) {
    return fallbackMode;
  }

  const safeLayoutMode = layoutSequence
    .map((columnCount) => {
      const layoutMode = getOptionLayoutMode(columnCount);
      gridNode.dataset.layoutMode = layoutMode;

      return optionContentNodes.some((contentNode) =>
        isOptionContentOverflowing(contentNode),
      )
        ? ""
        : layoutMode;
    })
    .find(Boolean);

  return safeLayoutMode || fallbackMode;
};

const getRichTextClassName = (className) =>
  `${className} ${formulaStyles["formula-image-rich-text"]}`;
const SUB_QUESTION_META_TEXT_CLASS = styles["sub-question-meta-text"];
const DOM_TEXT_NODE_TYPE = 3;
const OPTION_PREFIX_PUNCTUATION_LIST = [".", "．", "、", ":", "："];

const isMeaningfulTextNode = (node) =>
  node &&
  node.nodeType === DOM_TEXT_NODE_TYPE &&
  String(node.nodeValue || "").trim();

const findFirstMeaningfulTextNode = (node) => {
  const childNodes = [...((node && node.childNodes) || [])];

  return (
    childNodes.find((childNode) => isMeaningfulTextNode(childNode)) ||
    childNodes
      .map((childNode) => findFirstMeaningfulTextNode(childNode))
      .find(Boolean)
  );
};

export const renderRichText = (content, className, extraProperties = {}) => (
  <span
    {...extraProperties}
    className={getRichTextClassName(className)}
    dangerouslySetInnerHTML={{ __html: content || "-" }}
  />
);

export const renderAnswerText = (answerText, className) => (
  <span
    className={getRichTextClassName(className)}
    // OCR 答案可能包含公式图片 HTML，答案区与题干/解析保持同一富文本展示边界。
    dangerouslySetInnerHTML={{ __html: answerText }}
  />
);

export const getQuestionNumber = (question) =>
  getQuestionDisplayNumber(question, 0, {
    fallbackToIndex: false,
  });

const getAnswerText = (question) => {
  const answer = getQuestionAnswerText(question);

  if (Array.isArray(answer)) {
    return answer.join("；");
  }

  return answer === undefined ? "" : String(answer);
};

const getSubQuestionNumber = (index) => getOneBasedIndex(index);

const getSubQuestionNumberLabel = (questionNumber, subQuestionIndex) =>
  questionNumber
    ? trans(
        "questionTask.subQuestionCompositeNumberLabel",
        "{$number}.{$subNumber}",
        {
          number: questionNumber,
          subNumber: getSubQuestionNumber(subQuestionIndex),
        },
      )
    : trans("questionTask.subQuestionNumberLabel", "第 {$number} 小题", {
        number: getSubQuestionNumber(subQuestionIndex),
      });

export const getQualityLabel = (qualityCheck) =>
  (qualityCheck &&
    (qualityCheck.label || QUALITY_LEVEL_LABEL_MAP[qualityCheck.status])) ||
  "质检通过";

const isChoiceQuestion = (question) =>
  question &&
  (Number(question.type) === SINGLE_CHOICE_TYPE ||
    Number(question.type) === MULTIPLE_CHOICE_TYPE);

const isCombinationQuestion = (question) =>
  Number(question && question.type) === COMBINATION_QUESTION_TYPE;

const stripDuplicateOptionKeyPrefix = (text, optionKey) => {
  if (!text || !optionKey) {
    return text;
  }

  const sourceText = String(text);
  const keyText = String(optionKey).trim();
  const contentAfterKey = sourceText.trimStart().slice(keyText.length);
  const contentAfterKeySpaces = contentAfterKey.trimStart();
  const duplicatedPrefixPunctuation = OPTION_PREFIX_PUNCTUATION_LIST.find(
    (punctuation) => contentAfterKeySpaces.startsWith(punctuation),
  );

  if (
    !keyText ||
    !sourceText.trimStart().toUpperCase().startsWith(keyText.toUpperCase()) ||
    !duplicatedPrefixPunctuation
  ) {
    return text;
  }

  return contentAfterKeySpaces
    .slice(duplicatedPrefixPunctuation.length)
    .trimStart();
};

const stripDuplicateOptionKeyPrefixFromHtml = (content, optionKey) => {
  if (!content || !String(content).includes("<")) {
    return stripDuplicateOptionKeyPrefix(content, optionKey);
  }

  if (typeof DOMParser !== "function") {
    return content;
  }

  const document = new DOMParser().parseFromString(
    `<div>${content}</div>`,
    "text/html",
  );
  const container = document.body.firstElementChild;

  if (!container) {
    return content;
  }

  const firstTextNode = findFirstMeaningfulTextNode(container);

  if (firstTextNode) {
    firstTextNode.nodeValue = stripDuplicateOptionKeyPrefix(
      firstTextNode.nodeValue,
      optionKey,
    );
  }

  return container.innerHTML;
};

const getOptionDisplayAnswers = (option, index) => {
  const optionKey = option.key || getOptionKey(index);

  // OCR 有时把 “B.” 一并识别进选项正文；题卡只做展示去重，编辑与保存仍保留原始富文本。
  return stripDuplicateOptionKeyPrefixFromHtml(option.answers, optionKey);
};

export const isQuestionCardInteractiveTarget = (event, selector) => {
  const target = event && event.target;

  return Boolean(
    target &&
    typeof target.closest === "function" &&
    // closest 会从双击目标节点开始向父级查找，命中按钮/复选框等交互控件时不触发卡片编辑。
    target.closest(selector),
  );
};

export const getQualityStatusClassName = (qualityCheck) => {
  if (qualityCheck && qualityCheck.status === "high") {
    return styles["question-quality-badge-high"];
  }

  if (qualityCheck && qualityCheck.status === "low") {
    return styles["question-quality-badge-low"];
  }

  return styles["question-quality-badge-pass"];
};

const renderOption = (option, index) => (
  <div
    key={`${option.key || index}-${index}`}
    className={styles["option-item"]}
    data-testid="question-option-item"
  >
    <span className={styles["option-key"]}>
      {option.key || getOptionKey(index)}.
    </span>
    {renderRichText(
      getOptionDisplayAnswers(option, index),
      styles["option-content"],
      {
        "data-option-content": "true",
        "data-testid": "question-option-content",
      },
    )}
  </div>
);

const OptionGrid = ({ optionList }) => {
  const layoutSequence = useMemo(
    () => getOptionColumnLayoutSequence(optionList.length),
    [optionList.length],
  );
  const gridReference = useRef();

  const updateLayoutMode = useCallback(() => {
    const gridNode = gridReference.current;

    if (!gridNode) {
      return;
    }

    const nextLayoutMode = measureSafeOptionLayoutMode(
      gridNode,
      layoutSequence,
    );

    if (gridNode.dataset.layoutMode !== nextLayoutMode) {
      gridNode.dataset.layoutMode = nextLayoutMode;
    }
  }, [layoutSequence]);

  useLayoutEffect(
    (unusedDependency) => {
      void unusedDependency;
      updateLayoutMode();
    },
    [updateLayoutMode, optionList],
  );

  useEffect(
    (unusedDependency) => {
      void unusedDependency;
      const gridNode = gridReference.current;

      if (!gridNode) {
        return;
      }

      const handleResize = (unusedEvent) => {
        void unusedEvent;
        updateLayoutMode();
      };
      const formulaImageNodes = [...gridNode.querySelectorAll("img")];
      const delayedRecheckTimers = OPTION_LAYOUT_INITIAL_RECHECK_DELAYS.map(
        (delay) => window.setTimeout(handleResize, delay),
      );
      const ResizeObserverConstructor = globalThis["ResizeObserver"];
      const resizeObserver =
        typeof ResizeObserverConstructor === "function"
          ? new ResizeObserverConstructor((unusedEntries) => {
              void unusedEntries;
              updateLayoutMode();
            })
          : undefined;

      window.addEventListener("resize", handleResize);

      if (resizeObserver) {
        resizeObserver.observe(gridNode);
      }

      formulaImageNodes.map((imageNode) => {
        imageNode.addEventListener("load", handleResize);
        return imageNode;
      });

      return (unusedCleanupEvent) => {
        void unusedCleanupEvent;
        window.removeEventListener("resize", handleResize);
        delayedRecheckTimers.map((timerId) => {
          window.clearTimeout(timerId);
          return timerId;
        });

        if (resizeObserver) {
          resizeObserver.disconnect();
        }

        formulaImageNodes.map((imageNode) => {
          imageNode.removeEventListener("load", handleResize);
          return imageNode;
        });
      };
    },
    [optionList, updateLayoutMode],
  );

  return (
    <div
      ref={gridReference}
      className={styles["option-grid"]}
      data-option-count={String(optionList.length)}
      data-testid="question-option-grid"
    >
      {optionList.map((option, index) => renderOption(option, index))}
    </div>
  );
};

const renderQuestionOptions = (question) => {
  if (!isChoiceQuestion(question)) {
    return false;
  }

  return (
    <div className={`${styles["detail-block"]} ${styles["option-region"]}`}>
      {question.optionList.length > 0 ? (
        <OptionGrid optionList={question.optionList} />
      ) : (
        <div className={styles["empty-inline"]}>
          {trans("questionTask.none", "无")}
        </div>
      )}
    </div>
  );
};

const renderOptionalAnswer = (question) => {
  const gapFillingAnswerGroups =
    Number(question && question.type) === FILL_BLANK_QUESTION_TYPE
      ? getGapFillingAnswerGroups(question && question.gapFillingAnswer)
      : [];
  const answerText = getAnswerText(question);

  if (!answerText && gapFillingAnswerGroups.length === 0) {
    return false;
  }

  return (
    <div className={styles["sub-question-answer"]}>
      <span className={styles["sub-question-meta-label"]}>
        {trans("global.answer", "答案")}：
      </span>
      {gapFillingAnswerGroups.length > 0 ? (
        <GapFillingAnswerDisplay
          answerGroups={gapFillingAnswerGroups}
          answerTextClassName={styles["gap-answer-rich-text"]}
          className={SUB_QUESTION_META_TEXT_CLASS}
          renderAnswer={renderAnswerText}
          styles={styles}
        />
      ) : (
        renderAnswerText(answerText, SUB_QUESTION_META_TEXT_CLASS)
      )}
    </div>
  );
};

const renderOptionalAnalysis = (analysis) => {
  if (!analysis) {
    return false;
  }

  return (
    <div className={styles["sub-question-analysis"]}>
      <span className={styles["sub-question-meta-label"]}>
        {trans("global.analysis", "解析")}：
      </span>
      {renderRichText(analysis, SUB_QUESTION_META_TEXT_CLASS)}
    </div>
  );
};

const renderQuestionScoreInline = (question) => {
  const scoreText = getQuestionScoreText(question);

  return (
    <span
      className={`${styles["question-score-inline"]} ${
        scoreText ? "" : styles["question-score-inline-empty"]
      }`}
    >
      {scoreText
        ? trans("questionTask.scoreWithUnit", "{$score} 分", {
            score: scoreText,
          })
        : trans("questionTask.scorePlaceholder", "未设分")}
    </span>
  );
};

const renderSubQuestionPrompt = (
  questionNumber,
  subQuestion,
  subQuestionIndex,
  selectionControl,
  subQuestionActions,
) => (
  <div
    className={styles["sub-question-prompt"]}
    data-testid="sub-question-prompt"
  >
    {selectionControl ? (
      <span className={styles["sub-question-selection-control"]}>
        {selectionControl}
      </span>
    ) : (
      false
    )}
    <span className={styles["question-number-inline"]}>
      {getSubQuestionNumberLabel(questionNumber, subQuestionIndex)}
    </span>
    {renderRichText(subQuestion.content, styles["html-content"])}
    {renderQuestionScoreInline(subQuestion)}
    {subQuestionActions}
  </div>
);

const renderSubQuestionOptions = (subQuestion) => {
  if (!isChoiceQuestion(subQuestion) || subQuestion.optionList.length === 0) {
    return false;
  }

  return (
    <div
      className={`${styles["sub-question-options"]} ${styles["option-region"]}`}
    >
      <OptionGrid optionList={subQuestion.optionList} />
    </div>
  );
};

const isSubQuestionSelectEnabled = (onSubQuestionSelect) =>
  typeof onSubQuestionSelect === "function";

const createSubQuestionClickHandler = (
  onSubQuestionSelect,
  subQuestionIndex,
) =>
  isSubQuestionSelectEnabled(onSubQuestionSelect)
    ? (event) => {
        onSubQuestionSelect(subQuestionIndex, event);
      }
    : undefined;

const createSubQuestionDoubleClickHandler = (
  onSubQuestionDoubleClick,
  subQuestionIndex,
) =>
  typeof onSubQuestionDoubleClick === "function"
    ? (event) => {
        event.stopPropagation();
        onSubQuestionDoubleClick(subQuestionIndex, event);
      }
    : undefined;

const createSubQuestionKeyDownHandler = (
  onSubQuestionSelect,
  subQuestionIndex,
) =>
  isSubQuestionSelectEnabled(onSubQuestionSelect)
    ? (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        onSubQuestionSelect(subQuestionIndex, event);
      }
    : undefined;

const renderSubQuestion = ({
  onSubQuestionDoubleClick,
  onSubQuestionSelect,
  questionNumber,
  questionDraftId,
  renderSubQuestionSelectionControl,
  renderSubQuestionActions,
  subQuestion,
  subQuestionIndex,
}) => (
  <div
    key={`${questionDraftId}-sub-${subQuestionIndex}`}
    className={styles["sub-question-item"]}
    data-question-card-sub-question-index={subQuestionIndex}
    role={
      isSubQuestionSelectEnabled(onSubQuestionSelect) ? "button" : undefined
    }
    tabIndex={isSubQuestionSelectEnabled(onSubQuestionSelect) ? 0 : undefined}
    onClick={createSubQuestionClickHandler(
      onSubQuestionSelect,
      subQuestionIndex,
    )}
    onDoubleClick={createSubQuestionDoubleClickHandler(
      onSubQuestionDoubleClick,
      subQuestionIndex,
    )}
    onKeyDown={createSubQuestionKeyDownHandler(
      onSubQuestionSelect,
      subQuestionIndex,
    )}
  >
    {renderSubQuestionPrompt(
      questionNumber,
      subQuestion,
      subQuestionIndex,
      typeof renderSubQuestionSelectionControl === "function"
        ? renderSubQuestionSelectionControl(subQuestion, subQuestionIndex)
        : false,
      typeof renderSubQuestionActions === "function"
        ? renderSubQuestionActions(subQuestion, subQuestionIndex)
        : false,
    )}
    {renderSubQuestionOptions(subQuestion)}
    {renderOptionalAnswer(subQuestion)}
    {renderOptionalAnalysis(subQuestion.analysis)}
  </div>
);

export const renderSubQuestions = (
  question,
  renderSubQuestionSelectionControl,
  onSubQuestionDoubleClick,
  renderSubQuestionActions,
  onSubQuestionSelect,
) => {
  if (
    !isCombinationQuestion(question) ||
    !Array.isArray(question.sonQuestionList) ||
    question.sonQuestionList.length === 0
  ) {
    return false;
  }

  return (
    <div className={styles["detail-block"]}>
      <div className={styles["sub-question-list"]}>
        {question.sonQuestionList.map((subQuestion, index) =>
          renderSubQuestion({
            onSubQuestionDoubleClick,
            onSubQuestionSelect,
            questionNumber: getQuestionNumber(question),
            questionDraftId: question.draftId,
            renderSubQuestionActions,
            renderSubQuestionSelectionControl,
            subQuestion,
            subQuestionIndex: index,
          }),
        )}
      </div>
    </div>
  );
};

export const renderQuestionContent = (
  question,
  renderSubQuestionSelectionControl,
  onSubQuestionDoubleClick,
  renderSubQuestionActions,
  onSubQuestionSelect,
) => {
  return (
    <>
      <div className={styles["question-prompt"]}>
        <span className={styles["question-number-inline"]}>
          {getQuestionNumber(question)}.
        </span>
        {renderRichText(question.content, styles["html-content"])}
        {renderQuestionScoreInline(question)}
      </div>
      {renderQuestionOptions(question)}
      {renderSubQuestions(
        question,
        renderSubQuestionSelectionControl,
        onSubQuestionDoubleClick,
        renderSubQuestionActions,
        onSubQuestionSelect,
      )}
      {!isCombinationQuestion(question) && renderOptionalAnswer(question)}
      {renderOptionalAnalysis(question.analysis)}
    </>
  );
};

OptionGrid.propTypes = {
  optionList: PropTypes.arrayOf(
    PropTypes.shape({
      answers: PropTypes.string,
      key: PropTypes.string,
    }),
  ).isRequired,
};

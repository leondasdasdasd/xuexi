import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Button,
  Empty,
  message,
  Modal,
  Select,
  Spin,
  Statistic,
  Table,
  Tag,
} from "antd";

import { queryPaperList } from "../../services/example";
import {
  applyExamStructureMatch,
  queryExamStructureMatchDetail,
  queryExamStructurePaperSummary,
  saveExamStructureMatchDraft,
  startExamStructureAiMatch,
} from "../../services/examStructureMatch";
import { paperCanEdit } from "../../services/paper";
import { canUseExamStructureMatch } from "../../utils/examStructureMatch";
import { navigateToHashRoute } from "../../utils/hashRoute";
import { trans } from "../../utils/i18n";
import { ensureSessionId } from "../../utils/sessionId";
import {
  buildRecordTypeFilterOptions,
  getRecordMatchProfile,
  getRecordTypeProfile,
  MATCH_FILTER_ALL_VALUE,
  matchesRecordFilters,
  matchesRecordTypeFilter,
} from "../Paper/components/examStructureMatcher";

import styles from "../Paper/components/ExamStructureMatchModal.module.less";

const { Option } = Select;

const normalizePaperList = (responseContent) => {
  if (Array.isArray(responseContent?.examList)) {
    return responseContent.examList;
  }

  if (Array.isArray(responseContent)) {
    return responseContent;
  }

  return [];
};

const normalizePaperName = (paper) =>
  paper?.title ||
  paper?.paperName ||
  paper?.examPaperName ||
  paper?.examName ||
  trans("paper.match.unnamedPaper", "未命名试卷");

const buildPaperSearchText = (paper) => {
  const profile = getRecordMatchProfile(paper);
  const typeProfile = getRecordTypeProfile(paper);

  return [
    normalizePaperName(paper),
    typeProfile.typeLabel,
    profile.stageLabel,
    profile.subjectLabel,
  ]
    .filter(Boolean)
    .join(" ");
};

const getCurrentHashRoute = () => {
  if (typeof window === "undefined") {
    return "/paper";
  }

  return (window.location.hash || "").replace(/^#/, "") || "/paper";
};

const getPaperId = (paper) => paper?.paperId || paper?.id;

const getResponseContent = (response) => {
  if (!response || response.err || response.status === false) {
    return null;
  }

  return response.content === undefined ? response : response.content;
};

const buildSummaryFromRecord = (record) => ({
  moduleCount: record?.moduleCount,
  paperId: getPaperId(record),
  questionCount: record?.questionCount,
  title: normalizePaperName(record),
  totalScore: record?.totalScore,
});

const getReviewTagColor = (tag) => {
  const redTags = [
    trans("paper.match.tag.unmatched", "未匹配"),
    trans("paper.match.tag.questionTypeMismatch", "题型不一致"),
  ];
  const orangeTags = [
    trans("paper.match.tag.needReview", "需复核"),
    trans("paper.match.tag.scoreNeedsCheck", "分值需核对"),
    trans("paper.match.tag.manualAdjust", "手动调整"),
  ];
  const blueTags = [
    trans("paper.match.tag.splitCombination", "拆分组合题"),
    trans("paper.match.tag.splitBlank", "拆分填空题"),
    trans("paper.match.tag.multiSubToOne", "多问挂一题"),
  ];

  if (redTags.includes(tag)) {
    return "red";
  }
  if (orangeTags.includes(tag)) {
    return "orange";
  }
  if (blueTags.includes(tag)) {
    return "blue";
  }
  return "green";
};

const ReviewTags = ({ tags = [] }) => {
  const safeTags =
    tags.length > 0 ? tags : [trans("paper.match.tag.needReview", "需复核")];

  return safeTags.map((tag) => (
    <Tag color={getReviewTagColor(tag)} key={tag}>
      {tag}
    </Tag>
  ));
};

const formatStructureValue = (value) =>
  value === undefined || value === null || value === "" ? "--" : String(value);

const PaperStructureMeta = ({ summary }) => (
  <div className={styles["summary-meta"]}>
    <span>
      {trans("paper.match.moduleCount", "大题 {$count} 个", {
        count: formatStructureValue(summary?.moduleCount),
      })}
    </span>
    <span>
      {trans("paper.match.questionCount", "小题 {$count} 个", {
        count: formatStructureValue(summary?.questionCount),
      })}
    </span>
    <span>
      {trans("paper.match.totalScore", "总分 {$score} 分", {
        score: formatStructureValue(summary?.totalScore),
      })}
    </span>
  </div>
);

const normalizeRows = (rows = []) =>
  rows.map((row, index) => ({
    ...row,
    rowKey: row.rowKey || row.examQuestion?.questionKey || `row-${index}`,
  }));

const normalizeStatistics = ({ rows, statistics }) => {
  const targetCount = statistics?.targetCount ?? rows.length;
  const linkedCount = rows.filter(
    (row) => row.selectedStandardQuestionKey || row.selectedStandardQuestionId,
  ).length;

  return {
    targetCount,
    linkedCount,
    reviewCount: Math.max(targetCount - linkedCount, 0),
  };
};

const buildViewState = (
  content,
  fallbackExamSummary,
  fallbackStandardSummary,
) => {
  const rows = normalizeRows(content?.rows || []);
  const statistics = normalizeStatistics({
    rows,
    statistics: content?.statistics,
  });

  return {
    ...content,
    examPaperSummary:
      content?.examPaperSummary ||
      fallbackExamSummary ||
      buildSummaryFromRecord(),
    rows,
    standardPaperSummary:
      content?.standardPaperSummary || fallbackStandardSummary,
    standardQuestionOptions: content?.standardQuestionOptions || [],
    statistics,
    warnings: content?.warnings || [],
  };
};

const UNMATCHED_MAPPING_TYPE = "UNMATCHED";

const BLANK_SPLIT_MAPPING_TYPE = "BLANK_SPLIT";
const PARENT_BIND_MAPPING_TYPE = "PARENT_BIND";
const SUBQUESTION_MAPPING_TYPE = "SUBQUESTION";

const getSourceFragmentIndexFromKey = (questionKey) => {
  const matched = String(questionKey || "").match(/-s(\d+)$/);
  return matched ? Number(matched[1]) : undefined;
};

const getSelectableQuestionKey = (option = {}) =>
  option.selectableQuestionKey || option.questionKey;

const getBlankSelectableQuestionKey = (questionKey, blankId) =>
  `${questionKey}#blank:${blankId}`;

const isCombinationOption = (option = {}) =>
  /组合|composite/i.test(String(option.questionType || ""));

const getOptionMappingType = (option = {}) => {
  if (option.mappingType) {
    return option.mappingType;
  }
  if (option.blankId) {
    return BLANK_SPLIT_MAPPING_TYPE;
  }
  if (option.parentQuestionKey) {
    return SUBQUESTION_MAPPING_TYPE;
  }
  if (isCombinationOption(option)) {
    return PARENT_BIND_MAPPING_TYPE;
  }
  return "EXACT";
};

const buildBlankOptionLabel = (option = {}, blankOrder) =>
  trans("paper.match.blankSegmentLabel", "{$label} 空{$index}", {
    index: blankOrder + 1,
    label: option.label || option.questionNo || option.questionKey,
  });

export const buildSelectableStandardQuestionOptions = (options = []) =>
  options.flatMap((option) => {
    const normalizedOption = {
      ...option,
      mappingType: getOptionMappingType(option),
      selectableQuestionKey: getSelectableQuestionKey(option),
    };
    const blankIds = Array.isArray(option.blankIds) ? option.blankIds : [];

    if (option.parentQuestionKey || blankIds.length <= 1) {
      return [normalizedOption];
    }

    const blankOptions = blankIds.map((blankId, blankOrder) => {
      return {
        ...option,
        blankId,
        blankOrder,
        label: buildBlankOptionLabel(option, blankOrder),
        mappingType: BLANK_SPLIT_MAPPING_TYPE,
        selectableQuestionKey: getBlankSelectableQuestionKey(
          option.questionKey,
          blankId,
        ),
        sourceFragmentIndex: blankOrder,
        sourceGroupKey: option.sourceGroupKey || option.questionKey,
      };
    });

    return [normalizedOption, ...blankOptions];
  });

const getMappingMode = (row = {}, selectedOption, mappingType) => {
  if (mappingType === UNMATCHED_MAPPING_TYPE) {
    return "unmatched";
  }
  if (mappingType === "BLANK_SPLIT") {
    return "blank-compatible";
  }
  if (mappingType === "SUBQUESTION" || mappingType === "PARENT_BIND") {
    return "parent-child";
  }
  if (row.mode && !selectedOption) {
    return row.mode;
  }
  if (selectedOption?.parentQuestionKey) {
    return "parent-child";
  }
  return "single";
};

const getSourceFragmentIndex = (row = {}, selectedOption) => {
  if (
    selectedOption?.sourceFragmentIndex !== undefined &&
    selectedOption?.sourceFragmentIndex !== null
  ) {
    return selectedOption.sourceFragmentIndex;
  }
  if (
    row.sourceFragmentIndex !== undefined &&
    row.sourceFragmentIndex !== null
  ) {
    return row.sourceFragmentIndex;
  }
  if (row.blankOrder !== undefined && row.blankOrder !== null) {
    return Math.max(Number(row.blankOrder), 0);
  }
  return getSourceFragmentIndexFromKey(selectedOption?.questionKey);
};

const buildQuestionReference = (question = {}) => ({
  parentQuestionId: question.parentQuestionId ?? null,
  parentQuestionKey: question.parentQuestionKey ?? null,
  questionId: question.questionId ?? null,
  questionKey: question.questionKey,
});

const getSelectedOption = (row, optionLookup) => {
  if (row.blankId) {
    const blankOption =
      optionLookup[
        getBlankSelectableQuestionKey(
          row.selectedStandardQuestionKey,
          row.blankId,
        )
      ];

    if (blankOption) {
      return blankOption;
    }
  }

  return (
    optionLookup[row.selectedStandardQuestionKey] ||
    optionLookup[String(row.selectedStandardQuestionId)]
  );
};

const getSelectedValue = (row = {}, optionLookup = {}) => {
  if (!row.selectedStandardQuestionKey) {
    return row.selectedStandardQuestionKey;
  }

  if (row.blankId) {
    const blankKey = getBlankSelectableQuestionKey(
      row.selectedStandardQuestionKey,
      row.blankId,
    );

    if (optionLookup[blankKey]) {
      return blankKey;
    }
  }

  return row.selectedStandardQuestionKey;
};

const getMappingType = (row = {}, selectedOption) => {
  if (selectedOption) {
    return getOptionMappingType(selectedOption);
  }

  return row.mappingType && row.mappingType !== UNMATCHED_MAPPING_TYPE
    ? row.mappingType
    : "EXACT";
};

export const buildMatchesFromRows = (rows = [], optionLookup = {}) =>
  rows
    .map((row) => {
      const selectedOption = getSelectedOption(row, optionLookup);
      const questionKey =
        selectedOption?.questionKey || row.selectedStandardQuestionKey;
      const questionId =
        row.selectedStandardQuestionId || selectedOption?.questionId;

      if (!questionKey && !questionId) {
        return {
          blankId: null,
          clearExisting: true,
          confidence: row.confidence,
          exam: buildQuestionReference(row.examQuestion),
          mappingType: UNMATCHED_MAPPING_TYPE,
          mode: "unmatched",
          reason:
            row.reason ||
            trans(
              "paper.match.manualEmptyNote",
              "该目标题暂未挂接源题，请继续人工调整。",
            ),
          sourceFragmentIndex: null,
          sourceGroupKey: null,
          standard: null,
          targetFragmentIndex: row.targetFragmentIndex ?? 0,
          targetGroupKey:
            row.targetGroupKey ||
            row.examQuestion?.parentQuestionKey ||
            row.examQuestion?.questionKey,
        };
      }

      const mappingType = getMappingType(row, selectedOption);
      const blankId = selectedOption?.blankId ?? row.blankId ?? null;
      const sourceFragmentIndex = getSourceFragmentIndex(row, selectedOption);

      return {
        blankId,
        clearExisting: false,
        confidence: row.confidence,
        exam: buildQuestionReference(row.examQuestion),
        mappingType,
        mode: getMappingMode(row, selectedOption, mappingType),
        reason: row.reason,
        sourceFragmentIndex:
          sourceFragmentIndex === undefined ? null : sourceFragmentIndex,
        sourceGroupKey:
          row.sourceGroupKey ||
          selectedOption?.sourceGroupKey ||
          selectedOption?.parentQuestionKey ||
          questionKey,
        standard: {
          parentQuestionId: selectedOption?.parentQuestionId ?? null,
          parentQuestionKey: selectedOption?.parentQuestionKey ?? null,
          questionId,
          questionKey,
        },
        targetFragmentIndex: row.targetFragmentIndex ?? 0,
        targetGroupKey:
          row.targetGroupKey ||
          row.examQuestion?.parentQuestionKey ||
          row.examQuestion?.questionKey,
      };
    })
    .filter((match) => match?.exam?.questionKey);

export const getApplyErrorMessage = (response) => {
  const errors = Array.isArray(response?.content?.errors)
    ? response.content.errors.filter(Boolean)
    : [];

  if (errors.length > 0) {
    return errors.join("；");
  }

  return (
    response?.message || trans("paper.match.applyFailed", "确认匹配结果失败")
  );
};

export const getApplyErrorMessages = (response) => {
  const errors = Array.isArray(response?.content?.errors)
    ? response.content.errors.filter(Boolean)
    : [];

  if (errors.length > 0) {
    return errors;
  }

  return [getApplyErrorMessage(response)];
};

const EDIT_LOCK_READY_TYPES = new Set([5, 6]);
const EDIT_LOCK_CONFLICT_TYPES = new Set([2, 3, 4]);

const getEditLockMessage = (type, currentUserName) => {
  const messageMap = {
    2: trans(
      "paper.match.editLockOtherUser",
      "{$name} 正在编辑，你的编辑会覆盖TA的内容，确认要开始编辑吗?",
      { name: currentUserName || "" },
    ),
    3: trans(
      "paper.match.editLockSameAccount",
      "你的账号当前正在另一台设备或其他页面上编辑，确认要开始编辑吗?",
    ),
    4: trans(
      "paper.match.editLockHistoryUser",
      "{$name} 正在编辑，确认要重新获得编辑权限吗?",
      { name: currentUserName || "" },
    ),
  };

  return messageMap[type];
};

const confirmEditLock = (confirm, content) =>
  new Promise((resolve) => {
    confirm({
      cancelText: trans("global.cancel", "取消"),
      content,
      okText: trans("global.confirm", "确定"),
      onCancel: () => resolve(false),
      onOk: () => resolve(true),
      title: trans("paper.match.editLockConfirmTitle", "确认获取编辑权限"),
    });
  });

const getEditLockType = (response) => response?.content?.type;

const isEditLockReady = (response) =>
  response?.status && EDIT_LOCK_READY_TYPES.has(getEditLockType(response));

const requestEditLock = async ({
  paperCanEditRequest,
  paperId,
  showError,
  tabId,
}) => {
  const response = await paperCanEditRequest({
    paperId,
    query: false,
    tabId,
  });

  if (isEditLockReady(response)) {
    return true;
  }

  showError(
    response?.message ||
      trans("paper.match.editLockFailed", "当前试卷暂时无法编辑"),
  );
  return false;
};

export const resolveEditLockForApply = async ({
  confirm = Modal.confirm,
  paperCanEditRequest = paperCanEdit,
  paperId,
  showError = message.error,
  tabId,
}) => {
  const queryResponse = await paperCanEditRequest({
    paperId,
    query: true,
    tabId,
  });

  if (!queryResponse?.status) {
    showError(
      queryResponse?.message ||
        trans("paper.match.editLockFailed", "当前试卷暂时无法编辑"),
    );
    return false;
  }

  const lockType = getEditLockType(queryResponse);
  if (EDIT_LOCK_READY_TYPES.has(lockType)) {
    return true;
  }

  if (lockType === 1) {
    return requestEditLock({
      paperCanEditRequest,
      paperId,
      showError,
      tabId,
    });
  }

  if (EDIT_LOCK_CONFLICT_TYPES.has(lockType)) {
    const confirmed = await confirmEditLock(
      confirm,
      getEditLockMessage(lockType, queryResponse.content?.currentUserName),
    );
    if (!confirmed) {
      return false;
    }
    return requestEditLock({
      paperCanEditRequest,
      paperId,
      showError,
      tabId,
    });
  }

  showError(trans("paper.match.editLockFailed", "当前试卷暂时无法编辑"));
  return false;
};

const formatQuestionLabel = (question = {}) =>
  [
    question.questionNo || question.serialNumber || question.questionKey,
    question.questionType,
    question.score === undefined || question.score === null
      ? ""
      : trans("paper.match.scoreWithUnit", "{$score}分", {
          score: question.score,
        }),
  ]
    .filter(Boolean)
    .join(" / ");

const formatOptionLabel = (option = {}) =>
  [
    option.label || option.questionNo || option.questionKey,
    option.questionType,
    option.score === undefined || option.score === null
      ? ""
      : trans("paper.match.scoreWithUnit", "{$score}分", {
          score: option.score,
        }),
  ]
    .filter(Boolean)
    .join(" / ");

/**
 *
 * @param properties
 */
function PaperSelectionMatchModal(properties) {
  const {
    modalTitle,
    onApplied,
    onCancel,
    returnButtonText,
    sourceSummaryTitle,
    tableTargetTitle,
    targetPaperId,
    targetRecord,
    targetSummaryTitle,
    visible,
  } = properties;
  const [paperOptions, setPaperOptions] = useState([]);
  const [selectedSourcePaperId, setSelectedSourcePaperId] = useState();
  const [stageFilter, setStageFilter] = useState(MATCH_FILTER_ALL_VALUE);
  const [subjectFilter, setSubjectFilter] = useState(MATCH_FILTER_ALL_VALUE);
  const [typeFilter, setTypeFilter] = useState(MATCH_FILTER_ALL_VALUE);
  const [matchView, setMatchView] = useState(null);
  const [examSummary, setExamSummary] = useState(
    buildSummaryFromRecord(targetRecord),
  );
  const [standardSummary, setStandardSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [matching, setMatching] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyErrorMessages, setApplyErrorMessages] = useState([]);
  const [editLockConfirmConfig, setEditLockConfirmConfig] = useState();
  const applyErrorPanelReference = useRef();
  const editLockConfirmConfigReference = useRef();

  const closeEditLockConfirm = useCallback((confirmed) => {
    const config = editLockConfirmConfigReference.current;
    editLockConfirmConfigReference.current = undefined;
    setEditLockConfirmConfig();
    if (confirmed) {
      config?.onOk?.();
    } else {
      config?.onCancel?.();
    }
  }, []);

  const openEditLockConfirm = useCallback((config) => {
    if (editLockConfirmConfigReference.current) {
      editLockConfirmConfigReference.current.onCancel?.();
    }
    editLockConfirmConfigReference.current = config;
    setEditLockConfirmConfig(config);
  }, []);

  const selectableStandardQuestionOptions = useMemo(
    () =>
      buildSelectableStandardQuestionOptions(
        matchView?.standardQuestionOptions || [],
      ),
    [matchView],
  );

  const optionLookup = useMemo(() => {
    const result = {};
    for (const option of selectableStandardQuestionOptions) {
      const selectableQuestionKey = getSelectableQuestionKey(option);

      if (selectableQuestionKey) {
        result[selectableQuestionKey] = option;
      }
      if (option.questionKey && !option.blankId) {
        result[option.questionKey] = option;
      }
      if (
        option.questionId !== undefined &&
        option.questionId !== null &&
        !option.blankId
      ) {
        result[String(option.questionId)] = option;
      }
    }
    return result;
  }, [selectableStandardQuestionOptions]);

  const rows = matchView?.rows || [];
  const statistics = useMemo(
    () =>
      normalizeStatistics({
        rows,
        statistics: matchView?.statistics,
      }),
    [matchView, rows],
  );

  const resetMatchResult = () => {
    setMatchView(null);
  };

  const loadPaperSummary = async (paperId, fallbackRecord) => {
    const response = await queryExamStructurePaperSummary({ paperId });
    const content = getResponseContent(response);
    return (
      content?.paperSummary || content || buildSummaryFromRecord(fallbackRecord)
    );
  };

  useEffect(() => {
    if (!visible || !targetPaperId) {
      return;
    }

    let ignore = false;
    const fallbackExamSummary = buildSummaryFromRecord(targetRecord);
    setLoading(true);
    setExamSummary(fallbackExamSummary);
    setStandardSummary(null);
    setSelectedSourcePaperId();
    setMatchView(null);

    (async () => {
      try {
        const [detailResponse, summaryResponse] = await Promise.all([
          queryExamStructureMatchDetail({ examPaperId: targetPaperId }),
          queryExamStructurePaperSummary({ paperId: targetPaperId }),
        ]);
        const detailContent = getResponseContent(detailResponse);
        const summaryContent = getResponseContent(summaryResponse);
        const nextExamSummary =
          summaryContent?.paperSummary ||
          summaryContent ||
          detailContent?.examPaperSummary ||
          fallbackExamSummary;

        if (ignore) {
          return;
        }

        setExamSummary(nextExamSummary);
        if (detailContent?.found || detailContent?.rows?.length) {
          const nextView = buildViewState(detailContent, nextExamSummary);
          setMatchView(nextView);
          setStandardSummary(nextView.standardPaperSummary || null);
          setSelectedSourcePaperId(nextView.standardPaperSummary?.paperId);
        }

        const targetProfile = getRecordMatchProfile({
          ...targetRecord,
          ...nextExamSummary,
        });
        const paperListResponse = await queryPaperList({
          limit: 200,
          pageNo: 1,
          stageKey: targetProfile.stageKey,
          stageName: targetProfile.stageLabel,
          subjectId: targetProfile.subjectId,
          subjectName: targetProfile.subjectName,
        });

        if (!paperListResponse?.status) {
          message.error(
            paperListResponse?.message ||
              trans("paper.match.loadPaperListFailed", "读取试卷列表失败"),
          );
          return;
        }

        if (ignore) {
          return;
        }

        const nextPaperOptions = normalizePaperList(
          paperListResponse.content,
        ).filter(
          (paper) =>
            String(getPaperId(paper)) !== String(targetPaperId) &&
            canUseExamStructureMatch(paper),
        );
        const targetTypeKey = getRecordTypeProfile(targetRecord || {}).typeKey;
        const candidateTypeOptions = buildRecordTypeFilterOptions(
          nextPaperOptions,
        ).filter((option) => option.value !== MATCH_FILTER_ALL_VALUE);

        setPaperOptions(nextPaperOptions);
        setStageFilter(targetProfile.stageKey || MATCH_FILTER_ALL_VALUE);
        setSubjectFilter(targetProfile.subjectKey || MATCH_FILTER_ALL_VALUE);
        setTypeFilter(
          targetTypeKey ||
            (candidateTypeOptions.length === 1
              ? candidateTypeOptions[0].value
              : MATCH_FILTER_ALL_VALUE),
        );
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [targetPaperId, targetRecord, visible]);

  useEffect(() => {
    if (visible) {
      return;
    }

    setPaperOptions([]);
    setSelectedSourcePaperId();
    setStageFilter(MATCH_FILTER_ALL_VALUE);
    setSubjectFilter(MATCH_FILTER_ALL_VALUE);
    setTypeFilter(MATCH_FILTER_ALL_VALUE);
    setMatchView(null);
    setExamSummary(buildSummaryFromRecord(targetRecord));
    setStandardSummary(null);
    setApplyErrorMessages([]);
  }, [targetRecord, visible]);

  useEffect(
    () => () => {
      if (editLockConfirmConfigReference.current) {
        editLockConfirmConfigReference.current.onCancel?.();
        editLockConfirmConfigReference.current = undefined;
      }
    },
    [],
  );

  useEffect(() => {
    if (!visible && editLockConfirmConfigReference.current) {
      closeEditLockConfirm(false);
    }
  }, [closeEditLockConfirm, visible]);

  useEffect(() => {
    if (applyErrorMessages.length === 0) {
      return;
    }

    const scrollIntoView = applyErrorPanelReference.current?.scrollIntoView;
    if (typeof scrollIntoView !== "function") {
      return;
    }

    scrollIntoView.call(applyErrorPanelReference.current, {
      block: "nearest",
    });
  }, [applyErrorMessages]);

  const filterSourceRecords = useMemo(
    () => [targetRecord, ...paperOptions].filter(Boolean),
    [paperOptions, targetRecord],
  );

  const typeOptions = useMemo(
    () => buildRecordTypeFilterOptions(filterSourceRecords),
    [filterSourceRecords],
  );

  const filteredPaperOptions = useMemo(
    () =>
      paperOptions.filter(
        (paper) =>
          matchesRecordFilters(paper, {
            stageKey: stageFilter,
            subjectKey: subjectFilter,
          }) && matchesRecordTypeFilter(paper, typeFilter),
      ),
    [paperOptions, stageFilter, subjectFilter, typeFilter],
  );

  const selectedSourcePaperOption = useMemo(
    () =>
      paperOptions.find(
        (paper) => String(getPaperId(paper)) === String(selectedSourcePaperId),
      ),
    [paperOptions, selectedSourcePaperId],
  );

  const handleSourcePaperChange = async (paperId) => {
    const selectedPaper = paperOptions.find(
      (paper) => String(getPaperId(paper)) === String(paperId),
    );

    setSelectedSourcePaperId(paperId);
    setStandardSummary(buildSummaryFromRecord(selectedPaper));
    resetMatchResult();
    setLoadingSummary(true);
    try {
      const nextSummary = await loadPaperSummary(paperId, selectedPaper);
      setStandardSummary(nextSummary);
    } catch {
      message.error(
        trans("paper.match.loadSourcePaperFailed", "读取源试卷失败"),
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleTypeFilterChange = (nextTypeFilter) => {
    const nextFilteredPaperOptions = paperOptions.filter(
      (paper) =>
        matchesRecordFilters(paper, {
          stageKey: stageFilter,
          subjectKey: subjectFilter,
        }) && matchesRecordTypeFilter(paper, nextTypeFilter),
    );

    setTypeFilter(nextTypeFilter);
    if (
      selectedSourcePaperId &&
      !nextFilteredPaperOptions.some(
        (paper) => String(getPaperId(paper)) === String(selectedSourcePaperId),
      )
    ) {
      setSelectedSourcePaperId();
      setStandardSummary(null);
      resetMatchResult();
    }
  };

  const saveDraftRows = async (nextRows) => {
    if (!matchView?.matchRecordId) {
      return;
    }

    setSavingDraft(true);
    try {
      const response = await saveExamStructureMatchDraft({
        matchRecordId: matchView.matchRecordId,
        matches: buildMatchesFromRows(nextRows, optionLookup),
      });
      const content = getResponseContent(response);
      if (!content && response?.status === false) {
        message.error(
          response.message ||
            trans("paper.match.saveDraftFailed", "保存匹配草稿失败"),
        );
      }
    } finally {
      setSavingDraft(false);
    }
  };

  const handleMappingChange = (rowKey, selectedQuestionKey) => {
    const selectedOption = optionLookup[selectedQuestionKey];
    const mappingType = selectedQuestionKey
      ? getOptionMappingType(selectedOption)
      : UNMATCHED_MAPPING_TYPE;
    const nextRows = rows.map((row) =>
      row.rowKey === rowKey
        ? {
            ...row,
            reason: selectedQuestionKey
              ? trans(
                  "paper.match.manualChangeNote",
                  "已手动调整映射，请继续复核。",
                )
              : trans(
                  "paper.match.manualEmptyNote",
                  "该目标题暂未挂接源题，请继续人工调整。",
                ),
            reviewTags: selectedQuestionKey
              ? [trans("paper.match.tag.manualAdjust", "手动调整")]
              : [trans("paper.match.tag.unmatched", "未匹配")],
            clearExisting: !selectedQuestionKey,
            blankId: selectedOption?.blankId ?? null,
            blankOrder: selectedOption?.blankOrder ?? null,
            mappingType,
            mode: selectedQuestionKey
              ? getMappingMode(row, selectedOption, mappingType)
              : "unmatched",
            selectedStandardQuestionId: selectedOption?.questionId,
            selectedStandardQuestionKey: selectedOption?.questionKey,
            sourceFragmentIndex: selectedQuestionKey
              ? getSourceFragmentIndex(row, selectedOption)
              : null,
            sourceGroupKey: selectedQuestionKey
              ? selectedOption?.sourceGroupKey ||
                selectedOption?.parentQuestionKey ||
                selectedOption?.questionKey
              : null,
          }
        : row,
    );

    setMatchView((previous) => ({
      ...previous,
      rows: nextRows,
      statistics: normalizeStatistics({
        rows: nextRows,
        statistics: previous?.statistics,
      }),
    }));
    saveDraftRows(nextRows);
  };

  const handleStartMatching = async () => {
    if (!selectedSourcePaperId) {
      message.error(
        trans("paper.match.selectSourcePaperFirst", "请先选择一套试卷"),
      );
      return;
    }

    setMatching(true);
    try {
      const response = await startExamStructureAiMatch({
        examPaperId: targetPaperId,
        standardPaperId: selectedSourcePaperId,
      });
      const content = getResponseContent(response);

      if (!content) {
        message.error(
          response?.message ||
            trans("paper.match.aiMatchFailed", "AI 匹配失败，请稍后重试"),
        );
        return;
      }

      const nextView = buildViewState(content, examSummary, standardSummary);
      setMatchView(nextView);
      setExamSummary(nextView.examPaperSummary || examSummary);
      setStandardSummary(nextView.standardPaperSummary || standardSummary);
    } finally {
      setMatching(false);
    }
  };

  const handleApply = async () => {
    if (!matchView?.matchRecordId) {
      message.error(trans("paper.match.noMatchRecord", "暂无可确认的匹配结果"));
      return;
    }

    const tabId = ensureSessionId();
    setApplying(true);
    setApplyErrorMessages([]);
    try {
      const canApply = await resolveEditLockForApply({
        confirm: openEditLockConfirm,
        paperId: targetPaperId,
        tabId,
      });

      if (!canApply) {
        return;
      }

      const response = await applyExamStructureMatch({
        matchRecordId: matchView.matchRecordId,
        matches: buildMatchesFromRows(rows, optionLookup),
        tabId,
      });

      if (!response?.status) {
        setApplyErrorMessages(getApplyErrorMessages(response));
        message.error(
          trans(
            "paper.match.applyFailedViewDetail",
            "确认匹配结果失败，请查看弹窗内原因",
          ),
        );
        return;
      }

      message.success(
        trans("paper.match.confirmSuccess", "已确认这一轮 AI 匹配建议"),
      );
      onApplied?.(response.content);
      onCancel?.();
    } finally {
      setApplying(false);
    }
  };

  const openTargetTwoWayTest = () => {
    if (!targetPaperId) {
      message.error(
        trans(
          "paper.match.targetPaperNotFound",
          "未找到当前考试试卷，暂时无法进入细目表",
        ),
      );
      return;
    }

    navigateToHashRoute(`/twoWayTest/${targetPaperId}`);
  };

  const openAiPaperInput = () => {
    const currentRoute = getCurrentHashRoute();
    const query = [
      `returnTo=${encodeURIComponent(currentRoute)}`,
      targetPaperId
        ? `matchTargetPaperId=${encodeURIComponent(targetPaperId)}`
        : "",
      "matchSource=examStructure",
    ]
      .filter(Boolean)
      .join("&");

    navigateToHashRoute(`/testPaperManagement/question_task?${query}`);
  };

  const columns = [
    {
      dataIndex: "examQuestion",
      key: "examQuestion",
      render: (examQuestion) => (
        <div className={styles["target-cell"]}>
          <div className={styles["target-question-no"]}>
            {formatQuestionLabel(examQuestion)}
          </div>
        </div>
      ),
      title:
        tableTargetTitle ||
        trans("paper.match.currentTargetQuestion", "当前细目表目标题"),
      width: "13.75rem",
    },
    {
      dataIndex: "selectedStandardQuestionKey",
      key: "selectedStandardQuestionKey",
      render: (selectedStandardQuestionKey, record) => (
        <Select
          allowClear
          showSearch
          value={getSelectedValue(record, optionLookup)}
          style={{ width: "100%" }}
          placeholder={trans(
            "paper.match.selectSourceQuestionSegment",
            "选择源试卷题目片段",
          )}
          filterOption={(input, option) =>
            String(option.props["data-search-text"] || "")
              .toLowerCase()
              .includes(String(input || "").toLowerCase())
          }
          onChange={(value) => handleMappingChange(record.rowKey, value)}
        >
          {selectableStandardQuestionOptions.map((option) => (
            <Option
              disabled={option.disabled}
              value={getSelectableQuestionKey(option)}
              key={getSelectableQuestionKey(option) || option.questionId}
              data-search-text={formatOptionLabel(option)}
            >
              {formatOptionLabel(option)}
            </Option>
          ))}
        </Select>
      ),
      title: trans("paper.match.selectedSourceQuestion", "选中的源试卷题"),
    },
    {
      dataIndex: "reason",
      key: "reason",
      render: (reason, record) => (
        <div className={styles["note-cell"]}>
          <div className={styles["note-tags"]}>
            <ReviewTags tags={record.reviewTags} />
          </div>
          <div className={styles["note-text"]}>{reason}</div>
        </div>
      ),
      title: trans("paper.match.reviewHint", "复核提示"),
      width: "22.5rem",
    },
  ];

  const normalizedSourceSummaryTitle =
    sourceSummaryTitle === "待挂接试卷"
      ? trans("paper.match.sourcePaper", "待匹配试卷")
      : sourceSummaryTitle || trans("paper.match.sourcePaper", "待匹配试卷");

  return (
    <>
      <Modal
        destroyOnClose
        footer={null}
        maskClosable={false}
        onCancel={onCancel}
        title={
          modalTitle ||
          trans(
            "paper.match.selectModalTitleForTwoWay",
            "选择试卷并匹配到当前细目表",
          )
        }
        visible={visible}
        width="min(78.75rem, calc(100vw - 2rem))"
        wrapClassName={styles.modal}
      >
        <Spin spinning={loading}>
          <div className={styles["selector-row"]}>
            <div className={styles["selector-filter"]}>
              <div className={styles["selector-label"]}>
                {trans("paper.match.examType", "考试类型")}
              </div>
              <Select
                value={typeFilter}
                style={{ width: "100%" }}
                onChange={handleTypeFilterChange}
              >
                {typeOptions.map((option) => (
                  <Option value={option.value} key={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>
            <div className={styles["selector-main"]}>
              <div className={styles["selector-label"]}>
                {trans("paper.match.sourcePaperLabel", "源试卷")}
              </div>
              <Select
                showSearch
                value={selectedSourcePaperId}
                style={{ width: "100%" }}
                placeholder={trans(
                  "paper.match.sourcePaperPlaceholder",
                  "请选择要挂到当前细目表的试卷",
                )}
                filterOption={(input, option) =>
                  String(option.props["data-search-text"] || "")
                    .toLowerCase()
                    .includes(String(input || "").toLowerCase())
                }
                onChange={handleSourcePaperChange}
                notFoundContent={loading ? <Spin size="small" /> : null}
              >
                {filteredPaperOptions.map((paper) => {
                  const paperId = getPaperId(paper);
                  const profile = getRecordMatchProfile(paper);
                  return (
                    <Option
                      value={paperId}
                      key={paperId}
                      data-search-text={buildPaperSearchText(paper)}
                    >
                      {normalizePaperName(paper)}
                      {profile.gradeName || profile.subjectLabel
                        ? `（${[profile.stageLabel, profile.subjectLabel].filter(Boolean).join(" / ")}）`
                        : ""}
                    </Option>
                  );
                })}
              </Select>
            </div>
            <Button onClick={openAiPaperInput}>
              {trans("paper.match.aiPaperInput", "AI 录入试卷")}
            </Button>
            <Button
              type="primary"
              loading={matching}
              onClick={handleStartMatching}
            >
              {trans("paper.match.startAiMatch", "开始 AI 匹配")}
            </Button>
          </div>

          <div className={styles["panel-grid"]}>
            <div className={styles["summary-card"]}>
              <div className={styles["summary-title"]}>
                {normalizedSourceSummaryTitle}
              </div>
              <div className={styles["summary-name"]}>
                {standardSummary?.title ||
                  normalizePaperName(selectedSourcePaperOption) ||
                  trans("paper.match.notSelected", "尚未选择")}
              </div>
              <Spin spinning={loadingSummary}>
                <PaperStructureMeta summary={standardSummary} />
              </Spin>
            </div>
            <div className={styles["summary-card"]}>
              <div className={styles["summary-title"]}>
                {targetSummaryTitle ||
                  trans("paper.match.currentTwoWay", "当前细目表")}
              </div>
              <div className={styles["summary-name"]}>
                {examSummary?.title || normalizePaperName(targetRecord)}
              </div>
              <PaperStructureMeta summary={examSummary} />
            </div>
          </div>

          {matchView?.stale ? (
            <Alert
              showIcon
              type="warning"
              className={styles["guard-panel"]}
              message={trans(
                "paper.match.staleWarning",
                "试卷结构已变化，请重新开始 AI 匹配后再确认写回。",
              )}
            />
          ) : null}

          {matchView?.warnings?.length ? (
            <Alert
              showIcon
              type="warning"
              className={styles["guard-panel"]}
              message={matchView.warnings.join("；")}
            />
          ) : null}

          {applyErrorMessages.length > 0 ? (
            <div ref={applyErrorPanelReference}>
              <Alert
                showIcon
                type="error"
                className={styles["guard-panel"]}
                message={trans("paper.match.applyFailed", "确认匹配结果失败")}
                description={
                  <div className={styles["guard-message-list"]}>
                    {applyErrorMessages.map((errorMessage, index) => (
                      <div key={`${index}-${errorMessage}`}>{errorMessage}</div>
                    ))}
                  </div>
                }
              />
            </div>
          ) : null}

          {matching ? (
            <div className={styles["loading-panel"]}>
              <Spin
                tip={trans(
                  "paper.match.generatingSuggestion",
                  "AI 正在生成映射建议...",
                )}
              />
            </div>
          ) : rows.length > 0 ? (
            <>
              <div className={styles["statistics-row"]}>
                <div className={styles["stat-card"]}>
                  <Statistic
                    title={trans("paper.match.targetQuestionCount", "目标题数")}
                    value={statistics.targetCount}
                  />
                </div>
                <div className={styles["stat-card"]}>
                  <Statistic
                    title={trans("paper.match.matchedCount", "已挂接")}
                    value={statistics.linkedCount}
                  />
                </div>
                <div className={styles["stat-card"]}>
                  <Statistic
                    title={trans("paper.match.needReviewCount", "需复核")}
                    value={statistics.reviewCount}
                  />
                </div>
              </div>

              <div className={styles["status-note"]}>
                {savingDraft
                  ? trans("paper.match.savingDraft", "正在保存匹配草稿...")
                  : trans(
                      "paper.match.defaultStatus",
                      "AI 会核对试卷和当前答题卡，做一轮匹配。能匹配的直接匹配上，匹配不上的也会有说明。",
                    )}
              </div>

              <Table
                bordered
                columns={columns}
                dataSource={rows}
                pagination={false}
                rowKey="rowKey"
                scroll={{ x: "48.5rem" }}
              />
            </>
          ) : (
            <div className={styles["empty-panel"]}>
              <Empty description={false} />
            </div>
          )}

          <div className={styles["footer-actions"]}>
            <Button onClick={onCancel}>{trans("global.cancel", "取消")}</Button>
            <Button
              onClick={handleApply}
              disabled={rows.length === 0 || matchView?.stale}
              loading={applying}
            >
              {trans("paper.match.confirmResult", "确认结果")}
            </Button>
            <Button
              type="primary"
              onClick={openTargetTwoWayTest}
              disabled={!targetPaperId}
            >
              {returnButtonText ||
                trans("paper.match.goTwoWayAdjust", "去细目表调整")}
            </Button>
          </div>
        </Spin>
      </Modal>
      <Modal
        centered
        destroyOnClose
        maskClosable={false}
        visible={Boolean(editLockConfirmConfig)}
        title={editLockConfirmConfig?.title}
        okText={editLockConfirmConfig?.okText}
        cancelText={editLockConfirmConfig?.cancelText}
        onOk={() => closeEditLockConfirm(true)}
        onCancel={() => closeEditLockConfirm(false)}
        zIndex={1100}
      >
        {editLockConfirmConfig?.content}
      </Modal>
    </>
  );
}

export default PaperSelectionMatchModal;

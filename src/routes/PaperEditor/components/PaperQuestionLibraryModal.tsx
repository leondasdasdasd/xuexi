import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Input, message, Modal, Pagination, Select } from "antd";

import { trans } from "../../../utils/i18n";
import { getQuestionTypeLocalizedName } from "../../../utils/questionTypeEditorAdapter";
import type { QuestionAssetBusinessQuestionType } from "../../QuestionAssetInput/questionAssetEditorTypes";
import {
  loadPaperQuestionLibraryPage,
  loadPaperQuestionLibraryTypes,
  type PaperQuestionLibraryAggregate,
  type PaperQuestionLibraryPage,
} from "../paperQuestionLibraryService";
import {
  createPaperQuestionAssetResult,
  type PaperQuestionAssetResult,
} from "../questionAssetPaperAdapter";
import type { GradeOption, SubjectOption } from "../types";
import PaperQuestionLibraryResults from "./PaperQuestionLibraryResults";

import styles from "./PaperQuestionLibraryModal.module.less";

const PAGE_SIZE = 10;

interface Props {
  excludedQuestionIds: number[];
  gradeOptions: GradeOption[];
  initialGradeId?: number;
  initialQuestionTypeKey?: number;
  initialSubjectId?: number;
  locale: "en-US" | "zh-CN";
  onCancel: () => void;
  onConfirm: (results: PaperQuestionAssetResult[]) => void | Promise<void>;
  subjectOptions: SubjectOption[];
  visible: boolean;
}

interface SelectedQuestion {
  aggregate: PaperQuestionLibraryAggregate;
  questionTypes: QuestionAssetBusinessQuestionType[];
}

const EMPTY_PAGE: PaperQuestionLibraryPage = {
  items: [],
  questionTypes: [],
  questionTypesById: {},
  total: 0,
};

const getAggregateQuestionId = (aggregate: PaperQuestionLibraryAggregate) =>
  aggregate.question.id;

const updateSelectedQuestions = (
  current: Map<number, SelectedQuestion>,
  aggregate: PaperQuestionLibraryAggregate,
  questionTypes: QuestionAssetBusinessQuestionType[],
  checked: boolean,
) => {
  const next = new Map(current);
  const questionId = getAggregateQuestionId(aggregate);
  if (checked) {
    next.set(questionId, { aggregate, questionTypes });
  } else {
    next.delete(questionId);
  }
  return next;
};

const applyTeachingScopePatch = (
  patch: { gradeId?: number; subjectId?: number },
  setGradeId: React.Dispatch<React.SetStateAction<number | undefined>>,
  setSubjectId: React.Dispatch<React.SetStateAction<number | undefined>>,
) => {
  if (patch.gradeId !== undefined) setGradeId(patch.gradeId);
  if (patch.subjectId !== undefined) setSubjectId(patch.subjectId);
};

interface ConfirmParameters {
  confirming: boolean;
  onConfirm: Props["onConfirm"];
  selected: Map<number, SelectedQuestion>;
  setConfirming: React.Dispatch<React.SetStateAction<boolean>>;
}

interface LibraryPageParameters {
  gradeId?: number;
  pageNo: number;
  questionTypeKey?: number | null;
  searchKeyword: string;
  subjectId?: number;
  visible: boolean;
}

const usePaperQuestionLibraryPage = ({
  gradeId,
  pageNo,
  questionTypeKey,
  searchKeyword,
  subjectId,
  visible,
}: LibraryPageParameters) => {
  const [page, setPage] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const requestVersion = useRef(0);

  const resetPage = useCallback(() => {
    requestVersion.current += 1;
    setPage(EMPTY_PAGE);
    setLoadError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!visible || !gradeId || !subjectId || !questionTypeKey) return;
    const version = ++requestVersion.current;
    setLoading(true);
    setLoadError("");
    void loadPaperQuestionLibraryPage({
      gradeId,
      keyword: searchKeyword,
      limit: PAGE_SIZE,
      pageNo,
      questionTypeKey,
      subjectId,
    })
      .then((result) => {
        if (version === requestVersion.current) setPage(result);
        return result;
      })
      .catch((error) => {
        if (version === requestVersion.current) {
          setLoadError(
            (error instanceof Error ? error.message : "") ||
              trans("paperEditor.libraryLoadFailed", "题库加载失败"),
          );
        }
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
    return () => {
      requestVersion.current += 1;
    };
  }, [
    gradeId,
    pageNo,
    questionTypeKey,
    reloadVersion,
    searchKeyword,
    subjectId,
    visible,
  ]);

  return {
    loadError,
    loading,
    page,
    resetPage,
    retry: () => setReloadVersion((current) => current + 1),
  };
};

interface QuestionTypeParameters {
  gradeId?: number;
  gradeOptions: GradeOption[];
  subjectId?: number;
  visible: boolean;
}

const usePaperQuestionLibraryTypes = ({
  gradeId,
  gradeOptions,
  subjectId,
  visible,
}: QuestionTypeParameters) => {
  const [questionTypes, setQuestionTypes] = useState<
    QuestionAssetBusinessQuestionType[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const requestVersion = useRef(0);

  useEffect(() => {
    requestVersion.current += 1;
    setQuestionTypes([]);
    setLoadError("");
    setLoading(false);
    if (!visible || !gradeId || !subjectId) return;
    const stageId = gradeOptions.find(
      (grade) => grade.gradeId === gradeId,
    )?.stageId;
    if (!stageId) {
      setLoadError(
        trans(
          "questionAssetInput.noQuestionType",
          "暂无可用题型，暂时无法保存",
        ),
      );
      return;
    }
    const version = ++requestVersion.current;
    setLoading(true);
    void loadPaperQuestionLibraryTypes({ stageId, subjectId })
      .then((result) => {
        if (version === requestVersion.current) setQuestionTypes(result);
        return result;
      })
      .catch((error) => {
        if (version === requestVersion.current) {
          setLoadError(
            (error instanceof Error ? error.message : "") ||
              trans(
                "questionAssetInput.noQuestionType",
                "暂无可用题型，暂时无法保存",
              ),
          );
        }
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
    return () => {
      requestVersion.current += 1;
    };
  }, [gradeId, gradeOptions, subjectId, visible]);

  return { loadError, loading, questionTypes };
};

const confirmSelectedQuestions = async ({
  confirming,
  onConfirm,
  selected,
  setConfirming,
}: ConfirmParameters) => {
  if (selected.size === 0 || confirming) return;
  setConfirming(true);
  try {
    const results = [...selected.values()].map((item) =>
      createPaperQuestionAssetResult(item.aggregate, item.questionTypes),
    );
    await onConfirm(results);
  } catch (error) {
    message.error(
      (error instanceof Error ? error.message : "") ||
        trans("paperEditor.libraryAddFailed", "题目添加失败"),
    );
  } finally {
    setConfirming(false);
  }
};

const getLibraryControlState = ({
  hasQuestionType,
  hasTeachingScope,
  loading,
  questionTypesLoading,
  selectedCount,
}: {
  hasQuestionType: boolean;
  hasTeachingScope: boolean;
  loading: boolean;
  questionTypesLoading: boolean;
  selectedCount: number;
}) => ({
  confirmDisabled:
    !hasTeachingScope ||
    !hasQuestionType ||
    selectedCount === 0 ||
    loading ||
    questionTypesLoading,
  queryDisabled: !hasTeachingScope || !hasQuestionType,
});

interface LibraryFooterProps {
  confirmDisabled: boolean;
  confirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onPageChange: (pageNo: number) => void;
  pageNo: number;
  total: number;
}

/**
 * 渲染固定在弹窗底部的分页与确认操作。
 * @param {LibraryFooterProps} properties 分页状态与操作回调。
 * @returns {React.ReactElement} 弹窗底部操作区。
 */
function PaperQuestionLibraryFooter(
  properties: LibraryFooterProps,
): React.ReactElement {
  const {
    confirmDisabled,
    confirming,
    onCancel,
    onConfirm,
    onPageChange,
    pageNo,
    total,
  } = properties;
  return (
    <div className={styles["library-footer"]}>
      {total > PAGE_SIZE ? (
        <Pagination
          className={styles["library-pagination"]}
          current={pageNo}
          pageSize={PAGE_SIZE}
          showSizeChanger={false}
          total={total}
          onChange={onPageChange}
        />
      ) : null}
      <div className={styles["library-footer-actions"]}>
        <Button disabled={confirming} onClick={onCancel}>
          {trans("global.cancel", "取消")}
        </Button>
        <Button
          disabled={confirmDisabled}
          loading={confirming}
          type="primary"
          onClick={onConfirm}
        >
          {trans("paperEditor.addSelectedQuestions", "添加所选题目")}
        </Button>
      </div>
    </div>
  );
}

/**
 * 提供按教学范围和可切换题型筛选的 V2 题库多选能力。
 * @param {Props} properties 查询上下文、初始题型和确认回调。
 * @returns {React.ReactElement} 题库选择弹窗。
 */
function PaperQuestionLibraryModal(properties: Props): React.ReactElement {
  const {
    excludedQuestionIds,
    gradeOptions,
    initialGradeId,
    initialQuestionTypeKey,
    initialSubjectId,
    locale,
    onCancel,
    onConfirm,
    subjectOptions,
    visible,
  } = properties;
  const [gradeId, setGradeId] = useState(initialGradeId);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [questionTypeKey, setQuestionTypeKey] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [selected, setSelected] = useState<Map<number, SelectedQuestion>>(
    new Map(),
  );
  const [confirming, setConfirming] = useState(false);
  const {
    loadError: questionTypesLoadError,
    loading: questionTypesLoading,
    questionTypes,
  } = usePaperQuestionLibraryTypes({
    gradeId,
    gradeOptions,
    subjectId,
    visible,
  });
  const { loadError, loading, page, resetPage, retry } =
    usePaperQuestionLibraryPage({
      gradeId,
      pageNo,
      questionTypeKey,
      searchKeyword,
      subjectId,
      visible,
    });
  const excludedIds = new Set(excludedQuestionIds);
  const hasTeachingScope = Boolean(gradeId && subjectId);
  const hasQuestionType = Boolean(questionTypeKey);
  const { confirmDisabled, queryDisabled } = getLibraryControlState({
    hasQuestionType,
    hasTeachingScope,
    loading,
    questionTypesLoading,
    selectedCount: selected.size,
  });

  useEffect(() => {
    if (!visible) return;
    setGradeId(initialGradeId);
    setSubjectId(initialSubjectId);
    setQuestionTypeKey(null);
    setKeyword("");
    setSearchKeyword("");
    setPageNo(1);
    setSelected(new Map());
  }, [initialGradeId, initialSubjectId, visible]);

  useEffect(() => {
    if (!visible || questionTypesLoading) return;
    const preferredType = questionTypes.find(
      (questionType) =>
        questionType.businessQuestionTypeId === initialQuestionTypeKey,
    );
    setQuestionTypeKey(
      preferredType?.businessQuestionTypeId ??
        questionTypes[0]?.businessQuestionTypeId ??
        null,
    );
    setPageNo(1);
    setSelected(new Map());
    resetPage();
  }, [
    initialQuestionTypeKey,
    questionTypes,
    questionTypesLoading,
    resetPage,
    visible,
  ]);

  const changeTeachingScope = (patch: {
    gradeId?: number;
    subjectId?: number;
  }) => {
    applyTeachingScopePatch(patch, setGradeId, setSubjectId);
    setQuestionTypeKey(null);
    setKeyword("");
    setSearchKeyword("");
    setPageNo(1);
    setSelected(new Map());
    resetPage();
  };
  const changeQuestionType = (nextQuestionTypeKey: number) => {
    setQuestionTypeKey(nextQuestionTypeKey);
    setPageNo(1);
    setSelected(new Map());
    resetPage();
  };
  const toggleQuestion = (
    aggregate: PaperQuestionLibraryAggregate,
    checked: boolean,
  ) => {
    setSelected((current) =>
      updateSelectedQuestions(current, aggregate, page.questionTypes, checked),
    );
  };
  const confirmSelection = () =>
    void confirmSelectedQuestions({
      confirming,
      onConfirm,
      selected,
      setConfirming,
    });

  return (
    <Modal
      destroyOnClose
      footer={
        <PaperQuestionLibraryFooter
          confirmDisabled={confirmDisabled}
          confirming={confirming}
          onCancel={onCancel}
          onConfirm={confirmSelection}
          onPageChange={setPageNo}
          pageNo={pageNo}
          total={page.total}
        />
      }
      maskClosable={!confirming}
      onCancel={confirming ? undefined : onCancel}
      title={trans("paperEditor.libraryModalTitle", "从题库添加题目")}
      visible={visible}
      width="min(96vw, 72rem)"
      wrapClassName={styles["library-modal-wrap"]}
    >
      <div className={styles["library-query-scroll"]}>
        <div className={styles["library-query-row"]}>
          <Select
            aria-label={trans("global.grade", "年级")}
            placeholder={trans("global.pleaseSelectGrade", "请选择年级")}
            value={gradeId}
            onChange={(value: number) =>
              changeTeachingScope({ gradeId: value })
            }
          >
            {gradeOptions.map((grade) => (
              <Select.Option key={grade.gradeId} value={grade.gradeId}>
                {grade.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            aria-label={trans("global.subject", "学科")}
            placeholder={trans("global.pleaseSelectSubject", "请选择学科")}
            value={subjectId}
            onChange={(value: number) =>
              changeTeachingScope({ subjectId: value })
            }
          >
            {subjectOptions.map((subject) => (
              <Select.Option key={subject.subjectId} value={subject.subjectId}>
                {subject.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            aria-label={trans("global.questionType", "题型")}
            disabled={!hasTeachingScope || questionTypesLoading}
            loading={questionTypesLoading}
            placeholder={trans("global.questionType", "题型")}
            value={questionTypeKey ?? undefined}
            onChange={changeQuestionType}
          >
            {questionTypes.map((questionType) => (
              <Select.Option
                key={questionType.businessQuestionTypeId}
                value={questionType.businessQuestionTypeId}
              >
                {getQuestionTypeLocalizedName(questionType, locale)}
              </Select.Option>
            ))}
          </Select>
          <Input.Search
            aria-label={trans("paperEditor.libraryKeyword", "题目关键词")}
            disabled={queryDisabled}
            enterButton={trans("global.search", "搜索")}
            placeholder={trans(
              "paperEditor.libraryKeywordPlaceholder",
              "搜索题干关键词",
            )}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onSearch={() => {
              if (queryDisabled) return;
              setPageNo(1);
              setSearchKeyword(keyword.trim());
            }}
          />
          <strong className={styles["library-selected-count"]}>
            {trans("paperEditor.librarySelectedCount", "已选择 {$count} 题", {
              count: selected.size,
            })}
          </strong>
        </div>
      </div>
      {questionTypesLoadError ? (
        <Alert
          className={styles["library-alert"]}
          message={questionTypesLoadError}
          showIcon
          type="error"
        />
      ) : null}
      <PaperQuestionLibraryResults
        confirming={confirming}
        excludedIds={excludedIds}
        hasQuestionType={hasQuestionType}
        hasTeachingScope={hasTeachingScope}
        loadError={loadError}
        loading={loading}
        locale={locale}
        onRetry={retry}
        onToggle={toggleQuestion}
        page={page}
        selectedIds={new Set(selected.keys())}
      />
    </Modal>
  );
}

export default PaperQuestionLibraryModal;

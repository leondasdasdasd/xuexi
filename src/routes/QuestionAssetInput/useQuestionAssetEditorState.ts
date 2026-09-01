import { useCallback, useEffect, useRef, useState } from "react";
import type { QuestionContentDraft } from "@yungu-fed/question-editor";
import { message } from "antd";

import { trans } from "../../utils/i18n";
import { QUESTION_LEVEL_NORMAL } from "../../utils/questionDifficulty";
import { getStageIdByGradeId } from "../../utils/teachingContextAdapter";
import {
  createQuestionAssetEditorDraft,
  getDefaultQuestionAssetTypeId,
  getQuestionAssetTypeById,
} from "./questionAssetContentAdapter";
import {
  loadQuestionAssetEditState,
  queryQuestionAssetTypes,
} from "./questionAssetEditorService";
import type {
  QuestionAssetBusinessQuestionType,
  QuestionAssetEditorState,
  QuestionAssetGradeWithStage,
  QuestionAssetScope,
} from "./questionAssetEditorTypes";

interface Parameters {
  active?: boolean;
  allGradeList: QuestionAssetGradeWithStage[];
  initialScope?: QuestionAssetScope;
  questionId?: number | string;
}

const createInitialState = (
  initialScope?: QuestionAssetScope,
): QuestionAssetEditorState => ({
  draft: undefined,
  questionTypes: [],
  resource: { ...initialScope, level: QUESTION_LEVEL_NORMAL },
  selectedTypeId: undefined,
});

const createQuestionTypeEditorState = (
  questionTypes: QuestionAssetBusinessQuestionType[],
  resource: QuestionAssetScope,
): QuestionAssetEditorState => {
  const selectedTypeId = getDefaultQuestionAssetTypeId(questionTypes);
  const questionType = getQuestionAssetTypeById(questionTypes, selectedTypeId);
  return {
    draft: questionType
      ? createQuestionAssetEditorDraft(questionType)
      : undefined,
    questionTypes,
    resource,
    selectedTypeId,
  };
};

const createTeachingContextKey = (
  stageId?: number,
  subjectId?: number,
): string | undefined =>
  stageId && subjectId ? `${stageId}:${subjectId}` : undefined;

const getDisplayError = (error: unknown): string =>
  (error instanceof Error ? error.message : "") ||
  trans("global.failed", "操作失败");

/**
 * 统一管理题目录入页与弹窗的教学上下文、题型定义和编辑草稿。
 * @param {Parameters} parameters 初始范围、题目标识和年级学段映射。
 * @param {boolean} parameters.active 当前消费者是否处于活动状态。
 * @param {GradeWithStage[]} parameters.allGradeList 年级与学段映射。
 * @param {QuestionAssetScope} parameters.initialScope 外部默认教学范围。
 * @param {number|string} parameters.questionId 已有题目标识。
 * @returns {object} 当前权威编辑状态及其范围、题型变更入口。
 */
export const useQuestionAssetEditorState = ({
  active = true,
  allGradeList,
  initialScope,
  questionId,
}: Parameters) => {
  const initialGradeId = initialScope?.gradeId;
  const initialSubjectId = initialScope?.subjectId;
  const [state, setState] = useState<QuestionAssetEditorState>(() =>
    createInitialState(questionId ? undefined : initialScope),
  );
  const [loading, setLoading] = useState(Boolean(questionId));
  const loadedTeachingContextKey = useRef<string>();
  const requestVersion = useRef(0);
  const { gradeId, subjectId } = state.resource;
  const stageId: number | undefined = getStageIdByGradeId(
    allGradeList,
    gradeId,
  );

  const resetEditor = useCallback(() => {
    requestVersion.current += 1;
    loadedTeachingContextKey.current = undefined;
    setLoading(false);
    setState((current) => ({
      ...current,
      draft: undefined,
      questionTypes: [],
      selectedTypeId: undefined,
    }));
  }, []);

  useEffect(() => {
    requestVersion.current += 1;
    loadedTeachingContextKey.current = undefined;
    if (!active) {
      setLoading(false);
      return;
    }
    setLoading(Boolean(questionId));
    setState(
      createInitialState(
        questionId
          ? undefined
          : {
              gradeId: initialGradeId,
              subjectId: initialSubjectId,
            },
      ),
    );
  }, [active, initialGradeId, initialSubjectId, questionId]);

  useEffect(() => {
    if (!active || !questionId || allGradeList.length === 0) return;
    const version = ++requestVersion.current;
    setLoading(true);
    void loadQuestionAssetEditState(questionId, allGradeList)
      .then((loadedState) => {
        if (version !== requestVersion.current) return;
        const nextStageId: number | undefined = getStageIdByGradeId(
          allGradeList,
          loadedState.resource.gradeId,
        );
        loadedTeachingContextKey.current = createTeachingContextKey(
          nextStageId,
          loadedState.resource.subjectId,
        );
        setState(loadedState);
        return loadedState;
      })
      .catch((error: unknown) => {
        if (version === requestVersion.current) {
          message.error(getDisplayError(error));
        }
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
    return () => {
      requestVersion.current += 1;
    };
  }, [active, allGradeList, questionId]);

  useEffect(() => {
    if (!active || allGradeList.length === 0 || !gradeId || !subjectId) return;
    const teachingContextKey = createTeachingContextKey(stageId, subjectId);
    if (
      !teachingContextKey ||
      teachingContextKey === loadedTeachingContextKey.current
    ) {
      return;
    }
    const version = ++requestVersion.current;
    setLoading(true);
    void queryQuestionAssetTypes({ stageId, subjectId })
      .then((questionTypes) => {
        if (version !== requestVersion.current) return;
        loadedTeachingContextKey.current = teachingContextKey;
        setState(
          createQuestionTypeEditorState(questionTypes, {
            gradeId,
            level: QUESTION_LEVEL_NORMAL,
            subjectId,
          }),
        );
        return questionTypes;
      })
      .catch((error: unknown) => {
        if (version === requestVersion.current) {
          message.error(getDisplayError(error));
        }
      })
      .finally(() => {
        if (version === requestVersion.current) setLoading(false);
      });
    return () => {
      requestVersion.current += 1;
    };
  }, [active, allGradeList.length, gradeId, stageId, subjectId]);

  const changeGrade = useCallback(
    (nextGradeId: number) => {
      if (questionId) return;
      resetEditor();
      setState((current) => {
        const resource = { ...current.resource };
        delete resource.subjectId;
        return {
          ...current,
          resource: {
            ...resource,
            chapterIds: [],
            gradeId: nextGradeId,
            indicatorIds: [],
            knowledgeIds: [],
          },
        };
      });
    },
    [questionId, resetEditor],
  );

  const changeSubject = useCallback(
    (nextSubjectId: number) => {
      if (questionId) return;
      resetEditor();
      setState((current) => ({
        ...current,
        resource: {
          ...current.resource,
          chapterIds: [],
          indicatorIds: [],
          knowledgeIds: [],
          subjectId: nextSubjectId,
        },
      }));
    },
    [questionId, resetEditor],
  );

  const changeMetadata = useCallback((patch: Partial<QuestionAssetScope>) => {
    setState((current) => ({
      ...current,
      resource: { ...current.resource, ...patch },
    }));
  }, []);

  const changeType = useCallback(
    (typeId: number) => {
      if (questionId) return;
      const questionType = getQuestionAssetTypeById(
        state.questionTypes,
        typeId,
      );
      if (!questionType) return;
      setState((current) => ({
        ...current,
        draft: createQuestionAssetEditorDraft(questionType),
        selectedTypeId: typeId,
      }));
    },
    [questionId, state.questionTypes],
  );

  const setDraft = useCallback(
    (
      value:
        | QuestionContentDraft
        | null
        | undefined
        | ((
            current?: QuestionContentDraft | null,
          ) => QuestionContentDraft | null | undefined),
    ) =>
      setState((current) => ({
        ...current,
        draft: typeof value === "function" ? value(current.draft) : value,
      })),
    [],
  );

  return {
    ...state,
    changeGrade,
    changeMetadata,
    changeSubject,
    changeType,
    loading,
    setDraft,
  };
};

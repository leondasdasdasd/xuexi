import { requireExamPaperQuestionTypeSnapshots } from "../../services/examPaperQuestionTypeSnapshots";
import {
  ExamPaperV2LoginRedirectError,
  getExamPaperV2Detail,
} from "../../services/examPaperV2";
import { getAllGradeList, getSubjectList } from "../../services/inputQuestion";
import { batchQueryNewMyBusinessQuestionTypes } from "../../services/newMyQuestion";
import { queryQuestionV2Basket } from "../../services/questionV2";
import { trans } from "../../utils/i18n";
import request from "../../utils/request";
import { loginRedirect } from "../../utils/utils";
import { collectPaperBusinessQuestionTypeIds } from "./paperQuestionContentAdapter";
import type {
  GradeOption,
  PaperSaveRequest,
  PaperTypeOption,
  QuestionBasketResponse,
} from "./types";

interface ApiResponse<T> {
  content: T;
  ifLogin: boolean;
  message?: string;
  status: boolean;
}

type RequestClient = <T>(
  url: string,
  options?: { body?: unknown; method?: string },
) => Promise<ApiResponse<T>>;

interface SubjectOptionResponse {
  id: number;
  name: string;
}

const typedRequest = request as unknown as RequestClient;

class PaperEditorLoginRedirectError extends Error {}

const requireApiContent = <T>(response: ApiResponse<T>): T => {
  if (!response.ifLogin) {
    loginRedirect();
    throw new PaperEditorLoginRedirectError();
  }
  if (!response.status) {
    throw new Error(response.message || trans("global.failed", "操作失败"));
  }
  return response.content;
};

/**
 * 将 service 错误收口为页面可展示文案，登录跳转不产生额外提示。
 * @param {unknown} error service 边界错误。
 * @param {string} fallback 无明确信息时的本地化文案。
 * @returns {string|undefined} 可展示文案，或登录跳转时的 undefined。
 */
export const getPaperEditorDisplayError = (
  error: unknown,
  fallback: string,
): string | undefined => {
  if (
    error instanceof PaperEditorLoginRedirectError ||
    error instanceof ExamPaperV2LoginRedirectError
  )
    return undefined;
  return error instanceof Error && error.message ? error.message : fallback;
};

export const queryPaperTypeOptions = (): Promise<
  ApiResponse<PaperTypeOption[]>
> => typedRequest<PaperTypeOption[]>("/api/paper/type/list?type=0");

const loadPaperEditorOptions = async () => {
  const [paperTypeResponse, gradeResponse, subjectResponse] = await Promise.all(
    [
      queryPaperTypeOptions(),
      getAllGradeList({}) as Promise<ApiResponse<GradeOption[]>>,
      getSubjectList({}) as Promise<ApiResponse<SubjectOptionResponse[]>>,
    ],
  );
  return {
    grades: requireApiContent(gradeResponse) || [],
    paperTypes: requireApiContent(paperTypeResponse) || [],
    subjects: (requireApiContent(subjectResponse) || []).map((subject) => ({
      name: subject.name,
      subjectId: subject.id,
    })),
  };
};

export const loadPaperEditorSource = async (subjectId: number) => {
  const [basketResponse, options] = await Promise.all([
    queryQuestionV2Basket({ subjectId }) as Promise<
      ApiResponse<QuestionBasketResponse>
    >,
    loadPaperEditorOptions(),
  ]);
  const basket = requireApiContent(basketResponse);
  const questionTypeResponse = (await batchQueryNewMyBusinessQuestionTypes({
    businessQuestionTypeIds: collectPaperBusinessQuestionTypeIds(
      basket.moduleList,
    ),
  })) as ApiResponse<object[]>;
  return {
    basket,
    ...options,
    questionTypes: requireApiContent(questionTypeResponse) || [],
  };
};

export const loadPaperEditorDetailSource = async (paperId: number) => {
  const [detailResponse, options] = await Promise.all([
    getExamPaperV2Detail(paperId),
    loadPaperEditorOptions(),
  ]);
  const detail = detailResponse;
  if (!detail?.content) {
    throw new Error(trans("paperEditor.detailMissing", "试卷详情不完整"));
  }
  return {
    detail,
    ...options,
    questionTypes: requireExamPaperQuestionTypeSnapshots(
      detail.content.moduleList,
    ),
  };
};

export const savePaperEditorDraft = async (
  payload: PaperSaveRequest,
): Promise<number> => {
  const { paperId, ...body } = payload;
  const response = await typedRequest<{ id: number }>(
    paperId ? `/api/v2/exam-papers/${paperId}` : "/api/v2/exam-papers",
    {
      body,
      method: paperId ? "PUT" : "POST",
    },
  );
  return requireApiContent(response).id;
};

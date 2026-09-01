import {
  batchQueryNewMyBusinessQuestionTypes,
  queryEnabledNewMyBusinessQuestionTypes,
  queryNewMyQuestionPage,
} from "../../services/newMyQuestion";
import { trans } from "../../utils/i18n";
import { collectQuestionContentBusinessQuestionTypeIds } from "../../utils/questionContentV2Tree";
import { createBusinessQuestionTypesById } from "../../utils/questionPreviewAdapter";
import { loginRedirect } from "../../utils/utils";
import type { QuestionAssetBusinessQuestionType } from "../QuestionAssetInput/questionAssetEditorTypes";
import type { QuestionAssetSavedResource } from "./questionAssetPaperAdapter";

export interface PaperQuestionLibraryAggregate extends Omit<
  QuestionAssetSavedResource,
  "question"
> {
  question: QuestionAssetSavedResource["question"] & { id: number };
  resource?: {
    gradeId?: number;
    subjectId?: number;
  };
}

export interface PaperQuestionLibraryPage {
  items: PaperQuestionLibraryAggregate[];
  questionTypes: QuestionAssetBusinessQuestionType[];
  questionTypesById: Record<number, QuestionAssetBusinessQuestionType>;
  total: number;
}

interface LoadParameters {
  gradeId: number;
  keyword: string;
  limit: number;
  pageNo: number;
  questionTypeKey: number;
  subjectId: number;
}

interface LoadQuestionTypesParameters {
  stageId: number;
  subjectId: number;
}

interface QuestionLibraryResponse<T> {
  content?: T;
  ifLogin?: boolean;
  message?: string;
  status?: boolean;
}

interface QuestionLibraryPageContent {
  data: PaperQuestionLibraryAggregate[];
  total: number;
}

const requireQuestionLibraryResponse = <T>(
  response: QuestionLibraryResponse<T>,
): T => {
  if (!response?.ifLogin) {
    loginRedirect();
    throw new Error(trans("global.loginTimeout", "登录已过期"));
  }
  if (!response?.status) {
    throw new Error(
      response?.message ||
        trans("paperEditor.libraryLoadFailed", "题库加载失败"),
    );
  }
  return response.content as T;
};

export const loadPaperQuestionLibraryTypes = async ({
  stageId,
  subjectId,
}: LoadQuestionTypesParameters): Promise<QuestionAssetBusinessQuestionType[]> =>
  requireQuestionLibraryResponse<QuestionAssetBusinessQuestionType[]>(
    await queryEnabledNewMyBusinessQuestionTypes({ stageId, subjectId }),
  );

/**
 * 查询 PaperEditor 题库弹窗的一页数据，并补齐预览与草稿转换依赖的题型定义。
 * @param {LoadParameters} parameters 固定教学上下文、题型和分页条件。
 * @returns {Promise<PaperQuestionLibraryPage>} 题库 aggregate 与对应题型定义。
 */
export const loadPaperQuestionLibraryPage = async (
  parameters: LoadParameters,
): Promise<PaperQuestionLibraryPage> => {
  const content = requireQuestionLibraryResponse<QuestionLibraryPageContent>(
    await queryNewMyQuestionPage({
      businessQuestionTypeIds: [parameters.questionTypeKey],
      gradeIds: [parameters.gradeId],
      keyword: parameters.keyword,
      limit: parameters.limit,
      pageNo: parameters.pageNo,
      subjectIds: [parameters.subjectId],
    }),
  );
  const items = content.data as PaperQuestionLibraryAggregate[];
  if (items.some((item) => !Number.isInteger(item.question?.id))) {
    throw new Error(trans("paperEditor.libraryLoadFailed", "题库加载失败"));
  }
  const businessQuestionTypeIds = collectQuestionContentBusinessQuestionTypeIds(
    items.map((item) => item.question),
  );
  const questionTypes = requireQuestionLibraryResponse<
    QuestionAssetBusinessQuestionType[]
  >(await batchQueryNewMyBusinessQuestionTypes({ businessQuestionTypeIds }));
  return {
    items,
    questionTypes,
    questionTypesById: createBusinessQuestionTypesById(questionTypes),
    total: Number(content.total) || 0,
  };
};

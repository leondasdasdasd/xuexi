import { trans } from "../utils/i18n";
import request from "../utils/request";
import { loginRedirect } from "../utils/utils";
import { requireExamPaperQuestionTypeSnapshots } from "./examPaperQuestionTypeSnapshots";
import type {
  ExamPaperDetailResponse,
  ExamPaperEditDisabledReasonCode,
} from "./examPaperV2.types";
import { ExamApiError } from "./explicitExam.types";

interface ApiResponse<T> {
  content?: T;
  ifLogin: boolean;
  message?: string;
  status: boolean;
}

export class ExamPaperV2LoginRedirectError extends Error {}

const requireContent = <T>(response: ApiResponse<T>): T => {
  if (!response.ifLogin) {
    loginRedirect();
    throw new ExamPaperV2LoginRedirectError();
  }
  if (!response.status || response.content === undefined) {
    throw new ExamApiError(response);
  }
  return response.content;
};

export const getExamPaperV2Detail = async (
  paperId: number,
): Promise<ExamPaperDetailResponse> => {
  const content = requireContent(
    (await request(
      `/api/v2/exam-papers/${paperId}`,
      void 0,
      void 0,
      void 0,
    )) as ApiResponse<
      ExamPaperDetailResponse & {
        editDisabledReasonCode?: ExamPaperEditDisabledReasonCode;
        moduleList?: ExamPaperDetailResponse["content"]["moduleList"];
        paperId?: number;
        type?: number;
      }
    >,
  );
  if (content.content?.moduleList) return content;
  return {
    ...content,
    capabilities: content.capabilities || {
      copy: false,
      delete: false,
      update: Boolean(Reflect.get(content, "showEdit")),
      updateDisabledReasonCode: content.editDisabledReasonCode,
    },
    content: { moduleList: content.moduleList || [] },
    id: content.id || content.paperId || paperId,
    paperTypeCode: content.paperTypeCode || content.type || 0,
  };
};

export interface ExamPaperV2AnswerSource {
  detail: ExamPaperDetailResponse;
  questionTypes: object[];
}

// 教师试作必须在进入作答前一次性拿到试卷和全部题型定义。
export const loadExamPaperV2AnswerSource = async (
  paperId: number,
): Promise<ExamPaperV2AnswerSource> => {
  const detail = await getExamPaperV2Detail(paperId);
  if (!detail.content?.moduleList) {
    throw new Error(
      trans("explicitExam.paperDetailIncomplete", "V2 试卷详情不完整"),
    );
  }
  const questionTypes = requireExamPaperQuestionTypeSnapshots(
    detail.content.moduleList,
  );
  return { detail, questionTypes };
};

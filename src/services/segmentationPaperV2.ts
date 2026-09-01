import request from "../utils/request";

const QUESTION_INCLUDE = "answers,extras";

interface ApiResponse<T = unknown> {
  content: T;
  ifLogin: boolean;
  message?: string;
  status: boolean;
}

type RequestClient = <T = unknown>(
  url: string,
  options?: { body?: unknown; method?: string },
) => Promise<ApiResponse<T>>;

const typedRequest = request as unknown as RequestClient;

export interface SegmentationQuestionQuery {
  businessQuestionTypeIds?: Array<number | string>;
  chapterIds?: Array<number | string>;
  excludeIds?: Array<number | string>;
  gradeIds?: Array<number | string>;
  knowledgeIds?: Array<number | string>;
  levels?: Array<number | string>;
  limit?: number;
  pageNo?: number;
  subjectIds?: Array<number | string>;
  keyword?: string;
}

const csv = (values: Array<number | string> = []) => values.join(",");

const queryString = (
  parameters: Record<string, string | number | undefined>,
) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return query.toString();
};

export const querySegmentationCandidateQuestions = (
  parameters: SegmentationQuestionQuery,
) =>
  typedRequest(
    `/api/v2/questions?${queryString({
      businessQuestionTypeIds: csv(parameters.businessQuestionTypeIds),
      chapterIds: csv(parameters.chapterIds),
      excludeIds: csv(parameters.excludeIds),
      gradeIds: csv(parameters.gradeIds),
      include: QUESTION_INCLUDE,
      knowledgeIds: csv(parameters.knowledgeIds),
      levels: csv(parameters.levels),
      limit: parameters.limit,
      pageNo: parameters.pageNo,
      subjectIds: csv(parameters.subjectIds),
      keyword: parameters.keyword,
    })}`,
  );

export const querySegmentationQuestionsByIds = (ids: Array<number | string>) =>
  typedRequest(
    `/api/v2/segmentation-papers/questions?${queryString({ ids: csv(ids) })}`,
  );

export const recommendSegmentationQuestions = (
  parameters: { gradeId: number | string; subjectId: number | string },
  payload: object,
) =>
  typedRequest(
    `/api/v2/segmentation-papers/question-recommendations?${queryString(
      parameters,
    )}`,
    { body: payload, method: "POST" },
  );

export const querySegmentationPaper = (paperId: number | string) =>
  typedRequest(`/api/v2/segmentation-papers/${paperId}`);

export const createSegmentationPaper = (payload: object) =>
  typedRequest("/api/v2/segmentation-papers", {
    body: payload,
    method: "POST",
  });

export const updateSegmentationPaper = (
  paperId: number | string,
  payload: object,
) =>
  typedRequest(`/api/v2/segmentation-papers/${paperId}`, {
    body: payload,
    method: "PUT",
  });

import { trans } from "../utils/i18n";
import request from "../utils/request";
import { loginRedirect } from "../utils/utils";
import { requireExamPaperQuestionTypeSnapshots } from "./examPaperQuestionTypeSnapshots";
import { queryResourceCreate } from "./example";
import type {
  ApiResponse,
  CurrentUser,
  ExamPreviewResultDto,
  OnlineExamCreationResult,
  StudentExamEntryDto,
  StudentExamPaperDto,
  StudentExamResultDto,
  StudentExamSubmissionAnswerDto,
  StudentPaperDto,
  TaskPublishRequest,
  TeacherExamStudentDirectoryDto,
  TeacherStudentResultDto,
} from "./explicitExam.types";
import { ExamApiError } from "./explicitExam.types";
import { parseExplicitExamTime } from "./explicitExamTime";

const query = (parameters: Record<string, unknown>) =>
  new URLSearchParams(
    Object.entries(parameters).flatMap(([key, value]) =>
      (Array.isArray(value) ? value : [value])
        .filter((item) => item !== undefined && item !== null && item !== "")
        .map((item) => [key, String(item)]),
    ),
  ).toString();

export const unwrapExamApiResponse = <T>(response: ApiResponse<T>): T => {
  if (response.ifLogin === false) {
    loginRedirect();
    throw new ExamApiError(response);
  }
  if (!response.status || response.content === undefined)
    throw new ExamApiError(response);
  return response.content;
};

const get = async <T>(
  url: string,
  parameters: Record<string, unknown> = {},
) => {
  const parametersQuery = query(parameters);
  return unwrapExamApiResponse(
    (await request(
      parametersQuery ? `${url}?${parametersQuery}` : url,
      void 0,
      void 0,
      void 0,
    )) as ApiResponse<T>,
  );
};

const write = async <T>(method: "POST" | "PUT", url: string, body?: unknown) =>
  unwrapExamApiResponse(
    (await request(
      url,
      { method, ...(body === undefined ? {} : { body }) },
      void 0,
      void 0,
    )) as ApiResponse<T>,
  );

const invalidStudentEntryResponse = () =>
  new Error(
    trans("explicitExam.invalidStudentEntry", "学生考试入口响应格式不完整"),
  );

const isTaskPublishTimeDisplayValue = (
  value: unknown,
): value is StudentExamEntryDto["taskPublishTime"] =>
  value === null ||
  typeof value === "string" ||
  (typeof value === "number" && Number.isFinite(value));

const parseOptionalExamTimestamp = (
  value: unknown,
): number | null | undefined => {
  const parsed = parseExplicitExamTime(value);
  if (parsed.kind === "empty") return value === undefined ? undefined : null;
  if (parsed.kind === "valid") return parsed.timestamp;
  throw invalidStudentEntryResponse();
};

const parseOptionalStudentScore = (
  value: unknown,
): number | null | undefined => {
  if (value === undefined || value === null) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw invalidStudentEntryResponse();
};

export const getCurrentUser = () => get<CurrentUser>("/api/currentUser");

export const createOnlineExamV2 = (
  existingCreateBody: Record<string, unknown>,
) =>
  write<OnlineExamCreationResult>("POST", "/api/v2/exams", existingCreateBody);

// 旧接口响应外壳在 service 边界收敛，创建入口只消费中立结果。
export const createOnlineExamForPublication = async (
  existingCreateBody: Record<string, unknown>,
  usesV2Creation: boolean,
): Promise<OnlineExamCreationResult> => {
  if (usesV2Creation) return createOnlineExamV2(existingCreateBody);
  const response = (await queryResourceCreate(
    existingCreateBody,
  )) as ApiResponse<
    Omit<OnlineExamCreationResult, "contractVersion"> & {
      contractVersion?: string;
    }
  >;
  if (!response.status || !response.content) throw new ExamApiError(response);
  return {
    ...response.content,
    contractVersion: response.content.contractVersion || "LEGACY",
  };
};

export const updateExamAuthorityV2 = (examId: number, open: boolean) =>
  write<unknown>("PUT", `/api/v2/exams/${examId}/authority`, { open });

export const publishExamV2 = (examId: number, body: TaskPublishRequest) =>
  write<unknown>("POST", `/api/v2/exams/${examId}/publications`, body);

// 创建成功后的步骤可安全重入；调用方保留 examId，失败时从这里继续。
export const configureAndPublishExamV2 = async (parameters: {
  examId: number;
  open: boolean;
  publicationBody: TaskPublishRequest;
}) => {
  await updateExamAuthorityV2(parameters.examId, parameters.open);
  return publishExamV2(parameters.examId, parameters.publicationBody);
};

export const getStudentExamEntry = async (
  examId: number,
  taskPublishId?: number,
): Promise<StudentExamEntryDto> => {
  const value = await get<unknown>(`/api/v2/exams/${examId}/student-entry`, {
    taskPublishId,
  });
  if (!value || typeof value !== "object") {
    throw invalidStudentEntryResponse();
  }
  const responseExamId = Number(Reflect.get(value, "examId"));
  const responsePaperId = Number(Reflect.get(value, "paperId"));
  const responseTaskPublishId = Number(Reflect.get(value, "taskPublishId"));
  const status = Reflect.get(value, "status");
  const gradeName = Reflect.get(value, "gradeName");
  const taskPublishTime = Reflect.get(value, "taskPublishTime");
  const startTime = parseOptionalExamTimestamp(Reflect.get(value, "startTime"));
  const endTime = parseOptionalExamTimestamp(Reflect.get(value, "endTime"));
  const studentScore = parseOptionalStudentScore(
    Reflect.get(value, "studentScore"),
  );
  const hasValidShape = [
    Number.isSafeInteger(responseExamId),
    responseExamId > 0,
    Number.isSafeInteger(responsePaperId),
    responsePaperId > 0,
    Number.isSafeInteger(responseTaskPublishId),
    responseTaskPublishId > 0,
    typeof gradeName === "string",
    String(gradeName).length > 0,
    isTaskPublishTimeDisplayValue(taskPublishTime),
    ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED"].includes(String(status)),
  ].every(Boolean);
  if (!hasValidShape) {
    throw invalidStudentEntryResponse();
  }
  return {
    examId: responseExamId,
    gradeName: String(gradeName),
    paperId: responsePaperId,
    status: String(status) as StudentExamEntryDto["status"],
    taskPublishId: responseTaskPublishId,
    taskPublishTime,
    ...(startTime === undefined ? {} : { startTime }),
    ...(endTime === undefined ? {} : { endTime }),
    ...(studentScore === undefined ? {} : { studentScore }),
  };
};

export const startStudentExam = (examId: number, taskPublishId: number) =>
  write<string>(
    "POST",
    `/api/v2/exams/${examId}/student-start?${query({ taskPublishId })}`,
  );

export const getStudentPaper = async (examId: number) => {
  const paper = await get<StudentExamPaperDto>(
    `/api/v2/exams/${examId}/student-paper`,
  );
  if (
    paper.paperAvailability !== "READY" &&
    paper.paperAvailability !== "UNAVAILABLE"
  )
    throw new Error(
      trans("explicitExam.invalidPaperAvailability", "试卷可用状态无效"),
    );
  return paper;
};

const loadPaperQuestionTypes = (moduleList: StudentPaperDto["moduleList"]) =>
  requireExamPaperQuestionTypeSnapshots(moduleList);

export const loadStudentPaperAnswerSource = async (examId: number) => {
  const paper = await getStudentPaper(examId);
  if (paper.paperAvailability === "UNAVAILABLE") {
    return { paper, questionTypes: [] };
  }
  const questionTypes = await loadPaperQuestionTypes(paper.moduleList);
  return { paper, questionTypes };
};

export const submitStudentExam = (
  examId: number,
  answers: StudentExamSubmissionAnswerDto[],
  autoSubmit: boolean,
) =>
  write<unknown>("POST", `/api/v2/exams/${examId}/student-submission`, {
    answers,
    autoSubmit,
    type: 0,
  });

export const getStudentResult = (examId: number) =>
  get<StudentExamResultDto>(`/api/v2/exams/${examId}/student-result`);

const loadExamResultSource = async (
  resultRequest: Promise<StudentExamResultDto>,
) => {
  const result = await resultRequest;
  const paper = result.examPaperDetailResponse;
  // 后端已将损坏快照收敛为局部不可用，不能再让题型服务扩大失败范围。
  if (paper.paperAvailability === "UNAVAILABLE") {
    return { questionTypes: [], result };
  }
  const questionTypes = await loadPaperQuestionTypes(paper.moduleList);
  return { questionTypes, result };
};

export const loadStudentExamResultSource = (examId: number) =>
  loadExamResultSource(getStudentResult(examId));

export const submitExamPreview = (
  paperId: number,
  answers: StudentExamSubmissionAnswerDto[],
) =>
  write<ExamPreviewResultDto>("POST", "/api/v2/exam-previews/submission", {
    answers,
    paperId,
    type: 0,
  });

export const getTeacherStudentExamResult = (
  examId: number,
  studentId: number,
) =>
  get<StudentExamResultDto>(
    `/api/v2/exams/${examId}/students/${studentId}/result`,
  );

export const loadTeacherStudentExamResultSource = (
  examId: number,
  studentId: number,
) => loadExamResultSource(getTeacherStudentExamResult(examId, studentId));

export const getTeacherStudentResult = (examId: number, studentId: number) =>
  get<TeacherStudentResultDto>(
    `/api/v2/exams/${examId}/students/${studentId}/marking-result`,
  );

export type TeacherExamStudentQuery = {
  groupId?: number;
  keyword?: string;
  limit?: number;
  pageNo?: number;
};

export const getTeacherExamStudents = (
  examId: number,
  parameters: TeacherExamStudentQuery = {},
) =>
  get<TeacherExamStudentDirectoryDto>(
    `/api/v2/exams/${examId}/students`,
    parameters,
  );

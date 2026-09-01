import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";
import { message } from "antd";

import {
  getStudentExamEntry,
  loadStudentExamResultSource,
  loadStudentPaperAnswerSource,
  startStudentExam,
  submitStudentExam,
} from "../../../services/explicitExam";
import type {
  StudentExamEntryDto,
  StudentExamResultDto,
} from "../../../services/explicitExam.types";
import { trans } from "../../../utils/i18n";
import StudentExamSessionView from "../components/StudentExamSessionView";
import { updateExamPaperPlacementResponse } from "../examPaperView";
import {
  mapPaperToSubmissionAnswers,
  mapStudentExamResultToView,
  mapStudentPaperV2ToExamPaperView,
} from "../mappers";
import { mapExplicitExamLoadError } from "../migrationStatus";
import { closeCurrentPage, type ExplicitExamHistory } from "../navigation";
import { parseStudentAnswerContext } from "../routeContext";
import {
  createStudentExamAnswerDraftKey,
  mapExamPaperViewToStudentExamAnswerDraft,
  mergeStudentExamAnswerDraftIntoExamPaperView,
  parseStudentExamAnswerDraftStorageValue,
} from "../studentExamAnswerDraft";
import type { AnswerMode, ExamPaperView } from "../types";

type Properties = {
  history?: ExplicitExamHistory;
  match: { params: { examId?: string; taskPublishId?: string } };
};

type Phase =
  | "answering"
  | "error"
  | "loading"
  | "ready"
  | "result"
  | "starting"
  | "starting-countdown"
  | "submitting"
  | "unavailable";

const resolveLoadedPaperPhase = (
  availability: "READY" | "UNAVAILABLE",
  entryStatus: StudentExamEntryDto["status"],
): Phase => {
  if (availability === "UNAVAILABLE") return "unavailable";
  return entryStatus === "IN_PROGRESS" ? "answering" : "ready";
};

const StudentExamSessionPage = ({ history, match }: Properties) => {
  const context = useMemo(() => {
    try {
      return parseStudentAnswerContext(match.params);
    } catch (error) {
      return error as Error;
    }
  }, [match.params]);
  const [answerMode, setAnswerMode] = useState<AnswerMode>("continuous");
  const [errorMessage, setErrorMessage] = useState("");
  const [paper, setPaper] = useState<ExamPaperView>();
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<StudentExamResultDto>();
  const [entry, setEntry] = useState<StudentExamEntryDto>();
  const [singleQuestionIndex, setSingleQuestionIndex] = useState(0);
  const requestToken = useRef(0);
  const draftKey =
    context instanceof Error || !entry
      ? ""
      : createStudentExamAnswerDraftKey(context.examId, entry.taskPublishId);

  const loadPaper = useCallback(
    async (examId: number, examEntry: StudentExamEntryDto) => {
      const source = await loadStudentPaperAnswerSource(examId);
      const paper = mapStudentPaperV2ToExamPaperView(
        source.paper,
        source.questionTypes,
        examEntry,
      );
      if (source.paper.paperAvailability === "UNAVAILABLE") {
        return { availability: "UNAVAILABLE" as const, paper };
      }
      const entryDraftKey = createStudentExamAnswerDraftKey(
        examId,
        examEntry.taskPublishId,
      );
      const storedDraft = window.localStorage.getItem(entryDraftKey);
      if (!storedDraft) return { availability: "READY" as const, paper };
      const draft = parseStudentExamAnswerDraftStorageValue(storedDraft);
      if (!draft) {
        window.localStorage.removeItem(entryDraftKey);
        return { availability: "READY" as const, paper };
      }
      try {
        return {
          availability: "READY" as const,
          paper: mergeStudentExamAnswerDraftIntoExamPaperView(paper, draft),
        };
      } catch {
        // 无法映射到当前冻结试卷的草稿必须删除，服务器试卷保持权威。
        window.localStorage.removeItem(entryDraftKey);
        return { availability: "READY" as const, paper };
      }
    },
    [],
  );

  const loadResult = useCallback(
    async (examId: number, examEntry: StudentExamEntryDto) => {
      const source = await loadStudentExamResultSource(examId);
      const loadedPaper = mapStudentPaperV2ToExamPaperView(
        source.result.examPaperDetailResponse,
        source.questionTypes,
        examEntry,
      );
      setPaper({
        ...loadedPaper,
        totalScore: String(source.result.examScore || loadedPaper.totalScore),
      });
      setResult(source.result);
      setPhase("result");
    },
    [],
  );

  useEffect(() => {
    if (context instanceof Error) return;
    const token = requestToken.current + 1;
    requestToken.current = token;
    setPhase("loading");
    setErrorMessage("");
    setPaper(void 0);
    setResult(void 0);
    setEntry(void 0);
    void (async () => {
      try {
        const loadedEntry = await getStudentExamEntry(
          context.examId,
          context.taskPublishId,
        );
        if (loadedEntry.examId !== context.examId) {
          throw new Error("考试链接与入口资源不一致，请从考试列表重新进入");
        }
        setEntry(loadedEntry);
        // 这是本地请求序号比较，不涉及密码或其他敏感值。
        // eslint-disable-next-line security/detect-possible-timing-attacks
        if (requestToken.current !== token) return;
        if (loadedEntry.status === "SUBMITTED") {
          if (history?.push) {
            history.push(`/student/exams/${context.examId}/result`);
          } else {
            await loadResult(context.examId, loadedEntry);
          }
          return;
        }
        const loadedPaper = await loadPaper(context.examId, loadedEntry);
        setPaper(loadedPaper.paper);
        setPhase(
          resolveLoadedPaperPhase(loadedPaper.availability, loadedEntry.status),
        );
      } catch (error) {
        // 这是本地请求序号比较，不涉及密码或其他敏感值。
        // eslint-disable-next-line security/detect-possible-timing-attacks
        if (requestToken.current !== token) return;
        setErrorMessage(mapExplicitExamLoadError(error).message);
        setPhase("error");
      }
    })();
    return () => {
      requestToken.current += 1;
    };
  }, [context, history, loadPaper, loadResult]);

  const start = useCallback(async () => {
    if (context instanceof Error || !entry || !paper || phase === "unavailable")
      return;
    setPhase("starting");
    try {
      if (entry.status !== "IN_PROGRESS") {
        await startStudentExam(context.examId, entry.taskPublishId);
      }
      setPhase("answering");
    } catch (error) {
      setErrorMessage(mapExplicitExamLoadError(error).message);
      setPhase("ready");
    }
  }, [context, entry, paper, phase]);

  const submit = useCallback(
    async (autoSubmit = false) => {
      if (context instanceof Error || !entry || !paper || phase !== "answering")
        return;
      setPhase("submitting");
      try {
        await submitStudentExam(
          context.examId,
          mapPaperToSubmissionAnswers(paper),
          autoSubmit,
        );
        if (draftKey) window.localStorage.removeItem(draftKey);
        message.success(trans("explicitExam.submitted", "提交成功"));
        history?.push(`/student/exams/${context.examId}/result`);
      } catch (error) {
        const latestEntry = await getStudentExamEntry(
          context.examId,
          entry.taskPublishId,
        ).catch(() => {});
        if (latestEntry?.status === "SUBMITTED") {
          history?.push(`/student/exams/${context.examId}/result`);
          return;
        }
        setErrorMessage(mapExplicitExamLoadError(error).message);
        setPhase("answering");
        message.error(trans("explicitExam.submitFailed", "提交失败，请重试"));
      }
    },
    [context, draftKey, entry, history, paper, phase],
  );

  const handleResponseChange = useCallback(
    (placementId: string, response: QuestionPlayerResponse) => {
      if (phase === "unavailable") return;
      if (draftKey) {
        setPaper((current) => {
          if (!current) return current;
          const next = updateExamPaperPlacementResponse(
            current,
            placementId,
            response,
          );
          window.localStorage.setItem(
            draftKey,
            JSON.stringify(mapExamPaperViewToStudentExamAnswerDraft(next)),
          );
          return next;
        });
        return;
      }
      setPaper((current) =>
        current
          ? updateExamPaperPlacementResponse(current, placementId, response)
          : current,
      );
    },
    [draftKey, phase],
  );

  return (
    <StudentExamSessionView
      answerMode={answerMode}
      contextError={context instanceof Error ? context : undefined}
      errorMessage={errorMessage}
      onBack={closeCurrentPage}
      onDeadlineExpire={() => void submit(true)}
      onModeChange={setAnswerMode}
      onResponseChange={handleResponseChange}
      onSingleQuestionIndexChange={setSingleQuestionIndex}
      onStart={() => void start()}
      onStartCountdown={() => setPhase("starting-countdown")}
      onSubmit={() => void submit(false)}
      paper={paper}
      phase={phase}
      result={result ? mapStudentExamResultToView(result) : undefined}
      resultShowAnswer={result?.openAnswer !== false}
      singleQuestionIndex={singleQuestionIndex}
    />
  );
};

export default StudentExamSessionPage;

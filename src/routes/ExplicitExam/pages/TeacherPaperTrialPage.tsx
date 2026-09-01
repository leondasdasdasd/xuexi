import { useCallback, useEffect, useMemo, useState } from "react";
import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";
import { message } from "antd";

import { loadExamPaperV2AnswerSource } from "../../../services/examPaperV2";
import { submitExamPreview } from "../../../services/explicitExam";
import type { ExamPreviewResultDto } from "../../../services/explicitExam.types";
import TeacherPaperTrialView from "../components/TeacherPaperTrialView";
import { updateExamPaperPlacementResponse } from "../examPaperView";
import {
  applyExamPreviewResultToPaper,
  mapExamPaperV2ToTeacherTrialView,
  mapPaperToSubmissionAnswers,
  mapStudentExamResultToView,
} from "../mappers";
import { mapExplicitExamLoadError } from "../migrationStatus";
import { closeCurrentPage } from "../navigation";
import { parseTeacherPaperTrialContext } from "../routeContext";
import type { AnswerMode, ExamPaperView } from "../types";

type Properties = {
  match: { params: { paperId?: string } };
};

type Phase =
  | "answering"
  | "error"
  | "loading"
  | "ready"
  | "result"
  | "starting-countdown"
  | "submitting";

const TeacherPaperTrialPage = ({ match }: Properties) => {
  const { paperId: routePaperId } = match.params;
  const context = useMemo(() => {
    try {
      return parseTeacherPaperTrialContext({ paperId: routePaperId });
    } catch (error) {
      return error as Error;
    }
  }, [routePaperId]);
  const [answerMode, setAnswerMode] = useState<AnswerMode>("continuous");
  const [errorMessage, setErrorMessage] = useState("");
  const [paper, setPaper] = useState<ExamPaperView>();
  const [phase, setPhase] = useState<Phase>("loading");
  const [result, setResult] = useState<ExamPreviewResultDto>();
  const [singleQuestionIndex, setSingleQuestionIndex] = useState(0);

  useEffect(() => {
    if (context instanceof Error) return;
    // paperId 变化代表一次全新的试作会话，模式、题号和本地答案必须同步重置。
    setPaper(void 0);
    setPhase("loading");
    setErrorMessage("");
    setAnswerMode("continuous");
    setSingleQuestionIndex(0);
    setResult(void 0);
    let active = true;
    void (async () => {
      try {
        // 教师身份由试卷接口校验，试作不创建学生 attempt。
        const source = await loadExamPaperV2AnswerSource(context.paperId);
        if (!active) return;
        // V2 DTO 只在 mapper 边界转换，页面与学生作答统一消费 ExamPaperView。
        setPaper(
          mapExamPaperV2ToTeacherTrialView(
            source.detail,
            source.questionTypes,
            Date.now(),
          ),
        );
        setPhase("ready");
      } catch (error) {
        if (!active) return;
        setErrorMessage(mapExplicitExamLoadError(error).message);
        setPhase("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [context]);

  const handleResponseChange = useCallback(
    (placementId: string, response: QuestionPlayerResponse) => {
      // 教师答案仅更新当前页面内存，不进入学生草稿保存、attempt 或成绩链路。
      setPaper((current) =>
        current
          ? updateExamPaperPlacementResponse(current, placementId, response)
          : current,
      );
    },
    [],
  );

  const submit = useCallback(async () => {
    if (context instanceof Error || !paper || phase !== "answering") return;
    setPhase("submitting");
    try {
      const previewResult = await submitExamPreview(
        context.paperId,
        mapPaperToSubmissionAnswers(paper),
      );
      setPaper((current) =>
        current
          ? applyExamPreviewResultToPaper(
              current,
              previewResult.examPaperDetailResponse,
            )
          : current,
      );
      setResult(previewResult);
      setPhase("result");
    } catch (error) {
      const submissionError = mapExplicitExamLoadError(error).message;
      setErrorMessage(submissionError);
      setPhase("answering");
      message.error(submissionError);
    }
  }, [context, paper, phase]);

  return (
    <TeacherPaperTrialView
      answerMode={answerMode}
      contextError={context instanceof Error ? context : undefined}
      errorMessage={errorMessage}
      onBack={closeCurrentPage}
      onModeChange={setAnswerMode}
      onResponseChange={handleResponseChange}
      onSingleQuestionIndexChange={setSingleQuestionIndex}
      onStart={() => setPhase("answering")}
      onStartCountdown={() => setPhase("starting-countdown")}
      onSubmit={() => void submit()}
      paper={paper}
      phase={phase}
      result={result ? mapStudentExamResultToView(result) : undefined}
      singleQuestionIndex={singleQuestionIndex}
    />
  );
};

export default TeacherPaperTrialPage;

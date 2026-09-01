import { trans } from "../../../utils/i18n";
import type {
  AnswerMode,
  ExamPaperView,
  ExamResultView as ExamResultData,
} from "../types";
import ExamResultView from "./ExamResultView";
import ExamStatePanel from "./ExamStatePanel";
import StudentExamExperience from "./StudentExamExperience";
import StudentExamLaunch from "./StudentExamLaunch";

export type ExamSessionPhase =
  | "answering"
  | "error"
  | "loading"
  | "ready"
  | "result"
  | "starting"
  | "starting-countdown"
  | "submitting"
  | "unavailable";

type LaunchPhase = "ready" | "starting" | "starting-countdown";

type Properties = {
  answerMode: AnswerMode;
  contextError?: Error;
  deadline: number | null;
  errorMessage: string;
  launchPhases: ReadonlySet<ExamSessionPhase>;
  onBack: () => void;
  onDeadlineExpire: () => void;
  onModeChange: (mode: AnswerMode) => void;
  onResponseChange: Parameters<
    typeof StudentExamExperience
  >[0]["onResponseChange"];
  onSingleQuestionIndexChange: (index: number) => void;
  onStart: () => void;
  onStartCountdown: () => void;
  onSubmit: () => void;
  paper?: ExamPaperView;
  phase: ExamSessionPhase;
  result?: ExamResultData;
  resultShowAnswer: boolean;
  singleQuestionIndex: number;
  submittingFallback: string;
};

const renderUnavailableState = (
  contextError: Error | undefined,
  errorMessage: string,
  phase: ExamSessionPhase,
  submittingFallback: string,
) => {
  if (contextError)
    return (
      <ExamStatePanel
        detail={contextError.message}
        kind="error"
        title={trans("explicitExam.invalidRoute", "链接参数无效")}
      />
    );
  if (phase === "error")
    return (
      <ExamStatePanel
        detail={errorMessage}
        kind="error"
        title={trans("explicitExam.loadFailed", "试卷加载失败")}
      />
    );
  if (phase === "submitting")
    return (
      <ExamStatePanel
        kind="loading"
        title={trans("explicitExam.submitting", submittingFallback)}
      />
    );
  if (phase === "loading")
    return (
      <ExamStatePanel
        kind="loading"
        title={trans("explicitExam.loadingPaper", "正在加载试卷")}
      />
    );
};

const ExamSessionView = ({
  answerMode,
  contextError,
  deadline,
  errorMessage,
  launchPhases,
  onBack,
  onDeadlineExpire,
  onModeChange,
  onResponseChange,
  onSingleQuestionIndexChange,
  onStart,
  onStartCountdown,
  onSubmit,
  paper,
  phase,
  result,
  resultShowAnswer,
  singleQuestionIndex,
  submittingFallback,
}: Properties) => {
  const unavailableState = renderUnavailableState(
    contextError,
    errorMessage,
    phase,
    submittingFallback,
  );
  if (unavailableState) return unavailableState;
  if (phase === "result" && result && paper)
    return (
      <ExamResultView
        onBack={onBack}
        paper={paper}
        result={result}
        showAnswer={resultShowAnswer}
      />
    );
  if (!paper) return null;
  if (launchPhases.has(phase))
    return (
      <StudentExamLaunch
        errorMessage={errorMessage}
        mode={answerMode}
        onBack={onBack}
        onCountdownComplete={onStart}
        onModeChange={onModeChange}
        onStartCountdown={onStartCountdown}
        paper={paper}
        phase={phase as LaunchPhase}
      />
    );
  const visiblePhase = phase === "unavailable" ? "unavailable" : "answering";
  return (
    <StudentExamExperience
      answerMode={answerMode}
      deadline={deadline}
      onBack={onBack}
      onDeadlineExpire={onDeadlineExpire}
      onModeChange={onModeChange}
      onResponseChange={onResponseChange}
      onSingleQuestionIndexChange={onSingleQuestionIndexChange}
      onSubmit={onSubmit}
      paper={paper}
      phase={visiblePhase}
      singleQuestionIndex={singleQuestionIndex}
    />
  );
};

export default ExamSessionView;

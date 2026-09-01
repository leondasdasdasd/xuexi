import type { AnswerMode, ExamPaperView, ExamResultView } from "../types";
import ExamSessionView, { type ExamSessionPhase } from "./ExamSessionView";
import StudentExamExperience from "./StudentExamExperience";

const LAUNCH_PHASES = new Set<ExamSessionPhase>([
  "ready",
  "starting",
  "starting-countdown",
]);

type Properties = {
  answerMode: AnswerMode;
  contextError?: Error;
  errorMessage: string;
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
  result?: ExamResultView;
  resultShowAnswer: boolean;
  singleQuestionIndex: number;
};

const StudentExamSessionView = (properties: Properties) => (
  <ExamSessionView
    {...properties}
    deadline={properties.paper?.deadlineTimestamp ?? null}
    launchPhases={LAUNCH_PHASES}
    submittingFallback="正在交卷"
  />
);

export default StudentExamSessionView;

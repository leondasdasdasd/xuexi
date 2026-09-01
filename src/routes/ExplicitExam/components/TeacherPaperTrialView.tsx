import type { AnswerMode, ExamPaperView, ExamResultView } from "../types";
import ExamSessionView, { type ExamSessionPhase } from "./ExamSessionView";
import StudentExamExperience from "./StudentExamExperience";

const LAUNCH_PHASES = new Set<ExamSessionPhase>([
  "ready",
  "starting-countdown",
]);
const ignoreDeadline = () => false;

type Properties = {
  answerMode: AnswerMode;
  contextError?: Error;
  errorMessage: string;
  onBack: () => void;
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
  singleQuestionIndex: number;
};

const TeacherPaperTrialView = (properties: Properties) => (
  <ExamSessionView
    {...properties}
    deadline={null}
    launchPhases={LAUNCH_PHASES}
    onDeadlineExpire={ignoreDeadline}
    resultShowAnswer
    submittingFallback="正在提交"
  />
);

export default TeacherPaperTrialView;

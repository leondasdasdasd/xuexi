import { trans } from "../../../utils/i18n";
import type { AnswerMode, ExamPaperView } from "../types";
import ExamStatePanel from "./ExamStatePanel";
import StartingCountdownPanel from "./StartingCountdownPanel";
import StudentExamReadyPanel from "./StudentExamReadyPanel";

type Properties = {
  errorMessage: string;
  mode: AnswerMode;
  onBack: () => void;
  onCountdownComplete: () => void;
  onModeChange: (mode: AnswerMode) => void;
  onStartCountdown: () => void;
  paper: ExamPaperView;
  phase: "ready" | "starting-countdown" | "starting";
};

const StudentExamLaunch = ({
  errorMessage,
  mode,
  onBack,
  onCountdownComplete,
  onModeChange,
  onStartCountdown,
  paper,
  phase,
}: Properties) => {
  if (phase === "starting")
    return (
      <ExamStatePanel
        kind="loading"
        title={trans("explicitExam.starting", "正在进入答题")}
      />
    );
  if (phase === "starting-countdown")
    return <StartingCountdownPanel onComplete={onCountdownComplete} />;
  return (
    <StudentExamReadyPanel
      errorMessage={errorMessage}
      mode={mode}
      onBack={onBack}
      onModeChange={onModeChange}
      onStart={onStartCountdown}
      paper={paper}
    />
  );
};

export default StudentExamLaunch;

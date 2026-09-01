import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";

import type { AnswerMode, ExamPaperView } from "../types";
import ExamPaperPanel from "./ExamPaperPanel";
import StudentAnswerPaper from "./StudentAnswerPaper";
import StudentAnswerToolbar from "./StudentAnswerToolbar";
import StudentQuestionNavigator from "./StudentQuestionNavigator";
import StudentUnavailablePaper from "./StudentUnavailablePaper";

import styles from "../explicitExam.module.less";

export type StudentExamVisiblePhase = "answering" | "result" | "unavailable";

type Properties = {
  answerMode: AnswerMode;
  deadline: number | null;
  onResponseChange: (
    placementId: string,
    response: QuestionPlayerResponse,
  ) => void;
  onDeadlineExpire: () => void;
  onModeChange: (mode: AnswerMode) => void;
  onBack: () => void;
  onSingleQuestionIndexChange: (index: number) => void;
  onSubmit: () => void;
  paper: ExamPaperView;
  phase: StudentExamVisiblePhase;
  singleQuestionIndex: number;
};

const StudentExamExperience = ({
  answerMode,
  deadline,
  onResponseChange,
  onDeadlineExpire,
  onModeChange,
  onBack,
  onSingleQuestionIndexChange,
  onSubmit,
  paper,
  phase,
  singleQuestionIndex,
}: Properties) => {
  const answerWorkspace = phase === "answering" || phase === "unavailable";
  const unavailable = phase === "unavailable";
  return (
    <main className={styles[answerWorkspace ? "answer-page" : "page"]}>
      <div className={styles[answerWorkspace ? "answer-content" : "content"]}>
        {answerWorkspace ? (
          <>
            <StudentAnswerToolbar
              answerMode={answerMode}
              deadline={deadline}
              onDeadlineExpire={onDeadlineExpire}
              onModeChange={onModeChange}
              onBack={onBack}
              onSubmit={onSubmit}
              paper={paper}
              unavailable={unavailable}
            />
            <div
              className={
                styles[
                  unavailable
                    ? "answer-workspace-unavailable"
                    : "answer-workspace"
                ]
              }
            >
              <section className={styles["answer-main"]}>
                {unavailable ? (
                  <StudentUnavailablePaper />
                ) : (
                  <StudentAnswerPaper
                    answerMode={answerMode}
                    onResponseChange={onResponseChange}
                    onSingleQuestionIndexChange={onSingleQuestionIndexChange}
                    onSubmit={onSubmit}
                    paper={paper}
                    singleQuestionIndex={singleQuestionIndex}
                  />
                )}
              </section>
              {unavailable ? null : (
                <StudentQuestionNavigator
                  answerMode={answerMode}
                  currentIndex={singleQuestionIndex}
                  onIndexChange={onSingleQuestionIndexChange}
                  paper={paper}
                />
              )}
            </div>
          </>
        ) : (
          <ExamPaperPanel disabled paper={paper} />
        )}
      </div>
    </main>
  );
};

export default StudentExamExperience;

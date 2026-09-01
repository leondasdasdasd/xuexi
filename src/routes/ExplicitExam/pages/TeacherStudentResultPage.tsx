import { useEffect, useMemo, useState } from "react";

import { buildTeacherStudentResultPath } from "../../../common/explicitExamRoutes";
import {
  getCurrentUser,
  loadTeacherStudentExamResultSource,
} from "../../../services/explicitExam";
import type { StudentExamResultDto } from "../../../services/explicitExam.types";
import { locale, trans } from "../../../utils/i18n";
import ExamResultView from "../components/ExamResultView";
import ExamStatePanel from "../components/ExamStatePanel";
import StudentResultSwitcher from "../components/StudentResultSwitcher";
import {
  mapStudentExamResultToStudentFilterView,
  mapStudentExamResultToView,
  mapTeacherStudentExamResultToPaperView,
} from "../mappers";
import { mapExplicitExamLoadError } from "../migrationStatus";
import { closeCurrentPage, type ExplicitExamHistory } from "../navigation";
import { parseTeacherStudentResultContext } from "../routeContext";
import type { ExamPaperView } from "../types";

type Properties = {
  history?: ExplicitExamHistory;
  match: { params: { examId?: string; studentId?: string } };
};

const TeacherStudentResultPage = ({ history, match }: Properties) => {
  const context = useMemo(() => {
    try {
      return parseTeacherStudentResultContext(match.params);
    } catch (error) {
      return error as Error;
    }
  }, [match.params]);
  const [errorMessage, setErrorMessage] = useState("");
  const [paper, setPaper] = useState<ExamPaperView>();
  const [result, setResult] = useState<StudentExamResultDto>();

  useEffect(() => {
    if (context instanceof Error) return;
    let active = true;
    setPaper(void 0);
    setResult(void 0);
    setErrorMessage("");
    void (async () => {
      const user = await getCurrentUser();
      if (user.currentIdentity === "student")
        throw new Error(
          trans("explicitExam.teacherOnly", "此页面仅供教师使用"),
        );
      return loadTeacherStudentExamResultSource(
        context.examId,
        context.studentId,
      );
    })()
      .then((source) => {
        if (!active) return;
        setPaper(
          mapTeacherStudentExamResultToPaperView(
            source.result,
            source.questionTypes,
          ),
        );
        setResult(source.result);
        return null;
      })
      .catch((error) => {
        if (active) setErrorMessage(mapExplicitExamLoadError(error).message);
      });
    return () => {
      active = false;
    };
  }, [context]);

  if (context instanceof Error)
    return (
      <ExamStatePanel
        detail={context.message}
        kind="error"
        title={trans("explicitExam.invalidRoute", "链接参数无效")}
      />
    );
  if (errorMessage)
    return (
      <ExamStatePanel
        detail={errorMessage}
        kind="error"
        title={trans("explicitExam.loadFailed", "答卷加载失败")}
      />
    );
  if (!paper || !result)
    return (
      <ExamStatePanel
        kind="loading"
        title={trans("explicitExam.loadingResult", "正在加载学生答卷")}
      />
    );

  const selectedStudent = mapStudentExamResultToStudentFilterView(
    result,
    locale(),
  );
  return (
    <ExamResultView
      headerActions={
        <StudentResultSwitcher
          examId={context.examId}
          selectedStudent={selectedStudent}
          onSelect={(studentId) =>
            history?.push(
              buildTeacherStudentResultPath(context.examId, studentId),
            )
          }
        />
      }
      onBack={closeCurrentPage}
      paper={paper}
      result={mapStudentExamResultToView(result)}
      showAnswer
    />
  );
};

export default TeacherStudentResultPage;

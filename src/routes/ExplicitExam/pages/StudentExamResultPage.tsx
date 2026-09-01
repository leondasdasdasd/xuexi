import { useEffect, useMemo, useState } from "react";

import {
  getStudentExamEntry,
  loadStudentExamResultSource,
} from "../../../services/explicitExam";
import { trans } from "../../../utils/i18n";
import ExamResultView from "../components/ExamResultView";
import ExamStatePanel from "../components/ExamStatePanel";
import {
  mapStudentExamResultToView,
  mapStudentPaperV2ToExamPaperView,
} from "../mappers";
import { mapExplicitExamLoadError } from "../migrationStatus";
import { closeCurrentPage } from "../navigation";
import { parseStudentResultContext } from "../routeContext";
import type { ExamPaperView } from "../types";

type Properties = {
  match: { params: { examId?: string } };
};

const StudentExamResultPage = ({ match }: Properties) => {
  const context = useMemo(() => {
    try {
      return parseStudentResultContext(match.params);
    } catch (error) {
      return error as Error;
    }
  }, [match.params]);
  const [paper, setPaper] = useState<ExamPaperView>();
  const [result, setResult] =
    useState<
      Awaited<ReturnType<typeof loadStudentExamResultSource>>["result"]
    >();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (context instanceof Error) return;
    let active = true;
    void (async () => {
      const source = await loadStudentExamResultSource(context.examId);
      const entry = await getStudentExamEntry(context.examId);
      return { entry, source };
    })()
      .then(({ entry, source }) => {
        if (!active) return null;
        setPaper(
          mapStudentPaperV2ToExamPaperView(
            source.result.examPaperDetailResponse,
            source.questionTypes,
            entry,
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
        kind="error"
        title={trans("explicitExam.invalidRoute", "链接参数无效")}
        detail={context.message}
      />
    );
  if (errorMessage)
    return (
      <ExamStatePanel
        kind="error"
        title={trans("explicitExam.loadFailed", "答卷加载失败")}
        detail={errorMessage}
      />
    );
  if (!paper || !result)
    return (
      <ExamStatePanel
        kind="loading"
        title={trans("explicitExam.loadingResult", "正在加载作答结果")}
      />
    );
  return (
    <ExamResultView
      onBack={closeCurrentPage}
      paper={paper}
      result={mapStudentExamResultToView(result)}
      showAnswer={result.openAnswer !== false}
    />
  );
};

export default StudentExamResultPage;

import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import {
  buildStudentExamAnswerPath,
  buildTeacherPaperTrialPath,
  buildTeacherStudentResultPath,
} from "../../common/explicitExamRoutes";
import { getCurrentUser } from "../../services/explicitExam";
import { trans } from "../../utils/i18n";
import ExamStatePanel from "../ExplicitExam/components/ExamStatePanel";
import {
  parseStudentAnswerContext,
  parseTeacherPaperTrialContext,
  parseTeacherStudentResultContext,
} from "../ExplicitExam/routeContext";

/**
 * 旧入口的第二段会随当前身份表示 taskPublishId、paperId 或 studentId。
 * 这里只恢复旧入口的身份判定语义，具体页面统一进入 ExplicitExam 的权威路由。
 * @param {object} parameters 旧路由参数
 * @param {string} currentIdentity 当前登录身份
 * @returns {{ kind: string, path?: string, detail?: string }} 入口处理结果
 */
export const resolveLegacyStuTestEntry = (parameters = {}, currentIdentity) => {
  try {
    if (parameters.id === "true") {
      const context = parseStudentAnswerContext({
        examId: parameters.examId,
        taskPublishId: parameters.isSeePaper,
      });
      return {
        kind: "redirect",
        path: buildStudentExamAnswerPath(context.examId, context.taskPublishId),
      };
    }

    if (parameters.isSeePaper === "true") {
      const context = parseTeacherStudentResultContext({
        examId: parameters.examId,
        studentId: parameters.id,
      });
      return {
        kind: "redirect",
        path: buildTeacherStudentResultPath(context.examId, context.studentId),
      };
    }

    if (!currentIdentity) return { kind: "identity-required" };

    if (currentIdentity === "student") {
      const context = parseStudentAnswerContext({
        examId: parameters.examId,
        taskPublishId: parameters.id,
      });
      return {
        kind: "redirect",
        path: buildStudentExamAnswerPath(context.examId, context.taskPublishId),
      };
    }

    const context = parseTeacherPaperTrialContext({ paperId: parameters.id });
    return {
      kind: "redirect",
      path: buildTeacherPaperTrialPath(context.paperId),
    };
  } catch (error) {
    return {
      detail: error instanceof Error ? error.message : String(error),
      kind: "error",
    };
  }
};

const StuTest = ({ history, match }) => {
  const [currentIdentity, setCurrentIdentity] = useState();
  const [identityError, setIdentityError] = useState();
  const entry = useMemo(
    () => resolveLegacyStuTestEntry(match?.params, currentIdentity),
    [currentIdentity, match?.params],
  );

  useEffect(() => {
    if (entry.kind !== "identity-required") return;
    let active = true;
    void getCurrentUser()
      .then((user) => {
        if (!user.currentIdentity) {
          throw new Error(
            trans(
              "explicitExam.loadFailed",
              "无法识别当前身份 / Unable to identify the current role",
            ),
          );
        }
        if (active) setCurrentIdentity(user.currentIdentity);
        return null;
      })
      .catch((error) => {
        if (!active) return;
        setIdentityError(
          error instanceof Error ? error.message : String(error),
        );
      });
    return () => {
      active = false;
    };
  }, [entry.kind]);

  useEffect(() => {
    if (entry.kind === "redirect") {
      history.replace(entry.path);
    }
  }, [entry, history]);

  if (entry.kind === "redirect") return null;

  if (identityError) {
    return (
      <ExamStatePanel
        detail={identityError}
        kind="error"
        title={trans("explicitExam.loadFailed", "加载失败")}
      />
    );
  }

  if (entry.kind === "error") {
    return (
      <ExamStatePanel
        detail={entry.detail}
        kind="error"
        title={trans("explicitExam.invalidRoute", "链接参数无效")}
      />
    );
  }

  return <ExamStatePanel kind="loading" />;
};

StuTest.propTypes = {
  history: PropTypes.shape({
    replace: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      examId: PropTypes.string,
      id: PropTypes.string,
      isSeePaper: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default StuTest;

export const studentExamAnswerRoutePath =
  "/student/exams/:examId/tasks/:taskPublishId/answer";
export const teacherPaperTrialRoutePath = "/teacher/papers/:paperId/trial";
export const teacherStudentResultRoutePath =
  "/teacher/exams/:examId/students/:studentId/result";

export const buildStudentExamAnswerPath = (examId, taskPublishId) =>
  studentExamAnswerRoutePath
    .replace(":examId", encodeURIComponent(examId))
    .replace(":taskPublishId", encodeURIComponent(taskPublishId));

export const buildTeacherStudentResultPath = (examId, studentId) =>
  teacherStudentResultRoutePath
    .replace(":examId", encodeURIComponent(examId))
    .replace(":studentId", encodeURIComponent(studentId));

export const buildAnalysisMarkingPath = (
  _contractVersion,
  examId,
  _paperId,
  studentId,
) => {
  const studentPath =
    studentId === undefined || studentId === null
      ? ""
      : `/${encodeURIComponent(studentId)}`;
  return `/correctionRemark/${encodeURIComponent(examId)}${studentPath}`;
};

// 试作路径由路由边界统一生成，确保页面跳转与路由注册使用同一契约。
export const buildTeacherPaperTrialPath = (paperId) =>
  teacherPaperTrialRoutePath.replace(":paperId", encodeURIComponent(paperId));

// 完整试作 URL 由路由边界统一生成，调用页无需感知 hash 路由的拼接方式。
export const buildTeacherPaperTrialUrl = (paperId) =>
  `${globalThis.location.origin}${globalThis.location.pathname}#${buildTeacherPaperTrialPath(paperId)}`;

// 显式考试路由共用同一个动态加载边界，页面内部再根据身份和业务上下文加载数据。
export const createExplicitExamRoutes = (app, dynamicWrapper) => [
  {
    path: studentExamAnswerRoutePath,
    name: "explicitStudentExamAnswer",
    component: dynamicWrapper(
      app,
      [],
      () => import("../routes/ExplicitExam/pages/StudentExamSessionPage"),
    ),
  },
  {
    path: "/student/exams/:examId/result",
    name: "explicitStudentExamResult",
    component: dynamicWrapper(
      app,
      [],
      () => import("../routes/ExplicitExam/pages/StudentExamResultPage"),
    ),
  },
  {
    path: teacherStudentResultRoutePath,
    name: "explicitTeacherStudentResult",
    component: dynamicWrapper(
      app,
      [],
      () => import("../routes/ExplicitExam/pages/TeacherStudentResultPage"),
    ),
  },
  {
    path: teacherPaperTrialRoutePath,
    name: "explicitTeacherPaperTrial",
    component: dynamicWrapper(
      app,
      [],
      () => import("../routes/ExplicitExam/pages/TeacherPaperTrialPage"),
    ),
  },
];

/** @jest-environment node */

import {
  buildAnalysisMarkingPath,
  buildStudentExamAnswerPath,
  buildTeacherPaperTrialPath,
  buildTeacherPaperTrialUrl,
  buildTeacherStudentResultPath,
  createExplicitExamRoutes,
} from "./explicitExamRoutes";

it("routes all analysis marking through CorrectionRemark", () => {
  expect(buildAnalysisMarkingPath("V2", 2079, 11691, 52315)).toBe(
    "/correctionRemark/2079/52315",
  );
  expect(buildAnalysisMarkingPath("V2", 2079, 11691)).toBe(
    "/correctionRemark/2079",
  );
  expect(buildAnalysisMarkingPath("LEGACY", 2079, 11691, 52315)).toBe(
    "/correctionRemark/2079/52315",
  );
});

it("registers the scoped ExplicitExam routes", () => {
  const routes = createExplicitExamRoutes({}, (_app, _models, load) => load);

  expect(routes.map((route) => route.path)).toEqual([
    "/student/exams/:examId/tasks/:taskPublishId/answer",
    "/student/exams/:examId/result",
    "/teacher/exams/:examId/students/:studentId/result",
    "/teacher/papers/:paperId/trial",
  ]);
});

it("builds the authoritative teacher paper trial path", () => {
  expect(buildTeacherPaperTrialPath(42)).toBe("/teacher/papers/42/trial");
});

it("builds the authoritative teacher paper trial URL", () => {
  const originalLocation = globalThis.location;
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: {
      origin: "https://task.local.yungu-inc.org:8001",
      pathname: "/exam",
    },
  });

  try {
    expect(buildTeacherPaperTrialUrl(42)).toBe(
      "https://task.local.yungu-inc.org:8001/exam#/teacher/papers/42/trial",
    );
  } finally {
    if (originalLocation) {
      Object.defineProperty(globalThis, "location", {
        configurable: true,
        value: originalLocation,
      });
    } else {
      Reflect.deleteProperty(globalThis, "location");
    }
  }
});

it("builds the authoritative student exam answer path", () => {
  expect(buildStudentExamAnswerPath("exam/42", "task 7")).toBe(
    "/student/exams/exam%2F42/tasks/task%207/answer",
  );
});

it("builds the authoritative teacher student result path", () => {
  expect(buildTeacherStudentResultPath("exam/42", "student 7")).toBe(
    "/teacher/exams/exam%2F42/students/student%207/result",
  );
});

/** @jest-environment node */

import request from "../utils/request";
import { loadV2MarkingSheets, saveV2MarkingResults } from "./v2OnlineMarking";

jest.mock("../utils/request", () => jest.fn());
jest.mock("../utils/utils", () => ({ loginRedirect: jest.fn() }));

beforeEach(() => request.mockReset());

it("loads the typed V2 marking sheets", async () => {
  request.mockResolvedValue({
    content: [
      {
        examId: 12,
        pending: true,
        questionResults: [],
        studentId: 8,
        studentName: "Ada",
      },
    ],
    ifLogin: true,
    status: true,
  });

  await expect(loadV2MarkingSheets(12)).resolves.toMatchObject([
    { pending: true, studentId: 8, studentName: "Ada" },
  ]);
  expect(request).toHaveBeenCalledWith(
    "/api/v2/exams/12/marking-sheets",
    undefined,
    undefined,
    undefined,
  );
});

it("saves score, annotation and tags through the V2 marking resource", async () => {
  request.mockResolvedValue({ content: null, ifLogin: true, status: true });
  const body = {
    questionResults: [
      {
        questionId: 31,
        resultId: 101,
        studentScore: 3,
        tags: [1, 3],
        teacherAnnotation: '{"objects":[]}',
      },
    ],
  };

  await saveV2MarkingResults(12, 8, body);

  expect(request).toHaveBeenCalledWith(
    "/api/v2/exams/12/students/8/marking-results",
    { body, method: "PUT" },
    undefined,
    undefined,
  );
});

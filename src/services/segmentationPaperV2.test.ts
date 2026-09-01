/** @jest-environment node */

import request from "../utils/request";
import {
  createSegmentationPaper,
  querySegmentationCandidateQuestions,
  querySegmentationQuestionsByIds,
  updateSegmentationPaper,
} from "./segmentationPaperV2";

jest.mock("../utils/request", () => jest.fn());

describe("segmentation paper v2 service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses the shared v2 question collection for candidates", async () => {
    await querySegmentationCandidateQuestions({
      excludeIds: [8, 9],
      gradeIds: [1],
      limit: 10,
      pageNo: 2,
      subjectIds: [2],
    });

    expect(request).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/questions?"),
    );
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining("excludeIds=8%2C9"),
    );
  });

  it("uses dedicated v2 endpoints for association and paper writes", async () => {
    await querySegmentationQuestionsByIds([1, 2]);
    await createSegmentationPaper({ title: "new" });
    await updateSegmentationPaper(9, { title: "updated" });

    expect(request).toHaveBeenNthCalledWith(
      1,
      "/api/v2/segmentation-papers/questions?ids=1%2C2",
    );
    expect(request).toHaveBeenNthCalledWith(2, "/api/v2/segmentation-papers", {
      body: { title: "new" },
      method: "POST",
    });
    expect(request).toHaveBeenNthCalledWith(
      3,
      "/api/v2/segmentation-papers/9",
      { body: { title: "updated" }, method: "PUT" },
    );
  });
});

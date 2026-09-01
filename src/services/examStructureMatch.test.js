import {
  applyExamStructureMatch,
  queryExamStructureMatchDetail,
  queryExamStructurePaperSummary,
  saveExamStructureMatchDraft,
  startExamStructureAiMatch,
} from "./examStructureMatch";
import request from "../utils/request";

jest.mock("../utils/request", () => jest.fn());

describe("examStructureMatch service", () => {
  beforeEach(() => {
    request.mockResolvedValue({ status: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("queries saved match detail", async () => {
    await queryExamStructureMatchDetail({ examPaperId: 1 });

    expect(request).toHaveBeenCalledWith(
      "/api/paper/exam-structure-match/detail",
      {
        body: { examPaperId: 1 },
        method: "POST",
      },
    );
  });

  it("starts server-side AI matching", async () => {
    await startExamStructureAiMatch({ examPaperId: 1, standardPaperId: 2 });

    expect(request).toHaveBeenCalledWith(
      "/api/paper/exam-structure-match/ai-match",
      {
        body: { examPaperId: 1, standardPaperId: 2 },
        method: "POST",
      },
    );
  });

  it("saves manual draft rows", async () => {
    await saveExamStructureMatchDraft({ matchRecordId: 3, matches: [] });

    expect(request).toHaveBeenCalledWith(
      "/api/paper/exam-structure-match/draft",
      {
        body: { matchRecordId: 3, matches: [] },
        method: "POST",
      },
    );
  });

  it("applies confirmed matches", async () => {
    await applyExamStructureMatch({ matchRecordId: 3, tabId: "tab-1" });

    expect(request).toHaveBeenCalledWith(
      "/api/paper/exam-structure-match/apply",
      {
        body: { matchRecordId: 3, tabId: "tab-1" },
        method: "POST",
      },
    );
  });

  it("queries paper summary", async () => {
    await queryExamStructurePaperSummary({ paperId: 1 });

    expect(request).toHaveBeenCalledWith(
      "/api/paper/exam-structure-match/paper-summary",
      {
        body: { paperId: 1 },
        method: "POST",
      },
    );
  });
});

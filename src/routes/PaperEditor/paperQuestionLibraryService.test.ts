import {
  batchQueryNewMyBusinessQuestionTypes,
  queryEnabledNewMyBusinessQuestionTypes,
  queryNewMyQuestionPage,
} from "../../services/newMyQuestion";
import {
  loadPaperQuestionLibraryPage,
  loadPaperQuestionLibraryTypes,
} from "./paperQuestionLibraryService";

jest.mock("../../services/newMyQuestion", () => ({
  batchQueryNewMyBusinessQuestionTypes: jest.fn(),
  queryEnabledNewMyBusinessQuestionTypes: jest.fn(),
  queryNewMyQuestionPage: jest.fn(),
}));

describe("paper question library service", () => {
  it("loads enabled question types for the teaching context", async () => {
    (queryEnabledNewMyBusinessQuestionTypes as jest.Mock).mockResolvedValue({
      content: [{ businessQuestionTypeId: 101, name: "单选题" }],
      ifLogin: true,
      status: true,
    });

    await expect(
      loadPaperQuestionLibraryTypes({ stageId: 2, subjectId: 13 }),
    ).resolves.toEqual([
      expect.objectContaining({ businessQuestionTypeId: 101 }),
    ]);
    expect(queryEnabledNewMyBusinessQuestionTypes).toHaveBeenCalledWith({
      stageId: 2,
      subjectId: 13,
    });
  });

  it("locks the V2 query to the paper context and returns preview types", async () => {
    (queryNewMyQuestionPage as jest.Mock).mockResolvedValue({
      content: {
        data: [
          {
            question: {
              id: 99,
              businessQuestionTypeId: 101,
              children: [
                { id: 100, businessQuestionTypeId: 102, children: [] },
              ],
            },
          },
        ],
        total: 1,
      },
      ifLogin: true,
      status: true,
    });
    (batchQueryNewMyBusinessQuestionTypes as jest.Mock).mockResolvedValue({
      content: [
        { businessQuestionTypeId: 101 },
        { businessQuestionTypeId: 102 },
      ],
      ifLogin: true,
      status: true,
    });

    const result = await loadPaperQuestionLibraryPage({
      gradeId: 7,
      keyword: "面积",
      limit: 10,
      pageNo: 2,
      questionTypeKey: 101,
      subjectId: 2,
    });

    expect(queryNewMyQuestionPage).toHaveBeenCalledWith({
      businessQuestionTypeIds: [101],
      gradeIds: [7],
      keyword: "面积",
      limit: 10,
      pageNo: 2,
      subjectIds: [2],
    });
    expect(batchQueryNewMyBusinessQuestionTypes).toHaveBeenCalledWith({
      businessQuestionTypeIds: [101, 102],
    });
    expect(result.items).toHaveLength(1);
    expect(result.questionTypesById[102]).toEqual(
      expect.objectContaining({ businessQuestionTypeId: 102 }),
    );
  });
});

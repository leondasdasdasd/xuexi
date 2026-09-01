import { createQuestionV2Resource } from "../../services/questionV2";
import { trans } from "../../utils/i18n";
import { saveQuestionAsset } from "./questionAssetEditorService";

jest.mock("../../services/questionV2", () => ({
  createQuestionV2Resource: jest.fn(),
  queryQuestionV2Resource: jest.fn(),
  updateQuestionV2Resource: jest.fn(),
}));
jest.mock("./questionAssetContentAdapter", () => ({
  createQuestionAssetV2CreateRequest: jest.fn(() => ({ create: true })),
  createQuestionAssetV2UpdateRequest: jest.fn(() => ({ update: true })),
}));

describe("questionAssetEditorService", () => {
  it("rejects a successful create response without a question id", async () => {
    createQuestionV2Resource.mockResolvedValue({
      ifLogin: true,
      status: true,
      content: {},
    });

    await expect(
      saveQuestionAsset({
        draft: {},
        questionTypes: [],
        resource: { gradeId: 7, subjectId: 2 },
      }),
    ).rejects.toThrow(
      trans("questionAssetInput.questionIdMissing", "题目 ID 缺失"),
    );
  });
});

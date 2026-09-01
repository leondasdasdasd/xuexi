import fs from "node:fs";
import path from "node:path";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { queryEnabledBusinessQuestionTypesV2 } from "../../../services/businessQuestionTypeV2";
import {
  createQuestionV2Resource,
  queryQuestionV2Resource,
  updateQuestionV2Resource,
} from "../../../services/questionV2";
import { PureQuestionAssetEditorModal } from "./QuestionAssetEditorModal";

import styles from "../index.module.less";

const editorBodySnapshots = [];
const styleSource = fs.readFileSync(
  path.join(__dirname, "../index.module.less"),
  "utf8",
);

jest.mock("../../../services/businessQuestionTypeV2", () => ({
  queryEnabledBusinessQuestionTypesV2: jest.fn(),
}));
jest.mock("../../../services/questionV2", () => ({
  createQuestionV2Resource: jest.fn(),
  queryQuestionV2Resource: jest.fn(),
  updateQuestionV2Resource: jest.fn(),
}));
jest.mock("../questionAssetContentAdapter", () => ({
  createQuestionAssetEditorDraft: jest.fn(() => ({
    elements: [],
    questionTypeKey: 101,
  })),
  createQuestionAssetEditorStateFromV2Aggregate: jest.fn(() => ({
    draft: { elements: [], questionTypeKey: 101 },
    questionTypes: [{ businessQuestionTypeId: 101 }],
    resource: { gradeId: 7, subjectId: 2 },
    selectedTypeId: 101,
  })),
  createQuestionAssetV2CreateRequest: jest.fn(({ resource }) => ({
    create: true,
    resource,
  })),
  createQuestionAssetV2UpdateRequest: jest.fn(({ resource }) => ({
    resource,
    update: true,
  })),
  getDefaultQuestionAssetTypeId: jest.fn(() => 101),
  getQuestionAssetTypeById: jest.fn(() => ({ businessQuestionTypeId: 101 })),
  isQuestionAssetEditorReady: jest.fn(
    ({ draft, questionTypes, selectedTypeId }) =>
      draft?.questionTypeKey === selectedTypeId &&
      questionTypes.filter(
        (item) => item.businessQuestionTypeId === draft.questionTypeKey,
      ).length === 1,
  ),
  validateQuestionAssetScope: jest.fn(() => ""),
}));
jest.mock("./QuestionAssetEditorModalBody", () => (properties) => {
  editorBodySnapshots.push({
    draftKey: properties.draft?.questionTypeKey,
    resource: properties.resource,
    scopeDisabled: properties.scopeDisabled,
    selectedTypeId: properties.selectedTypeId,
    templateKeys: properties.questionTypes.map(
      (item) => item.businessQuestionTypeId,
    ),
  });
  return (
    <div>
      Question editor
      <button type="button" onClick={() => properties.onGradeChange(8)}>
        Change grade
      </button>
      <button type="button" onClick={() => properties.onSubjectChange(3)}>
        Change subject
      </button>
    </div>
  );
});

const typeResponse = {
  status: true,
  content: [{ businessQuestionTypeId: 101 }],
};
const aggregate = {
  question: { id: 99, businessQuestionTypeId: 101 },
  resource: { gradeId: 7, subjectId: 2 },
};
const properties = {
  allGradeList: [
    { gradeId: 7, stageId: 3 },
    { gradeId: 8, stageId: 4 },
  ],
  chapterList: [],
  dispatch: jest.fn(),
  initialScope: { gradeId: 7, subjectId: 2 },
  labelList: [],
  onCancel: jest.fn(),
  onSaved: jest.fn(),
  subjectList: [],
  treeData: [],
  visible: true,
};

describe("QuestionAssetEditorModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    editorBodySnapshots.length = 0;
    queryEnabledBusinessQuestionTypesV2.mockResolvedValue(typeResponse);
    queryQuestionV2Resource.mockResolvedValue({
      status: true,
      content: aggregate,
    });
  });

  it("creates a question and returns its authoritative aggregate", async () => {
    createQuestionV2Resource.mockResolvedValue({
      status: true,
      content: { id: 99 },
    });
    render(<PureQuestionAssetEditorModal {...properties} />);

    await screen.findByText("Question editor");
    fireEvent.click(screen.getByRole("button", { name: /保存|Save/ }));

    await waitFor(() => expect(createQuestionV2Resource).toHaveBeenCalled());
    expect(properties.onSaved).toHaveBeenCalledWith({
      questionId: 99,
      questionTypes: typeResponse.content,
      resource: aggregate,
    });
  });

  it("uses the fixed-height editor modal layout", async () => {
    render(<PureQuestionAssetEditorModal {...properties} questionId={99} />);

    await screen.findByText("Question editor");

    expect(document.querySelector(".ant-modal")).toHaveClass(
      styles["editor-modal"],
    );
    const contentRule = styleSource.match(
      /\.editor-modal :global\(\.ant-modal-content\)\s*\{(?<rule>[\s\S]*?)\n\}/,
    )?.groups?.rule;
    const bodyRule = styleSource.match(
      /\.editor-modal :global\(\.ant-modal-body\)\s*\{(?<rule>[\s\S]*?)\n\}/,
    )?.groups?.rule;
    const spinRule = styleSource.match(
      /\.editor-modal :global\(\.ant-spin-nested-loading\),\s*\.editor-modal :global\(\.ant-spin-container\)\s*\{(?<rule>[\s\S]*?)\n\}/,
    )?.groups?.rule;
    const editorContentRule = styleSource.match(
      /\.content\s*\{(?<rule>[\s\S]*?)\n\}/,
    )?.groups?.rule;
    const editorPanelRule = styleSource.match(
      /\.editorPanel\s*\{(?<rule>[\s\S]*?)\n\}/,
    )?.groups?.rule;
    const sidePanelRule = styleSource.match(
      /\.sidePanel\s*\{\s*display: flex;(?<rule>[\s\S]*?)\n\}/,
    )?.groups?.rule;
    const responsiveRule = styleSource.match(
      /@media \(max-width: 64rem\) \{(?<rule>[\s\S]*?)\n\}\n\n@media \(max-width: 40rem\)/,
    )?.groups?.rule;
    expect(contentRule).toContain("height: 90vh;");
    expect(bodyRule).toContain("display: flex;");
    expect(bodyRule).toContain("min-height: 0;");
    expect(bodyRule).toContain("flex: 1;");
    expect(bodyRule).toContain("overflow: hidden;");
    expect(spinRule).toContain("display: flex;");
    expect(spinRule).toContain("min-height: 0;");
    expect(spinRule).toContain("flex: 1;");
    expect(editorContentRule).toContain("min-height: 0;");
    expect(editorContentRule).toContain("flex: 1;");
    expect(editorContentRule).toContain("grid-template-rows: minmax(0, 1fr);");
    expect(editorPanelRule).toContain("overflow: auto;");
    expect(sidePanelRule).toContain("overflow: auto;");
    expect(responsiveRule).toMatch(
      /\.editor-modal :global\(\.ant-modal-body\)\s*\{[\s\S]*?overflow: auto;[\s\S]*?\}/,
    );
    expect(responsiveRule).toMatch(
      /\.editor-modal :global\(\.ant-spin-nested-loading\),\s*\.editor-modal :global\(\.ant-spin-container\)\s*\{[\s\S]*?flex: none;[\s\S]*?\}/,
    );
    expect(responsiveRule).toMatch(
      /\.content\s*\{[\s\S]*?min-height: auto;[\s\S]*?flex: none;[\s\S]*?grid-template-columns: 1fr;[\s\S]*?\}/,
    );
    expect(responsiveRule).toMatch(
      /\.editorPanel\s*\{[\s\S]*?overflow: visible;[\s\S]*?\}/,
    );
  });

  it("updates an existing question through the same editor", async () => {
    updateQuestionV2Resource.mockResolvedValue({ status: true, content: {} });
    render(<PureQuestionAssetEditorModal {...properties} questionId={99} />);

    await screen.findByText("Question editor");
    fireEvent.click(screen.getByRole("button", { name: /保存|Save/ }));

    await waitFor(() =>
      expect(updateQuestionV2Resource).toHaveBeenCalledWith(99, {
        resource: expect.objectContaining({ gradeId: 7, subjectId: 2 }),
        update: true,
      }),
    );
    expect(createQuestionV2Resource).not.toHaveBeenCalled();
  });

  it("keeps the draft and question templates aligned during async initialization", async () => {
    createQuestionV2Resource.mockResolvedValue({
      status: true,
      content: { id: 99 },
    });
    render(<PureQuestionAssetEditorModal {...properties} />);

    await waitFor(() =>
      expect(editorBodySnapshots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            draftKey: undefined,
            selectedTypeId: undefined,
            templateKeys: [],
          }),
          expect.objectContaining({
            draftKey: 101,
            selectedTypeId: 101,
            templateKeys: [101],
          }),
        ]),
      ),
    );
    expect(
      editorBodySnapshots.every(
        ({ draftKey, selectedTypeId, templateKeys }) =>
          draftKey === undefined ||
          (draftKey === selectedTypeId && templateKeys.includes(draftKey)),
      ),
    ).toBe(true);
  });

  it("does not save when the draft does not match exactly one template", async () => {
    queryEnabledBusinessQuestionTypesV2.mockResolvedValue({
      status: true,
      content: [
        { businessQuestionTypeId: 101 },
        { businessQuestionTypeId: 101 },
      ],
    });
    render(<PureQuestionAssetEditorModal {...properties} />);

    const saveButton = screen.getByRole("button", { name: /保存|Save/ });
    await waitFor(() => expect(saveButton).toBeDisabled());
    fireEvent.click(saveButton);
    expect(createQuestionV2Resource).not.toHaveBeenCalled();
  });

  it("uses the external scope as an editable default and saves the selected scope", async () => {
    createQuestionV2Resource.mockResolvedValue({
      status: true,
      content: { id: 99 },
    });
    render(<PureQuestionAssetEditorModal {...properties} />);

    await waitFor(() =>
      expect(editorBodySnapshots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            resource: expect.objectContaining({ gradeId: 7, subjectId: 2 }),
            scopeDisabled: false,
          }),
        ]),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Change grade" }));
    await waitFor(() =>
      expect(properties.dispatch).toHaveBeenCalledWith({
        payload: { gradeId: 8 },
        type: "inputQuestion/getSubjectList",
      }),
    );
    expect(editorBodySnapshots.at(-1).resource.subjectId).toBeUndefined();

    fireEvent.click(screen.getByRole("button", { name: "Change subject" }));
    await waitFor(() =>
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenLastCalledWith({
        stageId: 4,
        subjectId: 3,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /保存|Save/ }));

    await waitFor(() =>
      expect(createQuestionV2Resource).toHaveBeenCalledWith({
        create: true,
        resource: expect.objectContaining({ gradeId: 8, subjectId: 3 }),
      }),
    );
  });

  it("locks the authoritative scope when editing an existing question", async () => {
    updateQuestionV2Resource.mockResolvedValue({ status: true, content: {} });
    render(<PureQuestionAssetEditorModal {...properties} questionId={99} />);

    await waitFor(() =>
      expect(editorBodySnapshots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ scopeDisabled: true }),
        ]),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Change grade" }));
    fireEvent.click(screen.getByRole("button", { name: "Change subject" }));
    fireEvent.click(screen.getByRole("button", { name: /保存|Save/ }));

    await waitFor(() =>
      expect(updateQuestionV2Resource).toHaveBeenCalledWith(99, {
        resource: expect.objectContaining({ gradeId: 7, subjectId: 2 }),
        update: true,
      }),
    );
    expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledTimes(1);
  });
});

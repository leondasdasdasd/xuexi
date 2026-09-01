/** @jest-environment node */

import { renderQuestionTypeContent } from "./questionTypeBar.jsx";

describe("QuestionTypeBar", () => {
  const baseProperties = {
    errorMessage: null,
    loading: false,
    onAddQuestionType: jest.fn(),
    onRetry: jest.fn(),
    questionTypes: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading without question type buttons", () => {
    const content = renderQuestionTypeContent({
      ...baseProperties,
      loading: true,
    });

    expect(content.props.size).toBe("small");
    expect(Array.isArray(content)).toBe(false);
  });

  it("shows an error and retries", () => {
    const content = renderQuestionTypeContent({
      ...baseProperties,
      errorMessage: "Failed to load question types",
    });
    const retryButton = content.props.children[1];

    expect(content.props.children[0]).toContain("Failed to load");
    retryButton.props.onClick();
    expect(baseProperties.onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state in the active language", () => {
    const content = renderQuestionTypeContent(baseProperties);

    expect(content.props.children).toContain("No question types available");
  });

  it("uses native buttons and returns the selected server option", () => {
    const questionType = {
      businessQuestionTypeId: 201,
      label: "阅读题",
    };
    const [button] = renderQuestionTypeContent({
      ...baseProperties,
      questionTypes: [questionType],
    });

    expect(button.type).toBe("button");
    expect(button.props.type).toBe("button");
    button.props.onClick();
    expect(baseProperties.onAddQuestionType).toHaveBeenCalledWith(questionType);
  });
});

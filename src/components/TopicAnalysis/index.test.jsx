import { act, render, screen } from "@testing-library/react";
import React from "react";

import { AnalysisByTop } from ".";
import {
  classQuestionAnalysis,
  singleQuestionAnalysis,
} from "../../services/example";

jest.mock("dva", () => ({
  connect: () => (Component) => Component,
}));

jest.mock("../../services/example", () => ({
  classQuestionAnalysis: jest.fn(),
  singleQuestionAnalysis: jest.fn(),
}));

jest.mock("../../services/global", () => ({
  answerQuestionRemark: jest.fn(),
  goodAnswerQuestion: jest.fn(),
  questionAnalysisPaperModuleAndRate: jest.fn(),
  questionView: jest.fn(),
  typicalAnswerQuestion: jest.fn(),
}));

const mockAnalysisQuestionPreview = jest.fn(() => null);
jest.mock(
  "../../routes/DataAnalysis/components/AnalysisQuestionPreview",
  () => (properties) => mockAnalysisQuestionPreview(properties),
);

const mockAnswerTable = jest.fn(() => null);
jest.mock("../AnswerTable", () => (properties) => mockAnswerTable(properties));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const createComponent = () => {
  const dispatch = jest.fn(() => Promise.resolve({ status: true }));
  const component = new AnalysisByTop({
    analysisQuestionCatalog: null,
    classListData: [],
    classQuestionAnalysis: {},
    dispatch,
    examId: 2069,
    isParentInit: true,
    questionAnalysisData: {},
  });
  component.setState = (update, callback) => {
    const patch =
      typeof update === "function" ? update(component.state) : update;
    component.state = { ...component.state, ...patch };
    callback?.();
  };
  component.state.groupId = 7651;
  return { component, dispatch };
};

const leafQuestion = (questionId, questionSerialNumber) => ({
  questionId,
  questionSerialNumber,
  sonQuestionList: [],
});

describe("TopicAnalysis question selection flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    classQuestionAnalysis.mockResolvedValue({ status: true, content: {} });
  });

  it("does not render a V2 preview before the first question is selected", () => {
    const { component } = createComponent();

    render(
      <AnalysisByTop
        {...component.props}
        analysisQuestionCatalog={{ findQuestion: jest.fn() }}
        commentMode
      />,
    );

    expect(mockAnalysisQuestionPreview).not.toHaveBeenCalled();
  });

  it("defaults classroom review to student answers without an answer-analysis tab", () => {
    const { component } = createComponent();

    render(<AnalysisByTop {...component.props} commentMode />);

    expect(component.state.modalType).toBe("studentAnswer");
    expect(
      screen.queryByText(/Answer Analysis|答案解析/),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Student Answer|学生作答/)).toHaveClass("active");
  });

  it("renders the selected review question once with its answer details", async () => {
    const question = leafQuestion(11674, "2");
    let renderedComponent;

    await act(async () => {
      render(
        <AnalysisByTop
          {...createComponent().component.props}
          analysisQuestionCatalog={{ findQuestion: jest.fn() }}
          commentMode
          ref={(instance) => {
            renderedComponent = instance;
          }}
        />,
      );
      renderedComponent.setState({
        currentQuestion: question,
        currentQuestionSelection: {
          questionId: 11674,
          questionNo: "2",
        },
        instructionList: [question],
      });
    });

    expect(mockAnalysisQuestionPreview).toHaveBeenCalledTimes(1);
    expect(mockAnalysisQuestionPreview).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 11674, showAnswer: true }),
    );
  });

  it("falls back from an empty review list to the first available question", async () => {
    const question = leafQuestion(11674, "2");
    singleQuestionAnalysis
      .mockResolvedValueOnce({ content: { questionList: [] } })
      .mockResolvedValueOnce({ content: { questionList: [question] } });
    const { component } = createComponent();

    component.singleQuestionAnalysisFun("startExplaining");
    await flushPromises();
    await flushPromises();

    expect(component.state.questionRange).toBe(0);
    expect(component.state.currentQuestion).toBe(question);
    expect(classQuestionAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: 11674,
        questionNo: "2",
      }),
    );
  });

  it("keeps an explicit empty selection and skips detail requests when both lists are empty", async () => {
    singleQuestionAnalysis.mockResolvedValue({
      content: { questionList: [] },
    });
    const { component } = createComponent();

    component.singleQuestionAnalysisFun("startExplaining");
    await flushPromises();
    await flushPromises();

    expect(component.state.currentQuestion).toBeNull();
    expect(component.state.instructionList).toEqual([]);
    expect(classQuestionAnalysis).not.toHaveBeenCalled();
  });

  it("uses the same frozen child identity for a composite question detail", async () => {
    const child = leafQuestion(11680, "1.1");
    const composite = {
      questionSerialNumber: "1",
      sonQuestionList: [child],
    };
    singleQuestionAnalysis.mockResolvedValue({
      content: { questionList: [composite] },
    });
    const { component } = createComponent();

    component.singleQuestionAnalysisFun();
    await flushPromises();

    expect(component.state.currentQuestionSelection).toEqual(
      expect.objectContaining({ questionId: 11680, questionNo: "1.1" }),
    );
    expect(classQuestionAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: 11680,
        questionNo: "1.1",
      }),
    );

    let renderedComponent;
    await act(async () => {
      render(
        <AnalysisByTop
          {...component.props}
          analysisQuestionCatalog={{ findQuestion: jest.fn() }}
          commentMode
          ref={(instance) => {
            renderedComponent = instance;
          }}
        />,
      );
      renderedComponent.setState({
        classQuestionAnalysis: {
          singleItemAndStudentInfoList: [
            { excellentAnswering: true, studentId: 52315 },
          ],
        },
        currentQuestion: composite,
        currentQuestionSelection: component.state.currentQuestionSelection,
        instructionList: [composite],
        modalType: "excellentAnswer",
      });
    });

    expect(mockAnalysisQuestionPreview).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 11680, showAnswer: true }),
    );
    expect(mockAnswerTable).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 11680 }),
    );
  });

  it("invalidates pending detail data when a refreshed question list is empty", async () => {
    let resolveDetail;
    classQuestionAnalysis.mockReturnValue(
      new Promise((resolve) => {
        resolveDetail = resolve;
      }),
    );
    singleQuestionAnalysis.mockResolvedValue({
      content: { questionList: [] },
    });
    const { component } = createComponent();

    component.getClassQuestionAnalysis({ questionId: 4711 });
    component.singleQuestionAnalysisFun();
    await flushPromises();
    resolveDetail({ status: true, content: { questionId: 4711 } });
    await flushPromises();

    expect(component.state.currentQuestion).toBeNull();
    expect(component.state.classQuestionAnalysis).toEqual({});
    expect(component.state.answerLoding).toBe(false);
  });

  it("stops list loading and keeps the page usable when the list request fails", async () => {
    singleQuestionAnalysis.mockRejectedValue(new Error("list failed"));
    const { component } = createComponent();

    await expect(
      component.singleQuestionAnalysisFun(),
    ).resolves.toBeUndefined();

    expect(component.state.instructionLoading).toBe(false);
    expect(component.state.currentQuestion).toBeNull();
  });

  it("stops detail loading and clears stale data when the detail request fails", async () => {
    classQuestionAnalysis.mockRejectedValue(new Error("detail failed"));
    const { component } = createComponent();
    component.state.classQuestionAnalysis = { questionId: 4711 };

    await expect(
      component.getClassQuestionAnalysis({ questionId: 11674 }),
    ).resolves.toBeUndefined();

    expect(component.state.answerLoding).toBe(false);
    expect(component.state.classQuestionAnalysis).toEqual({});
  });

  it("clears the previous response data when a new question is selected", async () => {
    let resolveDetail;
    classQuestionAnalysis.mockReturnValue(
      new Promise((resolve) => {
        resolveDetail = resolve;
      }),
    );
    const question = leafQuestion(11675, "3");
    singleQuestionAnalysis.mockResolvedValue({
      content: { questionList: [question] },
    });
    const { component } = createComponent();
    component.state.classQuestionAnalysis = {
      questionId: 11674,
      singleItemAndStudentInfoList: [{ answerJson: "old answer" }],
    };

    component.singleQuestionAnalysisFun();
    await flushPromises();

    expect(component.state.currentQuestion).toBe(question);
    expect(component.state.classQuestionAnalysis).toEqual({});
    resolveDetail({ status: true, content: { questionId: 11675 } });
  });

  it("ignores an older question-list response after a newer selection has loaded", async () => {
    let resolveFirst;
    let resolveSecond;
    singleQuestionAnalysis
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );
    const { component } = createComponent();

    component.singleQuestionAnalysisFun();
    component.singleQuestionAnalysisFun();
    const newerQuestion = leafQuestion(11675, "3");
    resolveSecond({ content: { questionList: [newerQuestion] } });
    await flushPromises();
    resolveFirst({ content: { questionList: [leafQuestion(4711, "1")] } });
    await flushPromises();

    expect(component.state.currentQuestion).toBe(newerQuestion);
  });

  it("keeps the newest question detail when responses finish out of order", async () => {
    let resolveFirst;
    let resolveSecond;
    classQuestionAnalysis
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );
    const { component } = createComponent();

    component.getClassQuestionAnalysis({ questionId: 4711 });
    component.getClassQuestionAnalysis({ questionId: 11674 });
    resolveSecond({ status: true, content: { questionNo: "2" } });
    await flushPromises();
    resolveFirst({ status: true, content: { questionNo: "1" } });
    await flushPromises();

    expect(component.state.classQuestionAnalysis).toEqual({ questionNo: "2" });
  });

  it("ignores pending responses after the analysis component unmounts", async () => {
    let resolveRequest;
    singleQuestionAnalysis.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { component, dispatch } = createComponent();

    component.singleQuestionAnalysisFun();
    component.componentWillUnmount();
    resolveRequest({
      content: { questionList: [leafQuestion(4711, "1")] },
    });
    await flushPromises();

    expect(component.state.currentQuestion).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
  });
});

import AnalysisByStudent from "./index";

describe("AnalysisByStudent answer sheet navigation", () => {
  const createComponent = (examId = 2060) => {
    const Component = AnalysisByStudent.WrappedComponent;
    return new Component({ examId });
  };

  beforeEach(() => {
    window.open = jest.fn();
  });

  it("已完成作答时打开最新的教师查看学生作答结果页", () => {
    const component = createComponent();

    component.lookStudentTest({ isComplete: true, userId: 11686 });

    expect(window.open).toHaveBeenCalledWith(
      `${window.location.origin}/exam#/teacher/exams/2060/students/11686/result`,
    );
  });

  it("未完成作答时保持禁止跳转", () => {
    const component = createComponent();

    expect(
      component.lookStudentTest({ isComplete: false, userId: 11686 }),
    ).toBe(false);
    expect(window.open).not.toHaveBeenCalled();
  });

  it("按学生去批改时进入指定学生的统一批改页", () => {
    const Component = AnalysisByStudent.WrappedComponent;
    const component = new Component({
      contractVersion: "V2",
      examId: 2069,
      examPaperId: 11689,
    });

    component.goToCorrectionRemark({ userId: 52315 });

    expect(window.open).toHaveBeenCalledWith(
      `${window.location.origin}/exam#/correctionRemark/2069/52315`,
    );
  });

  it("学生逐题表格使用题目 ID 作为稳定行内单元格 key", () => {
    const component = createComponent();

    const cells = component.renderQuestionAnswer(
      null,
      {
        studentQuestion: [
          { questionBankId: 11674, isCorrect: "正确" },
          { questionBankId: 11675, isCorrect: "错误" },
        ],
      },
      { questionBankId: 11675 },
    );

    expect(cells.filter(Boolean).map((cell) => cell.key)).toEqual(["11675"]);
  });

  it("选择题单元格只展示学生选中的选项", () => {
    const component = createComponent();
    component.props = {
      ...component.props,
      analysisQuestionCatalog: {
        findQuestion: () => ({
          content: {
            elements: [
              {
                type: "choice",
                options: [
                  { id: "option-a", cells: [{ text: "选项 A" }] },
                  { id: "option-b", cells: [{ text: "选项 B" }] },
                ],
              },
            ],
          },
        }),
      },
    };

    const cells = component.renderQuestionAnswer(
      null,
      {
        studentQuestion: [
          {
            answerJson: JSON.stringify({
              elementAnswers: [
                { type: "choice", answers: { optionIds: ["option-b"] } },
              ],
            }),
            isCorrect: "正确",
            questionBankId: 11675,
          },
        ],
      },
      { questionBankId: 11675 },
    );

    const summary = cells.find(Boolean).props.children[0];
    expect(summary.props.children).toBe("B. 选项 B");
    expect(summary.type).toBe("em");
  });

  it("主观题摘要可打开完整作答详情", () => {
    const component = createComponent();
    component.props = {
      ...component.props,
      analysisQuestionCatalog: {
        findQuestion: () => ({
          content: { elements: [{ type: "textResponse" }] },
        }),
      },
    };
    component.setState = jest.fn();
    const answer = {
      answerJson: JSON.stringify({
        elementAnswers: [
          { type: "textResponse", answers: { text: "学生答案" } },
        ],
      }),
      isCorrect: "待批改",
      questionBankId: 11676,
    };

    const cells = component.renderQuestionAnswer(
      null,
      { studentQuestion: [answer] },
      { questionBankId: 11676 },
    );
    const summary = cells.find(Boolean).props.children[0];
    summary.props.onClick();

    expect(summary.props.children).toBe("学生答案");
    expect(component.setState).toHaveBeenCalledWith({ answerDetail: answer });
  });

  it("学生分析表使用用户 ID 稳定关联表行记录", () => {
    const component = createComponent();
    component.props = {
      ...component.props,
      loadingTable: false,
      stuData: {
        answersResponses: [],
        studentQuestionResponses: { data: [] },
      },
    };

    const table = component.render().props.children[0].props.children[0];

    expect(table.props.rowKey).toBe("userId");
  });
});

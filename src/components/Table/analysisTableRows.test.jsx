import React from "react";
import { Pagination, Progress, Table } from "antd";

import ComnModal from "../ComnModal";
import QualityTable from "../QualityTable";
import StudentAccomplishmentTable from "../StudentAccomplishmentTable";
import QuestionAnalysisTable from "./partTable";
import StudentTrend from "./StudentTrend";
import BigQuestionScoreTable from "./tableB";
import QuestionScoreTable from "./tableS";
import RankAnalysis from "./RankAnalysis";

function findElement(node, predicate) {
  if (!React.isValidElement(node)) return undefined;
  if (predicate(node)) return node;

  return React.Children.toArray(node.props.children)
    .map((child) => findElement(child, predicate))
    .find(Boolean);
}

function findElements(node, predicate) {
  if (!React.isValidElement(node)) return [];

  const matches = predicate(node) ? [node] : [];
  return React.Children.toArray(node.props.children).reduce(
    (elements, child) => [...elements, ...findElements(child, predicate)],
    matches,
  );
}

describe("历史考试分析表行", () => {
  it("小题得分分页使用组件要求的字符串选项", () => {
    const Component = QuestionScoreTable.WrappedComponent;
    const component = new Component({
      examId: 2038,
      filterStudentListPermissions: { haveFilterStudentList: false },
      questionScore: {},
      tableClass: [],
    });

    const pagination = findElement(
      component.render(),
      (element) => element.type === Pagination,
    );

    expect(pagination.props.pageSizeOptions).toEqual([
      "50",
      "100",
      "150",
      "200",
    ]);
  });

  it("学生趋势列表使用学生 ID 稳定关联表行", () => {
    const Component = StudentTrend.WrappedComponent;
    const component = new Component({
      classListData: [],
      filterStudentListPermissions: { haveFilterStudentList: false },
      trendStuList: [
        {
          studentId: "student-1",
          studentName: "四学生20240405",
        },
      ],
    });

    const clickableRows = findElements(
      component.render(),
      (element) =>
        element.type === "div" && typeof element.props.onClick === "function",
    );

    expect(clickableRows.map((element) => element.key)).toEqual(
      expect.arrayContaining([expect.stringContaining("student-1")]),
    );
  });

  it("小题得分表使用学生 ID 区分同名学生行", () => {
    const Component = QuestionScoreTable.WrappedComponent;
    const component = new Component({
      examId: 2038,
      filterStudentListPermissions: { haveFilterStudentList: false },
      questionScore: {
        questionAnalyseRowList: [
          { studentId: 52_315, studentName: "同名学生" },
          { studentId: 52_316, studentName: "同名学生" },
        ],
      },
      tableClass: [],
    });

    const table = findElement(
      component.render(),
      (element) => element.type === Table,
    );

    expect(table.props.dataSource.map((row) => row.key)).toEqual([
      52_315, 52_316,
    ]);
  });

  it("大题得分表使用学生 ID 区分同名学生行并提供字符串分页选项", () => {
    const Component = BigQuestionScoreTable.WrappedComponent;
    const component = new Component({
      examId: 2038,
      filterStudentListPermissions: { haveFilterStudentList: false },
      questionScore: {
        questionAnalyseRowList: [
          { studentId: 52_315, studentName: "同名学生" },
          { studentId: 52_316, studentName: "同名学生" },
        ],
      },
      tableClass: [],
    });

    const rendered = component.render();
    const table = findElement(rendered, (element) => element.type === Table);
    const pagination = findElement(
      rendered,
      (element) => element.type === Pagination,
    );

    expect(table.props.dataSource.map((row) => row.key)).toEqual([
      52_315, 52_316,
    ]);
    expect(pagination.props.pageSizeOptions).toEqual([
      "50",
      "100",
      "150",
      "200",
    ]);
  });

  it("排名表使用学生 ID 关联表行并提供字符串分页选项", () => {
    const Component = RankAnalysis.WrappedComponent;
    const component = new Component({
      comparativeAnalysis: {
        singleComparativeResultModelList: [
          { studentUserId: 52_315, studentName: "同名学生" },
          { studentUserId: 52_316, studentName: "同名学生" },
        ],
      },
      examSelect: [],
      stuGradeList: [],
      filterStudentListPermissions: { haveFilterStudentList: false },
    });

    const rendered = component.render();
    const table = findElement(rendered, (element) => element.type === Table);
    const pagination = findElement(
      rendered,
      (element) => element.type === Pagination,
    );

    expect(table.props.dataSource.map((row) => row.key)).toEqual([
      52_315, 52_316,
    ]);
    expect(pagination.props.pageSizeOptions).toEqual([
      "50",
      "100",
      "150",
      "200",
    ]);
  });

  it("素养能力学生表提供字符串分页选项", () => {
    const component = new StudentAccomplishmentTable({
      filterStudentListPermissions: { haveFilterStudentList: false },
      stuGradeList: [],
    });
    const pagination = findElement(
      component.render(),
      (element) => element.type === Pagination,
    );

    expect(pagination.props.pageSizeOptions).toEqual([
      "50",
      "100",
      "150",
      "200",
    ]);
  });

  it("题目分析表使用题目 ID 稳定关联题目行", () => {
    const Component = QuestionAnalysisTable.WrappedComponent;
    const component = new Component({
      answerDetails: [
        {
          answerCorrectStudentNum: { studentNum: "答对:1" },
          answerErrorStudentNumList: [],
          answerErrorStudentRate: [],
          questionId: 11_675,
          questionNo: 1,
          showQuestionNumber: "1",
          scoreRate: "100%",
        },
      ],
      classListData: [],
      classQuestionAnalysis: {},
      filterStudentListPermissions: { haveFilterStudentList: false },
      getGroupStudents: [],
      questionItem: {},
      studentOriginal: [],
    });

    const table = findElement(
      component.render(),
      (element) => element.type === Table,
    );

    expect(table.props.dataSource).toEqual([
      expect.objectContaining({ key: 11_675, questionId: 11_675 }),
    ]);
  });

  it("题目详情按展示得分率驱动进度条并保持合法稳定的列表结构", () => {
    const Component = QuestionAnalysisTable.WrappedComponent;
    const component = new Component({
      answerDetails: [],
      classListData: [],
      classQuestionAnalysis: {
        answerCorrectStudentInfo: {
          isHigher: true,
          questionScore: 2,
          studentList: [52_315],
          studentNum: "1",
          studentRate: "100%",
        },
        answerErrorStudentInfoList: [
          {
            isHigher: false,
            questionScore: 1,
            studentList: [52_316],
            studentNum: "1",
            studentRate: "50%",
          },
        ],
        studentItemContent: {},
      },
      filterStudentListPermissions: { haveFilterStudentList: false },
      getGroupStudents: [],
      questionItem: {},
      studentOriginal: [],
    });
    component.state.studentNumVisible = true;
    component.state.singleInfoList = [
      { studentId: 52_315, studentName: "学生一" },
      { studentId: 52_316, studentName: "学生二" },
    ];

    const rendered = component.render();
    const progressBars = findElements(
      rendered,
      (element) => element.type === Progress,
    );
    const answerCards = findElements(rendered, (element) =>
      element.props.className?.split?.(" ").includes("singleQuestion"),
    );
    const scoreSections = findElements(rendered, (element) =>
      element.props.className?.includes?.("subsectionNum"),
    );

    expect(progressBars.map((element) => element.props.percent)).toEqual([
      50, 100,
    ]);
    expect(answerCards.map((element) => element.key)).toEqual([
      expect.stringMatching(/52315$/),
      expect.stringMatching(/52316$/),
    ]);
    expect(scoreSections.every((element) => element.type === "div")).toBe(true);
  });

  it("难度参考表使用布尔弹窗状态和题型 ID 稳定关联行", () => {
    const component = new QualityTable({ examId: 2038, paperId: 11_617 });
    component.state.paperLevelData = [
      { type: 1, typeName: "简单", typeEName: "Easy" },
      { type: 2, typeName: "普通", typeEName: "Medium" },
    ];

    expect(component.state.difficultyReferenceDialog).toBe(false);
    const referenceModal = findElement(
      component.render(),
      (element) => element.type === ComnModal,
    );
    expect(
      referenceModal.props.innerContent.props.children.map((element) =>
        String(element.key),
      ),
    ).toEqual(["1", "2"]);
  });
});

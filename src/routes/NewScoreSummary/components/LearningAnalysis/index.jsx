import React, { PureComponent } from "react";
import { Checkbox, Empty, message, Select, Spin } from "antd";
import { connect } from "dva";

import { getConfig } from "../../../../services/example";
import { trans } from "../../../../utils/i18n";
import { loginRedirect } from "../../../../utils/utils";
const { Option } = Select;

class LearningAnalysis extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      tabData: [],
      subjectId: 0,
      config: {},
      isShowSort: false,
    };
  }

  componentDidMount() {
    getConfig({
      type: 6,
      schoolLevel: true,
      businessId: "",
    }).then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          this.setState({
            config: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  }

  sortChange = (e) => {
    this.setState({
      isShowSort: e.target.checked,
    });
  };

  render() {
    const { tabData, isLoading } = this.props;
    const { subjectId, config, isShowSort } = this.state;

    let columns = [];
    if (tabData) {
      columns = tabData.columnSet?.filter(
        (item) => item.subjectId == subjectId || subjectId == 0,
      );
    }

    return (
      <div style={{ width: "100%", height: "100%" }}>
        {config?.parentScoreAndRankWatchSwitch ? (
          <span>
            <Checkbox
              checked={this.state.isShowSort}
              onChange={this.sortChange}
            />{" "}
            {trans("global.displayRanking", "显示排名")}
          </span>
        ) : null}
        <div
          style={{
            height: "calc(100% - 95px)",
            width: "100%",
            marginTop: "8px",
          }}
        >
          {isLoading ? (
            <div
              style={{
                width: "100%",
                background: "#fff",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <Spin />
            </div>
          ) : columns &&
            columns.length > 0 &&
            tabData &&
            tabData.studentScoreDetailList ? (
            tabData.studentScoreDetailList.map((scoreDetai) => (
              <div
                style={{
                  width: "100%",
                  marginBottom: "8px",
                  fontSize: "14px",
                  background: "#fff",
                }}
                key={scoreDetai.id}
              >
                <div
                  style={{
                    color: "rgba(1, 17, 61, 0.85)",
                    padding: "9px 12px",
                    fontWeight: "500",
                  }}
                >
                  {scoreDetai.reportName}
                </div>
                <div style={{ width: "100%", overflow: "auto" }}>
                  <table
                    border="1"
                    cellPadding="7"
                    style={{
                      borderColor: "rgba(1, 17, 61, 0.07)",
                      color: "rgba(1, 17, 61, 0.648)",
                    }}
                  >
                    <thead
                      style={{
                        fontWeight: "500",
                        background: "rgba(1, 17, 61, 0.02)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <tr>
                        {isShowSort && config.parentScoreAndRankWatchSwitch ? (
                          <th></th>
                        ) : null}
                        {columns.map((item) => {
                          return (
                            <th
                              style={{ textAlign: "center" }}
                              key={item.subjectName}
                            >
                              {item.subjectName}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody style={{}}>
                      <tr>
                        {isShowSort && config.parentScoreAndRankWatchSwitch ? (
                          <td> {trans("global.score", "分数")} </td>
                        ) : null}
                        {columns.map((item) => {
                          let scoreList =
                            scoreDetai.analysisStudentResponse
                              .examResultSummaryAnalyseRow || [];
                          let currentScore =
                            scoreList.find(
                              (o) => o.subjectId == item.subjectId,
                            ) || {};
                          return (
                            <td key={currentScore.studentId}>
                              {currentScore.score}
                            </td>
                          );
                        })}
                      </tr>
                      {isShowSort && config.parentScoreAndRankWatchSwitch ? (
                        <tr style={{ whiteSpace: "nowrap" }}>
                          <td> {trans("data.ranking", "排名")} </td>
                          {columns.map((item) => {
                            let scoreList =
                              scoreDetai.analysisStudentResponse
                                .examResultSummaryAnalyseRow || [];
                            let currentScore =
                              scoreList.find(
                                (o) => o.subjectId == item.subjectId,
                              ) || {};
                            return (
                              <td key={currentScore.studentId}>
                                {currentScore.sort}
                              </td>
                            );
                          })}
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </div>
    );
  }
}
export default connect(({ home, studentLearning, global }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  teachingOrgList: studentLearning.teachingOrgList,
  allStudents: studentLearning.allStudents,
  allSubjectList: studentLearning.allSubjectList,
  stuGradeList: global.stuGradeList,
  stuTypeList: global.stuTypeList,
  stuNameList: global.stuNameList,
  knowledgeQuestionList: global.knowledgeQuestionList,
  errorQuestionList: global.errorQuestionList,
  hoverIndex: home.hoverIndex,
  hoverIndexc: home.hoverIndexc,
  individuationTest: home.individuationTest,
  questionItem: home.questionItem,
  newTrendList: home.newTrendList,
  allStudentByName: home.allStudentByName,
  studentGroupList: global.studentGroupList,
  userList: global.userList,
  personalizedList: global.personalizedList,
  studentList: global.studentList,
  studentGroupListAndStudentList: global.studentGroupListAndStudentList,
  knowledgeErrorQuestionList: global.knowledgeErrorQuestionList,
  tableData: home.tableData,
}))(LearningAnalysis);

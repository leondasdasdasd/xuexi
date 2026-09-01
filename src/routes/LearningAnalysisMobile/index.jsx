import React, { Fragment, PureComponent } from "react";
import { Checkbox, Empty, message, Select, Spin } from "antd";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import { summaryClassStudentOne } from "../../services/exam";
import { getConfig, queryExamOptions } from "../../services/example";
import { trans } from "../../utils/i18n";
import { loginRedirect } from "../../utils/utils";

import styles from "./index.module.less";
const { Option } = Select;

class LearningAnalysisMobile extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/mobile/learningAnalysis/:id?").exec(
      this.url,
    );
    this.id = this.pathMatch[1];
    this.state = {
      tabData: [],
      semesterId: 0,
      subjectId: 0,
      config: {},
      isShowSort: false,
      semesterList: [],
      loading: true,
    };
  }

  async componentDidMount() {
    if (this.id) {
      this.getTableData({ summaryReportId: this.id });
    } else {
      let res = await queryExamOptions({});
      if (res.ifLogin) {
        if (res.status) {
          if (res.content && res.content.length > 0) {
            this.setState({
              semesterList: res.content,
            });
            let result = res.content.find((item) => item.current);
            this.setState({
              semesterId: result.semesterId,
              subjectList: result.subjectList,
            });
            this.getTableData({ semesterId: result.semesterId });
          }
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    }

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

  semesterChange = (value) => {
    let result = this.state.semesterList.find(
      (item) => item.semesterId == value,
    );
    this.setState({
      semesterId: value,
      subjectList: result.subjectList,
    });
    this.getTableData({ semesterId: value });
  };

  getTableData = ({ semesterId, summaryReportId }) => {
    this.setState({ loading: true });

    summaryClassStudentOne({
      semesterId,
      summaryReportId,
    }).then((response) => {
      this.setState({ loading: false });

      if (response.ifLogin) {
        if (response.status) {
          this.setState({
            tabData: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  subjectChange = (value) => {
    this.setState({
      subjectId: value,
    });
  };

  sortChange = (e) => {
    this.setState({
      isShowSort: e.target.checked,
    });
  };

  viewAll = () => {
    if (window.parent) {
      window.parent.location.replace(
        `${window.parent.origin}/#/learningAnalysis`,
      );
      setTimeout(() => {
        window.parent.location.reload(); // 确保刷新
      }, 100);
    }
  };

  render() {
    const { allSubjectList, examOptions, currentUser } = this.props;
    const {
      tabData,
      semesterId,
      subjectId,
      config,
      isShowSort,
      semesterList,
      subjectList,
    } = this.state;

    let columns = tabData.columnSet?.filter(
      (item) => item.subjectId == subjectId || subjectId == 0,
    );
    let schoolId = currentUser?.schoolId;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 99,
        }}
      >
        <div className={styles.analysisTabBox}>
          {schoolId && schoolId != 1 ? (
            <div className={styles.analysisTab}>
              {trans("learningAnalysis.assessmentSheet", "评估单")}
            </div>
          ) : null}
          {schoolId && schoolId != 1 ? (
            <div className={styles.analysisTab}>
              {trans("global.errorSet", "错题集")}
            </div>
          ) : null}
          <div className={`${styles.analysisTab} ${styles.active}`}>
            {trans("learningAnalysis.title", "学情分析")}
          </div>
          {schoolId && schoolId != 1 ? (
            this.id ? (
              <div onClick={this.viewAll} className={styles.viewAllBtn}>
                {trans("scoreImport.viewAll", "查看全部")}
              </div>
            ) : null
          ) : null}
        </div>

        {this.id ? (
          <>
            {config.parentScoreAndRankWatchSwitch ? (
              <div className={styles.optionsBox}>
                <span>
                  <Checkbox
                    checked={this.state.isShowSort}
                    onChange={this.sortChange}
                  />{" "}
                  {trans("global.displayRanking", "显示排名")}
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.optionsBox}>
            <Select
              placeholder={trans(
                "learningAnalysis.semesterRequired",
                "请选择学期",
              )}
              value={semesterId}
              onChange={this.semesterChange}
              className={styles.selectStyle}
              style={{ width: "40%", marginRight: "5px", flexGrow: "1" }}
              dropdownMatchSelectWidth={false}
            >
              {semesterList && semesterList.length > 0
                ? semesterList.map((item) => (
                    <Option value={item.semesterId} key={item.semesterId}>
                      <span title={item.semesterName}>{item.semesterName}</span>
                    </Option>
                  ))
                : null}
            </Select>
            <Select
              placeholder={trans("homeWork.subjectRequired", "请选择学科")}
              value={subjectId}
              onChange={this.subjectChange}
              className={styles.selectStyle}
              style={{ width: "30%", marginRight: "5px", flexGrow: "1" }}
              dropdownMatchSelectWidth={false}
            >
              <Option value={0}>
                {trans("global.allSubject", "全部学科")}
              </Option>
              {/* {subjectList && subjectList.length > 0
                                    ? subjectList.map((item, index) => (
                                        <Option value={item.subjectId} key={item.subjectId}>
                                            <span title={item.subjectName}>{item.subjectName}</span>
                                        </Option>
                                    ))
                                    : null} */}
            </Select>
            {config.parentScoreAndRankWatchSwitch ? (
              <span>
                <Checkbox
                  checked={this.state.isShowSort}
                  onChange={this.sortChange}
                />{" "}
                {trans("global.displayRanking", "显示排名")}
              </span>
            ) : null}
          </div>
        )}

        <div
          style={{
            height: "calc(100% - 95px)",
            width: "100%",
            marginTop: "8px",
          }}
        >
          {this.state.loading ? (
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
          ) : tabData && tabData.studentScoreDetailList ? (
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
                          <td> {trans("global.ranking", "排名")} </td>
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
  currentUser: global.currentUser,
}))(LearningAnalysisMobile);

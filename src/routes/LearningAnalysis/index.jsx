import React, { PureComponent } from "react";
import { Checkbox, message, Select, Spin, Table, Tooltip } from "antd";
import { connect } from "dva";

import { summaryClassStudentOne } from "../../services/exam";
import { getConfig, queryExamOptions } from "../../services/example";
import { locale, trans } from "../../utils/i18n";
import { loginRedirect } from "../../utils/utils";

import styles from "./index.module.less";
const { Option } = Select;

class LearningAnalysis extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      groupList: [],
      semesterList: [],
      semesterId: "",
      isShowSort: true,
      gradeId: 0,
      groupId: 0,
      loading: true,
      columns: [],
      tableData: [],
    };
  }
  componentDidMount() {
    this.props
      .dispatch({
        type: "global/getCurrentUser",
      })
      .then(async (res) => {
        const { currentUser } = this.props;
        if (currentUser.currentIdentity == "employee") {
          // 获取年级
          this.props
            .dispatch({
              type: "global/getStudentGroupList",
            })
            .then(async () => {
              let gradeList = this.props?.studentGroupList;
              if (gradeList && gradeList.length > 0) {
                if (gradeList[0].studentClassModels) {
                  this.setState({
                    groupList: gradeList[0].studentClassModels,
                  });
                  await this.getExamData();
                  let groupIdList = gradeList[0].studentClassModels.map(
                    (item) => item.studentGroupId,
                  );
                  // 根据班级ids获取学生
                  await this.getStudentListByGroups({
                    groupIdList: groupIdList,
                  });
                  await this.getConfigFun();
                  this.getTableData({});
                  // 获取所有学科
                  this.props.dispatch({
                    type: "studentLearning/getAllSubject",
                  });
                }
              } else {
                this.setState({
                  loading: false,
                  loading1: false,
                });
              }
            });
        } else {
          await this.getConfigFun();
          await this.getExamData();
          this.getTableData({});
        }
      });
  }
  getConfigFun = () => {
    return new Promise((resolve, reject) => {
      getConfig({
        type: 6,
        schoolLevel: true,
        businessId: "",
      })
        .then((response) => {
          if (response.ifLogin) {
            if (response.status) {
              this.setState(
                {
                  config: response.content,
                },
                () => {
                  resolve();
                },
              );
            } else {
              message.error(response.message);
              reject();
            }
          } else {
            loginRedirect();
            reject();
          }
        })
        .catch(() => {
          reject();
        });
    });
  };
  changeCondition = (value, type) => {
    if (type == "grade") {
      let groupList = this.getClassListByGradeId(value);
      this.setState(
        {
          gradeId: value,
          groupList: groupList,
        },
        () => {
          let groupIdList = groupList.map((item) => item.studentGroupId);
          this.getStudentListByGroups({ groupIdList: groupIdList });
        },
      );
    } else if (type == "group") {
      this.setState(
        {
          groupId: value,
        },
        () => {
          this.getStudentListByGroups({ groupIdList: [value] });
        },
      );
    }
  };

  semesterChange = (value) => {
    // let result = this.state.semesterList.find(item => item.semesterId == value)
    this.setState({
      semesterId: value,
      // subjectList: result.subjectList,
    });
    this.getTableData({ semesterId: value });
  };

  getTableData = ({ semesterId, studentId }) => {
    this.setState({ loading: true });

    summaryClassStudentOne({
      semesterId: semesterId == undefined ? this.state.semesterId : semesterId,
      studentId: studentId == undefined ? this.state.studentId : studentId,
    })
      .then((response) => {
        this.setState({ loading: false });

        if (response.ifLogin) {
          if (response.status) {
            let columns = this.transformTableDataToColumns(response.content);
            let data = this.transformTableDataToData(response.content);
            this.setState({
              tableData: data,
              formTableData: response.content,
              columns: columns,
            });
          } else {
            message.error(response.message);
          }
        } else {
          loginRedirect();
        }
      })
      .catch(() => {
        this.setState({ loading: false });
      });
  };

  transformTableDataToData = (tableData) => {
    const { studentScoreDetailList, columnSet } = tableData;

    let data = [];
    for (const [index, item] of studentScoreDetailList.entries()) {
      let object = {
        index: index + 1,
        reportName: item.reportName,
      };
      if (columnSet && columnSet.length > 0) {
        columnSet.map((subject) => {
          let currentSubjectScoreInfo =
            item.analysisStudentResponse?.examResultSummaryAnalyseRow.find(
              (s) => s.subjectId == subject.subjectId,
            ) || {};
          object = {
            ...object,
            [`score${subject.subjectId}`]: currentSubjectScoreInfo.score,
            [`studentNo${subject.subjectId}`]: currentSubjectScoreInfo.sort,
          };
        });
      }
      // item.analysisStudentResponse?.examResultSummaryAnalyseRow.forEach((item1, index1) => {
      //     obj = {
      //         ...obj,
      //         [`score${item1.subjectId}`]: item1.score,
      //         [`studentNo${item1.subjectId}`]: item1.studentNo,
      //     }
      // })
      data.push(object);
    }
    console.log(data, "data==>");
    return data;
  };

  transformTableDataToColumns = (tableData) => {
    const { columnSet } = tableData;
    const { isShowSort, config } = this.state;
    let columns = [
      {
        title: trans("global.order", "序号"),
        dataIndex: "index",
        key: "index",
        width: 80,
        fixed: "left",
        align: "center",
      },
      {
        title: trans("learningAnalysis.assessmentName", "评估名称"),
        dataIndex: "reportName",
        key: "reportName",
        fixed: "left",
        width: 280,
        align: "center",
      },
    ];

    if (isShowSort && config.parentScoreAndRankWatchSwitch) {
      for (const [index, item] of columnSet.entries()) {
        columns.push({
          title: item.subjectName,
          children: [
            {
              title: trans("global.score", "分数"),
              dataIndex: `score${item.subjectId}`,
              key: `score${item.subjectId}`,
              width: 65,
              onCell: (_, rowIndex) => ({
                onMouseEnter: () =>
                  this.handleCellMouseEnter(rowIndex, `${index}-0`),
                onMouseLeave: this.handleMouseLeave,
                className:
                  this.state.hoveredColumn === `${index}-0`
                    ? "highlight_column"
                    : "",
              }),
              align: "center",
            },
            {
              title: trans("learningAnalysis.schoolExamNo", "校次"),
              dataIndex: `studentNo${item.subjectId}`,
              key: `studentNo${item.subjectId}`,
              width: 65,
              onCell: (_, rowIndex) => ({
                onMouseEnter: () =>
                  this.handleCellMouseEnter(rowIndex, `${index}-1`),
                onMouseLeave: this.handleMouseLeave,
                className:
                  this.state.hoveredColumn === `${index}-1`
                    ? "highlight_column"
                    : "",
              }),
              align: "center",
            },
          ],
        });
      }
      columns.push({});
    } else {
      for (const [index, item] of columnSet.entries()) {
        columns.push({
          title: item.subjectName,
          dataIndex: `score${item.subjectId}`,
          key: `score${item.subjectId}`,
          width: 65,
          onCell: (_, rowIndex) => ({
            onMouseEnter: () =>
              this.handleCellMouseEnter(rowIndex, `${index}-0`),
            onMouseLeave: this.handleMouseLeave,
            className:
              this.state.hoveredColumn === `${index}-0`
                ? "highlight_column"
                : "",
          }),
          align: "center",
        });
      }
      columns.push({});
    }

    return columns;
  };

  // 获取学期
  getExamData = () => {
    return new Promise((resolve, reject) => {
      queryExamOptions({}).then((res) => {
        if (res.ifLogin) {
          if (res.status) {
            if (res.content && res.content.length > 0) {
              let result = res.content.find((item) => item.current);
              this.setState(
                {
                  semesterId: result.semesterId,
                  semesterList: res.content,
                },
                () => {
                  resolve();
                },
              );
            }
          } else {
            message.error(res.message);
            reject();
          }
        } else {
          loginRedirect();
          reject();
        }
      });
    });
  };

  getStudentListByGroups = async ({ groupIdList }) => {
    return new Promise((resolve, reject) => {
      this.setState({
        loading1: true,
      });
      // 获取 userList
      this.props
        .dispatch({
          type: "global/postFindUserCaptureCount",
          payload: {
            groupIdList: groupIdList,
          },
        })
        .then(() => {
          let studentList = this.props?.userList;
          this.setState(
            {
              loading1: false,
              studentId: studentList[0]?.userId,
            },
            () => {
              resolve();
            },
          );
        })
        .catch(() => {
          reject();
        });
    });
  };

  // 根据年级id获取班级数据
  getClassListByGradeId = (gradeId) => {
    let gradeList = this.props.studentGroupList;
    let array = [];
    if (gradeId > 0) {
      for (const element of gradeList) {
        if (gradeId == element.gradeId) {
          array = element.studentClassModels;
          break;
        }
      }
    }
    return array;
  };

  changeStudentId = (studentId) => {
    this.setState({
      studentId,
    });
    this.getTableData({ studentId: studentId });
  };

  clickSub = (id) => {
    this.setState({
      subjectId: id,
    });
  };

  handleCellMouseEnter = (rowIndex, colIndex) => {
    console.log(rowIndex, colIndex, "啊阿啊阿啊阿啊阿啊");

    this.setState({
      hoveredRow: rowIndex,
      hoveredColumn: colIndex,
    });
  };

  handleMouseLeave = () => {
    this.setState({
      hoveredRow: null,
      hoveredColumn: null,
    });
  };

  sortChange = (e) => {
    this.setState(
      {
        isShowSort: e.target.checked,
      },
      () => {
        let columns = this.transformTableDataToColumns(
          this.state.formTableData,
        );
        this.setState({
          columns: columns,
        });
      },
    );
  };

  render() {
    const { userList, studentGroupList, allSubjectList, currentUser } =
      this.props;
    const {
      groupList,
      studentId,
      gradeId,
      groupId,
      loading1,
      loading,
      subjectId,
      semesterList,
      semesterId,
    } = this.state;

    return (
      <div
        style={{ width: "100%", height: "100%", display: "flex" }}
        className={styles.learningAnalysis}
      >
        {currentUser?.currentIdentity == "employee" ? (
          <div className={styles.contentLeft}>
            <div className={styles.stuList} style={{ width: "200px" }}>
              <div className={styles.searchCondition}>
                <Select
                  className={styles.selectStuStyle}
                  placeholder={trans("global.searchStu", "搜索学生")}
                  showSearch
                  value={studentId}
                  filterOption={(input, option) =>
                    option.props.children
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onSelect={this.changeStudentId}
                >
                  {userList &&
                    userList.length > 0 &&
                    userList.map((item, index) => (
                      <Option
                        key={item.userId}
                        value={item.userId}
                        title={item.userName}
                      >
                        {item.userName}
                      </Option>
                    ))}
                </Select>
                <Select
                  placeholder={trans("paper.gradeRequired", "请选择年级")}
                  onChange={(value) => this.changeCondition(value, "grade")}
                  value={gradeId}
                  className={styles.selectGrade}
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ width: "200px" }}
                >
                  <Option value={0}>
                    {trans("global.allGrade", "全部年级")}
                  </Option>

                  {studentGroupList && studentGroupList.length > 0
                    ? studentGroupList.map((item, index) => {
                        if (
                          item.name == "小班" ||
                          item.name == "中班" ||
                          item.name == "大班"
                        )
                          return;
                        return (
                          <Option
                            value={item.gradeId}
                            key={item.gradeId}
                            title={
                              locale() === "en" ? item.englishName : item.name
                            }
                          >
                            {locale() === "en" ? item.englishName : item.name}
                          </Option>
                        );
                      })
                    : null}
                </Select>
                <Select
                  placeholder={trans(
                    "learningAnalysis.classRequired",
                    "请选择班级",
                  )}
                  onChange={(value) => this.changeCondition(value, "group")}
                  value={groupId}
                  className={styles.selectStyle}
                  dropdownMatchSelectWidth={false}
                  dropdownStyle={{ width: "200px" }}
                >
                  <Option value={0} key="">
                    {trans("global.allClass", "全部班级")}
                  </Option>
                  {groupList && groupList.length > 0
                    ? groupList.map((item, index) => (
                        <Option
                          value={item.studentGroupId}
                          key={index}
                          title={
                            locale() === "en" ? item.englishName : item.name
                          }
                        >
                          {locale() === "en" ? item.englishName : item.name}
                        </Option>
                      ))
                    : null}
                </Select>
              </div>
              <div className={styles.menuList}>
                <Spin spinning={loading1} tip="loading...">
                  {userList && userList.length > 0
                    ? userList.map((item, index) => {
                        let defaultImg =
                          item.sex && item.sex == 1
                            ? "https://assets.yungu.org/statics/0.0.1/task/boy.png"
                            : "https://assets.yungu.org/statics/0.0.1/task/girl.png";
                        let name = locale() === "en" ? item.ename : item.name;
                        return (
                          <div
                            className={
                              studentId == item.userId
                                ? `${styles.menu} ${styles.activeMenu}`
                                : styles.menu
                            }
                            key={index}
                            onClick={() =>
                              this.changeStudentId(
                                item.userId,
                                item.gradeId,
                                item.stage,
                              )
                            }
                          >
                            <span className={styles.cover}>
                              <img
                                src={
                                  item.userAvatar ? item.userAvatar : defaultImg
                                }
                                onError={(e) => this.checkError(e, defaultImg)}
                                alt="头像"
                              />
                            </span>
                            <Tooltip title={item.userName}>
                              <span className={styles.name}>
                                {name ? name : item.userName}
                              </span>
                            </Tooltip>
                          </div>
                        );
                      })
                    : null}
                </Spin>
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.contentRight}>
          <span
            className={styles.subBox}
            style={{
              color: "#0445FC",
              background: "rgb(212, 223, 253)",
              borderRadius: "3px",
            }}
          >
            {trans("global.overallSubjectScores", "全科成绩")}
          </span>
          {/* {allSubjectList && allSubjectList.length > 0 &&
                        allSubjectList.map((item) => (
                            <span
                                className={styles.subBox}
                                style={
                                    subjectId == item.id
                                        ? {
                                            color: "#0445FC",
                                            background: "rgb(212, 223, 253)",
                                        }
                                        : null
                                }
                                onClick={() => this.clickSub(item.id)}
                            >
                                {item.name}
                            </span>
                        ))
                    } */}

          <div style={{ background: "#fff", borderRadius: "11px" }}>
            <div style={{ padding: "8px 12px" }} className={styles.selectStyle}>
              <Select
                placeholder={trans(
                  "learningAnalysis.semesterRequired",
                  "请选择学期",
                )}
                value={semesterId}
                onChange={this.semesterChange}
                className={styles.selectStyle}
                style={{ width: "260px", marginRight: "5px" }}
                dropdownMatchSelectWidth={false}
              >
                {semesterList && semesterList.length > 0
                  ? semesterList.map((item) => (
                      <Option value={item.semesterId} key={item.semesterId}>
                        <span title={item.semesterName}>
                          {item.semesterName}
                        </span>
                      </Option>
                    ))
                  : null}
              </Select>

              {this.state.config?.parentScoreAndRankWatchSwitch ? (
                <span>
                  <Checkbox
                    checked={this.state.isShowSort}
                    onChange={this.sortChange}
                  />{" "}
                  {trans("global.displayRanking", "显示排名")}
                </span>
              ) : null}
            </div>
            <div style={{ display: "block" }}>
              <Table
                loading={this.state.loading}
                columns={this.state.columns}
                dataSource={this.state.tableData}
                bordered
                scroll={{ x: 1200 }}
                rowClassName={(record, rowIndex) =>
                  this.state.hoveredRow === rowIndex ? "highlight_row" : ""
                }
              />
            </div>
          </div>
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
}))(LearningAnalysis);

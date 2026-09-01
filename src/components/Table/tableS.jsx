import React, { PureComponent } from "react";
import { Input, Pagination, Select, Switch, Table } from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Search } = Input;
const { Option } = Select;
class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 1,
      groupId: 0,
      pageNo: 1,
      pageSize: 100,
      stuName: "",
      questionDetailSpecify: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProperties) {
    //判断如果props发生改变
    if (nextProperties.tableClass !== this.props.tableClass) {
      const { tableClass } = nextProperties;
      let temporaryGroupId = 0;

      if (tableClass && tableClass.length > 0) {
        temporaryGroupId = tableClass[0].groupId;
      }

      this.setState(
        {
          groupId: temporaryGroupId,
        },
        () => {
          if (nextProperties.examSourceType != 0) {
            this.getPage();
          }
        },
      );
    }
  }
  componentDidMount() {
    // console.log("111<<");
    this.props.dispatch({
      type: "home/getClass",
      payload: {
        examId: this.props.examId,
      },
    });
    // if (this.props.examSourceType != 0) {
    //   this.getPage();
    // }
  }
  changeClass = (value) => {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
      },
      () => {
        this.getPage();
      },
    );
  };
  getPage = () => {
    this.props
      .dispatch({
        type: "home/clearQuestionScore",
      })
      .then(() => {
        this.props.dispatch({
          type: "home/getQuestionScore",
          payload: {
            examId: this.props.examId,
            groupId: this.state.groupId,
            pageNo: this.state.pageNo,
            limit: this.state.pageSize,
            searchStudentKeyWord: this.state.stuName,
            questionType: 1,
            analyseType: this.state.check,
            filterFlag: this.state.questionDetailSpecify,
          },
        });
      });
  };
  onSearch = (value) => {
    this.getPage();
  };
  changeSearch = (e) => {
    this.setState({
      stuName: e.target.value,
    });
  };
  changeTab = (check) => {
    this.setState(
      {
        check,
        pageNo: 1,
      },
      () => {
        this.getPage();
      },
    );
  };
  changeNo = (value) => {
    this.setState(
      {
        pageNo: value,
      },
      () => {
        this.getPage();
      },
    );
  };
  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        questionDetailSpecify: checked,
      },
      () => {
        this.getPage();
      },
    );
  };

  onShowSizeChange = (current, pageSize) => {
    this.setState(
      {
        pageNo: 1,
        pageSize,
      },
      () => {
        this.getPage();
      },
    );
  };
  render() {
    const {
      currentUser,
      basketList,
      basketSubjectId,
      questionScore,
      tableClass,
    } = this.props;
    const { check } = this.state;
    let newDataSource = [];
    questionScore &&
      questionScore.questionAnalyseRowList &&
      questionScore.questionAnalyseRowList.length &&
      questionScore.questionAnalyseRowList.map((item) => {
        let newObject = {
          name: this.state.check === 1 ? item.studentName : item.groupName,
          enName:
            this.state.check === 1
              ? item.studentEnName
              : item.courseTeacherNames,
          key:
            this.state.check === 1
              ? (item.studentId ?? "student-summary")
              : (item.groupId ?? "group-summary"),
        };
        item.questionAnalyseRow &&
          item.questionAnalyseRow.map((index) => {
            newObject[index.questionId] = index.questionId;
            newObject[`${index.questionId}Score`] = index.score;
            newObject[`${index.questionId}ScoreRate`] = index.scoreRate;
            newObject[`${index.questionId}surePass`] = index.scoreRatePass;
          });
        newDataSource.push(newObject);
      });
    const dataSource = newDataSource;
    // [
    //   {
    //     key: "1",
    //     name: "胡彦斌",
    //     age: 32,
    //     address: "西湖区湖底公园1号",
    //     score: 60,
    //     maxScore: 98,
    //     minScore: 40,
    //     midScore: 53,
    //   },
    //   {
    //     key: "2",
    //     name: "胡彦祖",
    //     age: 42,
    //     address: "西湖区湖底公园1号",
    //     score: 70,
    //     maxScore: 96,
    //     minScore: 52,
    //     midScore: 75,
    //   },
    // ];

    let newColumns = [
      {
        title:
          this.state.check === 1
            ? trans("global.stuName", "学生姓名")
            : trans("global.className", "班级名称"),
        dataIndex: "name",
        key: "name",
        width: 150,
        fixed: "left",
        render: (text, record) => {
          return (
            <div>
              <div className={styles.importMessage}>{record.name}</div>
            </div>
          );
        },
      },
    ];
    questionScore &&
      questionScore.columnSet &&
      questionScore.columnSet.length &&
      questionScore.columnSet.map((item, ind) => {
        newColumns.push({
          width: 140,
          title: () => {
            return (
              <div>
                <div>
                  <span className={styles.importMessage}>
                    {item.questionTitle}
                  </span>
                  <i
                    className={[
                      icon.iconfont,
                      styles.publicMessage,
                      styles.reportFormIcon,
                    ].join(" ")}
                  >
                    &#xe7d3;
                  </i>
                  <span className={styles.publicMessage}>
                    {item.questionScore}
                  </span>
                </div>
                <div>
                  <span className={styles.publicMessage}>
                    {trans("global.yourScore", "得分")}
                  </span>
                  <span
                    className={[styles.publicMessage, styles.divider].join(" ")}
                  >
                    /
                  </span>
                  <span className={styles.publicMessage}>
                    {trans("analysis.knowLedgeScoreRate", "得分率")}
                  </span>
                </div>
              </div>
            );
          },
          dataIndex: item.questionId,
          key: item.questionId,
          sorter: (a, b) => {
            console.log(a, b, "ccc");
            return a[`${item.questionId}Score`] - b[`${item.questionId}Score`];
          },
          render: (text, record, index) => {
            return (
              <div>
                <span className={styles.importMessage}>
                  {record[`${item.questionId}Score`]}
                </span>
                <span
                  className={[styles.publicMessage, styles.divider].join(" ")}
                >
                  /
                </span>
                <span
                  className={`${styles.publicMessage} 
                  ${comparePercentages(record[`${item.questionId}ScoreRate`], dataSource[0][`${item.questionId}ScoreRate`]) == -1 ? styles.noPass : ""}`}
                >
                  {record[`${item.questionId}ScoreRate`]}
                </span>
              </div>
            );
          },
        });
      });
    const columns = newColumns;
    // [
    //   {
    //     title: (sortOrder, sortColumn, filters) => {
    //       return (
    //         <div>
    //           <div>
    //             <span className={styles.importMessage}>总分</span>
    //             <i
    //               className={[
    //                 icon.iconfont,
    //                 styles.publicMessage,
    //                 styles.reportFormIcon,
    //               ].join(" ")}
    //             >
    //               &#xe7d3;
    //             </i>
    //             <span className={styles.publicMessage}>100</span>
    //           </div>
    //           <div>
    //             <span className={styles.publicMessage}>得分</span>
    //             <span
    //               className={[styles.publicMessage, styles.divider].join(" ")}
    //             >
    //               /
    //             </span>
    //             <span className={styles.publicMessage}>得分率</span>
    //           </div>
    //         </div>
    //       );
    //     },
    //     dataIndex: "name",
    //     width: 140,
    //     key: "name",
    //     render: (text, record) => {
    //       return (
    //         <div>
    //           <span className={styles.importMessage}>75.56</span>
    //           <span
    //             className={[styles.publicMessage, styles.divider].join(" ")}
    //           >
    //             /
    //           </span>
    //           <span className={styles.publicMessage}>85.5%</span>
    //         </div>
    //       );
    //     },
    //   },
    //   {
    //     title: "实考人数",
    //     dataIndex: "age",
    //     key: "age",
    //     render: (text, record) => {
    //       return (
    //         <div>
    //           <span className={styles.importMessage}>75.56</span>
    //           <span
    //             className={[styles.publicMessage, styles.divider].join(" ")}
    //           >
    //             /
    //           </span>
    //           <span className={styles.publicMessage}>85.5%</span>
    //         </div>
    //       );
    //     },
    //   },
    //   {
    //     title: "缺考人数",
    //     dataIndex: "address",
    //     key: "address",
    //     width: 200,
    //   },
    //   {
    //     title: "平均分",
    //     dataIndex: "score",
    //     key: "score",
    //   },
    //   {
    //     title: "最高分",
    //     dataIndex: "maxScore",
    //     key: "maxScore",
    //   },
    //   {
    //     title: "最低分",
    //     dataIndex: "minScore",
    //     key: "minScore",
    //   },
    //   {
    //     title: "中位分",
    //     dataIndex: "midScore",
    //     key: "midScore",
    //   },
    // ];
    return (
      <div className={styles.questionTable} id="table2">
        <div className={styles.tableBox}>
          <div className={styles.tableBoxHeader}>
            {/* <span className={styles.tableHeaderSpan}></span> */}
            <span className={styles.tableHeaderTitle}>
              {trans("data.questionDetail", "小题得分分析")}
            </span>
            <span className={styles.viewBox}>
              <span
                onClick={this.changeTab.bind(this, 1)}
                className={[
                  styles.viewTab,
                  check === 1 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.studentView", "按学生看")}
              </span>
              <span
                onClick={this.changeTab.bind(this, 2)}
                className={[
                  styles.viewTab,
                  check === 2 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.classView", "按班级看")}
              </span>
            </span>
            {check === 1 && tableClass && tableClass.length > 0 ? (
              <Select onChange={this.changeClass} value={this.state.groupId}>
                <Option value={0} key={0}>
                  <span>{trans("global.allClass", "全部班级")}</span>
                </Option>
                {tableClass.map((item) => (
                  <Option value={item.groupId} key={item.groupId}>
                    <span>{language ? item.groupName : item.groupEnName}</span>
                  </Option>
                ))}
              </Select>
            ) : null}
            {check === 1 ? (
              <Search
                placeholder={trans("global.searchStu", "搜索学生")}
                allowClear
                value={this.state.stuName}
                onChange={this.changeSearch}
                onSearch={this.onSearch}
                style={{ width: 200 }}
              />
            ) : null}
            {/* <Pagination simple current={this.state.pageNo} total={questionScore.rowTotalNum} showSizeChanger onChange={this.changeNo}/> */}
            <div className={styles.operationS}>
              {this.props.filterStudentListPermissions.haveFilterStudentList ? (
                <span className={styles.nameSwith2}>
                  {trans("global.specifyAnalysis", "指定分析")}
                  <Switch
                    defaultChecked
                    checked={this.state.questionDetailSpecify}
                    onChange={this.courseDetailSpecifyChange}
                    style={{ marginLeft: "4px" }}
                  />
                </span>
              ) : null}

              <a
                href={`${window.location.origin}/api/export/exam/questionScoreAnalyse?examId=${this.props.examId}&groupId=${this.state.groupId}&searchStudentKeyWord=${this.state.stuName}&questionType=1&analyseType=${this.state.check}&filterFlag=${this.state.questionDetailSpecify}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className={styles.exportS}>
                  {trans("global.export", "导出")}
                </span>
              </a>
            </div>
          </div>
          <div
            id="table1"
            className={[
              styles.tableBoxContent,
              styles.tableBoxB,
              questionScore?.columnSet?.length > 7
                ? styles.tableBoxContentX
                : "",
            ].join(" ")}
          >
            <Table
              dataSource={dataSource}
              pagination={false}
              scroll={{ x: 1200 }}
              columns={columns}
            />
          </div>
          <div className={styles.paginations}>
            <Pagination
              size="small"
              pageSize={this.state.pageSize}
              current={this.state.pageNo}
              total={questionScore?.rowTotalNum}
              onChange={this.changeNo}
              showSizeChanger
              showQuickJumper
              onShowSizeChange={this.onShowSizeChange}
              pageSizeOptions={["50", "100", "150", "200"]}
            />
          </div>
        </div>
      </div>
    );
  }
}
export default connect(({ home }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  questionScore: home.questionScore,
}))(GlobalHeader);

import React, { PureComponent } from "react";
import { Input, Select } from "antd";
import { connect } from "dva";

import noTask from "../../assets/noTask.png";
import { locale, trans } from "../../utils/i18n";

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
      stuName: "",
    };
  }
  componentDidMount() {
    this.getPage();
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
        type: "home/clearPartScore",
      })
      .then(() => {
        // this.props.dispatch({
        //   type: "home/getPartScore",
        //   payload: {
        //     examId: this.props.examId,
        //     groupId: this.state.groupId,
        //     // pageNo:this.state.pageNo,
        //     // limit: 10,
        //     searchStudentKeyWord: this.state.stuName,
        //     questionType: 2,
        //     analyseType: this.state.check,
        //   },
        // });
        this.props.dispatch({
          type: "home/getAnswerDetails",
          payload: {
            examId: this.props.examId,
            groupId: this.state.groupId,
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
  render() {
    const {
      currentUser,
      basketList,
      basketSubjectId,
      questionScore,
      tableClass,
      answerDetails,
    } = this.props;
    const { check } = this.state;
    // let newDataSource = [];
    let newColumns = [
      {
        title: trans("analysis.questionIndex", "题号"),
        dataIndex: "questionNo",
        key: "questionNo",
        width: 100,
        render: (text, record, index) => {
          // console.log(text, record, index, "333");
          return (
            <span style={{ color: "rgba(72,145,247)" }}>
              {record.questionNo}
            </span>
          );
        },
      },
      {
        title: trans("global.questionType", "题型"),
        dataIndex: "questionTypeName",
        key: "questionTypeName",
        width: 100,
      },
      {
        title: trans("analysis.questionScore", "分值"),
        dataIndex: "questionScore",
        key: "questionScore",
        width: 100,
      },
      {
        title: trans("analysis.hardValue", "难度"),
        dataIndex: "levelTypeName",
        key: "levelTypeName",
        width: 100,
      },
      {
        title: trans("global.avgScore", "平均分"),
        dataIndex: "averageScore",
        key: "averageScore",
        width: 100,
        // sorter: (a, b) => {
        //   // console.log(a, b, "ccc");
        //   return a.averageScore - b.averageScore;
        // },
      },
      {
        title: trans("analysis.knowLedgeScoreRate", "得分率"),
        dataIndex: "scoreRate",
        key: "scoreRate",
        width: 100,
        sorter: (a, b) => {
          let a1 = a.scoreRate;
          let b1 = b.scoreRate;
          a1 = a1.slice(0, Math.max(0, a1.length - 1));
          b1 = b1.slice(0, Math.max(0, b1.length - 1));
          // console.log(a1, b1, "ccc");
          return a1 - b1;
        },
      },
      {
        title: trans("global.correctAnswersNumber", "答对人数"),
        dataIndex: "answerCorrectStudentNum",
        key: "answerCorrectStudentNum",
        width: 100,
        sorter: (a, b) => {
          let a1 = a.answerCorrectStudentNum;
          let b1 = b.answerCorrectStudentNum;
          a1 = a1.substring(2, a1.length);
          b1 = b1.substring(2, b1.length);
          console.log(a1, b1, "ccc");
          return a1 - b1;
        },
      },
      {
        title: trans("global.errorsNumber", "出错人数"),
        dataIndex: "answerErrorStudentNum",
        key: "answerErrorStudentNum",
        width: 100,
        render: (text, record, index) => {
          // console.log(text, record, index, "333");
          return (
            <>
              {text.map((item) => (
                <div>{item}</div>
              ))}
            </>
          );
        },
      },
      {
        title: trans("global.errorRate", "出错率"),
        dataIndex: "answerErrorStudentRate",
        key: "answerErrorStudentRate",
        width: 100,
        render: (text, record, index) => {
          // console.log(text, record, index, "333");
          return (
            <>
              {text.map((item) => (
                <div>{item}</div>
              ))}
            </>
          );
        },
      },
    ];
    // questionScore.questionAnalyseRowList &&
    //   questionScore.questionAnalyseRowList.length &&
    //   questionScore.questionAnalyseRowList.map((item) => {
    //     let newObj = {
    //       name: this.state.check === 1 ? item.studentName : item.groupName,
    //       enName:
    //         this.state.check === 1
    //           ? item.studentEnName
    //           : item.courseTeacherNames,
    //       key: this.state.check === 1 ? item.studentName : item.groupName,
    //     };
    //     item.questionAnalyseRow &&
    //       item.questionAnalyseRow.map((i) => {
    //         newObj[i.questionId] = i.questionId;
    //         newObj[`${i.questionId}Score`] = i.score;
    //         newObj[`${i.questionId}ScoreRate`] = i.scoreRate;
    //         newObj[`${i.questionId}surePass`] = i.scoreRatePass;
    //       });
    //     newDataSource.push(newObj);
    //   });
    // const dataSource = newDataSource;

    // let newColumns = [
    //   {
    //     title:
    //       this.state.check === 1
    //         ? trans("global.stuName", "学生姓名")
    //         : trans("global.className", "班级名称"),
    //     dataIndex: "name",
    //     key: "name",
    //     width: 150,
    //     fixed: "left",
    //     render: (text, record) => {
    //       return (
    //         <div>
    //           <div className={styles.importMessage}>{record.name}</div>
    //         </div>
    //       );
    //     },
    //   },
    // ];
    // questionScore.columnSet &&
    //   questionScore.columnSet.length &&
    //   questionScore.columnSet.map((item) => {
    //     newColumns.push({
    //       title: () => {
    //         return (
    //           <div>
    //             <div>
    //               <span className={styles.importMessage}>
    //                 {item.questionTitle}
    //               </span>
    //               <i
    //                 className={[
    //                   icon.iconfont,
    //                   styles.publicMessage,
    //                   styles.reportFormIcon,
    //                 ].join(" ")}
    //               >
    //                 &#xe7d3;
    //               </i>
    //               <span className={styles.publicMessage}>
    //                 {item.questionScore}
    //               </span>
    //             </div>
    //             <div>
    //               <span className={styles.publicMessage}>
    //                 {trans("global.yourScore", "得分")}
    //               </span>
    //               <span
    //                 className={[styles.publicMessage, styles.divider].join(" ")}
    //               >
    //                 /
    //               </span>
    //               <span className={styles.publicMessage}>
    //                 {trans("analysis.knowLedgeScoreRate", "得分率")}
    //               </span>
    //             </div>
    //           </div>
    //         );
    //       },
    //       dataIndex: item.questionId,
    //       key: item.questionId,
    //       width: 150,
    //       render: (text, record, index) => {
    //         return (
    //           <div>
    //             <span className={styles.importMessage}>
    //               {record[`${item.questionId}Score`]}
    //             </span>
    //             <span
    //               className={[
    //                 styles.publicMessage,
    //                 styles.divider,
    //                 record[`${item.questionId}surePass`] ? "" : styles.noPass,
    //               ].join(" ")}
    //             >
    //               /
    //             </span>
    //             <span
    //               className={[
    //                 styles.publicMessage,
    //                 record[`${item.questionId}surePass`] ? "" : styles.noPass,
    //               ].join(" ")}
    //             >
    //               {record[`${item.questionId}ScoreRate`]}
    //             </span>
    //           </div>
    //         );
    //       },
    //     });
    //   });
    const columns = newColumns;
    return (
      <div className={styles.questionTable} id="table3">
        <div className={styles.tableBox}>
          <div className={styles.tableBoxHeader}>
            {/* <span className={styles.tableHeaderSpan}></span> */}
            <span className={styles.tableHeaderTitle}>
              {trans("analysis.knowledgeAnalysis", "知识点分析")}
            </span>
            {/* <span className={styles.viewBox}>
              <span
                onClick={this.changeTab.bind(this, 1)}
                className={[
                  styles.viewTab,
                  check === 1 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.listView", "列表视图")}
              </span>
              <span
                onClick={this.changeTab.bind(this, 2)}
                className={[
                  styles.viewTab,
                  check === 2 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.histogram", "柱状图")}
              </span>
            </span> */}
            {/* <span className={styles.viewBox}>
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
            </span> */}
            {/* {check === 1 && tableClass.length ? (
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
            ) : null} */}
            {/* {check === 1 ? (
              <Search
                placeholder={trans("global.searchStu", "搜索学生")}
                allowClear
                value={this.state.stuName}
                onChange={this.changeSearch}
                onSearch={this.onSearch}
                style={{ width: 200 }}
              />
            ) : null} */}
            {/* <Pagination simple current={this.state.pageNo} total={questionScore.rowTotalNum} showSizeChanger onChange={this.changeNo}/> */}
            {/* <a
              href={`${window.location.origin}/api/export/exam/questionScoreAnalyse?examId=${this.props.examId}&groupId=${this.state.groupId}&searchStudentKeyWord=${this.state.stuName}&questionType=2&analyseType=${this.state.check}`}
              target="_blank"
            >
              <span className={styles.export}>
                {trans("global.export", "导出")}
              </span>
            </a> */}
          </div>
          <div id="table1" className={styles.tableBoxContent1}>
            {/* <Table
              dataSource={answerDetails}
              pagination={false}
              scroll={{ x: 1200 }}
              columns={columns}
            /> */}
            <img className={styles.noTask1} src={noTask}></img>
            <div className={styles.leftText}>
              <p>
                {trans(
                  "knowledgeAnalysis.noKnowledgeReasonTitle",
                  "没有获取到试题的知识点，可能是以下原因引起的",
                )}
              </p>
              <p>
                {trans(
                  "knowledgeAnalysis.noUploadedQuestionsReason",
                  "1.试卷的试题没有上传到【测验系统】",
                )}
              </p>
              <p>
                {trans(
                  "knowledgeAnalysis.noMaintainedKnowledgeReason",
                  "2.试题没有维护知识点",
                )}
              </p>
            </div>
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
  answerDetails: home.answerDetails,
}))(GlobalHeader);

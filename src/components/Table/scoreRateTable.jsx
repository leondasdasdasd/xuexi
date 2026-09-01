import React, { PureComponent } from "react";
import { Input, Popover, Select, Table } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

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
      questionId: [],
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
        type: "home/clearScoreRate",
      })
      .then(() => {
        this.props.dispatch({
          type: "home/getScoreRate",
          payload: {
            examId: this.props.examId,
            groupId: this.state.groupId === 0 ? null : this.state.groupId,
            // pageNo:this.state.pageNo,
            // limit: 10,
            searchStudentKeyWord: this.state.stuName,
            analyseType: this.state.check,
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
  getScoreMessage = (stuId, questionId) => {
    this.props.dispatch({
      type: "home/getStuInfo",
      payload: {
        stuList: stuId,
        examId: this.props.examId,
      },
    });
    this.setState({
      questionId,
    });
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
    } = this.props;
    const { check, questionId } = this.state;
    let newDataSource = [];
    questionScore.scoreRateSectionAnalyseRowList &&
      questionScore.scoreRateSectionAnalyseRowList.length &&
      questionScore.scoreRateSectionAnalyseRowList.map((item) => {
        let newObject = {
          name: this.state.check === 1 ? item.studentName : item.groupName,
          enName:
            this.state.check === 1
              ? item.studentEnName
              : item.courseTeacherNames,
          key: this.state.check === 1 ? item.studentName : item.groupName,
        };
        item.scoreRateSectionAnalyseRow &&
          item.scoreRateSectionAnalyseRow.map((index) => {
            newObject[index.missScoreQuestionNum] = index.missScoreQuestionNum;
            newObject[`${index.scoreRateSectionIndex}missNum`] =
              index.missScoreQuestionNum;
            newObject[`${index.scoreRateSectionIndex}studentNum`] =
              index.studentNum;
            newObject[`${index.scoreRateSectionIndex}studentRate`] =
              index.studentRate;
            newObject[`${index.scoreRateSectionIndex}studentIds`] =
              index.studentUserIds;
            newObject[`${index.scoreRateSectionIndex}missScoreQuestionId`] =
              index.missScoreQuestionId;
            newObject[`${index.scoreRateSectionIndex}missScoreQuestionList`] =
              index.missScoreQuestionList;
          });
        newDataSource.push(newObject);
      });
    const dataSource = newDataSource;
    [
      {
        key: "1",
        name: "胡彦斌",
        age: 32,
        address: "西湖区湖底公园1号",
        score: 60,
        maxScore: 98,
        minScore: 40,
        midScore: 53,
      },
      {
        key: "2",
        name: "胡彦祖",
        age: 42,
        address: "西湖区湖底公园1号",
        score: 70,
        maxScore: 96,
        minScore: 52,
        midScore: 75,
      },
    ];

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
    let content = (
      <div className={styles.missScoreBox}>
        <div className={styles.missScoreQuestion}>
          <div className={styles.stuMessageTitle}>
            {trans("global.getScoreQuestion", "得分题目")}
          </div>
          {questionId && questionId.length > 0
            ? questionId.map((item, index) => (
                <div className={styles.rateContent}>
                  <div className={styles.questionTitle}>
                    {item.missScoreQuestionTypeName}:
                  </div>
                  <div className={styles.questionId}>
                    {item.missScoreQuestionIds}
                  </div>
                </div>
              ))
            : null}
        </div>
        {this.state.check === 1 ? null : (
          <div>
            <div className={styles.stuMessageTitle}>
              {trans("global.getScoreStu", "得分学生")}(
              {(this.props.stuInfoList && this.props.stuInfoList.length) || 0})
            </div>
            <div
              className={[
                styles.stuMessageBox,
                this.props.stuInfoList && this.props.stuInfoList.length > 7
                  ? ""
                  : styles.noScorll,
              ].join(" ")}
            >
              {this.props.stuInfoList && this.props.stuInfoList.length > 0
                ? this.props.stuInfoList.map((item) => (
                    <div className={styles.stuMessage}>
                      <div className={styles.imgBox}>
                        <img src={item.avatarUrl} />
                      </div>
                      <div className={styles.stuName}>{item.name}</div>
                    </div>
                  ))
                : null}
            </div>
          </div>
        )}
      </div>
    );
    questionScore.columnSet &&
      questionScore.columnSet.length &&
      questionScore.columnSet.map((item) => {
        newColumns.push({
          title: () => {
            return (
              <div>
                <div>
                  <span className={styles.importMessage}>
                    {item.scoreRateSectionTitle}
                  </span>
                </div>
                {this.state.check == 1 ? (
                  <div>
                    <span className={styles.publicMessage}>
                      {trans("global.numberOfScoringQuestions", "得分题数")}
                    </span>
                    <span
                      className={[styles.publicMessage, styles.divider].join(
                        " ",
                      )}
                    >
                      /
                    </span>
                    <span className={styles.publicMessage}>
                      {trans("global.proportionOfTotalScore", "总分占比")}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className={styles.publicMessage}>
                      {trans("global.numberOfScoringQuestions", "得分题数")}
                    </span>
                    <span
                      className={[styles.publicMessage, styles.divider].join(
                        " ",
                      )}
                    >
                      /
                    </span>
                    <span className={styles.publicMessage}>
                      {trans("global.numberOfPeople", "人数")}
                    </span>
                    <span
                      className={[styles.publicMessage, styles.divider].join(
                        " ",
                      )}
                    >
                      /
                    </span>
                    <span className={styles.publicMessage}>
                      {trans("global.proportion", "占比")}
                    </span>
                  </div>
                )}
              </div>
            );
          },
          dataIndex: item.scoreRateSectionIndex,
          key: item.scoreRateSectionIndex,
          width: 170,
          render: (text, record, index) => {
            return this.state.check === 1 ? (
              <div>
                {record[`${item.scoreRateSectionIndex}missNum`] ? (
                  <Popover
                    content={content}
                    title={null}
                    getPopupContainer={false}
                  >
                    <div
                      className={styles.rateScoreTd}
                      onMouseEnter={this.getScoreMessage.bind(
                        this,
                        record[`${item.scoreRateSectionIndex}studentIds`],
                        record[
                          `${item.scoreRateSectionIndex}missScoreQuestionList`
                        ],
                      )}
                    >
                      {/* <span className={styles.importMessage}>
                              {
                                record[`${item.scoreRateSectionIndex}missScoreQuestionId`] && record[`${item.scoreRateSectionIndex}missScoreQuestionId`].length ? 
                                record[`${item.scoreRateSectionIndex}missScoreQuestionId`].map((i, ind) => (
                                  <span>{i}{ind + 1 < record[`${item.scoreRateSectionIndex}missScoreQuestionId`].length ? ', ' : ''}</span>
                                  
                                )) : null
                              }
                            </span>     */}
                      <span
                        className={[styles.importMessage, styles.inline].join(
                          " ",
                        )}
                      >
                        {record[`${item.scoreRateSectionIndex}missNum`]}
                      </span>
                      <span
                        className={[
                          styles.publicMessage,
                          styles.divider,
                          styles.inline,
                        ].join(" ")}
                      >
                        /
                      </span>
                      <span
                        className={[styles.publicMessage, styles.inline].join(
                          " ",
                        )}
                      >
                        {record[`${item.scoreRateSectionIndex}studentRate`]}
                      </span>
                    </div>
                  </Popover>
                ) : (
                  <div
                    className={styles.rateScoreTd}
                    onMouseEnter={this.getScoreMessage.bind(
                      this,
                      record[`${item.scoreRateSectionIndex}studentIds`],
                      record[
                        `${item.scoreRateSectionIndex}missScoreQuestionList`
                      ],
                    )}
                  >
                    {/* <span className={styles.importMessage}>
                              {
                                record[`${item.scoreRateSectionIndex}missScoreQuestionId`] && record[`${item.scoreRateSectionIndex}missScoreQuestionId`].length ? 
                                record[`${item.scoreRateSectionIndex}missScoreQuestionId`].map((i, ind) => (
                                  <span>{i}{ind + 1 < record[`${item.scoreRateSectionIndex}missScoreQuestionId`].length ? ', ' : ''}</span>
                                  
                                )) : null
                              }
                            </span>     */}
                    <span
                      className={[styles.importMessage, styles.inline].join(
                        " ",
                      )}
                    >
                      {record[`${item.scoreRateSectionIndex}missNum`]}
                    </span>
                    <span
                      className={[
                        styles.publicMessage,
                        styles.divider,
                        styles.inline,
                      ].join(" ")}
                    >
                      /
                    </span>
                    <span
                      className={[styles.publicMessage, styles.inline].join(
                        " ",
                      )}
                    >
                      {record[`${item.scoreRateSectionIndex}studentRate`]}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <Popover content={content} title={null} getPopupContainer={false}>
                <div
                  className={styles.rateScoreTd}
                  onMouseEnter={this.getScoreMessage.bind(
                    this,
                    record[`${item.scoreRateSectionIndex}studentIds`],
                    record[
                      `${item.scoreRateSectionIndex}missScoreQuestionList`
                    ],
                  )}
                >
                  <span
                    className={[styles.importMessage, styles.inline].join(" ")}
                  >
                    {record[`${item.scoreRateSectionIndex}missNum`]}
                  </span>
                  <span
                    className={[
                      styles.publicMessage,
                      styles.divider,
                      styles.inline,
                    ].join(" ")}
                  >
                    /
                  </span>
                  <span
                    className={[styles.publicMessage, styles.inline].join(" ")}
                  >
                    {record[`${item.scoreRateSectionIndex}studentNum`]}
                  </span>
                  <span
                    className={[
                      styles.publicMessage,
                      styles.divider,
                      styles.inline,
                    ].join(" ")}
                  >
                    /
                  </span>
                  <span
                    className={[styles.publicMessage, styles.inline].join(" ")}
                  >
                    {record[`${item.scoreRateSectionIndex}studentRate`]}
                  </span>
                </div>
              </Popover>
            );
          },
        });
      });
    const columns = newColumns;

    return (
      <div
        className={[
          styles.questionTabl,
          check === 1 ? styles.noSummary : "",
        ].join(" ")}
        id="table2"
      >
        <div className={styles.tableBox}>
          <div className={styles.tableBoxHeader}>
            {/* <span className={styles.tableHeaderSpan}></span> */}
            <span className={styles.tableHeaderTitle}>
              {trans("data.scoreRateSegmentation", "小题得分分析")}
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
                    <span>{item.groupName}</span>
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
            <a
              href={`${window.location.origin}/api/export/exam/analyseScoreRateSectionGroupAsRow?examId=${this.props.examId}&groupId=${this.state.groupId}&analyseType=${this.state.check}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className={styles.export}>
                {trans("global.export", "导出")}
              </span>
            </a>
          </div>
          <div
            id="table1"
            className={[styles.tableBoxContent, styles.rateTable].join(" ")}
          >
            <Table
              dataSource={dataSource}
              pagination={false}
              scroll={{ x: 1200 }}
              columns={columns}
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
}))(GlobalHeader);

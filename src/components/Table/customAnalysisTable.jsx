import React, { PureComponent } from "react";
import { Input, Select, Switch, Table } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";

import styles from "./index.module.less";

const { Search } = Input;
const { Option } = Select;
const { Column } = Table;

class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 1,
      groupId: 0,
      pageNo: 1,
      stuName: "",
      fileId: null,
      isKnowledgeLiteracy: false, // 导入知识素养
      literacyFail: false,
      titleId: "",
      elevatorIndex: 0,
      dataSourceObj: {},
      newDimensionAnalysisSpecify: false,
    };
  }
  componentDidMount() {
    console.log("组件：customAnalysisTable componentDidMount", "");

    // console.log(this.props.paperId, "ppp");
    this.props.dispatch({
      type: "home/getClass",
      payload: {
        examId: this.props.examId,
      },
      callback: (response) => {
        if (response.status) {
          const data = response.content;
          let temporaryGroupId = null;
          temporaryGroupId = data && data.length > 0 ? data[0].groupId : 0;
          this.setState(
            {
              groupId: temporaryGroupId,
            },
            () => {
              this.getPage();
              this.props.getPageOne(this.getPage);
            },
          );
        }
      },
    });
  }
  changeClass = (value) => {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
        dataSourceObj: {},
      },
      () => {
        this.getPage();
      },
    );
  };
  getPage = (check) => {
    const { ind } = this.props;
    const { dataSourceObj } = this.state;
    let newDataSource = JSON.parse(JSON.stringify(dataSourceObj));
    newDataSource[`${ind}`] = {};
    this.props
      .dispatch({
        type: "home/clearKnowLedgeAnalysis",
      })
      .then(() => {
        this.props
          .dispatch({
            type: "home/getKnowLedgeTable",
            payload: {
              filterFlag: this.state.newDimensionAnalysisSpecify,
              examId: this.props.examId,
              groupId: this.state.groupId,
              studentName: this.state.stuName || "",
              type: this.props.newDimensionAnalysis || "",
              analyseType: check || this.state.check,
            },
          })
          .then(() => {
            const { knowLedgeAnalysis } = this.props;
            newDataSource[`${ind}`] = knowLedgeAnalysis;
            this.setState({
              dataSourceObj: newDataSource,
            });
          });
      });
  };
  onSearch = (value) => {
    this.setState({
      dataSourceObj: {},
    });
    this.getPage();
  };
  changeSearch = (e) => {
    this.setState({
      stuName: e.target.value,
    });
  };
  changeTab = (check) => {
    // if (
    //   this.props.dimensionAnalysisList[this.props.ind] ===
    //   this.props.newDimensionAnalysis
    // ) {
    //   console.log("sss", this.props.dimensionAnalysisList[this.props.ind]);
    //   this.getPage(check);
    // }
    this.setState({
      dataSourceObj: {},
    });
    this.getPage(check);
    this.setState(
      {
        check,
        pageNo: 1,
      },
      () => {},
    );
  };
  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        newDimensionAnalysisSpecify: checked,
      },
      () => {
        this.props.accomplishmentChange(this.props.ind, checked);
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
      dimensionAnalysis,
      knowLedgeAnalysis,
      ind,
    } = this.props;
    const { dataSourceObj } = this.state;
    const { check, titleId } = this.state;
    let newDataSource = [];
    let tableDataSource = dataSourceObj[`${ind}`] || {};
    const url =
      check === 1
        ? `${window.location.origin}/api/exam/export/qualityIndicatorReportWithStudent?examId=${this.props.examId}&groupId=${this.state.groupId}&studentName=${this.state.stuName}&type=${this.props.newDimensionAnalysis}&filterFlag=${this.state.newDimensionAnalysisSpecify}`
        : `${window.location.origin}/api/exam/export/qualityIndicatorReportWithGroup?examId=${this.props.examId}&type=${this.props.newDimensionAnalysis}&filterFlag=${this.state.newDimensionAnalysisSpecify}`;
    tableDataSource &&
      tableDataSource.qualityIndicatorData &&
      tableDataSource.qualityIndicatorData.length &&
      tableDataSource.qualityIndicatorData.map((item, ind) => {
        let newObject = {
          name: this.state.check === 1 ? item.studentName : item.groupName,
          enName:
            this.state.check === 1
              ? item.studentEnName
              : item.courseTeacherNames || "",
          key: this.state.check === 1 ? item.studentName : item.groupName,
        };
        newObject.sort = ind + 1;
        item.columnDataModelList &&
          item.columnDataModelList.map((index) => {
            newObject[index.index] = index.index;
            newObject[`${index.index}Score`] = index.average;
            newObject[`${index.index}ScoreRate`] = index.averageRate;
            newObject[`${index.index}surePass`] = index.scoreRatePass;
          });
        newDataSource.push(newObject);
      });
    // const dataSource = newDataSource;

    let newColumns = [
      {
        title: trans("global.order", "序号"),
        dataIndex: "sort",
        key: "sort",
        width: 60,
        fixed: "left",
        render: (text, record) => {
          return (
            <div>
              <div className={styles.importMessage}>{record.sort}</div>
            </div>
          );
        },
      },
    ];
    tableDataSource &&
      tableDataSource.columnSet &&
      tableDataSource.columnSet.length &&
      tableDataSource.columnSet.map((item, ind) => {
        newColumns.push({
          title: () => {
            return ind === 0 ? (
              <div>{item.columnName}</div>
            ) : (
              <div>
                <div>
                  <span className={styles.importMessage}>
                    {item.columnName}
                  </span>
                  {/* <i className={[icon.iconfont, styles.publicMessage, styles.reportFormIcon].join(' ')}>&#xe7d3;</i>
                              <span className={styles.publicMessage}>{item.questionScore}</span> */}
                </div>
                <div>
                  <span className={styles.publicMessage}>
                    {trans("global.avgScore", "平均分")}
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
          dataIndex: item.index,
          key: item.index,
          width: 150,
          fixed: ind === 0 ? "left" : null,
          render: (text, record, index) => {
            let txt = record[`${item.index}ScoreRate`]?.slice(
              0,
              Math.max(0, record[`${item.index}ScoreRate`].length - 1),
            );
            return ind === 0 ? (
              <div>{record.name}</div>
            ) : (
              <div>
                <span className={styles.importMessage}>
                  {record[`${item.index}Score`]}
                </span>
                <span
                  className={[styles.publicMessage, styles.divider].join(" ")}
                >
                  /
                </span>
                <span
                  className={[
                    styles.publicMessage,
                    comparePercentages(
                      record[`${item.index}ScoreRate`],
                      newDataSource[0][`${item.index}ScoreRate`],
                    ) == -1
                      ? styles.noPass
                      : "",
                  ].join(" ")}
                >
                  {record[`${item.index}ScoreRate`]}
                </span>
              </div>
            );
          },
        });
      });
    newColumns.push({
      title: "",
    });

    const columns = newColumns;
    let tableKey = Date.now();
    // console.log("www", newDataSource);
    return (
      <div className={styles.tableLIst} id={this.props.id}>
        <div className={[styles.tableBox, styles.customAnalysis].join(" ")}>
          <div className={styles.tableBoxHeader}>
            {/* <span className={styles.tableHeaderSpan}></span> */}
            <span className={styles.tableHeaderTitle}>
              {/* {trans("global.konwLedgeAnalysis", "知识能力分析")} */}
              {this.props.newDimensionAnalysis}
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
            <div className={styles.operationS}>
              {this.props.filterStudentListPermissions.haveFilterStudentList ? (
                <span className={styles.nameSwith2}>
                  {trans("global.specifyAnalysis", "指定分析")}
                  <Switch
                    defaultChecked
                    checked={this.state.newDimensionAnalysisSpecify}
                    onChange={this.courseDetailSpecifyChange}
                    style={{ marginLeft: "4px" }}
                  />
                </span>
              ) : null}

              <a href={url} target="_blank" rel="noreferrer">
                <span className={styles.exportS}>
                  {trans("global.export", "导出")}
                </span>
              </a>
            </div>
          </div>
          <div
            className={[
              styles.tableBoxContent,
              styles.tableBoxContent3,
              tableDataSource?.columnSet?.length > 6
                ? styles.tableBoxContentX
                : "",
            ].join(" ")}
          >
            <Table
              dataSource={newDataSource}
              pagination={false}
              scroll={{ x: 800 }}
              columns={columns}
              key={tableKey}
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
  tableClass: home.tableClass,
  knowLedgeAnalysis: home.knowLedgeAnalysis,
  attainmentTest: home.attainmentTest,
  dimensionAnalysis: home.dimensionAnalysis,
}))(GlobalHeader);

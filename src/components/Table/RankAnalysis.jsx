import React, { PureComponent } from "react";
import { Input, message, Pagination, Select, Switch, Table } from "antd";
import { connect } from "dva";

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
      ratioId: 0,
      rankAnalysisSpecify: false,
      pageSize: 100,
    };
  }
  componentDidMount() {
    // this.props.getClass()
    this.props
      .dispatch({
        type: "home/getExamSelect",
        payload: {
          subjectId: this.props.subjectId,
          examId: this.props.examId,
        },
      })
      .then(() => {
        this.setState(
          {
            ratioId: this.props.examSelect[0]?.examId || 0,
          },
          () => {
            this.props.dispatch({
              type: "home/getStuGrade",
              payload: {
                examId: this.props.examId,
              },
              callback: (res) => {
                if (res.status) {
                  const data = res.content;
                  let temporaryGroupId = 0;
                  if (data && data.length > 0) {
                    temporaryGroupId = data[0].groupId;
                  }
                  this.setState(
                    {
                      groupId: temporaryGroupId,
                    },
                    () => {
                      this.getPage();
                    },
                  );
                } else {
                  message.error(res.message);
                }
              },
            });
          },
        );
      });
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
    this.props.dispatch({
      type: "home/postComparativeAnalysis",
      payload: {
        examId: this.props.examId,
        comparativeExamId: this.state.ratioId == 0 ? null : this.state.ratioId,
        groupId: this.state.groupId == 0 ? null : this.state.groupId,
        studentName: this.state.stuName,
        pageNo: this.state.pageNo,
        limit: this.state.pageSize,
        positiveOrder: false,
        filterFlag: this.state.rankAnalysisSpecify,
      },
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
  changeCompareTest = (value) => {
    this.setState(
      {
        ratioId: value,
      },
      () => {
        this.getPage();
      },
    );
  };
  changeGrade = (value) => {
    this.setState(
      {
        groupId: value,
      },
      () => {
        this.getPage();
      },
    );
  };
  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        rankAnalysisSpecify: checked,
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
    const { comparativeAnalysis, examSelect, stuGradeList } = this.props;
    const { check } = this.state;
    let newDataSource = [];
    if (
      comparativeAnalysis &&
      comparativeAnalysis.singleComparativeResultModelList &&
      comparativeAnalysis.singleComparativeResultModelList.length > 0
    ) {
      comparativeAnalysis.singleComparativeResultModelList.map(
        (item, index) => {
          newDataSource.push({
            key: item.studentUserId,
            comparativeExamScoreRate: item.comparativeExamScoreRate,
            comparativeGradeRanking: item.comparativeGradeRanking,
            examScoreRate: item.examScoreRate,
            gradeRanking: item.gradeRanking,
            groupId: item.groupId,
            groupName: locale() === "en" ? item.groupEnName : item.groupName,
            rankChanges: item.rankChanges,
            scoreChangesRate: item.scoreChangesRate,
            studentName:
              locale() === "en" ? item.studentEnName : item.studentName,
            index: index + 1,
          });
        },
      );
    }

    const dataSource = newDataSource;

    let newColumns = [
      {
        title: trans("global.order", "序号"),
        dataIndex: "index",
        key: "index",
        width: 60,
      },
      {
        title: trans("global.student", "学生"),
        dataIndex: "studentName",
        key: "studentName",
        width: 90,
      },
      {
        title: trans("global.intoClass", "所在班级"),
        dataIndex: "groupName",
        key: "groupName",
        width: 150,
      },
      {
        title: comparativeAnalysis?.examInfoTitle || "",
        dataIndex: "examScoreRate",
        key: "examScoreRate",
        width: 200,
      },
      {
        title: trans("global.gradeRanking", "年级排名"),
        dataIndex: "gradeRanking",
        key: "gradeRanking",
        width: 100,
      },
      {
        title: comparativeAnalysis?.comparativeExamInfoTitle || "",
        dataIndex: "comparativeExamScoreRate",
        key: "comparativeExamScoreRate",
        width: 200,
      },
      {
        title: trans("global.gradeRanking", "年级排名"),
        dataIndex: "comparativeGradeRanking",
        key: "comparativeGradeRanking",
        width: 100,
      },
      {
        title: trans("global.scoreChange", "分数变化"),
        dataIndex: "scoreChangesRate",
        key: "scoreChangesRate",
        width: 100,
        render: (text, record) => {
          // 规范展示规则：
          // 1. 为 null 或空串 => 显示 "--"
          // 2. 为字符串 "0" => 显示 "0"
          // 3. 其他情况 => 原样展示数据本身
          if (
            text === null ||
            text === undefined ||
            text === "" ||
            text === "--"
          ) {
            return <span>--</span>;
          }

          if (typeof text === "string") {
            // 按数值正负设置颜色（支持 "+10%" / "-10%" 等），但不改动原始展示内容
            const number_ = Number.parseFloat(text.replace("%", ""));
            let color;
            if (!isNaN(number_)) {
              if (number_ >= 0) {
                color = "#04C919";
              } else if (number_ < 0) {
                color = "#FC491E";
              }
            }
            return <span style={{ color }}>{text}</span>;
          }
        },
      },
      {
        title: trans("global.rankingChange", "排名变化"),
        dataIndex: "rankChanges",
        key: "rankChanges",
        width: 100,
        render: (text, record) => {
          let cor = "";
          if (text > 0) {
            cor = "red";
          } else if (text == 0) {
            cor = "#999";
          } else {
            cor = "green";
          }
          return (
            <span
              style={{
                color: cor,
              }}
            >
              {text}
            </span>
          );
        },
      },
    ];
    newColumns.push({
      title: "",
    });
    const columns = newColumns;

    return (
      <div className={styles.questionTable} id="table4">
        <div className={styles.tableBox}>
          <div className={styles.tableBoxHeader}>
            <span className={styles.tableHeaderTitle}>
              {trans("data.rankAnalysis", "排名分析")}
            </span>
            <Select
              onChange={this.changeCompareTest}
              value={this.state.ratioId}
              placeholder={trans("global.chooseTest", "选择对比的试卷")}
              style={{ marginLeft: "0px", width: "400px" }}
            >
              <Option value={0} key={0}>
                {trans("global.chooseTest", "选择对比的试卷")}
              </Option>
              {examSelect && examSelect.length > 0
                ? examSelect.map((item) => (
                    <Option value={item.examId} key={item.examName}>
                      <span title={item.examName}>
                        {language ? item.examName : item.examName}
                      </span>
                    </Option>
                  ))
                : null}
            </Select>
            <span className={styles.inline}>
              <Select onChange={this.changeGrade} value={this.state.groupId}>
                <Option value={0} key={0}>
                  {trans("global.allClass", "全部班级")}
                </Option>
                {stuGradeList && stuGradeList.length > 0
                  ? stuGradeList.map((item, index) => (
                      <Option value={item.groupId} key={index + 1}>
                        {language ? item.groupName : item.groupEName}
                      </Option>
                    ))
                  : null}
              </Select>
            </span>
            <Search
              placeholder={trans("global.searchStu", "搜索学生")}
              allowClear
              value={this.state.stuName}
              onChange={this.changeSearch}
              onSearch={this.onSearch}
              style={{ width: 200 }}
            />
            {/* <Pagination simple current={this.state.pageNo} total={questionScore.rowTotalNum} showSizeChanger onChange={this.changeNo}/> */}
            <div className={styles.operationS}>
              {this.props.filterStudentListPermissions.haveFilterStudentList ? (
                <span className={styles.nameSwith2}>
                  {trans("global.specifyAnalysis", "指定分析")}
                  <Switch
                    defaultChecked
                    checked={this.state.rankAnalysisSpecify}
                    onChange={this.courseDetailSpecifyChange}
                    style={{ marginLeft: "4px" }}
                  />
                </span>
              ) : null}

              <a
                href={`${
                  window.location.origin
                }/api/trendComparativeAnalysis/comparativeAnalysisExport?examId=${
                  this.props.examId
                }&groupId=${
                  this.state.groupId == 0 ? "" : this.state.groupId
                }&studentName=${this.state.stuName}&comparativeExamId=${
                  this.state.ratioId == 0 ? "" : this.state.ratioId
                }&positiveOrder=false&languageCode=${
                  language ? "cn" : "en"
                }&filterFlag=${this.state.rankAnalysisSpecify}`}
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
            id="table4"
            className={[styles.tableBoxContent, styles.tableBoxB].join(" ")}
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
              total={comparativeAnalysis.studentTotalNum}
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
  compareTest: home.compareTest,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  comparativeAnalysis: home.comparativeAnalysis,
  examSelect: home.examSelect,
  stuGradeList: home.stuGradeList,
}))(GlobalHeader);

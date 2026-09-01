import React, { PureComponent } from "react";
import { Table } from "antd";
import { connect } from "dva";
import * as echarts from "echarts";

import svg from "../../../../assets/订正.svg";
import { trans } from "../../../../utils/i18n";
import { comparePercentages } from "../../../../utils/utils";

import icon from "../../../../icon.module.less";
import styles from "./studentScoreCanvas.module.less";
const COLOR = [
  "#3d94ff",
  "#12CC67",
  "#FFE030",
  "#FC7D7D",
  "#4BE4E7",
  "#19A978",
  "#FF9451",
  "#B169EB",
  "#E286D2",
  "#3D82D6",
  "#CC8C47",
  "#B0CAFF",
  "#CE6C6C",
  "#C0DF35",
  "#D4B589",
  "#C1C1C1",
];
class StudentScoreCanvas extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      groupId: undefined,
      pageNo: 1,
      pageSize: 30,
      stuName: "",
      correction: false,
      nameChecked: true,
      averageChecked: true,
      showStuScore: true,
      stuScoreSpecify: false,
      imgSize: 1,
      studentList: [],
      studentUserId: undefined,
    };
  }
  componentDidMount() {
    this.setState(
      {
        groupId: this.props.groupId,
      },
      () => {
        this.getPage();
        this.renderScoreChart();
      },
    );
  }

  getPage = () => {
    this.props.dispatch({
      type: "home/getStuScore",
      payload: {
        examId: this.props.examId,
        groupId: this.props.groupId,
        pageNo: this.state.check == 1 ? this.state.pageNo : 1,
        limit: this.state.check == 1 ? this.state.pageSize : 1000,
        searchStudentKeyWord: this.state.stuName,
        scoreCorrectionType: this.state.correction === false ? 0 : 1,
        isSort: this.state.check == 1 ? true : false,
        filterFlag: this.state.stuScoreSpecify,
      },
    });
  };

  renderScoreChart = () => {
    this.props
      .dispatch({
        type: "home/getStuScore",
        payload: {
          examId: this.props.examId,
          groupId: this.props.groupId,
          pageNo: 1,
          limit: 1000,
          searchStudentKeyWord: this.state.stuName,
          scoreCorrectionType: this.state.correction === false ? 0 : 1,
          isSort: this.state.check == 1 ? true : false,
          filterFlag: this.state.stuScoreSpecify,
        },
      })
      .then(() => {
        const { stuScore } = this.props;
        let newData = [];
        if (stuScore.examResultList && stuScore.examResultList.length > 0) {
          stuScore.examResultList.map((item, index) => {
            if (index == 0) return;
            let newObject = {
              studentName: item.studentName,
              studentScore: item.studentScore,
            };
            newData.push(newObject);
          });
        }
        let chartDom = document.querySelector("#studentScoreDom");
        let myChart = echarts.init(chartDom);
        let option = {
          xAxis: {
            type: "category",
            data: newData.map((item) => item.studentName),
            axisLabel: {
              interval: 0, // 强制显示所有标签
              fontSize: 12,
              rotate: -20,
            },
          },
          grid: {
            right: "3%",
            left: "3%",
            bottom: "10%",
            top: "8%",
          },
          yAxis: {
            type: "value",
            splitLine: {
              show: true,
              lineStyle: {
                type: "dashed",
              },
            },
          },
          series: [
            {
              data: newData.map((item, index) => ({
                value: item.studentScore,
                itemStyle: {
                  color:
                    index >= COLOR.length
                      ? COLOR[index % COLOR.length]
                      : COLOR[index],
                },
              })),
              label: {
                show: true,
                position: "top",
              },
              type: "bar",
              markLine: {
                label: {
                  position: "insideStartTop",
                },
                data: [
                  {
                    type: "average",
                    name: "平均分",
                    label: {
                      formatter: "平均分{c}",
                    },
                  },
                ],
                silent: true,
              },
            },
          ],
        };
        option && myChart.setOption(option);
      });
  };

  render() {
    const { questionScore } = this.props;
    let newDataSource = [];
    questionScore?.examResultList &&
      questionScore.examResultList.length &&
      questionScore.examResultList.map((item, index) => {
        if (index > 6) return;
        let newObject = {
          name: item.studentName,
          eName: item.studentEnName,
          score: item.studentScore,
          id: item.studentUserId,
          no: item.studnetNo,
          hasScoreCorrectionStatus: item.hasScoreCorrectionStatus,
          studentExamPaperUrl: item.studentExamPaperUrl,
          avator: item.avatarUrl || "",
          sex: item.sex || 0,
          studentNo: item.studentNo,
        };
        newDataSource.push(newObject);
      });
    const dataSource = newDataSource;

    let newColumns = [];
    questionScore.columnSet &&
      questionScore.columnSet.length &&
      questionScore.columnSet.map((item) => {
        newColumns.push({
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
          render: (text, record, index) => {
            console.log(record, index, item.questionId, "rr");
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
                <span className={styles.publicMessage}>
                  {record[`${item.questionId}ScoreRate`]}
                </span>
              </div>
            );
          },
        });
      });
    const columns = [
      {
        title: trans("global.stuName", "学生姓名"),
        dataIndex: "name",
        key: "name",
        width: 300,
        render: (text, record, index) => {
          return (
            <div>
              <span className={styles.inline}>
                <div className={styles.importMessage}>
                  <span>{record.name}</span>
                  <span>&nbsp;&nbsp;</span>
                  <span>{record.eName}</span>
                </div>
              </span>
            </div>
          );
        },
      },
      {
        title: trans("global.studentNumber", "学号"),
        dataIndex: "studentNo",
        key: "studentNo",
        width: 150,
      },
      {
        title: (sortOrder, sortColumn, filters) => {
          console.log(sortOrder, sortColumn, filters, "11");
          return (
            <div>
              <span>
                <span className={styles.importMessage}>
                  {trans("global.yourScore", "得分")}
                </span>
              </span>
              <span>
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
                  {questionScore.examTotalScore}
                </span>
              </span>
            </div>
          );
        },
        dataIndex: "score",
        key: "score",
        width: 150,
        render: (text, record) => {
          return (
            <div
              className={`${styles.importMessage} ${comparePercentages(text, newDataSource[0]?.score) == -1 ? styles.noPass : ""}`}
            >
              {record.score}{" "}
              {record.hasScoreCorrectionStatus ? (
                <img
                  src={svg}
                  type="message"
                  style={{ color: "#ccc", margin: "5px" }}
                  onMouseOver={() => this.clickReductionHistory(record.id)}
                />
              ) : null}
            </div>
          );
        },
      },
    ];
    return (
      <div
        className={styles.stuScoreOutBox}
        id="studentScore_component"
        style={{ padding: "0" }}
      >
        <div
          style={{
            fontSize: "16px",
            color: "#01113D",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          {trans("global.stuScore", "学生得分")}
        </div>
        <Table
          dataSource={dataSource}
          pagination={false}
          columns={columns}
          onChange={this.handleTableChange}
        />
        <div id="studentScoreDom" style={{ width: "100%", height: "300px" }}>
          {" "}
        </div>
      </div>
    );
  }
}
export default connect(({ home }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  reductionHistory: home.reductionHistory,
  stuScore: home.stuScore,
  tableClass: home.tableClass,
  stuGradeList: home.stuGradeList,
}))(StudentScoreCanvas);

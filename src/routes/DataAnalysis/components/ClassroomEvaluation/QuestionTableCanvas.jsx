import React, { PureComponent } from "react";
import { Table } from "antd";
import { connect } from "dva";
import * as echarts from "echarts";

import { locale, trans } from "../../../../utils/i18n";
import { comparePercentages } from "../../../../utils/utils";

import styles from "./index.module.less";

const language = locale() == "en" ? false : true;

class QuestionTableCanvas extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 2,
      pageNo: 1,
      stuName: "",
      open: true,
      dataLabels: false,
      topicClassComparisonSpecify: false,
    };
  }
  componentDidMount() {
    this.getPage();
    this.props
      .dispatch({
        type: "home/getGroupContrast",
        payload: {
          examId: this.props.examId,
          filterFlag: this.state.topicClassComparisonSpecify,
          groupId: this.props.groupId ? this.props.groupId : "",
        },
      })
      .then((res) => {
        this.renderTopiChart();
      });
  }

  getPage = () => {
    this.props.dispatch({
      type: "home/clearQuestionScore",
    });
  };

  renderTopiChart = () => {
    document
      .querySelector("#questionTable_chartBox_canvas")
      .setAttribute("_echarts_instance_", "");
    let newData = [];
    let classArray = [];
    let seriesArray = [];
    const { groupContrast } = this.props;
    groupContrast.columnList &&
      groupContrast.columnList[0] &&
      groupContrast.columnList[0].averageScoreRateModelList &&
      groupContrast.columnList[0].averageScoreRateModelList.length &&
      groupContrast.columnList[0].averageScoreRateModelList.map((item) => {
        seriesArray.push({
          name: item.columnName,
          type: "line",
          data: [],
          emphasis: {
            focus: "series",
          },
          label: {
            show: this.state.dataLabels ? true : false,
            position: "bottom",
            textStyle: {
              fontSize: 10,
            },
            formatter: function (parameters) {
              return parameters.value + "%";
            },
          },
        });
        classArray.push(item.columnName);
      });

    let xArray = [];

    groupContrast.dataList &&
      groupContrast.dataList.length &&
      groupContrast.dataList.map((item) => {
        xArray.push(item.showQuestionNumber);

        item.averageScoreRateModelList &&
          item.averageScoreRateModelList.length &&
          item.averageScoreRateModelList.map((it, index) => {
            seriesArray[index].data.push({
              value:
                it.scoreRate.slice(0, Math.max(0, it.scoreRate.length - 1)) - 0,
              name: item.showQuestionNumber,
            });

            let newObject = {
              showQuestionNumber: "题目" + item.showQuestionNumber,
              classN: classArray[index],
              scoreRate:
                it.scoreRate.slice(0, Math.max(0, it.scoreRate.length - 1)) - 0,
            };
            newData.push(newObject);
          });
      });

    let myChart = echarts.init(
      document.querySelector("#questionTable_chartBox_canvas"),
    );

    // 监听加载完成事件
    myChart.on("finished", () => {
      console.log("ECharts 图表加载完成！");
      this.props.onDidMount && this.props.onDidMount();
    });

    const option = {
      tooltip: {
        trigger: "axis",
        formatter: function (parameters) {
          var string_ = "题目" + parameters[0].name + "<br>";
          for (let item of parameters) {
            string_ += `<div style="display: flex; justify-content: space-between;width: 180px;"><span>${item.seriesName}</span><span>${item.value}%</span></div>`;
          }
          return string_;
        },
      },
      legend: {
        data: classArray,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      color: [
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
      ],
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: xArray,
      },
      yAxis: {
        // type: "value",
        max: "dataMax",
        axisLabel: {
          formatter: (value) => {
            return value + "%";
          },
        },
      },
      series: seriesArray,
    };
    myChart.setOption(option);
  };

  render() {
    const { groupContrast } = this.props;
    let newDataSource = [];
    groupContrast.dataList &&
      groupContrast.dataList.length &&
      groupContrast.dataList.map((item) => {
        let newObject = {
          showQuestionNumber: item.showQuestionNumber,
          questionScore: item.questionScore,
          questionTypeName: item.questionTypeName,
          levelTypeName: item.levelTypeName,
          questionId: item.questionId,
        };
        item.averageScoreRateModelList &&
          item.averageScoreRateModelList.length &&
          item.averageScoreRateModelList.map((it) => {
            newObject[`${it.index}average`] = it.average;
            newObject[`${it.index}scoreRate`] = it.scoreRate;
          });
        newDataSource.push(newObject);
      });
    const dataSource = newDataSource;
    let newColumns = [
      {
        title: trans("global.order", "题号"),
        dataIndex: "showQuestionNumber",
        key: "showQuestionNumber",
        width: 110,
        sorter: (a, b) => {
          return a.questionNo - b.questionNo;
        },
        render: (text, record, index) => {
          return (
            <>
              <span
                onClick={() => this.testClick(record.questionId)}
                style={{ cursor: "pointer" }}
                className={styles.testIndex}
              >
                {record.showQuestionNumber}
              </span>
            </>
          );
        },
      },
      {
        title: trans("global.questionType", "题型"),
        dataIndex: "questionTypeName",
        key: "questionTypeName",
        width: 80,
      },
      {
        title: trans("analysis.questionScore", "分值"),
        dataIndex: "questionScore",
        key: "questionScore",
        width: 80,
      },
    ];
    groupContrast.columnList &&
      groupContrast.columnList[0].averageScoreRateModelList &&
      groupContrast.columnList[0].averageScoreRateModelList.length &&
      groupContrast.columnList[0].averageScoreRateModelList.map((item) => {
        newColumns.push({
          title: item.columnName,
          dataIndex: item.columnName,
          key: item.columnName,
          width: 200,
          children: [
            {
              title: trans("global.equalShare", "均分"),
              dataIndex: `${item.index}average`,
              key: `${item.index}average`,
              width: 90,
            },
            {
              title: trans("analysis.knowLedgeScoreRate", "得分率"),
              dataIndex: `${item.index}scoreRate`,
              key: `${item.index}scoreRate`,
              width: 110,
              sorter: (a, b) => {
                let a1 = a[`${item.index}scoreRate`];
                let b1 = b[`${item.index}scoreRate`];
                a1 = a1 ? a1.slice(0, Math.max(0, a1.length - 1)) : "";
                b1 = b1 ? b1.slice(0, Math.max(0, b1.length - 1)) : "";
                return a1 - b1;
              },
              render: (text, record, index) => {
                let txt = text?.slice(0, Math.max(0, text.length - 1));
                return (
                  <div
                    className={
                      comparePercentages(txt, record["0scoreRate"]) == -1
                        ? styles.noPass
                        : ""
                    }
                    style={{ lineHeight: "40px" }}
                  >
                    {text}
                  </div>
                );
              },
            },
          ],
        });
      });
    newColumns.push({
      title: "",
    });
    const columns = newColumns;

    return (
      <div
        style={{ width: "100%", height: "100%" }}
        className={styles.questionTableCanvas}
      >
        <div style={{ width: "100%" }} id="groupQuestion_component">
          <span className={styles.tableHeaderTitle}>
            {trans("global.topicClassComparison", "小题班级对比")}
          </span>
          <div
            style={{
              background: "#fff",
              marginBottom: "20px",
              borderRadius: "10px",
            }}
          >
            <Table
              dataSource={dataSource}
              pagination={false}
              columns={columns}
            />
          </div>
        </div>
        <div
          id="groupQuestion1_component"
          style={{ width: "100%", background: "#fff", borderRadius: "10px" }}
        >
          <span className={styles.tableHeaderTitle}>
            {trans("global.topicClassComparison", "小题班级对比")}
          </span>
          <div
            id="questionTable_chartBox_canvas"
            style={{ width: "100%", height: "300px" }}
          />
        </div>
      </div>
    );
  }
}
export default connect(({ home }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  groupContrast: home.groupContrast,
  questionItem: home.questionItem,
}))(QuestionTableCanvas);

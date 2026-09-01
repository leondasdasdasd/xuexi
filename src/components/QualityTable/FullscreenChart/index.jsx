import React, { PureComponent } from "react";
import * as echarts from "echarts";

import { trans } from "../../../utils/i18n";

import icon from "../../../icon.module.less";
import minStyles from "../index.module.less";
import styles from "./index.module.less"; // 全屏弹窗样式

let color = [
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

class FullscreenChart extends PureComponent {
  constructor(properties) {
    super(properties);

    this.chartRef = React.createRef();
    this.chartInstance = null;
  }

  componentDidMount() {
    this.initChart();
    window.addEventListener("resize", this.resizeChart);
  }

  componentWillUnmount() {
    this.disposeChart();
    window.removeEventListener("resize", this.resizeChart);
  }

  getInitialOption = () => {
    let referenceValues = this.getReferenceValue();
    const { chartData } = this.props;
    let markLineData1 = [];

    const reference = Number(referenceValues);
    const gradeAvg = Number(chartData.gradeAvgScoreRate?.split("%")[0]);
    const maxValue = Math.max(
      ...chartData.questionLevelScoreModelList.map((d) => d.average),
      reference || 0,
      gradeAvg || 0,
    );

    if (reference) {
      markLineData1.push({
        name: trans("qualityChart.referenceLine", "参考线"),
        yAxis: reference,
        lineStyle: {
          color: "#2A70E0", // 蓝色
          type: "solid",
        },
        coord: [2, 85],
        label: {
          show: false,
          formatter: `${trans("qualityChart.referenceLine", "参考线")}\n${reference}% `, // 多行文本
          position: "start",
          fontSize: 12,
          color: "#2A70E0",
          backgroundColor: "rgba(255,255,255,0.85)",
          borderRadius: 3,
          padding: [3, 5],
          distance: [-55, 0],
        },
      });
    }

    if (gradeAvg) {
      markLineData1.push({
        name: trans("qualityChart.gradeAverage", "年级均值"),
        yAxis: gradeAvg,
        lineStyle: {
          color: "#28A745", // 绿色
          type: "dashed",
        },
        coord: [2, 85],
        label: {
          show: false,
          formatter: `${trans("qualityChart.gradeAverage", "年级均值")}\n${gradeAvg}%`, // 多行文本
          position: "start",
          fontSize: 12,
          color: "#28A745",
          backgroundColor: "rgba(255,255,255,0.85)",
          borderRadius: 3,
          padding: [3, 5],
          distance: [-55, 0],
        },
      });
    }
    return {
      grid: {
        top: "40",
        left: "30",
        right: "30",
        bottom: "30",
        containLabel: true,
      },

      tooltip: {
        trigger: "axis",
        // 添加 $ 前缀
        // valueFormatter: (value) => value + '%'
        formatter: (parameters) => {
          console.log(parameters);
          const [data] = parameters;
          return `<div>
                                       <div style="width:8px;height:8px;border-radius:50%;background:${data.color};display:inline-block;margin-right:10px"></div>${data.name}：${data.value}% <br/>
                                       <div style="width:8px;height:8px;border-radius:50%;background:#2A70E0;display:inline-block;margin-right:10px"></div>${trans("qualityChart.referenceLine", "参考线")}：${referenceValues || "-"}%<br/>
                                       <div style="width:8px;height:8px;border-radius:50%;background:#28A745;display:inline-block;margin-right:10px"></div>${trans("qualityChart.gradeAverage", "年级均值")}：${chartData.gradeAvgScoreRate}
                                       </div>`;
        },
      },
      xAxis: {
        data: chartData.questionLevelScoreModelList.map(
          (item2) => item2.groupName,
        ),
        axisTick: {
          show: false,
        },
        axisLabel: {
          interval: 0,
          // 使用函数模板，函数参数分别为刻度数值（类目），刻度的索引
          formatter: function (value, index) {
            if (`${value}`.length >= 5) {
              return `${value}`.slice(0, 3) + "\n" + `${value}`.slice(3);
            }
            return value;
          },
          fontSize: 10,
        },
      },

      yAxis: {
        type: "value",
        max: Math.ceil(maxValue / 10) * 10,
        axisLabel: {
          formatter: "{value} %",
        },
      },

      animationDurationUpdate: 500,

      series: {
        type: "bar",
        data: chartData.questionLevelScoreModelList.map((item4, k) => ({
          value: item4.average,
          id: k,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: color[k % color.length],
          },
        })),
        label: {
          show: true,
          position: "top",
          formatter: "{c}%", // 显示数值
          fontSize: 10,
          color: "#2A3557",
        },
        barWidth: 32,
        barCategoryGap: 16,
        markLine: {
          symbol: "none", // 不显示箭头
          lineStyle: {
            width: 2,
          },
          data: markLineData1,
        },
      },
    };
  };

  getDrillDownOption = (event) => {
    const { chartData } = this.props;

    let option1 = this.getInitialOption();

    let _chartInstance = this.chartInstance;

    _chartInstance.resize();
    const qus =
      chartData.questionLevelScoreModelList[event.data.id].questionList;

    const reference = Number(this.getReferenceValue());
    const gradeAvg = Number(chartData.gradeAvgScoreRate?.split("%")[0]);

    const maxValue1 = Math.max(
      ...qus.map((d) => d.questionScore),
      reference || 0,
      gradeAvg || 0,
    );

    let markLineData = [];

    if (reference) {
      markLineData.push({
        name: trans("qualityChart.referenceLine", "参考线"),
        yAxis: reference,
        lineStyle: {
          color: "#2A70E0", // 蓝色
          type: "dashed",
        },
        coord: [1, 85],
        label: {
          show: false,
          formatter: `${trans("qualityChart.referenceLine", "参考线")}\n${reference}% `, // 多行文本
          position: "start",
          fontSize: 12,
          color: "#2A70E0",
          backgroundColor: "rgba(255,255,255,0.85)",
          borderRadius: 3,
          padding: [3, 5],
          distance: [-55, 0],
        },
      });
    }
    if (gradeAvg) {
      markLineData.push({
        name: trans("qualityChart.gradeAverage", "年级均值"),
        yAxis: gradeAvg,
        lineStyle: {
          color: "#28A745", // 绿色
          type: "dashed",
        },
        coord: [1, 85],
        label: {
          show: false,
          formatter: `${trans("qualityChart.gradeAverage", "年级均值")}\n${gradeAvg}%`, // 多行文本
          position: "start",
          fontSize: 12,
          color: "#28A745",
          backgroundColor: "rgba(255,255,255,0.85)",
          borderRadius: 3,
          padding: [3, 5],
          distance: [-55, 0],
        },
      });
    }
    return {
      xAxis: {
        data: qus.map((element) => element.questionNum),
        axisTick: {
          show: false,
        },
      },

      yAxis: {
        type: "value",
        max: Math.ceil(maxValue1 / 10) * 10,
        axisLabel: {
          formatter: "{value} %",
        },
      },
      grid: {
        top: "40",
        left: "30",
        right: "30",
        bottom: "30",
        containLabel: true,
      },

      axisLabel: {
        interval: 1,
        // 使用函数模板，函数参数分别为刻度数值（类目），刻度的索引
        // formatter: function (value, index) {
        //     return value;
        // },
        fontSize: 10,
      },

      series: {
        type: "bar",
        data: qus.map((element) => ({
          value: element.questionScore,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: "#3d94ff",
          },
        })),
        barWidth: 32,
        barCategoryGap: 16,
        markLine: {
          symbol: "none", // 不显示箭头
          lineStyle: {
            width: 2,
          },
          data: markLineData,
        },
      },

      graphic: [
        {
          type: "text",
          left: 10,
          top: 5,
          style: {
            text: trans(
              "qualityChart.backToClassQuestionAnalysis",
              "< 返回 班级对比/题目分析/",
            ),
            fontSize: 12,
            fill: "#4E5969",
          },

          onclick: function () {
            _chartInstance.resize();
            _chartInstance.setOption(option1, "remove");
          },

          onmouseover: () => {
            _chartInstance.setOption({
              // ...this.getDrillDownOption(),
              graphic: [
                {
                  type: "text",
                  left: 10,
                  top: 5,
                  style: {
                    text: trans(
                      "qualityChart.backToClassQuestionAnalysis",
                      "< 返回 班级对比/题目分析/",
                    ),
                    fontSize: 12,
                    fill: "#0445FC",
                  },
                },
                {
                  type: "text",
                  left: 160,
                  top: 5,
                  style: {
                    text: chartData.questionLevelScoreModelList[event.data.id]
                      .groupName,
                    fontSize: 12,
                    fill: "#01113D",
                  },
                },
              ],
            });
          },

          onmouseout: () => {
            _chartInstance.setOption({
              // ...this.getDrillDownOption(),
              graphic: [
                {
                  type: "text",
                  left: 10,
                  top: 5,
                  style: {
                    text: trans(
                      "qualityChart.backToClassQuestionAnalysis",
                      "< 返回 班级对比/题目分析/",
                    ),
                    fontSize: 12,
                    fill: "#4E5969",
                  },
                },
                {
                  type: "text",
                  left: 160,
                  top: 5,
                  style: {
                    text: chartData.questionLevelScoreModelList[event.data.id]
                      .groupName,
                    fontSize: 12,
                    fill: "#01113D",
                  },
                },
              ],
            });
          },
        },
        {
          type: "text",
          left: 160,
          top: 5,
          style: {
            text: chartData.questionLevelScoreModelList[event.data.id]
              .groupName,
            fontSize: 12,
            fill: "#01113D",
          },
        },
      ],
    };
  };

  getReferenceValue = () => {
    const { paperLevelData, chartData } = this.props;
    return paperLevelData?.find(
      (level) => level.type == chartData.questionLeveNum,
    )?.referenceValues;
  };

  initChart = () => {
    const {
      chartData: { flagEvent },
    } = this.props;

    if (this.chartRef.current) {
      this.chartInstance = echarts.init(this.chartRef.current);

      this.chartInstance.on("click", (event) => {
        if (event.data) {
          if (!event.data.id && event.data.id != 0) {
            return;
          }
          let options1 = this.getDrillDownOption(event);

          this.chartInstance.setOption(options1);
        }
      });

      let option = this.getInitialOption();
      this.chartInstance.setOption(option);

      if (flagEvent) {
        let lds = flagEvent.data.id.split("_");

        let options1 = this.getDrillDownOption({
          ...flagEvent,
          data: {
            ...flagEvent.data,
            id: Number(lds.at(-1)),
          },
        });

        this.chartInstance.setOption(options1);
      }
    }
  };

  disposeChart = () => {
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  };

  resizeChart = () => {
    if (this.chartInstance) {
      this.chartInstance.resize();
    }
  };

  render() {
    const { paperLevelData, chartData } = this.props;

    let name = null;
    if (chartData && paperLevelData) {
      name = paperLevelData?.find(
        (le) => le.type == chartData.questionLeveNum,
      )?.referenceValues;
    }

    return (
      <div className={styles.fullscreen_overlay} onClick={this.props.onClose}>
        <div className={styles.fullscreen_content}>
          <div className={styles.close_btn} onClick={this.props.onClose}>
            <i className={icon.iconfont}>&#xe8a3;</i>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className={minStyles.referenceTitle}>
              <div className={minStyles.dashedLine}></div>
              {trans("qualityChart.gradeAverage", "年级均值")}&nbsp;
              {chartData.gradeAvgScoreRate}
            </div>

            {name ? (
              <div className={minStyles.referenceTitle1}>
                <div className={minStyles.dashedLine1}></div>
                {trans("qualityChart.referenceLine", "参考线")}&nbsp;{name}%
              </div>
            ) : null}
          </div>
          <div
            ref={this.chartRef}
            onClick={(e) => e.stopPropagation()} // ✅ 阻止冒泡
            style={{ width: "100%", height: "98%" }}
          ></div>
        </div>
      </div>
    );
  }
}

export default FullscreenChart;

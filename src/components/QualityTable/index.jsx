import React, { Fragment, PureComponent } from "react";
import { Input, message } from "antd";
import * as echarts from "echarts";
import lodash from "lodash";

import {
  accomplishmentReportWithGroup,
  getPaperLevelData,
  questionLevelDetail,
} from "../../services/exam";
import { savePaperLevelData } from "../../services/paper";
import { locale, trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";
import AreaHeaderComponent from "../AreaHeaderComponent";
import ChartSwitch from "../ChartSwitch";
import ComnModal from "../ComnModal";
import MyTabs from "../MyTabs";
import FullscreenChart from "./FullscreenChart";
import MyTable from "./MyTable";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
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
class QualityTable extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreen: false,
      columns: [],
      qualityIndicatorData: [],
      currentView: 3,
      barChartData: [],
      qualityToggle: true,
      difficultyToggle: false,
      paperLevelData: [],
      difficultyReferenceDialog: false,
      columnSet: [],
      chartModalVis: false,
      chartData: null,
    };
  }

  componentDidMount() {
    this.getPaperLevel();
    this.getTableData();
  }

  changeViewType = (value) => {
    this.setState(
      {
        currentView: value,
      },
      () => {
        if (value == 1) {
          this.initTableColumns(this.state.columnSet);
          this.initTableData();
        } else if (value == 2) {
          this.initLineChart();
        } else if (value == 3) {
          this.initRadarChart();
        } else if (value == 4) {
          this.initQualityBarChart();
        }
      },
    );
  };

  getPaperLevel = () => {
    getPaperLevelData({
      paperId: this.props.paperId,
    }).then((response) => {
      if (response.status) {
        this.setState({
          paperLevelData: response.content,
        });
      } else {
        message.error(response.message);
      }
    });
  };

  getTableData = () => {
    accomplishmentReportWithGroup({
      examId: this.props.examId,
      loadTwoAccomplishmentFalg: this.state.qualityToggle,
      mergeQuestionLevelData: !this.state.difficultyToggle,
    }).then((response) => {
      if (response.status) {
        const { columnSet, qualityIndicatorData } = response.content || {};

        let index = null;

        if (qualityIndicatorData)
          for (const [index_, item] of qualityIndicatorData.entries()) {
            const lastItem = qualityIndicatorData[index_ - 1];
            if (
              lastItem &&
              item.indicatorParentName === lastItem.indicatorParentName
            ) {
              if (index == undefined) {
                index = index_ - 1;
              }
              item.rowSpan = 0;
              qualityIndicatorData[index].rowSpan += 1;
            } else {
              index = null;
              item.rowSpan = 1;
            }
          }

        this.setState(
          {
            qualityIndicatorData: qualityIndicatorData,
            columnSet: columnSet,
          },
          () => {
            if (this.state.currentView == 3) {
              this.initRadarChart();
            } else if (this.state.currentView == 2) {
              this.initLineChart();
            } else if (this.state.currentView == 1) {
              this.initTableData();
              this.initTableColumns(columnSet);
            } else if (this.state.currentView == 4) {
              this.initQualityBarChart();
            }
          },
        );
      } else {
        message.error(response.message);
      }
    });
  };

  initTableColumns = (columnSet = []) => {
    if (this.props.viewType == 2) {
      let columnList = [
        {
          title: trans("global.className", "班级名称"),
          dataIndex: "columnName",
          key: "columnName",
          width: 120,
          fixed: "left",
          align: "center",
        },
      ];

      const grouped = {};

      if (this.state.qualityIndicatorData)
        for (const item of this.state.qualityIndicatorData) {
          const parent = item.indicatorParentName;

          let gradeScoreRate = item.columnDataModelList[0].averageRate;

          let childColumn = {
            title: item.indicatorName,
            dataIndex: `${item.indicatorName}_score`,
            key: `${item.indicatorName}_score`,
            align: "center",
            children: [
              this.props.showQualityTotalScoreInList
                ? {
                    title: trans("global.zongfen", "总分"),
                    dataIndex: `${item.indicatorName}_totalScore`,
                    key: `${item.indicatorName}_totalScore`,
                    width: 80,
                    align: "center",
                  }
                : null,
              {
                title: trans("global.averageScoreShort", "均分"),
                dataIndex: `${item.indicatorName}_score`,
                key: `${item.indicatorName}_score`,
                width: 80,
                align: "center",
              },
              {
                title: trans("global.scoreRate", "得分率"),
                dataIndex: `${item.indicatorName}_averageRate`,
                key: `${item.indicatorName}_averageRate`,
                width: 80,
                align: "center",
                render: (text, record, index) => {
                  return (
                    <span
                      className={
                        comparePercentages(text, gradeScoreRate) == -1
                          ? styles.noPass
                          : ""
                      }
                    >
                      {text}
                    </span>
                  );
                },
              },
            ].filter(Boolean),
          };

          if (grouped[parent]) {
            grouped[parent].children.push(childColumn);
          } else {
            grouped[parent] = this.state.qualityToggle
              ? {
                  title: parent,
                  dataIndex: `${parent}_score`,
                  key: `${parent}_score`,
                  children: [childColumn],
                }
              : childColumn;
          }
        }

      Object.keys(grouped).map((item) => {
        columnList.push(grouped[item]);
      });
      console.log(columnList, "columnList");

      this.setState({
        columns: [...columnList, {}],
      });
    } else {
      let data = [];
      for (const [index, item] of columnSet.entries()) {
        data.push({
          title: item.columnName,
          dataIndex: `group${index}`,
          key: `group${index}`,
          fixed: index == 0 ? "left" : false,
          width: this.props.showQualityTotalScoreInList ? 240 : 160,
          children: [
            this.props.showQualityTotalScoreInList
              ? {
                  title: trans("global.zongfen", "总分"),
                  dataIndex: `group_total_score_${index}`,
                  key: `group_total_score_${index}`,
                  width: 80,
                  fixed: index == 0 ? "left" : false,
                  align: "center",
                }
              : null,
            {
              title: trans("global.averageScoreShort", "均分"),
              dataIndex: `group_average_score_${index}`,
              key: `group_average_score_${index}`,
              width: 80,
              fixed: index == 0 ? "left" : false,
              align: "center",
            },
            {
              title: trans("global.scoreRate", "得分率"),
              dataIndex: `group_average_rate_${index}`,
              key: `group_average_rate_${index}`,
              width: 80,
              fixed: index == 0 ? "left" : false,
              align: "center",
              render: (text, record, index) => {
                let gradeScoreRate = record["group_average_rate_0"];
                return (
                  <span
                    className={
                      comparePercentages(text, gradeScoreRate) == -1
                        ? styles.noPass
                        : ""
                    }
                  >
                    {text}
                  </span>
                );
              },
            },
          ].filter(Boolean),
        });
      }

      let list = [
        {
          title: trans("qualityTable.primaryCompetency", "一级素养能力"),
          dataIndex: "indicatorParentName",
          key: "indicatorParentName",
          width: 120,
          fixed: "left",
          align: "center",
          render: (value, record, index) => {
            // 用于存储行跨度信息
            return {
              children: value,
              props: {
                rowSpan: record.rowSpan,
              },
            };
          },
        },
        {
          title: trans("qualityTable.difficultyLevel", "难易度"),
          dataIndex: "questionLevelDistribution",
          key: "questionLevelDistribution",
          width: 150,
          align: "center",
          fixed: "left",
        },
        {
          title: trans("qualityTable.relatedQuestionNumbers", "对应题号"),
          dataIndex: "questionNo",
          key: "questionNo",
          width: 150,
          align: "center",
          fixed: "left",
        },
        {
          title: trans("qualityTable.totalScoreValue", "总分值"),
          dataIndex: "questionScore",
          key: "questionScore",
          width: 80,
          align: "center",
          fixed: "left",
        },
        {
          title: trans(
            "qualityTable.difficultyDistributionChart",
            "难易分布图表",
          ),
          dataIndex: "chart",
          key: "chart",
          width: 70,
          align: "center",
          fixed: "left",
          render: () => (
            <span
              onClick={this.openLeveChart}
              style={{ color: "#0445fc", cursor: "pointer" }}
            >
              {trans("global.view", "查看")}
            </span>
          ),
        },
      ];

      if (this.state.qualityToggle) {
        list.splice(1, 0, {
          title: trans("qualityTable.secondaryCompetency", "二级素养能力"),
          dataIndex: "indicatorName",
          key: "indicatorName",
          width: 120,
          align: "center",
          fixed: "left",
        });
      }

      this.setState({
        columns: [...list, ...data, {}],
      });
    }
  };

  initTableData = () => {
    // 这里根据viewType来切换行与列
    if (this.props.viewType == 2) {
      let data = [];
      const { columnSet } = this.state;
      if (columnSet)
        for (const [index, item] of columnSet.entries()) {
          let object = {
            columnName: item.columnName,
          };
          for (const [k, item1] of this.state.qualityIndicatorData.entries()) {
            object[`${item1.indicatorName}_totalScore`] = item1.questionScore;
            object[`${item1.indicatorName}_score`] =
              item1.columnDataModelList[index].average;
            object[`${item1.indicatorName}_averageRate`] =
              item1.columnDataModelList[index].averageRate;
          }
          data.push(object);
        }
      console.log(data, "tableData");

      this.setState({
        tableData: data,
      });
    } else {
      let data = [];
      if (this.state.qualityIndicatorData) {
        data = JSON.parse(JSON.stringify(this.state.qualityIndicatorData));
      }
      if (data)
        for (const [index, item] of data.entries()) {
          for (const [k, item1] of item.columnDataModelList.entries()) {
            item[`group_total_score_${k}`] = item.questionScore;
            item[`group_average_score_${k}`] = item1.average;
            item[`group_average_rate_${k}`] = item1.averageRate;
          }
        }

      this.setState({
        tableData: data,
      });
    }
  };

  openLeveChart = () => {
    questionLevelDetail({
      examId: this.props.examId,
      filterFlag: false,
      loadTwoAccomplishmentFalg: this.state.qualityToggle,
    }).then((response) => {
      if (response.status) {
        this.setState(
          {
            barChartData: response.content,
            leveChartVisible: true,
          },
          () => {
            this.initLevelBarChart();
          },
        );
      } else {
        message.error(response.message);
      }
    });
  };

  closeLeveChart = () => {
    this.setState({
      leveChartVisible: false,
    });
  };

  initLineChart = (data) => {
    let chartDom = document.querySelector("#qualityLineChart");

    if (!chartDom) {
      return;
    }

    let myChart = echarts.init(chartDom);
    let option;

    option = {
      tooltip: {
        trigger: "axis",
        // 添加 $ 前缀
        valueFormatter: (value) => value + "%",
      },
      legend: {
        data: this.state.qualityIndicatorData.map((item) => item.indicatorName),
      },
      grid: {
        top: "12%",
        left: "3%",
        right: 60,
        bottom: "3%",
        containLabel: true,
      },
      color: color,
      toolbox: {
        feature: {
          saveAsImage: {},
        },
        right: "5%",
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: this.state.columnSet.map((item) => item.columnName),
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: "{value}%", // y 轴值以百分比显示
        },
        min: "dataMin", // 使用数据中的最小值作为 y 轴的最小值
        max: "dataMax", // 使用数据中的最大值作为 y 轴的最大值
      },
      series: this.state.qualityIndicatorData.map((item) => ({
        name: item.indicatorName,
        type: "line",
        data: item.columnDataModelList.map(
          (item) => item.averageRate.split("%")[0],
        ),
      })),
    };

    option && myChart.setOption(option);
  };

  initQualityBarChart = (data) => {
    let lineData = [];
    this.state.columnSet?.map((item, index) => {
      if (index == 0) {
        this.state.qualityIndicatorData?.map((item1, index2) => {
          if (item1.columnDataModelList[index]?.averageRate) {
            lineData.push(
              item1.columnDataModelList[index].averageRate.split("%")[0],
            ) * 1;
          }
        });
      } else {
        let chartDom = document.getElementById(`qualityBar${item.groupId}`);
        if (!chartDom) {
          return;
        }

        if (chartDom && echarts.getInstanceByDom(chartDom)) {
          echarts.getInstanceByDom(chartDom).dispose(); // 销毁旧的实例
        }
        let xAxisData = [];
        let data = [];

        let min = null;
        let max = null;

        this.state.qualityIndicatorData?.map((item1, index2) => {
          if (item1.columnDataModelList[index]?.averageRate) {
            let averageRate =
              item1.columnDataModelList[index].averageRate.split("%")[0] * 1;

            const maxRate = Math.max(averageRate, lineData[index2]);
            const rounded = Math.ceil(maxRate);
            if (max == undefined || rounded > max) {
              max = rounded;
            }

            const minRate = Math.min(averageRate, lineData[index2]);
            const rounded1 = Math.floor(minRate);
            if (min == undefined || rounded1 < min) {
              min = rounded1;
            }

            data.push({
              value: averageRate,
              itemStyle: {
                borderRadius: [3, 3, 0, 0],
                color: color[index2 % color.length],
              },
            });
            xAxisData.push(item1.indicatorName);
          }
        });

        let myChart = echarts.init(chartDom, null, {
          width: this.state.qualityIndicatorData.length * 45 + 100,
          height: 350,
        });

        let option = {
          tooltip: {
            trigger: "axis",
            // 添加 $ 前缀
            valueFormatter: (value) => value + "%",
          },
          title: {
            text: item.columnName,
            left: "center",
            top: "10%",
            textStyle: {
              fontSize: 14,
              fontWeight: "bold",
              color: "#01113d",
            },
          },
          grid: {
            top: "30%",
            left: "3%",
            right: "3%",
            bottom: "3%",
            containLabel: true,
          },
          xAxis: {
            type: "category",
            data: xAxisData,
            axisLabel: {
              interval: 0, // ✅ 强制显示每个标签
              rotate: 30, // ✅ 可选：旋转避免重叠（如有需要）
            },
          },
          yAxis: {
            type: "value",
            axisLabel: {
              formatter: "{value}%", // y 轴值以百分比显示
            },
            // interval: 5, // ✅ 设置刻度间隔为 5
            interval: 20,
            show: true,
            // min: min == 0 ? 0 : min % 5 == 0 ? min - 5 : min - (min % 5),
            // max: max % 5 == 0 ? max + 5 : max + (5 - (max % 5))
            min: 0,
            max: 100,
          },
          series: [
            {
              name: trans("qualityTable.classScoreRate", "班级得分率"),
              type: "bar",
              barWidth: 32,
              barCategoryGap: 16,
              data: data,
            },
            {
              name: trans("qualityTable.gradeScoreRate", "年级得分率"),
              type: "line",
              data: lineData,
              itemStyle: {
                color: "#EA3323", // ✅ 控制图例小图标、点的颜色
              },
              lineStyle: {
                color: "#EA3323",
                width: 1,
              },
              symbol: "circle", // 可选：控制点的形状
              symbolSize: 4,
            },
          ],
        };
        option && myChart.setOption(option);
      }
    });
  };

  createMarkLine = (name, yAxisValue, color) => {
    const value = Number(yAxisValue); // 容错处理
    return {
      name,
      yAxis: value,
      lineStyle: {
        color,
        type: "dashed",
      },
      coord: [2, 85],
      label: {
        show: false,
        formatter: `${name}\n${value}%`, // 控制是否加 %
        position: "start",
        fontSize: 12,
        color,
        backgroundColor: "rgba(255,255,255,0.85)",
        borderRadius: 3,
        padding: [3, 5],
        distance: [-55, 0],
      },
    };
  };

  adjustChartWidth = (
    chartDom,
    targetCount,
    widthPerItem = 48,
    padding = 12,
  ) => {
    chartDom.style.width = "100%";
    const targetWidth = targetCount * widthPerItem + padding;
    if (chartDom.offsetWidth < targetWidth) {
      chartDom.style.width = `${targetWidth}px`;
    }
  };

  initLevelBarChart = () => {
    const { paperLevelData, barChartData } = this.state;
    barChartData.map((item, index) => {
      item.groupScoreModelList.map((item1, index_) => {
        let referenceValues = paperLevelData?.find(
          (levelData) => levelData.type == item1.questionLeveNum,
        )?.referenceValues;

        let chartDom = document.getElementById(`chart${index}_${index_}`);
        if (!chartDom) return;

        this.adjustChartWidth(
          chartDom,
          item1.questionLevelScoreModelList.length,
        );

        let myChart = echarts.init(chartDom);
        let _this = this;

        const reference = Number(referenceValues);
        const gradeAvg = Number(item1.gradeAvgScoreRate?.split("%")[0]);

        const maxValue = Math.max(
          ...item1.questionLevelScoreModelList.map((d) => d.average),
          reference || 0,
          gradeAvg || 0,
        );

        let markLineData1 = [];
        if (reference) {
          markLineData1.push(
            this.createMarkLine(
              trans("qualityTable.referenceLineShort", "参考线"),
              reference,
              "#2A70E0",
            ),
          );
        }
        if (gradeAvg) {
          markLineData1.push(
            this.createMarkLine(
              trans("qualityTable.gradeAverage", "年级均值"),
              gradeAvg,
              "#28A745",
              false,
            ),
          );
        }

        let option = {
          grid: {
            top: "40",
            left: "30",
            right: "30",
            bottom: "10",
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
                              <div style="width:8px;height:8px;border-radius:50%;background:#2A70E0;display:inline-block;margin-right:10px"></div>${trans("qualityTable.referenceLine", "参考线：")}${referenceValues || "-"}%<br/>
                              <div style="width:8px;height:8px;border-radius:50%;background:#28A745;display:inline-block;margin-right:10px"></div>${trans("qualityTable.gradeAverageLabel", "年级均值：")}${item1.gradeAvgScoreRate}
                            </div>`;
            },
          },
          xAxis: {
            data: item1.questionLevelScoreModelList.map(
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
            data: item1.questionLevelScoreModelList.map((item4, k) => ({
              value: item4.average,
              id: `${index}_${index_}_${k}`,
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

        myChart.on("click", (event) => {
          if (event.data) {
            if (!event.data.id) {
              return;
            }

            let cloneData = lodash.cloneDeep(barChartData);
            cloneData[index].groupScoreModelList[index_].flagEvent = event;
            _this.setState({
              barChartData: cloneData,
            });

            let [in0, in1, in2] = event.data.id.split("_");

            let qus =
              barChartData[in0].groupScoreModelList[in1]
                .questionLevelScoreModelList[in2].questionList;
            _this.adjustChartWidth(chartDom, qus.length, 60);

            chartDom.parentNode.scrollLeft = 0;

            myChart.resize();

            const maxValue1 = Math.max(
              ...qus.map((d) => d.questionScore),
              reference || 0,
              gradeAvg || 0,
            );

            let options1 = {
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
                bottom: "10",
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
                  data: markLineData1,
                },
              },

              graphic: [
                {
                  type: "text",
                  left: 10,
                  top: 5,
                  style: {
                    text: trans(
                      "qualityTable.backToClassAndQuestionAnalysis",
                      "< 返回 班级对比/题目分析/",
                    ),
                    fontSize: 12,
                    fill: "#4E5969",
                  },

                  onclick: function () {
                    chartDom.parentNode.scrollLeft = 0;

                    let cloneData = lodash.cloneDeep(barChartData);
                    cloneData[index].groupScoreModelList[index_].flagEvent =
                      null;
                    _this.setState({
                      barChartData: cloneData,
                    });

                    _this.adjustChartWidth(
                      chartDom,
                      item1.questionLevelScoreModelList.length,
                      60,
                    );

                    myChart.resize();
                    myChart.setOption(option, "remove");
                  },

                  onmouseover: () => {
                    myChart.setOption({
                      ...options1,
                      graphic: [
                        {
                          type: "text",
                          left: 10,
                          top: 5,
                          style: {
                            text: trans(
                              "qualityTable.backToClassAndQuestionAnalysis",
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
                            text: barChartData[in0].groupScoreModelList[in1]
                              .questionLevelScoreModelList[in2].groupName,
                            fontSize: 12,
                            fill: "#01113D",
                          },
                        },
                      ],
                    });
                  },

                  onmouseout: () => {
                    myChart.setOption({
                      ...options1,
                      graphic: [
                        {
                          type: "text",
                          left: 10,
                          top: 5,
                          style: {
                            text: trans(
                              "qualityTable.backToClassAndQuestionAnalysis",
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
                            text: barChartData[in0].groupScoreModelList[in1]
                              .questionLevelScoreModelList[in2].groupName,
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
                    text: this.state.barChartData[in0].groupScoreModelList[in1]
                      .questionLevelScoreModelList[in2].groupName,
                    fontSize: 12,
                    fill: "#01113D",
                  },
                },
              ],
            };

            myChart.setOption(options1);
          }
        });
        option && myChart.setOption(option);
      });
    });
  };
  getReferenceLine = (key) => {
    const { paperLevelData } = this.state;
    let name = paperLevelData?.find(
      (levelData) => levelData.type == key,
    )?.referenceValues;
    console.log(paperLevelData, key, "paperLevelData");

    return name;
  };
  initRadarChart = () => {
    const { columnSet, qualityIndicatorData } = this.state;

    let gradeData = [];
    columnSet?.map((item, index) => {
      if (index == 0) {
        qualityIndicatorData?.map((item1, index2) => {
          if (item1.columnDataModelList[index]?.averageRate) {
            gradeData.push(
              item1.columnDataModelList[index].averageRate.split("%")[0] * 1,
            );
          }
        });
      } else {
        let chartDom = document.getElementById(`radar${item.groupId}`);
        if (!chartDom) {
          return;
        }

        if (echarts.getInstanceByDom(chartDom)) {
          echarts.getInstanceByDom(chartDom).dispose(); // 销毁旧的实例
        }

        let myChart = echarts.init(chartDom);
        let indicator = [];
        let classData = [];

        let maxValue = null;
        let minValue = null;

        qualityIndicatorData?.map((item1, index2) => {
          if (item1.columnDataModelList[index]?.averageRate) {
            let averageRate =
              item1.columnDataModelList[index].averageRate.split("%")[0] * 1;

            const maxRate = Math.max(averageRate, gradeData[index2]);
            const rounded = Math.ceil(maxRate);
            if (maxValue == undefined) {
              maxValue = rounded;
            } else if (rounded > maxValue) {
              maxValue = rounded;
            }

            const minRate = Math.min(averageRate, gradeData[index2]);
            const rounded1 = Math.floor(minRate);
            if (minValue == undefined) {
              minValue = rounded1;
            } else if (rounded1 < minValue) {
              minValue = rounded1;
            }

            indicator.push({
              name: `${item1.indicatorName}\n ${averageRate}`,
            });
            classData.push(averageRate);
          }
        });
        indicator = indicator.map((item, index) => {
          return {
            ...item,
            // max: maxValue,
            // min: minValue,
            max: 100,
            min: 0,
          };
        });

        console.log(indicator, "indicator");

        let option = {
          title: {
            text: item.columnName,
            top: 15,
            left: "center",
            textStyle: {
              color: "#01113d",
              fontSize: 14,
              fontWeight: "bold",
            },
          },
          legend: {
            data: [
              trans("qualityTable.classScoreRate", "班级得分率"),
              trans("qualityTable.gradeScoreRate", "年级得分率"),
            ],
            show: true,
            icon: "circle",
            bottom: indicator.length >= 4 ? 15 : 40,
            left: "center",
            temWidth: 10, // 控制图标的宽度
            itemHeight: 10, // 控制图标的高度
            textStyle: {
              color: "#01113d",
              fontSize: 12,
            },
          },
          tooltip: {
            trigger: "item",
            appendToBody: true,
            position: function (point, parameters, dom, rect, size) {
              let chartDom = document.getElementById(`radar${item.groupId}`);
              console.log(point, "point");

              const [x0, y0] = point;
              // 获取图表容器在页面中的位置（相对于 body）
              const chartRect = chartDom.getBoundingClientRect();
              // 相对于视口的位置
              const mouseX = x0 + chartRect.left;
              const mouseY = y0 + chartRect.top;

              const contentWidth = dom.offsetWidth || 200;
              const contentHeight = dom.offsetHeight || 200;
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;

              let x = mouseX + 10; // 默认右侧显示
              let y = mouseY;

              // 如果右侧显示不下，就切换到左侧
              if (x + contentWidth > viewportWidth) {
                x = mouseX - contentWidth - 10;
              }
              // 如果左侧也放不下，贴左边
              if (x < 0) x = 0;
              // 如果下方显示不下，就往上顶
              if (y + contentHeight > viewportHeight) {
                y = viewportHeight - contentHeight - 10;
              }
              // 防止 y 为负值（极端情况）
              if (y < 0) y = 0;

              console.log(x, y, "x, y"); // 相对于浏览器视口的位置
              return [x - chartRect.left, y - chartRect.top]; // 返回的坐标是相对于容器的位置
            },

            formatter: function (parameters) {
              let indicatorNames = qualityIndicatorData.map(
                (ind) => ind.indicatorName,
              ); // 获取雷达图指标名称
              let result = "";
              indicatorNames.map((name, index_) => {
                result += `
                                <div style="font-size:12px;color:#01113d;">
                                     <div>${name}</div>
                                     <div style="display:flex;align-items:center">
                                            <div style="width:5px;height:5px;border-radius:50%;background:#1890FF;margin:0 5px">
                                            </div>
                                              ${trans("qualityTable.classScoreRateLabel", "班级得分率：")}${classData[index_]}%
                                    </div>
                                    <div style="display:flex;align-items:center">
                                        <div style="width:5px;height:5px;border-radius:50%;background:#59C35D;margin:0 5px">
                                        </div>
                                          ${trans("qualityTable.gradeScoreRateLabel", "年级得分率：")}${gradeData[index_]}%
                                    </div>
                                </div>
                                `;
              });
              return result;
            },
          },
          radar: {
            shape: "polygon",
            indicator: indicator,
            splitNumber: 5,
            axisName: {
              color: "#01113d",
              fontSize: 12,
              formatter: function (value) {
                return value + "%"; // 在坐标标签上添加%
              },
            },
            radius:
              indicator.length >= 4
                ? "50%"
                : indicator.length >= 3
                  ? "65%"
                  : indicator.length >= 2
                    ? "40%"
                    : "40%",
            center:
              indicator.length >= 4
                ? ["50%", "50%"]
                : indicator.length >= 3
                  ? ["50%", "60%"]
                  : indicator.length >= 2
                    ? ["50%", "42%"]
                    : ["50%", "42%"],
            nameGap: 5, // 调整刻度标签与雷达图的距离，
            splitLine: {
              // 添加label来显示分割线的具体数值
              show: true,
              lineStyle: {
                width: 0.5, // ✅ 设置刻度线的粗细（单位：px）
              },
            },
            splitArea: {
              show: false, // 是否开启分割区域
            },
          },
          series: [
            {
              type: "radar",
              data: [
                {
                  value: classData,
                  name: trans("qualityTable.classScoreRate", "班级得分率"),
                  itemStyle: { color: "#1890FF" },
                  areaStyle: { opacity: 0.3 }, // 增加区域填充，使鼠标悬浮到区域时能触发
                  lineStyle: {
                    width: 1, // 💡 设置线条更细
                  },
                  symbol: "none", // 🔥 去掉转折点
                },
                {
                  value: gradeData,
                  name: trans("qualityTable.gradeScoreRate", "年级得分率"),
                  itemStyle: { color: "#59C35D" },
                  areaStyle: { opacity: 0.3 }, // 增加区域填充，使鼠标悬浮到区域时能触发
                  lineStyle: {
                    width: 1, // 💡 设置线条更细
                  },
                  symbol: "none", // 🔥 去掉转折点
                },
              ],
            },
          ],
        };
        option && myChart.setOption(option);
      }
    });
  };

  exportChange = () => {
    const { comparativeExamId, groupId, currentKey } = this.state;

    let parameters = {
      examId: this.props.examId,
      loadTwoAccomplishmentFalg: this.state.qualityToggle,
      mergeQuestionLevelData: !this.state.difficultyToggle,
    };

    let string_ = "";
    for (const key in parameters) {
      const element = parameters[key];
      string_ += `${key}=${element}&`;
    }

    window.open(
      `${window.location.origin}/api/exam/export/examAccomplishmentReportWithGroup?${string_}`,
    );
  };

  handleQualityToggle = (e) => {
    this.setState(
      {
        qualityToggle: e,
      },
      () => {
        this.getTableData();
      },
    );
  };

  handleDifficultyToggle = (e) => {
    this.setState(
      {
        difficultyToggle: e,
      },
      () => {
        this.getTableData();
      },
    );
  };

  openDifficultyReferenceDialog = () => {
    this.setState({
      difficultyReferenceDialog: true,
    });
  };

  referenceModalOk = (type) => {
    savePaperLevelData({
      paperId: this.props.paperId,
      paperLevelResponseVOList: this.state.paperLevelData,
    }).then((response) => {
      if (response.status === true) {
        this.setState({
          difficultyReferenceDialog: false,
        });
        this.getPaperLevel();
      } else {
        message.error(response.message);
      }
    });
  };

  referenceModaCancel = () => {
    this.setState({
      difficultyReferenceDialog: false,
    });
    this.getPaperLevel();
  };

  referenceVlaChange = (index, e) => {
    const { value } = e.target;
    let clonePaperLevelData = [];
    if (this.state.paperLevelData) {
      clonePaperLevelData = JSON.parse(
        JSON.stringify(this.state.paperLevelData),
      );
    }
    if (/^\d*(?:\.\d*)?$/.test(value)) {
      if (clonePaperLevelData[index]) {
        clonePaperLevelData[index].referenceValues = Number(value);
      }

      this.setState({
        paperLevelData: clonePaperLevelData,
      });
    } else {
      return message.error(trans("detail.numMessage", "请输入数字"));
    }
  };

  noDataTemplate = () => {
    const goToConfigData = () => {
      this.props.onGoToConfigData && this.props.onGoToConfigData();
    };
    const canGoToConfigData = !!this.props.onGoToConfigData;

    return (
      <div className={styles.suyang}>
        {/* // 参数为 true 且表格数据为空时，显示一个“导入数据”的入口 */}
        <div
          style={{
            textAlign: "center",
            lineHeight: "300px",
            width: "100%",
          }}
        >
          {canGoToConfigData ? (
            <span>
              {trans(
                "qualityTable.noDataClickTopRight",
                "暂无数据，点击右上角",
              )}
              <span style={{ color: "#1031fa" }} onClick={goToConfigData}>
                {trans("qualityTable.setBlueprintAction", "【设置细目表】")}
              </span>
              {trans(
                "qualityTable.markCompetencyColumnTip",
                "，点击【素养】列标记每道题目的知识点便可生成分析图表。",
              )}
            </span>
          ) : (
            <span>{trans("qualityTable.noData", "暂无数据")}</span>
          )}
        </div>
      </div>
    );
  };

  openFullscreen = (data) => {
    this.setState({
      fullscreenVisible: true,
      chartData: data,
    });
  };

  closeFullscreen = () => {
    this.setState({
      fullscreenVisible: false,
      chartData: null,
    });
  };

  render() {
    return (
      <div
        id="table4"
        style={{
          padding: "10px 20px 0px 20px",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: "15px",
            overflow: "hidden",
          }}
        >
          <AreaHeaderComponent
            // showFullscreenBtn={true}//显示全屏按钮
            // onClickFullscreen={this.fullscreenChange}
            showExportBtn={true} //显示导出按钮
            onClickExport={this.exportChange}
            title={trans("global.skillAnalysis", "素养能力分析")}
            leftPanelContent={
              <>
                <MyTabs
                  data={[
                    { tab: trans("global.listView", "列表视图"), key: 1 },
                    { tab: trans("global.lineChart", "折线图"), key: 2 },
                    { tab: trans("global.radar", "雷达图"), key: 3 },
                    { tab: trans("global.histogram", "柱状图"), key: 4 },
                  ]}
                  onChange={(value) => {
                    this.changeViewType(value.key);
                  }}
                  activeKey={this.state.currentView}
                />
              </>
            }
            rightPanelContent={
              <>
                {this.props.hideDifficultyControls ? null : (
                  <span
                    className={`${styles.textWarp} ${styles.mr14}`}
                    onClick={this.openDifficultyReferenceDialog}
                  >
                    {trans("global.difficultyLine", "难易题参考线")}
                  </span>
                )}
                <ChartSwitch
                  label={trans(
                    "global.secondaryLiteracyDisplay",
                    "二级素养能力展示",
                  )}
                  checked={this.state.qualityToggle}
                  onChange={this.handleQualityToggle}
                />
                {this.props.hideDifficultyControls ? null : (
                  <ChartSwitch
                    label={trans(
                      "global.questionsGroupedByDifficulty",
                      "不同难度题目分开展示",
                    )}
                    checked={this.state.difficultyToggle}
                    onChange={this.handleDifficultyToggle}
                  />
                )}
              </>
            }
          />

          <div className={styles.contentBody}>
            {this.state.currentView == 1 ? (
              this.state.tableData?.length ? (
                <MyTable
                  columns={this.state.columns}
                  dataSource={this.state.tableData}
                  bordered
                  pagination={false}
                  scroll={{ x: 2000 }} // 必须指定 x，以支持水平滚动
                />
              ) : (
                this.noDataTemplate()
              )
            ) : null}

            {this.state.currentView == 2 ? (
              this.state.qualityIndicatorData?.length ? (
                <div
                  id="qualityLineChart"
                  key={this.state.currentView}
                  style={{
                    height: "400px",
                    width: "100%",
                  }}
                ></div>
              ) : (
                this.noDataTemplate()
              )
            ) : null}

            {this.state.currentView == 3 ? (
              <div
                key={this.state.currentView}
                style={{
                  width: "100%",
                  display: "flex",
                  minHeight: "350px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {this.state.columnSet?.length
                  ? this.state.columnSet.map((item, key) => {
                      if (key !== 0) {
                        return (
                          <div
                            style={{ height: "350px", width: "350px" }}
                            id={`radar${item.groupId}`}
                          ></div>
                        );
                      }
                    })
                  : this.noDataTemplate()}
              </div>
            ) : null}

            {this.state.currentView == 4 ? (
              <div
                key={this.state.currentView}
                style={{
                  width: "100%",
                  display: "flex",
                  minHeight: "350px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {this.state.columnSet?.length
                  ? this.state.columnSet.map((item, key) => {
                      if (key !== 0) {
                        return <div id={`qualityBar${item.groupId}`}></div>;
                      }
                    })
                  : this.noDataTemplate()}
              </div>
            ) : null}
          </div>
        </div>
        {this.state.leveChartVisible ? (
          <div
            style={{
              position: "fixed",
              left: "0",
              top: "0",
              width: "100vw",
              height: "100vh",
              background: "#F5F6F7",
              zIndex: "100",
            }}
          >
            <div
              style={{
                width: "100vw",
                height: "64px",
                background: "#fff",
                color: "#01113d",
                fontSize: "16px",
                lineHeight: "64px",
                padding: "0 10px",
              }}
            >
              <i
                onClick={this.closeLeveChart}
                style={{
                  fontSize: "22px",
                  marginRight: "8px",
                  display: "inline-block",
                  transform: "translateY(2px)",
                  cursor: "pointer",
                }}
                className={styles.iconfont}
              >
                &#xe893;
              </i>
              {trans(
                "qualityTable.competencyDifficultyScoreRateAnalysis",
                "各素养能力不同难易程度得分率分析",
              )}
            </div>

            <div
              style={{
                width: "100%",
                height: "calc(100vh - 64px)",
                padding: "12px",
                overflowY: "auto",
              }}
            >
              {this.state.barChartData.map((item, index) => (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      height: "46px",
                      width: "100%",
                      lineHeight: "46px",
                      background: "#fff",
                      borderBottom: "1px solid rgba(1, 17, 61, 0.07)",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "15px",
                        borderRadius: "2px",
                        marginLeft: "12px",
                        backgroundColor: "#5BC640",
                      }}
                    ></div>
                    <span
                      style={{
                        color: "#01113D",
                        fontSize: "16px",
                        paddingLeft: "10px",
                        fontWeight: "500",
                        marginRight: "10px",
                      }}
                    >
                      {item.indicatorParentName}{" "}
                      {this.state.qualityToggle ? `/${item.indicatorName}` : ""}
                    </span>
                    <span
                      style={{
                        color: "rgba(1, 17, 61, 0.65)",
                        fontSize: "14px",
                      }}
                    >
                      {trans(
                        "qualityTable.drillDownByBarTip",
                        "点击柱子可下钻查看题目分析",
                      )}
                    </span>
                  </div>
                  <div style={{ display: "flex", width: "100%" }}>
                    {item.groupScoreModelList.map((item1, index_) => {
                      let number_ = 0;
                      for (const [
                        k,
                        item2,
                      ] of item1.questionLevelScoreModelList.entries()) {
                        if (item2.questionList && k == 0) {
                          number_ += item2.questionList?.length;
                        }
                      }
                      return (
                        <div
                          style={{
                            width: "33.333%",
                            borderRight: "1px solid rgba(1, 17, 61, 0.07)",
                            background: "#fff",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: "37px",
                              lineHeight: "37px",
                              textAlign: "center",
                              color: "#01113d",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {item1.questionLeveName}
                            {trans(
                              "qualityTable.questionCountSuffix",
                              "(共{$count}题)",
                              {
                                count: number_,
                              },
                            )}
                            <div
                              className={styles.fullscreenBtn}
                              onClick={() => {
                                this.openFullscreen(item1);
                              }}
                            >
                              <i className={icon.iconfont}>&#xe8a4;</i>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <div className={styles.referenceTitle}>
                              <div className={styles.dashedLine}></div>
                              {trans("qualityTable.gradeAverage", "年级均值")}
                              &nbsp;{item1.gradeAvgScoreRate}
                            </div>

                            {this.getReferenceLine(item1.questionLeveNum) ? (
                              <div className={styles.referenceTitle1}>
                                <div className={styles.dashedLine1}></div>
                                {trans(
                                  "qualityTable.referenceLineShort",
                                  "参考线",
                                )}
                                &nbsp;
                                {this.getReferenceLine(item1.questionLeveNum)}%
                              </div>
                            ) : null}
                          </div>

                          <div
                            style={{
                              height: "253px",
                              width: "100%",
                              background: "#F5F6F7",
                              overflowX: "scroll",
                              overflowY: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                background: "#fff",
                              }}
                              id={`chart${index}_${index_}`}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <ComnModal
          options={{
            visible: this.state.difficultyReferenceDialog,
            centered: true,
            title: trans(
              "qualityTable.difficultyReferenceModalTitle",
              "设置不同难易度得分率参考线",
            ),
            onOk: this.referenceModalOk, // 提交表单
            onCancel: this.referenceModaCancel,
          }}
          innerContent={
            <div>
              {this.state.paperLevelData.map((item, index) => (
                <div
                  key={item.type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ minWidth: "100px", textAlign: "right" }}>
                    {locale() === "en" ? item.typeEName : item.typeName}
                  </div>
                  <Input
                    value={item.referenceValues || undefined}
                    placeholder={trans("global.pleaseEnter", "请输入")}
                    style={{ width: "120px", margin: "0 5px", height: "36px" }}
                    onChange={(e) => {
                      this.referenceVlaChange(index, e);
                    }}
                  />
                  %
                </div>
              ))}
            </div>
          }
        />
        {this.state.fullscreenVisible && (
          <FullscreenChart
            chartData={this.state.chartData}
            paperLevelData={this.state.paperLevelData}
            onClose={this.closeFullscreen}
          />
        )}
      </div>
    );
  }
}
export default QualityTable;

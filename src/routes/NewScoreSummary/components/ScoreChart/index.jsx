import React, { PureComponent } from "react";
import { Select } from "antd";
import * as echarts from "echarts";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

class ScoreChart extends PureComponent {
  constructor(properties) {
    super(properties);
    this.myChart = null;
    this.myChart1 = null;
    this.state = {
      fullscreen: false,
      series0: true,
      series1: true,
      series2: true,
      series3: true,
    };
  }

  exportFail = (key) => {
    this.props.exportFail && this.props.exportFail(key);
  };

  initThisReportChart = () => {
    const { scoreChartData = [] } = this.props;

    let chartDom = document.querySelector("#thisReport");
    this.myChart = echarts.init(chartDom);
    let indicator = scoreChartData.map((item, index) => {
      return {
        name: `${item.subjectName}\n ${item.score}`,
        max: item.gradeScore > item.score ? item.gradeScore : item.score,
      };
    });
    let option = {
      tooltip: {
        trigger: "item",
        appendToBody: true,
        // confine: true,
        formatter: function (parameters) {
          let result = "";
          scoreChartData.map((item, index) => {
            result += `
                            <div style="font-size:12px;color:#01113d;">
                                <div>${item.subjectName}</div>
                                <div style="display:flex;align-items:center">
                                    <div style="display:flex;align-items:center">
                                        <div style="width:5px;height:5px;border-radius:50%;background:#59C35D;margin:0 5px">
                                        </div>
                                        ${trans("scoreChart.gradeAverage", "年级均分")}：${item.gradeScore}
                                    </div>
                                     <div style="display:flex;align-items:center">
                                        <div style="width:5px;height:5px;border-radius:50%;background:#1890FF;margin:0 5px">
                                        </div>
                                        ${trans("scoreChart.self", "本人")}：${item.score}
                                    </div>
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
        axisName: {
          color: "#01113d",
          fontSize: 12,
        },
        radius: "70%",
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: scoreChartData.map((item) => item.score),
              name: trans("scoreChart.selfScore", "本人分数"),
              itemStyle: { color: "#1890FF" },
              areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
            },
            {
              value: scoreChartData.map((item) => item.gradeScore),
              name: trans("scoreChart.gradeAverage", "年级均分"),
              itemStyle: { color: "#59C35D" },
              areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
            },
          ],
        },
      ],
    };
    option && this.myChart.setOption(option);
  };

  initComparisonReportChart = () => {
    const { scoreChartData2 = [] } = this.props;
    let chartDom = document.querySelector("#comparisonReport");
    this.myChart1 = echarts.init(chartDom);
    let indicator = scoreChartData2.map((item, index) => {
      return {
        name: `${item.subjectName}\n ${item.score}`,
        max: item.gradeScore > item.score ? item.gradeScore : item.score,
      };
    });
    let option = {
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: function (parameters) {
          let result = "";
          scoreChartData2.map((item, index) => {
            result += `
                        <div style="font-size:12px;color:#01113d;">
                            <div>${item.subjectName}</div>
                            <div style="display:flex;align-items:center">
                                <div style="display:flex;align-items:center">
                                    <div style="width:5px;height:5px;border-radius:50%;background:#1890FF;margin:0 5px">
                                    </div>
                                    ${trans("scoreChart.self", "本人")}：${item.score}
                                </div>
                                <div style="display:flex;align-items:center">
                                    <div style="width:5px;height:5px;border-radius:50%;background:#59C35D;margin:0 5px">
                                    </div>
                                    ${trans("scoreChart.gradeAverage", "年级均分")}：${item.gradeScore}
                                </div>
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
        axisName: {
          color: "#01113d",
          fontSize: 12,
        },
        radius: "70%",
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: scoreChartData2.map((item) => item.score),
              name: trans("scoreChart.selfScore", "本人分数"),
              itemStyle: { color: "#1890FF" },
              areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
            },
            {
              value: scoreChartData2.map((item) => item.gradeScore),
              name: trans("scoreChart.gradeAverage", "年级均分"),
              itemStyle: { color: "#59C35D" },
              areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
            },
          ],
        },
      ],
    };
    option && this.myChart1.setOption(option);
  };

  seriesChange = (key) => {
    const { scoreChartData = [], scoreChartData2 = [] } = this.props;
    this.setState(
      {
        [`series${key}`]: this.state[`series${key}`] ? false : true,
      },
      () => {
        let data = [];
        if (key == 0 || key == 1) {
          if (this.state.series0) {
            data.push({
              value: scoreChartData.map((item, index) => item.score),
              name: trans("scoreChart.selfScore", "本人分数"),
              itemStyle: { color: "#1890FF" },
              areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
            });
          }
          if (this.state.series1) {
            data.push({
              value: scoreChartData.map((item, index) => item.gradeScore),
              name: trans("scoreChart.gradeAverage", "年级均分"),
              itemStyle: { color: "#59C35D" },
              areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
            });
          }
          this.myChart.setOption({
            series: [
              {
                name: "Budget vs spending",
                type: "radar",
                data: data,
                areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
              },
            ],
          });
        } else if (key == 2 || key == 3) {
          if (this.state.series2) {
            data.push({
              value: scoreChartData2.map((item, index) => item.score),
              name: trans("scoreChart.selfScore", "本人分数"),
              itemStyle: { color: "#1890FF" },
              areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
            });
          }
          if (this.state.series3) {
            data.push({
              value: scoreChartData2.map((item, index) => item.gradeScore),
              name: trans("scoreChart.gradeAverage", "年级均分"),
              itemStyle: { color: "#59C35D" },
              areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
            });
          }
          this.myChart1.setOption({
            series: [
              {
                name: "Budget vs spending",
                type: "radar",
                data: data,
                areaStyle: { opacity: 0.01 }, // 增加区域填充，使鼠标悬浮到区域时能触发
              },
            ],
          });
        }
      },
    );
  };

  onChange = (value) => {
    console.log(`selected ${value}`);
    this.props.contrastReportChange && this.props.contrastReportChange(value);
  };

  render() {
    const { contrastList, contrastReportId } = this.props;

    return (
      <div
        id="scoreChart"
        style={{
          backgroundColor: "#fff",
          borderRadius: "11px",
          marginTop: "10px",
        }}
        className={`${this.state.fullscreen ? styles.fullscreen : ""}`}
      >
        <AreaHeaderComponent
          showFullscreenBtn={true} //显示全屏按钮
          // showExportBtn={true}
          onClickExport={() => {
            this.exportFail(8);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("global.subjectLearningComparison", "各学科学情对比")}
        />
        <div
          style={{
            width: "100%",
            height: "344px",
            display: "flex",
            padding: "10px",
          }}
        >
          <div className={styles.score_box}>
            <div style={{ width: "100%", display: "flex" }}>
              <div
                style={{
                  color: "#01113d",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                {trans("global.thisReport", "本次报告")}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginLeft: "auto",
                }}
              >
                <div
                  onClick={() => {
                    this.seriesChange(0);
                  }}
                  className={`${this.state.series0 && styles.active} ${styles.number}`}
                >
                  {trans("global.myself", "本人")}
                </div>
                <div
                  onClick={() => {
                    this.seriesChange(1);
                  }}
                  className={`${this.state.series1 && styles.active} ${styles.number}`}
                >
                  {trans("global.gradeAverage", "年级平均")}
                </div>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: "calc(100% - 24px)",
              }}
              id="thisReport"
            ></div>
          </div>

          <div className={styles.score_box}>
            <div
              style={{ width: "100%", display: "flex", alignItems: "center" }}
            >
              <div
                style={{
                  color: "#01113d",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                {trans("global.comparisonReport", "对比报告")}
              </div>
              <Select
                showSearch
                style={{ width: 200, marginLeft: "16px" }}
                onChange={this.onChange}
                placeholder={trans("global.pleaseChoose", "请选择")}
                size="small"
                dropdownMatchSelectWidth={false}
                value={contrastReportId}
                filterOption={(input, option) =>
                  option.props.children
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {contrastList?.map((item, index) => {
                  return (
                    <Select.Option key={index} value={item.id}>
                      {item.reportName}
                    </Select.Option>
                  );
                })}
              </Select>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginLeft: "auto",
                }}
              >
                <div
                  onClick={() => {
                    this.seriesChange(2);
                  }}
                  className={`${this.state.series2 && styles.active} ${styles.number}`}
                >
                  {trans("global.myself", "本人")}
                </div>
                <div
                  onClick={() => {
                    this.seriesChange(3);
                  }}
                  className={`${this.state.series3 && styles.active} ${styles.number}`}
                >
                  {trans("global.gradeAverage", "年级平均")}
                </div>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: "calc(100% - 24px)",
              }}
              id="comparisonReport"
            ></div>
          </div>
        </div>
      </div>
    );
  }
}
export default ScoreChart;

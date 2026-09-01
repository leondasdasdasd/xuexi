import React, { Fragment, PureComponent } from "react";
import { Dropdown, Icon, Menu, message, Popover, Table } from "antd";

import ChartSwitch from "components/ChartSwitch";

import { getScoreDistinguishPlan, queryStuInfo } from "../../services/example";
import { locale, trans } from "../../utils/i18n";
import { loginRedirect } from "../../utils/utils";
import AreaHeaderComponent from "../AreaHeaderComponent";
import MyTabs from "../MyTabs";
import SetIntervalModal from "../SetIntervalModal";
import SettingRate from "../SettingRate";
import {
  buildAverageChartRows,
  buildClassOverviewBenchmark,
  buildRateChartRows,
  buildTripleChartRows,
  ClassOverviewChartRegistry,
  legacyG2TooltipOptions,
} from "./classOverviewChartModel";

import styles from "./index.module.less";

// const judgeNumber = (arr) => {
//     let flag = true;
//     var regPos = /^[0-9]+.?[0-9]*/; //判断是否是数字。
//     arr.forEach((item) => {
//         if (!regPos.test(item)) {
//             flag = false;
//             return;
//         }
//     });
//     return flag;
// };
const sum = (array) => {
  var s = 0;
  for (var index = array.length - 1; index >= 0; index--) {
    s = s + (array[index] - 0);
  }
  return s;
};

class OverviewClassGrades extends PureComponent {
  constructor(properties) {
    super(properties);
    this.classOverviewCharts = new ClassOverviewChartRegistry();
    this.state = {
      numPhaseList: ["", "", ""],
      // corresponding: ["", "", ""],
      selectMethod: 0,
      numPhase: 3,
      adjusting: false,
      check: 1,

      teacherNameVisible: false,
    };
  }
  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
  }
  componentWillUnmount() {
    this.classOverviewCharts.destroyAll();
  }
  exportImgClk = () => {
    this.classOverviewCharts.download("bar", "班级成绩柱状图");
  };
  exportImgClk1 = () => {
    this.classOverviewCharts.download("triple", "班级成绩三分对比图");
  };
  exportImgClk2 = () => {
    this.classOverviewCharts.download("rates", "班级成绩三率对比图");
  };
  exportImgClk5 = () => {
    this.classOverviewCharts.download("line", "班级成绩折线图");
  };

  changeTab2 = (check) => {
    this.classOverviewCharts.destroyAll();

    this.setState(
      {
        check,
      },
      () => {
        if (check == 2) {
          this.renderClassChart();
        } else if (check == 3) {
          this.renderTripleComparison();
        } else if (check == 4) {
          this.renderComparisonRates();
        } else if (check == 5) {
          this.renderLineChart();
        }
      },
    );
  };

  renderLineChart = () => {
    this.classOverviewCharts.destroy("line");
    const dom = document.querySelector("#lineChart");
    if (!dom) return;
    const { dataSource } = this.props;
    const { teacherNameVisible } = this.state;
    const data = buildAverageChartRows(dataSource || []);
    if (data.length === 0) return;
    if (dataSource && dataSource.length > 0) {
      if (dataSource.length > 4 && dataSource.length < 8) {
        dom.style.width = "50%";
      } else if (dataSource.length > 7) {
        dom.style.width = "100%";
      } else if (dataSource.length < 5) {
        dom.style.width = "33%";
      }
    }
    const chart = new G2.Chart({
      container: "lineChart",
      forceFit: true,
      height: 300,
      padding: [20, 60, 30, 40],
    });

    chart.source(data);
    if (teacherNameVisible) {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div 
                          style="
                          width:auto;
                          white-space:nowrap;
                          text-align:center;
                          margin-top:14px;
                          font-size: 10px;
                          color: rgba(1,17,61,0.85);
                          font-weight: 400;"
                       >
                          ${text}
                          <br />
                          ${teacherNameVisible ? data[index]?.courseTeacherNames : ""}
                        </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    } else {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div 
                          style="
                          width:auto;
                          white-space: nowrap;
                          text-align:center;
                          font-size: 10px;
                          color: rgba(1,17,61,0.85);
                          font-weight: 400;"
                       >
                          ${text}
                        </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    }

    const { averageScore: gradeAverage } =
      buildClassOverviewBenchmark(dataSource);
    if (this.state.averageChecked == true && gradeAverage !== null) {
      chart.guide().line({
        top: true,
        start: ["min", gradeAverage],
        end: ["max", gradeAverage],
        lineStyle: {
          stroke: "red",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: `${trans("qualityChart.gradeAverage", "年级均值")} ${gradeAverage}`,
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
            // opacity: 5,
          },
        },
      });
    }
    chart.scale("classScore", {
      alias: trans("global.score", "分数"),
      // max: this.props.viewData.totalScore,
      // min: 0,
      tickCount: 5,
    });
    chart.axis("classScore", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
    });
    chart.legend(false);
    if (this.state.averageClaaaChecked) {
      chart
        .line()
        .position("className*classScore")
        .color([
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
        ]);
      chart
        .point()
        .position("className*classScore")
        .size(4)
        .shape("circle")
        .style({
          stroke: "#fff",
          lineWidth: 1,
        })
        .label("classScore", {
          position: "top",
          textStyle: {
            fill: "#333",
            fontSize: 12,
            shadowBlur: 2,
          },
          formatter: (text) => {
            const value = Number.parseFloat(text);
            return text;
          },
          offset: 10,
        });
    } else {
      chart.line().position("className*classScore");
      chart
        .point()
        .position("className*classScore")
        .size(4)
        .shape("circle")
        .style({
          stroke: "#fff",
          lineWidth: 1,
        });
    }

    chart.tooltip(legacyG2TooltipOptions());
    this.classOverviewCharts.replace("line", chart);
    chart.render();
  };

  renderClassChart = () => {
    this.classOverviewCharts.destroy("bar");
    const dom = document.querySelector("#classChart");
    if (!dom) return;
    const { teacherNameVisible } = this.state;
    const { dataSource } = this.props;
    const data = buildAverageChartRows(dataSource || []);
    if (data.length === 0) return;

    if (dataSource && dataSource.length > 0) {
      if (dataSource.length > 4 && dataSource.length < 8) {
        dom.style.width = "50%";
        // console.log(dom.offsetWidth);
        // this[`chart${id}`].changeWidth(dom.offsetWidth);
      } else if (dataSource.length > 7) {
        dom.style.width = "100%";
        // this[`chart${id}`].changeWidth(dom.offsetWidth);
      } else if (dataSource.length < 5) {
        dom.style.width = "33%";
        // this[`chart${id}`]?.changeWidth(dom.offsetWidth);
      }
    }
    let chart = new G2.Chart({
      container: "classChart",
      forceFit: true,
      height: 300,
      // width:10000,
      padding: [20, 60, 30, 40],
    });

    chart.clear();
    chart.source(data);
    if (teacherNameVisible) {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div 
                          style="
                          width:auto;
                          white-space:nowrap;
                          text-align:center;
                          margin-top:14px;
                          font-size: 10px;
                          color: rgba(1,17,61,0.85);
                          font-weight: 400;"
                       >
                          ${text}
                          <br />
                          ${teacherNameVisible ? data[index]?.courseTeacherNames : ""}
                        </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    } else {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div 
                          style="
                          width:auto;
                          white-space: nowrap;
                          text-align:center;
                          font-size: 10px;
                          color: rgba(1,17,61,0.85);
                          font-weight: 400;"
                       >
                          ${text}
                        </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    }
    const { averageScore: gradeAverage } =
      buildClassOverviewBenchmark(dataSource);
    if (this.state.averageChecked == true && gradeAverage !== null) {
      chart.guide().line({
        top: true,
        start: ["min", gradeAverage],
        end: ["max", gradeAverage],
        lineStyle: {
          stroke: "red",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: `${trans("qualityChart.gradeAverage", "年级均值")} ${gradeAverage}`,
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
            // opacity: 5,
          },
        },
      });
    }
    chart.scale("classScore", {
      alias: trans("global.score", "分数"),
      max: this.props.viewData.totalScore,
      min: 0,
      tickCount: 5,
    });
    chart.axis("classScore", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
    });
    chart.legend(false);
    if (this.state.averageClaaaChecked) {
      chart
        .interval()
        .position("className*classScore")
        .size(32)
        .color("className", [
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
        ])
        .opacity(1)
        .label("classScore", {
          position: "top",
          textStyle: {
            fill: "#333",
            fontSize: 12,
            shadowBlur: 2,
            // shadowColor: "rgba(0, 0, 0, .45)",
          },
          formatter: (text) => {
            const value = Number.parseFloat(text);
            // if (val < 0.05) {
            //   return (val * 100).toFixed(1) + "%";
            // }
            return text;
          },
          offset: 10,
        });
    } else {
      chart
        .interval()
        .position("className*classScore")
        .size(32)
        .color("className", [
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
        ])
        .opacity(1);
    }
    chart.tooltip(legacyG2TooltipOptions());
    this.classOverviewCharts.replace("bar", chart);
    chart.render();
  };

  renderComparisonRates = () => {
    this.classOverviewCharts.destroy("rates");
    if (!document.querySelector("#comparisonRates")) return;
    const { teacherNameVisible } = this.state;
    const { dataSource } = this.props;
    const data = buildRateChartRows(dataSource || [], [
      trans("overviewClassGrades.excellentRate", "优秀率"),
      trans("overviewClassGrades.passRate", "及格率"),
      trans("overviewClassGrades.lowScoreRate", "低分率"),
    ]);
    if (data.length === 0) return;
    const chart = new G2.Chart({
      container: "comparisonRates",
      // forceFit: true,
      height: 300,
      padding: [25, 100, 30, 60],
      width: dataSource.length * 170,
    });

    chart.source(data);

    const {
      outstandingRate: maxScore,
      passRate,
      lowRate: minScore,
    } = buildClassOverviewBenchmark(dataSource);
    if (
      this.state.averageChecked2 == true &&
      maxScore !== null &&
      passRate !== null &&
      minScore !== null
    ) {
      chart.guide().line({
        top: true,
        // start: ["min", maxScore],
        // end: ["max", maxScore],
        start: ["0%", 100 - maxScore + "%"],
        end: ["95%", 100 - maxScore + "%"],
        lineStyle: {
          stroke: "#3d94ff",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: trans(
            "overviewClassGrades.gradeExcellentRate",
            "年级优秀率 {$rate}",
            { rate: `${maxScore}%` },
          ),
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
            // opacity: 5,
          },
        },
      });
      chart.guide().line({
        top: true,
        // start: ["min", passRate],
        // end: ["max", passRate],
        start: ["0%", 100 - passRate + "%"],
        end: ["95%", 100 - passRate + "%"],
        lineStyle: {
          stroke: "#12CC67",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: trans(
            "overviewClassGrades.gradePassRate",
            "年级及格率 {$rate}",
            {
              rate: `${passRate}%`,
            },
          ),
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
            // opacity: 5,
          },
        },
      });
      chart.guide().line({
        top: true,
        start: ["0%", 100 - minScore + "%"],
        end: ["95%", 100 - minScore + "%"],
        lineStyle: {
          stroke: "#c1c1c1",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: trans(
            "overviewClassGrades.gradeLowScoreRate",
            "年级低分率 {$rate}%",
            {
              rate: minScore,
            },
          ),
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
            // opacity: 5,
          },
        },
      });
    }
    chart.scale("classScore", {
      alias: trans("global.scoreRate", "得分率"),
      max: 100,
      min: 0,
      tickCount: 5,
      formatter(text) {
        return text + "%";
      },
    });

    chart.axis("classScore", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
      title: {
        offset: 50,
      },
    });
    chart.legend({
      position: "top-center",
    });
    chart.tooltip(
      legacyG2TooltipOptions({
        containerTpl:
          "<div class='g2-tooltip'>" +
          "<div class='g2-tooltip-title'>{className}</div>" +
          "<ul class='g2-tooltip-list'></ul>" +
          "</div>",
        itemTpl:
          "<li style='display: flex;'><span style='width: 130px'>{scoreName}</span><span style='width: 50px'>{classScore}%</span></li>",
      }),
    );
    if (this.state.averageClaaaChecked2) {
      chart
        .interval()
        .position("className*classScore")
        .color("scoreName", ["#3d94ff", "#12CC67", "#C1C1C1"])
        .opacity(1)
        .size(32)
        // .label("classScore")
        .adjust([
          {
            type: "dodge",
            // marginRatio: 0.2,
          },
        ])
        .tooltip(
          "className*classScore*scoreName",
          function (className, classScore, scoreName) {
            return {
              className,
              classScore,
              scoreName,
            };
          },
        )
        .label("classScore", {
          position: "top",
          textStyle: {
            fill: "#333",
            fontSize: 12,
            shadowBlur: 2,
            // shadowColor: "rgba(0, 0, 0, .45)",
          },
          // formatter: (text) => {
          //   // const val = parseFloat(text);
          //   // if (val < 0.05) {
          //   //   return (val * 100).toFixed(1) + "%";
          //   // }
          //   return text + "%";
          // },
          offset: 10,
        });
    } else {
      chart
        .interval()
        .position("className*classScore")
        .color("scoreName", ["#3d94ff", "#12CC67", "#C1C1C1"])
        .opacity(1)
        .size(32)
        // .label("classScore")
        .adjust([
          {
            type: "dodge",
            // marginRatio: 0.2,
          },
        ])
        .tooltip(
          "className*classScore*scoreName",
          function (className, classScore, scoreName) {
            return {
              className,
              classScore,
              scoreName,
            };
          },
        );
    }
    if (teacherNameVisible) {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div 
                          style="
                          width:auto;
                          white-space:nowrap;
                          text-align:center;
                          margin-top:14px;
                          font-size: 10px;
                          color: rgba(1,17,61,0.85);
                          font-weight: 400;"
                       >
                          ${text}
                          <br />
                          ${teacherNameVisible ? data[index * 3]?.courseTeacherNames || "" : ""}
                        </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    } else {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div 
                          style="
                          width:auto;
                          white-space:nowrap;
                          text-align:center; 
                          font-size: 10px;
                          color: rgba(1,17,61,0.85);
                          font-weight: 400;"
                       >
                          ${text} 
                        </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    }

    this.classOverviewCharts.replace("rates", chart);
    chart.render();
  };

  renderTripleComparison = () => {
    this.classOverviewCharts.destroy("triple");
    if (!document.querySelector("#tripleComparison")) return;
    const { teacherNameVisible } = this.state;
    const { dataSource } = this.props;
    const data = buildTripleChartRows(dataSource || [], [
      trans("global.avgScore", "平均分"),
      trans("global.maxScore", "最高分"),
      trans("global.minScore", "最低分"),
    ]);
    if (data.length === 0) return;

    const chart = new G2.Chart({
      container: "tripleComparison",
      // forceFit: true,
      height: 300,
      padding: [25, 100, 30, 40],
      width: dataSource.length * 170,
    });

    chart.source(data);

    const {
      averageScore: gradeAverage,
      maximumScore: gradeMaximum,
      minimumScore: gradeMinimum,
    } = buildClassOverviewBenchmark(dataSource);
    if (
      this.state.averageChecked1 == true &&
      gradeAverage !== null &&
      gradeMaximum !== null &&
      gradeMinimum !== null
    ) {
      chart.guide().line({
        top: true,
        // start: ["min", dataSource[0].avgScore],
        // end: ["max", dataSource[0].avgScore],
        start: ["0%", this.props.viewData.totalScore - gradeAverage + "%"],
        end: ["97%", this.props.viewData.totalScore - gradeAverage + "%"],
        lineStyle: {
          stroke: "#12CC67",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: `${trans("qualityChart.gradeAverage", "年级均值")} ${gradeAverage}`,
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
            // opacity: 5,
          },
        },
      });

      chart.guide().line({
        top: true,
        start: ["0%", this.props.viewData.totalScore - gradeMaximum + "%"],
        end: ["97%", this.props.viewData.totalScore - gradeMaximum + "%"],
        lineStyle: {
          stroke: "#3d94ff",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: `年级最高 ${gradeMaximum}`,
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
            // opacity: 5,
          },
        },
      });
      chart.guide().line({
        top: true,
        start: ["0%", this.props.viewData.totalScore - gradeMinimum + "%"],
        end: ["97%", this.props.viewData.totalScore - gradeMinimum + "%"],
        lineStyle: {
          stroke: "#C1C1C1",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: `年级最低 ${gradeMinimum}`,
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
            // opacity: 5,
          },
        },
      });
    }
    chart.scale("classScore", {
      alias: trans("global.score", "分数"),
      // nice: false,
      max: this.props.viewData.totalScore,
      // max: 140,
      min: 0,
      tickCount: 2,
    });
    // chart.downloadImage();
    if (teacherNameVisible) {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div 
                          style="
                          width:auto;
                          white-space:nowrap;
                          text-align:center;
                          margin-top:14px;
                          font-size: 10px;
                          color: rgba(1,17,61,0.85);
                          font-weight: 400;"
                       >
                          ${text}
                          <br />
                          ${teacherNameVisible ? data[index * 3]?.courseTeacherNames || "" : ""}
                        </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    } else {
      chart.axis("className", {
        label: {
          label: {
            offsetY: 0,
            htmlTemplate(text, item, index) {
              return `<div 
                            style="
                            width:auto;
                            white-space:nowrap;
                            text-align:center; 
                            font-size: 10px;
                            color: rgba(1,17,61,0.85);
                            font-weight: 400;"
                         >
                            ${text}
                          </div>`;
            },
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    }

    chart.axis("classScore", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
      title: {
        offset: 50,
      },
    });
    chart.legend({
      position: "top-center",
    });
    chart.tooltip(
      legacyG2TooltipOptions({
        containerTpl:
          "<div class='g2-tooltip'>" +
          "<div class='g2-tooltip-title'>{className}</div>" +
          "<ul class='g2-tooltip-list'></ul>" +
          "</div>",
        itemTpl: `<li style='display: flex;'><span style='width: 130px'>{scoreName}</span><span style='width: 50px'>{classScore}${trans("global.point", "分")}</span></li>`,
      }),
    );
    if (this.state.averageClaaaChecked1) {
      chart;
      chart
        .interval()
        .position("className*classScore")
        .color("scoreName", ["#3d94ff", "#12CC67", "#C1C1C1"])
        .opacity(1)
        .size(32)
        .label("classScore")
        .adjust([
          {
            type: "dodge",
            // marginRatio: 0.2,
          },
        ])
        .tooltip(
          "className*classScore*scoreName",
          function (className, classScore, scoreName) {
            return {
              className,
              classScore,
              scoreName,
            };
          },
        )
        .label("classScore", {
          position: "top",
          textStyle: {
            fill: "#333",
            fontSize: 12,
            shadowBlur: 2,
            // shadowColor: "rgba(0, 0, 0, .45)",
          },
          formatter: (text) => {
            const value = Number.parseFloat(text);
            // if (val < 0.05) {
            //   return (val * 100).toFixed(1) + "%";
            // }
            return text;
          },
          offset: 10,
        });
    } else {
      chart
        .interval()
        .position("className*classScore")
        .color("scoreName", ["#3d94ff", "#12CC67", "#C1C1C1"])
        .opacity(1)
        .size(32)
        // .label("classScore")
        .adjust([
          {
            type: "dodge",
            // marginRatio: 0.2,
          },
        ])
        .tooltip(
          "className*classScore*scoreName",
          function (className, classScore, scoreName) {
            return {
              className,
              classScore,
              scoreName,
            };
          },
        );
    }

    this.classOverviewCharts.replace("triple", chart);
    chart.render();
  };

  averageClassChange1 = (checked) => {
    this.setState(
      {
        averageClaaaChecked1: checked,
      },
      () => {
        this.renderTripleComparison();
      },
    );
  };

  averageChange1 = (checked) => {
    this.setState(
      {
        averageChecked1: checked,
      },
      () => {
        this.renderTripleComparison();
      },
    );
  };

  averageClassChange2 = (checked) => {
    this.setState(
      {
        averageClaaaChecked2: checked,
      },
      () => {
        this.renderComparisonRates();
      },
    );
  };

  averageChange2 = (checked) => {
    this.setState(
      {
        averageChecked2: checked,
      },
      () => {
        this.renderComparisonRates();
      },
    );
  };

  courseDetailSpecifyChange = (checked) => {
    this.props.courseDetailSpecifyChange &&
      this.props.courseDetailSpecifyChange(checked);
  };

  initChart = () => {
    if (this.state.check == 2) {
      this.renderClassChart();
    }
  };

  //设置三率
  settingRate = () => {
    this.setState({
      rateModalVisible: true,
    });
  };
  // 编辑分段
  clickEditSegment = (status) => {
    this.setState({
      adjusting: true,
    });
    getScoreDistinguishPlan({
      examId: this.props.testId,
      schoolLevel: status == true ? true : false,
    }).then((res) => {
      if (res.status) {
        const { scoreSectionModelList } = res.content;
        let temporaryList = scoreSectionModelList.map(
          (item) => item.endScore - item.startScore,
        );
        this.setState({
          numPhaseList: temporaryList,
          numPhase: temporaryList.length,
        });
      } else {
        message.error(res.message);
      }
    });
  };

  //改变modal状态
  changeRateModalVisible = () => {
    this.setState({
      rateModalVisible: false,
    });
    this.props.onSetInterval && this.props.onSetInterval();
  };

  hasVisibleTeacherName = (checked) => {
    this.setState(
      {
        teacherNameVisible: checked,
      },
      () => {
        if (this.state.check == 2) {
          this.renderClassChart();
        } else if (this.state.check == 5) {
          this.renderLineChart();
        } else if (this.state.check == 3) {
          this.renderTripleComparison();
        } else if (this.state.check == 4) {
          this.renderComparisonRates();
        }
      },
    );
  };

  averageClassChange = (checked) => {
    this.setState(
      {
        averageClaaaChecked: checked,
      },
      () => {
        if (this.state.check === 2) {
          this.renderClassChart();
        } else {
          this.renderLineChart();
        }
      },
    );
  };

  averageChange = (checked) => {
    this.setState(
      {
        averageChecked: checked,
      },
      () => {
        if (this.state.check === 2) {
          this.renderClassChart();
        } else {
          this.renderLineChart();
        }
      },
    );
  };
  handleCancel = () => {
    this.setState({
      adjusting: false,
    });
  };

  handleOk = () => {
    const { numPhaseList, numPhase, selectMethod } = this.state;
    let array = [];
    if (selectMethod == 1) {
      this.state.numPhaseList.length > 0 &&
        this.state.numPhaseList.map((item, index) => {
          if (index == 0) {
            array.push({
              startScore: 0,
              endScore: item,
            });
          } else {
            array.push({
              startScore: numPhaseList[index - 1],
              endScore: item,
            });
          }
        });
    } else {
      if (sum(numPhaseList) == 100) {
        this.state.numPhaseList.length > 0 &&
          this.state.numPhaseList.map((item, index) => {
            if (index == 0) {
              array.push({
                startScore: 0,
                endScore: item,
              });
            } else if (index == numPhase) {
              array.push({
                startScore: 100 - item,
                endScore: 100,
              });
            } else {
              let sum = 0;
              for (let index_ = index - 1; index_ >= 0; index_--) {
                sum += Number(numPhaseList[index_]);
              }
              array.push({
                startScore: sum,
                endScore: sum + Number(numPhaseList[index]),
              });
            }
          });
      }
    }
    if (array.length > 0) {
      this.props
        .dispatch({
          type: "home/postScoreSectionPlan",
          payload: {
            examId: this.props.testId,
            fraction: selectMethod,
            // examPaperId: this.paperId,
            distinguish: 1,
            scoreSectionModelList: array,
            schoolLevel: status == true ? true : false,
          },
        })
        .then(() => {
          this.setState(
            {
              selectMethod: 0,
              numPhaseList: ["", "", ""],
              // corresponding: ["", "", ""],
              adjusting: false,
            },
            () => {
              this.props.onHandleOk && this.props.onHandleOk();
            },
          );
        });
    }
  };

  onEditSegment = () => {
    getScoreDistinguishPlan({
      examId: this.props.testId,
      schoolLevel: status == true ? true : false,
    }).then((res) => {
      if (res.status) {
        const { scoreSectionModelList } = res.content;
        let temporaryList = scoreSectionModelList.map(
          (item) => item.endScore - item.startScore,
        );
        this.setState({
          numPhaseList: temporaryList,
          numPhase: temporaryList.length,
        });
      } else {
        message.error(res.message);
      }
    });
    this.setState({
      adjusting: true,
    });
  };

  clickReduce = () => {
    if (this.state.numPhase > 3) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      // let newArr = JSON.parse(JSON.stringify(this.state.corresponding));
      array.splice(-2, 1);
      // newArr.splice(newArr.length - 2, 1);
      this.setState({
        numPhase: this.state.numPhase - 1,
        numPhaseList: array,
        // corresponding: newArr,
      });
    }
  };

  clickAddd = () => {
    let newArray = [""];
    // let arr = [""];
    this.state.numPhaseList.map((item) => {
      newArray = [...newArray, ""];
    });
    // this.state.corresponding.map((item) => {
    //     arr = [...arr, ""];
    // });
    this.setState({
      numPhase: this.state.numPhase + 1,
      numPhaseList: newArray,
      // corresponding: arr,
    });
  };

  blurAfter = (value) => {
    // let newArr = JSON.parse(JSON.stringify(this.state.corresponding));
    this.props
      .dispatch({
        type: "home/postCalPercentOrFraction",
        payload: {
          examId: this.props.testId,
          fraction: this.state.selectMethod,
          scoreSectionModel: {
            startScore: 0,
            endScore: value.target.value,
          },
        },
      })
      .then(() => {
        // newArr.splice(0, 1, this.props.calPercentOrFraction);
        // this.setState({
        //     corresponding: newArr,
        // });
      });
  };

  changeAfter = (value) => {
    if (typeof value == "number" && value > 0) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(0, 1, value);
      this.setState({
        numPhaseList: array,
      });
      // if (judgeNumber(arr)) {
      //     let sum = eval(arr.join("+"));
      // }
    }
  };

  chengeMiddle = (index, value) => {
    if (typeof value == "number" && value > 0) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(index, 1, value);
      this.setState({
        numPhaseList: array,
      });
    }
  };

  blurMiddle = (index, value) => {
    // let newArr = JSON.parse(JSON.stringify(this.state.corresponding));
    let { numPhaseList, numPhase, selectMethod } = this.state;
    let startScore = 0;
    let endScore = 0;
    if (numPhase == 3) {
      startScore = Number(numPhaseList[0]);
      endScore = Number(numPhaseList[0]) + Number(value.target.value);
    } else {
      let sum = 0;
      for (let index_ = index - 1; index_ >= 0; index_--) {
        sum += Number(numPhaseList[index_]);
      }
      startScore = sum;
      endScore = sum + Number(value.target.value);
    }
    this.props
      .dispatch({
        type: "home/postCalPercentOrFraction",
        payload: {
          examId: this.props.testId,
          fraction: this.state.selectMethod,
          scoreSectionModel: {
            startScore:
              selectMethod == 0 ? startScore : numPhaseList[index - 1],
            endScore: selectMethod == 0 ? endScore : value.target.value,
          },
        },
      })
      .then(() => {
        // newArr.splice(index, 1, this.props.calPercentOrFraction);
        // this.setState({
        //     corresponding: newArr,
        // });
      });
  };

  changeSelectMethod = (e) => {
    this.setState({
      selectMethod: e.target.value,
      numPhaseList: ["", "", ""],
      // corresponding: ["", "", ""],
      numPhase: 3,
    });
  };

  getColumns = () => {
    let content = (
      <div
        className={[
          styles.stuInfoBox,
          this.state.stuInfoList && this.state.stuInfoList.length > 7
            ? ""
            : styles.noScorll,
        ].join(" ")}
      >
        {this.state.stuInfoList && this.state.stuInfoList.length > 0
          ? this.state.stuInfoList.map((item, index) => (
              <div className={styles.stuInfoMessage}>
                <span className={styles.sort}>{index + 1}</span>
                <span className={styles.infoName}>
                  {locale() === "en" ? item.ename : item.name}
                </span>
                <span>{item.studentScore}</span>
              </div>
            ))
          : null}
      </div>
    );

    const { dataSource } = this.props;
    const { teacherNameVisible } = this.state;
    let columns = [
      {
        title: trans("global.className", "班级名称"),
        dataIndex: "gradeAndGroupName",
        key: "gradeAndGroupName",
        width: 120,
        fixed: "left",
        render: (text, record) => {
          // console.log(text, record, "ppp");
          return (
            <>
              {text}
              {record.courseTeacherNames && teacherNameVisible ? (
                <>
                  {record.courseTeacherNames.length > 0 &&
                    record.courseTeacherNames.map((item) => (
                      <div className={styles.teachersName}>{item}</div>
                    ))}
                </>
              ) : null}
            </>
          );
        },
      },
      {
        title: trans("global.avgScore", "平均分"),
        dataIndex: "avgScore",
        key: "avgScore",
        width: 70,
        // render: (text, record, index) => {
        //     return <div className={comparePercentages(text, newArrDataSource[0]?.avgScore) == -1 ? styles.noPass : ""}>{text}</div>
        // }
      },
      {
        title: `${trans("global.avgScore", "平均分")}(%)`,
        dataIndex: "avgScoreRatio",
        key: "avgScoreRatio",
        width: 90,
      },
      {
        title: trans("global.maxScore", "最高分"),
        dataIndex: "maxScore",
        key: "maxScore",
        width: 80,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              <Popover
                content={content}
                title={null}
                overlayClassName={styles.stuPopover}
                trigger="click"
                getPopupContainer={false}
              >
                <i
                  className={[styles.iconfont, styles.clickIcon].join(" ")}
                  onClick={this.renderNumContent.bind(
                    this,
                    record.maxScoreStudentIds,
                  )}
                >
                  &#xe74e;
                </i>
              </Popover>
            </div>
          );
        },
      },
      {
        title: trans("global.minScore", "最低分"),
        dataIndex: "minScore",
        key: "minScore",
        width: 70,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              <Popover
                content={content}
                title={null}
                overlayClassName={styles.stuPopover}
                trigger="click"
                getPopupContainer={false}
              >
                <i
                  className={[styles.iconfont, styles.clickIcon].join(" ")}
                  onClick={this.renderNumContent.bind(
                    this,
                    record.minScoreStudentIds,
                  )}
                >
                  &#xe74e;
                </i>
              </Popover>
            </div>
          );
        },
      },
      {
        title: trans("global.medianScore", "中位分"),
        dataIndex: "medianScore",
        key: "avgmedianScoreScore",
        width: 70,
      },
      {
        title: trans("global.standardDeviation", "标准差"),
        dataIndex: "scoreStddev",
        key: "scoreStddev",
        width: 70,
      },
    ];
    let passRate = [];
    if (
      dataSource &&
      dataSource.length > 0 &&
      dataSource[0] &&
      dataSource[0].examAnalyseGroupRateNames &&
      dataSource[0].examAnalyseGroupRateNames.length > 0 &&
      dataSource[0].examAnalyseGroupRateNames.length > 0
    ) {
      dataSource[0].examAnalyseGroupRateNames.map((item, index) => {
        let column = {
          title: `${item.name}`,
          dataIndex: "examAnalyseGroupRateNames",
          key: `${item.id}`,
          width: 80,
          render: (text, record) => {
            let matchArray = record.examAnalyseGroupRates.filter(
              (item1) => item1.id == item.id,
            );
            return (
              <span>
                {matchArray && matchArray.length > 0 && matchArray.length > 0
                  ? matchArray[0].groupRate
                  : null}
              </span>
            );
          },
        };
        passRate.push(column);
      });
      columns.push(...passRate);
    }
    if (
      dataSource &&
      dataSource.length > 0 &&
      dataSource[0].studentStageModelList &&
      dataSource[0].studentStageModelList.length > 0
    ) {
      dataSource[0].studentStageModelList.map((item, ii) => {
        columns.push(
          {
            title: `${item.stageText}`,
            dataIndex: `${item.stageText}`,
            key: `${item.stageText}`,
            width: [80, 95, 80][ii],
            render: (text, record) => {
              return (
                <div>
                  <span>{text?.studentNum}</span>
                  <Popover
                    content={content}
                    title={null}
                    overlayClassName="styles"
                    trigger="click"
                    getPopupContainer={false}
                  >
                    <i
                      className={[styles.iconfont, styles.clickIcon].join(" ")}
                      onClick={this.renderNumContent.bind(
                        this,
                        text?.studentIdList,
                      )}
                    >
                      &#xe74e;
                    </i>
                  </Popover>
                </div>
              );
            },
          },
          {
            title: `${item.stageText}${trans("global.averageScoreShort", "均分")}`,
            dataIndex: `${item.stageText}均分`,
            key: `${item.stageText}均分`,
            width: [100, 120, 100][ii],
          },
        );
      });
    }

    columns.push(
      {
        title: trans("global.actualNumberOfExaminees", "实考人数"),
        dataIndex: "examStudentCount",
        key: "examStudentCount",
        width: 80,
      },
      {
        title: trans("global.numberOfAbsentees", "缺考人数"),
        dataIndex: "missExamStudentCount",
        key: "missExamStudentCount",
        // width: 80,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              {text === 0 ? null : (
                <Popover
                  content={content}
                  title={null}
                  overlayClassName={styles.stuPopover}
                  trigger="click"
                  getPopupContainer={false}
                  placement="bottom"
                >
                  <i
                    className={[styles.iconfont, styles.clickIcon].join(" ")}
                    onClick={this.renderNumContent.bind(
                      this,
                      record.missExamStudentIds,
                    )}
                  >
                    &#xe74e;
                  </i>
                </Popover>
              )}
            </div>
          );
        },
      },
    );
    return columns;
  };

  renderNumContent = (number_) => {
    queryStuInfo({
      stuList: number_,
      examId: this.props.testId,
      paperId: this.paperId,
    }).then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          this.setState({
            stuInfoList: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  getDataSource = () => {
    const { dataSource } = this.props;
    let newArrayDataSource = [];
    if (dataSource && dataSource.length > 0) {
      dataSource.map((it) => {
        let newObject = it;
        it.studentStageModelList &&
          it.studentStageModelList.length > 0 &&
          it.studentStageModelList.map((item) => {
            newObject[`${item.stageText}`] = {
              avgScore: item.avgScore,
              studentNum: item?.studentNum,
              studentIdList: item?.studentIdList,
            };
            newObject[`${item.stageText}分数`] = {
              avgScore: item.avgScore,
              studentNum: item?.studentNum,
              studentIdList: item?.studentIdList,
            };
            newObject[`${item.stageText}均分`] = item.avgScore;
          });
        newArrayDataSource.push(newObject);
      });
    }

    return newArrayDataSource;
  };

  handelSort = (e) => {
    this.props.handelSort && this.props.handelSort(e);
  };

  render() {
    const { selectMethod, numPhaseList, numPhase } = this.state;
    const { dataSource } = this.props;
    return (
      <div
        style={{ background: "rgb(255, 255, 255)", borderRadius: "10px" }}
        id="innerContent"
      >
        <div
          className={`${this.props.isInnerFullScreen ? styles.fullScreen : ""}`}
          id="table1"
        >
          <AreaHeaderComponent
            showFullscreenBtn={false} //显示全屏按钮
            title={trans("data.courseDetail", "班级成绩概况")}
            leftPanelContent={
              <MyTabs
                data={[
                  { tab: trans("global.listView", "列表视图"), key: 1 },
                  { tab: trans("global.lineChart", "折线图"), key: 5 },
                  { tab: trans("global.histogram", "柱状图"), key: 2 },
                  { tab: trans("global.tripleComparison", "三分对比"), key: 3 },
                  { tab: trans("global.comparisonRates", "三率对比"), key: 4 },
                ]}
                onChange={(value) => {
                  this.changeTab2(value.key);
                }}
                activeKey={1}
              />
            }
            rightPanelContent={
              <>
                <ChartSwitch
                  label={trans("global.courseTeacher", "授课老师")}
                  defaultChecked
                  checked={this.state.teacherNameVisible}
                  onChange={this.hasVisibleTeacherName}
                />

                {this.state.check == 2 || this.state.check == 5 ? (
                  <>
                    <ChartSwitch
                      label={trans("global.classAverageScore", "班级均分")}
                      defaultChecked
                      checked={this.state.averageClaaaChecked}
                      onChange={this.averageClassChange}
                    />
                    <ChartSwitch
                      defaultChecked
                      label={trans("global.gradeAverageScore", "年级均分")}
                      checked={this.state.averageChecked}
                      onChange={this.averageChange}
                    />
                  </>
                ) : null}

                {this.state.check == 3 ? (
                  <>
                    <ChartSwitch
                      label={trans("global.classThreePoints", "班级三分")}
                      defaultChecked
                      checked={this.state.averageClaaaChecked1}
                      onChange={this.averageClassChange1}
                    />
                    <ChartSwitch
                      label={trans("global.gradeThreePoints", "年级三分")}
                      defaultChecked
                      checked={this.state.averageChecked1}
                      onChange={this.averageChange1}
                    />
                  </>
                ) : null}

                {this.state.check == 4 ? (
                  <>
                    <ChartSwitch
                      label={trans("global.classThreeRates", "班级三率")}
                      defaultChecked
                      checked={this.state.averageClaaaChecked2}
                      onChange={this.averageClassChange2}
                    />
                    <ChartSwitch
                      label={trans("global.gradeThreeRates", "年级三率")}
                      defaultChecked
                      checked={this.state.averageChecked2}
                      onChange={this.averageChange2}
                    />
                  </>
                ) : null}
                {this.props.filterStudentListPermissions
                  ?.haveFilterStudentList ? (
                  <ChartSwitch
                    defaultChecked
                    label={trans("global.specifyAnalysis", "指定分析")}
                    checked={this.props.courseDetailSpecify}
                    onChange={this.courseDetailSpecifyChange}
                  />
                ) : null}
                {[1, 2, 5].includes(this.state.check) ? (
                  <Dropdown
                    overlay={
                      <Menu
                        className={styles.dropdownWarp}
                        selectedKeys={this.props.sortType}
                        onClick={this.handelSort}
                      >
                        <Menu.Item key="1" className={styles.dropdownItem}>
                          {trans("global.sortByClass", "按班级排序")}
                        </Menu.Item>
                        <Menu.Item key="2" className={styles.dropdownItem}>
                          {trans("global.lowToHigh", "按平均分从低到高")}
                        </Menu.Item>
                        <Menu.Item key="3" className={styles.dropdownItem}>
                          {trans("global.highToLow", "按平均分从高到低")}
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <div className={`${styles.sortBtn} ${styles.mr14}`}>
                      {trans("global.sort", "排序")} <Icon type="down" />
                    </div>
                  </Dropdown>
                ) : null}
                <span
                  className={`${styles.textWarp} ${styles.mr14}`}
                  onClick={() => {
                    this.settingRate();
                  }}
                >
                  {trans("global.settingRate", "设置三率")}
                </span>
                <span
                  className={`${styles.textWarp} ${styles.mr14}`}
                  onClick={this.clickEditSegment}
                >
                  {trans("global.editSegment", "编辑分段")}
                </span>
                {this.state.check == 2 ? (
                  <span
                    className={`${styles.textWarp} ${styles.mr14}`}
                    onClick={() => this.exportImgClk()}
                  >
                    {trans("global.exportPicture", "截图")}
                  </span>
                ) : null}
                {this.state.check == 3 ? (
                  <span
                    className={`${styles.textWarp} ${styles.mr14}`}
                    onClick={() => this.exportImgClk1()}
                  >
                    {trans("global.exportPicture", "截图")}
                  </span>
                ) : null}
                {this.state.check == 4 ? (
                  <span
                    className={`${styles.textWarp} ${styles.mr14}`}
                    onClick={() => this.exportImgClk2()}
                  >
                    {trans("global.exportPicture", "截图")}
                  </span>
                ) : null}
                {this.state.check == 5 ? (
                  <span
                    className={`${styles.textWarp} ${styles.mr14}`}
                    onClick={() => this.exportImgClk5()}
                  >
                    {trans("global.exportPicture", "截图")}
                  </span>
                ) : null}
                <a
                  href={`${window.location.origin}/api/export/exam/groupScoreAnalyse?examId=${this.props.testId}&filterFlag=${this.props.courseDetailSpecify}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className={`${styles.textWarp}`}>
                    {trans("global.export", "导出")}
                  </span>
                </a>
                {
                  <div style={{ marginLeft: "10px" }}>
                    {this.props.isInnerFullScreen ? (
                      <i
                        className={styles.iconfont}
                        onClick={() => {
                          this.props.exitFullscreen("innerContent");
                        }}
                      >
                        &#xe8a3;
                      </i>
                    ) : (
                      <i
                        className={styles.iconfont}
                        onClick={() => {
                          this.props.fullscreen("innerContent");
                        }}
                      >
                        &#xe8a4;
                      </i>
                    )}
                  </div>
                }
              </>
            }
          />

          <div
            className={[styles.tableBoxContent, styles.tableCourseDetail].join(
              " ",
            )}
          >
            {this.state.check == 1 ? (
              <Table
                dataSource={this.getDataSource()}
                pagination={false}
                scroll={{ x: 1600 }}
                columns={this.getColumns()}
              />
            ) : this.state.check == 2 ? (
              <div id="classChart" key={2}></div>
            ) : this.state.check == 3 ? (
              <div
                id="tripleComparison"
                key={3}
                style={
                  dataSource?.length > 6
                    ? {
                        maxWidth: 5000,
                        overflowX: "scroll",
                        display: "flex",
                      }
                    : { maxWidth: 5000, display: "flex" }
                }
              ></div>
            ) : this.state.check == 5 ? (
              <div id="lineChart" key={5}></div>
            ) : (
              <div
                id="comparisonRates"
                key={7}
                style={
                  dataSource?.length > 6
                    ? {
                        maxWidth: 5000,
                        overflowX: "scroll",
                        display: "flex",
                      }
                    : { maxWidth: 5000, display: "flex" }
                }
              ></div>
            )}
          </div>

          <SetIntervalModal
            visible={this.state.adjusting}
            numPhaseList={this.state.numPhaseList}
            numPhase={this.state.numPhase}
            selectMethod={this.state.selectMethod}
            onCancel={this.handleCancel}
            onOk={this.handleOk}
            onEditSegment={this.onEditSegment}
            clickReduce={this.clickReduce}
            clickAddd={this.clickAddd}
            blurAfter={this.blurAfter}
            changeAfter={this.changeAfter}
            dispatch={this.props.dispatch}
            chengeMiddle={this.chengeMiddle}
            blurMiddle={this.blurMiddle}
            changeSelectMethod={this.changeSelectMethod}
          />

          {this.state.rateModalVisible ? (
            <SettingRate
              visible={this.state.rateModalVisible}
              rateModalStatus={this.changeRateModalVisible}
              testId={this.testId}
              paperId={this.paperId}
            />
          ) : null}
        </div>
      </div>
    );
  }
}
export default OverviewClassGrades;

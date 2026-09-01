import React, { PureComponent } from "react";
import { Table } from "antd";

import {
  buildAverageChartRows,
  buildClassOverviewBenchmark,
  buildRateChartRows,
  buildTripleChartRows,
  ClassOverviewChartRegistry,
  legacyG2TooltipOptions,
} from "../../../../components/OverviewClassGrades/classOverviewChartModel";
import { trans } from "../../../../utils/i18n";

import styles from "./GradeScoreOverviewCanvas.module.less";

class GradeScoreOverviewCanvas extends PureComponent {
  constructor(properties) {
    super(properties);
    this.classOverviewCharts = new ClassOverviewChartRegistry();
    this.state = {
      teacherNameVisible: false,
    };
  }
  componentDidMount() {
    this.renderLineChart();
    this.renderClassChart();
    this.renderComparisonRates();
    this.renderTripleComparison();
  }
  componentWillUnmount() {
    this.classOverviewCharts.destroyAll();
  }

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
          content: `年级均分 ${gradeAverage}`,
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
      alias: "分数",
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
      } else if (dataSource.length > 7) {
        dom.style.width = "100%";
      } else if (dataSource.length < 5) {
        dom.style.width = "33%";
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
          content: `年级均分 ${gradeAverage}`,
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
      alias: "分数",
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
      "优秀率",
      "及格率",
      "低分率",
    ]);
    if (data.length === 0) return;
    const chart = new G2.Chart({
      container: "comparisonRates",
      // forceFit: true,
      height: 300,
      padding: [25, 100, 30, 60],
      width: dataSource?.length * 170,
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
          content: `年级优秀率 ${maxScore}%`,
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
          content: `年级及格率 ${passRate}%`,
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
          content: `年级低分率 ${minScore}%`,
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
      alias: "得分率",
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
      "平均分",
      "最高分",
      "最低分",
    ]);
    if (data.length === 0) return;

    const chart = new G2.Chart({
      container: "tripleComparison",
      height: 300,
      padding: [25, 100, 30, 40],
      width: dataSource?.length * 170,
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
        start: ["0%", this.props.viewData.totalScore - gradeAverage + "%"],
        end: ["97%", this.props.viewData.totalScore - gradeAverage + "%"],
        lineStyle: {
          stroke: "#12CC67",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: `年级均分 ${gradeAverage}`,
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
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
          },
        },
      });
    }
    chart.scale("classScore", {
      alias: "分数",
      max: this.props.viewData.totalScore,
      min: 0,
      tickCount: 2,
    });
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

  getColumns = () => {
    const { dataSource } = this.props;
    let columns = [
      {
        title: trans("global.className", "班级名称"),
        dataIndex: "gradeAndGroupName",
        key: "gradeAndGroupName",
        width: 140,
      },
      {
        title: trans("global.avgScore", "平均分"),
        dataIndex: "avgScore",
        key: "avgScore",
        width: 65,
      },
      {
        title: `${trans("global.avgScore", "平均分")}%`,
        dataIndex: "avgScoreRatio",
        key: "avgScoreRatio",
        width: 80,
      },
      {
        title: trans("global.maxScore", "最高分"),
        dataIndex: "maxScore",
        key: "maxScore",
        width: 60,
      },
      {
        title: trans("global.minScore", "最低分"),
        dataIndex: "minScore",
        key: "minScore",
        width: 60,
      },
      {
        title: trans("global.medianScore", "中位分"),
        dataIndex: "medianScore",
        key: "avgmedianScoreScore",
        width: 60,
      },
      {
        title: trans("global.standardDeviation", "标准差"),
        dataIndex: "scoreStddev",
        key: "scoreStddev",
        width: 60,
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
          width: 65,
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
            width: [60, 85, 60][ii],
            render: (text, record) => {
              return (
                <div>
                  <span>{text?.studentNum}</span>
                </div>
              );
            },
          },
          {
            title: `${item.stageText}${trans(
              "global.averageScoreShort",
              "均分",
            )}`,
            dataIndex: `${item.stageText}均分`,
            key: `${item.stageText}均分`,
            width: [85, 110, 85][ii],
          },
        );
      });
    }

    columns.push(
      {
        title: trans("global.actualNumberOfExaminees", "实考人数"),
        dataIndex: "examStudentCount",
        key: "examStudentCount",
        width: 70,
      },
      {
        title: trans("global.numberOfAbsentees", "缺考人数"),
        dataIndex: "missExamStudentCount",
        key: "missExamStudentCount",
      },
    );
    return columns;
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

  render() {
    const { dataSource } = this.props;
    return (
      <div style={{ background: "rgb(255, 255, 255)", borderRadius: "10px" }}>
        <div className={styles.tableCourseDetail}>
          <div id="groupScore_component">
            <span className={styles.tableHeaderTitle}>
              {trans("data.courseDetail", "班级成绩概况")}
            </span>
            <Table
              dataSource={this.getDataSource()}
              pagination={false}
              scroll={{ x: 1600 }}
              columns={this.getColumns()}
            />
            <div id="classChart" key={2}></div>
          </div>
          <div id="groupScore1_component">
            <span className={styles.tableHeaderTitle}>
              {trans("data.courseDetail", "班级成绩概况")}
            </span>
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
            <div id="lineChart" key={5}></div>
          </div>
          <div id="groupScore2_component">
            <span className={styles.tableHeaderTitle}>
              {trans("data.courseDetail", "班级成绩概况")}
            </span>
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
          </div>
        </div>
      </div>
    );
  }
}
export default GradeScoreOverviewCanvas;

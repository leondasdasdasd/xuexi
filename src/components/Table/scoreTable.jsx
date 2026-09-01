import React, { PureComponent } from "react";
import { DataSet } from "@antv/data-set";
import G2 from "@antv/g2";
import { Input, Table } from "antd";
import { connect } from "dva";
import * as echarts from "echarts";
import $ from "jquery";

import ChartSwitch from "components/ChartSwitch";
import MyTabs from "components/MyTabs";

import { trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";
import ScoreSetting from "../ScoreSetting";

import styles from "./index.module.less";
const { Search } = Input;
let chart;
let chart1;

const getStackedChartRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const bucketCount = rows[0]?.scoreSectionAnalyseRow?.length;
  if (!bucketCount) return null;
  const isCompleteMatrix = rows.every(
    (row) =>
      Array.isArray(row?.scoreSectionAnalyseRow) &&
      row.scoreSectionAnalyseRow.length === bucketCount &&
      row.scoreSectionAnalyseRow.every(
        (bucket) => typeof bucket?.scoreRate === "string",
      ),
  );
  return isCompleteMatrix ? rows : null;
};

class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 3,
      groupId: null,
      pageNo: 1,
      stuName: "",
      isSetGrades: false,
      scoreSegmentationSpecify: false,
      teacherNameVisible: true,
    };
  }

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);

    if (this.props.isParentInit) {
      console.log("从父组件加载完成后再初始化数据");
    } else {
      this.props
        .dispatch({
          type: "home/clearScoreSection",
        })
        .then(() => {
          this.props
            .dispatch({
              type: "home/getScoreSection",
              payload: {
                examId: this.props.examId,
                filterFlag: this.state.scoreSegmentationSpecify,
                groupId: this.props.groupId,
              },
            })
            .then(() => {
              if (
                this.state.check === 2 &&
                this.props.questionScore?.scoreSectionAnalyseRowList.length > 0
              ) {
                const { questionScore } = this.props;
                chart = new G2.Chart({
                  container: "mountNode",
                  // forceFit: true,
                  height: 300,
                  width:
                    questionScore.scoreSectionAnalyseRowList.length > 12
                      ? 3000
                      : questionScore.scoreSectionAnalyseRowList.length > 10
                        ? 2500
                        : questionScore.scoreSectionAnalyseRowList.length > 8
                          ? 2000
                          : questionScore.scoreSectionAnalyseRowList.length > 6
                            ? 1600
                            : 1200,
                  padding: "auto",
                });
                this.renderChart(true);
              }
              if (this.state.check == 3) {
                this.renderChartPile();
              }
            });
        });
    }
  }

  // 父组加载完毕后可以调用次函数初始化数据，相当于父组件加载完毕之后调用
  initData = () => {
    this.props
      .dispatch({
        type: "home/getScoreSection",
        payload: {
          examId: this.props.examId,
          filterFlag: this.state.scoreSegmentationSpecify,
          groupId: this.props.groupId,
        },
      })
      .then(() => {
        if (
          this.state.check === 2 &&
          this.props.questionScore?.scoreSectionAnalyseRowList.length > 0
        ) {
          const { questionScore } = this.props;
          chart = new G2.Chart({
            container: "mountNode",
            // forceFit: true,
            height: 300,
            width:
              questionScore.scoreSectionAnalyseRowList.length > 12
                ? 3000
                : questionScore.scoreSectionAnalyseRowList.length > 10
                  ? 2500
                  : questionScore.scoreSectionAnalyseRowList.length > 8
                    ? 2000
                    : questionScore.scoreSectionAnalyseRowList.length > 6
                      ? 1600
                      : 1200,
            padding: "auto",
          });
          this.renderChart();
        }
        if (this.state.check == 3) {
          this.renderChartPile();
        }
      });
  };

  getPage = (notRender, type) => {
    this.props
      .dispatch({
        type: "home/clearScoreSection",
      })
      .then(() => {
        this.props
          .dispatch({
            type: "home/getScoreSection",
            payload: {
              examId: this.props.examId,
              filterFlag: this.state.scoreSegmentationSpecify,
              groupId: this.props.groupId,
            },
          })
          .then(() => {
            console.log(12_211);
            this.renderChartPile();
            if (this.state.check === 2) {
              this.renderChart(notRender);
            }
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
  renderChart = (notRender) => {
    const dom = document.querySelector("#mountNode");
    if (!dom) return;
    $("#mountNode > div").remove();

    const { questionScore } = this.props;
    var _DataSet = DataSet,
      DataView = _DataSet.DataView;
    if (!notRender) {
      chart = new G2.Chart({
        container: "mountNode",
        // forceFit: true,
        height: 300,
        width:
          questionScore.scoreSectionAnalyseRowList.length > 12
            ? 3000
            : questionScore.scoreSectionAnalyseRowList.length > 10
              ? 2500
              : questionScore.scoreSectionAnalyseRowList.length > 8
                ? 2000
                : questionScore.scoreSectionAnalyseRowList.length > 6
                  ? 1600
                  : 1200,
        padding: "auto",
      });
    }
    var _G = G2,
      Chart = _G.Chart;
    let newData = [];
    if (questionScore.columnSet && questionScore.columnSet.length > 0) {
      questionScore.columnSet.map((item) => {
        let newObject = {};
        let isNo = true;
        newObject.type = item.scoreSectionTitle;
        if (
          questionScore.scoreSectionAnalyseRowList &&
          questionScore.scoreSectionAnalyseRowList.length > 0
        ) {
          questionScore.scoreSectionAnalyseRowList.map((it) => {
            if (
              it.scoreSectionAnalyseRow &&
              it.scoreSectionAnalyseRow.length > 0
            ) {
              it.scoreSectionAnalyseRow.map((index) => {
                let newChild = {};
                if (index.scoreSectionIndex === item.scoreSectionIndex) {
                  // newObj[`${it.groupName}`] = i.score;
                  isNo = false;
                  // newObj.company = it.groupName;
                  // newObj.value = i.score
                }
              });
            }
          });
        }
        if (isNo) {
          newData.push(newObject);
        }
      });
    }
    if (
      questionScore.scoreSectionAnalyseRowList &&
      questionScore.scoreSectionAnalyseRowList.length > 0
    ) {
      questionScore.scoreSectionAnalyseRowList.map((it, index) => {
        if (index == 0) return;
        if (it.scoreSectionAnalyseRow && it.scoreSectionAnalyseRow.length > 0) {
          it.scoreSectionAnalyseRow.map((index_, index) => {
            if (questionScore.columnSet && questionScore.columnSet.length > 0) {
              questionScore.columnSet.map((item) => {
                let newChild = {};
                if (index_.scoreSectionIndex === item.scoreSectionIndex) {
                  // newObj[`${it.groupName}`] = i.score;
                  newChild.company = it.groupName;
                  newChild.type = item.scoreSectionTitle;
                  newChild.value = index_.score;
                  newChild.scoreSectionLevelName =
                    item.scoreSectionLevelName + item.scoreSectionTitle + "";
                  newData.push(newChild);
                }
              });
            }
          });
        }
      });
    }
    console.log(newData, "nnmm");
    var data = newData;

    let newColumnsList = [];
    if (
      questionScore.scoreSectionAnalyseRowList &&
      questionScore.scoreSectionAnalyseRowList.length > 0
    ) {
      questionScore.scoreSectionAnalyseRowList.map((item) => {
        newColumnsList.push(item.groupName);
      });
    }

    chart.source(data);
    // chart.changeData(data);
    chart.scale("value", {
      alias: "人数",
      //   max: 25,
      min: 0,
      tickCount: 2,
    });
    // chart.downloadImage();
    chart.axis("scoreSectionLevelName", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
      tickLine: {
        alignWithLabel: false,
        length: 0,
      },
    });

    chart.axis("value", {
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
    chart.tooltip({
      containerTpl:
        "<div class='g2-tooltip'>" +
        "<div class='g2-tooltip-title'>{scoreSectionLevelName}</div>" +
        "<ul class='g2-tooltip-list'></ul>" +
        "</div>",
      itemTpl: `<li style='display: flex;'><span style='width: 130px'>{company}</span><span style='width: 50px'>{value}${trans("global.person", "人")}</span></li>`,
    });

    chart
      .interval()
      .position("scoreSectionLevelName*value")
      .color("company", [
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
      // .size(20)
      .label("value")
      .adjust([
        {
          type: "dodge",
          // marginRatio: 0.2,
        },
      ])
      .tooltip(
        "tyscoreSectionLevelNamepe*value*company",
        function (scoreSectionLevelName, value, company) {
          return {
            scoreSectionLevelName,
            value,
            company,
          };
        },
      );

    chart.render();
    if (notRender) {
      chart.changeData(data);
    }
    window.CHART = chart;
  };
  renderChartPile = () => {
    var chartDom = document.querySelector("#pile");
    const scoreSectionAnalyseRowList = getStackedChartRows(
      this.props.questionScore?.scoreSectionAnalyseRowList,
    );
    // 分析请求失败时 store 会保留空数组，不应创建或迭代空图表。
    if (!chartDom || !scoreSectionAnalyseRowList) return;

    if (this.props.questionScore) {
      var myChart = echarts.init(chartDom);
      const { teacherNameVisible } = this.state;
      let series = [];
      let Lang = scoreSectionAnalyseRowList[0]?.scoreSectionAnalyseRow.length;

      for (const [
        index,
      ] of scoreSectionAnalyseRowList[0].scoreSectionAnalyseRow.entries()) {
        let list = [];

        for (const [, item1] of scoreSectionAnalyseRowList.entries()) {
          // A+放到最上面，取值也要从后面
          list.push(
            item1.scoreSectionAnalyseRow[Lang - (index + 1)].scoreRate.split(
              "%",
            )[0],
          );
        }
        // 这里为把A+放到最上面，从最后面开始取
        series.push({
          name: scoreSectionAnalyseRowList[0].scoreSectionAnalyseRow[
            Lang - (index + 1)
          ].scoreSectionLevelName,
          type: "bar",
          stack: "total",
          barWidth: "60%",
          label: {
            show: true,
            formatter: (parameters) => {
              return Math.round(parameters.value * 10) / 10 + "%";
            },
          },
          data: list,
          barMaxWidth: 40,
          barCategoryGap: "10%",
        });
      }

      let option = {
        color: ["#FC7D7D", "#FEB551", "#99D748", "#22B7A0", "#3D94FF"],
        legend: {
          show: true,
          top: "top",
          orient: "horizontal",
          itemWidth: 10,
          itemHeight: 10,
        },
        toolbox: {
          feature: {
            saveAsImage: {
              name: trans(
                "scoreTable.scoreSectionStackedChart",
                "成绩分段堆叠图",
              ),
              title: trans("scoreTable.screenshot", "截图"),
            },
          },
          right: 40,
          top: 0,
        },
        tooltip: {
          formatter: function (parameters) {
            let content = "";
            for (const item of scoreSectionAnalyseRowList[parameters.dataIndex]
              .scoreSectionAnalyseRow) {
              content += `<div style="display:flex;">
                <div style="width:60px">${item.scoreSectionLevelName}</div>
                <div style="width:60px">${item.score}${trans("global.person", "人")}</div>
                <div style="width:60px">${item.scoreRate}</div>
             </div>`;
            }
            return `<div style="font-size:14px;color:rgba(1,17,61,0.85)">${parameters.name}<div>${content}</div></div>`;
          },
        },
        grid: {
          left: 50,
          right:
            chartDom.offsetWidth - scoreSectionAnalyseRowList.length * 80 > 30
              ? chartDom.offsetWidth - scoreSectionAnalyseRowList.length * 80
              : 30,
          top: 30,
          bottom: 50,
        },
        yAxis: {
          max: 100, // 强制 Y 轴最大值为 100%
          type: "value",
          axisLabel: {
            formatter: "{value}%", // Y 轴显示为百分比
          },
          textStyle: {
            color: "rgba(1, 17, 61, 0.16)",
          },
          splitLine: {
            lineStyle: {
              // 使用深浅的间隔色
              color: "rgba(1, 17, 61, 0.16)",
              type: "dashed",
              width: 0.5,
            },
          },
        },
        xAxis: {
          type: "category",
          axisLabel: {
            formatter: function (value, index) {
              let nameList =
                scoreSectionAnalyseRowList[index].courseTeacherNames;
              return `{AStyle|${value}}\n{BStyle|${teacherNameVisible && nameList ? nameList : ""}}`;
            },
            rich: {
              AStyle: {
                fontSize: "10px",
                color: "rgba(1,17,61,0.85)",
              },
              BStyle: {
                fontSize: "10px",
                color: "rgba(1,17,61,0.85)",
                lineHeight: "17",
              },
            },
            interval: 0,
          },
          data: scoreSectionAnalyseRowList.map((item) => item.groupName),
        },
        series,
      };
      option && myChart.setOption(option);
    }
  };

  exportImgClk = () => {
    if (this.state.check == 2) {
      window.CHART.downloadImage("成绩分段柱状图");
    } else {
      window.CHART.downloadImage("成绩分段堆叠图");
    }
  };
  changeTab = (check) => {
    this.setState(
      {
        check,
      },
      () => {
        // $("#pile > div").remove()
        $("#mountNode > div").remove();
        if (check === 1) {
          this.getPage();
        } else if (check === 3) {
          this.renderChartPile();
        } else {
          this.getPage();
        }
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
  clickSetGrades = () => {
    this.setState({
      isSetGrades: !this.state.isSetGrades,
    });
  };
  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        scoreSegmentationSpecify: checked,
      },
      () => {
        this.getPage(true);
      },
    );
  };
  hasVisibleTeacherName = (checked) => {
    this.setState(
      {
        teacherNameVisible: checked,
      },
      () => {
        if (this.state.check == 3) {
          this.renderChartPile();
        }
      },
    );
  };
  render() {
    const { currentUser, basketList, basketSubjectId, questionScore } =
      this.props;
    const { check, teacherNameVisible } = this.state;
    let newDataSource = [];
    questionScore.scoreSectionAnalyseRowList &&
      questionScore.scoreSectionAnalyseRowList.length &&
      questionScore.scoreSectionAnalyseRowList.map((item) => {
        let newObject = {
          name: item.groupName,
          enName: item.courseTeacherNames,
          key: item.groupName,
        };
        item.scoreSectionAnalyseRow &&
          item.scoreSectionAnalyseRow.map((index) => {
            newObject[index.missScoreQuestionNum] = index.missScoreQuestionNum;
            newObject[`${index.scoreSectionIndex}score`] = index.score;
            newObject[`${index.scoreSectionIndex}scoreRate`] = index.scoreRate;
          });
        newDataSource.push(newObject);
      });
    const dataSource = newDataSource;
    console.log(newDataSource, "333");

    let newColumns = [
      {
        title: trans("global.className", "班级名称"),
        dataIndex: "name",
        key: "name",
        render: (text, record) => {
          return (
            <div>
              <div className={styles.importMessage}>{record.name}</div>
              {teacherNameVisible ? (
                <div className={styles.publicMessage}>{record.enName}</div>
              ) : null}
            </div>
          );
        },
      },
    ];
    questionScore.columnSet &&
      questionScore.columnSet.length &&
      questionScore.columnSet.map((item) => {
        newColumns.push({
          title: () => {
            console.log(item);
            return (
              <div>
                <div>
                  {item.scoreSectionLevelName} &nbsp;
                  <span className={styles.importMessage}>
                    {item.scoreSectionTitle}
                  </span>
                </div>
                <div>
                  <span className={styles.publicMessage}>
                    {trans("global.numberOfPeople", "人数")}
                  </span>
                  <span
                    className={[styles.publicMessage, styles.divider].join(" ")}
                  >
                    /
                  </span>
                  <span className={styles.publicMessage}>
                    {trans("global.proportion", "占比")}
                  </span>
                </div>
              </div>
            );
          },
          dataIndex: item.scoreSectionIndex,
          key: item.scoreSectionIndex,
          render: (text, record, index) => {
            return (
              <div>
                <span className={styles.importMessage}>
                  {record[`${item.scoreSectionIndex}score`]}
                </span>
                <span
                  className={[styles.publicMessage, styles.divider].join(" ")}
                >
                  /
                </span>
                <span
                  className={`${styles.publicMessage} ${comparePercentages(record[`${item.scoreSectionIndex}scoreRate`], dataSource[0][`${item.scoreSectionIndex}scoreRate`]) == -1 ? styles.noPass : ""}`}
                >
                  {record[`${item.scoreSectionIndex}scoreRate`]}
                </span>
              </div>
            );
          },
        });
      });
    const columns = newColumns;
    return (
      <div className={styles.questionTable} id="table2">
        <div
          className={styles.tableBox}
          style={this.props.isParentInit ? { padding: "0" } : {}}
        >
          <div className={styles.tableBoxHeader}>
            {/* <span className={styles.tableHeaderSpan}></span> */}
            <span className={styles.tableHeaderTitle}>
              {trans("data.scoreSegmentation", "成绩分段对比")}
            </span>
            <span className={styles.viewBox}>
              <MyTabs
                data={[
                  { tab: trans("global.listView", "列表视图"), key: 1 },
                  { tab: trans("global.histogram", "柱状图"), key: 2 },
                  { tab: trans("global.stackingDiagram", "堆叠图"), key: 3 },
                ]}
                onChange={(value) => {
                  this.changeTab(value.key);
                }}
                activeKey={3}
              />
            </span>
            <div className={styles.operation}>
              {check == 1 || check == 3 ? (
                <ChartSwitch
                  label={trans("global.courseTeacher", "授课老师")}
                  defaultChecked
                  checked={this.state.teacherNameVisible}
                  onChange={this.hasVisibleTeacherName}
                />
              ) : null}

              {check === 2 ? (
                <span
                  className={styles.textWarp}
                  onClick={() => this.exportImgClk()}
                >
                  {trans("global.exportPicture", "截图")}
                </span>
              ) : null}
              <span className={styles.textWarp} onClick={this.clickSetGrades}>
                {trans("global.setSubsection", "设置分数段")}
              </span>
              {this.props.filterStudentListPermissions.haveFilterStudentList ? (
                <ChartSwitch
                  label={trans("global.specifyAnalysis", "指定分析")}
                  defaultChecked
                  checked={this.state.scoreSegmentationSpecify}
                  onChange={this.courseDetailSpecifyChange}
                  style={{ marginLeft: "4px" }}
                />
              ) : null}

              <a
                href={`${window.location.origin}/api/export/exam/analyseScoreSectionGroupAsRow?examId=${this.props.examId}&filterFlag=${this.state.scoreSegmentationSpecify}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className={styles.textWarp}>
                  {trans("global.export", "导出")}
                </span>
              </a>
            </div>
          </div>
          <div
            id="table1"
            className={styles.tableBoxContent}
            style={{ borderRadius: "0 0 20px 20px" }}
          >
            {this.state.check == 1 ? (
              <Table
                dataSource={dataSource}
                pagination={false}
                scroll={{ x: 1100 }}
                columns={columns}
              />
            ) : this.state.check == 2 ? (
              <div
                key={1}
                id="mountNode"
                style={{
                  maxWidth: 3000,
                  overflowX: "scroll",
                  height: 350,
                  // overflowY: "hidden",
                  display: "flex",
                }}
                className={styles.mountNodeBox}
              ></div>
            ) : (
              <div
                key={2}
                id="pile"
                style={{ height: 400, width: "" }}
                className={styles.mountNodeBox}
              ></div>
            )}
          </div>
        </div>
        {this.state.isSetGrades ? (
          <ScoreSetting
            isSetGrades={this.state.isSetGrades}
            clickSetGrades={this.clickSetGrades}
            reloadChart={() => this.getPage(true, 2)}
            source={"scoreSubsection"}
            id={this.props.examId}
          />
        ) : null}
      </div>
    );
  }
}
export default connect(({ home }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
}))(GlobalHeader);

import React, { Fragment, PureComponent } from "react";
import { DataSet } from "@antv/data-set";
import { Chart } from "@antv/g2";
import { Table } from "antd";
import * as echarts from "echarts";

import { locale, trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";
import AreaHeaderComponent from "../AreaHeaderComponent";
import ChartSwitch from "../ChartSwitch";
import MyTabs from "../MyTabs";

import styles from "./index.module.less";

const { DataView } = DataSet;
class ChapterAnalysis extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      chapterTableData: [],
      chapterTableColumns: [],
      check: 1,
      viewType: 2,
      newDimensionAnalysisSpecify: false,
    };
  }
  componentDidMount() {
    this.getPage();
  }

  getPage = (check) => {
    this.props.dispatch({
      type: "home/getKnowledgePointReportWithGroup",
      payload: {
        filterFlag: this.state.newDimensionAnalysisSpecify,
        examId: this.props.examId,
        groupId: this.props.groupId ? this.props.groupId : "",
        type: "章节",
      },
      onSuccess: (res) => {
        if (res.content) {
          this.setState(
            {
              chapterAnalysisAnalysis: res.content,
            },
            () => {
              if (this.state.check == 1) {
                this.initTableColunms();
                this.initTableData();
              } else if (this.state.check == 2) {
                this.renderChart();
              } else if (this.state.check == 3) {
                this.initRadarChart();
              }
            },
          );
        }
      },
    });
  };

  initTableColunms = () => {
    const { chapterAnalysisAnalysis } = this.state;
    let newColumns = [
      {
        title: trans("global.order", "序号"),
        dataIndex: "sort",
        key: "sort",
        width: 70,
        fixed: "left",
      },
      {
        title: trans("global.className", "班级名称"),
        dataIndex: "name",
        key: "name",
        width: 150,
        fixed: "left",
      },
    ];

    chapterAnalysisAnalysis?.qualityIndicatorData?.length &&
      chapterAnalysisAnalysis.qualityIndicatorData.map((item, ind) => {
        newColumns.push({
          dataIndex: `${item.groupName}_ScoreRate`,
          key: `${item.groupName}_ScoreRate`,
          width: 150,
          title: () => {
            return (
              <div>
                <div>
                  <span className={styles.importMessage}>{item.groupName}</span>
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

          render: (text, record, index) => {
            let scoreRate = record[`${item.groupName}_ScoreRate`];
            let txt = scoreRate?.slice(0, Math.max(0, scoreRate.length - 1));
            return (
              <div>
                <span className={styles.importMessage}>
                  {record[`${item.groupName}_Score`]}
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
                      txt,
                      item.columnDataModelList[0].averageRate,
                    ) == -1
                      ? styles.noPass
                      : "",
                  ].join(" ")}
                >
                  {record[`${item.groupName}_ScoreRate`]}
                </span>
              </div>
            );
          },
        });
      });

    this.setState({
      chapterTableColumns: [...newColumns, {}],
    });
  };

  initTableData = () => {
    const { chapterAnalysisAnalysis } = this.state;
    let newDataSource = [];
    if (chapterAnalysisAnalysis && chapterAnalysisAnalysis?.columnSet) {
      // 初始化表格数据
      chapterAnalysisAnalysis?.columnSet?.length &&
        chapterAnalysisAnalysis.columnSet.map((item, ind) => {
          if (ind != 0) {
            let newObject = {
              sort: ind + 1,
              name: item.columnName,
              key: item.columnName,
              questionNo: item.index,
            };
            newDataSource.push(newObject);
          }
        });
    }
    if (chapterAnalysisAnalysis?.qualityIndicatorData) {
      chapterAnalysisAnalysis?.qualityIndicatorData?.length &&
        chapterAnalysisAnalysis.qualityIndicatorData.map((item, ind) => {
          item.columnDataModelList &&
            item.columnDataModelList.map((index, index_) => {
              if (newDataSource[index_]) {
                newDataSource[index_][`${item.groupName}_Score`] =
                  index.average;
                newDataSource[index_][`${item.groupName}_ScoreRate`] =
                  index.averageRate;
              }
            });
        });
    }

    this.setState({
      chapterTableData: newDataSource,
    });
  };

  changeTab = (check) => {
    this.setState(
      {
        check,
      },
      () => {
        if (check == 1) {
          this.initTableColunms();
          this.initTableData();
        } else if (check == 2) {
          this.renderChart();
        } else if (check == 3) {
          this.initRadarChart();
        }
      },
    );
  };

  renderChart = () => {
    let classArray = [];

    let newClassArray = [];

    let seriesArray = [];

    const { chapterAnalysisAnalysis } = this.state;

    if (this.state.viewType == 2) {
      chapterAnalysisAnalysis?.qualityIndicatorData?.length &&
        chapterAnalysisAnalysis.qualityIndicatorData.map((item, index) => {
          seriesArray.push({
            name: item.groupName,
            type: "line",
            data: [],
            emphasis: {
              focus: "series",
            },
          });
          classArray.push(item.groupName);
        });

      if (chapterAnalysisAnalysis?.columnSet?.length) {
        chapterAnalysisAnalysis.columnSet.map((item, index) => {
          if (index == 0) return;
          newClassArray.push(item.columnName);
        });
      }

      chapterAnalysisAnalysis?.qualityIndicatorData?.length &&
        chapterAnalysisAnalysis.qualityIndicatorData.map((item, index) => {
          item.columnDataModelList &&
            item.columnDataModelList.length &&
            item.columnDataModelList.map((it, ind) => {
              seriesArray[index].data.push({
                value:
                  it.averageRate.slice(
                    0,
                    Math.max(0, it.averageRate.length - 1),
                  ) - 0,
                name: newClassArray[ind],
              });
            });
        });
    } else if (this.state.viewType == 1) {
      chapterAnalysisAnalysis?.columnSet?.length &&
        chapterAnalysisAnalysis.columnSet.map((item, index) => {
          if (index == 0) return;
          seriesArray.push({
            name: item.columnName,
            type: "line",
            data: [],
            emphasis: {
              focus: "series",
            },
          });
          classArray.push(item.columnName);
        });

      if (chapterAnalysisAnalysis?.qualityIndicatorData?.length) {
        chapterAnalysisAnalysis.qualityIndicatorData.map((item, index) => {
          newClassArray.push(item.groupName);
        });
      }

      if (chapterAnalysisAnalysis?.qualityIndicatorData?.length) {
        chapterAnalysisAnalysis.qualityIndicatorData.map((item, index) => {
          item.columnDataModelList &&
            item.columnDataModelList.length &&
            item.columnDataModelList.map((it, ind) => {
              seriesArray[ind].data.push({
                value:
                  it.averageRate.slice(
                    0,
                    Math.max(0, it.averageRate.length - 1),
                  ) - 0,
                name: item.groupName, // 这里需要根据实际情况设置 name
              });
            });
        });
      }
    }

    if (this.myChart) {
      this.myChart.dispose();
    }

    let ele = document.querySelector("#chapterAnalysisChart");
    if (!ele) {
      return;
    }

    this.myChart = echarts.init(ele);

    const option = {
      tooltip: {
        trigger: "axis",
        formatter: function (parameters) {
          var string_ = parameters[0].name + "<br>";

          for (let item of parameters) {
            string_ += `<div style="display: flex; justify-content: space-between;min-width: 180px;"><span>${item.seriesName}</span> <span>${item.value}%</span></div>`;
          }
          return string_;
        },
        appendToBody: true, // 将 tooltip 附加到 body 元素
        extraCssText: "z-index: 9999;", // 设置较高的 z-index
      },
      legend: {
        data: classArray,
        type: "scroll",
        itemWidth: 5,
        itemHeight: 5,
        icon: "circle",
        top: 3,
        width: "90%",
        textStyle: {
          fontSize: 12,
          color: "#01113D", // 可选：图例文字颜色
        },
        left: "center",
      },
      grid: {
        top: "15%",
        left: "3%",
        right: 60,
        bottom: "3%",
        containLabel: true,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
        top: 0,
        right: 10,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: newClassArray,
        axisLabel: {
          interval: 0,
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
      yAxis: {
        axisLabel: {
          formatter: (value) => {
            return value + "%";
          },
        },
        min: "dataMin", // 使用数据中的最小值作为 y 轴的最小值
        max: "dataMax", // 使用数据中的最大值作为 y 轴的最大值
      },
      series: seriesArray,
    };
    this.myChart.setOption(option);
  };

  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        newDimensionAnalysisSpecify: checked,
      },
      () => {
        this.getPage();
      },
    );
  };

  initRadarChart = () => {
    const { chapterAnalysisAnalysis = {} } = this.state;
    const { qualityIndicatorData, columnSet } = chapterAnalysisAnalysis || {};
    let list = this.state.viewType == 2 ? columnSet : qualityIndicatorData;
    console.log(list, "list");

    list?.map((item, index) => {
      // 1.如果是班级视角查看，则不渲染年级视角的雷达图，如果知识点视角查看，则全部渲染
      if ((this.state.viewType == 2 && index > 1) || this.state.viewType == 1) {
        let data = [];
        let min = null;
        let max = null;
        const nameMap = {
          gradeScoreRate: trans("global.gradeScoreRate", "年级得分率"),
          classScoreRate: trans("analysis.classScoreRate", "班级得分率"),
        };

        if (this.state.viewType == 2) {
          qualityIndicatorData?.map((item1, index2) => {
            let gradeScoreRate = null;
            let classScoreRate = null;
            if (item1.columnDataModelList[0]?.averageRate) {
              gradeScoreRate =
                item1.columnDataModelList[0].averageRate.split("%")[0] * 1;
            }
            if (item1.columnDataModelList[index - 1].averageRate) {
              classScoreRate =
                item1.columnDataModelList[index - 1].averageRate.split("%")[0] *
                1;
            }
            data.push({
              item: item1.groupName,
              [nameMap.classScoreRate]: classScoreRate,
              [nameMap.gradeScoreRate]: gradeScoreRate,
            });
          });
        } else if (this.state.viewType == 1) {
          item.columnDataModelList?.map((item1, index2) => {
            if (index2 > 0) {
              let gradeScoreRate = null;
              let classScoreRate = null;
              if (item.columnDataModelList[0]?.averageRate) {
                gradeScoreRate =
                  item.columnDataModelList[0].averageRate.split("%")[0] * 1;
              }
              if (item1.averageRate) {
                classScoreRate = item1.averageRate.split("%")[0] * 1;
              }

              data.push({
                item: columnSet[index2 + 1].columnName,
                [nameMap.classScoreRate]: classScoreRate,
                [nameMap.gradeScoreRate]: gradeScoreRate,
              });
            }
          });
        }

        let array = [
          ...data.map((item) => item[nameMap.gradeScoreRate]),
          ...data.map((item) => item[nameMap.classScoreRate]),
        ];

        min = Math.min(...array);
        max = Math.max(...array);

        console.log(data, item.columnName, "data");

        // 1. 如果已有图表，先销毁
        if (this[`knowledgeRadarChart${index}`]) {
          this[`knowledgeRadarChart${index}`].destroy();
        }

        var dv = new DataView().source(data);

        dv.transform({
          type: "fold",
          fields: [nameMap.classScoreRate, nameMap.gradeScoreRate], // 展开字段集
          key: "user", // key字段
          value: "score", // value字段
        });

        this[`knowledgeRadarChart${index}`] = new Chart({
          container: `chapterRadar${index}`,
          width: 400,
          height: 400,
          forceFit: true,
          padding: [0, 30, 0, 30],
        });

        this[`knowledgeRadarChart${index}`].guide().text({
          position: ["50%", "5%"], // 中心上方
          content: item.columnName || item.groupName,
          style: {
            fill: "#000",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
            textBaseline: "top",
          },
        });

        this[`knowledgeRadarChart${index}`].source(dv, {
          score: {
            // min: min,
            // max: max
            min: 0,
            max: 100,
            tickCount: 5,
          },
        });

        this[`knowledgeRadarChart${index}`].coord("polar", {
          radius: 0.7,
        });

        this[`knowledgeRadarChart${index}`].axis("item", {
          tickCount: 5, // 设置刻度数为5
          line: null,
          label: {
            textStyle: {
              fontSize: 10,
              fill: "#01113d",
              // textAlign: 'center'  // 设置文本居中
            },
            autoRotate: false,
            formatter: (value) => {
              // 超过8个字就断行，每8个字符加一个换行
              return value.length > 8
                ? value.replaceAll(/(.{8})/g, "$1\n")
                : value;
            },
          },
          tickLine: null,
          grid: {
            lineStyle: {
              lineDash: null,
            },
            hideFirstLine: false,
          },
        });

        this[`knowledgeRadarChart${index}`].axis("score", {
          line: null,
          tickLine: null,
          grid: {
            type: "polygon",
            lineStyle: {
              lineDash: null,
            },
          },
        });

        this[`knowledgeRadarChart${index}`].legend("user", {
          textStyle: {
            fontSize: 12,
            fill: "#01113d",
          },
          marker: "circle",
          position: "bottom",
          offsetY: -50,
        });

        this[`knowledgeRadarChart${index}`]
          .line()
          .position("item*score")
          .color("user", ["#1890FF", "#59C35D"])
          .size(1);

        this[`knowledgeRadarChart${index}`]
          .point()
          .position("item*score")
          .color("user", ["#1890FF", "#59C35D"])
          .shape("circle")
          .size(0);

        this[`knowledgeRadarChart${index}`]
          .area()
          .position("item*score")
          .color("user", ["#1890FF", "#59C35D"])
          .style({
            fillOpacity: 0.3,
          });

        this[`knowledgeRadarChart${index}`].tooltip({
          itemTpl: `<div>
                         <li>
                           <span 
                           style="background-color: {color};
                            width: 4px;height: 4px;
                            border-radius: 2px;
                            display: inline-block;
                             vertical-align: middle">
                             </span>
                           <span style='margin-left: 10px;'>{name}</span>
                           <span style='margin-left: 10px;'>{value}%</span>
                         </li>
                     </div>`,
        });

        this[`knowledgeRadarChart${index}`].render();
      }
    });
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
          {locale() == "en" ? (
            canGoToConfigData ? (
              <span>
                No data available.
                <span style={{ color: "#1031fa" }} onClick={goToConfigData}>
                  Click &apos;Set Detail Table&apos; at the top right
                </span>
                Mark each question&apos;s chapter in the &apos;Chapter&apos;
                column to generate analysis charts.&quot;
              </span>
            ) : (
              <span>No data available.</span>
            )
          ) : canGoToConfigData ? (
            <span>
              {trans(
                "chapterAnalysis.noDataClickTopRight",
                "暂无数据，点击右上角",
              )}
              <span style={{ color: "#1031fa" }} onClick={goToConfigData}>
                {trans("testAna.setBlueprintAction", "【设置细目表】")}
              </span>
              {trans(
                "chapterAnalysis.markChapterToGenerateChart",
                "，点击【章节】列标记每道题目的知识点便可生成分析图表。",
              )}
            </span>
          ) : (
            <span>{trans("global.noData", "暂无数据")}</span>
          )}
        </div>
      </div>
    );
  };

  render() {
    const { qualityIndicatorData, columnSet } =
      this.state.chapterAnalysisAnalysis || {};

    const url = `${window.location.origin}/api/export/exam/knowledge/point?examId=${this.props.examId}&type=章节&filterFlag=${this.state.newDimensionAnalysisSpecify}`;

    let knowledgeRadarList = null;
    if (this.state.viewType == 2) {
      knowledgeRadarList = columnSet || [];
    } else if (this.state.viewType == 1) {
      knowledgeRadarList = qualityIndicatorData || [];
    }

    return (
      <div className={styles.questionTable}>
        <div
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: "15px",
            overflow: "hidden",
          }}
        >
          <AreaHeaderComponent
            showExportBtn={false} //显示导出按钮
            onClickExport={() => {
              window.open(url);
            }}
            title={trans("analysis.chapterAnalysis", "章节分析")}
            leftPanelContent={
              <>
                <MyTabs
                  data={[
                    { tab: trans("global.listView", "列表视图"), key: 1 },
                    { tab: trans("global.lineChart", "折线图"), key: 2 },
                    { tab: trans("global.radar", "雷达图"), key: 3 },
                  ]}
                  onChange={(value) => {
                    this.changeTab(value.key);
                  }}
                  activeKey={this.state.check}
                />
              </>
            }
            rightPanelContent={
              <>
                {this.props.filterStudentListPermissions
                  .haveFilterStudentList ? (
                  <span className={styles.nameSwith2}>
                    <ChartSwitch
                      defaultChecked
                      label={trans("global.specifyAnalysis", "指定分析")}
                      checked={this.state.newDimensionAnalysisSpecify}
                      onChange={this.courseDetailSpecifyChange}
                    />
                  </span>
                ) : null}
              </>
            }
          />

          <div
            className={[styles.tableBoxContent, styles.tableBoxContent3].join(
              " ",
            )}
          >
            {this.state.check == 1 ? (
              this.state.chapterTableData?.length ? (
                <Table
                  dataSource={this.state.chapterTableData}
                  pagination={false}
                  scroll={{ x: 900 }}
                  columns={this.state.chapterTableColumns}
                />
              ) : (
                this.noDataTemplate()
              )
            ) : null}

            {this.state.check == 2 ? (
              knowledgeRadarList?.length ? (
                <div
                  key="chapterAnalysisChart"
                  id="chapterAnalysisChart"
                  style={{ height: 300 }}
                />
              ) : (
                this.noDataTemplate()
              )
            ) : null}

            {this.state.check == 3 ? (
              <div
                key="knowledgeRadarChartBox"
                style={{
                  width: "100%",
                  display: "flex",
                  minHeight: "430px",
                  flexWrap: "wrap",
                  justifyContent: "space-around",
                }}
              >
                {knowledgeRadarList?.length
                  ? knowledgeRadarList.map((item, key) => {
                      if (
                        (this.state.viewType == 2 && key > 1) ||
                        this.state.viewType == 1
                      ) {
                        return (
                          <div
                            style={{ height: "400px", width: "400px" }}
                            id={`chapterRadar${key}`}
                          ></div>
                        );
                      }
                    })
                  : this.noDataTemplate()}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}
export default ChapterAnalysis;

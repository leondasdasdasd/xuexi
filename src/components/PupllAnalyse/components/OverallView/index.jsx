// 类组件
import React from "react";
import { DataSet } from "@antv/data-set";
import { Chart } from "@antv/g2";
import { Button, Spin } from "antd";

import ChartSwitch from "../../../../components/ChartSwitch";
import MyTabs from "../../../../components/MyTabs";
import { trans } from "../../../../utils/i18n";
import AnalysisDimensionImportModal, {
  IMPORT_MODE,
} from "../../../AnalysisDimensionImportModal";
import MyTable from "../MyTable";
import TableHeader from "../TableHeader";

import styles from "./index.module.less";

const { DataView } = DataSet;
const COLORS = [
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
const baseColumns = [
  {
    title: trans("pupllAnalyse.situationAnalysis", "情况分析"),
    key: "1",
    dataIndex: "1",
    render: (text, record, index) => {
      // console.log(record);
      if (record["2"] && record["3"]) {
        if (
          record["2"]?.split("%")[0] * 100 >=
          record["3"]?.split("%")[0] * 100
        ) {
          return (
            <span style={{ color: "#01113D" }}>
              {trans("pupllAnalyse.performingWell", "表现不错")}
            </span>
          );
        } else if (
          record["3"]?.split("%")[0] * 100 - record["2"]?.split("%")[0] * 100 >=
          1000
        ) {
          return (
            <span style={{ color: "#4818C9" }}>
              {trans("pupllAnalyse.needsAttention", "重点关注")}
            </span>
          );
        } else if (
          record["3"]?.split("%")[0] * 100 - record["2"]?.split("%")[0] * 100 <=
          1000
        ) {
          return (
            <span style={{ color: "#1593D5" }}>
              {trans("pupllAnalyse.needsReinforcement", "加强巩固")}
            </span>
          );
        }
      }
    },
  },
];

class OverallView extends React.Component {
  constructor(properties) {
    // console.log('constructor', 'constructor');
    super(properties);
    this.state = {
      tabKey: 3,
      base: Date.now(), //组件在同一个页面可能会加载两次，导致元素id重复。加一个时间戳来保证id的唯一性
    };
    this.rende = true;
  }

  componentDidMount = () => {
    this.props.getRef && this.props.getRef(this);
  };

  changeTab = (value) => {
    this.setState(
      {
        tabKey: value,
      },
      () => {
        this.initCompenent();
      },
    );
  };

  initCompenent = () => {
    if (this.state.tabKey == 2) {
      this.handelInitChart();
    } else if (this.state.tabKey == 3) {
      this.initRadarChart();
    }
  };

  initRadarChart = () => {
    const { studySituationByStudentIdList } = this.props;
    const { moduleModelList } = studySituationByStudentIdList;
    if (moduleModelList?.length) {
      const result = moduleModelList.find((item) => {
        return item.modelCode === "OVERALL_SITUATION";
      });
      const nameMap = {
        gradeScoreRate: trans("global.gradeScoreRate", "年级得分率"),
        studentRate: "学生得分率",
      };

      if (result?.modelValue?.qualityIndicatorResponseList?.length) {
        result.modelValue.qualityIndicatorResponseList.map((item, index) => {
          const { columnSet } = item;
          let data = [];
          if (item?.qualityIndicatorData?.length) {
            let [gradeData, studentData] = item.qualityIndicatorData;

            gradeData?.columnDataModelList.map((item1, index_) => {
              let gradeScoreRate = item1.averageRate;
              let studentScoreRate =
                studentData?.columnDataModelList[index_]?.averageRate;

              data.push({
                [nameMap.gradeScoreRate]: Number.parseInt(gradeScoreRate, 10),
                [nameMap.studentRate]: Number.parseInt(studentScoreRate, 10),
                item: columnSet[index_ + 1]?.columnName,
              });
            });
          }

          if (
            !document.getElementById(
              `overallViewRadar${this.state.base}${index}`,
            )
          )
            return;

          // 1. 如果已有图表，先销毁
          if (this[`overallViewRadar${index}`]) {
            this[`overallViewRadar${index}`].destroy();
          }

          this[`overallViewRadar${index}`] = new Chart({
            container: `overallViewRadar${this.state.base}${index}`,
            height: 400,
            width: 455,
            padding: [10, 10, 10, 10],
          });

          let array = [
            ...data.map((item) => item[nameMap.gradeScoreRate]),
            ...data.map((item) => item[nameMap.studentRate]),
          ];
          // let min = Math.min(...arr)
          // let max = Math.max(...arr)

          // console.log(data, item.item, min, max, 'data');

          var dv = new DataView().source(data);

          dv.transform({
            type: "fold",
            fields: [nameMap.studentRate, nameMap.gradeScoreRate], // 展开字段集
            key: "user", // key字段
            value: "score", // value字段
          });

          this[`overallViewRadar${index}`].guide().text({
            position: ["50%", "0"], // 中心上方
            content: item.title,
            style: {
              fill: "#000",
              fontSize: 16,
              fontWeight: "bold",
              textAlign: "center",
              textBaseline: "top",
            },
          });

          if (data.length === 0) {
            this[`overallViewRadar${index}`].guide().text({
              position: ["50%", "50%"], // 中心上方
              content: "暂无数据",
              style: {
                fill: "#BFBFBF",
                fontSize: 16,
                fontWeight: "bold",
                textAlign: "center",
                textBaseline: "top",
              },
            });
          }

          this[`overallViewRadar${index}`].source(dv, {
            score: {
              // min: min == 0 ? 0 : min % 5 == 0 ? min - 5 : min - (min % 5),
              min: 0,
              // max: max,
              max: 100,
            },
          });

          this[`overallViewRadar${index}`].coord("polar", {
            radius: 0.6,
          });

          this[`overallViewRadar${index}`].axis("item", {
            tickCount: 5, // 设置刻度数为5
            line: null,
            label: {
              textStyle: {
                fontSize: data?.length > 10 ? 10 : 12,
                fill: "#01113d",
                // textAlign: 'center'  // 设置文本居中
              },
              autoRotate: false,
            },

            tickLine: null,
            grid: {
              lineStyle: {
                lineDash: null,
              },
              hideFirstLine: false,
            },
          });

          this[`overallViewRadar${index}`].axis("score", {
            line: null,
            tickLine: null,
            grid: {
              type: "polygon",
              lineStyle: {
                lineDash: null,
              },
            },
          });

          this[`overallViewRadar${index}`].legend("user", {
            textStyle: {
              fontSize: 12,
              fill: "#01113d",
            },
            marker: "circle",
            position: "bottom",
            offsetY: -30,
          });

          this[`overallViewRadar${index}`]
            .line()
            .position("item*score")
            .color("user", ["#1890FF", "#59C35D"])
            .size(1);

          this[`overallViewRadar${index}`]
            .point()
            .position("item*score")
            .color("user", ["#1890FF", "#59C35D"])
            .shape("circle")
            .size(0);

          this[`overallViewRadar${index}`]
            .area()
            .position("item*score")
            .color("user", ["#1890FF", "#59C35D"])
            .style({
              fillOpacity: 0.3,
            });

          this[`overallViewRadar${index}`].tooltip({
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

          this[`overallViewRadar${index}`].render();
        });
      }
    }
  };

  renderChart = (knowLedgeAnalysis, id, key) => {
    const dom = document.getElementById(`trendBox${this.state.base}${id}`);
    if (!dom) {
      return;
    }
    if (knowLedgeAnalysis.columnSet && knowLedgeAnalysis.columnSet.length > 0) {
      if (
        knowLedgeAnalysis.columnSet.length > 4 &&
        knowLedgeAnalysis.columnSet.length < 8
      ) {
        dom.style.width = "50%";
        this[`chart${id}`].changeWidth(dom.offsetWidth);
      } else if (knowLedgeAnalysis.columnSet.length > 7) {
        dom.style.width = "100%";
        this[`chart${id}`].changeWidth(dom.offsetWidth);
      } else if (knowLedgeAnalysis.columnSet.length < 5) {
        dom.style.width = "33%";
        this[`chart${id}`].changeWidth(dom.offsetWidth);
      }
    }

    if (this[`chart${id}`]) {
      this[`chart${id}`].clear();
    }

    let newList = [];
    if (knowLedgeAnalysis?.qualityIndicatorData?.length) {
      knowLedgeAnalysis?.qualityIndicatorData[0]?.columnDataModelList?.map(
        (item, index) => {
          newList.push({
            年级得分率: Number.parseInt(item.averageRate, 10),
            index: index,
          });
        },
      );

      knowLedgeAnalysis?.qualityIndicatorData[1]?.columnDataModelList?.map(
        (item, index) => {
          newList[index].学生得分率 = Number.parseInt(item.averageRate, 10);
        },
      );

      knowLedgeAnalysis?.columnSet.map((item, index) => {
        if (index == 0) return;
        newList[index - 1].title = item.columnName;
      });
    }

    this[`chart${id}`].source(newList);
    this[`chart${id}`].scale({
      学生得分率: {
        min: 0,
        max: 100,
        formatter: (value) => {
          // 设置坐标轴和提示框的文字
          return value + "%";
        },
      },
      年级得分率: {
        min: 0,
        max: 100,
        formatter: (value) => {
          return value + "%";
        },
      },
    });

    this[`chart${id}`].axis("年级得分率", {
      grid: null,
      label: {
        textStyle: {
          fill: "",
        },
      },
      line: null,
    });
    if (this.props.configData.hasStudentScoreRate) {
      this[`chart${id}`]
        .interval()
        .position("title*学生得分率")
        .color("title", COLORS)
        .tooltip(
          "title*学生得分率*color*fakeName",
          (title, value, color, fakeName) => {
            return {
              name: title,
              value,
              color,
              fakeName: "学生得分率",
            };
          },
        )
        .label("学生得分率", (value) => {
          return {
            position: "top",
            offset: 0,
            autoRotate: true,
            textStyle: {
              fill: "#333",
              fontSize: 10,
              shadowBlur: 2,
              // shadowColor: "rgba(0, 0, 0, .45)",
            },
            // formatter: (text) => {
            //     return text;
            // },
          };
        });
    }

    if (this.props.configData.groupStudentScoreRate) {
      this[`chart${id}`]
        .line()
        .position("title*年级得分率")
        .color("#f00")
        .size(2)
        .shape("line")
        .tooltip(
          "title*年级得分率*color*fakeName",
          (title, value, color, fakeName) => {
            return {
              name: title,
              value,
              color: "#f00",
              fakeName: "年级得分率",
            };
          },
        );
    }

    this[`chart${id}`].axis("title", {
      label: {
        textStyle: {
          textAlign: "center", // 文本对齐方向，可取值为： start center end
          fill: "#01113d", // 文本的颜色
          fontSize: "11", // 文本大小
          // fontWeight: "bold", // 文本粗细
          textBaseline: "top", // 文本基准线，可取 top middle bottom，默认为middle
          // autoRotate: true,
        },
        htmlTemplate(text, item, index) {
          if (knowLedgeAnalysis.columnSet.length > 25) {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 25px; white-space: pre-wrap; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;word-break:break-all;color:rgba(1,17,61,0.85)">${text}</div>`)
                : (html = `<div style="width: 25px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 25px; white-space: pre-wrap; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;word-break:break-all;color:rgba(1,17,61,0.85)">${text}</div>`)
                : (html = `<div style="width: 25px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`);
              return html;
            }
          } else if (knowLedgeAnalysis.columnSet.length > 15) {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 45px; white-space: pre-wrap; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`)
                : (html = `<div style="width: 45px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 45px; white-space: pre-wrap; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`)
                : (html = `<div style="width: 45px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`);
              return html;
            }
          } else {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 54px; white-space: pre-wrap; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`)
                : (html = `<div style="width: 54px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 54px; white-space: pre-wrap; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`)
                : (html = `<div style="width: 54px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;color:rgba(1,17,61,0.85)">${text}</div>`);
              return html;
            }
          }
        },
      },
    });
    this[`chart${id}`].tooltip({
      itemTpl: `<div><li><span style="background-color: {color}; width: 4px;height: 4px;border-radius: 2px;display: inline-block; vertical-align: middle"></span><span style='margin-left: 10px;'>{fakeName}</span><span style='margin-left: 10px;'>{value}%</span></li></div>`,
    });
    this[`chart${id}`].animate({
      enter: {
        animation: "fadeIn", // 动画名称
        easing: "easeQuadIn", // 动画缓动效果
        delay: 100, // 动画延迟执行时间
        duration: 200, // 动画执行时间
      },
    });
    this[`chart${id}`].legend(false);
    this[`chart${id}`].render();
  };

  handelInitChart = (key) => {
    const { studySituationByStudentIdList } = this.props;
    const { moduleModelList } = studySituationByStudentIdList;
    let result = {};
    if (moduleModelList?.length) {
      result = moduleModelList.find((item) => {
        return item.modelCode === "OVERALL_SITUATION";
      });

      if (result?.modelValue?.qualityIndicatorResponseList?.length) {
        result.modelValue.qualityIndicatorResponseList.map((item, index) => {
          if (
            !this[`chart${index}`] &&
            document.getElementById(`${this.state.base}${index}`)
          ) {
            this[`chart${index}`] = new Chart({
              container: `${this.state.base}${index}`,
              height: 160,
              forceFit: key ? true : false,
              padding: [10, 10, 40, 50],
            });
          }
          this.renderChart(item, index, key);
        });
      }
    }
  };

  render() {
    const {
      studySituationByStudentIdList,
      titName,
      edit = true,
      spinning,
    } = this.props;
    const { moduleModelList } = studySituationByStudentIdList;

    let list = [];
    let result = {};
    if (moduleModelList?.length) {
      result = moduleModelList.find((item) => {
        return item.modelCode === "OVERALL_SITUATION";
      });
      if (result?.modelValue?.qualityIndicatorResponseList?.length) {
        list = result?.modelValue?.qualityIndicatorResponseList;
      }
    }

    const dataSource = [];
    const columnsList = [];

    for (const item of list) {
      let array = [];
      for (const [index, item1] of item.columnSet.entries()) {
        if (index != 0) {
          array.push({
            columnName: item1.columnName,
          });
        }
      }

      item.qualityIndicatorData[1].columnDataModelList.forEach(
        (item, index) => {
          array[index][2] = item.averageRate;
        },
      );
      item.qualityIndicatorData[0].columnDataModelList.forEach(
        (item, index) => {
          array[index][3] = item.averageRate;
        },
      );

      dataSource.push(array);

      columnsList.push([
        {
          title: item.title,
          dataIndex: "columnName",
          key: "columnName",
          width: 405,
        },
        ...baseColumns,
      ]);
    }

    for (const columns of columnsList) {
      if (columns && columns.length > 0) {
        if (this.props.configData.hasStudentScoreRate) {
          columns.push({
            title: trans("pupllAnalyse.personalScoreRate", "个人得分率"),
            dataIndex: "2",
            key: "2",
          });
        }
        if (this.props.configData.groupStudentScoreRate) {
          columns.push({
            title: trans("pupllAnalyse.wholeGradeScoreRate", "全年级得分率"),
            dataIndex: "3",
            key: "3",
          });
        }
      }
    }
    let moduleSwitch = result?.modelShow;

    let isShow = null;
    // 默认雷达图
    let tabIndex = 3;
    if (
      this.props.configData.hasStudentScoreRate ||
      this.props.configData.groupStudentScoreRate
    ) {
      isShow = true;
      tabIndex = this.state.tabKey;
    } else {
      // 没有权限展示列表视图
      tabIndex = 1;
    }

    return (
      <div className={styles.overallView}>
        <Spin spinning={spinning}>
          <TableHeader
            titleName={titName}
            slot={
              <div
                style={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                {isShow ? (
                  <div style={{ marginRight: "auto" }}>
                    <MyTabs
                      data={[
                        { tab: trans("global.listView", "列表视图"), key: 1 },
                        { tab: trans("global.histogram", "柱状图"), key: 2 },
                        { tab: trans("global.radar", "雷达图"), key: 3 },
                      ]}
                      onChange={(value) => {
                        this.changeTab(value.key);
                      }}
                      activeKey={this.state.tabKey}
                    />
                  </div>
                ) : null}

                {edit ? (
                  <ChartSwitch
                    checked={Boolean(moduleSwitch)}
                    onChange={this.props.onChange}
                  />
                ) : null}
              </div>
            }
          />
          {
            <div
              className={styles.youChart1}
              style={{ display: moduleSwitch ? "block" : "none" }}
            >
              {list.length > 0 ? (
                <>
                  <div
                    className={styles.personalChartBox}
                    style={{ display: tabIndex == 2 ? "flex" : "none" }}
                  >
                    {result?.modelValue?.qualityIndicatorResponseList?.map(
                      (item, index) => (
                        <div
                          key={index}
                          style={{
                            position: "relative",
                            width: "33%",
                            minHeight: "150px",
                          }}
                          id={`trendBox${this.state.base}${index}`}
                        >
                          <div className={styles.title}>{item.title}</div>
                          <div id={`${this.state.base}${index}`}></div>
                        </div>
                      ),
                    )}
                  </div>
                  <div style={{ display: tabIndex == 1 ? "block" : "none" }}>
                    <div className={styles.remark}>
                      {trans(
                        "pupllAnalyse.situationAnalysisDescription",
                        "说明：【表现不错】指个人得分率≥年级得分率；【加强巩固】指个人得分率比年级得分率低10%内；【重点关注】指个人得分率比年级得分率低超过10%。",
                      )}
                    </div>
                    {columnsList.map((columns, index) => (
                      <div style={{ marginBottom: "10px" }}>
                        <MyTable
                          dataSource={dataSource[index]}
                          bordered
                          pagination={false}
                          columns={columns}
                        />
                      </div>
                    ))}
                  </div>
                  {tabIndex == 3 ? (
                    <div className={styles.personalChartBox}>
                      {result?.modelValue?.qualityIndicatorResponseList?.map(
                        (item, index) => (
                          <div
                            id={`overallViewRadar${this.state.base}${index}`}
                            style={{
                              width: "455px",
                              height: "400px",
                              marginBottom: "10px",
                            }}
                          />
                        ),
                      )}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className={styles.suyang}>
                  <p>
                    {trans(
                      "global.dimensionIntroduction",
                      "你可定义自己想要分析的维度，比如素养能力、知识点或所属章节，上传后，系统会自动生成学生和班级维度的分析报表，使用时，请先下载模板表格，依次标注好每道小题的分析维度。",
                    )}
                  </p>
                  {this.props.examId && this.props.paperId ? (
                    <AnalysisDimensionImportModal
                      examId={this.props.examId}
                      paperId={this.props.paperId}
                      onSuccess={this.props.onImportSuccess}
                      renderTrigger={({ open }) => (
                        <Button
                          type="primary"
                          style={{ marginTop: "30px" }}
                          className={styles.grades}
                          onClick={() => open(IMPORT_MODE)}
                        >
                          {trans(
                            "global.importAnalysisDimension",
                            "导入分析维度",
                          )}
                        </Button>
                      )}
                    />
                  ) : (
                    <Button
                      type="primary"
                      style={{ marginTop: "30px" }}
                      className={styles.grades}
                      disabled
                    >
                      {trans("global.importAnalysisDimension", "导入分析维度")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          }
        </Spin>
      </div>
    );
  }
}

export default OverallView;

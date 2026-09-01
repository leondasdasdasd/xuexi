import React, { PureComponent } from "react";
import { Input, Popover, Select, Switch, Table } from "antd";
import { connect } from "dva";
import * as echarts from "echarts";

import { locale, trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Search } = Input;
const { Option } = Select;
class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 2,
      groupId: 0,
      pageNo: 1,
      stuName: "",
      open: true,
      dataLabels: false,
      topicClassComparisonSpecify: false,
    };
  }
  componentDidMount() {
    // this.props.dispatch({
    //   type: "home/getClass",
    //   payload: {
    //     examId: this.props.examId || this.props.paperId,
    //   },
    // });
    this.props.onRef && this.props.onRef(this);
    this.getPage();
    if (this.props.isParentInit) {
      console.log("从父组件加载完成后再初始化数据");
    } else {
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
          if (this.state.check == 2) {
            this.renderTopiChart();
          }
        });
    }
  }

  // 父组加载完毕后可以调用次函数初始化数据，相当于父组件加载完毕之后调用
  initData = () => {
    this.props.dispatch({
      type: "home/getGroupContrast",
      payload: {
        examId: this.props.examId,
        filterFlag: this.state.topicClassComparisonSpecify,
        groupId: this.props.groupId ? this.props.groupId : "",
      },
      onSuccess: () => {
        if (this.state.check == 2) {
          this.renderTopiChart();
        }
      },
    });
  };

  changeClass = (value) => {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
      },
      () => {
        this.getPage();
      },
    );
  };
  getPage = () => {
    this.props.dispatch({
      type: "home/clearQuestionScore",
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
  changeTab = (check) => {
    this.setState(
      {
        check,
        pageNo: 1,
      },
      () => {
        this.getPage();
        if (check == 2) {
          this.renderTopiChart();
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
  clickOpen = () => {
    this.setState({
      open: !this.state.open,
    });
  };
  testClick = (id) => {
    // console.log(id, "111");
    if (!id) return;
    this.props.dispatch({
      type: "home/getItem",
      payload: {
        questionId: id,
        examId: this.props.examId,
        paperId: this.props.paperId,
      },
    });
  };
  renderTopiChart = () => {
    // $("#chartBox").find("canvas").remove();
    if (!document.querySelector("#QuestionTable_chartBox")) {
      return;
    }
    document
      .querySelector("#QuestionTable_chartBox")
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
          // stack: "Total",
          data: [],
          emphasis: {
            focus: "series",
          },
          label: {
            show: this.state.dataLabels ? true : false,
            position: "bottom",
            textStyle: {
              // color: "#01113D",
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

    // chart.scale("scoreRate", {
    //   min: 0,
    //   max: 100,
    // });
    // chart.legend({
    //   position: "top",
    //   offsetY: -3,
    //   marker: "square",
    // });
    // chart.tooltip({
    //   title: false,
    // });
    // const defs = {
    //   scoreRate: {
    //     min: 0, // 手动指定最小值
    //     max: 100, // 手动指定最大值
    //     formatter: (val) => {
    //       // 设置坐标轴和提示框的文字
    //       return val + "%";
    //     },
    //   },
    // };
    // chart.source(newData, defs);
    // chart.axis("showQuestionNumber", {
    //   label: {
    //     formatter: (val) => {
    //       let newVal = val.substring(2, val.length);
    //       return newVal;
    //     },
    //   },
    // });
    // chart.line().position("showQuestionNumber*scoreRate").color("classN");
    // if (this.state.dataLabels) {
    //   chart
    //     .point()
    //     .position("showQuestionNumber*scoreRate")
    //     .color("classN")
    //     .size(4)
    //     .shape("circle")
    //     .style({
    //       stroke: "#fff",
    //       lineWidth: 1,
    //     })
    //     .opacity(1)
    //     .label("scoreRate", {
    //       offset: 10,
    //       textStyle: {
    //         fill: "#595959",
    //         fontSize: 12,
    //       },
    //     });
    // } else {
    //   chart
    //     .point()
    //     .position("showQuestionNumber*scoreRate")
    //     .color("classN")
    //     .size(4)
    //     .shape("circle")
    //     .style({
    //       stroke: "#fff",
    //       lineWidth: 1,
    //     });
    // }

    // chart.render();
    // window.CHART = chart;

    let myChart = echarts.init(
      document.querySelector("#QuestionTable_chartBox"),
    );

    const divStyle = {
      display: "flex",
      justifyContent: "space-between",
    };

    const option = {
      tooltip: {
        trigger: "axis",
        formatter: function (parameters) {
          // var str = "题目" + parseInt(params[0].name) + "<br>";
          var string_ = "题目" + parameters[0].name + "<br>";

          for (let item of parameters) {
            // str += `<div style={{${Object.entries(divStyle)
            //   .map(([k, v]) => `${k}:${v},`)
            //   .join("")}}}><span>${item.seriesName}</span><span>${
            //   item.value
            // }%</span></div>`;
            string_ += `<div style="display: flex; justify-content: space-between;width: 180px;"><span>${item.seriesName}</span><span>${item.value}%</span></div>`;
            // str += `<div style={{display:'flex',justifyContent:"space-between"}}><span>${item.seriesName}</span><span style="margin-left:10px">${item.value}%</span></div>`;
          }
          return string_;
        },
        // axisPointer: {
        //   label: {
        //     formatter: (arrObj) => {
        //       console.log("arrObj", arrObj);
        //       return (
        //         <>
        //           <p>题目{arrObj.value}</p>
        //           {arrObj &&
        //             arrObj.seriesData &&
        //             arrObj.seriesData.length &&
        //             arrObj.seriesData.length > 0 &&
        //             arrObj.seriesData.map((item, index) => {
        //               return (
        //                 <p>{item.data.name + " " + item.data.value + "%"}</p>
        //               );
        //             })}
        //         </>
        //       );
        //     },
        //   },
        // },
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

  exportImgClk = () => {
    window.CHART.downloadImage("班级成绩柱状图");
  };
  dataLabelsChange = (checked) => {
    this.setState(
      {
        dataLabels: checked,
      },
      () => {
        this.renderTopiChart();
      },
    );
  };
  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        topicClassComparisonSpecify: checked,
      },
      () => {
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
          .then(() => {
            if (this.state.check == 2) {
              this.renderTopiChart();
            }
          });
      },
    );
  };
  render() {
    const {
      currentUser,
      basketList,
      basketSubjectId,
      questionScore,
      tableClass,
      groupContrast,
      questionItem,
    } = this.props;
    const { check } = this.state;
    let completion;
    if (questionItem.type == 3) {
      completion = questionItem.gapFillingAnswer?.answers.join(",");
    }
    const content1 = (
      <div style={{ maxHeight: "calc(100vh - 24px)", overflow: "auto" }}>
        <div
          dangerouslySetInnerHTML={{ __html: questionItem.content }}
          style={{ marginBottom: "10px" }}
        ></div>
        {questionItem.type == 1 || questionItem.type == 2 ? (
          <>
            {questionItem.optionList &&
              questionItem.optionList.length &&
              questionItem.optionList.map((item) => (
                <div
                  dangerouslySetInnerHTML={{
                    __html: `${item.answers}`,
                  }}
                  style={{ display: "flex" }}
                ></div>
              ))}
            <div>
              {trans("global.rightAnswer", "正确答案：")}：{questionItem.answer}
            </div>
          </>
        ) : questionItem.type == 3 ? (
          <div
            dangerouslySetInnerHTML={{
              __html: ` 正确答案：${completion ? completion : ""}`,
            }}
          ></div>
        ) : questionItem.type == 4 ? (
          <div>
            {trans("global.rightAnswer", "正确答案：")}：
            {questionItem.answer == "true"
              ? trans("global.right", "正确")
              : trans("global.wrong", "错误")}
          </div>
        ) : questionItem.type == 5 ? (
          <div
            dangerouslySetInnerHTML={{
              __html: ` 正确答案：${questionItem.answer}`,
            }}
            style={{ display: "inline-block" }}
          ></div>
        ) : questionItem.type == 6 &&
          questionItem.sonQuestionList &&
          questionItem.sonQuestionList.length > 0 ? (
          questionItem.sonQuestionList.map((ii) => (
            <div>
              <div
                dangerouslySetInnerHTML={{ __html: ii.content }}
                style={{ marginBottom: "10px" }}
              ></div>
              {ii.type == 1 || ii.type == 2 ? (
                <>
                  {ii.optionList &&
                    ii.optionList.length &&
                    ii.optionList.map((item) => (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `${item.answers}`,
                        }}
                      ></div>
                    ))}
                  <div>
                    {trans("global.rightAnswer", "正确答案：")}：{ii.answer}
                  </div>
                </>
              ) : ii.type == 3 ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: ` 正确答案：${ii.gapFillingAnswer && ii.gapFillingAnswer.answers && ii.gapFillingAnswer?.answers.join(",") ? ii.gapFillingAnswer?.answers.join(",") : ""}`,
                  }}
                ></div>
              ) : ii.type == 4 ? (
                <div>
                  {trans("global.rightAnswer", "正确答案：")}：
                  {ii.answer == "true"
                    ? trans("global.right", "正确")
                    : trans("global.wrong", "错误")}
                </div>
              ) : ii.type == 5 ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: ` 正确答案：${ii.answer}`,
                  }}
                  style={{ display: "inline-block" }}
                ></div>
              ) : null}
            </div>
          ))
        ) : null}
      </div>
    );
    // console.log(groupContrast, "qqq");
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
    // console.log(newDataSource, "222");
    const dataSource = newDataSource;
    let newColumns = [
      {
        title: trans("analysis.questionIndex", "题号"),
        dataIndex: "showQuestionNumber",
        key: "showQuestionNumber",
        fixed: "left",
        width: 110,
        // height: 60,
        sorter: (a, b) => {
          // console.log(a, b, "ccc");
          return a.questionNo - b.questionNo;
        },
        render: (text, record, index) => {
          return (
            <>
              <Popover
                content={
                  record.questionId ? (
                    content1
                  ) : (
                    <div> {trans("global.noContent", "暂无内容")}</div>
                  )
                }
                trigger="click"
                placement="right"
                overlayStyle={{ maxWidth: "600px" }}
              >
                <span
                  onClick={() => this.testClick(record.questionId)}
                  style={{ cursor: "pointer" }}
                  className={styles.testIndex}
                >
                  {record.showQuestionNumber}
                </span>
              </Popover>
            </>
          );
        },
      },
      {
        title: trans("global.questionType", "题型"),
        dataIndex: "questionTypeName",
        key: "questionTypeName",
        fixed: "left",
        width: 80,
      },
      {
        title: trans("analysis.questionScore", "分值"),
        dataIndex: "questionScore",
        key: "questionScore",
        fixed: "left",
        width: 80,
      },
      // {
      //   title: trans("analysis.hardValue", "难度"),
      //   dataIndex: "levelTypeName",
      //   key: "levelTypeName",
      //   fixed: "left",
      //   width: language ? 80 : 100,
      // },
    ];
    groupContrast.columnList &&
      groupContrast.columnList[0].averageScoreRateModelList &&
      groupContrast.columnList[0].averageScoreRateModelList.length &&
      groupContrast.columnList[0].averageScoreRateModelList.map((item) => {
        newColumns.push({
          title: item.columnName,
          dataIndex: item.columnName,
          key: item.columnName,
          fixed: item.index == 0 ? "left" : null,
          width: 200,
          // align: "center",
          children: [
            {
              title: trans("global.equalShare", "均分"),
              dataIndex: `${item.index}average`,
              key: `${item.index}average`,
              width: 90,
              // align: "center",
            },
            {
              title: trans("analysis.knowLedgeScoreRate", "得分率"),
              dataIndex: `${item.index}scoreRate`,
              key: `${item.index}scoreRate`,
              width: 110,
              // align: "center",
              sorter: (a, b) => {
                let a1 = a[`${item.index}scoreRate`];
                let b1 = b[`${item.index}scoreRate`];
                a1 = a1 ? a1.slice(0, Math.max(0, a1.length - 1)) : "";
                b1 = b1 ? b1.slice(0, Math.max(0, b1.length - 1)) : "";
                // console.log(a1, b1, "ccc");
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
    // console.log(newColumns, "222");
    newColumns.push({
      title: "",
    });
    const columns = newColumns;

    return (
      <div className={styles.questionTable} id="table1">
        <div
          className={styles.tableBox}
          style={this.props.isParentInit ? { padding: "0" } : {}}
        >
          <div className={styles.tableBoxHeader}>
            {/* <span className={styles.tableHeaderSpan}></span> */}
            <span className={styles.tableHeaderTitle}>
              {/* {trans("data.questionDetail", "小题得分分析")} */}
              {trans("global.topicClassComparison", "小题班级对比")}
            </span>
            <span className={styles.viewBox}>
              <span
                onClick={this.changeTab.bind(this, 1)}
                className={[
                  styles.viewTab,
                  check === 1 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.listView", "列表视图")}
              </span>
              <span
                onClick={this.changeTab.bind(this, 2)}
                className={[
                  styles.viewTab,
                  check === 2 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.lineChart", "折线图")}
              </span>
            </span>

            <div className={styles.operationS}>
              {this.state.check == 2 ? (
                <>
                  <span className={styles.dataLabels}>
                    {trans("global.displayDataLabels", "显示得分率")}
                    <Switch
                      defaultChecked
                      checked={this.state.dataLabels}
                      onChange={this.dataLabelsChange}
                    />
                  </span>
                </>
              ) : null}
              {this.props.filterStudentListPermissions.haveFilterStudentList ? (
                <span className={styles.nameSwith2}>
                  {trans("global.specifyAnalysis", "指定分析")}
                  <Switch
                    defaultChecked
                    checked={this.state.topicClassComparisonSpecify}
                    onChange={this.courseDetailSpecifyChange}
                    style={{ marginLeft: "4px" }}
                  />
                </span>
              ) : null}

              <a
                href={`${window.location.origin}/api/exam/question/group/contrast/export?examId=${this.props.examId}&filterFlag=${this.state.topicClassComparisonSpecify}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className={styles.exportS}>
                  {trans("global.export", "导出")}
                </span>
              </a>
            </div>
          </div>

          <div
            id="table1"
            className={[
              styles.tableBoxContent2,
              groupContrast?.columnList &&
              groupContrast?.columnList[0]?.averageScoreRateModelList?.length >
                5
                ? styles.tableBoxContentX
                : "",
            ].join(" ")}
          >
            {this.state.check == 1 ? (
              <Table
                dataSource={dataSource}
                pagination={false}
                scroll={{ x: 820, y: true }}
                columns={columns}
              />
            ) : (
              // <div id="topichart"></div>
              <div id="QuestionTable_chartBox" style={{ height: 300 }} />
            )}
          </div>
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
}))(GlobalHeader);

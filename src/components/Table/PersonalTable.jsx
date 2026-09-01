import React, { PureComponent } from "react";
import { DataSet } from "@antv/data-set";
import { Chart } from "@antv/g2";
import { Input, message, Radio, Select } from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";
import ChartSwitch from "../ChartSwitch";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
// let chart;
const { Search } = Input;
const { Option } = Select;

var _DataSet = DataSet,
  DataView = _DataSet.DataView;

class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 1,
      groupId: 0,
      searchName: "",
      stuId: null,
      pageNo: 1,
      stuName: "",
      summaryAnalysisSpecify: false,
      viewType: 2,
    };
    this.rende = true;
    this.summaryList = [];
  }
  componentDidMount() {
    this.props.dimensionAnalysis &&
      this.props.dimensionAnalysis.length &&
      this.props.dimensionAnalysis.map((item, index) => {
        this[`chart${index}`] = new Chart({
          container: `trendNode${index}`,
          padding: [20, 30, 40, 50],
          height: 200,
        });
        this[`rasarChart${index}`] = new Chart({
          container: `rasarNode${index}`,
          padding: [50, 10, 50, 10],
          height: 300,
        });
      });
    const { dispatch } = this.props;
    dispatch({
      type: "home/getClassList",
      payload: {
        examId: this.props.examId,
      },
      callback: (response) => {
        if (response.status) {
          const data = response.content;
          // 存在班级则默认选中第一个班级，不存在则显示全部班级
          if (data && data.length > 0) {
            this.setState(
              {
                groupId: data[0].groupId,
              },
              () => {
                this.getStu();
              },
            );
          } else {
            this.setState(
              {
                groupId: 0,
              },
              () => {
                this.getStu();
              },
            );
          }
        } else {
          message.error(response.message);
        }
      },
    });
  }
  getStu = () => {
    this.props
      .dispatch({
        type: "home/getTrendStu",
        payload: {
          groupId: this.state.groupId,
          searchStudentKeyWord: this.state.stuName,
          examId: this.props.examId,
          filterFlag: this.state.summaryAnalysisSpecify,
        },
      })
      .then(() => {
        if (this.props.trendStuList && this.props.trendStuList.length > 0) {
          this.setState(
            {
              stuId: this.props.trendStuList[0].studentId,
            },
            () => {
              this.getPage(this.rende);
            },
          );
        }
      });
  };
  changeClass = (value) => {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
      },
      () => {
        this.getStu();
      },
    );
  };
  getPage = () => {
    const { check } = this.state;
    this.props
      .dispatch({
        type: "home/clearKnowLedgeAnalysis",
        payload: {},
      })
      .then(() => {
        this.props.dimensionAnalysis &&
          this.props.dimensionAnalysis.map((item, index) => {
            this.props
              .dispatch({
                type: "home/getKnowLedgeTable",
                payload: {
                  studentId: check == 2 ? null : this.state.stuId,
                  examId: this.props.examId,
                  studentName: this.state.stuName || "",
                  analyseType: check,
                  type: item,
                  filterFlag: this.state.summaryAnalysisSpecify,
                  groupId: check == 2 ? this.state.groupId : null,
                  isGroupId: true,
                },
              })
              .then(() => {
                console.log("knowLedgeAnalysis", this.props.knowLedgeAnalysis);
                if (
                  this.props.knowLedgeAnalysis &&
                  this.props.knowLedgeAnalysis.qualityIndicatorData &&
                  this.props.knowLedgeAnalysis.qualityIndicatorData.length > 0
                ) {
                  this.summaryList.push(this.props.knowLedgeAnalysis);

                  if (this.state.viewType === 1) {
                    this.renderChart(this.props.knowLedgeAnalysis, index);
                  } else {
                    this.radarChart(this.props.knowLedgeAnalysis, index);
                  }
                }
              });
          });
        // console.log(this.summaryList, "222");
      });
  };

  radarChart = (knowLedgeAnalysis, id) => {
    const dom = document.getElementById(`trendBox${id}`);
    dom.style.width = "45%";
    this[`rasarChart${id}`].changeWidth(dom.offsetWidth);
    if (!this.rende) {
      this[`rasarChart${id}`].clear();
    }

    let newList = [];
    let minNumber = 100;
    if (
      knowLedgeAnalysis &&
      knowLedgeAnalysis.qualityIndicatorData &&
      knowLedgeAnalysis.qualityIndicatorData.length > 0
    ) {
      knowLedgeAnalysis?.qualityIndicatorData[0]?.columnDataModelList.map(
        (item, index) => {
          newList.push({
            年级得分率: Number.parseInt(item.averageRate, 10),
            index: index,
          });
          if (Number.parseInt(item.averageRate, 10) < minNumber) {
            minNumber = Number.parseInt(item.averageRate, 10);
          }
        },
      );
      knowLedgeAnalysis?.qualityIndicatorData[1]?.columnDataModelList.map(
        (item, index) => {
          newList[index][this.state.check == 1 ? "学生得分率" : "班级得分率"] =
            Number.parseInt(item.averageRate, 10);
          if (Number.parseInt(item.averageRate, 10) < minNumber) {
            minNumber = Number.parseInt(item.averageRate, 10);
          }
        },
      );
      knowLedgeAnalysis?.columnSet.map((item, index) => {
        if (index == 0) return;
        newList[index - 1].title = item.columnName;
      });
    }
    minNumber = Math.floor(minNumber / 10) * 10;

    var dv = new DataView().source(newList);
    dv.transform({
      type: "fold",
      fields: [
        this.state.check == 1 ? "学生得分率" : "班级得分率",
        "年级得分率",
      ], // 展开字段集
      key: "user", // key字段
      value: "score", // value字段
    });

    this[`rasarChart${id}`].source(dv, {
      score: {
        min: 0, //minNum,
        max: 100,
      },
    });
    this[`rasarChart${id}`].coord("polar", {
      radius: 1,
    });
    this[`rasarChart${id}`].axis("title", {
      tickCount: 5, // 设置刻度数为5
      line: null,
      label: {
        textStyle: {
          fontSize: 10,
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
    this[`rasarChart${id}`].axis("score", {
      line: null,
      tickLine: null,
      grid: {
        type: "polygon",
        lineStyle: {
          lineDash: null,
        },
      },
    });
    this[`rasarChart${id}`].legend("user", {
      marker: "circle",
      offset: 30,
    });

    this[`rasarChart${id}`]
      .line()
      .position("title*score")
      .color("user", ["#3D94FF", "#12CC67"])
      .size(1);
    this[`rasarChart${id}`]
      .point()
      .position("title*score")
      .color("user", ["#3D94FF", "#12CC67"])
      .shape("circle")
      .size(0);

    this[`rasarChart${id}`].tooltip({
      itemTpl: `<div>
                   <li>
                     <span style="background-color: {color}; width: 4px;height: 4px;border-radius: 2px;display: inline-block; vertical-align: middle"></span>
                     <span style='margin-left: 10px;'>{name}</span>
                     <span style='margin-left: 10px;'>{value}%</span>
                   </li>
               </div>`,
    });
    this[`rasarChart${id}`]
      .area()
      .position("title*score")
      .color("user", ["#3D94FF", "#12CC67"])
      .style({
        fillOpacity: 0.3,
      });
    this[`rasarChart${id}`].render();
    if (this.rende) {
      this.rende = false;
    }
  };

  renderChart = (knowLedgeAnalysis, id) => {
    // $(`#trendBox${id}`).find("canvas").remove();
    if (knowLedgeAnalysis.columnSet && knowLedgeAnalysis.columnSet.length > 0) {
      if (
        knowLedgeAnalysis.columnSet.length > 4 &&
        knowLedgeAnalysis.columnSet.length < 8
      ) {
        const dom = document.getElementById(`trendBox${id}`);
        dom.style.width = "50%";
        this[`chart${id}`].changeWidth(dom.offsetWidth);
      } else if (knowLedgeAnalysis.columnSet.length > 7) {
        const dom = document.getElementById(`trendBox${id}`);
        dom.style.width = "100%";
        this[`chart${id}`].changeWidth(dom.offsetWidth);
      } else if (knowLedgeAnalysis.columnSet.length < 5) {
        const dom = document.getElementById(`trendBox${id}`);
        dom.style.width = "33%";
        this[`chart${id}`]?.changeWidth(dom.offsetWidth);
      }
    }

    if (!this.rende) {
      this[`chart${id}`].clear();
    }
    let newList = [];
    if (
      knowLedgeAnalysis &&
      knowLedgeAnalysis.qualityIndicatorData &&
      knowLedgeAnalysis.qualityIndicatorData.length > 0
    ) {
      knowLedgeAnalysis?.qualityIndicatorData[0]?.columnDataModelList.map(
        (item, index) => {
          newList.push({
            年级得分率: Number.parseInt(item.averageRate, 10),
            index: index,
          });
        },
      );
      knowLedgeAnalysis?.qualityIndicatorData[1]?.columnDataModelList.map(
        (item, index) => {
          newList[index][this.state.check == 1 ? "学生得分率" : "班级得分率"] =
            Number.parseInt(item.averageRate, 10);
        },
      );
      knowLedgeAnalysis?.columnSet.map((item, index) => {
        if (index == 0) return;
        newList[index - 1].title = item.columnName;
      });
    }

    this[`chart${id}`].source(newList);
    let object = {
      年级得分率: {
        min: 0,
        max: 100,
        formatter: (value) => {
          // 设置坐标轴和提示框的文字
          return value + "%";
        },
      },
    };

    let temporaryObject = {
      min: 0,
      max: 100,
      formatter: (value) => {
        // 设置坐标轴和提示框的文字
        return value + "%";
      },
    };
    if (this.state.check == 1) {
      object["学生得分率"] = temporaryObject;
    } else {
      object["班级得分率"] = temporaryObject;
    }

    this[`chart${id}`].scale(object);
    this[`chart${id}`].axis("年级得分率", {
      grid: null,
      label: {
        textStyle: {
          fill: "",
        },
      },
      line: null,
    });
    this[`chart${id}`]
      .interval()
      .position(`title*${this.state.check == 1 ? "学生得分率" : "班级得分率"}`)
      .color("title", [
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
      .tooltip(
        `title*${this.state.check == 1 ? "学生得分率" : "班级得分率"}*color*fakeName`,
        (title, value, color, fakeName) => {
          return {
            name: title,
            value,
            color,
            fakeName: this.state.check == 1 ? "学生得分率" : "班级得分率",
          };
        },
      );
    this[`chart${id}`]
      .line()
      .position("title*年级得分率")
      .color("#f00")
      .size(2)
      .shape("line")
      .tooltip(
        "title*年级得分率*color*fakeName",
        (title, value, color, fakeName) => {
          // console.log(title, value, color, fakeName, "hhb");
          return {
            name: title,
            value,
            color: "#f00",
            fakeName: "年级得分率",
          };
        },
      );
    this[`chart${id}`].axis("title", {
      label: {
        textStyle: {
          textAlign: "center", // 文本对齐方向，可取值为： start center end
          fill: "#404040", // 文本的颜色
          fontSize: "12", // 文本大小
          fontWeight: "bold", // 文本粗细
          textBaseline: "middle", // 文本基准线，可取 top middle bottom，默认为middle
        },
        htmlTemplate(text, item, index) {
          console.log(knowLedgeAnalysis.columnSet.length, "zwl");
          if (knowLedgeAnalysis.columnSet.length > 20) {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 45px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 45px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 45px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 45px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            }
          } else {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 54px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 54px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 54px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 54px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            }
          }
        },
      },
    });
    this[`chart${id}`].tooltip({
      itemTpl: `<div>
           <li>
            <span style="background-color: {color}; width: 4px;height: 4px;border-radius: 2px;display: inline-block; vertical-align: middle"></span>
            <span style='margin-left: 10px;'>{fakeName}</span>
            <span style='margin-left: 10px;'>{value}%</span>
          </li>
        </div>`,
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
    if (this.rende) {
      this.rende = false;
    }
  };
  onSearch = (value) => {
    this.getStu();
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
      },
    );
  };
  chooseStu = (id) => {
    this.setState(
      {
        stuId: id,
      },
      () => {
        this.getPage();
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
  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        summaryAnalysisSpecify: checked,
      },
      () => {
        this.getStu();
      },
    );
  };
  viewTypeChange = (e) => {
    if (e.target.value === 1) {
      this.setState(
        {
          viewType: 1,
        },
        () => {
          this.getPage();
        },
      );
    } else {
      this.setState(
        {
          viewType: 2,
        },
        () => {
          this.getPage();
        },
      );
    }
  };
  render() {
    const {
      currentUser,
      basketList,
      basketSubjectId,
      questionScore,
      tableClass,
      trendStuList,
      trendList,
      classListData,
    } = this.props;
    const { check, stuId } = this.state;
    // console.log("123");

    return (
      <div id="custom0">
        <div className={styles.tableBox}>
          <div
            className={styles.tableBoxHeader}
            style={{ position: "relative" }}
          >
            {/* <span className={styles.tableHeaderSpan}></span> */}
            <span className={styles.tableHeaderTitle}>
              {trans("data.summaryAnalysis", "汇总分析")}
            </span>

            {/* <Pagination simple current={this.state.pageNo} total={questionScore.rowTotalNum} showSizeChanger onChange={this.changeNo}/> */}
            {/* <a
              href={`${window.location.origin}/api/export/exam/questionScoreAnalyse?examId=${this.props.examId}&groupId=${this.state.groupId}&searchStudentKeyWord=${this.state.stuName}&questionType=2&analyseType=${this.state.check}`}
              target="_blank"
            >
              <span className={styles.export}>
                {trans("global.export", "导出")}
              </span>
            </a> */}
            <span className={styles.viewBox}>
              <span
                onClick={this.changeTab.bind(this, 1)}
                className={[
                  styles.viewTab,
                  check === 1 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.studentView", "按学生看")}
              </span>
              <span
                onClick={this.changeTab.bind(this, 2)}
                className={[
                  styles.viewTab,
                  check === 2 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.classView", "按班级看")}
              </span>
            </span>
            <Radio.Group
              onChange={this.viewTypeChange}
              value={this.state.viewType}
              style={{ marginLeft: "auto" }}
            >
              <Radio value={1}>
                {trans("personalTable.barChart", "柱状图")}
              </Radio>
              <Radio value={2}>
                {trans("personalTable.radarChart", "雷达图")}
              </Radio>
            </Radio.Group>
            {this.props.filterStudentListPermissions.haveFilterStudentList ? (
              <ChartSwitch
                defaultChecked
                label={trans("global.specifyAnalysis", "指定分析")}
                checked={this.state.summaryAnalysisSpecify}
                onChange={this.courseDetailSpecifyChange}
                style={{ marginLeft: "4px" }}
              />
            ) : null}
          </div>
          <div id="table5" className={[styles.trendBox].join(" ")}>
            <div className={styles.stuList} style={{ width: "200px" }}>
              {check === 1 ? (
                <>
                  <Search
                    placeholder={trans("global.searchStu", "搜索学生")}
                    allowClear
                    value={this.state.stuName}
                    onChange={this.changeSearch}
                    onSearch={this.onSearch}
                    style={{ width: 150, left: 25 }}
                  />
                  <Select
                    onChange={this.changeClass}
                    value={this.state.groupId}
                    style={{ width: 150, left: 25, marginTop: 10 }}
                  >
                    <Option value={0} key={0}>
                      <span>{trans("global.allClass", "全部班级")}</span>
                    </Option>
                    {classListData &&
                      classListData.length &&
                      classListData.map((item) => (
                        <Option value={item.groupId} key={item.groupId}>
                          <span>
                            {language ? item.groupName : item.groupEnName}
                          </span>
                        </Option>
                      ))}
                  </Select>
                  <div style={{ height: "400px", marginTop: "10px" }}>
                    {trendStuList && trendStuList.length > 0
                      ? trendStuList.map((item) => (
                          <div
                            className={[
                              styles.userBox,
                              stuId === item.studentId ? styles.isChecked : "",
                            ].join(" ")}
                            onClick={this.chooseStu.bind(this, item.studentId)}
                          >
                            <div className={[styles.nameBox].join(" ")}>
                              <div>
                                {locale() == "en"
                                  ? item.enName
                                  : item.studentName}
                              </div>
                            </div>
                          </div>
                        ))
                      : null}
                  </div>
                </>
              ) : (
                <div style={{ height: "400px", marginTop: "10px" }}>
                  {classListData && classListData.length > 0
                    ? classListData.map((item) => (
                        <div
                          className={[
                            styles.userBox,
                            this.state.groupId === item.groupId
                              ? styles.isChecked
                              : "",
                          ].join(" ")}
                          onClick={this.changeClass.bind(this, item.groupId)}
                        >
                          <div className={[styles.nameBox].join(" ")}>
                            <div>
                              {language ? item.groupName : item.groupEnName}
                            </div>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              )}
            </div>

            <div className={styles.personalChartBox}>
              {this.props.dimensionAnalysis &&
                this.props.dimensionAnalysis.length &&
                this.props.dimensionAnalysis.map((item, index) => (
                  <div
                    style={{
                      position: "relative",
                      width: "33%",
                      marginTop: "10px",
                    }}
                    id={`trendBox${index}`}
                  >
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        top: this.state.viewType === 2 ? 0 : "-10px",
                        textAlign: "center",
                      }}
                    >
                      {item}
                    </div>
                    <div
                      id={`trendNode${index}`}
                      style={{
                        display: this.state.viewType === 1 ? "block" : "none",
                      }}
                    ></div>
                    <div
                      id={`rasarNode${index}`}
                      style={{
                        display: this.state.viewType === 2 ? "block" : "none",
                      }}
                    ></div>
                  </div>
                ))}
            </div>
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
  trendList: home.trendList,
  trendStuList: home.trendStuList,
  classListData: home.classListData,
  knowLedgeAnalysis: home.knowLedgeAnalysis,
}))(GlobalHeader);

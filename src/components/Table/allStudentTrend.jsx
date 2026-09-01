import React, { PureComponent } from "react";
import { Chart } from "@antv/g2";
import { Input, Select, TreeSelect } from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
let chart;
const { Search } = Input;
const { Option } = Select;
const { TreeNode } = TreeSelect;
class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = window.location.hash;
    this.pathMatch = this.url.split("/");
    this.studentId =
      this.pathMatch && this.pathMatch[2] ? this.pathMatch[2] : null;
    this.state = {
      check: 1,
      groupId: "",
      searchName: "",
      stuId: null,
      pageNo: 1,
      stuName: "",
      treeClass: [],
      subjectId: null,
    };
    this.rende = true;
  }
  componentDidMount() {
    console.log(this.studentId, "444");

    const { dispatch } = this.props;
    dispatch({
      type: "studentLearning/getTeachingOrg",
      payload: {
        matchName: "",
      },
    }).then(() => {
      this.handleTree(this.props.teachingOrgList);
    });
    dispatch({
      type: "studentLearning/getAllSubject",
    });

    if (this.studentId) {
      this.setState(
        {
          stuId: this.studentId,
        },
        () => {
          this.getPage();
        },
      );
    } else {
      this.getStu();
    }
  }
  getStu = () => {
    this.props
      .dispatch({
        type: "studentLearning/getAllStudents",
        payload: {
          groupId: this.state.groupId,
          matchName: this.state.stuName,
        },
      })
      .then(() => {
        if (
          this.props.allStudents &&
          this.props.allStudents.studentList &&
          this.props.allStudents.studentList.length > 0
        ) {
          this.setState(
            {
              stuId: this.props.allStudents.studentList[0].id,
            },
            () => {
              this.getPage();
            },
          );
        }
      });
  };
  changeClass = (value) => {
    // if (value.includes("grade")) {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
      },
      () => {
        this.getStu();
      },
    );
    // }
    console.log(value, "sss");
  };
  getPage = () => {
    // this.props
    //   .dispatch({
    //     type: "home/clearPartScore",
    //     payload: {},
    //   })
    //   .then(() => {
    this.props
      .dispatch({
        type: "home/getTrend",
        payload: {
          studentId: this.state.stuId,
          subjectId: this.state.subjectId == 0 ? "" : this.state.subjectId,
        },
      })
      .then(() => {
        if (
          this.props.trendList &&
          this.props.trendList.trendAnalysisResultModelList &&
          this.props.trendList.trendAnalysisResultModelList.length > 0
        ) {
          this.renderChart();
        }
      });
    // });
  };
  renderChart = () => {
    // if (!this.rende) {
    //   chart.clear();
    // }
    $("#trendNode").find("canvas").remove();
    let newList = [];
    if (
      this.props.trendList &&
      this.props.trendList.trendAnalysisResultModelList &&
      this.props.trendList.trendAnalysisResultModelList.length > 0
    ) {
      this.props.trendList.trendAnalysisResultModelList.map((item) => {
        newList.push({
          学生分数: Number.parseInt(item.examScore, 10),
          年级平均分: Number.parseInt(item.examAverageScore, 10),
          年级排名: Number.parseInt(item.examRanking, 10),
          examName: item.examName,
        });
      });
    }
    chart = new Chart({
      container: "trendNode",
      forceFit: true,
      height: 400,
      padding: [35, 80, 50, 80],
    });
    chart.source(newList);
    chart.scale({
      年级排名: {
        min: 0,
      },
      学生分数: {
        min: 0,
      },
      年级平均分: {
        min: 0,
      },
    });
    chart.scale("年级排名", {
      range: [1, 0],
      tickCount: 5,
      min: 0,
    });
    chart.scale("学生分数", {
      tickCount: 5,
      min: 0,
      max: this.props.trendList.maxScore - 0,
    });
    chart.scale("年级平均分", {
      tickCount: 5,
      min: 0,
      max: this.props.trendList.maxScore - 0,
    });
    chart.axis("学生分数", {
      // grid: null,
      label: {
        textStyle: {
          fill: "#01113d",
        },
      },
      line: null,
    });
    chart.axis("年级排名", {
      grid: null,
      label: {
        offsetX: -10,
        textStyle: {
          fill: "#01113d",
        },
      },
    });
    chart.axis("年级平均分", {
      grid: null,
      label: null,
      line: null,
    });
    chart
      .line()
      .position("examName*学生分数")
      .color("rgba(59, 140, 255)")
      .size(2)
      .shape("line");
    chart
      .line()
      .position("examName*年级平均分")
      .color("rgba(78, 209, 150)")
      .size(2)
      .shape("line");
    chart
      .line()
      .position("examName*年级排名")
      .color("rgba(245, 194, 73)")
      .size(2)
      .shape("dash");
    chart.tooltip({
      style: {
        textAlign: "left",
      },
    });
    chart.axis("examName", {
      label: {
        textStyle: {
          textAlign: "center", // 文本对齐方向，可取值为： start center end
          fill: "#404040", // 文本的颜色
          fontSize: "12", // 文本大小
          fontWeight: "bold", // 文本粗细
          textBaseline: "middle", // 文本基准线，可取 top middle bottom，默认为middle
        },
        htmlTemplate(text, item, index) {
          // console.log(newList.columnSet.length, "zwl");
          if (newList.length > 15) {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 40px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 40px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 10px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 40px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 40px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 10px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            }
          } else if (newList.length > 10) {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 50px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 50px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 10px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 40px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 40px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 10px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            }
          } else {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 100px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 100px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 100px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 100px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            }
          }
        },
      },
    });
    chart.legend({
      // custom: true,
      mode: "single",
      position: "top",
      useHtml: true,
      marker: "square",
      attachLast: true,
      onClick: (e) => {
        console.log("e", e);
      },
    });
    chart.render();

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

  handleTree = (array) => {
    // const { teachingOrgList } = this.props;
    if (array && array.length < 0) return;
    let newArray = [];
    let newPid = 0;
    array &&
      array.map((element) => {
        let object = {};
        if (element.type == "org") {
          newPid = newPid + 1;
          object.title = element.name;
          object.value = element.id;
          // obj.key = el.id;
          object.id = element.id;
          object.pid = newPid;
          if (element.nodes) {
            object.children = this.handleTree(element.nodes);
          }
          newArray.push(object);
        }
      });
    this.setState({
      treeClass: newArray,
    });
    return newArray;
  };

  clickSub = (id) => {
    this.setState(
      {
        subjectId: id,
      },
      () => {
        this.getPage();
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
      trendList,
      teachingOrgList,
      allStudents,
      allSubjectList,
    } = this.props;
    const { check, stuId, treeClass, subjectId } = this.state;

    return (
      <div className={styles.questionTable} id="table1">
        <div className={styles.tableBox}>
          <div id="table1" className={[styles.homePage].join(" ")}>
            {this.studentId ? null : (
              <div className={styles.stuList} style={{ width: "200px" }}>
                <Search
                  placeholder={trans("global.searchStu", "搜索学生")}
                  allowClear
                  value={this.state.stuName}
                  onChange={this.changeSearch}
                  onSearch={this.onSearch}
                  style={{ width: 150, left: 25 }}
                />
                <TreeSelect
                  treeDataSimpleMode
                  onChange={this.changeClass}
                  // value={this.state.groupId}
                  style={{ width: 150, left: 25, marginTop: 10 }}
                  treeData={treeClass}
                  placeholder={trans("global.selectClass", "选择班级")}
                ></TreeSelect>
                <div
                  style={{
                    height: "400px",
                    overflow: "scroll",
                    marginTop: "10px",
                  }}
                >
                  {allStudents &&
                  allStudents.studentList &&
                  allStudents.studentList.length > 0
                    ? allStudents.studentList.map((item) => (
                        <div
                          className={[
                            styles.userBox,
                            stuId === item.id ? styles.isChecked : "",
                          ].join(" ")}
                          onClick={this.chooseStu.bind(this, item.id)}
                        >
                          <div className={[styles.nameBox].join(" ")}>
                            <div>{item.name}</div>
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              </div>
            )}
            <div
              style={{
                flex: 1,
                marginLeft: 20,
              }}
              className={styles.rightBox}
            >
              <div className={styles.tableBoxHeader} style={{ height: "70px" }}>
                <div
                  className={styles.tabSub}
                  // style={
                  //   this.studentId
                  //     ? { marginLeft: "30px" }
                  //     : { marginLeft: "200px" }
                  // }
                >
                  <span
                    className={styles.subBox}
                    style={
                      subjectId == 0 ? { borderBottom: "2px solid blue" } : null
                    }
                    onClick={() => this.clickSub(0)}
                  >
                    {trans("global.overallSituation", "整体情况")}
                  </span>
                  {allSubjectList &&
                    allSubjectList.length > 0 &&
                    allSubjectList.map((item) => (
                      <span
                        className={styles.subBox}
                        style={
                          subjectId == item.id
                            ? { borderBottom: "2px solid blue" }
                            : null
                        }
                        onClick={() => this.clickSub(item.id)}
                      >
                        {item.name}
                      </span>
                    ))}
                </div>
              </div>
              {subjectId == 0 ? (
                <div>{trans("selectCourse.noData", "暂无数据")}</div>
              ) : (
                <div
                  className={[styles.trendParent, styles.chartName].join(" ")}
                  // style={{ flex: "1", paddingRight: "20px" }}
                >
                  <div className={styles.fakeTitle}>
                    <div style={{ marginLeft: "54px" }}>
                      {trans("global.score", "分数")}
                    </div>
                    <div style={{ marginRight: "61px" }}>
                      {trans("data.ranking", "排名")}
                    </div>
                  </div>
                  <div id="trendNode"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default connect(({ home, studentLearning }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  trendList: home.trendList,
  teachingOrgList: studentLearning.teachingOrgList,
  allStudents: studentLearning.allStudents,
  allSubjectList: studentLearning.allSubjectList,
}))(GlobalHeader);

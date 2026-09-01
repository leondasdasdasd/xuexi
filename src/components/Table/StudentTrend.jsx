import React, { PureComponent } from "react";
import { DataSet } from "@antv/data-set";
import { Chart } from "@antv/g2";
import Slider from "@antv/g2-plugin-slider";
import { Input, Select, Switch } from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
let chart;
const { Search } = Input;
const { Option } = Select;
class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 1,
      groupId: null,
      searchName: "",
      stuId: null,
      pageNo: 1,
      stuName: "",
      studentTrendSpecify: false,
    };
    this.rende = true;
  }
  componentDidMount() {
    chart = new Chart({
      container: "trendNode",
      forceFit: true,
      height: 400,
      padding: [30, 100, 120, 80],
    });
    const { dispatch } = this.props;
    dispatch({
      type: "home/getClassList",
      payload: {
        examId: this.props.examId,
      },
    }).then(() => {
      this.setState(
        {
          groupId: this.props.classListData[0]?.groupId,
        },
        () => {
          this.getStu();
        },
      );
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
          filterFlag: this.state.studentTrendSpecify,
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
    this.props
      .dispatch({
        type: "home/clearPartScore",
        payload: {},
      })
      .then(() => {
        this.props
          .dispatch({
            type: "home/getTrend",
            payload: {
              studentId: this.state.stuId,
              examId: this.props.examId,
              filterFlag: this.state.studentTrendSpecify,
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
      });
    // this.props.dispatch({
    //   type: "home/getPartScore",
    //   payload: {
    //     examId: this.props.examId,
    //     groupId: this.state.groupId,
    //     // pageNo:this.state.pageNo,
    //     // limit: 10,
    //     searchStudentKeyWord: this.state.stuName,
    //     questionType: 2,
    //     analyseType: this.state.check,
    //   },
    // });
  };

  renderChart = () => {
    // chart = new Chart({
    //   container: 'trendNode',
    //   autoFit: true,
    //   height: 500
    // });
    if (!this.rende) {
      chart.clear();
      this.slider.destroy();
    }

    // console.log(this.props.trendList, chart);
    // const data = [
    //   { year: '1951 年', sales: 38 },
    //   { year: '1952 年', sales: 52 },
    //   { year: '1956 年', sales: 61 },
    //   { year: '1957 年', sales: 145 },
    //   { year: '1958 年', sales: 48 },
    //   { year: '1959 年', sales: 38 },
    //   { year: '1960 年', sales: 38 },
    //   { year: '1962 年', sales: 38 },
    // ];
    // chart.source(data);
    let newList = [];
    if (
      this.props.trendList &&
      this.props.trendList.trendAnalysisResultModelList &&
      this.props.trendList.trendAnalysisResultModelList.length > 0
    ) {
      this.props.trendList.trendAnalysisResultModelList.map((item, index) => {
        newList.push({
          学生分数: Number.parseInt(item.examScore, 10),
          年级平均分: Number.parseInt(item.examAverageScore, 10),
          年级排名: Number.parseInt(item.examRanking, 10),
          examName: item.examName,
          index,
        });
      });
    }
    // chart.source(newList);
    const ds = new DataSet({
      state: {
        from: 0,
        to: newList.length - 1,
      },
    });
    const dv = ds.createView();
    dv.source(newList).transform({
      // !!! 根据状态量设置数据过滤规则，
      type: "filter",
      callback: (object) => {
        console.log(object, "oo");
        return object.index >= ds.state.from && object.index <= ds.state.to;
      },
    });
    const view1 = chart.view({
      // start: {
      //   x: 0,
      //   y: 0
      // },
      // end: {
      //   x: 1,
      //   y: 0.45
      // }
    });
    view1.source(dv);
    view1.scale({
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
    view1.scale("年级排名", {
      range: [1, 0],
      tickCount: 5,
      min: 0,
    });
    view1.scale("学生分数", {
      tickCount: 5,
      min: 0,
      max: this.props.trendList.maxScore - 0,
    });
    view1.scale("年级平均分", {
      tickCount: 5,
      min: 0,
      max: this.props.trendList.maxScore - 0,
    });
    view1.axis("学生分数", {
      // grid: null,
      label: {
        textStyle: {
          fill: "#01113d",
        },
      },
      // title: {
      //   autoRotate: false,
      //   offset: -50,

      //   textStyle: {
      //     textAlign: "end",
      //     fill: "#01113d",
      //     fontSize: "12",
      //     rotate: 0,
      //     textBaseline: "end",
      //   },
      //   position: "end",
      // },
      line: null,
    });
    view1.axis("年级排名", {
      grid: null,
      label: {
        offsetX: -10,
        textStyle: {
          fill: "#01113d",
        },
      },
      // title: {
      //   autoRotate: false,
      //   offset: -10,

      //   textStyle: {
      //     textAlign: "end",
      //     fill: "#01113d",
      //     fontSize: "12",
      //     rotate: 0,
      //     textBaseline: "end",
      //   },
      //   position: "end",
      // },
    });
    view1.axis("年级平均分", {
      grid: null,
      label: null,
      line: null,
    });
    view1
      .line()
      .position("examName*学生分数")
      .color("rgba(59, 140, 255)")
      .size(2)
      .shape("line");
    view1
      .line()
      .position("examName*年级平均分")
      .color("rgba(78, 209, 150)")
      .size(2)
      .shape("line");
    view1
      .line()
      .position("examName*年级排名")
      .color("rgba(245, 194, 73)")
      .size(2)
      .shape("dash");
    view1.tooltip({
      style: {
        textAlign: "left",
      },
    });
    view1.axis("examName", {
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
    // chart
    //   .point()
    //   .position("examName*年级平均分")
    //   .color("rgba(78, 209, 150)")
    //   .size(3)
    //   .shape("circle");
    // chart
    //   .point()
    //   .position("examName*学生分数")
    //   .color("rgba(59, 140, 255)")
    //   .size(3)
    //   .shape("circle");
    // chart
    //   .point()
    //   .position("examName*年级排名")
    //   .color("rgba(245, 194, 73)")
    //   .size(3)
    //   .shape("circle");
    // chart.axis("examName", {
    //   // grid: null,
    //   label: {
    //     textStyle: {
    //       fill: "examName",
    //     },
    //   },
    //   line: null,
    // });
    // chart.legend({
    //   // mode: "single",
    //   position: "top",
    //   marker: "square",
    //   attachLast: true,
    //   selected: {},
    // });
    // chart.point()
    //   .position('examName*学生分数')
    //   .size(3)
    //   .shape('circle');
    //   chart.point()
    //   .position('examName*年级平均分')
    //   .size(3)
    //   .shape('circle');
    //   chart.point()
    //   .position('examName*年级排名')
    //   .size(3)
    //   .shape('circle');
    // chart.interval().position('year*sales');
    chart.legend({
      // custom: true,
      mode: "single",
      position: "bottom",
      useHtml: true,
      marker: "square",
      attachLast: true,
      onClick: (e) => {
        console.log("e", e);
      },
    });
    // chart.slider({
    //   x: { labelFormatter: (a,b, c, d) => console.log(a, b, c, d, '123') },
    //   // y: { labelFormatter: '~s' },
    // });

    chart.render();
    this.slider = new Slider({
      container: "silder",
      data: newList,
      padding: [100, 100, 40, 100],
      height: 15,
      xAxis: "examName",
      yAxis: "年级排名",
      onChange: (object) => {
        const { startValue, endValue, startText, endText } = object;
        let startRow = dv.origin.find((item) => item.examName === startText);
        let endRow = dv.origin.find((item) => item.examName === endText);
        let startIndex = 0; //起始下标
        let endIndex = 4; //终止下标
        startIndex = startRow.index || 0;
        endIndex = endRow.index || 4;
        console.log(startIndex, endIndex);
        // !!! 更新状态量

        ds.setState("from", startIndex);
        ds.setState("to", endIndex);
      },
    });
    this.slider.render();
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
        studentTrendSpecify: checked,
      },
      () => {
        this.getStu();
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
      trendStuList,
      trendList,
      classListData,
    } = this.props;
    const { check, stuId } = this.state;

    return (
      <div className={styles.questionTable} id="table5">
        <div className={styles.tableBox}>
          <div className={styles.tableBoxHeader}>
            {/* <span className={styles.tableHeaderSpan}></span> */}
            <span className={styles.tableHeaderTitle}>
              {trans("data.studentTrend", "学生趋势分析")}
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
            <div className={styles.operationS}>
              {this.props.filterStudentListPermissions.haveFilterStudentList ? (
                <span className={styles.nameSwith2}>
                  {trans("global.specifyAnalysis", "指定分析")}
                  <Switch
                    defaultChecked
                    checked={this.state.studentTrendSpecify}
                    onChange={this.courseDetailSpecifyChange}
                    style={{ marginLeft: "4px" }}
                  />
                </span>
              ) : null}
            </div>
          </div>
          <div id="table5" className={[styles.trendBox].join(" ")}>
            <div className={styles.stuList} style={{ width: "200px" }}>
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
                {/* <Option value={0} key={0}>
                  <span>{trans("global.allClass", "全部班级")}</span>
                </Option> */}
                {classListData &&
                  classListData.length &&
                  classListData.map((item) => (
                    <Option value={item.groupId} key={item.groupId}>
                      <span>{language ? item.groupName : item.groupEName}</span>
                    </Option>
                  ))}
              </Select>
              <div
                style={{
                  height: "400px",
                  overflow: "scroll",
                  marginTop: "10px",
                }}
              >
                {trendStuList && trendStuList.length > 0
                  ? trendStuList.map((item) => (
                      <div
                        key={item.studentId}
                        className={[
                          styles.userBox,
                          stuId === item.studentId ? styles.isChecked : "",
                        ].join(" ")}
                        onClick={this.chooseStu.bind(this, item.studentId)}
                      >
                        <div className={[styles.nameBox].join(" ")}>
                          <div>
                            {locale() == "en"
                              ? item.studentEnName
                              : item.studentName}
                          </div>
                        </div>
                      </div>
                    ))
                  : null}
              </div>
            </div>
            <div
              className={styles.trendParent}
              style={{ flex: "1", paddingRight: "20px" }}
            >
              <div className={styles.fakeTitle}>
                <div style={{ marginLeft: "54px" }}>
                  {trans("global.score", "分数")}
                </div>
                <div style={{ marginRight: "131px" }}>
                  {trans("data.ranking", "排名")}
                </div>
              </div>
              <div id="trendNode" className={styles.chart}></div>
              <div id="silder"></div>
              {/* <div className={styles.fakeBottom}>
                <div>
                  <span
                    style={{
                      width: "20px",
                      height: "2px",
                      display: "inline-block",
                      verticalAlign: "middle",
                      background: "rgba(59, 140, 255)",
                    }}
                  ></span>
                  <span
                    style={{
                      verticalAlign: "middle",
                      display: "inline-block",
                      margin: "0 10px 0 4px",
                    }}
                  >
                    学生分数
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      width: "20px",
                      height: "2px",
                      display: "inline-block",
                      verticalAlign: "middle",
                      background: "rgba(78, 209, 150)",
                    }}
                  ></span>
                  <span
                    style={{
                      verticalAlign: "middle",
                      display: "inline-block",
                      margin: "0 10px 0 4px",
                    }}
                  >
                    年级平均分
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      color: "rgba(245, 194, 73)",
                      verticalAlign: "middle",
                    }}
                  >
                    ---
                  </span>
                  <span
                    style={{
                      verticalAlign: "middle",
                      display: "inline-block",
                      margin: "0 10px 0 4px",
                    }}
                  >
                    年级排名
                  </span>
                </div>
              </div> */}
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
}))(GlobalHeader);

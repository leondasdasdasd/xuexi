import React from "react";
import { Dropdown, Icon, Input, Menu, Select, Table } from "antd";
import { connect } from "dva";
import * as echarts from "echarts";
import pathToRegexp from "path-to-regexp";

import { locale, trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Option } = Select;
const { Search } = Input;
const { Column } = Table;
const list = [
  {
    semesterName: "2023学年第一学期",
    semesterId: 1,
  },
  {
    semesterName: "2022学年第二学期",
    semesterId: 2,
  },
  {
    semesterName: "2022学年第一学期",
    semesterId: 3,
  },
];
class StudentHomepage extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      clickSemesterName: "",
      semesterId: null,
      semester: null,
      tabValue: "subject",
      subjectId: null,
      dataList: [],
      semesterList: [],
    };
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/studentPageMobile/:stuId?").exec(this.url);
    this.stuId = this.pathMatch[1] ? JSON.parse(this.pathMatch[1]) : null;
  }

  componentDidMount() {
    console.log(this.stuId);
    // this.setState({
    //   clickSemesterName: list[0].semesterName,
    //   semesterId: list[0].semesterId,
    // })
    this.props
      .dispatch({
        type: "studentLearning/getAllSubject",
      })
      .then(() => {
        if (this.props.allSubjectList && this.props.allSubjectList.length > 0) {
          this.setState(
            {
              subjectId: this.props.allSubjectList[0].id,
            },
            () => {
              this.getLineData();
            },
          );
        }
      });
    this.getRadar();
    this.getTable();
    // this.renderSubjectRadar();
    // this.renderScoreLine();
  }
  clickMenu = ({ key }) => {
    const { mobileData } = this.props;
    console.log(key, "kk");
    let name = "";
    let dataList = [];
    let semesterList = [];
    let semester = null;
    mobileData.map((item) => {
      if (Number.parseInt(key, 10) === item.semesterId) {
        name = item.gradeSemesterName;
        semesterList = item.examTypeModelList || [];
        if (item.examTypeModelList && item.examTypeModelList.length > 0) {
          semester = item.examTypeModelList[0].examTypeCode;
          dataList = item.examTypeModelList[0].subjectList;
        }
      }
    });
    this.setState(
      {
        clickSemesterName: name,
        semesterId: Number.parseInt(key, 10),
        dataList,
        semester,
        semesterList,
      },
      () => {
        this.renderSubjectRadar();
      },
    );
  };
  getRadar = () => {
    this.props
      .dispatch({
        type: "home/getMobileRadar",
        payload: {
          studentId: this.stuId,
        },
      })
      .then(() => {
        const { mobileData } = this.props;
        if (mobileData && mobileData.length > 0) {
          let semester = null;
          let dataList = [];
          // let semesterList = [];
          if (
            mobileData[0].examTypeModelList &&
            mobileData[0].examTypeModelList.length > 0
          ) {
            semester = mobileData[0].examTypeModelList[0].examTypeCode;
            dataList = mobileData[0].examTypeModelList[0].subjectList;
          }
          this.setState(
            {
              clickSemesterName: mobileData[0].gradeSemesterName,
              semesterId: mobileData[0].semesterId,
              semesterList: mobileData[0].examTypeModelList || [],
              semester,
              dataList,
            },
            () => {
              this.renderSubjectRadar();
            },
          );
        }
      });
  };
  renderScoreLine = () => {
    const { newTrendList } = this.props;
    const chartDom = document.querySelector("#scoreLine");
    const myChart = echarts.init(chartDom);
    let xList = [];
    let scoreList = [];
    let avgList = [];
    if (
      newTrendList &&
      newTrendList.trendAnalysisResultModelList &&
      newTrendList.trendAnalysisResultModelList.length > 0
    ) {
      newTrendList.trendAnalysisResultModelList.map((item) => {
        xList.push({
          value: item.examCreateDate.split(" ")[0].split("-").join("\n"),
          textStyle: {
            fontSize: 10,
          },
        });
        scoreList.push(item.examScore);
        avgList.push(item.examAverageScore);
      });
    }
    let option;
    option = {
      title: {
        // text: 'Stacked Line'
      },
      color: ["#5B8FF9", "#5AD8A6"],
      tooltip: {
        trigger: "axis",
      },
      legend: {
        // data: ['Email', 'Union Ads', 'Video Ads', 'Direct', 'Search Engine']
        left: "center",
        bottom: "0",
        icon: "rect",
        itemWidth: 20,
        itemHeight: 4,
      },
      grid: {
        top: "15",
        left: "3%",
        right: "4%",
        bottom: "30",
        containLabel: true,
      },
      // toolbox: {
      //   feature: {
      //     saveAsImage: {}
      //   }
      // },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: xList,
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "学生本人",
          type: "line",
          symbol: "none",
          data: scoreList,
        },
        {
          name: "年级平均",
          type: "line",
          symbol: "none",
          data: avgList,
        },
      ],
    };
    option && myChart.setOption(option);
  };
  getTable = () => {
    this.props
      .dispatch({
        type: "home/getTable",
        payload: {
          studentId: this.stuId,
        },
      })
      .then(() => {
        // this.renderRadar();
      });
  };
  checkSemester = (value) => {
    const { semesterList } = this.state;
    let data = [];
    semesterList.map((item) => {
      if (item.examTypeCode === value) {
        data = item.subjectList;
      }
    });
    this.setState(
      {
        semester: value,
        dataList: data,
      },
      () => {
        this.renderSubjectRadar();
      },
    );
  };
  changeSubject = (id) => {
    console.log(111);
    this.setState(
      {
        subjectId: id,
      },
      () => {
        this.getLineData();
      },
    );
  };
  getLineData = () => {
    console.log(111);
    this.props
      .dispatch({
        type: "home/getTrendAnalysisResultNew",
        payload: {
          studentId: this.stuId,
          subjectId: this.state.subjectId,
          gradeIdList: null,
          examTypeList: null,
          examIdList: null,
          type: 0,
        },
      })
      .then(() => {
        // if (
        //   this.props.newTrendList &&
        //   this.props.newTrendList.trendAnalysisResultModelList &&
        //   this.props.newTrendList.trendAnalysisResultModelList.length
        // ) {
        this.renderScoreLine();
        // }
      });
  };
  renderSubjectRadar = () => {
    const chartDom = document.querySelector("#subjectRadar");
    const myChart = echarts.init(chartDom);
    const { dataList } = this.state;
    let option;
    let indiList = [];
    let score = [];
    let avgScore = [];
    if (dataList && dataList.length > 0) {
      dataList.map((item, index) => {
        if (index === 0) {
          indiList.push({ name: item.subjectName });
        } else {
          indiList.push({ name: item.subjectName, axisLabel: { show: false } });
        }
        score.push(item.score);
        avgScore.push(item.avgScore);
      });
    }
    option = {
      title: {
        // text: 'Basic Radar Chart'
      },
      color: ["#FF9451", "#3d94ff"],
      legend: {
        show: true,
        left: "center",
        bottom: 0,
        // z: 4,
        icon: "rect",
        itemWidth: 8,
        itemHeight: 8,
        data: ["学生个人", "年级平均"],
      },
      splitArea: {
        show: false,
      },
      radar: {
        // shape: 'circle',
        indicator: indiList,
        radius: 80,
        splitNumber: 4,
        axisLabel: {
          show: true,
          formatter: function (value, index) {
            console.log(value, "vv");
            if (value === 70) {
              return "c";
            }
            if (value === 80) {
              return "b";
            }
            if (value === 90) {
              return "a";
            }
            if (value === 100) {
              return "a+";
            }
          },
        },
        splitArea: {
          show: false,
        },
      },
      series: [
        {
          type: "radar",
          symbol: "none",
          data: [
            {
              value: score,
              name: "学生个人",
              areaStyle: {
                color: "rgba(255, 148, 81, 0.25)",
              },
            },
            {
              value: avgScore,
              name: "年级平均",
              areaStyle: {
                color: "rgba(61, 148, 255, 0.25)",
              },
            },
          ],
        },
      ],
    };

    option && myChart.setOption(option);
  };
  scrollInto = (value) => {
    const dom = document.getElementById(value);
    dom.scrollIntoView({ behavior: "smooth", block: "center" });
    this.setState({
      tabValue: value,
    });
  };
  render() {
    const { clickSemesterName, semester, tabValue, subjectId, semesterList } =
      this.state;
    const { tableData, allSubjectList, mobileData } = this.props;
    console.log(mobileData, ",,");
    const inner = window.innerWidth - 20;
    const firstSemesterType = 1;
    const secondSemesterType = 2;
    const endTermExamType = 7;
    const menu = (
      <Menu onClick={this.clickMenu}>
        {mobileData && mobileData.length > 0
          ? mobileData.map((item) => (
              <Menu.Item key={item.semesterId}>
                {item.gradeSemesterName}
              </Menu.Item>
            ))
          : null}
      </Menu>
    );
    let columns0 = [
      {
        title: trans("global.subject", "学科"),
        dataIndex: "subjectName",
        fixed: "left",
        align: "center",
        // className:'topConor',
        render: (text) => <div>{text}</div>,
        width: 80,
        // children: [
        //   {
        //     title: '学科',
        //     className: 'bottomConor',
        //     width: 110,
        //     align: "left",
        //     dataIndex: 'subjectName',
        //     fixed: "left",

        //   }
        // ]
      },
    ];
    if (tableData.gradeList && tableData.gradeList.length > 0) {
      tableData.gradeList.map((item, ind) => {
        columns0.push({
          title: item.gradeName,
          dataIndex: `${item.gradeId}`,
          key: `${item.gradeId}`,
          // fixed: item.index == 0 ? "left" : null,
          width: 112,
          className: "firstTh",
          align: "center",
          children: [
            {
              title: trans("studentPageMobile.firstTermShort", "上"),
              dataIndex: `${item.gradeId}${ind}${firstSemesterType}${endTermExamType}Score`,
              key: `${item.gradeId}${ind}${firstSemesterType}${endTermExamType}Score`,
              width: 56,
              align: "center",
              className: "noRightTd",
              render: (text, record, index) => {
                // console.log(text, record, index, "222");
                // let txt = text.substring(0, text.length - 1);
                return (
                  <div style={{}}>
                    {text ? (
                      <div>{text}</div>
                    ) : (
                      <div className={text ? "" : icon.iconfont}>&#xe893;</div>
                    )}
                  </div>
                );
              },
            },
            {
              title: trans("studentPageMobile.secondTermShort", "下"),
              dataIndex: `${item.gradeId}${ind}${secondSemesterType}${endTermExamType}Score`,
              key: `${item.gradeId}${ind}${secondSemesterType}${endTermExamType}Score`,
              width: 56,
              align: "center",
              render: (text, record, index) => {
                // console.log(text, record, index, "222");
                // let txt = text.substring(0, text.length - 1);
                return (
                  <div style={{}}>
                    {text ? (
                      <div>{text}</div>
                    ) : (
                      <div className={text ? "" : icon.iconfont}>&#xe893;</div>
                    )}
                  </div>
                );
              },
            },
          ],
        });
      });
    }
    columns0.push({
      title: "",
    });
    let data = [];

    if (
      tableData.overallStudentScoreModelList &&
      tableData.overallStudentScoreModelList.length > 0 &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList
        .length > 0 &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0]
        .examTypeModelList &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0]
        .examTypeModelList.length > 0 &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0]
        .examTypeModelList[0].subjectList &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0]
        .examTypeModelList[0].subjectList.length > 0
    ) {
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0].examTypeModelList[0].subjectList.map(
        (item) => {
          data.push({
            subjectName: item.subjectName,
          });
        },
      );
    }
    let newLi = [];
    if (
      tableData.overallStudentScoreModelList &&
      tableData.overallStudentScoreModelList.length > 0
    ) {
      newLi = JSON.parse(
        JSON.stringify(tableData.overallStudentScoreModelList),
      );
    }
    if (data.length > 0) {
      data.map((item) => {
        if (
          tableData.overallStudentScoreModelList &&
          tableData.overallStudentScoreModelList.length > 0
        ) {
          tableData.overallStudentScoreModelList.map((ite, inde) => {
            if (
              ite.semesterSubjectModelList &&
              ite.semesterSubjectModelList.length > 0
            ) {
              ite.semesterSubjectModelList.map((it) => {
                if (it.examTypeModelList && it.examTypeModelList.length > 0) {
                  it.examTypeModelList.map((tt) => {
                    if (tt.subjectList && tt.subjectList.length > 0) {
                      tt.subjectList.map((t) => {
                        if (t.subjectName === item.subjectName) {
                          item[
                            `${ite.gradeId}${inde}${it.semesterType}${tt.examTypeCode}Score`
                          ] = t.score;
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    return (
      <div className={styles.stuMobile}>
        <div className={styles.mobileHeader}>
          <div
            className={[
              styles.headerTab,
              tabValue === "subject" ? styles.checkTab : "",
            ].join(" ")}
            onClick={this.scrollInto.bind(this, "subject")}
          >
            {trans("studentPageMobile.subjectComparison", "学科对比")}
          </div>
          <div
            className={[
              styles.headerTab,
              tabValue === "year" ? styles.checkTab : "",
            ].join(" ")}
            onClick={this.scrollInto.bind(this, "year")}
          >
            {trans("studentPageMobile.yearComparison", "历年对比")}
          </div>
          <div
            className={[
              styles.headerTab,
              tabValue === "score" ? styles.checkTab : "",
            ].join(" ")}
            onClick={this.scrollInto.bind(this, "score")}
          >
            {trans("studentPageMobile.scoreTrend", "成绩走势")}
          </div>
          {/* <div className={[styles.headerTab].join(' ')}>拓展课程</div> */}
        </div>
        <div className={styles.mobileDomList}>
          <div className={styles.mobileDom} id="subject">
            <div className={styles.domTitleBetween}>
              <div>
                <span className={styles.titleBar}></span>
                <span className={styles.titleSpan}>
                  {trans("studentPageMobile.subjectComparison", "学科对比")}
                </span>
              </div>
              <Dropdown overlay={menu} trigger="click">
                <div>
                  {clickSemesterName}
                  <Icon type="down" />
                </div>
              </Dropdown>
            </div>
            <div className={[styles.mobileHeader, styles.domTabList].join(" ")}>
              {semesterList && semesterList.length > 0
                ? semesterList.map((item) => (
                    <div
                      className={[
                        styles.headerTab,
                        semester == item.examTypeCode ? styles.checkTab : "",
                      ].join(" ")}
                      onClick={this.checkSemester.bind(this, item.examTypeCode)}
                    >
                      {item.examTypeName}
                    </div>
                  ))
                : null}
            </div>
            <div className={styles.subjectRadar} id="subjectRadar"></div>
          </div>
          <div className={styles.mobileDom} id="year">
            <div className={styles.domTitleBetween}>
              <div>
                <span className={styles.titleBar}></span>
                <span className={styles.titleSpan}>
                  {trans("studentPageMobile.yearComparison", "历年对比")}
                </span>
              </div>
            </div>
            <Table
              columns={columns0}
              dataSource={data}
              bordered
              scroll={{ x: inner, y: true }}
              pagination={false}
              // title={() => <div className={styles.tableTitle}>{trans('global.tableTitle', '（此处的分数是指每学期的期末成绩）')}</div>}
            />
          </div>
          <div className={styles.mobileDom} id="score">
            <div className={styles.domTitleBetween}>
              <div>
                <span className={styles.titleBar}></span>
                <span className={styles.titleSpan}>
                  {trans("studentPageMobile.scoreTrend", "成绩走势")}
                </span>
              </div>
            </div>
            <div className={[styles.mobileHeader, styles.domTabList].join(" ")}>
              {allSubjectList && allSubjectList.length > 0
                ? allSubjectList.map((item) => (
                    <div
                      className={[
                        styles.headerTab,
                        subjectId === item.id ? styles.checkTab : "",
                      ].join(" ")}
                      onClick={this.changeSubject.bind(this, item.id)}
                    >
                      {item.name}
                    </div>
                  ))
                : null}
            </div>
            <div className={styles.scoreLine} id="scoreLine"></div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ home, studentLearning, global }) => ({
  tableData: home.tableData,
  allSubjectList: studentLearning.allSubjectList,
  newTrendList: home.newTrendList,
  mobileData: home.mobileData,
}))(StudentHomepage);

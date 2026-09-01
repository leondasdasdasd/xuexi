import React, { PureComponent } from "react";
import {
  Dropdown,
  Input,
  Menu,
  Modal,
  Popover,
  Select,
  Switch,
  Tabs,
} from "antd";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";

import { locale, trans } from "../../utils/i18n";
const { TabPane } = Tabs;
import { Chart, Coord, G2, Geom, Guide, Legend } from "bizcharts";
import pathToRegexp from "path-to-regexp";

import AnalysisByClass from "components/AnalysisByClass/index";
import AnalysisByKnowLedge from "components/AnalysisByKnowLedge/index";
import AnalysisByQuestion from "components/AnalysisByQuestion/index";
import AnalysisByStudent from "components/AnalysisByStudent/index";

import DetailView from "../../components/DetailView/index";
import { setupWKWebViewJavascriptBridge } from "../../utils/utils";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

const { Search } = Input;
const { Text } = Guide;
const { Option } = Select;
const sliceNumber = 0.01;
let sortList = {
  1: "STUDENT_NO",
  2: "STUDENT_NAME",
  3: "STUDENT_E_NAME",
  4: "SCORE",
  5: "SCORE",
};
class StuTest extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp(
      "/testAnalysis/:testId/:active/:paperId/:isEdit/:hash?",
    ).exec(this.url);
    this.testId = JSON.parse(this.pathMatch[1]);
    this.active = Number.parseInt(this.pathMatch[2], 10);
    this.paperId = JSON.parse(this.pathMatch[3]);
    this.isEdit = JSON.parse(this.pathMatch[4]);
    this.hash = this.pathMatch[5]
      ? this.pathMatch[5].replaceAll(":", "/")
      : null;
    this.state = {
      testName: "",
      deleteList: [],
      detaiList: [],
      viewData: {},
      ifEdit: true,
      active: this.active || 1,
      checkQuestionId: null,
      groupName: trans("analysis.allClass", "全部班级"),
      studentName: undefined,
      loadingTable: false,
      viewModal: false,
      viewList: [],
      selectImg: null,
      isChecked: false,
      groupId: 0,
    };
    this.child = null;
  }
  componentDidMount() {
    if (this.active === 1) {
      this.props.dispatch({
        type: "home/getTestView",
        payload: {
          paperId: this.paperId,
        },
      });
    } else if (this.active === 2) {
      this.props.dispatch({
        type: "home/getAnalysis",
        payload: {
          examId: this.testId,
        },
      });
      this.getData(1, 10);
      this.getClassList();
    } else {
      this.props.dispatch({
        type: "home/getAnalysis",
        payload: {
          examId: this.testId,
        },
      });
      this.props.dispatch({
        type: "inputQuestion/getAllGradeList",
      });
      this.getClassList();
    }
  }

  //查看统计分析
  getData = (pageNumber, pageSize) => {
    const { tabKey } = this.props;
    this.setState({
      loadingTable: true,
    });
    if (tabKey === "1") {
      //按班级查看
      this.props
        .dispatch({
          type: "home/getScoreAnalysis",
          payload: {
            examId: this.testId,
            pageNum: pageNumber,
            pageSize: pageSize,
          },
        })
        .then(() => {
          this.setState({
            loadingTable: false,
          });
        });
    } else if (tabKey === "2") {
      //按学生查看
      this.props
        .dispatch({
          type: "home/getStuAnalysis",
          payload: {
            examId: this.testId,
            pageNum: pageNumber,
            pageSize: pageSize,
            keyName: this.state.studentName || "",
            keyGroupId: this.state.groupId,
          },
        })
        .then(() => {
          this.analysisByStudent.resetPageSize(pageNumber, pageSize);
          this.setState({
            loadingTable: false,
          });
        });
    } else if (tabKey == "3") {
      //按试题查看
      this.props
        .dispatch({
          type: "home/getQuestionAnalysis",
          payload: {
            examId: this.testId,
            pageNum: pageNumber,
            pageSize: pageSize,
          },
        })
        .then(() => {
          this.setState({
            loadingTable: false,
          });
        });
    } else if (tabKey == "4") {
      //按试题查看
      this.props
        .dispatch({
          type: "home/getKnowLedgeAnalysis",
          payload: {
            examId: this.testId,
            // pageNum: pageNum,
            // pageSize: pageSize
          },
        })
        .then(() => {
          this.setState({
            loadingTable: false,
          });
        });
    }
    //  else {
    //   this.props.dispatch({
    //     type: 'home/questionAnalysis',
    //     payload: {
    //       examPaperId: this.testId,
    //     }
    //    })
    //  }
  };
  scrollView = (id) => {
    const ele = document.getElementById(`question${id}`);
    ele.scrollIntoView({ behavior: "smooth", block: "center" });
    this.setState({
      checkQuestionId: id,
    });
  };

  //获取班级列表
  getClassList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "home/getClassList",
      payload: {
        examId: this.testId,
      },
    });
  };

  //切换按班级&按学生查看统计分析
  changeTab = (key) => {
    this.props
      .dispatch({
        type: "home/changeTabKey",
        payload: key,
      })
      .then(() => {
        window.sessionStorage.removeItem("analysisNav");
        window.sessionStorage.setItem("analysisNav", key);
        this.getData(1, 10);

        this.setState({
          studentName: undefined,
        });
      });
  };

  view = (index) => {
    this.setState({
      active: index,
    });
    if (this.hash) {
      let hash = this.hash.replaceAll("/", ":");
      this.props.dispatch(
        routerRedux.push(
          `/testAnalysis/${this.testId}/${index}/${this.paperId}/${this.isEdit}/${hash}`,
        ),
      );
    } else {
      this.props.dispatch(
        routerRedux.push(
          `/testAnalysis/${this.testId}/${index}/${this.paperId}/${this.isEdit}`,
        ),
      );
    }
    if (index === 1) {
      this.props.dispatch({
        type: "home/getTestView",
        payload: {
          paperId: this.paperId,
        },
      });
    } else {
      this.props.dispatch({
        type: "home/getAnalysis",
        payload: {
          examId: this.testId,
        },
      });
      this.getData(1, 10);
      this.getClassList();
    }
  };

  computedTotal = (data) => {
    let total = 0;
    data.map((item, index) => {
      if (index != 0) {
        total += item.value;
      }
    });
    return total;
  };

  renderChart = () => {
    const { analysisDetail } = this.props;
    const dataList = [
      { type: trans("global.pushed", "已推送"), value: 0 },
      {
        type: trans("global.completed", "已完成"),
        value: analysisDetail.submitNumber,
      },
      {
        type: trans("global.notComplete", "未完成"),
        value: analysisDetail.unSubmitNumber,
      },
    ];
    const colorList = ["rgb(103,178,81,0.7)", "#67B251", "rgb(103,178,81,0.2)"];
    const label = <div>111</div>;
    G2.Shape.registerShape("interval", "sliceShape", {
      draw(cfg, container) {
        const points = cfg.points;
        let path = [];
        path.push(
          ["M", points[0].x, points[0].y],
          ["L", points[1].x, points[1].y - sliceNumber],
          ["L", points[2].x, points[2].y - sliceNumber],
          ["L", points[3].x, points[3].y],
          "Z",
        );
        path = this.parsePath(path);
        return container.addShape("path", {
          attrs: {
            fill: cfg.color,
            path: path,
          },
        });
      },
    });

    return (
      <Chart
        height={100}
        width={100}
        data={dataList}
        forceFit
        padding={{ top: 1, right: 10, bottom: 1, left: -90 }}
      >
        <Coord type="theta" innerRadius={0.9} />
        <Legend
          position="right"
          offsetY={-8}
          offsetX={-90}
          clickable={false}
          itemFormatter={(value) => {
            let name = "",
              total = 0;
            dataList.map((item, index) => {
              if (index == 0) {
                name = this.computedTotal(dataList);
              } else {
                if (item.type === value) {
                  name = item.value;
                }
              }
            });
            return value + ":" + name; // val 为每个图例项的文本值
          }}
        />
        <Geom
          type="intervalStack"
          position="value"
          color={["type", colorList]}
          shape="sliceShape"
        >
          {/*<Label content={["type*value", (type, value)=>{*/}
          {/*return `${value}:${type}`;*/}
          {/*}]}*/}
          {/*textStyle={{*/}
          {/*textAlign: 'middle', // 文本对齐方向，可取值为： start middle end*/}
          {/*fill: '#404040', // 文本的颜色*/}
          {/*}}*/}
          {/*/>*/}
        </Geom>
        <Guide>
          <Text
            top={true} // 指定 guide 是否绘制在 canvas 最上层，默认为 false, 即绘制在最下层
            content={this.formatterRate(analysisDetail)} // 显示的文本内容
            position={["45%", "45%"]}
            style={{
              fill: "#666", // 文本颜色
              fontSize: "12", // 文本大小
              fontWeight: "bold", // 文本粗细
            }} // 文本的图形样式属性
          />
          <Text
            top={true} // 指定 guide 是否绘制在 canvas 最上层，默认为 false, 即绘制在最下层
            content={trans("global.completeRating", "完成率")} // 显示的文本内容
            position={locale() == "en" ? ["40%", "60%"] : ["45%", "60%"]}
            style={{
              fill: "#666", // 文本颜色
              fontSize: "12", // 文本大小
              fontWeight: "bold", // 文本粗细
            }} // 文本的图形样式属性
          />
        </Guide>
      </Chart>
    );
  };

  formatterRate = (analysisData) => {
    let submitNumber = analysisData.submitNumber || 0,
      pushNumber = analysisData.pushNumber || 0,
      rate = (submitNumber / pushNumber) * 100;
    return pushNumber ? rate.toFixed(2) + "%" : "0%";
  };

  checkQuestion = (id) => {
    this.setState({
      checkQuestionId: id,
    });
  };
  renderNumber = (id) => {
    const detaiList = this.props.analysisDetail.moduleList;
    let newList = [];
    let count = 0;
    if (detaiList && detaiList.length > 0) {
      detaiList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            newList.push(it);
          });
        }
      });
    }
    if (newList.length > 0) {
      newList.map((item, index) => {
        if (id === item.questionId) {
          count = index + 1;
        }
      });
    }
    return count;
  };
  back = () => {
    const that = this;
    window.close();
    this.props.dispatch({
      type: "home/clearView",
    });
    if (window.yg) {
      setupWKWebViewJavascriptBridge(function (bridge) {
        bridge.callHandler("backAction", {
          path: that.props.history.location.pathName,
        });
      });
    } else {
      window.location.href = this.hash
        ? `${window.location.origin}/#/${this.hash}`
        : `${window.location.origin}${window.location.pathname}#/examAnalysis`;
    }
  };

  //筛选班级
  filterClass = (item, key) => {
    const { classListData } = this.props;
    let groupName = trans("analysis.allClass", "全部班级"),
      groupId = "";
    for (const classListDatum of classListData) {
      if (classListDatum["groupId"] == item.key) {
        groupName =
          locale() == "en"
            ? classListDatum["groupEName"]
            : classListDatum.groupName;
        groupId = classListDatum["groupId"];
        break;
      }
    }
    this.setState(
      {
        groupName,
        groupId: groupId,
      },
      () => {
        this.getData(1, 10);
      },
    );
  };
  changeCheck = (checked) => {
    this.setState({
      isChecked: checked,
    });
  };
  setViewList = (list) => {
    this.setState({
      viewList: list,
    });
  };
  selectImg = (source) => {
    this.setState({
      selectImg: source,
    });
  };
  changeSelect = () => {
    this.setState({
      selectImg: null,
    });
  };
  fillStudentName = (e) => {
    this.setState({
      studentName: e.target.value,
    });
  };
  //选择学生
  selectStudent = (value) => {
    this.getData(1, 10);
  };

  onRef = (reference) => {
    this.analysisByStudent = reference;
  };
  changeViewModal = () => {
    void !(function () {
      var d = document,
        b =
          d.fullscreen ||
          d.mozFullScreen ||
          d.webkitIsFullScreen ||
          d.msFullscreenElement,
        de = d.documentElement,
        f =
          de.requestFullscreen ||
          de.mozRequestFullScreen ||
          de.webkitRequestFullscreen ||
          de.msRequestFullscreen,
        e =
          d.exitFullscreen ||
          d.mozCancelFullScreen ||
          d.webkitCancelFullScreen ||
          d.msExitFullscreen;
      b ? e && e.call(d) : f && f.call(de);
    })();
    this.setState({
      viewModal: !this.state.viewModal,
    });
  };

  render() {
    const { analysisDetail, tabKey, classListData } = this.props;
    const { checkQuestionId, groupName } = this.state;
    let classMenu = (
      <Menu onClick={this.filterClass}>
        <Menu.Item key="">
          <span>{trans("analysis.allClass", "全部班级")}</span>
        </Menu.Item>
        {classListData &&
          classListData.length > 0 &&
          classListData.map((item) => (
            <Menu.Item key={item.groupId}>
              <span>{locale() == "en" ? item.groupEName : item.groupName}</span>
            </Menu.Item>
          ))}
      </Menu>
    );

    return (
      <div className={styles.analysis}>
        <div className={styles.header}>
          <i className={styles.iconfont} onClick={this.back}>
            &#xe6ff;
          </i>
          <div className={styles.headerContent}>
            {analysisDetail && analysisDetail.title ? (
              <div>
                <div className={styles.headerTitle}>{analysisDetail.title}</div>
                <div>
                  <span className={styles.detailSpan}>
                    <i className={styles.iconfont}>&#xe624;</i>
                    {analysisDetail.paperTypeName}
                  </span>
                  <span className={styles.detailSpan}>
                    <i className={styles.iconfont}>&#xe634;</i>
                    {trans("global.manfen", "满分 ")}
                    {analysisDetail.totalScore}
                  </span>
                  <span className={styles.detailSpan}>
                    <i className={styles.iconfont}>&#xe798;</i>
                    {analysisDetail.gradeNmae}-{analysisDetail.subjectName}
                  </span>
                  <span className={styles.detailSpan}>
                    <i className={styles.iconfont}>&#xe61f;</i>
                    {analysisDetail.year}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
          <div className={styles.tabBar}>
            <span
              onClick={this.view.bind(this, 1)}
              className={this.state.active === 1 ? styles.activeBar : null}
            >
              {trans("detail.viewTitle", "测验预览")}
            </span>
            <span
              onClick={this.view.bind(this, 2)}
              className={this.state.active === 2 ? styles.activeBar : null}
            >
              {trans("global.statistics", "数据统计")}
            </span>
            {/* <span
              onClick={this.view.bind(this, 3)}
              className={this.state.active === 3 ? styles.activeBar : null}
            >
              个性化试题
            </span> */}
            {/* {
              this.isEdit ? 
              null : 
              <span onClick={this.view.bind(this, 2)} className={this.state.active === 2 ? styles.activeBar : null}>{trans('global.statistics', '数据统计')}</span>
            } */}
          </div>
        </div>
        {analysisDetail && analysisDetail.title ? (
          this.state.active === 1 ? (
            analysisDetail &&
            analysisDetail.moduleList &&
            analysisDetail.moduleList.length > 0 ? (
              <div className={styles.analysisContent}>
                <div className={styles.contentLeft}>
                  <div className={styles.testList}>
                    <div className={styles.testName}>
                      <div className={styles.testNameRight}>
                        <h2>{analysisDetail.title}</h2>
                      </div>
                      <div className={styles.testNameSwitch}>
                        <span className={styles.switchTitle}>
                          {trans("global.showAnswers", "显示答案")}
                        </span>
                        <Switch
                          checked={this.state.isChecked}
                          onChange={this.changeCheck}
                        />
                      </div>
                    </div>
                    <DetailView
                      detailList={analysisDetail.moduleList}
                      ifEdit={false}
                      dropQuestionChange={this.dropQuestionChange}
                      ifTeacherView={true}
                      isChecked={this.state.isChecked}
                      checkQuestionId={checkQuestionId}
                      checkQuestion={this.checkQuestion}
                    />
                  </div>
                </div>
                <div className={styles.contentRight}>
                  <div className={styles.contentRightOption}>
                    <div className={styles.optionTitleBox}>
                      <div className={styles.optionTitleLeft}>
                        {trans("detail.questionList", "题目列表")}
                      </div>
                    </div>
                    {analysisDetail &&
                    analysisDetail.moduleList &&
                    analysisDetail.moduleList.length > 0
                      ? analysisDetail.moduleList.map((item, index) => (
                          <div className={styles.moveList} key={index}>
                            <div className={styles.moveListTitle}>
                              <div>
                                <span className={styles.contentVisible}>
                                  {item.moduleName}
                                </span>
                                ({item.moduleScore || 0}
                                {trans("global.point", "分")})
                              </div>
                              {this.props.testStatus ? (
                                <div className={styles.modultScore}>
                                  <i className={styles.iconfont}>&#xe634;</i>
                                  <span className={styles.score}>
                                    {item.moduleScore}
                                  </span>
                                  {trans("global.point", "分")}
                                </div>
                              ) : null}
                            </div>
                            <div className={styles.moveListContent}>
                              {item.questionList && item.questionList.length > 0
                                ? item.questionList.map((it, ind) => (
                                    <div
                                      className={styles.optionBox}
                                      style={
                                        checkQuestionId &&
                                        checkQuestionId === it.questionId
                                          ? {
                                              border:
                                                "1px solid rgba(2,88,191,1)",
                                            }
                                          : it.studentAnswer &&
                                              it.studentAnswer !== ""
                                            ? {
                                                border:
                                                  "1px solid rgba(59,111,245,0.36)",
                                              }
                                            : null
                                      }
                                      onClick={this.scrollView.bind(
                                        this,
                                        it.questionId,
                                      )}
                                      key={ind}
                                    >
                                      {this.renderNumber(it.questionId)}
                                    </div>
                                  ))
                                : null}
                            </div>
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              </div>
            ) : null
          ) : this.state.active === 2 ? (
            <div className={styles.analysisMain}>
              <div className={styles.detail}>
                <div className={styles.detailContent}>
                  <div className={styles.chart}>{this.renderChart()}</div>
                  <div
                    className={styles.contentList}
                    style={{ width: "120px" }}
                  >
                    <div>
                      {trans("global.passRating", "及格率")}
                      <Popover
                        placement="bottom"
                        title={null}
                        content={
                          <div className={styles.contentListMessage}>
                            {trans(
                              "global.passMessage",
                              "及格率=及格人数/总人数",
                            )}
                          </div>
                        }
                      >
                        <i className={icon.iconfont}>&#xe762;</i>
                      </Popover>
                    </div>
                    <div className={styles.passNumber}>
                      {analysisDetail.passingRate == undefined
                        ? "--"
                        : analysisDetail.passingRate}
                    </div>
                  </div>
                  <div
                    className={styles.contentList}
                    style={{ width: "300px" }}
                  >
                    <div>
                      {trans("global.avgScore", "平均分")}
                      <Popover
                        placement="bottom"
                        title={null}
                        content={
                          <div className={styles.contentListMessage}>
                            {trans(
                              "global.avgMessage",
                              "平均分=已完成学生的总成绩之和/已完成人数",
                            )}
                          </div>
                        }
                      >
                        <i className={icon.iconfont}>&#xe762;</i>
                      </Popover>
                    </div>
                    <div className={styles.number}>
                      {analysisDetail.avgScore == undefined
                        ? "--"
                        : analysisDetail.avgScore}
                    </div>
                  </div>
                  <div className={styles.contentList} style={{ width: "90px" }}>
                    <div>{trans("global.fullScoreNumber", "满分人数")}</div>
                    <div className={styles.numbers}>
                      {analysisDetail.fullScoreNumber == undefined
                        ? "--"
                        : analysisDetail.fullScoreNumber}
                    </div>
                  </div>
                  <div className={styles.contentList} style={{ width: "90px" }}>
                    <div>{trans("global.maxScore", "最高分")}</div>
                    <div className={styles.numbers}>
                      {analysisDetail.maxScore == undefined
                        ? "--"
                        : analysisDetail.maxScore}
                    </div>
                  </div>
                  <div className={styles.contentList} style={{ width: "90px" }}>
                    <div>{trans("global.minScore", "最低分")}</div>
                    <div className={styles.numbers}>
                      {analysisDetail.minScore == undefined
                        ? "--"
                        : analysisDetail.minScore}
                    </div>
                  </div>
                  <div
                    className={styles.contentList}
                    style={{ minWidth: "90px" }}
                  >
                    <div>{trans("global.middleNumber", "中位数")}</div>
                    <div className={styles.numbers}>
                      {analysisDetail.medianScore == undefined
                        ? "--"
                        : analysisDetail.medianScore}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.filterArea}>
                <div className={styles.filterTab}>
                  <span
                    className={
                      tabKey == 1 ? styles.leftActiveTab : styles.leftTab
                    }
                    onClick={() => this.changeTab("1")}
                  >
                    {trans("analysis.viewByClass", "按班级看")}
                  </span>
                  <span
                    className={[
                      tabKey == 2 ? styles.middleActiveTab : styles.middleTab,
                      styles.middleFirst,
                    ].join(" ")}
                    onClick={() => this.changeTab("2")}
                  >
                    {trans("analysis.viewByStudent", "按学生看")}
                  </span>
                  <span
                    className={
                      tabKey == 3 ? styles.middleActiveTab : styles.middleTab
                    }
                    onClick={() => this.changeTab("3")}
                  >
                    {trans("analysis.viewByQuestion", "按试题看")}
                  </span>
                  <span
                    className={
                      tabKey == 4 ? styles.rightActiveTab : styles.rightTab
                    }
                    onClick={() => this.changeTab("4")}
                  >
                    {trans("analysis.knowledgeAnalysis", "知识点分析")}
                  </span>
                </div>
                {/* {tabKey == 2 ? (
                  <div className={styles.viewTo} onClick={this.changeViewModal}>
                    {trans("global.testToView", "试卷投屏")}
                  </div>
                ) : null} */}
                <Modal
                  title={""}
                  footer={null}
                  getContainer={false}
                  // centered={true}
                  visible={this.state.viewModal}
                  closable={false}
                  maskClosable={false}
                  destroyOnClose={true}
                  // onCancel={this.publishCancel}
                  width="100%"
                  height="100%"
                  className={styles.viewToModal}
                >
                  <div className={styles.teamModal}>
                    <i
                      className={[styles.iconfont, styles.closeIcon].join(" ")}
                      onClick={this.changeViewModal}
                    >
                      &#xe6e2;
                    </i>
                    <div className={styles.viewBox}>
                      {this.state.selectImg ? (
                        <div className={styles.viewSelectImg}>
                          <i
                            className={[styles.iconfont, styles.closeIcon].join(
                              " ",
                            )}
                            onClick={this.changeSelect}
                          >
                            &#xe6e2;
                          </i>
                          <img src={this.state.selectImg} />
                        </div>
                      ) : this.state.viewList &&
                        this.state.viewList.length > 0 ? (
                        this.state.viewList.map((item, index) => (
                          <div className={styles.imgBox}>
                            <img
                              src={item}
                              onClick={this.selectImg.bind(this, item)}
                            />
                          </div>
                        ))
                      ) : (
                        <div className={styles.noView}>
                          {trans(
                            "global.pictureOfTestSheet",
                            "在数据统计-按学生看表格中，加入一张学生上传的测验单图片",
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Modal>
                {(tabKey == 3 &&
                  this.props.questionAnalysisData.data &&
                  this.props.questionAnalysisData.data.length > 0) ||
                (tabKey == 2 &&
                  this.props.stuData.studentQuestionResponses &&
                  this.props.stuData.studentQuestionResponses.data &&
                  this.props.stuData.studentQuestionResponses.data.length >
                    0) ||
                (tabKey == 1 &&
                  this.props.scoreData.data &&
                  this.props.scoreData.data.length > 0) ||
                (tabKey == 4 &&
                  this.props.knwoLedgeAnalysisList &&
                  this.props.knwoLedgeAnalysisList.length > 0) ? (
                  <Link
                    to={`/viewChart/${this.testId}`}
                    className={styles.viewStatus}
                  >
                    {trans("global.viewRealTimeData", "查看实时数据")}
                  </Link>
                ) : null}
                {tabKey == 2 && (
                  <div className={styles.filterSelect}>
                    <Dropdown overlay={classMenu} trigger={["click"]}>
                      <span className={styles.selectName}>
                        {groupName} <i className={icon.iconfont}>&#xe659;</i>
                      </span>
                    </Dropdown>
                  </div>
                )}
                {tabKey == 2 && (
                  <Search
                    placeholder={trans(
                      "testAnalysis.searchStudent",
                      "输入关键字搜索学生",
                    )}
                    onChange={(value) => this.fillStudentName(value)}
                    onSearch={(value) => this.selectStudent(value)}
                    style={{ width: 224 }}
                    className={styles.inputSearch}
                    value={this.state.studentName}
                  />
                )}
              </div>
              <div className={styles.tableMain}>
                {tabKey == "1" && (
                  <AnalysisByClass
                    {...this.props}
                    getData={(pageNumber, pageSize) =>
                      this.getData(pageNumber, pageSize)
                    }
                    examPaperId={this.testId}
                    examId={this.testId}
                    loadingTable={this.state.loadingTable}
                  />
                )}
                {tabKey == "2" && (
                  <AnalysisByStudent
                    onRef={this.onRef}
                    {...this.props}
                    setViewList={this.setViewList}
                    getData={(pageNumber, pageSize) =>
                      this.getData(pageNumber, pageSize)
                    }
                    examPaperId={this.testId}
                    loadingTable={this.state.loadingTable}
                    groupId={this.state.groupId}
                    studentName={this.state.studentName}
                    examId={this.testId}
                  />
                )}
                {tabKey == "3" && (
                  <AnalysisByQuestion
                    {...this.props}
                    getData={(pageNumber, pageSize) =>
                      this.getData(pageNumber, pageSize)
                    }
                    loadingTable={this.state.loadingTable}
                    examPaperId={this.testId}
                    examId={this.testId}
                  />
                )}
                {tabKey == "4" && (
                  <AnalysisByKnowLedge
                    {...this.props}
                    getData={(pageNumber, pageSize) =>
                      this.getData(pageNumber, pageSize)
                    }
                    loadingTable={this.state.loadingTable}
                    examPaperId={this.testId}
                    examId={this.testId}
                  />
                )}
              </div>
            </div>
          ) : null
        ) : null}
      </div>
    );
  }
}

export default connect(({ home, studyPictures, inputQuestion }) => ({
  analysisDetail: home.viewData,
  tabKey: home.tabKey,
  scoreData: home.scoreData,
  stuData: home.stuData,
  questionData: home.questionData,
  classListData: home.classListData,
  questionAnalysisData: home.questionAnalysisData,
  knwoLedgeAnalysisList: home.knwoLedgeAnalysisList,
}))(StuTest);

import React, { PureComponent } from "react";
import { Dropdown, Input, Menu, Modal } from "antd";
import { Chart, Coord, G2, Geom, Guide, Legend } from "bizcharts";
import { connect } from "dva";
import { Link } from "dva/router";

import AnalysisByClass from "components/AnalysisByClass/index";
import AnalysisByQuestion from "components/AnalysisByQuestion/index";
import AnalysisByStudent from "components/AnalysisByStudent/index";

import { buildAnalysisMarkingPath } from "../../common/explicitExamRoutes";
import { locale, trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

const { Search } = Input;
const { Text } = Guide;
const sliceNumber = 0.01;
export class StuTest extends PureComponent {
  constructor(properties) {
    super(properties);
    // this.url = this.props.history.location.pathname;
    // this.pathMatch = pathToRegexp(
    //   "/testAnalysis/:testId/:active/:isEdit/:hash?"
    // ).exec(this.url);
    // this.testId = JSON.parse(this.pathMatch[1]);
    // this.active = parseInt(this.pathMatch[2], 10);
    // this.isEdit = JSON.parse(this.pathMatch[3]);
    // this.hash = this.pathMatch[4] ? this.pathMatch[4].replace(/:/g, "/") : null;
    this.state = {
      active: this.props.active || 1,
      groupName: trans("analysis.allClass", "全部班级"),
      studentName: undefined,
      groupId: "",
      loadingTable: false,
      viewModal: false,
      viewList: [],
      selectImg: null,
    };
    this.child = null;
    this.pageNum = 1;
    this.pageSize = 25;
  }
  componentDidMount() {
    this.props.onTestRef(this);
    console.log(this.props.active, "111");
    if (this.props.active === 4) {
      // this.props.dispatch({
      //   type: "home/getAnalysis",
      //   payload: {
      //     examPaperId: this.props.paperId,
      //   },
      // });
      this.getData(1, 25);
      this.getClassList();
    } else {
      this.getData(1, 10);
      this.getClassList();
    }
  }

  //查看统计分析
  getData = (pageNumber, pageSize) => {
    const { tabKey } = this.props;
    this.setState({
      loadingTable: true,
    });
    this.pageNum = pageNumber;
    this.pageSize = pageSize;
    console.log(this.props.active, "<<<");
    if (this.props.active === 2) {
      //按班级查看
      this.props
        .dispatch({
          type: "home/getScoreAnalysis",
          payload: {
            examId: this.props.examId,
            pageNum: pageNumber,
            pageSize: pageSize,
          },
        })
        .then(() => {
          this.setState({
            loadingTable: false,
          });
        });
    } else if (this.props.active === 4) {
      //按学生查看
      this.props
        .dispatch({
          type: "home/getStuAnalysis",
          payload: {
            examId: this.props.examId,
            pageNum: pageNumber,
            pageSize: pageSize == 10 ? 25 : pageSize,
            keyName: this.state.studentName || "",
            keyGroupId: this.state.groupId,
          },
        })
        .then(() => {
          this.analysisByStudent?.resetPageSize(pageNumber, this.pageSize);
          this.setState({
            loadingTable: false,
          });
        });
    } else if (this.props.active == 3) {
      //按试题查看
      this.props
        .dispatch({
          type: "home/getQuestionAnalysis",
          payload: {
            examId: this.props.examId,
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
            examId: this.props.examId,
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

  clickExportData = () => {
    // this.props.dispatch({
    //   type: "home/getStuQuestionAnalysisExport",
    //   payload: {
    //     examId: this.props.examId,
    //     pageNum: 1,
    //     pageSize: 25,
    //     keyName: this.state.studentName || "",
    //     keyGroupId: this.state.groupId,
    //   },
    // });
    let url = `${
      window.location.origin
    }/api/analysis/stuQuestionAnalysis/export?examId=${
      this.props.examId
    }&pageNum=1&pageSize=25&keyName=${
      this.state.studentName || ""
    }&keyGroupId=${this.state.groupId}`;
    window.open(url);
  };
  //获取班级列表
  getClassList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "home/getClassList",
      payload: {
        examId: this.props.examId,
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

  view = () => {
    console.log(">>>");
    this.getData(1, 10);
    this.getClassList();
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
        this.getData(1, 25);
      },
    );
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
    this.getData(1, 25);
  };

  onRef = (reference) => {
    this.analysisByStudent = reference;
  };
  closeViewModal = () => {
    this.setState({
      viewModal: false,
    });
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

  goToCorrectionRemark = () => {
    const path = buildAnalysisMarkingPath(
      this.props.contractVersion,
      this.props.examId,
      this.props.paperId,
    );
    window.open(`${window.location.origin}/exam#${path}`);
  };

  render() {
    const {
      analysisDetail,
      classListData,
      active,
      questionAnalysisData,
      stuData,
      scoreData,
    } = this.props;
    const { groupName } = this.state;
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
    const hasQuestionAnalysis =
      active === 3 && questionAnalysisData?.data?.length > 0;
    const hasStudentResponses =
      active === 4 && stuData?.studentQuestionResponses?.data?.length > 0;
    const hasScoreData = active === 2 && scoreData?.data?.length > 0;
    const showLink = hasQuestionAnalysis || hasStudentResponses || hasScoreData;
    return (
      <div className={styles.analysis}>
        {analysisDetail && analysisDetail.title ? (
          <div className={styles.analysisMain}>
            <div className={styles.filterArea}>
              <div className={styles.filterTab}></div>
              {/* {this.props.active == 4 ? (
                  <div className={styles.viewTo} onClick={this.changeViewModal}>
                    {trans("global.testToView", "试卷投屏")}
                  </div>
                ) : null} */}
              {this.props.active == 2 && this.props.hasPending ? (
                <div
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "10px",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ color: "rgba(255, 85, 0, 0.85)" }}>
                    {trans(
                      "global.msgPendingSubjective",
                      "提示：当前还有主观题未完成批改，批改过程中数据会实时更新。",
                    )}
                  </span>
                  <a
                    onClick={this.goToCorrectionRemark}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    {trans("global.goMarking", "去批改")}
                  </a>
                </div>
              ) : null}
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
                    onClick={this.closeViewModal}
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

              {showLink ? (
                <Link
                  to={`/viewChart/${this.props.examId}/${this.props.paperId}`}
                  className={styles.viewStatus}
                >
                  {trans("global.viewRealTimeData", "实时数据")}
                </Link>
              ) : null}

              {this.props.active == 4 && (
                <a
                  className={styles.exportDataBtn}
                  onClick={this.clickExportData}
                >
                  {trans("global.exportData", "导出数据")}
                </a>
              )}

              {this.props.active == 4 && (
                <div className={styles.filterSelect}>
                  <Dropdown overlay={classMenu} trigger={["click"]}>
                    <span className={styles.selectName}>
                      {groupName} <i className={icon.iconfont}>&#xe659;</i>
                    </span>
                  </Dropdown>
                </div>
              )}
              {this.props.active == 4 && (
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
            <div
              className={styles.tableMain}
              style={this.props.active == 2 ? { paddingTop: "20px" } : null}
            >
              {this.props.active == 2 && (
                <AnalysisByClass
                  {...this.props}
                  getData={(pageNumber, pageSize) =>
                    this.getData(pageNumber, pageSize)
                  }
                  examPaperId={this.props.paperId}
                  examId={this.props.examId}
                  loadingTable={this.state.loadingTable}
                />
              )}
              {this.props.active == 4 && (
                <AnalysisByStudent
                  onRef={this.onRef}
                  {...this.props}
                  setViewList={this.setViewList}
                  getData={(pageNumber, pageSize) =>
                    this.getData(pageNumber, pageSize)
                  }
                  examPaperId={this.props.paperId}
                  loadingTable={this.state.loadingTable}
                  groupId={this.state.groupId}
                  studentName={this.state.studentName}
                  examId={this.props.examId}
                />
              )}
              {this.props.active == 3 && (
                <AnalysisByQuestion
                  {...this.props}
                  getData={(pageNumber, pageSize) =>
                    this.getData(pageNumber, pageSize)
                  }
                  examPaperId={this.props.paperId}
                  loadingTable={this.state.loadingTable}
                  examId={this.props.examId}
                />
              )}
              {/* {this.props.active == "4" && (
                  <AnalysisByKnowLedge
                    {...this.props}
                    getData={(pageNum, pageSize) =>
                      this.getData(pageNum, pageSize)
                    }
                    examPaperId={this.props.paperId}
                    loadingTable={this.state.loadingTable}
                    examPaperId={this.props.paperId}
                    examId={this.props.examId}
                  />
                )} */}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default connect(({ home, studyPictures }) => ({
  analysisDetail: home.viewData,
  tabKey: home.tabKey,
  scoreData: home.scoreData,
  stuData: home.stuData,
  questionData: home.questionData,
  classListData: home.classListData,
  questionAnalysisData: home.questionAnalysisData,
  knwoLedgeAnalysisList: home.knwoLedgeAnalysisList,
}))(StuTest);

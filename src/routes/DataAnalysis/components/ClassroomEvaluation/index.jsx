import React, { PureComponent } from "react";
import { Checkbox, Icon, message, Select } from "antd";

import styles from "./index.module.less";
const { Option } = Select;
import { DraggableArea } from "react-draggable-tags";

import StudentScore from "components/StudentScore/index";
import QuestionTable from "components/Table/index";
import RankingTable from "components/Table/rankingtable";
import ScoreTable from "components/Table/scoreTable";

import ComnModal from "../../../../components/ComnModal";
import KnowledgePoint from "../../../../components/KnowledgePoint/index.jsx";
import OverviewClassGrades from "../../../../components/OverviewClassGrades/index.jsx";
import TopicAnalysis from "../../../../components/TopicAnalysis/index.jsx";
import { groupScoreAnalyse } from "../../../../services/exam.js";
import {
  getConfig,
  queryStuGrade,
  saveConfig,
} from "../../../../services/example.js";
import { locale, trans } from "../../../../utils/i18n";
import { loginRedirect, openFullscreen } from "../../../../utils/utils.jsx";
import PresentationSlides from "./PresentationSlides.jsx";
class ClassroomEvaluation extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      sortType: ["1"],
      questionScore: null,
      overviewClassRef: null,
      courseDetailSpecify: false,
      commentContentVis: false,
      scoreSpecifyAnalysis: false,
      groupId: 0,
      config: [],
      tags: [],
      stuGradeList: [],
      currentIndex: 0,
      prevIndex: 0,
      loading: false,
    };
  }
  componentDidMount() {
    // 监听退出全屏事件 --- chrome 用 esc 退出全屏并不会触发 keyup 事件
    document.addEventListener(
      "webkitfullscreenchange",
      this.fullscreenChange,
    ); /* Chrome, Safari and Opera */
    document.addEventListener(
      "mozfullscreenchange",
      this.fullscreenChange,
    ); /* Firefox */
    document.addEventListener(
      "fullscreenchange",
      this.fullscreenChange,
    ); /* Standard syntax */
    document.addEventListener(
      "msfullscreenchange",
      this.fullscreenChange,
    ); /* IE / Edge */

    this.getGroupList();
  }

  // 获取班级
  getGroupList = () => {
    queryStuGrade({
      examId: this.props.testId,
    }).then((response) => {
      if (response.status) {
        const data = response.content;
        // 存在班级则默认选中第一个班级，不存在则显示全部班级
        this.setState(
          {
            groupId: data && data.length > 0 ? data[0].groupId : 0,
            stuGradeList: data,
          },
          () => {
            this.initModal();
          },
        );
      } else {
        message.error(response.message);
      }
    });
  };

  // 班级成绩概况
  getGroupAnalyse = ({ filterFlag, sortType, groupId } = {}) => {
    this.setState({
      loading: true,
    });
    groupScoreAnalyse({
      examId: this.props.testId,
      filterFlag:
        filterFlag == undefined ? this.state.courseDetailSpecify : filterFlag,
      sortType: sortType == undefined ? this.state.sortType[0] : sortType[0],
      groupId: groupId == undefined ? this.state.groupId : groupId,
    })
      .then((response) => {
        if (response.ifLogin) {
          if (response.status) {
            this.setState(
              {
                dataSource: response.content,
              },
              () => {
                this.state.overviewClassRef.initChart();
              },
            );
          } else {
            message.error(response.message);
          }
        } else {
          loginRedirect();
        }
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };

  initModal = () => {
    getConfig({
      type: 4,
      businessId: this.props.testId,
      schoolLevel: false,
    }).then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          this.setState({
            config: response.content,
            tags: this.initTags(response.content),
            deepCloneTag: this.initTags(response.content),
          });
          if (response.content && response.content.length > 0) {
            this.refreshModuleData({ config: response.content });
          }
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  refreshModuleData = ({ comentModal } = {}) => {
    if (comentModal == undefined) {
      comentModal = this.state.config;
    }

    if (comentModal && comentModal.length > 0) {
      for (const item of comentModal) {
        for (const item1 of item.modeValue) {
          if (item1.showSwitch == "open") {
            // 获取班级成绩概况数据
            if (item1.name == "groupScore") {
              this.getGroupAnalyse({});
            } else if (item1.name == "analyseRank") {
              // 获取成绩分段对比数据
              this.state.scoreTableRef.initData();
            } else if (item1.name == "classEvaluation") {
              this.state.topicAnalysisRef.initData();
            } else if (item1.name == "groupQuestion") {
              this.state.questionTableRef.initData();
            } else if (item1.name == "knowledgePoint") {
              this.state.knowledgePointRef.initData();
            } else if (item1.name == "studentScore") {
              this.state.studentScoreRef.initData();
            } else if (item1.name == "analyseScoreSection") {
              console.log(this.state.rankingTableRef, "rankingTableRef");
              this.state.rankingTableRef.initData();
            }
          }
        }
      }
    }
  };

  handelSort = (e) => {
    this.setState({
      sortType: [e.key],
    });
    this.getGroupAnalyse({ sortType: [e.key] });
  };

  setSelect = (id) => {
    this.setState({
      elevatorIndex: id,
    });
    const dom = document.getElementById(id);
    dom && dom.scrollIntoView(true);
  };

  fullscreenChange = (e) => {
    // 获取当前全屏元素
    var element = document.fullscreenElement;

    if (element === null) {
      console.log("关闭全屏");
      // 这里为了处理esc时退出全屏，同步所有fullscreenStatus的值为false
      this.setState({
        isContainerFullScreen: false,
        isInnerFullScreen: false,
        ppt: false,
      });
      this.refreshModuleData();
    } else {
      console.log("打开全屏");
      if (element.id == "innerContent") {
        isInnerContentFullscreen = true;
        this.setState({
          isInnerFullScreen: true,
        });
      } else {
        this.setState({
          isContainerFullScreen: true,
        });
      }
    }
  };

  fullscreen = (id) => {
    if (id == "innerContent") {
      let container = document.getElementById(id);
      container.requestFullscreen().catch((error) => {
        console.error(
          `Error attempting to enable full-screen mode: ${error.message}`,
        );
      });
    } else {
      openFullscreen(document.documentElement);
    }
  };

  exitFullscreen = (id) => {
    document.fullscreenElement && document.exitFullscreen();
    if (id == "classroomEvaluation") {
      this.setState({
        isContainerFullScreen: false,
      });
    } else {
      this.setState({
        isInnerFullScreen: false,
      });
    }
  };

  changeGrade = (value) => {
    console.log(value);

    this.setState(
      {
        groupId: value,
      },
      () => {
        this.refreshModuleData();
      },
    );
  };

  courseDetailSpecifyChange = (checked) => {
    this.setState({
      courseDetailSpecify: checked,
    });
    this.getGroupAnalyse({ filterFlag: checked });
  };

  setCommentContent = () => {
    this.setState({
      commentContentVis: true,
    });
  };

  commentContentOk = () => {
    this.setState({
      loading: true,
    });
    saveConfig({
      teacherId: this.props.currentUser.userId,
      type: 4,
      businessId: this.props.testId,
      config: JSON.stringify(this.state.config),
    })
      .then((response) => {
        if (response.ifLogin) {
          if (response.status) {
            this.setState({
              commentContentVis: false,
            });
            getConfig({
              type: 4,
              businessId: this.props.testId,
              schoolLevel: false,
            }).then((response) => {
              if (response.status) {
                this.setState({
                  config: response.content,
                  tags: this.initTags(response.content),
                  deepCloneTag: this.initTags(response.content),
                });
                this.refreshModuleData(response.content);
              }
            });
          } else {
            message.error(response.message);
          }
        } else {
          loginRedirect();
        }
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };

  commentContentCancel = () => {
    this.setState({
      commentContentVis: false,
    });
  };

  selectModule = (e) => {
    let deepClone = JSON.parse(JSON.stringify(this.state.config));
    for (const item of deepClone) {
      for (const item1 of item.modeValue) {
        if (e.target.value == item1.name) {
          if (e.target.checked) {
            item1.showSwitch = "open";
            item1.sort = this.state.tags.length + 1;
          } else {
            item1.showSwitch = null;
          }
        }
      }
    }
    this.setState({
      config: deepClone,
      deepCloneTag: this.initTags(deepClone),
    });
  };

  initTags = (data) => {
    let deepClone = JSON.parse(JSON.stringify(data));
    let array = [];
    if (deepClone && deepClone.length > 0) {
      deepClone?.map((item) => {
        item.modeValue.map((item1) => {
          if (item1.showSwitch == "open") {
            array.push({
              id: item1.name,
              content: item1.showName,
              eName: item1.eName || item1.showName,
              sort: item1.sort,
            });
          }
        });
      });
      array = array.length > 0 ? array.sort((a, b) => a.sort - b.sort) : [];
    }
    return array;
  };

  upMove = () => {};

  downMove = () => {};

  draggChange = (tags) => {
    tags = tags.map((tag, index) => ({ ...tag, sort: index + 1 }));
    let deepClone = JSON.parse(JSON.stringify(this.state.config));
    deepClone.map((item) => {
      item.modeValue.map((item1) => {
        if (item1.showSwitch == "open") {
          for (const item2 of tags) {
            if (item2.id == item1.name) {
              item1.sort = item2.sort;
            }
          }
        }
      });
    });
    this.setState({
      config: deepClone,
      deepCloneTag: tags,
    });
  };

  render() {
    let list = [];
    for (const item of this.state.tags) {
      if (item.id == "groupScore") {
        list = [
          ...list,
          item,
          { ...item, id: "groupScore1" },
          { ...item, id: "groupScore2" },
        ];
      } else if (item.id == "groupQuestion") {
        list = [...list, item, { ...item, id: "groupQuestion1" }];
      } else {
        list = [...list, item];
      }
    }
    const { elevatorIndex, stuGradeList } = this.state;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
        }}
        id="classroomEvaluation"
      >
        <div
          style={
            this.state.isContainerFullScreen
              ? {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  margin: 0,
                  background: "#fff",
                  zIndex: 9,
                  flex: 1,
                  overflow: this.state.ppt ? "hidden" : "auto",
                }
              : { flex: 1, overflow: this.state.ppt ? "hidden" : "auto" }
          }
        >
          {this.state.ppt ? null : (
            <div
              style={{
                background: "rgb(255, 255, 255)",
                borderRadius: "10px",
                marginBottom: "10px",
                padding: "10px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Select
                onChange={this.changeGrade}
                value={this.state.groupId}
                style={{ width: 240 }}
              >
                <Option value={0} key={0}>
                  {trans("global.allClass", "全部班级")}
                </Option>
                {stuGradeList && stuGradeList.length > 0
                  ? stuGradeList.map((item, index) => (
                      <Option value={item.groupId} key={index + 1}>
                        {item.groupName}
                      </Option>
                    ))
                  : null}
              </Select>

              <div
                style={{
                  marginLeft: "10px",
                  cursor: "pointer",
                  color: "rgba(1, 17, 61, 0.65)",
                }}
                onClick={this.setCommentContent}
              >
                <i className={styles.iconfont}>&#xe6b3;</i>
                &nbsp;
                {trans("global.setReviewContent", "设置讲评内容")}
              </div>
              {this.state.loading ? null : (
                <div
                  style={{
                    cursor: "pointer",
                    color: "rgba(1, 17, 61, 0.65)",
                    marginLeft: "auto",
                    fontWeight: 500,
                  }}
                  onClick={() => {
                    this.fullscreen("classroomEvaluation");
                    this.setState({
                      ppt: true,
                    });
                  }}
                >
                  <Icon type="play-square" />
                  &nbsp;
                  <span
                    style={{
                      fontSize: "14px",
                    }}
                  >
                    {trans("global.presentation", "演示")}
                  </span>
                </div>
              )}

              {this.state.isInnerFullScreen ? null : (
                <div style={{ marginLeft: "10px", fontSize: "14px" }}>
                  {this.state.isContainerFullScreen ? (
                    <div
                      onClick={() => {
                        this.exitFullscreen("classroomEvaluation");
                      }}
                    >
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "13px" }}
                      >
                        &#xe8a3;
                      </i>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        this.fullscreen("classroomEvaluation");
                      }}
                    >
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "13px" }}
                      >
                        &#xe8a4;
                      </i>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {this.state.tags?.map((item, index) => {
            if (item.id == "groupScore") {
              return (
                <div key="groupScore" id="groupScore">
                  <div>
                    {/* 班级成绩概况 */}
                    <OverviewClassGrades
                      onRef={(_this) => {
                        this.setState({ overviewClassRef: _this });
                      }}
                      filterStudentListPermissions={
                        this.props.filterStudentListPermissions
                      }
                      courseDetailSpecify={this.state.courseDetailSpecify} //指定分析
                      sortType={this.state.sortType} //排序
                      dataSource={this.state.dataSource}
                      isInnerFullScreen={this.state.isInnerFullScreen} //全屏状态
                      viewData={this.props.viewData}
                      testId={this.props.testId}
                      dispatch={this.props.dispatch}
                      onHandleOk={() => {
                        this.getGroupAnalyse({});
                      }} //编辑分段
                      exitFullscreen={this.exitFullscreen} //退出全屏
                      fullscreen={this.fullscreen} //全屏
                      handelSort={this.handelSort} //切换排序方式
                      courseDetailSpecifyChange={this.courseDetailSpecifyChange} //指定分析
                    />
                    {this.state.ppt ? null : (
                      <div className={styles.line_spacing}> </div>
                    )}
                  </div>
                </div>
              );
            } else if (item.id == "analyseRank") {
              return (
                <div key="analyseRank" id="analyseRank">
                  <div>
                    <ScoreTable
                      onRef={(_this) => {
                        this.setState({ scoreTableRef: _this });
                      }}
                      dispatch={this.props.dispatch}
                      questionScore={this.props.scoreSection}
                      examId={this.props.testId}
                      filterStudentListPermissions={
                        this.props.filterStudentListPermissions
                      }
                      examSourceType={this.props.viewData?.examSourceType}
                      isParentInit={true}
                      groupId={this.state.groupId}
                    />
                    {this.state.ppt ? null : (
                      <div className={styles.line_spacing}> </div>
                    )}
                  </div>
                </div>
              );
            } else if (item.id == "classEvaluation") {
              return (
                <div key="classEvaluation" id="classEvaluation">
                  <div
                    style={{
                      width: "100%",
                      background: "#fff",
                      borderRadius: "10px",
                    }}
                  >
                    <div
                      className={styles.tableBoxHeader}
                      style={{ height: "auto", paddingTop: "10px" }}
                    >
                      <span className={styles.tableHeaderTitle}>
                        {trans("global.classroomReviewQuestion", "课堂讲评题")}
                      </span>
                      <div className={styles.operation}></div>
                    </div>
                    <TopicAnalysis
                      onRef={(_this) => {
                        this.setState({ topicAnalysisRef: _this });
                      }}
                      onOutReview={this.props.onOutReview}
                      onStartExplaining={this.props.onStartExplaining}
                      commentMode={this.props.commentMode}
                      dispatch={this.props.dispatch}
                      examId={this.props.testId}
                      paperId={this.props.viewData?.paperId}
                      heidenRight={true}
                      heidenGradeSelect={true}
                      isParentInit={true}
                      groupId={this.state.groupId}
                    />
                  </div>
                  {this.state.ppt ? null : (
                    <div className={styles.line_spacing}> </div>
                  )}
                </div>
              );
            } else if (item.id == "groupQuestion") {
              return (
                <div key="groupQuestion" id="groupQuestion">
                  <div>
                    <QuestionTable
                      questionScore={this.props.questionScore}
                      dispatch={this.props.dispatch}
                      examId={this.props.testId}
                      paperId={this.props.viewData?.paperId}
                      filterStudentListPermissions={
                        this.props.filterStudentListPermissions
                      }
                      groupId={this.state.groupId}
                      isParentInit={true}
                      onRef={(_this) => {
                        this.setState({ questionTableRef: _this });
                      }}
                    />
                  </div>
                  {this.state.ppt ? null : (
                    <div className={styles.line_spacing}> </div>
                  )}
                </div>
              );
            } else if (item.id == "knowledgePoint") {
              return (
                <div key="knowledgePoint" id="knowledgePoint">
                  <div>
                    <KnowledgePoint
                      onRef={(_this) => {
                        this.setState({ knowledgePointRef: _this });
                      }}
                      dispatch={this.props.dispatch}
                      examId={this.props.testId}
                      paperId={this.props.viewData?.paperId}
                      groupId={this.state.groupId}
                      filterStudentListPermissions={
                        this.props.filterStudentListPermissions
                      }
                      isParentInit={true}
                      tableClass={this.props.tableClass}
                    />
                  </div>
                  {this.state.ppt ? null : (
                    <div className={styles.line_spacing}> </div>
                  )}
                </div>
              );
            } else if (item.id == "studentScore") {
              return (
                <div key="studentScore" id="studentScore">
                  <div>
                    <StudentScore
                      onRef={(_this) => {
                        this.setState({ studentScoreRef: _this });
                      }}
                      dispatch={this.props.dispatch}
                      examId={this.props.testId}
                      examName={this.props.viewData?.examName}
                      questionScore={this.props.stuScore}
                      groupId={this.state.groupId}
                      filterStudentListPermissions={
                        this.props.filterStudentListPermissions
                      }
                      examSourceType={this.props.viewData?.examSourceType}
                      isParentInit={true}
                    />
                  </div>
                  {this.state.ppt ? null : (
                    <div className={styles.line_spacing}> </div>
                  )}
                </div>
              );
            } else if (item.id == "analyseScoreSection") {
              return (
                <div key="analyseScoreSection" id="analyseScoreSection">
                  <div>
                    <RankingTable
                      onRef={(_this) => {
                        this.setState({ rankingTableRef: _this });
                      }}
                      groupId={this.state.groupId}
                      dispatch={this.props.dispatch}
                      questionScore={this.props.scoreSection}
                      examId={this.props.testId}
                      filterStudentListPermissions={
                        this.props.filterStudentListPermissions
                      }
                      examSourceType={this.props.viewData?.examSourceType}
                      isParentInit={true}
                    />
                    {this.state.ppt ? null : (
                      <div className={styles.line_spacing}> </div>
                    )}
                  </div>
                </div>
              );
            }
          })}

          {this.state.ppt ? (
            <PresentationSlides
              tags={list}
              exitFullscreen={this.exitFullscreen}
              dataSource={this.state.dataSource}
              viewData={this.props.viewData}
              examId={this.props.testId}
              groupId={this.state.groupId}
              questionScore={this.props.stuScore}
            />
          ) : null}
        </div>

        <div className={styles.rightContent}>
          <div className={styles.elevator}>
            <div className={styles.elevatorTitle}>
              {trans("global.viewList", "看板目录")}
            </div>
            <div>
              {this.state.tags.map((item, index) => (
                <div
                  className={[
                    styles.elevatorListItem,
                    item.id === elevatorIndex ? styles.select : "",
                  ].join(" ")}
                  onClick={this.setSelect.bind(this, item.id)}
                  key={index}
                >
                  {locale() == "en" ? item.eName : item.content}
                </div>
              ))}
            </div>
          </div>
        </div>

        <ComnModal
          options={{
            okButtonProps: {
              loading: this.state.loading,
            },
            wrapClassName: styles.commentContentBody,
            title: trans("global.setReviewContent", "设置讲评内容"),
            visible: this.state.commentContentVis,
            onOk: this.commentContentOk,
            onCancel: this.commentContentCancel,
            centered: true,
            width: "707px",
          }}
          innerContent={
            <div style={{ width: "100%", height: "376px", display: "flex" }}>
              <div
                style={{
                  width: "calc(100% - 179px)",
                  height: "100%",
                  paddingTop: "37px",
                  overflow: "auto",
                }}
              >
                {this.state.config && this.state.config.length > 0
                  ? this.state.config?.map((item) => {
                      return (
                        <div style={{ marginBottom: "15px" }}>
                          <div
                            style={{
                              fontWeight: "500",
                              marginBottom: "8px",
                              fontSize: "14px",
                              color: "rgba(1, 17, 61, 0.85)",
                            }}
                          >
                            {locale() == "en"
                              ? item.eModeName
                                ? item.eModeName
                                : item.modeName
                              : item.modeName}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap" }}>
                            {item.modeValue.map((item1) => {
                              return (
                                <Checkbox
                                  value={item1.name}
                                  onChange={this.selectModule}
                                  checked={item1.showSwitch == "open"}
                                >
                                  <span style={{ color: "#01113d" }}>
                                    {locale() == "en"
                                      ? item1.eName
                                        ? item1.eName
                                        : item1.showName
                                      : item1.showName}
                                  </span>
                                </Checkbox>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  : null}
              </div>
              <div className={styles.draggableBox}>
                <div className={styles.title}>
                  {trans("global.sortingManagement", "排序管理")}
                </div>
                <div className={styles}>
                  <DraggableArea
                    isList={true}
                    tags={this.state.deepCloneTag}
                    render={({ tag, index }) => (
                      <div className={styles.tag}>
                        {locale() == "en" ? tag.eName : tag.content}
                        &nbsp;
                        <Icon
                          type="drag"
                          style={{
                            color: "rgba(1,17,61,0.25)",
                            fontSize: "17px",
                            float: "right",
                          }}
                        />
                        {/* <span style={{ fontSize: '17px', float: 'right' }}>
                                                    <Icon type="arrow-up" style={{ color: index == 0 ? "#C9CED9" : '#8C94A8', }} />
                                                    &nbsp;
                                                    <Icon type="arrow-down" style={{ color: index == tag.length - 1 ? "#C9CED9" : '#8C94A8' }} />
                                                </span> */}
                      </div>
                    )}
                    onChange={(tags) => this.draggChange(tags)}
                    className={styles.tags}
                  />
                </div>
              </div>
            </div>
          }
        />
      </div>
    );
  }
}
export default ClassroomEvaluation;

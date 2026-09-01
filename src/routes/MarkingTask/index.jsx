//新闻
import React, { PureComponent } from "react";
import { Icon, Steps, Tooltip } from "antd";
import { connect } from "dva";
import { Link } from "dva/router";

import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
const { Step } = Steps;

class MarkingTask extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      checkTask: 2,
      allMarkingNum: null,
      tobeAllocatedNum: null,
      tobeCorrectedNum: null,
      tobeUploadedNum: null,
    };
  }
  componentDidMount() {
    this.getPage();
    this.getListNum();
    // 在 a 标签页中监听 localStorage 的变化
    window.addEventListener("storage", (event) => {
      if (event.key === "tab_b_closed") {
        // 检测到 b 标签页关闭，执行刷新操作
        console.log("Tab B closed, refreshing data...");
        this.getPage(); // 刷新页面数据
        this.getListNum();
      }
    });
  }
  getListNum = () => {
    this.props
      .dispatch({
        type: "marking/getPaperListNum",
      })
      .then(() => {
        const { paperListNum } = this.props;
        paperListNum &&
          paperListNum.length > 0 &&
          paperListNum.map((item) => {
            if (item.queryType == 1) {
              this.setState({
                allMarkingNum: item.queryNum,
              });
            } else if (item.queryType == 2) {
              this.setState({
                tobeAllocatedNum: item.queryNum,
              });
            } else if (item.queryType == 3) {
              this.setState({
                tobeCorrectedNum: item.queryNum,
              });
            } else if (item.queryType == 4) {
              this.setState({
                tobeUploadedNum: item.queryNum,
              });
            }
          });
      });
  };
  getPage = () => {
    const { checkTask } = this.state;
    this.props.dispatch({
      type: "marking/getOnlineMarkingPaperList",
      payload: {
        queryType: checkTask,
        limit: 10_000,
        pageNo: 1,
      },
    });
  };
  // 切换
  switchTab = (check) => {
    this.setState(
      {
        checkTask: check,
      },
      () => {
        this.getPage();
      },
    );
  };
  //点击分配任务
  clickAssignTasks = (id) => {
    this.props
      .dispatch({
        type: "marking/getExamPaperSettingStatus",
        payload: {
          examId: id,
        },
      })
      .then(() => {
        const { examPaperSettingStatus } = this.props;
        if (examPaperSettingStatus) {
          window.open(
            `${window.location.origin}/exam#/allocationProcess/${id}`,
          );
        } else {
          window.open(
            `${window.location.origin}/exam#/setQuestionBlocks/${id}`,
          );
        }
      });
  };
  //上传试卷
  uploadTestPaper = (item) => {
    this.props
      .dispatch({
        type: "marking/getUploadPaperScore",
        payload: {
          examId: item.examId,
        },
      })
      .then(() => {
        this.getPage();
      });
  };
  render() {
    const { onlineMarkingPaperList, paperListNum } = this.props;
    const {
      checkTask,
      allMarkingNum,
      tobeAllocatedNum,
      tobeCorrectedNum,
      tobeUploadedNum,
    } = this.state;
    let f = window.yg;
    const customDot = (dot, { status, index }) => <span>{dot}</span>;
    return (
      <div className={styles.markingBox}>
        <div className={styles.markingContent}>
          <div className={styles.headerBox}>
            <span className={styles.viewBox}>
              <span
                onClick={() => this.switchTab(2)}
                className={[
                  styles.viewTab,
                  checkTask === 2 ? styles.isCheck : "",
                ].join(" ")}
                data-type="待分配"
              >
                {trans("global.toBeAssigned", "待分配")}({tobeAllocatedNum})
              </span>
              <span
                onClick={() => this.switchTab(3)}
                className={[
                  styles.viewTab,
                  checkTask === 3 ? styles.isCheck : "",
                ].join(" ")}
                data-type="待批改"
              >
                {trans("global.toBeGraded", "待批改")}({tobeCorrectedNum})
              </span>
              <span
                onClick={() => this.switchTab(4)}
                className={[
                  styles.viewTab,
                  checkTask === 4 ? styles.isCheck : "",
                ].join(" ")}
                data-type="待上传"
              >
                {trans("global.toBeUploaded", "待上传")}({tobeUploadedNum})
              </span>
              <span
                onClick={() => this.switchTab(1)}
                className={[
                  styles.viewTab,
                  checkTask === 1 ? styles.isCheck : "",
                ].join(" ")}
                data-type="全部阅卷"
              >
                {trans("global.allOnlineQuizzes", "全部阅卷")}
                {/* ({allMarkingNum}) */}
              </span>
            </span>
            {/* <div
              className={
                device == "ipad" ? styles.ipadOperateBtn : styles.operateBtn
              }
            >
              <span className={styles.initiateGrading}>
                {trans("global.initiateTest", "发起测验")}
              </span>
            </div> */}
          </div>
          <div className={[styles.testMapList].join(" ")}>
            {onlineMarkingPaperList &&
              onlineMarkingPaperList.examList &&
              onlineMarkingPaperList.examList.length > 0 &&
              onlineMarkingPaperList.examList.map((item) => (
                <div className={[styles.mapBox, "listItem"].join(" ")}>
                  {/* <Link
                to={`/dataAnalysis/${item.examId || null}/${item.id || null}/2`}
                target="_blank"
              > */}
                  <span
                    className={[styles.inline, styles.messageBox].join(" ")}
                  >
                    <div>
                      <span className={styles.header}>
                        {item.title}
                        {item.fileStatus ? (
                          <Link
                            to={`/dataAnalysis/${item.examId || null}/${
                              item.id || null
                            }/1`}
                            target="_blank"
                          >
                            <Icon
                              type="eye"
                              style={{ color: "#0445fc", marginLeft: 6 }}
                            />
                          </Link>
                        ) : null}
                      </span>
                    </div>
                    <div className={styles.content}>
                      <span
                        className={[
                          styles.examTypeBox,
                          item.examTypeCode == 1
                            ? styles.green
                            : item.examTypeCode == 2 || item.examTypeCode == 3
                              ? styles.blue
                              : item.examTypeCode == 3 ||
                                  item.examTypeCode == 10
                                ? styles.blue
                                : item.examTypeCode == 7 ||
                                    item.examTypeCode == 9
                                  ? styles.red
                                  : item.examTypeCode == 6 ||
                                      item.examTypeCode == 4 ||
                                      item.examTypeCode == 5
                                    ? styles.orange
                                    : item.examTypeCode == 11
                                      ? styles.grey
                                      : styles.grey,
                        ].join(" ")}
                      >
                        {item.examTypeName}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe61f;</i>
                        {item.createDate}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe708;</i>
                        {item.subjectName}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe745;</i>
                        {item.gradeName}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <Icon type="user" />
                        {item.createUserName || ""}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe7fe;</i>
                        {item.examNum}
                      </span>
                    </div>
                    <div className={styles.bottom}>
                      <span
                        className={[styles.inline, styles.totalScore].join(" ")}
                      >
                        {trans("global.gong", "共")}
                        <span className={styles.point}>
                          {/* {item.examSourceType !== 0
                                ? item.applyGroupNum
                                : item.questionTotalNum} */}
                          {item.applyGroupNum}
                        </span>
                        {/* {item.examSourceType !== 0
                              ? trans("global.groupNum", "个班级")
                              : trans("global.question", "题")} */}
                        {trans("global.groupNum", "个班级")}：
                      </span>
                      {/* <Tooltip
                        mouseEnterDelay={0.5}
                        title={() => (
                          <>
                            {item.examSourceType !== 0 ? (
                              <span
                                className={[
                                  styles.inline,
                                  styles.testType,
                                ].join(" ")}
                              >
                                {item.applyGroupNames}
                              </span>
                            ) : item.questionTypeNumberModels &&
                              item.questionTypeNumberModels.length ? (
                              item.questionTypeNumberModels.map((i, newI) => (
                                <span
                                  className={[
                                    styles.inline,
                                    styles.testType,
                                  ].join(" ")}
                                  key={newI}
                                >
                                  <span className={styles.point}>
                                    {i.questionNum}
                                  </span>
                                  {i.typeName}
                                </span>
                              ))
                            ) : null}
                          </>
                        )}
                      >
                        <div className={styles.classNamesBox}>
                          {item.examSourceType !== 0 ? (
                                <span
                                  className={[
                                    styles.inline,
                                    styles.testType,
                                  ].join(" ")}
                                >
                                  {item.applyGroupNames}
                                </span>
                              ) : item.questionTypeNumberModels &&
                                item.questionTypeNumberModels.length ? (
                                item.questionTypeNumberModels.map((i, newI) => (
                                  <span
                                    className={[
                                      styles.inline,
                                      styles.testType,
                                    ].join(" ")}
                                    key={newI}
                                  >
                                    <span className={styles.point}>
                                      {i.questionNum}
                                    </span>
                                    {i.typeName}
                                  </span>
                                ))
                              ) : null}
                        </div>
                      </Tooltip> */}
                      <div className={styles.classNamesBox}>
                        {item.applyGroupNames}
                      </div>
                    </div>
                  </span>
                  {/* </Link> */}
                  <span
                    className={[styles.inline, styles.markingStatus].join(" ")}
                  >
                    <div className={styles.steps}>
                      {item.processStatus == 1 ? (
                        <span className={styles.stepsBox}>
                          <span
                            className={[styles.stepsDrop, styles.current].join(
                              " ",
                            )}
                          ></span>
                          <span className={[styles.stepsLine].join(" ")}></span>
                          <span className={[styles.stepsDrop].join(" ")}></span>
                          <span className={[styles.stepsLine].join(" ")}></span>
                          <span className={[styles.stepsDrop].join(" ")}></span>
                          <span className={[styles.stepsLine].join(" ")}></span>
                          <span className={[styles.stepsDrop].join(" ")}></span>
                        </span>
                      ) : item.processStatus == 2 ? (
                        <span className={styles.stepsBox}>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsLine, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsDrop, styles.current].join(
                              " ",
                            )}
                          ></span>
                          <span className={[styles.stepsLine].join(" ")}></span>
                          <span className={[styles.stepsDrop].join(" ")}></span>
                          <span className={[styles.stepsLine].join(" ")}></span>
                          <span className={[styles.stepsDrop].join(" ")}></span>
                        </span>
                      ) : item.processStatus == 3 ? (
                        <span className={styles.stepsBox}>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsLine, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsLine, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsDrop, styles.current].join(
                              " ",
                            )}
                          ></span>
                          <span className={[styles.stepsLine].join(" ")}></span>
                          <span className={[styles.stepsDrop].join(" ")}></span>
                        </span>
                      ) : item.processStatus == 4 ? (
                        <span className={styles.stepsBox}>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsLine, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsLine, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsLine, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsDrop, styles.current].join(
                              " ",
                            )}
                          ></span>
                        </span>
                      ) : (
                        <span className={styles.stepsBox}>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsLine, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsLine, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsLine, styles.complete].join(
                              " ",
                            )}
                          ></span>
                          <span
                            className={[styles.stepsDrop, styles.complete].join(
                              " ",
                            )}
                          ></span>
                        </span>
                      )}

                      <span className={styles.stepsTest}>
                        <span className={styles.inlineStatus}>
                          {trans("global.scanTestPaper", "扫描试卷")}
                        </span>
                        <span className={styles.inlineStatus}>
                          {trans("global.assignTasks", "分配任务")}
                        </span>
                        <span className={styles.inlineStatus}>
                          {trans("global.correct", "批改试卷")}
                        </span>
                        <span className={styles.inlineStatus}>
                          {trans("global.uploadGrades", "上传成绩")}
                        </span>
                      </span>
                    </div>
                  </span>
                  <span
                    className={[styles.inline, styles.optionBox].join(" ")}
                    data-block="操作"
                  >
                    <div className={styles.downloadBox}>
                      {item.processStatus == 2 ? (
                        <div
                          className={styles.download}
                          style={{ minWidth: "80px" }}
                          onClick={() => this.clickAssignTasks(item.examId)}
                        >
                          <div className={styles.initiateTest}>
                            <i
                              className={styles.iconfont}
                              style={{
                                fontSize: "14px",
                                color: "#0445FC",
                              }}
                            >
                              &#xe895;
                            </i>
                            <span
                              className={[styles.grades, styles.dir].join(" ")}
                            >
                              {trans("global.assignTasks", "分配任务")}
                            </span>
                          </div>
                        </div>
                      ) : item.processStatus == 3 ? (
                        <div
                          className={styles.download}
                          style={{ minWidth: "80px" }}
                        >
                          <Link
                            to={`/correctionDetails/${item.examId}`}
                            target="_blank"
                          >
                            <div className={styles.initiateTest}>
                              <i
                                className={styles.iconfont}
                                style={{
                                  fontSize: "14px",
                                  color: "#0445FC",
                                }}
                              >
                                &#xe7a1;
                              </i>
                              <span
                                className={[styles.grades, styles.dir].join(
                                  " ",
                                )}
                              >
                                {trans("global.correct", "批改试卷")}
                              </span>
                            </div>
                          </Link>
                        </div>
                      ) : item.processStatus == 1 ? (
                        <div
                          className={styles.download}
                          style={{ minWidth: "80px" }}
                          // onClick={() => this.clickAssignTasks(item.examId)}
                        >
                          <Tooltip
                            placement="topRight"
                            title={trans(
                              "global.noScan",
                              "试卷还未扫描，暂无法分配阅卷任务",
                            )}
                          >
                            <div
                              className={[
                                styles.initiateTest,
                                styles.noInitiateTest,
                              ].join(" ")}
                            >
                              <i
                                className={styles.iconfont}
                                style={{
                                  fontSize: "14px",
                                  // color: "#0445FC",
                                }}
                              >
                                &#xe895;
                              </i>
                              <span
                                className={[styles.grades, styles.dir].join(
                                  " ",
                                )}
                              >
                                {trans("global.assignTasks", "分配任务")}
                              </span>
                            </div>
                          </Tooltip>
                        </div>
                      ) : item.processStatus == 4 ? (
                        <div
                          className={styles.download}
                          style={{ minWidth: "80px" }}
                          onClick={() => {
                            this.uploadTestPaper(item);
                          }}
                        >
                          <div className={styles.initiateTest}>
                            <i
                              className={styles.iconfont}
                              style={{ fontSize: "14px", color: "#0445FC" }}
                            >
                              &#xe8d9;
                            </i>
                            <span
                              className={[styles.grades, styles.dir].join(" ")}
                            >
                              {trans("global.uploadTestPaper", "上传试卷")}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ home, global, publishToStudent, marking }) => ({
  onlineMarkingPaperList: marking.onlineMarkingPaperList,
  paperListNum: marking.paperListNum,
  examPaperSettingStatus: marking.examPaperSettingStatus,
}))(MarkingTask);

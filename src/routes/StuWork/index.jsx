//新闻
import React, { PureComponent } from "react";
import { message } from "antd";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import DetailView from "../../components/DetailView/index";
import { trans } from "../../utils/i18n";
import { setupWKWebViewJavascriptBridge } from "../../utils/utils";

import styles from "./index.module.less";

let sortList = {
  1: "STUDENT_NO",
  2: "STUDENT_NAME",
  3: "STUDENT_E_NAME",
  4: "SCORE",
  5: "SCORE",
};
class StuWork extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/stuWork/:testId/:stuId").exec(this.url);
    this.testId = JSON.parse(this.pathMatch[1]);
    this.stuId = JSON.parse(this.pathMatch[2]);
    // (this.ifAna = this.pathMatch[4] ? JSON.parse(this.pathMatch[4]) : false),
    this.state = {
      testName: "",
      deleteList: [],
      detaiList: [],
      viewData: {},
      ifEdit: true,
      checkQuestionId: null,
      showTest: false,
      num: 3,
      showNum: false,
      isVisible: false,
      isNoAnswer: false,
      fileList: [],
    };
    this.child = null;
    this.canSubmit = true;
  }
  componentDidMount() {
    this.props
      .dispatch({
        type: "home/getStudentTest",
        payload: {
          paperId: this.testId,
          studentId: this.stuId,
          type: 1,
        },
      })
      .then(() => {
        this.setState({
          detaiList: this.props.studentTest.moduleList || [],
          viewData: this.props.studentTest,
        });
      });
  }
  onRef = (reference) => {
    this.child = reference;
  };
  updateDeleteList = (item) => {
    let list = [...this.state.deleteList];
    list.push(item);
    this.setState({
      deleteList: list,
    });
  };
  updateList = (list) => {
    console.log(list, "ll");
    this.setState({
      detaiList: list,
    });
    this.props.dispatch({
      type: "home/changeDrop",
      payload: list,
    });
  };
  ondragstart(event_) {
    let t = event_.target;
    console.log(t.parentNode.parentNode.parentNode.offsetLeft, "aa");
    event_.dataTransfer.setDragImage(t.parentNode.parentNode.parentNode, 0, 0);
    event_.dataTransfer.setData("text", t.id);
  }
  newDragStart(event_) {
    let t = event_.target;
    console.log(t.parentNode.parentNode.parentNode.offsetLeft, "aa");
    event_.dataTransfer.setDragImage(t, 0, 0);
    event_.dataTransfer.setData("text", t.id);
  }
  ondragover(event_) {
    event_.preventDefault();
  }
  newdragover(event_) {
    event_.preventDefault();
  }

  ondragenter(event_) {
    let t = event_.target.parentNode.parentNode.parentNode;
    t.style.opacity = 0.3;
    t.style.backgroundColor = "#333";
  }
  newdragenter(event_) {
    let t = event_.target;
    t.style.opacity = 0.3;
    t.style.backgroundColor = "#333";
  }

  ondragleave(event_) {
    let t = event_.target.parentNode.parentNode.parentNode;
    console.log(event_, "eee");
    t.style.opacity = 1;
    t.style.backgroundColor = "#fff";
  }
  newdragleave(event_) {
    let t = event_.target;
    console.log(event_, "eee");
    t.style.opacity = 1;
    t.style.backgroundColor = "#fff";
  }
  changeTestName = (e) => {
    this.setState({
      testName: e.target.value,
    });
  };
  refList = (item) => {
    let list = [...this.state.deleteList];
    list.map((it, index) => {
      if (it.questionId === item.questionId) {
        list.splice(index, 1);
      }
    });
    this.setState({
      deleteList: list,
    });
    this.child.returnList(item);
  };
  ondrop = (event_) => {
    console.log(event_);
    let d = event_.dataTransfer.getData("text"),
      target = event_.target,
      targetId = event_.target.id;
    console.log(event_, target, targetId, d);

    target.parentNode.parentNode.parentNode.style.opacity = 1;
    target.parentNode.parentNode.parentNode.style.backgroundColor = "#fff";
    if (d !== targetId) {
      this.child.dropChange(d, targetId);
      this.dropChange(d, targetId);
    }
    //  d != targetId && setTimeout(() => {
    //    typeof this.props.dropChange == 'function'
    //      && this.props.dropChange(d, targetId);
    //  }, 0);
  };
  newdrop = (event_) => {
    console.log(event_);
    let d = event_.dataTransfer.getData("text"),
      target = event_.target,
      targetId = event_.target.id;
    console.log(event_, target, targetId, d);
    const newTarget = targetId.split("-");
    const newId = targetId.split("-");
    console.log(newTarget, newId, "new");
    if (newTarget[0] !== newId[0]) {
      return message.error(
        trans("teacherPreview.sameQuestionTypeMoveOnly", "请在相同体型内移动"),
      );
    }
    target.style.opacity = 1;
    target.style.backgroundColor = "#fff";
    if (d !== targetId) {
      this.child.dropChange(d, targetId);
      this.dropChange(d, targetId);
    }
    //  d != targetId && setTimeout(() => {
    //    typeof this.props.dropChange == 'function'
    //      && this.props.dropChange(d, targetId);
    //  }, 0);
  };
  dropChange = (sourceKey, targetKey) => {
    let source = Number.parseInt(sourceKey, 10);
    let target = Number.parseInt(targetKey, 10);
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    sourceKey < targetKey && targetKey++;
    fileList.splice(source, 0, ...fileList.splice(target, 1));
    console.log(fileList, "ff");
    this.setState({
      detaiList: fileList,
    });
    this.props.dispatch({
      type: "home/changeDrop",
      payload: fileList,
    });
  };
  dropQuestionChange = (index, sourceKey, targetKey) => {
    let newIndex = Number.parseInt(index, 10);
    let source = Number.parseInt(sourceKey, 10);
    let target = Number.parseInt(targetKey, 10);
    console.log(source, target, "lll");
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    let newList = fileList[index].questionList;
    sourceKey < targetKey && targetKey++;
    newList.splice(source, 0, ...newList.splice(target, 1));
    fileList[newIndex].questionList = newList;
    this.setState({
      detaiList: fileList,
    });
    console.log(fileList, "kkk");
    this.props.dispatch({
      type: "home/changeDrop",
      payload: fileList,
    });
  };
  renderCount = () => {
    const { detaiList } = this.state;
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
    count = newList.length;
    return count;
  };
  renderNoAnswer = () => {
    const { detaiList } = this.state;
    let newList = [];
    let count = 0;
    if (detaiList && detaiList.length > 0) {
      detaiList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            switch (it.type) {
              case 3: {
                if (
                  it.studentGapFillingAnswer &&
                  it.studentGapFillingAnswer.length > 0
                ) {
                  let ifCount = true;
                  it.studentGapFillingAnswer.map((index) => {
                    if (!index || index === "") {
                      ifCount = false;
                      return;
                    }
                  });
                  if (!ifCount) {
                    count += 1;
                  }
                } else {
                  count += 1;
                }

                break;
              }
              case 5: {
                if (!it.studentAnswer || it.studentAnswer === "") {
                  count += 1;
                }

                break;
              }
              case 4: {
                if (
                  it.studentAnswer === null ||
                  it.studentAnswer === undefined
                ) {
                  count += 1;
                }

                break;
              }
              default: {
                if (!it.studentAnswer || it.studentAnswer === "") {
                  count += 1;
                }
              }
            }
          });
        }
      });
    }
    return count;
  };
  checkQuestion = (id) => {
    this.setState({
      checkQuestionId: id,
    });
  };
  renderTotal = () => {
    let list = JSON.parse(JSON.stringify(this.state.detaiList));
    let view = Object.assign({}, this.state.viewData);
    console.log("11112");
    let count = 0;
    if (list && list.length > 0) {
      list.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((index) => {
            count += index.score
              ? typeof index.score === "string"
                ? Number.parseInt(index.score, 10)
                : index.scroe
              : 0;
          });
        }
      });
    }
    view.totalScore = count;
    this.setState({
      viewData: view,
    });
  };
  submit = () => {
    // const num = this.renderNoAnswer();
    // if(num > 0) {
    //   this.setState({
    //     isVisible: true,
    //   })
    // } else {
    //   this.sureSubmit();
    // }
    this.setState({
      isVisible: true,
    });
  };
  sureSubmit = () => {
    if (!this.canSubmit) {
      return;
    }
    this.canSubmit = false;
    let pay = {};
    pay.paperId = this.testId;
    let tcExamQuestionAnswerModels = [];
    if (this.state.detaiList && this.state.detaiList.length > 0) {
      this.state.detaiList.map((item) => {
        if (item.questionList && item.questionList) {
          item.questionList.map((index_, index) => {
            if (index_.type === 3) {
              console.log(index_, "nnb");
              tcExamQuestionAnswerModels.push({
                questionBankId: index_.questionId,
                studentGapFillingAnswer: index_.studentGapFillingAnswer,
              });
            } else {
              console.log(index_.studentAnswer, "ansa");
              tcExamQuestionAnswerModels.push({
                questionBankId: index_.questionId,
                answer: index_.studentAnswer,
              });
            }
          });
        }
      });
    }
    pay.tcExamQuestionAnswerModels = tcExamQuestionAnswerModels;
    console.log(pay, "pp");
    this.props
      .dispatch({
        type: "home/stuSubmit",
        payload: {
          ...pay,
        },
      })
      .then(() => {
        if (window.yg) {
          setupWKWebViewJavascriptBridge(function (bridge) {
            console.log(bridge.callHandler);
            bridge.callHandler("confirmAction", {});
          });
        }
        this.setState({
          isVisible: false,
        });
        this.canSubmit = true;
        this.props
          .dispatch({
            type: "home/getStudentScore",
            payload: {
              examId: this.testId,
            },
          })
          .then(() => {
            this.setState(
              {
                showTest: true,
                detaiList:
                  this.props.studentTest.examPaperDetailResponse.moduleList ||
                  [],
                viewData: this.props.studentTest.examPaperDetailResponse,
                checkQuestionId:
                  this.props.studentTest.examPaperDetailResponse.moduleList[0]
                    .questionList[0].questionId,
              },
              () => {
                this.scrollView(this.state.checkQuestionId);
                this.child.setList(this.state.detaiList);
              },
            );
          });
      });
  };
  back = () => {
    console.log(this.props, "11");
    const that = this;
    this.props.dispatch({
      type: "home/clearStu",
    });
    if (window.yg && !this.ifAna) {
      setupWKWebViewJavascriptBridge(function (bridge) {
        bridge.callHandler("backAction", {
          path: that.props.history.location.pathName,
        });
      });
    } else {
      this.props.history.goBack();
    }
  };
  showNum = () => {
    this.setState(
      {
        showNum: true,
      },
      () => {
        this.changeNum();
      },
    );
  };
  changeNum = () => {
    if (this.state.num > 1) {
      setTimeout(() => {
        this.setState(
          {
            num: this.state.num - 1,
          },
          () => {
            this.changeNum();
          },
        );
      }, 1000);
    } else {
      setTimeout(() => {
        this.setState({
          showTest: true,
        });
        this.props.dispatch({
          type: "home/startExam",
          payload: {
            paperId: this.testId,
            taskPublishId: this.id,
          },
        });
      }, 1000);
    }
  };
  scrollView = (id) => {
    const ele = document.getElementById(`question${id}`);
    ele && ele.scrollIntoView({ behavior: "smooth", block: "center" });
    this.setState({
      checkQuestionId: id,
    });
  };
  modalCancel = () => {
    this.setState({
      isVisible: false,
      isNoAnswer: true,
    });
  };
  linkT = () => {
    window.location.href = `${window.location.origin}/#/examAnalysis`;
  };
  renderNumber = (id) => {
    const { detaiList } = this.state;
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
  uploadOnChange = (info) => {
    let file = info.file;
    let { fileList } = this.state;
    if (file.status === "uploading") {
      // let index = this.haveId(file.uid, fileList);
      // if (index > -1) {
      //   //数组中包含id
      //   file.fileName = file.name;
      //   fileList[index] = file;
      // } else {
      //   file.fileName = file.name;
      //   fileList.push(file);
      // }
      // this.fileChange(fileList);
      // this.props.holdback(false)
    }
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      //   let newList = [];
      //   newList = file.response.content;
      let newList = JSON.parse(JSON.stringify(this.state.fileList));
      newList.push(file.response.content[0]);
      this.setState(
        {
          fileList: newList,
        },
        () => {
          let fileList = [];
          if (this.state.fileList && this.state.fileList.length > 0) {
            this.state.fileList.map((item) => {
              fileList.push(item.fileId);
            });
          }
          this.props.dispatch({
            type: "home/upStuFile",
            payload: {
              examPaperId: this.testId,
              studentId: this.props.currentUser.userId || null,
              sourceType: 0,
              fileList,
            },
            onSuccess: () => {
              // const { getData } = this.props;
              // typeof getData == "function" && getData.call(this, this.state.pageNumber, this.state.pageSize);
              this.props
                .dispatch({
                  type: "home/getStudentScore",
                  payload: {
                    examId: this.testId,
                  },
                })
                .then(() => {
                  this.setState({
                    showTest: true,
                    detaiList:
                      this.props.studentTest.examPaperDetailResponse
                        .moduleList || [],
                    viewData: this.props.studentTest.examPaperDetailResponse,
                    fileList:
                      this.props.studentTest.examPaperDetailResponse.fileList ||
                      [],
                  });
                });
            },
          });
        },
      );
      return;
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} ${file.response.message}`);
      window._czc &&
        window._czc.push([
          "_trackEvent",
          "上传附件",
          "添加附件",
          info.file.name,
        ]);
    }
  };
  renderScore = (index) => {
    const { detaiList } = this.state;
    let score = 0;
    if (
      detaiList &&
      detaiList.length > 0 &&
      detaiList[index] &&
      detaiList[index].questionList.length > 0
    ) {
      detaiList[index].questionList.map((item) => {
        if (item.answer && item.answer === item.studentAnswer) {
          score +=
            typeof item.questionScore == "string"
              ? Number.parseInt(item.questionScore, 10)
              : item.questionScore;
        }
      });
    }
    return score;
  };
  cancelFile = (item) => {
    let newList = [];
    if (this.state.fileList && this.state.fileList.length > 0) {
      this.state.fileList.map((it) => {
        if (it.url !== item.url) {
          newList.push(it);
        }
      });
    }
    this.setState(
      {
        fileList: newList,
      },
      () => {
        let fileList = [];
        if (this.state.fileList && this.state.fileList.length > 0) {
          this.state.fileList.map((item) => {
            fileList.push(item.fileId);
          });
        }
        console.log(this.props.currentUser, "111222");
        this.props.dispatch({
          type: "home/upStuFile",
          payload: {
            examPaperId: this.testId,
            studentId: this.props.currentUser.userId || null,
            sourceType: 0,
            fileList: fileList,
          },
          onSuccess: () => {
            this.props
              .dispatch({
                type: "home/getStudentScore",
                payload: {
                  examId: this.testId,
                },
              })
              .then(() => {
                this.setState({
                  showTest: true,
                  detaiList:
                    this.props.studentTest.examPaperDetailResponse.moduleList ||
                    [],
                  viewData: this.props.studentTest.examPaperDetailResponse,
                  fileList:
                    this.props.studentTest.examPaperDetailResponse.fileList ||
                    [],
                });
              });
          },
        });
      },
    );
  };
  ifAns = (it) => {
    let count = false;
    switch (it.type) {
      case 3: {
        if (
          it.studentGapFillingAnswer &&
          it.studentGapFillingAnswer.length > 0
        ) {
          let ifCount = true;
          it.studentGapFillingAnswer.map((index) => {
            if (!index || index === "") {
              ifCount = false;
              return;
            }
          });
          if (ifCount) {
            count = true;
          }
        } else {
          count = false;
        }

        break;
      }
      case 5: {
        count = !it.studentAnswer || it.studentAnswer === "" ? false : true;

        break;
      }
      case 4: {
        count =
          it.studentAnswer === null || it.studentAnswer === undefined
            ? false
            : true;

        break;
      }
      default: {
        count = !it.studentAnswer || it.studentAnswer === "" ? false : true;
      }
    }
    return count;
  };
  beforeUpload = (maxSize, file) => {
    if (file.size / 1024 / 1024 <= maxSize) {
      return true;
    } else {
      message.info(trans("global.fileLarge", "上传文件过大！"));
      return false;
    }
  };
  scrollDelete = () => {
    const ele = document.querySelector("#deleteBox");
    ele.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  render() {
    const { detaiList, viewData, checkQuestionId } = this.state;
    console.log(detaiList, viewData, "1112");
    console.log(this.props.studentTest, "ss");
    const uploadProperties = {
      name: "file",
      action: "/api/upload_file",
      multiple: true,
      accept: "image/*",
      showUploadList: false,
      headers: {
        authorization: "authorization-text",
      },
      beforeUpload: this.beforeUpload.bind(this, 10),
    };
    return (
      <div className={styles.detailBox}>
        <div className={styles.header}>
          <div
            className={[styles.iconfont, styles.closeIcon].join(" ")}
            onClick={this.back}
          >
            &#xe6ff;
          </div>
          <div className={[styles.iconfont, styles.viewTitle].join(" ")}>
            {viewData && viewData.title ? (
              <div className={styles.title}>{viewData.title}</div>
            ) : null}
            {viewData && viewData.title ? (
              <div className={styles.headerMessage}>
                <span className={styles.message}>
                  <i className={styles.iconfont}>&#xe624;</i>
                  {trans("global.classTest", "课堂小测")}
                </span>
                <span className={styles.message}>
                  <i className={styles.iconfont}>&#xe624;</i>
                  {trans("global.manfen", "满分")}
                  {viewData.totalScore}
                </span>
                <span className={styles.message}>
                  <i className={styles.iconfont}>&#xe798;</i>
                  {viewData.gradeName}-{viewData.subjectName}
                </span>
                <span className={styles.message}>
                  <i className={styles.iconfont}>&#xe61f;</i>
                  {viewData.createDate}
                </span>
              </div>
            ) : null}
          </div>
        </div>
        {
          <div className={styles.detailContent}>
            <div className={styles.contentLeft}>
              {/* <div className={styles.testName}>
              <div className={styles.testNameLeft}>{trans('detai.test', '课堂小测')}</div>
              <div className={styles.testNameRight}>
                {
                  !this.state.ifEdit ?
                  <h2>{this.props.viewData.title}</h2> :
                  <Input placeholder={trans('detail.enterName', '请输入标题（必填）')} value={this.state.testName} onChange={this.changeTestName}/>
                }
              </div>
            </div> */}
              <div className={styles.testList}>
                <h2>{viewData.title}</h2>
                {viewData &&
                viewData.moduleList &&
                viewData.moduleList.length > 0 ? (
                  <DetailView
                    detailList={viewData.moduleList}
                    onRef={this.onRef}
                    updateDeleteList={this.updateDeleteList}
                    updateList={this.updateList}
                    ifStu={true}
                    ifTest={false}
                    ifEdit={false}
                    fromWork={true}
                    dropQuestionChange={this.dropQuestionChange}
                    checkQuestion={this.checkQuestion}
                    checkQuestionId={checkQuestionId}
                  />
                ) : null}
              </div>
            </div>
            <div className={styles.contentRight}>
              {this.props.testStatus ? (
                <div className={styles.contentRightMessage}>
                  <div className={styles.score}>
                    <span className={styles.title}>
                      {trans("global.score", "分数")}
                    </span>
                    <div>
                      <span className={styles.stuScore}>
                        <i className={styles.iconfont}>&#xe634;</i>
                        {this.props.studentTest.studentScore}(
                        {trans("global.yourScore", "得分")})
                      </span>
                      <span>/</span>
                      <span className={styles.fullScore}>
                        {this.state.viewData.totalScore}(
                        {trans("global.zongfen", "总分")})
                      </span>
                    </div>
                  </div>
                  <div className={styles.testMessage}>
                    <div
                      className={[styles.messageBox, styles.useTime].join(" ")}
                    >
                      <div className={styles.explain}>
                        {trans("global.useTime", "用时")}
                      </div>
                      <div className={styles.time}>
                        {this.props.studentTest.answerTime}
                        <span className={styles.timeMessage}>min</span>
                      </div>
                    </div>
                    <span className={styles.rightSpan}></span>
                    <div
                      className={[styles.messageBox, styles.rightNum].join(" ")}
                    >
                      <div className={styles.explain}>
                        {trans("global.correctQuestionNum", "正确题数")}
                      </div>
                      <div className={styles.time}>
                        <span className={styles.right}>
                          {this.props.studentTest.correctQuestionNum}
                        </span>
                        /{this.props.studentTest.totalQuestionNum}
                      </div>
                    </div>
                    <span className={styles.rightSpan}></span>
                    <div
                      className={[styles.messageBox, styles.errorNum].join(" ")}
                    >
                      <div className={styles.explain}>
                        {trans("global.errorQuestionNum", "错误题数")}
                      </div>
                      <div className={styles.time}>
                        <span className={styles.error}>
                          {this.props.studentTest.errorQuestionNum}
                        </span>
                        /{this.props.studentTest.totalQuestionNum}
                      </div>
                    </div>
                    <span className={styles.rightSpan}></span>
                    <div
                      className={[styles.messageBox, styles.noQuestionNum].join(
                        " ",
                      )}
                    >
                      <div className={styles.explain}>
                        {trans("global.noQuestionNum", "未答题数")}
                      </div>
                      <div className={styles.time}>
                        <span className={styles.error}>
                          {this.props.studentTest.noAnswerQuestionNum}
                        </span>
                        /{this.props.studentTest.totalQuestionNum}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className={styles.contentRightOption}>
                <div className={styles.optionTitleBox}>
                  <div className={styles.optionTitleLeft}>
                    {trans("detail.questionList", "题目列表")}
                  </div>
                </div>
                {detaiList && detaiList.length > 0
                  ? detaiList.map((item, index) => (
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
                                {this.renderScore(index)}
                              </span>
                              {trans("global.point", "分")}
                            </div>
                          ) : null}
                        </div>
                        <div className={styles.moveListContent}>
                          {this.props.testStatus
                            ? item.questionList && item.questionList.length > 0
                              ? item.questionList.map((it, ind) => (
                                  <div
                                    className={styles.optionBox}
                                    style={
                                      it.isCorrect
                                        ? checkQuestionId &&
                                          checkQuestionId === it.questionId
                                          ? {
                                              background:
                                                "rgba(103,178,81,0.08)",
                                              border: "1px solid #57a641",
                                            }
                                          : {
                                              background:
                                                "rgba(103,178,81,0.08)",
                                            }
                                        : checkQuestionId === it.questionId
                                          ? {
                                              background:
                                                "rgba(229,73,46,0.10)",
                                              border:
                                                "1px solid rgba(229,73,46,1)",
                                            }
                                          : {
                                              background:
                                                "rgba(229,73,46,0.10)",
                                            }
                                    }
                                    onClick={this.scrollView.bind(
                                      this,
                                      it.questionId,
                                    )}
                                    key={ind}
                                  >
                                    {this.renderNumber(it.questionId)}
                                    {it.studentAnswer === it.answer ? (
                                      <i
                                        className={styles.iconfont}
                                        style={{ color: "#57a641" }}
                                      >
                                        &#xe6a8;
                                      </i>
                                    ) : (
                                      <i
                                        className={styles.iconfont}
                                        style={{ color: "#dd3821" }}
                                      >
                                        &#xe6a9;
                                      </i>
                                    )}
                                  </div>
                                ))
                              : null
                            : item.questionList && item.questionList.length > 0
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
                                        : this.ifAns(it)
                                          ? {
                                              border: "none",
                                              color: "rgba(4,69,252,0.75)",
                                              background: "rgba(4,69,252,0.05)",
                                            }
                                          : this.state.isNoAnswer
                                            ? {
                                                background:
                                                  "rgba(245,49,38,0.15)",
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
        }
      </div>
    );
  }
}

export default connect(({ home, studyPictures, global }) => ({
  studentTest: home.studentTest,
  testStatus: home.testStatus,
  startTime: home.startTime,
  currentUser: global.currentUser,
}))(StuWork);
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};

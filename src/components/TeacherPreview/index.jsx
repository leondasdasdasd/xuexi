import React, { Fragment, PureComponent } from "react";
import { Button, Icon, message, Popover } from "antd";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import continuity from "../../assets/矩形备份 4.png";
import singleQuestion from "../../assets/矩形备份 5.png";
import DetailView from "../../components/DetailView/index";
import NewRicherEditor from "../../components/NewRichEditor";
import { trans } from "../../utils/i18n";
import {
  convertToChineseNumber,
  setupWKWebViewJavascriptBridge,
} from "../../utils/utils";

import styles from "./index.module.less";

let sortList = {
  1: "STUDENT_NO",
  2: "STUDENT_NAME",
  3: "STUDENT_E_NAME",
  4: "SCORE",
  5: "SCORE",
};
class TeacherPreview extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp(
      "/teacherPreview/:examId/:ifFromTask/:paperId/:ifAna?",
    ).exec(this.url);
    // this.testId = JSON.parse(this.pathMatch[1]);
    // this.paperId = JSON.parse(this.pathMatch[1]);
    this.examId = JSON.parse(this.pathMatch[1]);
    this.ifTask = JSON.parse(this.pathMatch[2]);
    this.paperId = Number.parseInt(this.pathMatch[3], 10);
    ((this.ifAna = this.pathMatch[5] ? JSON.parse(this.pathMatch[4]) : false),
      (this.state = {
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
        answerMode: 1,
        newTestStatus: false,
        position: null,
      }));
    this.child = null;
    this.canSubmit = true;
    this.list = [];
  }
  componentDidMount() {
    let _this = this;
    // window.addEventListener('beforeunload', function (event) {
    //   if (!_this.state.newTestStatus && _this.state.showTest) {
    //     event.preventDefault()
    //     event.returnValue = '还未提交答卷，退出后当前的作答痕迹将不保留，确认要退出吗？';
    //     return '还未提交答卷，退出后当前的作答痕迹将不保留，确认要退出吗？';
    //   }
    // });
    console.log(this.url, this.pathMatch);
    if (this.ifTask) {
      this.props
        .dispatch({
          type: "home/getTestStatus",
          payload: {
            examId: this.examId,
          },
        })
        .then(() => {
          if (this.props.testStatus) {
            console.log("aaahhb");
            this.props
              .dispatch({
                type: "home/getEffectPreviewSubmit",
                payload: {
                  paperId: this.paperId,
                },
              })
              .then(() => {
                this.setState({
                  showTest: true,
                  detaiList:
                    this.props.newViewData.examPaperDetailResponse.moduleList ||
                    [],
                  viewData: this.props.newViewData.examPaperDetailResponse,
                  fileList:
                    this.props.newViewData.examPaperDetailResponse.fileList ||
                    [],
                });
              });
          } else {
            console.log("bbbhhb");
            this.props
              .dispatch({
                type: "home/getTestView",
                payload: {
                  paperId: this.paperId,
                  save: true,
                },
              })
              .then(() => {
                // 如果本地存储有当钱测验作答缓存则直接使用缓存数据，如果没有则使用服务端测验数据
                let viewParameters = JSON.parse(
                  JSON.stringify(this.props.newViewData),
                );
                if (
                  localStorage.getItem("answerCache") &&
                  JSON.parse(localStorage.getItem("answerCache")).examId ==
                    this.examId
                ) {
                  viewParameters.moduleList = JSON.parse(
                    localStorage.getItem("answerCache"),
                  ).fileList;
                }

                this.setState({
                  detaiList: viewParameters.moduleList || [],
                  viewData: viewParameters,
                  checkQuestionId:
                    viewParameters && viewParameters?.moduleList
                      ? viewParameters.moduleList[0].questionList[0].questionId
                      : null,
                });
              });
          }
        });
    }
  }
  onRef = (reference) => {
    this.child = reference;
  };
  onRefPropositional = (reference) => {
    this.stuBraftEditor = reference;
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
                if (it.type == 6) {
                  if (it.sonQuestionList && it.sonQuestionList.length > 0) {
                    it.sonQuestionList.map((index) => {
                      switch (index.type) {
                        case 3: {
                          if (
                            index.studentGapFillingAnswer &&
                            index.studentGapFillingAnswer.length > 0
                          ) {
                            let ifCount = true;
                            index.studentGapFillingAnswer.map((index_) => {
                              if (!index_ || index_ === "") {
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
                          if (
                            !index.studentAnswer ||
                            index.studentAnswer === ""
                          ) {
                            count += 1;
                          }

                          break;
                        }
                        case 4: {
                          if (
                            index.studentAnswer === null ||
                            index.studentAnswer === undefined
                          ) {
                            count += 1;
                          }

                          break;
                        }
                        default: {
                          if (
                            !index.studentAnswer ||
                            index.studentAnswer === ""
                          ) {
                            count += 1;
                          }
                        }
                      }
                    });
                  }
                } else {
                  if (!it.studentAnswer || it.studentAnswer === "") {
                    count += 1;
                  }
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
  sureSubmit = (type) => {
    if (!this.canSubmit) {
      return;
    }
    this.canSubmit = false;
    let pay = {};
    pay.paperId = this.paperId;
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
            } else if (index_.type == 6) {
              if (index_.sonQuestionList && index_.sonQuestionList.length > 0) {
                let list = [];
                index_.sonQuestionList.map((it) => {
                  if (it.type === 3) {
                    console.log(index_, "nnb");
                    list.push({
                      questionBankId: it.questionId,
                      studentGapFillingAnswer: it.studentGapFillingAnswer,
                    });
                  } else {
                    list.push({
                      questionBankId: it.questionId,
                      answer: it.studentAnswer,
                    });
                  }
                });
                tcExamQuestionAnswerModels.push({
                  questionBankId: index_.questionId,
                  sonQuestionAnswers: list,
                });
              }
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
        type: "home/getEffectPreviewSubmit",
        payload: {
          ...pay,
          type: type,
          redisKey: this.props.newViewData.redisKey,
        },
      })
      .then(() => {
        if (window.yg) {
          setupWKWebViewJavascriptBridge(function (bridge) {
            bridge.callHandler("confirmAction", { path: "" });
          });
        }
        this.canSubmit = true;
        this.setState(
          {
            isVisible: false,
            newTestStatus: true,
            showTest: true,
            answerMode: 1,
            detaiList:
              this.props.newViewData.examPaperDetailResponse.moduleList || [],
            viewData: this.props.newViewData.examPaperDetailResponse,
            checkQuestionId:
              this.props.newViewData.examPaperDetailResponse.moduleList[0]
                .questionList[0].questionId,
          },
          () => {
            this.scrollView(this.state.checkQuestionId);
            this.child && this.child.setList(this.state.detaiList);
          },
        );
        // });
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
  renderNumber = (id, inde, ind) => {
    const { detaiList } = this.state;
    let newList = [];
    let count = 0;
    if (detaiList && detaiList.length > 0) {
      detaiList.map((item, ii) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it, iit) => {
            newList.push(`${it.questionId}${ii}${iit}`);
          });
        }
      });
    }
    if (newList.length > 0) {
      newList.map((item, index) => {
        if (`${id}${inde}${ind}` === item) {
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
              examId: this.examId,
              studentId: this.props.currentUser.userId || null,
              sourceType: 0,
              fileList,
            },
            onSuccess: () => {
              // const { getData } = this.props;
              // typeof getData == "function" && getData.call(this, this.state.pageNumber, this.state.pageSize);
              this.props
                .dispatch({
                  type: "home/getEffectPreviewSubmit",
                  payload: {
                    paperId: this.paperId,
                  },
                })
                .then(() => {
                  this.setState({
                    showTest: true,
                    detaiList:
                      this.props.newViewData.examPaperDetailResponse
                        .moduleList || [],
                    viewData: this.props.newViewData.examPaperDetailResponse,
                    fileList:
                      this.props.newViewData.examPaperDetailResponse.fileList ||
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
        if (item.isCorrect) {
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
            examId: this.examId,
            studentId: this.props.currentUser.userId || null,
            sourceType: 0,
            fileList: fileList,
          },
          onSuccess: () => {
            this.props
              .dispatch({
                type: "home/getEffectPreviewSubmit",
                payload: {
                  paperId: this.paperId,
                },
              })
              .then(() => {
                this.setState({
                  showTest: true,
                  detaiList:
                    this.props.newViewData.examPaperDetailResponse.moduleList ||
                    [],
                  viewData: this.props.newViewData.examPaperDetailResponse,
                  fileList:
                    this.props.newViewData.examPaperDetailResponse.fileList ||
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
      case 6: {
        let newCount = true;
        if (it.sonQuestionList && it.sonQuestionList.length > 0) {
          it.sonQuestionList.map((ii) => {
            switch (ii.type) {
              case 3: {
                if (
                  ii.studentGapFillingAnswer &&
                  ii.studentGapFillingAnswer.length > 0
                ) {
                  ii.studentGapFillingAnswer.map((index) => {
                    if (!index || index === "") {
                      newCount = false;
                    }
                  });
                } else {
                  newCount = false;
                }

                break;
              }
              case 5: {
                if (!ii.studentAnswer || ii.studentAnswer === "") {
                  newCount = false;
                }

                break;
              }
              case 4: {
                if (
                  ii.studentAnswer === null ||
                  ii.studentAnswer === undefined
                ) {
                  newCount = false;
                }

                break;
              }
              default: {
                if (!ii.studentAnswer || ii.studentAnswer === "") {
                  newCount = false;
                }
              }
            }
          });
        }
        count = newCount;

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

  clickPreviousQuestion = () => {
    const { checkQuestionId } = this.state;
    let number_ = null;
    this.list &&
      this.list.length > 0 &&
      this.list.map((item, index) => {
        if (item.questionId == checkQuestionId) {
          number_ = index;
        }
      });
    if (number_ == 0) {
      this.setState({
        position: number_ - 2,
      });
      message.warning(
        trans("teacherPreview.alreadyFirstQuestion", "当前已经是第一题"),
      );
    } else {
      this.setState({
        checkQuestionId: this.list[number_ - 1].questionId,
        position: number_ - 2,
      });
    }
  };

  clickNextQuestion = () => {
    const { checkQuestionId } = this.state;
    let number_ = null;
    this.list &&
      this.list.length > 0 &&
      this.list.map((item, index) => {
        if (item.questionId == checkQuestionId) {
          number_ = index;
        }
      });
    if (number_ == this.list.length - 1) {
      this.setState({
        position: number_,
      });
      message.warning(
        trans("teacherPreview.alreadyLastQuestion", "当前已经是最后一题"),
      );
    } else {
      this.setState({
        checkQuestionId: this.list[number_ + 1].questionId,
        position: number_,
      });
    }
  };

  RadioChange = (id, index) => {
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              it.studentAnswer = it.studentAnswer === index ? null : index;
            }
          });
        }
      });
    }

    this.child && this.child.listChange(fileList);
    this.updateList(fileList);
  };

  radioChildChange = (id, index) => {
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((iit) => {
                if (iit.questionId === id) {
                  iit.studentAnswer =
                    iit.studentAnswer === index ? null : index;
                }
              });
            }
          });
        }
      });
    }
    this.child && this.child.listChange(fileList);
    this.updateList(fileList);
  };

  checkChange = (id, index) => {
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              if (it.studentAnswer && it.studentAnswer.includes(index)) {
                const reg = new RegExp(index);
                const string_ = it.studentAnswer.replace(reg, "");
                it.studentAnswer = string_;
              } else {
                if (it.studentAnswer) {
                  it.studentAnswer += index;
                } else {
                  it.studentAnswer = index;
                }
              }
            }
          });
        }
      });
    }
    // this.setState({
    //   list: fileList,
    // });
    this.child && this.child.listChange(fileList);
    this.updateList(fileList);
  };

  checkChildChange = (id, index) => {
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((ii) => {
                if (ii.questionId === id) {
                  if (ii.studentAnswer && ii.studentAnswer.includes(index)) {
                    const reg = new RegExp(index);
                    const string_ = ii.studentAnswer.replace(reg, "");
                    ii.studentAnswer = string_;
                  } else {
                    if (ii.studentAnswer) {
                      ii.studentAnswer += index;
                    } else {
                      ii.studentAnswer = index;
                    }
                  }
                }
              });
            }
          });
        }
      });
      this.child && this.child.listChange(fileList);
      this.updateList(fileList);
    }
  };

  changeJudge = (id, judge) => {
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              it.studentAnswer = judge;
            }
          });
        }
      });
    }
    this.child && this.child.listChange(fileList);
    this.updateList(fileList);
  };

  changeChildJudge = (id, judge) => {
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((ii) => {
                if (ii.questionId === id) {
                  ii.studentAnswer = judge;
                }
              });
            }
          });
        }
      });
    }
    this.child && this.child.listChange(fileList);
    this.updateList(fileList);
  };

  changeCompletion = (id, index, e) => {
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              it.studentGapFillingAnswer[index] = e.target.value;
            }
          });
        }
      });
    }
    this.child && this.child.listChange(fileList);
    this.updateList(fileList);
  };

  changeChildCompletion = (id, index, e) => {
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((ii) => {
                if (ii.questionId === id) {
                  ii.studentGapFillingAnswer[index] = e.target.value;
                }
              });
            }
          });
        }
      });
    }
    this.child && this.child.listChange(fileList);
    this.updateList(fileList);
  };

  changeText = (e, id) => {
    console.log(e, "eee");
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.questionId === id) {
              it.studentAnswer = e;
            }
          });
        }
      });
    }
    this.child && this.child.listChange(fileList);
    console.log(this.child, "sds");
    this.updateList(fileList);
  };

  changeChildText = (e, id) => {
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (fileList && fileList.length > 0) {
      fileList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((ii) => {
                if (ii.questionId === id) {
                  ii.studentAnswer = e;
                }
              });
            }
          });
        }
      });
    }

    this.child && this.child.listChange(fileList);
    this.updateList(fileList);
  };

  renderTopic = () => {
    const { viewData, checkQuestionId, detaiList, position } = this.state;
    console.log(position, detaiList, "zzz");
    let array = [];
    detaiList &&
      detaiList.length > 0 &&
      detaiList.map((item, index) => {
        if (item.moduleType == 1 || item.moduleType == 2) {
          item.questionList &&
            item.questionList.length > 0 &&
            item.questionList.map((it) => {
              array.push({
                analysis: it.analysis,
                answer: it.answer,
                content: it.content,
                gapFillingAnswer: it.gapFillingAnswer,
                optionList: it.optionList,
                questionId: it.questionId,
                questionLevel: it.questionLevel,
                questionLevelName: it.questionLevelName,
                questionScore: it.questionScore,
                questionSerialNumber: it.questionSerialNumber,
                studentAnswer: it.studentAnswer,
                type: it.type,
                moduleName: item.moduleName,
                moduleQuestionNumber: item.moduleQuestionNumber,
                moduleScore: item.moduleScore,
                moduleType: item.moduleType,
                questionNo: convertToChineseNumber(index + 1),
              });
            });
        } else if (item.moduleType == 3) {
          item.questionList &&
            item.questionList.length > 0 &&
            item.questionList.map((it) => {
              array.push({
                analysis: it.analysis,
                answer: it.answer,
                content: it.content,
                gapFillingAnswer: it.gapFillingAnswer,
                isCorrect: it.isCorrect,
                isShow: it.isShow,
                questionId: it.questionId,
                questionLevel: it.questionLevel,
                questionLevelName: it.questionLevelName,
                questionScore: it.questionScore,
                questionSerialNumber: it.questionSerialNumber,
                type: it.type,
                moduleName: item.moduleName,
                moduleQuestionNumber: item.moduleQuestionNumber,
                moduleScore: item.moduleScore,
                moduleType: item.moduleType,
                studentGapFillingAnswer: it.studentGapFillingAnswer,
                studentAnswer: it.studentAnswer,
                questionNo: convertToChineseNumber(index + 1),
              });
            });
        } else if (item.moduleType == 4) {
          item.questionList &&
            item.questionList.length > 0 &&
            item.questionList.map((it) => {
              array.push({
                analysis: it.analysis,
                answer: it.answer,
                content: it.content,
                questionId: it.questionId,
                questionLevel: it.questionLevel,
                questionLevelName: it.questionLevelName,
                questionScore: it.questionScore,
                questionSerialNumber: it.questionSerialNumber,
                studentAnswer: it.studentAnswer,
                type: it.type,
                moduleName: item.moduleName,
                moduleQuestionNumber: item.moduleQuestionNumber,
                moduleScore: item.moduleScore,
                moduleType: item.moduleType,
                questionNo: convertToChineseNumber(index + 1),
              });
            });
        } else if (item.moduleType == 5) {
          item.questionList &&
            item.questionList.length > 0 &&
            item.questionList.map((it) => {
              array.push({
                analysis: it.analysis,
                answer: it.answer,
                content: it.content,
                questionId: it.questionId,
                questionLevel: it.questionLevel,
                questionLevelName: it.questionLevelName,
                questionScore: it.questionScore,
                questionSerialNumber: it.questionSerialNumber,
                studentAnswer: it.studentAnswer,
                type: it.type,
                moduleName: item.moduleName,
                moduleQuestionNumber: item.moduleQuestionNumber,
                moduleScore: item.moduleScore,
                moduleType: item.moduleType,
                questionNo: convertToChineseNumber(index + 1),
              });
            });
        } else if (item.moduleType == 0) {
          item.questionList &&
            item.questionList.length > 0 &&
            item.questionList.map((it, ind) => {
              if (it.type == 1 || it.type == 2) {
                array.push({
                  analysis: it.analysis,
                  answer: it.answer,
                  content: it.content,
                  gapFillingAnswer: it.gapFillingAnswer,
                  optionList: it.optionList,
                  questionId: it.questionId,
                  questionLevel: it.questionLevel,
                  questionLevelName: it.questionLevelName,
                  questionScore: it.questionScore,
                  questionSerialNumber: it.questionSerialNumber,
                  studentAnswer: it.studentAnswer,
                  type: it.type,
                  moduleName: item.moduleName,
                  moduleQuestionNumber: item.moduleQuestionNumber,
                  moduleScore: item.moduleScore,
                  moduleType: it.type,
                  questionNo: convertToChineseNumber(index + 1),
                });
              } else if (it.type == 3) {
                array.push({
                  analysis: it.analysis,
                  answer: it.answer,
                  content: it.content,
                  gapFillingAnswer: it.gapFillingAnswer,
                  isCorrect: it.isCorrect,
                  isShow: it.isShow,
                  questionId: it.questionId,
                  questionLevel: it.questionLevel,
                  questionLevelName: it.questionLevelName,
                  questionScore: it.questionScore,
                  questionSerialNumber: it.questionSerialNumber,
                  type: it.type,
                  moduleName: item.moduleName,
                  moduleQuestionNumber: item.moduleQuestionNumber,
                  moduleScore: item.moduleScore,
                  moduleType: it.type,
                  studentGapFillingAnswer: it.studentGapFillingAnswer,
                  studentAnswer: it.studentAnswer,
                  questionNo: convertToChineseNumber(index + 1),
                });
              } else if (it.type == 4) {
                array.push({
                  analysis: it.analysis,
                  answer: it.answer,
                  content: it.content,
                  questionId: it.questionId,
                  questionLevel: it.questionLevel,
                  questionLevelName: it.questionLevelName,
                  questionScore: it.questionScore,
                  questionSerialNumber: it.questionSerialNumber,
                  studentAnswer: it.studentAnswer,
                  type: it.type,
                  moduleName: item.moduleName,
                  moduleQuestionNumber: item.moduleQuestionNumber,
                  moduleScore: item.moduleScore,
                  moduleType: it.type,
                  questionNo: convertToChineseNumber(index + 1),
                });
              } else if (it.type == 5) {
                array.push({
                  analysis: it.analysis,
                  answer: it.answer,
                  content: it.content,
                  questionId: it.questionId,
                  questionLevel: it.questionLevel,
                  questionLevelName: it.questionLevelName,
                  questionScore: it.questionScore,
                  questionSerialNumber: it.questionSerialNumber,
                  studentAnswer: it.studentAnswer,
                  type: it.type,
                  moduleName: item.moduleName,
                  moduleQuestionNumber: item.moduleQuestionNumber,
                  moduleScore: item.moduleScore,
                  moduleType: it.type,
                  questionNo: convertToChineseNumber(index + 1),
                });
              }
            });
        } else if (item.moduleType == 6) {
          for (const [index, it] of item.questionList.entries()) {
            array.push({
              ...it,
              questionNo: convertToChineseNumber(index + 1),
              moduleQuestionNumber: item.moduleQuestionNumber,
              moduleName: item.moduleName,
              moduleScore: item.moduleScore,
            });
          }
        }
      });
    console.log(array, "zwl");
    this.list = array;
    return (
      <>
        {array &&
          array.length > 0 &&
          array.map((item, index) => {
            if (item.questionId == checkQuestionId) {
              return (
                <div className={styles.singleAnswering}>
                  <p className={styles.Title}>
                    <span className={styles.bigQuestion}>
                      {item.questionNo}、{item.moduleName}
                    </span>{" "}
                    （
                    {trans("detail.num", "共{$num}题", {
                      num: item.moduleQuestionNumber,
                    })}
                    ，
                    {trans("detail.totalScore", "总分{$num}分", {
                      num: item.moduleScore,
                    })}
                    ）
                  </p>
                  <p className={styles.stemBox}>
                    <span>{index + 1}.</span>
                    <div
                      className={styles.questionContent}
                      style={{
                        display: "inline-block",
                        width: "96%",
                        verticalAlign: "text-top",
                      }}
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    ></div>
                  </p>
                  <div className={styles.stuAnswerBox}>
                    {item.moduleType === 1 || item.moduleType === 7 ? (
                      item.optionList &&
                      item.optionList.map((index_, newI) => (
                        <div
                          className={[
                            styles.optionList,
                            item.studentAnswer &&
                            item.studentAnswer == index_.key
                              ? styles.selectBlur
                              : "",
                          ].join(" ")}
                          style={{
                            cursor: "pointer",
                          }}
                          onClick={this.RadioChange.bind(
                            this,
                            item.questionId,
                            index_.key,
                          )}
                          key={newI}
                        >
                          <div className={styles.opListLeft}>
                            <i
                              className={[
                                styles.iconfont,
                                styles.optionIcon,
                              ].join(" ")}
                            >
                              &#xe6a8;
                            </i>
                          </div>
                          <div
                            className={styles.opListRight}
                            dangerouslySetInnerHTML={{
                              __html: index_.answers,
                            }}
                          ></div>
                        </div>
                      ))
                    ) : item.moduleType === 2 || item.moduleType === 8 ? (
                      item.optionList &&
                      item.optionList.map((index_, newI) => (
                        <div
                          className={[
                            styles.optionList,
                            item.studentAnswer &&
                            item.studentAnswer.includes(index_.key)
                              ? styles.selectBlur
                              : "",
                          ].join(" ")}
                          onClick={this.checkChange.bind(
                            this,
                            item.questionId,
                            index_.key,
                          )}
                          style={{
                            cursor: "pointer",
                          }}
                          key={newI}
                        >
                          <div className={styles.opListLeft}>
                            <i
                              className={[
                                styles.iconfont,
                                styles.optionIcon,
                              ].join(" ")}
                            >
                              &#xe6a8;
                            </i>
                          </div>
                          <div
                            className={styles.opListRight}
                            dangerouslySetInnerHTML={{
                              __html: index_.answers,
                            }}
                          ></div>
                        </div>
                      ))
                    ) : item.moduleType === 3 ? (
                      <div className={styles.optionBox}>
                        {item.studentGapFillingAnswer &&
                        item.studentGapFillingAnswer.length > 0
                          ? item.studentGapFillingAnswer.map((index_, op) => (
                              <input
                                className={styles.gapfilling}
                                value={index_}
                                onChange={this.changeCompletion.bind(
                                  this,
                                  item.questionId,
                                  op,
                                )}
                              />
                            ))
                          : null}
                      </div>
                    ) : item.moduleType === 4 ? (
                      <div>
                        <div className={styles.judgeBox}>
                          <div
                            className={[
                              styles.judgeSelect,
                              item.studentAnswer ? styles.selectJudge : "",
                            ].join(" ")}
                            onClick={this.changeJudge.bind(
                              this,
                              item.questionId,
                              true,
                            )}
                          >
                            <i
                              className={[
                                styles.iconfont,
                                styles.judgeIcon,
                              ].join(" ")}
                            >
                              &#xe804;
                            </i>
                            {trans("global.right", "正确")}
                          </div>
                          <div
                            className={[
                              styles.judgeSelect,
                              item.studentAnswer === false
                                ? styles.selectJudge
                                : "",
                            ].join(" ")}
                            onClick={this.changeJudge.bind(
                              this,
                              item.questionId,
                              false,
                            )}
                          >
                            <i
                              className={[
                                styles.iconfont,
                                styles.judgeIcon,
                              ].join(" ")}
                            >
                              &#xe803;
                            </i>
                            {trans("global.wrong", "错误")}
                          </div>
                        </div>
                      </div>
                    ) : item.moduleType === 5 ? (
                      <div>
                        <NewRicherEditor
                          dispatch={this.props.dispatch}
                          questionId={item.questionId}
                          // blue={true}
                          placeholder={trans(
                            "teacherPreview.answerPlaceholder",
                            "请填写答案",
                          )}
                          initContent={item.studentAnswer}
                          height={300}
                          updateEditorData={this.changeText}
                          needAutoSave={"no"}
                          onRefBraftEditor={this.onRefPropositional}
                          noBorder={false}
                          statusbar={false}
                        />
                      </div>
                    ) : item.type === 6 ? (
                      item.sonQuestionList.map((sonQuestion, inde) => (
                        <div>
                          <p className={styles.stemBox}>
                            <span>{sonQuestion.questionSerialNumber}</span>
                            <div
                              className={styles.questionContent}
                              style={{
                                display: "inline-block",
                                width: "96%",
                                verticalAlign: "text-top",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: sonQuestion.content,
                              }}
                            ></div>
                          </p>
                          {sonQuestion.type === 1 || sonQuestion.type === 7 ? (
                            sonQuestion.optionList &&
                            sonQuestion.optionList.map((option, newI) => (
                              <div
                                className={[
                                  styles.optionList,
                                  sonQuestion.studentAnswer &&
                                  sonQuestion.studentAnswer == option.key
                                    ? styles.selectBlur
                                    : "",
                                ].join(" ")}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  this.radioChildChange(
                                    sonQuestion.questionId,
                                    option.key,
                                  );
                                }}
                                key={newI}
                              >
                                <div className={styles.opListLeft}>
                                  <i
                                    className={`${styles.iconfont} ${styles.optionIcon}`}
                                  >
                                    &#xe6a8;
                                  </i>
                                </div>
                                <div
                                  className={styles.opListRight}
                                  dangerouslySetInnerHTML={{
                                    __html: option.answers,
                                  }}
                                ></div>
                              </div>
                            ))
                          ) : sonQuestion.type === 2 ||
                            sonQuestion.type === 8 ? (
                            sonQuestion.optionList &&
                            sonQuestion.optionList.map((option, newI) => (
                              <div
                                className={[
                                  styles.optionList,
                                  sonQuestion.studentAnswer &&
                                  sonQuestion.studentAnswer.includes(option.key)
                                    ? styles.selectBlur
                                    : "",
                                ].join(" ")}
                                onClick={() => {
                                  this.checkChildChange(
                                    sonQuestion.questionId,
                                    option.key,
                                  );
                                }}
                                style={{ cursor: "pointer" }}
                                key={newI}
                              >
                                <div className={styles.opListLeft}>
                                  <i
                                    className={`${styles.iconfont} ${styles.optionIcon}`}
                                  >
                                    &#xe6a8;
                                  </i>
                                </div>
                                <div
                                  className={styles.opListRight}
                                  dangerouslySetInnerHTML={{
                                    __html: option.answers,
                                  }}
                                ></div>
                              </div>
                            ))
                          ) : sonQuestion.type === 3 ? (
                            <div className={styles.optionBox}>
                              {sonQuestion.studentGapFillingAnswer &&
                              sonQuestion.studentGapFillingAnswer.length > 0
                                ? sonQuestion.studentGapFillingAnswer.map(
                                    (index_, op) => (
                                      <input
                                        className={styles.gapfilling}
                                        value={index_}
                                        onChange={(e) => {
                                          this.changeChildCompletion(
                                            sonQuestion.questionId,
                                            op,
                                            e,
                                          );
                                        }}
                                      />
                                    ),
                                  )
                                : null}
                            </div>
                          ) : sonQuestion.type === 4 ? (
                            <div>
                              <div className={styles.judgeBox}>
                                <div
                                  className={[
                                    styles.judgeSelect,
                                    sonQuestion.studentAnswer
                                      ? styles.selectJudge
                                      : "",
                                  ].join(" ")}
                                  onClick={this.changeChildJudge.bind(
                                    this,
                                    sonQuestion.questionId,
                                    true,
                                  )}
                                >
                                  <i
                                    className={`${styles.iconfont} ${styles.judgeIcon}`}
                                  >
                                    &#xe804;
                                  </i>
                                  {trans("global.right", "正确")}
                                </div>
                                <div
                                  className={[
                                    styles.judgeSelect,
                                    sonQuestion.studentAnswer === false
                                      ? styles.selectJudge
                                      : "",
                                  ].join(" ")}
                                  onClick={this.changeChildJudge.bind(
                                    this,
                                    sonQuestion.questionId,
                                    false,
                                  )}
                                >
                                  <i
                                    className={`${styles.iconfont} ${styles.judgeIcon}`}
                                  >
                                    &#xe803;
                                  </i>
                                  {trans("global.wrong", "错误")}
                                </div>
                              </div>
                            </div>
                          ) : sonQuestion.type === 5 ? (
                            <div>
                              <NewRicherEditor
                                dispatch={this.props.dispatch}
                                questionId={sonQuestion.questionId}
                                // blue={true}
                                placeholder={trans(
                                  "teacherPreview.answerPlaceholder",
                                  "请填写答案",
                                )}
                                initContent={sonQuestion.studentAnswer}
                                height={300}
                                updateEditorData={this.changeChildText}
                                needAutoSave={"no"}
                                onRefBraftEditor={this.onRefPropositional}
                                noBorder={false}
                                statusbar={false}
                              />
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>
              );
            }
          })}
      </>
    );
  };

  render() {
    const {
      deleteList,
      detaiList,
      viewData,
      checkQuestionId,
      answerMode,
      newTestStatus,
    } = this.state;
    const { studentTest, newViewData } = this.props;
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
            <div>
              {viewData && viewData.title ? (
                <span>
                  <span className={styles.title}>{viewData.title}</span>
                  {!newTestStatus && this.state.showTest ? (
                    <>
                      <i
                        className={styles.iconfont}
                        style={{
                          color: "#0445FC",
                          fontSize: "12px",
                          marginLeft: "13px",
                        }}
                      >
                        &#xf0ed;
                      </i>
                      {answerMode == 1 ? (
                        <span
                          className={styles.switchQuest}
                          onClick={() => this.setState({ answerMode: 2 })}
                        >
                          {trans("global.switchSingle", "切换成单题作答")}
                        </span>
                      ) : (
                        <span
                          className={styles.switchQuest}
                          onClick={() => this.setState({ answerMode: 1 })}
                        >
                          {trans("global.switchContinuously", "切换成连续作答")}
                        </span>
                      )}
                    </>
                  ) : null}
                </span>
              ) : null}
            </div>
            {viewData && viewData.title ? (
              <div className={styles.headerMessage}>
                <span className={styles.message}>
                  <i className={styles.iconfont}>&#xe624;</i>
                  {/* {trans("global.classTest", "课堂小测")} */}
                  {viewData.paperTypeName}
                </span>

                <span className={styles.message}>
                  <i className={styles.iconfont}>&#xe798;</i>
                  {viewData.gradeName}-{viewData.subjectName}
                </span>
                <span className={styles.message}>
                  <i className={styles.iconfont}>&#xe61f;</i>
                  {viewData.createDate}
                </span>
                {viewData && viewData.openScore ? (
                  <span className={styles.message}>
                    <i className={styles.iconfont}>&#xe872;</i>
                    {viewData.totalScore}
                    {trans("global.point", "分")}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          {!newTestStatus && this.state.showTest ? (
            <div className={styles.testHeaderRight}>
              <div
                className={styles.completeTest}
                onClick={this.submit}
                id="stuHead"
              >
                <Icon type="check-circle" style={{ marginRight: "6px" }} />
                {trans("global.completeTest", "完成答题")}
              </div>
              <Popover
                destroyTooltipOnHide={true}
                footer={null}
                content={
                  <div>
                    <div className={styles.sureTile}>
                      {trans("global.stuSureTitle", "你确定要完成答题吗？")}
                    </div>
                    {this.renderNoAnswer() ? (
                      <div className={styles.stuSubContent}>
                        {trans("global.youhave", "你有")}
                        <span className={styles.noAnswerNum}>
                          {this.renderNoAnswer()}
                        </span>
                        {trans(
                          "global.noAnsweMessage",
                          "道题没有填写答案，确定要提交吗？",
                        )}
                      </div>
                    ) : (
                      <div className={styles.stuSubContent}>
                        {trans(
                          "global.allAnsweMessage",
                          "你已完成了所有题目，确定要提交吗，提交后，不可再次考试",
                        )}
                      </div>
                    )}
                    <div className={styles.lineBox}>
                      {this.renderNoAnswer() ? (
                        <div>
                          <Button shape="round" onClick={this.modalCancel}>
                            {trans("global.cancle", "取消")}
                          </Button>
                          <Button
                            type="primary"
                            shape="round"
                            onClick={() => this.sureSubmit(0)}
                          >
                            {trans("global.sureSubmit", "确认提交")}
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <Button shape="round" onClick={this.modalCancel}>
                            {trans("global.cancle", "取消")}
                          </Button>
                          <Button
                            type="primary"
                            shape="round"
                            onClick={() => this.sureSubmit(0)}
                          >
                            {trans("global.sureSubmit", "确认提交")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                }
                getContainer={false}
                trigger="click"
                visible={this.state.isVisible}
                placement={"bottom"}
                getPopupContainer={() => document.querySelector(`#stuHead`)}
              ></Popover>
            </div>
          ) : null}
        </div>
        {this.state.showTest ? (
          <div className={styles.detailContent}>
            <div className={styles.contentLeft}>
              <div
                className={styles.testList}
                style={answerMode == 1 ? {} : { display: "none" }}
              >
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
                    ifTest={newTestStatus}
                    ifEdit={this.state.ifEdit}
                    isHidenKnowLedge={true}
                    dropQuestionChange={this.dropQuestionChange}
                    checkQuestion={this.checkQuestion}
                    checkQuestionId={checkQuestionId}
                    openScore={viewData.openScore}
                    isScore={true}
                    openAnswer={newViewData.openAnswer}
                    examId={this.examId}
                  />
                ) : null}
              </div>
              <div
                className={styles.oneTestBox}
                style={answerMode == 1 ? { display: "none" } : {}}
              >
                <div className={styles.stemBox}>{this.renderTopic()}</div>
                <div className={styles.cutTopic}>
                  <span
                    className={styles.previousQuestion}
                    onClick={this.clickPreviousQuestion}
                  >
                    <Icon type="arrow-left" />
                    {trans("data.previousQuestion", "上一题")}
                  </span>

                  {this.state.position == this.list.length - 2 ? null : (
                    <span
                      className={styles.nextQuestion}
                      onClick={this.clickNextQuestion}
                    >
                      {trans("data.nextQuestion", "下一题")}
                      <Icon type="arrow-right" />
                    </span>
                  )}
                </div>
              </div>

              {deleteList.length > 0 ? (
                <div className={styles.deleteList}>
                  <div className={styles.deletedTitle}>
                    {trans("detail.deleted", "已删除的题目")}
                  </div>
                  {deleteList.map((item) => (
                    <div className={styles.deleteBox} id="deleteBox">
                      <div className={styles.dleteOptionBox}>
                        <div
                          className={[
                            styles.deleteButton,
                            styles.iconfont,
                          ].join(" ")}
                          onClick={this.refList.bind(this, item)}
                        >
                          &#xe739;
                        </div>
                      </div>
                      <div
                        dangerouslySetInnerHTML={{ __html: item.content }}
                        className={styles.deleteContent}
                      ></div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className={styles.contentRight}>
              {/* <span className={styles.fraction}>
                分数：
                <Switch checked={isFraction} onChange={this.changeFraction} />
              </span> */}
              {newTestStatus ? (
                <div className={styles.contentRightMessage}>
                  <div className={styles.score}>
                    <span className={styles.title}>
                      {trans("global.score", "分数")}
                    </span>
                    {viewData && viewData.openScore ? (
                      <div>
                        <span className={styles.stuScore}>
                          <i className={styles.iconfont}>&#xe634;</i>
                          {this.props.newViewData.studentScore}(
                          {trans("global.yourScore", "得分")})
                        </span>
                        <span>/</span>
                        <span className={styles.fullScore}>
                          {this.state.viewData.totalScore}(
                          {trans("global.manfen", "满分")})
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.testMessage}>
                    <div
                      className={[styles.messageBox, styles.useTime].join(" ")}
                    >
                      <div className={styles.explain}>
                        {trans("global.useTime", "用时")}
                      </div>
                      <div className={styles.time}>
                        {this.props.newViewData.answerTime}
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
                          {this.props.newViewData.correctQuestionNum}
                        </span>
                        /{this.props.newViewData.totalQuestionNum}
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
                          {this.props.newViewData.errorQuestionNum}
                        </span>
                        /{this.props.newViewData.totalQuestionNum}
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
                          {this.props.newViewData.noAnswerQuestionNum}
                        </span>
                        /{this.props.newViewData.totalQuestionNum}
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
                  {deleteList.length > 0 ? (
                    <div
                      className={styles.optionTitleRight}
                      onClick={this.scrollDelete}
                    >
                      <i className={styles.iconfont}>&#xe739;</i>
                      {trans("detail.recover", "回收站")}({deleteList.length})
                    </div>
                  ) : null}
                </div>
                {detaiList && detaiList.length > 0
                  ? detaiList.map((item, index) => (
                      <div className={styles.moveList} key={index}>
                        <div className={styles.moveListTitle}>
                          <div>
                            <span className={styles.contentVisible}>
                              {item.moduleName}
                            </span>
                            {viewData && viewData.openScore ? (
                              <>
                                ({item.moduleScore || 0}
                                {trans("global.point", "分")})
                              </>
                            ) : null}
                          </div>
                          {viewData && viewData.openScore ? (
                            <>
                              {newTestStatus ? (
                                <div className={styles.modultScore}>
                                  <i className={styles.iconfont}>&#xe634;</i>
                                  <span className={styles.score}>
                                    {this.renderScore(index)}
                                  </span>
                                  {trans("global.point", "分")}
                                </div>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                        <div className={styles.moveListContent}>
                          {newTestStatus
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
                                    {this.renderNumber(
                                      it.questionId,
                                      index,
                                      ind,
                                    )}
                                    {it.isCorrect ? (
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
                                    {this.renderNumber(
                                      it.questionId,
                                      index,
                                      ind,
                                    )}
                                  </div>
                                ))
                              : null}
                        </div>
                      </div>
                    ))
                  : null}
              </div>
              {newTestStatus ? (
                <div>
                  {/* <Upload
                    {...uploadProps}
                    onChange={this.uploadOnChange.bind(this)}
                  >
                    <div className={styles.uplaodSpan}>拍照上传解题过程</div>
                  </Upload> */}
                  {this.state.fileList && this.state.fileList.length > 0
                    ? this.state.fileList.map((item, index) => (
                        <div className={styles.stuProcess}>
                          <a
                            href={`${window.location.origin}/${item.url}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {trans("global.image", "图片")}
                            {index + 1}
                          </a>
                          <i
                            className={[
                              styles.iconfont,
                              styles.cancelIcon,
                            ].join(" ")}
                            onClick={this.cancelFile.bind(this, item)}
                          >
                            &#xe6e2;
                          </i>
                        </div>
                      ))
                    : null}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className={styles.detailContent}>
            <div className={styles.ready}>
              {viewData && viewData.title ? (
                this.state.showNum ? (
                  <div className={styles.countContent}>
                    <div className={styles.countDown}>
                      <span className={styles.countMessage}>
                        {trans("global.countDown", "倒计时")}
                      </span>
                    </div>
                    <div className={styles.num}>
                      <span className={styles.numMessage}>
                        {this.state.num}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.redyContent}>
                    <div className={styles.leftContent}>
                      <div className={styles.title}>{viewData.title}</div>
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        {viewData && viewData.openScore ? (
                          <div className={styles.message}>
                            {trans("global.manfen", "满分")}
                            &nbsp;{viewData.totalScore}
                          </div>
                        ) : (
                          <div className={styles.message}></div>
                        )}
                        {viewData && viewData.answerTime ? (
                          <div
                            className={styles.message}
                            style={{ marginLeft: "20px" }}
                          >
                            {trans("global.lengthAnswer", "作答时间")}：
                            {viewData.answerTime}
                            {trans("global.timeClock", "分钟")}
                          </div>
                        ) : null}
                      </div>
                      {viewData && viewData.examIllustrate ? (
                        <div className={styles.modeIll}>
                          {viewData.examIllustrate}
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.rightContent}>
                      <div
                        className={[
                          styles.continuityBox,
                          answerMode == 1 ? styles.border : "",
                        ].join(" ")}
                        onClick={() => this.setState({ answerMode: 1 })}
                      >
                        <p className={styles.continuity}>
                          {trans("global.continuousAnswer", "连续作答")}
                        </p>
                        <p className={styles.allTestSee}>
                          {trans(
                            "global.allTestSee",
                            "所有试题同时可见，往下滚动页面答题",
                          )}
                        </p>
                        <span className={styles.continuityImg}>
                          <img src={continuity} />
                        </span>
                      </div>

                      <div
                        className={[
                          styles.continuityBox,
                          answerMode == 2 ? styles.border : "",
                        ].join(" ")}
                        onClick={() => this.setState({ answerMode: 2 })}
                      >
                        <p className={styles.continuity}>
                          {trans("global.singleQuestionAnswering", "单题作答")}
                        </p>
                        <p className={styles.allTestSee}>
                          {trans(
                            "global.oneSeeTest",
                            "每次可见一道题，点击“下一道”按钮切换试题",
                          )}
                        </p>
                        <span className={styles.singleQuestionImg}>
                          <img src={singleQuestion} />
                        </span>
                      </div>

                      <Button
                        type="primary"
                        style={{ marginTop: "auto" }}
                        onClick={this.showNum}
                      >
                        {trans("global.startTest", "开始答题")}
                      </Button>
                    </div>
                  </div>
                )
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect(({ home, studyPictures, global }) => ({
  studentTest: home.studentTest,
  testStatus: home.testStatus,
  startTime: home.startTime,
  currentUser: global.currentUser,
  newViewData: home.viewData,
}))(TeacherPreview);
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};

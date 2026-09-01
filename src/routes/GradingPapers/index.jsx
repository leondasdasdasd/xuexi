//新闻
import React, { Fragment, PureComponent } from "react";
import {
  Checkbox,
  Icon,
  InputNumber,
  message,
  Progress,
  Radio,
  Select,
} from "antd";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import MyButton from "../../components/MyButton";
import PaperMarkTool from "../../components/PaperMarkTool";
import ShowFile from "../../components/UseFileItem/showFile";
import { getMeCheckQuestionUser } from "../../services/marking";
import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
const { Option } = Select;
let startValue = "";
let followElement = null;
let pointerEL = null;
let remarkElement = null;
let isEnterBlur = false; //是否为回车失去光标
class GradingPapers extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp(
      "/gradingPapers/:examId/:questionIds/:questionPaperType/:studentId?",
    ).exec(this.url);
    this.examId = JSON.parse(this.pathMatch[1]);
    this.questionIds = this.pathMatch[2];
    this.questionPaperType = JSON.parse(this.pathMatch[3]);
    if (this.pathMatch[4]) {
      this.studentId = JSON.parse(this.pathMatch[4]); //添加了一个questionPaperType类型，值为3，回评我所有的题目
    }
    this.dynamicRefs = {};
    this.state = {
      keyboardMode: 1,
      isAutoNext: true,
      isAutoSubmit: false,
      questionId: undefined,
      questions: [],
      imgArr: [],
      previewVisible: false,
      tagList: [],
      checkNum: null,
      allNum: null,
      markStudents: [],
      allImagesLoaded: true,
      currentTool: "",
    };
  }
  componentDidMount() {
    this.getStudentTableData();

    this.props
      .dispatch({
        type: "marking/getQuestionIdOrPiece",
        payload: {
          examId: this.examId,
          questionSettingIdList: this.questionIds,
          questionPaperType: this.questionPaperType,
        },
      })
      .then(() => {
        const { questionIdOrPiece } = this.props;
        questionIdOrPiece &&
          questionIdOrPiece.length > 0 &&
          questionIdOrPiece.map((item) => {
            if (item.currentStatus) {
              this.setState({
                questionId: item.questionSettingIdList.join(","),
              });
            }
          });
      });
    if (this.studentId) {
      this.getQuestionImage(0, this.questionIds, this.studentId);
    } else {
      this.getQuestionImage(1, this.questionIds);
    }
  }

  getStudentTableData = () => {
    getMeCheckQuestionUser({
      examId: this.examId,
      questionSettingIdList: this.questionIds,
    }).then((res) => {
      if (res.status) {
        this.setState({
          markStudents: res.content,
        });
      } else {
        message.error(res.message);
      }
    });
  };

  getQuestionImage = (type, ids, noId) => {
    // 获取新的题目切图时，清空上次切图生成的画布
    if (this.state.questions)
      for (const [index, item] of this.state.questions.entries()) {
        if (item.quesionImageUrl && item.quesionImageUrl.length > 0) {
          for (const [index_, item1] of item.quesionImageUrl.entries()) {
            this.dynamicRefs[
              `paperMarkToolRef${index}-${index_}`
            ]?.clearCanvas();
          }
        }
      }
    this.dynamicRefs = {};

    let studentId = null;
    // 根据之前的代码添加一个状态，当传入noId时，studentId则为传入的值
    if (noId === true) {
      studentId = null;
    } else if (noId) {
      studentId = noId;
    } else {
      studentId =
        this.props.questionImage?.studentQuestionAnswer?.studentId || null;
    }

    this.props
      .dispatch({
        type: "marking/getQuestionImage",
        payload: {
          examId: this.examId,
          questionSettingIdList: ids,
          queryType: type,
          studentId: studentId,
          questionPaperType: this.questionPaperType,
          checkMeType: this.pathMatch[4] ? 1 : 0,
        },
      })
      .then(() => {
        const { questionImage, refreshSchedule } = this.props;

        if (this.markingTypeFun() == 1) {
          this.initQuestionInfoCanvas(
            questionImage.studentQuestionAnswer.questionInfo,
          );
        }

        if (
          questionImage &&
          questionImage.studentQuestionAnswer &&
          questionImage.studentQuestionAnswer.questionInfo.length > 0
        ) {
          this.setState(
            {
              questions: questionImage.studentQuestionAnswer.questionInfo,
              tagList: questionImage.studentQuestionAnswer.tag || [],
              checkNum: questionImage.checkNum || refreshSchedule.checkNum,
              allNum: questionImage.allNum || refreshSchedule.allNum,
            },
            () => {
              // 自动获取第一个输入框光标
              if (this.state.questions.length > 0) {
                let questionId = this.state.questions[0].questionId;
                document.getElementById([`scoreInput_${questionId}`])?.focus();
              }

              this.getStuSetCheckStatus();
            },
          );
        }
      });
  };

  initQuestionInfoCanvas = (list) => {
    if (list && list.length > 0) {
      for (const [index, item] of list.entries()) {
        if (item.quesionImageUrl && item.quesionImageUrl.length > 0) {
          for (const [index_, url] of item.quesionImageUrl.entries()) {
            const img = new Image();
            img.src = url;
            img.addEventListener("load", () => {
              console.log("图片加载完成");
              if (item.teacherAnnotation) {
                let markData = JSON.parse(item.teacherAnnotation);
                this.dynamicRefs[
                  `paperMarkToolRef${index}-${index_}`
                ]?.initializeFabricCanvas(markData[index_]);
              } else {
                this.dynamicRefs[
                  `paperMarkToolRef${index}-${index_}`
                ]?.initializeFabricCanvas();
              }
              console.log(this.dynamicRefs, "this.dynamicRefs");
            });
            img.onerror = () => console.error(`图片加载失败: ${url}`);
          }
        }
      }
    }
  };

  changeAutoSubmit = (e) => {
    this.setState({
      isAutoSubmit: e.target.checked,
    });
  };

  getStuSetCheckStatus = () => {
    const { questionImage } = this.props;
    this.props.dispatch({
      type: "marking/getSetCheckStatus",
      payload: {
        examId: this.examId,
        questionSettingIdList: this.questionIds,
        studentId: questionImage.studentQuestionAnswer.studentId,
      },
    });
    // 如果是从回评进入此页面，在更新studentId时，更新url中studentId参数
    if (this.pathMatch[4]) {
      this.studentId = questionImage.studentQuestionAnswer.studentId;
      let url = `${window.location.origin}/exam#/gradingPapers/${this.examId}/${this.questionIds}/${this.questionPaperType}/${this.studentId}`;
      window.open(url, "_self");
    }
  };

  back = () => {
    window.close() || this.props.history.goBack();
  };

  keyboardModeChange = (key) => {
    // 切换打分方式晴空分数
    let newQuList = JSON.parse(JSON.stringify(this.state.questions));
    for (const [index, item] of newQuList.entries()) {
      item.studentScore = ""; // 清空分数
      // 清空切图上的分数
      if (item.quesionImageUrl && item.quesionImageUrl.length > 0) {
        for (const [index_, item1] of item.quesionImageUrl.entries()) {
          this.dynamicRefs[
            `paperMarkToolRef${index}-${index_}`
          ]?.removeNumberText();
        }
      }
    }

    this.setState({
      keyboardMode: key,
      questions: newQuList,
    });

    // 切换打分方式清空工具
    this.resetTool();
  };

  changeAutoNext = (e) => {
    this.setState({
      isAutoNext: e.target.checked,
    });
  };

  viewScorllView = () => {
    let element = document.querySelector("#questionInputScoreBox");
    let element1 = document.querySelector("#canvasBox");
    if (element) {
      element.scrollTop = 0;
    }
    if (element1) {
      element1.scrollTop = 0;
    }
  };

  changeQuestion = async (e) => {
    this.viewScorllView();

    // 切换题号清空画布
    if (this.state.questions)
      for (const [index, item] of this.state.questions.entries()) {
        if (item.quesionImageUrl && item.quesionImageUrl.length > 0) {
          for (const [index_, item1] of item.quesionImageUrl.entries()) {
            this.dynamicRefs[
              `paperMarkToolRef${index}-${index_}`
            ]?.clearCanvas();
          }
        }
      }

    this.dynamicRefs = {};

    this.questionIds = e;
    if (this.pathMatch[4]) {
      let res = await getMeCheckQuestionUser({
        examId: this.examId,
        questionSettingIdList: this.questionIds,
      });
      if (res.status) {
        if (res.content && res.content.length > 0) {
          this.setState({
            markStudents: res.content,
          });
          this.studentId = res.content[0].studentId;
          let url = `${window.location.origin}/exam#/gradingPapers/${this.examId}/${this.questionIds}/${this.questionPaperType}/${this.studentId}`;
          window.open(url, "_self");
        } else {
          return message.error(
            trans(
              "gradingPapers.noStudentsForQuestion",
              "当前题号暂无批改学生",
            ),
          );
        }
      } else {
        return message.error(res.message);
      }
    }

    this.setState(
      {
        questionId: e,
        selectedImgIndex: "0-0",
      },
      () => {
        window.open(
          `${window.location.origin}/exam#/gradingPapers/${this.examId}/${e}/${this.questionPaperType}`,
          "_self",
        );
        this.props
          .dispatch({
            type: "marking/getQuestionImage",
            payload: {
              examId: this.examId,
              questionSettingIdList: e,
              queryType: this.pathMatch[4] ? 0 : 1,
              studentId: this.pathMatch[4] ? this.studentId : null,
              questionPaperType: this.questionPaperType,
              checkMeType: this.pathMatch[4] ? 1 : 0,
            },
          })
          .then(() => {
            const { questionImage } = this.props;
            if (
              questionImage &&
              questionImage.studentQuestionAnswer &&
              questionImage.studentQuestionAnswer.questionInfo.length > 0
            ) {
              if (this.markingTypeFun() == 1) {
                // 初始化画布
                this.initQuestionInfoCanvas(
                  questionImage.studentQuestionAnswer.questionInfo,
                );
              }

              this.setState(
                {
                  questions: questionImage.studentQuestionAnswer.questionInfo,
                  tagList: questionImage.studentQuestionAnswer.tag || [],
                  checkNum: questionImage.checkNum,
                  allNum: questionImage.allNum,
                },
                () => {
                  this.getStuSetCheckStatus();
                },
              );
            }
          });
      },
    );
  };

  selectScoreValue = (event, text) => {
    let handelValue = "";
    let prefix = "";
    // 满分
    if (typeof text == "string") {
      handelValue = text;
    } else if (text == 0.5) {
      // 如果是0.5，判断是否有小数点
      if (this.state.keyboardValue == "满分") {
        handelValue = text;
        prefix = "+";
      } else if (typeof this.state.keyboardValue == "number") {
        handelValue = this.state.keyboardValue + text;
        prefix = this.state.keyboardMode % 2 == 0 ? "-" : "+";
      }
    } else {
      handelValue = text;
      prefix = this.state.keyboardMode % 2 == 0 ? "-" : "+";
    }

    this.setState({
      currentTool: "scoreRemark",
      keyboardValue: handelValue,
    });

    if (!followElement) {
      // 创建跟随元素
      followElement = document.createElement("div");
      followElement.classList.add(styles.cursor_follow);
      followElement.setAttribute("id", "followEl");

      remarkElement = document.createElement("div");
      remarkElement.classList.add(styles.remark);

      pointerEL = document.createElement("div");
      pointerEL.classList.add(styles.pointer);

      document.body.append(followElement);
      document.body.append(pointerEL);
      document.body.append(remarkElement);
    }

    // 设置数字，可以根据需要修改
    followElement.textContent = `${prefix}${handelValue}`;

    // 更新位置
    followElement.style.left = event.clientX + 20 + "px";
    followElement.style.top = event.clientY - 20 + "px";

    remarkElement.style.left =
      event.clientX + followElement.offsetWidth + 30 + "px";
    remarkElement.style.top = event.clientY - 10 + "px";

    pointerEL.style.left = event.clientX + "px";
    pointerEL.style.top = event.clientY + "px";

    // 监听鼠标移动，让元素跟随
    document.addEventListener("mousemove", this.onMouseMove);
  };

  clearKeyboardValue = () => {
    this.resetTool();
  };

  // questionId 为题目id
  // addNumberText 为添加分数的方法
  canvasMouseDown = (questionId, addNumberText) => {
    let innerContent = document.querySelector("#followEl").innerText;
    // console.log(innerContent); //为-1或者+1

    let score = innerContent.slice(1);

    let array = JSON.parse(JSON.stringify(this.state.questions));
    array &&
      array.length > 0 &&
      array.map((item, index) => {
        if (item.questionId == questionId) {
          // 加分减分模式 点击画布打分
          if (this.state.keyboardMode == 1 || this.state.keyboardMode == 2) {
            // 切图打分时，先清空题目切图上的分数
            for (const [k, it] of item.quesionImageUrl.entries()) {
              let canvasReference =
                this.dynamicRefs[`paperMarkToolRef${index}-${k}`];
              canvasReference && canvasReference?.removeNumberText();
            }

            if (this.state.keyboardMode == 1) {
              item.studentScore = Number(score);
            } else if (this.state.keyboardMode == 2) {
              item.studentScore = Number(item.questionScore) - Number(score);
            }

            addNumberText(innerContent);
          } else if (
            this.state.keyboardMode == 3 ||
            this.state.keyboardMode == 4
          ) {
            if (this.state.keyboardMode == 3) {
              // 累加模式 点击画布打分
              if (
                Number(item.studentScore) + Number(score) >
                item.questionScore
              ) {
                return message.error(
                  trans("gradingPapers.exceedsFullScore", "超出满分"),
                );
              }

              item.studentScore = Number(item.studentScore) + Number(score);
            } else if (this.state.keyboardMode == 4) {
              let aaa =
                item.studentScore || item.studentScore === 0
                  ? Number(item.studentScore)
                  : Number(item.questionScore);
              // 累加模式 点击画布打分
              console.log(aaa, score);

              if (aaa - Number(score) < 0) {
                return message.error(
                  trans("gradingPapers.exceedsFullScore", "超出满分"),
                );
              }
              item.studentScore = aaa - Number(score);
            }

            addNumberText(innerContent);
          }
        }
      });

    this.setState({
      questions: array,
    });

    // 加分减分模式 点击画布打分 清除工具
    if (
      (this.state.keyboardMode == 1 || this.state.keyboardMode == 2) &&
      this.state.isAutoSubmit &&
      array.every((item) => item.studentScore || item.studentScore === 0)
    ) {
      this.submitQuestionScore();
    }
  };

  deletQuestionScore = (questionId, innerContent) => {
    // console.log(innerContent); //为-1或者+1
    let score = innerContent;
    let array = JSON.parse(JSON.stringify(this.state.questions));
    array &&
      array.length > 0 &&
      array.map((item, index) => {
        if (item.questionId == questionId) {
          item.studentScore = Number(item.studentScore) - Number(score) || "";
        }
      });
    this.setState({
      questions: array,
    });
  };

  resetTool = () => {
    if (pointerEL && followElement) {
      document.body?.removeChild(pointerEL);
      document.body?.removeChild(followElement);
      document.body?.removeChild(remarkElement);
      pointerEL = null;
      followElement = null;
      remarkElement = null;
      document.removeEventListener("mousemove", this.onMouseMove);
    }
    this.setState({
      currentTool: null,
      keyboardValue: null,
    });
  };

  onMouseMove = (event) => {
    if (followElement) {
      followElement.style.left = event.clientX + 20 + "px";
      followElement.style.top = event.clientY - 20 + "px";

      pointerEL.style.left = event.clientX + "px";
      pointerEL.style.top = event.clientY + "px";

      remarkElement.style.left =
        event.clientX + followElement.offsetWidth + 30 + "px";
      remarkElement.style.top = event.clientY - 10 + "px";
    }
  };

  lookDetail = (status, item) => {
    console.log(item, "111");
    this.setState({
      previewVisible: status || false,
      previewInfo: item || null,
    });
  };

  openText = () => {
    const { questionImage } = this.props;
    this.props
      .dispatch({
        type: "marking/getStudentExamPaperImage",
        payload: {
          examId: this.examId,
          studentId: questionImage.studentQuestionAnswer.studentId,
        },
      })
      .then(() => {
        const { studentExamPaperImage } = this.props;
        let array = [];
        studentExamPaperImage &&
          studentExamPaperImage.length &&
          studentExamPaperImage.map((item) => {
            array.push({
              type: "image",
              url: item,
            });
          });
        this.setState({
          imgArr: array,
          previewVisible: true,
        });
      });
  };

  setQuestionScore = (id, value) => {
    // console.log(value);// value输出格式为非负数的纯数字
    return new Promise((resolve, reject) => {
      let newQuList = JSON.parse(JSON.stringify(this.state.questions));
      let ind = newQuList.findIndex((item, index) => item.questionId === id);
      let target = newQuList[ind];

      let errorElement = document.getElementById(`errorMsgBox_${ind}`);

      // 超出最高分强制赋值为最高分
      if (value > Number(target.questionScore)) {
        errorElement.innerText = `最高分为${target.questionScore}分`;
        errorElement.style.display = "block";

        // 减分模式，如果想要减去的分数超过最高分，那么这个题得分就为0
        if (this.state.keyboardMode == 2 || this.state.keyboardMode == 4) {
          target.studentScore = 0;
        } else if (
          this.state.keyboardMode == 1 ||
          this.state.keyboardMode == 3
        ) {
          // 加分模式，超出最高分强制赋值为最高分
          target.studentScore = Number(target.questionScore);
        }
      } else {
        // 累加累减模式输入分数不能小于画布上的分数
        // if (this.state.keyboardMode == 3) {
        //   //  画布已经存在打分
        //   if (typeof target.studentScore == 'number') {
        //     if (value < Number(target.studentScore)) {
        //       errEl.style.display = 'block'
        //       errEl.innerText = '不能小于当前得分'
        //       resolve('不能小于当前得分')
        //       return
        //     }
        //   }
        // }
        // if (this.state.keyboardMode == 4) {
        //   //  画布已经存在打分
        //   if (typeof target.studentScore == 'number') {
        //     if (Number(target.questionScore) - Number(value) < Number(target.studentScore)) {
        //       errEl.style.display = 'block'
        //       errEl.innerText = '不能小于当前得分'
        //       resolve('不能小于当前得分')
        //       return
        //     }
        //   }
        // }

        // 减分模式
        if (this.state.keyboardMode == 2 || this.state.keyboardMode == 4) {
          target.studentScore = Number(target.questionScore) - Number(value);
        } else if (
          this.state.keyboardMode == 1 ||
          this.state.keyboardMode == 3
        ) {
          // 加分模式
          target.studentScore = Number(value);
        }
        errorElement.style.display = "none";
      }

      this.setState(
        {
          questions: newQuList,
        },
        () => {
          resolve();
        },
      );
    });
  };

  inputToolChange = (id, key) => {
    let newQuList = JSON.parse(JSON.stringify(this.state.questions));
    let targetQu = newQuList.find((item, index) => item.questionId === id);

    console.log(targetQu, "targetQu");

    let value = 0;

    // 减分模式
    if (this.state.keyboardMode % 2 == 0) {
      if (targetQu.studentScore || targetQu.studentScore === 0) {
        // 输入框当前的值
        value = Number(targetQu.questionScore) - Number(targetQu.studentScore);
      } else {
        value = 0;
      }

      if (key == "up") {
        value += 0.5;
      } else {
        if (value <= 0) {
          return;
        }
        value -= 0.5;
      }
    } else {
      // 输入框当前的值
      value = Number(targetQu.studentScore);
      if (key == "up") {
        value += 0.5;
        console.log(value, key);
      } else {
        if (value <= 0) {
          return;
        }
        value -= 0.5;
      }
    }

    this.setQuestionScore(id, value).then((res) => {
      this.addScoreToCanvas({ target: { value: value } }, id);
    });

    // 据根据配置来决定是否调用提交修改的函数
    if (
      (this.state.keyboardMode == 1 || this.state.keyboardMode == 2) &&
      this.state.isAutoSubmit &&
      this.state.questions.every(
        (item) => item.studentScore || item.studentScore === 0,
      )
    ) {
      this.submitQuestionScore();
    }
  };

  // 确认将当前试题的分数添加到画布上
  addScoreToCanvas = (e, id) => {
    console.log(e.target.value, "e.target.value"); //格式+2 或者 -2
    let index = this.state.questions.findIndex(
      (item) => item.questionId === id,
    );
    let question = this.state.questions[index];
    let value = question.studentScore;

    if (question.quesionImageUrl && question.quesionImageUrl.length > 0) {
      // lastNumber 一个题目存在多个切图，默认添加到最后一个题目当中
      let lastNumber = question.quesionImageUrl.length - 1;
      for (const [index_, item] of question.quesionImageUrl.entries()) {
        this.dynamicRefs[
          `paperMarkToolRef${index}-${index_}`
        ].removeNumberText();
      }

      let paperMarkCom =
        this.dynamicRefs[`paperMarkToolRef${index}-${lastNumber}`];

      let canvas = paperMarkCom.myCanvaRef.current;
      let x = canvas.offsetWidth * 0.8;
      let y = canvas.offsetHeight / 2;

      if (this.state.keyboardMode == 1 || this.state.keyboardMode == 3) {
        paperMarkCom.addText(`+${value}`, x, y);
      } else if (this.state.keyboardMode == 2 || this.state.keyboardMode == 4) {
        paperMarkCom.addText(
          `-${Number(question.questionScore) - Number(question.studentScore)}`,
          x,
          y,
        );
      }
    }
  };

  // 获取当前题目是单评还是双评 1 双评 2 单评
  markingTypeFun = () => {
    // let index = this.props.questionIdOrPiece?.findIndex((qu, index) => {
    //   return qu.questionSettingIdList.join(",") == this.state.questionId
    // })
    // if (index != -1) {
    //   return this.props.questionIdOrPiece[index].markingType
    // }
    // return null
    return 1; //这里写死为单评，防止白屏
  };

  submitQuestionScore = () => {
    const { questionImage } = this.props;
    const { questions, isAutoNext, tagList } = this.state;

    let cloneQuestions = JSON.parse(JSON.stringify(questions));

    this.viewScorllView();

    // 获取当前题目是单评还是双评
    if (this.markingTypeFun() == 1) {
      for (const [index, item] of questions.entries()) {
        let array = [];
        if (item.quesionImageUrl && item.quesionImageUrl.length > 0) {
          for (const [index_, item1] of item.quesionImageUrl.entries()) {
            array.push(
              this.dynamicRefs[
                `paperMarkToolRef${index}-${index_}`
              ].getCanvasJsonData(),
            );
          }
        }
        cloneQuestions[index].teacherAnnotation = JSON.stringify(array);
      }
    }

    this.setState({
      isSubmitLoading: true,
    });

    this.props
      .dispatch({
        type: "marking/postCheckQuestion",
        payload: {
          examId: this.examId,
          studentId: questionImage.studentQuestionAnswer.studentId,
          tag: tagList,
          questionInfo: cloneQuestions,
        },
      })
      .then(() => {
        this.setState({
          isSubmitLoading: false,
        });
        localStorage.setItem("tab_b_closed", Date.now()); // 用时间戳作为标志

        this.props
          .dispatch({
            type: "marking/getRefreshSchedule",
            payload: {
              examId: this.examId,
              questionSettingIdList: this.questionIds,
              questionPaperType: this.questionPaperType,
              checkMeType: this.pathMatch[4] ? 1 : 0,
            },
          })
          .then(() => {
            const { refreshSchedule } = this.props;
            this.setState({
              allNum: refreshSchedule.allNum,
              checkNum: refreshSchedule.checkNum,
            });

            // 当前题目是不最后一题，
            if (
              refreshSchedule.allNum != refreshSchedule.checkNum ||
              Boolean(this.pathMatch[4])
            ) {
              //  自动下一份，进入当前题目的下一份
              if (isAutoNext) {
                this.getQuestionImage(1, this.questionIds);
              }
            } else if (!this.pathMatch[4]) {
              let index = this.props.questionIdOrPiece?.findIndex(
                (qu, index) => {
                  return (
                    qu.questionSettingIdList.join(",") ==
                      this.state.questionId &&
                    index != this.props.questionIdOrPiece.length - 1
                  );
                },
              );

              // 切换题目
              if (index != -1) {
                this.changeQuestion(
                  this.props.questionIdOrPiece[
                    index + 1
                  ].questionSettingIdList.join(","),
                );
              }
            }
          });
      });
  };

  myMarkingLog = () => {
    let url = `${window.location.origin}/exam#/myMarking/${this.examId}/${this.questionIds}/${this.questionPaperType}`;
    window.open(url);
  };

  changeMarkStudent = (value) => {
    let url = `${window.location.origin}/exam#/gradingPapers/${this.examId}/${this.questionIds}/${this.questionPaperType}/${value}`;
    window.open(url, "_self");
    this.studentId = value;
    this.getQuestionImage(0, this.questionIds, value);
  };

  imageContainerMouseEnter = (item) => {
    if (typeof this.state.keyboardValue === "number" && followElement) {
      if (this.state.keyboardValue > item.questionScore) {
        followElement.innerText = `${this.state.keyboardMode % 2 == 0 ? "-" : "+"}${item.questionScore}`;
        remarkElement.innerText = "超出满分";
      }
    } else if (this.state.keyboardValue === "满分") {
      followElement.innerText = `+${item.questionScore}`;
    }
  };

  mouseOutImageContainer = () => {
    if (followElement) {
      remarkElement.innerText = "";
      followElement.innerText = `${this.state.keyboardMode % 2 == 0 ? "-" : "+"}${this.state.keyboardValue}`;
    }
  };

  selectTool = (tool) => {
    this.setState({
      currentTool: tool,
      keyboardValue: null,
    });
  };

  handleScoreInputBlur = (e, id) => {
    // 如果打开了自动提交
    if (this.state.isAutoSubmit) {
      // 判断当前题块是否全部批改完成
      if (
        !this.state.questions.every(
          (item) => item.studentScore || item.studentScore == 0,
        ) && //回车触发的失去光标
        isEnterBlur
      ) {
        this.focusNextput(id);
      }
    } else {
      //回车触发的失去光标
      if (isEnterBlur) {
        this.focusNextput(id);
      }
    }

    isEnterBlur = false;

    let index = this.state.questions.findIndex(
      (item) => item.questionId === id,
    );
    let question = this.state.questions[index];
    let value = question.studentScore;
    // 分数没有发生改变
    if (startValue === value) {
      return;
    }
    this.addScoreToCanvas(e, id);
    // 据根据配置来决定是否调用提交修改的函数
    if (
      (this.state.keyboardMode == 1 || this.state.keyboardMode == 2) &&
      this.state.isAutoSubmit &&
      this.state.questions.every(
        (item) => item.studentScore || item.studentScore === 0,
      )
    ) {
      this.submitQuestionScore();
    }
  };

  //分局当前题目id自动定位到下一题光标
  focusNextput = (id) => {
    let index = this.state.questions.findIndex(
      (item) => item.questionId === id,
    );
    if (index != this.state.questions.length - 1) {
      let nextId = this.state.questions[index + 1].questionId;
      let nextInput = document.getElementById(`scoreInput_${nextId}`);
      console.log(nextInput, "nextInput");

      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  handleScoreInputEnter = (e, id) => {
    isEnterBlur = true;
    e.preventDefault(); // 阻止默认事件，防止触发 onBlur
    e.target.blur(); // 手动失焦, 触发 onBlur
  };

  render() {
    const { questionIdOrPiece, questionImage } = this.props;
    const { keyboardMode, questionId, questions, imgArr, allNum, checkNum } =
      this.state;
    let number_ = (checkNum / allNum) * 100;
    return (
      <div className={styles.gradingPapersBox}>
        <div className={styles.header}>
          <Icon
            type="left"
            className={[styles.closeIcon].join(" ")}
            onClick={this.back}
          />
          <span className={styles.row}>
            <span className={styles.colorfff}>
              {trans("analysis.questionIndex", "题号")}：
            </span>
            <Select
              onChange={this.changeQuestion}
              value={questionId}
              style={{ width: 150 }}
            >
              {questionIdOrPiece &&
                questionIdOrPiece.length > 0 &&
                questionIdOrPiece.map((item) => (
                  <Option
                    value={item.questionSettingIdList.join(",")}
                    key={item.questionInfo}
                  >
                    {item.questionInfo}
                  </Option>
                ))}
            </Select>

            {this.studentId ? (
              <>
                <span className={styles.colorfff}>
                  {trans("gradingPapers.myAssignedStudents", "我批改的学生：")}
                </span>
                <Select
                  onChange={this.changeMarkStudent}
                  value={this.studentId}
                  style={{ width: 150 }}
                >
                  {this.state.markStudents.map((item) => (
                    <Option value={item.studentId} key={item.studentId}>
                      {item.studentName ||
                        `${trans("global.student", "学生")}${item.index}`}
                    </Option>
                  ))}
                </Select>
              </>
            ) : null}
          </span>
          {this.studentId ? null : (
            <span className={styles.row}>
              <span className={styles.colorfff}>
                {trans("global.schedule", "进度")}
              </span>
              <span className={styles.colorfff}>
                {checkNum}/{allNum}
              </span>
              <span className={styles.progress}>
                <Progress
                  percent={number_}
                  showInfo={false}
                  strokeWidth={20}
                  strokeColor="#10C553"
                />
              </span>
            </span>
          )}
          {this.studentId ? null : (
            <span className={styles.row}>
              <span className={styles.colorfff}>
                {trans("global.studentLabel", "学生：")}
                {questionImage?.studentQuestionAnswer?.studentName ||
                  trans("gradingPapers.invisibleStudent", "（不可见）")}
              </span>
            </span>
          )}

          <span className={styles.rightBtn}>
            <span className={styles.seeTest} onClick={this.myMarkingLog}>
              {trans("gradingPapers.myGradingRecords", "我的批改记录")}
            </span>
          </span>
        </div>
        <div className={styles.changeScoreBox}>
          <div className={styles.gradingLeft}>
            <div className={styles.canvasBox} id="canvasBox">
              <div className={styles.containerWrapper}>
                {questionImage &&
                  questionImage.studentQuestionAnswer &&
                  questionImage.studentQuestionAnswer.questionInfo &&
                  questionImage.studentQuestionAnswer.questionInfo.length > 0 &&
                  questionImage.studentQuestionAnswer.questionInfo.map(
                    (item, index) => (
                      <div style={{ marginBottom: "20px", fontSize: "0" }}>
                        {item.quesionImageUrl && item.quesionImageUrl.length > 0
                          ? item.quesionImageUrl.map((url, index_) => (
                              <>
                                <div
                                  className={`${styles.imageContainer}`}
                                  key={`${index}-${index_}`}
                                  onMouseEnter={() => {
                                    this.imageContainerMouseEnter(item);
                                  }}
                                  onMouseOut={() => {
                                    this.mouseOutImageContainer(item);
                                  }}
                                >
                                  <img
                                    src={url}
                                    alt=""
                                    style={{ display: "block" }}
                                  />
                                  <PaperMarkTool
                                    deletQuestionScore={(innerContent) => {
                                      this.deletQuestionScore(
                                        item.questionId,
                                        innerContent,
                                      );
                                    }}
                                    canvasMouseDown={(addNumberText) => {
                                      this.canvasMouseDown(
                                        item.questionId,
                                        addNumberText,
                                      );
                                    }}
                                    key={`${index}-${index_}`}
                                    currentTool={this.state.currentTool}
                                    ref={(_component) => {
                                      this.dynamicRefs[
                                        `paperMarkToolRef${index}-${index_}`
                                      ] = _component;
                                    }}
                                  />
                                </div>
                              </>
                            ))
                          : null}
                      </div>
                    ),
                  )}
              </div>
            </div>

            <div
              style={{
                width: "48px",
                height: "100%",
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  paddingTop: "300px",
                }}
              >
                {/* <span
                  className={styles.remarkBox}
                  onClick={() => this.clickAnnotations(1)}
                  style={{
                    border: '0.5px solid rgba(4, 201, 25, 0.5)',
                    color: '#04C919'
                  }}
                >
                  优秀<br />
                  作业
                </span>
                <span
                  className={styles.remarkBox}
                  style={{
                    border: '0.5px solid rgba(252, 73, 30, 0.5)',
                    color: '#FC491E',
                  }}
                  onClick={() => this.clickAnnotations(2)}
                >
                  典型<br />
                  错误
                </span> */}
                {[
                  {
                    title: trans("gradingPapers.annotationTick", "打上对勾"),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "30px" }}
                      >
                        &#xeaf1;
                      </i>
                    ),
                    key: "tick",
                  },
                  {
                    title: trans("gradingPapers.annotationCross", "打上叉号"),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "30px" }}
                      >
                        &#xe893;
                      </i>
                    ),
                    key: "cross",
                  },
                  {
                    title: trans(
                      "gradingPapers.annotationHalfCorrect",
                      "打上半对",
                    ),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "30px" }}
                      >
                        &#xe894;
                      </i>
                    ),
                    key: "halfCorrect",
                  },
                  {
                    title: trans("gradingPapers.annotationRectangle", "矩形"),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "24px" }}
                      >
                        &#xe8fb;
                      </i>
                    ),
                    key: "rect",
                  },
                  {
                    title: trans("gradingPapers.annotationText", "文本"),
                    icon: (
                      <i
                        style={{ fontSize: "18px", marginRight: "5px" }}
                        className={styles.iconfont}
                      >
                        {" "}
                        &#xe8fa;
                      </i>
                    ),
                    key: "textbox",
                  },
                  {
                    title: trans("gradingPapers.annotationBrush", "画笔"),
                    icon: (
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "20px" }}
                      >
                        &#xe88e;
                      </i>
                    ),
                    key: "pen",
                  },
                ].map((item) => {
                  return (
                    <div
                      key={item.key}
                      className={`${styles.toolBoxItem} ${this.state.currentTool == item.key ? styles.active : null}`}
                      onClick={() => {
                        this.selectTool(item.key);
                      }}
                      style={{
                        cursor: "pointer",
                        height: "20px",
                        width: "48px",
                        lineHeight: "20px",
                        textAlign: "center",
                      }}
                    >
                      {item.icon || item.title}
                    </div>
                  );
                })}

                {/* <div
                  style={{
                    width: '35px',
                    height: '1px',
                    borderBottom: '1px solid rgba(1, 17, 61, 0.12)'
                  }}
                >
                </div>

                <div
                  className={styles.noSelect}
                  onClick={this.undo}
                  style={{
                    cursor: 'pointer',
                    height: '20px',
                    lineHeight: '20px'
                  }}
                >
                  <i className={styles.iconfont} style={{ fontSize: '20px' }}>&#xe6a2;</i>
                </div> */}
              </div>
            </div>
          </div>

          <div className={styles.gradingRight} style={{ position: "relative" }}>
            <div style={{ display: "flex", color: "#01113d" }}>
              <div style={{ fontWeight: "500", fontSize: "16px" }}>
                {trans("gradingPapers.scoringMode", "打分模式")}
              </div>
              <div style={{ fontSize: "14px", marginLeft: "auto" }}>
                <Radio.Group value={2}>
                  {/* <Radio value={1} disabled>面板打分</Radio> */}
                  <Radio value={2}>
                    {trans("gradingPapers.clickToScore", "点击打分")}
                  </Radio>
                </Radio.Group>
              </div>
            </div>

            <div className={styles.rightTopScore}>
              <span
                className={styles.activeScore}
                onClick={() => this.keyboardModeChange(1)}
                style={keyboardMode == 1 ? { color: "#0445FC" } : {}}
              >
                {trans("global.bonusPoints", "加分")}
              </span>
              <span
                className={styles.activeScore}
                onClick={() => this.keyboardModeChange(2)}
                style={keyboardMode == 2 ? { color: "#0445FC" } : {}}
              >
                {trans("global.minusPoints", "减分")}
              </span>
              <span
                className={styles.activeScore}
                onClick={() => this.keyboardModeChange(3)}
                style={keyboardMode == 3 ? { color: "#0445FC" } : {}}
              >
                {trans("global.accumulation", "累加")}
              </span>
              <span
                className={styles.activeScore}
                onClick={() => this.keyboardModeChange(4)}
                style={keyboardMode == 4 ? { color: "#0445FC" } : {}}
              >
                {trans("global.subtractConsecutively", "累减")}
              </span>
            </div>

            <div className={styles.countScoreBox}>
              <div className={styles.arithmetic}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                  <span
                    className={`${styles.scoreNum} ${this.state.keyboardValue == item ? styles.active : ""}`}
                    onClick={(event) => this.selectScoreValue(event, item)}
                  >
                    {keyboardMode % 2 == 0 ? "-" : "+"} {item}
                  </span>
                ))}
                <span
                  className={`${styles.scoreNum} 
                  ${styles.scoreNumTotal}
                  ${this.state.keyboardValue == "满分" ? styles.active : ""}`}
                  onClick={(event) => this.selectScoreValue(event, "满分")}
                >
                  {trans("global.manfen", "满分")}
                </span>
                <span
                  className={`${styles.scoreNum} 
                  ${styles.scoreNumZero}
                  ${this.state.keyboardValue == 0 ? styles.active : ""}`}
                  onClick={(event) => this.selectScoreValue(event, 0)}
                >
                  {trans("global.zero", "零分")}
                </span>
                <span
                  className={styles.scoreNum}
                  onClick={(event) => this.selectScoreValue(event, 0.5)}
                >
                  .5
                </span>
                <span
                  className={`${styles.scoreNum}`}
                  style={{ fontSize: "16px", color: "#4818C9" }}
                >
                  {/* 问题卷 */}
                </span>
                <span
                  className={styles.scoreNum}
                  onClick={this.clearKeyboardValue}
                >
                  {trans("global.cleanUp", "清除")}
                </span>
              </div>
            </div>

            <div
              id="questionInputScoreBox"
              style={{
                width: "100%",
                backgroundColor: "rgba(1, 17, 61, 0.02)",
                padding: "12px 7px",
                borderRadius: "6px",
                marginTop: "13px",
                height: "calc(100% - 402px)",
                overflowY: "scroll",
                marginBottom: "12px",
                userSelect: "none",
              }}
            >
              {questions &&
                questions.length > 0 &&
                questions.map((item, index) => (
                  <div style={{ marginBottom: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          minWidth: "37px",
                          fontSize: "16px",
                          color: "rgba(1, 17, 61, 0.85)",
                          fontWeight: 600,
                        }}
                      >
                        {item.questionId}
                      </div>

                      <div
                        style={{
                          minWidth: "60px",
                          fontSize: "14px",
                          color: "rgba(1, 17, 61, 0.85)",
                        }}
                      >
                        ({item.questionScore}
                        {trans("global.point", "分")})
                      </div>

                      <div style={{ position: "relative" }}>
                        <InputNumber
                          id={`scoreInput_${item.questionId}`}
                          className="gradingPapersQuestionScoreNumber"
                          formatter={(value) =>
                            `${keyboardMode % 2 == 0 ? "-" : "+"}${value}`
                          }
                          parser={(value) => value.replaceAll(/[+-]/g, "")}
                          onFocus={() => {
                            startValue = item.studentScore;
                          }}
                          value={
                            item.studentScore || item.studentScore === 0
                              ? keyboardMode % 2 == 0
                                ? Number(item.questionScore) -
                                  Number(item.studentScore)
                                : Number(item.studentScore)
                              : undefined
                          }
                          onBlur={(e) => {
                            this.handleScoreInputBlur(e, item.questionId);
                          }}
                          onChange={(value) => {
                            this.setQuestionScore(item.questionId, value);
                          }}
                          onPressEnter={(e) => {
                            this.handleScoreInputEnter(e, item.questionId);
                          }}
                        />
                        {/* 这里自定义加减分快捷键，避免onChange事件监听错误 */}
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            bottom: 0,
                            height: "100%",
                            width: "23px",
                            fontSize: "12px",
                            zIndex: 9,
                          }}
                        >
                          <div className={styles.inputToolIcon}>
                            <Icon
                              type="up"
                              onClick={() => {
                                this.inputToolChange(item.questionId, "up");
                              }}
                            />
                          </div>
                          <div className={styles.inputToolIcon}>
                            <Icon
                              type="down"
                              onClick={() => {
                                this.inputToolChange(item.questionId, "down");
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.scoreResult}>
                        <span
                          style={{
                            fontWeight: "500",
                            color: "rgba(1, 17, 61, 0.65)",
                            fontSize: "14px",
                          }}
                        >
                          {trans("global.yourScore", "得分")}&nbsp;
                        </span>
                        <span
                          style={{
                            color: "#FF0000",
                            fontSize: "20px",
                            fontWeight: "500",
                          }}
                        >
                          {item.studentScore}
                        </span>
                      </div>
                    </div>
                    <div
                      id={`errorMsgBox_${index}`}
                      className={styles.errMessageBox}
                    >
                      {trans("gradingPapers.maxScorePrefix", "最高分为")}
                      {item.questionScore}
                      {trans("global.point", "分")}
                    </div>
                  </div>
                ))}
            </div>

            <MyButton
              typeclass="confirmBtn"
              sizeclass="commonBtn"
              style={{ width: "100%" }}
              loading={this.state.isSubmitLoading}
              onClick={this.submitQuestionScore}
            >
              {trans("global.submit", "提交")}
            </MyButton>

            <div className={styles.nextBox}>
              <div className={styles.isAuto}>
                <Checkbox
                  onChange={this.changeAutoNext}
                  checked={this.state.isAutoNext}
                />
                <span className={styles.autoNext}>
                  {trans("global.autoNext", "评分后自动下一份")}
                </span>
                {this.state.keyboardMode == 1 ||
                this.state.keyboardMode == 2 ? (
                  <>
                    <Checkbox
                      style={{ marginLeft: "10px" }}
                      onChange={this.changeAutoSubmit}
                      checked={this.state.isAutoSubmit}
                    />
                    <span className={styles.autoNext}>
                      {trans(
                        "gradingPapers.autoSubmitAfterScoring",
                        "评分后自动提交",
                      )}
                    </span>
                  </>
                ) : null}
              </div>
              <div className={styles.nextBtn}>
                <span
                  className={styles.feedback}
                  onClick={() => this.getQuestionImage(2, this.questionIds)}
                >
                  <Icon type="double-left" style={{ marginRight: 12 }} />
                  {trans("global.feedback", "回评")}
                </span>
                <span
                  className={styles.continue}
                  onClick={() => this.getQuestionImage(1, this.questionIds)}
                >
                  {trans("global.continue", "继续")}
                  <Icon type="double-right" style={{ marginLeft: 12 }} />
                </span>
              </div>
            </div>
          </div>
        </div>
        <ShowFile
          previewVisible={this.state.previewVisible}
          previewInfo={imgArr}
          lookDetail={this.lookDetail}
          imgchange={true}
        />
      </div>
    );
  }
}

export default connect(({ home, global, publishToStudent, marking }) => ({
  questionIdOrPiece: marking.questionIdOrPiece,
  questionImage: marking.questionImage,
  studentExamPaperImage: marking.studentExamPaperImage,
  refreshSchedule: marking.refreshSchedule,
}))(GradingPapers);

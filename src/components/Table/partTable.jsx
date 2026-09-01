import React, { PureComponent } from "react";
import {
  Empty,
  Input,
  message,
  Modal,
  Popover,
  Progress,
  Select,
  Spin,
  Switch,
  Table,
} from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";
import ShowFile from "../UseFileItem/showFile";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Search } = Input;
const { Option } = Select;

/**
 *
 * @param studentRate
 */
function analysisProgressPercent(studentRate) {
  const value = Number.parseFloat(studentRate);
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 1,
      groupId: 0,
      pageNo: 1,
      stuName: "",
      imgArr: [],
      tabCheck: 1,
      modalVisible: false,
      studentNumVisible: false,
      stuNameBlue: "",
      questionNumberArr: [], // 题号数组
      groupId1: 0,
      questionId: "",
      questionNo: "",
      questionIdArr: [],
      getGroupStudentsList: [],
      singleInfoList: [],
      graying1: false,
      graying2: false,
      spinVisb: false,
      singleInfoListAll: [],
      sectionVis: "",
      getGroupStudentsListAll: [],
      previewVisible: false,
      answerDetailsSpecify: false,
      expandStatus: false,
    };
    this.questionIndex = "";
  }
  componentDidMount() {
    this.getPage(null, true);
  }
  changeClass = (value) => {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
      },
      () => {
        if (this.state.tabCheck === 2) {
          this.getPage(this.state.tabCheck);
        } else {
          this.getPage();
        }
      },
    );
  };
  changeClassModal = (value) => {
    this.setState(
      {
        groupId1: value,
        pageNo: 1,
        stuNameBlue: "",
      },
      () => {
        this.props
          .dispatch({
            type: "home/getGroupStudents",
            payload: {
              groupId: value == 0 ? "" : value,
              examId: this.props.examId,
              filterFlag: this.state.answerDetailsSpecify,
            },
          })
          .then(() => {
            this.setState({
              getGroupStudentsList: this.props.getGroupStudents,
              getGroupStudentsListAll: this.props.getGroupStudents,
            });
          });
        this.props
          .dispatch({
            type: "home/postClassQuestionAnalysis",
            payload: {
              examId: this.props.examId,
              groupId: value == 0 ? "" : value,
              questionId: this.state.questionId,
              questionNo: this.state.questionNo,
              filterFlag: this.state.answerDetailsSpecify,
            },
          })
          .then(() => {
            this.setState({
              singleInfoList:
                this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
              singleInfoListAll:
                this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
            });
          });
      },
    );
  };
  changeQuestionNoModal = (value) => {
    this.setState(
      {
        questionNo: value,
        stuNameBlue: "",
      },
      () => {
        this.props
          .dispatch({
            type: "home/getGroupStudents",
            payload: {
              groupId: this.state.groupId1 == 0 ? "" : this.state.groupId1,
              examId: this.props.examId,
              filterFlag: this.state.answerDetailsSpecify,
            },
          })
          .then(() => {
            this.setState({
              getGroupStudentsList: this.props.getGroupStudents,
              getGroupStudentsListAll: this.props.getGroupStudents,
            });
          });
        let ind = this.state.questionNumberArr.indexOf(value);
        this.props
          .dispatch({
            type: "home/postClassQuestionAnalysis",
            payload: {
              examId: this.props.examId,
              groupId: this.state.groupId1 == 0 ? "" : this.state.groupId1,
              questionId: this.state.questionIdArr[ind],
              questionNo: value,
              filterFlag: this.state.answerDetailsSpecify,
            },
          })
          .then(() => {
            this.setState({
              singleInfoList:
                this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
              singleInfoListAll:
                this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
            });
          });
      },
    );
  };
  // selectFirst 是否默认选中第一个
  getPage = (check, selectFirst) => {
    this.props.dispatch({
      type: "home/getClassList",
      payload: {
        examId: this.props.examId,
      },
      callback: (res) => {
        if (res.status) {
          if (selectFirst && res.content[0]) {
            this.setState({
              groupId: res.content[0]?.groupId,
            });
          }

          this.props
            .dispatch({
              type: "home/getAnswerDetails",
              payload: {
                examId: this.props.examId,
                // 初始化 ？ 选择第一个班级 ： 选择当前选中的年级
                groupId: selectFirst
                  ? res.content[0]
                    ? res.content[0].groupId
                    : ""
                  : this.state.groupId == 0
                    ? ""
                    : this.state.groupId,
                type: check && check === 2 ? 1 : null,
                filterFlag: this.state.answerDetailsSpecify,
              },
            })
            .then(() => {
              if (check && check === 2) {
                this.renderClassChart();
              }
              let array1 = [];
              let array2 = [];
              this.props.answerDetails &&
                this.props.answerDetails.length &&
                this.props.answerDetails.map((item) => {
                  array1.push(item.questionNo);
                  array2.push(item.questionId);
                });
              this.setState({
                questionNumberArr: array1,
                questionIdArr: array2,
              });
            });
        } else {
          message.error(res.message);
        }
      },
    });
  };
  onSearch = (value) => {
    this.getPage();
  };
  changeSearch = (e) => {
    this.setState({
      stuName: e.target.value,
    });
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
  testClick = (id) => {
    // console.log(id, "111");
    if (!id) return;
    this.props.dispatch({
      type: "home/getItem",
      payload: {
        questionId: id,
        examId: this.props.examId,
        paperId: this.props.paperId,
      },
    });
  };
  openText = (id) => {
    this.props
      .dispatch({
        type: "home/getStudentOriginal",
        payload: {
          examId: this.props.examId,
          studentId: id,
        },
      })
      .then(() => {
        let array = [];
        this.props.studentOriginal &&
          this.props.studentOriginal.length &&
          this.props.studentOriginal.map((item) => {
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
  changeTab2 = (check) => {
    this.props.dispatch({
      type: "home/clearDetail",
    });
    this.setState(
      {
        tabCheck: check,
      },
      () => {
        this.getPage(check);
        // if (check == 2) {
        //   this.renderClassChart();
        // }
      },
    );
  };
  renderClassChart = () => {
    $("#answerChart").find("canvas").remove();
    const { answerDetails } = this.props;

    // console.log(groupScoreList, "111");
    // const dom = document.getElementById("answerChart");
    let newData = [];
    let rightObject = {
      name: "正确",
    };
    let wrongObject = {
      name: "错误",
    };
    let newArray = [];
    let newWrong = [];
    const mountNode = document.querySelector("#answerChart");
    if (mountNode && mountNode.children && mountNode.children.length > 0) {
      mountNode.children[0].remove();
    }
    let questionList = [];
    if (answerDetails && answerDetails.length > 0) {
      answerDetails.map((item) => {
        rightObject[`题目${item.showQuestionNumber}`] = item.questionAccuracy;
        rightObject.id = item.showQuestionNumber;
        wrongObject[`题目${item.showQuestionNumber}`] = item.questionErrorRate;
        questionList.push(`题目${item.showQuestionNumber}`);
        newArray.push({
          year: `题目${item.showQuestionNumber}`,
          得分率: Number.parseInt(item.scoreRate.split("%")[0]),
        });
        // newWrong.push({
        //   name: '错误',
        //   year: `题目${item.questionNo}`,
        //   value: item.questionErrorRate,
        //   number: item.answerCorrectStudentNum.studentList.length || 0,
        //   className: 'wrongTooltip',
        // })
      });
    }
    newData.push(rightObject, wrongObject);
    newData = [...newArray, ...newWrong];
    console.log(newArray, "nns");
    // var ds = new DataSet();
    // var dv = ds.createView().source(newData);
    // dv.transform({
    //   type: 'percent',
    //   fields: 'value', // 展开字段集
    //   key: 'questionNum', // key字段
    //   value: '比率',
    //   color: 'color', // value字段
    // });

    var chart = new G2.Chart({
      container: mountNode,
      forceFit: true,
      height: 300,
      padding: [30, 30, 60, 50],
    });
    const defs = {
      得分率: {
        min: 0, // 手动指定最小值
        max: 100, // 手动指定最大值
        formatter: (value) => {
          // 设置坐标轴和提示框的文字
          return value + "%";
        },
      },
    };
    chart.source(newArray, defs);

    chart
      .interval()
      .position("year*得分率")
      .size(20)
      .color("year*得分率", [
        "#3d94ff",
        "#12CC67",
        "#FFE030",
        "#FC7D7D",
        "#4BE4E7",
        "#19A978",
        "#FF9451",
        "#B169EB",
        "#E286D2",
        "#3D82D6",
        "#CC8C47",
        "#B0CAFF",
        "#CE6C6C",
        "#C0DF35",
        "#D4B589",
        "#C1C1C1",
      ]);
    chart.render();
    chart.on("interval:click", (event_) => {
      const newData = event_.data;
      const questionNumber = newData._origin.year.split("题目")[1];
      let id = null;
      answerDetails.map((item) => {
        if (item.questionNo === questionNumber) {
          id = item.questionId;
        }
      });
      if (!id) {
        return;
      }
      this.props
        .dispatch({
          type: "home/getItem",
          payload: {
            questionId: id,
            examId: this.props.examId,
            paperId: this.props.paperId,
          },
        })
        .then(() => {
          this.setState({
            modalVisible: !this.state.modalVisible,
          });
        });
    });
  };

  changeModal = () => {
    this.setState({
      modalVisible: !this.state.modalVisible,
    });
  };

  // 点击出错人数
  clickStudentNum = (record) => {
    // console.log(record, "222");
    this.questionIndex = record.index;
    this.props
      .dispatch({
        type: "home/postClassQuestionAnalysis",
        payload: {
          examId: this.props.examId,
          groupId: this.state.groupId1 == 0 ? "" : this.state.groupId1,
          questionId: record.questionId ? record.questionId : "",
          questionNo: record.questionNo,
          filterFlag: this.state.answerDetailsSpecify,
        },
      })
      .then(() => {
        this.setState(
          {
            studentNumVisible: true,
            questionId: record.questionId ? record.questionId : "",
            questionNo: record.questionNo,
            singleInfoList:
              this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
            singleInfoListAll:
              this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
          },
          () => {
            this.props
              .dispatch({
                type: "home/getGroupStudents",
                payload: {
                  examId: this.props.examId,
                  filterFlag: this.state.answerDetailsSpecify,
                },
              })
              .then(() => {
                this.setState(
                  {
                    getGroupStudentsList: this.props.getGroupStudents,
                    getGroupStudentsListAll: this.props.getGroupStudents,
                  },
                  () => {},
                );
              });
          },
        );
      });
  };

  handleOkStudentNum = (e) => {
    this.setState({
      studentNumVisible: false,
      groupId1: 0,
    });
  };

  handleCancelStudentNum = (e) => {
    this.setState({
      studentNumVisible: false,
      groupId1: 0,
    });
  };

  // 点击学生姓名
  clickStuName = (id, index) => {
    if (this.state.check == 2) return;
    if (this.state.stuNameBlue == id) {
      this.setState({
        stuNameBlue: "",
      });
    } else {
      this.setState({
        stuNameBlue: id,
      });
      const dom = document.getElementById(`text${id}`);
      dom.scrollIntoView(true);
    }
  };

  // 点击试卷
  clickQuestion = (id) => {
    if (this.state.stuNameBlue == id) {
      this.setState({
        stuNameBlue: "",
      });
    } else {
      this.setState({
        stuNameBlue: id,
      });
      const dom = document.getElementById(`text${id}`);
      dom.scrollIntoView(true);
    }
  };

  screeningStudents = (array, questionScore) => {
    let newArray = [];
    let newArray1 = [];
    array &&
      array.length &&
      array.map((item) => {
        newArray.push(item.studentId);
      });
    this.setState({
      sectionVis: questionScore,
    });
    // this.props.dispatch({
    //   type: "home/getGroupStudents",
    //   payload: {
    //     groupId: this.state.groupId1 == 0 ? "" : this.state.groupId1,
    //     studentIdList: newArr,
    //     examId: this.props.examId,
    //   },
    // });

    this.state.singleInfoListAll.length &&
      this.state.singleInfoListAll.map((item) => {
        if (newArray.includes(item.studentId)) {
          newArray1.push(item);
        }
      });
    console.log(newArray1, "333");
    this.setState({
      getGroupStudentsList: array,
      singleInfoList: newArray1,
    });
  };

  // 点击上一题
  // previousQuestionClick = () => {
  //   if (this.questionIndex < 1) {
  //     this.setState({
  //       graying1: true,
  //     });
  //   } else {
  //     this.questionIndex = this.questionIndex - 1;
  //     this.setState({
  //       spinVisb: true,
  //     });
  //     this.props
  //       .dispatch({
  //         type: "home/getGroupStudents",
  //         payload: {
  //           examId: this.props.examId,
  //           filterFlag: this.state.answerDetailsSpecify,
  //         },
  //       })
  //       .then(() => {
  //         this.setState({
  //           getGroupStudentsList: this.props.getGroupStudents,
  //         });
  //       });
  //     this.props
  //       .dispatch({
  //         type: "home/postClassQuestionAnalysis",
  //         payload: {
  //           examId: this.props.examId,
  //           groupId: this.state.groupId1 == 0 ? "" : this.state.groupId1,
  //           questionId: this.state.questionIdArr[this.questionIndex],
  //           questionNo: this.state.questionNumberArr[this.questionIndex],
  //           filterFlag: this.state.answerDetailsSpecify,
  //         },
  //       })
  //       .then(() => {
  //         this.setState({
  //           studentNumVisible: true,
  //           singleInfoList:
  //             this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
  //           questionId: this.state.questionIdArr[this.questionIndex],
  //           questionNo: this.state.questionNumberArr[this.questionIndex],
  //           graying2: false,
  //           spinVisb: false,
  //           singleInfoListAll:
  //             this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
  //         });
  //         console.log(this.questionIndex, "222");
  //       });
  //   }
  // };

  // 点击下一题
  // nextQuestionClick = () => {
  //   if (this.questionIndex > this.state.questionNumberArr.length - 2) {
  //     this.setState({
  //       graying2: true,
  //     });
  //   } else {
  //     this.questionIndex = this.questionIndex + 1;
  //     this.setState({
  //       spinVisb: true,
  //     });
  //     this.props
  //       .dispatch({
  //         type: "home/getGroupStudents",
  //         payload: {
  //           examId: this.props.examId,
  //           filterFlag: this.state.answerDetailsSpecify,
  //         },
  //       })
  //       .then(() => {
  //         this.setState({
  //           getGroupStudentsList: this.props.getGroupStudents,
  //         });
  //       });
  //     this.props
  //       .dispatch({
  //         type: "home/postClassQuestionAnalysis",
  //         payload: {
  //           examId: this.props.examId,
  //           groupId: this.state.groupId1 == 0 ? "" : this.state.groupId1,
  //           questionId: this.state.questionIdArr[this.questionIndex],
  //           questionNo: this.state.questionNumberArr[this.questionIndex],
  //           filterFlag: this.state.answerDetailsSpecify,
  //         },
  //       })
  //       .then(() => {
  //         this.setState({
  //           studentNumVisible: true,
  //           singleInfoList:
  //             this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
  //           questionId: this.state.questionIdArr[this.questionIndex],
  //           questionNo: this.state.questionNumberArr[this.questionIndex],
  //           graying1: false,
  //           spinVisb: false,
  //           singleInfoListAll:
  //             this.props.classQuestionAnalysis.singleItemAndStudentInfoList,
  //         });
  //         console.log(this.questionIndex, "222");
  //       });
  //   }
  // };

  //点击查看原卷
  clickSeeTest = (imgArray) => {
    this.setState(
      {
        imgArr: imgArray,
      },
      () => {
        const img = document.querySelector("#img").querySelector("img");
        img?.click();
      },
    );
  };

  clickIcon = () => {
    this.setState({
      sectionVis: "",
      singleInfoList: this.state.singleInfoListAll,
      getGroupStudentsList: this.state.getGroupStudentsListAll,
    });
  };

  lookDetail = (status, item) => {
    console.log(item, "111");
    this.setState({
      previewVisible: status || false,
      previewInfo: item || null,
    });
  };
  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        answerDetailsSpecify: checked,
      },
      () => {
        if (this.state.tabCheck === 2) {
          this.getPage(2);
        } else {
          this.getPage();
        }
      },
    );
  };
  expandChange = () => {
    this.setState({
      expandStatus: !this.state.expandStatus,
    });
  };
  render() {
    const {
      currentUser,
      basketList,
      basketSubjectId,
      questionScore,
      tableClass,
      answerDetails,
      questionItem,
      classListData,
      studentOriginal,
      getGroupStudents,
    } = this.props;
    const {
      check,
      studentNumVisible,
      stuNameBlue,
      questionBlue,
      getGroupStudentsList,
      singleInfoList,
      spinVisb,
      sectionVis,
      questionNumberArr,
      imgArr,
    } = this.state;
    let completion;
    if (questionItem.type == 3) {
      completion = questionItem.gapFillingAnswer?.answers.join(",");
    }
    const content1 = (
      <div className="examItem">
        <div
          dangerouslySetInnerHTML={{ __html: questionItem.content }}
          style={{ marginBottom: "10px" }}
        ></div>
        {questionItem.type == 1 || questionItem.type == 2 ? (
          <>
            {questionItem.optionList &&
              questionItem.optionList.length &&
              questionItem.optionList.map((item) => (
                <div
                  dangerouslySetInnerHTML={{
                    __html: `${item.answers}`,
                  }}
                ></div>
              ))}
            <div>
              {trans("global.rightAnswer", "正确答案：")}：
              {questionItem.answer ? questionItem.answer : null}
            </div>
          </>
        ) : questionItem.type == 3 ? (
          <div
            dangerouslySetInnerHTML={{
              __html: ` 正确答案：${completion ? completion : ""}`,
            }}
          ></div>
        ) : questionItem.type == 4 ? (
          <div>
            {trans("global.rightAnswer", "正确答案：")}：
            {questionItem.answer
              ? trans("global.right", "正确")
              : trans("global.wrong", "错误")}
          </div>
        ) : questionItem.type == 5 ? (
          <div
            dangerouslySetInnerHTML={{
              __html: ` 正确答案：${questionItem.answer}`,
            }}
            style={{ display: "inline-block" }}
          ></div>
        ) : questionItem.type == 6 &&
          questionItem.sonQuestionList &&
          questionItem.sonQuestionList.length > 0 ? (
          questionItem.sonQuestionList.map((ii) => (
            <div>
              <div
                dangerouslySetInnerHTML={{ __html: ii.content }}
                style={{ marginBottom: "10px" }}
              ></div>
              {ii.type == 1 || ii.type == 2 ? (
                <>
                  {ii.optionList &&
                    ii.optionList.length &&
                    ii.optionList.map((item) => (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `${item.answers}`,
                        }}
                      ></div>
                    ))}
                  <div>
                    {trans("global.rightAnswer", "正确答案：")}：
                    {questionItem.answer}
                  </div>
                </>
              ) : ii.type == 3 ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: ` 正确答案：${ii.gapFillingAnswer && ii.gapFillingAnswer.answers && ii.gapFillingAnswer?.answers.join(",") ? ii.gapFillingAnswer?.answers.join(",") : ""}`,
                  }}
                ></div>
              ) : ii.type == 4 ? (
                <div>
                  {trans("global.rightAnswer", "正确答案：")}：
                  {ii.answer
                    ? trans("global.right", "正确")
                    : trans("global.wrong", "错误")}
                </div>
              ) : ii.type == 5 ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: ` 正确答案：${ii.answer}`,
                  }}
                  style={{ display: "inline-block" }}
                ></div>
              ) : null}
            </div>
          ))
        ) : null}
      </div>
    );
    let answerDetailsArray = [];
    answerDetails &&
      answerDetails.length &&
      answerDetails.map((item, index) => {
        answerDetailsArray.push({
          key: item.questionId,
          answerCorrectStudentNum: item.answerCorrectStudentNum,
          answerErrorStudentNumList: item.answerErrorStudentNumList,
          answerErrorStudentRate: item.answerErrorStudentRate,
          averageScore: item.averageScore,
          levelTypeName: item.levelTypeName,
          questionId: item.questionId,
          questionNo: item.questionNo,
          showQuestionNumber: item.showQuestionNumber,
          questionScore: item.questionScore,
          questionTypeName: item.questionTypeName,
          scoreRate: item.scoreRate,
          gradeScoreRate: item.gradeScoreRate,
          index: index,
        });
      });
    const answerDetailsNewArray = answerDetailsArray;
    // let newDataSource = [];

    let newColumns = [
      {
        title: trans("analysis.questionIndex", "题号"),
        dataIndex: "showQuestionNumber",
        key: "showQuestionNumber",
        width: 110,
        sorter: (a, b) => {
          // console.log(a, b, "ccc");
          return a.questionNo - b.questionNo;
        },
        render: (text, record, index) => {
          return (
            <Popover
              content={
                record.questionId ? (
                  content1
                ) : (
                  <div> {trans("global.noContent", "暂无内容")}</div>
                )
              }
              trigger="click"
              placement="right"
              overlayStyle={{ maxWidth: "600px" }}
            >
              <span
                onClick={() => this.testClick(record.questionId)}
                style={{ cursor: "pointer" }}
                className={styles.testIndex}
              >
                {record.showQuestionNumber}
              </span>
            </Popover>
          );
        },
      },
      {
        title: trans("global.questionType", "题型"),
        dataIndex: "questionTypeName",
        key: "questionTypeName",
        width: 100,
      },
      {
        title: trans("analysis.questionScore", "分值"),
        dataIndex: "questionScore",
        key: "questionScore",
        width: 90,
      },
      {
        title: trans("analysis.hardValue", "难度"),
        dataIndex: "levelTypeName",
        key: "levelTypeName",
        width: language ? 90 : 100,
      },
      {
        title: trans("global.avgScore", "平均分"),
        dataIndex: "averageScore",
        key: "averageScore",
        width: 100,
      },
      {
        title: trans("global.gradeScoreRate", "年级得分率"),
        dataIndex: "gradeScoreRate",
        key: "gradeScoreRate",
        width: 110,
      },
      {
        title: trans("analysis.classScoreRate", "班级得分率"),
        dataIndex: "scoreRate",
        key: "scoreRate",
        width: 130,
        className: this.state.groupId ? styles.hiden : "",
        sorter: (a, b) => {
          let a1 = a.scoreRate;
          let b1 = b.scoreRate;
          a1 = a1.slice(0, Math.max(0, a1.length - 1));
          b1 = b1.slice(0, Math.max(0, b1.length - 1));
          return a1 - b1;
        },
        render: (text, record, index) => {
          let txt = text.slice(0, Math.max(0, text.length - 1));
          return (
            <div
              className={
                comparePercentages(text, record.gradeScoreRate) == -1
                  ? styles.noPass
                  : ""
              }
            >
              {text}
            </div>
          );
        },
      },
      {
        title: trans("global.correctAnswersNumber", "答对人数"),
        dataIndex: "answerCorrectStudentNum",
        key: "answerCorrectStudentNum",
        width: language ? 120 : 220,
        render: (text, record, index) => {
          return (
            <div
              style={{ cursor: "pointer" }}
              onClick={() => this.clickStudentNum(record)}
            >
              {text?.studentNum}
            </div>
          );
        },
        sorter: (a, b) => {
          let a1 = a.answerCorrectStudentNum.studentNum;
          let b1 = b.answerCorrectStudentNum.studentNum;
          const indA = a1.indexOf(":");
          const indB = b1.indexOf(":");
          if (indA != -1) {
            const nub = a1.indexOf(":");
            a1 = a1.slice(nub + 1);
            // console.log(a1,"q");
          }
          if (indB != -1) {
            const nub = b1.indexOf(":");
            b1 = b1.slice(nub + 1);
            // console.log(b1,"q");
          }

          console.log(a1, b1, "q");
          return a1 - b1;
        },
      },
      {
        title: trans("global.errorsNumber", "出错人数"),
        dataIndex: "answerErrorStudentNumList",
        key: "answerErrorStudentNumList",
        width: language ? 120 : 220,
        render: (text, record, index) => {
          return (
            <>
              {text?.map((item) => {
                let string_ = item.studentNum;
                const nub = string_.indexOf(":");
                const s = string_.slice(nub + 1);
                return (
                  <div
                    key={`${record.questionId}-error-count-${item.studentNum}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => this.clickStudentNum(record)}
                  >
                    {item.studentNum}
                  </div>
                );
              })}
            </>
          );
        },
      },
      {
        title: trans("global.errorRate", "出错率"),
        dataIndex: "answerErrorStudentRate",
        key: "answerErrorStudentRate",
        width: 100,
        render: (text, record, index) => {
          // console.log(text, record, index, "333");
          return (
            <div
              onClick={() => this.clickStudentNum(record)}
              style={{ cursor: "pointer" }}
            >
              {text?.map((item, itemIndex) => (
                <div key={`${record.questionId}-error-rate-${itemIndex}`}>
                  {item}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        title: trans("global.option", "操作"),
        dataIndex: "index",
        key: "index",
        width: 70,
        render: (text, record, index) => {
          // console.log(text, record, index, "333");
          return (
            <div
              style={{
                cursor: "pointer",
                // border: "1px red solid",
                color: "#0445FC",
                // textAlign: "center",
                fontFamily: "PingFangSC-Regular",
              }}
              onClick={() => this.clickStudentNum(record)}
            >
              {trans("global.details", "详情")}
            </div>
          );
        },
      },
    ];
    newColumns.push({
      title: "",
    });
    const columns = newColumns;
    const options = {
      zoom: 0.75,
      toolbar: {
        zoomIn: { size: "large" },
        zoomOut: { size: "large" },
        oneToOne: { size: "large" },
        reset: { size: "large" },
        prev: { show: true, size: "large" },
        play: { show: true, size: "large" },
        next: { show: true, size: "large" },
        rotateLeft: { size: "large" },
        rotateRight: { size: "large" },
        flipHorizontal: { size: "large" },
        flipVertical: { size: "large" },
      },
    };
    console.log(imgArr, "333");
    return (
      <div className={styles.questionTable} id="table2">
        <div className={styles.tableBox}>
          <div className={styles.tableBoxHeader}>
            {/* <span className={styles.tableHeaderSpan}></span> */}
            <span className={styles.tableHeaderTitle}>
              {trans("data.answerDetails", "作答明细")}
            </span>
            <span className={styles.viewBox}>
              <span
                onClick={this.changeTab2.bind(this, 1)}
                className={[
                  styles.viewTab,
                  this.state.tabCheck === 1 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.listView", "列表视图")}
              </span>
              <span
                onClick={this.changeTab2.bind(this, 2)}
                className={[
                  styles.viewTab,
                  this.state.tabCheck === 2 ? styles.isCheck : "",
                ].join(" ")}
              >
                {trans("global.histogram", "柱状图")}
              </span>
            </span>

            {this.state.tabCheck === 1 ? (
              <Select onChange={this.changeClass} value={this.state.groupId}>
                <Option value={0} key={0}>
                  <span>{trans("global.allClass", "全部班级")}</span>
                </Option>
                {classListData && classListData.length > 0
                  ? classListData.map((item) => (
                      <Option value={item.groupId} key={item.groupId}>
                        <span title={item.groupName}>
                          {locale() == "en" ? item.groupEName : item.groupName}
                        </span>
                      </Option>
                    ))
                  : null}
              </Select>
            ) : null}
            <div className={styles.operationS}>
              {this.props.filterStudentListPermissions.haveFilterStudentList ? (
                <span className={styles.nameSwith2}>
                  {trans("global.specifyAnalysis", "指定分析")}
                  <Switch
                    defaultChecked
                    checked={this.state.answerDetailsSpecify}
                    onChange={this.courseDetailSpecifyChange}
                    style={{ marginLeft: "4px" }}
                  />
                </span>
              ) : null}

              <a
                href={`${
                  window.location.origin
                }/api/exam/question/answer/detail/report/export?examId=${
                  this.props.examId
                }&groupId=${
                  this.state.groupId == 0 ? "" : this.state.groupId
                }&filterFlag=${this.state.answerDetailsSpecify}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className={styles.exportS}>
                  {trans("global.export", "导出")}
                </span>
              </a>
            </div>
          </div>
          <div id="table1" className={styles.tableBoxContent1}>
            {this.state.tabCheck === 1 ? (
              <Table
                dataSource={answerDetailsNewArray}
                pagination={false}
                scroll={{ x: 900 }}
                columns={columns}
              />
            ) : (
              <div id="answerChart"></div>
            )}
          </div>
        </div>
        <Modal
          footer={null}
          visible={this.state.modalVisible}
          closable={false}
          width={700}
          onCancel={this.changeModal}
        >
          <div>
            <div
              dangerouslySetInnerHTML={{ __html: questionItem.content }}
              style={{ marginBottom: "10px" }}
            ></div>
            {questionItem.type == 1 || questionItem.type == 2 ? (
              <>
                {questionItem.optionList &&
                  questionItem.optionList.length &&
                  questionItem.optionList.map((item) => (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: `${item.answers}`,
                      }}
                    ></div>
                  ))}
                <div>
                  {trans("global.rightAnswer", "正确答案：")}：
                  {questionItem.answer}
                </div>
              </>
            ) : questionItem.type == 3 ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: ` 正确答案：${
                    questionItem.gapFillingAnswer?.answers
                      ? questionItem.gapFillingAnswer?.answers.join(",")
                      : ""
                  }`,
                }}
              ></div>
            ) : questionItem.type == 4 ? (
              <div>
                {trans("global.rightAnswer", "正确答案：")}：
                {questionItem.answer
                  ? trans("global.right", "正确")
                  : trans("global.wrong", "错误")}
              </div>
            ) : questionItem.type == 5 ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: ` 正确答案：${questionItem.answer}`,
                }}
                style={{ display: "inline-block" }}
              ></div>
            ) : null}
          </div>
        </Modal>

        <Modal
          title={
            <div className="header">
              {/* <span className="questionIndex">
                {trans("analysis.questionIndex", "题号")}：
                {this.props.classQuestionAnalysis?.questionNo}
              </span> */}
              <span className="allClass">
                <Select
                  onChange={this.changeClassModal}
                  value={this.state.groupId1}
                  width={158}
                >
                  <Option value={0} key={0}>
                    <span>{trans("global.allClass", "全部班级")}</span>
                  </Option>
                  {/* {tableClass.map((item) => (
                  <Option value={item.groupId} key={item.groupId}>
                    <span>{language ? item.groupName : item.groupEnName}</span>
                  </Option>
                ))} */}
                  {classListData && classListData.length > 0
                    ? classListData.map((item) => (
                        <Option value={item.groupId} key={item.groupId}>
                          <span title={item.groupName}>
                            {locale() == "en"
                              ? item.groupEName
                              : item.groupName}
                          </span>
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className="allQuestionNo">
                <span className="questionIndex">
                  {trans("analysis.questionIndex", "题号")}：
                </span>
                <Select
                  onChange={this.changeQuestionNoModal}
                  value={this.state.questionNo}
                >
                  {/* <Option value={0} key={0}>
                    <span>{trans("global.allClass", "全部班级")}</span>
                  </Option> */}
                  {/* {tableClass.map((item) => (
                  <Option value={item.groupId} key={item.groupId}>
                    <span>{language ? item.groupName : item.groupEnName}</span>
                  </Option>
                ))} */}
                  {questionNumberArr && questionNumberArr.length > 0
                    ? questionNumberArr.map((item) => (
                        <Option value={item} key={item}>
                          <span title={item}>{item}</span>
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className="scoreSpan">
                <span className="smallGreenDot"></span>
                <span className="scoreRate">
                  {trans("analysis.knowLedgeScoreRate", "得分率")}：
                  {this.props.classQuestionAnalysis?.scoreRate}
                </span>
                <span className="verticalLine">｜</span>
                <span className="scoreRateNum">
                  {trans("data.scoreNumber", "得分人数")}：
                  {this.props.classQuestionAnalysis?.answerCorrectStudentCount}
                  {trans("global.person", "人")}
                </span>
                <span className="smallRedDot"></span>
                <span className="scoreRate">
                  {trans("global.errorRate", "出错率")}：
                  {this.props.classQuestionAnalysis?.answerErrorStudentRate}
                </span>
                <span className="verticalLine">｜</span>
                <span className="scoreRateNum1">
                  {trans("global.errorsNumber", "出错人数")}：
                  {this.props.classQuestionAnalysis?.answerErrorStudentCount}
                  {trans("global.person", "人")}
                </span>
              </span>
              {/* <span className="buttonQuestion">
                <button
                  className={[
                    "previousQuestion",
                    this.state.graying1 ? "graying" : "",
                  ].join(" ")}
                  onClick={this.previousQuestionClick}
                >
                  {trans("data.previousQuestion", "上一题")}
                </button>
                <button
                  className={[
                    "nextQuestion",
                    this.state.graying2 ? "graying" : "",
                  ].join(" ")}
                  onClick={this.nextQuestionClick}
                >
                  {trans("data.nextQuestion", "下一题")}
                </button>
              </span> */}
            </div>
          }
          visible={studentNumVisible}
          // visible={true}
          // onOk={this.handleOkStudentNum}
          onCancel={this.handleCancelStudentNum}
          footer={false}
          className={styles.studentNumMod}
          getContainer={false}
          width={1156}
        >
          <Spin spinning={spinVisb}>
            <div className="singleQuestionAnalysis">
              <div style={{ width: "830px" }}>
                <div className="singleQuestionLeft">
                  <div
                    style={{
                      display: "flex",
                      width: "calc(100% - 20px)",
                      marginBottom: "20px",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      background: "#fff",
                      fontFamily: "PingFangSC-Medium",
                      position: "relative",
                      paddingRight: 0,
                    }}
                  >
                    <div
                      className={styles.expandContent}
                      id="paper"
                      style={{
                        height: this.state.expandStatus ? "180px" : "88px",
                        overflow: this.state.expandStatus ? "scroll" : "hidden",
                        paddingRight: "60px",
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            this.props.classQuestionAnalysis.studentItemContent
                              ?.topicDetails,
                        }}
                      ></div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            this.props.classQuestionAnalysis.studentItemContent
                              ?.topicOptions,
                        }}
                      ></div>
                    </div>
                    <div
                      style={{
                        cursor: "pointer",
                        color: "rgba(4,69,252,0.85)",
                        whiteSpace: "nowrap",
                        position: "absolute",
                        right: "30px",
                        top: "14px",
                      }}
                      onClick={this.expandChange}
                    >
                      {this.state.expandStatus
                        ? trans("global.collapse", "收起")
                        : trans("global.expand", "展开")}
                    </div>
                  </div>
                  <div
                    style={{
                      overflowY: "scroll",
                      width: "calc(100% - 20px)",
                      height: this.state.expandStatus
                        ? "calc(100% - 226px)"
                        : "calc(100% - 136px)",
                    }}
                  >
                    {singleInfoList && singleInfoList.length > 0 ? (
                      singleInfoList.map((item) => (
                        <div
                          key={item.studentId}
                          className={[
                            "singleQuestion",
                            stuNameBlue == item.studentId
                              ? "singleQuetionBlue"
                              : "",
                          ].join(" ")}
                          onClick={() => this.clickQuestion(item.studentId)}
                          id={`text${item.studentId}`}
                        >
                          <div className="singleQuestionHeader">
                            <span className="answerOf">
                              {item.studentName}{" "}
                              {trans("data.answerOf", "的作答")}
                            </span>
                            <span
                              className="seeTest"
                              onClick={() => this.openText(item.studentId)}
                            >
                              {trans("global.seeTest", "查看原卷")}
                            </span>
                          </div>
                          <div className="singleQuestionBody">
                            {item.studentAnswerPicture ? (
                              <img src={item.studentAnswerPicture} alt="" />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: item.studentAnswerContent,
                                }}
                              ></div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="originalText">
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="singleQuestionStu">
                <div className="subsectionTop">
                  {this.props.classQuestionAnalysis &&
                    this.props.classQuestionAnalysis
                      .answerErrorStudentInfoList &&
                    this.props.classQuestionAnalysis.answerErrorStudentInfoList
                      .length &&
                    this.props.classQuestionAnalysis.answerErrorStudentInfoList.map(
                      (item) => (
                        <div
                          className={[
                            "subsectionNum",
                            sectionVis == item.questionScore
                              ? "subsectionNumBlur"
                              : "",
                          ].join(" ")}
                          key={item.questionScore}
                        >
                          <div
                            className="leftNumber"
                            onClick={() =>
                              this.screeningStudents(
                                item.studentList,
                                item.questionScore,
                              )
                            }
                          >
                            {item.questionScore}
                          </div>
                          <div
                            className="rightProgress"
                            onClick={() =>
                              this.screeningStudents(
                                item.studentList,
                                item.questionScore,
                              )
                            }
                          >
                            <Progress
                              percent={analysisProgressPercent(
                                item.studentRate,
                              )}
                              showInfo={false}
                              strokeColor={
                                item.isHigher ? "#1EC337" : "#FB5F4E "
                              }
                            />
                            <span className="percentage">
                              {item.studentNum}
                              {trans("global.person", "人")} /{" "}
                              {item.studentRate}
                            </span>
                          </div>
                          {sectionVis == item.questionScore ? (
                            <i
                              className={[icon.iconfont, "editFont"].join(" ")}
                              onClick={this.clickIcon}
                            >
                              &#xe743;
                            </i>
                          ) : null}
                        </div>
                      ),
                    )}
                  {this.props.classQuestionAnalysis &&
                    this.props.classQuestionAnalysis
                      .answerCorrectStudentInfo && (
                      <div
                        className={[
                          "subsectionNum",
                          sectionVis ==
                          this.props.classQuestionAnalysis
                            .answerCorrectStudentInfo.questionScore
                            ? "subsectionNumBlur"
                            : "",
                        ].join(" ")}
                      >
                        <div
                          className="leftNumber"
                          onClick={() =>
                            this.screeningStudents(
                              this.props.classQuestionAnalysis
                                .answerCorrectStudentInfo.studentList,
                              this.props.classQuestionAnalysis
                                .answerCorrectStudentInfo.questionScore,
                            )
                          }
                        >
                          {
                            this.props.classQuestionAnalysis
                              .answerCorrectStudentInfo.questionScore
                          }
                        </div>
                        <div
                          className="rightProgress"
                          onClick={() =>
                            this.screeningStudents(
                              this.props.classQuestionAnalysis
                                .answerCorrectStudentInfo.studentList,
                              this.props.classQuestionAnalysis
                                .answerCorrectStudentInfo.questionScore,
                            )
                          }
                        >
                          <Progress
                            percent={analysisProgressPercent(
                              this.props.classQuestionAnalysis
                                .answerCorrectStudentInfo.studentRate,
                            )}
                            showInfo={false}
                            strokeColor={
                              this.props.classQuestionAnalysis
                                .answerCorrectStudentInfo.isHigher
                                ? "#1EC337"
                                : "#FB5F4E "
                            }
                          />
                          <span className="percentage">
                            {
                              this.props.classQuestionAnalysis
                                .answerCorrectStudentInfo.studentNum
                            }
                            人 /{" "}
                            {
                              this.props.classQuestionAnalysis
                                .answerCorrectStudentInfo.studentRate
                            }
                          </span>
                        </div>
                        {sectionVis ==
                        this.props.classQuestionAnalysis
                          .answerCorrectStudentInfo.questionScore ? (
                          <i
                            className={[icon.iconfont, "editFont"].join(" ")}
                            onClick={this.clickIcon}
                          >
                            &#xe743;
                          </i>
                        ) : null}
                      </div>
                    )}
                </div>
                <div className="subsectionBottom">
                  {getGroupStudentsList &&
                    getGroupStudentsList.length &&
                    getGroupStudentsList.map((item, index) => (
                      <span
                        className={[
                          "stuName",
                          stuNameBlue == item.studentId ? "stuNameBlue" : "",
                        ].join(" ")}
                        onClick={() => this.clickStuName(item.studentId, index)}
                        key={index}
                      >
                        {item.studentName}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            <ShowFile
              previewVisible={this.state.previewVisible}
              previewInfo={this.state.imgArr}
              lookDetail={this.lookDetail}
              imgchange={true}
            />
          </Spin>
        </Modal>
      </div>
    );
  }
}
export default connect(({ home }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  answerDetails: home.answerDetails,
  questionItem: home.questionItem,
  classListData: home.classListData,
  studentOriginal: home.studentOriginal,
  classQuestionAnalysis: home.classQuestionAnalysis,
  getGroupStudents: home.getGroupStudents,
}))(GlobalHeader);

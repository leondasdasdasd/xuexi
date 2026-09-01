import React, { PureComponent } from "react";
import { SearchTeacher } from "@yungu-fed/yungu-selector";
import {
  Checkbox,
  Dropdown,
  Icon,
  Input,
  InputNumber,
  Menu,
  Popconfirm,
  Popover,
  Radio,
  Select,
  Switch,
  Table,
  Tooltip,
} from "antd";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import { locale, trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const { Option } = Select;
const language = locale() == "en" ? false : true;

class AllocationProcess extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/allocationProcess/:examId").exec(this.url);
    this.examId = JSON.parse(this.pathMatch[1]);
    this.state = {
      epeedIndex: 1,
      isBatch: false,
      isStuNameMarking: true,
      scoringMethodId: 1,
      errorsAnalysis: 3,
      questionAllocationList: [],
      necessaryTeacherVisible: false,
      teacherNameList: [],
      allBlocks: false,
      isChooseScoring: false,
      allTeacherList: [],
      teacherIndex: null,
      questionIndex: null,
      allTerIndex: null,
      batchTeachers: 1,
    };
  }
  componentDidMount() {
    this.props.dispatch({
      type: "marking/getMarkingType",
    });
    this.props.dispatch({
      type: "marking/getAllocationType",
    });
    this.getPage();
    this.props.dispatch({
      type: "marking/getListAllOrgTeachers",
    });
  }

  getPage = () => {
    this.props
      .dispatch({
        type: "marking/getAllocationList",
        payload: {
          examId: this.examId,
        },
      })
      .then(() => {
        const { allocationList } = this.props;
        let array = [];
        allocationList.questionSetting &&
          allocationList.questionSetting.length > 0 &&
          allocationList.questionSetting.map((item) => {
            let object = item;
            object.checkQuestion = false;
            array.push(object);
          });
        this.setState({
          questionAllocationList: array,
          isStuNameMarking: allocationList.showStudentNameStatus,
        });
      });
  };
  back = () => {
    // window.parent.postMessage("false", "*");
    window.close() || this.props.history.goBack();
  };
  clickNextBtn = (number_) => {
    this.setState({
      epeedIndex: number_,
    });
  };
  changeBulkOperation = (e) => {
    this.setState({
      isBatch: e.target.checked,
    });
  };
  changeStuNameMarking = (checked) => {
    this.setState({
      isStuNameMarking: checked,
    });
  };
  changeScoringMethod = (e) => {
    this.setState({
      scoringMethodId: e.target.value,
    });
  };
  changeErrorsAnalysis = (e) => {
    this.setState({
      errorsAnalysis: e,
    });
  };

  changeMarkingType = (e, index) => {
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    array.length > 0 &&
      array.map((item, index_) => {
        let object = item;
        if (index == index_) {
          object.markingType = e;
        }
        newArray.push(object);
      });
    this.setState({
      questionAllocationList: newArray,
    });
  };

  changeAllocationType = (e, index_) => {
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    array.length > 0 &&
      array.map((item, index) => {
        let object = item;
        if (index == index_) {
          object.allocationType = e;
          newArray.push(object);
        } else {
          newArray.push(object);
        }
      });
    this.setState({
      questionAllocationList: newArray,
    });
  };
  chengeMistakeScore = (e, name) => {
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    array.length > 0 &&
      array.map((item) => {
        let object = item;
        if (item.questionInfo == name) {
          object.doubleMarkingErrorScore = e;
          newArray.push(object);
        } else {
          newArray.push(object);
        }
      });
    this.setState({
      questionAllocationList: newArray,
    });
  };
  changeBlockName = (e, name, index) => {
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    array.length > 0 &&
      array.map((item, index_) => {
        let object = item;
        if (index_ == index) {
          object.questionInfo = e.target.value;
          newArray.push(object);
        } else {
          newArray.push(object);
        }
      });
    this.setState({
      questionAllocationList: newArray,
    });
  };
  cancelBlock = (name) => {
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    array.length > 0 &&
      array.map((item) => {
        let object = { ...item };
        if (item.questionInfo == name) {
          item.questionSettingIdInfo &&
            item.questionSettingIdInfo.length > 0 &&
            item.questionSettingIdInfo.map((it, ind) => {
              let newObject = { ...item };
              newObject.questionInfo = "第" + it.questionId + "题";
              newObject.questionIdList = [it.questionId];
              newObject.questionSettingIdInfo = [it];
              newObject.questionScore = it.questionSettingScore;
              newObject.questionSettingIdList = [
                item.questionSettingIdList[ind],
              ];
              newArray.push(newObject);
            });
        } else {
          newArray.push(object);
        }
      });
    this.setState({
      questionAllocationList: newArray,
    });
  };
  clickTeacherName = (text, index, index_) => {
    let nameList = [];
    text &&
      text.length > 0 &&
      text.map((item) => {
        nameList.push({
          id: item.teacherId,
          name: item.teacherName,
        });
      });
    this.setState(
      {
        teacherNameList: nameList,
        teacherIndex: index,
        questionIndex: index_,
        batchTeachers: 1,
      },
      () => {
        this.setState({
          necessaryTeacherVisible: true,
        });
      },
    );
  };
  changeNecessaryTeacherVisible = () => {
    this.setState({
      necessaryTeacherVisible: false,
    });
  };
  searchTeacherConfirm = (ids) => {
    const { allOrgTeachersList } = this.props;
    const { isBatch, allTerIndex, batchTeachers, teacherIndex } = this.state;
    let teacherArray = [];
    ids &&
      ids.length > 0 &&
      ids.map((item) => {
        allOrgTeachersList &&
          allOrgTeachersList.length > 0 &&
          allOrgTeachersList.map((it) => {
            if (item == it.id) {
              teacherArray.push({
                teacherId: it.id,
                teacherName: it.name,
              });
            }
          });
      });
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    array.length > 0 &&
      array.map((item, index) => {
        let object = item;
        if (batchTeachers == 1) {
          if (index == this.state.questionIndex) {
            if (this.state.teacherIndex == 1) {
              object.arbitrationTeacher = teacherArray;
              newArray.push(object);
            } else if (this.state.teacherIndex == 2) {
              object.checkTeacher = teacherArray;
              newArray.push(object);
            } else if (this.state.teacherIndex == 3) {
              object.questionPaperDealTeacher = teacherArray;
              newArray.push(object);
            }
          } else {
            newArray.push(object);
          }
        } else {
          if (isBatch) {
            if (item.checkQuestion) {
              if (allTerIndex == 1) {
                object.arbitrationTeacher = teacherArray;
                newArray.push(object);
              } else if (allTerIndex == 2) {
                object.checkTeacher = teacherArray;
                newArray.push(object);
              } else if (allTerIndex == 3) {
                object.questionPaperDealTeacher = teacherArray;
                newArray.push(object);
              }
            } else {
              newArray.push(object);
            }
          } else {
            if (index == this.state.questionIndex) {
              if (this.state.teacherIndex == 1) {
                object.arbitrationTeacher = teacherArray;
                newArray.push(object);
              } else if (this.state.teacherIndex == 2) {
                object.checkTeacher = teacherArray;
                newArray.push(object);
              } else if (this.state.teacherIndex == 3) {
                object.questionPaperDealTeacher = teacherArray;
                newArray.push(object);
              }
            } else {
              newArray.push(object);
            }
          }
        }
      });
    this.setState({
      questionAllocationList: newArray,
      necessaryTeacherVisible: false,
      questionIndex: null,
      teacherIndex: null,
    });
    console.log(newArray, "zhang");
  };
  changeAllBlocks = (e) => {
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    array.length > 0 &&
      array.map((item) => {
        let object = item;
        object.checkQuestion = e.target.checked;
        newArray.push(object);
      });
    console.log(e.target.checked, "zzzz");
    this.setState({
      allBlocks: e.target.checked,
      isBatch: e.target.checked,
      questionAllocationList: newArray,
    });
  };
  changeQuestionCheck = (e, index) => {
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    let trueArray = [];

    array.length > 0 &&
      array.map((item, index_) => {
        let object = item;
        if (index_ == index) {
          object.checkQuestion = e.target.checked;
        }
        if (item.checkQuestion) {
          trueArray.push(item.checkQuestion);
        }
        newArray.push(object);
      });
    this.setState(
      {
        allBlocks: trueArray.length == newArray.length ? true : false,
        questionAllocationList: newArray,
      },
      () => {
        let array = JSON.parse(
          JSON.stringify(this.state.questionAllocationList),
        );
        let isBuer = false;
        array.length > 0 &&
          array.map((item) => {
            if (item.checkQuestion) {
              isBuer = true;
            }
          });
        this.setState({
          isBatch: isBuer,
        });
      },
    );
  };
  scoringMethodSure = () => {
    const { scoringMethodId, isBatch, errorsAnalysis } = this.state;
    if (isBatch) {
      let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
      let newArray = [];
      array.length > 0 &&
        array.map((item) => {
          let object = item;
          if (item.checkQuestion) {
            object.markingType = scoringMethodId;
            object.doubleMarkingErrorScore = errorsAnalysis;
            newArray.push(object);
          } else {
            newArray.push(object);
          }
        });
      this.setState({
        questionAllocationList: newArray,
        isChooseScoring: false,
      });
    }
  };
  clickChooseAllocation = (type) => {
    const { isBatch } = this.state;
    if (isBatch) {
      let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
      let newArray = [];
      array.length > 0 &&
        array.map((item) => {
          let object = item;
          if (item.checkQuestion) {
            object.allocationType = type;
            newArray.push(object);
          } else {
            newArray.push(object);
          }
        });
      this.setState({
        questionAllocationList: newArray,
      });
    }
  };
  changeDivideQuestionBlocks = () => {
    const { isBatch } = this.state;
    if (isBatch) {
      let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
      let newArray = [];
      let mergeArray = [];
      let ind = 0;
      let isFirst = true;
      array.length > 0 &&
        array.map((item, inde) => {
          let object = item;
          if (item.checkQuestion) {
            if (isFirst) {
              ind = inde;
              isFirst = false;
            }
            mergeArray.push(object);
          } else {
            newArray.push(object);
          }
        });
      let questionIdList = [];
      let questionSettingIdList = [];
      let questionSettingIdInfo = [];
      let questionScore = 0;
      // debugger;
      mergeArray.length > 0 &&
        mergeArray.map((item) => {
          console.log(
            questionSettingIdList,
            item.questionSettingIdList,
            questionIdList,
            item.questionIdList,
            item.questionSettingIdInfo,
            "zhang",
          );
          questionIdList = [...questionIdList, ...item.questionIdList];
          questionSettingIdList = [
            ...questionSettingIdList,
            ...item.questionSettingIdList,
          ];
          questionSettingIdInfo = [
            ...questionSettingIdInfo,
            ...item.questionSettingIdInfo,
          ];
          item.questionSettingIdInfo &&
            item.questionSettingIdInfo.length > 0 &&
            item.questionSettingIdInfo.map((it) => {
              questionScore = questionScore + Number(it.questionSettingScore);
            });
        });
      if (newArray.length > 0) {
        newArray.splice(ind, 0, {
          allocationType: undefined,
          arbitrationTeacher: [],
          checkQuestion: true,
          checkTeacher: null,
          doubleMarkingErrorScore: null,
          doubleMarkingRate: null,
          markingType: undefined,
          questionIdList: questionIdList,
          questionInfo: "题块",
          questionPaperDealTeacher: null,
          questionSettingIdList: questionSettingIdList,
          questionSettingIdInfo: questionSettingIdInfo,
          questionScore: questionScore,
        });
      } else {
        newArray.push({
          allocationType: undefined,
          arbitrationTeacher: [],
          checkQuestion: true,
          checkTeacher: null,
          doubleMarkingErrorScore: null,
          doubleMarkingRate: null,
          markingType: undefined,
          questionIdList: questionIdList,
          questionInfo: "题块",
          questionPaperDealTeacher: null,
          questionSettingIdList: questionSettingIdList,
          questionSettingIdInfo: questionSettingIdInfo,
          questionScore: questionScore,
        });
      }
      this.setState(
        {
          questionAllocationList: newArray,
        },
        () => {
          // const inp = document.getElementById("blockName题块");
          // inp.focus();
        },
      );
    }
  };
  setCorrectionPerson = (index) => {
    if (this.state.isBatch) {
      let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
      let newArray = [];
      let mergeArray = [];
      let ind = 0;
      let teaList = [];
      let isFirst = true;
      array.length > 0 &&
        array.map((item, inde) => {
          let object = item;
          if (item.checkQuestion) {
            if (isFirst) {
              ind = inde;
              isFirst = false;
            }
            mergeArray.push(object);
          } else {
            newArray.push(object);
          }
        });
      console.log(mergeArray, "mee");
      switch (index) {
        case 1: {
          mergeArray.map((item) => {
            if (item.arbitrationTeacher && item.arbitrationTeacher.length > 0) {
              item.arbitrationTeacher.map((index_) => {
                if (teaList.length > 0) {
                  let isPush = true;
                  teaList.map((ii) => {
                    if (ii.id === index_.teacherId) {
                      isPush = false;
                    }
                  });
                  if (isPush) {
                    teaList.push({
                      id: index_.teacherId,
                      name: index_.teacherName,
                    });
                  }
                } else {
                  teaList.push({
                    id: index_.teacherId,
                    name: index_.teacherName,
                  });
                }
              });
            }
          });
          console.log(teaList, "mee1");

          break;
        }
        case 2: {
          mergeArray.map((item) => {
            if (item.checkTeacher && item.checkTeacher.length > 0) {
              item.checkTeacher.map((index_) => {
                if (teaList.length > 0) {
                  let isPush = true;
                  teaList.map((ii) => {
                    if (ii.id === index_.teacherId) {
                      isPush = false;
                    }
                  });
                  if (isPush) {
                    teaList.push({
                      id: index_.teacherId,
                      name: index_.teacherName,
                    });
                  }
                } else {
                  teaList.push({
                    id: index_.teacherId,
                    name: index_.teacherName,
                  });
                }
              });
            }
          });

          break;
        }
        case 3: {
          mergeArray.map((item) => {
            if (
              item.questionPaperDealTeacher &&
              item.questionPaperDealTeacher.length > 0
            ) {
              item.questionPaperDealTeacher.map((index_) => {
                if (teaList.length > 0) {
                  let isPush = true;
                  teaList.map((ii) => {
                    if (ii.id === index_.teacherId) {
                      isPush = false;
                    }
                  });
                  if (isPush) {
                    teaList.push({
                      id: index_.teacherId,
                      name: index_.teacherName,
                    });
                  }
                } else {
                  teaList.push({
                    id: index_.teacherId,
                    name: index_.teacherName,
                  });
                }
              });
            }
          });

          break;
        }
        // No default
      }
      this.setState({
        necessaryTeacherVisible: true,
        allTerIndex: index,
        batchTeachers: 2,
        teacherNameList: teaList,
      });
    }
  };
  clickSave = () => {
    const { isStuNameMarking, questionAllocationList } = this.state;
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    array.length > 0 &&
      array.map((item) => {
        let object = item;
        if (item.questionIdList.length > 1) {
          newArray.push(object);
        } else {
          object.questionInfo = "";
          newArray.push(object);
        }
      });
    this.props
      .dispatch({
        type: "marking/postAllocationSettingSave",
        payload: {
          examId: this.examId,
          showStudentNameStatus: isStuNameMarking,
          questionSetting: newArray,
        },
      })
      .then(() => {
        this.getPage();
        // window.open(`${window.location.origin}/#/markingTask`, "_self");
      });
  };
  clickAssignComplete = () => {
    const { isStuNameMarking, questionAllocationList } = this.state;
    let array = JSON.parse(JSON.stringify(this.state.questionAllocationList));
    let newArray = [];
    array.length > 0 &&
      array.map((item) => {
        let object = item;
        if (item.questionIdList.length > 1) {
          newArray.push(object);
        } else {
          object.questionInfo = "";
          newArray.push(object);
        }
      });
    this.props.dispatch({
      type: "marking/getAllocationSettingComplete",
      payload: {
        examId: this.examId,
        showStudentNameStatus: isStuNameMarking,
        questionSetting: newArray,
      },
      onSuccess: () => {
        // 在 b 标签页中监听关闭事件
        localStorage.setItem("tab_b_closed", Date.now()); // 用时间戳作为标志
        window.close();
      },
    });
  };
  cancel = () => {};
  render() {
    const {
      epeedIndex,
      isBatch,
      isStuNameMarking,
      scoringMethodId,
      errorsAnalysis,
      questionAllocationList,
      necessaryTeacherVisible,
      teacherNameList,
      allBlocks,
      isChooseScoring,
    } = this.state;
    const { allocationList, allocationType, markingType } = this.props;
    const menu = (
      <Menu>
        <Menu.Item onClick={() => this.clickChooseAllocation(1)}>
          <span>{trans("global.efficiencyFirst", "效率优先")}</span>
        </Menu.Item>
        <Menu.Item onClick={() => this.clickChooseAllocation(2)}>
          <span>{trans("global.totalAverageScore", "总数均分")}</span>
        </Menu.Item>
      </Menu>
    );
    const content = (
      <div className={styles.scoringMethodBox}>
        <div className={styles.row}>
          <span className={styles.testLeft1}>
            {trans("global.scoringMethod", "评分方式")}：
          </span>
          <Radio.Group
            onChange={this.changeScoringMethod}
            value={scoringMethodId}
          >
            <Radio value={1}>{trans("global.singleReview", "单评")}</Radio>
            {/* <Radio value={2}>{trans("global.doubleReview", "双评")}</Radio> */}
          </Radio.Group>
        </div>
        {scoringMethodId == 2 ? (
          <div className={styles.row}>
            <span className={styles.testLeft2}>
              {trans("global.errorsAnalysis", "误差分")}：
            </span>
            <InputNumber
              min={0}
              max={100}
              defaultValue={errorsAnalysis}
              onChange={this.changeErrorsAnalysis}
            />
          </div>
        ) : null}
        <div className={styles.row}>
          <span className={styles.sureBtn} onClick={this.scoringMethodSure}>
            {trans("global.sure", "确定")}
          </span>
        </div>
      </div>
    );
    let columns = [
      {
        title: (
          <Checkbox
            onChange={this.changeAllBlocks}
            checked={allBlocks}
          ></Checkbox>
        ),
        dataIndex: "checkQuestion",
        key: "checkQuestion",
        width: 40,
        fixed: "left",
        // fixed: 'left',
        render: (text, record, index) => {
          return (
            <Checkbox
              onChange={(e) => this.changeQuestionCheck(e, index)}
              checked={text}
            ></Checkbox>
          );
        },
      },
      {
        title: () => (
          <div>
            {trans("global.questionBlock", "题号/题块")}
            <Tooltip
              title={trans(
                "global.questionBlockTest",
                "将题目加入题块后，同一题块里的所有题目会放在一个页面里打分，提升阅卷效率。也可以不进行此设置。",
              )}
              placement="bottom"
            >
              <i
                className={icon.iconfont}
                style={{ marginLeft: 5, cursor: "pointer" }}
              >
                &#xe9f7;
              </i>
            </Tooltip>
          </div>
        ),
        dataIndex: "questionInfo",
        key: "questionInfo",
        width: 140,
        fixed: "left",
        // fixed: 'left',
        render: (text, record, index) => {
          return (
            <div>
              {record.questionIdList.length > 1 ? (
                <div>
                  <div className={styles.questionBlockName}>
                    <Input
                      placeholder={trans(
                        "allocationProcess.blockNamePlaceholder",
                        "请输入题块名",
                      )}
                      value={text}
                      id={`blockName${text}`}
                      onChange={(e) => this.changeBlockName(e, text, index)}
                    />
                  </div>
                  <div>
                    {trans("allocationProcess.questionRange", "(第{$ids}题)", {
                      ids: record.questionIdList.join("、"),
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div>{text}</div>
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: trans("detail.questionScore", "分值"),
        dataIndex: "questionScore",
        key: "questionScore",
        width: 70,
        render: (text, record) => {
          return (
            <span>
              {text}
              {trans("global.point", "分")}
            </span>
          );
        },
      },
      {
        title: trans("global.reviewer", "批改人"),
        dataIndex: "checkTeacher",
        key: "checkTeacher",
        width: 160,
        render: (text, record, index) => {
          let array = [];
          text &&
            text.length > 0 &&
            text.map((item) => {
              array.push(item.teacherName);
            });
          return (
            <div style={{ cursor: "pointer" }}>
              <span onClick={() => this.clickTeacherName(text, 2, index)}>
                {array.length > 0 ? (
                  array.join("、")
                ) : (
                  <span onClick={() => this.clickTeacherName(text, 2, index)}>
                    {trans("allocationProcess.clickToAdd", "点击添加")}
                  </span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        title: () => (
          <div>
            <i className={icon.iconfont} style={{ marginRight: 5 }}>
              &#xe7bf;
            </i>
            {trans("global.scoringMethod", "评分方式")}
            {/* <Tooltip
              title={trans(
                "global.scoringMethodTest",
                "双评时，学生得分为两位打分老师给出的分数取平均值。当打分差值超过设置的误差分时，将会自动提交仲裁人处理。"
              )}
              placement="bottom"
            >
              <i
                className={icon.iconfont}
                style={{ marginLeft: 5, cursor: "pointer" }}
              >
                &#xe9f7;
              </i>
            </Tooltip> */}
          </div>
        ),
        dataIndex: "markingType",
        key: "markingType",
        width: 200,
        render: (text, record, index) => {
          return (
            <div>
              <Select
                value={text}
                style={{ width: 80 }}
                placeholder={trans("global.pleaseChoose", "请选择")}
                onChange={(e) => this.changeMarkingType(e, index)}
              >
                {markingType &&
                  markingType.length > 0 &&
                  markingType.map((item) => (
                    <Option value={item.type}>{item.name}</Option>
                  ))}
              </Select>
              {/* {text == 2 ? (
                <span style={{ marginLeft: 10 }}>
                  {trans("global.mistake", "误差")}
                  <InputNumber
                    min={0}
                    max={100}
                    value={record.doubleMarkingErrorScore}
                    step={0.5}
                    onChange={(e) =>
                      this.chengeMistakeScore(e, record.questionInfo)
                    }
                    style={{ width: 50 }}
                  />
                  {trans("global.point", "分")}
                </span>
              ) : null} */}
            </div>
          );
        },
      },
      {
        title: (
          <div>
            {trans("global.arbitrator", "仲裁人")}
            {/* <span style={{ color: 'rgba(1,17,61,0.7)', fontWeight: '300' }}>(双评时必填)</span> */}
          </div>
        ),
        dataIndex: "arbitrationTeacher",
        key: "arbitrationTeacher",
        width: 160,
        render: (text, record, index) => {
          if (record.markingType == 1) {
            return "--";
          }
          let array = [];
          text &&
            text.length > 0 &&
            text.map((item) => {
              array.push(item.teacherName);
            });
          return (
            <div style={{ cursor: "pointer" }}>
              <span onClick={() => this.clickTeacherName(text, 1, index)}>
                {array.length > 0 ? (
                  array.join("、")
                ) : (
                  <span onClick={() => this.clickTeacherName(text, 1, index)}>
                    {trans("allocationProcess.clickToAdd", "点击添加")}
                  </span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        title: (
          <div>
            {trans("global.problemVolumeHandler", "问题卷处理人")}
            <span style={{ color: "rgba(1,17,61,0.7)", fontWeight: "300" }}>
              (选填)
            </span>
          </div>
        ),
        dataIndex: "questionPaperDealTeacher",
        key: "questionPaperDealTeacher",
        width: 160,
        render: (text, record, index) => {
          let array = [];
          text &&
            text.length > 0 &&
            text.map((item) => {
              array.push(item.teacherName);
            });
          return (
            <div style={{ cursor: "pointer" }}>
              <span onClick={() => this.clickTeacherName(text, 3, index)}>
                {array.length > 0 ? (
                  array.join("、")
                ) : (
                  <span onClick={() => this.clickTeacherName(text, 3, index)}>
                    {trans("allocationProcess.clickToAdd", "点击添加")}
                  </span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        title: () => (
          <div>
            {trans("global.distribution", "分配方式")}
            <Tooltip
              title={trans(
                "global.distributionTest",
                "效率优先 ：以最快完成阅卷任务为原则，每位老师分配到的数量无限制；总量均分：按照阅卷总数评分分配给每位老师。",
              )}
              placement="bottom"
            >
              <i
                className={icon.iconfont}
                style={{ marginLeft: 5, cursor: "pointer" }}
              >
                &#xe9f7;
              </i>
            </Tooltip>
          </div>
        ),
        dataIndex: "allocationType",
        key: "allocationType",
        width: 120,
        render: (text, record, index) => {
          return (
            <div>
              <Select
                value={text}
                style={{ width: 100 }}
                placeholder={trans("global.pleaseChoose", "请选择")}
                onChange={(e) => this.changeAllocationType(e, index)}
              >
                {allocationType &&
                  allocationType.length > 0 &&
                  allocationType.map((item) => (
                    <Option value={item.type}>{item.name}</Option>
                  ))}
              </Select>
            </div>
          );
        },
      },
      {
        title: trans("global.option", "操作"),
        dataIndex: "questionIdList",
        key: "questionIdList",
        width: 100,
        render: (text, record) => {
          return (
            <div>
              {text.length > 1 ? (
                <span
                  className={styles.cancelBlock}
                  onClick={() => this.cancelBlock(record.questionInfo)}
                >
                  {trans("global.cancelBlock", "取消题块")}
                </span>
              ) : null}
            </div>
          );
        },
      },
    ];
    columns.push({
      title: "",
    });
    return (
      <div className={styles.allocationProcessBox}>
        <div className={styles.header}>
          <div className={[styles.closeIcon].join(" ")} onClick={this.back}>
            <Icon type="close" />
          </div>
          <div className={[styles.viewTitle].join(" ")}>
            {allocationList.title}
          </div>
          <div className={styles.headeRight} id="assignComplete">
            <span onClick={this.clickSave}>{trans("global.save", "保存")}</span>
            <Popconfirm
              title={trans(
                "global.assignmentCompletetip",
                "确定任务分配完成了吗？确认后，只能对批改人、仲裁人、问题卷处理人进行增加，其他设置不可再编辑。",
              )}
              onConfirm={this.clickAssignComplete}
              onCancel={this.cancel}
              okText={trans("global.ok", "确认")}
              cancelText={trans("global.cancel", "取消")}
              icon={false}
              placement="bottomRight"
              getPopupContainer={() =>
                document.querySelector("#assignComplete")
              }
            >
              <span
                className={styles.assignComplete}
                // onClick={this.clickAssignComplete}
              >
                {trans("global.assignmentComplete", "分配完成")}
              </span>
            </Popconfirm>
          </div>
        </div>
        <div>
          <div className={`${styles.flowPathBox} ${styles.clearPadding}`}>
            <Table
              dataSource={questionAllocationList || []}
              pagination={false}
              scroll={{ x: 1200, y: true }}
              columns={columns}
            />
          </div>
          <div className={styles.allocationBottom}>
            <span className={styles.bulkOperationCheckbox}>
              {/* <Checkbox
                onChange={this.changeBulkOperation}
                value={isBatch}
              ></Checkbox> */}
              <span className={styles.bulkOperation}>
                {trans("global.bulkOperation", "批量操作")}
              </span>
            </span>
            <span
              className={[
                styles.bomInline,
                isBatch ? "" : styles.noSelect,
              ].join(" ")}
              onClick={this.changeDivideQuestionBlocks}
            >
              <i className={icon.iconfont} style={{ marginRight: 5 }}>
                &#xe9f7;
              </i>
              <span>{trans("global.divideQuestionBlocks", "划分题块")}</span>
            </span>
            <span
              className={[
                styles.bomInline,
                isBatch ? "" : styles.noSelect,
              ].join(" ")}
              onClick={() => this.setCorrectionPerson(2)}
            >
              <span>{trans("global.setCorrectionPerson", "设置批改人")}</span>
              <i className={icon.iconfont} style={{ marginLeft: 6 }}>
                &#xe85b;
              </i>
            </span>
            <span
              className={[
                styles.bomInline,
                isBatch ? "" : styles.noSelect,
              ].join(" ")}
              id="chooseScoringMethod"
            >
              <Popover
                content={content}
                placement="topLeft"
                trigger="click"
                getPopupContainer={() =>
                  document.querySelector("#chooseScoringMethod")
                }
                visible={isChooseScoring}
                // visible={true}
              >
                <span
                  onClick={() =>
                    this.setState({
                      isChooseScoring: !this.state.isChooseScoring,
                    })
                  }
                >
                  {trans("global.chooseScoringMethod", "选择评分方式")}
                </span>
                <Icon type="down" />
              </Popover>
            </span>
            <span
              className={[
                styles.bomInline,
                isBatch ? "" : styles.noSelect,
              ].join(" ")}
              onClick={() => this.setCorrectionPerson(1)}
            >
              <span>{trans("global.setUpArbitrator", "设置仲裁人")}</span>
              <i className={icon.iconfont} style={{ marginLeft: 6 }}>
                &#xe85b;
              </i>
            </span>
            <span
              className={[
                styles.bomInline,
                isBatch ? "" : styles.noSelect,
              ].join(" ")}
              onClick={() => this.setCorrectionPerson(3)}
            >
              <span>
                {trans("global.setProblemPaperHandler", "设置问题卷处理人")}
              </span>
              <i className={icon.iconfont} style={{ marginLeft: 6 }}>
                &#xe85b;
              </i>
            </span>
            <span
              className={[
                styles.bomInline,
                isBatch ? "" : styles.noSelect,
              ].join(" ")}
            >
              <Dropdown overlay={menu} placement="topLeft">
                <span>
                  {trans("global.chooseAllocationMethod", "选择分配方式")}
                  <Icon type="down" style={{ fontSize: 14 }} />
                </span>
              </Dropdown>
            </span>
            <span className={styles.isStuName}>
              <span className={styles.radioTitle}>
                {trans("global.stuNameMarking", "阅卷时显示学生姓名")}
              </span>
              <Switch
                defaultChecked
                checked={isStuNameMarking}
                onChange={this.changeStuNameMarking}
              />
            </span>
          </div>
        </div>
        {necessaryTeacherVisible ? (
          <SearchTeacher
            modalVisible={necessaryTeacherVisible}
            cancel={this.changeNecessaryTeacherVisible}
            language={"zh_CN"}
            confirm={(ids) => this.searchTeacherConfirm(ids)}
            selectType="1" // 1:全体人员 2：人员和组织id {nodeList：组织id数组，idList： 人员id数组}
            selectedList={teacherNameList}
          />
        ) : null}
      </div>
    );
  }
}
export default connect(({ home, marking, global }) => ({
  allocationList: marking.allocationList,
  allocationType: marking.allocationType,
  markingType: marking.markingType,
  allOrgTeachersList: marking.allOrgTeachersList,
}))(AllocationProcess);

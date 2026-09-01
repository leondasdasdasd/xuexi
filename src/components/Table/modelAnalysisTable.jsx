import React, { PureComponent } from "react";
import {
  Alert,
  Button,
  Icon,
  Input,
  InputNumber,
  Mentions,
  message,
  Modal,
  Popconfirm,
  Select,
  Table,
  Upload,
} from "antd";
import { connect } from "dva";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const { Option } = Select;
const { TextArea } = Input;
import debounce from "lodash/debounce";

import ClashLockModal from "../../components/ClashLockModal";
import RicherEditor from "../../components/ClassRicherEditor";
import { trans } from "../../utils/i18n";
import ReloadModal from "../ReloadModal";
import UseFileItem from "../UseFileItem";

// let canContinueLock = true; //是否可以抢锁

class MultiClassTable extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      multiClassTableList: this.props.multiClassList.classContentList || [],
      highScoreRateList: this.props.multiClassList.highScoreRateList,
      moduleScoreModelList: this.props.multiClassList.moduleScoreModelList,
      lowScoreRateList: this.props.multiClassList.lowScoreRateList,
      inputVib: false,
      groupName: this.props.multiClassList.groupName || "",
      teacherNames: this.props.multiClassList.teacherNames || "",
      multiClassEdit: false, // 班级分析
      numPhase: 4,
      numPhaseList: [],
      groupId: this.props.multiClassList.groupId || "",
      currentOperItem: {}, //当前操作模板item--在抢锁时候修改值
      uuId: "",
      operatorTips: "",
      lockTipVisible: false, //抢锁冲突提示框
      multiClassTimer: 0,
      adjustingSegments: false,
      subsectionEdit: false,
      reloadModalVisible: false,
      wrongQuestion: [],
      loading: false,
      highScoreRateEdit: false,
      lowScoreRateEdit: false,
      indEdit: 0,
      classEdit: false,
      classAnalysisText: this.props.multiClassList.richContentString || "",
    };
    this.keyDown = "";
    this.loadGithubUsers = debounce(this.loadGithubUsers, 800);
  }
  componentDidMount() {
    this.props.onRef(this);
    this.props
      .dispatch({
        type: "home/getWrongQuestion",
        payload: {
          examId: this.props.examId,
          groupIdList: [this.props.multiClassList.groupId],
        },
      })
      .then(() => {
        this.setState({
          wrongQuestion: this.props.wrongQuestion,
        });
      });
  }
  //班级分析
  clickInput = (text, record, row) => {
    if (!this.state.multiClassEdit) return;
    let state = Object.assign({}, this.state);
    state[`inputVib${record.index}${row}`] = true;
    this.setState(
      {
        ...state,
      },
      () => {
        const inp = document.querySelector("#inpMultiId");
        inp.focus();
      },
    );
  };
  clickInputHighest = (text, record, row) => {
    if (!this.state.highScoreRateEdit) return;
    let state = Object.assign({}, this.state);
    state[`inpHighest${record.index}${row}`] = true;
    this.setState(
      {
        ...state,
      },
      () => {
        if (row !== "questionNo") {
          const inp = document.querySelector("#inpHighestId");
          inp.focus();
        }
      },
    );
  };
  clickInputLow = (text, record, row) => {
    if (!this.state.lowScoreRateEdit) return;
    let state = Object.assign({}, this.state);
    state[`inpLow${record.index}${row}`] = true;
    this.setState(
      {
        ...state,
      },
      () => {
        const inp = document.querySelector("#inpLowId");
        inp.focus();
      },
    );
  };
  inpBlur = (record, row) => {
    let state = Object.assign({}, this.state);
    state[`inputVib${record.index}${row}`] = false;
    this.setState({
      ...state,
    });
  };
  inpHighestBlur = (record, row) => {
    let state = Object.assign({}, this.state);
    state[`inpHighest${record.index}${row}`] = false;
    this.setState({
      ...state,
    });
  };
  inpLowBlur = (record, row) => {
    let state = Object.assign({}, this.state);
    state[`inpLow${record.index}${row}`] = false;
    this.setState({
      ...state,
    });
  };
  inpChange = (record, key, e) => {
    // console.log(record, key, e, "ppp");
    let newList = [];
    this.state.multiClassTableList.map((item) => {
      if (item.index == record.index) {
        if (key == "learningState") {
          newList.push({
            index: item.index,
            stageText: item.stageText,
            learningState: e,
            studentNames: item.studentNames,
            action: item.action,
            stage: item.stage,
            studentCounts: item.studentCounts,
          });
        } else if (key == "stageText") {
          newList.push({
            index: item.index,
            stageText: e.target.value,
            learningState: item.learningState,
            studentNames: item.studentNames,
            action: item.action,
            stage: item.stage,
            studentCounts: item.studentCounts,
          });
        } else if (key == "studentNames") {
          newList.push({
            index: item.index,
            stageText: item.stageText,
            learningState: item.learningState,
            studentNames: e.target.value,
            action: item.action,
            stage: item.stage,
            studentCounts: item.studentCounts,
          });
        } else if (key == "action") {
          newList.push({
            index: item.index,
            stageText: item.stageText,
            learningState: item.learningState,
            studentNames: item.studentNames,
            action: e,
            stage: item.stage,
            studentCounts: item.studentCounts,
          });
        }
      } else {
        newList.push(item);
      }
    });
    this.setState({
      multiClassTableList: newList,
    });
  };
  // keyDownSearch = (e) => {
  //   if (e.keyCode == "16") {
  //     this.keyDown = 16;
  //   }
  //   if (this.keyDown == 16 && e.keyCode == 50) {
  //     this.props.dispatch({
  //       type: "home/getUserByName",
  //     });
  //     this.keyDown = "";
  //   }
  // };
  keyUpSearch = (e) => {
    // console.log(e.keyCode, "111");
  };
  inpHighestChange = (record, key, e) => {
    console.log(record, key, e, "ppp");
    let rate = "";
    let newList = [];
    if (key == "questionNo") {
      // this.props
      //   .dispatch({
      //     type: "home/getGroupAndGradeScoreRate",
      //     payload: {
      //       examId: this.props.examId,
      //       groupId: this.props.multiClassList.groupId,
      //       moduleName: e,
      //     },
      //   })
      //   .then(() => {
      //     rate = this.props.groupAndGradeScoreRate;
      //     console.log(rate, "ppp2");
      console.log(e.target.value, "111");
      this.state.moduleScoreModelList.map((item, index) => {
        if (item.index == record.index) {
          newList.push({
            index: item.index,
            propositionAnalysis: item.propositionAnalysis,
            teacherAnalysis: item.teacherAnalysis,
            moduleName: e.target.value,
            questionScoreRate: item.questionScoreRate || "",
            studentAnalysis: item.studentAnalysis,
          });
        } else {
          newList.push(item);
        }
      });
      this.setState({
        moduleScoreModelList: newList,
      });
      //   });
      // newList.push({
      //   index: item.index,
      //   propositionAnalysis: item.propositionAnalysis,
      //   teacherAnalysis: item.teacherAnalysis,
      //   moduleName: e,
      //   questionScoreRate: rate,
      //   studentAnalysis: item.studentAnalysis,
      // });
    } else {
      this.state.moduleScoreModelList.map((item, index) => {
        if (item.index == record.index) {
          if (key == "propositionAnalysis") {
            newList.push({
              index: item.index,
              propositionAnalysis: e.target.value,
              moduleName: item.moduleName,
              teacherAnalysis: item.teacherAnalysis,
              questionScoreRate: item.questionScoreRate,
              studentAnalysis: item.studentAnalysis,
            });
          } else if (key == "studentAnalysis") {
            newList.push({
              index: item.index,
              propositionAnalysis: item.propositionAnalysis,
              moduleName: item.moduleName,
              teacherAnalysis: item.teacherAnalysis,
              questionScoreRate: item.questionScoreRate,
              studentAnalysis: e.target.value,
            });
          } else if (key == "teacherAnalysis") {
            newList.push({
              index: item.index,
              propositionAnalysis: item.propositionAnalysis,
              teacherAnalysis: e,
              moduleName: item.moduleName,
              questionScoreRate: item.questionScoreRate,
              studentAnalysis: item.studentAnalysis,
            });
          } else if (key == "questionNo") {
            console.log(e.target.value, "1112");
            newList.push({
              index: item.index,
              propositionAnalysis: item.propositionAnalysis,
              teacherAnalysis: item.teacherAnalysis,
              moduleName: e.target.value,
              questionScoreRate: item.questionScoreRate || "",
              studentAnalysis: item.studentAnalysis,
            });
          } else if (key == "questionScoreRate") {
            newList.push({
              index: item.index,
              propositionAnalysis: item.propositionAnalysis,
              teacherAnalysis: item.teacherAnalysis,
              moduleName: item.moduleName,
              questionScoreRate: e.target.value,
              studentAnalysis: item.studentAnalysis,
            });
          }
        } else {
          newList.push(item);
        }
      });
      console.log(newList, "nn");
      this.setState({
        moduleScoreModelList: newList,
      });
    }

    // console.log(newList, "ppp1");
  };
  inpLowChange = (record, key, e) => {
    // console.log(record, key, e, "ppp");
    let rate = "";
    let newList = [];
    if (key == "questionNo") {
      this.props
        .dispatch({
          type: "home/getGroupAndGradeScoreRate",
          payload: {
            examId: this.props.examId,
            groupId: this.props.multiClassList.groupId,
            questionNo: e,
          },
        })
        .then(() => {
          rate = this.props.groupAndGradeScoreRate;
          console.log(rate, "ppp2");
          this.state.lowScoreRateList.map((item, index) => {
            if (item.index == record.index) {
              newList.push({
                index: item.index,
                propositionAnalysis: item.propositionAnalysis,
                teacherAnalysis: item.teacherAnalysis,
                questionNo: e,
                questionScoreRate: rate,
                studentAnalysis: item.studentAnalysis,
              });
            } else {
              newList.push(item);
            }
          });
          this.setState({
            lowScoreRateList: newList,
          });
        });
    } else {
      this.state.lowScoreRateList.map((item, index) => {
        if (item.index == record.index) {
          if (key == "propositionAnalysis") {
            newList.push({
              index: item.index,
              propositionAnalysis: e.target.value,
              questionNo: item.questionNo,
              teacherAnalysis: item.teacherAnalysis,
              questionScoreRate: item.questionScoreRate,
              studentAnalysis: item.studentAnalysis,
            });
          } else if (key == "studentAnalysis") {
            newList.push({
              index: item.index,
              propositionAnalysis: item.propositionAnalysis,
              questionNo: item.questionNo,
              teacherAnalysis: item.teacherAnalysis,
              questionScoreRate: item.questionScoreRate,
              studentAnalysis: e.target.value,
            });
          } else if (key == "teacherAnalysis") {
            newList.push({
              index: item.index,
              propositionAnalysis: item.propositionAnalysis,
              teacherAnalysis: e,
              questionNo: item.questionNo,
              questionScoreRate: item.questionScoreRate,
              studentAnalysis: item.studentAnalysis,
            });
          } else if (key == "questionNo") {
            let rate = "";
            this.state.wrongQuestion &&
              this.state.wrongQuestion.length > 0 &&
              this.state.wrongQuestion.map((item) => {
                if (item.questionNumber == e) {
                  rate = item.scoreRate + "%";
                }
              });
            newList.push({
              index: item.index,
              propositionAnalysis: item.propositionAnalysis,
              teacherAnalysis: item.teacherAnalysis,
              questionNo: e,
              questionScoreRate: rate,
              studentAnalysis: item.studentAnalysis,
            });
          } else if (key == "questionScoreRate") {
            newList.push({
              index: item.index,
              propositionAnalysis: item.propositionAnalysis,
              teacherAnalysis: item.teacherAnalysis,
              questionNo: e.target.value,
              questionScoreRate: e.target.value,
              studentAnalysis: item.studentAnalysis,
            });
          }
        } else {
          newList.push(item);
        }
      });
      this.setState({
        lowScoreRateList: newList,
      });
    }

    // console.log(this.state.newList, "ppp1");
  };
  addHighScoringList = () => {
    const addObject = {
      index: this.state.moduleScoreModelList.length + 1,
      propositionAnalysis: "",
      moduleName: "",
      teacherAnalysis: "",
      questionScoreRate: "",
      studentAnalysis: "",
    };
    this.setState({
      moduleScoreModelList: [...this.state.moduleScoreModelList, addObject],
    });
  };
  addLowScoringList = () => {
    const addObject = {
      index: this.state.moduleScoreModelList.length + 1,
      propositionAnalysis: "",
      moduleName: "",
      teacherAnalysis: "",
      questionScoreRate: "",
      studentAnalysis: "",
    };
    this.setState({
      lowScoreRateList: [...this.state.lowScoreRateList, addObject],
    });
  };
  scoringHighDel = (index) => {
    let array = JSON.parse(JSON.stringify(this.state.moduleScoreModelList));
    // if (arr.length > 3) {
    let newArray = array.filter((item) => item.index !== index);
    this.setState({
      moduleScoreModelList: newArray,
    });
    // }
  };
  scoringLowDel = (index) => {
    let array = JSON.parse(JSON.stringify(this.state.lowScoreRateList));
    if (array.length > 3) {
      let newArray = array.filter((item) => item.index !== index);
      this.setState({
        lowScoreRateList: newArray,
      });
    }
  };
  // 点击班级分析编辑
  clickEditScoreRate = (ind) => {
    if (this.state.highScoreRateEdit) {
      this.multiClassCancle(1);
    } else if (this.state.lowScoreRateEdit) {
      this.multiClassCancle(2);
    } else if (this.state.multiClassEdit) {
      this.multiClassCancle(3);
    }
    this.setState({
      indEdit: ind,
    });
    this.props.singleEdit(this.props.index);
    this.getLock(
      "multiClassModelList",
      this.props.examId,
      3,
      this.state.groupId,
      () => {
        let timer = setInterval(() => {
          this.multiClassSave(true);
        }, 15_000); //自动保存时间30000，暂时改成10000，方便测试

        if (ind == 1) {
          this.setState({
            multiClassTimer: timer,
            highScoreRateEdit: true,
            indEdit: 1,
          });
        } else if (ind == 2) {
          this.setState({
            multiClassTimer: timer,
            lowScoreRateEdit: true,
            indEdit: 2,
          });
        } else if (ind == 3) {
          this.setState({
            multiClassTimer: timer,
            multiClassEdit: true,
            indEdit: 3,
          });
        } else {
          this.setState({
            multiClassTimer: timer,
            highScoreRateEdit: true,
            multiClassEdit: true,
            classEdit: true,
            indEdit: 1,
          });
        }
      },
    );
  };

  multiClassEditTrue = (ind) => {
    console.log(ind, "indind");
    if (ind == 1) {
      this.setState({
        highScoreRateEdit: true,
      });
    } else if (ind == 2) {
      this.setState({
        lowScoreRateEdit: true,
      });
    } else if (ind == 3) {
      this.setState({
        multiClassEdit: true,
      });
    } else {
      this.setState({
        highScoreRateEdit: true,
        multiClassEdit: true,
        classEdit: true,
        indEdit: 1,
      });
    }
  };
  // 调整确定
  adjustingConfirm = () => {
    let newList = [];
    if (
      this.state.multiClassTableList &&
      this.state.multiClassTableList.length > 0
    ) {
      this.state.multiClassTableList.map((item) => {
        newList.push(item.stage);
      });
    }
    this.setState(
      {
        adjusting: true,
        numPhaseList: newList,
        numPhase: newList.length,
      },
      () => {},
    );
  };
  //清除定时器
  clearTimer = () => {
    clearInterval(this.state.multiClassTimer);
  };
  //放弃抢锁
  giveupLocking = () => {
    this.setState({
      lockTipVisible: false,
    });
  };
  // 调整取消
  adjustingCancel = () => {};
  //设置分布区间确定
  handleOk = (e) => {
    this.props
      .dispatch({
        type: "home/postUpdateStage",
        payload: {
          examId: this.props.examId,
          groupId: this.props.multiClassList.groupId,
          groupName: this.state.groupName,
          teacherNames: this.state.teacherNames,
          stage: this.state.numPhaseList,
        },
      })
      .then(() => {
        const { updateStage } = this.props;
        this.setState(
          {
            adjusting: false,
            groupName: updateStage.groupName,
            teacherNames: updateStage.teacherNames,
            multiClassTableList: updateStage.studentStageModelList,
            subsectionEdit: true,
          },
          () => {},
        );
      });
  };
  //设置分布区间取消
  handleCancel = (e) => {
    this.setState({
      adjusting: false,
      adjustingSegments: true,
    });
  };
  changeFront = (value) => {
    let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
    array.splice(-1, 1, value);
    this.setState({
      numPhaseList: array,
    });
  };
  chengeMiddle = (index, value) => {
    let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
    array.splice(index, 1, value);
    this.setState({
      numPhaseList: array,
    });
  };
  changeAfter = (value) => {
    let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
    array.splice(0, 1, value);
    this.setState({
      numPhaseList: array,
    });
    if (this.judgeNumber(array)) {
      let sum = eval(array.join("+"));
    }
  };
  judgeNumber = (array) => {
    let flag = true;
    var regPos = /^\d+.?\d*/; //判断是否是数字。
    for (const item of array) {
      if (!regPos.test(item)) {
        flag = false;
        continue;
      }
    }
    return flag;
  };
  clickReduce = () => {
    if (this.state.numPhase > 3) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(-2, 1);
      this.setState({
        numPhase: this.state.numPhase - 1,
        numPhaseList: array,
      });
    }
  };
  clickAddd = () => {
    let newArray = [""];
    this.state.numPhaseList.map((item) => {
      newArray = [...newArray, ""];
    });
    this.setState({
      numPhase: this.state.numPhase + 1,
      numPhaseList: newArray,
    });
  };
  sum = (array) => {
    var s = 0;
    for (var index = array.length - 1; index >= 0; index--) {
      s = s + (array[index] - 0);
    }
    // console.log(arr, s, "3333");
    return s;
  };
  // 班级分析取消
  multiClassCancle = (ind) => {
    this.multiClassSave();
    this.clearTimer();
    this.releaseLock();
    if (ind == 1) {
      this.setState({
        adjustingSegments: true,
        highScoreRateEdit: false,
      });
    } else if (ind == 2) {
      this.setState({
        adjustingSegments: true,
        lowScoreRateEdit: false,
      });
    } else if (ind == 3) {
      this.setState({
        adjustingSegments: true,
        multiClassEdit: false,
      });
    } else {
      this.setState({
        adjustingSegments: true,
        highScoreRateEdit: false,
        multiClassEdit: false,
        classEdit: false,
        indEdit: 1,
      });
    }
  };
  //点击班级分析保存
  clickmultiClassSave = (ind) => {
    this.multiClassSave();
    setTimeout(() => {
      this.releaseLock();
    }, 500);
    this.clearTimer();
    // this.releaseLock();
    if (ind == 1) {
      this.setState({
        adjustingSegments: true,
        highScoreRateEdit: false,
      });
    } else if (ind == 2) {
      this.setState({
        adjustingSegments: true,
        lowScoreRateEdit: false,
      });
    } else if (ind == 3) {
      this.setState({
        adjustingSegments: true,
        multiClassEdit: false,
      });
    } else {
      this.setState({
        adjustingSegments: true,
        highScoreRateEdit: false,
        multiClassEdit: false,
        classEdit: false,
        indEdit: 1,
      });
    }
  };
  // 班级分析保存
  multiClassSave = (isAutoSave = false) => {
    const {
      groupName,
      teacherNames,
      multiClassTableList,
      groupId,
      uuId,
      lowScoreRateList,
      highScoreRateList,
      moduleScoreModelList,
      classAnalysisText,
    } = this.state;
    this.props
      .dispatch({
        type: "home/postEditReport",
        payload: {
          examId: this.props.examId,
          modelKey: 3, //1：命题分析 4：备课组长总结 2: 得分率分析 3: 班级分析
          groupId: groupId,
          groupName: groupName,
          teacherNames: teacherNames,
          classContentList: multiClassTableList,
          uuId,
          isAutoSave,
          lowScoreRateList,
          highScoreRateList,
          moduleScoreModelList: moduleScoreModelList,
          richContentString: classAnalysisText,
          fileList: this.props.fileList,
        },
      })
      .then(() => {
        console.log(this.props.editReport.content.code, "999");
        if (this.props.editReport.content.code == 3) {
          this.setState({
            reloadModalVisible: true,
          });
        }
      });
  };

  getMiddle = (index) => {
    let { numPhaseList, numPhase } = this.state;
    if (numPhase == 3) {
      return (
        <span>{`[${numPhaseList[index - 1]}%~${
          Number(numPhaseList[index - 1]) + Number(numPhaseList[index])
        }%]`}</span>
      );
    } else {
      let sum = 0;
      for (let index_ = index - 1; index_ >= 0; index_--) {
        sum += Number(numPhaseList[index_]);
      }
      return <span>{`[${sum}%~${sum + Number(numPhaseList[index])}%]`}</span>;
    }
  };

  //获取锁 & 强制抢锁
  getLock = (code, examId, resultType, groupId, successCallback) => {
    // const that = this;
    // if (!canContinueLock) return false;
    // canContinueLock = false;
    this.props.dispatch({
      type: "home/getLock",
      payload: {
        examId: examId,
        modelKey: resultType,
        groupId: this.state.groupId,
      },
      onSuccess: (res) => {
        // debugger;
        //获取锁成功
        let uuId = res && res.uuId;
        let currentOperItem = {
          examId,
          resultType,
          code, //模块code
        };
        console.log(res, "333");
        if (res.content.modelKey == 3) {
          this.setState({
            multiClassTableList: res.content.classContentList,
            teacherNames: res.content.teacherNames,
            groupName: res.content.groupName,
            lowScoreRateList: res.content.lowScoreRateList,
            moduleScoreModelList: res.content.moduleScoreModelList,
            classAnalysisText: res.content.richContentString,
          });
        }
        this.setState({
          uuId: uuId,
          currentOperItem,
        });
        typeof successCallback == "function" && successCallback.call(this);
        // canContinueLock = true;
      },
      onClashWithOther: (res) => {
        //A抢占B的锁
        let name = res && res.name,
          uuId = res && res.uuId;
        let currentOperItem = {
          examId,
          resultType,
          relationType: 1, //单元 2：日课
          code, //模块code
        };
        this.setState({
          operatorTips: trans(
            "teachingPlan.coverTaContent",
            "{$name} 正在编辑，TA的内容将被您覆盖，您确定要开始编辑吗？",
            { name: name },
          ),
          lockTipVisible: true,
          uuId: uuId,
          currentOperItem,
        });
      },
      onClashWithMe: (res) => {
        //A抢占A的锁
        let uuId = res && res.uuId;
        let currentOperItem = {
          examId,
          resultType,
          relationType: 1, //单元 2：日课
          code, //模块code
        };
        this.setState({
          operatorTips: trans(
            "teachingPlan.clashLockTips",
            "您的账号在另一台设备上正在编辑，确定要开始编辑吗？开始后，您在另一台设备上编辑的内容将被覆盖。",
          ),
          lockTipVisible: true,
          uuId: uuId,
          currentOperItem,
        });
      },
    });
  };

  //释放锁
  releaseLock = (callBack) => {
    const { dispatch, activityId } = this.props;
    let examId =
      this.state.currentOperItem && this.state.currentOperItem.examId;
    if (!examId) return false;
    dispatch({
      type: "home/releaseLock",
      payload: {
        examId: this.props.examId,
        uuId: this.state.uuId,
        modelKey: 3,
        groupId: this.state.groupId,
      },
      onSuccess: () => {
        callBack && callBack();
      },
    });
  };

  //强行抢锁
  forceLock = (examId, resultType) => {
    const { dispatch, activityId } = this.props;
    dispatch({
      type: "home/forceLock",
      payload: {
        examId: this.props.examId,
        modelKey: resultType,
        groupId: this.state.groupId,
      },
      onSuccess: (res) => {
        //获取锁成功
        let uuId = res && res.uuId;
        let currentOperItem = this.state.currentOperItem;
        this.setState({
          uuId: uuId,
          lockTipVisible: false,
        });
        //抢锁成功--进入各个模板的编辑状态
        if (res.content.modelKey == 3) {
          this.multiClassEditTrue(this.state.indEdit);
          let timer = setInterval(() => {
            this.multiClassSave(true);
          }, 15_000);
          this.setState({
            multiClassTableList: res.content.classContentList,
            lowScoreRateList: res.content.lowScoreRateList,
            moduleScoreModelList: res.content.moduleScoreModelList,
            teacherNames: res.content.teacherNames,
            groupName: res.content.groupName,
            multiClassTimer: timer,
            classAnalysisText: res.content.richContentString,
          });
        }
      },
    });
  };

  onSearch = (search) => {
    this.setState({ search, loading: !!search, users: [] });
    // console.log("Search:", search);
    if (search) {
      this.loadGithubUsers(search);
    } else {
      // this.props.dispatch({
      //   type: "home/clearUserByName",
      // });
    }
  };

  loadGithubUsers = (name) => {
    this.props
      .dispatch({
        type: "home/getUserByName",
        payload: {
          name: name,
        },
      })
      .then(() => {
        this.setState({
          loading: false,
        });
      });
  };
  onRefPropositional = (reference) => {
    this.classEditor = reference;
  };
  cancelEditor = (type) => {
    if (type == "releseLock") {
      //手动取消释放锁，如果是手动保存，无需释放锁
      this.releaseLock(); //解锁
    }
    this.setState({
      richEditorObj: {},
    });
  };
  blurEditLeaderSummary = () => {
    this.setState({
      isEditleaderSummary: false, //是否编辑题目内容
    });
  };
  leaderSummaryText = (string_) => {
    this.setState({
      classAnalysisText: string_,
    });
  };
  reloadModalVisibleEditText = () => {
    this.setState({
      reloadModalVisibleEdit: true,
    });
  };

  deleteFile = (index) => {
    let fileList = this.props.fileList ? this.props.fileList : [];
    let cloneFileList = JSON.parse(JSON.stringify(fileList));
    cloneFileList.splice(index, 1);
    this.props.fileChange && this.props.fileChange(cloneFileList);
  };

  //上传
  changupload2 = (info) => {
    let file = info.file;
    const { response } = file;
    if (file.status === "done" && response.status && response.ifLogin) {
      if (response.status) {
        console.log(response.content, "res");
        let fileList = this.props.fileList ? this.props.fileList : [];
        let cloneFileList = JSON.parse(JSON.stringify(fileList));
        this.props.fileChange &&
          this.props.fileChange([...cloneFileList, ...response.content]);
      } else {
        message.error(res.message);
      }
    }
  };

  render() {
    const {
      classAnalysisText,
      multiClassTableList,
      groupName,
      teacherNames,
      anteriorSegment,
      numPhase,
      numPhaseList,
      multiClassEdit,
      adjustingSegments,
      groupId,
      subsectionEdit,
      lowScoreRateList,
      highScoreRateList,
      wrongQuestion,
      loading,
      highScoreRateEdit,
      lowScoreRateEdit,
      moduleScoreModelList,
      classEdit,
    } = this.state;
    const { authenticationModel, userByNameList } = this.props;
    const multiClassClumns = [
      {
        title: trans("global.subsection1", "分段"),
        dataIndex: "stageText",
        width: "10%",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          return this.state[`inputVib${record.index}stageText`] ? (
            <TextArea
              value={text}
              onBlur={() => this.inpBlur(record, "stageText")}
              id="inpMultiId"
              onChange={(e) => this.inpChange(record, "stageText", e)}
              style={{ width: "100%", height: "100%" }}
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          ) : (
            <div
              style={{ width: "100%", height: "100%" }}
              onClick={
                subsectionEdit
                  ? null
                  : () => this.clickInput(text, record, "stageText")
              }
            >
              {text}
            </div>
          );
        },
      },
      {
        title: trans("global.numberOfPeople", "人数"),
        width: "6%",
        dataIndex: "studentCounts",
        // align: "center",
        render: (text, record) => {
          return <div style={{ width: "100%", height: "100%" }}>{text}</div>;
        },
      },
      {
        title: trans("global.student", "学生"),
        width: "17%",
        dataIndex: "studentNames",
        // align: "center",
        render: (text, record) => {
          return <div style={{ width: "100%", height: "100%" }}>{text}</div>;
        },
      },
      {
        title: trans("global.academicSentiment", "学情"),
        width: "33%",
        dataIndex: "learningState",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          return this.state[`inputVib${record.index}learningState`] ? (
            <Mentions
              value={text}
              onBlur={() => this.inpBlur(record, "learningState")}
              id="inpMultiId"
              onChange={(e) => this.inpChange(record, "learningState", e)}
              style={{ width: "100%", height: "100%" }}
              autoSize={{ minRows: 2, maxRows: 6 }}
              onSearch={this.onSearch}
              loading={loading}
            >
              {userByNameList &&
                userByNameList.length &&
                userByNameList.map((item) => (
                  <Option value={item.name}>{item.name}</Option>
                ))}
            </Mentions>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                whiteSpace: "pre-wrap",
              }}
              onClick={() => this.clickInput(text, record, "learningState")}
            >
              {text}
            </div>
          );
        },
      },
      {
        title: trans("global.nextSteps", "下一步行动"),
        width: "34%",
        dataIndex: "action",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          return this.state[`inputVib${record.index}action`] ? (
            <Mentions
              value={text}
              onBlur={() => this.inpBlur(record, "action")}
              id="inpMultiId"
              onChange={(e) => this.inpChange(record, "action", e)}
              style={{ width: "100%", height: "100%" }}
              autoSize={{ minRows: 2, maxRows: 6 }}
              loading={loading}
              onSearch={this.onSearch}
            >
              {userByNameList &&
                userByNameList.length &&
                userByNameList.map((item) => (
                  <Option value={item.name}>{item.name}</Option>
                ))}
            </Mentions>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                whiteSpace: "pre-wrap",
              }}
              onClick={() => this.clickInput(text, record, "action")}
            >
              {text}
            </div>
          );
        },
      },
    ];
    console.log(classAnalysisText, "2q22");
    const highScoreRateClumns = [
      {
        title: trans("analysis.model", "模块"),
        dataIndex: "moduleName",
        width: "10%",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          return highScoreRateEdit ? (
            <TextArea
              value={text}
              onBlur={() => this.inpHighestBlur(record, "questionNo")}
              id="inpHighestId"
              onChange={(e) => this.inpHighestChange(record, "questionNo", e)}
              style={{ width: "100%", height: "100%" }}
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%" }}>{text}</div>
          );
        },
      },
      {
        title: trans("analysis.knowLedgeScoreRate", "得分率"),
        width: "20%",
        dataIndex: "questionScoreRate",
        // align: "center",
        render: (text, record) => {
          return highScoreRateEdit ? (
            <TextArea
              value={text}
              onBlur={() => this.inpHighestBlur(record, "questionScoreRate")}
              id="inpHighestId"
              onChange={(e) =>
                this.inpHighestChange(record, "questionScoreRate", e)
              }
              style={{ width: "100%", height: "100%" }}
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: text }}
              style={{ width: "100%", height: "100%" }}
            ></div>
          );
        },
      },
      {
        title: trans("global.analytical", "分析"),
        width: "70%",
        dataIndex: "teacherAnalysis",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          if (this.state[`inpHighest${record.index}teacherAnalysis`]) {
            return (
              <Mentions
                value={text}
                onBlur={() => this.inpHighestBlur(record, "teacherAnalysis")}
                id="inpHighestId"
                onChange={(e) =>
                  this.inpHighestChange(record, "teacherAnalysis", e)
                }
                style={{ width: "100%", height: "100%" }}
                // autoSize={{ minRows: 2, maxRows: 6 }}
                // onKeyUp={this.keyUpSearch}
                // onKeyDown={this.keyDownSearch}
                onSearch={this.onSearch}
                loading={loading}
              >
                {userByNameList &&
                  userByNameList.length &&
                  userByNameList.map((item) => (
                    <Option value={item.name}>{item.name}</Option>
                  ))}
              </Mentions>
            );
          } else {
            return (
              <div
                style={{ width: "100%", height: "100%" }}
                onClick={() =>
                  this.clickInputHighest(text, record, "teacherAnalysis")
                }
              >
                {text}
              </div>
            );
          }
        },
      },
    ];
    highScoreRateEdit
      ? highScoreRateClumns.push({
          title: "",
          width: "10%",
          dataIndex: "index",
          render: (text, record) => (
            <i
              className={icon.iconfont}
              style={{ fontSize: "16px", cursor: "pointer" }}
              onClick={() => this.scoringHighDel(text)}
            >
              &#xe797;
            </i>
          ),
        })
      : highScoreRateEdit;
    const lowScoreRateClumns = [
      {
        title: trans("analysis.questionIndex", "题号"),
        dataIndex: "questionNo",
        width: "10%",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          return lowScoreRateEdit ? (
            <Select
              defaultValue={text}
              style={{ width: 120 }}
              onChange={(e) => this.inpLowChange(record, "questionNo", e)}
            >
              {wrongQuestion &&
                wrongQuestion.length > 0 &&
                wrongQuestion.map((item, index) => (
                  <Option value={item.questionNumber}>
                    {item.questionNumber}
                  </Option>
                ))}
            </Select>
          ) : (
            <div style={{ width: "100%", height: "100%" }}>{text}</div>
          );
        },
      },
      {
        title: trans("analysis.model", "模块"),
        width: "20%",
        dataIndex: "questionScoreRate",
        // align: "center",
        render: (text, record) => {
          return (
            <div
              dangerouslySetInnerHTML={{ __html: text }}
              style={{ width: "100%", height: "100%" }}
            ></div>
          );
        },
      },
      {
        title: trans("global.analytical", "分析"),
        width: "70%",
        dataIndex: "teacherAnalysis",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          if (this.state[`inpLow${record.index}teacherAnalysis`]) {
            return (
              <Mentions
                value={text}
                onBlur={() => this.inpLowBlur(record, "teacherAnalysis")}
                id="inpLowId"
                onChange={(e) =>
                  this.inpLowChange(record, "teacherAnalysis", e)
                }
                style={{ width: "100%", height: "100%" }}
                // autoSize={{ minRows: 2, maxRows: 6 }}
                onSearch={this.onSearch}
                loading={loading}
              >
                {userByNameList &&
                  userByNameList.length &&
                  userByNameList.map((item) => (
                    <Option value={item.name}>{item.name}</Option>
                  ))}
              </Mentions>
            );
          } else {
            return (
              <div
                style={{ width: "100%", height: "100%" }}
                onClick={() =>
                  this.clickInputLow(text, record, "teacherAnalysis")
                }
              >
                {text}
              </div>
            );
          }
        },
      },
    ];
    lowScoreRateEdit
      ? lowScoreRateClumns.push({
          title: "",
          width: "10%",
          dataIndex: "index",
          render: (text, record) => (
            <i
              className={icon.iconfont}
              style={{ fontSize: "16px", cursor: "pointer" }}
              onClick={() => this.scoringLowDel(text)}
            >
              &#xe797;
            </i>
          ),
        })
      : lowScoreRateEdit;

    return (
      <div
        className={styles.multiClassList}
        id={`table${this.props.index + 7}`}
      >
        <div className={styles.tableTitle}>
          <span className={styles.blueRound}></span>
          <span className={styles.titleName}>
            {groupName} —— {teacherNames}
          </span>
          {classEdit ? (
            <div className={styles.scoreBtn}>
              <span
                className={styles.scoreCancle}
                onClick={() => this.multiClassCancle()}
              >
                {trans("global.cancle", "取消")}
              </span>
              <span
                className={styles.scoreSave}
                onClick={() => this.clickmultiClassSave()}
              >
                {trans("global.save", "保存")}
              </span>
            </div>
          ) : (
            <>
              {authenticationModel?.groupIdList?.indexOf(groupId) > -1 &&
              authenticationModel.isGroupAnalysis ? (
                <span
                  className={styles.edit}
                  onClick={() => this.clickEditScoreRate()}
                  id={`edit${this.props.index}`}
                >
                  {trans("global.edit", "编辑")}
                </span>
              ) : null}
            </>
          )}
        </div>
        <div className={styles.classTab}>
          {moduleScoreModelList == undefined ? null : (
            <div
              className={styles.highestScoring}
              style={{ marginBottom: "12px" }}
            >
              <div className={styles.classTabTitle}>
                {trans("global.modelAnalysis", "模块分析")}
                <div className={styles.topBtn}></div>
              </div>
              <Table
                columns={highScoreRateClumns}
                dataSource={moduleScoreModelList}
                bordered={true}
                pagination={false}
              />
              {highScoreRateEdit ? (
                <div className={styles.increaseRow}>
                  <div
                    className={styles.increase}
                    onClick={this.addHighScoringList}
                  >
                    <i
                      className={icon.iconfont}
                      style={{
                        fontSize: "14px",
                        marginRight: "8px",
                        cursor: "pointer",
                      }}
                    >
                      &#xe7d5;
                    </i>
                    {trans("global.increase", "添加一行")}
                  </div>
                </div>
              ) : null}
            </div>
          )}
          <div className={styles.differentiationAnalysis}>
            <div className={styles.classTabTitle}>
              {trans("global.differentiationAnalysis", "学生分布分析")}
              <div className={styles.topBtn}>
                {multiClassEdit ? (
                  <Popconfirm
                    title={trans(
                      "global.adjusting",
                      "调整分段会清空当前表格中已填写的学情和下一步行动，建议先手动复制保存，再点击【确定】继续调整？",
                    )}
                    icon={
                      <Icon
                        type="exclamation-circle"
                        style={{ color: "red" }}
                      />
                    }
                    onConfirm={this.adjustingConfirm}
                    onCancel={this.adjustingCancel}
                    okText={trans("global.sure", "确定")}
                    cancelText={trans("global.cancle", "取消")}
                    overlayStyle={{ width: "257px" }}
                    placement="bottom"
                  >
                    <span className={styles.adjusting}>
                      {trans("global.adjustingSegments", "调整分段")}
                    </span>
                  </Popconfirm>
                ) : null}
              </div>
            </div>
            <Table
              columns={multiClassClumns}
              dataSource={multiClassTableList}
              bordered={true}
              pagination={false}
            />
          </div>
          {this.props.gradeName &&
          (this.props.gradeName == "一年级" ||
            this.props.gradeName == "二年级" ||
            this.props.gradeName == "三年级" ||
            this.props.gradeName == "四年级" ||
            this.props.gradeName == "五年级" ||
            this.props.gradeName == "六年级" ||
            this.props.gradeName == "G1" ||
            this.props.gradeName == "G2" ||
            this.props.gradeName == "G3" ||
            this.props.gradeName == "G4" ||
            this.props.gradeName == "G5" ||
            this.props.gradeName == "G6") ? (
            <div className={styles.tableBoxContent} style={{ marginTop: 12 }}>
              <div className={styles.classTextHeader}>
                <span>
                  {trans("global.classText", "班级整体分析和跟进策略")}
                </span>
              </div>
              {this.state.classEdit ? (
                <>
                  <RicherEditor
                    onRef={this.onRefPropositional}
                    dispatch={this.props.dispatch}
                    cancelEditor={this.cancelEditor}
                    relationType="4"
                    paperId={this.props.paperId}
                    braftType="classText"
                    blurEdit={this.blurEditLeaderSummary}
                    initContent={this.state.classAnalysisText}
                    changeText={this.leaderSummaryText}
                    blue={true}
                    modelKey={3}
                    uuId={this.state.uuId}
                    releaseLock={this.releaseLock}
                    examId={this.props.examId}
                    reloadModalVisibleEditText={
                      // this.reloadModalVisibleEditText
                      ""
                    }
                  />
                </>
              ) : (
                <div
                  className={styles.propositionalHtml}
                  style={{ padding: 5 }}
                >
                  {this.state.classAnalysisText ? (
                    <>
                      <div
                        className={styles.fillAnalysis}
                        style={{
                          paddingLeft: "15px",
                          paddingRight: "35px",
                          lineHeight: "22px",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: this.state.classAnalysisText,
                        }}
                      ></div>
                    </>
                  ) : (
                    <>
                      <div
                        className={styles.notFilled}
                        style={{ lineHeight: "22px" }}
                      >
                        {trans(
                          "global.importClassStrategy",
                          "请输入班级的整体分析和策略",
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : null}

          <div className={styles.addAttachment}>
            {classEdit ? (
              <Upload
                {...{
                  name: "files",
                  action: "/api/upload_file",
                  showUploadList: false,
                  onChange: this.changupload2,
                }}
              >
                <Button>
                  <Icon type="plus" />{" "}
                  {trans("global.addAttachment", "添加附件")}
                </Button>
                <sapn className={styles.uploadMultiple}>
                  {trans(
                    "global.uploadMultiple",
                    "单个文件大小限制800M以内，可上传多个",
                  )}
                </sapn>
              </Upload>
            ) : null}

            {this.props.fileList?.length
              ? this.props.fileList.map((file, index) => (
                  <UseFileItem
                    key={index}
                    fileItem={file}
                    lookDetail={(status, item) => {
                      this.props.lookDetail &&
                        this.props.lookDetail(status, item);
                    }}
                    deleteFile={() => {
                      this.deleteFile(index);
                    }}
                  />
                ))
              : null}
          </div>
        </div>

        <Modal
          title={trans("global.setInterval", "设置分布区间")}
          visible={this.state.adjusting}
          // visible={true}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          width="500px"
          getContainer={false}
          // className="setInterval"
        >
          {this.sum(numPhaseList) == 100 ? null : (
            <Alert
              message={trans(
                "global.pleaseCorrectly",
                "请确保一下分段数值填写正确",
              )}
              type="error"
              showIcon
              height="30px"
            />
          )}
          <div className="numPhaseBox" style={{ textAlign: "center" }}>
            <i
              className={[icon.iconfont, styles.clickIcon].join(" ")}
              style={{ fontSize: "18px", cursor: "pointer" }}
              onClick={this.clickReduce}
            >
              &#xe838;
            </i>
            <span className="numPhase">
              {trans("setIntervalModal.segmentCount", "{$count}段", {
                count: numPhase,
              })}
            </span>
            <i
              className={[icon.iconfont, styles.clickIcon].join(" ")}
              style={{ fontSize: "18px", cursor: "pointer" }}
              onClick={this.clickAddd}
            >
              &#xe839;
            </i>
          </div>
          <div className="numPhaseBox">
            <span className="paragraph">{trans("global.top", "前段")}</span>
            <InputNumber
              min={1}
              max={100}
              value={numPhaseList[0]}
              className="numPhase"
              style={{ width: "91px" }}
              onChange={this.changeAfter}
            />
            <span>{`[0~${numPhaseList[0]}]%`}</span>
          </div>
          {numPhaseList &&
            numPhaseList.length > 0 &&
            numPhaseList.map((item, index) => {
              if (index == 0) {
                return;
              } else if (index == numPhaseList.length - 1) {
                return;
              } else {
                return (
                  <div className="numPhaseBox" key={index}>
                    <span className="paragraph">
                      {trans("global.middle", "中段")}
                      {index}
                    </span>
                    <InputNumber
                      min={1}
                      max={100}
                      value={item}
                      className="numPhase"
                      style={{ width: "91px" }}
                      onChange={(value) => this.chengeMiddle(index, value)}
                    />
                    {/* <span>{`[${numPhaseList[index - 1]}%~${
                      numPhaseList[index - 1] + numPhaseList[index]
                    }%]`}</span> */}
                    {this.getMiddle(index)}
                  </div>
                );
              }
            })}

          <div className="numPhaseBox">
            <span className="paragraph">{trans("global.after", "后段")}</span>
            <InputNumber
              min={1}
              max={100}
              value={numPhaseList.at(-1)}
              className="numPhase"
              style={{ width: "91px" }}
              onChange={this.changeFront}
            />
            <span>{`[${100 - numPhaseList.at(-1)}%~100%]`}</span>
          </div>
        </Modal>
        {this.state.lockTipVisible && (
          <ClashLockModal
            lockTipVisible={this.state.lockTipVisible} //modal显隐
            forceLock={this.forceLock} //强制抢锁方法
            operatorTips={this.state.operatorTips} //提示信息
            currentOperItem={this.state.currentOperItem} //强制抢锁参数
            giveupLocking={this.giveupLocking} //放弃抢锁
            modelKey={3}
          />
        )}
        {this.state.reloadModalVisible ? (
          <ReloadModal reloadModalVisible={this.state.reloadModalVisible} />
        ) : null}
      </div>
    );
  }
}
export default connect(({ home }) => ({
  updateStage: home.updateStage,
  editReport: home.editReport,
  wrongQuestion: home.wrongQuestion,
  groupAndGradeScoreRate: home.groupAndGradeScoreRate,
  userByNameList: home.userByNameList,
}))(MultiClassTable);

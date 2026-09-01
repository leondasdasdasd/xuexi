// import "../../utils/globals.less";
import React, { Component } from "react";
import { Checkbox, Input, message, Select, Table } from "antd";
import { connect } from "dva";

import tishi from "../../assets/tishi.png";
// import axios from "axios";
// import "./index.module.less";
import { locale, trans } from "../../utils/i18n";

// import { injectIntl } from 'react-intl';
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Option } = Select;
const { Search, TextArea } = Input;
const { Column } = Table;
const format1 = "HH:mm";
const format2 = "YYYY-MM-DD";
// import { trans, locale } from '../../utils/i18n';
const PLAT = {
  pc: "pc",
  mobile: "mobile",
};
const PAGE_SIZE = 10;
let date = new Date();
let month = date.getMonth() + 1; //当前月
let year = date.getFullYear(); //当前年(4位)
let day = date.getDate();
let CLevent = { [PLAT.pc]: "MouseUp", [PLAT.mobile]: "TouchEnd" }[
  window.PLATFORM_TYPE
];
class NewNoticeq extends Component {
  constructor(properties) {
    super(properties);

    this.state = {
      allGroupsChecked: false,
      classIndex: 0,
      switchClassesId: null,
      disabledStu: [],
      dataLine: `${year}-${month}-${day}`,
      dataTime: "22:00",
      stuName: "",
      stuIdList: [],
      dataLineTiming: "2022-12-12", //定时年月日
      dataTimeTiming: "17: 00", //定时时间
      isExamTitle: false,
      checkExam: 0,
      visSetTiming: false,
      isHide: false,
      testTitle: 1,
      initiatingSteps: 1, // 步骤
      publishType: "0",
      active: 1,
      queryConditionName: "",
      saveGradeIdList: [],
      saveTypeList: [],
      saveTestId: [],
      saveStuId: null,
    };
  }
  componentDidMount() {
    console.log(this.props.saveStuRecord, "ppp");
    this.props.onRef(this);
    const { gradeIdList, examTypeList, examIdList } = this.props;
    this.setState(
      {
        saveGradeIdList: gradeIdList,
        saveTypeList: examTypeList,
        saveTestId: examIdList,
      },
      () => {
        if (this.props.teacherView == 1) {
          let newExamIdList = [];
          this.props.saveStuRecord &&
            this.props.saveStuRecord.examIdList &&
            this.props.saveStuRecord.examIdList.length > 0 &&
            this.props.saveStuRecord.examIdList.map((item) => {
              newExamIdList.push(item + "");
            });
          this.setState(
            {
              active: 1,
              saveStuId: this.props.saveStuRecord.id,
              saveGradeIdList: this.props.saveStuRecord.gradeIdList,
              saveTypeList: this.props.saveStuRecord.examTypeList,
              saveTestId: newExamIdList,
              queryConditionName: this.props.saveStuRecord.name,
            },
            () => {
              this.props.dispatch({
                type: "global/getStudentGroupListAndStudentList",
              });
            },
          );
        } else {
          if (this.props.saveStuRecord?.id) {
            this.setState(
              {
                active: 2,
                saveStuId: this.props.saveStuRecord.id,
                saveGradeIdList: this.props.saveStuRecord.gradeIdList,
                saveTypeList: this.props.saveStuRecord.examTypeList,
                saveTestId: this.props.saveStuRecord.examIdList,
                queryConditionName: this.props.saveStuRecord.name,
              },
              () => {
                this.props.dispatch({
                  type: "global/getStudentGroupListAndStudentList",
                });
              },
            );
          }
        }
      },
    );
  }
  componentDidUpdate(properties, nextProperties) {
    console.log(properties, nextProperties, "11hhb");
    if (
      properties.groupList.length === 0 &&
      this.props.groupList &&
      this.props.groupList.length > 0
    ) {
      this.switchClasses(0, this.props.groupList[0].groupCourseId);
      setTimeout(() => {
        this.props.groupList.map((item, index) => {
          this.renderLength(index);
        });
      }, 100);
    }
  }
  getPresonalDetail = (id) => {
    const that = this;
    console.log(this.setState);
    this.setState(
      {
        personalDetail: {},
      },
      () => {
        axios
          .get(`${this.props.url}?userId=${this.props.userId}`)
          .then(function (response) {
            console.log(response);
            if (response.data && response.data.status) {
              that.setState(
                {
                  personalDetail: response.data.content,
                },
                () => {
                  console.log(that.state.personalDetail, "111");
                },
              );
            }
          })
          .catch(function (error) {
            console.log(error);
          });
      },
    );
  };
  changeStu = (e, id) => {
    const { groupList } = this.props;
    let array = this.state.stuIdList;
    let br = false;
    let index = 0;
    let state = Object.assign({}, this.state);
    let number_ = 0;
    state[`stuChecked${id}`] = e.target.checked;
    if (!e.target.checked) {
      state[`allStuChecked${this.state.classIndex}`] = false;
    }
    if (e.target.checked) {
      if (array.length === 0) {
        let count = false;
        if (this.props.disabledStu && this.props.disabledStu.length > 0) {
          this.props.disabledStu.map((it) => {
            if (it.id === id) {
              count = true;
            }
          });
        }
        if (!count) {
          array.push({
            groupCourseId: groupList[this.state.classIndex].groupCourseId,
            id: id,
          });
        }
      } else {
        array.map((item) => {
          if (item.id == id) {
            return;
          }
        });
        let count = false;
        if (this.props.disabledStu && this.props.disabledStu.length > 0) {
          this.props.disabledStu.map((it) => {
            if (it.id === id) {
              count = true;
            }
          });
        }
        if (!count) {
          array.push({
            groupCourseId: groupList[this.state.classIndex].groupCourseId,
            id: id,
          });
        }
      }
      groupList &&
        groupList[this.state.classIndex] &&
        groupList[this.state.classIndex].studentList &&
        groupList[this.state.classIndex].studentList.length &&
        groupList[this.state.classIndex].studentList.map((item) => {
          if (state[`stuChecked${item.id}`]) {
            index += 1;
          } else {
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (item.id === ite.id) {
                  index += 1;
                }
              });
            }
          }
        });
      if (groupList[this.state.classIndex].studentList.length == index) {
        state[`allStuChecked${this.state.classIndex}`] = true;
      }
      groupList &&
        groupList.length &&
        groupList.map((item) => {
          number_ += item.studentList.length;
        });
      if (number_ == array.length) {
        br = true;
      }
    } else {
      array = array.filter((item) => {
        return item.id !== id;
      });
    }
    this.setState({
      ...state,
      stuIdList: array,
      allGroupsChecked: br,
    });
    console.log(array, "222");
  };
  sure = () => {
    const payload = {
      stuIdList: this.state.stuIdList,
      dataLine: this.state.dataLine,
      publishType: this.state.publishType,
      dataLineTiming: this.state.dataLineTiming,
      dataTimeTiming: this.state.dataTimeTiming,
      dataTime: this.state.dataTime,
    };
    let array = [];
    this.state.stuIdList.length > 0 &&
      this.state.stuIdList.map((item) => {
        array.push(item.id);
      });

    console.log(array, "dddd");
    const {
      studentId,
      subjectId,
      examIdList,
      queryType,
      gradeIdList,
      examTypeList,
    } = this.props;
    // const a = document.getElementById("batchDownload");
    window.open(
      `${window.location.origin}/api/trendComparativeAnalysis/export/errorQuestionList?queryType=${queryType}&studentId=${studentId}&subjectId=${subjectId}&gradeIdList=${gradeIdList}&examTypeList=${examTypeList}&examIdList=${examIdList}&studentIdList=${array}`,
    );
    this.setState({
      stuIdList: [],
    });
    this.props.modalVisible();
    // this.props.sureStu(payload);

    // this.props
    //   .dispatch({
    //     type: "global/getExportErrorQuestionList",
    //     payload: {
    //       studentIdList: arr,
    //       studentId,
    //       subjectId: subjectId == 0 ? "" : subjectId,
    //       gradeIdList,
    //       queryType,
    //       examTypeList,
    //       examIdList,
    //     },
    //   })
    //   .then(() => {
    //     this.setState({
    //       stuIdList: [],
    //     });
    //     this.props.modalVisible();
    //   });
  };
  switchClasses = (index, id) => {
    console.log(index, id, "test1");
    this.setState({
      classIndex: index,
      switchClassesId: id,
    });
  };
  delIdList = (id) => {
    let newState = JSON.parse(JSON.stringify(this.state));
    let list = JSON.parse(JSON.stringify(this.state.stuIdList));
    if (list && list.length > 0) {
      list.map((item, index) => {
        if (item.id === id) {
          list.splice(index, 1);
        }
      });
    }
    newState[`stuChecked${id}`] = false;
    this.setState({
      ...newState,
      stuIdList: list,
    });
  };
  renderLength(index) {
    let number_ = 0;
    let list = this.props.disabledStu
      ? JSON.parse(JSON.stringify(this.props.disabledStu))
      : [];
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentList.map((it) => {
        if (this.state.stuIdList && this.state.stuIdList.length > 0) {
          this.state.stuIdList.map((index_) => {
            if (index_.id === it.id) {
              number_ += 1;
            } else {
              if (list && list) {
                list.map((ite, ind) => {
                  if (ite.id === it.id) {
                    number_ += 1;
                    list.splice(ind, 1);
                  }
                });
              }
            }
          });
        } else {
          if (list && list.length > 0) {
            list.map((ite, ind) => {
              if (ite.id === it.id) {
                number_ += 1;
                list.splice(ind, 1);
              }
            });
          }
        }
      });
    }
    const newState = JSON.parse(JSON.stringify(this.state));
    if (number_ === this.props.groupList[index].studentList.length) {
      newState[`allStuChecked${index}`] = true;
    }
    console.log(number_, newState, "nnuhhb");
    this.setState({
      ...newState,
    });
  }
  renderNum = (index) => {
    let number_ = 0;
    let list = this.props.disabledStu
      ? JSON.parse(JSON.stringify(this.props.disabledStu))
      : [];
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentList.map((it) => {
        if (this.state.stuIdList && this.state.stuIdList.length > 0) {
          this.state.stuIdList.map((index_) => {
            if (index_.id === it.id) {
              number_ += 1;
            } else {
              if (list && list) {
                list.map((ite, ind) => {
                  if (ite.id === it.id) {
                    number_ += 1;
                    list.splice(ind, 1);
                  }
                });
              }
            }
          });
        } else {
          if (list && list.length > 0) {
            list.map((ite, ind) => {
              if (ite.id === it.id) {
                number_ += 1;
                list.splice(ind, 1);
              }
            });
          }
        }
      });
    }
    return number_ === 0 ? <div></div> : <div>({number_})</div>;
  };
  renderInder = (index) => {
    let number_ = false;
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentList.map((it) => {
        if (this.state.stuIdList && this.state.stuIdList.length > 0) {
          this.state.stuIdList.map((index_) => {
            if (index_.id === it.id) {
              number_ = true;
            } else {
              if (this.props.disabledStu && this.props.disabledStu.length > 0) {
                this.props.disabledStu.map((ite) => {
                  if (ite.id === it.id) {
                    number_ = true;
                  }
                });
              }
            }
          });
        } else {
          if (this.props.disabledStu && this.props.disabledStu.length > 0) {
            this.props.disabledStu.map((ite) => {
              if (ite.id === it.id) {
                number_ = true;
              }
            });
          }
        }
      });
    }
    return number_;
  };
  renderTotal = () => {
    let number_ = false;
    if (this.props.groupList && this.props.groupList.length > 0) {
      this.props.groupList.map((item) => {
        item.studentList.map((it) => {
          if (this.state.stuIdList && this.state.stuIdList.length > 0) {
            this.state.stuIdList.map((index) => {
              if (index.id === it.id) {
                number_ = true;
              } else {
                if (
                  this.props.disabledStu &&
                  this.props.disabledStu.length > 0
                ) {
                  this.props.disabledStu.map((ite) => {
                    if (ite.id === it.id) {
                      number_ = true;
                    }
                  });
                }
              }
            });
          } else {
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (ite.id === it.id) {
                  number_ = true;
                }
              });
            }
          }
        });
      });
    }
    return number_;
  };
  changeStuName = (e) => {
    this.setState({
      stuName: e.target.value,
    });
  };
  searchStuName = (e) => {
    this.props.dispatch({
      type: "global/getStudentGroupListAndStudentList",
      payload: {
        keyWord: e,
      },
    });
  };
  //所有学生
  changeAllStuAndClass = (e, id, ind) => {
    const { groupList } = this.props;
    let br = false;
    let number_ = 0;
    let array = this.state.stuIdList;
    let state = Object.assign({}, this.state);
    state[`allStuChecked${ind}`] = e.target.checked;
    let newNumber = 0;
    groupList &&
      groupList.length &&
      groupList.map((it) => {
        number_ += it.studentList.length;
        it.studentList.map((ite) => {
          if (this.props.disabledStu && this.props.disabledStu.length > 0) {
            this.props.disabledStu.map((itee) => {
              if (ite.id === itee.id) {
                newNumber += 1;
              }
            });
          }
        });
      });
    groupList &&
      groupList[ind] &&
      groupList[ind].studentList &&
      groupList[ind].studentList.length &&
      groupList[ind].studentList.map((item, index) => {
        state[`stuChecked${item.id}`] = e.target.checked;
        if (e.target.checked) {
          if (array.length === 0) {
            let count = false;
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (ite.id === item.id) {
                  count = true;
                }
              });
            }
            if (!count) {
              array.push({
                groupCourseId: groupList[ind].groupCourseId,
                id: item.id,
              });
            }
          } else {
            // arr.map((it) => {
            //   if (it.id == item.id) {
            //     return;
            //   } else {

            //   }
            // });
            let count = false;
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (ite.id === item.id) {
                  count = true;
                }
              });
            }
            if (!count) {
              array.push({
                groupCourseId: groupList[ind].groupCourseId,
                id: item.id,
              });
            }

            // for (var i = 0; i < arr.length; i++) {
            //   for (var j = i + 1; j < arr.length; j++) {
            //     if (arr[i].key === arr[j].key) {
            //       arr.splice(j, 1);
            //       j = j - 1;
            //     }
            //   }
            // }
          }
        } else {
          return;
        }
      });
    array.filter(Boolean);
    console.log(array);
    if (e.target.checked) {
      var object = {};
      array = array.reduce(function (item, next) {
        object[next.istudentIdd]
          ? ""
          : (object[next.id] = true && item.push(next));
        return item;
      }, []);
      if (array.length + newNumber == number_) {
        br = true;
      }
    } else {
      array = array.filter((item) => {
        return item.groupCourseId !== id;
      });
    }

    this.setState({
      ...state,
      allGroupsChecked: br,
      stuIdList: array,
    });
  };
  changeAllStu = (e, id) => {
    const { groupList } = this.props;
    let br = false;
    let number_ = 0;
    let array = this.state.stuIdList;
    let state = Object.assign({}, this.state);
    state[`allStuChecked${this.state.classIndex}`] = e.target.checked;
    groupList &&
      groupList.length &&
      groupList.map((it) => {
        number_ += it.studentList.length;
      });
    groupList &&
      groupList[this.state.classIndex] &&
      groupList[this.state.classIndex].studentList &&
      groupList[this.state.classIndex].studentList.length &&
      groupList[this.state.classIndex].studentList.map((item, index) => {
        state[`stuChecked${item.id}`] = e.target.checked;
        if (e.target.checked) {
          if (array.length === 0) {
            array.push({
              groupCourseId: groupList[this.state.classIndex].groupCourseId,
              id: item.id,
            });
          } else {
            // arr.map((it) => {
            //   if (it.id == item.id) {
            //     return;
            //   } else {

            //   }
            // });
            array.push({
              groupCourseId: groupList[this.state.classIndex].groupCourseId,
              id: item.id,
            });
            // for (var i = 0; i < arr.length; i++) {
            //   for (var j = i + 1; j < arr.length; j++) {
            //     if (arr[i].key === arr[j].key) {
            //       arr.splice(j, 1);
            //       j = j - 1;
            //     }
            //   }
            // }
          }
        } else {
          return;
        }
      });
    array.filter(Boolean);
    if (e.target.checked) {
      var object = {};
      array = array.reduce(function (item, next) {
        object[next.id] ? "" : (object[next.id] = true && item.push(next));
        return item;
      }, []);
      if (array.length == number_) {
        br = true;
      }
    } else {
      array = array.filter((item) => {
        return item.groupCourseId !== id;
      });
    }

    this.setState({
      ...state,
      allGroupsChecked: br,
      stuIdList: array,
    });
  };
  handleVisibleChange = (value) => {
    this.setState({
      visSetTiming: value,
    });
  };

  clickTimeancle = () => {
    this.setState({
      visSetTiming: false,
    });
  };

  clickTimeSure = () => {
    this.setState({
      visSetTiming: false,
      publishType: "1",
    });
  };
  visibleChange = () => {
    this.props.modalVisible();
  };
  onChangeDeadlineDataTiming = (date, dateString) => {
    // console.log(date, dateString, "333");
    this.setState({
      dataLineTiming: dateString,
    });
  };
  onChangeDeadlineTimeTiming = (date, dateString) => {
    this.setState({
      dataTimeTiming: dateString,
    });
  };
  onChangeDeadlineData = (date, dateString) => {
    // console.log(date, dateString, "333");
    this.setState({
      dataLine: dateString,
    });
  };
  onChangeDeadlineTime = (date, dateString) => {
    this.setState({
      dataTime: dateString,
    });
  };
  changeAllGroups = (e) => {
    const { groupList } = this.props;
    let array = [];
    let state = Object.assign({}, this.state);
    groupList &&
      groupList.length &&
      groupList.map((item, index) => {
        state[`allStuChecked${index}`] = e.target.checked;
        item.studentList.length &&
          item.studentList.map((it) => {
            state[`stuChecked${it.id}`] = e.target.checked;
            if (e.target.checked) {
              let count = false;
              if (this.props.disabledStu && this.props.disabledStu.length > 0) {
                this.props.disabledStu.map((ite) => {
                  if (ite.id === it.id) {
                    count = true;
                  }
                });
              }
              if (!count) {
                array.push({
                  groupCourseId: item.groupCourseId,
                  id: it.id,
                });
              }
            } else {
              array = [];
            }
          });
      });
    this.setState({
      ...state,
      allGroupsChecked: e.target.checked,
      stuIdList: array,
    });
  };
  changeExamName = (e) => {
    this.setState({
      queryConditionName: e.target.value,
    });
  };
  clickSendingStudents = () => {
    if (!this.state.queryConditionName) {
      message.error(
        trans(
          "stuConditionSelect.conditionNameRequired",
          "查询条件名称不能为空",
        ),
      );
      return false;
    }
    this.setState(
      {
        active: 2,
      },
      () => {
        const { subjectId, stuNameList } = this.props;
        const {
          queryConditionName,
          saveGradeIdList,
          saveTestId,
          stuIdList,
          saveTypeList,
          saveStuId,
        } = this.state;
        let newTestList = [];
        if (saveTestId[0] == 0) {
          stuNameList &&
            stuNameList.length > 0 &&
            stuNameList.map((item) => {
              newTestList.push(item.examId);
            });
        }

        this.props
          .dispatch({
            type: "global/postWrongQuestionVersion",
            payload: {
              id: saveStuId, // 修改保存使用
              name: queryConditionName,
              subjectId: subjectId,
              gradeIdList: saveGradeIdList,
              examTypeList: saveTypeList,
              examIdList: saveTestId[0] == 0 ? newTestList : saveTestId,
              studentIdList: [],
              status: 0, //0：保存；1：发布
            },
          })
          .then(() => {
            this.setState({
              saveStuId: this.props.wrongQuestionVersion,
            });
          });
        this.props.dispatch({
          type: "global/getStudentGroupListAndStudentList",
          payload: {},
        });
      },
    );
  };
  changeGrade = (id) => {
    this.setState({
      saveGradeIdList: id,
    });
  };
  changeType = (id) => {
    this.setState({
      saveTypeList: id,
    });
  };
  changeTest = (id, plainOptions) => {
    let testList = [];
    if (id.includes("0")) {
      testList = ["0"];
    } else {
      testList = id.length == plainOptions.length ? ["0"] : id;
    }
    this.setState({
      saveTestId: testList,
    });
  };
  clickSaveOnly = (isSave) => {
    const { subjectId, stuNameList } = this.props;
    const {
      queryConditionName,
      saveGradeIdList,
      saveTestId,
      stuIdList,
      saveTypeList,
      saveStuId,
    } = this.state;
    let array = [];
    this.state.stuIdList.length > 0 &&
      this.state.stuIdList.map((item) => {
        array.push(item.id);
      });
    let newTestList = [];
    if (saveTestId == ["0"]) {
      stuNameList &&
        stuNameList.length > 0 &&
        stuNameList.map((item) => {
          newTestList.push(item.examId);
        });
    }
    if (!this.state.queryConditionName) {
      message.error(
        trans(
          "stuConditionSelect.conditionNameRequired",
          "查询条件名称不能为空",
        ),
      );
      return false;
    }
    this.props
      .dispatch({
        type: "global/postWrongQuestionVersion",
        payload: {
          id: saveStuId, // 修改保存使用
          name: queryConditionName,
          subjectId: subjectId,
          gradeIdList: saveGradeIdList,
          examTypeList: saveTypeList,
          examIdList: saveTestId == ["0"] ? newTestList : saveTestId,
          studentIdList: isSave == 0 ? [] : array,
          status: isSave, //0：保存；1：发布
        },
      })
      .then(() => {
        if (isSave == 1) {
          this.setState(
            {
              active: 1,
            },
            () => {
              this.props.modalVisible();
              this.props.pushStatus();
            },
          );
        } else {
          this.props.modalVisible();
        }
      });
  };
  clickCancle = () => {
    this.setState(
      {
        active: 1,
      },
      () => {
        this.props.modalVisible();
      },
    );
  };
  render() {
    const {
      allGroupsChecked,
      switchClassesId,
      stuName,
      classIndex,
      active,
      queryConditionName,
      saveGradeIdList,
      saveTypeList,
      saveTestId,
    } = this.state;
    const { groupList, disabledStu, newTypeList, stuNameList } = this.props;

    let number1 = this.state.stuIdList.length || 0;
    let number2 = disabledStu.length || 0;
    const text = (
      <span>
        <img src={tishi} style={{ width: "100%" }} />
      </span>
    );
    return (
      <div className={styles.studentSelect} id="studentSelect">
        <div className={styles.stuModal}>
          <div className={styles.stuHeader}>
            <i
              className={[styles.iconfont, styles.closeIcon].join(" ")}
              onClick={this.visibleChange.bind(this)}
            >
              &#xe6a9;
            </i>
            <span className={styles.stuTitle}>
              {active == 1
                ? trans("global.savedCriteria", "保存查询条件")
                : trans("global.sendingStudents", "发送学生")}
            </span>
            <span></span>
          </div>
          {active == 1 ? (
            <div className={styles.conditionBox}>
              <div className={styles.conditionRow}>
                <span className={styles.rowLeft}>
                  {trans("global.queryConditionName", "查询条件名称")}
                </span>
                <div style={{ width: "75%", display: "inline-block" }}>
                  <Input
                    // style={{ width: "100%" }}
                    onChange={this.changeExamName}
                    value={queryConditionName}
                  />
                </div>
              </div>
              <div className={styles.conditionRow}>
                <span className={styles.rowLeft}>
                  {trans("global.grade", "年级")}
                </span>
                <div style={{ width: "75%" }}>
                  <Checkbox.Group
                    options={this.props.newGradeList}
                    value={saveGradeIdList}
                    onChange={(e) => this.changeGrade(e)}
                  />
                </div>
              </div>
              <div className={styles.conditionRow}>
                <span className={styles.rowLeft}>
                  {trans("global.examType", "类型")}
                </span>
                <div style={{ width: "75%" }}>
                  <Checkbox.Group
                    options={newTypeList}
                    value={saveTypeList}
                    onChange={(e) => this.changeType(e)}
                  />
                </div>
              </div>
              <div className={styles.conditionRow}>
                <span className={styles.rowLeft}>
                  {trans("global.test", "试卷")}
                </span>
                <Select
                  mode="multiple"
                  style={{ maxWidth: "90%", width: "50%" }}
                  placeholder={trans("global.pleaseSelectTest", "请选择试卷")}
                  onChange={(e) => this.changeTest(e, stuNameList)}
                  value={saveTestId}
                >
                  <Option key={0}>
                    {trans("global.allTestPaper", "全部试卷")}
                  </Option>
                  {stuNameList &&
                    stuNameList.length > 0 &&
                    stuNameList.map((item) => (
                      <Option key={item.examId}>{item.examName}</Option>
                    ))}
                </Select>
              </div>
            </div>
          ) : (
            <div className={styles.selectStu}>
              <div className={styles.deadline} style={{ marginTop: "15px" }}>
                <Search
                  placeholder={trans(
                    "global.studentSearch",
                    "请输入学生姓名/学号进行搜索",
                  )}
                  onSearch={this.searchStuName.bind(this)}
                  onChange={this.changeStuName.bind(this)}
                  value={stuName}
                  // style={{ width: "100%" }}
                />
              </div>
              <div className={styles.allCaS}>
                <div className={styles.allClass}>
                  <div className={styles.allGroups}>
                    <Checkbox
                      onChange={this.changeAllGroups.bind(this)}
                      checked={allGroupsChecked}
                      indeterminate={!allGroupsChecked && this.renderTotal()}
                    >
                      <span className={styles.allGroupCheck}>
                        {trans("global.allGroups", "所有组")}
                        {number1 + number2 > 0 ? (
                          <span style={{ marginLeft: "8px" }}>
                            ({this.state.stuIdList.length + disabledStu.length})
                          </span>
                        ) : null}
                      </span>
                    </Checkbox>
                  </div>
                  <div className={styles.classArr}>
                    {groupList &&
                      groupList.length > 0 &&
                      groupList.map((item, index) => (
                        <div
                          className={[
                            styles.classNames,
                            switchClassesId == item.groupCourseId
                              ? styles.blurClassNames
                              : "",
                          ].join(" ")}
                          onClick={() =>
                            this.switchClasses(index, item.groupCourseId)
                          }
                        >
                          <div>
                            <Checkbox
                              onChange={(e) =>
                                this.changeAllStuAndClass(
                                  e,
                                  item.groupCourseId,
                                  index,
                                )
                              }
                              checked={this.state[`allStuChecked${index}`]}
                              indeterminate={
                                !this.state[`allStuChecked${index}`] &&
                                this.renderInder(index)
                              }
                            ></Checkbox>
                            <span className={styles.stuNameBox}>
                              {item.studentGroupName}
                            </span>
                          </div>
                          {this.renderNum(index)}
                        </div>
                      ))}
                  </div>
                </div>
                <div className={styles.allStu}>
                  {switchClassesId ? (
                    <div className={styles.stuNames}>
                      <Checkbox
                        onChange={(e) =>
                          this.changeAllStu(
                            e,
                            groupList[classIndex].groupCourseId,
                          )
                        }
                        checked={
                          this.state[`allStuChecked${this.state.classIndex}`]
                        }
                      ></Checkbox>
                      <span className={styles.stuName}>
                        {trans("global.allStudents", "所有学生")}
                      </span>
                    </div>
                  ) : null}

                  <div className={styles.allStuNames}>
                    {groupList &&
                      groupList[classIndex] &&
                      groupList[classIndex].studentList &&
                      groupList[classIndex].studentList.length &&
                      groupList[classIndex].studentList.map((item) => {
                        let br = false;
                        return (
                          <div className={styles.stuNames}>
                            {disabledStu &&
                              disabledStu.length > 0 &&
                              disabledStu.map((it) => {
                                if (it.id == item.id) {
                                  br = true;
                                  return (
                                    <Checkbox defaultChecked disabled>
                                      <span className={styles.stuName}>
                                        {item.name}
                                      </span>
                                    </Checkbox>
                                  );
                                }
                              })}
                            {br ? null : (
                              <Checkbox
                                onChange={(e) => this.changeStu(e, item.id)}
                                checked={
                                  item.lock
                                    ? true
                                    : this.state[`stuChecked${item.id}`]
                                }
                                disabled={item.lock ? true : false}
                              >
                                <span className={styles.stuName}>
                                  {item.name}
                                </span>
                              </Checkbox>
                            )}

                            {/* <span className="stuPhoto"></span> */}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className={styles.stufooter}>
            {active == 1 ? (
              <div>
                <span
                  className={styles.footerButton}
                  onClick={this.clickCancle}
                >
                  {trans("global.cancle", "取消")}
                </span>
                <span
                  className={styles.footerButton}
                  style={{ background: "#dde5fd", color: "#0445FC" }}
                  onClick={() => this.clickSaveOnly(0)}
                >
                  {trans("global.saveOnly", "仅保存")}
                </span>
                <span
                  className={[styles.footerButton, styles.sureButton].join(" ")}
                  id="batchDownload"
                  onClick={this.clickSendingStudents}
                  // href="javascript:void(0)"
                >
                  {trans("global.saveSendStudents", "保存并发送学生")}
                </span>
              </div>
            ) : (
              <div>
                <span
                  className={styles.footerButton}
                  onClick={this.clickCancle}
                >
                  {trans("global.cancle", "取消")}
                </span>
                <span
                  className={[styles.footerButton, styles.sureButton].join(" ")}
                  id="batchDownload"
                  onClick={() => this.clickSaveOnly(1)}
                  // href="javascript:void(0)"
                >
                  {trans("global.sendingStudents", "发送学生")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ home, global }) => ({
  groupList: global.studentGroupListAndStudentList,
  wrongQuestionVersion: global.wrongQuestionVersion,
}))(NewNoticeq);

// export default injectIntl(NewNotice);

// const getDivDom = (dom)=> {
//   if(!dom.dataset.link){
//     return getDivDom(dom.parentNode);
//   } else {
//     return dom;
//   }
// }

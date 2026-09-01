// import "../../utils/globals.less";
import React, { Component } from "react";
import { Checkbox, Input, message, Modal, Select, Table } from "antd";

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
      switchClassesId: 0,
      classIndex: 0,
      // switchClassesId: null,
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
      stuCheck: false,
      parentCheck: false,
      initiatingSteps: 1, // 步骤
      publishType: "0",
    };
  }
  componentDidMount() {
    this.props.onRef(this);
  }
  componentDidUpdate(properties, nextProperties) {
    console.log(properties, nextProperties, "11hhb");
    if (
      properties.groupList.length === 0 &&
      this.props.groupList &&
      this.props.groupList.length > 0
    ) {
      this.switchClasses(0, this.props.groupList[0].groupId);
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
            if (it.studentId === id) {
              count = true;
            }
          });
        }
        if (!count) {
          array.push({
            groupId: groupList[this.state.classIndex].groupId,
            studentId: id,
          });
        }
      } else {
        array.map((item) => {
          if (item.studentId == id) {
            return;
          }
        });
        let count = false;
        if (this.props.disabledStu && this.props.disabledStu.length > 0) {
          this.props.disabledStu.map((it) => {
            if (it.studentId === id) {
              count = true;
            }
          });
        }
        if (!count) {
          array.push({
            groupId: groupList[this.state.classIndex].groupId,
            studentId: id,
          });
        }
      }
      groupList &&
        groupList[this.state.classIndex] &&
        groupList[this.state.classIndex].studentInfoResponseList &&
        groupList[this.state.classIndex].studentInfoResponseList.length &&
        groupList[this.state.classIndex].studentInfoResponseList.map((item) => {
          if (state[`stuChecked${item.studentId}`]) {
            index += 1;
          } else {
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (item.studentId === ite.studentId) {
                  index += 1;
                }
              });
            }
          }
        });
      if (
        groupList[this.state.classIndex].studentInfoResponseList.length == index
      ) {
        state[`allStuChecked${this.state.classIndex}`] = true;
      }
      groupList &&
        groupList.length &&
        groupList.map((item) => {
          number_ += item.studentInfoResponseList.length;
        });
      if (number_ == array.length) {
        br = true;
      }
    } else {
      array = array.filter((item) => {
        return item.studentId !== id;
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
        array.push(item.studentId);
      });

    console.log(array, "dddd");
    if (this.props.active === 1) {
      if (array.length > 0) {
        window.open(
          `${
            window.location.origin
          }/api/exam/download/allStudentStudySituation?examId=${
            this.props.examId
          }&studentIdList=${array.join(",")}`,
        );
      }
      this.visibleChange();
    } else {
      // if(!this.state.stuCheck && !this.state.parentCheck) {
      //   message.error(trans('global.sureCheck', '请选择发送对象'))
      //   return;
      // }
      if (!array || array.length === 0) {
        message.error(
          trans("studentQualitySelect.studentRequired", "请选择学生"),
        );
        return;
      }
      this.props.sureStu(payload);
      this.props
        .dispatch({
          type: "home/sendParent",
          payload: {
            examId: this.props.examId,
            studentIdList: array,
            student: this.props.active == 2 ? true : false,
            parent: this.props.active == 3 ? true : false,
          },
        })
        .then(() => {
          this.setState({
            stuIdList: [],
            stuCheck: false,
            parentCheck: false,
          });
          this.visibleChange();
        });
    }
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
        if (item.studentId === id) {
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
    const { active } = this.props;
    let list = this.props.disabledStu
      ? JSON.parse(JSON.stringify(this.props.disabledStu))
      : [];
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentInfoResponseList.map((it) => {
        if (this.state.stuIdList && this.state.stuIdList.length > 0) {
          this.state.stuIdList.map((index_) => {
            if (index_.studentId === it.studentId) {
              number_ += 1;
            } else {
              if (active == 2 && it.sendStudent) {
                number_ += 1;
              } else if (active == 3 && it.sendParent) {
                number_ += 1;
              }
              if (list && list) {
                list.map((ite, ind) => {
                  if (ite.studentId === it.studentId) {
                    number_ += 1;
                    list.splice(ind, 1);
                  }
                });
              }
            }
          });
        } else {
          if (active == 2 && it.sendStudent) {
            number_ += 1;
          } else if (active == 3 && it.sendParent) {
            number_ += 1;
          }
          if (list && list.length > 0) {
            list.map((ite, ind) => {
              if (ite.studentId === it.studentId) {
                number_ += 1;
                list.splice(ind, 1);
              }
            });
          }
        }
      });
    }
    const newState = JSON.parse(JSON.stringify(this.state));
    if (
      number_ === this.props.groupList[index].studentInfoResponseList.length
    ) {
      newState[`allStuChecked${index}`] = true;
    }
    console.log(number_, newState, "nnuhhb");
    this.setState({
      ...newState,
    });
  }
  renderNum = (index) => {
    const { active } = this.props;
    let number_ = 0;
    let list = this.props.disabledStu
      ? JSON.parse(JSON.stringify(this.props.disabledStu))
      : [];
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentInfoResponseList.map((it) => {
        if (this.state.stuIdList && this.state.stuIdList.length > 0) {
          this.state.stuIdList.map((index_) => {
            if (index_.studentId === it.studentId) {
              number_ += 1;
            } else {
              if (list && list) {
                list.map((ite, ind) => {
                  if (ite.studentId === it.studentId) {
                    number_ += 1;
                    list.splice(ind, 1);
                  }
                });
              }
            }
          });
          if (active == 2 && it.sendStudent) {
            number_ += 1;
          } else if (active == 3 && it.sendParent) {
            number_ += 1;
          }
        } else {
          if (active == 2 && it.sendStudent) {
            number_ += 1;
          } else if (active == 3 && it.sendParent) {
            number_ += 1;
          }
          if (list && list.length > 0) {
            list.map((ite, ind) => {
              if (ite.studentId === it.studentId) {
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
    const { active } = this.props;
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentInfoResponseList.map((it) => {
        if (this.state.stuIdList && this.state.stuIdList.length > 0) {
          this.state.stuIdList.map((index_) => {
            if (index_.studentId === it.studentId) {
              number_ = true;
            } else {
              if (active == 2 && it.sendStudent) {
                number_ = true;
              } else if (active == 3 && it.sendParent) {
                number_ = true;
              }
              if (this.props.disabledStu && this.props.disabledStu.length > 0) {
                this.props.disabledStu.map((ite) => {
                  if (ite.studentId === it.studentId) {
                    number_ = true;
                  }
                });
              }
            }
          });
        } else {
          if (active == 2 && it.sendStudent) {
            number_ = true;
          } else if (active == 3 && it.sendParent) {
            number_ = true;
          }
          if (this.props.disabledStu && this.props.disabledStu.length > 0) {
            this.props.disabledStu.map((ite) => {
              if (ite.studentId === it.studentId) {
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
    const { active } = this.props;
    if (this.props.groupList && this.props.groupList.length > 0) {
      this.props.groupList.map((item) => {
        item.studentInfoResponseList.map((it) => {
          if (this.state.stuIdList && this.state.stuIdList.length > 0) {
            this.state.stuIdList.map((index) => {
              if (index.studentId === it.studentId) {
                number_ = true;
              } else {
                if (active == 2 && it.sendStudent) {
                  number_ = true;
                } else if (active == 3 && it.sendParent) {
                  number_ = true;
                }
                if (
                  this.props.disabledStu &&
                  this.props.disabledStu.length > 0
                ) {
                  this.props.disabledStu.map((ite) => {
                    if (ite.studentId === it.studentId) {
                      number_ = true;
                    }
                  });
                }
              }
            });
          } else {
            if (active == 2 && it.sendStudent) {
              number_ = true;
            } else if (active == 3 && it.sendParent) {
              number_ = true;
            }
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (ite.studentId === it.studentId) {
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
    this.props.search(e);
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
        number_ += it.studentInfoResponseList.length;
        it.studentInfoResponseList.map((ite) => {
          if (this.props.disabledStu && this.props.disabledStu.length > 0) {
            this.props.disabledStu.map((itee) => {
              if (ite.studentId === itee.studentId) {
                newNumber += 1;
              }
            });
          }
        });
      });
    groupList &&
      groupList[ind] &&
      groupList[ind].studentInfoResponseList &&
      groupList[ind].studentInfoResponseList.length &&
      groupList[ind].studentInfoResponseList.map((item, index) => {
        state[`stuChecked${item.studentId}`] = e.target.checked;
        if (e.target.checked) {
          if (array.length === 0) {
            let count = false;
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (ite.studentId === item.studentId) {
                  count = true;
                }
              });
            }
            if (!count) {
              array.push({
                groupId: groupList[ind].groupId,
                studentId: item.studentId,
              });
            }
          } else {
            // arr.map((it) => {
            //   if (it.studentId == item.studentId) {
            //     return;
            //   } else {

            //   }
            // });
            let count = false;
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (ite.studentId === item.studentId) {
                  count = true;
                }
              });
            }
            if (!count) {
              array.push({
                groupId: groupList[ind].groupId,
                studentId: item.studentId,
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
          : (object[next.studentId] = true && item.push(next));
        return item;
      }, []);
      if (array.length + newNumber == number_) {
        br = true;
      }
    } else {
      array = array.filter((item) => {
        return item.groupId !== id;
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
        number_ += it.studentInfoResponseList.length;
      });
    groupList &&
      groupList[this.state.classIndex] &&
      groupList[this.state.classIndex].studentInfoResponseList &&
      groupList[this.state.classIndex].studentInfoResponseList.length &&
      groupList[this.state.classIndex].studentInfoResponseList.map(
        (item, index) => {
          state[`stuChecked${item.studentId}`] = e.target.checked;
          if (e.target.checked) {
            if (array.length === 0) {
              array.push({
                groupId: groupList[this.state.classIndex].groupId,
                studentId: item.studentId,
              });
            } else {
              // arr.map((it) => {
              //   if (it.studentId == item.studentId) {
              //     return;
              //   } else {

              //   }
              // });
              array.push({
                groupId: groupList[this.state.classIndex].groupId,
                studentId: item.studentId,
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
        },
      );
    array.filter(Boolean);
    if (e.target.checked) {
      var object = {};
      array = array.reduce(function (item, next) {
        object[next.studentId]
          ? ""
          : (object[next.studentId] = true && item.push(next));
        return item;
      }, []);
      if (array.length == number_) {
        br = true;
      }
    } else {
      array = array.filter((item) => {
        return item.groupId !== id;
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
        item.studentInfoResponseList.length &&
          item.studentInfoResponseList.map((it) => {
            state[`stuChecked${it.studentId}`] = e.target.checked;
            if (e.target.checked) {
              let count = false;
              if (this.props.disabledStu && this.props.disabledStu.length > 0) {
                this.props.disabledStu.map((ite) => {
                  if (ite.studentId === it.studentId) {
                    count = true;
                  }
                });
              }
              if (!count) {
                array.push({
                  groupId: item.groupId,
                  studentId: it.studentId,
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
  changeStuCheck = (e) => {
    this.setState({
      stuCheck: e.target.checked,
    });
  };
  changeParent = (e) => {
    this.setState({
      parentCheck: e.target.checked,
    });
  };
  renderIfCheck = (ifStu, ifParent, sendStu, sendPar, id) => {
    let check = false;
    if (ifStu && ifParent) {
      if (sendStu && sendPar) {
        check = true;
      } else if (id) {
        check = true;
      }
    } else if (ifStu) {
      if (sendStu) {
        check = true;
      } else if (id) {
        check = true;
      }
    } else if (ifParent) {
      if (sendPar) {
        check = true;
      } else if (id) {
        check = true;
      }
    } else {
      if (sendStu && sendPar) {
        check = true;
      } else if (id) {
        check = true;
      }
    }
    console.log(check, "cccc");
    return check;
  };
  render() {
    const {
      allGroupsChecked,
      switchClassesId,
      stuName,
      classIndex,
      stuCheck,
      parentCheck,
      dataTime,
      dataLine,
      dataLineTiming,
      initiatingSteps,
      isHide,
      testTitle,
      publishType,
      dataTimeTiming,
      checkExam,
      visSetTiming,
    } = this.state;
    const { groupList, disabledStu, active } = this.props;

    let number1 = this.state.stuIdList.length || 0;
    let number2 = disabledStu.length || 0;
    const text = (
      <span>
        <img src={tishi} style={{ width: "100%" }} />
      </span>
    );
    return (
      <div className={styles.studentSelect} id="studentSelect">
        <Modal
          footer={null}
          closable={false}
          bodyStyle={{ padding: 0 }}
          visible={this.props.visible}
          // getContainer={document.getElementById("studentSelect")}
          width={660}
          className={styles.studentSelectBox}
          getContainer={false}
          destroyOnClose={true}
        >
          <div className={styles.stuModal}>
            <div className={styles.stuHeader}>
              <i
                className={[styles.iconfont, styles.closeIcon].join(" ")}
                onClick={this.visibleChange.bind(this)}
              >
                &#xe6a9;
              </i>
              <span className={styles.stuTitle}>{this.props.title}</span>
              <span></span>
            </div>

            <div className={styles.deadline} style={{ marginTop: "12px" }}>
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
                          switchClassesId == item.groupId
                            ? styles.blurClassNames
                            : "",
                        ].join(" ")}
                        onClick={() => this.switchClasses(index, item.groupId)}
                      >
                        <div>
                          <Checkbox
                            onChange={(e) =>
                              this.changeAllStuAndClass(e, item.groupId, index)
                            }
                            checked={this.state[`allStuChecked${index}`]}
                            indeterminate={
                              !this.state[`allStuChecked${index}`] &&
                              this.renderInder(index)
                            }
                          ></Checkbox>
                          <span className={styles.stuNameBox}>
                            {item.groupName}
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
                        this.changeAllStu(e, groupList[classIndex].groupId)
                      }
                      checked={
                        this.state[`allStuChecked${this.state.classIndex}`]
                      }
                    ></Checkbox>
                    {/* <span className="stuPhoto"></span> */}
                    <span className={styles.stuName}>
                      {trans("global.allStudents", "所有学生")}
                    </span>
                  </div>
                ) : null}

                <div className={styles.allStuNames}>
                  {groupList &&
                    groupList[classIndex] &&
                    groupList[classIndex].studentInfoResponseList &&
                    groupList[classIndex].studentInfoResponseList.length &&
                    groupList[classIndex].studentInfoResponseList.map(
                      (item) => {
                        let br = false;
                        return (
                          <div className={styles.stuNames}>
                            {br ? null : (
                              <Checkbox
                                onChange={(e) =>
                                  this.changeStu(e, item.studentId)
                                }
                                checked={
                                  active === 1
                                    ? this.state[`stuChecked${item.studentId}`]
                                    : this.renderIfCheck(
                                        active == 2 ? true : false,
                                        active == 3 ? true : false,
                                        item.sendStudent,
                                        item.sendParent,
                                        this.state[
                                          `stuChecked${item.studentId}`
                                        ],
                                      )
                                }
                                disabled={
                                  active === 1
                                    ? false
                                    : this.renderIfCheck(
                                        active == 2 ? true : false,
                                        active == 3 ? true : false,
                                        item.sendStudent,
                                        item.sendParent,
                                        false,
                                      )
                                }
                              >
                                <span className={styles.stuName}>
                                  {item.name}
                                </span>
                              </Checkbox>
                            )}

                            {/* <span className="stuPhoto"></span> */}
                          </div>
                        );
                      },
                    )}
                </div>
              </div>
            </div>
            {/* {active == 2 ? (
              <div className={styles.clickLook} id="clickLook">
                <div>
                  <span className={styles.colTitle}>发送对象<span className={styles.colMessage}>*</span></span>
                  <Checkbox
                  onChange={this.changeStuCheck.bind(this)}
                  checked={stuCheck}
                  >学生本人</Checkbox>
                  <Popover content={trans('global.sendStuMessage', '发送后会通过云谷课堂站内消息提醒学生查看')}>
                  <i
                    className={styles.iconfont}
                    style={{
                      fontSize: "14px",
                      marginRight: "20px",
                      cursor: "pointer",
                    }}
                  >
                    &#xe82b;
                  </i>
                  </Popover>
                  <Checkbox
                  onChange={this.changeParent.bind(this)}
                  checked={parentCheck}
                  >学生家长</Checkbox>
                  <Popover content={trans('global.sendParentMessage', '发送后会通过钉钉消息提醒学生家长查看')}>
                  <i
                    className={styles.iconfont}
                    style={{
                      fontSize: "14px",
                      marginRight: "7px",
                      cursor: "pointer",
                    }}
                  >
                    &#xe82b;
                  </i>
                  </Popover>
                </div>

              </div>
            ) : null} */}
            <div className={styles.stufooter}>
              <div>
                {/* {this.props.ifDeadLine ? (
                  publishType == "0" ? (
                    <Popover
                      content={
                        <div className={styles.timePopver}>
                          <p className={styles.sendingTime}>
                            {trans("global.sendingTime", "发送时间")}
                          </p>
                          <p>
                            <span style={{ marginRight: 8 }}>
                              <DatePicker
                                onChange={this.onChangeDeadlineDataTiming.bind(
                                  this
                                )}
                                format={format2}
                                defaultValue={moment(dataLineTiming, format2)}
                                size="large"
                                className="stuPicker"
                              />
                            </span>
                            <TimePicker
                              defaultValue={moment(dataTimeTiming, format1)}
                              onChange={this.onChangeDeadlineTimeTiming.bind(
                                this
                              )}
                              format={format1}
                              size="large"
                              className="stuPicker"
                            />
                          </p>
                          <p className="timeBtn">
                            <span
                              className="timeancle"
                              onClick={this.clickTimeancle.bind(this)}
                            >
                              {trans("global.cancle", "取消")}
                            </span>
                            <span
                              className="timeSure"
                              onClick={this.clickTimeSure.bind(this)}
                            >
                              {trans("global.sure", "确定")}
                            </span>
                          </p>
                        </div>
                      }
                      trigger="click"
                      placement="topLeft"
                      visible={visSetTiming}
                      onVisibleChange={this.handleVisibleChange.bind(this)}
                    >
                      <span className="setTiming">
                        <i className="iconfont" style={{ marginRight: 3 }}>
                          &#xe740;
                        </i>
                        <span onClick={this.handleVisibleChange.bind(this)}>
                          {trans("global.setTiming", "设置定时发送")}
                        </span>
                      </span>
                    </Popover>
                  ) : publishType == "1" ? (
                    <div className="setTiming1">
                      <i
                        className="iconfont"
                        style={{ marginRight: 3, color: "#000" }}
                      >
                        &#xe740;
                      </i>
                      <span>
                        {dataLineTiming} {dataTimeTiming}
                      </span>
                      <span
                        className="clearTiming"
                        onClick={() => this.setState({ publishType: "0" })}
                      >
                        {trans("global.clearTiming", "清除定时")}
                      </span>
                    </div>
                  ) : null
                ) : null} */}
              </div>
              <div>
                <span
                  className={styles.footerButton}
                  onClick={() => this.visibleChange()}
                >
                  {trans("global.cancle", "取消")}
                </span>
                <span
                  className={[styles.footerButton, styles.sureButton].join(" ")}
                  onClick={this.sure}
                >
                  {this.props.publishText}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

// export default connect(({ home }) => ({}))(NewNoticeq);

// export default injectIntl(NewNotice);

// const getDivDom = (dom)=> {
//   if(!dom.dataset.link){
//     return getDivDom(dom.parentNode);
//   } else {
//     return dom;
//   }
// }

export default NewNoticeq;

// import "../../utils/globals.less";
import React, { Component } from "react";
import { Checkbox, Input, Modal, Select, Spin, Table } from "antd";
import { connect } from "dva";

import noStu from "../../assets/noStu.svg";
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
@connect(({ home, global }) => ({
  absentAdminInfoList: global.absentAdminInfoList,
  groupList: global.absentInfoList,
}))
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
      isKey: 1,
      disabledStuList: [],
    };
    this.isSure = false;
  }
  componentDidMount() {
    // console.log("1234");
    this.props.onRef(this);
    this.props.dispatch({
      type: "global/getAbsentAdminInfoList",
      payload: {
        examId: this.props.examId,
      },
    });
  }
  componentDidUpdate(properties, nextProperties) {
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
        groupList[this.state.classIndex].studentAbsentModelList &&
        groupList[this.state.classIndex].studentAbsentModelList.length &&
        groupList[this.state.classIndex].studentAbsentModelList.map((item) => {
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
        groupList[this.state.classIndex].studentAbsentModelList.length == index
      ) {
        state[`allStuChecked${this.state.classIndex}`] = true;
      }
      groupList &&
        groupList.length &&
        groupList.map((item) => {
          number_ += item.studentAbsentModelList.length;
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
    if (!this.isSure) {
      this.isSure = true;
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
      this.props
        .dispatch({
          type: "global/postAbsentManage",
          payload: {
            examId: this.props.examId,
            studentIdList: [
              ...this.state.stuIdList,
              ...this.state.disabledStuList,
            ],
          },
        })
        .then(() => {
          this.setState({
            stuIdList: [],
          });
          this.props.sureStu();
          this.isSure = false;
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
    let list = this.props.disabledStu
      ? JSON.parse(JSON.stringify(this.props.disabledStu))
      : [];
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentAbsentModelList.map((it) => {
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
        } else {
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
    if (number_ === this.props.groupList[index].studentAbsentModelList.length) {
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
      this.props.groupList[index].studentAbsentModelList.map((it) => {
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
        } else {
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
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentAbsentModelList.map((it) => {
        if (this.state.stuIdList && this.state.stuIdList.length > 0) {
          this.state.stuIdList.map((index_) => {
            if (index_.studentId === it.studentId) {
              number_ = true;
            } else {
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
    if (this.props.groupList && this.props.groupList.length > 0) {
      this.props.groupList.map((item) => {
        item.studentAbsentModelList.map((it) => {
          if (this.state.stuIdList && this.state.stuIdList.length > 0) {
            this.state.stuIdList.map((index) => {
              if (index.studentId === it.studentId) {
                number_ = true;
              } else {
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
    this.props.dispatch({
      type: "global/getAbsentInfoList",
      payload: {
        examId: this.props.examId,
        studentName: e,
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
        number_ += it.studentAbsentModelList.length;
        it.studentAbsentModelList.map((ite) => {
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
      groupList[ind].studentAbsentModelList &&
      groupList[ind].studentAbsentModelList.length &&
      groupList[ind].studentAbsentModelList.map((item, index) => {
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
        number_ += it.studentAbsentModelList.length;
      });
    groupList &&
      groupList[this.state.classIndex] &&
      groupList[this.state.classIndex].studentAbsentModelList &&
      groupList[this.state.classIndex].studentAbsentModelList.length &&
      groupList[this.state.classIndex].studentAbsentModelList.map(
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
        item.studentAbsentModelList.length &&
          item.studentAbsentModelList.map((it) => {
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
  clickdelete = (id) => {
    console.log(id, "qqq");
  };
  sorterChange = (pagination, filters, sorter) => {
    console.log(sorter.order, "qqq");
    let sort = null;
    if (sorter.order == "ascend") {
      sort = true;
    } else if (sorter.order == "descend") {
      sort = false;
    } else {
      sort = null;
    }
    this.props.dispatch({
      type: "global/getAbsentAdminInfoList",
      payload: {
        examId: this.props.examId,
        sort: sort,
      },
    });
  };
  clickAddStu = () => {
    this.setState(
      {
        isKey: 2,
      },
      () => {
        this.props
          .dispatch({
            type: "global/getAbsentInfoList",
            payload: {
              examId: this.props.examId,
            },
          })
          .then(() => {
            const { groupList } = this.props;
            let array = [];
            groupList.length > 0 &&
              groupList.map((item) => {
                item.studentAbsentModelList.length > 0 &&
                  item.studentAbsentModelList.map((it) => {
                    if (it.absent) {
                      array.push({
                        groupId: item.groupId,
                        studentId: it.studentId,
                      });
                    }
                  });
              });
            this.setState({
              disabledStuList: array,
            });
          });
      },
    );
  };
  cancleStu = () => {
    this.setState({
      isKey: 1,
    });
  };
  render() {
    const {
      allGroupsChecked,
      switchClassesId,
      stuName,
      classIndex,
      isKey,
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
    const { groupList, disabledStu, absentAdminInfoList } = this.props;
    console.log(disabledStu, "qqq");
    let number1 = this.state.stuIdList.length || 0;
    let number2 = disabledStu.length || 0;
    const text = (
      <span>
        <img src={tishi} style={{ width: "100%" }} />
      </span>
    );
    let newColumns = [
      {
        title: trans("global.order", "序号"),
        dataIndex: "serialNumber",
        key: "serialNumber",
        width: 120,
        // fixed: "left",
      },
      {
        title: trans("global.fullName", "姓名"),
        dataIndex: "studentName",
        key: "studentName",
        width: 160,
      },
      {
        title: trans("global.group", "班级"),
        dataIndex: "groupName",
        key: "groupName",
        sorter: true,
        width: 210,
      },
      // {
      //   title: trans("global.option", "操作"),
      //   dataIndex: "studentId",
      //   key: "studentId",
      //   width: 160,
      //   render: (text, record) => {
      //     return (
      //       <div>
      //         <div
      //           className={styles.importMessage}
      //           onClick={() => this.clickdelete(text)}
      //         >
      //           {trans("global.delete", "删除")}
      //         </div>
      //       </div>
      //     );
      //   },
      // },
    ];
    let columns = newColumns;

    return (
      <div className={styles.studentSelect} id="studentSelect">
        <Modal
          footer={null}
          closable={false}
          bodyStyle={{ padding: 0 }}
          visible={this.props.visible}
          // getContainer={document.getElementById("studentSelect")}
          width={710}
          className={styles.studentSelectBox}
          getContainer={false}
          destroyOnClose={true}
        >
          <Spin size="large" spinning={this.isSure}>
            {isKey == 1 ? (
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
                {absentAdminInfoList && absentAdminInfoList.length > 0 ? (
                  <div className={styles.stuTabBox}>
                    <div className={styles.addAbsentStudentsBox}>
                      <span
                        className={styles.addAbsentStudents}
                        onClick={this.clickAddStu}
                      >
                        {trans("global.addAbsentStudents", "添加缺考学生")}
                      </span>
                    </div>

                    <div className={styles.tabBox}>
                      <Table
                        dataSource={absentAdminInfoList}
                        pagination={false}
                        scroll={{ x: 650, y: 450 }}
                        columns={columns}
                        onChange={this.sorterChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className={styles.stuTabBox}>
                    <div className={styles.addAbsentStudentsBox}>
                      <div className={styles.noStuBox}>
                        <img className={styles.noStu} src={noStu}></img>
                        <span className={styles.noAbsentStudent}>
                          {trans("global.noAbsentStudent", "暂无缺考学生")}
                        </span>
                        <span
                          className={styles.addAbsentStudents1}
                          onClick={this.clickAddStu}
                        >
                          {trans("global.addAbsentStudents", "添加缺考学生")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
                              (
                              {this.state.stuIdList.length + disabledStu.length}
                              )
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
                            onClick={() =>
                              this.switchClasses(index, item.groupId)
                            }
                          >
                            <div>
                              <Checkbox
                                onChange={(e) =>
                                  this.changeAllStuAndClass(
                                    e,
                                    item.groupId,
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
                        groupList[classIndex].studentAbsentModelList &&
                        groupList[classIndex].studentAbsentModelList.length &&
                        groupList[classIndex].studentAbsentModelList.map(
                          (item) => {
                            let br = false;
                            return (
                              <div className={styles.stuNames}>
                                {disabledStu &&
                                  disabledStu.length > 0 &&
                                  disabledStu.map((it) => {
                                    if (it.studentId == item.studentId) {
                                      br = true;
                                      return (
                                        <Checkbox
                                          // onChange={(e) =>
                                          //   this.changeStu(e, item.studentId)
                                          // }
                                          // checked={
                                          //   this.state[`stuChecked${item.studentId}`]
                                          // }
                                          defaultChecked
                                          disabled
                                        >
                                          <span className={styles.stuName}>
                                            {item.name}
                                          </span>
                                        </Checkbox>
                                      );
                                    }
                                  })}
                                {br ? null : (
                                  <Checkbox
                                    onChange={(e) =>
                                      this.changeStu(e, item.studentId)
                                    }
                                    checked={
                                      item.absent
                                        ? true
                                        : this.state[
                                            `stuChecked${item.studentId}`
                                          ]
                                    }
                                    disabled={item.absent ? true : false}
                                  >
                                    <span className={styles.stuName}>
                                      {item.studentName}
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
                <div className={styles.stufooter}>
                  <div></div>
                  <div>
                    <span
                      className={styles.footerButton}
                      onClick={this.cancleStu}
                    >
                      {trans("global.cancle", "取消")}
                    </span>
                    <span
                      className={[styles.footerButton, styles.sureButton].join(
                        " ",
                      )}
                      onClick={this.sure}
                    >
                      {this.props.publishText}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Spin>
        </Modal>
      </div>
    );
  }
}

// export default injectIntl(NewNotice);

// const getDivDom = (dom)=> {
//   if(!dom.dataset.link){
//     return getDivDom(dom.parentNode);
//   } else {
//     return dom;
//   }
// }

export default NewNoticeq;

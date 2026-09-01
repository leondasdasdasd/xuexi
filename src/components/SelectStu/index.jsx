// 类组件
import React from "react";
import { Checkbox, DatePicker, Input, TimePicker } from "antd";
import moment from "moment";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";
const { Search } = Input;
class SelectStu extends React.Component {
  constructor(properties) {
    super(properties);
    let defaultSwitchClassesId;

    // const { groupList } = props
    // if (groupList && groupList.length) {
    //     if (groupList[0].studentList.length) {
    //         defaultSwitchClassesId = groupList[0].studentList.groupCourseId
    //     }
    // }
    this.state = {
      day: "",
      time: "",
      stuName: "",
      classIndex: 0,
      switchClassesId: "",
      allStatus: "",
    };
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, previousState) {
    let backObject = {};
    if (nextProperties.deadTime) {
      const [day, time] = nextProperties.deadTime.split(" ");
      backObject.day = day;
      backObject.time = time;
      backObject.disabledStu = nextProperties.disabledStu;
      backObject.groupList = nextProperties.groupList;
    }
    console.log("nextProps", nextProperties, ",prevState", previousState);
    console.log(
      "prevState.disabledStu === nextProps.disabledStu",
      previousState.disabledStu == nextProperties.disabledStu,
    );
    console.log(
      "prevState.groupList === nextProps.groupList",
      previousState.groupList == nextProperties.groupList,
    );
    if (
      (nextProperties.disabledStu !== previousState.disabledStu ||
        nextProperties.groupList !== previousState.groupList) &&
      nextProperties.disabledStu &&
      nextProperties.groupList
    ) {
      console.log("学生数据或者禁用学生发生了改变");
      let list = nextProperties.disabledStu
        ? JSON.parse(JSON.stringify(nextProperties.disabledStu))
        : [];
      if (nextProperties.groupList[0]) {
        backObject.switchClassesId = nextProperties.groupList[0]?.groupCourseId;
        backObject.classIndex = 0;
      }
      nextProperties.groupList.map((item) => {
        let number_ = 0;
        item.studentList.map((it) => {
          if (list && list.length > 0) {
            list.map((ite, ind) => {
              if (ite.id === it.id) {
                number_ += 1;
                list.splice(ind, 1);
              }
            });
          }
          nextProperties.stuIdList.map((index) => {
            if (index.id === it.id) {
              number_ += 1;
              backObject[`stuChecked${index.id}`] = true;
            }
          });
        });

        if (number_ === item.studentList.length) {
          backObject[`allStuChecked${item.groupCourseId}`] = "checked";
        } else if (number_ === 0) {
          backObject[`allStuChecked${item.groupCourseId}`] = null;
        } else {
          backObject[`allStuChecked${item.groupCourseId}`] = "indeterminate";
        }
      });

      const { groupList, disabledStu } = nextProperties;
      // 所有学生
      let number2 = 0;
      groupList.map((item) => {
        number2 += item.studentList.length;
      });
      let someList = [...disabledStu];
      if (someList.length === 0) {
        backObject.allStatus = null;
      } else if (someList.length < number2) {
        backObject.allStatus = "indeterminate";
      } else if (someList.length === number2) {
        backObject.allStatus = "checked";
      } else {
        backObject.allStatus = null;
      }
    }
    return backObject;
  }

  componentDidUpdate(properties, nextProperties) {}
  componentDidMount() {
    console.log("创建了");
    // if (this.props.groupList && this.props.groupList.length) {
    //     let list = this.props.disabledStu ? JSON.parse(JSON.stringify(this.props.disabledStu)) : []
    //     let obj = {}
    //     obj.switchClassesId = this.props.groupList[0].groupCourseId
    //     this.props.groupList.map(item => {
    //         let num = 0;
    //         item.studentList.map(it => {
    //             if (list && list.length) {
    //                 list.map((ite, ind) => {
    //                     if (ite.id === it.id) {
    //                         num += 1
    //                         list.splice(ind, 1);
    //                     }
    //                 })
    //             }
    //         })
    //         if (num === item.studentList.length) {
    //             obj[`allStuChecked${item.groupCourseId}`] = 'checked'
    //         } else if (num === 0) {
    //             obj[`allStuChecked${item.groupCourseId}`] = null
    //         } else {
    //             obj[`allStuChecked${item.groupCourseId}`] = 'indeterminate'
    //         }
    //     })

    //     if (this.allCheckedStatus([]) === 'checked') {
    //         obj.allStatus = 'checked'
    //     } else if (this.allCheckedStatus([]) === 'indeterminate') {
    //         obj.allStatus = 'indeterminate'
    //     } else {
    //         obj.allStatus = null
    //     }

    //     this.setState({
    //         ...obj
    //     })
    // }
  }

  changeDate = (date, dateString) => {
    console.log(dateString, "dateString");
    const { day, time } = this.state;
    this.setState(
      {
        day: dateString,
      },
      () => {
        this.props.deadTimeChange(`${dateString} ${time}`);
      },
    );
  };

  changeTime = (date, dateString) => {
    const { day, time } = this.state;
    this.setState(
      {
        time: dateString,
      },
      () => {
        this.props.deadTimeChange(`${day} ${dateString}`);
      },
    );
  };
  searchStuName = (e) => {
    this.props.onSearchStuName(this.state.stuName);
  };

  changeStuName = (e) => {
    this.props.onChangeStuName(e.target.value);
    this.setState({
      stuName: e.target.value,
    });
  };

  // 点击切换班级
  switchClasses = (index, id) => {
    this.setState({
      classIndex: index,
      switchClassesId: id,
    });
  };

  changeAllStuAndClass = (e, id, ind) => {
    const { groupList, disabledStu } = this.props;
    let array = this.props.stuIdList || [];
    let state = Object.assign({}, this.state);

    // 如果当前在A班，我点击了B班的全选按钮，手动切换到B班
    state["classIndex"] = ind;
    state["switchClassesId"] = id;

    if (e.target.checked) {
      state[`allStuChecked${id}`] = `checked`;

      groupList &&
        groupList[ind] &&
        groupList[ind].studentList &&
        groupList[ind].studentList.length &&
        groupList[ind].studentList.map((item, index) => {
          let disabledInclude;
          let stuIdsInclude;
          // 在禁用列表中存在
          if (this.props.disabledStu && this.props.disabledStu.length > 0) {
            disabledInclude = this.props.disabledStu.some((ite) => {
              return ite.id === item.id;
            });
          }
          // 在已选列表中存在
          stuIdsInclude = array.some((ite) => {
            return ite.id === item.id;
          });
          console.log(disabledInclude, stuIdsInclude, "22");
          if (!disabledInclude && !stuIdsInclude) {
            state[`stuChecked${item.id}`] = true;
            array.push({
              groupId: groupList[ind].groupCourseId,
              id: item.id,
            });
          }
        });
    } else {
      let disabledInclude = [];
      let stuIdsInclude = [];
      groupList &&
        groupList[ind] &&
        groupList[ind].studentList &&
        groupList[ind].studentList.length &&
        groupList[ind].studentList.map((item, index) => {
          state[`stuChecked${item.id}`] = false;
          array.map((object, index) => {
            if (object.id == item.id) {
              state[`stuChecked${item.id}`] = false;
              stuIdsInclude.push(item);
              array.splice(index, 1);
            }
          });
          // 在禁用列表中存在
          if (this.props.disabledStu && this.props.disabledStu.length > 0) {
            this.props.disabledStu.map((ite) => {
              if (ite.id === item.id) {
                disabledInclude.push(item);
              }
            });
          }
        });
      if (disabledInclude.length === groupList[ind].studentList.length) {
        // 当前年级下的学生全在部在禁用列表中存在
        state[`allStuChecked${id}`] = "checked";
      } else if (stuIdsInclude.length === groupList[ind].studentList.length) {
        // 当前年级下的学生全部可以取消掉
        state[`allStuChecked${id}`] = null;
      } else if (disabledInclude.length > 0) {
        // 当前年级下存在禁用学生
        state[`allStuChecked${id}`] = "indeterminate";
      } else {
        state[`allStuChecked${id}`] = null;
      }
    }
    if (this.allCheckedStatus(array) === "checked") {
      state.allStatus = "checked";
    } else if (this.allCheckedStatus(array) === "indeterminate") {
      state.allStatus = "indeterminate";
    } else {
      state.allStatus = null;
    }
    this.setState({
      ...state,
    });
    this.props.onSelectChange(array);
  };

  renderNum = (index) => {
    let number_ = 0;
    let list = this.props.disabledStu
      ? JSON.parse(JSON.stringify(this.props.disabledStu))
      : [];
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentList.map((it) => {
        if (this.props.stuIdList && this.props.stuIdList.length > 0) {
          this.props.stuIdList.map((index_) => {
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
    return number_ === 0 ? null : number_;
  };

  // 告诉我你当前选中了哪些学生，我就能告诉你当前年级下的学生是否全部选中
  checkedStatus = (stuIdList) => {
    const { groupList, disabledStu } = this.props;

    const cuurentGroupStudens =
      groupList[this.state.classIndex].studentList || [];
    console.log(cuurentGroupStudens, "cuurentGroupStudens");
    // 当前年级禁用的学生
    let cuurentGroupDisBleList = [];
    console.log("disabledStu-------", disabledStu);
    // return
    cuurentGroupStudens.map((item) => {
      if (disabledStu) {
        disabledStu?.map((item1) => {
          if (item.id === item1.id) {
            cuurentGroupDisBleList.push(item);
          }
        });
      }
    });

    // 当前年级选中的学生
    let cuurentGroupCheckList = [];
    cuurentGroupStudens.map((item) => {
      stuIdList.map((item1) => {
        if (item.id === item1.id) {
          cuurentGroupCheckList.push(item);
        }
      });
    });
    let number_ = cuurentGroupCheckList.length + cuurentGroupDisBleList.length;
    if (!number_) {
      return "";
    } else if (number_ < cuurentGroupStudens.length) {
      return "indeterminate";
    } else {
      return "checked";
    }
  };

  allCheckedStatus = (stuIdList) => {
    const { groupList, disabledStu } = this.props;
    // 所有学生
    let number2 = 0;
    groupList.map((item) => {
      number2 += item.studentList.length;
    });

    //禁用的学生加上选中的学生
    let someList = [...stuIdList, ...disabledStu];
    if (someList.length === 0) {
      return null;
    } else if (someList.length < number2) {
      return "indeterminate";
    } else if (someList.length === number2) {
      return "checked";
    } else {
      return null;
    }
  };

  //学生
  changeStu = (e, id) => {
    let array = this.props.stuIdList || [];
    const { groupList } = this.props;

    let state = {};
    state[`stuChecked${id}`] = e.target.checked;
    if (e.target.checked) {
      let result = array.find((item) => item.id == id);
      if (!result) {
        array.push({
          groupId: groupList[this.state.classIndex].groupCourseId,
          id: id,
        });
      }
    } else {
      array = array.filter((item) => {
        return item.id !== id;
      });
    }

    if (this.checkedStatus(array) === "checked") {
      state[`allStuChecked${this.state.switchClassesId}`] = "checked";
    } else if (this.checkedStatus(array) === "indeterminate") {
      state[`allStuChecked${this.state.switchClassesId}`] = "indeterminate";
    } else {
      state[`allStuChecked${this.state.switchClassesId}`] = null;
    }
    if (this.allCheckedStatus(array) === "checked") {
      state.allStatus = "checked";
    } else if (this.allCheckedStatus(array) === "indeterminate") {
      state.allStatus = "indeterminate";
    } else {
      state.allStatus = null;
    }
    this.setState({
      ...state,
    });
    this.props.onSelectChange(array);
  };

  changeAllGroups = (e) => {
    const { groupList } = this.props;
    let array = this.props.stuIdList || [];

    let state = {};
    if (e.target.checked) {
      this.setState({
        allStatus: "checked",
      });

      groupList &&
        groupList.length &&
        groupList.map((item, ind) => {
          state[`allStuChecked${item.groupCourseId}`] = `checked`;
          item.studentList.map((item1, index) => {
            let disabledInclude;
            let stuIdsInclude;
            // 在禁用列表中存在
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              disabledInclude = this.props.disabledStu.some((ite) => {
                return ite.id === item1.id;
              });
            }
            // 在已选列表中存在
            stuIdsInclude = array.some((ite) => {
              return ite.id === item1.id;
            });
            console.log(disabledInclude, stuIdsInclude, "22");
            if (!disabledInclude && !stuIdsInclude) {
              state[`stuChecked${item1.id}`] = true;
              array.push({
                groupId: groupList[ind].groupCourseId,
                id: item1.id,
              });
            }
          });
        });
      this.props.onSelectChange(array);
    } else {
      groupList &&
        groupList.length &&
        groupList.map((item, ind) => {
          let disabledInclude = [];
          let stuIdsInclude = [];
          item.studentList.map((item1, index) => {
            // 在已选列表中存在
            state[`stuChecked${item1.id}`] = false;
            array.map((object, index) => {
              if (object.id == item.id) {
                state[`stuChecked${item.id}`] = false;
                stuIdsInclude.push(item);
                array.splice(index, 1);
              }
            });
            // 在禁用列表中存在
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (ite.id === item1.id) {
                  disabledInclude.push(item1);
                }
              });
            }
          });
          if (disabledInclude.length === groupList[ind].studentList.length) {
            state[`allStuChecked${item.groupCourseId}`] = "checked";
          } else if (
            stuIdsInclude.length === groupList[ind].studentList.length
          ) {
            state[`allStuChecked${item.groupCourseId}`] = null;
          } else if (disabledInclude.length > 0) {
            state[`allStuChecked${item.groupCourseId}`] = "indeterminate";
          } else {
            state[`allStuChecked${item.groupCourseId}`] = null;
          }
        });
      if (this.allCheckedStatus([]) === "checked") {
        state.allStatus = "checked";
      } else if (this.allCheckedStatus([]) === "indeterminate") {
        state.allStatus = "indeterminate";
      } else {
        state.allStatus = null;
      }
      this.props.onSelectChange([]);
    }
    this.setState({
      ...state,
    });
  };

  render() {
    const { groupList, style, disabledStu, stuIdList } = this.props;
    const {
      stuName,
      allGroupsChecked,
      classIndex,
      switchClassesId,
      day,
      time,
      allStatus,
    } = this.state;

    let number1 = stuIdList.length || 0;
    let number2 = disabledStu.length || 0;

    return (
      <div className={styles.selectStu} style={style}>
        <div className={styles.deadline} style={{ marginBottom: 15 }}>
          <span className={styles.radioTitleStu}>
            {trans("global.deadline", "截止时间")}
          </span>
          <div style={{ marginRight: 8, width: "130px" }}>
            <DatePicker
              onChange={this.changeDate}
              format="YYYY-MM-DD"
              defaultValue={day ? moment(day, "YYYY-MM-DD") : null}
            />
          </div>
          <div style={{ marginRight: 8, width: "80px" }}>
            <TimePicker
              defaultValue={time ? moment(time, "HH:mm") : null}
              onChange={this.changeTime}
              format="HH:mm"
            />
          </div>

          <div style={{ flexGrow: 1 }}>
            <Search
              placeholder={trans(
                "global.studentSearch",
                "请输入学生姓名/学号进行搜索",
              )}
              onSearch={this.searchStuName}
              onChange={this.changeStuName}
              value={stuName}
            />
          </div>
        </div>
        <div className={styles.allCaS}>
          <div className={styles.allClass}>
            <div className={styles.allGroups}>
              <Checkbox
                onChange={this.changeAllGroups}
                checked={allStatus === "checked"}
                indeterminate={allStatus === "indeterminate"}
              >
                <span className={styles.allGroupCheck}>
                  {trans("global.allGroups", "所有组")}
                  {number1 + number2 > 0 ? (
                    <span style={{ marginLeft: "8px" }}>
                      ( {this.props.stuIdList.length + disabledStu.length} )
                    </span>
                  ) : null}
                </span>
              </Checkbox>
            </div>
            <div className={styles.classNamesBox}>
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
                        checked={
                          this.state[`allStuChecked${item.groupCourseId}`] ===
                          "checked"
                        }
                        indeterminate={
                          this.state[`allStuChecked${item.groupCourseId}`] ===
                          "indeterminate"
                        }
                      ></Checkbox>
                      <span className={styles.stuNameBox}>
                        {item.studentGroupName}&nbsp;{this.renderNum(index)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className={styles.allStu}>
            <div className={styles.stuNames}>
              <Checkbox
                onChange={(e) =>
                  this.changeAllStuAndClass(
                    e,
                    this.state.switchClassesId,
                    this.state.classIndex,
                  )
                }
                //所有学生的checked状态，判断当前班级id是否已经全选，如果全选择默认选中
                checked={
                  this.state[`allStuChecked${this.state.switchClassesId}`] ===
                  "checked"
                }
                indeterminate={
                  this.state[`allStuChecked${this.state.switchClassesId}`] ===
                  "indeterminate"
                }
              ></Checkbox>
              <span className={styles.stuName}>
                {trans("global.allStudents", "所有学生")}
              </span>
            </div>

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
                              <Checkbox defaultChecked disabled></Checkbox>
                            );
                          }
                        })}
                      {br ? null : (
                        <Checkbox
                          onChange={(e) => this.changeStu(e, item.id)}
                          checked={this.state[`stuChecked${item.id}`]}
                        ></Checkbox>
                      )}
                      <span className={styles.stuName}>{item.name}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SelectStu;

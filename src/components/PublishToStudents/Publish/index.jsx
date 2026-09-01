//发布给学生
import React, { PureComponent } from "react";
import {
  DatePicker,
  Form,
  Icon,
  Input,
  message,
  Modal,
  Popover,
  Select,
  TreeSelect,
} from "antd";
import { Checkbox } from "antd-mobile";
import { connect } from "dva";
import moment from "moment";

import { trans } from "../../../utils/i18n";
import Student from "../Student/index.jsx";

import icon from "../../../icon.module.less";
import styles from "./index.module.less";

const FormItem = Form.Item;
const CheckboxItem = Checkbox.AgreeItem;
const Option = Select.Option;
const { TextArea } = Input;
const submitType = {
  0: trans("create.releaseNow", "立即发布"),
  1: trans("create.releaseTiming", "定时发布"),
};
@Form.create()
@connect((state) => ({
  allTeachersData: state.publishToStudent.allTeachersData,
  groupList: state.publishToStudent.groupList,
  studentList: state.publishToStudent.studentList,
  taskPublishLearn: state.publishToStudent.taskPublishLearn,
}))
class Publish extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      allTeachersData: [],
      groupList: [],
      teacherList: [], //默认选中老师
      ifTiming: "0",
      showifTimingModal: false,
      popVisiblle: false,
      deadTime: moment().format("YYYY-MM-DD 22:00", "YYYY-MM-DD HH:mm"), //截止时间
      dateTimeValue: moment().format("YYYY-MM-DD 17:00", "YYYY-MM-DD HH:mm"), //发布时间
      chooseStatus: false,
    };
    this.ifDispatch = true;
  }

  componentDidMount() {
    this.getAllTeachers();
    this.getBaseAll("", true);
  }

  getAllTeachers = () => {
    this.props
      .dispatch({
        type: "publishToStudent/getAllTeachers",
        payload: {},
      })
      .then(() => {
        const { allTeachersData } = this.props;
        this.setState({
          allTeachersData: [...allTeachersData],
        });
      });
  };

  getBaseAll = (value, type) => {
    const { courseId, unitId, activityId } = this.props;
    this.props
      .dispatch({
        type: "publishToStudent/getGroupList",
        payload: {
          courseId: courseId,
          unitId: unitId,
          activityId: activityId,
          matchName: value,
        },
      })
      .then(() => {
        const { groupList } = this.props;
        this.setState({
          groupList: [...groupList],
        });
        if (type) {
          this.getDefaultTeachers(groupList);
        }
      });
  };

  //获取默认选中老师
  getDefaultTeachers = (groupList) => {
    let array = [];
    let newArray = [];
    groupList &&
      groupList.length &&
      groupList.map((item) => {
        if (item.teacherList && item.teacherList.length > 0) {
          item.teacherList.map((element) => {
            if (element.isCurrentTeacher) {
              array.push(element);
            }
          });
        }
      });
    array &&
      array.length &&
      array.map((element) => {
        newArray.push({
          key: element.teacherId,
          value: element.teacherId,
          title: element.name,
        });
      });
    this.setState({
      teacherList: this.arrayNorepeat(newArray),
    });
  };

  multiSelectOnSearch = (keyWord) => {
    if (this.timeId) {
      clearTimeout(this.timeId);
    }
    this.timeId = setTimeout(() => {
      this.getBaseAll(keyWord, false);
      this.timeId = false;
    }, 500);
  };

  multiSelectOnChange = (selectValue) => {
    const { dispatch } = this.props;
    dispatch({
      type: "publishToStudent/update",
      payload: { selectValue: selectValue },
    });
    this.props.form.setFieldsValue({ studentList: selectValue });
  };

  //按班级处理选择学生
  dealWithData = (data, type) => {
    let c = [];
    let d = {};
    if (type && type == 2) {
      for (const item of data) {
        if (item.studentList && item.studentList.length > 0) {
          c = c.concat(item.studentList);
        }
      }
    } else {
      for (const element of data) {
        if (d[element.groupId]) {
          for (const ele of c) {
            if (ele.groupId == element.groupId) {
              ele.studentList.push({
                groupId: element.groupId,
                id: element.id,
              });
            }
          }
        } else {
          c.push({
            groupId: element.groupId,
            studentList: [{ groupId: element.groupId, id: element.id }],
          });
          d[element.groupId] = element;
        }
      }
    }
    return c;
  };

  cancel = () => {
    this.props.handleCancel();
  };

  sendTimeChange = (value) => {
    this.setState({
      ifTiming: value,
    });
    this.props.form.setFieldsValue({
      ifTiming: value,
    });
    this.visibleChange();
  };

  submitResultbtn() {
    this.setState({
      showifTimingModal: true,
    });
  }

  //获得当天的年月日
  getCurrentDay() {
    let y, m, day;
    y = new Date().getFullYear();
    m =
      new Date().getMonth() + 1 < 10
        ? "0" + (new Date().getMonth() + 1)
        : new Date().getMonth() + 1;
    day =
      new Date().getDate() < 10
        ? "0" + new Date().getDate()
        : new Date().getDate();
    return y + "-" + m + "-" + day;
  }

  visibleChange = () => {
    this.setState({
      popVisiblle: !this.state.popVisiblle,
    });
  };

  dateChange(date, dateString) {
    this.setState({
      dateTimeValue: dateString,
    });
  }
  deadDateChange = (date, dateString) => {
    this.setState({
      deadTime: dateString,
    });
  };

  //数组对象的合并去重
  arrayNorepeat = (array) => {
    let object = {};
    array = array.reduce(function (item, next) {
      object[next.key] ? "" : (object[next.key] = true && item.push(next.key));
      return item;
    }, []);
    return array;
  };

  getBaseData = (groupList) => {
    let classList = [],
      studentList = [],
      teacherList = [],
      baseData = {};
    groupList &&
      groupList.length &&
      groupList.map((item) => {
        classList.push({
          unitId: item.unitId,
          id: item.groupCourseId,
          groupCourseStudentNumbers: item.groupCourseStudentNumbers,
          groupCourseTeacherNumbers: item.groupCourseTeacherNumbers,
          ename: item.studentGroupEnglishName,
          name: item.studentGroupName,
        });
        studentList.push(item.studentList);
        teacherList.push(item.teacherList);
      });
    baseData = {
      classList: [...classList],
      studentList: [...studentList],
      teacherList: [...teacherList],
    };
    return baseData;
  };

  submitResult = () => {
    let {
      dispatch,
      form,
      exampleId,
      testName,
      activityDesc,
      activityId,
      courseId,
      studentList,
    } = this.props;
    form.validateFieldsAndScroll((error, values) => {
      if (!error) {
        if (!this.ifDispatch) {
          return;
        }
        if (this.ifDispatch) {
          this.ifDispatch = false;
        }
        if (values.studentList && values.studentList.length === 0) {
          message.error(
            trans("create.studentPlaceholder", "请选择要分配的学生"),
          );
          this.ifDispatch = true;
          return false;
        }
        values["deadTime"] = moment(new Date(values["deadTime"])).format(
          "YYYY-MM-DD HH:mm:ss",
        );
        const deadTime = moment(new Date(values["deadTime"])).format("x");
        if (values["publishTime"]) {
          const publishTime = moment(new Date(values["publishTime"])).format(
            "x",
          );
          if (publishTime > deadTime) {
            message.error(
              trans("global.publishTimeMessage", "发布时间应小于截止时间"),
            );
            this.ifDispatch = true;
            return;
          }
        }
        values["publishTime"] &&
          (values["publishTime"] = moment(
            new Date(values["publishTime"]),
          ).format("YYYY-MM-DD HH:mm:ss"));
        let t = this.dealWithData(studentList);
        let groupIds = [];
        t.map((element) => {
          groupIds.push(element.groupId);
        });
        let payload = {
          activityId: activityId,
          groupIds: groupIds,
          title: testName,
          description: activityDesc,
          origin: 3,
          examPaperId: exampleId,
          courseId: courseId,
          teacherList: this.state.teacherList,
          distributionType: 1,
        };
        dispatch({
          type: "publishToStudent/create",
          payload: payload,
          onSuccess: (taskId) => {
            let resourceRequestList = [];
            resourceRequestList.push({
              listId: null,
              taskId: taskId,
              ifTiming: this.state.ifTiming,
              distributionType: 1,
              publishTime: this.state.dateTimeValue,
              deadTime: this.state.deadTime,
              studentList: this.dealWithData(t, 2),
              teacherList: this.state.teacherList,
              expectTime: null,
              examPaperId: exampleId,
              lessonId: activityId,
            });
            dispatch({
              type: "publishToStudent/release",
              payload: { resourceRequestList: [...resourceRequestList] },
              onSuccess: () => {
                this.setState({
                  showifTimingModal: false,
                  chooseStatus: true,
                });
              },
            }).then(() => {
              this.setState({
                showifTimingModal: false,
              });
            });
          },
          // onSuccess: (taskPublishLearn) => {
          //   let resourceRequestList = [];
          //   t.map(item => {
          //     taskPublishLearn.map(el => {
          //       if (item.groupId == el.groupId) {
          //         resourceRequestList.push({
          //           groupId: item.groupId,
          //           listId: el.learnListId,
          //           taskId: el.taskId,
          //           ifTiming: this.state.ifTiming,
          //           distributionType: 1,
          //           publishTime: this.state.dateTimeValue,
          //           deadTime: this.state.deadTime,
          //           studentList: item.studentList,
          //           teacherList: this.state.teacherList,
          //           expectTime: null,
          //           examPaperId: exampleId,
          //           lessonId: activityId
          //         })
          //       }
          //     })

          //   })
          //   dispatch({
          //     type: 'publishToStudent/release',
          //     payload: { resourceRequestList: [...resourceRequestList] },
          //     onSuccess: () => {
          //       this.setState({
          //         showifTimingModal: false,
          //         chooseStatus: true
          //       })
          //     }
          //   }).then(() => {
          //     this.setState({
          //       showifTimingModal: false
          //     })
          //   })
          // },
          onError: () => {
            this.setState({
              showifTimingModal: false,
            });
          },
        });
      }
    });
  };

  chooseTeacher = (value) => {
    this.setState({
      teacherList: value,
    });
  };

  returnMyTest = () => {
    this.props.returnMyTest();
  };

  view = () => {
    this.props.view();
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const { allTeachersData, groupList } = this.state;
    const { taskPublishId, studentList } = this.props;
    let initTeachers = this.state.teacherList;
    let baseAllData = this.getBaseData(groupList);
    let canDisabled = taskPublishId ? true : false;

    const popContent = (
      <div className={styles.timeBox}>
        <div onClick={this.sendTimeChange.bind(this, "0")}>
          {trans("create.releaseNow", "立即发布")}
        </div>
        <div onClick={this.sendTimeChange.bind(this, "1")}>
          {trans("create.releaseTiming", "定时发布")}
        </div>
      </div>
    );
    return (
      <div className={styles.publishContent}>
        <Form className={styles.formBox}>
          <div className={styles.tasktop}>
            <div className={styles.header}>
              <Icon
                type="close"
                className={styles.icon}
                onClick={this.cancel}
              />
              <div className={styles.headRight}>
                {this.state.ifTiming == 1 ? (
                  <span className={styles.publishTimeBox}>
                    {this.state.dateTimeValue}
                    {trans("create.release", "发布")}
                  </span>
                ) : null}
                <span
                  className={[
                    styles.deadTimeBox,
                    this.state.ifTiming == 1 ? styles.newBox : "",
                  ].join(" ")}
                >
                  {this.state.deadTime}
                  {trans("global.dead", "截止")}
                </span>
                <FormItem
                  className={[
                    styles.formItem,
                    styles.publishTime,
                    this.state.ifTiming && this.state.ifTiming == 1
                      ? styles.newBox
                      : "",
                  ].join(" ")}
                >
                  {getFieldDecorator("deadTime", {
                    rules: [
                      {
                        required: true,
                        message: trans("create.datePlaceholder", "请选择日期"),
                      },
                    ],
                    initialValue: moment(this.getCurrentDay() + " " + "22:00"),
                  })(
                    <DatePicker
                      format="YYYY-MM-DD HH:mm"
                      allowClear={false}
                      //showTime={{ defaultValue: moment("22:00", "HH:mm") }}
                      placeholder={trans(
                        "create.datePlaceholder",
                        "请选择日期",
                      )}
                      onChange={this.deadDateChange}
                      showTime
                    />,
                  )}
                </FormItem>
                {this.state.ifTiming == 1 && (
                  <FormItem
                    className={[styles.formItem, styles.publishTime].join(" ")}
                  >
                    {getFieldDecorator("publishTime", {
                      rules: [
                        {
                          required: true,
                          message: trans(
                            "create.datePlaceholder",
                            "请选择日期",
                          ),
                        },
                      ],
                      initialValue: moment(
                        this.getCurrentDay() + " " + "17:00",
                      ),
                    })(
                      <DatePicker
                        showTime={{ defaultValue: moment("17:00", "HH:mm") }}
                        format="YYYY-MM-DD HH:mm"
                        allowClear={false}
                        placeholder={trans(
                          "create.datePlaceholder",
                          "请选择日期",
                        )}
                        onChange={this.dateChange.bind(this)}
                      />,
                    )}
                  </FormItem>
                )}
                <FormItem className={styles.formItem}>
                  {getFieldDecorator("ifTiming", {
                    rules: [
                      {
                        required: true,
                        message: trans(
                          "create.selectReleaseTime",
                          "请选择发布时间",
                        ),
                      },
                    ],
                    initialValue: "" + (this.state.ifTiming || 0),
                  })(
                    <div className={styles.headButton}>
                      <span onClick={this.submitResultbtn.bind(this)}>
                        {submitType[this.state.ifTiming]}
                      </span>
                      <Popover
                        getPopupContainer={null}
                        visible={!canDisabled && this.state.popVisiblle}
                        content={popContent}
                        trigger="click"
                        placement="bottom"
                      >
                        <Icon type="down" onClick={this.visibleChange} />
                      </Popover>
                    </div>,
                  )}
                </FormItem>
              </div>
            </div>
            <div className={styles.formItemTitle}>
              {trans("create.fuzeTeacher", "负责教师")}
            </div>
            <FormItem
              className={[styles.formItem, styles.teacherBox].join(" ")}
            >
              {getFieldDecorator("teacherList", {
                rules: [
                  {
                    required: true,
                    message: trans("create.teacherSelect", "请选择教师"),
                  },
                ],
                initialValue: initTeachers,
              })(
                <TreeSelect
                  treeNodeFilterProp="title"
                  treeData={allTeachersData}
                  treeCheckable={true}
                  showCheckedStrategy="SHOW_PARENT"
                  searchPlaceholder="Please select"
                  // suffixIcon = {<Icon type="search" />}
                  onChange={this.chooseTeacher}
                  dropdownStyle={{
                    maxHeight: "50vh",
                  }}
                />,
              )}
            </FormItem>
            <div className={styles.formItemTitle}>
              {trans("global.stu", "参与学生")}
            </div>
            <FormItem label="">
              {getFieldDecorator("studentList", {
                rules: [
                  {
                    required: false,
                    message: trans(
                      "create.studentPlaceholder",
                      "请选择要分配的学生",
                    ),
                  },
                ],
                initialValue: studentList,
              })(<Input style={{ display: "none" }} />)}
              <Student
                isMobile={false}
                onSearch={this.multiSelectOnSearch}
                onChange={this.multiSelectOnChange}
                sourceData={baseAllData}
                initData={studentList}
              />
            </FormItem>
          </div>
        </Form>
        {this.state.ifTiming == 1 ? (
          <Modal
            visible={this.state.showifTimingModal}
            footer={null}
            onCancel={() => {
              this.setState({
                showifTimingModal: false,
              });
            }}
            className={styles.confirmModal}
          >
            <p>
              {trans("create.message3", "您的任务将于{$date}发布", {
                date: this.state.dateTimeValue,
              })}
            </p>
            <div className={styles.modalbtn}>
              <span
                onClick={() => {
                  this.setState({
                    showifTimingModal: false,
                  });
                }}
              >
                {trans("global.cancel", "取消")}
              </span>
              <span className={styles.confirm} onClick={this.submitResult}>
                {trans("create.release", "发布")}
              </span>
            </div>
          </Modal>
        ) : (
          <Modal
            visible={this.state.showifTimingModal}
            footer={null}
            onCancel={() => {
              this.setState({
                showifTimingModal: false,
              });
            }}
            className={styles.confirmModal}
          >
            <p>{trans("create.releaseMessage", "确定要立即发布任务吗？")}</p>
            <div className={styles.modalbtn}>
              <span
                onClick={() => {
                  this.setState({
                    showifTimingModal: false,
                  });
                }}
              >
                {trans("global.cancel", "取消")}
              </span>
              <span className={styles.confirm} onClick={this.submitResult}>
                {trans("create.release", "发布")}
              </span>
            </div>
          </Modal>
        )}
        <Modal
          title={""}
          footer={null}
          getContainer={false}
          centered={true}
          visible={this.state.chooseStatus}
          closable={false}
          maskClosable={false}
          // onCancel={this.submitCancel}
          width={400}
          className={styles.returnModal}
        >
          <div className={styles.saveMessage}>
            <i className={icon.iconfont}>&#xe7a0;</i>
            <span>{trans("galobal.releaseSuccess", "发布成功")}</span>
          </div>
          <div className={styles.btnBox}>
            <div className={styles.return} onClick={this.returnMyTest}>
              {trans("global.returnMyTest", "返回“我的测验")}
            </div>
            <div className={styles.go} onClick={this.view}>
              {trans("global.view", "前往查看")}
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default Publish;

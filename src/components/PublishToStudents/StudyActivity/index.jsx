//关联学习活动
import React, { PureComponent } from "react";
import { Icon, Input, message, Modal, Select, Tooltip } from "antd";
import { connect } from "dva";

import { trans } from "../../../utils/i18n";
import Publish from "../Publish/index.jsx";

import styles from "./index.module.less";

const { Option } = Select;
const { TextArea } = Input;

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

const normalizeId = (value) => {
  if (!hasValue(value)) {
    return value;
  }
  const text = String(value);
  return /^-?\d+$/.test(text) ? Number(text) : value;
};

@connect((state) => ({
  courseList: state.publishToStudent.courseList,
  activityList: state.publishToStudent.activityList,
  ifShow: state.publishToStudent.ifShow,
}))
class StudyActivity extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      subjectId: null, //科目id
      courseId: null, //课程id
      defaultCourse: null, //默认第一个课程
      unitId: null, //单元id
      activityId: null,
      courseList: [],
      activityList: [],
      activityVal: "",
      activityDesc: "",
      nextStep: false,
      menuStatus: false, //单元活动一级菜单是否展示
      subMenuStatus: false, //单元活动二级菜单是否展示
      index: -1,
      i: -1,
    };
  }

  componentDidMount() {
    const { viewData } = this.props;
    console.log(this.props, "ppop");
    this.props.dispatch({
      type: "publishToStudent/queryIsShow",
      payload: {
        paperId:
          // this.props.examId ||
          (this.props.viewData &&
            this.props.viewData.item &&
            this.props.viewData.item.id) ||
          this.props.viewData.paperId ||
          this.props.exampleId,
      },
    });
    if (viewData && viewData.subjectId) {
      this.setState(
        {
          subjectId: viewData.subjectId,
        },
        () => {
          this.getCourseList();
        },
      );
    }
  }

  close = () => {
    this.props.onCancel();
  };

  getTeachingPlanContext = () => {
    const context = this.props.teachingPlanContext || {};
    return {
      courseId: normalizeId(context.courseId),
      unitId: normalizeId(context.unitId),
      lessonId: normalizeId(context.lessonId),
      lessonTitle: context.lessonTitle,
    };
  };

  getDefaultCourse = (courseList = []) => {
    const { courseId } = this.getTeachingPlanContext();
    if (!hasValue(courseId)) {
      return courseList[0];
    }

    return (
      courseList.find((item) => String(item.courseId) === String(courseId)) || {
        courseId,
        courseName:
          (this.props.teachingPlanContext || {}).courseName || String(courseId),
      }
    );
  };

  getDefaultActivity = (activityList = []) => {
    const { courseId, lessonId, lessonTitle, unitId } =
      this.getTeachingPlanContext();
    if (!hasValue(unitId) || !hasValue(lessonId)) {
      return {};
    }
    if (
      hasValue(courseId) &&
      hasValue(this.state.courseId) &&
      String(this.state.courseId) !== String(courseId)
    ) {
      return {};
    }

    for (const unit of activityList || []) {
      const activity = (unit.activityResponseList || []).find(
        (item) =>
          String(item.unitId || unit.id) === String(unitId) &&
          String(item.id) === String(lessonId),
      );
      if (activity) {
        return {
          index: unit.id,
          unitId: activity.unitId || unit.id,
          activityId: activity.id,
          activityVal: activity.name,
          i: activity.id,
        };
      }
    }

    return {
      index: unitId,
      unitId,
      activityId: lessonId,
      activityVal: lessonTitle || String(lessonId),
      i: lessonId,
    };
  };

  getCourseList = () => {
    this.props
      .dispatch({
        type: "publishToStudent/getCourseList",
        payload: { subjectId: this.state.subjectId },
      })
      .then(() => {
        const { courseList } = this.props;
        const defaultCourseData = this.getDefaultCourse(courseList || []);
        let courseId = defaultCourseData && defaultCourseData.courseId;
        let defaultCourse = defaultCourseData && defaultCourseData.courseName;
        console.log(courseId, "couse");
        this.setState(
          {
            courseList: courseList,
            courseId: courseId,
            defaultCourse: defaultCourse,
          },
          () => {
            if (this.state.courseId) {
              this.getActivityList();
            }
          },
        );
      });
  };

  getActivityList = () => {
    this.props
      .dispatch({
        type: "publishToStudent/getActivityList",
        payload: { courseId: this.state.courseId },
      })
      .then(() => {
        const { activityList } = this.props;
        this.setState({
          activityList: activityList,
          ...this.getDefaultActivity(activityList),
        });
      });
  };

  changeCourse = (value) => {
    this.setState(
      {
        courseId: value,
        activityVal: "",
        activityId: null,
        unitId: null,
        index: -1,
        i: -1,
      },
      () => {
        this.getActivityList();
      },
    );
  };

  getVal = (element) => {
    this.setState({
      i: element.id,
      activityVal: element.name,
      menuStatus: false,
      subMenuStatus: false,
      unitId: element && element.unitId,
      activityId: element && element.id,
    });
  };

  changeMenuStatus = () => {
    if (this.state.courseId) {
      this.setState({
        menuStatus: !this.state.menuStatus,
        subMenuStatus: false,
      });
    } else {
      message.info(trans("activity.firstChoose", "请先选择课程"));
    }
  };

  changeSubMenuStatus = (item) => {
    this.setState({
      index: item.id,
      subMenuStatus: true,
    });
  };

  next = () => {
    if (!this.state.courseId || !this.state.activityVal) {
      message.info(trans("activity.pleaseAssociated", "请先关联日课"));
      return;
    } else {
      this.setState({
        nextStep: true,
      });
    }
  };

  iptOnChange = ({ target: { value } }) => {
    this.setState({
      activityDesc: value,
    });
  };

  handleCancel = () => {
    this.setState({
      nextStep: false,
    });
    this.clearSelectValue();
  };

  returnMyTest = () => {
    this.handleCancel();
    this.clearSelectValue();
    this.props.returnMyTest();
  };

  view = () => {
    this.handleCancel();
    this.clearSelectValue();
    this.props.view();
  };

  clearSelectValue = () => {
    this.props.dispatch({
      type: "publishToStudent/update",
      payload: {
        selectValue: [],
      },
    });
  };

  render() {
    const {
      courseList,
      activityList,
      menuStatus,
      subMenuStatus,
      activityVal,
      courseId,
      defaultCourse,
      unitId,
      nextStep,
    } = this.state;
    console.log(this.props, "props---");
    const displayCourseList =
      hasValue(courseId) &&
      !(courseList || []).some(
        (item) => String(item.courseId) === String(courseId),
      )
        ? [
            {
              courseId,
              courseName: defaultCourse || String(courseId),
            },
            ...(courseList || []),
          ]
        : courseList || [];
    return this.props.ifShow === true ? (
      <div className={styles.studyActivityContent}>
        <div className={styles.header}>
          <Icon type="close" className={styles.iconfont} onClick={this.close} />
          <div className={styles.title}>
            {trans("activity.pleaseAssociated", "请先关联日课")}
          </div>
        </div>
        <div className={styles.content}>
          <Select
            onChange={this.changeCourse}
            value={hasValue(courseId) ? courseId : undefined}
            placeholder={trans("activity.pleaseChooseSubject", "请选择课程")}
            className={hasValue(courseId) ? "" : styles.noSelect}
          >
            {displayCourseList &&
              displayCourseList.length > 0 &&
              displayCourseList.map((item) => (
                <Option
                  key={item.courseId}
                  value={item.courseId}
                  title={item.courseName}
                >
                  {item.courseName}
                </Option>
              ))}
          </Select>
          <Tooltip placement="topLeft" title={activityVal}>
            <Input
              className={styles.iptActivity}
              placeholder={trans(
                "activity.pleaseChooseActivity",
                "请选择单元下的日课",
              )}
              readOnly
              value={activityVal}
              suffix={
                <Icon
                  type={menuStatus ? "up" : "down"}
                  style={{ color: "#bfbfbf" }}
                />
              }
              onClick={this.changeMenuStatus}
            />
          </Tooltip>
          {menuStatus && (
            <ul className={styles.activityMenu}>
              {activityList &&
                activityList.length > 0 &&
                activityList.map((item) => (
                  <li
                    key={item.id}
                    className={
                      this.state.index === item.id ? styles.activeLi : styles.li
                    }
                  >
                    <div
                      className={styles.title}
                      onClick={() => this.changeSubMenuStatus(item)}
                    >
                      <span>{item.name}</span>
                      <Icon type="caret-right" />
                    </div>
                    {subMenuStatus && this.state.index === item.id ? (
                      <ul className={styles.activitySubMenu}>
                        {item.activityResponseList &&
                        item.activityResponseList.length > 0 ? (
                          item.activityResponseList.map((element) => {
                            return (
                              <li
                                key={element.id}
                                onClick={() => this.getVal(element)}
                                className={
                                  this.state.i === element.id
                                    ? styles.subMenuLi
                                    : ""
                                }
                              >
                                {element.name}
                              </li>
                            );
                          })
                        ) : (
                          <li>{trans("selectCourse.noData", "暂无数据")}</li>
                        )}
                      </ul>
                    ) : null}
                  </li>
                ))}
            </ul>
          )}

          <TextArea
            placeholder={trans(
              "activity.placeholder",
              "这里可以说明下此次测验任务目的，非必填",
            )}
            onChange={this.iptOnChange}
            value={this.state.activityDesc}
          />
          <div className={styles.nextBtn} onClick={this.next}>
            {trans("activity.nextBtn", "下一步")}
          </div>
        </div>

        <div></div>

        <Modal
          title={""}
          footer={null}
          getContainer={false}
          // centered={true}
          visible={courseId && unitId && nextStep}
          closable={false}
          maskClosable={false}
          destroyOnClose={true}
          // onCancel={this.publishCancel}
          className={styles.publishModal}
        >
          <Publish
            {...this.state}
            {...this.props}
            handleCancel={this.handleCancel}
            returnMyTest={this.returnMyTest}
            view={this.view}
          />
        </Modal>
      </div>
    ) : this.props.ifShow === false ? (
      <div className={styles.studyActivityContent}>
        <div className={styles.header}>
          <Icon type="close" className={styles.iconfont} onClick={this.close} />
        </div>
        <div style={{ marginTop: "10px" }}>
          {trans(
            "studyActivity.subjectiveQuestionOfflineOnly",
            "该测验单中有主观题，暂不支持线上推送给学生作答，请打印后线下作答",
          )}
        </div>
      </div>
    ) : (
      <div className={styles.studyActivityContent}>
        <div className={styles.header}>
          <Icon type="close" className={styles.iconfont} onClick={this.close} />
        </div>
      </div>
    );
  }
}

export default StudyActivity;

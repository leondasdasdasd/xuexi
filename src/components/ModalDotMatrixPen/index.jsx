// 类组件
import React from "react";
import {
  Cascader,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Switch,
  TimePicker,
} from "antd";
import { connect } from "dva";
import moment from "moment";

import StepProgressBar from "components/StepProgressBar";

import ComnModal from "../../components/ComnModal";
import { buildPaperEditorPreviewPath } from "../../routes/PaperEditor/paperEditorPageContext";
import {
  getConfig,
  queryPaperList,
  queryResourceCreate,
} from "../../services/example";
import { closeAppraise, createAppraise } from "../../services/machine";
import { queryCourseStudents } from "../../services/publishToStudent.js";
import { buildHashRouteUrl } from "../../utils/hashRoute";
import { trans } from "../../utils/i18n";
import { getCurrentTime, loginRedirect } from "../../utils/utils";
import { initData } from "./data";
import SelectStu from "./SelectStu.jsx";

import styles from "./index.module.less";
const { Search, TextArea } = Input;
const { Option } = Select;

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

export class ModalDotMatrixPen extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      paperList: [],
      tabKey: 1,
      upLoading: false,
      onOKLoding: false,
      examName: undefined,
      examType: undefined,
      subjectId: undefined,
      courseId: undefined,
      examIllustrate: undefined,
      iFAssociateLessonId: false,
      lessonId: undefined,
      iFNeedAppraise: undefined,
      total: undefined,
      evaluationCriterionId: undefined,
      evaluationCategoryId: undefined,
      evaluationItemName: undefined,
      evaluationItemId: undefined,
      paperId: undefined,
      examId: undefined,
      origin: undefined,
      distributionType: undefined,
      taskId: undefined,
      openScore: true,
      answerTime: undefined,
      forceSubmit: 0,
      weights: undefined,
      openAnswer: true,
      hasTimeLimit: 0,
      courseIdList: [],
      disabledStu: [],
      deadTime: `${getCurrentTime("date")}`,
      publishTime: "",
      evaluationCourseId: undefined,
      isEdit: false,
      examOpenShowTime: "",
      classStudentData: [],
      stuName: "",
      dateTime: "",
      groupList: [],
    };
  }

  UNSAFE_componentWillMount() {
    // 如果不是编辑进来则将同步评价默认为true
    if (!(this.props.modalDotMatrixPenProps || {}).id) {
      this.setState({
        iFNeedAppraise: true,
      });
    }
  }

  componentDidMount() {
    this.getPaperListFun();
    this.getExamTypeFun();
    this.getSubjectListFun();
    this.getPermission();

    if (this.props.modalDotMatrixPenProps.tabKey) {
      this.setState({
        tabKey: this.props.modalDotMatrixPenProps.tabKey,
      });
    }

    const { modalDotMatrixPenProps } = this.props;
    if ((modalDotMatrixPenProps || {}).paperId) {
      this.changeSelectTest(modalDotMatrixPenProps.paperId);
    }

    if ((modalDotMatrixPenProps || {}).id) {
      this.props
        .dispatch({
          type: "home/getExamInfoByExamId",
          payload: {
            examId: modalDotMatrixPenProps.id,
          },
        })
        .then((res) => {
          const { examInfoByExamId } = this.props;
          const {
            openAnswer,
            openScore,
            answerTime,
            examName,
            examType,
            subjectId,
            courseId,
            startTime,
            endTime,
            examAlias,
            examIllustrate,
            lessonAndAppraiseModel,
            paperId,
            examId,
            taskId,
            forceSubmit,
            courseIdList,
            examOpenShowTime,
          } = examInfoByExamId;
          const {
            lessonId,
            unitId,
            evaluationCategoryId,
            totalScore,
            evaluationCriterionId,
            evaluationItemId,
            evaluationItemName,
            weights,
            total,
          } = lessonAndAppraiseModel || {};
          this.setState({
            id: examId,
            isEdit: true,
            openAnswer,
            openScore,
            hasTimeLimit: answerTime ? 0 : 1,
            answerTime,
            examName, //试卷名称
            examAlias,
            examType, //试卷类型
            subjectId, //学科id
            courseId, //课程id
            courseIdList,
            examIllustrate, //测验说明
            lessonId: [unitId, lessonId],
            iFAssociateLessonId: Boolean(lessonId),
            evaluationCategoryId,
            iFNeedAppraise: Boolean(evaluationCategoryId),
            totalScore,
            evaluationCriterionId,
            evaluationItemId: evaluationItemId ? [evaluationItemId] : null,
            evaluationItemName,
            total: totalScore,
            paperId,
            examId,
            startTime: startTime.split(" ")[1],
            endTime: endTime.split(" ")[1],
            dateTime: startTime.split(" ")[0],
            taskId,
            forceSubmit: forceSubmit ? 1 : 0,
            // weights,
            evaluationCourseId: lessonAndAppraiseModel?.evaluationCourseId
              ? lessonAndAppraiseModel?.evaluationCourseId
              : courseId, //目标课程为空取课程
            examOpenShowTime: examOpenShowTime ? examOpenShowTime : "",
            releaseType: examOpenShowTime ? 1 : 0, //通过examOpenShowTime有没有值,来回显答案公开时间的状态
          });

          if (lessonId) {
            this.setState({
              lessonId: [unitId, lessonId], //日课id
            });
          }
          // 根据学科获取课程
          if (subjectId) {
            this.props.dispatch({
              type: "publishToStudent/getCourseList",
              payload: {
                subjectId: subjectId,
                courserId: courseId,
              },
            });
          }

          if (courseIdList) {
            // 根据课程获取日课
            this.props.dispatch({
              type: "publishToStudent/getActivityList",
              payload: {
                courseId: (courseIdList || [])[0],
              },
            });
          }

          // 根据课程获取评价维度
          this.props.dispatch({
            type: "home/getSelectEvaluationCategoryByExample",
            payload: {
              courseId: lessonAndAppraiseModel?.courseId
                ? lessonAndAppraiseModel?.courseId
                : courseId,
            },
          });

          this.getCriterionList(
            lessonAndAppraiseModel?.courseId
              ? lessonAndAppraiseModel?.courseId
              : courseId,
          );

          // 根据课程获取所有班级学生
          queryCourseStudents({
            courseId: courseId,
          }).then((response) => {
            if (response.status) {
              this.setState(
                {
                  groupList: response.content || [],
                },
                () => {
                  this.getPublishDisplay(taskId);
                },
              );
            } else {
              message.error(response.message);
            }
          });

          // 根据评价维度获取评价项
          if ((lessonAndAppraiseModel || {}).evaluationCategoryId) {
            this.props
              .dispatch({
                type: "home/getEvaluationItemListByCategoryId",
                payload: {
                  evaluationCategoryId: (lessonAndAppraiseModel || {})
                    .evaluationCategoryId,
                },
              })
              .then(() => {
                for (const item of this.props.evaluationItemList) {
                  if (item.id == evaluationItemId) {
                    this.setState({
                      weights: item.weights,
                    });
                  }
                }
              });
          }
        });
    }
  }

  getPermission = (key) => {
    getConfig({
      type: 6,
      schoolLevel: true,
      businessId: "",
    }).then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          const { examAliasSwitch } = response.content;

          this.setState({
            examAliasSwitch: examAliasSwitch,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  };

  // 获取已经选中的学生
  getPublishDisplay = (taskId) => {
    const { id } = this.state;
    this.props
      .dispatch({
        type: "home/getTaskPublishDisplay",
        payload: {
          ifCopyTask: false,
          taskId: taskId,
        },
      })
      .then(() => {
        const { taskPublishDisplayList } = this.props;
        let disabledStu = [];
        if (taskPublishDisplayList && taskPublishDisplayList.lockStudentList) {
          disabledStu = taskPublishDisplayList.lockStudentList;
        }
        this.setState(
          {
            disabledStu: disabledStu,
          },
          () => {
            let list = this.updateDisabledStudents();
            this.setState({
              classStudentData: list,
            });
          },
        );
      });
  };

  // 获取所有试卷
  getPaperListFun = () => {
    //坑！ 这里不能用dispach获取数据，会导致串改列表页数据
    queryPaperList({
      semesterId: null,
      gradeId: null,
      examTypeCode: null,
      subjectId: null,
      examName: "",
      viewType: 2,
      pageNo: 1, //pageNo是当前页码
      limit: 5000, //limit是每页的数据数量
    }).then((res) => {
      if (res.status) {
        this.setState({
          paperList: res.content.examList,
        });
      } else {
        message.error(res.message);
      }
    });
  };

  // 获取所有测验类型
  getExamTypeFun = () => {
    this.props.dispatch({
      type: "home/getExamType",
      payload: {
        type: 1,
      },
    });
  };

  // 获取学科
  getSubjectListFun = () => {
    this.props.dispatch({
      type: "home/getSubjectList",
    });
  };

  // 根据评价维度id获取type
  idBasedOnType = (id) => {
    const { evaluateList } = this.props;
    const result = evaluateList.find((item) => item.id === id);
    if (result) {
      const { calculationType } = result;
      if (calculationType === 2) {
        return true;
      }
    }
    return false;
  };

  handleSubmit = () => {
    const { options } = this.props.modalDotMatrixPenProps;
    const {
      examName,
      examType,
      subjectId,
      courseId,
      examIllustrate,
      iFAssociateLessonId,
      deadTime,
      dateTime,
      publishTime,
      examAlias,
      iFNeedAppraise,
      lessonId,
      paperId,
      taskId,
      openScore,
      answerTime,
      forceSubmit,
      weights,
      total,
      evaluationCriterionId,
      evaluationCategoryId,
      evaluationItemId,
      openAnswer,
      hasTimeLimit,
      courseIdList,
      tabKey,
      id,
      evaluationCourseId,
      examOpenShowTime,
      evaluationItemName,
    } = this.state;

    if (tabKey === 1) {
      if (!paperId) {
        return message.error(trans("revise.selectPaper", "请选择试卷"));
      }
      if (!examName) {
        return message.error(
          trans("homeWork.examNameRequired", "请填写测验名称"),
        );
      }
      if (!subjectId) {
        return message.error(trans("paper.subjectRequired", "请选择学科"));
      }
      if (!courseIdList || courseIdList?.length === 0) {
        return message.error(trans("homeWork.courseRequired", "请选择课程"));
      }
      if (!examType) {
        return message.error(
          trans("homeWork.paperTypeRequired", "请选择测验类型"),
        );
      }
      if (iFAssociateLessonId && !lessonId) {
        return message.error(
          trans("homeWork.dailyLessonRequired", "请选择日课"),
        );
      }
      this.setState({
        onOKLoding: true,
      });
      queryResourceCreate({
        examName, //试卷名称
        examAlias,
        examType, //试卷类型
        subjectId, //学科id
        courseId, //课程id
        examIllustrate, //测验说明
        iFAssociateLessonId, //日课开关
        lessonId: lessonId && lessonId[1] ? lessonId[1] : null, //日课id
        iFNeedAppraise, //评价开关
        paperId,
        examId: id ? id : null,
        origin: 3,
        distributionType: 1,
        taskId,
        openScore,
        answerTime,
        forceSubmit: Boolean(forceSubmit),
        // weights,
        openAnswer,
        examOpenShowTime,
        classroomInteraction: true,
      }).then((res) => {
        this.setState({
          onOKLoding: false,
        });
        if (res.status) {
          // 新增成功，将测验新增数据生成的id存下
          const { examId, taskId } = res.content;
          this.setState({
            tabKey: 2,
            id: examId,
            taskId: taskId,
          });
          // 调用
          this.getPublishDisplay(taskId);
        } else {
          message.error(res.message);
        }
      });
    } else if (tabKey === 2) {
      let stuIdList = this.state.classStudentData.flatMap((cls) => {
        if (cls && cls.studentList && cls.studentList.length > 0) {
          let array = cls.studentList.filter(
            (stu) => stu.selected && !stu.disabled,
          );
          return array.map((stu) => ({
            groupId: cls.groupCourseId, // 班级 ID 作为 groupId
            id: stu.id, // 学生 ID
          }));
        }
      });
      if (stuIdList && stuIdList.length > 0) {
        this.props.dispatch({
          type: "publishToStudent/release",
          payload: {
            resourceRequestList: [
              {
                groupId: null, //班级id
                lessonId: lessonId && lessonId[1] ? lessonId[1] : null, //日课id
                taskId: taskId, //任务id
                evaluationItemId: evaluationItemId,
                deadTime: deadTime, //截止日期、
                startTime: `${dateTime} ${this.state.startTime}`,
                endTime: `${dateTime} ${this.state.endTime}`,
                studentList: stuIdList,
                expectTime: 0,
                examPaperId: paperId, //试卷id
                ifTiming: publishTime ? 1 : 0,
                publishTime: publishTime ? publishTime : null,
              },
            ],
          },
          onSuccess: () => {
            this.setState(
              {
                tabKey: 3,
                onOKLoding: false,
                stuIdList: [], //这里清空已选数据
              },
              () => {
                // 每次创建之后刷新禁用学生的数据防止在没有销毁页面的时候又回去看学生选择情况
                this.getPublishDisplay(taskId);
              },
            );
          },
        });
      } else {
        this.setState({
          tabKey: 3,
        });
      }
    } else {
      if (iFNeedAppraise) {
        if (!evaluationCourseId) {
          return message.error(
            trans("modalDotMatrixPen.targetCourseRequired", "请选择目标课程"),
          );
        }
        if (!evaluationCategoryId) {
          return message.error(
            trans(
              "modalDotMatrixPen.evaluationDimensionRequired",
              "请选择评价维度",
            ),
          );
        }
        if (!total) {
          return message.error(
            trans("homeWork.totalScoreRequired", "请输入总分"),
          );
        }
        if (!evaluationCriterionId && evaluationCriterionId === undefined) {
          return message.error(
            trans("homeWork.studentDisplayRequired", "请选择学生显示"),
          );
        }

        this.setState({
          onOKLoding: true,
        });
        createAppraise({
          examId: id,
          appraiseResponse: [
            {
              evaluationItemId:
                evaluationItemId &&
                evaluationItemId.length > 0 &&
                evaluationItemId[0]
                  ? evaluationItemId
                  : [examName], //评价项id:如果是创建评价项目，实际传给后端的是测验名称。
              evaluationItemName:
                evaluationItemId &&
                evaluationItemId.length > 0 &&
                evaluationItemId[0]
                  ? evaluationItemName
                  : examName, //如果是创建评价项目，传给后端测验名称，如果不是则传给后端评价项名称。
              evaluationCategoryId,
              evaluationCriterionId,
              total,
              weights,
              evaluationCourseId,
            },
          ],
        }).then((res) => {
          message.success(trans("scoreSummary.operationSuccess", "操作成功！"));
          this.setState({
            onOKLoding: false,
          });
          if (res.status) {
            options.onOk();
          } else {
            message.error(res.message);
          }
        });
      } else {
        this.setState({
          onOKLoding: true,
        });
        return closeAppraise(id).then((res) => {
          this.setState({
            onOKLoding: false,
          });
          if (res.status) {
            options.onOk();
          } else {
            message.error(res.message);
          }
        });
      }
    }
  };

  onCancel = () => {
    const { options } = this.props.modalDotMatrixPenProps;
    const { tabKey } = this.state;
    if (tabKey == 1) {
      options.onCancel();
    } else {
      this.setState({
        tabKey: tabKey - 1,
      });
    }
  };

  changeSelectTest = (value) => {
    this.clearLink("paperId", () => {
      this.setState({
        paperId: value,
      });
      // 获取当前试卷详情
      this.props
        .dispatch({
          type: "home/getPaperInfo",
          payload: {
            paperId: value,
          },
        })
        .then(() => {
          const { paperInfo } = this.props;
          const {
            subjectId,
            examPaperName,
            examType,
            gradeIdList,
            totalScore,
          } = paperInfo;

          // 根据学科id获取课程
          this.props.dispatch({
            type: "publishToStudent/getCourseList",
            payload: {
              subjectId: subjectId,
            },
          });

          this.setState({
            subjectId,
            examName: examPaperName,
            examType,
            // gradeIdList: gradeIdList || [],
            total: totalScore,
          });
        });
    });
  };

  clickPreviewTestPaper = () => {
    window.open(
      buildHashRouteUrl(buildPaperEditorPreviewPath(this.state.paperId)),
    );
  };

  changeExamTestName = (e) => {
    this.setState({
      examName: e.target.value,
    });
  };

  changeExamType = (value) => {
    this.setState({
      examType: value,
    });
  };

  // 选择学科
  changeSubjectModal = (value) => {
    this.clearLink("subjectId", () => {
      this.setState({
        subjectId: value,
      });

      // 获取学科对应课程
      this.props.dispatch({
        type: "publishToStudent/getCourseList",
        payload: {
          subjectId: value,
        },
      });
    });
  };

  // 选择课程
  changeChooseCourse = (value) => {
    this.clearLink("courseIdList", () => {
      this.setState({
        courseId: value, //后端需要数组，这里考虑以后会选择多个课程
        courseIdList: value ? [value] : [],
      });
      // 根据课程获取日课
      this.props.dispatch({
        type: "publishToStudent/getActivityList",
        payload: {
          courseId: value,
        },
      });

      // 根据课程获取所有班级学生
      queryCourseStudents({
        courseId: value,
      }).then((response) => {
        if (response.status) {
          this.setState(
            {
              groupList: response.content || [],
            },
            () => {
              let list = this.updateDisabledStudents();
              this.setState({
                classStudentData: list,
              });
            },
          );
        } else {
          message.error(response.message);
        }
      });
    });
  };

  onChangeDailyClasses = (value) => {
    this.setState({
      iFAssociateLessonId: value,
    });
  };

  changeDayClasses = (value) => {
    console.log(value);
    this.setState({
      lessonId: value,
    });
  };

  onChangeIsEvaluate = (value) => {
    this.setState({
      iFNeedAppraise: value,
    });
  };

  changeEvaluationDimension = (value) => {
    this.clearLink("evaluationCategoryId", () => {
      this.setState({
        evaluationCategoryId: value,
        evaluationItemId: [0], // 默认为新建评价项
      });

      // 根据评价维度获取评价项
      this.props.dispatch({
        type: "home/getEvaluationItemListByCategoryId",
        payload: {
          evaluationCategoryId: value,
        },
      });
    });
  };

  changeProportionDimensions = (value) => {
    this.setState({
      weights: value,
    });
  };

  changeEvaluationDimensionId = (option) => {
    console.log(option, "option");
    this.clearLink("evaluationItemId", () => {
      this.setState({
        evaluationItemId: [option.key],
        evaluationItemName: option.label,
      });
      const { evaluationItemList } = this.props;
      if (option.key == 0) {
        this.setState({
          weights: null,
          total: null,
          evaluationCriterionId: undefined,
        });
      } else if (evaluationItemList && evaluationItemList.length > 0) {
        // 根据评价项 得到 总分 ｜ 维度占比  ｜ 学生显示
        evaluationItemList.map((item) => {
          if (item.id == option.key) {
            this.setState({
              weights: item.weights,
              total: item.total,
              evaluationCriterionId: item.evaluationCriterionId,
            });
          }
        });
      }
    });
  };

  changeTotal = (value) => {
    this.setState({
      total: value,
    });
  };

  changeStudentDisplay = (value) => {
    this.setState({
      evaluationCriterionId: value,
    });
  };

  changeScoreStuChecked = (value) => {
    this.setState({
      openScore: value,
    });
  };

  changeCorrAnsVis = (value) => {
    this.setState({
      openAnswer: value,
    });
  };

  onChangeIsAnswer = (e) => {
    console.log(e);
    this.setState({
      forceSubmit: e.target.value,
    });
  };

  changeTestDescription = (e) => {
    console.log(e);
    this.setState({
      examIllustrate: e.target.value,
    });
  };

  changeIsLengthAnswer = (e) => {
    this.setState({
      hasTimeLimit: e.target.value,
    });
  };

  changeLengthAnswerNum = (value) => {
    this.setState({
      answerTime: value,
    });
  };

  // 此方法负责清空联动数据,
  clearLink = (changeKey, callBack) => {
    // 关联关系表
    const clearData = initData[changeKey];
    if (clearData) {
      const data = {};
      for (const item of clearData) {
        data[item.key] = item.value;
      }
      this.setState(
        {
          ...data,
        },
        () => {
          callBack();
        },
      );
    } else {
      callBack();
    }
  };
  changeTab = (value) => {
    this.setState({
      tabKey: value.key,
    });
  };

  changeStuName = (e) => {
    this.setState({
      stuName: e.target.value,
    });
  };

  //获取学生展示list
  getCriterionList = (courseId) => {
    this.props
      .dispatch({
        type: "home/getOptions",
      })
      .then(() => {
        const { examOptions } = this.props;
        let semesterInfo =
          examOptions && examOptions.length > 0
            ? examOptions.find((item) => item.current === true) || {}
            : {};
        let semesterId = semesterInfo.semesterId;
        this.props.dispatch({
          type: "home/getCriterionList",
          payload: {
            courseId: courseId,
            semesterId: semesterId,
          },
        });
      });
  };

  changeTargetCourse = (value) => {
    this.clearLink("evaluationCourseId", () => {
      this.setState({
        evaluationCourseId: value,
      });
      // 根据课程获取评价维度
      this.props.dispatch({
        type: "home/getSelectEvaluationCategoryByExample",
        payload: { courseId: value },
      });
      this.getCriterionList(value);
    });
  };

  releaseTimeChaneg = (key, e) => {
    let value = "";
    let array = this.state.examOpenShowTime.split(" ");
    console.log(array);
    if (key == "DATE") {
      value = e + " " + array[1];
    } else if (key == "TIME") {
      value = array[0] + " " + e;
    }

    this.setState({
      examOpenShowTime: value,
    });
  };

  stuChange = (data) => {
    this.setState({
      classStudentData: data,
    });
  };

  updateDisabledStudents = () => {
    const { disabledStu, groupList } = this.state;

    if (groupList && groupList.length > 0) {
      let list = JSON.parse(JSON.stringify(groupList));
      return list.map((cls) => ({
        ...cls,
        studentList: cls.studentList.map((stu) => {
          const isDisabled = disabledStu.some((ds) => ds.id == stu.id);

          return isDisabled
            ? { ...stu, selected: true, disabled: true }
            : { ...stu, selected: false, disabled: false };
        }),
      }));
    }
  };

  startTimeChange = (date, dateString) => {
    this.setState({
      startTime: dateString,
    });
  };

  endTimeChange = (date, dateString) => {
    this.setState({
      endTime: dateString,
    });
  };

  changeDate = (date, dateString) => {
    this.setState({
      dateTime: dateString,
    });
  };

  changeExamAliasName = (e) => {
    this.setState({
      examAlias: e.target.value,
    });
  };

  render() {
    const {
      paperList,
      tabKey,
      onOKLoding,
      examName,
      examType,
      subjectId,
      examIllustrate,
      iFAssociateLessonId,
      lessonId,
      iFNeedAppraise,
      total,
      evaluationCriterionId,
      evaluationCategoryId,
      evaluationItemId,
      courseIdList,
      isEdit,
      examAlias,
      paperId,
      weights,
      evaluationCourseId,
      startTime,
      endTime,
      dateTime,
      examAliasSwitch,
    } = this.state;
    const {
      examTypeList,
      subjectListTest,
      courseList,
      evaluateList,
      evaluationItemList,
      criterionList,
      activityList,
      modalDotMatrixPenProps,
    } = this.props;
    const { options } = modalDotMatrixPenProps;

    return (
      <ComnModal
        options={{
          ...options,
          okText:
            tabKey == 3
              ? iFNeedAppraise
                ? trans("global.initiateSync", "发起成绩同步")
                : trans("global.ok", "确认")
              : trans("activity.nextBtn", "下一步"),
          cancelText:
            tabKey == 1
              ? trans("global.cancle", "取消")
              : trans("global.previousStep", "上一步"),
          okButtonProps: {
            loading: onOKLoding,
          },
          style: { top: "10px" },
          // centered: true,
          onOk: this.handleSubmit, // 提交表单
          cancelButtonProps: {
            // 点击取消按钮
            onClick: () => {
              this.onCancel();
            },
          },
          wrapClassName: "modalOnlineTest",
        }}
        innerContent={
          <>
            <StepProgressBar
              data={[
                { tab: trans("global.quizSettings", "填写测验设置"), key: 1 },
                { tab: trans("global.selectStudents", "选择学生"), key: 2 },
                { tab: trans("global.scoreEaluation", "成绩同步评价"), key: 3 },
              ]}
              onChange={(value) => {
                this.changeTab(value);
              }}
              activeKey={tabKey}
              style={{ marginTop: "13px" }}
            />
            <div className={styles.modalContentBody}>
              <Form
                {...formItemLayout}
                style={{ display: tabKey == 1 ? "block" : "none" }}
                colon={false}
              >
                <Form.Item
                  label={trans("global.test", "试卷")}
                  wrapperCol={{ span: 18 }}
                  required
                >
                  <Col span={20}>
                    <Select
                      showSearch
                      placeholder={trans("global.selectTest ", "选择试卷")}
                      onChange={this.changeSelectTest}
                      value={paperId}
                      onSearch={this.searchTest}
                      disabled={isEdit}
                      filterOption={(input, option) => {
                        return (
                          option.props.children
                            ?.toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        );
                      }}
                    >
                      {paperList && paperList.length > 0
                        ? paperList.map((item) => (
                            <Option
                              value={item.id}
                              key={item.id}
                              title={item.title}
                            >
                              {item.title}
                            </Option>
                          ))
                        : null}
                    </Select>
                  </Col>

                  {paperId ? (
                    <span
                      style={{
                        color: "#0445fc",
                        cursor: "pointer",
                        paddingLeft: "10px",
                        lineHeight: "32px",
                      }}
                      onClick={this.clickPreviewTestPaper}
                    >
                      {trans("global.previewTestPaper", "预览试卷")}
                    </span>
                  ) : null}
                </Form.Item>
                <Form.Item
                  label={trans("global.testName", "测验名称")}
                  wrapperCol={{ span: 15 }}
                  required
                >
                  <Input onChange={this.changeExamTestName} value={examName} />
                </Form.Item>
                {examAliasSwitch ? (
                  <Form.Item
                    label={trans("global.quizAlias", "测验别名")}
                    wrapperCol={{ span: 15 }}
                  >
                    <Input
                      placeholder={trans("global.pleaseEnter", "请输入")}
                      onChange={this.changeExamAliasName}
                      value={examAlias}
                    />
                  </Form.Item>
                ) : null}
                <Form.Item
                  label={trans("global.testType", "测验类型")}
                  wrapperCol={{ span: 15 }}
                  required
                >
                  <Select
                    showSearch
                    placeholder={trans("global.selectType", "选择类型")}
                    onChange={this.changeExamType}
                    value={examType}
                    filterOption={(input, option) => {
                      return (
                        option.props.children
                          ?.toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      );
                    }}
                  >
                    {examTypeList &&
                      examTypeList.length &&
                      examTypeList.map((item) => (
                        <Option value={item.code} key={item.code}>
                          {item.typeName}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>
                <Row>
                  <Col span={12}>
                    <Form.Item
                      label={trans("global.subject", "学科")}
                      wrapperCol={{ span: 12 }}
                      labelCol={{ span: 12 }}
                      required
                    >
                      <Select
                        placeholder={trans(
                          "global.selectDiscipline",
                          "选择学科",
                        )}
                        onChange={this.changeSubjectModal}
                        value={subjectId}
                        allowClear
                        showSearch
                        filterOption={(input, option) => {
                          return (
                            option.props.children
                              ?.toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0
                          );
                        }}
                      >
                        {subjectListTest && subjectListTest.length > 0
                          ? subjectListTest.map((item) => (
                              <Option value={item.id} key={item.id}>
                                {item.name}
                              </Option>
                            ))
                          : null}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={trans("global.course", "课程")}
                      wrapperCol={{ span: 12 }}
                      required
                    >
                      <Select
                        showSearch
                        placeholder={trans("global.chooseCourse", "选择课程")}
                        onChange={this.changeChooseCourse}
                        value={(courseIdList || [])[0]}
                        filterOption={(input, option) => {
                          return (
                            option.props.children
                              ?.toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0
                          );
                        }}
                      >
                        {courseList && courseList.length > 0
                          ? courseList.map((item) => (
                              <Option value={item.courseId} key={item.courseId}>
                                {item.courseName}
                              </Option>
                            ))
                          : null}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label={trans("global.relatedDailyClasses", "关联日课")}
                  className="lh21"
                >
                  <Switch
                    size="small"
                    defaultChecked
                    onChange={this.onChangeDailyClasses}
                    checked={iFAssociateLessonId}
                  />
                </Form.Item>
                {iFAssociateLessonId ? (
                  <Form.Item
                    label={trans("global.selectDayClasses", "选择日课")}
                    wrapperCol={{ span: 15 }}
                    required
                  >
                    <Cascader
                      popupClassName={styles.cascaderDay}
                      fieldNames={{
                        label: "name",
                        value: "id",
                        children: "activityResponseList",
                      }}
                      options={activityList}
                      onChange={this.changeDayClasses}
                      placeholder={trans("global.pleaseChoose", "请选择")}
                      value={lessonId}
                    />
                  </Form.Item>
                ) : null}

                <Form.Item
                  label={trans("global.testDescription", "测验说明")}
                  wrapperCol={{ span: 15 }}
                  style={{ marginBottom: "0px" }}
                >
                  <TextArea
                    autoSize={{ minRows: 3 }}
                    placeholder={trans(
                      "global.optional",
                      "选填，这里填写的内容会在答题前展示给学生阅读查看",
                    )}
                    value={examIllustrate}
                    onChange={this.changeTestDescription}
                  />
                </Form.Item>
              </Form>
              {tabKey == 2 ? (
                <div style={{ padding: "0 20px" }}>
                  <div className={styles.deadline} style={{ marginBottom: 15 }}>
                    <span className={styles.radioTitleStu}>
                      {trans("modalDotMatrixPen.lessonTime", "上课时间")}
                    </span>
                    <div style={{ marginRight: 8 }}>
                      <DatePicker
                        style={{ width: "130px" }}
                        onChange={this.changeDate}
                        format="YYYY-MM-DD"
                        defaultValue={
                          dateTime ? moment(dateTime, "YYYY-MM-DD") : ""
                        }
                      />
                    </div>
                    <div style={{ marginRight: 8 }}>
                      <TimePicker
                        style={{ width: "100px" }}
                        onChange={this.startTimeChange}
                        format="HH:mm"
                        placeholder={trans(
                          "modalDotMatrixPen.startTime",
                          "开始时间",
                        )}
                        defaultValue={
                          startTime ? moment(startTime, "HH:mm") : ""
                        }
                      />
                    </div>
                    <div style={{ marginRight: 8 }}>
                      <TimePicker
                        style={{ width: "100px" }}
                        onChange={this.endTimeChange}
                        format="HH:mm"
                        placeholder={trans(
                          "modalDotMatrixPen.endTime",
                          "结束时间",
                        )}
                        defaultValue={endTime ? moment(endTime, "HH:mm") : ""}
                      />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <Search
                        placeholder={trans(
                          "global.studentSearch",
                          "请输入学生姓名/学号进行搜索",
                        )}
                        onChange={this.changeStuName}
                        value={this.state.stuName}
                      />
                    </div>
                  </div>
                  <div>
                    {trans(
                      "modalDotMatrixPen.lessonTimePrecisionHint",
                      "提示：上课时间请务必精确到某一节课，以便精准采集数据，不同上课时间请单独发送",
                    )}
                  </div>
                  <SelectStu
                    searchKey={this.state.stuName}
                    groupList={this.state.classStudentData}
                    onSelectChange={this.stuChange}
                  />
                </div>
              ) : null}

              <Form
                style={{ display: tabKey == 3 ? "block" : "none" }}
                colon={false}
                labelCol={{ span: 5 }}
                wrapperCol={{ span: 19 }}
              >
                <div className={styles.remarks}>
                  {trans("global.synchronization", "成绩同步说明")}：<br />
                  1.
                  {trans(
                    "global.synchronizationAfter1",
                    "发起同步后，大概需要2分钟完成数据同步，请进入对应的【课程-评价】刷新查看同步结果；",
                  )}
                  <br />
                  2.{" "}
                  {trans(
                    "global.synchronizationAfter2",
                    "成绩同步开关，可反复操作。",
                  )}
                </div>
                <Form.Item
                  label={trans("global.scoreEaluation", "成绩同步评价")}
                  className="lh18"
                >
                  <Switch
                    style={{
                      visibility:
                        iFNeedAppraise == undefined ? "hidden" : "visible",
                    }}
                    size="small"
                    checked={iFNeedAppraise}
                    onChange={this.onChangeIsEvaluate}
                  />
                </Form.Item>

                <div
                  style={{
                    backgroundColor: "rgb(217 217 217 / 30%)",
                    paddingTop: "15px",
                    borderRadius: "10px",
                    margin: "0px 25px",
                    display: iFNeedAppraise ? "block" : "none",
                  }}
                >
                  <Row>
                    <Col span={24}>
                      <Form.Item
                        label={trans("global.targetCourse", "目标课程")}
                        wrapperCol={{ span: 15 }}
                        labelCol={{ span: 7 }}
                        required
                      >
                        <Select
                          showSearch
                          placeholder={trans(
                            "global.chooseCourse",
                            "选择目标课程",
                          )}
                          onChange={this.changeTargetCourse}
                          value={evaluationCourseId}
                          filterOption={(input, option) => {
                            return (
                              option.props.children
                                ?.toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            );
                          }}
                        >
                          {courseList && courseList.length > 0
                            ? courseList.map((item) => (
                                <Option
                                  value={item.courseId}
                                  key={item.courseId}
                                >
                                  {item.courseName}
                                </Option>
                              ))
                            : null}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={24}>
                      <Form.Item
                        label={trans("global.evaluationDimension", "评价维度")}
                        wrapperCol={{ span: 15 }}
                        labelCol={{ span: 7 }}
                        required
                      >
                        <Select
                          showSearch
                          placeholder={trans(
                            "global.pleaseSelect",
                            "请选择评价维度",
                          )}
                          onChange={this.changeEvaluationDimension}
                          value={evaluationCategoryId}
                          filterOption={(input, option) => {
                            return (
                              option.props.children
                                ?.toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            );
                          }}
                        >
                          {evaluateList && evaluateList.length > 0
                            ? evaluateList.map((item) => (
                                <Option value={item.id} key={item.id}>
                                  {item.name}
                                </Option>
                              ))
                            : null}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row>
                    <Col span={12}>
                      <Form.Item
                        label={trans("global.evaluativeItems", "评价项")}
                        wrapperCol={{ span: 14 }}
                        labelCol={{ span: 10 }}
                        required
                      >
                        <Select
                          showSearch
                          labelInValue
                          placeholder={trans(
                            "global.selectEvaluationItem",
                            "请选择评价项",
                          )}
                          onChange={this.changeEvaluationDimensionId}
                          // value={(evaluationItemId || [])[0]}
                          value={{ key: (evaluationItemId || [])[0] }}
                          filterOption={(input, option) => {
                            return (
                              option.props.children
                                ?.toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            );
                          }}
                        >
                          <Option value={0}>
                            {trans(
                              "global.createEvaluationItem",
                              "创建新的评价项",
                            )}
                          </Option>
                          {evaluationItemList && evaluationItemList.length > 0
                            ? evaluationItemList.map((item) => (
                                <Option value={item.id} key={item.id}>
                                  {item.name}
                                </Option>
                              ))
                            : null}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      {evaluateList &&
                      evaluateList.length > 0 &&
                      this.idBasedOnType(evaluationCategoryId) ? (
                        <div
                          style={{
                            display: "inline-block",
                            marginLeft: 10,
                          }}
                        >
                          <span className={styles.remark}>
                            {trans(
                              "global.proportionDimensions",
                              "该维度计算方式为多项求和，此项目占该维度的",
                            )}
                          </span>
                          <InputNumber
                            onChange={this.changeProportionDimensions}
                            disabled={Boolean((evaluationItemId || [])[0])}
                            value={weights}
                            formatter={(value) => `${value}%`}
                            parser={(value) => value.replace("%", "")}
                            max={100}
                            min={0}
                          />
                        </div>
                      ) : null}
                    </Col>
                  </Row>
                  <Row>
                    <Col span={10}>
                      <Form.Item
                        label={trans("global.zongfen", "总分")}
                        wrapperCol={{ span: 14 }}
                        labelCol={{ span: 10 }}
                        required
                      >
                        <InputNumber
                          placeholder={trans("global.pleaseEnter", "请输入")}
                          onChange={this.changeTotal}
                          value={total}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={trans("global.gradingScale", "学生显示")}
                        wrapperCol={{ span: 16 }}
                        labelCol={{ span: 8 }}
                        required
                      >
                        <Select
                          showSearch
                          placeholder={trans("global.pleaseChoose", "请选择")}
                          onChange={this.changeStudentDisplay}
                          value={evaluationCriterionId}
                          filterOption={(input, option) => {
                            return (
                              option.props.children
                                ?.toLowerCase()
                                .indexOf(input.toLowerCase()) >= 0
                            );
                          }}
                        >
                          {criterionList && criterionList.length > 0
                            ? criterionList.map((item) => (
                                <Option value={item.id} key={item.id}>
                                  {item.name}
                                </Option>
                              ))
                            : null}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </Form>
            </div>
          </>
        }
      />
    );
  }
}

export default connect(({ home, publishToStudent, machine }) => ({
  paperInfo: home.paperInfo,
  examTypeList: home.examTypeList,
  courseList: publishToStudent.courseList,
  evaluateList: home.evaluateList,
  criterionList: home.criterionList,
  subjectListTest: home.subjectListTest,
  examInfoByExamId: home.examInfoByExamId,
  activityList: publishToStudent.activityList,
  taskPublishDisplayList: home.taskPublishDisplayList,
  evaluationItemList: home.evaluationItemListByCategoryId,
  examOptions: home.examOptions,
}))(Form.create()(ModalDotMatrixPen));

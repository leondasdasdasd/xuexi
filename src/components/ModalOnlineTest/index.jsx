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
  Radio,
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
import { getConfig, queryPaperList } from "../../services/example";
import {
  configureAndPublishExamV2,
  createOnlineExamForPublication,
} from "../../services/explicitExam";
import { closeAppraise, createAppraise } from "../../services/machine";
import { queryCourseStudents } from "../../services/publishToStudent";
import { buildHashRouteUrl } from "../../utils/hashRoute";
import { trans } from "../../utils/i18n";
import { getCurrentTime, loginRedirect } from "../../utils/utils";
import SelectStu from "../ModalDotMatrixPen/SelectStu";
import TimedTask from "../TimedTask";
import {
  ANSWER_RELEASE_MODE,
  ANSWER_RELEASE_POLICY_ERROR,
  mapAnswerReleasePolicyToExamVisibility,
  mapExamVisibilityToAnswerReleasePolicy,
  RELEASE_TIME_FORMAT,
} from "./answerReleasePolicy";
import { initData } from "./data";

import styles from "./index.module.less";

const { Search, TextArea } = Input;
const { Option } = Select;

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
};

const hasDefaultValue = (value) =>
  value !== undefined && value !== null && value !== "";

const normalizeDefaultValue = (value) => {
  if (!hasDefaultValue(value)) {
    return;
  }
  const text = String(value);
  return /^-?\d+$/.test(text) ? Number(text) : value;
};

export class ModalOnlineTest extends React.Component {
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
      hasTimeLimit: 0,
      courseIdList: [],
      day: getCurrentTime("date"),
      time: getCurrentTime("time"),
      deadTime: `${getCurrentTime("date")} ${getCurrentTime("time")}`,
      publishTime: "",
      evaluationCourseId: undefined,
      isEdit: false,
      childrenEvaluateList: [],
      answerReleaseMode: ANSWER_RELEASE_MODE.IMMEDIATE,
      answerReleaseTime: "",
      groupList: [],
      classStudentData: [],
      usesV2Publication: false,
      disabledStu: [],
    };
  }
  UNSAFE_componentWillMount() {
    // 如果不是编辑进来则将同步评价默认为true
    if (!(this.props.modalOnlineTestProps || {}).id) {
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

    if (this.props.modalOnlineTestProps.tabKey) {
      this.setState({
        tabKey: this.props.modalOnlineTestProps.tabKey,
      });
    }

    const { modalOnlineTestProps } = this.props;

    if ((modalOnlineTestProps || {}).paperId) {
      this.changeSelectTest(modalOnlineTestProps.paperId);
    }

    if (
      !(modalOnlineTestProps || {}).id &&
      !(modalOnlineTestProps || {}).paperId
    ) {
      this.applyDefaultLessonContext();
    }

    if ((modalOnlineTestProps || {}).id) {
      this.props
        .dispatch({
          type: "home/getExamInfoByExamId",
          payload: {
            examId: modalOnlineTestProps.id,
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
            examIllustrate,
            lessonAndAppraiseModel = {},
            paperId,
            examId,
            taskId,
            forceSubmit,
            examAlias,
            courseIdList,
            examOpenShowTime,
            semesterId,
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
          } = lessonAndAppraiseModel;

          const answerReleasePolicy = mapExamVisibilityToAnswerReleasePolicy({
            examOpenShowTime,
            openAnswer,
          });
          let parameters = {
            id: examId,
            isEdit: true,
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
            iFNeedAppraise: Boolean(evaluationCategoryId),
            totalScore,
            evaluationCriterionId,
            evaluationItemId: evaluationItemId ? [evaluationItemId] : null,
            evaluationItemName,
            total: totalScore,
            paperId,
            examId,
            taskId,
            forceSubmit: forceSubmit ? 1 : 0,
            // weights,
            evaluationCourseId: lessonAndAppraiseModel?.evaluationCourseId
              ? lessonAndAppraiseModel?.evaluationCourseId
              : courseId, //目标课程为空取课程
            answerReleaseMode: answerReleasePolicy.mode,
            answerReleaseTime: answerReleasePolicy.releaseTime,
          };

          // 后加入二级评价维度，根据parentEvaluationCategoryId区分是否选择了二级评价维度
          if (lessonAndAppraiseModel.parentEvaluationCategoryId) {
            // 如果选择了二级评价维度，需要将一级评价维度的id赋值给evaluationCategoryId
            parameters.evaluationCategoryId =
              lessonAndAppraiseModel.parentEvaluationCategoryId;
            parameters.childEvaluationCategoryId =
              lessonAndAppraiseModel.evaluationCategoryId;
          } else {
            parameters.evaluationCategoryId =
              lessonAndAppraiseModel.evaluationCategoryId;
          }

          this.setState({
            ...parameters,
          });

          this.setState();

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

          // 确保接口入参优值，避免接口报系统异常
          if (
            lessonAndAppraiseModel?.evaluationCourseId ||
            lessonAndAppraiseModel?.courseId ||
            courseId
          ) {
            // 根据课程获取评价维度
            this.props.dispatch({
              type: "home/getSelectEvaluationCategoryByExample",
              payload: {
                //先取目标课程id 找不到去找试卷的课程id 试卷的找不到再找测验的课程id
                courseId:
                  lessonAndAppraiseModel?.evaluationCourseId ||
                  lessonAndAppraiseModel?.courseId ||
                  courseId,
                semesterId: semesterId,
              },
              callback: (res) => {
                let result = res.content.find(
                  (item) => item.id == parameters.evaluationCategoryId,
                );
                let list = result ? result.childrenList : [];
                if (list && list.length > 0) {
                  this.setState({
                    childrenEvaluateList: list,
                  });
                }
              },
            });
          }

          this.getCriterionList(
            lessonAndAppraiseModel?.courseId
              ? lessonAndAppraiseModel?.courseId
              : courseId,
          );

          // 根据课程获取所有班级学生
          // this.props.dispatch({
          //     type: "publishToStudent/getCourseStudents",
          //     payload: {
          //         courseId: courseId,
          //     },
          // });
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

          // 确保评价维度存在值，避免后端接口报异常
          if (
            parameters.childEvaluationCategoryId ||
            parameters.evaluationCategoryId
          ) {
            // 根据评价维度获取评价项
            this.props
              .dispatch({
                type: "home/getEvaluationItemListByCategoryId",
                payload: {
                  evaluationCategoryId:
                    parameters.childEvaluationCategoryId ||
                    parameters.evaluationCategoryId,
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

  componentDidUpdate(previousProperties) {
    if (previousProperties.activityList !== this.props.activityList) {
      this.syncDefaultLessonPathFromOptions();
    }
  }

  getPermission = () => {
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
    return this.props
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
        let object = {};
        if (taskPublishDisplayList.deadTime) {
          object.deadTime = taskPublishDisplayList.deadTime;
        }

        if (taskPublishDisplayList.publishTime) {
          // obj.publishTime = taskPublishDisplayList.deadTime
          object.publishTime = taskPublishDisplayList.publishTime;
        }

        return new Promise((resolve) => {
          this.setState(
            {
              disabledStu: disabledStu,
              ...object,
            },
            () => {
              let list = this.updateDisabledStudents();
              this.setState({ classStudentData: list }, resolve);
            },
          );
        });
      });
  };

  // 获取所有试卷
  getPaperListFun = () => {
    //坑！ 这里不能用dispach获取数据，会导致串改列表页数据
    const defaultContext = this.getDefaultLessonContext();
    queryPaperList({
      semesterId: hasDefaultValue(defaultContext.semesterId)
        ? defaultContext.semesterId
        : null,
      gradeId: hasDefaultValue(defaultContext.gradeId)
        ? defaultContext.gradeId
        : null,
      examTypeCode: null,
      subjectId: hasDefaultValue(defaultContext.subjectId)
        ? defaultContext.subjectId
        : null,
      examName: "",
      viewType: 2,
      pageNo: 1, //pageNo是当前页码
      limit: 5000, //limit是每页的数据数量
      hasEditExam: 1,
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

  getDefaultLessonContext = () => {
    const { modalOnlineTestProps: modalOnlineTestProperties = {} } = this.props;
    return {
      subjectId: normalizeDefaultValue(
        modalOnlineTestProperties.defaultSubjectId,
      ),
      gradeId: normalizeDefaultValue(modalOnlineTestProperties.defaultGradeId),
      courseId: normalizeDefaultValue(
        modalOnlineTestProperties.defaultCourseId,
      ),
      unitId: normalizeDefaultValue(modalOnlineTestProperties.defaultUnitId),
      lessonId: normalizeDefaultValue(
        modalOnlineTestProperties.defaultLessonId,
      ),
      semesterId: normalizeDefaultValue(
        modalOnlineTestProperties.defaultSemesterId,
      ),
      lessonTitle: modalOnlineTestProperties.defaultLessonTitle,
      examName: modalOnlineTestProperties.defaultExamName,
    };
  };

  isUsingDefaultCourse = () => {
    const defaultContext = this.getDefaultLessonContext();
    const currentCourseId =
      (this.state.courseIdList || [])[0] || this.state.courseId;

    return (
      !hasDefaultValue(defaultContext.courseId) ||
      !hasDefaultValue(currentCourseId) ||
      String(defaultContext.courseId) === String(currentCourseId)
    );
  };

  getLessonPathFromActivityList = (activityList = [], lessonId, unitId) => {
    if (!hasDefaultValue(lessonId)) {
      return;
    }

    let matchedByLessonId;
    for (const unit of activityList || []) {
      for (const activity of unit.activityResponseList || []) {
        const currentUnitId = activity.unitId || unit.id;
        const currentPath = [unit.id, activity.id];
        if (
          hasDefaultValue(unitId) &&
          String(currentUnitId) === String(unitId) &&
          String(activity.id) === String(lessonId)
        ) {
          return currentPath;
        }
        if (!matchedByLessonId && String(activity.id) === String(lessonId)) {
          matchedByLessonId = currentPath;
        }
      }
    }

    return matchedByLessonId;
  };

  syncDefaultLessonPathFromOptions = () => {
    const { activityList } = this.props;
    const { iFAssociateLessonId, lessonId } = this.state;
    const defaultContext = this.getDefaultLessonContext();

    if (
      !iFAssociateLessonId ||
      !this.isUsingDefaultCourse() ||
      !hasDefaultValue(defaultContext.lessonId)
    ) {
      return;
    }

    const matchedPath = this.getLessonPathFromActivityList(
      activityList,
      defaultContext.lessonId,
      defaultContext.unitId,
    );

    if (
      matchedPath &&
      (!lessonId ||
        String((lessonId || [])[0]) !== String(matchedPath[0]) ||
        String((lessonId || [])[1]) !== String(matchedPath[1]))
    ) {
      this.setState({
        lessonId: matchedPath,
      });
    }
  };

  getActivityListWithDefaultLesson = (activityList = []) => {
    const defaultContext = this.getDefaultLessonContext();

    if (
      !this.state.iFAssociateLessonId ||
      !this.isUsingDefaultCourse() ||
      !hasDefaultValue(defaultContext.unitId) ||
      !hasDefaultValue(defaultContext.lessonId)
    ) {
      return activityList;
    }

    const matchedPath = this.getLessonPathFromActivityList(
      activityList,
      defaultContext.lessonId,
      defaultContext.unitId,
    );

    if (matchedPath) {
      return activityList;
    }

    return [
      ...(activityList || []),
      {
        id: defaultContext.unitId,
        name: trans("global.currentUnit", "当前单元"),
        activityResponseList: [
          {
            id: defaultContext.lessonId,
            unitId: defaultContext.unitId,
            name:
              defaultContext.lessonTitle ||
              trans("global.currentLesson", "当前日课"),
          },
        ],
      },
    ];
  };

  loadCourseRelatedData = (courseId, options = {}) => {
    if (!hasDefaultValue(courseId)) {
      return;
    }

    this.props.dispatch({
      type: "publishToStudent/getActivityList",
      payload: {
        courseId,
      },
    });

    queryCourseStudents({
      courseId,
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

    this.props.dispatch({
      type: "home/getSelectEvaluationCategoryByExample",
      payload: {
        courseId,
        semesterId: options.semesterId,
      },
    });
    this.getCriterionList(courseId);
  };

  applyDefaultLessonContext = () => {
    const { subjectId, courseId, unitId, lessonId, semesterId, examName } =
      this.getDefaultLessonContext();
    const nextState = {};

    if (hasDefaultValue(examName) && !hasDefaultValue(this.state.examName)) {
      nextState.examName = examName;
    }
    if (hasDefaultValue(subjectId)) {
      nextState.subjectId = subjectId;
    }
    if (hasDefaultValue(courseId)) {
      nextState.courseId = courseId;
      nextState.courseIdList = [courseId];
      nextState.evaluationCourseId = courseId;
    }
    if (hasDefaultValue(unitId) && hasDefaultValue(lessonId)) {
      nextState.iFAssociateLessonId = true;
      nextState.lessonId = [unitId, lessonId];
    }

    if (Object.keys(nextState).length === 0) {
      return;
    }

    this.setState(nextState, () => {
      if (hasDefaultValue(subjectId)) {
        this.props.dispatch({
          type: "publishToStudent/getCourseList",
          payload: {
            subjectId,
            courserId: courseId,
          },
        });
      }
      if (hasDefaultValue(courseId)) {
        this.loadCourseRelatedData(courseId, { semesterId });
      }
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

  publishExamToStudents = ({
    deadTime,
    evaluationItemId,
    lessonId,
    paperId,
    publishTime,
    taskId,
  }) => {
    const { classStudentData, id, usesV2Publication } = this.state;
    const selectedStudents = classStudentData.flatMap((group) =>
      (group?.studentList || [])
        .filter((student) => student.selected && !student.disabled)
        .map((student) => ({
          groupId: group.groupCourseId,
          id: student.id,
        })),
    );
    if (selectedStudents.length === 0) {
      if (usesV2Publication) {
        message.warning(
          trans("explicitExam.selectAtLeastOneStudent", "请至少选择一名学生"),
        );
      } else {
        this.setState({ tabKey: 3 });
      }
      return;
    }
    const publicationBody = {
      resourceRequestList: [
        {
          deadTime,
          evaluationItemId,
          examPaperId: paperId,
          expectTime: 0,
          groupId: null,
          ifTiming: publishTime ? 1 : 0,
          lessonId: lessonId?.[1] || null,
          publishTime: publishTime || null,
          studentList: selectedStudents,
          taskId,
        },
      ],
    };
    if (usesV2Publication) {
      this.setState({ onOKLoding: true });
      return configureAndPublishExamV2({
        examId: id,
        open: true,
        publicationBody,
      })
        .then(() => this.getPublishDisplay(taskId))
        .then(() => {
          this.setState({ tabKey: 3, onOKLoding: false, stuIdList: [] });
          return true;
        })
        .catch((error) => {
          message.error(error.message);
          // 写操作失败后先回读任务发布状态，再允许用户决定是否重试。
          return Promise.resolve(this.getPublishDisplay(taskId))
            .catch(() => {})
            .then(() => {
              this.setState({ onOKLoding: false });
              return false;
            });
        });
    }
    return this.props.dispatch({
      type: "publishToStudent/release",
      payload: publicationBody,
      onSuccess: () => {
        this.setState({ tabKey: 3, onOKLoding: false, stuIdList: [] }, () =>
          this.getPublishDisplay(taskId),
        );
      },
    });
  };

  createOrUpdateExam = (createBody, existingExamId) => {
    const usesV2Creation = !existingExamId;
    return createOnlineExamForPublication(createBody, usesV2Creation)
      .then((creation) => {
        this.setState({ onOKLoding: false });
        const { contractVersion, examId, taskId } = creation;
        const hasValidIdentifiers =
          Number.isSafeInteger(examId) &&
          examId > 0 &&
          Number.isSafeInteger(taskId) &&
          taskId > 0;
        const usesV2Publication = contractVersion === "V2";
        if (!hasValidIdentifiers || (usesV2Creation && !usesV2Publication)) {
          throw new Error(
            trans(
              "explicitExam.invalidV2CreationResponse",
              "创建结果不是有效的 V2 考试，请重试",
            ),
          );
        }
        this.setState({
          id: examId,
          tabKey: 2,
          taskId,
          usesV2Publication,
        });
        this.getPublishDisplay(taskId);
        return creation;
      })
      .catch((error) => {
        this.setState({ onOKLoding: false });
        message.error(error.message);
      });
  };

  handleSubmit = () => {
    const { modalOnlineTestProps } = this.props;
    const { options } = modalOnlineTestProps;
    const {
      examName,
      examType,
      subjectId,
      courseId,
      examIllustrate,
      iFAssociateLessonId,
      deadTime,
      publishTime,
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
      hasTimeLimit,
      courseIdList,
      tabKey,
      id,
      evaluationCourseId,
      answerReleaseMode,
      answerReleaseTime,
      evaluationItemName,
      examAlias,
      childEvaluationCategoryId,
    } = this.state;

    if (tabKey === 1) {
      if (!paperId) {
        return message.error(trans("modalTest.selectPaper", "请选择试卷"));
      }
      if (!examName) {
        return message.error(
          trans("modalTest.enterExamName", "请填写测验名称"),
        );
      }
      if (!subjectId) {
        return message.error(trans("modalTest.selectSubject", "请选择学科"));
      }
      if (!courseIdList || courseIdList?.length === 0) {
        return message.error(trans("modalTest.selectCourse", "请选择课程"));
      }
      if (!examType) {
        return message.error(
          trans("modalTest.selectExamType", "请选择测验类型"),
        );
      }
      if (iFAssociateLessonId && !lessonId) {
        return message.error(
          trans("modalOnlineTest.selectLesson", "请选择日课"),
        );
      }
      if (hasTimeLimit == 0 && !answerTime) {
        return message.error(
          trans("modalOnlineTest.enterAnswerDuration", "请输入答题时长"),
        );
      }
      let answerVisibility;
      try {
        answerVisibility = mapAnswerReleasePolicyToExamVisibility({
          mode: answerReleaseMode,
          releaseTime: answerReleaseTime,
        });
      } catch (error) {
        const errorMessageByCode = {
          [ANSWER_RELEASE_POLICY_ERROR.RELEASE_TIME_REQUIRED]: trans(
            "global.selectCorrectAnswerReleaseTime",
            "请选择正确答案公开时间",
          ),
          [ANSWER_RELEASE_POLICY_ERROR.RELEASE_TIME_NOT_FUTURE]: trans(
            "global.correctAnswerReleaseTimeMustBeFuture",
            "正确答案公开时间必须晚于当前时间",
          ),
        };
        return message.error(
          errorMessageByCode[error.message] ||
            trans(
              "global.invalidCorrectAnswerReleasePolicy",
              "正确答案公开设置无效",
            ),
        );
      }
      this.setState({
        onOKLoding: true,
      });
      const createBody = {
        examName, //试卷名称
        examAlias,
        examType, //试卷类型
        subjectId, //学科id
        courseId, //课程id
        examIllustrate, //测验说明
        iFAssociateLessonId, //日课开关
        lessonId: lessonId && lessonId[1] ? lessonId[1] : null, //日课id
        iFNeedAppraise, //评价开关
        // total, //总分
        // evaluationCriterionId, //学生显示
        // evaluationCategoryId, //评价维度id
        // evaluationItemId,
        paperId,
        examId: id ? id : null,
        origin: 3,
        distributionType: 1,
        taskId,
        openScore,
        answerTime,
        forceSubmit: Boolean(forceSubmit),
        // weights,
        ...answerVisibility,
      };
      return this.createOrUpdateExam(createBody, id);
    } else if (tabKey === 2) {
      return this.publishExamToStudents({
        deadTime,
        evaluationItemId,
        lessonId,
        paperId,
        publishTime,
        taskId,
      });
    } else {
      if (iFNeedAppraise) {
        if (!evaluationCourseId) {
          return message.error(
            trans("modalTest.selectTargetCourse", "请选择目标课程"),
          );
        }
        if (!evaluationCategoryId) {
          return message.error(
            trans("modalTest.selectEvaluationDimension", "请选择评价维度"),
          );
        }
        if (!total) {
          return message.error(
            trans("modalOnlineTest.enterTotalScore", "请输入总分"),
          );
        }
        if (!evaluationCriterionId && evaluationCriterionId === undefined) {
          return message.error(
            trans("modalTest.selectStudentDisplay", "请选择学生显示"),
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
              // 后加入的二级评价维度，但是参数还是用的一级的参数，判断是否选中了二级评价维度，选中了传二级评价维度。
              evaluationCategoryId: childEvaluationCategoryId
                ? childEvaluationCategoryId
                : evaluationCategoryId,
              evaluationCriterionId,
              total,
              weights,
              evaluationCourseId,
            },
          ],
        }).then((res) => {
          this.setState({
            onOKLoding: false,
          });
          if (res.status) {
            options.onOk({
              action: "onlineTestConfirm",
              examId: id,
              taskId,
              published: true,
            });
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
            options.onOk({
              action: "onlineTestConfirm",
              examId: id,
              taskId,
              published: true,
            });
          } else {
            message.error(res.message);
          }
        });
      }
    }
  };

  onCancel = () => {
    const { options } = this.props.modalOnlineTestProps;
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

          // // 根据年级获取学科数据
          // this.props.dispatch({
          //     type: "home/getSubjectByStage",
          //     payload: {
          //         gradeIdList: gradeIdList
          //     }
          // })

          // 根据学科id获取课程
          this.props.dispatch({
            type: "publishToStudent/getCourseList",
            payload: {
              subjectId: subjectId,
            },
          });

          const defaultContext = this.getDefaultLessonContext();
          const canUseDefaultCourse =
            hasDefaultValue(defaultContext.courseId) &&
            (!hasDefaultValue(defaultContext.subjectId) ||
              String(defaultContext.subjectId) === String(subjectId));
          const defaultExamName =
            defaultContext.examName || this.state.examName;
          const nextState = {
            subjectId,
            examName: defaultExamName || examPaperName,
            examType,
            // gradeIdList: gradeIdList || [],
            total: totalScore,
          };

          if (canUseDefaultCourse) {
            nextState.courseId = defaultContext.courseId;
            nextState.courseIdList = [defaultContext.courseId];
            nextState.evaluationCourseId = defaultContext.courseId;
          }

          if (
            canUseDefaultCourse &&
            hasDefaultValue(defaultContext.unitId) &&
            hasDefaultValue(defaultContext.lessonId)
          ) {
            nextState.iFAssociateLessonId = true;
            nextState.lessonId = [
              defaultContext.unitId,
              defaultContext.lessonId,
            ];
          }

          this.setState(nextState, () => {
            if (canUseDefaultCourse) {
              this.loadCourseRelatedData(defaultContext.courseId, {
                semesterId: defaultContext.semesterId,
              });
            }
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
      this.loadCourseRelatedData(value);
      // // 根据课程获取所有班级学生
      // this.props.dispatch({
      //     type: "publishToStudent/getCourseStudents",
      //     payload: {
      //         courseId: val,
      //     },
      // });
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

  // 选择评价维度
  changeEvaluationDimension = (value) => {
    this.clearLink("evaluationCategoryId", () => {
      this.setState({
        evaluationCategoryId: value,
        evaluationItemId: [0], // 默认为新建评价项
      });

      let result = this.props.evaluateList.find((item) => item.id == value);
      let list = result ? result.childrenList : [];

      if (list && list.length > 0) {
        this.setState({
          childrenEvaluateList: list,
        });
      } else {
        this.setState({
          childrenEvaluateList: [],
        });
        // 根据评价维度获取评价项
        this.props.dispatch({
          type: "home/getEvaluationItemListByCategoryId",
          payload: {
            evaluationCategoryId: value,
          },
        });
      }
    });
  };

  // 选择子评价维度
  changeChildEvaluationDimension = (value) => {
    this.clearLink("childEvaluationCategoryId", () => {
      this.setState({
        childEvaluationCategoryId: value,
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
  deadTimeChange = (dateString) => {
    console.log(dateString);
    this.setState({
      deadTime: dateString,
    });
  };

  // 搜索
  // searchStuName = (e) => {
  //     const { courseId, lessonId } = this.state;
  //     if (lessonId) {
  //         if (lessonId.length == 2) {
  //             this.props.dispatch({
  //                 type: "publishToStudent/getGroupList",
  //                 payload: {
  //                     courseId: courseId,
  //                     unitId: lessonId[0],
  //                     activityId: lessonId[1],
  //                     matchName: e.target.value,
  //                 },
  //             });
  //         } else {
  //             queryCourseStudents({
  //                 courseId: courseId,
  //                 matchName: e.target.value,
  //             }).then(response => {
  //                 if (response.status) {
  //                     this.setState({
  //                         groupList: response.content || []
  //                     }, () => {
  //                         let list = this.updateDisabledStudents()
  //                         this.setState({
  //                             classStudentData: list,
  //                         })
  //                     })
  //                 } else {
  //                     message.error(response.message);
  //                 }
  //             })
  //         }
  //     } else {
  //         // 根据课程获取所有班级学生
  //         queryCourseStudents({
  //             courseId: courseId,
  //             matchName: e.target.value,
  //         }).then(response => {
  //             if (response.status) {
  //                 this.setState({
  //                     groupList: response.content || []
  //                 }, () => {
  //                     let list = this.updateDisabledStudents()
  //                     this.setState({
  //                         classStudentData: list,
  //                     })
  //                 })
  //             } else {
  //                 message.error(response.message);
  //             }
  //         })
  //         // this.props.dispatch({
  //         //     type: "publishToStudent/getCourseStudents",
  //         //     payload: {
  //         //         courseId: courseId,
  //         //         matchName: e.target.value,
  //         //     },
  //         // });
  //     }
  // };

  changeStuName = (e) => {
    this.setState({
      stuName: e.target.value,
    });
  };
  timedTaskChange = (time) => {
    this.setState({
      publishTime: time,
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
        childrenEvaluateList: [],
      });
      // 根据课程获取评价维度
      this.props.dispatch({
        type: "home/getSelectEvaluationCategoryByExample",
        payload: {
          courseId: value,
        },
      });
      this.getCriterionList(value);
    });
  };

  changeAnswerReleaseMode = (event) => {
    const answerReleaseMode = event.target.value;
    this.setState({
      answerReleaseMode,
      ...(answerReleaseMode === ANSWER_RELEASE_MODE.SCHEDULED
        ? {}
        : { answerReleaseTime: "" }),
    });
  };

  changeAnswerReleaseTime = (_value, answerReleaseTime) => {
    this.setState({ answerReleaseTime });
  };

  changeExamAliasName = (e) => {
    this.setState({
      examAlias: e.target.value,
    });
  };

  stuChange = (data) => {
    this.setState({
      classStudentData: data,
    });
  };

  changeDate = (date, dateString) => {
    console.log(dateString, "dateString");
    const { time } = this.state;
    this.setState(
      {
        day: dateString,
      },
      () => {
        this.deadTimeChange(`${dateString} ${time}`);
      },
    );
  };

  changeTime = (date, dateString) => {
    const { day } = this.state;
    this.setState(
      {
        time: dateString,
      },
      () => {
        this.deadTimeChange(`${day} ${dateString}`);
      },
    );
  };

  render() {
    const {
      paperList,
      tabKey,
      onOKLoding,
      examName,
      examType,
      subjectId,
      courseId,
      examIllustrate,
      iFAssociateLessonId,
      lessonId,
      iFNeedAppraise,
      total,
      evaluationCriterionId,
      evaluationCategoryId,
      evaluationItemId,
      hasTimeLimit,
      courseIdList,
      isEdit,
      examAlias,
      examAliasSwitch,
      paperId,
      examId,
      origin,
      distributionType,
      taskId,
      openScore,
      answerTime,
      forceSubmit,
      weights,
      answerReleaseMode,
      answerReleaseTime,
      deadTime,
      publishTime,
      evaluationCourseId,
      childEvaluationCategoryId,
    } = this.state;
    const {
      examTypeList,
      subjectListTest,
      courseList,
      evaluateList,
      evaluationItemList,
      criterionList,
      activityList,
      modalOnlineTestProps,
    } = this.props;
    const { options } = modalOnlineTestProps;
    const [day1, time1] = deadTime ? deadTime.split(" ") : ["", ""];

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
                        showSearch
                        placeholder={trans(
                          "global.selectDiscipline",
                          "选择学科",
                        )}
                        onChange={this.changeSubjectModal}
                        value={subjectId}
                        allowClear
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
                      options={this.getActivityListWithDefaultLesson(
                        activityList,
                      )}
                      onChange={this.changeDayClasses}
                      placeholder={trans("global.pleaseChoose", "请选择")}
                      value={lessonId}
                    />
                  </Form.Item>
                ) : null}

                <Row>
                  <Col span={8}>
                    <Form.Item
                      labelCol={{ span: 18 }}
                      wrapperCol={{ span: 6 }}
                      label={trans(
                        "global.scoreVisibleStudents",
                        "分数学生可见",
                      )}
                      className="lh21"
                    >
                      <Switch
                        size="small"
                        defaultChecked
                        onChange={this.changeScoreStuChecked}
                        checked={openScore}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label={trans("global.lengthAnswer", "作答时间")}
                  className="lh25"
                >
                  <Radio.Group
                    onChange={this.changeIsLengthAnswer}
                    value={hasTimeLimit}
                  >
                    <Radio value={0}>
                      <InputNumber
                        size="small"
                        onChange={this.changeLengthAnswerNum}
                        value={answerTime}
                        style={{ display: "inline-block" }}
                      />
                      &nbsp;
                      {trans("global.min", "分钟")}
                    </Radio>
                    <Radio value={1}>
                      {trans("global.unlimited", "不限时长")}
                    </Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item
                  label={trans("global.answerOvertime", "超时作答")}
                  className="lh21"
                >
                  <Radio.Group
                    onChange={this.onChangeIsAnswer}
                    value={forceSubmit}
                  >
                    <Radio value={0}>
                      {trans("global.stillAnswerQuestions", "仍可答题")}
                    </Radio>
                    <Radio value={1}>
                      {trans("global.stopAnsweringQuestions", "停止答题")}
                    </Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  label={trans(
                    "global.correctAnswerReleaseTime",
                    "正确答案公开时间",
                  )}
                  className="lh21"
                >
                  <Radio.Group
                    onChange={this.changeAnswerReleaseMode}
                    value={answerReleaseMode}
                  >
                    <Radio value={ANSWER_RELEASE_MODE.IMMEDIATE}>
                      {trans(
                        "global.visibleImmediatelyUponSubmission",
                        "学生提交后立即可见",
                      )}
                    </Radio>
                    <Radio value={ANSWER_RELEASE_MODE.SCHEDULED}>
                      {trans("global.designatedTime", "指定公开时间")}
                    </Radio>
                    <Radio value={ANSWER_RELEASE_MODE.NEVER}>
                      {trans("global.neverVisible", "不可见")}
                    </Radio>
                  </Radio.Group>
                  {answerReleaseMode === ANSWER_RELEASE_MODE.SCHEDULED ? (
                    <div style={{ marginTop: "10px" }}>
                      <DatePicker
                        showTime={{ format: "HH:mm" }}
                        format={RELEASE_TIME_FORMAT}
                        style={{ height: "36px" }}
                        value={
                          answerReleaseTime
                            ? moment(answerReleaseTime, RELEASE_TIME_FORMAT)
                            : null
                        }
                        onChange={this.changeAnswerReleaseTime}
                      />
                    </div>
                  ) : null}
                </Form.Item>

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
                      {trans("global.deadline", "截止时间")}
                    </span>
                    <div style={{ marginRight: 8, width: "130px" }}>
                      <DatePicker
                        onChange={this.changeDate}
                        format="YYYY-MM-DD"
                        defaultValue={day1 ? moment(day1, "YYYY-MM-DD") : null}
                      />
                    </div>

                    <div style={{ marginRight: 8, width: "80px" }}>
                      <TimePicker
                        defaultValue={time1 ? moment(time1, "HH:mm") : null}
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
                        // onSearch={this.searchStuName}
                        onChange={this.changeStuName}
                        value={this.state.stuName}
                      />
                    </div>
                  </div>

                  <SelectStu
                    searchKey={this.state.stuName}
                    groupList={this.state.classStudentData}
                    onSelectChange={this.stuChange}
                  />

                  <TimedTask
                    onChange={this.timedTaskChange}
                    value={publishTime}
                    style={{ position: "absolute", bottom: "0", left: "0" }}
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

                  {this.state.childrenEvaluateList &&
                  this.state.childrenEvaluateList.length > 0 ? (
                    <Row>
                      <Col span={24}>
                        <Form.Item
                          label={`${trans("global.subDimension", "子维度")}`}
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
                            onChange={this.changeChildEvaluationDimension}
                            value={childEvaluationCategoryId}
                            filterOption={(input, option) => {
                              return (
                                option.props.children
                                  ?.toLowerCase()
                                  .indexOf(input.toLowerCase()) >= 0
                              );
                            }}
                          >
                            {this.state.childrenEvaluateList.map((item) => (
                              <Option value={item.id} key={item.id}>
                                {item.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  ) : null}

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
}))(Form.create()(ModalOnlineTest));

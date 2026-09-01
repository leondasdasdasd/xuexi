//新闻
import React, { Fragment, PureComponent } from "react";
import {
  Button,
  Dropdown,
  Icon,
  Input,
  InputNumber,
  Menu,
  message,
  Modal,
  Popconfirm,
  Popover,
  Select,
  Switch,
  Tabs,
  Tooltip,
  TreeSelect,
} from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import pathToRegexp from "path-to-regexp";
import { QRCodeSVG } from "qrcode.react";
import { DraggableAreasGroup } from "react-draggable-tags";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

import ModalOnlineTest from "components/ModalOnlineTest";

import DetailView from "../../components/DetailView/index";
import FileUploadModal from "../../components/FileUploadModal";
import ModalMachineTest from "../../components/ModalMachineTest";
import ModalTest from "../../components/ModalTest";
import StudyActivity from "../../components/PublishToStudents/StudyActivity/index";
import QuestionEntryEditor from "../../components/QuestionEntryEditor";
import { createEmptyQuestionDraft } from "../../components/QuestionEntryEditor/questionEntryModel";
import { updateItem as queryQuestionDetail } from "../../services/example";
import {
  updateQuestionChapter,
  updateQuestionIndicator,
} from "../../services/global";
import { importQuestion as saveQuestionBatch } from "../../services/inputQuestion";
import {
  getPaperPrivateStatus,
  updatePaperPrivateStatus,
  updateQuestionScore,
} from "../../services/paper";
import { trans } from "../../utils/i18n";
import {
  convertToChineseNumber,
  getPageQuery,
  loginRedirect,
} from "../../utils/utils";
import { downloadExamPaperPdf } from "../PaperEditor/paperPdf";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const group = new DraggableAreasGroup();
const DraggableArea1 = group.addArea("1");
const DraggableArea2 = group.addArea("2");
const DraggableArea3 = group.addArea("3");
const DraggableArea4 = group.addArea("4");
const DraggableArea5 = group.addArea("5");
const DraggableArea6 = group.addArea("6");
const DraggableArea7 = group.addArea("7");
const DraggableArea8 = group.addArea("8");
const DraggableArea9 = group.addArea();
const DraggableArea10 = group.addArea();
const DraggableArea11 = group.addArea();
const DraggableArea12 = group.addArea();
const DraggableArea13 = group.addArea();
const DraggableArea14 = group.addArea();
const DraggableArea15 = group.addArea();

const { Option } = Select;

const { SHOW_PARENT } = TreeSelect;
const RECRUIT_ADMISSION_TYPE = 20;
const QUESTION_TYPE_NAME_MAP = {
  1: trans("global.radio", "单选题"),
  2: trans("global.check", "多选题"),
  3: trans("global.pack", "填空题"),
  4: trans("global.judge", "判断题"),
  5: trans("global.ask", "问答题"),
  6: trans("global.combination", "组合题"),
  7: trans("global.singleVote", "单选投票题"),
  8: trans("global.multipleVote", "多选投票题"),
};

const hasQueryValue = (value) =>
  value !== undefined && value !== null && value !== "";

const normalizeQueryValue = (value) => {
  const currentValue = Array.isArray(value) ? value[0] : value;
  if (!hasQueryValue(currentValue)) {
    return;
  }
  const text = String(currentValue);
  return /^-?\d+$/.test(text) ? Number(text) : currentValue;
};

const toSafeArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(hasQueryValue);
  }
  return hasQueryValue(value) ? [value] : [];
};

const normalizeIdListForSave = (value) =>
  [...new Set(toSafeArray(value).map(normalizeQueryValue))].filter(
    hasQueryValue,
  );

const getQuestionTypeName = (type) =>
  QUESTION_TYPE_NAME_MAP[Number(type)] || trans("global.ask", "问答题");

const normalizeScore = (value) => {
  const score = Number(value);
  return Number.isFinite(score) && score > 0 ? score : null;
};

const getModuleListScore = (moduleList) =>
  toSafeArray(moduleList).reduce(
    (total, moduleItem) => total + (Number(moduleItem.moduleScore) || 0),
    0,
  );

@connect((state) => ({
  exampleId: state.home.exampleId,
}))
class Detail extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp(
      "/detail/:ifView/:ifTest/:testId/:paperId?/:individualization?/:isAutoJump?",
    ).exec(this.url);
    this.reload = false;
    // ifView：是否「预览/查看」模式（true=预览，false=编辑）
    this.ifView = JSON.parse(this.pathMatch[1]);
    // ifTest：维度是否为「具体试卷」（true=试卷维度，false=题库/学科维度）
    this.ifTest = JSON.parse(this.pathMatch[2]);
    // testId：ifTest=false 时当 subjectId 用；ifTest=true 时作为 paperId 的兜底
    this.testId = Number.parseInt(this.pathMatch[3], 10);

    // paperId / individualization / isAutoJump：个性化试卷 id、个性化标记、上传后自动跳转标记
    this.paperId = this.pathMatch[4]
      ? Number.parseInt(this.pathMatch[4], 10)
      : null;

    this.individualization = this.pathMatch[5]
      ? JSON.parse(this.pathMatch[5])
      : null;
    this.isAutoJump = this.pathMatch[6] ? JSON.parse(this.pathMatch[6]) : null;
    this.state = {
      testName: "",
      deleteList: [],
      detaiList: [],
      viewData: {},
      ifEdit: true,
      stageId: undefined,
      gradeId: undefined,
      subjectId: undefined,
      submitStatus: false,
      checkQuestionId: null,
      deleteStatus: false,
      publishStatus: false,
      exampleId: null, //试卷id
      type: undefined, //类型
      test: undefined,
      scoreValue: 0,
      countScoreViesble: false,
      itemScore: null,
      itemscoreValue: 0,
      itemNameValue: "",
      blurTitle: false,
      arr: [],
      QRcode: false,
      checkTab: 0,
      itemNameAddViesble: false,
      freedomList: [],
      asd: [],
      allDetaiList: [],
      detaiListFreedom: [],
      key: null,
      isPop1: false,
      isPop2: false,
      isEdit: false,
      isAnalysis: false,
      isAnswer: false,
      privateStatus: false,
      modalTestOptions: {
        visible: false,
        title: trans("global.initiateTest", "发起测验"),
        onOk: () => {
          const { modalTestOptions } = this.state;
          this.setState({
            modalTestOptions: {
              ...modalTestOptions,
              visible: true,
            },
          });
        },
        onCancel: () => {
          const { modalTestOptions } = this.state;
          this.setState({
            modalTestOptions: {
              ...modalTestOptions,
              visible: false,
            },
          });
        },
      },
      modalTestProps: {
        clickLaunchOnline: this.clickLaunchOnline,
        clickMachine: this.dispatchMachine,
        clickTestPaperOnline: this.clickTestPaperOnline,
        clickDownloadTestPaper: this.clickDownloadTestPaper,
        isSegmentation: null, //是否能够发起机阅测验
      },
      machineTestOptions: {
        visible: false,
        title: trans("global.initiateMachine", "发起机阅测验"),
        wrapClassName: "modalMachineTest",
        width: 700,
        onOk: () => {
          const { machineTestOptions } = this.state;
          this.setState({
            machineTestOptions: {
              ...machineTestOptions,
              visible: false,
            },
          });
        },
        onCancel: () => {
          const { machineTestOptions } = this.state;
          this.setState({
            machineTestOptions: {
              ...machineTestOptions,
              visible: false,
            },
          });
        },
      },
      modalOnlineTestOptions: {
        visible: false,
        width: 700,
        title: trans("global.launchOnlineQuiz", "发起线上测验"),
      },
      modalOnlineTestProps: {
        paperId: "",
      },
      modalMachineTestProps: {
        paperId: null,
      },
      isLeftContentVisible: false,
      isChecked: false,
      questionEditorVisible: false,
      questionEditorDraft: null,
      questionEditorSaving: false,
    };
    this.child = null;
    this.canSubmit = true;
    this.blankPaperSubjectLoadedFor = null;
    this.blankPaperAttributeLoadedFor = null;
  }

  /**
   * 判断当前页面是否处于招生题库组卷模式。
   * @returns {boolean} true 表示当前组卷页来源于招生题库入口
   */
  isRecruitQuestionMode = () => {
    const query = getPageQuery();
    if (String(query.queryZhaoShengQuestion) === "true") {
      return true;
    }
    const search = this.props.location && this.props.location.search;
    return search ? search.includes("queryZhaoShengQuestion=true") : false;
  };

  /**
   * 判断当前页面是否处于招生试卷模式。
   * @returns {boolean} true 表示当前试卷属于招生入学测试
   */
  isRecruitPaperMode = () => {
    return (
      this.isRecruitQuestionMode() ||
      !!(this.props.viewData && this.props.viewData.zhaoShengPaper)
    );
  };

  /**
   * 根据当前招生模式返回试卷类型，招生试卷固定为入学评估。
   * @returns {number|undefined} 当前页面应保存的试卷类型
   */
  getPaperType = () => {
    if (this.isRecruitPaperMode()) {
      return RECRUIT_ADMISSION_TYPE;
    }
    return this.individualization ? 10 : this.props.viewData.type;
  };

  /**
   * 获取招生类型展示名称，类型列表未返回时使用固定文案兜底。
   * @returns {string} 招生类型名称
   */
  getRecruitPaperTypeName = () => {
    const { typeList } = this.props;
    const recruitType =
      typeList && typeList.find((item) => item.code === RECRUIT_ADMISSION_TYPE);
    return recruitType
      ? recruitType.typeName
      : trans("global.admissionAssessment", "入学评估");
  };

  getBlankPaperContext = () => {
    const query = getPageQuery() || {};
    return {
      blankPaper: query.blankPaper,
      source: query.source,
      courseId: normalizeQueryValue(query.courseId),
      lessonId: normalizeQueryValue(query.lessonId),
      unitId: normalizeQueryValue(query.unitId),
      semesterId: normalizeQueryValue(query.semesterId),
      gradeId: normalizeQueryValue(query.gradeId),
      subjectId: normalizeQueryValue(query.subjectId),
      lessonTitle: Array.isArray(query.lessonTitle)
        ? query.lessonTitle[0]
        : query.lessonTitle,
      examName: Array.isArray(query.examName)
        ? query.examName[0]
        : query.examName,
    };
  };

  isBlankPaperMode = () => {
    const { blankPaper } = this.getBlankPaperContext();
    return String(blankPaper) === "1";
  };

  /**
   * 组卷预览请求补充招生题库参数。
   * @param {object} payload 原始请求参数
   * @returns {object} 合并招生参数后的请求参数
   */
  getRecruitViewPayload = (payload = {}) => {
    if (!this.isRecruitQuestionMode()) {
      return payload;
    }
    return {
      ...payload,
      zhaoShengQuestion: true,
    };
  };

  /**
   * 组卷保存请求补充招生试卷参数。
   * @param {object} payload 原始请求参数
   * @returns {object} 合并招生参数后的请求参数
   */
  getRecruitPaperPayload = (payload = {}) => {
    if (!this.isRecruitPaperMode()) {
      return payload;
    }
    return {
      ...payload,
      type: RECRUIT_ADMISSION_TYPE,
      zhaoShengPaper: true,
    };
  };

  /**
   * 录题保存时补充招生题库上下文。
   * @param {object} payload 原始请求参数
   * @returns {object} 合并招生参数后的请求参数
   */
  getRecruitQuestionPayload = (payload = {}) => {
    if (!this.isRecruitQuestionMode()) {
      return payload;
    }
    return {
      ...payload,
      saveZhaoShengQuestion: true,
    };
  };

  componentDidMount() {
    // 以下基础数据（年级列表、试卷类型列表、学期信息）无论是否空白试卷模式都需要优先加载，
    // 空白试卷的年级/类型/学期选择器同样依赖这些数据
    // 获取年级列表
    this.props.dispatch({
      type: "inputQuestion/getAllGradeList",
    });

    // 获取试卷类型列表（加载完成后由 componentDidUpdate 监听 typeList 变化补默认值）
    this.props.dispatch({
      type: "home/getPaperTypeList",
      payload: {
        type: 0,
        queryZhaoShengPaper: this.isRecruitQuestionMode(),
      },
    });

    // 获取当前学期信息
    this.props.dispatch({
      type: "home/getSemesterInfo",
    });

    // 是否空白试卷模式
    // 场景：从日课平台跳转过来的空白试卷模式
    if (this.isBlankPaperMode()) {
      this.setState(
        {
          ifEdit: !(this.ifView && this.ifTest),
          type: this.state.type || 1,
        },
        () => {
          this.applyBlankPaperDefaults();
        },
      );
      window.parent.postMessage("padding", "*");
      return;
    }

    this.setState({
      ifEdit: !(this.ifView && this.ifTest),
    });

    this.props.dispatch({
      type: "home/queryYear",
    });

    this.props.dispatch({
      type: "global/getStage",
    });

    if (this.ifTest || this.paperId) {
      getPaperPrivateStatus({
        paperId: this.paperId || this.testId,
      }).then((res) => {
        if (res.status) {
          this.setState({
            privateStatus: res.content,
          });
        }
      });
    }
    // 是否「预览/查看」
    if (this.ifView) {
      // 维度是否为「具体试卷」（true=试卷维度，false=题库/学科维度）
      if (this.ifTest) {
        // 试卷预览/试卷编辑
        this.props
          .dispatch({
            type: "home/getTestView",
            payload: {
              paperId: this.paperId || this.testId,
            },
          })
          .then(
            () => {
              this.setState(
                {
                  detaiList: this.props.viewData.moduleList || [],
                  viewData: this.props.viewData,
                  stageId: this.props.viewData.yearPeriodId,
                  gradeId: this.props.viewData.gradeId,
                  subjectId: this.props.viewData.subjectId,
                  type: this.getPaperType(),
                  test: this.individualization
                    ? this.paperId
                    : this.props.viewData.personalizedPaperId,
                  key: 1,
                },
                () => {
                  this.changeGetTree();
                  this.getLabel();
                  this.getChapter();
                },
              );
            },
            () => {
              this.props.dispatch({
                type: "global/getSubject",
                payload: {
                  gradeId: this.state.gradeId,
                },
              });
            },
          );
      } else {
        this.props
          .dispatch({
            type: "home/getView",
            payload: this.getRecruitViewPayload({
              subjectId: this.testId,
            }),
          })
          .then(() => {
            let allDetaiList = [];
            let newState = JSON.parse(JSON.stringify(this.state));
            if (
              this.props.viewData &&
              this.props.viewData.moduleList.length > 0
            ) {
              this.props.viewData.moduleList.map((item) => {
                allDetaiList = [...allDetaiList, ...item.questionList];
              });
            }

            let newArrayQuestion = [];
            if (allDetaiList.length > 0) {
              allDetaiList.map((item, index) => {
                newArrayQuestion.push({
                  data: item,
                  id: item.questionId,
                  content: (
                    <span
                      className={styles.optionBox}
                      style={
                        this.state.checkQuestionId == item.questionId
                          ? { border: "1px solid rgba(2,88,191,1)" }
                          : null
                      }
                      id={`itemScoreViesble${item.questionId}`}
                    >
                      {index + 1}
                    </span>
                  ),
                });
              });
            }

            let newArray = [];
            if (
              this.props.viewData &&
              this.props.viewData.moduleList.length > 0
            ) {
              this.props.viewData.moduleList.map((item) => {
                if (item.moduleType == 0) {
                  newArray.push(item);
                }
              });
            }

            let number_ = 0;
            if (newArray && newArray.length > 0) {
              newArray.map((item, index) => {
                let array = [];
                item.questionList.length > 0 &&
                  item.questionList.map((it, ind) => {
                    number_ += 1;

                    array.push({
                      data: it,
                      id: it.questionId,
                      content: (
                        <span
                          className={styles.optionBox}
                          style={
                            this.state.checkQuestionId == it.questionId
                              ? { border: "1px solid rgba(2,88,191,1)" }
                              : null
                          }
                          id={`itemScoreViesble${it.questionId}`}
                        >
                          {ind + 1}
                        </span>
                      ),
                    });
                  });
                newState[`tagList${index + 1}`] = array;
              });
            }

            let firstItem =
              this.props.viewData.moduleList.length > 0
                ? this.props.viewData.moduleList[0]
                : {};
            this.setState(
              {
                ...newState,
                freedomList: newArray,
                asd: newArrayQuestion,
                detaiList: this.props.viewData.moduleList || [],
                viewData: this.props.viewData,
                subjectId: this.props.viewData.subjectId,
                gradeId: firstItem.gradeId,
                allDetaiList,
                type: this.isRecruitQuestionMode()
                  ? RECRUIT_ADMISSION_TYPE
                  : this.state.type,
                key: firstItem.moduleType == 0 ? 2 : 1,
              },
              () => {
                this.callback(this.state.key);
                this.changeGetTree();
                this.getLabel();
                this.getChapter();
              },
            );

            if (this.paperId) {
              this.props
                .dispatch({
                  type: "home/getExam",
                  payload: {
                    pageNo: 1,
                    limit: 100,
                    examName: null,
                    examTypeCode:
                      this.props.viewData.type === 0
                        ? ""
                        : this.props.viewData.type,
                    subjectId: this.props.viewData.subjectId,
                    gradeId: this.state.gradeId,
                    semesterId: this.props.currentSemester.id,
                  },
                })
                .then(() => {
                  this.setState(
                    {
                      type: 10,
                      test: this.paperId,
                    },
                    () => {
                      this.props
                        .dispatch({
                          type: "home/getpersonal",
                          payload: {
                            personalizedPaperId: this.paperId,
                            subjectId: this.props.viewData.subjectId,
                            gradeId: this.props.viewData.gradeId,
                          },
                        })
                        .then(() => {
                          if (
                            this.props.personalList &&
                            this.props.personalList.length > 0
                          ) {
                            this.child &&
                              this.child.setList(this.props.personalList);
                            this.setState(
                              {
                                detaiList: this.props.personalList,
                              },
                              () => {
                                this.props.dispatch({
                                  type: "home/clearPersonal",
                                });
                              },
                            );
                          }
                        });
                    },
                  );
                });
            }
          });
      }
    } else {
      // 维度是否为「具体试卷」（true=试卷维度，false=题库/学科维度）
      if (this.ifTest) {
        this.initData();
      }
    }

    window.parent.postMessage("padding", "*");
  }

  componentDidUpdate(previousProperties) {
    if (
      previousProperties.typeList !== this.props.typeList ||
      previousProperties.subjectList !== this.props.subjectList
    ) {
      this.applyBlankPaperDefaults();
    }
  }

  applyBlankPaperDefaults = () => {
    if (!this.isBlankPaperMode()) {
      return;
    }
    const { gradeId, subjectId, lessonTitle, examName } =
      this.getBlankPaperContext();
    const typeList = this.props.typeList || [];
    const nextState = {};

    if (hasQueryValue(gradeId) && !hasQueryValue(this.state.gradeId)) {
      nextState.gradeId = gradeId;
    }
    if (hasQueryValue(subjectId) && !hasQueryValue(this.state.subjectId)) {
      nextState.subjectId = subjectId;
    }
    if ((examName || lessonTitle) && !this.state.testName) {
      nextState.testName = examName || `${lessonTitle}测验`;
    }
    if (!hasQueryValue(this.state.type) && typeList.length > 0) {
      nextState.type = typeList[0].code;
    }
    if (!hasQueryValue(this.state.key)) {
      nextState.key = 1;
    }
    // 空白试卷不再注入占位题目，直接沿用当前已有模块（可能为空）
    const currentDetailList = this.state.detaiList || [];
    const currentDetailHasQuestions = toSafeArray(currentDetailList).some(
      (item) => toSafeArray(item.questionList).length > 0,
    );

    const nextGradeId = hasQueryValue(nextState.gradeId)
      ? nextState.gradeId
      : this.state.gradeId;
    const nextSubjectId = hasQueryValue(nextState.subjectId)
      ? nextState.subjectId
      : this.state.subjectId;
    const nextTitle = nextState.testName || this.state.testName || "";
    nextState.viewData = {
      ...this.state.viewData,
      title: nextTitle,
      gradeId: nextGradeId,
      subjectId: nextSubjectId,
      totalScore:
        this.state.viewData.totalScore || getModuleListScore(currentDetailList),
      moduleList: currentDetailList,
    };

    const afterApply = () => {
      // 已有题目时无需重复加载题库树，仅在空白时加载以便用户挑题
      if (currentDetailHasQuestions) {
        return;
      }
      const currentGradeId = this.state.gradeId;
      const currentSubjectId = this.state.subjectId;
      if (
        hasQueryValue(currentGradeId) &&
        this.blankPaperSubjectLoadedFor !== currentGradeId
      ) {
        this.blankPaperSubjectLoadedFor = currentGradeId;
        this.props.dispatch({
          type: "global/getSubject",
          payload: {
            gradeId: currentGradeId,
          },
        });
      }
      const attributeKey = `${currentGradeId}-${currentSubjectId}`;
      if (
        hasQueryValue(currentGradeId) &&
        hasQueryValue(currentSubjectId) &&
        this.blankPaperAttributeLoadedFor !== attributeKey
      ) {
        this.blankPaperAttributeLoadedFor = attributeKey;
        this.changeGetTree();
        this.getLabel();
        this.getChapter();
      }
    };

    if (Object.keys(nextState).length > 0) {
      this.setState(nextState, afterApply);
    } else {
      afterApply();
    }
  };

  initData = () => {
    this.props
      .dispatch({
        type: "home/getTestView",
        payload: {
          paperId: this.paperId || this.testId,
        },
      })
      .then(() => {
        let allDetaiList = [];
        let newState = JSON.parse(JSON.stringify(this.state));

        if (
          this.props.viewData &&
          Array.isArray(this.props.viewData.moduleList)
        ) {
          this.props.viewData.moduleList.map((item) => {
            allDetaiList = [...allDetaiList, ...item.questionList];
          });
        }

        //bugFIx：【试卷管理/预览/右上角编辑/保存】：未传给后端paperId
        if (!this.paperId) {
          this.paperId = this.props.viewData.paperId;
        }

        let newArrayQuestion = [];
        if (allDetaiList.length > 0) {
          allDetaiList.map((item, index) => {
            newArrayQuestion.push({
              data: item,
              id: item.questionId,
              content: (
                <span
                  className={styles.optionBox}
                  style={
                    this.state.checkQuestionId == item.questionId
                      ? { border: "1px solid rgba(2,88,191,1)" }
                      : null
                  }
                  id={`itemScoreViesble${item.questionId}`}
                >
                  {index + 1}
                </span>
              ),
            });
          });
        }

        let newArray = [];
        if (
          this.props.viewData &&
          Array.isArray(this.props.viewData.moduleList)
        ) {
          this.props.viewData.moduleList.map((item) => {
            if (item.moduleType == 0) {
              newArray.push(item);
            }
          });
        }

        let number_ = 0;
        if (newArray && newArray.length > 0) {
          newArray.map((item, index) => {
            let array = [];
            item.questionList.length > 0 &&
              item.questionList.map((it, ind) => {
                number_ = number_ + 1;
                array.push({
                  data: it,
                  id: it.questionId,
                  content: (
                    <span
                      className={styles.optionBox}
                      style={
                        this.state.checkQuestionId == it.questionId
                          ? { border: "1px solid rgba(2,88,191,1)" }
                          : null
                      }
                      id={`itemScoreViesble${it.questionId}`}
                      key={`itemScoreViesble${it.questionId}`}
                    >
                      {number_}
                    </span>
                  ),
                });
              });
            newState[`tagList${index + 1}`] = array;
          });
        }
        const moduleList = this.props.viewData.moduleList || [];
        const firstItem = moduleList.length > 0 ? moduleList[0] : {};

        this.setState(
          {
            ...newState,
            detaiList: this.props.viewData.moduleList || [],
            viewData: this.props.viewData,
            stageId: this.props.viewData.yearPeriodId,
            gradeId: this.props.viewData.gradeId,
            subjectId: this.props.viewData.subjectId,
            testName: this.props.viewData.title,
            type: this.getPaperType(),
            test: this.individualization
              ? this.paperId
              : this.props.viewData.personalizedPaperId,
            freedomList: newArray,
            asd: newArrayQuestion,
            allDetaiList,
            key: firstItem.moduleType == 0 ? 2 : 1,
            isEdit: firstItem.moduleType == 0 ? true : false,
          },
          () => {
            this.callback(this.state.key, "bj");
            this.changeGetTree();
            this.getLabel();
            this.getChapter();
            this.props.dispatch({
              type: "home/getExam",
              payload: {
                pageNo: 1,
                limit: 100,
                examName: null,
                examTypeCode:
                  this.props.viewData.type === 0
                    ? ""
                    : this.props.viewData.type,
                subjectId: this.props.viewData.subjectId,
                gradeId: this.state.gradeId,
                semesterId: this.props.currentSemester.id,
              },
            });
            this.props.dispatch({
              type: "global/getSubject",
              payload: {
                gradeId: this.state.gradeId,
              },
            });
          },
        );
      });
  };

  clickDownloadTestPaper = () => {
    console.log(this.props.viewData);
    const { paperId } = this.props.viewData;
    this.props
      .dispatch({
        type: "home/getViewOrDownPaper",
        payload: {
          paperId: paperId,
        },
      })
      .then(() => {
        if (this.props.viewOrDownPaper.url) {
          window.open(this.props.viewOrDownPaper.url);
        } else {
          void downloadExamPaperPdf({ paperId });
        }
      });
  };

  dispatchMachine = () => {
    const { machineTestOptions, modalTestProps, modalMachineTestProps } =
      this.state;
    if (modalTestProps.isSegmentation) {
      this.setState({
        machineTestOptions: {
          ...machineTestOptions,
          visible: true,
        },
        modalMachineTestProps: {
          ...modalMachineTestProps,
          paperId: this.props.viewData.paperId,
        },
      });
    }
  };

  renderFreed = (data) => {
    let allDetaiList = [];
    let newState = JSON.parse(JSON.stringify(this.state));
    data.length > 0 &&
      data.map((item) => {
        allDetaiList = [...allDetaiList, ...item.questionList];
      });
    let newArrayQuestion = [];
    allDetaiList.length > 0 &&
      allDetaiList.map((item, index) => {
        newArrayQuestion.push({
          data: item,
          id: item.questionId,
          content: (
            <span
              className={[styles.optionBox].join(" ")}
              style={
                this.state.checkQuestionId == item.questionId
                  ? { border: "1px solid rgba(2,88,191,1)" }
                  : null
              }
              id={`itemScoreViesble${item.questionId}`}
            >
              {index + 1}
            </span>
          ),
        });
      });
    let newArray = [];
    this.state.freedomList.length > 0 &&
      this.state.freedomList.map((item) => {
        if (item.moduleType == 0) {
          newArray.push(item);
        }
      });
    newArray &&
      newArray.length > 0 &&
      newArray.map((item, index) => {
        let array = [];
        item.questionList.length > 0 &&
          item.questionList.map((it, ind) => {
            array.push({
              data: it,
              id: it.questionId,
              content: (
                <span
                  className={[styles.optionBox].join(" ")}
                  style={
                    this.state.checkQuestionId == it.questionId
                      ? { border: "1px solid rgba(2,88,191,1)" }
                      : null
                  }
                  id={`itemScoreViesble${it.questionId}`}
                >
                  {ind + 1}
                </span>
              ),
            });
          });
        newState[`tagList${index + 1}`] = array;
      });
    this.setState({
      ...newState,
      freedomList: newArray,
      asd: newArrayQuestion,
    });
  };

  //默认当前年份
  onRef = (reference) => {
    this.child = reference;
  };
  updateDeleteList = (item) => {
    let list = [...this.state.deleteList];
    list.push(item);
    this.setState({
      deleteList: list,
    });
  };
  updateList = (list) => {
    // console.log(this.state.key,'this.state.key');
    if (this.state.key == 1) {
      let view = Object.assign({}, this.state.viewData);
      let count = 0;
      if (list && list.length > 0) {
        list.map((item) => {
          if (item.questionList && item.questionList.length > 0) {
            item.questionList.map((index) => {
              count += index.questionScore ? index.questionScore : 0;
            });
          }
        });
      }
      view.totalScore = count;
      view.moduleList = list;
      this.setState(
        {
          detaiList: list,
          viewData: view,
        },
        () => {},
      );
    } else {
      let view = Object.assign({}, this.state.viewData);
      let count = 0;
      if (list && list.length > 0) {
        list.map((item) => {
          if (item.questionList && item.questionList.length > 0) {
            item.questionList.map((index) => {
              count += index.questionScore ? index.questionScore : 0;
            });
          }
        });
      }
      view.totalScore = count;
      view.moduleList = list;
      this.setState(
        {
          detaiListFreedom: list,
          viewData: view,
        },
        () => {
          const { isEdit, detaiListFreedom } = this.state;
          let newState = JSON.parse(JSON.stringify(this.state));
          const newAsd = [];
          if (isEdit) {
            detaiListFreedom.length > 0 &&
              detaiListFreedom.map((item, index) => {
                let array = [];
                item.questionList.length > 0 &&
                  item.questionList.map((it, ind) => {
                    array.push({
                      data: it,
                      id: it.questionId,
                      content: (
                        <span
                          className={[styles.optionBox].join(" ")}
                          style={
                            this.state.checkQuestionId == it.questionId
                              ? { border: "1px solid rgba(2,88,191,1)" }
                              : null
                          }
                          id={`itemScoreViesble${it.questionId}`}
                        >
                          {ind + 1}
                        </span>
                      ),
                    });
                  });
                newState[`tagList${index + 1}`] = array;
              });
          } else {
            detaiListFreedom.length > 0 &&
              detaiListFreedom.map((item, index) => {
                if (index == 0) {
                  item.questionList.length > 0 &&
                    item.questionList.map((it, ind) => {
                      newAsd.push({
                        data: it,
                        id: it.questionId,
                        content: (
                          <span
                            className={[styles.optionBox].join(" ")}
                            style={
                              this.state.checkQuestionId == it.questionId
                                ? { border: "1px solid rgba(2,88,191,1)" }
                                : null
                            }
                            id={`itemScoreViesble${it.questionId}`}
                          >
                            {ind + 1}
                          </span>
                        ),
                      });
                    });
                } else {
                  let array = [];
                  item.questionList.length > 0 &&
                    item.questionList.map((it, ind) => {
                      array.push({
                        data: it,
                        id: it.questionId,
                        content: (
                          <span
                            className={[styles.optionBox].join(" ")}
                            style={
                              this.state.checkQuestionId == it.questionId
                                ? { border: "1px solid rgba(2,88,191,1)" }
                                : null
                            }
                            id={`itemScoreViesble${it.questionId}`}
                          >
                            {ind + 1}
                          </span>
                        ),
                      });
                    });
                  newState[`tagList${index + 1}`] = array;
                }
              });
          }
          this.setState({
            ...newState,
            asd: newAsd,
          });
        },
      );
    }
  };
  ondragstart(event_) {
    let t = event_.target;
    console.log(t.parentNode.parentNode.parentNode.offsetLeft, "aa");
    event_.dataTransfer.setDragImage(t.parentNode.parentNode.parentNode, 0, 0);
    event_.dataTransfer.setData("text", t.id);
  }
  newDragStart(event_) {
    let t = event_.target;
    console.log(t.parentNode.parentNode.parentNode.offsetLeft, "aa");
    event_.dataTransfer.setDragImage(t, 0, 0);
    event_.dataTransfer.setData("text", t.id);
  }
  ondragover(event_) {
    event_.preventDefault();
  }
  newdragover(event_) {
    event_.preventDefault();
  }

  ondragenter(event_) {
    let t = event_.target.parentNode.parentNode.parentNode;
    t.style.opacity = 0.3;
    t.style.backgroundColor = "#333";
  }
  newdragenter(event_) {
    let t = event_.target;
    t.style.opacity = 0.3;
    t.style.backgroundColor = "#333";
  }

  ondragleave(event_) {
    let t = event_.target.parentNode.parentNode.parentNode;
    t.style.opacity = 1;
    t.style.backgroundColor = "#fff";
  }
  newdragleave(event_) {
    let t = event_.target;
    t.style.opacity = 1;
    t.style.backgroundColor = "#fff";
  }
  changeTestName = (e) => {
    this.setState({
      testName: e.target.value,
    });
  };
  refList = (item) => {
    let list = [...this.state.deleteList];
    list.map((it, index) => {
      if (it.questionId === item.questionId) {
        list.splice(index, 1);
      }
    });
    if (!list || list.length === 0) {
      this.setState({
        deleteStatus: false,
      });
    }
    this.setState({
      deleteList: list,
    });
    this.child.returnList(item);
  };
  ondrop = (event_) => {
    let d = event_.dataTransfer.getData("text"),
      target = event_.target,
      targetId = event_.target.id;

    target.parentNode.parentNode.parentNode.style.opacity = 1;
    target.parentNode.parentNode.parentNode.style.backgroundColor = "#fff";
    if (d !== targetId) {
      this.child.dropChange(d, targetId);
      this.dropChange(d, targetId);
    }
  };
  newdrop = (event_) => {
    console.log(event_);
    let d = event_.dataTransfer.getData("text"),
      target = event_.target,
      targetId = event_.target.id;
    console.log(event_, target, targetId, d);
    const newTarget = targetId.split("-");
    const newId = targetId.split("-");
    console.log(newTarget, newId, "new");
    if (newTarget[0] !== newId[0]) {
      return message.error(
        trans("teacherPreview.sameQuestionTypeMoveOnly", "请在相同体型内移动"),
      );
    }
    target.style.opacity = 1;
    target.style.backgroundColor = "#fff";
    if (d !== targetId) {
      this.child.dropChange(d, targetId);
      this.dropChange(d, targetId);
    }
  };
  dropChange = (sourceKey, targetKey) => {
    let source = Number.parseInt(sourceKey, 10);
    let target = Number.parseInt(targetKey, 10);
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    sourceKey < targetKey && targetKey++;
    fileList.splice(source, 0, ...fileList.splice(target, 1));
    console.log(fileList, "ff");
    this.setState({
      detaiList: fileList,
    });
    this.props.dispatch({
      type: "home/changeDrop",
      payload: fileList,
    });
  };
  dropQuestionChange = (index, sourceKey, targetKey) => {
    let newIndex = Number.parseInt(index, 10);
    let source = Number.parseInt(sourceKey, 10);
    let target = Number.parseInt(targetKey, 10);
    console.log(source, target, "lll");
    let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    let newList = fileList[index].questionList;
    sourceKey < targetKey && targetKey++;
    newList.splice(target, 0, ...newList.splice(source, 1));
    fileList[newIndex].questionList = newList;
    this.setState({
      detaiList: fileList,
    });
    console.log(fileList, "kkk");
    this.props.dispatch({
      type: "home/changeDrop",
      payload: fileList,
    });
  };
  changeStage = (value) => {
    this.setState(
      {
        stageId: value,
        gradeId: undefined,
      },
      () => {},
    );
  };
  changeGetTree = () => {
    this.props.dispatch({
      type: "inputQuestion/getTree",
      payload: {
        subjectId: this.state.subjectId,
        gradeId: this.state.gradeId,
      },
      onSuccess: (res) => {},
    });
  };
  getLabel = () => {
    this.props.dispatch({
      type: "inputQuestion/getLabel",
      payload: {
        subjectId: this.state.subjectId,
        gradeId: this.state.gradeId,
      },
    });
  };
  getChapter = () => {
    this.props.dispatch({
      type: "inputQuestion/getChapter",
      payload: {
        subjectId: this.state.subjectId,
        gradeId: this.state.gradeId,
        isSegmentation: true,
      },
    });
  };

  // 章节/知识点/素养依赖学科+年级：两者都选中才刷新，任一为空则直接清空
  refreshScope = () => {
    if (
      hasQueryValue(this.state.gradeId) &&
      hasQueryValue(this.state.subjectId)
    ) {
      this.changeGetTree(); // 知识点 treeData
      this.getLabel(); // 素养 labelList
      this.getChapter(); // 章节 chapterList
    } else {
      this.props.dispatch({ type: "inputQuestion/saveTree", payload: [] });
      this.props.dispatch({ type: "inputQuestion/saveLabel", payload: [] });
      this.props.dispatch({ type: "inputQuestion/saveChapter", payload: [] });
    }
  };

  changeGrade = (value) => {
    this.setState(
      {
        gradeId: value,
      },
      () => {
        // 选择年级后重新获取学科列表，并校验原选中学科是否仍有效
        this.props.dispatch({
          type: "global/getSubject",
          payload: {
            gradeId: this.state.gradeId,
          },
          onSuccess: (subjectList) => {
            const list = Array.isArray(subjectList) ? subjectList : [];
            const exists =
              hasQueryValue(this.state.subjectId) &&
              list.some(
                (item) => String(item.id) === String(this.state.subjectId),
              );
            // 新年级下不存在原选中学科则清空学科，随后联动刷新或清空章节/知识点/素养
            this.setState(
              { subjectId: exists ? this.state.subjectId : undefined },
              () => {
                this.refreshScope();
              },
            );
          },
        });
        if (this.state.type == 10) {
          this.props
            .dispatch({
              type: "home/getExam",
              payload: {
                pageNo: 1,
                limit: 100,
                examName: null,
                examTypeCode: this.state.type === 0 ? "" : this.props.typeValue,
                subjectId: this.state.subjectId,
                gradeId: this.state.gradeId,
                semesterId: this.props.currentSemester.id,
              },
            })
            .then(() => {});
        }
      },
    );
  };
  changeSubject = (value) => {
    this.setState(
      {
        subjectId: value,
      },
      () => {
        this.refreshScope();
      },
    );
  };
  renderCount = () => {
    const { detaiList } = this.state;
    let newList = [];
    let count = 0;
    if (detaiList && detaiList.length > 0) {
      detaiList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            newList.push(it);
          });
        }
      });
    }
    count = newList.length;
    return count;
  };
  renderTotal = () => {
    let list = JSON.parse(JSON.stringify(this.state.detaiList));
    let view = Object.assign({}, this.state.viewData);
    let count = 0;
    if (list && list.length > 0) {
      list.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((index) => {
            count += index.questionScore ? index.questionScore : 0;
          });
        }
      });
    }
    view.totalScore = count;
    view.moduleList = list;
    this.setState(
      {
        viewData: view,
      },
      () => {},
    );
  };
  submit = () => {
    let pay = {
      type: this.state.type,
      personalizedPaperId: this.state.test,
      title: this.state.testName,
      gradeId: this.state.gradeId,
      subjectId: this.state.subjectId,
      totalScore: this.state.viewData.totalScore,
      yearPeriodId: this.state.stageId,
      paperId: this.paperId,
    };

    let questionTypeNumberModels = [];
    let paperModuleModels = [];
    let flag = true;
    let infoTip = ""; //错误信息提示
    let infoIndex = []; //1.学段 2.年级 3.年份 4.试卷标题 5.题目分数
    let scoreIndex = []; //没录入题目分数下标
    if (!this.state.gradeId) {
      flag = false;
      infoIndex.push(trans("global.grade", "年级"));
    }
    if (!this.state.testName) {
      flag = false;
      infoIndex.push(trans("global.title", "试卷标题"));
    }
    if (!this.state.type) {
      flag = false;
      infoIndex.push(trans("global.type", "类型"));
    }
    if (this.state.type == 10 && !this.state.test) {
      flag = false;
      infoIndex.push(trans("global.relatedTestPaper", "关联试卷"));
    }
    if (this.state.key == 1) {
      if (this.state.detaiList && this.state.detaiList.length > 0) {
        this.state.detaiList.map((item, index) => {
          let list = [];
          questionTypeNumberModels.push({
            questionType: item.moduleType,
            questionNum: item.questionList.length || 0,
          });
          if (item.questionList && item.questionList) {
            item.questionList.map((index_, index) => {
              list.push({
                questionId: index_.questionId,
                questionScore: index_.questionScore,
                questionSerialNumber: this.renderNumber(index_.questionId),
              });
              if (index_.type == 6) {
                list[index].sonQuestionList = [];
                index_.sonQuestionList &&
                  index_.sonQuestionList.length &&
                  index_.sonQuestionList.map((ii, ind) => {
                    list[index].sonQuestionList.push({
                      questionId: ii.questionId,
                      questionScore: ii.questionScore,
                    });
                  });
              }
            });
          }
          paperModuleModels.push({
            moduleName: item.moduleName,
            moduleScore: item.moduleScore,
            moduleQuestionNumber: item.questionList.length || 0,
            questionList: list,
            moduleType: item.moduleType,
          });
        });
      }
    } else {
      let newNumber = 0;
      if (
        this.state.detaiListFreedom &&
        this.state.detaiListFreedom.length > 0
      ) {
        this.state.detaiListFreedom.map((item, index) => {
          let list = [];
          questionTypeNumberModels.push({
            questionType: item.moduleType,
            questionNum: item.questionList.length || 0,
          });
          if (item.questionList && item.questionList) {
            item.questionList.map((index_, ind) => {
              newNumber = newNumber + 1;
              list.push({
                questionId: index_.questionId,
                questionScore: index_.questionScore,
                questionSerialNumber: newNumber,
              });
              if (index_.type == 6) {
                list[ind].sonQuestionList = [];
                index_.sonQuestionList &&
                  index_.sonQuestionList.length &&
                  index_.sonQuestionList.map((ii, inde) => {
                    list[ind].sonQuestionList.push({
                      questionId: ii.questionId,
                      questionScore: ii.questionScore,
                    });
                  });
              }
            });
          }
          paperModuleModels.push({
            moduleName: item.moduleName,
            moduleScore: item.moduleScore,
            moduleQuestionNumber: item.questionList.length || 0,
            questionList: list,
            moduleType: item.moduleType,
          });
        });
      }
    }

    paperModuleModels &&
      paperModuleModels.length &&
      paperModuleModels.map((item) => {
        item.questionList &&
          item.questionList.length &&
          item.questionList.map((element) => {
            if (
              !(
                element.questionScore > 0 ||
                item.moduleType == 7 ||
                item.moduleType == 8
              )
            ) {
              flag = false;
              scoreIndex.push(element.questionSerialNumber);
            }
          });
      });
    if (!flag) {
      if (scoreIndex.length > 0 && infoIndex.length > 0) {
        infoTip =
          infoIndex.toString() +
          trans(
            "infoTip.moduleScoreMustFillIn",
            "，第{$num}题题目分数必须填写",
            { num: scoreIndex.toString() },
          );
      } else if (infoIndex.length === 0) {
        infoTip =
          infoIndex.toString() +
          trans(
            "infoTip.moduleScoreMustFillIn2",
            "第{$num}题题目分数必须填写",
            { num: scoreIndex.toString() },
          );
      } else {
        infoTip =
          infoIndex.toString() + trans("infoTip.mustFillIn", "必须填写");
      }
      message.info(infoTip);
      return;
    }
    pay.questionTypeNumberModels = questionTypeNumberModels;
    pay.paperModuleModels = paperModuleModels;
    if (this.canSubmit) {
      this.canSubmit = false;

      this.props
        .dispatch({
          type: "home/submitView",
          payload: this.getRecruitPaperPayload({
            ...pay,
          }),
          onSuccess: (res) => {
            this.paperId = res.content;
            // 在上传试卷后会自动跳转到这个页面，此时点击保存，直接进行跳转
            if (this.isAutoJump) {
              return this.openTwoWay();
            }
            this.setState({
              submitStatus: true,
            });
          },
        })
        .then(() => {
          const { exampleId } = this.props;
          this.canSubmit = true;
          console.log(exampleId, "exampleId");

          this.setState({
            exampleId: exampleId,
          });
        });
    }
  };

  publishToStudent = () => {
    this.setState({
      publishStatus: true,
      submitStatus: false,
    });
  };

  toTest = () => {
    this.props.dispatch({
      type: "home/clearView",
    });
    window.top.location.href = `${window.location.origin}/#/examAnalysis`;
  };
  toCourse = () => {
    this.setState(
      {
        submitStatus: false,
      },
      () => {
        this.toTest();
      },
    );
    window.open(`${window.location.origin}/#/course`);
  };
  back = () => {
    console.log(this.props, "11");
    this.props.dispatch({
      type: "home/clearView",
    });
    window.parent.postMessage("false", "*");
    window.close() || this.props.history.goBack();
  };
  checkQuestion = (id) => {
    this.setState({
      checkQuestionId: id,
    });
  };
  scrollView = (id) => {
    console.log(id, "666");
    const ele = document.getElementById(`question${id}`);
    if (this.state.checkQuestionId && this.state.checkQuestionId != id) {
      let state = Object.assign({}, this.state);
      state[`itemScoreViesble${id}`] = !state[`itemScoreViesble${id}`];
      state[`itemScoreViesble${this.state.checkQuestionId}`] = false;
      this.setState({
        ...state,
        checkQuestionId: id,
        deleteStatus: false,
      });
    } else {
      this.setState(
        {
          checkQuestionId: id,
          deleteStatus: false,
        },
        () => {
          let state = Object.assign({}, this.state);
          state[`itemScoreViesble${id}`] = !state[`itemScoreViesble${id}`];
          this.setState({
            ...state,
          });
        },
      );
    }

    ele.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  submitCancel = () => {
    this.setState({
      submitStatus: false,
    });
  };
  renderScore = (index) => {
    const { detaiList } = this.state;
    let count = 0;
    if (
      detaiList &&
      detaiList.length > 0 &&
      detaiList[index].questionList &&
      detaiList[index].questionList.length > 0
    ) {
      detaiList[index].questionList.map((item) => {
        count += item.questionScore ? item.questionScore : 0;
      });
    }
    return count;
  };
  renderScorefr = (index) => {
    const { detaiListFreedom } = this.state;
    let count = 0;
    if (
      detaiListFreedom &&
      detaiListFreedom.length > 0 &&
      detaiListFreedom[index].questionList &&
      detaiListFreedom[index].questionList.length > 0
    ) {
      detaiListFreedom[index].questionList.map((item) => {
        count += item.questionScore ? item.questionScore : 0;
      });
    }
    return count;
  };
  renderNumber = (id) => {
    const { detaiList } = this.state;
    let newList = [];
    let count = 0;
    if (detaiList && detaiList.length > 0) {
      detaiList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            newList.push(it);
          });
        }
      });
    }
    if (newList.length > 0) {
      newList.map((item, index) => {
        if (id === item.questionId) {
          count = index + 1;
        }
      });
    }
    return count;
  };
  sort = (index, e) => {
    let state = Object.assign({}, this.state);
    state[`moveUpDown${index}`] = e;
    this.setState({
      ...state,
    });
  };
  showSort = (index) => {
    let state = Object.assign({}, this.state);
    state[`moveUpDown${index}`] = false;
    this.setState({
      ...state,
    });
  };
  showModal = (type, index) => {
    this.child && this.child.showModal(type, index);
    let state = Object.assign({}, this.state);
    state[`addTopic${index}`] = !state[`addTopic${index}`];
    this.setState({
      ...state,
    });
  };
  showAddTopic = (index) => {
    let state = Object.assign({}, this.state);
    state[`addTopic${index}`] = !state[`addTopic${index}`];
    this.setState({
      ...state,
    });
  };
  componentWillUnmount() {
    this.props.dispatch({
      type: "home/clearDetailView",
    });
    this.props.dispatch({
      type: "global/clearSearch",
    });
  }
  viewAnalysis = (id) => {
    const e = document.getElementById(`deleteanalysis${id}`);
    if (e) {
      e.style.display = e.style.display === "block" ? "none" : "block";
    }
  };
  scrollDelete = () => {
    const ele = document.querySelector("#deleteBox");
    this.setState({
      deleteStatus: true,
      checkQuestionId: null,
    });
    ele.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  publish = () => {
    this.setState({
      publishStatus: true,
    });
  };
  publishCancel = () => {
    this.setState({
      publishStatus: false,
      submitStatus: true,
    });
  };

  release = () => {
    this.canSubmit = true;
    this.props.dispatch({
      type: "home/clearView",
    });
    this.setState({
      publishStatus: false,
    });
  };

  returnMyTest = () => {
    this.release();
    this.props.dispatch(routerRedux.push("/examAnalysis"));
  };

  view = () => {
    this.release();
    this.props.dispatch(
      routerRedux.push(
        `/testAnalysis/${this.state.exampleId}/1/${this.paperId}/true`,
      ),
    );
  };

  changeType = (value) => {
    if (this.isRecruitPaperMode()) {
      return;
    }
    this.setState(
      {
        type: value,
      },
      () => {
        if (value == 10) {
          this.props.dispatch({
            type: "home/getExam",
            payload: {
              pageNo: 1,
              limit: 100,
              examName: null,
              examTypeCode: value === 0 ? "" : this.props.typeValue,
              subjectId: this.state.subjectId,
              gradeId: this.state.gradeId,
              semesterId: this.props.currentSemester.id,
            },
          });
        }
      },
    );
  };

  changeTest = (value) => {
    if (this.reload) {
      return;
    }
    this.reload = true;
    this.setState(
      {
        test: value,
      },
      () => {
        if (this.ifView) {
          this.props
            .dispatch({
              type: "home/getpersonal",
              payload: {
                personalizedPaperId: value,
                subjectId: this.props.viewData.subjectId,
                gradeId: this.state.gradeId,
              },
            })
            .then(() => {
              this.reload = false;
              console.log(this.props.personalList);
              if (
                this.props.personalList &&
                this.props.personalList.length > 0
              ) {
                this.child && this.child.setList(this.props.personalList);
                this.setState(
                  {
                    detaiList: this.props.personalList,
                  },
                  () => {
                    this.props.dispatch({
                      type: "home/clearPersonal",
                    });
                  },
                );
              }
            });
        }
      },
    );
  };

  scoreChange = (index, e) => {
    if (e === 0) {
      return message.error(trans("detail.numMessage2", "请输入正整数"));
    }
    let value = e === "" ? 0 : e;
    const r = /^\d+(\.\d+)?/;
    if (!r.test(value)) {
      return message.error(trans("detail.numMessage", "请输入数字"));
    }
    this.setState({
      scoreValue: value,
      itemscoreValue: value,
    });
  };

  sureCount = (index) => {
    let list = JSON.parse(JSON.stringify(this.state.detaiList));
    let count = 0;
    if (
      list[index].questionList &&
      list[index].questionList.length > 0 &&
      this.state.scoreValue
    ) {
      list[index].questionList.map((item) => {
        item.questionScore = this.state.scoreValue || 0;
        count += item.questionScore;
      });
      list[index].moduleScore = count;
    }
    this.updateList(list);
    this.setState(
      {
        detaiList: list,
        scoreValue: null,
      },
      () => {
        this.changeScoreVisible(index);
      },
    );
  };
  sureCount1 = (index) => {
    let list = JSON.parse(JSON.stringify(this.state.detaiListFreedom));
    let count = 0;
    if (
      list[index].questionList &&
      list[index].questionList.length > 0 &&
      this.state.scoreValue
    ) {
      list[index].questionList.map((item) => {
        item.questionScore = this.state.scoreValue || 0;
        count += item.questionScore;
      });
      list[index].moduleScore = count;
    }
    this.updateList(list);
    this.setState(
      {
        detaiListFreedom: list,
        scoreValue: null,
      },
      () => {
        this.changeScoreVisible(index);
      },
    );
  };
  checkTab = (index) => {
    this.setState({
      checkTab: index,
    });
  };
  changeScoreVisible = (index) => {
    let state = Object.assign({}, this.state);
    state[`countScoreViesble${index}`] = !state[`countScoreViesble${index}`];
    this.setState({
      checkTab: 0,
      ...state,
    });
  };

  renderTitle = (item, index) => {
    let ifShow = false;
    if (item.questionList && item.questionList.length > 0) {
      item.questionList.map((index_, ind) => {
        if (ind > 0) {
          if (
            index_.questionScore == undefined ||
            index_.questionScore !== item.questionList[ind - 1].questionScore
          ) {
            ifShow = true;
            return;
          } else {
            // console.log("false");
          }
        } else {
          if (
            item.questionList.length === 1 &&
            index_.questionScore == undefined
          ) {
            ifShow = true;
          }
        }
      });
    }
    let ifSonQuestion = false;
    if (item.questionList && item.questionList.length > 0) {
      item.questionList.map((index_) => {
        if (index_.type == 6) {
          ifSonQuestion = true;
        }
      });
    }
    return ifShow ? (
      ifSonQuestion ? (
        <span>
          <Tooltip
            title={trans("detail.batch", "批量设置每题分数")}
            arrowPointAtCenter={true}
            placement="topRight"
          >
            <span
              onClick={this.changeScoreVisible.bind(this, index)}
              className={[
                styles.batch,
                styles.shadow,
                this.state[`countScoreViesble${index}`]
                  ? styles.shadowClick
                  : "",
              ].join(" ")}
              style={{ cursor: "pointer" }}
            >
              {/* {trans("detail.batch", "批量设置每题分数")} */}
              <i
                className={[
                  styles.iconfont,
                  styles.batchModifyScore,
                  this.state[`countScoreViesble${index}`]
                    ? styles.iconClick
                    : "",
                ].join(" ")}
                onClick={this.changeScoreVisible.bind(this, index)}
                style={{ fontSize: "14px" }}
              >
                &#xe6b3;
              </i>
            </span>
          </Tooltip>
          <Modal
            visible={this.state[`countScoreViesble${index}`]}
            title={null}
            footer={null}
            closable={false}
            onCancel={this.changeScoreVisible.bind(this, index)}
          >
            <div className={styles.batchSetBox}>
              <div className={styles.batchSetHeader}>
                <div
                  onClick={this.changeScoreVisible.bind(this, index)}
                  className={[icon.iconfont, styles.closeIcon].join(" ")}
                >
                  &#xe6a9;
                </div>
                <div className={styles.batchTitle}>
                  {trans(
                    "detailView.setCombinationQuestionScore",
                    "设置组合题分数",
                  )}
                  <span className={styles.batchScore}>
                    （{trans("global.zongfen", "总分")}: {item.moduleScore}）
                  </span>
                </div>
              </div>
              <div className={styles.batchSetTab}>
                {item.questionList && item.questionList.length > 0
                  ? item.questionList.map((it, indd) => (
                      <div
                        onClick={this.checkTab.bind(this, indd)}
                        className={[
                          styles.questionTab,
                          this.state.checkTab === indd ? styles.check : "",
                        ].join(" ")}
                      >
                        {trans("detailView.questionNumber", "第{$number}题", {
                          number: indd + 1,
                        })}
                      </div>
                    ))
                  : null}
              </div>
              <div className={styles.batchSetContent}>
                {item.questionList &&
                item.questionList[this.state.checkTab] &&
                item.questionList[this.state.checkTab].type ? (
                  item.questionList[this.state.checkTab].sonQuestionList &&
                  item.questionList[this.state.checkTab].sonQuestionList
                    .length > 0 ? (
                    item.questionList[this.state.checkTab].sonQuestionList.map(
                      (ii, inde) => (
                        <div className={styles.batchItem}>
                          <span className={styles.batchTitle}>
                            ({inde + 1})
                          </span>
                          <InputNumber
                            onChange={this.changeTypeSonScore.bind(
                              this,
                              index,
                              inde,
                            )}
                            value={ii.questionScore}
                          />
                          <span className={styles.score}>
                            {trans("global.point", "分")}
                          </span>
                          {inde == 0 ? (
                            <span
                              onClick={this.downTypeScore.bind(
                                this,
                                index,
                                inde,
                                ii.questionScore,
                              )}
                              className={styles.down}
                            >
                              {trans("detailView.fillDown", "向下填充")}
                            </span>
                          ) : null}
                        </div>
                      ),
                    )
                  ) : (
                    <div className={styles.batchItem}>
                      <InputNumber
                        onChange={this.changeTypeBatchScore.bind(this, index)}
                        value={
                          item.questionList[this.state.checkTab].questionScore
                        }
                      />
                      <span className={styles.score}>
                        {trans("global.point", "分")}
                      </span>
                    </div>
                  )
                ) : null}
              </div>
              {item.questionList &&
              item.questionList[this.state.checkTab] &&
              item.questionList[this.state.checkTab].questionScore ? (
                <div className={styles.batchModalBottom}>
                  <div className={styles.batchTitle}>
                    {trans("detailView.singleQuestionTotal", "单题总共")}
                  </div>
                  <div className={styles.batchScore}>
                    {item.questionList[this.state.checkTab].questionScore}
                  </div>
                  <div className={styles.score}>
                    {trans("global.point", "分")}
                  </div>
                </div>
              ) : (
                <div className={styles.batchModalBottom}>
                  <div className={styles.batchTitle}>
                    {trans("detailView.singleQuestionTotal", "单题总共")}
                  </div>
                  <div className={styles.batchScore}></div>
                  <div className={styles.score}>
                    {trans("global.point", "分")}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        </span>
      ) : (
        <Popover
          destroyTooltipOnHide={true}
          content={
            <div>
              <div>
                <span>
                  {trans("global.setCountScore", "将该分类下每题分值设为")}
                </span>
                <InputNumber
                  onChange={this.scoreChange.bind(this, index)}
                  // precision={0}
                  autoFocus={true}
                  onPressEnter={this.sureCount.bind(this, index)}
                />
                <span>{trans("global.point", "分")}</span>
              </div>
              <div className={styles.modalBottom}>
                <button
                  onClick={this.changeScoreVisible.bind(this, index)}
                  className={styles.cancleScore}
                >
                  {trans("global.cancle", "取消")}
                </button>
                <button
                  onClick={this.sureCount.bind(this, index)}
                  className={styles.sureScore}
                  style={{ backgroundColor: "#0445FC" }}
                >
                  {trans("global.sure", "确定")}
                </button>
              </div>
            </div>
          }
          trigger="click"
          visible={this.state[`countScoreViesble${index}`]}
          // placement={"bottom"}
          placement="bottomRight"
          overlayClassName={styles.scorePopover}
          arrowPointAtCenter={true}
          getPopupContainer={() =>
            document.getElementById(`countScoreBox${index}`)
          }
        >
          <Tooltip
            title={trans("detail.batch", "批量设置每题分数")}
            arrowPointAtCenter={true}
            placement="topRight"
          >
            <span
              onClick={this.changeScoreVisible.bind(this, index)}
              className={[
                styles.batch,
                styles.shadow,
                this.state[`countScoreViesble${index}`]
                  ? styles.shadowClick
                  : "",
              ].join(" ")}
              style={{ cursor: "pointer" }}
            >
              <i
                className={[
                  styles.iconfont,
                  styles.batchModifyScore,
                  this.state[`countScoreViesble${index}`]
                    ? styles.iconClick
                    : "",
                ].join(" ")}
                onClick={this.changeScoreVisible.bind(this, index)}
                style={{ fontSize: "14px" }}
              >
                &#xe6b3;
              </i>
            </span>
          </Tooltip>
        </Popover>
      )
    ) : ifSonQuestion ? (
      <span>
        <Tooltip
          title={trans("detail.batch", "批量设置每题分数")}
          arrowPointAtCenter={true}
          placement="topRight"
        >
          <span
            onClick={this.changeScoreVisible.bind(this, index)}
            className={[
              styles.batch,
              styles.shadow,
              this.state[`countScoreViesble${index}`] ? styles.shadowClick : "",
            ].join(" ")}
            style={{ cursor: "pointer" }}
          >
            <i
              className={[
                styles.iconfont,
                styles.batchModifyScore,
                this.state[`countScoreViesble${index}`] ? styles.iconClick : "",
              ].join(" ")}
              onClick={this.changeScoreVisible.bind(this, index)}
              style={{ fontSize: "14px" }}
            >
              &#xe6b3;
            </i>
          </span>
        </Tooltip>
        <Modal
          visible={this.state[`countScoreViesble${index}`]}
          title={null}
          footer={null}
          closable={false}
          onCancel={this.changeScoreVisible.bind(this, index)}
        >
          <div className={styles.batchSetBox}>
            <div className={styles.batchSetHeader}>
              <div
                onClick={this.changeScoreVisible.bind(this, index)}
                className={[icon.iconfont, styles.closeIcon].join(" ")}
              >
                &#xe6a9;
              </div>
              <div className={styles.batchTitle}>
                {trans(
                  "detailView.setCombinationQuestionScore",
                  "设置组合题分数",
                )}
                <span className={styles.batchScore}>
                  （{trans("global.zongfen", "总分")}: {item.moduleScore}）
                </span>
              </div>
            </div>
            <div className={styles.batchSetTab}>
              {item.questionList && item.questionList.length > 0
                ? item.questionList.map((it, indd) => (
                    <div
                      onClick={this.checkTab.bind(this, indd)}
                      className={[
                        styles.questionTab,
                        this.state.checkTab === indd ? styles.check : "",
                      ].join(" ")}
                    >
                      {trans("detailView.questionNumber", "第{$number}题", {
                        number: indd + 1,
                      })}
                    </div>
                  ))
                : null}
            </div>
            <div className={styles.batchSetContent}>
              {item.questionList &&
              item.questionList[this.state.checkTab] &&
              item.questionList[this.state.checkTab].type ? (
                item.questionList[this.state.checkTab].sonQuestionList &&
                item.questionList[this.state.checkTab].sonQuestionList.length >
                  0 ? (
                  item.questionList[this.state.checkTab].sonQuestionList.map(
                    (ii, inde) => (
                      <div className={styles.batchItem}>
                        <span className={styles.batchTitle}>({inde + 1})</span>
                        <InputNumber
                          onChange={this.changeTypeSonScore.bind(
                            this,
                            index,
                            inde,
                          )}
                          value={ii.questionScore}
                        />
                        <span className={styles.score}>
                          {trans("global.point", "分")}
                        </span>
                        {inde == 0 ? (
                          <span
                            onClick={this.downTypeScore.bind(
                              this,
                              index,
                              inde,
                              ii.questionScore,
                            )}
                            className={styles.down}
                          >
                            {trans("detailView.fillDown", "向下填充")}
                          </span>
                        ) : null}
                      </div>
                    ),
                  )
                ) : (
                  <div className={styles.batchItem}>
                    <InputNumber
                      onChange={this.changeTypeBatchScore.bind(this, index)}
                      value={
                        item.questionList[this.state.checkTab].questionScore
                      }
                    />
                    <span className={styles.score}>
                      {trans("global.point", "分")}
                    </span>
                  </div>
                )
              ) : null}
            </div>
            {item.questionList &&
            item.questionList[this.state.checkTab] &&
            item.questionList[this.state.checkTab].questionScore ? (
              <div className={styles.batchModalBottom}>
                <div className={styles.batchTitle}>
                  {trans("detailView.singleQuestionTotal", "单题总共")}
                </div>
                <div className={styles.batchScore}>
                  {item.questionList[this.state.checkTab].questionScore}
                </div>
                <div className={styles.score}>
                  {trans("global.point", "分")}
                </div>
              </div>
            ) : (
              <div className={styles.batchModalBottom}>
                <div className={styles.batchTitle}>
                  {trans("detailView.singleQuestionTotal", "单题总共")}
                </div>
                <div className={styles.batchScore}></div>
                <div className={styles.score}>
                  {trans("global.point", "分")}
                </div>
              </div>
            )}
          </div>
        </Modal>
      </span>
    ) : (
      <Popover
        destroyTooltipOnHide={true}
        content={
          <div>
            <div>
              <span>
                {trans("global.setCountScore", "将该分类下每题分值设为")}
              </span>
              <InputNumber onChange={this.scoreChange.bind(this, index)} />
              <span>{trans("global.point", "分")}</span>
            </div>
            <div className={styles.modalBottom}>
              <button
                className={styles.cancleScore}
                onClick={this.changeScoreVisible.bind(this, index)}
              >
                {trans("global.cancle", "取消")}
              </button>
              <button
                className={styles.sureScore}
                style={{ backgroundColor: "#0445FC" }}
                onClick={this.sureCount.bind(this, index)}
              >
                {trans("global.sure", "确定")}
              </button>
            </div>
          </div>
        }
        trigger="click"
        visible={this.state[`countScoreViesble${index}`]}
        placement="bottomRight"
        overlayClassName={styles.scorePopover}
        arrowPointAtCenter={true}
        getPopupContainer={() =>
          document.getElementById(`countScoreBox${index}`)
        }
      >
        <Tooltip
          title={trans("detail.batch", "批量设置每题分数")}
          arrowPointAtCenter={true}
          placement="topRight"
        >
          <span
            className={[
              styles.batch,
              styles.shadow,
              this.state[`countScoreViesble${index}`] ? styles.shadowClick : "",
            ].join(" ")}
            style={{ cursor: "pointer" }}
          >
            <i
              className={[
                styles.iconfont,
                styles.batchModifyScore,
                this.state[`countScoreViesble${index}`] ? styles.iconClick : "",
              ].join(" ")}
              onClick={this.changeScoreVisible.bind(this, index)}
              style={{ fontSize: "12px" }}
            >
              &#xe6b3;
            </i>
          </span>
        </Tooltip>
      </Popover>
    );
  };
  changeBatchScore = (index, e) => {
    let newFree = JSON.parse(JSON.stringify(this.state.detaiListFreedom));
    newFree[index].questionList[this.state.checkTab].questionScore = e;
    let score = 0;
    newFree[index].questionList.map((it) => {
      score += it.questionScore;
    });
    newFree[index].moduleScore = score;
    this.updateList(newFree);
  };
  changeSonScore = (index, ind, e) => {
    let newFree = JSON.parse(JSON.stringify(this.state.detaiListFreedom));
    newFree[index].questionList[this.state.checkTab].sonQuestionList[
      ind
    ].questionScore = e;
    let score = 0;
    newFree[index].questionList[this.state.checkTab].sonQuestionList.map(
      (it) => {
        score += it.questionScore;
      },
    );
    newFree[index].questionList[this.state.checkTab].questionScore = score;
    let total = 0;
    newFree[index].questionList.map((it) => {
      total += it.questionScore;
    });
    newFree[index].moduleScore = total;
    this.updateList(newFree);
  };
  downScore = (index, ind, score) => {
    if (!score || score == 0) {
      return;
    }
    let newFree = JSON.parse(JSON.stringify(this.state.detaiListFreedom));
    let newScore = 0;
    newFree[index].questionList[this.state.checkTab].sonQuestionList.map(
      (it) => {
        it.questionScore = score;
        newScore += it.questionScore;
      },
    );
    newFree[index].questionList[this.state.checkTab].questionScore = newScore;
    let total = 0;
    newFree[index].questionList.map((it) => {
      total += it.questionScore;
    });
    newFree[index].moduleScore = total;
    newFree[index].moduleScore = total;
    this.updateList(newFree);
  };
  changeTypeBatchScore = (index, e) => {
    console.log(e, "ee");
    let newFree = JSON.parse(JSON.stringify(this.state.detaiList));
    newFree[index].questionList[this.state.checkTab].questionScore = e;
    let score = 0;
    newFree[index].questionList.map((it) => {
      score += it.questionScore;
    });
    newFree[index].moduleScore = score;
    this.updateList(newFree);
  };
  changeTypeSonScore = (index, ind, e) => {
    let newFree = JSON.parse(JSON.stringify(this.state.detaiList));
    newFree[index].questionList[this.state.checkTab].sonQuestionList[
      ind
    ].questionScore = e;
    let score = 0;
    newFree[index].questionList[this.state.checkTab].sonQuestionList.map(
      (it) => {
        score += it.questionScore;
      },
    );
    newFree[index].questionList[this.state.checkTab].questionScore = score;
    let total = 0;
    newFree[index].questionList.map((it) => {
      total += it.questionScore;
    });
    newFree[index].moduleScore = total;
    this.updateList(newFree);
  };
  downTypeScore = (index, ind, score) => {
    if (!score || score == 0) {
      return;
    }
    let newFree = JSON.parse(JSON.stringify(this.state.detaiList));
    let newScore = 0;
    newFree[index].questionList[this.state.checkTab].sonQuestionList.map(
      (it) => {
        it.questionScore = score;
        newScore += it.questionScore;
      },
    );
    newFree[index].questionList[this.state.checkTab].questionScore = newScore;
    let total = 0;
    newFree[index].questionList.map((it) => {
      total += it.questionScore;
    });
    newFree[index].moduleScore = total;
    newFree[index].moduleScore = total;
    this.updateList(newFree);
  };
  renderTitle1 = (item, index) => {
    let ifShow = false;
    let ifSonQuestion = false;
    if (item.questionList && item.questionList.length > 0) {
      item.questionList.map((index_) => {
        if (index_.type == 6) {
          ifSonQuestion = true;
        }
      });
    }
    console.log(item, "ii");
    if (item.questionList && item.questionList.length > 0) {
      item.questionList.map((index_, ind) => {
        if (ind > 0) {
          if (
            index_.questionScore == undefined ||
            index_.questionScore !== item.questionList[ind - 1].questionScore
          ) {
            ifShow = true;
            return;
          }
        } else {
          if (
            item.questionList.length === 1 &&
            index_.questionScore == undefined
          ) {
            ifShow = true;
          }
        }
      });
    }
    return ifShow ? (
      ifSonQuestion ? (
        <span>
          <Tooltip
            title={trans("detail.batch", "批量设置每题分数")}
            arrowPointAtCenter={true}
            placement="topRight"
          >
            <span
              onClick={this.changeScoreVisible.bind(this, index)}
              className={[
                styles.batch,
                styles.shadow,
                this.state[`countScoreViesble${index}`]
                  ? styles.shadowClick
                  : "",
              ].join(" ")}
              style={{ cursor: "pointer" }}
            >
              <i
                className={[
                  styles.iconfont,
                  styles.batchModifyScore,
                  this.state[`countScoreViesble${index}`]
                    ? styles.iconClick
                    : "",
                ].join(" ")}
                onClick={this.changeScoreVisible.bind(this, index)}
                style={{ fontSize: "14px" }}
              >
                &#xe6b3;
              </i>
            </span>
          </Tooltip>
          <Modal
            visible={this.state[`countScoreViesble${index}`]}
            title={null}
            footer={null}
            closable={false}
            onCancel={this.changeScoreVisible.bind(this, index)}
          >
            <div className={styles.batchSetBox}>
              <div className={styles.batchSetHeader}>
                <div
                  onClick={this.changeScoreVisible.bind(this, index)}
                  className={[icon.iconfont, styles.closeIcon].join(" ")}
                >
                  &#xe6a9;
                </div>
                <div className={styles.batchTitle}>
                  {trans(
                    "detailView.setCombinationQuestionScore",
                    "设置组合题分数",
                  )}
                  <span className={styles.batchScore}>
                    （{trans("global.zongfen", "总分")}: {item.moduleScore}）
                  </span>
                </div>
              </div>
              <div className={styles.batchSetTab}>
                {item.questionList && item.questionList.length > 0
                  ? item.questionList.map((it, indd) => (
                      <div
                        onClick={this.checkTab.bind(this, indd)}
                        className={[
                          styles.questionTab,
                          this.state.checkTab === indd ? styles.check : "",
                        ].join(" ")}
                      >
                        {trans("detailView.questionNumber", "第{$number}题", {
                          number: indd + 1,
                        })}
                      </div>
                    ))
                  : null}
              </div>
              <div className={styles.batchSetContent}>
                {item.questionList &&
                item.questionList[this.state.checkTab] &&
                item.questionList[this.state.checkTab].type ? (
                  item.questionList[this.state.checkTab].sonQuestionList &&
                  item.questionList[this.state.checkTab].sonQuestionList
                    .length > 0 ? (
                    item.questionList[this.state.checkTab].sonQuestionList.map(
                      (ii, inde) => (
                        <div className={styles.batchItem}>
                          <span className={styles.batchTitle}>
                            ({inde + 1})
                          </span>
                          <InputNumber
                            onChange={this.changeSonScore.bind(
                              this,
                              index,
                              inde,
                            )}
                            value={ii.questionScore}
                          />
                          <span className={styles.score}>
                            {trans("global.point", "分")}
                          </span>
                          {inde == 0 ? (
                            <span
                              onClick={this.downScore.bind(
                                this,
                                index,
                                inde,
                                ii.questionScore,
                              )}
                              className={styles.down}
                            >
                              {trans("detailView.fillDown", "向下填充")}
                            </span>
                          ) : null}
                        </div>
                      ),
                    )
                  ) : (
                    <div className={styles.batchItem}>
                      <InputNumber
                        onChange={this.changeBatchScore.bind(this, index)}
                        value={
                          item.questionList[this.state.checkTab].questionScore
                        }
                      />
                      <span className={styles.score}>
                        {trans("global.point", "分")}
                      </span>
                    </div>
                  )
                ) : null}
              </div>
              {item.questionList &&
              item.questionList[this.state.checkTab] &&
              item.questionList[this.state.checkTab].questionScore ? (
                <div className={styles.batchModalBottom}>
                  <div className={styles.batchTitle}>
                    {trans("detailView.singleQuestionTotal", "单题总共")}
                  </div>
                  <div className={styles.batchScore}>
                    {item.questionList[this.state.checkTab].questionScore}
                  </div>
                  <div className={styles.score}>
                    {trans("global.point", "分")}
                  </div>
                </div>
              ) : (
                <div className={styles.batchModalBottom}>
                  <div className={styles.batchTitle}>
                    {trans("detailView.singleQuestionTotal", "单题总共")}
                  </div>
                  <div className={styles.batchScore}></div>
                  <div className={styles.score}>
                    {trans("global.point", "分")}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        </span>
      ) : (
        <Popover
          destroyTooltipOnHide={true}
          content={
            <div>
              <div>
                <span>
                  {trans("global.setCountScore", "将该分类下每题分值设为")}
                </span>
                <InputNumber
                  onChange={this.scoreChange.bind(this, index)}
                  autoFocus={true}
                  onPressEnter={this.sureCount1.bind(this, index)}
                />
                <span>{trans("global.point", "分")}</span>
              </div>
              <div className={styles.modalBottom}>
                <button
                  onClick={this.changeScoreVisible.bind(this, index)}
                  className={styles.cancleScore}
                >
                  {trans("global.cancle", "取消")}
                </button>
                <button
                  onClick={this.sureCount1.bind(this, index)}
                  className={styles.sureScore}
                  style={{ backgroundColor: "#0445FC" }}
                >
                  {trans("global.sure", "确定")}
                </button>
              </div>
            </div>
          }
          trigger="click"
          visible={this.state[`countScoreViesble${index}`]}
          placement="bottomRight"
          overlayClassName={styles.scorePopover}
          arrowPointAtCenter={true}
          getPopupContainer={() =>
            document.getElementById(`countScoreBoxF${index}`)
          }
        >
          <span>
            <Tooltip
              title={trans("detail.batch", "批量设置每题分数")}
              arrowPointAtCenter={true}
              placement="topRight"
            >
              <span
                onClick={this.changeScoreVisible.bind(this, index)}
                className={[
                  styles.batch,
                  styles.shadow,
                  this.state[`countScoreViesble${index}`]
                    ? styles.shadowClick
                    : "",
                ].join(" ")}
                style={{ cursor: "pointer" }}
              >
                <i
                  className={[
                    styles.iconfont,
                    styles.batchModifyScore,
                    this.state[`countScoreViesble${index}`]
                      ? styles.iconClick
                      : "",
                  ].join(" ")}
                  onClick={this.changeScoreVisible.bind(this, index)}
                  style={{ fontSize: "14px" }}
                >
                  &#xe6b3;
                </i>
              </span>
            </Tooltip>
          </span>
        </Popover>
      )
    ) : ifSonQuestion ? (
      <span>
        <Tooltip
          title={trans("detail.batch", "批量设置每题分数")}
          arrowPointAtCenter={true}
          placement="topRight"
        >
          <span
            className={[
              styles.batch,
              styles.shadow,
              this.state[`countScoreViesble${index}`] ? styles.shadowClick : "",
            ].join(" ")}
            style={{ cursor: "pointer" }}
          >
            <i
              className={[
                styles.iconfont,
                styles.batchModifyScore,
                this.state[`countScoreViesble${index}`] ? styles.iconClick : "",
              ].join(" ")}
              onClick={this.changeScoreVisible.bind(this, index)}
              style={{ fontSize: "12px" }}
            >
              &#xe6b3;
            </i>
          </span>
        </Tooltip>
        <Modal
          visible={this.state[`countScoreViesble${index}`]}
          title={null}
          footer={null}
          closable={false}
          onCancel={this.changeScoreVisible.bind(this, index)}
        >
          <div className={styles.batchSetBox}>
            <div className={styles.batchSetHeader}>
              <div
                onClick={this.changeScoreVisible.bind(this, index)}
                className={[icon.iconfont, styles.closeIcon].join(" ")}
              >
                &#xe6a9;
              </div>
              <div className={styles.batchTitle}>
                {trans(
                  "detailView.setCombinationQuestionScore",
                  "设置组合题分数",
                )}
                <span className={styles.batchScore}>
                  （{trans("global.zongfen", "总分")}: {item.moduleScore}）
                </span>
              </div>
            </div>
            <div className={styles.batchSetTab}>
              {item.questionList && item.questionList.length > 0
                ? item.questionList.map((it, indd) => (
                    <div
                      onClick={this.checkTab.bind(this, indd)}
                      className={[
                        styles.questionTab,
                        this.state.checkTab === indd ? styles.check : "",
                      ].join(" ")}
                    >
                      {trans("detailView.questionNumber", "第{$number}题", {
                        number: indd + 1,
                      })}
                    </div>
                  ))
                : null}
            </div>
            <div className={styles.batchSetContent}>
              {item.questionList &&
              item.questionList[this.state.checkTab] &&
              item.questionList[this.state.checkTab].type ? (
                item.questionList[this.state.checkTab].sonQuestionList &&
                item.questionList[this.state.checkTab].sonQuestionList.length >
                  0 ? (
                  item.questionList[this.state.checkTab].sonQuestionList.map(
                    (ii, inde) => (
                      <div className={styles.batchItem}>
                        <span className={styles.batchTitle}>({inde + 1})</span>
                        <InputNumber
                          onChange={this.changeSonScore.bind(this, index, inde)}
                          value={ii.questionScore}
                        />
                        <span className={styles.score}>
                          {trans("global.point", "分")}
                        </span>
                        {inde == 0 ? (
                          <span
                            onClick={this.downScore.bind(
                              this,
                              index,
                              inde,
                              ii.questionScore,
                            )}
                            className={styles.down}
                          >
                            {trans("detailView.fillDown", "向下填充")}
                          </span>
                        ) : null}
                      </div>
                    ),
                  )
                ) : (
                  <div className={styles.batchItem}>
                    <InputNumber
                      onChange={this.changeBatchScore.bind(this, index)}
                      value={
                        item.questionList[this.state.checkTab].questionScore
                      }
                    />
                    <span className={styles.score}>
                      {trans("global.point", "分")}
                    </span>
                  </div>
                )
              ) : null}
            </div>
            {item.questionList &&
            item.questionList[this.state.checkTab] &&
            item.questionList[this.state.checkTab].questionScore ? (
              <div className={styles.batchModalBottom}>
                <div className={styles.batchTitle}>
                  {trans("detailView.singleQuestionTotal", "单题总共")}
                </div>
                <div className={styles.batchScore}>
                  {item.questionList[this.state.checkTab].questionScore}
                </div>
                <div className={styles.score}>
                  {trans("global.point", "分")}
                </div>
              </div>
            ) : (
              <div className={styles.batchModalBottom}>
                <div className={styles.batchTitle}>
                  {trans("detailView.singleQuestionTotal", "单题总共")}
                </div>
                <div className={styles.batchScore}></div>
                <div className={styles.score}>
                  {trans("global.point", "分")}
                </div>
              </div>
            )}
          </div>
        </Modal>
      </span>
    ) : (
      <Popover
        destroyTooltipOnHide={true}
        content={
          <div>
            <div>
              <span>
                {trans("global.setCountScore", "将该分类下每题分值设为")}
              </span>
              <InputNumber onChange={this.scoreChange.bind(this, index)} />
              <span>{trans("global.point", "分")}</span>
            </div>
            <div className={styles.modalBottom}>
              <button
                className={styles.cancleScore}
                onClick={this.changeScoreVisible.bind(this, index)}
              >
                {trans("global.cancle", "取消")}
              </button>
              <button
                className={styles.sureScore}
                style={{ backgroundColor: "#0445FC" }}
                onClick={this.sureCount1.bind(this, index)}
              >
                {trans("global.sure", "确定")}
              </button>
            </div>
          </div>
        }
        trigger="click"
        visible={this.state[`countScoreViesble${index}`]}
        placement="bottomRight"
        overlayClassName={styles.scorePopover}
        arrowPointAtCenter={true}
        getPopupContainer={() =>
          document.getElementById(`countScoreBoxF${index}`)
        }
      >
        <span>
          <Tooltip
            title={trans("detail.batch", "批量设置每题分数")}
            arrowPointAtCenter={true}
            placement="topRight"
          >
            <span
              className={[
                styles.batch,
                styles.shadow,
                this.state[`countScoreViesble${index}`]
                  ? styles.shadowClick
                  : "",
              ].join(" ")}
              style={{ cursor: "pointer" }}
            >
              <i
                className={[
                  styles.iconfont,
                  styles.batchModifyScore,
                  this.state[`countScoreViesble${index}`]
                    ? styles.iconClick
                    : "",
                ].join(" ")}
                onClick={this.changeScoreVisible.bind(this, index)}
                style={{ fontSize: "12px" }}
              >
                &#xe6b3;
              </i>
            </span>
          </Tooltip>
        </span>
      </Popover>
    );
  };

  itemscoreChange = (index, e) => {
    if (e === 0) {
      return message.error(trans("detail.numMessage2", "请输入正整数"));
    }
    let value = e === "" ? 0 : e;
    const r = /^\d+(\.\d+)?/;
    if (!r.test(value)) {
      return message.error(trans("detail.numMessage", "请输入数字"));
    }
    this.setState({
      itemscoreValue: value,
    });
  };

  changeItemVisible = (index) => {
    let state = Object.assign({}, this.state);
    state[`itemScoreViesble${index}`] = !state[`itemScoreViesble${index}`];
    this.setState({
      ...state,
    });
  };

  sureItem = (id) => {
    let detaiList = JSON.parse(JSON.stringify(this.state.detaiList));
    if (detaiList && detaiList.length > 0) {
      detaiList.map((item) => {
        let count = 0;
        if (
          item.questionList &&
          item.questionList.length > 0 &&
          this.state.itemscoreValue
        ) {
          item.questionList.map((it) => {
            if (id === it.questionId) {
              it.questionScore = this.state.itemscoreValue || 0;
            }
            count += it.questionScore;
          });
        }
        item.moduleScore = count;
      });
    }
    this.updateList(detaiList);
    this.setState(
      {
        detaiList: detaiList,
        itemscoreValue: null,
      },
      () => {
        this.changeItemVisible(id);
      },
    );
  };

  itemNameChange = (index, e) => {
    let value = e.target.value;
    this.setState({
      itemNameValue: value,
    });
  };
  itemNameAddChange = (e) => {
    let value = e.target.value;
    this.setState({
      itemNameAddValue: value,
    });
  };

  changeItemNameVisible = (index) => {
    let state = Object.assign({}, this.state);
    state[`itemNameViesble${index}`] = !state[`itemNameViesble${index}`];
    this.setState(
      {
        ...state,
      },
      () => {
        if (state[`itemNameViesble${index}`]) {
          setTimeout(() => {
            const inp = document.querySelector("#inpID1");
            inp.focus();
          }, 500);
        }
      },
    );
  };
  changeItemNameVisibleF = (index) => {
    let state = Object.assign({}, this.state);
    state[`itemNameViesbleF${index}`] = !state[`itemNameViesbleF${index}`];
    this.setState(
      {
        ...state,
      },
      () => {
        if (state[`itemNameViesbleF${index}`]) {
          setTimeout(() => {
            const inp = document.querySelector("#inpID2");
            inp.focus();
          }, 500);
        }
      },
    );
  };
  changeItemNameAddVisible = () => {
    this.setState(
      {
        itemNameAddViesble: true,
      },
      () => {
        if (this.state.itemNameAddViesble) {
          setTimeout(() => {
            const inp = document.querySelector("#inpAddID");
            inp.focus();
          }, 500);
        }
      },
    );
  };

  sureItemName = (index_, e) => {
    let list = JSON.parse(JSON.stringify(this.state.detaiList));
    if (list && list.length > 0) {
      list.map((item, index) => {
        if (index === index_) {
          item.moduleName = e.target.value;
        }
      });
    }
    this.updateList(list);
    this.setState(
      {
        detaiList: list,
      },
      () => {
        this.changeItemNameVisible(index_);
      },
    );
  };
  sureItemName1 = (index, e) => {
    let list = JSON.parse(JSON.stringify(this.state.detaiListFreedom));
    let list1 = JSON.parse(JSON.stringify(this.state.freedomList));
    if (this.state.isEdit) {
      list[index].moduleName = e.target.value;
      list1[index].moduleName = e.target.value;
    } else {
      if (index == 0) {
        list[index].moduleName = e.target.value;
      } else {
        list[index].moduleName = e.target.value;
        list1[index - 1].moduleName = e.target.value;
      }
    }
    this.setState(
      {
        detaiListFreedom: list,
        freedomList: list1,
      },
      () => {
        this.changeItemNameVisibleF(index);
      },
    );
    console.log(list, list1, "444");
  };
  sureItemAddName = (e) => {
    if (e.target.value.length === 0) {
      this.setState({
        itemNameAddViesble: false,
      });
      return;
    }
    let list1 = JSON.parse(JSON.stringify(this.state.freedomList));
    let list2 = JSON.parse(JSON.stringify(this.state.detaiListFreedom));
    list1.push({
      moduleName: e.target.value,
      moduleQuestionNumber: "0",
      moduleScore: null,
      moduleType: 0,
      questionList: [],
    });
    list2.push({
      moduleName: e.target.value,
      moduleQuestionNumber: "0",
      moduleScore: null,
      moduleType: 0,
      questionList: [],
    });

    this.setState(
      {
        itemNameAddViesble: false,
        freedomList: list1,
        detaiListFreedom: list2,
      },
      () => {},
    );
  };
  onBlurTitle = () => {
    this.setState({
      blurTitle: false,
    });
  };
  clickSpanTitle = () => {
    this.setState(
      {
        blurTitle: true,
      },
      () => {
        const titleInp = document.querySelector("#titleInput");
        titleInp.focus();
      },
    );
  };

  clickMoveUp = (index) => {
    let list = JSON.parse(JSON.stringify(this.state.detaiList));
    if (index == 0) {
      message.warning(
        trans("detailView.alreadyAtTopCannotMoveUp", "已经处于置顶，无法上移"),
      );
    } else {
      this.swapArray(list, index, index - 1);
    }
    let state = Object.assign({}, this.state);
    state[`moveUpDown${index}`] = false;
    this.setState({
      ...state,
      detaiList: list,
    });
  };

  clickMoveDown = (index) => {
    let list = JSON.parse(JSON.stringify(this.state.detaiList));
    if (index + 1 == list.length) {
      message.warning(
        trans(
          "detailView.alreadyAtBottomCannotMoveDown",
          "已经处于置底，无法下移",
        ),
      );
    } else {
      this.swapArray(list, index, index + 1);
    }
    let state = Object.assign({}, this.state);
    state[`moveUpDown${index}`] = false;
    this.setState({
      ...state,
      detaiList: list,
    });
  };

  dragStartQuestion = (item) => {
    console.log(item, "111");
  };

  dragOverQuestion = (item) => {
    console.log(item, "222");
  };

  swapArray = (array, index1, index2) => {
    array[index1] = array.splice(index2, 1, array[index1])[0];
    return array;
  };
  swapArray1 = (array, index1, index2) => {
    console.log(array, index1, index2, "zwl");
    let data = array.splice(index1, 1)[0];
    array.splice(index2, 0, data)[0];
    return array;
  };

  onSortEndTest = (index, { oldIndex, newIndex }) => {
    let newArray = JSON.parse(JSON.stringify(this.state.detaiList));
    newArray[index].questionList = this.swapArray1(
      newArray[index].questionList,
      oldIndex,
      newIndex,
    );
    this.setState({
      detaiList: newArray,
    });
  };

  clickLaunchOnline = () => {
    const { modalOnlineTestOptions, modalOnlineTestProps } = this.state;
    const context = this.getBlankPaperContext();
    const paperId = this.getCurrentPaperId();
    console.log(paperId, "paperId");

    this.setState(
      {
        modalOnlineTestOptions: {
          ...modalOnlineTestOptions,
          visible: true,
        },
        modalOnlineTestProps: {
          ...modalOnlineTestProps,
          paperId,
          source: context.source,
          defaultSubjectId: hasQueryValue(context.subjectId)
            ? context.subjectId
            : this.state.subjectId,
          defaultCourseId: context.courseId,
          defaultUnitId: context.unitId,
          defaultLessonId: context.lessonId,
          defaultSemesterId: context.semesterId,
          defaultGradeId: hasQueryValue(context.gradeId)
            ? context.gradeId
            : this.state.gradeId,
          defaultLessonTitle: context.lessonTitle,
          defaultExamName:
            context.examName ||
            this.state.testName ||
            (context.lessonTitle ? `${context.lessonTitle}测验` : undefined),
        },
      },
      () => {
        console.log(this.state.modalOnlineTestOptions);
      },
    );
  };

  getCurrentPaperId = () =>
    this.paperId ||
    this.props.exampleId ||
    this.state.exampleId ||
    this.state.paperId ||
    (this.props.viewData && this.props.viewData.paperId) ||
    (this.state.viewData && this.state.viewData.paperId);

  // 点击在线查看试卷
  clickTestPaperOnline = () => {
    const paperId = this.getCurrentPaperId();
    if (!paperId) {
      message.info(
        trans(
          "detailView.paperIdMissingSaveFirst",
          "当前试卷还没有生成试卷 ID，请先完成保存",
        ),
      );
      return;
    }

    this.props
      .dispatch({
        type: "home/getViewOrDownPaper",
        payload: {
          paperId,
        },
      })
      .then(() => {
        if (this.props.viewOrDownPaper.url) {
          window.open(this.props.viewOrDownPaper.url);
        } else {
          window.open(
            `${window.location.origin}/exam#/detail/true/true/${paperId}`,
          );
        }
      });
  };

  //点击下载试卷
  clickDownload = () => {
    const paperId = this.getCurrentPaperId();
    if (!paperId) {
      message.info(
        trans(
          "detailView.paperIdMissingSaveFirst",
          "当前试卷还没有生成试卷 ID，请先完成保存",
        ),
      );
      return;
    }
    void downloadExamPaperPdf({ paperId });
  };
  clickXimu = () => {
    const paperId = this.getCurrentPaperId();
    if (!paperId) {
      message.info(
        trans(
          "detailView.paperIdMissingSaveFirst",
          "当前试卷还没有生成试卷 ID，请先完成保存",
        ),
      );
      return;
    }
    window.open(
      `${window.location.origin}/api/exam/convert/word/export?paperId=${paperId}`,
    );
  };
  clickEditTestPaper = () => {
    const paperId = this.getCurrentPaperId();
    if (!paperId) {
      message.info(
        trans(
          "detailView.paperIdMissingSaveFirst",
          "当前试卷还没有生成试卷 ID，请先完成保存",
        ),
      );
      return;
    }
    window.location.href = `${window.location.origin}/exam#/detail/false/true/${this.props.viewData.subjectId}/${paperId}`;
    this.setState({ ifEdit: true }, () => {
      // window.location.reload();
      this.initData();
    });
  };
  openTwoWay = () => {
    const paperId = this.getCurrentPaperId();
    if (!paperId) {
      message.info(
        trans(
          "detailView.paperIdMissingSaveFirst",
          "当前试卷还没有生成试卷 ID，请先完成保存",
        ),
      );
      return;
    }
    window.location.href = `${window.location.origin}/exam#/twoWayTest/${paperId}`;
  };

  openSingleInputQuestion = () => {
    const { gradeId, subjectId } = this.state;
    if (!hasQueryValue(gradeId) || !hasQueryValue(subjectId)) {
      message.info(
        trans("detailView.selectGradeAndSubjectFirst", "请先选择年级和学科"),
      );
      return;
    }

    this.setState({
      questionEditorDraft: {
        ...createEmptyQuestionDraft(),
        gradeId,
        subjectId,
      },
      questionEditorVisible: true,
    });
  };

  closeQuestionEditor = () => {
    if (this.state.questionEditorSaving) {
      return;
    }
    this.questionEditorController = undefined;
    this.setState({
      questionEditorVisible: false,
      questionEditorDraft: null,
    });
  };

  handleQuestionEditorControllerReady = (controller) => {
    this.questionEditorController = controller;
  };

  submitQuestionEditor = (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (this.state.questionEditorSaving) {
      return;
    }
    if (
      this.questionEditorController &&
      typeof this.questionEditorController.submit === "function"
    ) {
      this.questionEditorController.submit("local");
    }
  };

  buildQuestionSavePayload = (draft) => {
    const questionList = [this.normalizeQuestionDraftForSave(draft)];

    return this.getRecruitQuestionPayload({
      gradeId: draft.gradeId,
      subjectId: draft.subjectId,
      questionList,
      chapterIds: normalizeIdListForSave(
        draft.chapterSelections && draft.chapterSelections.length > 0
          ? draft.chapterSelections
          : draft.chapterIds,
      ),
      chapterValues: toSafeArray(draft.chapterLabels),
      indicatorIds: normalizeIdListForSave(draft.indicatorIds),
      knowledgeIds: normalizeIdListForSave(draft.knowledgeIds),
      knowledgeValues: toSafeArray(
        draft.knowledgeSelections && draft.knowledgeSelections.length > 0
          ? draft.knowledgeSelections
          : draft.knowledgeLabels,
      ),
    });
  };

  normalizeQuestionDraftForSave = (draft = {}) => {
    const questionType = Number(draft.type) || 5;
    const question = {
      analysis: draft.analysis || "",
      answer: questionType === 3 ? null : draft.answer || "",
      chapterIds: normalizeIdListForSave(draft.chapterIds),
      chapterLabels: toSafeArray(draft.chapterLabels),
      chapterSelections: normalizeIdListForSave(
        draft.chapterSelections && draft.chapterSelections.length > 0
          ? draft.chapterSelections
          : draft.chapterIds,
      ),
      content: draft.content || "",
      gapFillingAnswer: questionType === 3 ? draft.gapFillingAnswer : undefined,
      indicatorIds: normalizeIdListForSave(draft.indicatorIds),
      indicatorLabels: toSafeArray(draft.indicatorLabels),
      knowledgeIds: normalizeIdListForSave(draft.knowledgeIds),
      knowledgeLabels: toSafeArray(draft.knowledgeLabels),
      knowledgeSelections: normalizeIdListForSave(
        draft.knowledgeSelections && draft.knowledgeSelections.length > 0
          ? draft.knowledgeSelections
          : draft.knowledgeIds,
      ),
      optionKnowledgeSelections: toSafeArray(
        draft.optionKnowledgeSelections,
      ).map((selection) => normalizeIdListForSave(selection)),
      optionList: toSafeArray(draft.optionList),
      questionLevel: Number(draft.questionLevel) || 2,
      questionLevelName: draft.questionLevelName,
      sonQuestionList:
        questionType === 6
          ? toSafeArray(draft.sonQuestionList).map((childQuestion) =>
              this.normalizeQuestionDraftForSave(childQuestion),
            )
          : [],
      type: questionType,
    };

    if (draft.questionId) {
      question.questionId = draft.questionId;
    }

    return question;
  };

  querySavedQuestion = async (questionId) => {
    const response = await queryQuestionDetail({ questionId });
    if (!response.ifLogin) {
      loginRedirect();
      return null;
    }
    if (!response.status) {
      message.error(
        response.message ||
          trans("detailView.questionDetailFetchFailed", "题目详情获取失败"),
      );
      return null;
    }
    return response.content || null;
  };

  buildQuestionForBasket = (question, draft) => {
    const childQuestions = toSafeArray(question.sonQuestionList).map(
      (childQuestion, index) => ({
        ...childQuestion,
        questionScore: normalizeScore(
          draft.sonQuestionList &&
            draft.sonQuestionList[index] &&
            draft.sonQuestionList[index].questionScore,
        ),
      }),
    );
    const childScore = childQuestions.reduce(
      (total, childQuestion) =>
        total + (normalizeScore(childQuestion.questionScore) || 0),
      0,
    );
    const questionScore =
      normalizeScore(draft.questionScore) ||
      (childScore > 0 ? childScore : null);
    return {
      ...question,
      type: Number(question.type) || Number(draft.type) || 5,
      questionScore,
      sonQuestionList: childQuestions,
    };
  };

  appendQuestionToCurrentBasket = (question) => {
    const list =
      this.state.key == 1
        ? JSON.parse(JSON.stringify(this.state.detaiList || []))
        : JSON.parse(JSON.stringify(this.state.detaiListFreedom || []));
    const nextList =
      this.state.key == 1
        ? this.appendQuestionByType(list, question)
        : this.appendQuestionToFreeSort(list, question);

    this.updateList(nextList);
    this.setState({
      checkQuestionId: question.questionId,
    });
  };

  appendQuestionByType = (list, question) => {
    const questionType = Number(question.type) || 5;
    const targetIndex = list.findIndex(
      (item) => Number(item.moduleType) === questionType,
    );

    if (targetIndex > -1) {
      list[targetIndex].questionList = [
        ...toSafeArray(list[targetIndex].questionList),
        question,
      ];
      list[targetIndex].moduleQuestionNumber =
        list[targetIndex].questionList.length;
      list[targetIndex].moduleScore = this.getModuleScore(
        list[targetIndex].questionList,
      );
      return list;
    }

    return [
      ...list,
      {
        moduleName: getQuestionTypeName(questionType),
        moduleQuestionNumber: 1,
        moduleScore: normalizeScore(question.questionScore) || 0,
        moduleType: questionType,
        questionList: [question],
      },
    ];
  };

  appendQuestionToFreeSort = (list, question) => {
    const nextList =
      list.length > 0
        ? list
        : [
            {
              moduleName: "所有题型",
              moduleQuestionNumber: 0,
              moduleScore: 0,
              moduleType: 0,
              questionList: [],
            },
          ];
    const targetIndex =
      nextList.findIndex((item) => Number(item.moduleType) === 0) > -1
        ? nextList.findIndex((item) => Number(item.moduleType) === 0)
        : 0;

    nextList[targetIndex].questionList = [
      ...toSafeArray(nextList[targetIndex].questionList),
      question,
    ];
    nextList[targetIndex].moduleQuestionNumber =
      nextList[targetIndex].questionList.length;
    nextList[targetIndex].moduleScore = this.getModuleScore(
      nextList[targetIndex].questionList,
    );
    return nextList;
  };

  getModuleScore = (questionList = []) =>
    questionList.reduce(
      (total, question) =>
        total + (normalizeScore(question.questionScore) || 0),
      0,
    );

  handleQuestionEditorSave = async (localSavePayload) => {
    const draft = localSavePayload && localSavePayload.draft;
    if (!draft || this.state.questionEditorSaving) {
      return;
    }

    this.setState({ questionEditorSaving: true });
    try {
      const response = await saveQuestionBatch(
        this.buildQuestionSavePayload(draft),
      );
      if (!response.ifLogin) {
        loginRedirect();
        return;
      }
      if (!response.status) {
        message.error(
          response.message ||
            trans("detailView.questionSaveFailed", "题目保存失败"),
        );
        return;
      }

      const savedIds = toSafeArray(response.content);
      const questionId = savedIds[0];
      if (!questionId) {
        message.error(
          trans(
            "detailView.questionSaveMissingId",
            "题目保存失败，未返回题目 ID",
          ),
        );
        return;
      }

      const savedQuestion = await this.querySavedQuestion(questionId);
      if (!savedQuestion) {
        return;
      }

      const basketQuestion = this.buildQuestionForBasket(savedQuestion, draft);
      this.appendQuestionToCurrentBasket(basketQuestion);
      this.setState({
        gradeId: draft.gradeId,
        subjectId: draft.subjectId,
        viewData: {
          ...this.state.viewData,
          gradeId: draft.gradeId,
          subjectId: draft.subjectId,
        },
        questionEditorVisible: false,
        questionEditorDraft: null,
      });
      message.success(
        trans("detailView.questionAddedToBasket", "题目已加入试题篮"),
      );
    } catch (error) {
      console.error(error);
      message.error(trans("detailView.questionSaveFailed", "题目保存失败"));
    } finally {
      this.setState({ questionEditorSaving: false });
    }
  };
  clickPreview = () => {
    window.open(
      // `${window.location.origin}/exam#/teacherPreview/${this.testId}/true/${this.props.exampleId}`
      `${window.location.origin}/exam#/studentTest/${this.testId}/${this.props.exampleId}`,
    );
  };

  clickPreview1 = () => {
    window.open(
      // `${window.location.origin}/exam#/teacherPreview/${this.testId}/true/${this.testId}`
      `${window.location.origin}/exam#/studentTest/${this.testId}/${this.testId}`,
    );
  };

  qrcodeClick = () => {
    this.setState({
      QRcode: true,
    });
  };
  changeCheck = (checked) => {
    this.setState({
      isChecked: checked,
    });
  };
  callback = (key, test) => {
    this.setState({
      key,
    });
    if (key == 2) {
      let array = [];
      let list = JSON.parse(JSON.stringify(this.state.freedomList));
      this.state.asd.length > 0 &&
        this.state.asd.map((item) => {
          array.push(item.data);
        });
      let dataList = [
        {
          moduleName: this.state.detaiListFreedom[0]?.moduleName || "所有题型",
          moduleType: 0,
          questionList: array,
          moduleScore: this.state.detaiListFreedom[0]?.moduleScore || 0,
          moduleQuestionNumber: array.length,
        },
      ];

      list.length > 0 &&
        list.map((item, index) => {
          let array1 = [];
          if (this.state.isEdit) {
            this.state[`tagList${index + 1}`]?.length > 0 &&
              this.state[`tagList${index + 1}`].map((item, index) => {
                array1.push(item.data);
              });
          } else {
            this.state[`tagList${index + 2}`]?.length > 0 &&
              this.state[`tagList${index + 2}`].map((item, index) => {
                array1.push(item.data);
              });
          }
          dataList.push({
            moduleName: item.moduleName,
            moduleType: 0,
            questionList: array1,
            moduleScore: 0,
            moduleQuestionNumber: array1.length,
          });
        });

      if (this.state.isEdit) {
        dataList =
          dataList.length > 0 && dataList.filter((item, index) => index != 0);
      }
      this.setState(
        {
          detaiListFreedom: test == "bj" ? this.state.detaiList : dataList,
        },
        () => {
          if (test == "add") {
            const newState = JSON.parse(JSON.stringify(this.state));
            newState[`tagList${list.length + 1}`] = [];
            this.setState({ ...newState });
          }
        },
      );
    }
  };

  clickDelete = (index_) => {
    let list = JSON.parse(JSON.stringify(this.state.freedomList));
    let list1 = JSON.parse(JSON.stringify(this.state.detaiListFreedom));
    list = list.length > 0 && list.filter((item, index) => index != index_);
    list1 =
      list1.length > 0 && list1.filter((item, index) => index != index_ + 1);
    console.log(this.state, "sss");
    const newState = JSON.parse(JSON.stringify(this.state));
    list1 &&
      list1.length > 0 &&
      list1.map((item, index) => {
        let array = [];
        item.questionList.length > 0 &&
          item.questionList.map((it, ind) => {
            array.push({
              data: it,
              id: it.questionId,
              content: (
                <span
                  className={[styles.optionBox].join(" ")}
                  style={
                    this.state.checkQuestionId == it.questionId
                      ? { border: "1px solid rgba(2,88,191,1)" }
                      : null
                  }
                  id={`itemScoreViesble${it.questionId}`}
                >
                  {ind + 1}
                </span>
              ),
            });
          });
        newState[`tagList${index + 1}`] = array;
      });
    newState[`tagList${list1.length + 1}`] = [];

    this.setState(
      {
        ...newState,
        freedomList: list,
        detaiListFreedom: list1,
      },
      () => {},
    );
  };
  addNum = (ind) => {
    const { detaiListFreedom, asd, isEdit } = this.state;
    let number_ = 0;
    if (isEdit) {
      detaiListFreedom.length > 0 &&
        detaiListFreedom.map((item, index) => {
          if (ind > index) {
            number_ = number_ + item.questionList.length;
          }
        });
    }
    console.log(ind, number_, "ccc");
    return number_;
  };

  savegroup = (data, ind, id) => {
    let questArray = [];
    data.length > 0 &&
      data.map((item) => {
        questArray.push(item.data);
      });
    let freedList = JSON.parse(JSON.stringify(this.state.detaiListFreedom));
    freedList[ind].questionList = questArray;
    this.setState(
      {
        detaiListFreedom: freedList,
      },
      () => {
        console.log(this.state.asd, "zwlhhh");
        let newState = JSON.parse(JSON.stringify(this.state));
        freedList &&
          freedList.length > 0 &&
          freedList.map((item, index) => {
            newState[`tagList${index + 1}`] = [];
          });
        this.setState(
          {
            ...newState,
          },
          () => {
            let newState = JSON.parse(JSON.stringify(this.state));
            let number_ = 0;
            if (!this.state.isEdit) {
              number_ = number_ - 1;
              if (id.toArea?.id) {
                number_ = number_ + 1;
              }
              if (id.fromArea == {} && id.toArea == {}) {
                number_ = number_ + 1;
              }
            }
            freedList &&
              freedList.length > 0 &&
              freedList.map((item, index) => {
                let array = [];
                item.questionList.length > 0 &&
                  item.questionList.map((it, ind) => {
                    number_ = number_ + 1;
                    array.push({
                      data: it,
                      id: it.questionId,
                      content: (
                        <span
                          className={[styles.optionBox].join(" ")}
                          style={
                            this.state.checkQuestionId == it.questionId
                              ? { border: "1px solid rgba(2,88,191,1)" }
                              : null
                          }
                          id={`itemScoreViesble${it.questionId}`}
                          key={`itemScoreViesble${it.questionId}`}
                        >
                          {number_}
                        </span>
                      ),
                    });
                  });
                newState[`tagList${index + 1}`] = array;
              });
            this.setState({
              ...newState,
            });
          },
        );
      },
    );
  };

  renderFreedom = (index) => {
    if (index == 0) {
      return (
        <DraggableArea2
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => {
            return <div className="tag">{tag.content}</div>;
          }}
          onChange={(leftTags, e) => {
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea2>
      );
    } else if (index == 1) {
      return (
        <DraggableArea3
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => {
            return <div className="tag">{tag.content}</div>;
          }}
          onChange={(leftTags, e) => {
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea3>
      );
    } else if (index == 2) {
      return (
        <DraggableArea4
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            console.log(3, "ccc");
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea4>
      );
    } else if (index == 3) {
      return (
        <DraggableArea5
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea5>
      );
    } else if (index == 4) {
      return (
        <DraggableArea6
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea6>
      );
    } else if (index == 5) {
      return (
        <DraggableArea7
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea7>
      );
    } else if (index == 6) {
      return (
        <DraggableArea8
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            // console.log(leftTags, "345");
            // const newState = JSON.parse(JSON.stringify(this.state));
            // newState[`tagList${index + 1}`] = leftTags;
            // this.setState({ ...newState });
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea8>
      );
    } else if (index == 7) {
      return (
        <DraggableArea9
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            // console.log(leftTags, "345");
            // const newState = JSON.parse(JSON.stringify(this.state));
            // newState[`tagList${index + 1}`] = leftTags;
            // this.setState({ ...newState });
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea9>
      );
    } else if (index == 8) {
      return (
        <DraggableArea10
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            // console.log(leftTags, "345");
            // const newState = JSON.parse(JSON.stringify(this.state));
            // newState[`tagList${index + 1}`] = leftTags;
            // this.setState({ ...newState });
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea10>
      );
    } else if (index == 9) {
      return (
        <DraggableArea11
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea11>
      );
    } else if (index == 10) {
      return (
        <DraggableArea12
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea12>
      );
    } else if (index == 11) {
      return (
        <DraggableArea13
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea13>
      );
    } else if (index == 12) {
      return (
        <DraggableArea14
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            // console.log(leftTags, "345");
            // const newState = JSON.parse(JSON.stringify(this.state));
            // newState[`tagList${index + 1}`] = leftTags;
            // this.setState({ ...newState });
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea14>
      );
    } else if (index == 13) {
      return (
        <DraggableArea15
          tags={
            this.state[`tagList${index + 1}`]
              ? this.state[`tagList${index + 1}`]
              : []
          }
          render={({ tag }) => <div className="tag">{tag.content}</div>}
          onChange={(leftTags, e) => {
            // console.log(leftTags, "345");
            // const newState = JSON.parse(JSON.stringify(this.state));
            // newState[`tagList${index + 1}`] = leftTags;
            // this.setState({ ...newState });
            this.savegroup(leftTags, index, e);
          }}
        ></DraggableArea15>
      );
    }
  };

  clickPop1 = () => {
    if (this.state.key == 1) return;
    this.setState({
      isPop1: true,
    });
  };
  clickPop2 = () => {
    if (this.state.key == 2) return;
    this.setState({
      isPop2: true,
    });
  };
  cancelCur2 = () => {
    this.setState({
      isPop1: false,
    });
  };
  cancelCur1 = () => {
    this.setState({
      isPop2: false,
    });
  };
  confirmCur1 = () => {
    this.callback(2);
    this.setState({
      isPop2: false,
    });
  };
  confirmCur2 = () => {
    if (this.state.isEdit) {
      this.props
        .dispatch({
          type: "home/getTestView",
          payload: {
            paperId: this.paperId || this.testId,
            specification: true,
          },
        })
        .then(() => {
          this.setState(
            {
              isPop1: false,
              detaiList: this.props.viewData.moduleList || [],
              viewData: this.props.viewData,
              stageId: this.props.viewData.yearPeriodId,
              gradeId: this.props.viewData.gradeId,
              subjectId: this.props.viewData.subjectId,
              testName: this.props.viewData.title,
              type: this.getPaperType(),
              test: this.individualization
                ? this.paperId
                : this.props.viewData.personalizedPaperId,
              key:
                this.props.viewData.moduleList.length > 0 &&
                this.props.viewData.moduleList[0].moduleType == 0
                  ? 2
                  : 1,
              isEdit:
                this.props.viewData.moduleList.length > 0 &&
                this.props.viewData.moduleList[0].moduleType == 0
                  ? true
                  : false,
            },
            () => {
              // this.callback(this.state.key, "bj");
              // this.props.dispatch({
              //   type: "global/getGrade",
              //   payload: {
              //     stageId: this.state.stageId,
              //   },
              // });
              // if (this.props.viewData.type == 10) {
              this.props.dispatch({
                type: "home/getExam",
                payload: {
                  pageNo: 1,
                  limit: 100,
                  examName: null,
                  examTypeCode:
                    this.props.viewData.type === 0
                      ? ""
                      : this.props.viewData.type,
                  subjectId: this.state.subjectId,
                  gradeId: this.state.gradeId,
                  semesterId: this.props.currentSemester.id,
                },
              });
              // }
              this.props.dispatch({
                type: "global/getSubject",
                payload: {
                  gradeId: this.state.gradeId,
                },
              });
            },
          );
        });
    } else {
      this.setState({
        isPop1: false,
      });
    }
    this.callback(1);
  };

  testChange = () => {
    console.log(123);
    const { modalTestOptions, modalTestProps } = this.state;
    this.setState({
      modalTestOptions: {
        ...modalTestOptions,
        visible: true,
      },
      modalTestProps: {
        ...modalTestProps,
        isSegmentation: this.props.viewData.isSegmentation,
      },
    });
  };
  changeShowAnswer = (checked) => {
    console.log(checked);
    this.setState({
      isAnswer: checked,
    });
  };
  changeShowAnalysis = (checked) => {
    this.setState({
      isAnalysis: checked,
    });
  };

  toggleLeftContent = () => {
    this.setState({
      isLeftContentVisible: !this.state.isLeftContentVisible,
    });
  };
  batchDifficult = (value, key, index, ind) => {
    let list = [];
    list =
      this.state.key == 1
        ? JSON.parse(JSON.stringify(this.state.detaiList || []))
        : JSON.parse(JSON.stringify(this.state.detaiListFreedom || []));

    let idList = [];
    console.log(value, "value");
    if (key !== "questionLevelType" && value && value.length > 0) {
      value.map((item) => {
        let array = item.split("-");
        idList.push(array.at(-1));
      });
    }
    let questionIdList = [];
    if (list && list.length > 0) {
      for (const item of list) {
        if (item.questionList && item.questionList.length > 0) {
          for (const item1 of item.questionList) {
            if (item1.checked) {
              questionIdList.push(item1.questionId);
            }
          }
        }
      }
    }

    if (key == "knowledge") {
      this.props
        .dispatch({
          type: "home/updateQuestionKnowlegeOrLevel",
          payload: {
            questionIdList: questionIdList,
            knowlegeIdList: idList,
          },
        })
        .then(() => {
          message.success(
            trans("detailView.modificationSucceeded", "修改成功"),
          );
        });
    } else if (key == "questionLevelType") {
      this.props
        .dispatch({
          type: "home/updateQuestionKnowlegeOrLevel",
          payload: {
            questionIdList: questionIdList,
            questionLevel: value,
          },
        })
        .then(() => {
          message.success(
            trans("detailView.modificationSucceeded", "修改成功"),
          );
        });
    } else if (key == "indicator") {
      updateQuestionIndicator({
        questionIdList: questionIdList,
        indicatorIds: idList,
      }).then((res) => {
        message.success(trans("detailView.modificationSucceeded", "修改成功"));
      });
    } else if (key == "chapter") {
      updateQuestionChapter({
        questionIdList: questionIdList,
        chapterIds: idList,
      }).then((res) => {
        message.success(trans("detailView.modificationSucceeded", "修改成功"));
      });
    }
    if (list && list.length > 0) {
      for (const item of list) {
        if (item.questionList && item.questionList.length > 0) {
          for (const item1 of item.questionList) {
            if (item1.checked) {
              if (key == "knowledge") {
                item1.knowledgeIds = value;
                item1.knowledgeValues = value;
              } else if (key == "questionLevelType") {
                item1.questionLevel = value;
              } else if (key == "indicator") {
                item1.indicatorIds = value;
                item1.indicatorValues = value;
              } else if (key == "chapter") {
                item1.chapterId = value;
                item1.chapterValues = value;
              }
            }
          }
        }
      }
    }
    this.updateList(list);
  };
  popoverVisChange = (visible, key) => {
    console.log(document, "document");
    if (!visible) {
      return;
    }

    let parentDom = document.getElementsByClassName(key);
    if (parentDom) {
      setTimeout(() => {
        parentDom[0]?.getElementsByClassName("ant-select-selection")[0].click();
      }, 150);
    }
  };

  confirmFileChange = (id, fileName) => {
    this.props.dispatch({
      type: "home/reducerSaveViewData",
      payload: {
        paperFileId: id,
        paperFileName: fileName,
        ...this.props.viewData,
      },
    });
  };

  /**
   * 题目分数发生改变
   * @param {object} e -
   */
  questionScoreChange = (e) => {
    const { type, questionId, value } = e;
    let cloneDetailList = [];
    cloneDetailList =
      this.state.key == 1
        ? JSON.parse(JSON.stringify(this.state.detaiList))
        : JSON.parse(JSON.stringify(this.state.detaiListFreedom));
    if (type == "question" && cloneDetailList && cloneDetailList.length > 0) {
      cloneDetailList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          let total = 0;
          item.questionList.map((it) => {
            if (it.questionId == questionId) {
              it.questionScore = Number(value);
            }
            total += it.questionScore ? Number(it.questionScore) : 0;
          });
          item.moduleScore = total;
        }
      });
    } else if (type == "sonQuestion") {
      cloneDetailList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          let total = 0;
          item.questionList.map((it) => {
            let number_ = null;
            if (it.sonQuestionList && it.sonQuestionList.length > 0) {
              it.sonQuestionList.map((index) => {
                if (index.questionId === questionId) {
                  index.questionScore = Number(value);
                }
                number_ += index.questionScore
                  ? Number(index.questionScore)
                  : 0;
              });
              it.questionScore = number_;
            }
            total += it.questionScore;
          });
          item.moduleScore = total;
        }
      });
    }

    this.updateList(cloneDetailList);

    let count = 0;
    let updateModelScore = {};
    if (cloneDetailList)
      for (const item of cloneDetailList) {
        item.questionList?.map((index) => {
          count += index.questionScore ? index.questionScore : 0;
          if (index.type == 6) {
            for (const sonQu of index.sonQuestionList) {
              if (sonQu.questionId == questionId) {
                updateModelScore = {
                  moduleScore: item.moduleScore,
                  moduleName: item.moduleName,
                  questionList: [
                    {
                      questionId: index.questionId,
                      questionScore: index.questionScore,
                      sonQuestionList: [
                        {
                          questionId: sonQu.questionId,
                          questionScore: sonQu.questionScore,
                        },
                      ],
                    },
                  ],
                };
              }
            }
          } else {
            if (index.questionId == questionId) {
              updateModelScore = {
                moduleScore: item.moduleScore,
                moduleName: item.moduleName,
                questionList: [
                  {
                    questionId: index.questionId,
                    questionScore: index.questionScore,
                  },
                ],
              };
            }
          }
        });
      }

    updateQuestionScore({
      examPaperId: this.props.viewData.paperId,
      totalScore: count,
      updateModelScore: updateModelScore,
    }).then((res) => {
      if (res.status) {
        message.success(trans("detailView.operationSucceeded", "操作成功"));
      } else {
        message.success(res.message);
      }
    });
  };

  privateStatusChange = (checked) => {
    updatePaperPrivateStatus({
      paperId: this.props.viewData.paperId,
      status: checked,
    }).then((res) => {
      if (res.status) {
        message.success(
          trans("detailView.privateStatusUpdateSucceeded", "操作成功！"),
        );
      } else {
        message.error(trans("detailView.operationFailed", "操作失败！"));
        this.setState({ privateStatus: false });
      }
    });
    this.setState({ privateStatus: checked });
  };

  render() {
    const {
      viewData,
      stageList,
      gradeList,
      subjectList,
      yearList,
      typeList,
      allGradeList,
      labelList,
    } = this.props;
    const {
      deleteList,
      detaiList,
      checkQuestionId,
      itemscoreValue,
      blurTitle,
      freedomList,
      detaiListFreedom,
      isPop1,
      isPop2,
    } = this.state;
    const currentDetailList =
      this.state.key == 1 ? detaiList : detaiListFreedom;
    const currentDetailHasQuestions = toSafeArray(currentDetailList).some(
      (item) => toSafeArray(item.questionList).length > 0,
    );

    let newTree1 = [];

    if (labelList && labelList.length > 0) {
      newTree1 = JSON.parse(JSON.stringify(labelList));
      const handeData = (list) => {
        for (const threeItem of list) {
          threeItem.id = threeItem.key;
          threeItem.value = `${threeItem.title}-${threeItem.pinyin || ""}-${threeItem.id}`;
          if (threeItem.children && threeItem.children.length > 0) {
            handeData(threeItem.children);
          }
        }
      };
      handeData(newTree1);
      console.log(newTree1, "素养");
    }
    const SortableItem = SortableElement(({ value }) => (
      <span
        className={styles.optionBox}
        style={
          checkQuestionId && checkQuestionId === value
            ? { border: "1px solid rgba(2,88,191,1)" }
            : null
        }
        onClick={this.scrollView.bind(this, value)}
        id={`itemScoreViesble${value}`}
      >
        {this.renderNumber(value)}
      </span>
    ));
    const SortableList = SortableContainer(({ items }) => {
      return (
        <div className={styles.moveListContent}>
          {items.map((value, index) => (
            <SortableItem
              key={`item-${value.questionId}`}
              index={index}
              value={value.questionId}
            />
          ))}
        </div>
      );
    });

    return (
      <div className={styles.detailBox}>
        <div className={styles.header}>
          <div className={[styles.closeIcon].join(" ")} onClick={this.back}>
            <Icon type="close" />
          </div>
          {this.state.ifEdit ? (
            <div className={[styles.viewTitle].join(" ")}>
              {trans("global.editPaper", "编辑试卷")}
            </div>
          ) : (
            <div className={[styles.viewTitle].join(" ")}>
              {trans("detail.viewTitle", "预览试卷")}
            </div>
          )}

          <div className={styles.totalScoreBox}>
            {trans("global.manfen", "满分")}&nbsp;
            {this.state.viewData.totalScore}
          </div>

          <div className={styles.headeRight}>
            {this.state.ifEdit ? null : (
              <div
                style={{
                  display: "inline-block",
                  height: "32px",
                  lineHeight: "32px",
                }}
              >
                {trans("global.secrecy", "保密")}
                <Tooltip
                  placement="top"
                  title={
                    <div>
                      {trans(
                        "global.confidentialPaperVisibility",
                        "保密的试卷只能创建人和学科首席可见",
                      )}
                    </div>
                  }
                >
                  <span
                    style={{
                      display: "inline-block",
                      transform: "translateY(3px)",
                      margin: "0 3px",
                    }}
                  >
                    <i className={styles.iconfont} style={{ fontSize: "18px" }}>
                      &#xe82b;
                    </i>
                  </span>
                </Tooltip>
                <Switch
                  onChange={(checked) => {
                    this.privateStatusChange(checked);
                  }}
                  checked={this.state.privateStatus}
                />
              </div>
            )}

            {this.state.ifEdit ? null : (
              <a onClick={this.clickEditTestPaper}>
                <span className={styles.downloadTestPaper}>
                  {trans("global.editPaper", "编辑试卷")}
                </span>
              </a>
            )}

            {this.isRecruitQuestionMode() ||
            !(this.paperId || this.props.viewData.paperId) ? null : (
              <a onClick={this.openTwoWay}>
                <span className={styles.downloadTestPaper}>
                  {trans("global.setItemDetails", "设置细目表")}
                </span>
              </a>
            )}

            {this.ifView &&
            this.ifTest &&
            viewData.moduleList &&
            viewData.moduleList.length > 0 ? (
              <a onClick={this.clickXimu}>
                <span className={styles.downloadTestPaper}>
                  {trans("global.downLoadCard", "下载答题卡")}
                </span>
              </a>
            ) : null}

            {this.props.viewData.paperId ? (
              <span
                className={styles.downloadTestPaper}
                onClick={() => this.clickDownload()}
              >
                {trans("global.downloadTestPaper3", "下载试卷")}
              </span>
            ) : null}

            {this.state.ifEdit ? (
              <div
                onClick={this.submit}
                style={{
                  background: "#0445FC",
                  color: "#fff",
                }}
                className={styles.downloadTestPaper}
              >
                {trans("global.save", "保存")}
              </div>
            ) : null}

            {this.props.viewData.ifView ? (
              <span
                className={styles.downloadTestPaper}
                onClick={this.testChange}
              >
                {trans("global.initiateTest", "发起测验")}
              </span>
            ) : null}
            <FileUploadModal
              defaultFile={{
                id: this.props.viewData.paperFileId,
                name: this.props.viewData.paperFileName,
              }}
              paperId={this.props.viewData.paperId}
              onOk={this.confirmFileChange}
              customButton={
                <span
                  style={{
                    color: this.props.viewData.paperFileId
                      ? " rgba(1, 17, 61, 0.65)"
                      : " rgba(1, 17, 61, 0.45)",
                  }}
                  className={styles.downloadTestPaper}
                >
                  {trans("global.OriginalQuestionnaire", "原始问卷")}
                </span>
              }
            />
          </div>
        </div>

        <div className={styles.detailContent}>
          <div
            className={`${styles.contentLeft} ${this.state.isLeftContentVisible && this.state.ifEdit ? styles.leftBox : ""}`}
          >
            <div className={styles.testList}>
              <div className={styles.testName}>
                <div className={styles.testNameRight}>
                  {this.state.ifEdit ? (
                    <>
                      <div
                        style={{
                          textAlign: "center",
                          height: "40px",
                          width: "100%",
                        }}
                      >
                        <Input
                          placeholder={trans(
                            "detail.enterName",
                            "请在此输入试卷的标题（必填）",
                          )}
                          value={this.state.testName}
                          onChange={this.changeTestName}
                          onBlur={this.onBlurTitle}
                          onPressEnter={this.onBlurTitle}
                        />
                        <div className={styles.ccc}></div>
                      </div>
                    </>
                  ) : (
                    <div>{this.props.viewData.title}</div>
                  )}
                </div>
                {this.state.ifEdit ? null : (
                  <div className={styles.testNameSwitch}>
                    <span className={styles.switchTitle}>
                      {trans("global.showAnswers", "显示答案")}
                    </span>
                    <Switch
                      checked={this.state.isChecked}
                      onChange={this.changeCheck}
                    />
                  </div>
                )}
              </div>
              {currentDetailList && currentDetailList.length > 0 ? (
                <DetailView
                  detailList={currentDetailList}
                  onRef={this.onRef}
                  isDetail={true}
                  updateDeleteList={this.updateDeleteList}
                  updateList={this.updateList}
                  ifEdit={this.state.ifEdit}
                  deleteList={deleteList}
                  checkQuestion={this.checkQuestion}
                  checkQuestionId={checkQuestionId}
                  dropQuestionChange={this.dropQuestionChange}
                  subjectId={viewData.subjectId}
                  subjectName={viewData.subjectName}
                  totalScore={this.state.viewData.totalScore}
                  paperId={this.testId}
                  showAddTopic={this.showAddTopic}
                  showSort={this.showSort}
                  ifView={this.ifView}
                  isEdit={this.state.isEdit}
                  isShowAnswer={this.state.isAnswer}
                  isShowAnalysis={this.state.isAnalysis}
                  keyQuestion={this.state.key}
                  gradeId={this.state.gradeId}
                  treeData={this.props.treeData}
                  labelList={this.props.labelList}
                  chapterList={this.props.chapterList}
                  onQuestionScoreChange={this.questionScoreChange} //试题分数发生改变
                  isChecked={this.state.isChecked}
                  // scoreLoading={this.state.scoreLoading}
                />
              ) : this.state.ifEdit ? (
                <div className={styles.emptyPaperEditor}>
                  <div className={styles.emptyPaperEditorTitle}>
                    {trans("global.basketName", "试题篮")}
                  </div>
                  <div className={styles.emptyPaperEditorText}>
                    {trans(
                      "detailView.emptyPaperTip",
                      "当前试卷还没有题目，可以先新增题目。",
                    )}
                  </div>
                  <span
                    className={styles.emptyPaperEditorButton}
                    onClick={this.openSingleInputQuestion}
                  >
                    {trans("global.addQuestion", "新增题目")}
                  </span>
                </div>
              ) : null}
            </div>

            {deleteList.length > 0 ? (
              <div className={styles.deleteList}>
                <div className={styles.deletedTitle}>
                  {trans("detail.recover", "回收站")}({deleteList.length})
                </div>
                {deleteList.map((item, index) => (
                  <div className={styles.deleteBox} id="deleteBox" key={index}>
                    <div className={styles.dleteOptionBox}>
                      <Popover
                        trigger="hover"
                        content={trans("global.recordTest", "加入试卷")}
                      >
                        <div
                          className={[
                            styles.deleteButton,
                            styles.iconfont,
                            styles.inline,
                          ].join(" ")}
                          onClick={this.refList.bind(this, item)}
                        >
                          &#xe732;
                        </div>
                      </Popover>
                    </div>
                    <div className={styles.deleteContent}>
                      <div
                        dangerouslySetInnerHTML={{ __html: item.content }}
                        className={styles.content}
                      ></div>
                      {item.optionList && item.optionList.length > 0
                        ? item.optionList.map((index_, op) => (
                            <div className={styles.optionList} key={op}>
                              <div className={styles.opListLeft}>
                                <i
                                  className={[
                                    styles.iconfont,
                                    styles.optionIcon,
                                  ].join(" ")}
                                >
                                  &#xe6a8;
                                </i>
                              </div>
                              <div
                                className={styles.opListRight}
                                dangerouslySetInnerHTML={{
                                  __html: index_.answers,
                                }}
                              ></div>
                            </div>
                          ))
                        : null}
                      <div className={styles.moduleBottom}>
                        <div
                          className={[styles.inline, styles.cursor].join(" ")}
                          onClick={this.viewAnalysis.bind(
                            this,
                            item.questionId,
                          )}
                        >
                          <i className={styles.iconfont}>&#xe631;</i>
                          {trans("detail.viewAnalysis", "查看解析")}
                        </div>
                      </div>
                      <div
                        id={`deleteanalysis${item.questionId}`}
                        className={styles.analysisBox}
                        dangerouslySetInnerHTML={{ __html: item.analysis }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div
            className={`${styles.contentRight} ${this.state.isLeftContentVisible && this.state.ifEdit ? styles.hidenContentRight : ""}`}
          >
            {this.state.ifEdit ? (
              <div
                className={`${styles.handle} ${this.state.isLeftContentVisible ? styles.close : styles.open}`}
                onClick={() => this.toggleLeftContent()}
              >
                {this.state.isLeftContentVisible ? (
                  <Icon
                    type="caret-left"
                    style={{ transform: "translateX(-1px)" }}
                  />
                ) : (
                  <Icon type="caret-right" />
                )}
              </div>
            ) : null}

            <div style={{ height: "100%", width: "100%", overflow: "auto" }}>
              <div className={styles.searchBar}>
                <div style={{ fontSize: "16px" }} className={styles.titleScope}>
                  {trans("global.scopeOfApplication", "适用范围")}
                </div>
                <div className={styles.applyBox}>
                  <span className={styles.rightSpan}>
                    {trans("global.grade", "年级")}
                  </span>
                  <Select
                    onChange={this.changeGrade}
                    value={this.state.gradeId}
                    placeholder={trans(
                      "global.pleaseSelectGrade",
                      "请选择年级",
                    )}
                    disabled={this.state.ifEdit ? false : true}
                  >
                    {allGradeList &&
                      allGradeList.length > 0 &&
                      allGradeList.map((item) => (
                        <Option value={item.gradeId} key={item.gradeId}>
                          {item.name}
                        </Option>
                      ))}
                  </Select>
                </div>
                <div className={styles.applyBox}>
                  <span className={styles.rightSpan}>
                    &nbsp; {trans("global.subject", "学科")}
                  </span>
                  <Select
                    value={this.state.subjectId}
                    disabled={this.state.ifEdit ? false : true}
                    placeholder={trans(
                      "global.pleaseSelectSubject",
                      "请选择学科",
                    )}
                    onChange={this.changeSubject}
                  >
                    {subjectList && subjectList.length > 0 ? (
                      subjectList.map((item) => (
                        <Option value={item.id} key={item.id}>
                          {item.name}
                        </Option>
                      ))
                    ) : (
                      <Option
                        value={viewData.subjectId}
                        key={viewData.subjectId}
                      >
                        {viewData.subjectName}
                      </Option>
                    )}
                  </Select>
                </div>
                <div className={styles.applyBox}>
                  <span className={styles.rightSpan}>
                    {trans("global.type", "类型")}
                  </span>
                  {this.isRecruitPaperMode() ? (
                    <Input value={this.getRecruitPaperTypeName()} disabled />
                  ) : (
                    <Select
                      value={this.state.type}
                      onChange={this.changeType}
                      placeholder={trans(
                        "global.pleaseSelectType",
                        "请选择类型",
                      )}
                      disabled={this.state.ifEdit ? false : true}
                    >
                      {typeList &&
                        typeList.length &&
                        typeList.map((item) => (
                          <Option value={item.code}>{item.typeName}</Option>
                        ))}
                    </Select>
                  )}
                </div>
                {this.state.type == 10 ? (
                  <div className={styles.applyBox}>
                    <span className={styles.rightSpan}>
                      &nbsp; {trans("detailView.link", "关联")}
                    </span>
                    <Select
                      value={this.state.test}
                      onChange={this.changeTest}
                      placeholder={trans(
                        "global.pleaseSelectTest",
                        "请选择试卷",
                      )}
                      style={{ width: "200px" }}
                      disabled={this.state.ifEdit ? false : true}
                    >
                      {this.props.examList?.examList &&
                      this.props.examList?.examList.length
                        ? this.props.examList.examList.map((item) => (
                            <Option value={item.id} key={item.id}>
                              <Tooltip title={item.title || item.examName}>
                                {item.title || item.examName}
                              </Tooltip>
                            </Option>
                          ))
                        : null}
                    </Select>
                  </div>
                ) : null}
              </div>
              <div className={styles.contentRightMessage}>
                <div className={styles.testType} style={{ display: "none" }}>
                  <span className={styles.typeBox}>
                    <div className={styles.iconfont}>&#xe76a;</div>
                    <div>{trans("global.ppt", "幻灯片模式")}</div>
                  </span>
                  <span className={[styles.typeBox, styles.light].join(" ")}>
                    <div className={styles.iconfont}>&#xe6aa;</div>
                    <div>{trans("global.testType", "试卷模式")}</div>
                  </span>
                </div>

                <div style={{ marginTop: "20px", display: "none" }}>
                  <span>{trans("global.countTime", "计算时间")}</span>
                  <Switch
                    checkedChildren={trans("global.open", "开启")}
                    unCheckedChildren="关闭"
                    defaultChecked
                    size={"middle"}
                    disabled={true}
                  />
                </div>
              </div>

              <div className={styles.contentRightOption}>
                <div className={styles.questionListHeader}>
                  {this.ifView && this.ifTest ? (
                    <div className={styles.optionTitle}>
                      {trans("detail.questionList", "题目列表")}
                    </div>
                  ) : (
                    <div className={styles.classifyBox}>
                      <Popconfirm
                        title={trans(
                          "detailView.switchPaperModeConfirm",
                          "切换组卷方式，您当前试题的顺序将不会保存，请确认是否切换组卷方式？",
                        )}
                        onConfirm={this.confirmCur1}
                        onCancel={this.cancelCur1}
                        okText={trans("global.sure", "确定")}
                        cancelText={trans("global.cancle", "取消")}
                        icon={false}
                        overlayStyle={{ width: "270px" }}
                        overlayClassName={styles.curtey}
                        visible={isPop2}
                      >
                        <span
                          onClick={() => this.clickPop1()}
                          className={[
                            styles.sortQuestionType,
                            this.state.key == 1 ? styles.blurBom : "",
                          ].join(" ")}
                        >
                          {trans("global.sortQuestionType", "按题型排序")}
                        </span>
                      </Popconfirm>
                      <Popconfirm
                        title={trans(
                          "detailView.switchPaperModeConfirm",
                          "切换组卷方式，您当前试题的顺序将不会保存，请确认是否切换组卷方式？",
                        )}
                        onConfirm={this.confirmCur2}
                        onCancel={this.cancelCur2}
                        okText={trans("global.sure", "确定")}
                        cancelText={trans("global.cancle", "取消")}
                        icon={false}
                        overlayStyle={{ width: "270px" }}
                        overlayClassName={styles.curtey}
                        visible={isPop1}
                      >
                        <span
                          onClick={() => this.clickPop2()}
                          className={[
                            styles.freeSort,
                            this.state.key == 2 ? styles.blurBom : "",
                          ].join(" ")}
                        >
                          {trans("global.freeSort", "自由排序")}
                        </span>
                      </Popconfirm>
                    </div>
                  )}
                  {this.state.ifEdit && currentDetailHasQuestions ? (
                    <span
                      className={styles.addQuestionButton}
                      onClick={this.openSingleInputQuestion}
                    >
                      {trans("global.addQuestion", "新增题目")}
                    </span>
                  ) : null}
                </div>

                <div>
                  {/* <div>题目列表</div> */}
                  {this.state.key == 1 ? (
                    <div>
                      {detaiList && detaiList.length > 0 ? (
                        detaiList.map((item, index) => (
                          <div className={styles.moveList} key={index}>
                            <div className={styles.moveListTitle}>
                              <div style={{ lineHeight: "24px" }}>
                                <i
                                  className={styles.iconfont}
                                  draggable={this.state.ifEdit}
                                  onDragStart={this.ondragstart}
                                  onDragOver={this.ondragover}
                                  onDragLeave={this.ondragleave}
                                  onDrop={this.ondrop}
                                  onDragEnter={this.ondragenter}
                                  id={`${index}`}
                                  style={{ display: "none" }}
                                >
                                  &#xe643;
                                </i>
                                <span
                                  className={styles.contentVisible}
                                  id={`itemNameViesble${index}`}
                                >
                                  {this.state.ifEdit && !this.props.ifStu ? (
                                    <Popover
                                      destroyTooltipOnHide={true}
                                      content={
                                        <div>
                                          <div>
                                            <Input
                                              onChange={this.itemNameChange.bind(
                                                this,
                                                index,
                                              )}
                                              defaultValue={item.moduleName}
                                              onBlur={this.sureItemName.bind(
                                                this,
                                                index,
                                              )}
                                              onPressEnter={this.sureItemName.bind(
                                                this,
                                                index,
                                              )}
                                              id="inpID1"
                                            />
                                          </div>
                                        </div>
                                      }
                                      trigger="click"
                                      visible={
                                        this.state[`itemNameViesble${index}`]
                                      }
                                      placement={"bottom"}
                                      overlayClassName={styles.titlePopover}
                                      getPopupContainer={() =>
                                        document.getElementById(
                                          `itemNameViesble${index}`,
                                        )
                                      }
                                    >
                                      <span
                                        onClick={this.changeItemNameVisible.bind(
                                          this,
                                          index,
                                        )}
                                        title={item.moduleName}
                                        style={{ cursor: "pointer" }}
                                      >
                                        {convertToChineseNumber(index + 1)}、
                                        {item.moduleName}
                                      </span>
                                    </Popover>
                                  ) : (
                                    <span
                                      style={{ cursor: "pointer" }}
                                      title={item.moduleName}
                                    >
                                      {convertToChineseNumber(index + 1)}、
                                      {item.moduleName}
                                    </span>
                                  )}
                                </span>
                                <span className={styles.topicScore}>
                                  ({this.renderScore(index)}
                                  {trans("global.point", "分")})
                                </span>
                              </div>
                              {this.state.ifEdit ? (
                                <div
                                  className={styles.modultScore}
                                  id={`countScoreBox${index}`}
                                >
                                  <Dropdown
                                    trigger={["click"]}
                                    overlay={() => (
                                      <Menu>
                                        <Menu.Item
                                          onClick={this.clickMoveUp.bind(
                                            this,
                                            index,
                                          )}
                                        >
                                          {trans("global.moveUp", "向上移动")}
                                        </Menu.Item>
                                        <Menu.Item
                                          onClick={this.clickMoveDown.bind(
                                            this,
                                            index,
                                          )}
                                        >
                                          {trans("global.moveDown", "向下移动")}
                                        </Menu.Item>
                                      </Menu>
                                    )}
                                    placement="bottomCenter"
                                    onVisibleChange={this.sort.bind(
                                      this,
                                      index,
                                    )}
                                    overlayClassName={styles.dropdownMore}
                                  >
                                    <Tooltip
                                      title={trans(
                                        "global.moreBigQuestion",
                                        "移动大题位置",
                                      )}
                                      arrowPointAtCenter={true}
                                      placement="top"
                                    >
                                      <span
                                        className={[
                                          styles.shadow,
                                          this.state[`moveUpDown${index}`]
                                            ? styles.shadowClick
                                            : "",
                                        ].join(" ")}
                                        // onClick={this.sort.bind(this, index)}
                                      >
                                        <i
                                          className={[
                                            styles.iconfont,
                                            styles.moduleSort,
                                            this.state[`moveUpDown${index}`]
                                              ? styles.iconClick
                                              : "",
                                          ].join(" ")}
                                          // onClick={this.sort.bind(this, index)}
                                        >
                                          &#xe859;
                                        </i>
                                      </span>
                                    </Tooltip>
                                  </Dropdown>
                                  <Tooltip
                                    title={trans(
                                      "detail.addTestQuestions",
                                      "添加试题",
                                    )}
                                    arrowPointAtCenter={true}
                                    placement="top"
                                  >
                                    <span
                                      className={[
                                        styles.shadow,
                                        this.state[`addTopic${index}`]
                                          ? styles.shadowClick
                                          : "",
                                      ].join(" ")}
                                      style={{ margin: "0 4px" }}
                                    >
                                      <i
                                        className={[
                                          styles.score,
                                          styles.iconfont,
                                          this.state[`addTopic${index}`]
                                            ? styles.iconClick
                                            : "",
                                        ].join(" ")}
                                        onClick={this.showModal.bind(
                                          this,
                                          item.moduleType,
                                          index,
                                        )}
                                      >
                                        &#xe85b;
                                      </i>
                                    </span>
                                  </Tooltip>
                                  <span>{this.renderTitle(item, index)}</span>
                                </div>
                              ) : null}
                            </div>
                            <SortableList
                              distance={5}
                              items={item.questionList}
                              axis="xy"
                              onSortEnd={({ oldIndex, newIndex }) =>
                                this.onSortEndTest(index, {
                                  oldIndex,
                                  newIndex,
                                })
                              }
                            />
                          </div>
                        ))
                      ) : this.state.ifEdit ? (
                        <div className={styles.emptyPaperBasket}>
                          <div className={styles.emptyPaperBasketTitle}>
                            {trans("global.basketName", "试题篮")}
                          </div>
                          <div className={styles.emptyPaperBasketText}>
                            {trans(
                              "detailView.emptyBasketTip",
                              "当前试题篮还没有题目，可以先新增题目。",
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <div className={styles.freeSortBox}>
                        {this.state.isEdit ? null : (
                          <div className={styles.moveList}>
                            <div className={styles.moveListTitle}>
                              <div style={{ lineHeight: "24px" }}>
                                <span
                                  className={styles.contentVisible}
                                  id={`itemNameViesbleF${0}`}
                                >
                                  {trans("detailView.sectionPrefix", "一、")}
                                  {this.state.ifEdit && !this.props.ifStu ? (
                                    <Popover
                                      destroyTooltipOnHide={true}
                                      content={
                                        <div>
                                          <div>
                                            <Input
                                              onChange={this.itemNameChange.bind(
                                                this,
                                                0,
                                              )}
                                              defaultValue={
                                                detaiListFreedom[0]?.moduleName
                                              }
                                              onBlur={this.sureItemName1.bind(
                                                this,
                                                0,
                                              )}
                                              onPressEnter={this.sureItemName1.bind(
                                                this,
                                                0,
                                              )}
                                              id="inpID2"
                                            />
                                          </div>
                                        </div>
                                      }
                                      trigger="click"
                                      visible={
                                        this.state[`itemNameViesbleF${0}`]
                                      }
                                      placement={"bottom"}
                                      overlayClassName={styles.titlePopover}
                                      getPopupContainer={() =>
                                        document.getElementById(
                                          `itemNameViesbleF${0}`,
                                        )
                                      }
                                    >
                                      <span
                                        onClick={this.changeItemNameVisibleF.bind(
                                          this,
                                          0,
                                        )}
                                        title={
                                          detaiListFreedom[0]?.moduleName
                                            ? detaiListFreedom[0]?.moduleName
                                            : trans(
                                                "global.allQuestionTypes",
                                                "所有题型",
                                              )
                                        }
                                        style={{ cursor: "pointer" }}
                                      >
                                        {detaiListFreedom[0]?.moduleName
                                          ? detaiListFreedom[0]?.moduleName
                                          : trans(
                                              "global.allQuestionTypes",
                                              "所有题型",
                                            )}
                                      </span>
                                    </Popover>
                                  ) : (
                                    <span
                                      style={{ cursor: "pointer" }}
                                      title={
                                        detaiListFreedom[0]?.moduleName
                                          ? detaiListFreedom[0]?.moduleName
                                          : trans(
                                              "global.allQuestionTypes",
                                              "所有题型",
                                            )
                                      }
                                    >
                                      {detaiListFreedom[0]?.moduleName
                                        ? detaiListFreedom[0]?.moduleName
                                        : trans(
                                            "global.allQuestionTypes",
                                            "所有题型",
                                          )}
                                    </span>
                                  )}
                                </span>
                                <span className={styles.topicScore}>
                                  ({this.renderScorefr(0)}
                                  {trans("global.point", "分")})
                                </span>
                              </div>
                              {this.state.ifEdit ? (
                                <div
                                  className={styles.modultScore}
                                  id={`countScoreBoxF0`}
                                >
                                  <Tooltip
                                    title={trans(
                                      "detail.addTestQuestions",
                                      "添加试题",
                                    )}
                                    arrowPointAtCenter={true}
                                    placement="top"
                                  >
                                    <span
                                      className={[styles.shadow].join(" ")}
                                      style={{ margin: "0 4px" }}
                                    >
                                      <i
                                        className={[
                                          styles.score,
                                          styles.iconfont,
                                        ].join(" ")}
                                        onClick={() => this.showModal(0, 0)}
                                      >
                                        &#xe85b;
                                      </i>
                                    </span>
                                  </Tooltip>
                                  {detaiListFreedom.length > 0 &&
                                    this.renderTitle1(detaiListFreedom[0], 0)}
                                </div>
                              ) : null}
                            </div>
                            <div className={styles.moveListContent}>
                              <DraggableArea1
                                // tags={this.state[`tagList${0}`]}
                                tags={this.state.asd}
                                sort="true"
                                render={({ tag }) => (
                                  <div className="tag">{tag.content}</div>
                                )}
                                onChange={(leftTags, e) => {
                                  console.log(leftTags, "345");
                                  // const newState = JSON.parse(JSON.stringify(this.state));
                                  // newState[`tagList${index}`] = leftTags;
                                  let newData = [];
                                  const newState = JSON.parse(
                                    JSON.stringify(this.state),
                                  );
                                  // let num = 0;
                                  leftTags.length > 0 &&
                                    leftTags.map((item, index) => {
                                      // num = num + 1;
                                      newData.push({
                                        data: item.data,
                                        id: `${item.id}${index}`,
                                        content: (
                                          <span
                                            className={[
                                              styles.optionBox,
                                              // checkQuestionId && checkQuestionId == item.questionId
                                              //   ? styles.blue
                                              //   : "",
                                            ].join(" ")}
                                            style={
                                              this.state.checkQuestionId ==
                                              item.id
                                                ? {
                                                    border:
                                                      "1px solid rgba(2,88,191,1)",
                                                  }
                                                : null
                                            }
                                            // onClick={this.scrollView.bind(this, it.questionId)}
                                            // onClick={() => console.log(111)}
                                            id={`itemScoreViesble${item.id}`}
                                          >
                                            {index + 1}
                                            {/* {num} */}
                                          </span>
                                        ),
                                      });
                                    });
                                  this.setState(
                                    {
                                      asd: [],
                                    },
                                    () => {
                                      this.setState({ asd: newData }, () => {
                                        // console.log(this.state, e, "333");
                                        this.callback(2);
                                      });
                                    },
                                  );
                                }}
                              ></DraggableArea1>
                              {/* {allDetaiList.length == 0 &&
                          allDetaiList.map((item, index) => (
                            <span
                              className={styles.optionBox}
                              style={
                                checkQuestionId &&
                                checkQuestionId === item.questionId
                                  ? { border: "1px solid rgba(2,88,191,1)" }
                                  : null
                              }
                              onClick={this.scrollView.bind(
                                this,
                                item.questionId
                              )}
                              // onClick={() => console.log(111)}
                              id={`itemScoreViesble${item.questionId}`}
                            >
                              {index + 1}
                            </span>
                          ))} */}
                            </div>
                          </div>
                        )}

                        {detaiListFreedom.length > 0 &&
                          detaiListFreedom.map((item, index) => {
                            let ind = index;
                            this.state.isEdit ? ind - 1 : ind;
                            if (index == 0 && !this.state.isEdit) return;
                            return (
                              <div className={styles.moveList}>
                                <div className={styles.moveListTitle}>
                                  <div style={{ lineHeight: "24px" }}>
                                    <span
                                      className={styles.contentVisible}
                                      id={`itemNameViesbleF${ind}`}
                                    >
                                      {convertToChineseNumber(index + 1)}、
                                      {this.state.ifEdit &&
                                      !this.props.ifStu ? (
                                        <Popover
                                          destroyTooltipOnHide={true}
                                          content={
                                            <div>
                                              <div>
                                                <Input
                                                  onChange={this.itemNameChange.bind(
                                                    this,
                                                    0,
                                                  )}
                                                  defaultValue={
                                                    detaiListFreedom[ind]
                                                      ?.moduleName
                                                  }
                                                  onBlur={this.sureItemName1.bind(
                                                    this,
                                                    ind,
                                                  )}
                                                  onPressEnter={this.sureItemName1.bind(
                                                    this,
                                                    ind,
                                                  )}
                                                  id="inpID2"
                                                />
                                              </div>
                                            </div>
                                          }
                                          trigger="click"
                                          visible={
                                            this.state[`itemNameViesbleF${ind}`]
                                          }
                                          placement={"bottom"}
                                          overlayClassName={styles.titlePopover}
                                          getPopupContainer={() =>
                                            document.getElementById(
                                              `itemNameViesbleF${ind}`,
                                            )
                                          }
                                        >
                                          <span
                                            title={
                                              detaiListFreedom[ind]?.moduleName
                                            }
                                            onClick={this.changeItemNameVisibleF.bind(
                                              this,
                                              ind,
                                            )}
                                            style={{ cursor: "pointer" }}
                                          >
                                            {detaiListFreedom[ind]?.moduleName}
                                          </span>
                                        </Popover>
                                      ) : (
                                        <span
                                          style={{ cursor: "pointer" }}
                                          title={
                                            detaiListFreedom[ind]?.moduleName
                                          }
                                        >
                                          {detaiListFreedom[ind]?.moduleName}
                                        </span>
                                      )}
                                    </span>
                                    <span className={styles.topicScore}>
                                      ({item.moduleScore ? item.moduleScore : 0}
                                      {trans("global.point", "分")})
                                    </span>
                                  </div>
                                  {this.state.ifEdit ? (
                                    <div
                                      className={styles.modultScore}
                                      id={`countScoreBoxF${index}`}
                                    >
                                      <Tooltip
                                        title={trans(
                                          "detail.addTestQuestions",
                                          "添加试题",
                                        )}
                                        arrowPointAtCenter={true}
                                        placement="top"
                                      >
                                        <span
                                          className={[styles.shadow].join(" ")}
                                          // style={{ margin: "0 8px" }}
                                        >
                                          <i
                                            className={[
                                              styles.score,
                                              styles.iconfont,
                                            ].join(" ")}
                                            onClick={() =>
                                              this.showModal(0, index + 1)
                                            }
                                          >
                                            &#xe85b;
                                          </i>
                                        </span>
                                      </Tooltip>
                                      <span
                                        className={styles.shadow}
                                        style={{ margin: "0 4px" }}
                                      >
                                        <i
                                          className={[
                                            styles.score,
                                            styles.iconfont,
                                          ].join(" ")}
                                          onClick={() =>
                                            this.clickDelete(ind - 1)
                                          }
                                        >
                                          &#xe7e9;
                                        </i>
                                      </span>
                                      {detaiListFreedom.length > 0 &&
                                        this.renderTitle1(
                                          detaiListFreedom[index],
                                          index,
                                        )}
                                    </div>
                                  ) : null}
                                </div>
                                <div
                                  className={styles.moveListContent}
                                  style={{ minHeight: "46px" }}
                                >
                                  {this.renderFreedom(ind)}
                                </div>
                              </div>
                            );
                          })}
                        <div className={styles.addClass}>
                          <Popover
                            destroyTooltipOnHide={true}
                            content={
                              <div>
                                <div>
                                  <Input
                                    onChange={this.itemNameAddChange}
                                    // defaultValue={item.moduleName}
                                    onBlur={this.sureItemAddName}
                                    onPressEnter={this.sureItemAddName}
                                    id="inpAddID"
                                  />
                                </div>
                              </div>
                            }
                            trigger="click"
                            visible={this.state.itemNameAddViesble}
                            // visible={true}
                            placement={"bottomLeft"}
                            overlayClassName={styles.titlePopover}
                            // getPopupContainer={() =>
                            //   document.getElementById(`itemNameAddViesble`)
                            // }
                          >
                            <span
                              className={styles.addClassification}
                              onClick={this.changeItemNameAddVisible}
                            >
                              {trans("global.addClassification", "添加分类")}
                            </span>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {deleteList.length > 0 ? (
                  <div className={styles.recoverBox}>
                    <div
                      className={[
                        styles.recover,
                        this.state.deleteStatus ? styles.recoverTrue : "",
                      ].join(" ")}
                      onClick={this.scrollDelete}
                    >
                      <i className={styles.iconfont}>&#xe739;</i>
                      {trans("detail.recover", "回收站")}({deleteList.length})
                    </div>
                  </div>
                ) : null}
              </div>
              {this.state.ifEdit ? null : (
                <div className={styles.contentRightOption1}>
                  <div className={styles.optionTitleBox}>
                    <p className={styles.optionTitleLeft}>
                      {trans("detail.answerPreview", "试做")}
                    </p>
                  </div>
                  <div className={styles.previewBox}>
                    <span
                      className={styles.PCPreview}
                      onClick={this.clickPreview1}
                    >
                      {trans("global.PCPreview", "电脑端试做")}
                    </span>
                    <span
                      className={styles.IPadPreview}
                      onClick={this.qrcodeClick}
                    >
                      {trans("global.IPadPreview", "iPad端试做")}
                    </span>
                  </div>
                </div>
              )}
              <Modal
                // title="Basic Modal"
                visible={this.state.QRcode}
                // onOk={this.handleOk}
                onCancel={(e) => this.setState({ QRcode: false })}
                footer={null}
                centered={true}
                width={250}
                zIndex={999}
              >
                <div style={{ textAlign: "center" }}>
                  <QRCodeSVG
                    value={
                      this.state.ifEdit
                        ? // ? `${window.location.origin}/exam#/teacherPreview/${this.testId}/${this.testId}`
                          // : `${window.location.origin}/exam#/teacherPreview/${this.testId}/${this.props.exampleId}`
                          `${window.location.origin}/exam#/studentTest/${this.testId}/${this.props.exampleId}`
                        : `${window.location.origin}/exam#/studentTest/${this.testId}/${this.testId}`
                    }
                    size={128}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"L"}
                  />
                </div>
              </Modal>
              <Modal
                title={""}
                footer={null}
                getContainer={false}
                centered={true}
                visible={this.state.submitStatus}
                // visible={true}
                // closable={false}
                // maskClosable={false}
                onCancel={this.submitCancel}
                className={styles.importTestModel}
                width={650}
                zIndex={100}
              >
                {/* <div className={styles.saveMessage}>
                <i className={styles.iconfont}>&#xe7a0;</i>
                <span>{trans("galobal.saveSuccess", "保存成功")}</span>
              </div>
              <div className={styles.myPaper} onClick={this.toTest}>
                {trans("global.toMyPaper", "去“我的试卷” 列表查看")}
              </div>
              <div className={styles.studyPlan} onClick={this.publishToStudent}>
                {trans("global.publishToStudents", "发布给学生")}
              </div> */}
                <div className={styles.successBody}>
                  <div className={styles.operateSuccess}>
                    <Icon
                      type="check-circle"
                      style={{
                        fontSize: "28px",
                        color: "#52C41A",
                        marginRight: 15,
                      }}
                    />
                    <span className={styles.successTip}>
                      {trans("global.operateSuccess", "操作成功")}
                    </span>
                  </div>
                  {this.isRecruitQuestionMode() ? null : (
                    <div className={styles.operateButton}>
                      <span className={styles.onlineBOx}>
                        <span
                          className={styles.onlineBut}
                          onClick={this.clickLaunchOnline}
                        >
                          {trans("global.launchOnlineQuiz", "发起线上测验")}
                        </span>
                        <span
                          className={styles.onlineTip}
                          style={{ textAlign: "left" }}
                        >
                          {trans(
                            "global.launchOnlineQuizTest",
                            "以任务的形式发送给学生，学生在线完成答题，系统实时生成分析数据",
                          )}
                        </span>
                      </span>
                      <span className={styles.machineBox}>
                        <span className={styles.machineTest}>
                          {trans("global.initiateMachine", "发起机阅测验")}
                        </span>
                        {/* <span className={styles.incomplete}>功能未完成</span> */}
                        <span
                          className={styles.print}
                          style={{ textAlign: "left" }}
                        >
                          {trans(
                            "global.initiateMachineTest",
                            "需打印成纸质试卷，阅卷完成后，将考卷放入指定的阅卷机器完成数据分析",
                          )}
                        </span>
                      </span>
                      <span className={styles.testBtn}>
                        <span
                          className={styles.online}
                          onClick={this.clickPreview}
                        >
                          {trans("global.PCPreview", "电脑端试做")}
                        </span>
                        <span
                          className={styles.online}
                          onClick={this.qrcodeClick}
                        >
                          {trans("global.IPadPreview", "iPad端试做")}
                        </span>
                        <span
                          className={styles.online}
                          onClick={this.clickTestPaperOnline}
                        >
                          {trans("global.testPaperOnline", "在线查看试卷")}
                        </span>
                        <span
                          className={styles.online}
                          onClick={this.clickDownload}
                        >
                          {trans("global.downloadTestPaper", "下载打印试卷")}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </Modal>
              {viewData && viewData.subjectId ? (
                <Modal
                  title={""}
                  footer={null}
                  getContainer={false}
                  // centered={true}
                  visible={this.state.publishStatus}
                  closable={false}
                  maskClosable={false}
                  destroyOnClose={true}
                  // onCancel={this.publishCancel}
                  width="480px"
                  className={styles.studyModal}
                >
                  <StudyActivity
                    viewData={viewData}
                    testName={this.state.testName}
                    exampleId={this.state.exampleId}
                    teachingPlanContext={this.getBlankPaperContext()}
                    onCancel={this.publishCancel}
                    returnMyTest={this.returnMyTest}
                    view={this.view}
                    examId={this.testId}
                  />
                </Modal>
              ) : null}
            </div>
          </div>
        </div>

        {this.state.ifEdit && !this.props.ifStu ? (
          <div className={[styles.twoWayBottom, styles.flexRow].join(" ")}>
            {/* {this.state.key}---- */}
            <div className={[styles.flexRow].join(" ")}>
              <Popover
                placement="top"
                title={null}
                onVisibleChange={(visible) => {
                  this.popoverVisChange(visible, "questionLevelType");
                }}
                overlayClassName="questionLevelType"
                content={
                  <div className={styles.batchSCore}>
                    <Select
                      style={{ width: 90 }}
                      placeholder={trans("global.selectDifficulty", "选择难易")}
                      onChange={(value) => {
                        this.batchDifficult(value, "questionLevelType");
                      }}
                    >
                      <Option value={1}>{trans("global.easy", "简单")}</Option>
                      <Option value={2}>
                        {trans("global.general", "普通")}
                      </Option>
                      <Option value={3}>
                        {trans("global.difficult", "困难")}
                      </Option>
                    </Select>
                  </div>
                }
                trigger="click"
              >
                <div className={[styles.button].join(" ")}>
                  {trans("global.selectDifficult")}
                </div>
              </Popover>

              {/* 添加知识点 */}
              <Popover
                placement="top"
                title={null}
                onVisibleChange={(visible) => {
                  this.popoverVisChange(visible, "knowledge");
                }}
                overlayClassName="knowledge"
                content={
                  <div className={styles.ifChild}>
                    <TreeSelect
                      treeData={this.props.treeData}
                      showCheckedStrategy={SHOW_PARENT}
                      treeCheckable={true}
                      showSearch={true}
                      treeDefaultExpandAll
                      placeholder={trans("global.pleaseChoose", "请选择")}
                      dropdownStyle={{ maxHeight: "45vh" }}
                      onChange={(value) => {
                        this.batchDifficult(value, "knowledge");
                      }}
                      style={{ minWidth: "200px" }}
                    />
                  </div>
                }
                trigger="click"
              >
                <div
                  className={[styles.button].join(" ")}
                  onClick={this.getTree}
                >
                  {trans("global.addKnowledge")}
                </div>
              </Popover>
              {/* 添加素养 */}
              <Popover
                placement="top"
                title={null}
                overlayClassName="indicator"
                onVisibleChange={(visible) => {
                  this.popoverVisChange(visible, "indicator");
                }}
                content={
                  <div className={styles.ifChild}>
                    <TreeSelect
                      treeData={newTree1}
                      treeDefaultExpandAll
                      onChange={(value) => {
                        this.batchDifficult(value, "indicator");
                      }}
                      treeCheckable={true}
                      showCheckedStrategy={SHOW_PARENT}
                      showSearch={true}
                      placeholder={trans("global.pleaseChoose", "请选择")}
                      style={{ minWidth: "200px" }}
                      dropdownStyle={{ maxHeight: "45vh" }}
                    />
                  </div>
                }
                trigger="click"
              >
                <div
                  className={[styles.button].join(" ")}
                  onClick={this.getLabel}
                >
                  {trans("global.addAttainment")}
                </div>
              </Popover>

              {/* 添加章节 */}
              <Popover
                placement="top"
                title={null}
                onVisibleChange={(visible) => {
                  this.popoverVisChange(visible, "chapter");
                }}
                overlayClassName="chapter"
                content={
                  <div className={styles.ifChild}>
                    <TreeSelect
                      treeDefaultExpandAll
                      treeData={this.props.chapterList}
                      onChange={(value) => {
                        this.batchDifficult(value, "chapter");
                      }}
                      treeCheckable={true}
                      showCheckedStrategy={SHOW_PARENT}
                      showSearch={true}
                      placeholder={trans("global.pleaseChoose", "请选择")}
                      style={{ minWidth: "200px" }}
                      dropdownStyle={{ maxHeight: "45vh" }}
                    />
                  </div>
                }
                trigger="click"
              >
                <div
                  className={[styles.button].join(" ")}
                  onClick={this.getChapter}
                >
                  {trans("global.addChapter")}
                </div>
              </Popover>
            </div>
          </div>
        ) : null}

        <Modal
          footer={null}
          closable={false}
          destroyOnClose={true}
          keyboard={!this.state.questionEditorSaving}
          maskClosable={!this.state.questionEditorSaving}
          onCancel={this.closeQuestionEditor}
          visible={this.state.questionEditorVisible}
          width={1240}
          style={{ top: 24 }}
          className={styles.questionEditorModal}
        >
          {this.state.questionEditorDraft ? (
            <div className={styles["question-editor-modal-shell"]}>
              <div className={styles["question-editor-modal-header"]}>
                <button
                  aria-label={trans("global.back", "返回")}
                  className={styles["question-editor-close"]}
                  onClick={this.closeQuestionEditor}
                  title={trans("global.back", "返回")}
                  type="button"
                >
                  <Icon type="arrow-left" />
                </button>
                <div className={styles["question-editor-title"]}>
                  <span>{trans("global.editQuestion", "编辑题目")}</span>
                </div>
                <Button
                  disabled={this.state.questionEditorSaving}
                  loading={this.state.questionEditorSaving}
                  type="primary"
                  onClick={this.submitQuestionEditor}
                >
                  {trans("global.save", "保存")}
                </Button>
              </div>
              <div className={styles["question-editor-modal-body"]}>
                <QuestionEntryEditor
                  initialQuestion={this.state.questionEditorDraft}
                  onControllerReady={this.handleQuestionEditorControllerReady}
                  onSubmit={this.handleQuestionEditorSave}
                  saving={this.state.questionEditorSaving}
                />
              </div>
            </div>
          ) : null}
        </Modal>

        <ModalTest
          modalTestProps={{
            options: this.state.modalTestOptions,
            ...this.state.modalTestProps,
          }}
        />
        {this.state.machineTestOptions.visible ? (
          <ModalMachineTest
            modalMachineTestProps={{
              options: this.state.machineTestOptions,
              ...this.state.modalMachineTestProps,
            }}
          />
        ) : null}
        {this.state.modalOnlineTestOptions.visible ? (
          <ModalOnlineTest
            modalOnlineTestProps={{
              options: {
                ...this.state.modalOnlineTestOptions,
                onCancel: () => {
                  const object = JSON.parse(
                    JSON.stringify(this.state.modalOnlineTestOptions),
                  );
                  object.visible = false;
                  this.setState({
                    modalOnlineTestOptions: object,
                  });
                },
                onOk: () => {
                  const object = JSON.parse(
                    JSON.stringify(this.state.modalOnlineTestOptions),
                  );
                  object.visible = false;
                  this.setState({
                    modalOnlineTestOptions: object,
                  });
                },
              },
              ...this.state.modalOnlineTestProps,
              dispatch: this.props.dispatch,
            }}
          />
        ) : null}
      </div>
    );
  }
}

export default connect(({ home, global, inputQuestion }) => ({
  viewData: home.viewData,
  stageList: global.stageList,
  gradeList: global.gradeList,
  subjectList: global.subjectList,
  yearList: home.yearList,
  currentSemester: home.currentSemester,
  examList: home.examList,
  typeList: home.typeList,
  allGradeList: inputQuestion.allGradeList,
  personalList: home.personalList,
  viewOrDownPaper: home.viewOrDownPaper,
  treeData: inputQuestion.treeData,
  labelList: inputQuestion.labelList,
  chapterList: inputQuestion.chapterList,
}))(Detail);
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};

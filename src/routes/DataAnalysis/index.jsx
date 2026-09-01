import React, { Fragment, PureComponent } from "react";
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Icon,
  Input,
  InputNumber,
  Mentions,
  Menu,
  message,
  Modal,
  Popover,
  Radio,
  Select,
  Spin,
  Table,
  Tabs,
  Upload,
} from "antd";
import { connect } from "dva";
import * as echarts from "echarts";

import DotMatrixPen from "./components/DotMatrixPen";
const { Option } = Select;
const { TextArea } = Input;
import ChartSwitch from "components/ChartSwitch";
import MyTabs from "components/MyTabs";
import StudentPerformanceAnalyzer from "components/StudentPerformanceAnalyzer";

import { locale, trans } from "../../utils/i18n";
const { TabPane } = Tabs;
import { G2 } from "bizcharts";
import { routerRedux } from "dva/router";
import $ from "jquery";
import debounce from "lodash/debounce";
import pathToRegexp from "path-to-regexp";

import AreaHeaderComponent from "components/AreaHeaderComponent";
import StudentScore from "components/StudentScore/index";
import QuestionTable from "components/Table/index";
import KnowLedgeTable from "components/Table/knowLedgeTable";
import PartTable from "components/Table/partTable";
import RankingTable from "components/Table/rankingtable";
import ScoreTable from "components/Table/scoreTable";

import { buildTeacherPaperTrialUrl } from "../../common/explicitExamRoutes";
import ChapterAnalysis from "../../components/ChapterAnalysis";
import ClashLockModal from "../../components/ClashLockModal";
import ComnModal from "../../components/ComnModal";
import FileUploadModal from "../../components/FileUploadModal";
import KnowledgePoint from "../../components/KnowledgePoint";
import ModalImportTestPaper from "../../components/ModalImportTestPaper";
import ModalMachineTest from "../../components/ModalMachineTest";
import ModalOnlineTest from "../../components/ModalOnlineTest";
import {
  buildAverageChartRows,
  buildBoxPlotRows,
  buildClassOverviewBenchmark,
  buildRateChartRows,
  buildTripleChartRows,
  ClassOverviewChartRegistry,
  legacyG2TooltipOptions,
} from "../../components/OverviewClassGrades/classOverviewChartModel";
import PupllAnalyse from "../../components/PupllAnalyse";
import QualityTable from "../../components/QualityTable";
import RealTime from "../../components/RealTime";
import ReloadModal from "../../components/ReloadModal";
import RicherEditor from "../../components/RicherEditor/index";
import SettingRate from "../../components/SettingRate/index";
import StudentAbsent from "../../components/StudentAbsent";
import StudentAccomplishmentTable from "../../components/StudentAccomplishmentTable";
import StudentGroup from "../../components/StudentGroup";
import ModelAnalysisTable from "../../components/Table/modelAnalysisTable";
import MultiClassTable from "../../components/Table/multiClassTable";
import RankAnalysis from "../../components/Table/RankAnalysis";
import StudentTrend from "../../components/Table/StudentTrend";
import TableB from "../../components/Table/tableB";
import TableS from "../../components/Table/tableS";
import TestAna from "../../components/TestAna";
import TopicAnalysis from "../../components/TopicAnalysis";
import UseFileItem from "../../components/UseFileItem";
import ShowFile from "../../components/UseFileItem/showFile";
import { reportConfigGet } from "../../services/exam";
import { getScoreDistinguishPlan } from "../../services/example";
import { canLoadExamResult, closeExam } from "../../services/global";
import { canUseExamStructureMatch } from "../../utils/examStructureMatch";
import { comparePercentages } from "../../utils/utils";
import {
  downloadExamPaperPdf,
  resolvePaperDownloadTarget,
} from "../PaperEditor/paperPdf";
import { createAnalysisQuestionCatalog } from "./analysisQuestionCatalog";
import AnalysisQuestionPreview from "./components/AnalysisQuestionPreview";
import ClassReport from "./components/ClassReport";
import ClassroomEvaluation from "./components/ClassroomEvaluation";
import DataAnalysisPaperDetail from "./components/DataAnalysisPaperDetail";
import PaperSelectionMatchModal from "./components/ExamStructureMatchModal";
import NoPermission from "./components/NoPermission";
import PaperDetailEditAction from "./components/PaperDetailEditAction";
import StudentAnalysisSelectorDialog from "./components/StudentAnalysisSelectorDialog";
import { PAPER_DETAIL_STATUS } from "./paperDetailStatus";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const { Search } = Input;
const elevatorList = [
  { name: trans("data.courseDetail", "班级成绩概况") },
  { name: trans("data.scoreSegmentation", "成绩分段对比") },
  { name: trans("global.comparisonDistribution", "学情分层对比") },
  { name: trans("analysis.knowledgeAnalysis", "知识点分析") },
  { name: trans("global.skillAnalysis", "素养能力分析") },
  { name: trans("analysis.chapterAnalysis", "章节分析") },
];

const elevatorList1 = [
  { name: trans("global.topicClassComparison", "小题班级对比") },
  { name: trans("data.answerDetails", "作答明细") },
  { name: trans("analysis.knowledgeAnalysis", "知识点分析") },
  { name: trans("global.skillAnalysis", "素养能力分析") },
  { name: trans("analysis.chapterAnalysis", "章节分析") },
];

/**
 * 展示排名分析、趋势分析的考试/成绩类型（与后端 ExamType 一致）。
 * 全量类型备注：
 * CLASSROOM_QUIZ(1, "课堂小测", "Class Quiz"),
 * OTHER(2, "其他", "Other"),
 * UNIT_EXAM(3, "单元考试", "Unit Test"),
 * MONTH_EXAM(4, "月考", "Monthly Exam"),
 * SIMULATION_EXAM(5, "模拟考试", "Mock Exam"),
 * MID_TERM_EXAM(6, "期中考试", "Midterm Exam"),
 * FINAL_EXAM(7, "期末考试", "Final Exam"),
 * TOTAL_SCORE(8, "总成绩", "Total Score"),
 * UNIFIED_EXAM(9, "区统考", "District Unified Exam"),
 * PERSONALIZED_HOMEWORK(10, "个性化作业", "Past Papers"),
 * CALENDAR_YEAR_VOLUME(11, "历年卷", "CALENDAR YEAR VOLUME"),
 * COMPREHENSIVE_PRACTICE(12, "综合实践", "Comprehensive Practice"),
 * HOMEWORK(13, "作业单", "HOMEWORK"),
 * RACE_QUESTION(14, "抢答（pad 端）", "Quick Response"),
 * DISTRICT_ONE_MODEL(15, "区一模", "District First Mock"),
 * DISTRICT_TWO_MODEL(16, "区二模", "District Second Mock"),
 * SCHOOL_TWO_MODEL(17, "校二模", "School Second Mock"),
 * THREE_MODEL(18, "三模", "Third Mock"),
 * SPECIAL_RESEARCH(19, "专项调研", "Special Research"),
 * ADMISSION_ASSESSMENT(20, "入学评估", "Admission assessment"),
 */
const RANK_TREND_ANALYSIS_EXAM_TYPES = new Set([
  3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19,
]);

const colors = [
  "rgba(61, 148, 255, 0.3)", // #3D94FF
  "rgba(18, 204, 103, 0.3)", // #12CC67
  "rgba(255, 224, 48, 0.3)", // #FFE030
  "rgba(252, 125, 125, 0.3)", // #FC7D7D
  "rgba(75, 228, 231, 0.3)", // #4BE4E7
  "rgba(25, 169, 120, 0.3)", // #19A978
  "rgba(255, 148, 81, 0.3)", // #FF9451
  "rgba(177, 105, 235, 0.3)", // #B169EB
  "rgba(226, 134, 210, 0.3)", // #E286D2
  "rgba(61, 130, 214, 0.3)", // #3D82D6
  "rgba(204, 140, 71, 0.3)", // #CC8C47
  "rgba(176, 202, 255, 0.3)", // #B0CAFF
  "rgba(206, 108, 108, 0.3)", // #CE6C6C
  "rgba(192, 223, 53, 0.3)", // #C0DF35
  "rgba(212, 181, 137, 0.3)", // #D4B589
  "rgba(193, 193, 193, 0.3)", // #C1C1C1
];

let config = [];
class StuTest extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp(
      "/dataAnalysis/:testId/:paperId/:active/:hideTab?/:commentMode?",
    ).exec(this.url);
    this.testId = JSON.parse(this.pathMatch[1]);
    this.paperId = this.pathMatch[2]
      ? Number.parseInt(this.pathMatch[2], 10)
      : null;
    this.active = Number.parseInt(this.pathMatch[3], 10);

    this.hideTab = this.pathMatch[4] ? JSON.parse(this.pathMatch[4]) : null;
    this.commentMode = this.pathMatch[5] ? JSON.parse(this.pathMatch[5]) : null;
    this.classOverviewCharts = new ClassOverviewChartRegistry();
    this.state = {
      okLoding: false,
      testName: "",
      deleteList: [],
      detaiList: [],
      viewData: {},
      ifEdit: true,
      active: this.active || 1,
      analysisQuestionCatalog: null,
      paperEditDisabledReasonCode: undefined,
      paperDetailStatus: PAPER_DETAIL_STATUS.loading,
      groupName: trans("analysis.allClass", "全部班级"),
      studentName: undefined,
      groupId: "",
      loadingTable: false,
      elevatorIndex: 0,
      check: 1,
      isFull: false,
      defaultSort: [],
      averageChecked: true,
      averageClaaaChecked: true,
      averageChecked1: true,
      averageClaaaChecked1: true,
      averageChecked2: true,
      averageClaaaChecked2: true,
      groupIdDiy: 0,
      loading: false,
      propositionalAnalysis: "",
      fencengAnalysis: "",
      xingzhengAnalysis: "",
      isEditfenceng: false,
      isEditxingzheng: false,
      chiefAnalysis: "", //学科首席总结
      leaderSummaryAnalysis: "",
      isEditpropositional: false, //命题分析
      isEditleaderSummary: false, //备课组长
      isEditChiefSummary: false, //学科首席
      classAnalysis: false, //班级分析
      leaderSummary: false, //备课组长小结
      chiefSummary: false, //学科首席小结
      submitChange: false,
      purviewVisible: false,
      purviewValue: 0,
      revisedModal: false,
      fullscreen: false,
      // inputVib: false,
      scoringList: [
        {
          index: 1,
          sectionTitle: "",
          learningState: " ",
          teachingState: " ",
          questionDesign: " ",
        },
        {
          index: 2,
          sectionTitle: "",
          learningState: " ",
          teachingState: " ",
          questionDesign: " ",
        },
        {
          index: 3,
          sectionTitle: "",
          learningState: " ",
          teachingState: " ",
          questionDesign: " ",
        },
      ], // 得分率分析
      scoringListNum: 3,
      editScoreRate: false, //得分率
      multiClassList: [],
      lockTipVisible: false, //抢锁冲突提示框
      operatorTips: "",
      currentOperItem: {}, //当前操作模板item--在抢锁时候修改值
      uuId: "",
      modelKey: "",
      editFont1: false,
      editFont2: false,
      editFont3: false,
      introducePropositiona: false, //命题分析提示
      introduceScore: false, //得分率分析提示
      scoreTimer: 0,
      indexOld: null,
      newList: [],
      previewVisible: false,
      previewInfo: null,
      authenticationModel: {},
      reloadModalVisible: false,
      identityJudgementVisible: false,
      reloadModalVisibleEdit: false,
      subEdit: false,
      updatedChange: false,
      noSummary: false,
      isTitName: false,
      TitName: "",
      loading1: false,
      // isAddStu: false,
      // rejectionStuList: [],
      // filterStudentListPage: [],
      courseDetailSpecify: false,
      courseDetailSpecify1: false,
      isSpecify: 1,
      allStuChecked: false,
      adjusting: false,
      numPhaseList: ["", "", ""],
      numPhase: 3,
      selectMethod: 0,
      corresponding: ["", "", ""],
      isAbsenceManagement: false,
      isUploadTest: false,
      newfileList: [],
      fileId: null,
      modalImportTestPaperProps: {
        paperId: this.pathMatch[2]
          ? Number.parseInt(this.pathMatch[2], 10)
          : null,
      },
      modalImportTestPaperOptions: {
        visible: false,
        onOk: () => {
          this.page = 1;
          this.setState({
            modalImportTestPaperOptions: {
              ...this.state.modalImportTestPaperOptions,
              visible: false,
            },
          });
        },
        onCancel: () => {
          this.setState({
            modalImportTestPaperOptions: {
              ...this.state.modalImportTestPaperOptions,
              visible: false,
            },
          });
        },
      },
      machineTestoptions: {
        visible: false,
        title: trans("global.editOfflineExam", "编辑机阅测验"),
        wrapClassName: "modalMachineTest",
        width: 700,
        onOk: () => {
          const { machineTestoptions } = this.state;
          this.setState({
            machineTestoptions: {
              ...machineTestoptions,
              visible: false,
            },
          });
        },
        onCancel: () => {
          const { machineTestoptions } = this.state;
          this.setState({
            machineTestoptions: {
              ...machineTestoptions,
              visible: false,
            },
          });
        },
      },
      modalMachineTestProps: {
        paperId: null,
      },
      modalOnlineTestOptions: {
        visible: false,
        width: 700,
        title: trans("global.editTestSettings", "编辑测验设置"),
        onCancel: () => {
          const { modalOnlineTestOptions } = this.state;
          this.setState({
            modalOnlineTestOptions: {
              ...modalOnlineTestOptions,
              visible: false,
            },
          });
        },
        onOk: () => {
          const { modalOnlineTestOptions } = this.state;
          this.setState({
            modalOnlineTestOptions: {
              ...modalOnlineTestOptions,
              visible: false,
            },
          });
        },
      },
      modalOnlineTestProps: {},
      teacherNameVisible: true,
      sortType: ["1"],
      rateModalVisible: false,
      isAdmin: false,
      LoadExamResult: undefined,
      permission: null,
      authority: null,
      paperMatchModalVisible: false,
    };

    this.child = null;
    this.multiClassRef = {};
    this.loadGithubUsers = debounce(this.loadGithubUsers, 800);
  }
  componentDidMount() {
    // 获取指定分析（可自定义任意学生范围进行分析） 权限点
    this.getPermission("exam:examAnalysis:specifyAnalysis");

    this.props.dispatch({
      type: "exam/studySituationPermission",
      onSuccess: (res) => {
        // 日常和本地环境不进行权限判断
        if (
          window.location.href.includes("daily") ||
          window.location.href.includes("local")
        ) {
          this.setState({
            permission: {
              groupStudySituation: true,
              gradeStudySituation: true,
            },
          });
        } else {
          this.setState({
            permission: res.content,
          });
        }
      },
    });

    reportConfigGet({
      examId: this.testId,
    }).then((response) => {
      if (response.status) {
        config = response.content;
      } else {
        message.error(response.message);
      }
    });

    canLoadExamResult({
      examId: this.testId,
    }).then((res) => {
      this.setState({
        LoadExamResult: res.content,
      });
      if (res.content == false && this.active != 12 && this.active != 1) {
        this.setState({
          active: 1,
        });
        this.props.dispatch(
          routerRedux.push(`/dataAnalysis/${this.testId}/${this.paperId}/${1}`),
        );
      }
    });

    this.props
      .dispatch({
        type: "global/getCurrentUser",
      })
      .then(() => {
        this.getWaterMark(this.props.currentUser);
      });

    this.props.dispatch({
      type: "home/getIfAdmin",
      onSuccess: (res) => {
        this.setState({
          isAdmin: res,
        });
      },
    });

    this.props.dispatch({
      type: "home/getFilterStudentListPermissions",
      payload: {
        examId: this.testId,
      },
    });

    this.props
      .dispatch({
        type: "home/PostIdentityJudgement",
        payload: {
          examId: this.testId,
        },
      })
      .then(() => {
        this.setState({
          identityJudgementVisible: this.props.identityJudgement,
        });
      });

    if (this.active === 2) {
      this.props
        .dispatch({
          type: "home/clearGroupScore",
        })
        .then(() => {
          this.props.dispatch({
            type: "home/getgroupScore",
            payload: {
              examId: this.testId,
              filterFlag: this.state.courseDetailSpecify,
            },
          });
        });
    }

    this.props
      .dispatch({
        type: "home/getTestView",
        payload: {
          examId: this.testId,
        },
      })
      .then(async () => {
        let res = await this.getAuthority();
        if (res && res.status) {
          const content = res.content;
          this.setState({
            authority: content,
          });
          if (content === false) {
            return;
          }
        }

        this.setState({
          TitName: this.props.viewData.examName,
          purviewValue: this.props.viewData.checkPermissions || 0,
        });

        // 招生小测在初始化时也需要屏蔽禁用页签，避免通过直达 URL 进入隐藏分析页。
        if (this.props.viewData && this.props.viewData.zhaoShengPaper) {
          const recruitHiddenTabList = [2, 3, 6, 11, 14, 15];
          if (recruitHiddenTabList.includes(this.state.active)) {
            this.setState({
              active: 1,
            });
            this.props.dispatch(
              routerRedux.push(
                `/dataAnalysis/${this.testId}/${this.paperId}/${1}`,
              ),
            );
            return;
          }
        }

        if (this.active == 8) {
          this.getClassList();
          this.props.dispatch({
            type: "home/getIndividuationTest",
            payload: {
              examPaperId: this.paperId,
              groupId: this.state.groupId === 0 ? null : this.state.groupId,
              type: 1,
            },
          });
        }

        if (this.active == 9) {
          this.props
            .dispatch({
              type: "home/PostIdentityJudgement",
              payload: {
                examId: this.testId,
              },
            })
            .then(() => {
              this.setState({
                identityJudgementVisible: this.props.identityJudgement,
              });
            });

          this.props
            .dispatch({
              type: "home/clearGroupScore",
            })
            .then(() => {
              this.props.dispatch({
                type: "home/getgroupScore",
                payload: {
                  examId: this.testId,
                  filterFlag: this.state.courseDetailSpecify1,
                  quality: true,
                },
              });
            });

          if (this.props.analysisDetail.showfenceng) {
            this.props.dispatch({
              type: "home/getSpecial",
              payload: {
                examId: this.testId,
                filterFlag: this.state.courseDetailSpecify1,
              },
            });
          }
          this.props.dispatch({
            type: "home/getUserByName",
            payload: {
              name: "",
            },
          });

          this.props
            .dispatch({
              type: "home/getScoringRate",
              payload: {
                examId: this.testId,
              },
            })
            .then(() => {
              this.setState({
                propositionalAnalysis:
                  this.props.reportPresentationList?.titleModel
                    ?.contentString || "",
                fencengAnalysis:
                  this.props.reportPresentationList?.richTextLayered
                    ?.contentString || "",
                xingzhengAnalysis:
                  this.props.reportPresentationList?.richTextAdministrative
                    ?.contentString || "",
                chiefAnalysis:
                  this.props.reportPresentationList?.subjectChiefWriteModel
                    ?.contentString || "",
                scoringList: this.props.reportPresentationList?.scoreModel
                  ?.scoreContentList || [
                  {
                    index: 1,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                  {
                    index: 2,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                  {
                    index: 3,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                ],
                scoringListNum:
                  this.props.reportPresentationList?.scoreModel
                    ?.scoreContentList?.length || 3,
                multiClassList: this.props.reportPresentationList.classShowModel
                  ?.multiClassModelList || [
                  {
                    classContentList: [
                      {
                        stage: "",
                        studentNames: "",
                        learningState: "",
                        action: "",
                        index: 1,
                      },
                    ],
                    id: "",
                    groupId: "",
                    teacherNames: "",
                    groupName: "",
                  },
                ],
                leaderSummaryAnalysis:
                  this.props.reportPresentationList?.summaryModel
                    ?.contentString || "",

                authenticationModel:
                  this.props.reportPresentationList?.authenticationModel,
                submitChange:
                  this.props.reportPresentationList?.authenticationModel
                    ?.synState == 1
                    ? true
                    : false,
              });
            });

          this.props
            .dispatch({
              type: "home/getReviewUploadedFile",
              payload: {
                examId: this.testId,
              },
            })
            .then(() => {
              this.setState({
                newList: this.props.reviewUploadedFile || [],
              });
            });
        }
      });
  }

  componentWillUnmount() {
    this.classOverviewCharts.destroyAll();
  }

  getPermission = (key) => {
    this.props.dispatch({
      type: "global/checkPermission",
      payload: {
        permissionCode: key,
      },
      onSuccess: (res) => {
        this.setState({
          [key]: res,
        });
      },
    });
  };

  UNSAFE_componentWillReceiveProps(nextProperties) {
    //修改路由参数，解绑之前页面的锁
    if (
      nextProperties.match &&
      nextProperties.match.url != this.props.match.url
    ) {
      this.releaseLock();
    }
  }

  getAuthority = () => {
    return this.props.dispatch({
      type: "exam/checkUserAuthority",
      payload: {
        examId: this.testId,
      },
    });
  };

  getClass = () => {
    this.props.dispatch({
      type: "home/getgroupScore",
      payload: {
        examId: this.testId,
        filterFlag: this.state.courseDetailSpecify,
      },
    });
  };

  getClass1 = () => {
    if (this.props.analysisDetail.showfenceng) {
      this.props.dispatch({
        type: "home/getSpecial",
        payload: {
          examId: this.testId,
          filterFlag: this.state.courseDetailSpecify1,
        },
      });
    } else {
      this.props.dispatch({
        type: "home/getgroupScore",
        payload: {
          examId: this.testId,
          filterFlag: this.state.courseDetailSpecify1,
          quality: true,
        },
      });
    }
  };
  onTestRef = (child) => {
    // console.log(child, "c");
    this.child = child;
  };

  //获取班级列表
  getClassList = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "home/getClassList",
      payload: {
        examId: this.testId || null,
      },
    }).then(() => {
      // 默认选中第一个年级
      const { classListData } = this.props;
      if (classListData && classListData.length > 0) {
        this.setState({
          groupIdDiy: classListData[0].groupId,
        });
      }
    });
  };

  startExplaining = () => {
    this.commentMode = true;
    this.props.dispatch(
      routerRedux.push(
        `/dataAnalysis/${this.testId}/${this.paperId}/${this.state.active}/${this.hideTab}/${this.commentMode}`,
      ),
    );
  };

  outReview = () => {
    this.commentMode = false;
    this.props.dispatch(
      routerRedux.push(
        `/dataAnalysis/${this.testId}/${this.paperId}/${this.state.active}/${this.hideTab}/${this.commentMode}`,
      ),
    );
  };

  // 切换分析页签；招生小测需要在这里直接拦截被禁页签，避免通过内部状态切换绕过隐藏。
  view = (index) => {
    if (this.props.viewData && this.props.viewData.zhaoShengPaper) {
      const recruitHiddenTabList = [2, 3, 6, 11, 14, 15];
      if (recruitHiddenTabList.includes(index)) {
        this.setState({
          active: 1,
          check: 1,
          elevatorIndex: 0,
        });
        this.props.dispatch(
          routerRedux.push(`/dataAnalysis/${this.testId}/${this.paperId}/${1}`),
        );
        return;
      }
    }
    this.setState(
      {
        active: index,
        check: 1,
        elevatorIndex: 0,
      },
      () => {
        switch (index) {
          case 2: {
            this.child && this.child.view(6);

            break;
          }
          case 3: {
            this.child && this.child.view(3);

            break;
          }
          case 4: {
            this.child && this.child.view(4);

            break;
          }
          case 9: {
            this.child && this.child.view(9);

            break;
          }
          // No default
        }
      },
    );
    if (this.hash) {
      this.props.dispatch(
        routerRedux.push(
          `/dataAnalysis/${this.testId}/${this.paperId}/${index}`,
        ),
      );
    } else {
      this.props.dispatch(
        routerRedux.push(
          `/dataAnalysis/${this.testId}/${this.paperId}/${index}`,
        ),
      );
    }
    if (index === 2 || index == 13) {
      this.props
        .dispatch({
          type: "home/clearGroupScore",
        })
        .then(() => {
          this.props.dispatch({
            type: "home/getgroupScore",
            payload: {
              examId: this.testId,
              filterFlag: this.state.courseDetailSpecify,
            },
          });
        });
    } else if (index == 9) {
      this.props.dispatch({
        type: "home/getgroupScore",
        payload: {
          examId: this.testId,
          filterFlag: this.state.courseDetailSpecify1,
          quality: true,
        },
      });
      if (this.props.analysisDetail.showfenceng) {
        this.props.dispatch({
          type: "home/getSpecial",
          payload: {
            examId: this.testId,
            filterFlag: this.state.courseDetailSpecify1,
          },
        });
      }
    }
    if (index == 8) {
      this.getClassList();
      this.props.dispatch({
        type: "home/getIndividuationTest",
        payload: {
          examPaperId: this.paperId,
          groupId: this.state.groupId === 0 ? null : this.state.groupId,
          type: 1,
        },
      });
    }
    if (index == 9) {
      this.props.dispatch({
        type: "home/getUserByName",
        payload: {
          name: "",
        },
      });
      this.props
        .dispatch({
          type: "home/getScoringRate",
          payload: {
            examId: this.testId,
          },
        })
        .then(() => {
          this.setState({
            propositionalAnalysis:
              this.props.reportPresentationList?.titleModel?.contentString ||
              "",
            fencengAnalysis:
              this.props.reportPresentationList?.richTextLayered
                ?.contentString || "",
            xingzhengAnalysis:
              this.props.reportPresentationList?.richTextAdministrative
                ?.contentString || "",
            chiefAnalysis:
              this.props.reportPresentationList?.subjectChiefWriteModel
                ?.contentString || "",
            scoringList: this.props.reportPresentationList?.scoreModel
              ?.scoreContentList
              ? this.props.reportPresentationList.scoreModel.scoreContentList
              : [
                  {
                    index: 1,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                  {
                    index: 2,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                  {
                    index: 3,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                ],
            scoringListNum:
              this.props.reportPresentationList?.scoreModel?.scoreContentList
                ?.length || 3,
            multiClassList: this.props.reportPresentationList.classShowModel
              ?.multiClassModelList || [
              {
                classContentList: [
                  {
                    stage: "",
                    studentNames: "",
                    learningState: "",
                    action: "",
                    index: 1,
                  },
                ],
                id: "",
                groupId: "",
                teacherNames: "",
                groupName: "",
              },
            ],
            leaderSummaryAnalysis:
              this.props.reportPresentationList?.summaryModel?.contentString ||
              "",

            authenticationModel:
              this.props.reportPresentationList?.authenticationModel,
            submitChange:
              this.props.reportPresentationList?.authenticationModel
                ?.synState == 1
                ? true
                : false,
          });
        });
      this.props
        .dispatch({
          type: "global/getCurrentUser",
        })
        .then(() => {
          this.getWaterMark(this.props.currentUser);
        });
      this.props
        .dispatch({
          type: "home/getReviewUploadedFile",
          payload: {
            examId: this.testId,
          },
        })
        .then(() => {
          this.setState({
            newList: this.props.reviewUploadedFile || [],
          });
        });
    }
  };

  computedTotal = (data) => {
    let total = 0;
    data.map((item, index) => {
      if (index != 0) {
        total += item.value;
      }
    });
    return total;
  };

  // 下载素养模板
  clickDownloadTemplate = () => {
    let url = `${window.location.origin}/api/paper/export/template?paperId=${this.testId}`;
    window.location.href = url;
  };

  formatterRate = (analysisData) => {
    let submitNumber = analysisData.submitNumber || 0,
      pushNumber = analysisData.pushNumber || 0,
      rate = (submitNumber / pushNumber) * 100;
    return pushNumber ? rate.toFixed(2) + "%" : "0%";
  };

  changeFull = (isFull) => {
    this.setState({
      isFull: !this.state.isFull,
    });
  };

  back = () => {
    this.props.dispatch({
      type: "home/clearView",
    });
    window.close();
  };

  setSelect = (index) => {
    this.setState({
      elevatorIndex: index,
    });

    const dom = document.getElementById(`table${index + 1}`);
    dom && dom.scrollIntoView(true);
  };

  renderNumContent = (number_) => {
    this.props.dispatch({
      type: "home/getStuInfo",
      payload: {
        stuList: number_,
        examId: this.testId,
        paperId: this.paperId,
      },
    });
  };
  onRef = (reference) => {
    this.analysisByStudent = reference;
  };

  changeTab2 = (check) => {
    this.classOverviewCharts.destroyAll();
    this.setState(
      {
        check,
      },
      () => {
        if (check == 2) {
          this.renderClassChart();
        } else if (check == 3) {
          this.renderTripleComparison();
        } else if (check == 4) {
          this.renderComparisonRates();
        } else if (check == 5) {
          this.renderLineChart();
        } else if (check == "boxPlot") {
          this.renderBoxPlot();
        }
      },
    );
  };

  hasClassOverviewChartData = (check) => {
    const rows = this.props.groupScoreList || [];
    if (check == 2 || check == 5) {
      return buildAverageChartRows(rows).length > 0;
    }
    if (check == 3) {
      return (
        buildTripleChartRows(rows, ["平均分", "最高分", "最低分"]).length > 0
      );
    }
    if (check == 4) {
      return (
        buildRateChartRows(rows, ["优秀率", "及格率", "低分率"]).length > 0
      );
    }
    return check == "boxPlot" && buildBoxPlotRows(rows).length > 0;
  };

  renderBoxPlot = () => {
    const chartDom = document.querySelector("#boxPlotEl");
    if (!chartDom) return;

    const boxRows = buildBoxPlotRows(this.props.groupScoreList || []);
    this.classOverviewCharts.destroy("boxPlot");
    if (boxRows.length === 0) return;
    const { teacherNameVisible } = this.state;
    const myChart = echarts.init(chartDom, null, {
      width: boxRows.length * 100 + 52,
      height: 400,
    });
    this.classOverviewCharts.replace("boxPlot", myChart);
    const classNames = boxRows.map((item) => {
      let label = locale() == "en" ? item.classNameEn : item.className;
      if (teacherNameVisible && item.courseTeacherNames) {
        label = `${label} \n ${item.courseTeacherNames}`;
      }
      return label;
    });
    let min = null;
    let max = null;

    const boxData = [];
    const outlierData = [];

    for (const [index, item] of boxRows.entries()) {
      boxData.push(item.values);
      if (min === null || min > item.values[0]) {
        min = Math.floor(item.values[0]);
      }
      if (max === null || max < item.values[4]) {
        max = Math.ceil(item.values[4]);
      }

      if (item.outlierLow.length > 0) {
        for (const it of item.outlierLow) {
          if (min === null || min > it) {
            min = Math.floor(it);
          }
          outlierData.push([index, it]);
        }
      }

      if (item.outlierHigh.length > 0) {
        for (const it of item.outlierHigh) {
          if (max === null || max < it) {
            max = Math.ceil(it);
          }
          outlierData.push([index, it]);
        }
      }
    }

    // 构建 series，每组单独设 itemStyle.color
    const series = [
      {
        name: "成绩分布",
        type: "boxplot",
        data: boxData.map((d, index) => ({
          value: d,
          itemStyle: {
            color: colors[index % colors.length],
            borderColor: colors[index % colors.length].replace("0.3", "1"), // 边框更深
          },
        })),
      },
      {
        name: "异常值",
        type: "scatter",
        data: outlierData,
        symbolSize: 5,
        itemStyle: {
          color: "#1D2129",
        },
        tooltip: {
          formatter: function (parameter) {
            console.log(parameter, "param1");
            return `${classNames[parameter.data[0]]}<br/>异常值: ${parameter.data[1]}`;
          },
        },
      },
    ];

    const option = {
      grid: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
      tooltip: {
        appendToBody: true,
        trigger: "item",
        position: function (point, parameters, dom, rect, size) {
          const [x0, y0] = point;
          // 获取图表容器在页面中的位置（相对于 body）
          const chartRect = chartDom.getBoundingClientRect();
          // 相对于视口的位置
          const mouseX = x0 + chartRect.left;
          const mouseY = y0 + chartRect.top;

          const contentWidth = dom.offsetWidth || 200;
          const contentHeight = dom.offsetHeight || 200;
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          let x = mouseX + 10; // 默认右侧显示
          let y = mouseY;

          // 如果右侧显示不下，就切换到左侧
          if (x + contentWidth > viewportWidth) {
            x = mouseX - contentWidth - 10;
          }
          // 如果左侧也放不下，贴左边
          if (x < 0) x = 0;
          // 如果下方显示不下，就往上顶
          if (y + contentHeight > viewportHeight) {
            y = viewportHeight - contentHeight - 10;
          }
          // 防止 y 为负值（极端情况）
          if (y < 0) y = 0;

          console.log(x, y, "x, y"); // 相对于浏览器视口的位置
          return [x - chartRect.left, y - chartRect.top]; // 返回的坐标是相对于容器的位置
        },

        formatter: function (parameter) {
          console.log(parameter, "param");

          let outlierHighList = [];
          let outlierLowList = [];

          if (boxRows[parameter.dataIndex]?.outlierHigh) {
            outlierHighList = boxRows[parameter.dataIndex].outlierHigh.map(
              (it) => {
                return `<div style="min-width:70px;display:inline-block">${trans("global.qutliers", "异常")}</div>：${it}`;
              },
            );
          }
          if (boxRows[parameter.dataIndex]?.outlierLow) {
            outlierLowList = boxRows[parameter.dataIndex].outlierLow.map(
              (it) => {
                return `<div style="min-width:70px;display:inline-block">${trans("global.qutliers", "异常")}</div>：${it}`;
              },
            );
          }

          return `<div style="color:#01113d;font-size: 12px;line-height: 20px;">
            ${[
              `${trans("global.group", "班级")}：${classNames[parameter.dataIndex]}`,
              ...outlierHighList,
              `<div style="min-width:70px;display:inline-block">${trans("global.upperWhisper", "上限")}</div>：${parameter.data.value[5]}`,
              `<div style="min-width:70px;display:inline-block">${trans("global.Q3", "上四分位数")}</div>：${parameter.data.value[4]}`,
              `<div style="min-width:70px;display:inline-block">${trans("global.median", "中位分")}</div>：${parameter.data.value[3]}`,
              `<div style="min-width:70px;display:inline-block">${trans("global.Q1", "下四分位数")}</div>：${parameter.data.value[2]}`,
              `<div style="min-width:70px;display:inline-block">${trans("global.lowerFence", "下限")}</div>：${parameter.data.value[1]}`,
              ...outlierLowList,
            ].join("<br/>")}
          </div>`;
        },
      },
      xAxis: {
        type: "category",
        data: classNames,
        axisLabel: { interval: 0 },
      },
      yAxis: {
        type: "value",
        min: min == 0 ? 0 : min % 5 == 0 ? min - 5 : min - (min % 5),
        max: max % 5 == 0 ? max + 5 : max + (5 - (max % 5)),
      },
      series: series,
    };

    myChart.setOption(option);
  };

  renderLineChart = () => {
    this.classOverviewCharts.destroy("line");
    const dom = document.querySelector("#lineChart");
    if (!dom) return;
    const { groupScoreList } = this.props;
    const { teacherNameVisible } = this.state;
    const data = buildAverageChartRows(groupScoreList || []);
    if (data.length === 0) return;
    if (groupScoreList && groupScoreList.length > 0) {
      if (groupScoreList.length > 4 && groupScoreList.length < 8) {
        dom.style.width = "50%";
      } else if (groupScoreList.length > 7) {
        dom.style.width = "100%";
      } else if (groupScoreList.length < 5) {
        dom.style.width = "33%";
      }
    }
    const chart = new G2.Chart({
      container: "lineChart",
      forceFit: true,
      height: 300,
      padding: [20, 60, 30, 40],
    });

    chart.source(data);
    if (teacherNameVisible) {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div
                      style="
                      width:auto;
                      white-space:nowrap;
                      text-align:center;
                      margin-top:14px;
                      font-size: 10px;
                      color: rgba(1,17,61,0.85);
                      font-weight: 400;"
                   >
                      ${text}
                      <br />
                      ${teacherNameVisible ? data[index]?.courseTeacherNames : ""}
                    </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    } else {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div
                      style="
                      width:auto;
                      white-space: nowrap;
                      text-align:center;
                      font-size: 10px;
                      color: rgba(1,17,61,0.85);
                      font-weight: 400;"
                   >
                      ${text}
                    </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    }

    const { averageScore: gradeAverage } = buildClassOverviewBenchmark(
      groupScoreList || [],
    );
    if (this.state.averageChecked == true && gradeAverage !== null) {
      chart.guide().line({
        top: true,
        start: ["min", gradeAverage],
        end: ["max", gradeAverage],
        lineStyle: {
          stroke: "red",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: `年级均分 ${gradeAverage}`,
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
          },
        },
      });
    }
    chart.scale("classScore", {
      alias: "分数",
      tickCount: 5,
    });
    chart.axis("classScore", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
    });
    chart.legend(false);
    if (this.state.averageClaaaChecked) {
      chart
        .line()
        .position("className*classScore")
        .color([
          "#3d94ff",
          "#12CC67",
          "#FFE030",
          "#FC7D7D",
          "#4BE4E7",
          "#19A978",
          "#FF9451",
          "#B169EB",
          "#E286D2",
          "#3D82D6",
          "#CC8C47",
          "#B0CAFF",
          "#CE6C6C",
          "#C0DF35",
          "#D4B589",
          "#C1C1C1",
        ]);
      chart
        .point()
        .position("className*classScore")
        .size(4)
        .shape("circle")
        .style({
          stroke: "#fff",
          lineWidth: 1,
        })
        .label("classScore", {
          position: "top",
          textStyle: {
            fill: "#333",
            fontSize: 12,
            shadowBlur: 2,
          },
          formatter: (text) => {
            const value = Number.parseFloat(text);
            return text;
          },
          offset: 10,
        });
    } else {
      chart.line().position("className*classScore");
      chart
        .point()
        .position("className*classScore")
        .size(4)
        .shape("circle")
        .style({
          stroke: "#fff",
          lineWidth: 1,
        });
    }

    chart.tooltip(legacyG2TooltipOptions());
    this.classOverviewCharts.replace("line", chart);
    chart.render();
  };
  renderClassChart = () => {
    this.classOverviewCharts.destroy("bar");
    const dom = document.querySelector("#classChart");
    if (!dom) return;
    const { teacherNameVisible } = this.state;
    const { groupScoreList } = this.props;
    const data = buildAverageChartRows(groupScoreList || []);
    if (data.length === 0) return;

    if (groupScoreList && groupScoreList.length > 0) {
      if (groupScoreList.length > 4 && groupScoreList.length < 8) {
        dom.style.width = "50%";
      } else if (groupScoreList.length > 7) {
        dom.style.width = "100%";
      } else if (groupScoreList.length < 5) {
        dom.style.width = "33%";
      }
    }
    let chart = new G2.Chart({
      container: "classChart",
      forceFit: true,
      height: 300,
      // width:10000,
      padding: [20, 60, 30, 40],
    });

    chart.clear();
    chart.source(data);
    if (teacherNameVisible) {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div
                      style="
                      width:auto;
                      white-space:nowrap;
                      text-align:center;
                      margin-top:14px;
                      font-size: 10px;
                      color: rgba(1,17,61,0.85);
                      font-weight: 400;"
                   >
                      ${text}
                      <br />
                      ${teacherNameVisible ? data[index]?.courseTeacherNames : ""}
                    </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    } else {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div
                      style="
                      width:auto;
                      white-space: nowrap;
                      text-align:center;
                      font-size: 10px;
                      color: rgba(1,17,61,0.85);
                      font-weight: 400;"
                   >
                      ${text}
                    </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    }
    const { averageScore: gradeAverage } = buildClassOverviewBenchmark(
      groupScoreList || [],
    );
    if (this.state.averageChecked == true && gradeAverage !== null) {
      chart.guide().line({
        top: true,
        start: ["min", gradeAverage],
        end: ["max", gradeAverage],
        lineStyle: {
          stroke: "red",
          lineDash: [0, 0, 0],
          lineWidth: 2,
        },
        text: {
          content: `年级均分 ${gradeAverage}`,
          position: "end",
          offsetX: 2,
          offsetY: 5,
          style: {
            fontWeight: 400,
            fontSize: 12,
            fill: "#000",
            // opacity: 5,
          },
        },
      });
    }
    chart.scale("classScore", {
      alias: "分数",
      max: this.props.viewData.totalScore,
      min: 0,
      tickCount: 5,
    });
    chart.axis("classScore", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
    });
    chart.legend(false);
    if (this.state.averageClaaaChecked) {
      chart
        .interval()
        .position("className*classScore")
        .size(32)
        .color("className", [
          "#3d94ff",
          "#12CC67",
          "#FFE030",
          "#FC7D7D",
          "#4BE4E7",
          "#19A978",
          "#FF9451",
          "#B169EB",
          "#E286D2",
          "#3D82D6",
          "#CC8C47",
          "#B0CAFF",
          "#CE6C6C",
          "#C0DF35",
          "#D4B589",
          "#C1C1C1",
        ])
        .opacity(1)
        .label("classScore", {
          position: "top",
          textStyle: {
            fill: "#333",
            fontSize: 12,
            shadowBlur: 2,
            // shadowColor: "rgba(0, 0, 0, .45)",
          },
          formatter: (text) => {
            const value = Number.parseFloat(text);
            // if (val < 0.05) {
            //   return (val * 100).toFixed(1) + "%";
            // }
            return text;
          },
          offset: 10,
        });
    } else {
      chart
        .interval()
        .position("className*classScore")
        .size(32)
        .color("className", [
          "#3d94ff",
          "#12CC67",
          "#FFE030",
          "#FC7D7D",
          "#4BE4E7",
          "#19A978",
          "#FF9451",
          "#B169EB",
          "#E286D2",
          "#3D82D6",
          "#CC8C47",
          "#B0CAFF",
          "#CE6C6C",
          "#C0DF35",
          "#D4B589",
          "#C1C1C1",
        ])
        .opacity(1);
    }
    chart.tooltip(legacyG2TooltipOptions());
    this.classOverviewCharts.replace("bar", chart);
    chart.render();
  };
  renderComparisonRates = () => {
    this.classOverviewCharts.destroy("rates");
    if (!document.querySelector("#comparisonRates")) return;
    const { teacherNameVisible } = this.state;
    const { groupScoreList } = this.props;
    const data = buildRateChartRows(groupScoreList || [], [
      trans("global.excellentRate", "优秀率"),
      trans("global.passRating", "及格率"),
      trans("global.lowScoreRate", "低分率"),
    ]);
    if (data.length === 0) return;
    const chart = new G2.Chart({
      container: "comparisonRates",
      // forceFit: true,
      height: 300,
      padding: [25, 100, 30, 60],
      width: groupScoreList.length * 170,
    });

    chart.source(data);

    if (this.state.averageChecked2 == true) {
      const {
        outstandingRate: maxScore,
        passRate,
        lowRate: minScore,
      } = buildClassOverviewBenchmark(groupScoreList || []);
      if (maxScore !== null) {
        chart.guide().line({
          top: true,
          start: ["0%", 100 - maxScore + "%"],
          end: ["95%", 100 - maxScore + "%"],
          lineStyle: {
            stroke: "#3d94ff",
            lineDash: [0, 0, 0],
            lineWidth: 2,
          },
          text: {
            content: `年级优秀率 ${maxScore}%`,
            position: "end",
            offsetX: 2,
            offsetY: 5,
            style: {
              fontWeight: 400,
              fontSize: 12,
              fill: "#000",
            },
          },
        });
      }
      if (passRate !== null) {
        chart.guide().line({
          top: true,
          start: ["0%", 100 - passRate + "%"],
          end: ["95%", 100 - passRate + "%"],
          lineStyle: {
            stroke: "#12CC67",
            lineDash: [0, 0, 0],
            lineWidth: 2,
          },
          text: {
            content: `年级及格率 ${passRate}%`,
            position: "end",
            offsetX: 2,
            offsetY: 5,
            style: {
              fontWeight: 400,
              fontSize: 12,
              fill: "#000",
            },
          },
        });
      }
      if (minScore !== null) {
        chart.guide().line({
          top: true,
          start: ["0%", 100 - minScore + "%"],
          end: ["95%", 100 - minScore + "%"],
          lineStyle: {
            stroke: "#c1c1c1",
            lineDash: [0, 0, 0],
            lineWidth: 2,
          },
          text: {
            content: `年级低分率 ${minScore}%`,
            position: "end",
            offsetX: 2,
            offsetY: 5,
            style: {
              fontWeight: 400,
              fontSize: 12,
              fill: "#000",
            },
          },
        });
      }
    }
    chart.scale("classScore", {
      alias: "得分率",
      max: 100,
      min: 0,
      tickCount: 5,
      formatter(text) {
        return text + "%";
      },
    });

    chart.axis("classScore", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
      title: {
        offset: 50,
      },
    });
    chart.legend({
      position: "top-center",
    });
    chart.tooltip(
      legacyG2TooltipOptions({
        containerTpl:
          "<div class='g2-tooltip'>" +
          "<div class='g2-tooltip-title'>{className}</div>" +
          "<ul class='g2-tooltip-list'></ul>" +
          "</div>",
        itemTpl:
          "<li style='display: flex;'><span style='width: 130px'>{scoreName}</span><span style='width: 50px'>{classScore}%</span></li>",
      }),
    );
    if (this.state.averageClaaaChecked2) {
      chart
        .interval()
        .position("className*classScore")
        .color("scoreName", ["#3d94ff", "#12CC67", "#C1C1C1"])
        .opacity(1)
        .size(32)
        // .label("classScore")
        .adjust([
          {
            type: "dodge",
            // marginRatio: 0.2,
          },
        ])
        .tooltip(
          "className*classScore*scoreName",
          function (className, classScore, scoreName) {
            return {
              className,
              classScore,
              scoreName,
            };
          },
        )
        .label("classScore", {
          position: "top",
          textStyle: {
            fill: "#333",
            fontSize: 12,
            shadowBlur: 2,
            // shadowColor: "rgba(0, 0, 0, .45)",
          },
          // formatter: (text) => {
          //   // const val = parseFloat(text);
          //   // if (val < 0.05) {
          //   //   return (val * 100).toFixed(1) + "%";
          //   // }
          //   return text + "%";
          // },
          offset: 10,
        });
    } else {
      chart
        .interval()
        .position("className*classScore")
        .color("scoreName", ["#3d94ff", "#12CC67", "#C1C1C1"])
        .opacity(1)
        .size(32)
        // .label("classScore")
        .adjust([
          {
            type: "dodge",
            // marginRatio: 0.2,
          },
        ])
        .tooltip(
          "className*classScore*scoreName",
          function (className, classScore, scoreName) {
            return {
              className,
              classScore,
              scoreName,
            };
          },
        );
    }
    if (teacherNameVisible) {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div
                      style="
                      width:auto;
                      white-space:nowrap;
                      text-align:center;
                      margin-top:14px;
                      font-size: 10px;
                      color: rgba(1,17,61,0.85);
                      font-weight: 400;"
                   >
                      ${text}
                      <br />
                      ${teacherNameVisible ? data[index * 3]?.courseTeacherNames || "" : ""}
                    </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    } else {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div
                      style="
                      width:auto;
                      white-space:nowrap;
                      text-align:center;
                      font-size: 10px;
                      color: rgba(1,17,61,0.85);
                      font-weight: 400;"
                   >
                      ${text}
                    </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    }

    this.classOverviewCharts.replace("rates", chart);
    chart.render();
  };
  renderTripleComparison = () => {
    this.classOverviewCharts.destroy("triple");
    if (!document.querySelector("#tripleComparison")) return;
    const { teacherNameVisible } = this.state;
    const { groupScoreList } = this.props;
    const data = buildTripleChartRows(groupScoreList || [], [
      trans("global.averageScore", "平均分"),
      trans("global.highestScore", "最高分"),
      trans("global.lowestScore", "最低分"),
    ]);
    if (data.length === 0) return;

    const chart = new G2.Chart({
      container: "tripleComparison",
      // forceFit: true,
      height: 300,
      padding: [25, 100, 30, 40],
      width: groupScoreList.length * 170,
    });

    chart.source(data);

    if (this.state.averageChecked1 == true) {
      const {
        averageScore: gradeAverage,
        maximumScore: gradeMaximum,
        minimumScore: gradeMinimum,
      } = buildClassOverviewBenchmark(groupScoreList || []);
      if (gradeAverage !== null) {
        chart.guide().line({
          top: true,
          start: ["0%", this.props.viewData.totalScore - gradeAverage + "%"],
          end: ["97%", this.props.viewData.totalScore - gradeAverage + "%"],
          lineStyle: {
            stroke: "#12CC67",
            lineDash: [0, 0, 0],
            lineWidth: 2,
          },
          text: {
            content: `年级均分 ${gradeAverage}`,
            position: "end",
            offsetX: 2,
            offsetY: 5,
            style: {
              fontWeight: 400,
              fontSize: 12,
              fill: "#000",
            },
          },
        });
      }

      if (gradeMaximum !== null) {
        chart.guide().line({
          top: true,
          start: ["0%", this.props.viewData.totalScore - gradeMaximum + "%"],
          end: ["97%", this.props.viewData.totalScore - gradeMaximum + "%"],
          lineStyle: {
            stroke: "#3d94ff",
            lineDash: [0, 0, 0],
            lineWidth: 2,
          },
          text: {
            content: `年级最高 ${gradeMaximum}`,
            position: "end",
            offsetX: 2,
            offsetY: 5,
            style: {
              fontWeight: 400,
              fontSize: 12,
              fill: "#000",
            },
          },
        });
      }
      if (gradeMinimum !== null) {
        chart.guide().line({
          top: true,
          start: ["0%", this.props.viewData.totalScore - gradeMinimum + "%"],
          end: ["97%", this.props.viewData.totalScore - gradeMinimum + "%"],
          lineStyle: {
            stroke: "#C1C1C1",
            lineDash: [0, 0, 0],
            lineWidth: 2,
          },
          text: {
            content: `年级最低 ${gradeMinimum}`,
            position: "end",
            offsetX: 2,
            offsetY: 5,
            style: {
              fontWeight: 400,
              fontSize: 12,
              fill: "#000",
            },
          },
        });
      }
    }
    chart.scale("classScore", {
      alias: "分数",
      // nice: false,
      max: this.props.viewData.totalScore,
      // max: 140,
      min: 0,
      tickCount: 2,
    });
    // chart.downloadImage();
    if (teacherNameVisible) {
      chart.axis("className", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div
                      style="
                      width:auto;
                      white-space:nowrap;
                      text-align:center;
                      margin-top:14px;
                      font-size: 10px;
                      color: rgba(1,17,61,0.85);
                      font-weight: 400;"
                   >
                      ${text}
                      <br />
                      ${teacherNameVisible ? data[index * 3]?.courseTeacherNames || "" : ""}
                    </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    } else {
      chart.axis("className", {
        label: {
          label: {
            offsetY: 0,
            htmlTemplate(text, item, index) {
              return `<div
                        style="
                        width:auto;
                        white-space:nowrap;
                        text-align:center;
                        font-size: 10px;
                        color: rgba(1,17,61,0.85);
                        font-weight: 400;"
                     >
                        ${text}
                      </div>`;
            },
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    }

    chart.axis("classScore", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
      title: {
        offset: 50,
      },
    });
    chart.legend({
      position: "top-center",
    });
    chart.tooltip(
      legacyG2TooltipOptions({
        containerTpl:
          "<div class='g2-tooltip'>" +
          "<div class='g2-tooltip-title'>{className}</div>" +
          "<ul class='g2-tooltip-list'></ul>" +
          "</div>",
        itemTpl: `<li style='display: flex;'><span style='width: 130px'>{scoreName}</span><span style='width: 50px'>{classScore}${trans("global.point", "分")}</span></li>`,
      }),
    );
    if (this.state.averageClaaaChecked1) {
      chart;
      chart
        .interval()
        .position("className*classScore")
        .color("scoreName", ["#3d94ff", "#12CC67", "#C1C1C1"])
        .opacity(1)
        .size(32)
        .label("classScore")
        .adjust([
          {
            type: "dodge",
            // marginRatio: 0.2,
          },
        ])
        .tooltip(
          "className*classScore*scoreName",
          function (className, classScore, scoreName) {
            return {
              className,
              classScore,
              scoreName,
            };
          },
        )
        .label("classScore", {
          position: "top",
          textStyle: {
            fill: "#333",
            fontSize: 12,
            shadowBlur: 2,
            // shadowColor: "rgba(0, 0, 0, .45)",
          },
          formatter: (text) => {
            const value = Number.parseFloat(text);
            // if (val < 0.05) {
            //   return (val * 100).toFixed(1) + "%";
            // }
            return text;
          },
          offset: 10,
        });
    } else {
      chart
        .interval()
        .position("className*classScore")
        .color("scoreName", ["#3d94ff", "#12CC67", "#C1C1C1"])
        .opacity(1)
        .size(32)
        // .label("classScore")
        .adjust([
          {
            type: "dodge",
            // marginRatio: 0.2,
          },
        ])
        .tooltip(
          "className*classScore*scoreName",
          function (className, classScore, scoreName) {
            return {
              className,
              classScore,
              scoreName,
            };
          },
        );
    }

    this.classOverviewCharts.replace("triple", chart);
    chart.render();
  };
  exportImgClk = () => {
    this.classOverviewCharts.download("bar", "班级成绩柱状图");
  };
  exportImgClk1 = () => {
    this.classOverviewCharts.download("triple", "班级成绩三分对比图");
  };
  exportImgClk2 = () => {
    this.classOverviewCharts.download("rates", "班级成绩三率对比图");
  };
  exportImgClk5 = () => {
    this.classOverviewCharts.download("line", "班级成绩折线图");
  };

  averageChange = (checked) => {
    this.setState(
      {
        averageChecked: checked,
      },
      () => {
        if (this.state.check === 2) {
          this.renderClassChart();
        } else {
          this.renderLineChart();
        }
      },
    );
  };

  averageClassChange = (checked) => {
    this.setState(
      {
        averageClaaaChecked: checked,
      },
      () => {
        if (this.state.check === 2) {
          this.renderClassChart();
        } else {
          this.renderLineChart();
        }
      },
    );
  };

  averageChange1 = (checked) => {
    this.setState(
      {
        averageChecked1: checked,
      },
      () => {
        this.renderTripleComparison();
      },
    );
  };
  averageClassChange1 = (checked) => {
    this.setState(
      {
        averageClaaaChecked1: checked,
      },
      () => {
        this.renderTripleComparison();
      },
    );
  };
  averageChange2 = (checked) => {
    this.setState(
      {
        averageChecked2: checked,
      },
      () => {
        this.renderComparisonRates();
      },
    );
  };
  averageClassChange2 = (checked) => {
    this.setState(
      {
        averageClaaaChecked2: checked,
      },
      () => {
        this.renderComparisonRates();
      },
    );
  };
  changeGrade = (value) => {
    this.setState(
      {
        groupIdDiy: value,
      },
      () => {
        this.props.dispatch({
          type: "home/getIndividuationTest",
          payload: {
            examPaperId: this.paperId,
            groupId: value === 0 ? null : value,
            type: 1,
          },
        });
      },
    );
  };

  testClick = (id) => {
    // console.log(id, "111");
    this.props.dispatch({
      type: "home/getItem",
      payload: {
        questionId: id,
        paperId: this.paperId,
      },
    });
  };

  // 下载
  clickPrint = () => {
    let url = `${window.location.origin}/api/exam/getPrintingPaper?examPaperId=${this.paperId}`;
    window.open(url);
  };

  clickName = (sortOrder) => {
    window.open(
      `${window.location.origin}/exam#/stuWork/${this.paperId}/${sortOrder.studentId}`,
    );
  };

  //暂存功能
  saveToLocal = (key, value) => {
    window.localStorage.setItem(key, value);
  };

  //编辑命题分析失去焦点
  blurEditPropositional = () => {
    this.setState({
      isEditpropositional: false, //是否编辑题目内容
    });
  };
  blurEditfenceng = () => {
    this.setState({
      isEditfenceng: false, //是否编辑题目内容
    });
  };
  blurEditxingzheng = () => {
    this.setState({
      isEditxingzheng: false, //是否编辑题目内容
    });
  };
  blurEditLeaderSummary = () => {
    this.setState({
      isEditleaderSummary: false, //是否编辑题目内容
    });
  };
  // 学科首席
  blurEditChiefSummary = () => {
    this.setState({
      isEditChiefSummary: false, //是否编辑题目内容
    });
  };
  // 得分率
  onRefPropositional = (reference) => {
    this.selfBraftEditor = reference;
  };
  focusEditor = () => {
    this.selfBraftEditor.foucusFn();
  };
  // 单一编辑
  singleEdit = (index) => {};
  // 命题分析编辑  1
  editAnalysis = () => {
    this.singleEdit();
    this.setState({
      modelKey: 1,
    });
    this.getLock("titleModel", this.testId, 1, "", () => {
      this.setState(
        {
          isEditpropositional: true,
        },
        () => {
          this.focusEditor();
        },
      );
    });
  };
  //分层班
  fencengAnalysis = () => {
    this.singleEdit();
    this.setState({
      modelKey: 7,
    });
    this.getLock("fencengModel", this.testId, 7, "", () => {
      this.setState(
        {
          isEditfenceng: true,
        },
        () => {
          this.focusEditor();
        },
      );
    });
  };
  xingzhengAnalysis = () => {
    this.singleEdit();
    this.setState({
      modelKey: 8,
    });
    this.getLock("xingzhengModel", this.testId, 8, "", () => {
      this.setState(
        {
          isEditxingzheng: true,
        },
        () => {
          this.focusEditor();
        },
      );
    });
  };
  // 点击备课组长总结 2
  editleaderSummary = () => {
    this.singleEdit();
    this.setState({
      modelKey: 4,
    });
    this.getLock("summaryModel", this.testId, 4, "", () => {
      this.setState(
        {
          isEditleaderSummary: true,
        },
        () => {
          this.focusEditor();
        },
      );
    });
  };
  // 点击学科首席总结
  editChiefSummary = () => {
    this.singleEdit();
    this.setState({
      modelKey: 6,
    });
    this.getLock("chiefModel", this.testId, 6, "", () => {
      this.setState(
        {
          isEditChiefSummary: true,
        },
        () => {
          this.focusEditor();
        },
      );
    });
  };
  //取消编辑富文本
  cancelEditor = (type) => {
    if (type == "releseLock") {
      //手动取消释放锁，如果是手动保存，无需释放锁
      this.releaseLock(); //解锁
    }
    this.setState({
      richEditorObj: {},
    });
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
      },
      onSuccess: (res) => {
        //获取锁成功
        let uuId = res && res.uuId;
        let currentOperItem = {
          examId,
          resultType,
          code, //模块code
        };
        if (res.content.modelKey == 1) {
          this.setState({ propositionalAnalysis: res.content.contentString });
        } else if (res.content.modelKey == 4) {
          this.setState({ leaderSummaryAnalysis: res.content.contentString });
        } else if (res.content.modelKey == 6) {
          this.setState({ chiefAnalysis: res.content.contentString });
        } else if (res.content.modelKey == 7) {
          this.setState({ fencengAnalysis: res.content.contentString });
        } else if (res.content.modelKey == 8) {
          this.setState({ xingzhengAnalysis: res.content.contentString });
        } else if (res.content.modelKey == 2) {
          this.setState({
            // scoringList: res.content.scoreContentList,
            scoringList: res.content.scoreContentList
              ? res.content.scoreContentList
              : [
                  {
                    index: 1,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                  {
                    index: 2,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                  {
                    index: 3,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                ],
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
        examId: this.testId,
        uuId: this.state.uuId,
        modelKey: this.state.modelKey,
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
        examId: this.testId,
        modelKey: resultType,
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
        if (res.content.modelKey == 1) {
          this.setState(
            {
              isEditpropositional: true,
              propositionalAnalysis: res.content.contentString,
            },
            () => {
              this.focusEditor();
            },
          );
        } else if (res.content.modelKey == 4) {
          this.setState(
            {
              isEditleaderSummary: true,
              leaderSummaryAnalysis: res.content.contentString,
            },
            () => {
              this.focusEditor();
            },
          );
        } else if (res.content.modelKey == 7) {
          this.setState(
            {
              isEditfenceng: true,
              fencengAnalysis: res.content.contentString,
            },
            () => {
              this.focusEditor();
            },
          );
        } else if (res.content.modelKey == 8) {
          this.setState(
            {
              isEditxingzheng: true,
              xingzhengAnalysis: res.content.contentString,
            },
            () => {
              this.focusEditor();
            },
          );
        } else if (res.content.modelKey == 6) {
          this.setState(
            {
              isEditChiefSummary: true,
              chiefAnalysis: res.content.contentString,
            },
            () => {
              this.focusEditor();
            },
          );
        } else if (res.content.modelKey == 2) {
          let timer = setInterval(() => {
            this.scoreSave();
          }, 15_000); //自动保存时间30000，暂时改成10000，方便测试
          this.setState({
            scoreTimer: timer,
            editScoreRate: true,
            // scoringList: res.content.scoreContentList,
            scoringList: res.content.scoreContentList
              ? res.content.scoreContentList
              : [
                  {
                    index: 1,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                  {
                    index: 2,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                  {
                    index: 3,
                    sectionTitle: "",
                    learningState: " ",
                    teachingState: " ",
                    questionDesign: " ",
                  },
                ],
          });
        }
        // this.enterEditing(currentOperItem.code);
      },
    });
  };

  //放弃抢锁
  giveupLocking = () => {
    this.setState({
      lockTipVisible: false,
    });
  };

  reportEdit = () => {
    this.setState({
      subEdit: true,
    });
  };

  // 点击提交
  submitReport = () => {
    console.log(this.state.leaderSummaryAnalysis, "222");

    let result = config.find(
      (moduleConfig) =>
        moduleConfig.moduleKey == "summarizeModel" && moduleConfig.moduleShow,
    );
    if (!this.state.leaderSummaryAnalysis && result) {
      this.setState({
        noSummary: true,
        subEdit: false,
      });
    } else {
      this.props
        .dispatch({
          type: "home/postEditReport",
          payload: {
            examId: this.testId,
            synState: 1,
          },
        })
        .then(() => {
          this.setState({
            submitChange: true,
            editScoreRate: false,
            subEdit: false,
            updatedChange: true,
          });
          // this.multiClassRef.multiClassChange();
        });
    }
  };
  //得分率
  clickInput = (text, record, row) => {
    if (!this.state.editScoreRate) return;
    let state = Object.assign({}, this.state);
    state[`inputVib${record.index}${row}`] = true;
    this.setState(
      {
        ...state,
      },
      () => {
        const inp = document.querySelector("#inpID");
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

  inpChange = (record, key, e) => {
    // let str = e.target.value.replaceAll("\n", "<br/>");
    // console.log(str, "ppp");
    let newList = [];
    this.state.scoringList.map((item) => {
      if (item.index == record.index) {
        if (key == "learningState") {
          newList.push({
            index: item.index,
            sectionTitle: item.sectionTitle,
            learningState: e,
            teachingState: item.teachingState,
            questionDesign: item.questionDesign,
          });
        } else if (key == "sectionTitle") {
          newList.push({
            index: item.index,
            sectionTitle: e.target.value,
            learningState: item.learningState,
            teachingState: item.teachingState,
            questionDesign: item.questionDesign,
          });
        } else if (key == "teachingState") {
          newList.push({
            index: item.index,
            sectionTitle: item.sectionTitle,
            learningState: item.learningState,
            teachingState: e,
            questionDesign: item.questionDesign,
          });
        } else if (key == "questionDesign") {
          newList.push({
            index: item.index,
            sectionTitle: item.sectionTitle,
            learningState: item.learningState,
            teachingState: item.teachingState,
            questionDesign: e,
          });
        }
      } else {
        newList.push(item);
      }
    });
    this.setState({
      scoringList: newList,
    });
    // console.log(this.state.scoringList, "ppp1");
  };
  addScoringList = () => {
    const addObject = {
      index: this.state.scoringListNum + 1,
      sectionTitle: "",
      learningState: " ",
      teachingState: " ",
      questionDesign: " ",
    };
    this.setState({
      scoringList: [...this.state.scoringList, addObject],
      scoringListNum: this.state.scoringListNum + 1,
    });
  };
  // 点击得分率编辑 3
  clickEditScoreRate = () => {
    this.singleEdit();
    this.setState({
      modelKey: 2,
    });
    this.getLock("scoreModel", this.testId, 2, "", () => {
      let timer = setInterval(() => {
        if (this.state.active === 9) {
          this.scoreSave();
        }
      }, 15_000); //自动保存时间30000，暂时改成10000，方便测试
      this.setState({
        scoreTimer: timer,
        editScoreRate: true,
      });
    });
  };
  //清除定时器
  clearTimer = () => {
    clearInterval(this.state.scoreTimer);
  };

  //点击发布
  clickRelease = (id) => {
    window.open(`${window.location.origin}/#/examAnalysis/${id}/1`);
  };

  clickDownloadTestPaper = (id, uploadFileExist, isEdit, moduleList) => {
    const downloadTarget = resolvePaperDownloadTarget({
      hasStructuredContent: moduleList?.length > 0,
      uploadFileEditable: isEdit,
      uploadFileExist,
    });
    if (downloadTarget === "browser-pdf") {
      void downloadExamPaperPdf({ paperId: id });
    } else if (downloadTarget === "source-file") {
      this.props
        .dispatch({
          type: "home/getViewOrDownPaper",
          payload: {
            paperId: id,
          },
        })
        .then(() => {
          window.open(this.props.viewOrDownPaper.url);
        });
    }
  };

  // 修改name
  clickTitName = (item) => {
    console.log(11);
    this.setState(
      {
        isTitName: true,
        TitName: item.examName,
      },
      () => {
        const titleInp = document.querySelector("#headerInput");
        titleInp.focus();
      },
    );
  };

  blurTitName = (e, examId, id) => {
    this.setState({
      TitName: e.target.value,
      isTitName: false,
    });
    this.props.dispatch({
      type: "home/getEditPaperOrExamName",
      payload: {
        examId: this.testId,
        // examPaperId: id,
        name: e.target.value,
      },
    });
  };

  onSearch = (search) => {
    this.setState({ search, loading1: !!search });
    console.log("Search:", search);
    if (search) {
      this.loadGithubUsers(search);
    }
  };

  loadGithubUsers = (name) => {
    if (!name) {
      return;
    }
    this.props
      .dispatch({
        type: "home/getUserByName",
        payload: {
          name: name,
        },
      })
      .then(() => {
        this.setState({
          loading1: false,
        });
      });
  };

  clickDoesNotContain = () => {
    this.setState({
      isSpecify: 2,
    });
  };

  clickAllStu = () => {
    this.setState({
      isSpecify: 1,
    });
  };

  clickAbsenceManagement = () => {
    this.setState({
      isAbsenceManagement: true,
    });
  };

  absenceOk = () => {
    this.setState(
      {
        isAbsenceManagement: false,
      },
      () => {
        window.location.reload();
      },
    );
  };

  clickTestSettings = () => {
    const {
      machineTestoptions,
      modalMachineTestProps,
      modalOnlineTestOptions,
      modalOnlineTestProps,
    } = this.state;
    if (this.props.viewData.examSourceType == 1) {
      this.setState({
        machineTestoptions: {
          ...machineTestoptions,
          visible: true,
        },
        modalMachineTestProps: {
          ...modalMachineTestProps,
          id: this.testId,
        },
      });
    } else {
      this.setState({
        modalOnlineTestOptions: {
          ...modalOnlineTestOptions,
          visible: true,
        },
        modalOnlineTestProps: {
          ...modalOnlineTestProps,
          id: this.testId,
        },
      });
    }
  };
  absenceCancel = () => {
    this.setState({
      isAbsenceManagement: false,
    });
  };
  onRefAbsen = (reference) => {
    this.studentAbsenSelect = reference;
  };
  clickAdministrationClass = () => {
    this.props
      .dispatch({
        type: "home/getGroupChanging",
        payload: {
          examId: this.testId,
        },
      })
      .then(() => {
        window.top.location.href = `${window.location.origin}/exam#/dataAnalysis/${this.props.groupChanging.examId}/${this.paperId}/${this.active}`;
        window.location.reload();
      });
  };
  purviewVisible = () => {
    this.setState(
      {
        purviewVisible: !this.state.purviewVisible,
      },
      () => {
        console.log(this.state.purviewVisible);
      },
    );
  };
  //点击上传试卷
  clickUploadTest = () => {
    this.setState({
      isUploadTest: true,
    });
  };
  uploadTestCancel = () => {
    this.setState({
      isUploadTest: false,
    });
  };
  changupload1 = (info) => {
    let file = info.file;
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1);
    fileList = fileList.map((file) => {
      if (file.response) {
        file.url = file.response.url;
        this.setState({
          fileId: file.response.content[0].fileId,
        });
      }
      return file;
    });
    // console.log(this.state.fileId, "jjk");
    this.setState({
      newfileList: fileList,
    });
  };
  deleteIcon = () => {
    this.setState({
      newfileList: [],
      fileId: null,
    });
  };
  changePurviewValue = (e) => {
    this.setState({
      purviewValue: e.target.value,
    });
  };
  sendManage = () => {
    this.setState({
      okLoding: true,
    });
    this.props.dispatch({
      type: "home/changePurview",
      payload: {
        examId: this.testId,
        open: this.state.purviewValue ? true : false,
      },
      onSuccess: () => {
        this.setState({
          okLoding: false,
        });
        this.purviewVisible();
      },
    });
  };
  uploadTestOk = () => {
    this.props
      .dispatch({
        type: "home/getUploadFile",
        payload: {
          fileId: this.state.fileId,
          paperId: this.paperId,
        },
      })
      .then(() => {
        this.setState(
          {
            isUploadTest: false,
          },
          () => {
            window.location.reload();
          },
        );
      });
  };
  reloadSource = () => {
    window.close();
    // this.openRevisedDataModal(undefined, false);
  };
  //订正数据modal
  openRevisedDataModal = (examId, visible) => {
    window.open(`${window.location.origin}/exam#/revisedAdd/${this.testId}`);
    // this.setState({
    //   revisedModal: visible,
    // });
  };

  // 打开细目表配置页；招生小测需要彻底屏蔽该入口。
  openTwoWay = () => {
    if (this.props.viewData && this.props.viewData.zhaoShengPaper) {
      return;
    }
    window.open(
      `${window.location.origin}/exam#/twoWayTest/${this.props.viewData.paperId}`,
    );
  };

  handlePaperDetailStatusChange = (paperDetailStatus) => {
    if (this.state.paperDetailStatus !== paperDetailStatus) {
      this.setState({ paperDetailStatus });
    }
  };

  handlePaperDetailSourceChange = (source) => {
    this.setState({
      analysisQuestionCatalog: source
        ? createAnalysisQuestionCatalog(source.draft)
        : null,
      paperEditDisabledReasonCode: source?.updateDisabledReasonCode,
    });
  };

  openPaperDetailRoute = (path) => {
    const url = `${window.location.origin}${window.location.pathname}#${path}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  openPaperTrial = (paperId) => {
    window.open(
      buildTeacherPaperTrialUrl(paperId),
      "_blank",
      "noopener,noreferrer",
    );
  };

  openPaperMatchModal = () => {
    if (!this.props.viewData?.paperId) {
      message.error(
        trans("paper.match.noTargetPaper", "当前考试还没有可用的试卷结构"),
      );
      return;
    }

    this.setState({
      paperMatchModalVisible: true,
    });
  };

  handlePaperMatchApplied = () => {
    this.setState({
      paperMatchModalVisible: false,
    });
    this.props.dispatch({
      type: "home/getTestView",
      payload: {
        examId: this.testId,
      },
    });
  };

  /**
   * 获取当前页面可用的细目表跳转处理器。
   * @returns {Function|undefined} 常规测验返回跳转方法，招生小测返回 undefined 以隐藏入口
   */
  getConfigDataHandler = () => {
    const { viewData } = this.props;
    const isRecruitQuiz = !!(viewData && viewData.zhaoShengPaper);
    return isRecruitQuiz ? undefined : this.openTwoWay;
  };

  synthesisChange = () => {
    closeExam({ examId: this.testId }).then((res) => {
      if (res.status) {
        message.success(trans("global.operateSuccess", "操作成功"));
      } else {
        message.error(res.message);
      }
    });
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

  openAnalysisStudents = () => {
    this.setState({
      isAnalysisStudents: true,
    });
  };

  // ids: 学生id列表，load: start()加载 end()结束
  handleAnalysisStudents = (students, load) => {
    const ids = students.map((student) => student.id);
    load && load.start();
    this.props
      .dispatch({
        type: "home/getFilterStudent",
        payload: {
          examId: this.testId,
          filterStudentIdList: ids,
        },
      })
      .then(() => {
        load && load.end();
        this.setState(
          {
            isAnalysisStudents: false,
          },
          () => {
            window.location.reload();
          },
        );
      });
  };

  render() {
    const { viewData, correction } = this.props;
    const {
      identityJudgementVisible,
      isTitName,
      TitName,
      isSpecify,
      isAbsenceManagement,
    } = this.state;

    // 招生小测详情页需要隐藏部分仅对云谷常规小测开放的入口。
    const isRecruitQuiz = !!(viewData && viewData.zhaoShengPaper);
    const canMatchExamStructure =
      !isRecruitQuiz &&
      !!viewData?.paperId &&
      canUseExamStructureMatch(viewData);
    const configDataHandler = this.getConfigDataHandler();

    let device = window.yg;

    let property = {
      name: "files",
      action: "/api/upload_file",
      showUploadList: false,
      onChange: this.changupload1.bind(this),
      fileList: this.state.newfileList,
    };
    if (!this.state.authority) {
      return (
        <div className={styles.analysis}>
          <div
            id="customeHeader"
            style={{ height: "86px" }}
            className={[
              styles.header,
              this.state.isFull ? styles.disNone : "",
            ].join(" ")}
          >
            {device == "ipad" ? null : (
              <i className={styles.iconfont} onClick={this.back}>
                &#xe6ff;
              </i>
            )}
            {
              <div
                className={styles.headerContent}
                style={device == "ipad" ? { marginLeft: 12 } : {}}
              >
                {viewData ? (
                  <div>
                    <div className={styles.headerTitle1}>
                      {viewData.examName}
                    </div>
                    <div>
                      <span className={styles.detailSpan}>
                        <i className={styles.iconfont}>&#xe624;</i>
                        {viewData.paperTypeName}
                      </span>
                      <span className={styles.detailSpan}>
                        <i className={styles.iconfont}>&#xe634;</i>
                        {trans("global.manfen", "满分 ")}
                        {viewData.totalScore}
                      </span>
                      <span className={styles.detailSpan}>
                        <i className={styles.iconfont}>&#xe798;</i>
                        {viewData.gradeName}-{viewData.subjectName}
                      </span>
                      <span className={styles.detailSpan}>
                        <i className={styles.iconfont}>&#xe61f;</i>
                        {viewData.examDate}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            }
          </div>
          {this.state.authority === null ? (
            <div
              style={{
                width: "100vw",
                height: "80vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Spin tip="Loading..." />
            </div>
          ) : (
            <NoPermission />
          )}
        </div>
      );
    }

    return (
      <Spin spinning={this.state.loading}>
        <div
          className={[styles.analysis, styles["responsive-paper-page"]].join(
            " ",
          )}
        >
          <div
            id="customeHeader"
            className={[
              styles.header,
              styles["responsive-paper-header"],
              this.state.isFull ? styles.disNone : "",
            ].join(" ")}
          >
            {device == "ipad" ? null : (
              <i className={styles.iconfont} onClick={this.back}>
                &#xe6ff;
              </i>
            )}
            <div
              className={[
                styles.headerContent,
                styles["responsive-paper-header-content"],
              ].join(" ")}
              style={device == "ipad" ? { marginLeft: 12 } : {}}
            >
              {viewData && viewData.title ? (
                <div>
                  {isTitName ? (
                    <Input
                      value={TitName}
                      className={[
                        styles.headerTitle,
                        styles["responsive-paper-title"],
                      ].join(" ")}
                      id="headerInput"
                      onChange={(e) =>
                        this.setState({ TitName: e.target.value })
                      }
                      onBlur={(e) =>
                        this.blurTitName(e, viewData.examId, viewData.paperId)
                      }
                    />
                  ) : (
                    <div
                      className={[
                        styles.headerTitle1,
                        styles["responsive-paper-title"],
                      ].join(" ")}
                    >
                      {TitName}
                      {/* canEditName一个布尔值判断当前试卷名称是否支持编辑 */}
                      {viewData.canEditName ? (
                        <i
                          className={[styles.iconfont, styles.editTitle].join(
                            " ",
                          )}
                          style={{
                            color: "#4d7fff",
                            cursor: "pointer",
                            marginLeft: 16,
                          }}
                          onClick={() => this.clickTitName(viewData)}
                        >
                          &#xe7a1;
                        </i>
                      ) : null}

                      <span
                        style={{ color: "#4d7fff", cursor: "pointer" }}
                        className={styles.switchClasses}
                      >
                        {viewData.groupTypeName ? (
                          <>
                            <i
                              className={[styles.iconfont].join(" ")}
                              style={{ fontSize: 12, marginRight: 0 }}
                            >
                              &#xf0ed;
                            </i>
                            {viewData.groupTypeName == "行政班" ? (
                              <span onClick={this.clickAdministrationClass}>
                                {trans(
                                  "global.administrationClass",
                                  "按行政班查看",
                                )}
                              </span>
                            ) : (
                              <span onClick={this.clickAdministrationClass}>
                                {trans("global.layeredClass", "按分层班查看")}
                              </span>
                            )}
                          </>
                        ) : null}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className={styles.detailSpan}>
                      <i className={styles.iconfont}>&#xe624;</i>
                      {viewData.paperTypeName}
                    </span>
                    <span className={styles.detailSpan}>
                      <i className={styles.iconfont}>&#xe634;</i>
                      {trans("global.manfen", "满分 ")}
                      {viewData.totalScore}
                    </span>
                    <span className={styles.detailSpan}>
                      <i className={styles.iconfont}>&#xe798;</i>
                      {viewData.gradeName}-{viewData.subjectName}
                    </span>
                    <span className={styles.detailSpan}>
                      <i className={styles.iconfont}>&#xe61f;</i>
                      {viewData.examDate}
                    </span>
                  </div>
                </div>
              ) : null}

              {isRecruitQuiz ? null : (
                <div
                  className={[
                    styles.testOperation,
                    styles["responsive-paper-actions"],
                  ].join(" ")}
                >
                  <PaperDetailEditAction
                    className={styles.downloadTestPaper}
                    editDisabledReasonCode={
                      this.state.paperEditDisabledReasonCode
                    }
                    onOpenPath={this.openPaperDetailRoute}
                    paperId={this.paperId}
                    status={this.state.paperDetailStatus}
                  />

                  {viewData && viewData.examSourceType == 3 ? ( //11月3号下午家伦跑过来说让放开
                    <span
                      className={styles.downloadTestPaper}
                      onClick={() => {
                        this.synthesisChange();
                      }}
                    >
                      {trans("global.Consolidation", "统一合成")}
                    </span>
                  ) : null}

                  {viewData.master && viewData.subjectMaser ? (
                    <span
                      className={styles.downloadTestPaper}
                      onClick={this.purviewVisible}
                    >
                      {trans("global.access", "权限管理")}
                    </span>
                  ) : null}

                  {viewData.examSourceType == 0 ? null : (
                    <span
                      className={styles.downloadTestPaper}
                      onClick={this.clickAbsenceManagement}
                    >
                      {trans("global.absenceTracking", "缺考管理")}
                    </span>
                  )}

                  {viewData.examSourceType != 0 &&
                  this.state["exam:examAnalysis:specifyAnalysis"] ? (
                    <span
                      className={styles.downloadTestPaper}
                      onClick={this.openAnalysisStudents}
                    >
                      {trans("global.specifyAnalysis", "指定分析")}
                    </span>
                  ) : null}

                  <StudentAnalysisSelectorDialog
                    dispatch={this.props.dispatch}
                    isOpen={this.state.isAnalysisStudents}
                    examId={this.testId}
                    onClose={() => this.setState({ isAnalysisStudents: false })}
                    onConfirm={this.handleAnalysisStudents}
                  />

                  {viewData.previewUrl ? (
                    <span
                      className={styles.downloadTestPaper}
                      onClick={this.uplodaTestPaper}
                    >
                      {trans("global.uploadAgain", "重新上传")}
                    </span>
                  ) : null}

                  {
                    <span
                      className={styles.downloadTestPaper}
                      onClick={this.clickTestSettings}
                    >
                      {trans("global.editTest", "编辑测验")}
                    </span>
                  }

                  <Popover
                    content={
                      <div>
                        {viewData.canCorrection
                          ? `${trans("global.correctionDeadline", "该测验订正分数截止日期为")} ${viewData.approvalStopTime || "--"}`
                          : trans(
                              "global.correctionWindowExpired",
                              "该试卷订正分数窗口期已过，无法再发起订正",
                            )}
                      </div>
                    }
                  >
                    {
                      <span
                        className={styles.downloadTestPaper}
                        onClick={() => {
                          if (viewData.canCorrection) {
                            this.openRevisedDataModal(undefined, true);
                          }
                        }}
                      >
                        {trans("revise.revisedData", "订正数据")}
                      </span>
                    }
                  </Popover>

                  {isRecruitQuiz ? null : (
                    <span
                      className={styles.downloadTestPaper}
                      onClick={this.openTwoWay}
                    >
                      {trans("global.setXimu", "设置细目表")}
                    </span>
                  )}

                  {canMatchExamStructure ? (
                    <span
                      className={styles.downloadTestPaper}
                      onClick={this.openPaperMatchModal}
                    >
                      {trans("paper.match.selectPaperMatch", "选择试卷匹配")}
                    </span>
                  ) : null}

                  <span
                    className={styles.downloadTestPaper}
                    onClick={() =>
                      this.clickDownloadTestPaper(
                        viewData.paperId,
                        viewData.uploadFileExist,
                        viewData.isEdit,
                        viewData.moduleList,
                      )
                    }
                  >
                    {trans("global.downloadTestPaper3", "下载试卷")}
                  </span>

                  {viewData.examSourceType == 0 ? (
                    <>
                      {viewData.pushNum ? (
                        <span
                          className={styles.downloadTestPaper}
                          onClick={() => this.clickRelease(viewData.paperId)}
                        >
                          {trans("global.pushStudents", "推送学生")}
                        </span>
                      ) : (
                        <span
                          className={styles.downloadTestPaper}
                          onClick={() => this.clickRelease(viewData.paperId)}
                        >
                          {trans("global.goPushToStu1", "继续推送")}
                        </span>
                      )}
                    </>
                  ) : null}

                  <FileUploadModal
                    defaultFile={{
                      id: viewData.paperFileId,
                      name: viewData.paperFileName,
                    }}
                    paperId={viewData.paperId}
                    onOk={this.confirmFileChange}
                    customButton={
                      <span
                        className={styles.downloadTestPaper}
                        style={{
                          color: viewData.paperFileId
                            ? "rgba(1, 17, 61, 0.65)"
                            : "rgba(1, 17, 61, 0.45)",
                        }}
                      >
                        {trans("global.OriginalQuestionnaire", "原始问卷")}
                      </span>
                    }
                  />

                  <ComnModal
                    options={{
                      title: trans("global.access", "权限管理"),
                      visible: this.state.purviewVisible,
                      onOk: this.sendManage,
                      centered: true,
                      onCancel: this.purviewVisible,
                      okButtonProps: {
                        loading: this.state.okLoding,
                      },
                    }}
                    innerContent={
                      <>
                        <Radio.Group
                          name="radiogroup"
                          value={this.state.purviewValue}
                          onChange={this.changePurviewValue}
                        >
                          <Radio value={0}>
                            {trans(
                              "global.teacherNoPurview",
                              "授课老师只可查看自己授课班级的数据",
                            )}
                          </Radio>
                          <Radio value={1}>
                            {trans(
                              "global.teacherPurview",
                              "授课老师可以查看全部班级的数据",
                            )}
                          </Radio>
                        </Radio.Group>
                      </>
                    }
                  />
                </div>
              )}
            </div>

            {this.hideTab ? null : (
              <div
                className={[
                  styles.tabBar,
                  styles["responsive-paper-tabs"],
                ].join(" ")}
              >
                <span
                  onClick={this.view.bind(this, 1)}
                  className={this.state.active === 1 ? styles.activeBar : null}
                >
                  {trans("detail.viewTitle", "测验预览")}
                </span>

                {viewData &&
                viewData.type !== 10 &&
                this.state.LoadExamResult &&
                !isRecruitQuiz ? (
                  <span
                    onClick={this.view.bind(this, 2)}
                    className={
                      this.state.active === 2 ? styles.activeBar : null
                    }
                  >
                    {trans("global.classAnalysis", "班级分析")}
                  </span>
                ) : null}

                {viewData &&
                viewData.type !== 10 &&
                this.state.LoadExamResult &&
                !isRecruitQuiz ? (
                  <span
                    onClick={this.view.bind(this, 3)}
                    className={
                      this.state.active === 3 ? styles.activeBar : null
                    }
                  >
                    {trans("global.questionAnalysis", "试题分析")}
                  </span>
                ) : null}

                {this.state.LoadExamResult && !isRecruitQuiz ? (
                  <span
                    onClick={this.view.bind(this, 11)}
                    className={
                      this.state.active === 11 ? styles.activeBar : null
                    }
                  >
                    {trans("global.itemAnalysis", "逐题分析")}
                  </span>
                ) : null}

                {viewData &&
                viewData.type !== 10 &&
                this.state.LoadExamResult ? (
                  <span
                    onClick={this.view.bind(this, 4)}
                    className={
                      this.state.active === 4 ? styles.activeBar : null
                    }
                  >
                    {trans("global.studentAnalysis", "学生分析")}
                  </span>
                ) : null}

                {viewData &&
                viewData.type !== 10 &&
                viewData.sourceType === 0 &&
                this.state.LoadExamResult &&
                !isRecruitQuiz ? (
                  <span
                    onClick={this.view.bind(this, 6)}
                    className={
                      this.state.active === 6 ? styles.activeBar : null
                    }
                  >
                    {trans("global.viewRealTimeData", "实时数据")}
                  </span>
                ) : null}

                {viewData.examSourceType != 0 && this.state.LoadExamResult ? (
                  <span
                    onClick={this.view.bind(this, 5)}
                    className={
                      this.state.active === 5 ? styles.activeBar : null
                    }
                  >
                    {trans("global.stuGruop", "学生分组探索")}
                  </span>
                ) : null}

                {viewData.examSourceType != 0 && this.state.LoadExamResult ? (
                  <span
                    onClick={this.view.bind(this, 7)}
                    className={
                      this.state.active === 7 ? styles.activeBar : null
                    }
                  >
                    {trans("global.diyAnalysis", "自定义分析")}
                  </span>
                ) : null}

                {viewData &&
                viewData.type == 10 &&
                this.state.LoadExamResult ? (
                  <span
                    onClick={this.view.bind(this, 8)}
                    className={
                      this.state.active === 8 ? styles.activeBar : null
                    }
                  >
                    {trans("global.diyWork", "个性化作业")}
                  </span>
                ) : null}

                {identityJudgementVisible &&
                viewData.master &&
                this.state.LoadExamResult ? (
                  <span
                    onClick={this.view.bind(this, 9)}
                    className={
                      this.state.active === 9 ? styles.activeBar : null
                    }
                  >
                    {trans("global.analysisReport", "质量分析报告")}
                  </span>
                ) : null}
                {this.state.permission?.gradeStudySituation &&
                !isRecruitQuiz ? (
                  <span
                    onClick={this.view.bind(this, 15)}
                    className={
                      this.state.active === 15 ? styles.activeBar : null
                    }
                  >
                    {trans("global.gradeReport", "年级学情报告")}
                  </span>
                ) : null}
                {this.state.permission?.groupStudySituation &&
                !isRecruitQuiz ? (
                  <span
                    onClick={this.view.bind(this, 14)}
                    className={
                      this.state.active === 14 ? styles.activeBar : null
                    }
                  >
                    {trans("global.classReport", "班级学情报告")}
                  </span>
                ) : null}
                {viewData &&
                viewData.sourceType == 1 &&
                viewData.master &&
                this.state.LoadExamResult ? (
                  <span
                    onClick={this.view.bind(this, 10)}
                    className={
                      this.state.active === 10 ? styles.activeBar : null
                    }
                  >
                    {trans("global.pupllAnalyse", "学生学情分析")}
                  </span>
                ) : null}
                {viewData.sourceType == 3 ? (
                  <span
                    onClick={this.view.bind(this, 12)}
                    className={
                      this.state.active === 12 ? styles.activeBar : null
                    }
                  >
                    {trans(
                      "dataAnalysis.dotMatrixPenOverview",
                      "点阵笔实时概况",
                    )}
                  </span>
                ) : null}
                {/* {
                  this.props?.currentUser?.classEvaluationIsPower ? <span
                    onClick={this.view.bind(this, 13)}
                    className={
                      this.state.active === 13 ? styles.activeBar : null
                    }
                  >
                    {trans("global.lectureFeedback", "课堂讲评")}
                  </span> : null
                } */}
              </div>
            )}
          </div>
          {viewData?.title ? (
            <DataAnalysisPaperDetail
              onSourceChange={this.handlePaperDetailSourceChange}
              onStatusChange={this.handlePaperDetailStatusChange}
              onTrial={this.openPaperTrial}
              paperId={this.paperId}
              visible={this.state.active === 1}
            />
          ) : null}
          {this.state.active === 1 ? null : viewData && this.aaa(viewData)}

          {isAbsenceManagement ? (
            <StudentAbsent
              // groupList={[]} //学生列表
              visible={isAbsenceManagement} // 开关
              title={trans("global.absenceTracking", "缺考管理")}
              modalVisible={this.absenceCancel} //关闭方法
              disabledStu={[]} //禁用学生
              publishText={trans("global.confirmAdd", "确认添加")} //发布
              sureStu={this.absenceOk} //发布完后的内容
              // search={this.searchStuName} //搜索
              onRef={this.onRefAbsen} //
              ifDeadLine={true}
              dispatch={this.props.dispatch}
              examId={this.testId}
            />
          ) : null}
          <Modal
            title={trans("global.uploadTest", "上传试题卷")}
            // visible={true}
            visible={this.state.isUploadTest}
            onOk={this.uploadTestOk}
            onCancel={this.uploadTestCancel}
            className={styles.uploadTestModel}
            getContainer={false}
            width={651}
            destroyOnClose={true}
            centered={true}
          >
            <div className={styles.uploadTestBox}>
              <div className={styles.uploadBox}>
                <span className={styles.pleaseUpload}>
                  {trans("global.pleaseUpload", "请上传Word格式的试题卷")}
                </span>
                <Upload {...property}>
                  <span className={styles.uploadFiles}>
                    {trans("global.uploadFiles", "上传文件")}
                  </span>
                </Upload>
              </div>
              {this.state.newfileList.length > 0 ? (
                <div className={styles.fileBox}>
                  <span className={styles.fileName}>
                    {this.state.newfileList[0].name}
                    <i
                      className={[styles.iconfont, styles.closeIcon].join(" ")}
                      onClick={this.deleteIcon}
                    >
                      &#xe6ca;
                    </i>
                  </span>
                </div>
              ) : null}
            </div>
          </Modal>
          {this.state.modalImportTestPaperOptions.visible ? (
            <ModalImportTestPaper
              modalImportTestPaperProps={{
                options: this.state.modalImportTestPaperOptions,
                ...this.state.modalImportTestPaperProps,
                subjectId: this.props.viewData.subjectId,
                gradeId: this.props.viewData.gradeId,
              }}
            />
          ) : null}
          {this.state.machineTestoptions.visible ? (
            <ModalMachineTest
              modalMachineTestProps={{
                options: this.state.machineTestoptions,
                ...this.state.modalMachineTestProps,
              }}
            />
          ) : null}
          {this.state.modalOnlineTestOptions.visible ? (
            <ModalOnlineTest
              modalOnlineTestProps={{
                options: this.state.modalOnlineTestOptions,
                dispatch: this.props.dispatch,
                ...this.state.modalOnlineTestProps,
              }}
            />
          ) : null}

          {/* {this.state.revisedModal && (
            <RevisedModal
              testId={this.testId}
              openRevisedDataModal={this.openRevisedDataModal}
              dispatch={this.props.dispatch}
              reloadSource={this.reloadSource}
              source="question"
            />
          )} */}
          {this.state.rateModalVisible ? (
            <SettingRate
              visible={this.state.rateModalVisible}
              rateModalStatus={this.changeRateModalVisible}
              testId={this.testId}
              paperId={this.paperId}
            />
          ) : null}
          {this.state.paperMatchModalVisible ? (
            <PaperSelectionMatchModal
              visible={this.state.paperMatchModalVisible}
              targetPaperId={this.props.viewData?.paperId}
              targetRecord={this.props.viewData}
              modalTitle={trans(
                "paper.match.selectModalTitle",
                "选择试卷并匹配到当前考试",
              )}
              targetSummaryTitle={trans(
                "paper.match.currentExamPaper",
                "当前考试试卷",
              )}
              sourceSummaryTitle={trans(
                "paper.match.sourcePaper",
                "待匹配试卷",
              )}
              tableTargetTitle={trans(
                "paper.match.currentExamTargetQuestion",
                "当前考试目标题",
              )}
              returnButtonText={trans(
                "paper.match.goTwoWayAdjust",
                "去细目表调整",
              )}
              onCancel={() => {
                this.setState({
                  paperMatchModalVisible: false,
                });
              }}
              onApplied={this.handlePaperMatchApplied}
            />
          ) : null}
        </div>
      </Spin>
    );
  }
  //设置三率
  settingRate = () => {
    this.setState({
      rateModalVisible: true,
    });
  };
  //改变modal状态
  changeRateModalVisible = () => {
    this.setState({
      rateModalVisible: false,
    });
    this.props.dispatch({
      type: "home/getgroupScore",
      payload: {
        examId: this.testId,
        filterFlag: this.state.courseDetailSpecify,
      },
    });
  };
  // 班级分析
  onRefMulti = (index, reference) => {
    this.multiClassRef[index] = reference;
  };
  leaderSummaryText = (string_) => {
    this.setState({
      leaderSummaryAnalysis: string_,
    });
  };
  chiefText = (string_) => {
    this.setState({
      chiefAnalysis: string_,
    });
  };
  propositionalText = (string_) => {
    console.log(string_, "ss");
    this.setState({
      propositionalAnalysis: string_,
    });
  };
  fencengText = (string_) => {
    console.log(string_, "ss");
    this.setState({
      fencengAnalysis: string_,
    });
  };
  xingzhengText = (string_) => {
    console.log(string_, "ss");
    this.setState({
      xingzhengAnalysis: string_,
    });
  };
  // 得分率取消
  scoreCancle = () => {
    this.setState({
      editScoreRate: false,
    });
  };

  //点击得分率保存
  clickScoreSave = () => {
    this.scoreSave(false);
    setTimeout(() => {
      this.releaseLock();
    }, 500);
    this.clearTimer();
    this.setState({
      editScoreRate: false,
    });
  };

  // 得分率保存
  scoreSave = (isAutoSave = true) => {
    this.props
      .dispatch({
        type: "home/postEditReport",
        payload: {
          examId: this.testId,
          modelKey: 2, //1：命题分析 4：备课组长总结 2: 得分率分析 3: 班级分析
          scoreContentList: this.state.scoringList,
          isAutoSave,
          uuId: this.state.uuId,
        },
      })
      .then(() => {
        console.log(this.props.editReport.content.code, "333");
        if (this.props.editReport.content.code == 3) {
          this.setState({
            reloadModalVisible: true,
          });
        }

        // this.releaseLock();
        // this.setState({
        //   editScoreRate: false,
        // });
      });
  };
  // 得分率删除
  scoringDel = (index) => {
    let array = JSON.parse(JSON.stringify(this.state.scoringList));
    if (array.length > 3) {
      let newArray = array.filter((item) => item.index !== index);
      this.setState({
        scoringList: newArray,
      });
    }
  };

  // 水印
  getWaterMark = (user) => {
    const text = `${user.identityShowName}`;
    // const text = 'YG-00026-李长宸 Jack';
    const utf8Bytes = new TextEncoder().encode(text);
    let text2base64 = btoa(String.fromCharCode(...utf8Bytes));
    text2base64 = text2base64.replaceAll("+", "-");
    text2base64 = text2base64.replaceAll("/", "_");
    text2base64 = text2base64.replace(/=$/, "");

    let base64 = text2base64;
    const _type = "ZmFuZ3poZW5naGVpdGk";
    const _size = 14;
    const _color = "cccccc";
    const url = `https://yungu-public.oss-cn-hangzhou.aliyuncs.com/E512D262-0E21-4091-887E-97146D89F601.png?x-oss-process=image/watermark,type_${_type},size_${_size},text_${base64},rotate_340,color_${_color},t_60,g_west,x_10`;
    return {
      backgroundImage: `url(${url})`,
    };
  };

  //上传
  changupload = (info) => {
    let file = info.file;
    let newList = JSON.parse(JSON.stringify(this.state.newList));
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      newList.push(file.response.content[0]);
      this.setState(
        {
          newList,
        },
        () => {
          this.props.dispatch({
            type: "home/PostBindUploadedFile",
            payload: {
              examId: this.testId,
              fileIdList: [file.response.content[0].fileId],
            },
          });
        },
      );
    }
  };

  lookDetail = (status, item) => {
    console.log(item, "111");
    this.setState({
      previewVisible: status || false,
      previewInfo: item || null,
    });
  };

  // 删除上传
  deleteFile = (id) => {
    let uploadFileList = JSON.parse(JSON.stringify(this.state.newList));
    for (let index = 0; index < uploadFileList.length; index++) {
      if (uploadFileList[index].fileId == id) {
        uploadFileList.splice(index, 1);
        break;
      }
    }
    this.setState(
      {
        newList: uploadFileList,
      },
      () => {
        this.props.dispatch({
          type: "home/PostDeleteUploadedFile",
          payload: {
            examId: this.testId,
            fileIdList: [id],
          },
        });
      },
    );
  };

  reloadModalVisibleEditText = () => {
    this.setState({
      reloadModalVisibleEdit: true,
    });
  };

  submitCancel = () => {
    this.setState({
      subEdit: false,
    });
  };

  submitCancel1 = () => {
    this.setState({
      noSummary: false,
    });
  };

  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        courseDetailSpecify: checked,
      },
      () => {
        this.props
          .dispatch({
            type: "home/getgroupScore",
            payload: {
              examId: this.testId,
              filterFlag: this.state.courseDetailSpecify,
            },
          })
          .then(() => {
            if (this.state.check == 2) {
              this.renderClassChart();
            }
          });
      },
    );
  };

  courseDetailSpecifyChange1 = (checked) => {
    this.setState(
      {
        courseDetailSpecify1: checked,
      },
      () => {
        this.getClass1();
      },
    );
  };

  clickEditSegment = (status) => {
    console.log(status);
    getScoreDistinguishPlan({
      examId: this.testId,
      schoolLevel: status == true ? true : false,
    }).then((res) => {
      if (res.status) {
        const { scoreSectionModelList } = res.content;
        let temporaryList = scoreSectionModelList.map(
          (item) => item.endScore - item.startScore,
        );
        this.setState({
          numPhaseList: temporaryList,
          numPhase: temporaryList.length,
        });
      } else {
        message.error(res.message);
      }
    });
    this.setState({
      adjusting: true,
    });
  };
  handleCancel = () => {
    this.setState({
      adjusting: false,
    });
  };

  handleOk = (status) => {
    const { numPhaseList, numPhase } = this.state;
    let array = [];
    if (this.state.selectMethod == 1) {
      this.state.numPhaseList.length > 0 &&
        this.state.numPhaseList.map((item, index) => {
          if (index == 0) {
            array.push({
              startScore: 0,
              endScore: item,
            });
          } else {
            array.push({
              startScore: numPhaseList[index - 1],
              endScore: item,
            });
          }
        });
    } else {
      if (this.sum(numPhaseList) == 100) {
        this.state.numPhaseList.length > 0 &&
          this.state.numPhaseList.map((item, index) => {
            if (index == 0) {
              array.push({
                startScore: 0,
                endScore: item,
              });
            } else if (index == numPhase) {
              array.push({
                startScore: 100 - item,
                endScore: 100,
              });
            } else {
              let sum = 0;
              for (let index_ = index - 1; index_ >= 0; index_--) {
                sum += Number(numPhaseList[index_]);
              }
              array.push({
                startScore: sum,
                endScore: sum + Number(numPhaseList[index]),
              });
            }
          });
      }
    }
    if (array.length > 0) {
      console.log(array);
      this.props
        .dispatch({
          type: "home/postScoreSectionPlan",
          payload: {
            examId: this.testId,
            fraction: this.state.selectMethod,
            // examPaperId: this.paperId,
            distinguish: 1,
            scoreSectionModelList: array,
            schoolLevel: status == true ? true : false,
          },
        })
        .then(() => {
          this.setState(
            {
              selectMethod: 0,
              numPhaseList: ["", "", ""],
              corresponding: ["", "", ""],
              adjusting: false,
            },
            () => {
              this.props.dispatch({
                type: "home/getgroupScore",
                payload: {
                  examId: this.testId,
                  filterFlag: this.state.courseDetailSpecify,
                },
              });
            },
          );
        });
    }
  };

  clickReduce = () => {
    if (this.state.numPhase > 3) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      let newArray = JSON.parse(JSON.stringify(this.state.corresponding));
      array.splice(-2, 1);
      newArray.splice(-2, 1);
      this.setState({
        numPhase: this.state.numPhase - 1,
        numPhaseList: array,
        corresponding: newArray,
      });
    }
  };

  changeAfter = (value) => {
    if (typeof value == "number" && value > 0) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(0, 1, value);
      this.setState({
        numPhaseList: array,
      });
      if (this.judgeNumber(array)) {
        let sum = eval(array.join("+"));
      }
    }
  };

  blurAfter = (value) => {
    let newArray = JSON.parse(JSON.stringify(this.state.corresponding));
    this.props
      .dispatch({
        type: "home/postCalPercentOrFraction",
        payload: {
          examId: this.testId,
          fraction: this.state.selectMethod,
          scoreSectionModel: {
            startScore: 0,
            endScore: value.target.value,
          },
        },
      })
      .then(() => {
        newArray.splice(0, 1, this.props.calPercentOrFraction);
        this.setState({
          corresponding: newArray,
        });
      });
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

  chengeMiddle = (index, value) => {
    if (typeof value == "number" && value > 0) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(index, 1, value);
      this.setState({
        numPhaseList: array,
      });
    }
  };

  blurMiddle = (index, value) => {
    let newArray = JSON.parse(JSON.stringify(this.state.corresponding));
    let { numPhaseList, numPhase, selectMethod } = this.state;
    let startScore = 0;
    let endScore = 0;
    if (numPhase == 3) {
      startScore = Number(numPhaseList[0]);
      endScore = Number(numPhaseList[0]) + Number(value.target.value);
    } else {
      let sum = 0;
      for (let index_ = index - 1; index_ >= 0; index_--) {
        sum += Number(numPhaseList[index_]);
      }
      startScore = sum;
      endScore = sum + Number(value.target.value);
    }
    this.props
      .dispatch({
        type: "home/postCalPercentOrFraction",
        payload: {
          examId: this.testId,
          fraction: this.state.selectMethod,
          scoreSectionModel: {
            startScore:
              selectMethod == 0 ? startScore : numPhaseList[index - 1],
            endScore: selectMethod == 0 ? endScore : value.target.value,
          },
        },
      })
      .then(() => {
        newArray.splice(index, 1, this.props.calPercentOrFraction);
        this.setState({
          corresponding: newArray,
        });
      });
  };

  getMiddle = (index) => {
    let { numPhaseList, numPhase } = this.state;
    if (numPhase == 3) {
      return (
        <span>{`(${numPhaseList[index - 1]}%~${
          Number(numPhaseList[index - 1]) + Number(numPhaseList[index])
        }%]`}</span>
      );
    } else {
      let sum = 0;
      for (let index_ = index - 1; index_ >= 0; index_--) {
        sum += Number(numPhaseList[index_]);
      }
      return <span>{`(${sum}%~${sum + Number(numPhaseList[index])}%]`}</span>;
    }
  };

  changeFront = (value) => {
    if (typeof value == "number" && value > 0) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(-1, 1, value);
      this.setState({
        numPhaseList: array,
      });
    }
  };

  blurFront = (value) => {
    let newArray = JSON.parse(JSON.stringify(this.state.corresponding));
    const { corresponding, numPhase, numPhaseList, selectMethod } = this.state;
    this.props
      .dispatch({
        type: "home/postCalPercentOrFraction",
        payload: {
          examId: this.testId,
          fraction: this.state.selectMethod,
          scoreSectionModel: {
            startScore:
              selectMethod == 0
                ? 100 - value.target.value
                : numPhaseList[numPhase - 2],
            endScore: selectMethod == 0 ? 100 : value.target.value,
          },
        },
      })
      .then(() => {
        newArray.splice(-1, 1, this.props.calPercentOrFraction);
        this.setState({
          corresponding: newArray,
        });
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

  clickAddd = () => {
    let newArray = [""];
    let array = [""];
    this.state.numPhaseList.map((item) => {
      newArray = [...newArray, ""];
    });
    this.state.corresponding.map((item) => {
      array = [...array, ""];
    });
    this.setState({
      numPhase: this.state.numPhase + 1,
      numPhaseList: newArray,
      corresponding: array,
    });
  };

  changeSelectMethod = (e) => {
    this.setState({
      selectMethod: e.target.value,
      numPhaseList: ["", "", ""],
      corresponding: ["", "", ""],
      numPhase: 3,
    });
  };

  uplodaTestPaper = () => {
    const { modalImportTestPaperProps, modalImportTestPaperOptions } =
      this.state;
    this.setState({
      modalImportTestPaperProps: {
        ...modalImportTestPaperProps,
      },
      modalImportTestPaperOptions: {
        ...modalImportTestPaperOptions,
        visible: true,
      },
    });
  };
  handelSort = (e) => {
    this.props
      .dispatch({
        type: "home/clearGroupScore",
      })
      .then(() => {
        this.props
          .dispatch({
            type: "home/getgroupScore",
            payload: {
              examId: this.testId,
              filterFlag: this.state.courseDetailSpecify,
              sortType: e.key,
            },
          })
          .then((res) => {
            if (this.state.check == 2) {
              this.renderClassChart();
            } else if (this.state.check == 5) {
              this.renderLineChart();
            }
          });
      });
    this.setState({
      sortType: [e.key],
    });
  };

  hasVisibleTeacherName = (checked) => {
    this.setState(
      {
        teacherNameVisible: checked,
      },
      () => {
        if (this.state.check == 2) {
          this.renderClassChart();
        } else if (this.state.check == 5) {
          this.renderLineChart();
        } else if (this.state.check == 3) {
          this.renderTripleComparison();
        } else if (this.state.check == 4) {
          this.renderComparisonRates();
        } else if (this.state.check == "boxPlot") {
          this.renderBoxPlot();
        }
      },
    );
  };

  fullscreenChange = (value) => {
    this.setState({
      fullscreen: value,
    });
  };

  fileChange = (files, index) => {
    let cloneMultiClassList = JSON.parse(
      JSON.stringify(this.state.multiClassList),
    );
    cloneMultiClassList[index].fileList = files;
    this.setState({
      multiClassList: cloneMultiClassList,
    });
  };

  aaa = (dataAnalysis) => {
    const {
      groupScoreList: dataSource,
      tableClass,
      individuationTest,
      questionItem,
      classListData,
      currentUser,
      reportPresentationList,
      viewData,
      userByNameList,
      specialList,
      groupScoreList,
    } = this.props;
    const {
      submitChange,
      multiClassList,
      editScoreRate,
      newList,
      previewVisible,
      previewInfo,
      authenticationModel,
      updatedChange,
      loading1,
      numPhaseList,
      numPhase,
      selectMethod,
      sortType,
      teacherNameVisible,
    } = this.state;
    const configDataHandler = this.getConfigDataHandler();
    let property = {
      name: "files",
      action: "/api/upload_file",
      showUploadList: false,
      onChange: this.changupload.bind(this),
    };
    let newElevatorList2 = this.props.viewData.type
      ? this.props.viewData.type === 13
        ? [
            { name: trans("global.stuScore", "学生得分"), id: 0 },
            { name: trans("global.progressAnalysis", "进退步分析"), id: 9 },
            { name: trans("data.questionDetail", "小题得分分析"), id: 1 },
            // { name: trans("data.scoreRateSegmentation", "得分率分段对比") },
          ]
        : [
            { name: trans("global.stuScore", "学生得分"), id: 0 },
            { name: trans("global.progressAnalysis", "进退步分析"), id: 9 },
            { name: trans("data.questionDetail", "小题得分分析"), id: 1 },
            { name: trans("data.partDetail", "大题得分分析"), id: 2 },
            // { name: trans("data.scoreRateSegmentation", "得分率分段对比") },
          ]
      : [];
    const content1 = this.state.analysisQuestionCatalog ? (
      <AnalysisQuestionPreview
        catalog={this.state.analysisQuestionCatalog}
        mode="question"
        questionId={questionItem.questionId}
        showAnswer
      />
    ) : null;

    let newData = [];
    individuationTest.individuationTestsData &&
      individuationTest.individuationTestsData.length &&
      individuationTest.individuationTestsData.map((item, index) => {
        // console.log(item, "sss");
        let newObject = {
          topic: item.topic,
          score: item.score,
          difficulty: item.difficulty,
          questionId: item.questionId,
          titleNum: index + 1,
        };
        item.studentModels &&
          item.studentModels.length &&
          item.studentModels.map((it) => {
            newObject[it.studentId] = it.isIndividuationTest;
            // newObj[it.studentName] = it.studentName;
          });
        newData.push(newObject);
      });
    console.log(newData, "dada1");
    let newColumns = [
      {
        width: 70,
        title: trans("global.order", "题号"),
        dataIndex: "questionId",
        key: "questionId",
        fixed: "left",
        render: (text, record, index) => {
          // console.log(text, record, index, "333");
          return (
            <Popover
              content={content1}
              trigger="click"
              placement="right"
              overlayStyle={{ maxWidth: "600px" }}
            >
              <span
                onClick={() => this.testClick(record.questionId)}
                style={{ cursor: "pointer" }}
                className={styles.questionIndex}
              >
                {record.titleNum}
              </span>
            </Popover>
          );
        },
      },
      {
        width: 100,
        title: trans("global.questionType", "题型"),
        dataIndex: "topic",
        key: "topic",
        fixed: "left",
      },
      {
        width: 100,
        title: trans("analysis.questionScore", "分值"),
        dataIndex: "score",
        key: "score",
        fixed: "left",
      },
      {
        width: 100,
        title: trans("analysis.hardValue", "难度"),
        dataIndex: "difficulty",
        key: "difficulty",
        fixed: "left",
      },
    ];
    individuationTest.columnSet &&
      individuationTest.columnSet.length &&
      individuationTest.columnSet.map((item, index) => {
        if (item.index < 3) return;
        newColumns.push({
          width: 100,
          title: () => (
            <sapn
              className={styles.nameClick}
              onClick={() => this.clickName(item)}
            >
              {item.columnName}
            </sapn>
          ),
          dataIndex: item.studentId,
          key: item.studentId,
          render: (text, record, index) => {
            return (
              <span>
                {text ? (
                  <i className={styles.iconfont} style={{ color: "#1afa29" }}>
                    &#xe816;
                  </i>
                ) : (
                  // <i className={styles.iconfont}>&#xe815;</i>
                  <span className={styles.error}></span>
                )}
              </span>
            );
          },
        });
      });
    const columns1 = newColumns;
    const data1 = newData;
    let newArrayDataSource = [];
    let columns = [
      {
        title: trans("global.className", "班级名称"),
        dataIndex: "gradeAndGroupName",
        key: "gradeAndGroupName",
        width: 120,
        fixed: "left",
        render: (text, record) => {
          return (
            <>
              {text}
              {record.courseTeacherNames && teacherNameVisible ? (
                <>
                  {record.courseTeacherNames.length > 0 &&
                    record.courseTeacherNames.map((item) => (
                      <div className={styles.teachersName}>{item}</div>
                    ))}
                </>
              ) : null}
            </>
          );
        },
      },
      {
        title: trans("global.avgScore", "平均分"),
        dataIndex: "avgScore",
        key: "avgScore",
        width: 70,
        render: (text, record, index) => {
          return (
            <div
              className={
                comparePercentages(text, newArrayDataSource[0]?.avgScore) == -1
                  ? styles.noPass
                  : ""
              }
            >
              {text}
            </div>
          );
        },
      },
      {
        title: `${trans("global.avgScoreRate", "平均得分率")}`,
        dataIndex: "avgScoreRatio",
        key: "avgScoreRatio",
        width: 90,
      },
      {
        title: trans("global.maxScore", "最高分"),
        dataIndex: "maxScore",
        key: "maxScore",
        width: 80,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              <Popover
                content={content}
                title={null}
                overlayClassName="stuPopover"
                trigger="click"
              >
                <i
                  className={[icon.iconfont, styles.clickIcon].join(" ")}
                  onClick={this.renderNumContent.bind(
                    this,
                    record.maxScoreStudentIds,
                  )}
                >
                  &#xe74e;
                </i>
              </Popover>
            </div>
          );
        },
      },
      {
        title: trans("global.minScore", "最低分"),
        dataIndex: "minScore",
        key: "minScore",
        width: 70,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              <Popover
                content={content}
                title={null}
                overlayClassName="stuPopover"
                trigger="click"
              >
                <i
                  className={[icon.iconfont, styles.clickIcon].join(" ")}
                  onClick={this.renderNumContent.bind(
                    this,
                    record.minScoreStudentIds,
                  )}
                >
                  &#xe74e;
                </i>
              </Popover>
            </div>
          );
        },
      },
      {
        title: trans("global.medianScore", "中位分"),
        dataIndex: "medianScore",
        key: "avgmedianScoreScore",
        width: 70,
      },
      {
        title: trans("global.standardDeviation", "标准差"),
        dataIndex: "scoreStddev",
        key: "scoreStddev",
        width: 70,
      },
    ];
    let passRate = [];

    dataSource?.length &&
      dataSource[0]?.examAnalyseGroupRateNames?.length &&
      dataSource[0].examAnalyseGroupRateNames.map((item, index) => {
        let column = {
          title: `${item.name}`,
          dataIndex: "examAnalyseGroupRateNames",
          key: `${item.id}`,
          width: 80,
          render: (text, record) => {
            let matchArray = record.examAnalyseGroupRates.filter(
              (item1) => item1.id == item.id,
            );
            return (
              <span>
                {matchArray && matchArray.length > 0 && matchArray.length > 0
                  ? matchArray[0].groupRate
                  : null}
              </span>
            );
          },
        };
        passRate.push(column);
      });
    columns.push(...passRate);
    let fencengCol = [
      {
        title: trans("global.className", "班级名称"),
        dataIndex: "gradeAndGroupName",
        key: "gradeAndGroupName",
        width: 120,
        render: (text, record) => {
          console.log(text, record, "ppp");
          return (
            <div>
              {text}
              {record.courseTeacherNames ? (
                <div>
                  {record.courseTeacherNames.length > 0 &&
                    record.courseTeacherNames.map((item) => (
                      <span className={styles.teachersName}>{item}</span>
                    ))}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        title: trans("global.avgScore", "平均分"),
        dataIndex: "avgScore",
        key: "avgScore",
        width: 70,
      },
      {
        title: `${trans("global.avgScore", "平均分")}(%)`,
        dataIndex: "avgScoreRatio",
        key: "avgScoreRatio",
        width: 90,
      },
      {
        title: trans("global.maxScore", "最高分"),
        dataIndex: "maxScore",
        key: "maxScore",
        width: 80,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              <Popover
                content={content}
                title={null}
                overlayClassName="stuPopover"
                trigger="click"
              >
                <i
                  className={[icon.iconfont, styles.clickIcon].join(" ")}
                  onClick={this.renderNumContent.bind(
                    this,
                    record.maxScoreStudentIds,
                  )}
                >
                  &#xe74e;
                </i>
              </Popover>
            </div>
          );
        },
      },
      {
        title: trans("global.minScore", "最低分"),
        dataIndex: "minScore",
        key: "minScore",
        width: 70,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              <Popover
                content={content}
                title={null}
                overlayClassName="stuPopover"
                trigger="click"
              >
                <i
                  className={[icon.iconfont, styles.clickIcon].join(" ")}
                  onClick={this.renderNumContent.bind(
                    this,
                    record.minScoreStudentIds,
                  )}
                >
                  &#xe74e;
                </i>
              </Popover>
            </div>
          );
        },
      },
      {
        title: trans("global.medianScore", "中位分"),
        dataIndex: "medianScore",
        key: "avgmedianScoreScore",
        width: 70,
      },
      {
        title: trans("global.standardDeviation", "标准差"),
        dataIndex: "scoreStddev",
        key: "scoreStddev",
        width: 70,
      },
      {
        title: trans("global.excellentRate", "优秀率"),
        dataIndex: "outstandingRate",
        key: "outstandingRate",
        width: 80,
      },
      {
        title: trans("global.passRating", "及格率"),
        dataIndex: "passRate",
        key: "passRate",
        width: 80,
      },
    ];
    let xingzhengCol = [
      {
        title: trans("global.className", "班级名称"),
        dataIndex: "gradeAndGroupName",
        key: "gradeAndGroupName",
        width: 120,
        render: (text, record) => {
          // console.log(text, record, "ppp");
          return (
            <div>
              {text}
              {record.courseTeacherNames ? (
                <div>
                  {record.courseTeacherNames.length > 0 &&
                    record.courseTeacherNames.map((item) => (
                      <span className={styles.teachersName}>{item}</span>
                    ))}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        title: trans("global.avgScore", "平均分"),
        dataIndex: "avgScore",
        key: "avgScore",
        width: 70,
      },
      {
        title: `${trans("global.avgScore", "平均分")}(%)`,
        dataIndex: "avgScoreRatio",
        key: "avgScoreRatio",
        width: 90,
      },
      {
        title: trans("global.maxScore", "最高分"),
        dataIndex: "maxScore",
        key: "maxScore",
        width: 80,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              <Popover
                content={content}
                title={null}
                overlayClassName="stuPopover"
                trigger="click"
              >
                <i
                  className={[icon.iconfont, styles.clickIcon].join(" ")}
                  onClick={this.renderNumContent.bind(
                    this,
                    record.maxScoreStudentIds,
                  )}
                >
                  &#xe74e;
                </i>
              </Popover>
            </div>
          );
        },
      },
      {
        title: trans("global.minScore", "最低分"),
        dataIndex: "minScore",
        key: "minScore",
        width: 70,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              <Popover
                content={content}
                title={null}
                overlayClassName="stuPopover"
                trigger="click"
              >
                <i
                  className={[icon.iconfont, styles.clickIcon].join(" ")}
                  onClick={this.renderNumContent.bind(
                    this,
                    record.minScoreStudentIds,
                  )}
                >
                  &#xe74e;
                </i>
              </Popover>
            </div>
          );
        },
      },
      {
        title: trans("global.medianScore", "中位分"),
        dataIndex: "medianScore",
        key: "avgmedianScoreScore",
        width: 70,
      },
      {
        title: trans("global.standardDeviation", "标准差"),
        dataIndex: "scoreStddev",
        key: "scoreStddev",
        width: 70,
      },
      {
        title: trans("global.excellentRate", "优秀率"),
        dataIndex: "outstandingRate",
        key: "outstandingRate",
        width: 80,
      },
      {
        title: trans("global.passRating", "及格率"),
        dataIndex: "passRate",
        key: "passRate",
        width: 80,
      },
    ];
    let fencengList = [];
    let xingzhengList = [];
    console.log(this.state.active, "dada3");
    if (specialList && specialList.length > 0 && this.state.active === 9) {
      specialList.map((item) => {
        if (item.moduleName == "分层班") {
          fencengList = item.dwdExamAnalyseByGroupResponseList;
          fencengList.length > 0 &&
            fencengList.map((it) => {
              let newObject = it;
              console.log(it, "zwl");
              it.studentStageModelList &&
                it.studentStageModelList.length > 0 &&
                it.studentStageModelList.map((item) => {
                  newObject[`${item.stageText}`] = {
                    avgScore: item.avgScore,
                    studentNum: item?.studentNum,
                    studentIdList: item?.studentIdList,
                  };
                  newObject[`${item.stageText}分数`] = {
                    avgScore: item.avgScore,
                    studentNum: item?.studentNum,
                    studentIdList: item?.studentIdList,
                  };
                });
              newArrayDataSource.push(newObject);
            });
          fencengList.length > 0 &&
            fencengList[0].studentStageModelList &&
            fencengList[0].studentStageModelList.length > 0 &&
            fencengList[0].studentStageModelList.map((item) => {
              console.log(`${item.stageText}分数`, "zwl11");
              fencengCol.push({
                title: `${item.stageText}`,
                dataIndex: `${item.stageText}`,
                key: `${item.stageText}`,
                width: item.stageText.length > 6 ? 90 : 70,
                render: (text, record) => {
                  console.log(text, record, "zwl");
                  return (
                    <div>
                      <span>{text?.studentNum}</span>
                      <Popover
                        content={content}
                        title={null}
                        overlayClassName="stuPopover"
                        trigger="click"
                      >
                        <i
                          className={[icon.iconfont, styles.clickIcon].join(
                            " ",
                          )}
                          onClick={this.renderNumContent.bind(
                            this,
                            text?.studentIdList,
                          )}
                        >
                          &#xe74e;
                        </i>
                      </Popover>
                    </div>
                  );
                },
              });
            });
          fencengCol.push(
            {
              title: trans("global.actualNumberOfExaminees", "实考人数"),
              dataIndex: "examStudentCount",
              key: "examStudentCount",
              width: 80,
            },
            {
              title: trans("global.numberOfAbsentees", "缺考人数"),
              dataIndex: "missExamStudentCount",
              key: "missExamStudentCount",
              width: 80,
              render: (text, record) => {
                return (
                  <div>
                    <span>{text}</span>
                    {text === 0 ? null : (
                      <Popover
                        content={content}
                        title={null}
                        overlayClassName="stuPopover"
                        trigger="click"
                        placement="bottom"
                      >
                        <i
                          className={[icon.iconfont, styles.clickIcon].join(
                            " ",
                          )}
                          onClick={this.renderNumContent.bind(
                            this,
                            record.missExamStudentIds,
                          )}
                        >
                          &#xe74e;
                        </i>
                      </Popover>
                    )}
                  </div>
                );
              },
            },
          );
        } else if (item.moduleName == "行政班") {
          xingzhengList = item.dwdExamAnalyseByGroupResponseList;
          xingzhengList.length > 0 &&
            xingzhengList.map((it) => {
              let newObject = it;
              console.log(it, "zwl");
              it.studentStageModelList &&
                it.studentStageModelList.length > 0 &&
                it.studentStageModelList.map((item) => {
                  newObject[`${item.stageText}`] = {
                    avgScore: item.avgScore,
                    studentNum: item?.studentNum,
                    studentIdList: item?.studentIdList,
                  };
                  newObject[`${item.stageText}分数`] = {
                    avgScore: item.avgScore,
                    studentNum: item?.studentNum,
                    studentIdList: item?.studentIdList,
                  };
                });
              newArrayDataSource.push(newObject);
            });
          xingzhengList.length > 0 &&
            xingzhengList[0].studentStageModelList &&
            xingzhengList[0].studentStageModelList.length > 0 &&
            xingzhengList[0].studentStageModelList.map((item) => {
              console.log(`${item.stageText}分数`, "zwl11");
              xingzhengCol.push({
                title: `${item.stageText}`,
                dataIndex: `${item.stageText}`,
                key: `${item.stageText}`,
                width: item.stageText.length > 6 ? 90 : 70,
                render: (text, record) => {
                  console.log(text, record, "zwl");
                  return (
                    <div>
                      <span>{text?.studentNum}</span>
                      <Popover
                        content={content}
                        title={null}
                        overlayClassName="stuPopover"
                        trigger="click"
                      >
                        <i
                          className={[icon.iconfont, styles.clickIcon].join(
                            " ",
                          )}
                          onClick={this.renderNumContent.bind(
                            this,
                            text?.studentIdList,
                          )}
                        >
                          &#xe74e;
                        </i>
                      </Popover>
                    </div>
                  );
                },
              });
            });
          xingzhengCol.push(
            {
              title: trans("global.actualNumberOfExaminees", "实考人数"),
              dataIndex: "examStudentCount",
              key: "examStudentCount",
              width: 80,
            },
            {
              title: trans("global.numberOfAbsentees", "缺考人数"),
              dataIndex: "missExamStudentCount",
              key: "missExamStudentCount",
              width: 80,
              render: (text, record) => {
                return (
                  <div>
                    <span>{text}</span>
                    {text === 0 ? null : (
                      <Popover
                        content={content}
                        title={null}
                        overlayClassName="stuPopover"
                        trigger="click"
                        placement="bottom"
                      >
                        <i
                          className={[icon.iconfont, styles.clickIcon].join(
                            " ",
                          )}
                          onClick={this.renderNumContent.bind(
                            this,
                            record.missExamStudentIds,
                          )}
                        >
                          &#xe74e;
                        </i>
                      </Popover>
                    )}
                  </div>
                );
              },
            },
          );
        }
      });
    }
    dataSource?.length &&
      dataSource.map((it) => {
        let newObject = it;
        it.studentStageModelList &&
          it.studentStageModelList.length > 0 &&
          it.studentStageModelList.map((item) => {
            newObject[`${item.stageText}`] = {
              avgScore: item.avgScore,
              studentNum: item?.studentNum,
              studentIdList: item?.studentIdList,
            };
            newObject[`${item.stageText}分数`] = {
              avgScore: item.avgScore,
              studentNum: item?.studentNum,
              studentIdList: item?.studentIdList,
            };
            newObject[`${item.stageText}均分`] = item.avgScore;
          });
        newArrayDataSource.push(newObject);
      });
    console.log(newArrayDataSource, "dada2");
    dataSource?.length &&
      dataSource[0]?.studentStageModelList?.length &&
      dataSource[0].studentStageModelList.map((item, ii) => {
        columns.push(
          {
            title: `${item.stageText}`,
            dataIndex: `${item.stageText}`,
            key: `${item.stageText}`,
            width: [80, 95, 80][ii],
            render: (text, record) => {
              // console.log(text, record, "zwl");
              return (
                <div>
                  <span>{text?.studentNum}</span>
                  <Popover
                    content={content}
                    title={null}
                    overlayClassName="stuPopover"
                    trigger="click"
                  >
                    <i
                      className={[icon.iconfont, styles.clickIcon].join(" ")}
                      onClick={this.renderNumContent.bind(
                        this,
                        text?.studentIdList,
                      )}
                    >
                      &#xe74e;
                    </i>
                  </Popover>
                </div>
              );
            },
          },
          {
            title: `${item.stageText}${trans(
              "global.averageScoreShort",
              "均分",
            )}`,
            dataIndex: `${item.stageText}均分`,
            key: `${item.stageText}均分`,
            width: [100, 120, 100][ii],
          },
        );
      });
    columns.push(
      {
        title: trans("global.actualNumberOfExaminees", "实考人数"),
        dataIndex: "examStudentCount",
        key: "examStudentCount",
        width: 80,
      },
      {
        title: trans("global.numberOfAbsentees", "缺考人数"),
        dataIndex: "missExamStudentCount",
        key: "missExamStudentCount",
        // width: 80,
        render: (text, record) => {
          return (
            <div>
              <span>{text}</span>
              {text === 0 ? null : (
                <Popover
                  content={content}
                  title={null}
                  overlayClassName="stuPopover"
                  trigger="click"
                  placement="bottom"
                >
                  <i
                    className={[icon.iconfont, styles.clickIcon].join(" ")}
                    onClick={this.renderNumContent.bind(
                      this,
                      record.missExamStudentIds,
                    )}
                  >
                    &#xe74e;
                  </i>
                </Popover>
              )}
            </div>
          );
        },
      },
    );
    let content = (
      <div
        className={[
          styles.stuInfoBox,
          this.props.stuInfoList && this.props.stuInfoList.length > 7
            ? ""
            : styles.noScorll,
        ].join(" ")}
      >
        {this.props.stuInfoList && this.props.stuInfoList.length > 0
          ? this.props.stuInfoList.map((item, index) => (
              // <div className={styles.stuMessage}>
              //   <div className={styles.imgBox}>
              //     <img src={item.avatarUrl} />
              //   </div>
              //   <div className={styles.stuName}>{item.name}</div>
              //   <div className={styles.stuEnName}>{item.ename}</div>
              // </div>
              <div className={styles.stuInfoMessage}>
                <span className={styles.sort}>{index + 1}</span>
                <span className={styles.infoName}>
                  {locale() === "en" ? item.ename : item.name}
                </span>
                <span>{item.studentScore}</span>
              </div>
            ))
          : null}
      </div>
    );

    const scoringClumns = [
      {
        title: trans("global.topicModule", "板块/题目"),
        dataIndex: "sectionTitle",
        width: "20%",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          return this.state[`inputVib${record.index}sectionTitle`] ? (
            <div
              style={{ width: "100%", height: "100%", position: "relative" }}
            >
              <div
                style={{ width: "100%", height: "100%" }}
                onClick={() => this.clickInput(text, record, "sectionTitle")}
              >
                {text}
              </div>
              <TextArea
                value={text}
                onBlur={() => this.inpBlur(record, "sectionTitle")}
                id="inpID"
                onChange={(e) => this.inpChange(record, "sectionTitle", e)}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  left: "0",
                  top: "0",
                  zIndex: "2",
                }}
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
            </div>
          ) : (
            <div
              style={{ width: "100%", height: "100%" }}
              onClick={() => this.clickInput(text, record, "sectionTitle")}
            >
              {text}
            </div>
          );
        },
      },
      {
        title: trans("global.academicSentiment", "学情"),
        width: "25%",
        dataIndex: "learningState",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          if (this.state[`inputVib${record.index}learningState`]) {
            return (
              <div
                style={{ width: "100%", height: "100%", position: "relative" }}
              >
                <div
                  style={{ width: "100%", height: "100%" }}
                  onClick={() => this.clickInput(text, record, "sectionTitle")}
                >
                  {text}
                </div>
                <Mentions
                  value={text}
                  onBlur={() => this.inpBlur(record, "learningState")}
                  id="inpID"
                  onChange={(e) => this.inpChange(record, "learningState", e)}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    left: "0",
                    top: "0",
                    zIndex: "2",
                  }}
                  // autoSize={{ minRows: 1, maxRows: 6 }}
                  onSearch={this.onSearch}
                  loading={loading1}
                >
                  {userByNameList &&
                    userByNameList.length &&
                    userByNameList.map((item) => (
                      <Option value={item.name}>{item.name}</Option>
                    ))}
                </Mentions>
              </div>
            );
          } else {
            return (
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
          }
        },
      },
      {
        title: trans("global.teaching", "教学"),
        width: "25%",
        dataIndex: "teachingState",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          return this.state[`inputVib${record.index}teachingState`] ? (
            <div
              style={{ width: "100%", height: "100%", position: "relative" }}
            >
              <div
                style={{ width: "100%", height: "100%" }}
                onClick={() => this.clickInput(text, record, "sectionTitle")}
              >
                {text}
              </div>
              <Mentions
                value={text}
                onBlur={() => this.inpBlur(record, "teachingState")}
                id="inpID"
                onChange={(e) => this.inpChange(record, "teachingState", e)}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  left: "0",
                  top: "0",
                  zIndex: "2",
                }}
                onSearch={this.onSearch}
                loading={loading1}
              >
                {userByNameList &&
                  userByNameList.length &&
                  userByNameList.map((item) => (
                    <Option value={item.name}>{item.name}</Option>
                  ))}
              </Mentions>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                whiteSpace: "pre-wrap",
              }}
              onClick={() => this.clickInput(text, record, "teachingState")}
            >
              {text}
            </div>
          );
        },
      },
      {
        title: trans("global.proposition", "命题"),
        width: "25%",
        dataIndex: "questionDesign",
        // align: "center",
        render: (text, record) => {
          // return <Input defaultValue={text} />
          return this.state[`inputVib${record.index}questionDesign`] ? (
            <div
              style={{ width: "100%", height: "100%", position: "relative" }}
            >
              <div
                style={{ width: "100%", height: "100%" }}
                onClick={() => this.clickInput(text, record, "sectionTitle")}
              >
                {text}
              </div>
              <Mentions
                value={text}
                onBlur={() => this.inpBlur(record, "questionDesign")}
                id="inpID"
                onChange={(e) => this.inpChange(record, "questionDesign", e)}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  left: "0",
                  top: "0",
                  zIndex: "2",
                }}
                onSearch={this.onSearch}
                loading={loading1}
              >
                {userByNameList &&
                  userByNameList.length &&
                  userByNameList.map((item) => (
                    <Option value={item.name}>{item.name}</Option>
                  ))}
              </Mentions>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                whiteSpace: "pre-wrap",
              }}
              onClick={() => this.clickInput(text, record, "questionDesign")}
            >
              {text}
            </div>
          );
        },
      },
    ];
    editScoreRate
      ? scoringClumns.push({
          title: "",
          width: "10%",
          dataIndex: "index",
          render: (text, record) => (
            <i
              className={icon.iconfont}
              style={{ fontSize: "16px", cursor: "pointer" }}
              onClick={() => this.scoringDel(text)}
            >
              &#xe797;
            </i>
          ),
        })
      : editScoreRate;
    const { elevatorIndex, check } = this.state;
    switch (this.state.active) {
      case 2: {
        //examSourceType： 0:题库测验  1:谱诚博阅 2:区域统考 3:点阵笔
        return viewData.examSourceType && viewData.examSourceType != 0 ? (
          <div className={styles.dataContent}>
            <div
              className={[styles.tableContent, styles.courseDetailBox].join(
                " ",
              )}
            >
              <div
                className={[
                  styles.tableBox,
                  styles.newBox,
                  styles.overview,
                ].join(" ")}
                style={
                  this.state.fullscreen
                    ? {
                        overflowY: "scroll",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        margin: 0,
                        background: "#fff",
                        zIndex: 99,
                      }
                    : {}
                }
                id="table1"
              >
                <AreaHeaderComponent
                  showFullscreenBtn={true} //显示全屏按钮
                  onClickFullscreen={this.fullscreenChange}
                  title={trans("data.courseDetail", "班级成绩概况")}
                  leftPanelContent={
                    <MyTabs
                      data={[
                        { tab: trans("global.listView", "列表视图"), key: 1 },
                        {
                          tab: trans("global.boxPlot", "箱式图"),
                          key: "boxPlot",
                        },
                        { tab: trans("global.lineChart", "折线图"), key: 5 },
                        { tab: trans("global.histogram", "柱状图"), key: 2 },
                        {
                          tab: trans("global.tripleComparison", "三分对比"),
                          key: 3,
                        },
                        {
                          tab: trans("global.comparisonRates", "三率对比"),
                          key: 4,
                        },
                      ]}
                      onChange={(value) => {
                        this.changeTab2(value.key);
                      }}
                      activeKey={1}
                    />
                  }
                  rightPanelContent={
                    <>
                      <ChartSwitch
                        label={trans("global.courseTeacher", "授课老师")}
                        defaultChecked
                        checked={this.state.teacherNameVisible}
                        onChange={this.hasVisibleTeacherName}
                      />

                      {this.state.check == 2 || this.state.check == 5 ? (
                        <>
                          <ChartSwitch
                            label={trans(
                              "global.classAverageScore",
                              "班级均分",
                            )}
                            defaultChecked
                            checked={this.state.averageClaaaChecked}
                            onChange={this.averageClassChange}
                          />
                          <ChartSwitch
                            defaultChecked
                            label={trans(
                              "global.gradeAverageScore",
                              "年级均分",
                            )}
                            checked={this.state.averageChecked}
                            onChange={this.averageChange}
                          />
                        </>
                      ) : null}

                      {this.state.check == 3 ? (
                        <>
                          <ChartSwitch
                            label={trans("global.classThreePoints", "班级三分")}
                            defaultChecked
                            checked={this.state.averageClaaaChecked1}
                            onChange={this.averageClassChange1}
                          />
                          <ChartSwitch
                            label={trans("global.gradeThreePoints", "年级三分")}
                            defaultChecked
                            checked={this.state.averageChecked1}
                            onChange={this.averageChange1}
                          />
                        </>
                      ) : null}

                      {this.state.check == 4 ? (
                        <>
                          <ChartSwitch
                            label={trans("global.classThreeRates", "班级三率")}
                            defaultChecked
                            checked={this.state.averageClaaaChecked2}
                            onChange={this.averageClassChange2}
                          />
                          <ChartSwitch
                            label={trans("global.gradeThreeRates", "年级三率")}
                            defaultChecked
                            checked={this.state.averageChecked2}
                            onChange={this.averageChange2}
                          />
                        </>
                      ) : null}

                      {this.props.filterStudentListPermissions
                        .haveFilterStudentList ? (
                        <ChartSwitch
                          defaultChecked
                          label={trans("global.specifyAnalysis", "指定分析")}
                          checked={this.state.courseDetailSpecify}
                          onChange={this.courseDetailSpecifyChange}
                        />
                      ) : null}

                      {[1, 2, 5].includes(this.state.check) ? (
                        <Dropdown
                          overlay={
                            <Menu
                              className={styles.dropdownWarp}
                              selectedKeys={sortType}
                              onClick={this.handelSort}
                            >
                              <Menu.Item
                                key="1"
                                className={styles.dropdownItem}
                              >
                                {trans("global.sortByClass", "按班级排序")}
                              </Menu.Item>
                              <Menu.Item
                                key="2"
                                className={styles.dropdownItem}
                              >
                                {trans("global.lowToHigh", "按平均分从低到高")}
                              </Menu.Item>
                              <Menu.Item
                                key="3"
                                className={styles.dropdownItem}
                              >
                                {trans("global.highToLow", "按平均分从高到低")}
                              </Menu.Item>
                            </Menu>
                          }
                        >
                          <div className={`${styles.sortBtn} ${styles.mr14}`}>
                            {trans("global.sort", "排序")} <Icon type="down" />
                          </div>
                        </Dropdown>
                      ) : null}

                      <span
                        className={`${styles.textWarp} ${styles.mr14}`}
                        onClick={this.settingRate}
                      >
                        {trans("global.settingRate", "设置三率")}
                      </span>
                      <span
                        className={`${styles.textWarp} ${styles.mr14}`}
                        onClick={this.clickEditSegment}
                      >
                        {trans("global.editSegment", "编辑分段")}
                      </span>
                      {this.state.check == 2 ? (
                        <span
                          className={`${styles.textWarp} ${styles.mr14}`}
                          onClick={() => this.exportImgClk()}
                        >
                          {trans("global.exportPicture", "截图")}
                        </span>
                      ) : null}
                      {this.state.check == 3 ? (
                        <span
                          className={`${styles.textWarp} ${styles.mr14}`}
                          onClick={() => this.exportImgClk1()}
                        >
                          {trans("global.exportPicture", "截图")}
                        </span>
                      ) : null}
                      {this.state.check == 4 ? (
                        <span
                          className={`${styles.textWarp} ${styles.mr14}`}
                          onClick={() => this.exportImgClk2()}
                        >
                          {trans("global.exportPicture", "截图")}
                        </span>
                      ) : null}
                      {this.state.check == 5 ? (
                        <span
                          className={`${styles.textWarp} ${styles.mr14}`}
                          onClick={() => this.exportImgClk5()}
                        >
                          {trans("global.exportPicture", "截图")}
                        </span>
                      ) : null}

                      <a
                        href={`${window.location.origin}/api/export/exam/groupScoreAnalyse?examId=${this.testId}&filterFlag=${this.state.courseDetailSpecify}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className={`${styles.textWarp}`}>
                          {trans("global.export", "导出")}
                        </span>
                      </a>
                    </>
                  }
                />

                <Modal
                  title={
                    <div className={styles.modalHeader}>
                      <Icon type="close" onClick={this.handleCancel} />
                      <span style={{ marginLeft: "35%" }}>
                        {trans("global.setSegmentedInterval", "设置分段区间")}
                      </span>
                    </div>
                  }
                  closable={false}
                  visible={this.state.adjusting}
                  width="500px"
                  getContainer={false}
                  footer={
                    <div
                      className={styles.footer}
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <Button onClick={this.handleCancel}>
                        {trans("global.cancle")}
                      </Button>
                      {this.state.isAdmin ? (
                        <div style={{ display: "flex", marginLeft: "10px" }}>
                          <Button
                            onClick={this.handleOk}
                            className={styles.replyDefault}
                          >
                            {trans("global.saveSelf", "保存为自用")}
                          </Button>
                          <Button
                            onClick={() => this.handleOk(true)}
                            className={styles.saveGeneral}
                          >
                            {trans(
                              "global.saveGeneralSettings",
                              "保存为本次校级通用",
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", marginLeft: "10px" }}>
                          <Button
                            onClick={() => this.clickEditSegment(true)}
                            className={styles.replyDefault}
                          >
                            {trans("global.replyDefault", "恢复成默认分段")}
                          </Button>
                          <Button
                            type="primary"
                            onClick={this.handleOk}
                            className={styles.saveGeneral}
                          >
                            {trans("global.save", "保存")}
                          </Button>
                        </div>
                      )}
                    </div>
                  }
                >
                  {selectMethod == 0 && this.sum(numPhaseList) != 100 ? (
                    <Alert
                      message={trans(
                        "global.segmentsError",
                        "所有分段累加后需等与100%",
                      )}
                      type="error"
                      showIcon
                      height="30px"
                    />
                  ) : null}
                  <div className={styles.selectBox}>
                    <span className={styles.selectMethod}>
                      {trans("global.selectMethod", "选择设置方式")}:
                    </span>
                    <Radio.Group
                      onChange={this.changeSelectMethod}
                      value={selectMethod}
                    >
                      <Radio value={0}>
                        <span className={styles.setByPercentage}>
                          {trans("global.setByPercentage", "按百分比设置")}
                        </span>
                      </Radio>
                    </Radio.Group>
                  </div>
                  <div className="numPhaseBox" style={{ textAlign: "center" }}>
                    <i
                      className={[icon.iconfont, styles.clickIcon].join(" ")}
                      style={{ fontSize: "18px", cursor: "pointer" }}
                      onClick={this.clickReduce}
                    >
                      &#xe838;
                    </i>
                    <span className="numPhase">{`${numPhase}${trans("global.segment", "段")}`}</span>
                    <i
                      className={[icon.iconfont, styles.clickIcon].join(" ")}
                      style={{ fontSize: "18px", cursor: "pointer" }}
                      onClick={this.clickAddd}
                    >
                      &#xe839;
                    </i>
                  </div>

                  <div className="numPhaseBox">
                    {selectMethod == 0 ? (
                      <span className="paragraph">
                        {trans("global.top", "前段")}
                      </span>
                    ) : (
                      <span className="paragraph">
                        {trans("global.subsection", "分段{$num}")}1
                      </span>
                    )}
                    <InputNumber
                      min={1}
                      max={selectMethod == 0 ? 100 : 150}
                      value={numPhaseList[0]}
                      className="numPhase"
                      style={{ width: "91px" }}
                      onChange={this.changeAfter}
                      onBlur={this.blurAfter}
                    />
                    {selectMethod == 0 ? (
                      <span>{`[0~${numPhaseList[0]}%]`}</span>
                    ) : (
                      <span>{`[0~${numPhaseList[0]})`}</span>
                    )}

                    <span className="floatRight"></span>
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
                            {selectMethod == 0 ? (
                              <span className="paragraph">
                                {trans("global.middle", "中段")}
                                {index}
                              </span>
                            ) : (
                              <span className="paragraph">
                                {trans("global.subsection", "分段{$num}")}
                                {index + 1}
                              </span>
                            )}

                            <InputNumber
                              min={1}
                              max={selectMethod == 0 ? 100 : 150}
                              value={item}
                              className="numPhase"
                              style={{ width: "91px" }}
                              onChange={(value) =>
                                this.chengeMiddle(index, value)
                              }
                              onBlur={(value) => this.blurMiddle(index, value)}
                            />
                            {selectMethod == 0 ? (
                              this.getMiddle(index)
                            ) : (
                              <span>{`[${numPhaseList[index - 1]}~${
                                numPhaseList[index]
                              })`}</span>
                            )}
                            <span className="floatRight"></span>
                          </div>
                        );
                      }
                    })}
                  <div className="numPhaseBox">
                    {selectMethod == 0 ? (
                      <span className="paragraph">
                        {trans("global.after", "后段")}
                      </span>
                    ) : (
                      <span className="paragraph">
                        {trans("global.subsection", "分段{$num}")}
                        {numPhase}
                      </span>
                    )}
                    <InputNumber
                      min={1}
                      max={selectMethod == 0 ? 100 : 150}
                      value={numPhaseList.at(-1)}
                      className="numPhase"
                      style={{ width: "91px" }}
                      onChange={this.changeFront}
                      onBlur={this.blurFront}
                    />
                    {selectMethod == 0 ? (
                      <span>{`(${100 - numPhaseList.at(-1)}%~100%]`}</span>
                    ) : (
                      <span>
                        {`[${numPhaseList[numPhase - 2]}~${numPhaseList[numPhase - 1]}]`}
                      </span>
                    )}

                    <span className="floatRight"></span>
                  </div>
                </Modal>

                <div
                  className={[
                    styles.tableBoxContent,
                    styles.tableCourseDetail,
                  ].join(" ")}
                >
                  {this.state.check == 1 ? (
                    <Table
                      dataSource={newArrayDataSource}
                      rowKey="gradeAndGroupName"
                      pagination={false}
                      scroll={{ x: 1600 }}
                      columns={columns}
                    />
                  ) : this.hasClassOverviewChartData(this.state.check) ? (
                    this.state.check == 2 ? (
                      <div id="classChart" key={2}></div>
                    ) : this.state.check == 3 ? (
                      <div
                        id="tripleComparison"
                        key={3}
                        style={
                          groupScoreList?.length > 6
                            ? {
                                maxWidth: 5000,
                                overflowX: "scroll",
                                display: "flex",
                              }
                            : { maxWidth: 5000, display: "flex" }
                        }
                      ></div>
                    ) : this.state.check == 5 ? (
                      <div id="lineChart" key={5}></div>
                    ) : this.state.check == "boxPlot" ? (
                      <div
                        style={{
                          width: "100%",
                          overflowX: "auto",
                          minHeight: "400px",
                        }}
                      >
                        <div id="boxPlotEl" key="boxPlotKey"></div>
                      </div>
                    ) : (
                      <div
                        id="comparisonRates"
                        key={7}
                        style={
                          groupScoreList?.length > 6
                            ? {
                                maxWidth: 5000,
                                overflowX: "scroll",
                                display: "flex",
                              }
                            : { maxWidth: 5000, display: "flex" }
                        }
                      ></div>
                    )
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={trans("global.noData", "暂无数据")}
                    />
                  )}
                </div>
              </div>

              <ScoreTable
                dispatch={this.props.dispatch}
                questionScore={this.props.scoreSection}
                examId={this.testId}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
                examSourceType={viewData.examSourceType}
              />

              <RankingTable
                dispatch={this.props.dispatch}
                questionScore={this.props.scoreSection}
                examId={this.testId}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
                examSourceType={viewData.examSourceType}
              />

              {/* 定位标签 */}
              <div id="table4"></div>
              <KnowledgePoint
                onGoToConfigData={configDataHandler}
                viewType={2}
                dispatch={this.props.dispatch}
                examId={this.testId}
                tableClass={tableClass}
                paperId={this.paperId}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />

              {/* 定位标签 */}
              <div id="table5"></div>
              <QualityTable
                onGoToConfigData={configDataHandler}
                viewType={2}
                examId={this.testId}
                paperId={this.paperId}
                hideDifficultyControls
                showQualityTotalScoreInList
              />

              {/* 定位标签 */}
              <div id="table6"></div>
              <ChapterAnalysis
                viewType={2}
                onGoToConfigData={configDataHandler}
                dispatch={this.props.dispatch}
                examId={this.testId}
                tableClass={tableClass}
                paperId={this.paperId}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />
            </div>
            <div className={styles.rightContent}>
              <div className={styles.elevator}>
                <div className={styles.elevatorTitle}>
                  {trans("global.viewList", "看板目录")}
                </div>
                <div>
                  {elevatorList.map((item, index) => (
                    <div
                      className={[
                        styles.elevatorListItem,
                        index === elevatorIndex ? styles.select : "",
                      ].join(" ")}
                      onClick={this.setSelect.bind(this, index)}
                      key={index}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {this.props.viewData.title ? (
              <TestAna
                analysisQuestionCatalog={this.state.analysisQuestionCatalog}
                onGoToConfigData={configDataHandler}
                hasPending={this.props.viewData?.hasPending}
                dispatch={this.props.dispatch}
                onTestRef={this.onTestRef}
                questionScore={this.props.knowLedgeAnalysis}
                examId={this.testId}
                paperId={this.props.viewData?.paperId}
                getClass={this.getClass}
                active={this.state.active}
              />
            ) : null}
          </div>
        );
      }
      case 3: {
        return (
          <div className={styles.dataContent}>
            <div className={styles.tableContent}>
              <QuestionTable
                dispatch={this.props.dispatch}
                questionScore={this.props.questionScore}
                examId={this.testId}
                tableClass={tableClass}
                paperId={this.paperId}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />
              <PartTable
                dispatch={this.props.dispatch}
                questionScore={this.props.partScore}
                examId={this.testId}
                tableClass={tableClass}
                paperId={this.paperId}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />
              <KnowledgePoint
                onGoToConfigData={configDataHandler}
                dispatch={this.props.dispatch}
                examId={this.testId}
                tableClass={tableClass}
                paperId={this.paperId}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />

              <QualityTable
                onGoToConfigData={configDataHandler}
                examId={this.testId}
                paperId={this.paperId}
              />

              {/* 定位标签 */}
              <div id="table5"></div>
              <ChapterAnalysis
                onGoToConfigData={configDataHandler}
                viewType={2}
                dispatch={this.props.dispatch}
                examId={this.testId}
                tableClass={tableClass}
                paperId={this.paperId}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />
            </div>
            <div className={styles.rightContent}>
              <div className={styles.elevator}>
                <div className={styles.elevatorTitle}>
                  {trans("global.viewList", "看板目录")}
                </div>
                <div>
                  {elevatorList1.map((item, index) => (
                    <div
                      className={[
                        styles.elevatorListItem,
                        index === elevatorIndex ? styles.select : "",
                      ].join(" ")}
                      onClick={this.setSelect.bind(this, index)}
                      key={index}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 4: {
        return viewData.examSourceType && viewData.examSourceType !== 0 ? (
          <div className={styles.dataContent}>
            <div className={styles.stuScore}>
              <StudentScore
                dispatch={this.props.dispatch}
                questionScore={this.props.stuScore}
                examId={this.testId}
                examName={this.props.viewData.examName}
                stuGradeList={this.props.stuGradeList}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
                examSourceType={this.props.viewData.examSourceType}
              />
              {JSON.stringify(this.props.viewData) == "{}" ? null : (
                <StudentPerformanceAnalyzer
                  examId={this.testId}
                  stuGradeList={this.props.stuGradeList}
                  subjectId={this.props.viewData.subjectId}
                />
              )}

              <TableS
                dispatch={this.props.dispatch}
                // questionScore={this.props.questionScore}
                examId={this.testId}
                tableClass={tableClass}
                paperId={this.paperId}
                examSourceType={viewData.examSourceType}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />
              {this.props.viewData && this.props.viewData.type !== 13 ? (
                <TableB
                  dispatch={this.props.dispatch}
                  // questionScore={this.props.partScore}
                  examId={this.testId}
                  tableClass={tableClass}
                  paperId={this.paperId}
                  examSourceType={viewData.examSourceType}
                  filterStudentListPermissions={
                    this.props.filterStudentListPermissions
                  }
                />
              ) : null}

              {this.props.viewData &&
              RANK_TREND_ANALYSIS_EXAM_TYPES.has(+this.props.viewData.type) ? (
                <RankAnalysis
                  dispatch={this.props.dispatch}
                  questionScore={this.props.partScore}
                  examId={this.testId}
                  getClass={this.getClass}
                  tableClass={tableClass}
                  paperId={this.paperId}
                  subjectId={this.props.viewData.subjectId}
                  filterStudentListPermissions={
                    this.props.filterStudentListPermissions
                  }
                />
              ) : null}
              {this.props.viewData &&
              RANK_TREND_ANALYSIS_EXAM_TYPES.has(+this.props.viewData.type) ? (
                <StudentTrend
                  dispatch={this.props.dispatch}
                  questionScore={this.props.partScore}
                  examId={this.testId}
                  tableClass={tableClass}
                  paperId={this.paperId}
                  filterStudentListPermissions={
                    this.props.filterStudentListPermissions
                  }
                />
              ) : null}
              <StudentAccomplishmentTable
                examId={this.testId}
                classList={this.props.stuGradeList}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />
            </div>
            <div className={styles.rightContent}>
              <div className={styles.elevator}>
                <div className={styles.elevatorTitle}>
                  {trans("global.viewList", "看板目录")}
                </div>
                <div>
                  {newElevatorList2.map((item, index) => (
                    <div
                      className={[
                        styles.elevatorListItem,
                        item.id === elevatorIndex ? styles.select : "",
                      ].join(" ")}
                      onClick={this.setSelect.bind(this, item.id)}
                      key={item.id}
                    >
                      {item.name}
                    </div>
                  ))}
                  {this.props.viewData &&
                  RANK_TREND_ANALYSIS_EXAM_TYPES.has(
                    +this.props.viewData.type,
                  ) ? (
                    <div
                      className={[
                        styles.elevatorListItem,
                        elevatorIndex === 3 ? styles.select : "",
                      ].join(" ")}
                      onClick={this.setSelect.bind(this, 3)}
                      key={3}
                    >
                      {trans("data.rankAnalysis", "排名分析")}
                    </div>
                  ) : null}
                  {this.props.viewData &&
                  RANK_TREND_ANALYSIS_EXAM_TYPES.has(
                    +this.props.viewData.type,
                  ) ? (
                    <div
                      className={[
                        styles.elevatorListItem,
                        elevatorIndex === 4 ? styles.select : "",
                      ].join(" ")}
                      onClick={this.setSelect.bind(this, 4)}
                      key={4}
                    >
                      {trans("data.trend", "趋势分析")}
                    </div>
                  ) : null}
                  <div
                    className={[
                      styles.elevatorListItem,
                      elevatorIndex === 5 ? styles.select : "",
                    ].join(" ")}
                    onClick={this.setSelect.bind(this, 5)}
                    key={5}
                  >
                    {trans("global.skillAnalysis", "素养能力分析")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {this.props.viewData.title ? (
              <TestAna
                analysisQuestionCatalog={this.state.analysisQuestionCatalog}
                dispatch={this.props.dispatch}
                onTestRef={this.onTestRef}
                questionScore={this.props.knowLedgeAnalysis}
                examId={this.testId}
                paperId={this.props.viewData?.paperId}
                getClass={this.getClass}
                active={this.state.active}
              />
            ) : null}
          </div>
        );
      }
      case 5: {
        return (
          <StudentGroup examId={this.testId} changeFull={this.changeFull} />
        );
      }
      case 6: {
        return (
          <div>
            <RealTime paperId={this.paperId} examId={this.testId} />
          </div>
        );
      }
      case 7: {
        return (
          <div className={styles.tableBox}>
            <div>
              <KnowLedgeTable
                dispatch={this.props.dispatch}
                questionScore={this.props.knowLedgeAnalysis}
                examId={this.testId}
                paperId={this.paperId}
                getClass={this.getClass}
                filterStudentListPermissions={
                  this.props.filterStudentListPermissions
                }
              />
            </div>
          </div>
        );
      }
      case 8: {
        return (
          <div className={styles.testQuestions}>
            <span className={styles.inline}>
              <Select
                onChange={this.changeGrade}
                value={this.state.groupIdDiy}
                width="140"
              >
                <Option value={0} key={0}>
                  <span title={trans("global.allGrade", "全部年级")}>
                    {trans("global.allGrade", "全部年级")}
                  </span>
                </Option>
                {classListData && classListData.length > 0
                  ? classListData.map((item) => (
                      <Option value={item.groupId} key={item.groupId}>
                        <span title={item.groupName}>
                          {locale() == "en" ? item.groupEName : item.groupName}
                        </span>
                      </Option>
                    ))
                  : null}
              </Select>
            </span>
            <span className={styles.tips}>
              <i className={icon.iconfont} style={{ marginRight: "5px" }}>
                &#xe82b;
              </i>
              {trans(
                "global.individualizationTips",
                "点击学生姓名可预览该学生试卷",
              )}
            </span>
            <span className={styles.funBtn}>
              {/* <span className={[styles.but, styles.del].join(" ")}>删除</span>
               */}
              <a
                className={[styles.but, styles.print].join(" ")}
                onClick={this.clickPrint}
              >
                {trans("global.download", "下载")}
              </a>
            </span>
            <div className={styles.testQuestionsTable}>
              <Table
                columns={columns1}
                dataSource={data1}
                pagination={false}
                scroll={{ x: 1200, y: true }}
              />
            </div>
          </div>
        );
      }
      case 9: {
        return (
          <div className={styles.analysisReport}>
            {reportPresentationList.examId ? (
              <>
                <div className={styles.tableReport}>
                  {config.map((moduleConfig) => {
                    if (
                      moduleConfig.moduleKey == "basicData" &&
                      moduleConfig.moduleShow
                    ) {
                      return (
                        <>
                          {viewData.groupTypeName == "分层班" ? null : (
                            <div
                              className={[styles.tableBox, styles.newBox1].join(
                                " ",
                              )}
                              style={
                                currentUser && currentUser.identityShowName
                                  ? this.getWaterMark(currentUser)
                                  : null
                              }
                              id="table1"
                            >
                              <div className={styles.tableBoxHeader}>
                                <span className={styles.tableHeaderTitle}>
                                  {locale() == "en"
                                    ? moduleConfig.moduleEname
                                      ? moduleConfig.moduleEname
                                      : moduleConfig.moduleName
                                    : moduleConfig.moduleName}
                                </span>
                                <div className={styles.operation}>
                                  {this.state.check == 2 ? (
                                    <ChartSwitch
                                      defaultChecked
                                      label={trans(
                                        "global.showAverageScore",
                                        "显示平均分",
                                      )}
                                      checked={this.state.averageChecked}
                                      onChange={this.averageChange}
                                    />
                                  ) : null}
                                  {this.state.check == 2 ? (
                                    <span
                                      className={`${styles.textWarp} ${styles.mr14}`}
                                      onClick={() => this.exportImgClk()}
                                    >
                                      {trans("global.exportPicture", "截图")}
                                    </span>
                                  ) : null}
                                  <div className={styles.operationS}>
                                    {this.props.filterStudentListPermissions
                                      .haveFilterStudentList ? (
                                      <ChartSwitch
                                        label={trans(
                                          "global.specifyAnalysis",
                                          "指定分析",
                                        )}
                                        defaultChecked
                                        checked={
                                          this.state.courseDetailSpecify1
                                        }
                                        onChange={
                                          this.courseDetailSpecifyChange1
                                        }
                                        style={{ marginLeft: "4px" }}
                                      />
                                    ) : null}
                                    {this.props.analysisDetail
                                      .showfenceng ? null : (
                                      <a
                                        href={`${window.location.origin}/api/export/exam/groupScoreAnalyse?examId=${this.testId}&filterFlag=${this.state.courseDetailSpecify1}`}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <span
                                          className={`${styles.textWarp} ${styles.mr14}`}
                                        >
                                          {trans("global.export", "导出")}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {this.props.analysisDetail.showfenceng ? (
                                <div
                                  className={styles.classContentTitle}
                                  id="tablefenceng1"
                                >
                                  {trans(
                                    "global.fencengAnalysis",
                                    "分层班基础数据",
                                  )}
                                </div>
                              ) : null}

                              <div
                                className={[
                                  styles.tableBoxContent,
                                  styles.tableCourseDetail,
                                ].join(" ")}
                              >
                                {this.props.analysisDetail.showfenceng ? (
                                  <div className={styles.classfoundationTitle}>
                                    <Icon type="caret-right" />
                                    {this.props.analysisDetail.paperTypeName}
                                  </div>
                                ) : null}
                                {this.state.check == 1 ? (
                                  this.props.analysisDetail.showfenceng ? (
                                    <Table
                                      dataSource={fencengList}
                                      pagination={false}
                                      scroll={{ x: 1100, y: 400 }}
                                      columns={fencengCol}
                                    />
                                  ) : (
                                    <Table
                                      dataSource={dataSource}
                                      pagination={false}
                                      scroll={{ x: 1600, y: 400 }}
                                      columns={columns}
                                    />
                                  )
                                ) : (
                                  <div id="classChart"></div>
                                )}
                                {this.props.analysisDetail.showfenceng ? (
                                  <div className={styles.classfoundationTitle}>
                                    <Icon type="caret-right" />
                                    Speaking & STAR
                                    {this.state.isEditfenceng ==
                                    true ? null : authenticationModel.richText ? (
                                      <span
                                        className={styles.edit}
                                        onClick={this.fencengAnalysis}
                                      >
                                        {trans("global.edit", "编辑")}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}
                                {this.props.analysisDetail.showfenceng ? (
                                  this.state.isEditfenceng == true ? (
                                    <>
                                      <RicherEditor
                                        onRef={this.onRefPropositional}
                                        dispatch={this.props.dispatch}
                                        cancelEditor={this.cancelEditor}
                                        relationType="1"
                                        paperId={this.paperId}
                                        braftType="fencengAnalysis"
                                        blurEdit={this.blurEditfenceng}
                                        initContent={this.state.fencengAnalysis}
                                        changeText={this.fencengText}
                                        examId={this.testId}
                                        modelKey={7}
                                        blue={true}
                                        uuId={this.state.uuId}
                                        releaseLock={this.releaseLock}
                                        reloadModalVisibleEditText={
                                          this.reloadModalVisibleEditText
                                        }
                                      />
                                    </>
                                  ) : (
                                    <div className={styles.propositionalHtml}>
                                      {this.state.fencengAnalysis ? (
                                        <>
                                          <div
                                            className={styles.fillAnalysis}
                                            style={{
                                              paddingLeft: "15px",
                                              paddingRight: "35px",
                                              lineHeight: "22px",
                                            }}
                                            dangerouslySetInnerHTML={{
                                              __html:
                                                this.state.fencengAnalysis,
                                            }}
                                            onDoubleClick={
                                              authenticationModel.richText &&
                                              this.fencengAnalysis
                                            }
                                          ></div>
                                          {this.state.editFont1 ? (
                                            <i
                                              className={[
                                                icon.iconfont,
                                                styles.editFont,
                                              ].join(" ")}
                                              onDoubleClick={
                                                authenticationModel.richText &&
                                                this.fencengAnalysis
                                              }
                                            >
                                              &#xe7a1;
                                            </i>
                                          ) : null}
                                        </>
                                      ) : (
                                        <>
                                          <div
                                            onDoubleClick={
                                              authenticationModel.richText &&
                                              this.fencengAnalysis
                                            }
                                            className={styles.notFilled}
                                            onMouseLeave={() =>
                                              this.setState({
                                                editFont1: false,
                                              })
                                            }
                                            onMouseOver={() =>
                                              this.setState({ editFont1: true })
                                            }
                                            style={{ lineHeight: "22px" }}
                                          >
                                            {trans(
                                              "global.notFilled",
                                              "TA还暂未填写任何内容",
                                            )}
                                          </div>
                                          {this.state.editFont1 ? (
                                            <i
                                              className={[
                                                icon.iconfont,
                                                styles.editFont,
                                              ].join(" ")}
                                              onDoubleClick={
                                                authenticationModel.richText &&
                                                this.fencengAnalysis
                                              }
                                            >
                                              &#xe7a1;
                                            </i>
                                          ) : null}
                                        </>
                                      )}
                                    </div>
                                  )
                                ) : null}
                              </div>
                            </div>
                          )}

                          {this.props.analysisDetail.showfenceng ? (
                            <div
                              className={[styles.tableBox, styles.newBox].join(
                                " ",
                              )}
                              style={
                                currentUser && currentUser.identityShowName
                                  ? this.getWaterMark(currentUser)
                                  : null
                              }
                              id="xingzheng1"
                            >
                              <div className={styles.fakeBar}></div>
                              <div
                                className={styles.classContentTitle}
                                id="tablexingzheng1"
                              >
                                {trans(
                                  "global.xingzhengAnalysis",
                                  "行政班基础数据",
                                )}
                              </div>
                              <div
                                className={[
                                  styles.tableBoxContent,
                                  styles.tableCourseDetail,
                                ].join(" ")}
                              >
                                <div className={styles.classfoundationTitle}>
                                  <Icon type="caret-right" />
                                  {this.props.analysisDetail.paperTypeName}
                                </div>
                                <Table
                                  dataSource={xingzhengList}
                                  pagination={false}
                                  scroll={{ x: 1100, y: 400 }}
                                  columns={xingzhengCol}
                                />
                                <div className={styles.classfoundationTitle}>
                                  <Icon type="caret-right" />
                                  Speaking & STAR
                                  {this.state.isEditxingzheng ==
                                  true ? null : authenticationModel.richText ? (
                                    <span
                                      className={styles.edit}
                                      onClick={this.xingzhengAnalysis}
                                    >
                                      {trans("global.edit", "编辑")}
                                    </span>
                                  ) : null}
                                </div>
                                {this.state.isEditxingzheng == true ? (
                                  <>
                                    <RicherEditor
                                      onRef={this.onRefPropositional}
                                      dispatch={this.props.dispatch}
                                      cancelEditor={this.cancelEditor}
                                      relationType="1"
                                      paperId={this.paperId}
                                      braftType="xingzhengAnalysis"
                                      blurEdit={this.blurEditxingzheng}
                                      initContent={this.state.xingzhengAnalysis}
                                      changeText={this.xingzhengText}
                                      examId={this.testId}
                                      modelKey={8}
                                      blue={true}
                                      uuId={this.state.uuId}
                                      releaseLock={this.releaseLock}
                                      reloadModalVisibleEditText={
                                        this.reloadModalVisibleEditText
                                      }
                                    />
                                  </>
                                ) : (
                                  <div className={styles.propositionalHtml}>
                                    {this.state.xingzhengAnalysis ? (
                                      <>
                                        <div
                                          className={styles.fillAnalysis}
                                          style={{
                                            paddingLeft: "15px",
                                            paddingRight: "35px",
                                            lineHeight: "22px",
                                          }}
                                          dangerouslySetInnerHTML={{
                                            __html:
                                              this.state.xingzhengAnalysis,
                                          }}
                                          onDoubleClick={
                                            authenticationModel.richText &&
                                            this.xingzhengAnalysis
                                          }
                                        ></div>
                                        {this.state.editFont1 ? (
                                          <i
                                            className={[
                                              icon.iconfont,
                                              styles.editFont,
                                            ].join(" ")}
                                            onDoubleClick={
                                              authenticationModel.richText &&
                                              this.xingzhengAnalysis
                                            }
                                          >
                                            &#xe7a1;
                                          </i>
                                        ) : null}
                                      </>
                                    ) : (
                                      <>
                                        <div
                                          onDoubleClick={
                                            authenticationModel.richText &&
                                            this.xingzhengAnalysis
                                          }
                                          className={styles.notFilled}
                                          onMouseLeave={() =>
                                            this.setState({ editFont1: false })
                                          }
                                          onMouseOver={() =>
                                            this.setState({ editFont1: true })
                                          }
                                          style={{ lineHeight: "22px" }}
                                        >
                                          {trans(
                                            "global.notFilled",
                                            "TA还暂未填写任何内容",
                                          )}
                                        </div>
                                        {this.state.editFont1 ? (
                                          <i
                                            className={[
                                              icon.iconfont,
                                              styles.editFont,
                                            ].join(" ")}
                                            onDoubleClick={
                                              authenticationModel.richText &&
                                              this.xingzhengAnalysis
                                            }
                                          >
                                            &#xe7a1;
                                          </i>
                                        ) : null}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </>
                      );
                    } else if (
                      moduleConfig.moduleKey == "propositionAnalysis" &&
                      moduleConfig.moduleShow
                    ) {
                      return (
                        <div
                          className={[styles.tableBox, styles.newBox].join(" ")}
                          style={
                            currentUser && currentUser.identityShowName
                              ? this.getWaterMark(currentUser)
                              : null
                          }
                          id="table2"
                        >
                          <div className={styles.tableBoxHeader}>
                            {/* <span className={styles.tableHeaderSpan}></span>  */}
                            <span className={styles.tableHeaderTitle}>
                              {locale() == "en"
                                ? moduleConfig.moduleEname
                                  ? moduleConfig.moduleEname
                                  : moduleConfig.moduleName
                                : moduleConfig.moduleName}
                              {/* {trans("global.autonomousProposition", "(自主命题/外部命题)")} */}
                            </span>
                            <span>
                              <i
                                className={icon.iconfont}
                                style={{
                                  fontSize: "16px",
                                  cursor: "pointer",
                                  verticalAlign: "middle",
                                }}
                                onClick={() =>
                                  this.setState({ introducePropositiona: true })
                                }
                              >
                                &#xe82b;
                              </i>
                              {this.state.introducePropositiona ? (
                                <sapn className={styles.introduceScore}>
                                  {trans(
                                    "global.introducePropositiona",
                                    "由备课组长填写，分析包括但不限于：难度系数、难度比例、细目分布、素养维度等",
                                  )}
                                  <i
                                    className={icon.iconfont}
                                    style={{
                                      fontSize: "12px",
                                      marginLeft: "10px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      this.setState({
                                        introducePropositiona: false,
                                      })
                                    }
                                  >
                                    &#xe6e2;
                                  </i>
                                </sapn>
                              ) : null}
                            </span>
                            {authenticationModel.isTitleAnalysis &&
                            !this.state.isEditpropositional ? (
                              <span
                                className={styles.edit}
                                onClick={this.editAnalysis}
                              >
                                {trans("global.edit", "编辑")}
                              </span>
                            ) : null}
                          </div>
                          <div className={styles.tableBoxContent}>
                            {this.state.isEditpropositional == true ? (
                              <>
                                <RicherEditor
                                  onRef={this.onRefPropositional}
                                  dispatch={this.props.dispatch}
                                  cancelEditor={this.cancelEditor}
                                  relationType="1"
                                  paperId={this.paperId}
                                  braftType="propositionalAnalysis"
                                  blurEdit={this.blurEditPropositional}
                                  initContent={this.state.propositionalAnalysis}
                                  changeText={this.propositionalText}
                                  examId={this.testId}
                                  modelKey={1}
                                  blue={true}
                                  uuId={this.state.uuId}
                                  releaseLock={this.releaseLock}
                                  reloadModalVisibleEditText={
                                    this.reloadModalVisibleEditText
                                  }
                                />
                              </>
                            ) : (
                              <div className={styles.propositionalHtml}>
                                {this.state.propositionalAnalysis ? (
                                  <>
                                    <div
                                      className={styles.fillAnalysis}
                                      style={{
                                        paddingLeft: "15px",
                                        paddingRight: "35px",
                                        lineHeight: "22px",
                                      }}
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          this.state.propositionalAnalysis,
                                      }}
                                      onDoubleClick={
                                        authenticationModel.isTitleAnalysis &&
                                        this.editAnalysis
                                      }
                                    ></div>
                                    {this.state.editFont1 ? (
                                      <i
                                        className={[
                                          icon.iconfont,
                                          styles.editFont,
                                        ].join(" ")}
                                        onDoubleClick={
                                          authenticationModel.isTitleAnalysis &&
                                          this.editAnalysis
                                        }
                                      >
                                        &#xe7a1;
                                      </i>
                                    ) : null}
                                  </>
                                ) : (
                                  <>
                                    <div
                                      onDoubleClick={
                                        authenticationModel.isTitleAnalysis &&
                                        this.editAnalysis
                                      }
                                      className={styles.notFilled}
                                      onMouseLeave={() =>
                                        this.setState({ editFont1: false })
                                      }
                                      onMouseOver={() =>
                                        this.setState({ editFont1: true })
                                      }
                                      style={{ lineHeight: "22px" }}
                                    >
                                      {trans(
                                        "global.notFilled",
                                        "TA还暂未填写任何内容",
                                      )}
                                    </div>
                                    {this.state.editFont1 ? (
                                      <i
                                        className={[
                                          icon.iconfont,
                                          styles.editFont,
                                        ].join(" ")}
                                        onDoubleClick={
                                          authenticationModel.isTitleAnalysis &&
                                          this.editAnalysis
                                        }
                                      >
                                        &#xe7a1;
                                      </i>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } else if (
                      moduleConfig.moduleKey == "gradeScoreRateAnalysis" &&
                      moduleConfig.moduleShow
                    ) {
                      return (
                        <div
                          className={[styles.tableBox, styles.newBox].join(" ")}
                          style={
                            currentUser && currentUser.identityShowName
                              ? this.getWaterMark(currentUser)
                              : null
                          }
                          id="table3"
                        >
                          <div className={styles.tableBoxHeader}>
                            {/* <span className={styles.tableHeaderSpan}></span> */}
                            <span className={styles.tableHeaderTitle}>
                              {/* {trans("data.scoreRateAnalysis", "年级得分率分析")} */}
                              {locale() == "en"
                                ? moduleConfig.moduleEname
                                  ? moduleConfig.moduleEname
                                  : moduleConfig.moduleName
                                : moduleConfig.moduleName}
                            </span>
                            <span>
                              <i
                                className={icon.iconfont}
                                style={{
                                  fontSize: "16px",
                                  cursor: "pointer",
                                  verticalAlign: "middle",
                                }}
                                onClick={() =>
                                  this.setState({ introduceScore: true })
                                }
                              >
                                &#xe82b;
                              </i>
                              {this.state.introduceScore ? (
                                <sapn className={styles.introduceScore}>
                                  {trans(
                                    "global.introduceScoreRate",
                                    "分析包括但不限于：难道系数、难度比例、细目分布、素养维度等",
                                  )}
                                  <i
                                    className={icon.iconfont}
                                    style={{
                                      fontSize: "12px",
                                      marginLeft: "10px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      this.setState({ introduceScore: false })
                                    }
                                  >
                                    &#xe6e2;
                                  </i>
                                </sapn>
                              ) : null}
                            </span>
                            {editScoreRate ? (
                              <div className={styles.scoreBtn}>
                                <span
                                  className={styles.scoreCancle}
                                  onClick={this.scoreCancle}
                                >
                                  {trans("global.cancle", "取消")}
                                </span>
                                <span
                                  className={styles.scoreSave}
                                  onClick={this.clickScoreSave}
                                >
                                  {trans("global.save", "保存")}
                                </span>
                              </div>
                            ) : authenticationModel.isScoreAnalysis ? (
                              <span
                                className={styles.edit}
                                onClick={this.clickEditScoreRate}
                              >
                                {trans("global.edit", "编辑")}
                              </span>
                            ) : null}
                          </div>
                          <div
                            className={[
                              styles.tableBoxContentScore,
                              styles.tableScore,
                            ].join(" ")}
                          >
                            <Table
                              columns={scoringClumns}
                              dataSource={this.state.scoringList}
                              bordered={true}
                              pagination={false}
                            />
                            {editScoreRate ? (
                              <div
                                className={styles.increase}
                                onClick={this.addScoringList}
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
                            ) : null}
                          </div>
                        </div>
                      );
                    } else if (
                      moduleConfig.moduleKey == "classAnalysis" &&
                      moduleConfig.moduleShow
                    ) {
                      return (
                        <div
                          className={[styles.tableBox, styles.newBox].join(" ")}
                          style={
                            currentUser && currentUser.identityShowName
                              ? this.getWaterMark(currentUser)
                              : null
                          }
                          id="table4"
                        >
                          <div
                            className={styles.tableBoxHeader}
                            style={{ borderBottom: "1px #e8e8e8 solid" }}
                          >
                            {/* <span className={styles.tableHeaderSpan}></span> */}
                            <span className={styles.tableHeaderTitle}>
                              {/* {trans("data.classAnalysis", "班级分析")} */}
                              {locale() == "en"
                                ? moduleConfig.moduleEname
                                  ? moduleConfig.moduleEname
                                  : moduleConfig.moduleName
                                : moduleConfig.moduleName}
                            </span>
                            <span>
                              <i
                                className={icon.iconfont}
                                style={{
                                  fontSize: "16px",
                                  cursor: "pointer",
                                  verticalAlign: "middle",
                                }}
                                onClick={() =>
                                  this.setState({ classAnalysis: true })
                                }
                              >
                                &#xe82b;
                              </i>
                              {this.state.classAnalysis ? (
                                <sapn className={styles.introduceScore}>
                                  {trans(
                                    "global.introduceClassAnalysis",
                                    "由授课老师填写自己授课班级的分析。",
                                  )}
                                  <i
                                    className={icon.iconfont}
                                    style={{
                                      fontSize: "12px",
                                      marginLeft: "10px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      this.setState({ classAnalysis: false })
                                    }
                                  >
                                    &#xe6e2;
                                  </i>
                                </sapn>
                              ) : null}
                            </span>
                          </div>
                          <div
                            className={styles.tableBoxContent}
                            style={{ padding: "0 20px" }}
                          >
                            {multiClassList.length > 0
                              ? this.props.analysisDetail.showfenceng
                                ? multiClassList.map((item, index) => (
                                    <ModelAnalysisTable
                                      multiClassList={item}
                                      onRef={(e) => this.onRefMulti(index, e)}
                                      dispatch={this.props.dispatch}
                                      examId={this.testId}
                                      getLock={this.getLock}
                                      releaseLock={this.releaseLock}
                                      forceLock={this.forceLock}
                                      index={index}
                                      key={index}
                                      uuId={this.state.uuId}
                                      singleEdit={this.singleEdit}
                                      authenticationModel={authenticationModel}
                                      paperId={this.paperId}
                                      gradeName={viewData.gradeName}
                                      fileList={item.fileList}
                                      fileChange={(files) => {
                                        this.fileChange(files, index);
                                      }}
                                      lookDetail={this.lookDetail}
                                    />
                                  ))
                                : multiClassList.map((item, index) => (
                                    <MultiClassTable
                                      childModuleConfig={
                                        moduleConfig.childModule
                                      }
                                      multiClassList={item}
                                      onRef={(e) => this.onRefMulti(index, e)}
                                      dispatch={this.props.dispatch}
                                      examId={this.testId}
                                      getLock={this.getLock}
                                      releaseLock={this.releaseLock}
                                      forceLock={this.forceLock}
                                      index={index}
                                      key={index}
                                      uuId={this.state.uuId}
                                      singleEdit={this.singleEdit}
                                      authenticationModel={authenticationModel}
                                      gradeName={viewData.gradeName}
                                      fileList={item.fileList}
                                      fileChange={(files) => {
                                        this.fileChange(files, index);
                                      }}
                                      lookDetail={this.lookDetail}
                                    ></MultiClassTable>
                                  ))
                              : null}
                          </div>
                        </div>
                      );
                    } else if (
                      moduleConfig.moduleKey == "summarizeModel" &&
                      moduleConfig.moduleShow
                    ) {
                      return (
                        <div
                          className={[styles.tableBox, styles.newBox].join(" ")}
                          style={
                            currentUser && currentUser.identityShowName
                              ? this.getWaterMark(currentUser)
                              : null
                          }
                          id="table5"
                        >
                          <div className={styles.tableBoxHeader}>
                            {/* <span className={styles.tableHeaderSpan}></span> */}
                            <span className={styles.tableHeaderTitle}>
                              {/* {trans("global.summaryTeamLeader", "备课组长总结")} */}
                              {locale() == "en"
                                ? moduleConfig.moduleEname
                                  ? moduleConfig.moduleEname
                                  : moduleConfig.moduleName
                                : moduleConfig.moduleName}
                            </span>
                            <span>
                              <i
                                className={icon.iconfont}
                                style={{
                                  fontSize: "16px",
                                  cursor: "pointer",
                                  verticalAlign: "middle",
                                }}
                                onClick={() =>
                                  this.setState({ leaderSummary: true })
                                }
                              >
                                &#xe82b;
                              </i>
                              {this.state.leaderSummary ? (
                                <sapn className={styles.introduceScore}>
                                  {/* {trans(
                                  "global.introduceLeaderSummary",
                                  "由备课组长填写，请保证填写内容不少于50个字。"
                                )} */}
                                  {locale() == "en"
                                    ? moduleConfig.defaultEmessage
                                      ? moduleConfig.defaultEmessage
                                      : moduleConfig.defaultMessage
                                    : moduleConfig.defaultMessage}
                                  <i
                                    className={icon.iconfont}
                                    style={{
                                      fontSize: "12px",
                                      marginLeft: "10px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      this.setState({ leaderSummary: false })
                                    }
                                  >
                                    &#xe6e2;
                                  </i>
                                </sapn>
                              ) : null}
                            </span>
                            {authenticationModel.isSummaryAnalysis &&
                            !this.state.isEditleaderSummary ? (
                              <span
                                className={styles.edit}
                                onClick={this.editleaderSummary}
                              >
                                {trans("global.edit", "编辑")}
                              </span>
                            ) : null}
                          </div>
                          <div className={styles.tableBoxContent}>
                            {this.state.isEditleaderSummary == true ? (
                              <>
                                <RicherEditor
                                  onRef={this.onRefPropositional}
                                  dispatch={this.props.dispatch}
                                  cancelEditor={this.cancelEditor}
                                  relationType="4"
                                  paperId={this.paperId}
                                  braftType="leaderSummary"
                                  blurEdit={this.blurEditLeaderSummary}
                                  initContent={this.state.leaderSummaryAnalysis}
                                  changeText={this.leaderSummaryText}
                                  blue={true}
                                  modelKey={4}
                                  uuId={this.state.uuId}
                                  releaseLock={this.releaseLock}
                                  examId={this.testId}
                                  reloadModalVisibleEditText={
                                    this.reloadModalVisibleEditText
                                  }
                                />
                              </>
                            ) : (
                              <div className={styles.propositionalHtml}>
                                {this.state.leaderSummaryAnalysis ? (
                                  <>
                                    <div
                                      className={styles.fillAnalysis}
                                      style={{
                                        paddingLeft: "15px",
                                        paddingRight: "35px",
                                        lineHeight: "22px",
                                      }}
                                      onMouseLeave={() =>
                                        this.setState({ editFont2: false })
                                      }
                                      onMouseOver={() =>
                                        this.setState({ editFont2: true })
                                      }
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          this.state.leaderSummaryAnalysis,
                                      }}
                                      onDoubleClick={
                                        authenticationModel.isSummaryAnalysis &&
                                        this.editleaderSummary
                                      }
                                    ></div>
                                    {authenticationModel.isSummaryAnalysis &&
                                    !this.state.isEditleaderSummary ? (
                                      <i
                                        className={[
                                          icon.iconfont,
                                          styles.editFont,
                                        ].join(" ")}
                                        onClick={this.editleaderSummary}
                                      >
                                        &#xe7a1;
                                      </i>
                                    ) : null}
                                  </>
                                ) : (
                                  <>
                                    <div
                                      onDoubleClick={
                                        authenticationModel.isSummaryAnalysis &&
                                        this.editleaderSummary
                                      }
                                      className={styles.notFilled}
                                      onMouseLeave={() =>
                                        this.setState({ editFont2: false })
                                      }
                                      onMouseOver={() =>
                                        this.setState({ editFont2: true })
                                      }
                                      style={{ lineHeight: "22px" }}
                                    >
                                      {/* {authenticationModel.isSummaryAnalysis
                              ? trans("global.clickAdd", "点此添加内容")
                              : trans(
                                  "global.headmanNotFilled",
                                  "备课组长未填写"
                                )} */}
                                      {/* {trans(
                                      "global.introduceLeaderSummary",
                                      "由备课组长填写，请保证填写内容不少于50个字。"
                                    )} */}
                                      {locale() == "en"
                                        ? moduleConfig.defaultEmessage
                                          ? moduleConfig.defaultEmessage
                                          : moduleConfig.defaultMessage
                                        : moduleConfig.defaultMessage}
                                    </div>
                                    {authenticationModel.isSummaryAnalysis &&
                                    !this.state.isEditleaderSummary ? (
                                      <i
                                        className={[
                                          icon.iconfont,
                                          styles.editFont,
                                        ].join(" ")}
                                        onClick={this.editleaderSummary}
                                      >
                                        &#xe7a1;
                                      </i>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } else if (
                      moduleConfig.moduleKey == "subjectChiefModel" &&
                      moduleConfig.moduleShow
                    ) {
                      return this.props.reportPresentationList
                        .subjectChiefWriteModel ? (
                        <div
                          className={[styles.tableBox, styles.newBox].join(" ")}
                          style={
                            currentUser && currentUser.identityShowName
                              ? this.getWaterMark(currentUser)
                              : null
                          }
                          id="table6"
                        >
                          <div className={styles.tableBoxHeader}>
                            {/* <span className={styles.tableHeaderSpan}></span> */}
                            <span className={styles.tableHeaderTitle}>
                              {/* {trans("global.chiefSummaryDiscipline", "学科首席总结")} */}
                              {locale() == "en"
                                ? moduleConfig.moduleEname
                                  ? moduleConfig.moduleEname
                                  : moduleConfig.moduleName
                                : moduleConfig.moduleName}
                            </span>
                            <span>
                              <i
                                className={icon.iconfont}
                                style={{
                                  fontSize: "16px",
                                  cursor: "pointer",
                                  verticalAlign: "middle",
                                }}
                                onClick={() =>
                                  this.setState({ chiefSummary: true })
                                }
                              >
                                &#xe82b;
                              </i>
                              {this.state.chiefSummary ? (
                                <sapn className={styles.introduceScore}>
                                  {/* {trans(
                                    "global.introduceLeaderSummary1",
                                    "由学科首席填写，请保证填写内容不少于50个字。"
                                  )} */}
                                  {locale() == "en"
                                    ? moduleConfig.defaultEmessage
                                      ? moduleConfig.defaultEmessage
                                      : moduleConfig.defaultMessage
                                    : moduleConfig.defaultMessage}
                                  <i
                                    className={icon.iconfont}
                                    style={{
                                      fontSize: "12px",
                                      marginLeft: "10px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      this.setState({ chiefSummary: false })
                                    }
                                  >
                                    &#xe6e2;
                                  </i>
                                </sapn>
                              ) : null}
                            </span>
                            {authenticationModel.isSubjectChiefWrite &&
                            !this.state.isEditChiefSummary ? (
                              <span
                                className={styles.edit}
                                onClick={this.editChiefSummary}
                              >
                                {trans("global.edit", "编辑")}
                              </span>
                            ) : null}
                          </div>
                          <div className={styles.tableBoxContent}>
                            {this.state.isEditChiefSummary == true ? (
                              <>
                                <RicherEditor
                                  onRef={this.onRefPropositional}
                                  dispatch={this.props.dispatch}
                                  cancelEditor={this.cancelEditor}
                                  relationType="6"
                                  paperId={this.paperId}
                                  braftType="chiefSummary"
                                  blurEdit={this.blurEditChiefSummary}
                                  initContent={this.state.chiefAnalysis}
                                  changeText={this.chiefText}
                                  blue={true}
                                  modelKey={6}
                                  uuId={this.state.uuId}
                                  releaseLock={this.releaseLock}
                                  examId={this.testId}
                                  reloadModalVisibleEditText={
                                    this.reloadModalVisibleEditText
                                  }
                                />
                              </>
                            ) : (
                              <div className={styles.propositionalHtml}>
                                {this.state.chiefAnalysis ? (
                                  <>
                                    <div
                                      className={styles.fillAnalysis}
                                      style={{
                                        paddingLeft: "15px",
                                        paddingRight: "35px",
                                        lineHeight: "22px",
                                      }}
                                      onMouseLeave={() =>
                                        this.setState({ editFont3: false })
                                      }
                                      onMouseOver={() =>
                                        this.setState({ editFont3: true })
                                      }
                                      dangerouslySetInnerHTML={{
                                        __html: this.state.chiefAnalysis,
                                      }}
                                      onDoubleClick={
                                        authenticationModel.isSubjectChiefWrite &&
                                        this.editChiefSummary
                                      }
                                    ></div>
                                    {authenticationModel.isSubjectChiefWrite &&
                                    !this.state.isEditChiefSummary ? (
                                      <i
                                        className={[
                                          icon.iconfont,
                                          styles.editFont,
                                        ].join(" ")}
                                        onClick={this.editChiefSummary}
                                      >
                                        &#xe7a1;
                                      </i>
                                    ) : null}
                                  </>
                                ) : (
                                  <>
                                    <div
                                      onDoubleClick={
                                        authenticationModel.isSubjectChiefWrite &&
                                        this.editChiefSummary
                                      }
                                      className={styles.notFilled}
                                      onMouseLeave={() =>
                                        this.setState({ editFont3: false })
                                      }
                                      onMouseOver={() =>
                                        this.setState({ editFont3: true })
                                      }
                                      style={{ lineHeight: "22px" }}
                                    >
                                      {/* {authenticationModel.isSubjectChiefWrite
                                  ? trans("global.clickAdd", "点此添加内容")
                                  : trans(
                                      "global.headmanNotFilled",
                                      "备课组长未填写"
                                    )} */}
                                      {/* {trans(
                                        "global.introduceLeaderSummary1",
                                        "由学科首席填写，请保证填写内容不少于50个字。"
                                      )} */}
                                      {locale() == "en"
                                        ? moduleConfig.defaultEmessage
                                          ? moduleConfig.defaultEmessage
                                          : moduleConfig.defaultMessage
                                        : moduleConfig.defaultMessage}
                                    </div>
                                    {authenticationModel.isSubjectChiefWrite &&
                                    !this.state.isEditChiefSummary ? (
                                      <i
                                        className={[
                                          icon.iconfont,
                                          styles.editFont,
                                        ].join(" ")}
                                        onClick={this.editChiefSummary}
                                      >
                                        &#xe7a1;
                                      </i>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null;
                    }
                  })}
                  <div className={styles.addAttachment}>
                    <Upload {...property}>
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

                    {newList &&
                      newList.length > 0 &&
                      newList.map((item, index) => (
                        <UseFileItem
                          key={index}
                          fileItem={item}
                          lookDetail={this.lookDetail}
                          deleteFile={this.deleteFile}
                        />
                      ))}
                    <ShowFile
                      previewVisible={previewVisible}
                      previewInfo={previewInfo}
                      lookDetail={this.lookDetail}
                      imgchange={false}
                    />
                  </div>
                </div>
                <div className={styles.catalogue}>
                  {authenticationModel.isTitleAnalysis ||
                  authenticationModel.isSubjectChiefWrite ? (
                    // && !this.state.isEditpropositional
                    <div className={styles.rightBtn}>
                      {updatedChange ? (
                        <p className={styles.subSuccess}>
                          <i
                            className={[icon.iconfont, styles.clickIcon].join(
                              " ",
                            )}
                          >
                            &#xe837;
                          </i>
                          {trans("global.Updated", "已更新")}
                        </p>
                      ) : null}
                      <p className={styles.rightP}>
                        {submitChange ? (
                          // </Popconfirm>
                          <button
                            className={styles.rightSubmit}
                            onClick={() =>
                              this.setState({
                                subEdit: true,
                              })
                            }
                          >
                            {trans("global.replace", "更新")}
                          </button>
                        ) : (
                          <button
                            className={styles.rightSubmit}
                            onClick={this.reportEdit}
                          >
                            {trans("global.submit", "提交")}
                          </button>
                        )}
                      </p>
                    </div>
                  ) : null}
                  {reportPresentationList.examId ? (
                    <div className={styles.elevator}>
                      <div className={styles.elevatorTitle}>
                        {trans("global.viewList", "看板目录")}
                      </div>
                      <div>
                        {reportPresentationList.examId ? (
                          <>
                            {config.map((configOptions, index) => (
                              <>
                                {configOptions.moduleShow ? (
                                  <div
                                    className={[
                                      styles.elevatorListItem,
                                      index === elevatorIndex
                                        ? styles.select
                                        : "",
                                    ].join(" ")}
                                    onClick={this.setSelect.bind(this, index)}
                                    key={index}
                                  >
                                    {locale() == "en"
                                      ? configOptions.moduleEname
                                        ? configOptions.moduleEname
                                        : configOptions.moduleName
                                      : configOptions.moduleName}
                                  </div>
                                ) : null}

                                {configOptions.moduleKey == "classAnalysis" &&
                                configOptions.moduleShow ? (
                                  <>
                                    {multiClassList &&
                                      multiClassList.length > 0 &&
                                      multiClassList.map((it, ind) => (
                                        <div
                                          className={[
                                            styles.elevatorListItem,
                                            ind + 6 === elevatorIndex
                                              ? styles.select
                                              : "",
                                          ].join(" ")}
                                          onClick={this.setSelect.bind(
                                            this,
                                            ind + 6,
                                          )}
                                          key={ind + 6}
                                          style={{ paddingLeft: "10px" }}
                                        >
                                          {it.groupName}
                                        </div>
                                      ))}
                                  </>
                                ) : null}

                                {configOptions.moduleKey == "basicData" &&
                                configOptions.moduleShow &&
                                this.props.analysisDetail.showfenceng ? (
                                  <>
                                    {viewData.groupTypeName ==
                                    "分层班" ? null : (
                                      <div
                                        className={[
                                          styles.elevatorListItem,
                                          "fenceng" === elevatorIndex
                                            ? styles.select
                                            : "",
                                        ].join(" ")}
                                        onClick={this.setSelect.bind(
                                          this,
                                          "fenceng",
                                        )}
                                        key={"fenceng"}
                                        style={{ paddingLeft: "10px" }}
                                      >
                                        {trans("global.fenceng", "分层班")}
                                      </div>
                                    )}
                                    <div
                                      className={[
                                        styles.elevatorListItem,
                                        "xingzheng" === elevatorIndex
                                          ? styles.select
                                          : "",
                                      ].join(" ")}
                                      onClick={this.setSelect.bind(
                                        this,
                                        "xingzheng",
                                      )}
                                      key={"xingzheng"}
                                      style={{ paddingLeft: "10px" }}
                                    >
                                      {trans("global.administration", "行政班")}
                                    </div>
                                  </>
                                ) : null}
                              </>
                            ))}
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <Modal
                  visible={this.state.subEdit}
                  onOk={this.submitReport}
                  onCancel={this.submitCancel}
                >
                  <p>
                    {trans(
                      "global.submittingTips1",
                      "1. 报告提交后，会发送钉钉消息提醒学科首席和学术长查看；",
                    )}
                  </p>
                  <p>
                    {trans(
                      "global.submittingTips2",
                      "2.提交后，仍然可以随时修改，点击【更新】按钮，其他人会看到更新后的报告。",
                    )}
                  </p>
                </Modal>
                <Modal
                  visible={this.state.noSummary}
                  onCancel={this.submitCancel1}
                  getContainer={false}
                  footer={false}
                >
                  <p>{trans("data.noSummary", "小结还未填写")}</p>
                </Modal>
                {this.state.lockTipVisible && (
                  <ClashLockModal
                    lockTipVisible={this.state.lockTipVisible} //modal显隐
                    forceLock={this.forceLock} //强制抢锁方法
                    operatorTips={this.state.operatorTips} //提示信息
                    currentOperItem={this.state.currentOperItem} //强制抢锁参数
                    giveupLocking={this.giveupLocking} //放弃抢锁
                    modelKey={this.state.modelKey}
                  />
                )}

                {this.state.reloadModalVisible ? (
                  <ReloadModal
                    reloadModalVisible={this.state.reloadModalVisible}
                  />
                ) : null}
                {this.state.reloadModalVisibleEdit ? (
                  <ReloadModal
                    reloadModalVisible={this.state.reloadModalVisibleEdit}
                  />
                ) : null}
              </>
            ) : (
              <div className={styles.nosubmit}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span className={styles.nosubmitText}>
                      {trans("global.nosubmit", "报告还没有提交")}
                    </span>
                  }
                />
              </div>
            )}
          </div>
        );
      }
      case 10: {
        if (JSON.stringify(this.props.viewData) !== "{}") {
          return (
            <PupllAnalyse
              analysisQuestionCatalog={this.state.analysisQuestionCatalog}
              openTwoWay={configDataHandler}
              dispatch={this.props.dispatch}
              paperId={this.paperId}
              examId={this.testId}
              data={this.props.viewData}
            />
          );
        }

        break;
      }
      case 11: {
        return (
          <div>
            <TopicAnalysis
              analysisQuestionCatalog={this.state.analysisQuestionCatalog}
              onOutReview={this.outReview}
              onStartExplaining={this.startExplaining}
              commentMode={this.commentMode}
              dispatch={this.props.dispatch}
              examId={this.testId}
              paperId={this.props.viewData?.paperId}
            />
          </div>
        );
      }
      case 12: {
        return (
          <div
            style={{
              width: "100%",
              height: "calc(100vh - 120px)",
              padding: "20px",
              overflow: "auto",
            }}
            id="img"
          >
            <DotMatrixPen
              examId={this.testId}
              paperId={this.paperId}
            ></DotMatrixPen>
          </div>
        );
      }
      case 13: {
        return (
          <div
            style={{
              width: "100%",
              height: "calc(100vh - 120px)",
              padding: "20px 0 20px 10px",
            }}
          >
            <ClassroomEvaluation
              newArrDataSource={newArrayDataSource}
              columns={columns}
              questionScore={this.props.questionScore}
              groupScoreList={groupScoreList}
              viewData={this.props.viewData}
              currentUser={this.props.currentUser}
              testId={this.testId}
              paperId={this.paperId}
              dispatch={this.props.dispatch}
              filterStudentListPermissions={
                this.props.filterStudentListPermissions
              }
              stuScore={this.props.stuScore}
              onOutReview={this.outReview}
              onStartExplaining={this.startExplaining}
              commentMode={this.commentMode}
              examId={this.testId}
              scoreSection={this.props.scoreSection}
              tableClass={tableClass}
            />
          </div>
        );
      }
      case 14:
      case 15: {
        return (
          <div
            style={{
              width: "100%",
              height: "calc(100vh - 120px)",
              padding: "20px 0 20px 10px",
            }}
          >
            <ClassReport examId={this.testId} viewType={this.state.active} />
          </div>
        );
      }
      // No default
    }
  };
}

export default connect(({ home, studyPictures, inputQuestion, global }) => ({
  analysisDetail: home.viewData,
  tabKey: home.tabKey,
  scoreData: home.scoreData,
  stuData: home.stuData,
  questionData: home.questionData,
  classListData: home.classListData,
  questionAnalysisData: home.questionAnalysisData,
  groupScoreList: home.groupScoreList,
  stuInfoList: home.stuInfoList,
  questionScore: home.questionScore,
  partScore: home.partScore,
  // partScoreB: home.partScoreB,
  scoreRateTable: home.scoreRateTable,
  scoreSection: home.scoreSection,
  stuScore: home.stuScore,
  dataAnalysis: home.dataSource,
  viewData: home.viewData,
  tableClass: home.tableClass,
  stuGradeList: home.stuGradeList,
  knowLedgeAnalysis: home.knowLedgeAnalysis,
  allGradeList: inputQuestion.allGradeList,
  individuationTest: home.individuationTest,
  questionItem: home.questionItem,
  currentUser: global.currentUser,
  reportPresentationList: home.reportPresentationList,
  identityJudgement: home.identityJudgement,
  reviewUploadedFile: home.reviewUploadedFile,
  editReport: home.editReport,
  viewOrDownPaper: home.viewOrDownPaper,
  userByNameList: home.userByNameList,
  correction: home.correction,
  filterStudentList: home.filterStudentList,
  filterStudentListPermissions: home.filterStudentListPermissions,
  calPercentOrFraction: home.calPercentOrFraction,
  specialList: home.specialList,
  groupChanging: home.groupChanging,
}))(StuTest);

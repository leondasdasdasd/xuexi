import { message } from "antd";

import { groupScoreAnalyse, studentSummaryDashboard } from "../services/exam";
import {
  bindUploadedFile, //文件绑定
  changeManagement,
  classQuestionAnalysis,
  comparativeAnalysis, // 排名分析
  deleteQuestion,
  deleteUploadedFile, //文件删除
  editPaperOrExamName,
  examCorrection,
  examDelete,
  examSelect,
  forceLock, //强行抢锁
  getAnswerRate,
  getClassList, //获取班级列表
  getExamCorrection,
  getExamRuleData,
  getExamType,
  getGroupStudents,
  getIfAdmin,
  getIndexImg,
  getLock, //获取锁
  getOssAssume,
  getPaperIndex,
  getPersonAnalysis,
  getQuestionAnalysis, //按试题查看
  getSettingRateValue,
  getYear,
  identityJudgement, //质量分析报告权限
  postExam,
  postStudentExamList,
  queryAllGrade,
  queryAllStudentByName,
  queryAllStudentStudySituation,
  queryAllSubject,
  queryAllTestSubject,
  queryAnalysis,
  queryAnalysisVersion,
  queryAnswerDetails,
  queryAttainmentTest,
  queryBasket,
  queryCalPercentOrFraction,
  queryClass,
  queryCompareTest,
  queryCorrection,
  queryCount,
  queryCriterionList,
  queryCurrentSemester,
  queryDataSource,
  queryDeleteTestList,
  queryDimensionAnalysis,
  queryDownload,
  queryDownloadUrl,
  queryEditReport,
  queryEffectPreviewSubmit,
  queryErrorMsg as queryErrorMessage,
  queryEvaluationItemListByCategoryId,
  queryExam,
  queryExamInfoByExamId,
  queryExamLog,
  queryExamOptions,
  queryExamPaper,
  queryExamPaperResultUrl,
  queryExamType,
  queryFilterStudent,
  queryFilterStudentList,
  queryFilterStudentListPermissions,
  queryFlunkListByStudent,
  queryFlunkListByStudent1, //逐题分析
  queryGetRatioDealShow,
  queryGradeClass,
  queryGroupAndGradeScoreRate,
  queryGroupChanging,
  queryGroupContrast,
  queryGroupResult,
  queryhistoryTestList,
  queryIndividuationTest,
  queryInquireTest,
  queryIsTest,
  queryKnowLedgeAnalysis,
  queryKnowledgePointReportWithGroup,
  queryKnowLedgeStu,
  queryKnowLedgeTable,
  queryLogUser,
  queryMobileRadar,
  queryModifyAnalysisDimension,
  queryModifyTest,
  queryOriginalVolumeDownload,
  queryPaperInfo,
  queryPaperList,
  querypersonal,
  queryPrintingPaper,
  queryQuestion,
  queryQuestionAnalysis,
  queryQuestionScore,
  queryRatioDeal,
  queryRatioDealShow,
  queryReductionHistory,
  queryResourceCreate,
  queryReviewUploadedFile,
  querySaveGroup,
  querySaveStudySituationStructure,
  querySaveUploadPaper,
  queryScoreAnalysis,
  queryScoreRate,
  queryScoreSection,
  queryScoreSectionPlan,
  queryScoreSetting,
  queryScoreSummary,
  queryScoreSummary1,
  queryScoringRate,
  querySelectAllTutor,
  querySpecial,
  queryStageUnderIdentity,
  queryStuAnalysis,
  queryStudentByExamList,
  queryStudentOriginal,
  queryStudentScore,
  queryStudentTest,
  queryStudySituationByStudentId,
  queryStudySituationStructure,
  queryStuGrade,
  queryStuInfo,
  queryStuQuestionAnalysisExport,
  queryStuScore,
  querySubjectByGrade,
  querySubjectList,
  querySysLog,
  queryTable,
  queryTaskPublishDisplay,
  queryTest,
  queryTestView,
  queryTrend,
  queryTrendAnalysisResultNew,
  queryTrendStu,
  queryType,
  queryUpdateStage,
  queryUploadFile,
  queryUserByName,
  queryView,
  queryViewChart,
  queryViewOrDownPaper,
  queryWrongQuestion,
  queryWrongQuestionAnalysis,
  releaseLock, //释放锁
  saveSettingRate,
  scoreSectionPlan,
  selectEvaluationCategoryByExample,
  sendAllParent,
  singleQuestionAnalysis,
  stuStart,
  stuSubmitTest,
  submitViewApi,
  testDelete,
  updateExamTableData,
  updateItem,
  updateQuestionKnowlegeOrLevel,
  uploadStuFile,
  uploadWorkCard,
} from "../services/example";
import { queryQuestionV2BasketSummary } from "../services/questionV2";
import { subjectListByGrades } from "../services/qustion";
import { loginRedirect } from "../utils/utils";

/**
 *
 * @param messageText
 */
function isAnswerTimeLimitMessage(messageText) {
  const rawMessage = messageText ? String(messageText) : "";
  return (
    rawMessage.includes("测验答题还未开始") ||
    rawMessage.includes("测验答题已截止")
  );
}

export default {
  namespace: "home",

  state: {
    viewData: {},
    testList: [],
    count: 0,
    typeValue: 0,
    courseValue: 0,
    statusValue: 0,
    paperIndexList: [],
    studentTest: {},
    analysisDetail: {},
    tabKey: "1",
    scoreData: {},
    stuData: {},
    questionData: {},
    questionList: [],
    basketList: [],
    basketSubjectId: null,
    testStatus: false,
    startTime: "",
    classAnalysisData: {}, //按班级查看统计分析
    questionItem: {},
    analysisPersonData: [], //按班级查看统计人数
    answerRateData: {}, //按学生查看班级答题情况
    classListData: [], //获取班级列表
    yearList: [],
    questionTotal: 0,
    exampleId: null, //试卷id
    examOptions: [],
    examList: {},
    groupScoreList: [],
    stuInfoList: [],
    questionScore: {},
    partScore: {},
    scoreRateTable: {},
    scoreSection: {},
    stuScore: {},
    scoreSummary: {},
    dateSource: {},
    tableClass: [],
    stuGradeList: [],
    allGrade: [],
    classList: [],
    allSubject: [],
    examTypeList: [],
    wordPdfUrl: "",
    viewChart: {},
    knwoLedgeAnalysisList: [],
    stageSubjectList: [],
    paperList: {}, //试卷列表
    paperSearchList: [],
    testSubject: [], //所有学科
    deleteTestList: "",
    inquireTest: {}, //查询试卷
    modifyTest: {}, //修改试卷
    historyTestList: [], //历史试卷列表
    originalVolumeDownload: {}, //原卷/印刷卷下载
    ossAssumeResult: {},
    scoreSettingList: [],
    knowLedgeAnalysis: {},
    queryAllTestSubject: [],
    attainmentTest: [],
    reductionHistory: [],
    correction: "",
    flunkListByStudent: {},
    dimensionAnalysis: [],
    modifyAnalysisDimension: {},
    wrongQuestion: [],
    wrongQuestionAnalysis: {},
    individuationTest: {},
    currentSemester: {},
    downLoadRul: null,
    typeList: [],
    personalList: [],
    groupContrast: {},
    answerDetails: [],
    studentOriginal: [],
    infoStatus: false,
    paperStatus: false,
    reportPresentationList: [],
    updateStage: {},
    editReport: {},
    identityJudgement: {},
    trendList: [],
    newTrendList: [],
    compareTest: [],
    reviewUploadedFile: [],
    deleteUploadedFile: {},
    bindUploadedFile: {},
    trendStuList: [],
    comparativeAnalysis: {},
    examSelect: [],
    activityDetail: {},
    classQuestionAnalysis: {},
    getGroupStudents: [],
    uploadPaper: {},
    viewOrDownPaper: {},
    resourceCreate: {},
    evaluateList: [],
    evaluationItemListByCategoryId: [],
    criterionList: [],
    paperInfo: {},
    examInfoByExamId: {},
    taskPublishDisplayList: {},
    subjectListTest: [],
    editPaperOrExamName: "",
    postStudentExamList: [],
    studentExamList: [],
    examPaperResultUrlList: [],
    studySituationStructureList: {},
    saveStudySituationStructure: null,
    studySituationByStudentIdList: {},
    examPaperResultUrl: {},
    examPaperStu: {},
    stuQuestionAnalysisExport: "",
    groupAndGradeScoreRate: "",
    userByNameList: [],
    filterStudentList: [],
    filterStudent: "",
    filterStudentListPermissions: {},
    sysLogList: [],
    stageUnderIdentityList: [],
    ratioDealShowList: [],
    selectAllTutorList: [],
    ratioDeal: "",
    scoreSectionPlan: "",
    calPercentOrFraction: "",
    ratioDealShowTest: "",
    hoverIndex: {},
    hoverIndexc: {},
    downloadPdf: {},
    specialList: [],
    allStudentStudySituation: "",
    groupChanging: {},
    uploadFile: "",
    studentByExamList: [],
    allStudentByName: [],
    examLog: "",
    knowledgePointReportWithGroup: {},
    errorMsg: "",
    tableData: {},
    studentSummaryDashboard: {},
    mobileData: [],
    logUser: [],
    indexImg: [],

    questionAnalysisData: {}, // 逐题分析列表数据
  },

  subscriptions: {
    setup({ dispatch, history }) {},
  },

  effects: {
    *getErrorMsg({ payload }, { call, put }) {
      const response = yield call(queryErrorMessage, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveErrorMsg",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getKnowledgePointReportWithGroup({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryKnowledgePointReportWithGroup, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
        yield put({
          type: "saveKnowledgePointReportWithGroup",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getExamLog({ payload }, { call, put }) {
      const response = yield call(queryExamLog, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveExamLog",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAllStudentByName({ payload }, { call, put }) {
      const response = yield call(queryAllStudentByName, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAllStudentByName",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStudentByExamList({ payload }, { call, put }) {
      const response = yield call(queryStudentByExamList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStudentByExamList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getUploadFile({ payload }, { call, put }) {
      const response = yield call(queryUploadFile, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveUploadFile",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getGroupChanging({ payload }, { call, put }) {
      const response = yield call(queryGroupChanging, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveGroupChanging",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *updateTestChange({ payload }, { call, put }) {
      console.log(payload, "sss");
      //切换语言
      yield put({
        type: "updateTest",
        payload: payload.questionId,
      });
    },
    *postAllStudentStudySituation({ payload }, { call, put }) {
      const response = yield call(queryAllStudentStudySituation, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAllStudentStudySituation",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getTable({ payload }, { call, put }) {
      const response = yield call(queryTable, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveTable",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStudentSummaryDashboard({ payload }, { call, put }) {
      const response = yield call(studentSummaryDashboard, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStudentSummaryDashboard",
          payload: response.content || {},
        });
      } else {
        message.error(response.message);
      }
    },
    *getPaperIndex({ payload }, { call, put }) {
      const response = yield call(getPaperIndex, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getRatioDealShowTest({ payload }, { call, put }) {
      const response = yield call(queryGetRatioDealShow, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveGetRatioDealShow",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getIndexImg({ payload }, { call, put }) {
      const response = yield call(getIndexImg, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveIndexImg",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getSpecial({ payload }, { call, put }) {
      const response = yield call(querySpecial, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveSpecial",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *postCalPercentOrFraction({ payload }, { call, put }) {
      const response = yield call(queryCalPercentOrFraction, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveCalPercentOrFraction",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *postScoreSectionPlan({ payload }, { call, put }) {
      const response = yield call(queryScoreSectionPlan, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveScoreSectionPlan",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *postRatioDeal({ payload }, { call, put }) {
      const response = yield call(queryRatioDeal, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveRatioDeal",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getSelectAllTutor({ payload }, { call, put }) {
      const response = yield call(querySelectAllTutor, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveSelectAllTutor",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getRatioDealShow({ payload }, { call, put }) {
      const response = yield call(queryRatioDealShow, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveRatioDealShow",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getEffectPreviewSubmit({ payload }, { call, put }) {
      const response = yield call(queryEffectPreviewSubmit, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveViewData",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStageUnderIdentity({ payload }, { call, put }) {
      const response = yield call(queryStageUnderIdentity, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStageUnderIdentity",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getSysLog({ payload }, { call, put }) {
      const response = yield call(querySysLog, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveSysLog",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAnalysisVersion({ payload }, { call, put }) {
      const response = yield call(queryAnalysisVersion, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAnalysisVersion",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *uploadCard({ payload }, { call, put }) {
      console.log(1112);
      const response = yield call(uploadWorkCard, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
      } else {
        message.error(response.message);
      }
    },
    *getFilterStudentListPermissions({ payload }, { call, put }) {
      const response = yield call(queryFilterStudentListPermissions, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveFilterStudentListPermissions",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getFilterStudent({ payload }, { call, put }) {
      const response = yield call(queryFilterStudent, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveFilterStudent",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getFilterStudentList({ payload, onSuccess, onFinally }, { call, put }) {
      const response = yield call(queryFilterStudentList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveFilterStudentList",
          payload: response.content,
        });
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
      onFinally && onFinally();
    },
    *getGroupAndGradeScoreRate({ payload }, { call, put }) {
      const response = yield call(queryGroupAndGradeScoreRate, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveGroupAndGradeScoreRate",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getUserByName({ payload }, { call, put }) {
      const response = yield call(queryUserByName, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveUserByName",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *clearUserByName({ payload }, { call, put }) {
      yield put({
        type: "clearUserByNameList",
      });
    },
    *getStuQuestionAnalysisExport({ payload }, { call, put }) {
      const response = yield call(queryStuQuestionAnalysisExport, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStuQuestionAnalysisExport",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getExamPaper({ payload }, { call, put }) {
      const response = yield call(queryExamPaper, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveExamPaper",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getExamPaperResultUrl({ payload }, { call, put }) {
      const response = yield call(queryExamPaperResultUrl, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveExamPaperResultUrlStu",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *postSaveStudySituationStructure({ payload }, { call, put }) {
      const response = yield call(querySaveStudySituationStructure, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveSaveStudySituationStructure",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStudySituationByStudentId({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryStudySituationByStudentId, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
        yield put({
          type: "saveStudySituationByStudentId",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStudySituationStructure({ payload }, { call, put }) {
      const response = yield call(queryStudySituationStructure, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStudySituationStructure",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *postStudentExamList({ payload }, { call, put }) {
      const response = yield call(postStudentExamList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savePostStudentExamList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getEditPaperOrExamName({ payload }, { call, put }) {
      const response = yield call(editPaperOrExamName, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveEditPaperOrExamName",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getTaskPublishDisplay({ payload }, { call, put }) {
      const response = yield call(queryTaskPublishDisplay, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveTaskPublishDisplay",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getExamInfoByExamId({ payload }, { call, put }) {
      const response = yield call(queryExamInfoByExamId, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveExamInfoByExamId",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getPaperInfo({ payload }, { call, put }) {
      const response = yield call(queryPaperInfo, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savePaperInfo",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getCriterionList({ payload }, { call, put }) {
      const response = yield call(queryCriterionList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveCriterionList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getEvaluationItemListByCategoryId({ payload }, { call, put }) {
      const response = yield call(queryEvaluationItemListByCategoryId, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveEvaluationItemListByCategoryId",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getSelectEvaluationCategoryByExample(
      { payload, callback },
      { call, put },
    ) {
      const response = yield call(selectEvaluationCategoryByExample, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveSelectEvaluationCategoryByExample",
          payload: response.content,
        });
        if (callback) callback(response);
      } else {
        message.error(response.message);
      }
    },
    *postResourceCreate({ payload }, { call, put }) {
      const response = yield call(queryResourceCreate, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveResourceCreate",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getViewOrDownPaper({ payload }, { call, put }) {
      const response = yield call(queryViewOrDownPaper, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveViewOrDownPaper",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *postSaveUploadPaper({ payload }, { call, put }) {
      const response = yield call(querySaveUploadPaper, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveUploadPaper",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getLogUser({ payload }, { call, put }) {
      const response = yield call(queryLogUser, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveLogUser",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getGroupStudents({ payload }, { call, put }) {
      const response = yield call(getGroupStudents, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveGetGroupStudents",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *postClassQuestionAnalysis({ payload }, { call, put }) {
      const response = yield call(classQuestionAnalysis, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveClassQuestionAnalysis",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *setClassQuestionAnalysis({ payload }, { call, put }) {
      console.log("payload", payload);
      yield put({
        type: "saveClassQuestionAnalysis",
        payload: payload,
      });
    },
    // 排名分析
    *postComparativeAnalysis({ payload }, { call, put }) {
      const response = yield call(comparativeAnalysis, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveComparativeAnalysis",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 对比考试
    *getExamSelect({ payload }, { call, put }) {
      const response = yield call(examSelect, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveExamSelect",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 文件删除
    *PostDeleteUploadedFile({ payload }, { call, put }) {
      const response = yield call(deleteUploadedFile, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveDeleteUploadedFile",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getTrendStu({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryTrendStu, payload);
      !response.ifLogin && (yield loginRedirect());
      onSuccess && onSuccess(response);
      if (response.status) {
        yield put({
          type: "saveTrendStu",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    //文件绑定
    *PostBindUploadedFile({ payload }, { call, put }) {
      const response = yield call(bindUploadedFile, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveBindUploadedFile",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getReviewUploadedFile({ payload }, { call, put }) {
      const response = yield call(queryReviewUploadedFile, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveReviewUploadedFile",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 质量分析报告 权限
    *PostIdentityJudgement({ payload }, { call, put }) {
      const response = yield call(identityJudgement, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveIdentityJudgement",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getLock(
      { payload, onSuccess, onClashWithOther, onClashWithMe },
      { call, put },
    ) {
      //获取锁
      const response = yield call(getLock, payload);
      if (response.ifLogin) {
        if (response.status) {
          let content = response.content || {};
          if (content.code == 0) {
            //抢锁成功--回显
            yield put({
              type: "updateLockContent",
              payload: {
                elementId: payload.elementId,
                response: response.content, //返回内容
              },
            });
            onSuccess && onSuccess(content);
          } else if (content.code == 1) {
            //A抢占B的锁
            onClashWithOther && onClashWithOther(content);
          } else if (content.code == 2) {
            //A在另一台设备操作，抢占自己的锁
            onClashWithMe && onClashWithMe(content);
          }
        } else {
          message.error(response.message);
        }
      } else {
        message.error(response.message);
      }
    },
    *releaseLock({ payload, onSuccess }, { call, put }) {
      //释放锁
      const response = yield call(releaseLock, payload);
      if (response.ifLogin) {
        if (response.status) {
          //will do
          onSuccess && onSuccess();
        } else {
          message.error(response.message);
        }
      } else {
        message.error(response.message);
      }
    },
    *forceLock({ payload, onSuccess }, { call, put }) {
      //强行抢锁
      const response = yield call(forceLock, payload);
      if (response.ifLogin) {
        if (response.status) {
          let content = response.content || {};
          //强制抢锁成功--回显
          yield put({
            type: "updateLockContent",
            payload: {
              elementId: payload.elementId,
              response: response.content, //返回内容
            },
          });
          onSuccess && onSuccess(content);
        } else {
          message.error(response.message);
        }
      } else {
        message.error(response.message);
      }
    },
    // 编辑
    *postEditReport({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryEditReport, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveEditReport",
          payload: response,
        });
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    // 班级分数分层修改
    *postUpdateStage({ payload }, { call, put }) {
      const response = yield call(queryUpdateStage, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveUpdateStage",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 得分率分析
    *getScoringRate({ payload }, { call, put }) {
      const response = yield call(queryScoringRate, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveScoringRate",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStudentOriginal({ payload }, { call, put }) {
      const response = yield call(queryStudentOriginal, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStudentOriginal",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAnswerDetails({ payload }, { call, put }) {
      const response = yield call(queryAnswerDetails, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAnswerDetails",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getGroupContrast({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryGroupContrast, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveGroupContrast",
          payload: response.content,
        });
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *getPaperTypeList({ payload }, { call, put }) {
      const response = yield call(queryType, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveType",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 获取当前学期信息
    *getSemesterInfo({ payload }, { call, put }) {
      const response = yield call(queryCurrentSemester, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveCurrentSemester",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getModifyAnalysisDimension({ payload }, { call, put }) {
      const response = yield call(queryModifyAnalysisDimension, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveModifyAnalysisDimension",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
      return response;
    },
    *getIndividuationTest({ payload }, { call, put }) {
      const response = yield call(queryIndividuationTest, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveIndividuationTest",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    //展示试卷下的维度列表
    *getDimensionAnalysis({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryDimensionAnalysis, payload);
      console.log("msg：", "dimensionAnalysis 接口调用结束");
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveDimensionAnalysis",
          payload: response.content,
        });
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *clearDimensionAnalysis({ payload, onSuccess }, { call, put }) {
      yield put({
        type: "saveDimensionAnalysis",
        payload: [],
      });
    },
    *clearPersonal({ payload }, { call, put }) {
      yield put({
        type: "clearPersonalList",
      });
    },
    // 不及格人数
    *postFlunkListByStudent({ payload }, { call, put }) {
      const response = yield call(queryFlunkListByStudent, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveFlunkListByStudent",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 不及格人数
    *postFlunkListByStudent1({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryFlunkListByStudent1, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveFlunkListByStudent",
          payload: response.content,
        });
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },

    *clearDetail({ payload }, { call, put }) {
      yield put({
        type: "saveAnswerDetails",
        payload: [],
      });
    },
    *clearDetailView({ payload }, { call, put }) {
      yield put({
        type: "clearViewData",
      });
    },
    *postCorrection({ payload, onSuccess, onFinally }, { call, put }) {
      const response = yield call(queryCorrection, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveCorrection",
          payload: response.content,
        });
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
      onFinally && onFinally();
    },
    *getWrongQuestionAnalysis({ payload }, { call, put }) {
      const response = yield call(queryWrongQuestionAnalysis, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveWrongQuestionAnalysis",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getGroupResult({ payload }, { call, put }) {
      const response = yield call(queryGroupResult, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveWrongQuestionAnalysis",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *saveGroup({ payload }, { call, put }) {
      const response = yield call(querySaveGroup, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
      } else {
        message.error(response.message);
      }
    },
    // 分数订正历史
    *getReductionHistory({ payload }, { call, put }) {
      const response = yield call(queryReductionHistory, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveReductionHistory",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 素养指标绑定试卷
    *getAttainmentTest({ payload }, { call, put }) {
      const response = yield call(queryAttainmentTest, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAttainmentTest",
          payload: response.content,
        });
      } else {
        if (response.content) {
          yield put({
            type: "saveAttainmentTest",
            payload: response.content,
          });
        }
        message.error(response.message);
      }
      return response;
    },
    *getOssAssume({ payload, onSuccess }, { call, put }) {
      //获取oss授权地址
      const response = yield call(getOssAssume, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "ossAssumeResponse",
            payload: response.content,
          });
          onSuccess && onSuccess();
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    // 下载素养
    *getDownloadLiteracy({ payload }, { call, put }) {
      const response = yield call(queryDownloadLiteracy, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveOriginalVolumeDownload",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    //原卷/印刷卷下载
    *OriginalVolumeDownload({ payload }, { call, put }) {
      const response = yield call(queryOriginalVolumeDownload, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveOriginalVolumeDownload",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 历史试卷列表
    *historyTestList({ payload }, { call, put }) {
      const response = yield call(queryhistoryTestList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savehistoryTestList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getScoreSetting({ payload }, { call, put }) {
      const response = yield call(queryScoreSetting, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savequeryScoreSetting",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // getSettingRateValue
    *getSettingRateValue({ payload, onSuccess }, { call, put }) {
      const response = yield call(getSettingRateValue, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response && response.content);
      } else {
        message.error(response.message);
      }
    },
    *getIfAdmin({ payload, onSuccess }, { call, put }) {
      const response = yield call(getIfAdmin, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response && response.content);
      } else {
        message.error(response.message);
      }
    },
    *saveSettingRate({ payload, onSuccess }, { call, put }) {
      const response = yield call(saveSettingRate, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess();
        message.success(response && response.message);
      } else {
        message.error(response.message);
      }
    },
    // 修改试卷
    *ModifyTest({ payload }, { call, put }) {
      const response = yield call(queryModifyTest, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveModifyTest",
          payload: response,
        });
      } else {
        yield put({
          type: "saveModifyTest",
          payload: response,
        });
        // message.error(response.message);
      }
    },
    //获取修改参数
    *getInquireTest({ payload }, { call, put }) {
      const response = yield call(queryInquireTest, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveInquireTest",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 删除考试列表
    *DeleteTestList({ payload, onSuccess, onFinally }, { call, put }) {
      const response = yield call(queryDeleteTestList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveDeleteTestList",
          payload: response.content,
        });
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
      onFinally && onFinally();
    },
    *getKnowLedgeTable({ payload }, { call, put }) {
      let response;
      let newPay;
      if (payload.analyseType === 1) {
        newPay = {
          examId: payload.examId,
          studentName: payload.studentName,
          studentId: payload.studentId,
          groupId: payload.groupId,
          type: payload.type,
          filterFlag: payload.filterFlag,
        };
        response = yield call(queryKnowLedgeStu, newPay);
      } else {
        newPay = {
          examId: payload.examId,
          type: payload.type,
          filterFlag: payload.filterFlag,
        };
        if (payload.isGroupId) {
          newPay.groupId = payload.groupId;
        }
        response = yield call(queryKnowLedgeTable, newPay);
      }
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveKnowLedgeTable",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAllTestSubject({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryAllTestSubject, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveTestSubject",
          payload: response.content,
        });
        onSuccess && onSuccess(response.content);
      } else {
        message.error(response.message);
      }
    },
    *getPaperList({ payload, onSuccess, onFinally }, { call, put }) {
      const response = yield call(queryPaperList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savePaperList",
          payload: response.content,
        });
        yield put({
          type: "changePaperStatus",
          payload: response.status,
        });
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
      onFinally && onFinally();
    },
    *getPaperListSearch({ payload }, { call, put }) {
      const response = yield call(queryPaperList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savePaperListSearch",
          payload: response.content,
        });
        // yield put({
        //   type: "changePaperStatus",
        //   payload: response.status,
        // });
      } else {
        message.error(response.message);
      }
    },
    *getTrendAnalysisResultNew({ payload }, { call, put }) {
      const response = yield call(queryTrendAnalysisResultNew, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveTrendAnalysisResultNew",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getTrend({ payload }, { call, put }) {
      const response = yield call(queryTrend, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveTrend",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getView({ payload }, { call, put }) {
      const response = yield call(queryView, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveViewData",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *changeTabKey({ payload }, { put }) {
      yield put({
        type: "saveTabKey",
        payload: payload,
      });
    },
    *getDataSource({ payload }, { call, put }) {
      const response = yield call(queryDataSource, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveDataSource",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAllGrade({ payload }, { call, put }) {
      const response = yield call(queryAllGrade, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAllGrade",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *changePurview({ payload, onSuccess }, { call, put }) {
      const response = yield call(changeManagement, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *sendParent({ payload }, { call, put }) {
      const response = yield call(sendAllParent, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
      } else {
        message.error(response.message);
      }
    },
    *clearPdf({ payload }, { call, put }) {
      yield put({
        type: "clearPdfUrl",
      });
    },
    *uploadExam({ payload }, { call, put }) {
      const response = yield call(postExam, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savePdfUrl",
          payload: response,
        });
      } else {
        yield put({
          type: "savePdfUrl",
          payload: response,
        });
        // message.error(response.message);
      }
    },
    *getExamType({ payload }, { call, put }) {
      const response = yield call(queryExamType, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveExamType",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getMobileRadar({ payload }, { call, put }) {
      const response = yield call(queryMobileRadar, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveMobileData",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAllSubject({ payload }, { call, put }) {
      const response = yield call(queryAllSubject, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAllSubject",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getGradeClass({ payload }, { call, put }) {
      const response = yield call(queryGradeClass, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveClassList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getOptions({ payload }, { call, put }) {
      const response = yield call(queryExamOptions, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveOptions",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getExamCorrection({ payload, onSuccess }, { call, put }) {
      const response = yield call(getExamCorrection, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response && response.content);
      } else {
        message.error(response.message);
      }
    },
    *examCorrection({ payload, onSuccess }, { call, put }) {
      const response = yield call(examCorrection, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess();
        message.success(response.message);
      } else {
        message.error(response.message);
      }
    },
    *getExamTypeUpdate({ payload, onSuccess }, { call, put }) {
      const response = yield call(getExamType, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response && response.content);
      } else {
        message.error(response.message);
      }
    },
    *getExamRuleData({ payload, onSuccess }, { call, put }) {
      const response = yield call(getExamRuleData, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response && response.content);
      } else {
        message.error(response.message);
      }
    },
    *updateExamTableData({ payload, onSuccess }, { call, put }) {
      const response = yield call(updateExamTableData, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess();
        message.success(response.message);
      } else {
        message.error(response.message);
      }
    },
    *getStuGrade({ payload, callback }, { call, put }) {
      const response = yield call(queryStuGrade, payload);
      !response.ifLogin && (yield loginRedirect());
      if (callback) callback(response);
      if (response.status) {
        yield put({
          type: "saveGradeList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getExam({ payload }, { call, put }) {
      const response = yield call(queryExam, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveExamList",
          payload: response.content,
        });
        yield put({
          type: "changeInfoList",
          payload: response.status,
        });
      } else {
        message.error(response.message);
      }
    },
    *getSubjectByStage({ payload, callback }, { call, put }) {
      const response = yield call(querySubjectByGrade, payload);
      !response.ifLogin && (yield loginRedirect());
      if (callback) callback(response);
      if (response.status) {
        yield put({
          type: "saveStageSubject",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *subjectListByGrades({ payload, callback }, { call, put }) {
      const response = yield call(subjectListByGrades, payload);
      !response.ifLogin && (yield loginRedirect());
      if (callback) callback(response);
      if (response.status) {
        yield put({
          type: "saveStageSubject",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },

    *getSubjectList({ payload }, { call, put }) {
      const response = yield call(querySubjectList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveSubjectList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAnalysis({ payload }, { call, put }) {
      const response = yield call(queryAnalysis, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveViewData",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getpersonal({ payload }, { call, put }) {
      console.log(payload, "pp");
      const response = yield call(querypersonal, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savePersonal",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *upStuFile({ payload, onSuccess }, { call, put }) {
      const response = yield call(uploadStuFile, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *getQuestionScore({ payload }, { call, put }) {
      const response = yield call(queryQuestionScore, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveQuestionScore",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStuScore({ payload }, { call, put }) {
      const response = yield call(queryStuScore, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStuScore",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getScoreRate({ payload }, { call, put }) {
      const response = yield call(queryScoreRate, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveScoreRate",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getPartScore({ payload }, { call, put }) {
      const response = yield call(queryQuestionScore, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savePartScore",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getPartScoreB({ payload }, { call, put }) {
      const response = yield call(queryQuestionScore, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savePartScoreB",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getScoreSection({ payload }, { call, put }) {
      const response = yield call(queryScoreSection, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveScoreSection",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *clearQuestionScore({ payload }, { put }) {
      yield put({
        type: "clearQuestionTable",
      });
    },
    *clearKnowLedgeAnalysis({ payload }, { put }) {
      yield put({
        type: "clearKnowLedgeTable",
      });
    },
    *clearKnowledgePointReportWithGroup({ payload }, { put }) {
      yield put({
        type: "clearKnowledgePointReportWithGroup",
      });
    },
    *clearPartScore({ payload }, { put }) {
      yield put({
        type: "clearPartTable",
      });
    },
    *clearPartScoreB({ payload }, { put }) {
      yield put({
        type: "clearPartTableB",
      });
    },
    *clearScoreRate({ payload }, { put }) {
      yield put({
        type: "clearScoreRateTable",
      });
    },
    *clearScoreSection({ payload }, { put }) {
      yield put({
        type: "clearScoreSectionTable",
      });
    },
    *hoverIndex({ payload }, { put }) {
      yield put({
        type: "saveHoverIndex",
        payload: payload.hoverIndex,
      });
    },
    *getDownload({ payload }, { call, put }) {
      const response = yield call(queryDownload, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveDown",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *hoverIndexc({ payload }, { put }) {
      yield put({
        type: "saveHoverIndexc",
        payload: payload.hoverIndexc,
      });
    },
    *getgroupScore({ payload }, { call, put }) {
      const response = yield call(groupScoreAnalyse, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savegroupScore",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getScoreSummary({ payload }, { call, put }) {
      const response = yield call(queryScoreSummary, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savegScoreSummary",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getScoreSummary1({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryScoreSummary1, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savegScoreSummary",
          payload: response.content,
        });
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *getTestView({ payload, onSuccess, onError, onFinally }, { call, put }) {
      const response = yield call(queryTestView, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveViewData",
          payload: response.content,
        });
        onSuccess && onSuccess(response);
      } else {
        onError && onError(response.content);
        message.error(response.message);
      }
      onFinally && onFinally();
    },
    *getdownloadUrl({ payload }, { call, put }) {
      const response = yield call(queryDownloadUrl, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveUrl",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *clearUrl({ payload }, { call, put }) {
      yield put({
        type: "clearDownUrl",
      });
    },
    *getScoreAnalysis({ payload }, { call, put }) {
      //按班级查看统计分析
      const response = yield call(queryScoreAnalysis, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveScoreData",
            payload: response.content || {},
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *clearGroupScore({ pauload }, { put }) {
      yield put({
        type: "clearGroupScoreList",
      });
    },
    *getTestStatus({ payload }, { call, put }) {
      const response = yield call(queryIsTest, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveTestStatus",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStuInfo({ payload }, { call, put }) {
      const response = yield call(queryStuInfo, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStuInfo",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *checkBasketTab({ payload }, { put }) {
      yield put({
        type: "saveBasketTab",
        payload: payload,
      });
    },
    *startExam({ payload }, { call, put }) {
      const response = yield call(stuStart, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStartTime",
          payload: response.content,
        });
      } else if (!isAnswerTimeLimitMessage(response.message)) {
        message.error(response.message);
      }
      return response;
    },
    *queryYear({ payload }, { call, put }) {
      const response = yield call(getYear, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveYearList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getQuestion({ payload }, { call, put }) {
      const response = yield call(queryQuestion, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield payload.pageNo === 1 || payload.isNoCancat
          ? put({
              type: "saveQuestion",
              payload: response.content,
            })
          : put({
              type: "cancatQuestion",
              payload: response.content,
            });
      } else {
        message.error(response.message);
      }
    },
    *updateQuestionKnowlegeOrLevel({ payload }, { call, put }) {
      const response = yield call(updateQuestionKnowlegeOrLevel, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveQuestionKnowlegeOrLevel",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *deleteItem({ payload, success }, { call, put }) {
      const response = yield call(deleteQuestion, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "reloadQuestion",
          payload: payload.questionBankId,
        });
        success && success();
      } else {
        message.error(response.message);
      }
    },
    *getCount({ payload }, { call, put }) {
      const response = yield call(queryCount, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveCount",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getBasketList({ payload }, { call, put }) {
      const response = yield call(queryBasket, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveBasket",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getV2BasketList({ payload }, { call, put }) {
      const response = yield call(queryQuestionV2BasketSummary, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({ type: "saveBasket", payload: response.content });
      } else {
        message.error(response.message);
      }
    },
    *getStuAnalysis({ payload }, { call, put }) {
      //按学生查看统计分析
      const response = yield call(queryStuAnalysis, payload);
      console.log(response, "res");
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveStuData",
            payload: response.content || {},
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getQuestionAnalysis({ payload }, { call, put }) {
      //按试题查看分析
      const response = yield call(getQuestionAnalysis, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveQuestionData",
            payload: response.content || {},
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getItem({ payload }, { call, put }) {
      const response = yield call(updateItem, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveItem",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *questionAnalysis({ payload }, { call, put }) {
      const response = yield call(queryQuestionAnalysis, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveQuestionAnalysis",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStudentScore({ payload }, { call, put }) {
      const response = yield call(queryStudentScore, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStudentTest",
          payload: response.content,
        });
      } else if (!isAnswerTimeLimitMessage(response.message)) {
        message.error(response.message);
      }
      return response;
    },
    *upQuestionItem({ payload }, { put }) {
      yield put({
        type: "updateQuestionListItem",
        payload,
      });
    },
    *updateQuestion({ payload }, { put }) {
      yield put({
        type: "deleteItemQuestion",
        payload,
      });
    },
    *getStudentTest({ payload }, { call, put }) {
      const response = yield call(queryStudentTest, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStudentTest",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
      return response;
    },
    *getKnowLedgeAnalysis({ payload }, { call, put }) {
      const response = yield call(queryKnowLedgeAnalysis, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveKnwoLedgeAnalysisList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getWrongQuestion({ payload }, { call, put }) {
      const response = yield call(queryWrongQuestion, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveWrongQuestion",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getClass({ payload, callback }, { call, put }) {
      const response = yield call(queryClass, payload);
      !response.ifLogin && (yield loginRedirect());
      if (callback) callback(response);
      if (response.status) {
        yield put({
          type: "saveClass",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getcpmpareTest({ payload }, { call, put }) {
      const response = yield call(queryCompareTest, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveCompareTest",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *changeDrop({ payload }, { put }) {
      yield put({
        type: "changeViewData",
        payload: payload,
      });
    },
    *changeSearch({ payload }, { put }) {
      yield put({
        type: "changeSearchValue",
        payload: payload,
      });
    },
    *deteleTest({ payload }, { call, put }) {
      const response = yield call(testDelete, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        yield put({
          type: "updateTestList",
          payload: payload.paperId,
        });
      } else {
        message.error(response.message);
      }
    },
    *examDelete({ payload }, { call, put }) {
      const response = yield call(examDelete, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        yield put({
          type: "updateTestList",
          payload: payload.paperId,
        });
      } else {
        message.error(response.message);
      }
    },
    *submitView({ payload, onSuccess, onFinally }, { call, put }) {
      const response = yield call(submitViewApi, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        // message.success(response.message);
        yield put({
          type: "createExampleId",
          payload: response.content,
        });
        onSuccess(response);
      } else {
        message.error(response.message);
      }
      onFinally && onFinally();
    },
    *submitScoreSectionPlan({ payload, onSuccess }, { call, put }) {
      const response = yield call(scoreSectionPlan, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *getPrintingPaper({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryPrintingPaper, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *stuSubmit({ payload }, { call, put }) {
      const response = yield call(stuSubmitTest, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        yield put({
          type: "saveTestStatus",
          payload: true,
        });
      } else {
        message.error(response.message);
      }
      return response;
    },
    *getTest({ payload }, { call, put }) {
      const response = yield call(queryTest, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield payload.pageNo === 1
          ? put({
              type: "saveTestList",
              payload: response.content,
            })
          : put({
              type: "concatTestList",
              payload: response.content,
            });
      } else {
        message.error(response.message);
      }
    },
    *getViewChart({ payload }, { call, put }) {
      const response = yield call(queryViewChart, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveViewChart",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *clearView({ payload }, { put }) {
      yield put({
        type: "clearViewChart",
      });
    },
    *clearQuestionList({ payload }, { put }) {
      yield put({
        type: "clearQuestionListModal",
      });
    },
    *clearQuestionItem({ payload }, { put }) {
      yield put({
        type: "clearQuestion",
      });
    },
    *getPersonAnalysis({ payload }, { call, put }) {
      //获取班级统计人数
      const response = yield call(getPersonAnalysis, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "personAnalysis",
            payload: response.content,
          });
        } else {
          yield put({
            type: "personAnalysis",
            payload: [],
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getAnswerRate({ payload }, { call, put }) {
      //按学生查看，班级答题情况
      const response = yield call(getAnswerRate, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "classAnswerRate",
            payload: response.content,
          });
        } else {
          yield put({
            type: "classAnswerRate",
            payload: [],
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getClassList({ payload, callback }, { call, put }) {
      //获取班级名称
      const response = yield call(getClassList, payload);
      if (response.ifLogin) {
        if (callback) callback(response);
        if (response.status) {
          yield put({
            type: "updateClassList",
            payload: response.content,
          });
        } else {
          yield put({
            type: "updateClassList",
            payload: [],
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *changeHistoryTestList({ payload }, { call, put }) {
      yield put({
        type: "save",
        payload: {
          historyTestList: payload.historyTestList,
        },
      });
    },
    *changeAttainmentTest({ payload }, { call, put }) {
      yield put({
        type: "saveAttainment",
        payload: {
          attainmentTest: payload.attainmentTest,
        },
      });
    },
    *changeDownload({ payload }, { call, put }) {
      yield put({
        type: "saveDownload",
        payload: {
          originalVolumeDownload: payload.originalVolumeDownload,
        },
      });
    },
    // 逐题分析
    *questionAnalysisList({ payload }, { call, put }) {
      const response = yield call(singleQuestionAnalysis, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "questionAnalysisReducer",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 逐题分析
    *reducerSaveViewData({ payload }, { call, put }) {
      yield put({
        type: "saveViewData",
        payload: payload,
      });
    },

    *setTestStatus({ payload }, { call, put }) {
      yield put({
        type: "saveTestStatus",
        payload: payload,
      });
    },
  },

  reducers: {
    saveViewData(state, action) {
      return {
        ...state,
        viewData: action.payload,
      };
    },
    savePersonal(state, action) {
      return {
        ...state,
        personalList: action.payload,
      };
    },
    saveScoreRate(state, action) {
      return {
        ...state,
        scoreRateTable: action.payload,
      };
    },
    saveScoreSection(state, action) {
      return {
        ...state,
        scoreSection: action.payload,
      };
    },
    savegScoreSummary(state, action) {
      return {
        ...state,
        scoreSummary: action.payload,
      };
    },
    saveTestStatus(state, action) {
      return {
        ...state,
        testStatus: action.payload,
      };
    },
    clearDownUrl(state, action) {
      return {
        ...state,
        downLoadRul: null,
      };
    },
    saveKnowLedgeTable(state, action) {
      return {
        ...state,
        knowLedgeAnalysis: action.payload,
      };
    },
    clearViewChart(state, action) {
      return {
        ...state,
        viewChart: {},
      };
    },
    saveUrl(state, action) {
      return {
        ...state,
        downLoadRul: action.payload,
      };
    },
    updateQuestionListItem(state, action) {
      return {
        ...state,
        questionList: action.payload,
      };
    },
    saveKnwoLedgeAnalysisList(state, action) {
      return {
        ...state,
        knwoLedgeAnalysisList: action.payload,
      };
    },
    saveTabKey(state, action) {
      return {
        ...state,
        tabKey: action.payload,
      };
    },
    saveStuInfo(state, action) {
      return {
        ...state,
        stuInfoList: action.payload,
      };
    },
    savePdfUrl(state, action) {
      return {
        ...state,
        wordPdfUrl: action.payload,
      };
    },
    saveAllGrade(state, action) {
      return {
        ...state,
        allGrade: action.payload,
      };
    },
    saveStageSubject(state, action) {
      return {
        ...state,
        stageSubjectList: action.payload,
      };
    },
    saveSubjectList(state, action) {
      return {
        ...state,
        subjectListTest: action.payload,
      };
    },
    saveStuData(state, action) {
      console.log("hhb", action.payload);
      return {
        ...state,
        stuData: action.payload,
      };
    },
    saveWrongQuestion(state, action) {
      return {
        ...state,
        wrongQuestion: action.payload,
      };
    },
    savequeryScoreSetting(state, action) {
      return {
        ...state,
        scoreSettingList: action.payload,
      };
    },
    clearPersonalList(state, action) {
      return {
        ...state,
        personalList: [],
      };
    },
    clearUserByNameList(state, action) {
      // debugger;
      return {
        ...state,
        userByNameList: [],
      };
    },
    saveDataSource(state, action) {
      return {
        ...state,
        dataSource: action.payload,
      };
    },
    saveQuestionAnalysis(state, action) {
      return {
        ...state,
        questionData: action.payload,
      };
    },
    saveStuScore(state, action) {
      console.log(action, "acac");
      return {
        ...state,
        stuScore: action.payload,
      };
    },
    saveClassList(state, action) {
      return {
        ...state,
        classList: action.payload,
      };
    },
    saveDown(state, action) {
      console.log(action.payload, "[");
      return {
        ...state,
        downloadPdf: action.payload,
      };
    },
    saveIndexImg(state, action) {
      return {
        ...state,
        indexImg: action.payload,
      };
    },
    saveWrongQuestionAnalysis(state, action) {
      return {
        ...state,
        wrongQuestionAnalysis: action.payload,
      };
    },
    // clearPdfUrl(state, action) {
    //   return {
    //     ...state,
    //     wordPdfUrl: "",
    //     modifyTest: {},
    //   };
    // },
    changePaperStatus(state, action) {
      return {
        ...state,
        paperStatus: action.payload,
      };
    },
    clearQuestionTable(state, action) {
      return {
        ...state,
        questionScore: {},
      };
    },
    clearKnowLedgeTable(state, action) {
      return {
        ...state,
        knowLedgeAnalysis: {},
      };
    },
    clearKnowledgePointReportWithGroup(state, action) {
      return {
        ...state,
        knowledgePointReportWithGroup: {},
      };
    },
    saveExamType(state, action) {
      return {
        ...state,
        examTypeList: action.payload,
      };
    },
    saveTrendAnalysisResultNew(state, action) {
      return {
        ...state,
        newTrendList: action.payload,
      };
    },
    saveTrend(state, action) {
      return {
        ...state,
        trendList: action.payload,
      };
    },
    clearPartTable(state, action) {
      return {
        ...state,
        partScore: {},
      };
    },
    clearPartTableB(state, action) {
      return {
        ...state,
        partScoreB: {},
      };
    },
    clearScoreRateTable(state, action) {
      return {
        ...state,
        scoreRateTable: {},
      };
    },
    saveViewChart(state, action) {
      return {
        ...state,
        viewChart: action.payload,
      };
    },
    saveAllSubject(state, action) {
      return {
        ...state,
        allSubject: action.payload,
      };
    },
    saveMobileData(state, action) {
      return {
        ...state,
        mobileData: action.payload,
      };
    },
    clearScoreSectionTable(state, action) {
      return {
        ...state,
        scoreSection: {},
      };
    },
    saveHoverIndex(state, action) {
      console.log(action.payload, "sasasa");
      return {
        ...state,
        hoverIndex: action.payload,
      };
    },
    saveHoverIndexc(state, action) {
      return {
        ...state,
        hoverIndexc: action.payload,
      };
    },
    saveExamList(state, action) {
      return {
        ...state,
        examList: action.payload,
      };
    },
    saveTable(state, action) {
      return {
        ...state,
        tableData: action.payload,
      };
    },
    saveStudentSummaryDashboard(state, action) {
      return {
        ...state,
        studentSummaryDashboard: action.payload,
      };
    },
    changeInfoList(state, action) {
      return {
        ...state,
        infoStatus: action.payload,
      };
    },
    saveStudentTest(state, action) {
      console.log(action, "1111");
      return {
        ...state,
        studentTest: action.payload,
      };
    },
    clearStudentTest(state, action) {
      return {
        ...state,
        studentTest: {},
      };
    },
    saveSpecial(state, action) {
      return {
        ...state,
        specialList: action.payload,
      };
    },
    saveYearList(state, action) {
      return {
        ...state,
        yearList: action.payload,
      };
    },
    saveOptions(state, action) {
      return {
        ...state,
        examOptions: action.payload,
      };
    },
    saveQuestion(state, action) {
      return {
        ...state,
        questionList: action.payload.data,
        questionTotal: action.payload.total,
      };
    },
    saveQuestionKnowlegeOrLevel(state, action) {
      return {
        ...state,
        updateQuestionKnowlegeOrLevel: action.payload,
      };
    },
    saveList(state, action) {
      return {
        ...state,
        paperIndexList: action.payload,
      };
    },
    saveQuestionScore(state, action) {
      console.log("come");
      return {
        ...state,
        questionScore: action.payload,
      };
    },
    savePartScore(state, action) {
      return {
        ...state,
        partScore: action.payload,
      };
    },
    savePartScoreB(state, action) {
      return {
        ...state,
        partScoreB: action.payload,
      };
    },
    saveGradeList(state, action) {
      return {
        ...state,
        stuGradeList: action.payload,
      };
    },
    saveItem(state, action) {
      console.log(" --->");
      return {
        ...state,
        questionItem: action.payload,
      };
    },
    clearQuestion(state, action) {
      console.log(" --->");
      return {
        ...state,
        questionItem: {},
      };
    },
    clearQuestionListModal(state, action) {
      return {
        ...state,
        questionList: [],
      };
    },
    saveTestList(state, action) {
      return {
        ...state,
        testList: action.payload,
      };
    },
    saveClass(state, action) {
      return {
        ...state,
        tableClass: action.payload,
      };
    },
    saveCompareTest(state, action) {
      return {
        ...state,
        compareTest: action.payload,
      };
    },
    saveScoreData(state, action) {
      return {
        ...state,
        scoreData: action.payload,
      };
    },
    saveTrendStu(state, action) {
      return {
        ...state,
        trendStuList: action.payload,
      };
    },
    saveAnalysis(state, action) {
      return {
        ...state,
        analysisDetail: action.payload,
      };
    },
    savegroupScore(state, action) {
      return {
        ...state,
        groupScoreList: action.payload,
      };
    },
    reloadQuestion(state, action) {
      let list = JSON.parse(JSON.stringify(state.questionList));
      list.map((item, index) => {
        if (action.payload === item.id) {
          list.splice(index, 1);
        }
      });
      console.log(list, "lll");
      return {
        ...state,
        questionList: list,
      };
    },
    updateTestList(state, action) {
      let list = JSON.parse(JSON.stringify(state.testList));
      list.map((item, index) => {
        if (action.payload === item.id) {
          list.splice(index, 1);
        }
      });
      console.log(list, "lll");
      return {
        ...state,
        testList: list,
      };
    },
    updateQuestionList(state, { payload }) {
      console.log("come");
      let list = JSON.parse(JSON.stringify(state.questionList));
      if (list && list.length > 0) {
        list.map((item) => {
          if (item.id === payload) {
            item.isInQuestionBasket = !item.isInQuestionBasket;
          }
        });
      }
      return {
        ...state,
        questionList: list,
      };
    },
    updateTest(state, { payload }) {
      console.log(payload, "sss");
      let list = JSON.parse(JSON.stringify(state.questionList));
      if (list && list.length > 0) {
        list.map((item) => {
          if (item.id === payload) {
            item.inPaper = !item.inPaper;
          }
        });
      }
      return {
        ...state,
        questionList: list,
      };
    },
    clearViewData(state, action) {
      return {
        ...state,
        viewData: {},
      };
    },
    clearGroupScoreList(state, action) {
      return {
        ...state,
        groupScoreList: [],
      };
    },
    deleteItemQuestion(state, { payload }) {
      console.log("come");
      let list = JSON.parse(JSON.stringify(state.questionList));
      if (list && list.length > 0) {
        list.map((item, index) => {
          if (item.id === payload) {
            list.splice(index, 1);
          }
        });
      }
      return {
        ...state,
        questionList: list,
      };
    },
    cancatQuestion(state, action) {
      let list = JSON.parse(JSON.stringify(state.questionList));
      const newList = list.concat(action.payload.data);
      return {
        ...state,
        questionList: newList,
        questionTotal: action.payload.total,
      };
    },
    saveBasket(state, action) {
      return {
        ...state,
        basketList: action.payload,
        basketSubjectId:
          action.payload && action.payload.length > 0
            ? action.payload[0].subjectId
            : null,
      };
    },
    concatTestList(state, action) {
      let list = JSON.parse(JSON.stringify(state.testList));
      const newList = list.concat(action.payload);
      return {
        ...state,
        testList: newList,
      };
    },
    saveCount(state, action) {
      return {
        ...state,
        count: action.payload,
      };
    },
    changeSearchValue(state, action) {
      console.log(action);
      return {
        ...state,
        ...action.payload,
      };
    },
    saveBasketTab(state, action) {
      return {
        ...state,
        basketSubjectId: action.payload,
      };
    },
    saveStartTime(state, action) {
      return {
        ...state,
        startTime: action.payload,
      };
    },
    changeViewData(state, action) {
      let newState = Object.assign({}, state);
      newState["viewData"]["moduleList"] = action.payload;
      return {
        ...newState,
      };
    },

    personAnalysis(state, action) {
      return {
        ...state,
        analysisPersonData: action.payload,
      };
    },
    classAnswerRate(state, action) {
      return {
        ...state,
        answerRateData: action.payload,
      };
    },
    updateClassList(state, action) {
      return {
        ...state,
        classListData: action.payload,
      };
    },
    createExampleId(state, action) {
      return {
        ...state,
        exampleId: action.payload,
      };
    },
    saveQuestionData(state, action) {
      return {
        ...state,
        questionAnalysisData: action.payload,
      };
    },
    savePaperList(state, action) {
      return {
        ...state,
        paperList: action.payload,
      };
    },
    savePaperListSearch(state, action) {
      return {
        ...state,
        paperSearchList: action.payload,
      };
    },
    saveTestSubject(state, action) {
      return {
        ...state,
        testSubject: action.payload,
      };
    },
    saveDeleteTestList(state, action) {
      return {
        ...state,
        deleteTestList: action.payload,
      };
    },
    saveInquireTest(state, action) {
      return {
        ...state,
        inquireTest: action.payload,
      };
    },
    saveLogUser(state, action) {
      return {
        ...state,
        logUser: action.payload,
      };
    },
    saveModifyTest(state, action) {
      console.log(action.payload, "pp");
      return {
        ...state,
        modifyTest: action.payload,
      };
    },
    savehistoryTestList(state, action) {
      return {
        ...state,
        historyTestList: action.payload,
      };
    },
    saveOriginalVolumeDownload(state, action) {
      return {
        ...state,
        originalVolumeDownload: action.payload,
      };
    },
    save(state, { payload: newState }) {
      return { ...state, ...newState };
    },
    saveDownload(state, { payload: newState }) {
      return { ...state, ...newState };
    },
    ossAssumeResponse(state, action) {
      return {
        ...state,
        ossAssumeResult: action.payload,
      };
    },
    saveAttainmentTest(state, action) {
      return {
        ...state,
        attainmentTest: action.payload,
      };
    },
    saveAttainment(state, { payload: newState }) {
      return { ...state, ...newState };
    },
    saveReductionHistory(state, action) {
      return {
        ...state,
        reductionHistory: action.payload,
      };
    },
    saveCorrection(state, action) {
      return {
        ...state,
        correction: action.payload,
      };
    },
    saveFlunkListByStudent(state, action) {
      return {
        ...state,
        flunkListByStudent: action.payload,
      };
    },
    saveDimensionAnalysis(state, action) {
      return {
        ...state,
        dimensionAnalysis: action.payload,
      };
    },
    saveModifyAnalysisDimension(state, action) {
      return {
        ...state,
        modifyAnalysisDimension: action.payload,
      };
    },
    saveIndividuationTest(state, action) {
      return {
        ...state,
        individuationTest: action.payload,
      };
    },
    saveCurrentSemester(state, action) {
      return {
        ...state,
        currentSemester: action.payload,
      };
    },
    saveType(state, action) {
      return {
        ...state,
        typeList: action.payload,
      };
    },
    saveGroupContrast(state, action) {
      return {
        ...state,
        groupContrast: action.payload,
      };
    },
    saveAnswerDetails(state, action) {
      return {
        ...state,
        answerDetails: action.payload,
      };
    },
    saveStudentOriginal(state, action) {
      return {
        ...state,
        studentOriginal: action.payload,
      };
    },
    saveScoringRate(state, action) {
      return {
        ...state,
        reportPresentationList: action.payload,
      };
    },
    saveUpdateStage(state, action) {
      return {
        ...state,
        updateStage: action.payload,
      };
    },
    saveEditReport(state, action) {
      console.log(action.payload, "44");
      return {
        ...state,
        editReport: action.payload,
      };
    },
    //抢锁成功获取该模块最新内容，更新日课详情该模块
    updateLockContent(state, action) {
      // let activityDetail = JSON.parse(JSON.stringify(state.activityDetail)),
      //   elementId = action.payload.elementId,
      //   response = action.payload.response || {};
      // let elementContentResponseList =
      //     activityDetail.elementContentResponseList || [],
      //   newContent = response.content;
      // //获取最新内容-替换props
      // for (let i = 0; i < elementContentResponseList.length; i++) {
      //   if (elementContentResponseList[i]["elementId"] == elementId) {
      //     elementContentResponseList[i]["elementContent"] = newContent;
      //     break;
      //   }
      // }
      // activityDetail["elementContentResponseList"] = elementContentResponseList;
      return {
        ...state,
        // activityDetail: activityDetail,
        lockContent: action.payload,
      };
    },
    saveIdentityJudgement(state, action) {
      return {
        ...state,
        identityJudgement: action.payload,
      };
    },
    saveReviewUploadedFile(state, action) {
      return {
        ...state,
        reviewUploadedFile: action.payload,
      };
    },
    saveBindUploadedFile(state, action) {
      return {
        ...state,
        bindUploadedFile: action.payload,
      };
    },
    saveDeleteUploadedFile(state, action) {
      return {
        ...state,
        deleteUploadedFile: action.payload,
      };
    },
    saveComparativeAnalysis(state, action) {
      return {
        ...state,
        comparativeAnalysis: action.payload,
      };
    },
    saveExamSelect(state, action) {
      return {
        ...state,
        examSelect: action.payload,
      };
    },
    saveClassQuestionAnalysis(state, action) {
      return {
        ...state,
        classQuestionAnalysis: action.payload,
      };
    },
    saveGetGroupStudents(state, action) {
      return {
        ...state,
        getGroupStudents: action.payload,
      };
    },
    saveUploadPaper(state, action) {
      return {
        ...state,
        uploadPaper: action.payload,
      };
    },
    saveViewOrDownPaper(state, action) {
      return {
        ...state,
        viewOrDownPaper: action.payload,
      };
    },
    saveResourceCreate(state, action) {
      return {
        ...state,
        resourceCreate: action.payload,
      };
    },
    saveSelectEvaluationCategoryByExample(state, action) {
      return {
        ...state,
        evaluateList: action.payload,
      };
    },
    saveEvaluationItemListByCategoryId(state, action) {
      return {
        ...state,
        evaluationItemListByCategoryId: action.payload,
      };
    },
    saveCriterionList(state, action) {
      return {
        ...state,
        criterionList: action.payload,
      };
    },
    savePaperInfo(state, action) {
      return {
        ...state,
        paperInfo: action.payload,
      };
    },
    saveExamInfoByExamId(state, action) {
      return {
        ...state,
        examInfoByExamId: action.payload,
      };
    },
    saveTaskPublishDisplay(state, action) {
      return {
        ...state,
        taskPublishDisplayList: action.payload,
      };
    },
    saveEditPaperOrExamName(state, action) {
      return {
        ...state,
        editPaperOrExamName: action.payload,
      };
    },
    savePostStudentExamList(state, action) {
      return {
        ...state,
        studentExamList: action.payload,
      };
    },
    saveStudySituationStructure(state, action) {
      return {
        ...state,
        studySituationStructureList: action.payload,
      };
    },
    saveStudySituationByStudentId(state, action) {
      return {
        ...state,
        studySituationByStudentIdList: action.payload,
      };
    },
    saveSaveStudySaveSituationStructure(state, action) {
      return {
        ...state,
        saveStudySituationStructure: action.payload,
      };
    },
    saveExamPaperResultUrlStu(state, action) {
      return {
        ...state,
        examPaperResultUrl: action.payload,
      };
    },
    saveExamPaper(state, action) {
      return {
        ...state,
        examPaperStu: action.payload,
      };
    },
    saveStuQuestionAnalysisExport(state, action) {
      return {
        ...state,
        stuQuestionAnalysisExport: action.payload,
      };
    },
    saveGroupAndGradeScoreRate(state, action) {
      return {
        ...state,
        groupAndGradeScoreRate: action.payload,
      };
    },
    saveUserByName(state, action) {
      return {
        ...state,
        userByNameList: action.payload,
      };
    },
    saveFilterStudentList(state, action) {
      return {
        ...state,
        filterStudentList: action.payload,
      };
    },
    saveFilterStudent(state, action) {
      return {
        ...state,
        filterStudent: action.payload,
      };
    },
    saveFilterStudentListPermissions(state, action) {
      return {
        ...state,
        filterStudentListPermissions: action.payload,
      };
    },
    saveAnalysisVersion(state, action) {
      return {
        ...state,
        analysisVersion: action.payload,
      };
    },
    saveSysLog(state, action) {
      return {
        ...state,
        sysLogList: action.payload,
      };
    },
    saveStageUnderIdentity(state, action) {
      return {
        ...state,
        stageUnderIdentityList: action.payload,
      };
    },
    saveRatioDealShow(state, action) {
      return {
        ...state,
        ratioDealShowList: action.payload,
      };
    },
    saveSelectAllTutor(state, action) {
      return {
        ...state,
        selectAllTutorList: action.payload,
      };
    },
    saveRatioDeal(state, action) {
      return {
        ...state,
        ratioDeal: action.payload,
      };
    },
    saveScoreSectionPlan(state, action) {
      return {
        ...state,
        scoreSectionPlan: action.payload,
      };
    },
    saveCalPercentOrFraction(state, action) {
      return {
        ...state,
        calPercentOrFraction: action.payload,
      };
    },
    saveGetRatioDealShow(state, action) {
      return {
        ...state,
        ratioDealShowTest: action.payload,
      };
    },
    saveAllStudentStudySituation(state, action) {
      return {
        ...state,
        allStudentStudySituation: action.payload,
      };
    },
    saveGroupChanging(state, action) {
      return {
        ...state,
        groupChanging: action.payload,
      };
    },
    saveUploadFile(state, action) {
      return {
        ...state,
        uploadFile: action.payload,
      };
    },
    saveExamLog(state, action) {
      return {
        ...state,
        examLog: action.payload,
      };
    },
    saveKnowledgePointReportWithGroup(state, action) {
      return {
        ...state,
        knowledgePointReportWithGroup: action.payload,
      };
    },
    saveStudentByExamList(state, action) {
      return {
        ...state,
        studentByExamList: action.payload,
      };
    },
    saveAllStudentByName(state, action) {
      return {
        ...state,
        allStudentByName: action.payload,
      };
    },
    saveErrorMsg(state, action) {
      return {
        ...state,
        errorMsg: action.payload,
      };
    },
    questionAnalysisReducer(state, action) {
      console.log(action, "action");
      return {
        ...state,
        questionAnalysisData: action.payload,
      };
    },
  },
};

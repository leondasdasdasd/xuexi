import { message } from "antd";

import {
  checkQuestionForResult,
  queryAllocationList,
  queryAllocationSettingComplete,
  queryAllocationSettingSave,
  queryAllocationType,
  queryCheckQuestion,
  queryCheckQuestionList,
  queryExamPaperSettingStatus,
  queryInsertOrUpdate,
  queryListAllOrgTeachers,
  queryMarkingType,
  queryOnlineMarkingPaperList,
  queryPaperListNum as queryPaperListNumber,
  queryQuestionIdOrPiece,
  queryQuestionImage,
  queryQuestionList,
  queryRefreshSchedule,
  querySetCheckStatus,
  querySetStudentPaperQuestion,
  queryStudentExamPaperImage,
  queryUploadPaperScore,
  questionIdOrPieceForResult,
  questionImageForResult,
} from "../services/marking";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "marking",
  state: {
    onlineMarkingPaperList: [],
    checkQuestionList: {},
    paperListNum: [],
    examPaperSettingStatus: null,
    questionList: [],
    insertOrUpdate: null,
    allocationList: {},
    markingType: [],
    allocationType: [],
    allOrgTeachersList: [],
    questionIdOrPiece: [],
    questionImage: {},
    studentExamPaperImage: [],
    refreshSchedule: {},
  },
  subscriptions: {
    setup({ dispatch, history }) {
      // eslint-disable-line
    },
  },
  effects: {
    *getRefreshSchedule({ payload }, { call, put }) {
      const response = yield call(queryRefreshSchedule, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveRefreshSchedule",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStudentExamPaperImage({ payload }, { call, put }) {
      const response = yield call(queryStudentExamPaperImage, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStudentExamPaperImage",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getUploadPaperScore({ payload, onSuccess }, { call, put }) {
      // eslint-disable-line
      const response = yield call(queryUploadPaperScore, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *getSetCheckStatus({ payload, onSuccess }, { call, put }) {
      // eslint-disable-line
      const response = yield call(querySetCheckStatus, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *postCheckQuestion({ payload, onSuccess }, { call, put }) {
      // eslint-disable-line
      const response = yield call(queryCheckQuestion, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *postSetStudentPaperQuestion({ payload, onSuccess }, { call, put }) {
      // eslint-disable-line
      const response = yield call(querySetStudentPaperQuestion, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        console.log(response.message, "mes1");
        message.success(response.message);
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *getQuestionImage({ payload }, { call, put }) {
      const response = yield call(queryQuestionImage, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveQuestionImage",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getQuestionIdOrPiece({ payload }, { call, put }) {
      const response = yield call(queryQuestionIdOrPiece, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveQuestionIdOrPiece",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAllocationSettingComplete({ payload, onSuccess }, { call, put }) {
      // eslint-disable-line
      const response = yield call(queryAllocationSettingComplete, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *postAllocationSettingSave({ payload, onSuccess }, { call, put }) {
      // eslint-disable-line
      const response = yield call(queryAllocationSettingSave, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *getListAllOrgTeachers({ payload }, { call, put }) {
      const response = yield call(queryListAllOrgTeachers, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveListAllOrgTeachers",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getMarkingType({ payload }, { call, put }) {
      const response = yield call(queryMarkingType, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveMarkingType",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAllocationType({ payload }, { call, put }) {
      const response = yield call(queryAllocationType, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAllocationType",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getAllocationList({ payload }, { call, put }) {
      const response = yield call(queryAllocationList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAllocationList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *postInsertOrUpdate({ payload }, { call, put }) {
      const response = yield call(queryInsertOrUpdate, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveInsertOrUpdate",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getQuestionList({ payload }, { call, put }) {
      const response = yield call(queryQuestionList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveQuestionList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getExamPaperSettingStatus({ payload }, { call, put }) {
      const response = yield call(queryExamPaperSettingStatus, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveExamPaperSettingStatus",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getPaperListNum({ payload }, { call, put }) {
      const response = yield call(queryPaperListNumber, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "savePaperListNum",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getOnlineMarkingPaperList({ payload }, { call, put }) {
      const response = yield call(queryOnlineMarkingPaperList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveOnlineMarkingPaperList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getCheckQuestionList({ payload }, { call, put }) {
      const response = yield call(queryCheckQuestionList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveCheckQuestionList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    // 获取组合题批改时候的题目
    *questionIdOrPieceForResult(
      { payload, onSuccess, onError },
      { call, put },
    ) {
      const response = yield call(questionIdOrPieceForResult, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess(response);
      } else {
        onError(response);
        message.error(response.message);
      }
    },
    // 获取题目信息
    *questionImageForResult({ payload, onSuccess, onError }, { call, put }) {
      const response = yield call(questionImageForResult, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess(response);
      } else {
        onError(response);
        message.error(response.message);
      }
    },
    // 批改学生答案
    *checkQuestionForResult({ payload, onSuccess }, { call, put }) {
      const response = yield call(checkQuestionForResult, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
  },
  reducers: {
    saveOnlineMarkingPaperList(state, action) {
      return {
        ...state,
        onlineMarkingPaperList: action.payload,
      };
    },
    saveCheckQuestionList(state, action) {
      return {
        ...state,
        checkQuestionList: action.payload,
      };
    },
    savePaperListNum(state, action) {
      return {
        ...state,
        paperListNum: action.payload,
      };
    },
    saveExamPaperSettingStatus(state, action) {
      return {
        ...state,
        examPaperSettingStatus: action.payload,
      };
    },
    saveQuestionList(state, action) {
      return {
        ...state,
        questionList: action.payload,
      };
    },
    saveInsertOrUpdate(state, action) {
      return {
        ...state,
        insertOrUpdate: action.payload,
      };
    },
    saveAllocationList(state, action) {
      return {
        ...state,
        allocationList: action.payload,
      };
    },
    saveMarkingType(state, action) {
      return {
        ...state,
        markingType: action.payload,
      };
    },
    saveAllocationType(state, action) {
      return {
        ...state,
        allocationType: action.payload,
      };
    },
    saveListAllOrgTeachers(state, action) {
      return {
        ...state,
        allOrgTeachersList: action.payload,
      };
    },
    saveQuestionIdOrPiece(state, action) {
      return {
        ...state,
        questionIdOrPiece: action.payload,
      };
    },
    saveQuestionImage(state, action) {
      return {
        ...state,
        questionImage: action.payload,
      };
    },
    saveStudentExamPaperImage(state, action) {
      return {
        ...state,
        studentExamPaperImage: action.payload,
      };
    },
    saveRefreshSchedule(state, action) {
      return {
        ...state,
        refreshSchedule: action.payload,
      };
    },
  },
};

import { message } from "antd";

import {
  checkUserAuthority,
  getStudentInfo,
  getStudentPerformanceReportAIParams as getStudentPerformanceReportAIParameters,
  getStudentPerformanceReportResult,
  getStudentSummaryScoresAIParams as getStudentSummaryScoresAIParameters,
  getStudentSummaryScoresResult,
  getStudySituationByStudentId,
  paperGroupNames,
  saveStudySituationStructure,
  studySituationPermission,
  summaryContrastList,
  summaryCreateSystem,
  summaryUpdateAiAnalyse,
  updateStudySituation,
} from "../services/exam";
import { loginRedirect } from "../utils/utils";
export default {
  namespace: "exam",
  state: {
    gradeList: [],
  },

  effects: {
    *paperGroupNames({ payload, onSuccess }, { call, put }) {
      const response = yield call(paperGroupNames, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
        yield put({
          type: "save",
          payload: {
            gradeList: [],
          },
        });
      } else {
        message.error(response.message);
      }
    },
    *summaryCreateSystem({ payload, onSuccess }, { call, put }) {
      const response = yield call(summaryCreateSystem, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *getStudentInfo({ payload, onSuccess }, { call, put }) {
      const response = yield call(getStudentInfo, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *getStudySituationByStudentId({ payload, onSuccess }, { call, put }) {
      const response = yield call(getStudySituationByStudentId, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *getStudentSummaryScoresResult({ payload, onSuccess }, { call, put }) {
      const response = yield call(getStudentSummaryScoresResult, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *getStudentSummaryScoresAIParams(
      { payload, onSuccess, onError },
      { call, put },
    ) {
      const response = yield call(getStudentSummaryScoresAIParameters, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        onError && onError(response);
        message.error(response.message);
      }
    },
    *summaryContrastList({ payload, onSuccess }, { call, put }) {
      const response = yield call(summaryContrastList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },

    *saveStudySituationStructure({ payload, onSuccess }, { call, put }) {
      const response = yield call(saveStudySituationStructure, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },

    *getStudentPerformanceReportResult({ payload, onSuccess }, { call, put }) {
      const response = yield call(getStudentPerformanceReportResult, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },

    *getStudentPerformanceReportAIParams(
      { payload, onSuccess },
      { call, put },
    ) {
      const response = yield call(
        getStudentPerformanceReportAIParameters,
        payload,
      );
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *updateStudySituation({ payload, onSuccess }, { call, put }) {
      const response = yield call(updateStudySituation, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);

        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *studySituationPermission({ payload, onSuccess }, { call, put }) {
      const response = yield call(studySituationPermission, payload);
      console.log(response, "response");

      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *summaryUpdateAiAnalyse({ payload, onSuccess }, { call, put }) {
      const response = yield call(summaryUpdateAiAnalyse, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
    *checkUserAuthority({ payload, onSuccess }, { call, put }) {
      const response = yield call(checkUserAuthority, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
      return response;
    },
  },

  reducers: {
    save(state, { payload: newState }) {
      return {
        ...state,
        ...newState,
      };
    },
  },
};

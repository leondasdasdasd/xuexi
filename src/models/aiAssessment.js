//Ai评语
import { message } from "antd";

import {
  createOrEditAITopic,
  getBalance,
  getClassList,
  getIntelligenceResult,
  getModelList,
  getProcessEvaluationData,
  getStudentList,
  saveAIConversionForTopic,
} from "../services/aiAssessment";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "aiAssessment",
  state: {
    classList: [],
    studentList: [],
  },
  effects: {
    //获取预生成的ai分析
    *getIntelligenceResult({ payload, onSuccess }, { call, put }) {
      const response = yield call(getIntelligenceResult, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess(response.content || "");
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    //获取班级列表
    *getClassList({ payload, onSuccess }, { call, put }) {
      const response = yield call(getClassList, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess(response.content || []);
          yield put({
            type: "save",
            payload: {
              classList: response.content || [],
            },
          });
        } else {
          yield put({
            type: "save",
            payload: {
              classList: [],
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    //获取学生列表
    *getStudentList({ payload, onSuccess }, { call, put }) {
      const response = yield call(getStudentList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              studentList: response.content || [],
            },
          });
        } else {
          yield put({
            type: "save",
            payload: {
              studentList: [],
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    //查询过评数据
    *getProcessEvaluationData({ payload, onSuccess }, { call, put }) {
      const response = yield call(getProcessEvaluationData, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess(response.content || []);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    *createOrEditAITopic({ payload, onSuccess }, { call, put }) {
      const response = yield call(createOrEditAITopic, payload);
      if (response.status) {
        onSuccess && onSuccess(response.content);
      }
    },

    *saveAIConversionForTopic({ payload, onSuccess }, { call, put }) {
      const response = yield call(saveAIConversionForTopic, payload);
      if (response.status) {
        onSuccess && onSuccess(response.content);
      }
    },
    *getBalance({ payload, onSuccess }, { call, put }) {
      const response = yield call(getBalance, payload);
      if (response.status) {
        onSuccess && onSuccess(response.content);
      }
    },
    *getModelList({ payload, onSuccess }, { call, put }) {
      const response = yield call(getModelList, payload);
      if (response.status) {
        onSuccess && onSuccess(response.content);
      }
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

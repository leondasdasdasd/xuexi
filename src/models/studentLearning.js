import { message } from "antd";

import {
  queryAllStudents,
  queryAllSubject,
  queryTeachingOrg,
} from "../services/studentLearning";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "studentLearning",
  state: { allStudents: [], allSubjectList: [], teachingOrgList: [] },
  subscriptions: {
    setup({ dispatch, history }) {
      // eslint-disable-line
    },
  },
  effects: {
    *getAllStudents({ payload }, { call, put }) {
      const response = yield call(queryAllStudents, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveAllStudents",
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
    *getTeachingOrg({ payload }, { call, put }) {
      const response = yield call(queryTeachingOrg, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveTeachingOrg",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
  },
  reducers: {
    saveAllStudents(state, action) {
      return {
        ...state,
        allStudents: action.payload,
      };
    },
    saveAllSubject(state, action) {
      return {
        ...state,
        allSubjectList: action.payload,
      };
    },
    saveTeachingOrg(state, action) {
      return {
        ...state,
        teachingOrgList: action.payload,
      };
    },
  },
};

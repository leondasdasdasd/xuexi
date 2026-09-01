import { message } from "antd";

import { examPaperAnswer, machineReading } from "../services/machine";
export default {
  namespace: "machine",

  state: {
    upLoadeDetail: null,
  },

  subscriptions: {
    setup({ dispatch, history }) {
      // eslint-disable-line
    },
  },

  effects: {
    *getUploadeDetail({ payload, callback }, { call, put }) {
      //按学生查看，班级答题情况
      const response = yield call(examPaperAnswer, payload);
      if (callback) callback(response);
      if (response.status) {
        yield put({
          type: "seaveUploadeDetail",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *createMachineReading({ payload, callback }, { call, put }) {
      const response = yield call(machineReading, payload);
      if (callback) callback(response);
      if (!response.status) {
        message.error(response.message);
      }
    },
  },

  reducers: {
    seaveUploadeDetail(state, action) {
      return {
        ...state,
        upLoadeDetail: action.payload,
      };
    },
  },
};

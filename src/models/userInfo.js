import { message } from "antd";

import { queryUpdateAvatar, queryUserInfo } from "../services/example";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "userInfo",

  state: {
    userInfoObj: {},
  },

  subscriptions: {
    setup({ dispatch, history }) {
      // eslint-disable-line
    },
  },

  effects: {
    *getUserInfo({ payload }, { call, put }) {
      // eslint-disable-line
      const response = yield call(queryUserInfo, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveUserInfo",
          payload: response,
        });
      }
      // else {
      //   message.error(response.message);
      // }
    },
    *getTableData({ payload }, { call, put }) {
      // eslint-disable-line
      yield put({
        type: "saveTableData",
        payload: payload,
      });
    },
    *updateAvatar({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryUpdateAvatar, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess();
        message.success(response.message);
      }
      // else {
      //   message.error(response.message);
      // }
    },
  },

  reducers: {
    saveUserInfo(state, action) {
      return {
        ...state,
        userInfoObj: action.payload.content,
      };
    },
  },
};

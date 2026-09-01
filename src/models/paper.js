import { paperCanEdit } from "../services/paper";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "paper",
  state: {},
  effects: {
    *paperCanEdit({ payload, onSuccess, onError }, { call, put }) {
      const response = yield call(paperCanEdit, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
        return response;
      } else {
        onError && onError(response);
        return response;
      }
    },
  },

  reducers: {},
};

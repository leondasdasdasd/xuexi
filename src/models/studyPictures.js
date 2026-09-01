import { message } from "antd";

import {
  addRegularLabel,
  findTree,
  publishStudy,
  queryAllClass,
  queryLabel,
  queryStudyType,
  querySubject,
  removeFileName,
} from "../services/example";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "studyPictures",

  state: {
    taskDetail: {
      fileList: [], // 附件
      studentList: [],
      teacherList: [],
    },
    subject: {
      courseId: 99,
      courseName: "数学G2",
      schoolYearName: "2018学年",
    },
    type: [],
    label: [],
    treeData: [],
    baseAllStudents: {},
  },

  subscriptions: {
    setup({ dispatch, history }) {
      // eslint-disable-line
    },
  },

  effects: {
    *fileChange({ payload }, { call, put }) {
      yield put({
        type: "updateFile",
        payload: payload,
      });
    },
    *updateFileName({ payload }, { call, put }) {
      const response = yield call(removeFileName, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "fileName",
          payload: payload,
        });
      } else {
        message.error(response.message);
      }
    },
    *getType({ payload }, { call, put }) {
      const response = yield call(queryStudyType, payload);
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
    *getLabel({ payload }, { call, put }) {
      const response = yield call(queryLabel, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveLabel",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *searchTree({ payload }, { call, put }) {
      const response = yield call(findTree, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveTree",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *publish({ payload }, { call, put }) {
      const response = yield call(publishStudy, payload);
      if (!response.status) {
        message.error(response.message);
      }
    },
    *addType({ payload, onSuccess }, { call, put }) {
      const response = yield call(addRegularLabel, payload);
      if (response === undefined) return;
      !response.ifLogin && (yield loginRedirect());
      if (!response.status) {
        message.error(response.message);
        return;
      }
      message.success(response.message);
      onSuccess();
    },
    *getSubject({ payload }, { call, put }) {
      const response = yield call(querySubject, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "setSubject",
          payload: response.content,
        });

        yield put({
          type: "allClassList",
          payload: payload,
        });
      } else {
        message.error(response.message);
      }
    },
    *allClassList({ payload }, { call, put }) {
      const response = yield call(queryAllClass, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "setallClass",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
  },

  reducers: {
    updateFile(state, { payload }) {
      let taskDetail = Object.assign({}, state.taskDetail);
      taskDetail["fileList"] = payload;
      return {
        ...state,
        taskDetail: taskDetail,
      };
    },
    fileName(state, { payload }) {
      let newState = Object.assign({}, state);
      newState["taskDetail"]["fileList"][payload.key]["fileName"] =
        payload.fileName;
      return {
        ...newState,
      };
    },
    setSubject(state, { payload }) {
      return {
        ...state,
        subject: payload,
      };
    },
    saveType(state, { payload }) {
      return {
        ...state,
        type: payload,
      };
    },
    saveLabel(state, { payload }) {
      return {
        ...state,
        label: payload,
      };
    },
    saveTree(state, { payload }) {
      return {
        ...state,
        treeData: payload,
      };
    },
    setallClass(state, { payload }) {
      let classList = [];
      let studentList = [];
      payload.map((item) => {
        classList.push({
          id: item.id,
          name: item.name,
          eName: item.eName,
        });
        let classStuList = [];
        // item.studentInfoResponses(i => {
        //   classStuList.push({
        //     ...i,
        //   })
        // });
        studentList.push(item.studentInfoResponses);
      });
      return {
        ...state,
        baseAllStudents: {
          classList,
          studentList,
        },
      };
    },
  },
};

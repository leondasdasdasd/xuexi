import { message } from "antd";

import {
  create,
  getActivityList,
  getAllTeachers,
  getCourseList,
  getGroupList,
  getIfShow,
  queryCourseStudents,
  release,
} from "../services/publishToStudent";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "publishToStudent",

  state: {
    courseList: [], //我的课程列表
    activityList: [], //对应课程下某个单元的学习活动列表
    allTeachersData: [], //所有老师列表
    groupList: [], //班级列表和班级下的教师、学生列表
    taskPublishLearn: [], //学习单返回列表
    studentList: [], //被选中的学生
    ifShow: null,
  },

  subscriptions: {},

  effects: {
    *getCourseList({ payload }, { call, put }) {
      const response = yield call(getCourseList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: { courseList: response.content },
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *queryIsShow({ payload }, { call, put }) {
      const response = yield call(getIfShow, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveIfShow",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getActivityList({ payload }, { call, put }) {
      const response = yield call(getActivityList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: { activityList: response.content },
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    *getAllTeachers({ payload }, { call, put }) {
      const response = yield call(getAllTeachers, payload);
      if (response.ifLogin) {
        if (response.status) {
          let array = [];
          response.content &&
            response.content.length &&
            response.content.forEach((element) => {
              array.push({
                key: element.teacherId,
                value: element.teacherId,
                title: element.name,
              });
            });
          yield put({
            type: "save",
            payload: { allTeachersData: array },
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getGroupList({ payload, onSuccess }, { call, put }) {
      const response = yield call(getGroupList, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess(response.content || []);
          yield put({
            type: "save",
            payload: { groupList: response.content },
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getCourseStudents({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryCourseStudents, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess(response.content || []);
          yield put({
            type: "save",
            payload: { groupList: response.content || [] },
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *create({ payload, onSuccess, onError }, { call, put }) {
      const response = yield call(create, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: { taskPublishLearn: response.content },
          });
          onSuccess && onSuccess(response.content);
        } else {
          message.error(response.message);
          onError && onError();
        }
      } else {
        loginRedirect();
      }
    },
    *release({ payload, onSuccess }, { call, put }) {
      const response = yield call(release, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess();
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *update({ payload }, { call, put }) {
      yield put({
        type: "save",
        payload: { studentList: payload.selectValue },
      });
    },
  },

  reducers: {
    save(state, { payload: newState }) {
      return { ...state, ...newState };
    },
    saveIfShow(state, action) {
      return {
        ...state,
        ifShow: action.payload, //审批信息
      };
    },
  },
};

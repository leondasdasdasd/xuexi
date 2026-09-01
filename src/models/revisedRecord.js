import { message } from "antd";

import { queryExamOptions } from "../services/example";
import { queryGrade, querySubject } from "../services/global";
import {
  fetchModifiedScore, //查询成绩对应等级
  getcorrectionProcessInfo,
  getCorrectionProcessList,
  getEvaCorrectionDetail,
  getEvaDetail,
  getExamList,
  getGroupAndStudent,
  getQuestionAnswer,
  getQuestionList,
  getQuestionStudent,
  getStageList,
  getWillRevisedStudent, //获取需要订正成绩的学生列表
  queryStuScore,
  submitCorrect,
  submitCorrectEva,
  toApprove,
  toApproveNew,
} from "../services/revisedRecord";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "revisedRecord",

  state: {
    correctionProcessData: {}, //订正列表数据
    correctionProcessInfo: {}, //审批信息
    typeValue: 0,
    examOptions: [],
    status: 0, //状态
    examList: [], //试卷列表
    questionList: [], //题号列表
    questionAnswer: {}, //题号回显原答案
    questionStudent: [], //根据题号回显学生和得分
    gradeList: [],
    subjectList: [],
    baseAllStudents: {},
    stuScore: {},
    stageList: [],
    evaDetail: {},
    willRevisedStudent: [], //待修改成绩的学生列表
    levelInfo: {},
  },

  effects: {
    *getCorrectionProcessList({ payload }, { call, put }) {
      const response = yield call(getCorrectionProcessList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              correctionProcessData: response.content,
            },
          });
        } else {
          yield put({
            type: "save",
            payload: {
              correctionProcessData: {},
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getGroupAndStudent({ payload }, { call, put }) {
      // eslint-disable-line
      const response = yield call(getGroupAndStudent, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveBaseAll",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getStuScore({ payload }, { call, put }) {
      // eslint-disable-line
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
    *getStageList({ payload }, { call, put }) {
      // eslint-disable-line
      const response = yield call(getStageList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        yield put({
          type: "saveStageList",
          payload: response.content,
        });
      } else {
        message.error(response.message);
      }
    },
    *getOptions({ payload }, { call, put }) {
      // eslint-disable-line
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
    *getSubject({ payload }, { call, put }) {
      //切换语言
      const response = yield call(querySubject, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveSubject",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    *getGrade({ payload }, { call, put }) {
      //切换语言
      const response = yield call(queryGrade, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveGrade",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getEvaDetail({ payload }, { call, put }) {
      //切换语言
      const response = yield call(getEvaDetail, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveEvaDetail",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *submitCorrectEva({ payload, onSuccess }, { call, put }) {
      //切换语言
      const response = yield call(submitCorrectEva, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess();
          message.success(response.message);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *changeSearch({ payload }, { put }) {
      // eslint-disable-line
      yield put({
        type: "changeSearchValue",
        payload: payload,
      });
    },

    *clearSearch({ payload }, { put }) {
      //切换语言
      yield put({
        type: "clearSearchBar",
      });
    },

    *changeStatus({ payload }, { put }) {
      // eslint-disable-line
      yield put({
        type: "saveStatus",
        payload: payload,
      });
    },
    *getEvaCorrectionDetail({ payload }, { call, put }) {
      const response = yield call(getEvaCorrectionDetail, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              correctionProcessInfo: response.content,
            },
          });
        } else {
          yield put({
            type: "save",
            payload: {
              correctionProcessInfo: {},
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    //获取审批信息
    *getcorrectionProcessInfo({ payload }, { call, put }) {
      const response = yield call(getcorrectionProcessInfo, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              correctionProcessInfo: response.content,
            },
          });
        } else {
          yield put({
            type: "save",
            payload: {
              correctionProcessInfo: {},
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    //审批
    *toApprove({ payload, onSuccess }, { call, put }) {
      const response = yield call(toApprove, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess();
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *toApproveNew({ payload, onSuccess }, { call, put }) {
      const response = yield call(toApproveNew, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess();
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    //试卷列表
    *getExamList({ payload, onSuccess }, { call, put }) {
      const response = yield call(getExamList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              examList: response.content,
            },
          });
          onSuccess && onSuccess();
        } else {
          yield put({
            type: "save",
            payload: {
              examList: [],
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    //题号列表
    *getQuestionList({ payload }, { call, put }) {
      const response = yield call(getQuestionList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              questionList: response.content,
            },
          });
        } else {
          yield put({
            type: "save",
            payload: {
              questionList: [],
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    //根据题号回显原答案
    *getQuestionAnswer({ payload, onSuccess }, { call, put }) {
      const response = yield call(getQuestionAnswer, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              questionAnswer: response.content,
            },
          });
          onSuccess && onSuccess(response.content);
        } else {
          yield put({
            type: "save",
            payload: {
              questionAnswer: {},
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    //根据题号查询参考学生和得分列表
    *getQuestionStudent({ payload, onSuccess }, { call, put }) {
      const response = yield call(getQuestionStudent, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              questionStudent:
                response.content && response.content["studentResult"]
                  ? response.content["studentResult"]
                  : [],
            },
          });
          onSuccess && onSuccess(response.content);
        } else {
          yield put({
            type: "save",
            payload: {
              questionStudent: [],
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    //提交创建
    *submitCorrect({ payload, onSuccess }, { call, put }) {
      const response = yield call(submitCorrect, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess();
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },

    *clearStudent({ payload, onSuccess }, { call, put }) {
      yield put({
        type: "save",
        payload: {
          questionStudent: [],
        },
      });
    },
    *getWillRevisedStudent({ payload }, { call, put }) {
      const response = yield call(getWillRevisedStudent, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              willRevisedStudent: response.content || [],
            },
          });
        } else {
          yield put({
            type: "save",
            payload: {
              willRevisedStudent: [],
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *fetchModifiedScore({ payload, onSuccess }, { call, put }) {
      const response = yield call(fetchModifiedScore, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "save",
            payload: {
              levelInfo: response.content || {},
            },
          });
          onSuccess && onSuccess();
        } else {
          yield put({
            type: "save",
            payload: {
              levelInfo: {},
            },
          });
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
  },

  reducers: {
    save(state, { payload: newState }) {
      return { ...state, ...newState };
    },

    saveGrade(state, action) {
      return {
        ...state,
        gradeList: action.payload,
        subjectList: [],
      };
    },
    saveSubject(state, action) {
      return {
        ...state,
        subjectList: action.payload,
      };
    },
    clearSearchBar(state, { payload }) {
      return {
        ...state,
        stageList: [],
        gradeList: [],
        subjectList: [],
      };
    },
    saveOptions(state, action) {
      return {
        ...state,
        examOptions: action.payload,
      };
    },
    changeSearchValue(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    saveStatus(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    saveEvaDetail(state, action) {
      return {
        ...state,
        evaDetail: action.payload,
      };
    },
    clearProcessInfo(state, action) {
      return {
        ...state,
        correctionProcessInfo: {},
      };
    },
    saveStuScore(state, action) {
      return {
        ...state,
        stuScore: action.payload,
      };
    },
    saveBaseAll(state, { payload }) {
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
    clearData(state, action) {
      return {
        ...state,
        correctionProcessInfo: {}, //审批信息
      };
    },
    saveStageList(state, action) {
      return {
        ...state,
        stageList: action.payload, //审批信息
      };
    },
    clearList(state, action) {
      return {
        ...state,
        typeValue: 0,
        status: 0,
        correctionProcessData: {},
      };
    },

    clearRevisedData(state, action) {
      return {
        ...state,
        examList: [],
        questionList: [],
        questionStudent: [],
      };
    },
  },
};

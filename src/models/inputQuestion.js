import { message } from "antd";

import {
  getAllGradeList,
  getGradeList, //获取年级列表
  getSectionList, //获取学段
  getSubjectList, //获取学科
  importQuestion,
  importQuestionBasket, //批量添加试题到试题篮
  mathToImage, //公式转图片
  queryAdmin,
  queryChapter,
  queryEditQuestion,
  queryLabel,
  queryTree,
  saveEditQuestion,
  uploadIndexing,
} from "../services/inputQuestion";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "inputQuestion",
  state: {
    importMsg: 0,
    editQuestion: {},
    sectionList: [], //获取学段
    gradeList: [], //获取年级
    subjectList: [], //获取学科
    mathImage: "", //公式插入转图片
    importBasketMsg: 0,
    treeData: [],
    labelList: [],
    ifAdmin: false,
    allGradeList: [],
    chapterList: [],
  },

  effects: {
    *importQuestion({ payload, onSuccess }, { call, put }) {
      //录入试题到题库
      const response = yield call(importQuestion, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "getImportMsg",
            payload: response.content,
          });
          onSuccess && onSuccess(response.content || []);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getAllGradeList({ payload, onSuccess, onFinally }, { call, put }) {
      //录入试题到题库
      const response = yield call(getAllGradeList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveAllGradeList",
            payload: response.content,
          });
          onSuccess && onSuccess(response);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
      onFinally && onFinally();
    },
    *getLabel({ payload, callback }, { call, put }) {
      //录入试题到题库
      const response = yield call(queryLabel, payload);
      if (response.ifLogin) {
        if (callback) {
          callback();
        }
        if (response.status) {
          yield put({
            type: "saveLabel",
            payload: dealTreeData(response.content),
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getAdmin({ payload }, { call, put }) {
      //录入试题到题库
      const response = yield call(queryAdmin, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveAdmin",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getTree({ payload, onSuccess }, { call, put }) {
      //录入试题到题库
      const response = yield call(queryTree, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveTree",
            payload: response.content,
          });
          onSuccess && onSuccess(response.content);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getKnowledgeTree({ payload, onSuccess, callback }, { call, put }) {
      //录入试题到题库
      const response = yield call(queryTree, payload);
      if (response.ifLogin) {
        if (callback) {
          callback();
        }
        if (response.status) {
          // let newCon = renderTree(response.content)
          yield put({
            type: "saveTree",
            payload: response.content,
          });
          onSuccess && onSuccess(response.content);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *cleanTree({ payload, onSuccess }, { call, put }) {
      yield put({
        type: "cleanTreeList",
      });
    },
    *getChapter({ payload, onSuccess, callback }, { call, put }) {
      //录入试题到题库
      const response = yield call(queryChapter, payload);
      if (callback) callback();
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveChapter",
            payload: response.content,
          });
          onSuccess && onSuccess(response.content);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *emptyGetTree({ payload }, { call, put }) {
      const response = yield call(queryTree, payload);
      if (response.ifLogin && response.status) {
        yield put({
          type: "saveTree",
          payload: [],
        });
      }
    },
    *saveEditQuestion({ payload, onSuccess }, { call, put }) {
      const response = yield call(saveEditQuestion, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "getSaveEditQuestion",
            payload: response.content,
          });
          onSuccess && onSuccess(response.content);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *upload({ payload, onSuccess }, { call, put }) {
      const response = yield call(uploadIndexing, payload);
      if (response.ifLogin) {
        if (response.status) {
          message.success(response.message);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getQuestion({ payload }, { call, put }) {
      //录入试题到题库
      const response = yield call(queryEditQuestion, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveQuestion",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getSectionList({ payload }, { call, put }) {
      //获取学段
      const response = yield call(getSectionList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "updateSectionList",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getGradeList({ payload }, { call, put }) {
      //获取年级列表
      const response = yield call(getGradeList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "updateGradeList",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getSubjectList({ payload, onSuccess }, { call, put }) {
      //获取学科列表
      const response = yield call(getSubjectList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "updateSubjectList",
            payload: response.content,
          });
          onSuccess && onSuccess(response);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *mathToImage({ payload, onSuccess }, { call, put }) {
      //数学公式转为图片
      const response = yield call(mathToImage, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "getMathImage",
            payload: response.content,
          });
          onSuccess && onSuccess();
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *importQuestionBasket({ payload, onSuccess }, { call, put }) {
      //批量添加试题到试题篮
      const response = yield call(importQuestionBasket, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "getImportBasketMsg",
            payload: response.content,
          });
          onSuccess && onSuccess();
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
  },

  reducers: {
    getImportMsg(state, action) {
      return {
        ...state,
        importMsg: action.payload,
      };
    },
    saveAdmin(state, action) {
      return {
        ...state,
        ifAdmin: action.payload,
      };
    },
    saveTree(state, action) {
      return {
        ...state,
        treeData: action.payload,
      };
    },
    saveChapter(state, action) {
      return {
        ...state,
        chapterList: action.payload,
      };
    },
    getSaveEditQuestion(state, action) {
      return {
        ...state,
        saveEditQuestion: action.payload,
      };
    },
    saveQuestion(state, action) {
      return {
        ...state,
        editQuestion: action.payload,
      };
    },
    updateSectionList(state, action) {
      return {
        ...state,
        sectionList: action.payload,
      };
    },
    saveLabel(state, action) {
      return {
        ...state,
        labelList: action.payload,
      };
    },
    updateGradeList(state, action) {
      return {
        ...state,
        gradeList: action.payload,
      };
    },
    updateSubjectList(state, action) {
      return {
        ...state,
        subjectList: action.payload,
      };
    },
    getMathImage(state, action) {
      return {
        ...state,
        mathImage: action.payload,
      };
    },
    cleanTreeList(state, action) {
      return {
        ...state,
        chapterList: [],
        treeData: [],
        labelList: [],
      };
    },
    getImportBasketMsg(state, action) {
      return {
        ...state,
        importBasketMsg: action.payload,
      };
    },
    saveAllGradeList(state, action) {
      return {
        ...state,
        allGradeList: action.payload,
      };
    },
  },
};
/**
 *
 * @param list
 */
function renderTree(list) {
  let newList = list;
  if (newList && newList.length > 0) {
    newList.map((item) => {
      if (item.children && item.children.length > 0) {
        // item.selectable = false;//细目表中关联知识点时，无法选择节点
        renderTree(item.children);
      }
    });
  }
  return newList;
}

/**
 *
 * @param list
 */
function dealTreeData(list) {
  return list.map((item) => ({
    title: item.name,
    value: item.id,
    key: item.id,
    // selectable: item.indicatorSon ? false : true,//细目表中关联知识点时，无法选择节点
    pinyin: item.pinyin,
    children: item.indicatorSon ? dealTreeData(item.indicatorSon) : null,
  }));
}

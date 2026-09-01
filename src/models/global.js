import { message } from "antd";

import {
  addToBasket,
  cancelToBasket,
  checkPermission,
  getCurrentUser,
  queryAbsentAdminInfoList,
  queryAbsentInfoList,
  queryAbsentManage,
  queryAllWrongQuestionVersion,
  queryAnalyseRankGroupAsRow,
  queryChangewrongquestionCorrectness,
  queryDeleteWrongQuestionVersion,
  queryErrorQuestionList,
  queryExportErrorQuestionList,
  queryFindUserCaptureCount,
  queryFocusQuestionList,
  queryGrade,
  queryGradeList,
  queryKnowledgeErrorQuestionList,
  queryKnowledgeQuestionList,
  queryLang,
  queryListIds,
  queryNameList,
  queryNoticeList, //消息列表
  queryNoticeNumber, //消息条数
  queryNoticeRead, //标为已读
  queryPersonalizedList,
  queryPushedStudentList,
  queryRankList,
  querySaveRankList,
  queryScoreByRank,
  queryStage,
  queryStuAllWrongQuestionVersion,
  queryStudentGroupList,
  queryStudentGroupListAndStudentList,
  queryStudentList,
  queryStudySituationStructureByStudentId,
  querySubject,
  queryTotalScore,
  queryType,
  queryUniformExaminationScore,
  queryWrongQuestionVersion,
  queryWrongQuestionVersionDetail,
  richerUploadFile, //上传文件
} from "../services/global";
import {
  querySegement,
  queryTypeList,
  saveSegement,
  saveView,
  updatePaperFile,
} from "../services/paper";
import { loginRedirect } from "../utils/utils";

export default {
  namespace: "global",
  state: {
    currentUser: {},
    collapsed: true,
    menuVisible: true,
    readNoticeList: [], //已读消息列表
    noReadNoticeList: [], //未读消息列表
    totalRead: 0, //已读消息条数
    unreadTotal: 0, //未读消息条数
    stageList: [],
    gradeList: [],
    subjectList: [],
    typeList: [],
    fileUrl: {},
    rankList: [],
    scoreByRank: {},
    saveRankList: "",
    analyseRankGroupAsRow: [],
    studySituationStructureByStudentId: "",
    focusQuestionList: [],
    studentList: [],
    absentAdminInfoList: [],
    absentInfoList: [],
    absentManage: "",
    stuGradeList: [],
    stuTypeList: [],
    stuNameList: [],
    knowledgeQuestionList: [],
    errorQuestionList: [],
    studentGroupList: [],
    userList: [],
    personalizedList: [],
    studentGroupListAndStudentList: [],
    exportErrorQuestionList: "",
    knowledgeErrorQuestionList: [],
    wrongQuestionVersion: "",
    allWrongQuestionVersion: {},
    stuAllWrongQuestionVersion: {},
    deleteWrongQuestionVersion: "",
    changewrongquestionCorrectness: "",
    wrongQuestionVersionDetail: {},
    pushedStudentList: [],
    listIds: [],
    saveProps: null,
    viewProps: {},
    segementDetail: {},
  },

  effects: {
    *getTotalScore({ payload, onSuccess }, { call, put }) {
      // eslint-disable-line
      const response = yield call(queryTotalScore, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *getUniformExaminationScore({ payload, onSuccess }, { call, put }) {
      // eslint-disable-line
      const response = yield call(queryUniformExaminationScore, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        message.success(response.message);
        onSuccess && onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *getPushedStudentList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryPushedStudentList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "savePushedStudentList",
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
    *getWrongQuestionVersionDetail({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryWrongQuestionVersionDetail, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveWrongQuestionVersionDetail",
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
    *getChangewrongquestionCorrectness({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryChangewrongquestionCorrectness, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveChangewrongquestionCorrectness",
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
    *getDeleteWrongQuestionVersion({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryDeleteWrongQuestionVersion, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveDeleteWrongQuestionVersion",
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
    *getStuAllWrongQuestionVersion({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryStuAllWrongQuestionVersion, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveStuAllWrongQuestionVersion",
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
    *getAllWrongQuestionVersion({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryAllWrongQuestionVersion, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveAllWrongQuestionVersion",
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
    *postWrongQuestionVersion({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryWrongQuestionVersion, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveWrongQuestionVersion",
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
    *getKnowledgeErrorQuestionList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryKnowledgeErrorQuestionList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveKnowledgeErrorQuestionList",
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
    *getExportErrorQuestionList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryExportErrorQuestionList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveExportErrorQuestionList",
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
    *getStudentGroupListAndStudentList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryStudentGroupListAndStudentList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveStudentGroupListAndStudentList",
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
    *getListIds({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryListIds, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveListIds",
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
    *clearListIds({ payload, onSuccess }, { call, put }) {
      yield put({
        type: "saveListIds",
        payload: [],
      });
    },
    *saveTwoWay({ payload, onSuccess, onError }, { call, put }) {
      const response = yield call(saveSegement, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess && onSuccess(response);
          yield put({
            type: "saveWayProps",
            payload: response.content,
          });
        } else {
          onError && onError();
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *clearSaveProp({ payload, onSuccess }, { call, put }) {
      yield put({
        type: "saveWayProps",
        payload: null,
      });
    },
    *saveToView({ payload, onSuccess }, { call, put }) {
      const response = yield call(saveView, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveViewProps",
            payload: response.content,
          });
          message.success(response.message);
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getPersonalizedList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryPersonalizedList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "savePersonalizedList",
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
    *getStudentGroupList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryStudentGroupList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveStudentGroupList",
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
    *postFindUserCaptureCount({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryFindUserCaptureCount, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveFindUserCaptureCount",
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
    *getErrorQuestionList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryErrorQuestionList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveErrorQuestionList",
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
    *getKnowledgeQuestionList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryKnowledgeQuestionList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveKnowledgeQuestionList",
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
    *getNameList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryNameList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveNameList",
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
    *getTypeList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryTypeList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveTypeList",
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
    *getGradeList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryGradeList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveGradeList",
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
    *postAbsentManage({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryAbsentManage, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveAbsentManage",
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
    *getAbsentInfoList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryAbsentInfoList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveAbsentInfoList",
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
    *getAbsentAdminInfoList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryAbsentAdminInfoList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveAbsentAdminInfoList",
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
    *getStudentList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryStudentList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveStudentList",
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
    *getFocusQuestionList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryFocusQuestionList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveFocusQuestionList",
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
    *postStudySituationStructureByStudentId(
      { payload, onSuccess },
      { call, put },
    ) {
      const response = yield call(
        queryStudySituationStructureByStudentId,
        payload,
      );
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveStudySituationStructureByStudentId",
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
    *getAnalyseRankGroupAsRow({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryAnalyseRankGroupAsRow, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveAnalyseRankGroupAsRow",
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
    *saveGetRankList({ payload, onSuccess }, { call, put }) {
      const response = yield call(querySaveRankList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveGetRankList1",
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
    *getScoreByRank({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryScoreByRank, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveScoreByRank",
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
    *getRankList({ payload, onSuccess }, { call, put }) {
      const response = yield call(queryRankList, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveRankList",
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
    *getCurrentUser({ payload, onSuccess }, { call, put }) {
      const response = yield call(getCurrentUser, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "currentUserReducers",
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
    *addBasket({ payload }, { call, put }) {
      //切换语言
      const response = yield call(addToBasket, payload);
      if (response.ifLogin) {
        if (response.status) {
          message.success(response.message);
          yield put({
            type: "home/updateQuestionList",
            payload: payload.questionId,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *cancelBasket({ payload }, { call, put }) {
      //切换语言
      const response = yield call(cancelToBasket, payload);
      if (response.ifLogin) {
        if (response.status) {
          message.success(response.message);
          yield put({
            type: "home/updateQuestionList",
            payload: payload.questionId,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getStage({ payload }, { call, put }) {
      //切换语言
      const response = yield call(queryStage, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveStage",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *clearSearch({ payload }, { put }) {
      //切换语言
      yield put({
        type: "clearSearchBar",
      });
    },
    *getType({ payload }, { call, put }) {
      //切换语言
      const response = yield call(queryType, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveType",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *segementDetail({ payload }, { call, put }) {
      //切换语言
      const response = yield call(querySegement, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveDetail",
            payload: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *clearStu({ payload }, { call, put }) {
      yield put({
        type: "clearStudentList",
        payload: [],
      });
    },
    *getSubject({ payload, onSuccess }, { call, put }) {
      //切换语言
      const response = yield call(querySubject, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "saveSubject",
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
    *checkLange(_, { call, put }) {
      //切换语言
      const response = yield call(queryLang, _.payload);
      if (response.ifLogin) {
        if (response.status) {
          window.location.reload();
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    },
    *getNoticeList({ payload }, { call, put }) {
      yield put({ type: "getNoticeNumber" });
      const response = yield call(queryNoticeList, payload);
      !response.ifLogin && (yield loginRedirect());
      if (!response.status) {
        message.error(response.message);
        return;
      }

      yield payload.read
        ? put({
            type: "saveReadNoticeList",
            payload: response,
          })
        : put({
            type: "saveNoReadNoticeList",
            payload: response,
          });
    },
    *getNoticeNumber({ payload }, { call, put }) {
      const response = yield call(queryNoticeNumber, payload);
      !response.ifLogin && (yield loginRedirect());
      if (!response.status) {
        message.error(response.message);
        return;
      }

      yield put({
        type: "saveNoticeNumber",
        payload: response,
      });
    },
    *noticeRead({ payload, onSuccess }, { call, put }) {
      //标为已读
      const response = yield call(queryNoticeRead, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess();
      } else {
        message.error(response.message);
      }
    },
    *uploadFile({ payload, onSuccess }, { call, put }) {
      //上传文件
      const response = yield call(richerUploadFile, payload);
      if (response.ifLogin) {
        if (response.status) {
          yield put({
            type: "updateFileResponse",
            payload: response.content,
          });
          onSuccess(response.content);
        } else {
          message.error(response.message);
        }
      } else {
        message.error(response.message);
      }
    },
    *checkPermission({ payload, onSuccess }, { call, put }) {
      //上传文件
      const response = yield call(checkPermission, payload);
      if (response.ifLogin) {
        if (response.status) {
          onSuccess(response.content);
        } else {
          message.error(response.message);
        }
      } else {
        message.error(response.message);
      }
    },
    *updatePaperFile({ payload, onSuccess }, { call, put }) {
      const response = yield call(updatePaperFile, payload);
      !response.ifLogin && (yield loginRedirect());
      if (response.status) {
        onSuccess && onSuccess(response);
      } else {
        message.error(response.message);
      }
    },
  },

  reducers: {
    currentUserReducers(state, action) {
      return {
        ...state,
        currentUser: action.payload,
      };
    },
    saveStage(state, action) {
      return {
        ...state,
        stageList: action.payload,
      };
    },
    saveGrade(state, action) {
      return {
        ...state,
        gradeList: action.payload,
        subjectList: [],
      };
    },
    saveType(state, action) {
      return {
        ...state,
        typeList: action.payload,
      };
    },
    saveSubject(state, action) {
      return {
        ...state,
        subjectList: action.payload,
      };
    },
    changeMenuVisible(state, { payload }) {
      return {
        ...state,
        menuVisible: payload,
      };
    },
    changeLayoutCollapsed(state, { payload }) {
      return {
        ...state,
        collapsed: payload,
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
    saveReadNoticeList(state, action) {
      return {
        ...state,
        readNoticeList: action.payload.content,
      };
    },
    saveNoReadNoticeList(state, action) {
      return {
        ...state,
        noReadNoticeList: action.payload.content,
      };
    },
    saveNoticeNumber(state, action) {
      return {
        ...state,
        totalRead: action.payload.content.totalRead,
        unreadTotal: action.payload.content.unreadTotal,
      };
    },
    updateFileResponse(state, { payload }) {
      return {
        ...state,
        fileUrl: payload,
      };
    },
    saveRankList(state, { payload }) {
      return {
        ...state,
        rankList: payload,
      };
    },
    saveWayProps(state, { payload }) {
      return {
        ...state,
        saveProps: payload,
      };
    },
    saveViewProps(state, { payload }) {
      return {
        ...state,
        viewProps: payload,
      };
    },
    saveScoreByRank(state, { payload }) {
      return {
        ...state,
        scoreByRank: payload,
      };
    },
    saveGetRankList1(state, { payload }) {
      return {
        ...state,
        saveRankList: payload,
      };
    },
    saveAnalyseRankGroupAsRow(state, { payload }) {
      return {
        ...state,
        analyseRankGroupAsRow: payload,
      };
    },
    saveStudySituationStructureByStudentId(state, { payload }) {
      return {
        ...state,
        studySituationStructureByStudentId: payload,
      };
    },
    saveFocusQuestionList(state, { payload }) {
      return {
        ...state,
        focusQuestionList: payload,
      };
    },
    saveStudentList(state, { payload }) {
      return {
        ...state,
        studentList: payload,
      };
    },
    saveAbsentAdminInfoList(state, { payload }) {
      return {
        ...state,
        absentAdminInfoList: payload,
      };
    },
    saveAbsentInfoList(state, { payload }) {
      return {
        ...state,
        absentInfoList: payload,
      };
    },
    saveAbsentManage(state, { payload }) {
      return {
        ...state,
        absentManage: payload,
      };
    },
    saveGradeList(state, { payload }) {
      return {
        ...state,
        stuGradeList: payload,
      };
    },
    saveTypeList(state, { payload }) {
      return {
        ...state,
        stuTypeList: payload,
      };
    },
    saveNameList(state, { payload }) {
      return {
        ...state,
        stuNameList: payload,
      };
    },
    saveKnowledgeQuestionList(state, { payload }) {
      return {
        ...state,
        knowledgeQuestionList: payload,
      };
    },
    saveErrorQuestionList(state, { payload }) {
      return {
        ...state,
        errorQuestionList: payload,
      };
    },
    saveStudentGroupList(state, { payload }) {
      return {
        ...state,
        studentGroupList: payload,
      };
    },
    saveFindUserCaptureCount(state, { payload }) {
      return {
        ...state,
        userList: payload,
      };
    },
    savePersonalizedList(state, { payload }) {
      return {
        ...state,
        personalizedList: payload,
      };
    },
    saveStudentGroupListAndStudentList(state, { payload }) {
      return {
        ...state,
        studentGroupListAndStudentList: payload,
      };
    },
    saveExportErrorQuestionList(state, { payload }) {
      return {
        ...state,
        exportErrorQuestionList: payload,
      };
    },
    saveKnowledgeErrorQuestionList(state, { payload }) {
      return {
        ...state,
        knowledgeErrorQuestionList: payload,
      };
    },
    saveDetail(state, { payload }) {
      return {
        ...state,
        segementDetail: payload,
      };
    },
    clearStudentList(state, { payload }) {
      return {
        ...state,
        studentList: [],
      };
    },
    saveWrongQuestionVersion(state, { payload }) {
      return {
        ...state,
        wrongQuestionVersion: payload,
      };
    },
    saveAllWrongQuestionVersion(state, { payload }) {
      return {
        ...state,
        allWrongQuestionVersion: payload,
      };
    },
    saveStuAllWrongQuestionVersion(state, { payload }) {
      return {
        ...state,
        stuAllWrongQuestionVersion: payload,
      };
    },
    saveListIds(state, { payload }) {
      return {
        ...state,
        listIds: payload,
      };
    },
    saveDeleteWrongQuestionVersion(state, { payload }) {
      return {
        ...state,
        deleteWrongQuestionVersion: payload,
      };
    },
    saveChangewrongquestionCorrectness(state, { payload }) {
      return {
        ...state,
        changewrongquestionCorrectness: payload,
      };
    },
    saveWrongQuestionVersionDetail(state, { payload }) {
      return {
        ...state,
        wrongQuestionVersionDetail: payload,
      };
    },
    savePushedStudentList(state, { payload }) {
      return {
        ...state,
        pushedStudentList: payload,
      };
    },
  },
};

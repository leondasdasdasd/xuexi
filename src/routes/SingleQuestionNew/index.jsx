import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, message, Popover, Tooltip } from "antd";
import { connect } from "dva";
import PropTypes from "prop-types";

import Basket from "../../components/Basket/index";
import QuestionEntryEditor from "../../components/QuestionEntryEditor";
import { trans } from "../../utils/i18n";
import { aesDecrypt, getPageQuery } from "../../utils/utils";

import icon from "../../icon.module.less";
import styles from "../SingleQuestion/index.module.less";

const parseRouteId = (value) => {
  if (
    value === undefined ||
    value === "" ||
    value === "null" ||
    (typeof value === "object" && !value)
  ) {
    return;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(
      (item) => item !== undefined && !(typeof item === "object" && !item),
    );
  }
  return value === undefined ||
    (typeof value === "object" && !value) ||
    value === ""
    ? []
    : [value];
};

const readEncryptedInputParameters = (hash) => {
  if (!String(hash || "").includes("date=")) {
    return {};
  }

  try {
    const encryptedText = String(hash).split("date=")[1];
    const rawText = aesDecrypt(encryptedText, "lsk");
    return JSON.parse(rawText) || {};
  } catch (error) {
    console.error(error);
    return {};
  }
};

const buildInitialContext = (parameters = {}) => ({
  chapterIds: toArray(parameters.chapterId),
  chapterLabels: toArray(parameters.chapterName),
  chapterSelections: toArray(parameters.chapterId),
  gradeId: parameters.gradeId,
  indicatorIds: toArray(parameters.indicatorIds),
  indicatorLabels: toArray(parameters.indicatorName),
  knowledgeIds: toArray(parameters.knowledgeIds),
  knowledgeLabels: toArray(parameters.knowledgeName),
  knowledgeSelections: toArray(parameters.knowledgeIds),
  questionLevel: parameters.questionLevelType,
  subjectId: parameters.subjectId,
  type: parameters.questionType,
});

const isRecruitQuestionMode = (query) =>
  String(query.queryZhaoShengQuestion) === "true";

const withRecruitQuestionPayload = (payload = {}, query = {}) =>
  isRecruitQuestionMode(query)
    ? {
        ...payload,
        saveZhaoShengQuestion: true,
      }
    : payload;

const withRecruitBasketPayload = (payload = {}, query = {}) =>
  isRecruitQuestionMode(query)
    ? {
        ...payload,
        queryZhaoShengQuestion: true,
      }
    : payload;

/**
 * 单题录入新页面容器，负责路由上下文和保存副作用。
 * @param {object} properties 页面属性。
 * @returns {React.ReactElement} 单题录入页面。
 */
function SingleQuestionNew(properties) {
  const {
    basketList,
    basketSubjectId,
    count,
    dispatch,
    history,
    match,
    questionItem,
  } = properties;
  const inputParametersReference = useRef(
    readEncryptedInputParameters(window.location.hash),
  );
  const editorControllerReference = useRef();
  const emptyInitialQuestionReference = useRef({});
  const adaptInitialQuestionReference = useRef();
  const [editorVersion, setEditorVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const routeQuestionId = parseRouteId(match.params.id);
  const recruitQuery = useMemo(() => getPageQuery(), []);
  const initialContext = useMemo(
    () => buildInitialContext(inputParametersReference.current),
    [],
  );
  const [newQuestionInitialContext, setNewQuestionInitialContext] =
    useState(initialContext);
  const headerTitle = routeQuestionId
    ? trans("global.editQuestion", "编辑题目")
    : trans("global.addQuestion", "新增题目");

  const refreshBasket = useCallback(
    (payload = {}) => {
      dispatch({
        type: "home/getCount",
        payload: withRecruitBasketPayload(payload, recruitQuery),
      });
      dispatch({
        type: "home/getBasketList",
        payload: withRecruitBasketPayload(payload, recruitQuery),
      });
    },
    [dispatch, recruitQuery],
  );

  useEffect(() => {
    window.parent.postMessage("padding", "*");

    if (routeQuestionId) {
      dispatch({
        type: "home/getItem",
        payload: {
          questionId: Number.parseInt(routeQuestionId, 10),
        },
      });
    }

    refreshBasket();

    return (_unusedEvent) => {
      void _unusedEvent;
      dispatch({
        type: "home/clearQuestionItem",
      });
    };
  }, [dispatch, refreshBasket, routeQuestionId]);

  const getInitialQuestion = useCallback(
    (currentQuestion) => {
      if (!routeQuestionId || !currentQuestion || !currentQuestion.questionId) {
        return emptyInitialQuestionReference.current;
      }

      if (!inputParametersReference.current.isAdapt) {
        return currentQuestion;
      }

      if (
        !adaptInitialQuestionReference.current ||
        adaptInitialQuestionReference.current.sourceQuestionId !==
          currentQuestion.questionId
      ) {
        adaptInitialQuestionReference.current = {
          ...currentQuestion,
          questionId: undefined,
          sourceQuestionId: currentQuestion.questionId,
        };
      }

      return adaptInitialQuestionReference.current;
    },
    [routeQuestionId],
  );

  const handleCancel = useCallback(
    (event) => {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      window.parent.postMessage("false", "*");
      history.go(-1);
    },
    [history],
  );

  const handleSubmit = useCallback(
    async ({ action, payload }) => {
      const effectType =
        action === "basket"
          ? "inputQuestion/importQuestionBasket"
          : "inputQuestion/importQuestion";

      setSaving(true);
      try {
        await dispatch({
          type: effectType,
          payload: withRecruitQuestionPayload(payload, recruitQuery),
          onSuccess: (_unusedResponse) => {
            void _unusedResponse;
            message.success(trans("global.operateSuccess", "操作成功"));
            if (action === "basket") {
              refreshBasket();
            }
            if (!routeQuestionId) {
              // 新增题目保存成功后重置题干，但保留用户刚选择的范围，便于连续录入同年级同学科题目。
              setNewQuestionInitialContext((currentContext) => ({
                ...currentContext,
                gradeId: payload.gradeId,
                subjectId: payload.subjectId,
              }));
              setEditorVersion((currentVersion) => currentVersion + 1);
            }
            if (routeQuestionId) {
              dispatch({
                type: "home/getItem",
                payload: {
                  questionId: Number.parseInt(routeQuestionId, 10),
                },
              });
            }
          },
        });
      } finally {
        setSaving(false);
      }
    },
    [dispatch, recruitQuery, refreshBasket, routeQuestionId],
  );

  const handleEditorControllerReady = useCallback((controller) => {
    editorControllerReference.current = controller;
  }, []);

  const submitEditor = useCallback((action) => {
    if (
      editorControllerReference.current &&
      typeof editorControllerReference.current.submit === "function"
    ) {
      editorControllerReference.current.submit(action);
    }
  }, []);

  const handleSaveBasketClick = useCallback(
    (event) => {
      event.preventDefault();
      submitEditor("basket");
    },
    [submitEditor],
  );

  const handleSaveBankClick = useCallback(
    (event) => {
      event.preventDefault();
      submitEditor("bank");
    },
    [submitEditor],
  );

  const renderEditor = useCallback(
    (currentQuestion) => {
      if (
        routeQuestionId &&
        (!currentQuestion || !currentQuestion.questionId)
      ) {
        return;
      }

      return (
        <QuestionEntryEditor
          key={editorVersion}
          initialContext={newQuestionInitialContext}
          initialQuestion={getInitialQuestion(currentQuestion)}
          onControllerReady={handleEditorControllerReady}
          onSubmit={handleSubmit}
          saving={saving}
        />
      );
    },
    [
      editorVersion,
      getInitialQuestion,
      handleEditorControllerReady,
      handleSubmit,
      newQuestionInitialContext,
      routeQuestionId,
      saving,
    ],
  );

  return (
    <Fragment>
      <div className={styles.mainContent}>
        <div className={styles.tabList} id="questionTabHeader">
          <button
            className={styles.returnMy}
            onClick={handleCancel}
            type="button"
          >
            <i className={`${icon.iconfont} ${styles.returnIcon}`}>&#xe786;</i>
            {headerTitle}
          </button>
          <div className={styles["header-actions"]}>
            <Button
              disabled={saving}
              loading={saving}
              onClick={handleSaveBasketClick}
            >
              {trans("global.saveAddBasket", "保存并加入试题篮")}
            </Button>
            <Button
              disabled={saving}
              loading={saving}
              type="primary"
              onClick={handleSaveBankClick}
            >
              {trans("global.saveQuestion", "保存到题库")}
            </Button>
            <Popover
              content={
                <Basket
                  count={count}
                  dispatch={dispatch}
                  basketList={basketList}
                  basketSubjectId={basketSubjectId}
                />
              }
              title={undefined}
              trigger="click"
              getPopupContainer={(triggerNode) =>
                document.querySelector("#questionTabHeader") || triggerNode
              }
            >
              <button className={styles.buyCar} type="button">
                <Tooltip
                  placement="top"
                  title={trans("global.basketName", "试题篮")}
                  trigger="hover"
                >
                  <span>
                    <i className={`${icon.iconfont} ${styles.buyCarIcon}`}>
                      &#xe73c;
                    </i>
                    <span className={styles.count}>{count}</span>
                    <span className={styles.split}>|</span>
                    {trans("global.gotoBasket", "去组卷")}
                  </span>
                </Tooltip>
              </button>
            </Popover>
          </div>
        </div>
      </div>
      <div className={styles.questionArea}>{renderEditor(questionItem)}</div>
    </Fragment>
  );
}

SingleQuestionNew.propTypes = {
  basketList: PropTypes.arrayOf(PropTypes.object),
  basketSubjectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  count: PropTypes.number,
  dispatch: PropTypes.func.isRequired,
  history: PropTypes.shape({
    go: PropTypes.func.isRequired,
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }).isRequired,
  questionItem: PropTypes.object,
};

SingleQuestionNew.defaultProps = {
  basketList: [],
  basketSubjectId: undefined,
  count: 0,
  questionItem: undefined,
};

export {
  buildInitialContext,
  parseRouteId,
  SingleQuestionNew as PureSingleQuestionNew,
  readEncryptedInputParameters,
  withRecruitBasketPayload,
  withRecruitQuestionPayload,
};

export default connect(({ home }) => ({
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  count: home.count,
  questionItem: home.questionItem,
}))(SingleQuestionNew);

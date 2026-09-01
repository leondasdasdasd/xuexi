//批量录入题目
import React, { PureComponent } from "react";
import { message, Modal, Popover, Select, Tooltip, TreeSelect } from "antd";
import { connect } from "dva";
import $ from "jquery";

import Basket from "components/Basket/index";
// import { routerRedux } from "dva/router";
import BatchInput from "components/InputQuestion/BatchInput";

import { serializeFn as serializeFunction } from "../../utils/froala.js";
import { trans } from "../../utils/i18n";
import { getPageQuery, getQueryPath } from "../../utils/utils";
import {
  withRecruitQuestionQueryFlag,
  withRecruitQuestionSaveFlag,
} from "./recruitPayload";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

const { Option } = Select;
const { SHOW_PARENT } = TreeSelect;

class InputQuestion extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      gradeValue: undefined,
      subjectValue: undefined,
      difficultValue: undefined,
      selectTree: [],
      selectLabel: [],
      selectChapter: undefined,
      successVisible: false,
      importType: 0,
      clearToken: 0,
      submittingQuestion: false,
      submittingBasket: false,
    };
  }

  /**
   * 判断当前页面是否处于招生题库模式。
   * @returns {boolean} true 表示当前录题页来源于招生题库
   */
  isRecruitQuestionMode = () => {
    const query = getPageQuery();
    return String(query.queryZhaoShengQuestion) === "true";
  };

  /**
   * 组装录题页保存请求参数。
   * @param {object} payload 原始请求参数
   * @returns {object} 合并招生保存标记后的请求参数
   */
  getRecruitQuestionSavePayload = (payload = {}) => {
    return withRecruitQuestionSaveFlag(payload, this.isRecruitQuestionMode());
  };

  /**
   * 组装录题页题库/试题篮查询请求参数。
   * @param {object} payload 原始请求参数
   * @returns {object} 合并招生查询标记后的请求参数
   */
  getRecruitQuestionQueryPayload = (payload = {}) => {
    return withRecruitQuestionQueryFlag(payload, this.isRecruitQuestionMode());
  };

  /**
   * 生成录题页标签切换地址，并按需保留招生上下文。
   * @param {string} path 原始路径
   * @returns {string} 最终跳转地址
   */
  getInputQuestionPath = (path) => {
    if (!this.isRecruitQuestionMode()) {
      return path;
    }
    return getQueryPath(path, {
      queryZhaoShengQuestion: true,
    });
  };
  componentDidMount() {
    window.parent.postMessage("padding", "*");
    this.props.dispatch({
      type: "home/getCount",
      payload: this.getRecruitQuestionQueryPayload(),
    });
    this.props.dispatch({
      type: "home/getBasketList",
      payload: this.getRecruitQuestionQueryPayload(),
    });
    this.props.dispatch({
      type: "inputQuestion/getAllGradeList",
    });
  }

  formatTree = (list = []) => {
    return list.map((item) => ({
      ...item,
      title: item.text,
      value: `${item.text}-${item.pinyin || ""}-${item.id}`,
      key: JSON.stringify(item.id),
      children:
        item.children && item.children.length > 0
          ? this.formatTree(item.children)
          : item.children,
    }));
  };

  changeGrade = (value) => {
    this.setState(
      {
        gradeValue: value,
        subjectValue: undefined,
        selectChapter: undefined,
        selectTree: [],
      },
      () => {
        // this.props.dispatch(
        //   routerRedux.push(
        //     this.getInputQuestionPath(`/inputQuestion/${value}`),
        //   ),
        // );
        this.props.dispatch({
          type: "inputQuestion/getSubjectList",
          payload: {
            gradeId: value,
          },
        });
        this.props.dispatch({
          type: "inputQuestion/cleanTree",
        });
      },
    );
  };

  changeSubject = (value) => {
    this.setState(
      {
        subjectValue: value,
        selectTree: [],
        selectLabel: [],
        selectChapter: undefined,
      },
      () => {
        const { gradeValue } = this.state;
        this.props.dispatch({
          type: "inputQuestion/getTree",
          payload: {
            subjectId: value,
            gradeId: gradeValue,
          },
        });
        this.props.dispatch({
          type: "inputQuestion/getLabel",
          payload: {
            subjectId: value,
            gradeId: gradeValue,
          },
        });
        this.props.dispatch({
          type: "inputQuestion/getChapter",
          payload: {
            subjectId: value,
            gradeId: gradeValue,
          },
        });
      },
    );
  };

  changeDifficulty = (value) => {
    this.setState({
      difficultValue: value,
    });
  };

  knowledgeChange = (value) => {
    this.setState({
      selectTree: value,
    });
  };

  labelChange = (value) => {
    this.setState({
      selectLabel: value,
    });
  };

  chapterChange = (value) => {
    this.setState({
      selectChapter: value,
    });
  };

  showValidationMessage = (result) => {
    if (!result || result.ok) {
      return;
    }

    const content = trans(result.messageKey, result.fallbackText);
    if (result.level === "error") {
      message.error(content);
      return;
    }

    message.info(content);
  };

  validateBatchContent = () => {
    const { gradeValue, subjectValue } = this.state;
    const previewHtml = $("#preview").html();
    const previewText = $("#preview").text();

    if (!gradeValue || !subjectValue) {
      return {
        ok: false,
        level: "info",
        messageKey: "batchInpt.message1",
        fallbackText: "年级、学科缺一不可哦~",
      };
    }

    if ($.trim(previewHtml) === "" || $.trim(previewText) === "") {
      return {
        ok: false,
        level: "info",
        messageKey: "batchInput.message2",
        fallbackText: "导入内容不能为空哦~",
      };
    }

    if ($(".check_error").size() > 0) {
      return {
        ok: false,
        level: "error",
        messageKey: "batchInput.message3",
        fallbackText: "存在错误，请检查试题~",
      };
    }

    return { ok: true };
  };

  getPayloadParams = () => {
    const {
      gradeValue,
      subjectValue,
      difficultValue,
      selectTree,
      selectLabel,
      selectChapter,
    } = this.state;

    return {
      gradeValue,
      subjectValue,
      difficultValue,
      selectTree,
      selectLabel,
      selectChapter,
    };
  };

  buildQuestionPayload = () => {
    const {
      gradeValue,
      subjectValue,
      difficultValue,
      selectTree,
      selectLabel,
      selectChapter,
    } = this.getPayloadParams();
    const questionList = serializeFunction();

    if (questionList && questionList.length > 0) {
      for (const item of questionList) {
        item.knowledgeNames = item.knowledge;
        item.indicatorNames = item.indicator;
        item.chapterNames = item.chapter;
      }
    }

    const payload = {
      questionList,
      subjectId: subjectValue,
      gradeId: gradeValue,
      indicatorIds: selectLabel,
      knowledgeIds: selectTree.map((item) =>
        Number.parseInt(String(item).split("-")[2], 10),
      ),
    };

    if (difficultValue) {
      payload.difficulty = difficultValue;
    }

    if (selectChapter) {
      payload.chapterIds = [
        Number.parseInt(String(selectChapter).split("-")[2], 10),
      ];
    }

    return payload;
  };

  buildBasketPayload = () => {
    return this.buildQuestionPayload();
  };

  getImportSuccessCount = () => {
    const { importMsg, importBasketMsg } = this.props;
    const { importType } = this.state;

    return importType === 0
      ? (importMsg ? importMsg.length : 0) || 0
      : importBasketMsg || 0;
  };

  handleImportSuccess = (importType) => {
    this.setState({
      successVisible: true,
      importType,
    });
  };

  clearLocalDraft = () => {
    window.localStorage.removeItem("yungu_question");
  };

  // 保存到题库
  saveToQuestionBank = () => {
    const { dispatch } = this.props;
    const { submittingQuestion } = this.state;

    if (submittingQuestion) {
      return false;
    }

    const validation = this.validateBatchContent();
    if (!validation.ok) {
      this.showValidationMessage(validation);
      return false;
    }

    this.setState({
      submittingQuestion: true,
    });
    const payload = this.buildQuestionPayload();
    return dispatch({
      type: "inputQuestion/importQuestion",
      payload: this.getRecruitQuestionSavePayload(payload),
      onSuccess: () => {
        this.handleImportSuccess(0);
      },
    })
      .then(() => {
        this.clearLocalDraft();
        this.setState({
          submittingQuestion: false,
        });
      })
      .catch((error) => {
        this.setState({
          submittingQuestion: false,
        });
        throw error;
      });
  };

  // 保存到试题栏
  saveToBasket = () => {
    const { dispatch } = this.props;
    const { submittingBasket } = this.state;

    if (submittingBasket) {
      return false;
    }

    const validation = this.validateBatchContent();
    if (!validation.ok) {
      this.showValidationMessage(validation);
      return false;
    }

    this.setState({
      submittingBasket: true,
    });
    const payload = this.buildBasketPayload();
    return dispatch({
      type: "inputQuestion/importQuestionBasket",
      payload: this.getRecruitQuestionSavePayload(payload),
      onSuccess: () => {
        dispatch({
          type: "home/getCount",
          payload: this.getRecruitQuestionQueryPayload(),
        });
        dispatch({
          type: "home/getBasketList",
          payload: this.getRecruitQuestionQueryPayload(),
        });
        this.handleImportSuccess(1);
      },
    })
      .then(() => {
        this.clearLocalDraft();
        this.setState({
          submittingBasket: false,
        });
      })
      .catch((error) => {
        this.setState({
          submittingBasket: false,
        });
        throw error;
      });
  };

  hideSuccessModal = () => {
    this.setState((previousState) => ({
      successVisible: false,
      clearToken: previousState.clearToken + 1,
    }));
  };

  render() {
    const {
      allGradeList,
      basketList,
      basketSubjectId,
      chapterList,
      count,
      labelList,
      subjectList,
      treeData,
    } = this.props;
    const {
      gradeValue,
      subjectValue,
      difficultValue,
      selectTree,
      selectLabel,
      selectChapter,
      successVisible,
      clearToken,
    } = this.state;
    const tProperties = {
      treeData: this.formatTree(treeData || []),
      value: selectTree,
      onChange: this.knowledgeChange,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("singleInput.knowledgeTree", "知识点"),
      showSearch: true,
      style: {
        width: "100%",
        height: "36px",
      },
    };
    const lProperties = {
      treeData: labelList,
      value: selectLabel,
      onChange: this.labelChange,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("singleInput.label", "素养"),
      showSearch: true,
      style: {
        width: "100%",
        height: "36px",
      },
    };
    const cProperties = {
      treeData: chapterList,
      value: selectChapter,
      onChange: this.chapterChange,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("global.chapter", "章节"),
      showSearch: true,
      style: {
        width: "100%",
        height: "36px",
      },
    };

    return (
      <div>
        <div className={styles.mainContent}>
          <div className={styles.tabList} id="questionTabHeader">
            <div
              className={styles.returnMy}
              onClick={() => {
                window.parent.postMessage("false", "*");
                this.props.history.go(-1);
              }}
            >
              <i className={`${icon.iconfont} ${styles.returnIcon}`}>
                &#xe786;
              </i>
              {trans("global.machImport", "批量录入题目")}
            </div>
            <div className={styles.filterPanel}>
              <div className={styles.filterChoice}>
                <div className={styles.filterItem}>
                  <Select
                    className={styles.selectStyle}
                    onChange={this.changeGrade}
                    value={gradeValue}
                    placeholder={trans("global.grade", "年级")}
                    style={{ width: "100%" }}
                  >
                    {allGradeList &&
                      allGradeList.length > 0 &&
                      allGradeList.map((item) => (
                        <Option value={item.gradeId} key={item.gradeId}>
                          <a title={item.name} className={styles.subjectName}>
                            {item.name}
                          </a>
                        </Option>
                      ))}
                  </Select>
                </div>
                <div className={styles.filterItem}>
                  <Select
                    className={styles.selectStyle}
                    onChange={this.changeSubject}
                    value={subjectValue}
                    placeholder={trans("global.subject", "学科")}
                    style={{ width: "100%" }}
                  >
                    {subjectList &&
                      subjectList.length > 0 &&
                      subjectList.map((item) => (
                        <Option value={item.id} key={item.id}>
                          <a title={item.name} className={styles.subjectName}>
                            {item.name}
                          </a>
                        </Option>
                      ))}
                  </Select>
                </div>
                <div className={styles.filterItem}>
                  <Select
                    className={styles.selectStyle}
                    onChange={this.changeDifficulty}
                    value={difficultValue}
                    placeholder={trans("global.hardValue", "难度")}
                    style={{ width: "100%" }}
                  >
                    <Option value={1} key={0}>
                      <a
                        title={trans("global.easy", "简单")}
                        className={styles.subjectName}
                      >
                        {trans("global.easy", "简单")}
                      </a>
                    </Option>
                    <Option value={2} key={1}>
                      <a
                        title={trans("global.general", "普通")}
                        className={styles.subjectName}
                      >
                        {trans("global.general", "普通")}
                      </a>
                    </Option>
                    <Option value={3} key={2}>
                      <a
                        title={trans("global.difficult", "困难")}
                        className={styles.subjectName}
                      >
                        {trans("global.difficult", "困难")}
                      </a>
                    </Option>
                  </Select>
                </div>
                <div className={styles.filterItem}>
                  <TreeSelect {...tProperties} />
                </div>
                <div className={[styles.filterItem, styles.treeBox].join(" ")}>
                  <TreeSelect {...lProperties} />
                </div>
                <div className={styles.filterItem}>
                  <TreeSelect {...cProperties} />
                </div>
              </div>
              <div className={styles.filterTools}>
                <div className={styles.filterActions}>
                  <span
                    className={styles.whiteBtn}
                    onClick={this.saveToQuestionBank}
                  >
                    {trans("batchInput.saveToExam", "保存到题库")}
                  </span>
                  <span className={styles.blueBtn} onClick={this.saveToBasket}>
                    {trans("batchInput.saveToBasket", "保存并加入试题篮")}
                  </span>
                </div>
                <Popover
                  content={
                    <Basket
                      count={count}
                      dispatch={this.props.dispatch}
                      basketList={basketList}
                      basketSubjectId={basketSubjectId}
                    />
                  }
                  title={null}
                  trigger="click"
                  getPopupContainer={() =>
                    document.querySelector("#questionTabHeader")
                  }
                >
                  <div className={styles.buyCar}>
                    <Tooltip
                      placement="top"
                      title={trans("global.basketName", "试题篮")}
                      trigger={"hover"}
                    >
                      <i className={`${icon.iconfont} ${styles.buyCarIcon}`}>
                        &#xe73c;
                      </i>
                      <span className={styles.count}>{count}</span>
                      <span className={styles.split}>|</span>
                      {trans("global.gotoBasket", "去组卷")}
                    </Tooltip>
                  </div>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.questionArea}>
          <BatchInput difficultValue={difficultValue} clearToken={clearToken} />
        </div>

        <Modal
          footer={null}
          title={null}
          visible={successVisible}
          onCancel={this.hideSuccessModal}
          closable={false}
          maskClosable={false}
        >
          <div className={styles.importResult}>
            <h4>{trans("batchInput.result", "录入结果")}</h4>
            <p className={styles.resultTips}>
              {trans("batchInput.importSuccess", "成功录入")}
              <em className={styles.success}>{this.getImportSuccessCount()}</em>
              {trans("import.stemNum", "道试题")}，
              {trans("import.fail", "失败")}
              <em className={styles.error}>0</em>
              {trans("import.stemNum", "道试题")}
            </p>
            <div className={styles.operBtn1}>
              <span className={styles.blueBtn} onClick={this.hideSuccessModal}>
                {trans("batchInput.continueImport", "继续录入")}
              </span>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default connect(({ inputQuestion, home }) => ({
  allGradeList: inputQuestion.allGradeList,
  subjectList: inputQuestion.subjectList,
  treeData: inputQuestion.treeData,
  labelList: inputQuestion.labelList,
  chapterList: inputQuestion.chapterList,
  importMsg: inputQuestion.importMsg,
  importBasketMsg: inputQuestion.importBasketMsg,
  basketList: home.basketList,
  count: home.count,
  basketSubjectId: home.basketSubjectId,
}))(InputQuestion);

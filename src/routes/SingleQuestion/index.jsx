//批量录入题目
import React, { PureComponent } from "react";
import { Popover, Tooltip } from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import pathToRegexp from "path-to-regexp";

import Basket from "components/Basket/index";
import SingleInput from "components/InputQuestion/SingleInput"; //单题录入题目

import newIcon from "../../assets/new.png";
import { trans } from "../../utils/i18n";
import { aesDecrypt, getPageQuery, getQueryPath } from "../../utils/utils";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

class InputQuestion extends PureComponent {
  constructor(properties) {
    super(properties);
    this.singleInputParams = {};
    this.url = this.props.history.location.pathname;
    this.pathMatch =
      pathToRegexp("/singleInput/:id?").exec(this.url) ||
      pathToRegexp("/mutipleInput/:id?").exec(this.url);
    this.id = properties.match.params.id
      ? JSON.parse(properties.match.params.id)
      : null;
    const search = window.location.hash;
    if (search && search.includes("date=")) {
      let queryParameters = search.split("date=")[1];
      let objectString = aesDecrypt(queryParameters, "lsk");
      this.singleInputParams = JSON.parse(objectString);
      console.log(this.singleInputParams, "singleInputParams");
    }
    this.state = {
      selectedType: 0,
      visible: false,
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
   * 组装录题页试题篮请求参数。
   * @param {object} payload 原始请求参数
   * @returns {object} 合并招生参数后的请求参数
   */
  getRecruitQuestionPayload = (payload = {}) => {
    if (!this.isRecruitQuestionMode()) {
      return payload;
    }
    return {
      ...payload,
      queryZhaoShengQuestion: true,
    };
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

    if (this.id) {
      this.props.dispatch({
        type: "home/getItem",
        payload: {
          questionId: Number.parseInt(this.id, 10),
        },
      });
    }
    this.props.dispatch({
      type: "home/getCount",
      payload: this.getRecruitQuestionPayload(),
    });
    this.props.dispatch({
      type: "home/getBasketList",
      payload: this.getRecruitQuestionPayload(),
    });
  }

  //切换录入题型
  changeInputType = (type) => {
    this.setState(
      {
        selectedType: type,
      },
      () => {
        this.props.dispatch(
          routerRedux.push(
            this.getInputQuestionPath(`/inputQuestion/${this.id}/${type}`),
          ),
        );
      },
    );
  };

  //渲染题目类型
  renderInputType = (type) => {
    const { selectedType } = this.state;
    return type.map((item) => {
      let tips =
        item.key == 0
          ? trans("inputQuestion.applyToTest", "直接输入或粘贴题目和答案")
          : item.key == 1
            ? trans(
                "inputQuestion.batchInputStem",
                "支持复制批量内容导入，自动识别题目",
              )
            : trans(
                "inputQuestion.acceptBatch",
                "适用于测验考试，支持复制批量内容导入，自动识别题目",
              );
      return (
        <div
          key={item.key}
          className={
            selectedType == item.key
              ? styles.selectInputButton
              : styles.inputButton
          }
          onClick={() => this.changeInputType(item.key)}
        >
          <span className={styles.inputTitle}>
            <em>{item.name}</em>
            {item.key == 0 && <img src={newIcon} className={styles.newIcon} />}
          </span>
          <span className={styles.inputTips}>{tips}</span>
        </div>
      );
    });
  };
  handleMenuClick = (e) => {
    if (e.key === "1") {
      this.setState({ visible: false });
    }
  };
  render() {
    const { selectedType } = this.state;
    const { questionItem, basketList, basketSubjectId } = this.props;
    const inputType = [
      { name: trans("inputQuestion.singleInput", "单题录入"), key: 0 },
      { name: trans("inputQuestion.batchInput", "批量录入"), key: 1 },
      //   {
      //     name: trans("inputQuestion.excel", "EXCEL文件导入（敬请期待）"),
      //     key: 2,
      //   },
    ];
    return (
      <div>
        <div className={styles.mainContent}>
          <div className={styles.tabList} id="questionTabHeader">
            {/* {menuTab.map((item, index) => (
              <div
                key={index}
                className={item.cur ? styles.cur : styles.normal}
              >
                <Link to={item.path}>{item.name}</Link>
              </div>
            ))} */}
            <div
              className={styles.returnMy}
              onClick={() => {
                window.parent.postMessage("false", "*");
                this.props.history.go(-1);
              }}
            >
              {/* <i className={styles.iconfont}>&#xe786;</i> */}
              <i className={`${icon.iconfont} ${styles.returnIcon}`}>
                &#xe786;
              </i>
              {/* {selectedType == 0
                ? trans("global.singleEntryTitle", "单题录入题目")
                : trans("global.machImport", "批量录入题目")} */}
              {trans("global.singleEntryTitle", "单题录入题目")}
            </div>
            {/* <div className={styles.questionBank}>保存到题库</div>
            <div className={styles.testBasket}>保存并加入试题篮</div> */}
            <Popover
              content={
                <Basket
                  count={this.props.count}
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
                  <span className={styles.count}>{this.props.count}</span>
                  <span className={styles.split}>|</span>
                  {trans("global.gotoBasket", "去组卷")}
                </Tooltip>
              </div>
            </Popover>
          </div>
          {/* <div className={styles.inputType}>
            <div className={styles.inputArea}>
              {this.renderInputType(inputType)}
            </div>
          </div> */}
        </div>
        {/* <div className={styles.inputType}>
          <div className={styles.inputArea}>
            {this.renderInputType(inputType)}
          </div>
        </div> */}

        <div className={styles.questionArea}>
          {/* {selectedType == 0 ? ( */}
          {this.id ? (
            questionItem && questionItem.questionId ? (
              <SingleInput
                editQuestion={this.props.questionItem}
                isAdapt={this.singleInputParams.isAdapt}
              />
            ) : null
          ) : (
            <SingleInput
              gradeId={this.singleInputParams.gradeId}
              subjectId={this.singleInputParams.subjectId}
              questionType={this.singleInputParams.questionType}
              questionLevelType={this.singleInputParams.questionLevelType}
              chapterId={this.singleInputParams.chapterId}
              chapterName={this.singleInputParams.chapterName}
              knowledgeIds={this.singleInputParams.knowledgeIds}
              knowledgeName={this.singleInputParams.knowledgeName}
              indicatorIds={this.singleInputParams.indicatorIds}
              indicatorName={this.singleInputParams.indicatorName}
            />
          )}
        </div>
      </div>
    );
  }
}
export default connect(({ inputQuestion, home }) => ({
  editQuestion: inputQuestion.editQuestion,
  questionItem: home.questionItem,
  basketList: home.basketList,
  count: home.count,
  basketSubjectId: home.basketSubjectId,
}))(InputQuestion);

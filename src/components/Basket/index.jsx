//横向菜单
import React, { PureComponent } from "react";
import { connect } from "dva";
import { Link } from "dva/router";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import { getPageQuery, getQueryPath } from "../../utils/utils";

import styles from "./index.module.less";
export class Basket extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  /**
   * 判断当前页面是否处于招生题库模式。
   * @returns {boolean} true 表示当前跳转需要保留招生上下文
   */
  isRecruitQuestionMode = () => {
    const query = getPageQuery();
    return String(query.queryZhaoShengQuestion) === "true";
  };

  /**
   * 生成预览组卷跳转地址。
   * @param {number|string} basketSubjectId 当前试题篮学科 id
   * @returns {string} 组卷详情页地址
   */
  getDetailPath = (basketSubjectId) => {
    const { previewPathBuilder } = this.props;
    if (previewPathBuilder) {
      return previewPathBuilder(basketSubjectId);
    }
    const path = `/detail/true/false/${basketSubjectId}`;
    if (!this.isRecruitQuestionMode()) {
      return path;
    }
    return getQueryPath(path, {
      queryZhaoShengQuestion: true,
    });
  };

  componentDidMount() {
    const dom = document.querySelector("#tabHeader");
    const aimNode = document.getElementById(`tab${this.props.basketSubjectId}`);
    if (aimNode && aimNode.offsetLeft > 200) {
      dom.scrollLeft = aimNode.offsetLeft;
    }
  }
  checkTab = (id) => {
    this.props.dispatch({
      type: "home/checkBasketTab",
      payload: id,
    });
  };
  render() {
    let { basketList, basketSubjectId, count, previewDisabled } = this.props;
    return (
      <div className={styles.basket}>
        <div className={styles.header} id="tabHeader">
          <div className={styles.tabList}>
            {basketList && basketList.length > 0
              ? basketList.map((item) => (
                  <div
                    key={item.subjectId}
                    className={[
                      styles.headerTab,
                      basketSubjectId === item.subjectId ? styles.checked : "",
                    ].join(" ")}
                    id={`tab${item.subjectId}`}
                    onClick={this.checkTab.bind(this, item.subjectId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        this.checkTab(item.subjectId);
                      }
                    }}
                    role="tab"
                    tabIndex={0}
                  >
                    {item.subjectName}({item.subjectQuestionNum})
                  </div>
                ))
              : null}
          </div>
        </div>
        {basketList && basketList.length > 0
          ? basketList.map((item) =>
              item.subjectId === basketSubjectId &&
              item.questionBasketByTypeModels &&
              item.questionBasketByTypeModels.length > 0
                ? item.questionBasketByTypeModels.map((it, ind) => (
                    <div className={styles.content} key={ind}>
                      <div className={styles.questionContent}>
                        <div className={styles.title}>
                          <div>{it.typeName}</div>
                          <div>{it.questionNum}</div>
                        </div>
                        {it.questionType != 7 && it.questionType != 8 ? (
                          <div className={styles.chart}>
                            <div>{trans("global.difficulty", "难度分布")}</div>
                            <div className={styles.viewChart}>
                              <div
                                className={[styles.easy, styles.global].join(
                                  " ",
                                )}
                                style={{
                                  width: `${
                                    (it.simpleQuestionNumber / it.questionNum) *
                                    100
                                  }%`,
                                }}
                              >
                                {it.simpleQuestionNumber ? (
                                  <div className={styles.message}>
                                    {trans("global.easy", "简单")}
                                  </div>
                                ) : null}
                              </div>
                              <div
                                className={[styles.common, styles.global].join(
                                  " ",
                                )}
                                style={{
                                  width: `${
                                    (it.generalQuestionNumber /
                                      it.questionNum) *
                                    100
                                  }%`,
                                }}
                              >
                                {it.generalQuestionNumber ? (
                                  <div className={styles.message}>
                                    {trans("global.general", "普通")}
                                  </div>
                                ) : null}
                              </div>
                              <div
                                className={[
                                  styles.difficult,
                                  styles.global,
                                ].join(" ")}
                                style={{
                                  width: `${
                                    (it.difficultQuestionNumber /
                                      it.questionNum) *
                                    100
                                  }%`,
                                }}
                              >
                                {it.difficultQuestionNumber ? (
                                  <div className={styles.message}>
                                    {trans("global.difficult", "困难")}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                : null,
            )
          : null}
        {count && count > 0 && !previewDisabled ? (
          <div>
            <Link
              to={this.getDetailPath(basketSubjectId)}
              className={styles.viewLink}
            >
              {trans("global.groupView", "预览组卷")}
            </Link>
          </div>
        ) : (
          <div className={styles.notLink}>
            {trans("global.groupView", "预览组卷")}
          </div>
        )}
      </div>
    );
  }
}

Basket.propTypes = {
  basketList: PropTypes.arrayOf(
    PropTypes.shape({
      questionBasketByTypeModels: PropTypes.arrayOf(PropTypes.object),
      subjectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      subjectName: PropTypes.string,
      subjectQuestionNum: PropTypes.number,
    }),
  ),
  basketSubjectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  count: PropTypes.number,
  dispatch: PropTypes.func.isRequired,
  previewDisabled: PropTypes.bool,
  previewPathBuilder: PropTypes.func,
};

Basket.defaultProps = {
  basketList: [],
  basketSubjectId: undefined,
  count: 0,
  previewDisabled: false,
  previewPathBuilder: undefined,
};

export default connect(({ home }) => ({
  viewData: home.viewData,
}))(Basket);

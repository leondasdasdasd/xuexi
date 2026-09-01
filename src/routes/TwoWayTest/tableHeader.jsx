import React, { PureComponent } from "react";
import { Checkbox, Tooltip } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

export class TableHeader extends PureComponent {
  static propTypes = {
    allChecked: PropTypes.bool.isRequired,
    onCheckAllTable: PropTypes.func.isRequired,
  };

  render() {
    const { allChecked, onCheckAllTable } = this.props;
    return (
      <div className={[styles.twoWayTableHeader].join(" ")}>
        <div>
          <Checkbox onChange={onCheckAllTable} checked={allChecked} />
          &nbsp;
          {trans("analysis.questionIndex", "题号")}
        </div>

        <div>{trans("global.questionType", "题型")}</div>

        <div className={styles.smallMiddleTitle}>
          {trans("detail.questionScore", "分值")}
          <span className={styles.red}>*</span>
        </div>

        <div className={styles.smallMiddleTitle}>
          {trans("global.predictedDifficulty", "预测难度")}
          <span className={styles.red}>*</span>
          <Tooltip
            title={trans(
              "global.difficultMessage",
              "预测难度系数，可输入0~1之间的数字，最多2位小数",
            )}
          >
            <i style={{ marginLeft: "5px" }} className={icon.iconfont}>
              &#xe7e3;
            </i>
          </Tooltip>
        </div>

        <div>
          {trans("singleInput.difficultyContent", "难易程度")}
          <span className={styles.red}>*</span>
        </div>

        <div>
          {trans("global.sources", "来源")}
          <span className={styles.red}>*</span>
        </div>

        <div>{trans("global.chapter", "章节")}</div>

        <div>{trans("singleInput.knowledgeTree", "知识点")}</div>

        <div>{trans("singleInput.label", "素养")}</div>

        <div>
          {trans("global.guanlian", "关联题目")}
          <span className={styles.red}>*</span>
        </div>

        <div>
          {trans("global.subquestions", "子题")}
          <span className={styles.red}>*</span>
          <Tooltip
            title={trans(
              "global.ifChildEx",
              "设置子题数量后，可自动生成该题的多个子题答题卡区域",
            )}
          >
            <i style={{ marginLeft: "5px" }} className={icon.iconfont}>
              &#xe7e3;
            </i>
          </Tooltip>
        </div>

        <div>
          {trans("global.similarQuestions", "相似题")}
          <Tooltip
            title={trans(
              "global.quoteMessage",
              "设置子题数量后，可自动生成该题的多个子题答题卡区域",
            )}
          >
            <i style={{ marginLeft: "5px" }} className={icon.iconfont}>
              &#xe7e3;
            </i>
          </Tooltip>
        </div>

        <div aria-hidden="true" />
      </div>
    );
  }
}
export default TableHeader;

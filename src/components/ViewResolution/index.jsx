import React, { PureComponent } from "react";
import { Input, Tabs } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";
const { TabPane } = Tabs;
import { Guide } from "bizcharts";
import pathToRegexp from "path-to-regexp";

import styles from "./index.module.less";

const { Search } = Input;
const { Text } = Guide;
class ViewResolution extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/viewResolution/:paperId/:questionId").exec(
      this.url,
    );
    this.reload = false;
    this.paperId = JSON.parse(this.pathMatch[1]);
    this.questionId = JSON.parse(this.pathMatch[2]);
    this.state = {};
  }
  componentDidMount() {
    this.props.dispatch({
      type: "home/getItem",
      payload: {
        questionId: this.questionId,
      },
    });
  }

  back = () => {
    window.close(
      `${window.location.origin}/#/detail/true/false/${this.paperId}`,
    );
  };

  render() {
    // console.log(this.paperId, this.questionId, "ccc");
    console.log(this.props.questionItem, "ccc");
    return (
      <div className={styles.viewResolution}>
        <div className={styles.header}>
          <span className={styles.headerLeft} onClick={this.back}>
            <i className={[styles.iconfont, styles.back].join(" ")}>&#xe6ff;</i>
            <span className={styles.headerTitle}>
              {trans("global.goBack", "返回")}
            </span>
          </span>
        </div>
        <div className={styles.contentQuestion}>
          {this.props.questionItem?.analysis ? (
            <span>
              <span className={styles.analysisTitle}>
                {trans("global.analysis", "解析")}:
              </span>

              <span className={styles.analysis}>
                {/* {this.props.questionItem.analysis} */}
                <div
                  dangerouslySetInnerHTML={{
                    __html: this.props.questionItem.analysis,
                  }}
                ></div>
              </span>
            </span>
          ) : (
            "暂无解析"
          )}
        </div>
      </div>
    );
  }
}

export default connect(({ home }) => ({
  questionItem: home.questionItem,
}))(ViewResolution);

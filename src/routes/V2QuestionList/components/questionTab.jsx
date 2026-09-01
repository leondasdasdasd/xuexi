//新闻
import React, { PureComponent } from "react";

import { trans } from "../../../utils/i18n";

import styles from "./questionTab.module.less";

class QuestionTab extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      cur: 1,
    };
  }
  componentDidMount() {}

  change = (value) => {
    this.setState({
      cur: value,
    });
    this.props.onChange && this.props.onChange(value);
  };

  render() {
    return (
      <div className={styles.menuTab}>
        <div
          className={`${styles.normal} ${styles.leftMal} ${this.state.cur === 1 ? styles.cur : styles.nocur}`}
          onClick={this.change.bind(this, 1)}
        >
          {trans("global.myQuestionNum", "我的题目")}
        </div>
        <div
          className={`${styles.normal} ${styles.rightMal} ${this.state.cur === 2 ? styles.cur : styles.nocur}`}
          onClick={this.change.bind(this, 2)}
        >
          {trans("global.schoolQuestionNum", "校本题目")}
        </div>
      </div>
    );
  }
}

export default QuestionTab;

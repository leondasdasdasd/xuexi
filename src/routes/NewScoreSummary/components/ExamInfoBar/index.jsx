import React, { PureComponent } from "react";

import styles from "./index.module.less";
class ExamInfoBar extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  render() {
    const { reportTypeName, gradeName, createTime } = this.props;
    return (
      <div className={styles.exam_info_bar}>
        <span className={styles.bar}>
          <i className={styles.iconfont}>&#xe798;</i>
          &nbsp;{gradeName || "--"}
        </span>
        <span className={styles.bar}>
          <i className={styles.iconfont}>&#xe624;</i>
          &nbsp;{reportTypeName || "--"}
        </span>
        <span className={styles.bar}>
          <i className={styles.iconfont}>&#xe61f;</i>
          &nbsp;{createTime || "--"}
        </span>
        {/* <span className={styles.bar}>
                    <i className={styles.iconfont}>&#xe634;</i>
                </span> */}
      </div>
    );
  }
}
export default ExamInfoBar;

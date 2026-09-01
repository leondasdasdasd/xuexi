//新闻
import React, { PureComponent } from "react";

import styles from "./index.module.less";
class ViewAnalysisButton extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  componentDidMount() {}

  render() {
    return (
      <div className={`${styles.viewResolution}`} onClick={this.props.onClick}>
        <i className={styles.iconfont}>&#xe631;</i>
        {this.props.text}
      </div>
    );
  }
}

export default ViewAnalysisButton;

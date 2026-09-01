// 类组件
import React from "react";
import { Switch } from "antd";

import styles from "./index.module.less";

class ChartSwitch extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      // xxx: nextProps.xxx,
    };
  }

  componentDidMount() {}

  render() {
    const { label, style } = this.props;
    return (
      <div className={styles.chartSwitchContainer} style={style || {}}>
        <div className={styles.chartSwitch}>
          <div className={styles.label}> {label}</div>
          <Switch {...this.props} />
        </div>
      </div>
    );
  }
}

export default ChartSwitch;

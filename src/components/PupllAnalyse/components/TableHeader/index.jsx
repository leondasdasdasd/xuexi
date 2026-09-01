// 类组件
import React from "react";

import styles from "./index.module.less";

class TableHeader extends React.Component {
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
    const { titleName, slot } = this.props;
    return (
      <div className={styles.tableHeader}>
        <div className={styles.point}></div>
        <div className={styles.tableHeaderTitle}>{titleName}</div>
        <div style={{ flexGrow: 1 }}>{slot}</div>
      </div>
    );
  }
}

export default TableHeader;

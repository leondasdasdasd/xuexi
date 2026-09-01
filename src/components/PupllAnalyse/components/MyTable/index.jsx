// 类组件
import React from "react";
import { Table } from "antd";

import styles from "./index.module.less";

class MyTable extends React.Component {
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
    return <Table className={styles.myTable} {...this.props} />;
  }
}

export default MyTable;

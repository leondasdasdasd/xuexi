// 类组件
import React from "react";

import styles from "./index.module.less";

class Loding extends React.Component {
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
    return (
      <div className={styles.sk_circle}>
        <div className={` ${styles.sk_circle1} ${styles.sk_child}`}></div>
        <div className={`${styles.sk_circle2} ${styles.sk_child}`}></div>
        <div className={`${styles.sk_circle3} ${styles.sk_child}`}></div>
        <div className={`${styles.sk_circle4} ${styles.sk_child}`}></div>
        <div className={`${styles.sk_circle5} ${styles.sk_child}`}></div>
        <div className={`${styles.sk_circle6} ${styles.sk_child}`}></div>
        <div className={`${styles.sk_circle7} ${styles.sk_child}`}></div>
        <div className={`${styles.sk_circle8} ${styles.sk_child}`}></div>
        <div className={`${styles.sk_circle9} ${styles.sk_child}`}></div>
      </div>
    );
  }
}

export default Loding;

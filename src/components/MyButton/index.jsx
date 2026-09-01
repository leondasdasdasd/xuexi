// 类组件
import React from "react";
import { Button } from "antd";

import styles from "./index.module.less";

class MyButton extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  componentDidMount() {}

  render() {
    const { sizeclass, typeclass } = this.props;

    /***
     *
     * MyButton组件做了一层只是增强了sizeClass typeClass这两个属性
     *
     * 大 bigBtn ｜ 常规 commonBtn ｜ 小 smallBtn ｜ 超小 暂无
     *
     * 主  要 confirmBtn
     * 次  级 minor
     * 若次级 cancelBtn
     * 文  字 text
     */
    // 实例·
    // <MyButton typeclass="commonBtn" sizeclass="confirmBtn" ></MyButton>

    return (
      <Button
        {...this.props}
        className={`${styles.btn} ${sizeclass ? styles[sizeclass] : ""} ${typeclass ? styles[typeclass] : ""}`}
      >
        {this.props.children}
      </Button>
    );
  }
}

export default MyButton;

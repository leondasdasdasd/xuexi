// 类组件
import React from "react";

import styles from "./index.module.less";

class StepProgressBar extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      activeKey: 1,
    };
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      activeKey: nextProperties.activeKey,
    };
  }

  componentDidMount() {}
  changeTab = (value) => {
    this.props.onChange(value);
    this.setState({
      activeKey: value.key,
    });
  };
  render() {
    const { activeKey } = this.state;
    const { data, style = {} } = this.props;

    /**
     *
     * @param index_
     */
    function getPreviousBar(index_) {
      for (const [index, element] of data.entries()) {
        if (
          element.key === activeKey && // 当前激活元素的前一个元素
          index_ + 1 === index
        ) {
          return true;
        }
      }
      return "";
    }

    /**
     *
     * @param index_
     */
    function getFinishBar(index_) {
      for (const [index, element] of data.entries()) {
        if (
          element.key === activeKey && // 当前激活元素的前面的元素
          index_ < index
        ) {
          return true;
        }
      }
      return "";
    }

    /**
     *
     * @param index_
     */
    function getWaitBar(index_) {
      for (const [index, element] of data.entries()) {
        if (
          element.key === activeKey && // 当前激活元素的前面的元素
          index_ > index
        ) {
          return true;
        }
      }
      return "";
    }

    return (
      <div className={styles.stepProgressBarContainer} style={style}>
        <div className={styles.tabsNavWrap}>
          {data.map((item, index) => (
            <div
              className={`${styles.tabsBar} ${activeKey == item.key ? styles.tabsTabActive : ""} ${getFinishBar(index) ? styles.stepsItemFinish : ""} ${getWaitBar(index) ? styles.stepsItemWait : ""}`}
              key={item.key}
              onClick={this.changeTab.bind(this, item)}
            >
              {["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"][index]}&nbsp;
              {item.tab}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default StepProgressBar;

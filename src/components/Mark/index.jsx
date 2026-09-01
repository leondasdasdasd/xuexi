// 类组件
import React from "react";

import styles from "./markType.module.less";

class MarkType extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      activeKey: "1",
    };
  }
  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      // xxx: nextProps.xxx,
    };
  }

  componentDidMount() {
    this.setState({
      activeKey: this.props.activeKey,
    });
  }
  changeTab = (value) => {
    this.props.onChange(value);
    this.setState({
      activeKey: value.key,
    });
  };

  render() {
    const { activeKey } = this.state;
    const { data } = this.props;
    /**
     *
     * @param i
     * @param index_
     */
    function getPreviousBar(index_) {
      for (const [index, element] of data.entries()) {
        if (
          element.key === activeKey && // 当前激活元素的前一个元素
          index_ + 1 === index
        ) {
          return styles.getPrevBar;
        }
      }
      return "";
    }

    return (
      <div className={styles.tabsNavContainer}>
        <div className={styles.tabsNavWrap}>
          {data.map((item, index) => (
            <div
              className={`${styles.tabsBar} ${activeKey == item.key ? styles.tabsTabActive : ""} ${getPreviousBar(index)}`}
              key={item.key}
              onClick={this.changeTab.bind(this, item)}
            >
              {item.tab}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default MarkType;

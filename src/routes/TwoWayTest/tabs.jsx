// 类组件
import React from "react";

import styles from "./question.less";

class tabs extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  changeTab = (value) => {
    if (this.props.onChange) {
      this.props.onChange(value);
    }
  };
  render() {
    const { data, label, id, activeKey } = this.props;
    let temporaryKey = id || "id";
    let temporaryLabel = label || "name";
    return (
      <div className={styles.tabs}>
        <div className={styles.tabsWrap}>
          {data?.map((item, index) => (
            <div
              className={`${styles.tabsBar} ${activeKey == item[temporaryKey] ? styles.tabsTabActive : ""}`}
              key={item[temporaryKey]}
              onClick={() => this.changeTab(item)}
            >
              {item[temporaryLabel]}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
export default tabs;

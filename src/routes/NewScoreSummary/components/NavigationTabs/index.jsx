import React, { PureComponent } from "react";

import styles from "./index.module.less";
class NavigationTabs extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  render() {
    const { tabs, activeKey, onTabChange } = this.props;
    return (
      <div className={styles.navigation_tabs}>
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`${styles.tab} ${activeKey === tab.key ? `${styles.active}` : ""}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>
    );
  }
}
export default NavigationTabs;

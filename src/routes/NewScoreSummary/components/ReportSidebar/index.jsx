import React, { PureComponent } from "react";

import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";
class ReportSidebar extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      selectedKey: this.props.selectedKey,
    };
  }

  handleClick = (key, onClick) => {
    const { onActiveChange } = this.props;
    this.setState({
      selectedKey: key,
    });

    if (onActiveChange) {
      onActiveChange(key);
    }

    if (onClick) {
      onClick();
    }
  };

  render() {
    const { sections, style } = this.props;
    return (
      <div className={styles.report_sidebar} style={style}>
        <h3 className={styles.sidebar_title}>
          {trans("scoreSummary.reportDirectory", "目录")}
        </h3>
        <div className={styles.sidebar_list}>
          {sections.map((section) => (
            <div
              key={section.key}
              className={`${styles.sidebar_item} ${this.state.selectedKey === section.key ? styles.active : ""}`}
              onClick={() => this.handleClick(section.key, section.onClick)}
            >
              {section.label}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
export default ReportSidebar;

import React, { PureComponent } from "react";

import styles from "./index.module.less";
class ActionButtons extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  render() {
    const { buttons } = this.props;
    return (
      <div className={styles.action_buttons}>
        {buttons.map((button) => (
          <div
            key={button.key}
            className={styles.action_button}
            onClick={button.onClick && button.onClick}
          >
            {button.label}
          </div>
        ))}
      </div>
    );
  }
}
export default ActionButtons;

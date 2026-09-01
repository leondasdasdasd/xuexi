//抢占锁冲突提示框
import React, { PureComponent } from "react";
import { Modal } from "antd";

import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

class ClashLockModal extends PureComponent {
  constructor(properties) {
    super();
    this.state = {};
  }

  //放弃编辑
  giveUpEditing = () => {
    const { giveupLocking } = this.props;
    typeof giveupLocking == "function" && giveupLocking.call(this);
  };

  //开始编辑--强制抢锁
  forceLock = () => {
    const { forceLock, currentOperItem, source, modelKey } = this.props;
    if (source === "teachingSteps") {
      let taskId = currentOperItem.taskId;
      let id = currentOperItem.id;
      typeof forceLock == "function" && forceLock.call(this, taskId, modelKey);
    } else {
      let examId = currentOperItem.examId,
        resultType = currentOperItem.resultType;
      typeof forceLock == "function" &&
        forceLock.call(this, examId, resultType);
    }
  };

  render() {
    const { lockTipVisible, operatorTips } = this.props;
    return (
      <div>
        <Modal
          title={null}
          footer={null}
          centered
          width={346}
          closable={false}
          visible={lockTipVisible}
          onCancel={this.giveUpEditing}
        >
          <i
            className={`${icon.iconfont} ${styles.closeBtn}`}
            onClick={this.giveUpEditing}
          >
            &#xe6df;
          </i>
          <div className={styles.modalContent}>
            <p>{operatorTips}</p>
            <div className={styles.buttonStyle}>
              <span className={styles.giveup} onClick={this.giveUpEditing}>
                {trans("global.keepNo", "放弃")}
              </span>
              <span className={styles.startEdit} onClick={this.forceLock}>
                {trans("teachingPlan.startEditing", "开始编辑")}
              </span>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default ClashLockModal;

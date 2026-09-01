//自动保存或手动保存失败提示框
import React, { PureComponent } from "react";
import { Modal } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

class ReloadModal extends PureComponent {
  constructor(properties) {
    super();
    this.state = {};
  }

  reloadPage = () => {
    window.location.reload();
  };

  render() {
    const { reloadModalVisible } = this.props;
    return (
      <div>
        <Modal
          title={null}
          footer={null}
          centered
          width={346}
          closable={false}
          visible={reloadModalVisible}
          maskClosable={false}
        >
          <div className={styles.modalContent}>
            <p>
              {trans(
                "teachingPlan.reloadTips",
                "因有人已在编辑内容或页面停留时间过长，请重新刷新页面再继续操作。",
              )}
            </p>
            <div className={styles.buttonStyle}>
              <span className={styles.startEdit} onClick={this.reloadPage}>
                {trans("teachingPlan.reloadBtn", "刷新")}
              </span>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default ReloadModal;

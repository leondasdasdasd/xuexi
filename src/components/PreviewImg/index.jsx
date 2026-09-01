//图片预览
import React, { PureComponent } from "react";
import { Modal } from "antd";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

class PreviewImgModal extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  closeModal = () => {
    const { changeModalVisible } = this.props;
    typeof changeModalVisible == "function" &&
      changeModalVisible.call(this, false);
  };

  render() {
    return (
      <Modal
        visible={this.props.modalVisible}
        title={null}
        footer={null}
        onCancel={this.closeModal}
        closable={false}
        maskClosable={true}
        className={styles.imgModal}
      >
        <div className={styles.modalBack} onClick={this.closeModal}>
          <i
            className={`${icon.iconfont} ${styles.closeBtn}`}
            onClick={this.closeModal}
          >
            &#xe6a9;
          </i>
          <img src={this.props.imgUrl} className={styles.imgStyle} />
        </div>
      </Modal>
    );
  }
}

export default PreviewImgModal;

import React from "react";

import { CuModal } from "../../components/Custom";
import { trans } from "../../utils/i18n";

import styles from "./editLockModal.module.less";

/**
 * EditLockModal
 * props:
 *  - visible: boolean
 *  - title: string (default: '提示')
 *  - message: string
 *  - onCancel: () => void
 *  - onConfirm: () => void
 * @param root0
 * @param root0.visible
 * @param root0.title
 * @param root0.message
 * @param root0.onCancel
 * @param root0.onConfirm
 */
function EditLockModal({
  visible,
  title = trans("global.prompt", "提示"),
  message,
  onCancel,
  onConfirm,
}) {
  return (
    <CuModal
      centered
      visible={visible}
      title={title}
      closable={true}
      width={520}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={trans("teachingPlan.startEditing", "开始编辑")}
      cancelText={trans("global.keepNo", "放弃")}
    >
      <div className={styles.messageContent}>{message}</div>
    </CuModal>
  );
}
export default EditLockModal;

import React from "react";
import { Modal } from "antd";
import { QRCodeSVG } from "qrcode.react";

import { trans } from "../utils/i18n";
import { buildTeacherPaperTrialUrl } from "./explicitExamRoutes";

import styles from "./TeacherPaperTrialQrCodeModal.module.less";

interface Props {
  onClose: () => void;
  paperId?: number;
}

/**
 * 统一展示教师 iPad 试作二维码，确保所有试卷详情入口使用同一试作路由。
 * @param {Props} properties 当前试卷标识与关闭回调。
 * @returns {React.ReactElement} 教师 iPad 试作二维码弹窗。
 */
function TeacherPaperTrialQrCodeModal(properties: Props): React.ReactElement {
  const { onClose, paperId } = properties;
  const title = trans("paperEditor.ipadTrialModalTitle", "在 iPad 上试做本卷");

  return (
    <Modal
      centered
      className={styles.modal}
      footer={null}
      title={title}
      visible={Boolean(paperId)}
      width="24rem"
      wrapClassName={styles["modal-wrap"]}
      wrapProps={{ "aria-labelledby": "teacher-paper-trial-title" }}
      onCancel={onClose}
    >
      <div className={styles.content}>
        {paperId ? (
          <div className={styles["qr-frame"]}>
            <span aria-hidden="true" className={styles["corner-top-left"]} />
            <span aria-hidden="true" className={styles["corner-top-right"]} />
            <span aria-hidden="true" className={styles["corner-bottom-left"]} />
            <span
              aria-hidden="true"
              className={styles["corner-bottom-right"]}
            />
            <QRCodeSVG
              aria-label={title}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              role="img"
              size={184}
              value={buildTeacherPaperTrialUrl(paperId)}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default TeacherPaperTrialQrCodeModal;

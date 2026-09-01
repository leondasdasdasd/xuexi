import React from "react";
import { Modal } from "antd";

import styles from "./index.module.less";

const CuModal = ({
  modalType = "default",
  wrapClassName,
  ...restProperties
}) => {
  return (
    <Modal
      {...restProperties}
      wrapClassName={`${styles[`modal_${modalType}`]} ${wrapClassName}`}
    />
  );
};

export default CuModal;

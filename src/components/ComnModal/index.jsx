import React from "react";
import { Modal } from "antd";
import PropTypes from "prop-types";

import styles from "./index.module.less";

const ComnModal = ({ innerContent, options }) => {
  const { wrapClassName = "", ...modalOptions } = options;

  return (
    <Modal
      {...modalOptions}
      wrapClassName={`${styles["comn-modal"]} ${wrapClassName}`}
    >
      {innerContent}
    </Modal>
  );
};

ComnModal.propTypes = {
  innerContent: PropTypes.node,
  options: PropTypes.shape({
    wrapClassName: PropTypes.string,
  }).isRequired,
};

export default ComnModal;

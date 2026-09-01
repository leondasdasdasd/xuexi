import React from "react";

import noPermission1 from "../../../../assets/noPermission1.svg";
import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";
/**
 *
 * @param root0
 * @param root0.text
 */
function NoPermission({ text }) {
  return (
    <div className={styles.noPermission}>
      <img src={noPermission1} className={styles.noPermissionImg} />
      <div className={styles.noPermissionTitle}>
        {trans("noPermission.title", "暂无权限")}
      </div>
      {text ? <div className={styles.noPermissionText}>{text}</div> : null}
    </div>
  );
}
export default NoPermission;

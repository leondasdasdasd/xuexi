import React, { PureComponent } from "react";

import { locale, trans } from "../../../../../utils/i18n";

import styles from "./index.module.less";
class ClassSelector extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  changeStu = (id) => {
    this.props.onChange && this.props.onChange(id);
  };

  render() {
    const {
      title = trans("modalTest.selectClass", "请选择班级"),
      classList = [],
      selectedId = "",
    } = this.props;
    // const { selectedId: localSelectedId } = this.state;

    return (
      <div className={styles.classSelector}>
        <div className={styles.header}>{title}</div>
        <div style={{ flexGrow: "1", marginTop: "10px" }}>
          {classList && classList.length > 0
            ? classList.map((item) => (
                <div
                  key={item.groupId}
                  className={`${styles.selectItemBox} ${selectedId === item.groupId ? styles.isChecked : ""}`}
                  onClick={() => this.changeStu(item.groupId)}
                >
                  <div className={[styles.nameBox].join(" ")}>
                    <div>
                      {locale() == "en" ? item.groupEnName : item.groupName}
                    </div>
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>
    );
  }
}
export default ClassSelector;

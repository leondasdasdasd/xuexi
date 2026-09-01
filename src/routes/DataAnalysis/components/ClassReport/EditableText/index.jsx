import React, { PureComponent } from "react";
import { Input } from "antd";

import styles from "./index.module.less";

let tid = null;

class EditableText extends PureComponent {
  constructor(properties) {
    super(properties);

    this.state = {};
    this.titleInput = React.createRef();
  }

  confirmEdit = () => {
    const { onBlur } = this.props;
    if (tid) {
      clearTimeout(tid);
    }
    tid = setTimeout(async () => {
      onBlur && onBlur();
    }, 500);
  };

  render() {
    const { value, onChange, size = "default", underline = false } = this.props;
    const sizeCls = styles[`size_${size}`] || "";
    return (
      <div
        className={`${styles.editableText} ${sizeCls}`}
        onClick={() => {
          this.titleInput.current.focus();
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <Input
            autoComplete="off"
            ref={this.titleInput}
            className={`${styles.reportNameBoxInput} ${underline ? styles.underline : ""}`}
            onBlur={this.confirmEdit}
            onPressEnter={() => this.titleInput.current?.blur()}
            onChange={onChange}
            value={value}
            style={{
              width: "100%",
              position: "absolute",
              left: 0,
              zIndex: 1,
              top: "0",
            }}
          />
          <div className={styles.reportNameBoxInput}>
            <span>{value}</span>
          </div>
        </div>
        <i className={`${styles.iconfont} ${styles.editIcon}`}>&#xe8d2;</i>
      </div>
    );
  }
}
export default EditableText;

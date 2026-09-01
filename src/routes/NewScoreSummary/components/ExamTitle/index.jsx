// 必需参数
// title（string） - 考试名称，例如 "2024学年第一学期九年级11月期中考试"。

// 可选参数
// editable（boolean，默认 false） - 是否允许用户编辑标题（如果需要提供修改功能）。

// onEdit（function） - 当标题被编辑时触发的回调函数，仅在 editable 为 true 时生效。

import React, { createRef, PureComponent } from "react";
import { Input } from "antd";

import styles from "./index.module.less";
class ExamTitle extends PureComponent {
  constructor(properties) {
    super(properties);
    this.headerInput = createRef();
    this.state = {
      isEdit: false,
    };
  }

  clickTitName = () => {
    this.setState(
      {
        isEdit: true,
      },
      () => {
        this.headerInput.current.focus();
      },
    );
  };

  edit = (e) => {
    this.setState({
      isEdit: false,
    });
    this.props.onEdit && this.props.onEdit(e.target.value);
  };

  render() {
    const { editable, title } = this.props;
    const { isEdit } = this.state;
    return (
      <div className={styles.exam_title}>
        {isEdit ? (
          <Input
            defaultValue={title}
            className={`${styles.editable_title} ${styles.editable_title_input}`}
            ref={this.headerInput}
            onPressEnter={(e) => {
              e.target.blur();
            }}
            onBlur={(e) => this.edit(e)}
          />
        ) : (
          <div
            className={`${styles.editable_title} ${styles.editable_title_text}`}
          >
            {title}
            {editable ? (
              <i
                className={`${styles.iconfont} ${styles.editable_title_icon}`}
                onClick={() => this.clickTitName()}
              >
                &#xe7a1;
              </i>
            ) : null}
          </div>
        )}
      </div>
    );
  }
}
export default ExamTitle;

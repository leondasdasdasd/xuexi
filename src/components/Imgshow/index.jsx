//新闻
import React, { PureComponent } from "react";
import { Input, Select } from "antd";
import { connect } from "dva";

import styles from "./index.module.less";

const { Option } = Select;
const { Search } = Input;

const name = [
  "一、",
  "二、",
  "三、",
  "四、",
  "五、",
  "六、",
  "七、",
  "八、",
  "九、",
  "十、",
];
class ImgShow extends PureComponent {
  back = () => {
    this.props.cancel();
  };
  render() {
    console.log("111come");
    return (
      <div className={styles.imgBox}>
        <div className={styles.header}>
          <div
            className={[styles.iconfont, styles.closeIcon].join(" ")}
            onClick={this.back}
          >
            &#xe6a9;
          </div>
          <img src={this.props.src} className={styles.show} />
        </div>
      </div>
    );
  }
}

export default connect(({ home, global, inputQuestion }) => ({}))(ImgShow);

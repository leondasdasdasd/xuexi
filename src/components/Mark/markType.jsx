// 打标类型
import React from "react";
import { Radio } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./markType.module.less";

class MarkType extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      // markValue: null //打标类型
    };
  }
  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      // xxx: nextProps.xxx,
    };
  }

  componentDidMount() {}
  //选择打标类型
  changeRadio = (e) => {
    // this.setState({
    //     markValue: e.target.value,
    // });
    this.props.changeMarkType(e.target.value);
  };
  render() {
    const { markValue } = this.props;
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px",
      color: "#01113d",
      fontFamily: "PingFangSC-Medium",
      fontSize: "18px",
    };
    return (
      <div className={styles.markTypeBox}>
        <Radio.Group onChange={this.changeRadio} value={markValue}>
          <Radio style={radioStyle} value={1}>
            {trans("mark.nonCardType", "非涂卡类")}
          </Radio>
          <Radio style={radioStyle} value={2}>
            {trans("mark.cardType", "涂卡类")}
          </Radio>
          <Radio style={radioStyle} value={3}>
            {trans("mark.machineHandwritingRecognition", "有机器手写字母识别")}
          </Radio>
        </Radio.Group>
      </div>
    );
  }
}

export default MarkType;

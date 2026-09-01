import React, { Component } from "react";
import { Modal } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

/**
     ---倒计时组件---
    父组件传入剩余秒数：duration
 */
class CountDown extends Component {
  constructor(properties) {
    super(properties);
    let hour = Math.floor(properties.duration / 3600);
    let minute = Math.floor((properties.duration - hour * 3600) / 60);
    let second = properties.duration - hour * 3600 - minute * 60;
    this.state = {
      hour: hour < 10 ? "0" + hour : hour,
      minute: minute < 10 ? "0" + minute : minute,
      second: second < 10 ? "0" + second : second,
      visible: false,
    };
  }

  componentDidMount() {
    if (this.props.duration) {
      let date = new Date();
      let endTime = date.setSeconds(
        date.getSeconds() + Number(this.props.duration),
      );
      this.countFun(endTime);
    }
  }

  //组件卸载取消倒计时
  componentWillUnmount() {
    clearInterval(this.timer);
  }

  countFun = (endTime) => {
    let time = endTime - Date.now();
    this.timer = setInterval(() => {
      // 防止倒计时出现负数
      if (time > 100) {
        time -= 1000;
        let hour = Math.floor((time / 1000 / 3600) % 24);
        let minute = Math.floor((time / 1000 / 60) % 60);
        let second = Math.floor((time / 1000) % 60);
        this.setState({
          hour: hour < 10 ? "0" + hour : hour,
          minute: minute < 10 ? "0" + minute : minute,
          second: second < 10 ? "0" + second : second,
        });
      } else clearInterval(this.timer);
      // if (this.props.forceSubmit) {
      if (time == 1000) {
        this.setState({
          visible: true,
        });
      }
      // }
    }, 1000);
  };

  handleCancel = () => {
    if (this.props.forceSubmit) {
      this.props.remind(1);
    }
    this.setState({
      visible: false,
    });
  };

  render() {
    return (
      <>
        {this.state.hour}:{this.state.minute}:{this.state.second}
        <Modal
          visible={this.state.visible}
          // visible={true}
          onCancel={this.handleCancel}
          footer={null}
          closable={false}
          wrapClassName={styles.timerModal}
        >
          {this.props.forceSubmit ? (
            <>
              <p
                style={{
                  textAlign: "center",
                  fontFamily: "PingFangSC-Medium",
                  color: " #01113D",
                  fontSize: "16px",
                }}
              >
                {trans(
                  "countDown.timeoutAutoSubmitted",
                  "时间已到，你的答卷已自动提交",
                )}
              </p>
              <p style={{ textAlign: "center" }}>
                <span
                  onClick={this.handleCancel}
                  style={{
                    display: "inline-block",
                    background: "#0445FC",
                    padding: "5px 12px",
                    color: "#fff",
                    fontFamily: "PingFangSC-Medium",
                    borderRadius: "8px",
                  }}
                >
                  {trans("countDown.acknowledge", "我知道了")}
                </span>
              </p>
            </>
          ) : (
            <>
              <p
                style={{
                  textAlign: "center",
                  fontFamily: "PingFangSC-Medium",
                  color: " #01113D",
                  fontSize: "16px",
                }}
              >
                {trans(
                  "countDown.timeoutCanContinue",
                  "时间已到，但你可以继续作答",
                )}
              </p>
              <p style={{ textAlign: "center" }}>
                <span
                  onClick={this.handleCancel}
                  style={{
                    background: "#0445FC",
                    padding: "5px 12px",
                    color: "#fff",
                    fontFamily: "PingFangSC-Medium",
                    display: "inline-block",
                    borderRadius: "8px",
                  }}
                >
                  {trans("countDown.continueAnswering", "继续答题")}
                </span>
              </p>
            </>
          )}
        </Modal>
      </>
    );
  }
}

export default CountDown;

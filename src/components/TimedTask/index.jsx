// 类组件
import React from "react";
import { DatePicker, Popover, TimePicker } from "antd";
import moment from "moment";

import { trans } from "../../utils/i18n";
import { getCurrentTime } from "../../utils/utils";

import styles from "./index.module.less";

class TimedTask extends React.Component {
  constructor(properties) {
    super(properties);
    this.timedTaskRef = React.createRef();
    this.state = {
      visSetTiming: false,
      taskData: getCurrentTime("date"),
      taskTime: getCurrentTime("time"),
    };
  }

  componentDidMount() {}

  clearTime = () => {
    this.props.onChange("");
  };

  clickTimeancle() {
    this.setState({
      visSetTiming: false,
    });
  }

  clickTimeSure() {
    const { taskData, taskTime } = this.state;
    if (taskData || taskTime) {
      if (this.props.onChange) {
        this.props.onChange(`${taskData} ${taskTime}`);
      }
    } else {
      this.props.onChange("");
    }
    this.setState({
      visSetTiming: false,
    });
  }

  taskDataChange = (date, dateString) => {
    this.setState({
      taskData: dateString,
    });
  };

  taskTimeChange = (date, dateString) => {
    this.setState({
      taskTime: dateString,
    });
  };
  render() {
    const { visSetTiming, taskData, taskTime } = this.state;
    const { style, value } = this.props;

    return (
      <div className={styles.timedTask} style={style} ref={this.timedTaskRef}>
        <div>
          {value ? (
            <div className={styles.setTiming1}>
              <i
                className={styles.iconfont}
                style={{ marginRight: 3, color: "#000" }}
              >
                &#xe740;
              </i>
              <span>{value}</span>
              <span className={styles.clearTiming} onClick={this.clearTime}>
                {trans("global.clearTiming", "清除定时")}
              </span>
            </div>
          ) : (
            <Popover
              // 防止父容器消失气泡框还在，例如弹窗里面使用该组件
              getPopupContainer={() =>
                this.timedTaskRef.current?.parentNode || document.body
              }
              content={
                <div className={styles.timePopver}>
                  <p className={styles.sendingTime}>
                    {trans("global.sendingTime", "发送时间")}
                  </p>
                  <p>
                    <span style={{ marginRight: 8 }}>
                      <DatePicker
                        onChange={this.taskDataChange.bind(this)}
                        format="YYYY-MM-DD"
                        defaultValue={
                          taskData ? moment(taskData, "YYYY-MM-DD") : ""
                        }
                      />
                    </span>
                    <TimePicker
                      onChange={this.taskTimeChange.bind(this)}
                      defaultValue={taskTime ? moment(taskTime, "HH:mm") : ""}
                      format="HH:mm"
                    />
                  </p>
                  <p className={styles.timeBtn}>
                    <span
                      className={styles.timeancle}
                      onClick={this.clickTimeancle.bind(this)}
                    >
                      {trans("global.cancle", "取消")}
                    </span>
                    <span
                      className={styles.timeSure}
                      onClick={this.clickTimeSure.bind(this)}
                    >
                      {trans("global.sure", "确定")}
                    </span>
                  </p>
                </div>
              }
              trigger="click"
              placement="topLeft"
              visible={visSetTiming}
            >
              <span className={styles.setTiming}>
                <i className={styles.iconfont} style={{ marginRight: 3 }}>
                  &#xe740;
                </i>
                <span
                  onClick={() => {
                    this.setState({ visSetTiming: true });
                  }}
                >
                  {trans("global.setTiming", "设置定时发送")}
                </span>
              </span>
            </Popover>
          )}
        </div>
      </div>
    );
  }
}

export default TimedTask;

import React, { PureComponent } from "react";
import { Spin } from "antd";

import ChartSwitch from "../../../ChartSwitch";
import TableHeader from "../TableHeader";

import styles from "./index.module.less";

class TeacherRemarks extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  render() {
    const {
      studySituationByStudentIdList,
      titName,
      edit = true,
      spinning,
    } = this.props;
    const { moduleModelList } = studySituationByStudentIdList;

    let moduleSwitch = false;
    let result = {};
    if (moduleModelList?.length) {
      result = moduleModelList.find((item) => {
        return item.modelCode === "TEACHER_POWERED_LEARNING_ANALYTICS";
      });
      moduleSwitch = result?.modelShow;
    }

    return (
      <div className={styles.overallView}>
        <Spin spinning={spinning}>
          <TableHeader
            titleName={titName}
            slot={
              edit ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div style={{ marginLeft: "auto" }}>
                    {
                      <ChartSwitch
                        checked={Boolean(moduleSwitch)}
                        onChange={this.props.onChange}
                      />
                    }
                  </div>
                </div>
              ) : null
            }
          />
          <div
            className={styles.youChart1}
            style={{
              display: moduleSwitch ? "block" : "none",
              color: "#01113D",
              background: "rgba(1, 17, 61, 0.04)",
              padding: "10px 20px",
              borderRadius: "10px",
            }}
          >
            {result?.modelValue}
          </div>
        </Spin>
      </div>
    );
  }
}

export default TeacherRemarks;

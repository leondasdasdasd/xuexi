import React, { PureComponent } from "react";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import ChartSwitch from "../../../../components/ChartSwitch";
import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

class TeacherRemarks extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreen: false,
    };
  }
  exportFail = (key) => {
    this.props.exportFail && this.props.exportFail(key);
  };

  onChange = (checked) => {
    this.props.onChange && this.props.onChange(checked);
  };

  render() {
    const {
      edit = true,
      loading,
      moduleSwitch = false,
      remarkVal,
    } = this.props;
    // const { moduleModelList } = studySituationByStudentIdList

    // let moduleSwitch = false
    // let result = {}
    // if (moduleModelList?.length) {
    //     result = moduleModelList.find((item) => {
    //         return item.modelCode === 'TEACHER_POWERED_LEARNING_ANALYTICS'
    //     })
    //     moduleSwitch = result?.modelShow
    // }

    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "11px",
          marginTop: "10px",
        }}
        id="teacherComments"
        className={`${this.state.fullscreen ? styles.fullscreen : ""}`}
      >
        <AreaHeaderComponent
          showFullscreenBtn={true} //显示全屏按钮
          // showExportBtn={true}
          onClickExport={() => {
            this.exportFail(2);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("global.teacherComments", "教师评语")}
          rightPanelContent={
            edit ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <ChartSwitch
                  checked={Boolean(moduleSwitch)}
                  onChange={this.onChange}
                />
              </div>
            ) : null
          }
        />

        <div
          className={styles.youChart1}
          style={{
            color: "#01113D",
            background: "rgba(1, 17, 61, 0.04)",
            padding: "10px 20px",
            borderRadius: "10px",
          }}
        >
          {moduleSwitch ? remarkVal : null}
        </div>
      </div>
    );
  }
}

export default TeacherRemarks;

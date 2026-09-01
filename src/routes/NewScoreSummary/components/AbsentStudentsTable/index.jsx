import React, { PureComponent } from "react";
import { Table } from "antd";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

class AbsentStudentsTable extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreen: false,
    };
  }
  exportFail = (key) => {
    this.props.exportFail && this.props.exportFail(key);
  };

  render() {
    const { tableData, columns } = this.props;
    return (
      <div
        id="absentStudents"
        style={{
          backgroundColor: "#fff",
          borderRadius: "11px",
        }}
        className={`${this.state.fullscreen ? styles.fullscreen : ""}`}
      >
        <AreaHeaderComponent
          showFullscreenBtn={true} //显示全屏按钮
          showExportBtn={true}
          onClickExport={() => {
            this.exportFail(6);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("global.absentStudents", "缺考学生")}
        />
        <div style={{ width: "100%", height: "calc(100% - 49px)" }} id="tabBox">
          <Table
            dataSource={tableData}
            pagination={false}
            scroll={{ x: 1200, y: "calc(100vh - 182px)" }}
            columns={columns}
          />
        </div>
      </div>
    );
  }
}
export default AbsentStudentsTable;

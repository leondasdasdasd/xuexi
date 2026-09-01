import React, { PureComponent } from "react";
import { Table } from "antd";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

class FailingStudentsTable extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreen: false,
    };
  }
  exportFail = () => {
    this.props.exportFail && this.props.exportFail(4);
  };

  render() {
    const { tableData, columns, remark } = this.props;
    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "11px",
          marginTop: "10px",
        }}
        id="detailsFailedStudents"
        className={`${this.state.fullscreen ? styles.fullscreen : ""}`}
      >
        <AreaHeaderComponent
          showFullscreenBtn={true} //显示全屏按钮
          showExportBtn={true}
          onClickExport={() => {
            this.exportFail(4);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("global.detailsFailedStudents", "不及格学生明细")}
        />
        {remark ? (
          <div
            style={{
              fontSize: "13px",
              lineHeight: "16px",
              color: "#4818C9",
              padding: "16px 20px 0 16px",
            }}
          >
            {remark}
          </div>
        ) : null}
        <div style={{ width: "100%", padding: "16px" }}>
          <Table
            dataSource={tableData}
            pagination={false}
            columns={columns}
            rowClassName="flunkTableRow"
          />
        </div>
      </div>
    );
  }
}
export default FailingStudentsTable;

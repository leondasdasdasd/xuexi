import React, { PureComponent } from "react";
import { Table } from "antd";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import { locale, trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

class ClassScoreSegmentTable extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreen: false,
    };
  }
  exportFail = (key) => {
    this.props.exportFail && this.props.exportFail(key);
  };

  clickEditSegment = () => {
    this.props.clickEditSegment && this.props.clickEditSegment();
  };

  render() {
    const { tableData, columns } = this.props;
    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "11px",
          marginTop: "10px",
        }}
        id="classScoreRates"
        className={`${this.state.fullscreen ? styles.fullscreen : ""}`}
      >
        <AreaHeaderComponent
          showFullscreenBtn={true} //显示全屏按钮
          showExportBtn={true}
          onClickExport={() => {
            this.exportFail(2);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={
            locale() == "en"
              ? "Class Score Rates&Segment Count"
              : "班级总分三率对比和各分段人数"
          }
          rightPanelContent={
            <span
              onClick={() => {
                this.clickEditSegment();
              }}
              style={{
                color: "#0445FC",
                fontSize: "13px",
                cursor: "point",
                marginRight: "5px",
              }}
            >
              {trans("global.editSegment", "编辑分段")}
            </span>
          }
        />

        <Table
          dataSource={tableData}
          pagination={false}
          scroll={{ x: 1200, y: true }}
          columns={columns}
        />
      </div>
    );
  }
}
export default ClassScoreSegmentTable;

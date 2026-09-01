import React, { PureComponent } from "react";
import { Table } from "antd";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

class TopNTable extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreen: false,
    };
  }
  exportFail = (key) => {
    this.props.exportFail && this.props.exportFail(key);
  };

  rankIntervalsEdit = () => {
    this.props.rankIntervalsEdit && this.props.rankIntervalsEdit();
  };

  render() {
    const { tableData, columns } = this.props;
    return (
      <div
        id="topNAnalysis"
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
            this.exportFail(7);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("global.topNAnalysis", "前N名分析")}
          rightPanelContent={
            <span
              onClick={this.rankIntervalsEdit}
              style={{
                color: "#0445FC",
                fontSize: "13px",
                marginRight: "5px",
                cursor: "pointer",
              }}
            >
              {trans("global.editSegment", "编辑分段")}
            </span>
          }
        />
        <div style={{ width: "100%" }}>
          <Table
            bordered
            dataSource={tableData}
            pagination={false}
            columns={columns}
            scroll={{ y: "calc(100vh - 182px)" }}
          />
        </div>
      </div>
    );
  }
}
export default TopNTable;

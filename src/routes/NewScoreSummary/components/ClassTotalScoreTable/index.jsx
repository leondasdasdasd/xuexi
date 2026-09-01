import React, { PureComponent } from "react";
import { Table } from "antd";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

class ClassTotalScoreTable extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  exportFail = () => {
    this.props.exportFail && this.props.exportFail(1);
  };

  render() {
    const { tableData, columns } = this.props;
    return (
      <div
        id="classRank"
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
            this.exportFail(1);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("global.classRank", "班级总分榜")}
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
export default ClassTotalScoreTable;

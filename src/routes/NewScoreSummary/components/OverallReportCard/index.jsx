import React, { PureComponent } from "react";
import { Table } from "antd";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

class OverallReportCard extends PureComponent {
  getColumns = () => [
    {
      title: trans("scoreSummary.overallAllSubjects", "全科"),
      dataIndex: "index",
      key: "index",
      width: 80,
      align: "center",
      render: (text, record, index) => {
        return index + 1;
      },
    },
    {
      title: trans("scoreSummary.subjectChinese", "语文"),
      dataIndex: "index",
      key: "index",
      width: 80,
      align: "center",
      render: (text, record, index) => {
        return index + 1;
      },
    },
    {
      title: trans("scoreSummary.subjectMath", "数学"),
      dataIndex: "index",
      key: "index",
      width: 80,
      align: "center",
      render: (text, record, index) => {
        return index + 1;
      },
    },
  ];

  exportFail = (key) => {
    this.props.exportFail && this.props.exportFail(key);
  };

  render() {
    const { tableData, columns } = this.props;

    return (
      <div
        id="overallReportCard"
        style={{
          backgroundColor: "#fff",
          borderRadius: "11px",
        }}
        className={`${this.state.fullscreen ? styles.fullscreen : ""}`}
      >
        <AreaHeaderComponent
          showFullscreenBtn={true} //显示全屏按钮
          // showExportBtn={true}
          onClickExport={() => {
            this.exportFail(8);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("global.overallReportCard", "总成绩单")}
        />

        <Table
          bordered
          dataSource={tableData}
          pagination={false}
          columns={columns || this.getColumns()}
          scroll={{ y: 449 }}
        />
      </div>
    );
  }
}
export default OverallReportCard;

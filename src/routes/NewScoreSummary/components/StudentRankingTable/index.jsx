import React, { PureComponent } from "react";
import { Checkbox, Input, Table } from "antd";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";
const { Search } = Input;

class StudentRankingTable extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreen: false,
    };
  }
  exportFail = (key) => {
    this.props.exportFail && this.props.exportFail(key);
  };

  onShowSizeChange = (current, pageSize) => {
    this.props.onShowSizeChange &&
      this.props.onShowSizeChange(current, pageSize);
  };
  changeNo = (pageNo) => {
    this.props.changeNo && this.props.changeNo(pageNo);
  };

  searchChange = (value) => {
    this.props.searchChange && this.props.searchChange(value);
  };

  changeRanking = (e) => {
    this.props.changeRanking && this.props.changeRanking(e);
  };

  render() {
    const {
      tableData,
      columns,
      pageNo,
      total,
      pageSize,
      checkedRanking,
      rankingVis,
    } = this.props;
    return (
      <div
        id="studentRank"
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
            this.exportFail(5);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("scoreSummary.studentRankingTitle", "学生排行榜")}
          leftPanelContent={
            <div style={{ marginLeft: "10px" }}>
              {rankingVis ? (
                <Checkbox
                  checked={checkedRanking}
                  onChange={this.changeRanking}
                >
                  {trans("global.displayRanking", "显示排名")}
                </Checkbox>
              ) : null}
              <Search
                placeholder={trans("testAnalysis.searchStudent", "搜索学生")}
                onSearch={(value) => this.searchChange(value)}
                style={{ width: "200px", marginLeft: "20px" }}
              />
            </div>
          }
        />
        <Table
          dataSource={tableData}
          pagination={{
            size: "small",
            pageSizeOptions: ["50", "100", "150", "200"],
            showSizeChanger: true,
            showQuickJumper: true,
            pageSize: pageSize,
            current: pageNo,
            total: total,
            onChange: this.changeNo,
            onShowSizeChange: this.onShowSizeChange,
          }}
          scroll={{ x: 1200, y: "calc(100vh - 330px)" }}
          columns={columns}
        />
      </div>
    );
  }
}
export default StudentRankingTable;

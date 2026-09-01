import React, { PureComponent } from "react";
import { Table } from "antd";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import MyTabs from "../../../../components/MyTabs";
import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";
let chart = null;
import { G2 } from "bizcharts";

import ChartSwitch from "../../../../components/ChartSwitch";

class FailSubjectsTable extends PureComponent {
  state = {
    viewType: 1,
    fullscreen: false,
  };

  getFailColumns = () => [
    {
      title: trans("global.failedSubjectsCount", "不及格学科数量"),
      dataIndex: "failedExamCount",
      key: "failedExamCount",
      width: 140,
      align: "center",
    },
    {
      title: trans("global.failedStudentsCount", "不及格人数"),
      dataIndex: "failedExamStudentCount",
      key: "failedExamStudentCount",
      width: 120,
      align: "center",
    },
    {
      title: trans("global.studentList", "学生名单"),
      dataIndex: "failedExamStudentNames",
      key: "failedExamStudentNames",
    },
  ];
  changeViewType = (value) => {
    this.setState(
      {
        viewType: value,
      },
      () => {
        if (value == 2) {
          let data = [];
          if (this.props.tableData)
            for (const item of this.props.tableData) {
              data.push({
                type: item.failedExamCount,
                value: item.failedExamStudentCount,
              });
            }
          this.randerChart(data);
        }
      },
    );
  };
  randerChart = (data) => {
    // 图表未初始化
    chart = new G2.Chart({
      container: "chartContainer",
      height: 316,
      width: data.length < 3 ? 200 : data.length * 100,
      padding: [20, 20, 50, 40],
    });

    chart.clear();
    chart.source(data);
    chart.axis("type", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
        htmlTemplate(text, item, index) {
          const failedLabel = trans("scoreSummary.failedLabel", "不及格");
          return `<div style="width:40px;font-size:10px;color: rgba(1, 17, 61, 0.85);text-align:center;">${text.split(failedLabel)[0]}<br />${failedLabel}</div>`;
        },
      },
      tickLine: {
        alignWithLabel: false,
        length: 0,
      },
    });

    chart.axis("value", {
      label: {
        textStyle: {
          fill: "#aaaaaa",
        },
      },
    });
    chart.legend({
      position: "top-center",
    });
    chart
      .interval()
      .position("type*value")
      .opacity(1)
      .color("type", (value) => {
        return {
          "5门": "#3D94FF",
          "4门": "#12CC67",
          "3门": "#FFE030",
          "2门": "#FC7D7D",
          "1门": "#4BE4E7",
        }[value];
      })
      .label("value", {
        offset: 10,
      })
      .size(32);
    chart.render();
  };

  exportFail = (key) => {
    this.props.exportFail && this.props.exportFail(key);
  };

  viewGroupChange = (checked) => {
    this.props.viewGroupChange && this.props.viewGroupChange(checked);
  };

  render() {
    const { tableData, viewGroup } = this.props;
    const { viewType } = this.state;
    return (
      <div
        id="failedSubjectsCount1"
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
            this.exportFail(3);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("global.failedSubjectsCount1", "不及格学科数")}
          leftPanelContent={
            <MyTabs
              data={[
                { tab: trans("global.listView", "列表视图"), key: 1 },
                { tab: trans("global.histogram", "柱状图"), key: 2 },
              ]}
              onChange={(value) => {
                this.changeViewType(value.key);
              }}
              activeKey={1}
            />
          }
          rightPanelContent={
            <ChartSwitch
              label={trans("global.showClass", "显示班级")}
              defaultChecked
              checked={viewGroup}
              onChange={this.viewGroupChange}
            />
          }
        />
        <div style={{ width: "100%", padding: "16px" }}>
          {viewType == 1 ? (
            <Table
              dataSource={tableData}
              pagination={false}
              columns={this.getFailColumns()}
            />
          ) : (
            <div id="chartContainer" />
          )}
        </div>
      </div>
    );
  }
}
export default FailSubjectsTable;

import React, { PureComponent } from "react";
import { DataSet } from "@antv/data-set";
import G2 from "@antv/g2";
import { Input, Table } from "antd";
import { connect } from "dva";
import $ from "jquery";

import ChartSwitch from "components/ChartSwitch";
import MyTabs from "components/MyTabs";

import { locale, trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";
import SectionRanking from "../SectionRanking";

import styles from "./index.module.less";
const { Search } = Input;
let chart;
let chart2;
class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 3,
      groupId: null,
      pageNo: 1,
      stuName: "",
      isSetGrades: false,
      scoreSegmentationSpecify: false,
      teacherNameVisible: true,
    };
  }

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
    if (this.props.isParentInit) {
      console.log("isParentInit", this.props.isParentInit);
    } else {
      this.getPage();
    }
  }

  // 父组加载完毕后可以调用次函数初始化数据，相当于父组件加载完毕之后调用
  initData = () => {
    this.setState(
      {
        groupId: this.props.groupId,
      },
      () => {
        this.props
          .dispatch({
            type: "global/getAnalyseRankGroupAsRow",
            payload: {
              examId: this.props.examId,
              filterFlag: this.state.scoreSegmentationSpecify,
              groupId: this.state.groupId,
            },
          })
          .then(() => {
            if (this.state.check == 3) {
              this.renderChartPile();
            }
          });
      },
    );
  };

  getPage = () => {
    this.props
      .dispatch({
        type: "global/getAnalyseRankGroupAsRow",
        payload: {
          examId: this.props.examId,
          filterFlag: this.state.scoreSegmentationSpecify,
          groupId: this.state.groupId,
        },
      })
      .then(() => {
        if (this.state.check == 3) {
          this.renderChartPile();
        }
      });
  };

  renderChartPile = () => {
    $("#pile1 > div").remove();
    const { analyseRankGroupAsRow } = this.props;
    const { teacherNameVisible } = this.state;
    let data = [];
    let teacherNames = [];

    analyseRankGroupAsRow.length > 0 &&
      analyseRankGroupAsRow.map((item) => {
        item.rankSectionModelList.length > 0 &&
          item.rankSectionModelList.map((it) => {
            let newObject = {};
            newObject.groupName =
              locale() == "en" ? item.groupEName : item.groupName;
            newObject.enName = item.courseTeacherNames;
            newObject.count = it.levelName;
            newObject.value = it.num - 0;
            newObject.scoreRate = it.rate;
            data.push(newObject);
          });
        if (item.courseTeacherNames) {
          teacherNames.push(item.courseTeacherNames.join(" "));
        } else {
          teacherNames.push("");
        }
      });

    // console.log(data, "ppp");
    const ds = new DataSet();
    const dv = ds
      .createView()
      .source(data)
      .transform({
        type: "percent",
        field: "value", // 统计销量
        dimension: "count", // 每年的占比
        groupBy: ["groupName"], // 以不同产品类别为分组
        as: "percent",
      });
    let pile1 = document.querySelector("#pile1");
    if (!pile1) {
      return;
    }
    if (analyseRankGroupAsRow && analyseRankGroupAsRow.length > 0) {
      const dom = document.querySelector(`#pile1`);
      if (
        analyseRankGroupAsRow.length > 4 &&
        analyseRankGroupAsRow.length < 8
      ) {
        dom.style.width = "50%";
      } else if (analyseRankGroupAsRow.length > 7) {
        dom.style.width = "100%";
      } else if (analyseRankGroupAsRow.length < 5) {
        dom.style.width = "40%";
      }
    }

    chart2 = new G2.Chart({
      container: "pile1",
      forceFit: true,
      height: 400,
      padding: [25, 30, 60, 70],
    });
    chart2.tooltip({
      crosshairs: null,
      containerTpl:
        "<div class='g2-tooltip'>" +
        "<div class='g2-tooltip-title'>{groupName}</div>" +
        "<ul class='g2-tooltip-list'></ul>" +
        "</div>",
      itemTpl: `<li style='display: flex;'><span style='width: 60px'>{count}</span><span style='width: 50px'>{value}${trans("global.person", "人")}</span><span style='margin-left: 10px;'>{scoreRate}</span></li>`,
    });
    chart2.source(dv, {
      percent: {
        min: 0,
        formatter(value) {
          return (value * 100).toFixed(2) + "%";
        },
      },
    });
    chart2
      .intervalStack()
      .position("groupName*percent")
      .color("count", ["#3D94FF", "#22B7A0", "#99D748", "#FEB551", "#FC7D7D"])
      .label("scoreRate", (value) => {
        if (value < 10) {
          return false;
        }
        return {
          position: "middle",
          offset: 0,
          textStyle: {
            fill: "#333",
            fontSize: 12,
            shadowBlur: 2,
            // shadowColor: "rgba(0, 0, 0, .45)",
          },
          formatter: (text) => {
            if (text == "0%") {
              return "";
            }
            return text;
          },
        };
      })
      .size(50)
      .tooltip(
        "count*value*groupName*scoreRate",
        function (count, value, groupName, scoreRate) {
          return {
            count,
            value,
            groupName,
            scoreRate,
          };
        },
      )
      .opacity(1);
    if (teacherNameVisible) {
      chart2.axis("groupName", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div 
                        style="
                        width:auto;
                        white-space:nowrap;
                        text-align:center;
                        margin-top:14px;
                        font-size: 10px;
                        color: rgba(1,17,61,0.85);
                        font-weight: 400;"
                     >
                        ${text}
                        <br />
                        ${teacherNameVisible ? teacherNames[index] : ""}
                      </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    } else {
      chart2.axis("groupName", {
        label: {
          offsetY: 0,
          htmlTemplate(text, item, index) {
            return `<div 
                        style="
                        width:auto;
                        white-space: nowrap;
                        text-align:center;
                        font-size: 10px;
                        
                        color: rgba(1,17,61,0.85);
                        font-weight: 400;"
                     >
                        ${text}
                      </div>`;
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
    }
    chart2.legend({
      position: "top-center",
    });
    chart2.render();
    window.CHART1 = chart2;
  };

  exportImgClk = () => {
    window.CHART1.downloadImage("等级分布堆叠图");
  };

  changeTab = (check) => {
    this.setState(
      {
        check,
      },
      () => {
        if (check === 1) {
          this.getPage();
        } else if (check === 3) {
          this.renderChartPile();
        }
      },
    );
  };
  clickSetGrades = () => {
    this.setState({
      isSetGrades: !this.state.isSetGrades,
    });
  };
  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        scoreSegmentationSpecify: checked,
      },
      () => {
        this.getPage();
      },
    );
  };
  hasVisibleTeacherName = (checked) => {
    this.setState(
      {
        teacherNameVisible: checked,
      },
      () => {
        if (this.state.check == 3) {
          this.renderChartPile();
        }
      },
    );
  };
  render() {
    const { check } = this.state;
    const { analyseRankGroupAsRow } = this.props;
    const { teacherNameVisible } = this.state;

    let newDataSource = [];

    if (
      Array.isArray(analyseRankGroupAsRow) &&
      analyseRankGroupAsRow.length > 0
    ) {
      for (const item of analyseRankGroupAsRow) {
        const object = {
          name: locale() == "en" ? item.groupEName : item.groupName,
          key: locale() == "en" ? item.groupEName : item.groupName,
          enName: item.courseTeacherNames,
        };
        if (
          Array.isArray(item.rankSectionModelList) &&
          item.rankSectionModelList.length > 0
        ) {
          for (const it of item.rankSectionModelList) {
            const levelName = it.levelName;
            object[`${levelName}num`] = it.num;
            object[`${levelName}rate`] = it.rate;
          }
        }
        newDataSource.push(object);
      }
    }

    let newColumns = [
      {
        title: trans("global.className", "班级名称"),
        dataIndex: "name",
        key: "name",
        render: (text, record) => {
          return (
            <div>
              <div className={styles.importMessage}>{record.name}</div>
              {teacherNameVisible ? (
                <div className={styles.publicMessage}>{record.enName}</div>
              ) : null}
            </div>
          );
        },
      },
    ];
    analyseRankGroupAsRow.length > 0 &&
      analyseRankGroupAsRow[0].rankSectionModelList &&
      analyseRankGroupAsRow[0].rankSectionModelList.length > 0 &&
      analyseRankGroupAsRow[0].rankSectionModelList.map((item) => {
        newColumns.push({
          dataIndex: item.levelName,
          key: item.levelName,
          title: () => {
            return (
              <div>
                <div>
                  <span className={styles.importMessage}>{item.levelName}</span>
                </div>
                <div>
                  <span className={styles.publicMessage}>
                    {trans("global.numberOfPeople", "人数")}
                  </span>
                  <span
                    className={[styles.publicMessage, styles.divider].join(" ")}
                  >
                    /
                  </span>
                  <span className={styles.publicMessage}>
                    {trans("global.proportion", "占比")}
                  </span>
                </div>
              </div>
            );
          },
          render: (text, record, index) => {
            let value1 = record[`${item.levelName}rate`];
            let value2 = newDataSource[0][`${item.levelName}rate`];
            return (
              <div>
                <span className={styles.importMessage}>
                  {record[`${item.levelName}num`]}
                </span>
                <span
                  className={[styles.publicMessage, styles.divider].join(" ")}
                >
                  /
                </span>
                <span
                  className={`${styles.publicMessage} ${comparePercentages(value1, value2) == -1 ? styles.noPass : ""}`}
                >
                  {record[`${item.levelName}rate`]}
                </span>
              </div>
            );
          },
        });
      });

    return (
      <div className={styles.questionTable} id="table3">
        <div
          className={styles.tableBox}
          style={this.props.isParentInit ? { padding: "0" } : {}}
        >
          <div className={styles.tableBoxHeader}>
            <span className={styles.tableHeaderTitle}>
              {trans("global.comparisonDistribution", "学情分层对比")}
            </span>

            <span className={styles.viewBox}>
              <MyTabs
                data={[
                  { tab: trans("global.listView", "列表视图"), key: 1 },
                  { tab: trans("global.stackingDiagram", "堆叠图"), key: 3 },
                ]}
                activeKey={3}
                onChange={(value) => {
                  this.changeTab(value.key);
                }}
              />
            </span>
            <div className={styles.operation}>
              <ChartSwitch
                label={trans("global.courseTeacher", "授课老师")}
                defaultChecked
                checked={this.state.teacherNameVisible}
                onChange={this.hasVisibleTeacherName}
              />

              {check === 3 ? (
                <span
                  className={styles.textWarp}
                  onClick={() => this.exportImgClk()}
                >
                  {trans("global.exportPicture", "截图")}
                </span>
              ) : null}

              <span className={styles.textWarp} onClick={this.clickSetGrades}>
                {trans("global.setLevelSegmentation", "设置等级分段")}
              </span>

              {this.props.filterStudentListPermissions.haveFilterStudentList ? (
                <ChartSwitch
                  label={trans("global.specifyAnalysis", "指定分析")}
                  defaultChecked
                  checked={this.state.scoreSegmentationSpecify}
                  onChange={this.courseDetailSpecifyChange}
                  style={{ marginLeft: "4px" }}
                />
              ) : null}

              <a
                href={`${window.location.origin}/api/export/exam/exportAnalyseRankGroupAsRow?examId=${this.props.examId}&filterFlag=${this.state.scoreSegmentationSpecify}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className={styles.textWarp}>
                  {trans("global.export", "导出")}
                </span>
              </a>
            </div>
          </div>

          <div
            id="table1"
            className={styles.tableBoxContent}
            style={{ borderRadius: "0 0 20px 20px" }}
          >
            {this.state.check == 1 ? (
              <Table
                dataSource={newDataSource}
                pagination={false}
                scroll={{ x: 1100 }}
                columns={newColumns}
              />
            ) : (
              <div id="pile1" className={styles.mountNodeBox}></div>
            )}
          </div>
        </div>
        {this.state.isSetGrades ? (
          <SectionRanking
            isSetGrades={this.state.isSetGrades}
            clickSetGrades={this.clickSetGrades}
            reloadChart={this.getPage}
            source={"scoreSubsection"}
            id={this.props.examId}
            scoreSegmentationSpecify={this.state.scoreSegmentationSpecify}
          />
        ) : null}
      </div>
    );
  }
}
export default connect(({ home, global }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  analyseRankGroupAsRow: global.analyseRankGroupAsRow,
}))(GlobalHeader);

import React, { PureComponent } from "react";
import { Input, message, Pagination, Select } from "antd";

import { accomplishmentReportWithStudent } from "../../services/exam";
import { locale, trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";
import AreaHeaderComponent from "../AreaHeaderComponent";
import ChartSwitch from "../ChartSwitch";
import MyTable from "../QualityTable/MyTable";

import styles from "./index.module.less";

const { Option } = Select;
const { Search } = Input;

class StudentAccomplishmentTable extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      columns: [],
      tableData: [],
      groupId: 0,
      studentName: "",
      pageNum: 1,
      pageSize: 100,
      total: 0,
      qualityToggle: true,
      studentAccomplishmentSpecify: false,
      loading: false,
    };
  }

  componentDidMount() {
    this.getTableData();
  }

  componentDidUpdate(previousProperties) {
    if (previousProperties.examId !== this.props.examId) {
      this.setState(
        {
          pageNum: 1,
        },
        () => {
          this.getTableData();
        },
      );
    }
  }

  getTableData = () => {
    this.setState({
      loading: true,
    });
    accomplishmentReportWithStudent({
      examId: this.props.examId,
      groupId: this.state.groupId,
      studentName: this.state.studentName,
      pageNum: this.state.pageNum,
      pageSize: this.state.pageSize,
      loadTwoAccomplishmentFalg: this.state.qualityToggle,
      filterFlag: this.state.studentAccomplishmentSpecify,
    })
      .then((response) => {
        if (response.status) {
          const pageData = response.content || {};
          const report = pageData.data || {};
          this.setState({
            total: pageData.total || 0,
            columns: this.initTableColumns(report.qualityIndicatorData || []),
            tableData: this.initTableData(
              report.columnSet || [],
              report.qualityIndicatorData || [],
            ),
            loading: false,
          });
        } else {
          message.error(response.message);
          this.setState({
            loading: false,
          });
        }
      })
      .catch(() => {
        message.error(trans("global.networkError", "网络异常"));
        this.setState({
          loading: false,
        });
      });
  };

  initTableColumns = (qualityIndicatorData = []) => {
    const columns = [
      {
        title: trans("global.studentName", "学生姓名"),
        dataIndex: "studentName",
        key: "studentName",
        width: 120,
        fixed: "left",
        align: "center",
      },
      {
        title: trans("global.class", "班级"),
        dataIndex: "groupName",
        key: "groupName",
        width: 140,
        fixed: "left",
        align: "center",
      },
    ];
    const grouped = {};

    for (const [index, item] of qualityIndicatorData.entries()) {
      const parent = item.indicatorParentName || item.indicatorName;
      const indicatorKey = `${item.indicatorId || index}_${index}`;
      const childColumn = {
        title: item.indicatorName,
        dataIndex: `${indicatorKey}_score`,
        key: `${indicatorKey}_score`,
        align: "center",
        children: [
          {
            title: trans("global.zongfen", "总分"),
            dataIndex: `${indicatorKey}_totalScore`,
            key: `${indicatorKey}_totalScore`,
            width: 80,
            align: "center",
          },
          {
            title: trans("global.score", "得分"),
            dataIndex: `${indicatorKey}_score`,
            key: `${indicatorKey}_score`,
            width: 80,
            align: "center",
          },
          {
            title: trans("global.scoreRate", "得分率"),
            dataIndex: `${indicatorKey}_averageRate`,
            key: `${indicatorKey}_averageRate`,
            width: 80,
            align: "center",
            render: (text) => {
              return (
                <span
                  className={
                    comparePercentages(text, "60%") == -1 ? styles.noPass : ""
                  }
                >
                  {text}
                </span>
              );
            },
          },
        ],
      };

      if (this.state.qualityToggle) {
        if (grouped[parent]) {
          grouped[parent].children.push(childColumn);
        } else {
          grouped[parent] = {
            title: parent,
            dataIndex: `${parent}_score`,
            key: `${parent}_score`,
            children: [childColumn],
          };
        }
      } else {
        columns.push(childColumn);
      }
    }

    if (this.state.qualityToggle) {
      for (const item of Object.keys(grouped)) {
        columns.push(grouped[item]);
      }
    }

    return [...columns, {}];
  };

  initTableData = (columnSet = [], qualityIndicatorData = []) => {
    return columnSet.map((student, studentIndex) => {
      const row = {
        key: student.studentId || studentIndex,
        studentName: student.studentName,
        groupName: student.groupName,
      };
      for (const [
        indicatorIndex,
        indicator,
      ] of qualityIndicatorData.entries()) {
        const indicatorKey = `${indicator.indicatorId || indicatorIndex}_${indicatorIndex}`;
        const cell = indicator.columnDataModelList?.[studentIndex] || {};
        row[`${indicatorKey}_totalScore`] = indicator.questionScore;
        row[`${indicatorKey}_score`] = cell.average;
        row[`${indicatorKey}_averageRate`] = cell.averageRate;
      }
      return row;
    });
  };

  changeGroup = (groupId) => {
    this.setState(
      {
        groupId,
        pageNum: 1,
      },
      () => {
        this.getTableData();
      },
    );
  };

  searchStudent = (value) => {
    this.setState(
      {
        studentName: value,
        pageNum: 1,
      },
      () => {
        this.getTableData();
      },
    );
  };

  changePage = (pageNumber, pageSize) => {
    this.setState(
      {
        pageNum: pageNumber,
        pageSize,
      },
      () => {
        this.getTableData();
      },
    );
  };

  changePageSize = (pageNumber, pageSize) => {
    this.changePage(pageNumber, pageSize);
  };

  handleQualityToggle = (qualityToggle) => {
    this.setState(
      {
        qualityToggle,
        pageNum: 1,
      },
      () => {
        this.getTableData();
      },
    );
  };

  handleSpecifyChange = (studentAccomplishmentSpecify) => {
    this.setState(
      {
        studentAccomplishmentSpecify,
        pageNum: 1,
      },
      () => {
        this.getTableData();
      },
    );
  };

  exportChange = () => {
    const parameters = {
      examId: this.props.examId,
      groupId: this.state.groupId,
      studentName: this.state.studentName,
      filterFlag: this.state.studentAccomplishmentSpecify,
    };
    let string_ = "";
    for (const key in parameters) {
      const element = parameters[key];
      string_ += `${key}=${encodeURIComponent(element === undefined || element === null ? "" : element)}&`;
    }
    window.open(
      `${window.location.origin}/api/exam/export/examAccomplishmentReportWithStudent?${string_}`,
    );
  };

  render() {
    const classList = this.props.classList || [];
    return (
      <div id="table6" className={styles.studentAccomplishmentTable}>
        <div className={styles.tableBox}>
          <AreaHeaderComponent
            showExportBtn={true}
            onClickExport={this.exportChange}
            title={trans("global.skillAnalysis", "素养能力分析")}
            leftPanelContent={
              <div className={styles.filters}>
                <Select
                  onChange={this.changeGroup}
                  value={this.state.groupId}
                  className={styles.groupSelect}
                >
                  <Option value={0} key={0}>
                    {trans("global.allClass", "全部班级")}
                  </Option>
                  {classList.map((item) => (
                    <Option value={item.groupId} key={item.groupId}>
                      {locale() == "en" ? item.groupEName : item.groupName}
                    </Option>
                  ))}
                </Select>
                <Search
                  className={styles.search}
                  placeholder={trans(
                    "global.enterStudentName",
                    "请输入学生姓名",
                  )}
                  onSearch={this.searchStudent}
                  allowClear
                />
              </div>
            }
            rightPanelContent={
              <>
                <ChartSwitch
                  label={trans(
                    "global.secondaryLiteracyDisplay",
                    "二级素养能力展示",
                  )}
                  checked={this.state.qualityToggle}
                  onChange={this.handleQualityToggle}
                />
                {this.props.filterStudentListPermissions &&
                this.props.filterStudentListPermissions
                  .haveFilterStudentList ? (
                  <ChartSwitch
                    label={trans("global.specifyAnalysis", "指定分析")}
                    defaultChecked
                    checked={this.state.studentAccomplishmentSpecify}
                    onChange={this.handleSpecifyChange}
                  />
                ) : null}
              </>
            }
          />
          <div className={styles.contentBody}>
            <MyTable
              columns={this.state.columns}
              dataSource={this.state.tableData}
              bordered
              loading={this.state.loading}
              pagination={false}
              scroll={{ x: 2000 }}
            />
            <div className={styles.pagination}>
              <Pagination
                size="small"
                pageSize={this.state.pageSize}
                current={this.state.pageNum}
                total={this.state.total}
                onChange={this.changePage}
                showSizeChanger
                showQuickJumper
                onShowSizeChange={this.changePageSize}
                pageSizeOptions={["50", "100", "150", "200"]}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default StudentAccomplishmentTable;

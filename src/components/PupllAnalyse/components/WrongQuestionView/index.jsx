// 类组件
import React from "react";
import { Spin } from "antd";

import ChartSwitch from "../../../../components/ChartSwitch";
import { locale, trans } from "../../../../utils/i18n";
import MyTable from "../MyTable";
import TableHeader from "../TableHeader";

import styles from "./index.module.less";
class WrongQuestionView extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      // xxx: nextProps.xxx,
    };
  }

  componentDidMount() {}

  render() {
    let dataSource = [
      { name: trans("global.questionType", "题型") },
      { name: locale() == "en" ? "Score/Value" : "得分/分值" },
      { name: trans("analysis.hardValue", "难度") },
    ];
    let columns = [];

    const {
      studySituationByStudentIdList,
      titName,
      edit = true,
      spinning,
    } = this.props;
    const { moduleModelList } = studySituationByStudentIdList;

    let ls = [];
    if (moduleModelList?.length) {
      let result = moduleModelList.find((item) => {
        return item.modelCode === "WRONG_QUESTIONS_OVERVIEW";
      });
      ls = result?.modelValue;
    }

    if (ls && ls.length > 0) {
      for (const [index, element] of ls.entries()) {
        columns.push({
          title: element.questionNo,
          dataIndex: `dataIndex${index}`,
          key: `dataIndex${index}`,
          width: 95,
        });
      }

      for (const [index, element] of ls.entries()) {
        dataSource[0][`dataIndex${index}`] = element.questionTypeName;
        dataSource[1][`dataIndex${index}`] = element.questionScoreRatio;
        dataSource[2][`dataIndex${index}`] = element.questionLevelName;
      }
    }

    let columnssss = [];

    if (columns.length === 0) {
      columnssss.push([]);
    } else if (columns.length <= 8) {
      columnssss.push(columns);
    } else if (columns.length > 8) {
      let start;
      let end;
      for (let index = 0; index < Math.ceil(columns.length / 8); index++) {
        start = index * 8;
        end = start + 8;
        columnssss.push(columns.slice(start, end));
      }
    }

    // 向每一个表格最前面添加第一列
    for (const ls of columnssss) {
      ls.unshift({
        title: trans("global.incorrectQuestionNumber", "错题题号"),
        key: "name",
        dataIndex: "name",
        width: 122,
      });
    }

    let moduleSwitch = false;
    if (moduleModelList?.length) {
      let result = moduleModelList.find((item) => {
        return item.modelCode === "WRONG_QUESTIONS_OVERVIEW";
      });
      moduleSwitch = result?.modelShow;
    }

    return (
      <div className={styles.wrongQuestionView}>
        <Spin spinning={spinning}>
          <TableHeader
            titleName={titName}
            slot={
              edit ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div style={{ marginLeft: "auto" }}>
                    {
                      <ChartSwitch
                        checked={Boolean(moduleSwitch)}
                        onChange={this.props.onChange}
                      />
                    }
                  </div>
                </div>
              ) : null
            }
          />
          {moduleSwitch
            ? columnssss.map((tableColumns) => {
                let number = (tableColumns.length - 1) * 95;
                return (
                  <div
                    style={{
                      width: `${122 + number}px`,
                      height: "100%",
                      marginBottom: "10px",
                    }}
                  >
                    <MyTable
                      dataSource={dataSource || []}
                      bordered
                      pagination={false}
                      columns={tableColumns || []}
                    />
                  </div>
                );
              })
            : null}
        </Spin>
      </div>
    );
  }
}

export default WrongQuestionView;

// 类组件
import React from "react";
import { Input, Select, Spin, Table } from "antd";
import RViewerJS from "viewerjs-react";

import {
  getStudentLisByPrint,
  getStudentPaperResult,
  printCodeClassList,
} from "../../../../services/global";
import { locale, trans } from "../../../../utils/i18n";

import "viewerjs-react/dist/index.css";
import "viewerjs/dist/viewer.css";
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
const { Option } = Select;
const { Search } = Input;

class DotMatrixPen extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      imgUrl: [],
      record: false,
      loading: false,
      tableData: [],
      answersResponses: [],
      pagination: {
        current: 1,
        pageSize: 20,
      },
      keyWord: "",
      groupId: 0,
      groupList: [],
    };
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      // xxx: nextProps.xxx,
    };
  }

  componentDidMount() {
    this.getStudentLisByPrintFun();
    printCodeClassList({
      examId: this.props.examId,
    }).then((res) => {
      this.setState({
        groupList: res.content,
      });
    });
  }
  getStudentLisByPrintFun = () => {
    getStudentLisByPrint({
      examId: this.props.examId,
      groupId: this.state.groupId == 0 ? "" : this.state.groupId,
      keyWord: this.state.keyWord,
      pageNum: this.state.pagination.current,
      pageSize: this.state.pagination.pageSize,
    }).then((res) => {
      console.log(res, "resres");
      this.setState({
        tableData: res.content.data.studentInfoModelList,
        answersResponses: res.content.data.answersResponses,
        pagination: {
          ...this.state.pagination,
          total: res.content?.total,
        },
      });
    });
  };

  onChange = (pagination) => {
    console.log(pagination);
    this.setState(
      {
        pagination: pagination,
      },
      () => {
        this.getStudentLisByPrintFun();
      },
    );
  };

  lookPaperResult = async (record, index, firstOpen) => {
    let result = await getStudentPaperResult({
      index: index,
      studentId: record.studentId,
      paperId: this.props.paperId,
    });
    let imgUrl = "data:image/png;base64," + result.content;
    this.setState({
      imgUrl: imgUrl,
    });
    this.setState(
      {
        index: index,
      },
      () => {
        // 第一次打开
        if (firstOpen) {
          console.log("firstOpen");
          const img = document.querySelector("#img").querySelector("img");
          img?.click();
        }
      },
    );
  };

  getColumns = () => {
    let array = [];
    if (this.state.answersResponses && this.state.answersResponses.length > 0) {
      array = this.state.answersResponses.map((item) => ({
        title: item.questionNum,
        dataIndex: item.questionNum,
        key: item.questionNum,
        className: styles.columnsBox,
        render: (text, record, index) => (
          <div
            className={`${styles.cells} ${text?.isCorrect == 1 ? styles.correct : ""} ${text?.isCorrect == 2 ? styles.error : ""}`}
          >
            <div>{text?.studentScore}</div>
            <div style={{ textAlign: "right" }}>{text?.studentAnswer}</div>
          </div>
        ),
      }));
    }

    array = [
      {
        title: trans("analysis.studentList", "学生列表"),
        dataIndex: "name",
        key: "name",
        fixed: "left",
        width: 100,
      },
      {
        title: trans("global.group", "班级"),
        dataIndex: "groupName",
        key: "groupName",
        fixed: "left",
        width: 120,
      },
      ...array,
      {
        title: trans("global.operation", "操作"),
        width: 150,
        fixed: "right",
        render: (text, record, index) => (
          <span
            onClick={() => {
              this.setState({
                record: record,
              });
              this.lookPaperResult(record, 1, true);
            }}
            style={{ color: "#0445FC", cursor: "pointer" }}
          >
            {trans(
              "dotMatrixPen.viewAnswerSheetWithPage",
              "查看答卷【{$pageNum}】",
              {
                pageNum: record.pageNum,
              },
            )}
          </span>
        ),
      },
    ];

    console.log(array, "arr");
    return array;
  };

  changeSearch = (e) => {
    this.setState({
      keyWord: e.target.value,
    });
  };

  onSearch = () => {
    this.getStudentLisByPrintFun();
  };

  changeClass = (value) => {
    this.setState(
      {
        groupId: value,
      },
      () => {
        this.getStudentLisByPrintFun();
      },
    );
  };

  handelTable = () => {
    let list = [];

    if (this.state.tableData && this.state.tableData.length > 0) {
      list = JSON.parse(JSON.stringify(this.state.tableData));

      for (const item of list) {
        if (item.studentQuestion && item.studentQuestion.length > 0) {
          for (const item1 of item.studentQuestion) {
            item[item1.questionNum] = {
              studentScore: item1.studentScore,
              studentAnswer: item1.studentAnswer,
              isCorrect: item1.isCorrect,
            };
          }
        }
      }
    }
    console.log(list, "tabtab");
    return list;
  };

  render() {
    return (
      <Spin spinning={this.state.loading}>
        <div className={styles.DotMatrixPen}>
          <div id="img" style={{ display: "none" }} className={styles.imgView}>
            <RViewerJS
              options={{
                zoom: 0.75,
                navbar: false,
                toolbar: {
                  zoomIn: { size: "large" },
                  zoomOut: { size: "large" },
                  oneToOne: { size: "large" },
                  reset: { size: "large" },
                  prev: {
                    show: true,
                    size: "large",
                    click: () => {
                      if (this.state.index > 1) {
                        this.lookPaperResult(
                          this.state.record,
                          this.state.index - 1,
                        );
                      }
                    },
                  },
                  play: {
                    show: true,
                    size: "large",
                  },
                  next: {
                    show: true,
                    size: "large",
                    click: () => {
                      if (this.state.record.pageNum > this.state.index) {
                        this.lookPaperResult(
                          this.state.record,
                          this.state.index + 1,
                        );
                      }
                    },
                  },
                  rotateLeft: { size: "large" },
                  rotateRight: { size: "large" },
                  flipHorizontal: { size: "large" },
                  flipVertical: { size: "large" },
                },
              }}
            >
              <img
                src={this.state.imgUrl}
                alt={trans("dotMatrixPen.clickToView", "点击查看")}
              />
            </RViewerJS>
          </div>

          <div
            style={{
              width: "100%",
              height: "100%",
              padding: "10px",
              backgroundColor: "#fff",
              borderRadius: "10px",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              <Select
                onChange={this.changeClass}
                style={{ width: 200, marginRight: "10px" }}
                value={this.state.groupId}
                placeholder={trans("modalTest.selectClass", "选择班级")}
              >
                <Option value={0} key={0}>
                  <span>{trans("global.allClass", "全部班级")}</span>
                </Option>
                {this.state.groupList?.map((item) => (
                  <Option value={item.groupId} key={item.groupId}>
                    <span>{language ? item.groupName : item.groupEnName}</span>
                  </Option>
                ))}
              </Select>
              <Search
                placeholder={trans("global.searchStu", "搜索学生")}
                allowClear
                value={this.state.keyWord}
                onChange={this.changeSearch}
                onSearch={this.onSearch}
                style={{ width: 200 }}
              />
            </div>
            <Table
              pagination={{
                total: this.state.pagination.total,
                pageSize: this.state.pagination.pageSize,
              }}
              bordered
              dataSource={this.handelTable()}
              columns={this.getColumns()}
              onChange={this.onChange}
            />
          </div>
        </div>
      </Spin>
    );
  }
}

export default DotMatrixPen;

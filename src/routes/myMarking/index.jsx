import React, { PureComponent } from "react";
import { Icon, message, Select, Table } from "antd";
import { connect } from "dva";

import { getMeCheckQuestionUser } from "../../services/marking";
import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
const { Option } = Select;
class myMarking extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    let { examId, questionIds, questionPaperType } = this.props.match.params;
    this.examId = examId;
    this.questionIds = questionIds;
    this.questionPaperType = questionPaperType;
    this.state = {
      tableData: [],
      loading: true,
    };
  }
  componentDidMount() {
    window.addEventListener("storage", (event) => {
      if (event.key === "tab_b_closed") {
        this.getStudentTableData(); // 刷新页面数据
      }
    });
    this.getQuestionNumber();
  }

  getQuestionNumber = () => {
    this.props
      .dispatch({
        type: "marking/getQuestionIdOrPiece",
        payload: {
          examId: this.examId,
          questionSettingIdList: this.questionIds,
          questionPaperType: 1,
        },
      })
      .then(() => {
        this.getStudentTableData();
      });
  };

  getStudentTableData = () => {
    this.setState({
      loading: true,
    });
    getMeCheckQuestionUser({
      examId: this.examId,
      questionSettingIdList: this.questionIds,
    })
      .then((res) => {
        if (res.status) {
          this.setState({
            tableData: res.content,
          });
        } else {
          message.error(res.message);
        }
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };

  back = () => {
    window.close() || this.props.history.goBack();
  };

  againMarking = (stuId) => {
    let url = `${window.location.origin}/exam#/gradingPapers/${this.examId}/${this.questionIds}/${this.questionPaperType}/${stuId}`;
    window.open(url);
  };

  handleQuestionChange = (value) => {
    this.questionIds = value;
    let url = `${window.location.origin}/exam#/myMarking/${this.examId}/${this.questionIds}/${this.questionPaperType}`;
    window.open(url, "_self");
    this.getStudentTableData();
  };

  getTableColumnsConfig = () => {
    return [
      {
        title: trans("global.order", "序号"),
        dataIndex: "index",
        key: "index",
        width: 100,
      },
      {
        title: trans("global.student", "学生"),
        dataIndex: "studentName",
        key: "studentName",
        width: 100,
        render: (text, record) => {
          return <span>{text ? text : record.index}</span>;
        },
      },
      {
        title: trans("global.yourScore", "得分"),
        dataIndex: "score",
        key: "score",
        width: 100,
      },
      {
        title: trans("global.option", "操作"),
        width: 100,
        render: (text, record) => {
          return (
            <div
              style={{ color: "#0445fc", cursor: "pointer" }}
              onClick={() => this.againMarking(record.studentId)}
            >
              回评
            </div>
          );
        },
      },
    ];
  };

  render() {
    const { questionIdOrPiece } = this.props;
    return (
      <div className={styles.myMarking}>
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <Icon
              type="left"
              className={[styles.closeIcon].join(" ")}
              onClick={this.back}
            />
            <span className={styles.testTitle}>
              {trans("myMarking.title", "我的批改")}
            </span>
          </div>
        </div>
        <div className={styles.navbarHeader}>
          <span className={styles.viewBox}>
            {trans("analysis.questionIndex", "题号")}：
            <Select
              style={{ width: 120 }}
              onChange={this.handleQuestionChange}
              value={this.questionIds}
            >
              {questionIdOrPiece &&
                questionIdOrPiece.length > 0 &&
                questionIdOrPiece.map((item) => (
                  <Option
                    value={item.questionSettingIdList.join(",")}
                    key={item.questionInfo}
                  >
                    {item.questionInfo}
                  </Option>
                ))}
            </Select>
          </span>
        </div>
        <div className={styles.statusContent}>
          <Table
            loading={this.state.loading}
            dataSource={this.state.tableData}
            pagination={false}
            scroll={{ y: true }}
            columns={this.getTableColumnsConfig()}
          />
        </div>
      </div>
    );
  }
}
export default connect(({ home, marking, global }) => ({
  checkQuestionList: marking.checkQuestionList,
  questionIdOrPiece: marking.questionIdOrPiece,
}))(myMarking);

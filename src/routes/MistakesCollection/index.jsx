import React from "react";
import { Pagination, Table } from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

class MistakesCollection extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      pageSizeErr: 10,
      pageNoErr: 1,
      subjectId: null,
    };
  }
  componentDidMount() {
    this.props
      .dispatch({
        type: "studentLearning/getAllSubject",
      })
      .then(() => {
        if (this.props.allSubjectList && this.props.allSubjectList.length > 0) {
          this.setState(
            {
              subjectId: this.props.allSubjectList[0]?.id || "",
            },
            () => {
              this.getPage();
            },
          );
        }
      });
  }
  getPage = () => {
    const { pageSizeErr, pageNoErr, subjectId } = this.state;
    this.props.dispatch({
      type: "global/getStuAllWrongQuestionVersion",
      payload: {
        pageNum: pageNoErr,
        pageSize: pageSizeErr,
        subjectId: subjectId,
      },
    });
  };
  changeNoErr = (value) => {
    this.setState(
      {
        pageNoErr: value,
      },
      () => {
        this.getPage();
      },
    );
  };
  onShowSizeErrChange = (current, pageSize) => {
    this.setState(
      {
        pageNoErr: 1,
        pageSizeErr: pageSize,
      },
      () => {
        this.getPage();
      },
    );
  };
  back = () => {
    window.close() || this.props.history.goBack();
    // window.close(`${window.location.origin}/#/examAnalysis`);
  };
  clickvieView = (id) => {
    window.open(`${window.location.origin}/exam#/wrongTable/${id}`);
  };
  clickSub = (id) => {
    this.setState(
      {
        subjectId: id,
      },
      () => {
        this.getPage();
      },
    );
  };
  render() {
    const { stuAllWrongQuestionVersion, allSubjectList } = this.props;
    const { subjectId } = this.state;
    let newDataSource = [];
    stuAllWrongQuestionVersion &&
      stuAllWrongQuestionVersion.data &&
      stuAllWrongQuestionVersion.data.length > 0 &&
      stuAllWrongQuestionVersion.data.map((item, index) => {
        let object = item;
        object.index = index + 1;
        newDataSource.push(object);
      });
    console.log(newDataSource, "ppp");
    const newcolumns = [
      {
        title: trans("global.order", "序号"),
        dataIndex: "index",
        key: "index",
        width: 40,
      },
      {
        title: trans("global.appellation", "名称"),
        dataIndex: "name",
        key: "name",
        width: 160,
      },
      {
        title: trans("global.pushTime", "推送时间"),
        dataIndex: "publishTime",
        key: "publishTime",
        width: 120,
      },
      {
        title: trans("global.pushTeacher", "推送老师"),
        dataIndex: "createUserName",
        key: "createUserName",
        width: 120,
      },
      {
        title: trans("global.option", "操作"),
        dataIndex: "status",
        key: "status",
        width: 150,
        render: (text, record, index) => {
          return (
            <div>
              <span
                className={styles.operate}
                onClick={() => this.clickvieView(record.id)}
              >
                {trans("global.view1", "查看")}
              </span>
              <a
                href={`${
                  window.location.origin
                }/api/trendComparativeAnalysis/export/errorQuestionList?queryType=1&subjectId=${subjectId}&gradeIdList=${
                  record.gradeIdList
                }&examTypeList=${record.examTypeList}&examIdList=${
                  record.examIdList[0] == 0 ? "" : record.examIdList
                }`}
                target="_blank"
                style={{ color: "#0445FC" }}
                rel="noreferrer"
              >
                <span>{trans("global.downloadErrorQuestion", "下载错题")}</span>
              </a>
            </div>
          );
        },
      },
    ];
    let device = window.yg;
    const { showBack } = this.props.match.params;
    return (
      <div className={styles.mistakesCollectionBox}>
        <div
          className={styles.header}
          style={device == "ipad" || showBack ? { display: "none" } : {}}
        >
          <div className={styles.goBackBox}>
            <i className={styles.iconfont} onClick={this.back}>
              &#xe6ff;
            </i>
            <span className={styles.goBack}>
              {trans("global.goBack", "返回")}
            </span>
          </div>

          <span className={styles.title}>
            {trans("global.mistakesCollection", "错题集")}
          </span>
        </div>
        <div className={styles.stuWrongQuestion}>
          <div className={styles.tabSub}>
            {allSubjectList &&
              allSubjectList.length > 0 &&
              allSubjectList.map((item) => (
                <span
                  className={styles.subBox}
                  style={
                    subjectId == item.id
                      ? {
                          color: "#0445FC",
                          background: "rgb(212, 223, 253)",
                        }
                      : null
                  }
                  onClick={() => this.clickSub(item.id)}
                >
                  {item.name}
                </span>
              ))}
            {/* <span
              className={styles.subBox}
              // style={
              //   subjectId == item.id
              //     ? {
              //         color: "#0445FC",
              //         background: "rgb(212, 223, 253)",
              //       }
              //     : null
              // }
              style={{
                color: "#0445FC",
                background: "rgb(212, 223, 253)",
              }}
            >
              {trans("global.mathematics", "数学")}
            </span> */}
          </div>
          <div className={styles.tableBody}>
            <Table
              columns={newcolumns}
              dataSource={newDataSource}
              align={"center"}
              pagination={false}
            />
          </div>
          <div className={styles.paginations}>
            <Pagination
              size="small"
              pageSize={this.state.pageSizeErr}
              current={this.state.pageNoErr}
              total={stuAllWrongQuestionVersion.total || 0}
              onChange={this.changeNoErr}
              showSizeChanger
              showQuickJumper
              onShowSizeChange={this.onShowSizeErrChange}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ home, global, studentLearning }) => ({
  stuAllWrongQuestionVersion: global.stuAllWrongQuestionVersion,
  allSubjectList: studentLearning.allSubjectList,
}))(MistakesCollection);

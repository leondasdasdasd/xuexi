import React, { PureComponent } from "react";
import { Input, Pagination, Select, Table } from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Search } = Input;
const { Option } = Select;
class QuestionVersion extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      pageSizeErr: 10,
      pageNoErr: 1,
    };
  }
  componentDidMount() {
    this.getPage();
  }
  getPage = () => {
    const { pageSizeErr, pageNoErr } = this.state;
    this.props.dispatch({
      type: "global/getAllWrongQuestionVersion",
      payload: {
        pageNum: pageNoErr,
        pageSize: pageSizeErr,
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
  clickDelete = (id) => {
    this.props
      .dispatch({
        type: "global/getDeleteWrongQuestionVersion",
        payload: {
          id,
        },
      })
      .then(() => {
        this.getPage();
      });
  };
  clickPushToStu = (record) => {
    this.props.savedCriteriaChange();
    this.props.clickCriteriaBtn(record);
  };
  clickView = (record) => {
    // this.props.savedCriteriaChange();
    // this.props.saveQueryCriteria(record);
    window.open(
      `${window.location.origin}/exam#/wrongTable/${record.id}/${record.status}`,
    );
  };

  render() {
    const { allWrongQuestionVersion } = this.props;
    let newDataSource = [];
    allWrongQuestionVersion &&
      allWrongQuestionVersion.data &&
      allWrongQuestionVersion.data.length > 0 &&
      allWrongQuestionVersion.data.map((item, index) => {
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
        title: trans("global.currentState", "当前状态"),
        dataIndex: "status",
        key: "status",
        width: 80,
        render: (text, record, index) => {
          return (
            <div>
              {text == 0
                ? trans("global.unPush", "未推送")
                : trans("global.Pushed", "已推送")}
            </div>
          );
        },
      },
      {
        title: trans("global.saveTime", "保存时间"),
        dataIndex: "modifyTime",
        key: "modifyTime",
        width: 120,
      },
      {
        title: trans("global.pushTime", "推送时间"),
        dataIndex: "publishTime",
        key: "publishTime",
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
              {text == 0 ? (
                <div>
                  <span
                    className={styles.operate}
                    onClick={() => this.clickPushToStu(record)}
                  >
                    {trans("global.pushToStu", "推送给学生")}
                  </span>
                  <span
                    className={styles.operate}
                    onClick={() => this.clickView(record)}
                  >
                    {trans("global.view1", "查看")}
                  </span>
                  <span
                    className={styles.operate}
                    onClick={() => this.clickDelete(record.id)}
                  >
                    {trans("global.delete", "删除")}
                  </span>
                </div>
              ) : (
                <div>
                  <span
                    className={styles.operate}
                    onClick={() => this.clickView(record)}
                  >
                    {trans("global.view1", "查看")}
                  </span>
                  <span
                    className={styles.operate}
                    onClick={() => this.clickDelete(record.id)}
                  >
                    {trans("global.delete", "删除")}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
    ];
    return (
      <div className={styles.queryCriteriaTable}>
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
            total={allWrongQuestionVersion.total || 0}
            onChange={this.changeNoErr}
            showSizeChanger
            showQuickJumper
            onShowSizeChange={this.onShowSizeErrChange}
            pageSizeOptions={[10, 20, 50, 100]}
            hideOnSinglePage={true}
          />
        </div>
      </div>
    );
  }
}
export default connect(({ home, global }) => ({
  allWrongQuestionVersion: global.allWrongQuestionVersion,
}))(QuestionVersion);

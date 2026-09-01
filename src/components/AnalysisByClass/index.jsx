//按班级的数据统计
import React, { PureComponent } from "react";
import { Pagination, Popover, Spin, Table } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

@connect((state) => ({
  analysisPersonData: state.home.analysisPersonData, //按班级查看统计人数
}))
class AnalysisByClass extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      pageNumber: 1,
      pageSize: 10,
      visibleObj: {},
      loading: false,
      loadTable: false,
    };
  }

  //切换分页
  changePageSize = (page, size) => {
    this.setState(
      {
        pageNumber: page,
        pageSize: size,
      },
      () => {
        const { getData } = this.props;
        typeof getData == "function" && getData.call(this, page, size);
      },
    );
  };

  switchPageSize = (current, size) => {
    this.setState(
      {
        pageNumber: current,
        pageSize: size,
      },
      () => {
        const { getData } = this.props;
        typeof getData == "function" && getData.call(this, current, size);
      },
    );
  };

  changePopVisible(text, record, type, visible) {
    let visibleObject = JSON.parse(JSON.stringify(this.state.visibleObj));
    visibleObject = {};
    visibleObject[`${text.groupId}-${type}`] = visible;
    if (visible) {
      const { dispatch, examPaperId, examId } = this.props;
      this.setState({
        loading: true,
      });
      dispatch({
        type: "home/getPersonAnalysis",
        payload: {
          examId: examId,
          groupId: text.groupId,
          type: type,
        },
      }).then(() => {
        this.setState({
          loading: false,
        });
      });
    }
    this.setState({
      visibleObj: visibleObject,
    });
  }

  renderPersonPop = (text, record, type, self, personNumber) => {
    return (
      <Popover
        content={self.renderPerson(text, record)}
        title={null}
        trigger="click"
        visible={self.state.visibleObj[`${text.groupId}-${type}`] || false}
        onVisibleChange={self.changePopVisible.bind(self, text, record, type)}
      >
        <em>{personNumber}</em>
        <i className={icon.iconfont}>&#xe74e;</i>
      </Popover>
    );
  };

  renderPerson = (text, record) => {
    const { analysisPersonData } = this.props;
    return (
      <Spin size="small" spinning={this.state.loading}>
        <div className={styles.personContent}>
          {analysisPersonData && analysisPersonData.length > 0 ? (
            analysisPersonData.map((item, index) => (
              <span className={styles.avatarInfo} key={index}>
                <em
                  className={styles.avatarUrl}
                  style={{ backgroundImage: `url(${item.avatarUrl})` }}
                ></em>
                <em className={styles.avatarName}>{item.name}</em>
                <em className={styles.avatarName}>{item.ename}</em>
              </span>
            ))
          ) : (
            <span>{trans("analysis.noData", "暂无人员")}</span>
          )}
        </div>
      </Spin>
    );
  };

  render() {
    /** 
         1(推送人数),2(已提交人数),3(未提交人数),4(最高分),5(最低分),6(满分人数)
     */
    const { scoreData } = this.props;
    let tableSource = scoreData.data ? scoreData.data : [];
    let self = this;
    const columns = [
      {
        title: trans("analysis.classList", "班级列表"),
        align: "center",
        key: "class",
        render: function (text, record) {
          return (
            <span>
              <em className={styles.groupName}>{text.groupName}</em>
              <em className={styles.groupEName}>{text.groupEname}</em>
            </span>
          );
        },
      },
      {
        title: trans("analysis.pushNumber", "推送人数"),
        align: "center",
        key: "pushNumber",
        render: function (text, record) {
          return (
            <span className={styles.personNumber}>
              {/* {self.renderPersonPop(text, record, 1, self, text.pushNumber)} */}
              <em>{text.pushNumber}</em>
            </span>
          );
        },
      },
      {
        title: trans("analysis.commitNumber", "已提交人数"),
        align: "center",
        key: "commitNumber",
        render: function (text, record) {
          return (
            <span className={`${styles.personNumber} ${styles.blueNumber}`}>
              {/* {self.renderPersonPop(text, record, 2, self, text.submitNumber)} */}
              <em>{text.submitNumber}</em>
            </span>
          );
        },
      },
      {
        title: trans("analysis.unCommitNumber", "未提交人数"),
        align: "center",
        key: "unCommitNumbrer",
        render: function (text, record) {
          return (
            <span className={`${styles.personNumber} ${styles.yellowNumber}`}>
              {self.renderPersonPop(text, record, 3, self, text.unSubmitNumber)}
            </span>
          );
        },
      },
      {
        title: trans("global.passRating", "及格率"),
        align: "center",
        key: "passRating",
        render: function (text, record) {
          return (
            <span>
              <em className={styles.groupName}>{text.passingRate}</em>
            </span>
          );
        },
      },
      {
        title: trans("global.maxScore", "最高分"),
        align: "center",
        key: "maxScore",
        render: function (text, record) {
          return (
            <span className={`${styles.personNumber} ${styles.redNumber}`}>
              {self.renderPersonPop(text, record, 4, self, text.maxScore)}
            </span>
          );
        },
      },
      {
        title: trans("global.minScore", "最低分"),
        align: "center",
        key: "minScore",
        render: function (text, record) {
          return (
            <span className={styles.personNumber}>
              {self.renderPersonPop(text, record, 5, self, text.minScore)}
            </span>
          );
        },
      },
      {
        title: trans("global.avgScore", "平均分"),
        align: "center",
        key: "avgScore",
        render: function (text, record) {
          return (
            <span>
              <em className={styles.groupName}>{text.avgScore}</em>
            </span>
          );
        },
      },
      {
        title: trans("global.middleNumber", "中位数"),
        align: "center",
        key: "middleNumber",
        render: function (text, record) {
          return (
            <span>
              <em className={styles.groupName}>{text.medianScore}</em>
            </span>
          );
        },
      },
      {
        title: trans("global.fullScoreNumber", "满分人数"),
        align: "center",
        key: "fullScore",
        render: function (text, record) {
          return (
            <span className={styles.personNumber}>
              {self.renderPersonPop(
                text,
                record,
                6,
                self,
                text.fullScoreNumber,
              )}
            </span>
          );
        },
      },
    ];
    return (
      <div className={styles.analysisClass}>
        <Spin spinning={this.props.loadingTable} size="large">
          <Table
            bordered
            rowKey="id"
            columns={columns}
            rowClassName="editable-row"
            pagination={false}
            dataSource={tableSource}
          />
        </Spin>
        <div className={styles.showPage}>
          <Pagination
            total={scoreData.total || 0}
            showSizeChanger
            onChange={this.changePageSize}
            onShowSizeChange={this.switchPageSize}
            current={this.state.pageNumber}
            pageSize={this.state.pageSize}
            hideOnSinglePage={true}
          />
        </div>
      </div>
    );
  }
}

export default AnalysisByClass;

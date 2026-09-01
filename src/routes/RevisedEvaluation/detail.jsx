//订正详情
import React, { PureComponent } from "react";
import { Icon, Input, message, Modal, Skeleton, Table } from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";

import { trans } from "../../utils/i18n";

import styles from "./detail.module.less";

const { TextArea } = Input;

@connect((state) => ({
  correctionProcessInfo: state.revisedRecord.correctionProcessInfo,
}))
class RevisedDetail extends PureComponent {
  constructor(properties) {
    super(properties);

    this.state = {
      loading: false,
      approvalComments: undefined, //审批意见
      approveModal: false, //审批弹框
      type: "agree", //agree: 同意   refuse: 拒绝
      submitLoading: false, //提交loading
    };
    console.log(
      `this.props.history.location.pathname`,
      this.props.history.location.pathname,
    );
  }

  componentDidMount() {
    this.getDetail();
  }

  //获取审批详情
  getDetail = () => {
    const {
      match: { params },
      dispatch,
    } = this.props;
    this.setState({
      loading: true,
    });
    dispatch({
      type: "revisedRecord/getcorrectionProcessInfo",
      payload: {
        correctionProcessId:
          params && params.correctionProcessId
            ? params.correctionProcessId
            : null,
      },
    }).then(() => {
      this.setState({
        loading: false,
      });
    });
  };

  //订正明细
  renderDetail = (processContent) => {
    let correctionDetail = processContent.correctionDetail || [];

    const columns =
      processContent.processType && processContent.processType == 2
        ? [
            {
              title: trans("analysis.questionIndex", "题号"),
              dataIndex: "questionId",
              key: "questionId",
              className: styles.questionId,
            },
            {
              title: trans("gobal.questionScore", "分值"),
              dataIndex: "questionScore",
              key: "questionScore",
              className: styles.questionId,
            },
            {
              title: trans("global.student", "学生"),
              dataIndex: "studentNames",
              key: "studentNames",
              className: styles.studentNames,
            },
            {
              title: trans("global.newScore", "新得分"),
              dataIndex: "newScore",
              key: "newScore",
            },
          ]
        : [
            {
              title: trans("analysis.questionIndex", "题号"),
              dataIndex: "questionId",
              key: "questionId",
              className: styles.questionId,
            },
            {
              title: trans("global.oldAnswer", "原答案"),
              dataIndex: "answer",
              key: "answer",
            },
            {
              title: trans("global.newAnswer", "新答案"),
              dataIndex: "newAnswer",
              key: "newAnswer",
            },
          ];
    return (
      <Table
        dataSource={correctionDetail}
        columns={columns}
        pagination={false}
      />
    );
  };

  //获取当前类名
  getClassName = (info, name, type) => {
    let currentClassName = "";
    if (type && type === 1) {
      currentClassName = info.processStatusType
        ? info.processStatusType == 1
          ? styles.delaybg
          : info.processStatusType == 2
            ? styles.completedbg
            : styles.refusebg
        : null;
    } else {
      currentClassName = info.processStatusType
        ? info.processStatusType == 1
          ? styles.delay
          : info.processStatusType == 2
            ? styles.completed
            : styles.refuse
        : null;
    }
    return `${name} ${currentClassName}`;
  };

  //获取进度状态
  getCurrentStatus = (list, index) => {
    if (index === list.length - 1) {
      return false;
    } else {
      let nextItem = list[index + 1];
      return this.getClassName(nextItem, styles.line, 1);
    }
  };

  //展示审批进度
  showProgressContent = (processAudit) => {
    return (
      <div className={styles.progressContent}>
        {processAudit &&
          processAudit.length > 0 &&
          processAudit.map((item, index) => (
            <div className={styles.progressItem}>
              <div className={styles.progressStatus}>
                <span
                  className={this.getClassName(item, styles.round, 1)}
                ></span>
                <span
                  className={this.getCurrentStatus(processAudit, index)}
                ></span>
              </div>
              <div className={styles.itemLeft}>
                <img src={item.avatarUrl} alt="" />
              </div>
              <div className={styles.itemRight}>
                <div className={styles.userName}>
                  {item.userName}
                  <span>{item.dealTime}</span>
                </div>
                <div className={this.getClassName(item, styles.desc, 2)}>
                  {item.dealStatus}
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  //关闭弹窗
  deleteHandleCancel = () => {
    this.setState({
      approveModal: false,
      approvalComments: undefined,
    });
  };

  //确定审批
  agreeApprove = () => {
    const { type, approvalComments } = this.state;
    const {
      dispatch,
      match: { params },
    } = this.props;
    this.setState(
      {
        submitLoading: true,
      },
      () => {
        dispatch({
          type: "revisedRecord/toApprove",
          payload: {
            correctionProcessId:
              params && params.correctionProcessId
                ? params.correctionProcessId
                : null,
            auditType: type && type === "agree" ? 1 : 2,
            remark: approvalComments,
          },
          onSuccess: () => {
            message.success(trans("global.operateSuccess", "操作成功"));
            this.deleteHandleCancel();
            this.getDetail();
          },
        }).then(() => {
          this.setState({
            submitLoading: false,
          });
        });
      },
    );
  };

  //审批意见
  changeApprovalComments = (e) => {
    this.setState({
      approvalComments: e.target.value,
    });
  };

  //打开审批
  openApprove = (type) => {
    this.setState({
      type,
      approveModal: true,
      approvalComments:
        type === "agree"
          ? trans("global.agree", "同意")
          : trans("global.refuse", "拒绝"),
    });
  };

  back = () => {
    this.props.dispatch({
      type: "revisedRecord/clearData",
      payload: {},
    });
    this.props.dispatch(routerRedux.push("/revisedPage/1/false"));
  };

  render() {
    const { correctionProcessInfo } = this.props;
    console.log(this.source, "aaa");
    console.log(`this.props`, this.props);
    let processInfo =
      (correctionProcessInfo && correctionProcessInfo.processInfo) || {};
    let processContent =
      (correctionProcessInfo && correctionProcessInfo.processContent) || {};
    let processAudit =
      (correctionProcessInfo && correctionProcessInfo.processAudit) || {};
    return (
      <div>
        <Skeleton active loading={this.state.loading}>
          <div className={styles.revsedDetailBox}>
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <i
                  className={[styles.iconfont, styles.closeIcon].join(" ")}
                  onClick={this.back}
                >
                  &#xe76d;
                </i>
                <div style={{ padding: "5px 0" }}>{processInfo.examName}</div>
                {processInfo.createUserName ? (
                  <span>
                    {trans("global.addPerson", "创建人")}：
                    {processInfo.createUserName}
                  </span>
                ) : null}
              </div>
              <span className={styles.headerRight}>
                {processInfo.processStatusDescribe}
              </span>
            </div>
            <div className={styles.content}>
              <div className={styles.approvalContent}>
                <div className={styles.approvalItem}>
                  <span className={styles.approvalTitle}>
                    {trans("revise.applicationContent", "申请内容")}
                  </span>
                </div>
                <div className={styles.approvalItem}>
                  <span className={styles.approvalTitle}>
                    {trans("revise.paper", "订正试卷：")}
                  </span>
                  <span className={styles.approvalDetail}>
                    {processContent.examName}
                  </span>
                </div>
                <div className={styles.approvalItem}>
                  <span className={styles.approvalTitle}>
                    {trans("revise.classification", "订正分类：")}
                  </span>
                  <span className={styles.approvalDetail}>
                    {processContent.processType == 1
                      ? trans("revise.correctedAnswer", "订正答案")
                      : trans("revise.revisedScore", "订正成绩")}
                  </span>
                </div>
                <div className={styles.approvalItem}>
                  <span className={styles.approvalTitle}>
                    {trans("revise.detail", "订正明细：")}
                  </span>
                  <div className={styles.detailBox}>
                    {this.renderDetail(processContent)}
                  </div>
                </div>
                <div className={styles.approvalItem}>
                  <span className={styles.approvalTitle}>
                    {trans("revise.remark", "备注：")}
                  </span>
                  <span className={styles.approvalDetail}>
                    {processContent.remark
                      ? processContent.remark
                      : trans("global.without", "无")}
                  </span>
                </div>
              </div>
              <div className={styles.progressBox}>
                <div className={styles.progressTitle}>
                  {trans("revise.approvalProgress", "审批进度")}
                </div>
                {this.showProgressContent(processAudit)}
              </div>
              {correctionProcessInfo.showOperation ? (
                <div className={styles.btnBox}>
                  <span
                    className={styles.refuseBtn}
                    onClick={() => this.openApprove("refuse")}
                  >
                    {trans("global.refuse", "拒绝")}
                  </span>
                  <span
                    className={styles.agreeBtn}
                    onClick={() => this.openApprove("agree")}
                  >
                    {trans("global.agree", "同意")}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </Skeleton>
        <Modal
          visible={this.state.approveModal}
          footer={null}
          className={styles.approveModal}
          width="428px"
          closable={false}
          centered={true}
          onCancel={this.deleteHandleCancel.bind(this)}
        >
          <i
            className={[
              styles.iconfont,
              styles.closeIcon,
              styles.closeBtn,
            ].join(" ")}
            onClick={this.deleteHandleCancel.bind(this)}
          >
            &#xe6e2;
          </i>
          <div className={styles.modalTitle}>
            {trans("revise.approvalComments", "审批意见")}
          </div>
          <div className={styles.modalContent}>
            <TextArea
              value={this.state.approvalComments}
              onChange={this.changeApprovalComments}
            />
          </div>
          <div className={styles.operBtn}>
            <span
              className={`${styles.modalBtn} ${styles.cancelBtn}`}
              onClick={this.deleteHandleCancel.bind(this)}
            >
              {trans("global.cancle", "取消")}
            </span>
            {this.state.submitLoading ? (
              <span className={`${styles.modalBtn} ${styles.confirmBtn}`}>
                <Icon type="loading" />{" "}
                {trans("global.submitting", "提交中...")}
              </span>
            ) : (
              <span
                className={`${styles.modalBtn} ${styles.confirmBtn}`}
                onClick={this.agreeApprove.bind(this)}
              >
                {trans("global.sure", "确定")}
              </span>
            )}
          </div>
        </Modal>
      </div>
    );
  }
}

export default RevisedDetail;

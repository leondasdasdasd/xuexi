import React, { PureComponent } from "react";
import { Icon, Input, message, Pagination, Select, Skeleton } from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import pathToRegexp from "path-to-regexp";

import noDataImg from "../../assets/noData.png";
import RevisedList from "../../components/RevisedList/index";
import RuleSettings from "../../components/RevisedList/ruleSettings";
import { correctionProcessList } from "../../services/correctionProcess";
import { checkPermission } from "../../services/global";
import { getCorrectionProcessList } from "../../services/revisedRecord";
import { locale, trans } from "../../utils/i18n";
import { loginRedirect } from "../../utils/utils";
import RevisedModal from "../Revised/index";

import styles from "./index.module.less";

const { Option } = Select;
const { Search } = Input;

class RevisedRecord extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp(
      "/revisedPage/:tab/:isOpen/:evaluationId?/:type?/:courseId?/:semesterId?/:stuId?",
    ).exec(this.url);
    console.log(this.pathMatch, "111");
    this.source = this.pathMatch[3] ? "evaluation" : "question";
    this.evaluationId = this.pathMatch[3]
      ? Number.parseInt(this.pathMatch[3], 10)
      : null;
    this.tab = this.pathMatch[1] ? JSON.parse(this.pathMatch[1]) : null;
    this.isOpen = this.pathMatch[2] ? JSON.parse(this.pathMatch[2]) : null;
    this.type = this.pathMatch[4]
      ? Number.parseInt(this.pathMatch[4], 10)
      : null;
    this.courseId = this.pathMatch[5]
      ? Number.parseInt(this.pathMatch[5], 10)
      : null;
    this.semesterId = this.pathMatch[6]
      ? Number.parseInt(this.pathMatch[6], 10)
      : null;
    this.stuId = this.pathMatch[7]
      ? Number.parseInt(this.pathMatch[7], 10)
      : null;
    this.state = {
      cur: 1,
      scrollTop: 0,
      stageId: 0,
      courseId: 0,
      gradeId: 0,
      status: 0, //全部状态
      IconFont: null,
      testName: "",
      publishStatus: false,
      exampleId: null,
      examName: "",
      pageNo: 1,
      pageSize: 10,
      defaultSemester: {},
      tabValue: this.tab,
      loading: false,
      revisedModal: false, //订正数据modal
      aboutToArriveNum: null,
      sourceType: null,
      corrective: false,
      waitHandleTotal: null,
      allRevisedTotal: null,
    };
  }
  componentDidMount() {
    this.getNumber();
    this.getCurrentUser();

    checkPermission({
      permissionCode: "exam:corrective:management",
    }).then((res) => {
      if (res.content) {
        this.setState({
          corrective: res.content,
        });
      }
    });
    const {
      match: { params },
    } = this.props;
    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    if (this.isOpen) {
      this.setState({
        revisedModal: true,
      });
    }
    this.props
      .dispatch({
        type: "revisedRecord/getOptions",
        payload: {
          type: 2,
        },
      })
      .then(() => {
        const { examOptions } = this.props;
        let ind = 0;
        if (examOptions && examOptions.length > 0) {
          examOptions.map((item, index) => {
            if (item.current) {
              ind = index;
            }
          });
        }
        this.setState(
          {
            stageId:
              examOptions && examOptions.length > 0
                ? examOptions[ind].semesterId
                : 0,
          },
          () => {
            this.changeStage(this.state.stageId);
          },
        );
      });

    // 页面加载时先刷新一次“待我处理”和“全部订正”的数量
    this.getWaitHandleTotal();
    this.getAllRevisedTotal();
    this.getPage();
  }

  getNumber = () => {
    correctionProcessList({
      limit: 1,
      pageNo: 1,
    }).then((res) => {
      if (res.status) {
        this.setState({
          aboutToArriveNum: res.content.totalNum,
        });
      } else {
        message.error(res.message);
      }
    });
  };

  // 单独获取“待我处理”数量（type 固定为 2），避免依赖 module 层当前 tab 的列表数据
  getWaitHandleTotal = () => {
    const { stageId, gradeId, courseId, sourceType, pageSize, examName } =
      this.state;
    const { typeValue, status } = this.props;

    getCorrectionProcessList({
      semesterId: stageId === 0 ? "" : stageId,
      gradeId: gradeId === 0 ? "" : gradeId,
      subjectId: courseId === 0 ? "" : courseId,
      examTypeCode: typeValue === 0 ? "" : typeValue,
      sourceType,
      pageNo: 1,
      limit: pageSize,
      examName,
      type: 2, // “待我处理”
      processStatusType: status === 0 ? "" : status,
    }).then((res) => {
      if (!res.ifLogin) {
        loginRedirect();
        return;
      }
      if (res.status) {
        const totalNumber =
          res.content && typeof res.content.totalNum === "number"
            ? res.content.totalNum
            : 0;
        this.setState({
          waitHandleTotal: totalNumber,
        });
      } else {
        this.setState({
          waitHandleTotal: 0,
        });
        message.error(res.message);
      }
    });
  };

  // 单独获取“全部订正”数量（type 固定为 4），避免依赖 module 层当前 tab 的列表数据
  getAllRevisedTotal = () => {
    const { stageId, gradeId, courseId, sourceType, pageSize, examName } =
      this.state;
    const { typeValue, status } = this.props;

    getCorrectionProcessList({
      semesterId: stageId === 0 ? "" : stageId,
      gradeId: gradeId === 0 ? "" : gradeId,
      subjectId: courseId === 0 ? "" : courseId,
      examTypeCode: typeValue === 0 ? "" : typeValue,
      sourceType,
      pageNo: 1,
      limit: pageSize,
      examName,
      type: 4, // “全部订正”
      processStatusType: status === 0 ? "" : status,
    }).then((res) => {
      if (!res.ifLogin) {
        loginRedirect();
        return;
      }
      if (res.status) {
        const totalNumber =
          res.content && typeof res.content.totalNum === "number"
            ? res.content.totalNum
            : 0;
        this.setState({
          allRevisedTotal: totalNumber,
        });
      } else {
        this.setState({
          allRevisedTotal: 0,
        });
        message.error(res.message);
      }
    });
  };

  getCurrentUser = () => {
    this.props.dispatch({
      type: "global/getCurrentUser",
    });
  };

  onShowSizeChange = (current, pageSize) => {
    this.setState(
      {
        pageNo: 1,
        pageSize,
      },
      () => {
        this.getPage();
      },
    );
  };
  changeNo = (value, pageSize) => {
    this.setState(
      {
        pageNo: value,
      },
      () => {
        this.getPage();
      },
    );
  };

  //获取订正列表
  getPage = () => {
    this.setState({
      loading: true,
    });
    this.props
      .dispatch({
        type: "revisedRecord/getCorrectionProcessList",
        payload: {
          semesterId: this.state.stageId === 0 ? "" : this.state.stageId,
          gradeId: this.state.gradeId === 0 ? "" : this.state.gradeId,
          subjectId: this.state.courseId === 0 ? "" : this.state.courseId,
          examTypeCode: this.props.typeValue === 0 ? "" : this.props.typeValue,
          sourceType: this.state.sourceType,
          pageNo: this.state.pageNo,
          limit: this.state.pageSize,
          examName: this.state.examName,
          type: this.state.tabValue, //1.我创建的2.待我处理3.我已处理4.全部流程
          processStatusType: this.props.status === 0 ? "" : this.props.status, //状态
        },
      })
      .then(() => {
        this.page += 1;
        this.setState({
          loading: false,
        });
        const total = this.props.correctionProcessData.totalNum || 0;
        // 仅在“待我处理”tab 下，请求列表时同步一次数量
        if (this.state.tabValue == 2) {
          this.setState({
            waitHandleTotal: total,
          });
        }
        // 仅在“全部订正”tab 下，请求列表时同步一次数量
        if (this.state.tabValue == 4) {
          this.setState({
            allRevisedTotal: total,
          });
        }
      });
  };
  onSearch = (value) => {
    this.setState(
      {
        pageNo: 1,
      },
      () => {
        this.getPage();
      },
    );
  };

  changeTab = (tab) => {
    this.props.dispatch(routerRedux.push(`/revisedPage/${tab}/${this.isOpen}`));
    this.setState(
      {
        tabValue: tab,
        pageNo: 1,
      },
      () => {
        // if (tab == 4) {
        const { examOptions } = this.props;
        let ind = 0;
        if (examOptions && examOptions.length > 0) {
          examOptions.map((item, index) => {
            if (item.current) {
              ind = index;
            }
          });
        }
        this.setState(
          {
            stageId: this.props.examOptions[ind].semesterId,
          },
          () => {
            this.getPage();
          },
        );
        // }
      },
    );
  };
  changeSearch = (e) => {
    this.setState({
      examName: e.target.value,
    });
  };
  switchNavList = (key) => {
    this.setState({
      cur: key,
    });
  };
  changeGrade = (value) => {
    this.setState(
      {
        gradeId: value,
        scrollTop: 0,
        courseId: 0,
      },
      () => {
        this.props.dispatch({
          type: "revisedRecord/getSubject",
          payload: {
            gradeId: this.state.gradeId,
          },
        });
        this.setState(
          {
            pageNo: 1,
          },
          () => {
            this.getPage();
          },
        );
      },
    );
  };
  changeStage = (value) => {
    const { examOptions } = this.props;
    let newSemester = {};
    if (examOptions && examOptions.length > 0) {
      examOptions.map((item) => {
        if (item.semesterId === value) {
          newSemester = item;
        }
      });
    }
    this.setState(
      {
        stageId: value,
        gradeId: 0,
        courseId: 0,
        scrollTop: 0,
        defaultSemester: newSemester,
      },
      () => {
        this.props
          .dispatch({
            type: "revisedRecord/changeSearch",
            payload: {
              typeValue: 0,
            },
          })
          .then(() => {
            this.page = 1;
            this.getPage();
          });
        this.props.dispatch({
          type: "revisedRecord/getGrade",
          payload: {
            stageId: this.state.stageId,
          },
        });
      },
    );
  };
  componentWillUnmount() {
    this.props.dispatch({
      type: "revisedRecord/clearSearch",
    });
    this.props.dispatch({
      type: "revisedRecord/changeSearch",
      payload: {
        typeValue: 0,
      },
    });
  }
  changeType = (value) => {
    this.props
      .dispatch({
        type: "revisedRecord/changeSearch",
        payload: {
          typeValue: value,
        },
      })
      .then(() => {
        this.setState(
          {
            scrollTop: 0,
            pageNo: 1,
          },
          () => {
            this.getPage();
          },
        );
      });
  };

  changeStatus = (value) => {
    this.props
      .dispatch({
        type: "revisedRecord/changeStatus",
        payload: {
          status: value,
        },
      })
      .then(() => {
        this.setState(
          {
            scrollTop: 0,
            pageNo: 1,
          },
          () => {
            this.getPage();
          },
        );
      });
  };

  changeCourse = (value) => {
    this.setState(
      {
        courseId: value,
        scrollTop: 0,
        pageNo: 1,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };

  //切换分页
  changePageSize = (page, size) => {
    this.setState(
      {
        pageNo: page,
        pageSize: size,
      },
      () => {
        this.getPage();
      },
    );
  };

  //调整页数
  switchPageSize = (current, size) => {
    this.setState(
      {
        pageNo: 1,
        pageSize: size,
      },
      () => {
        this.getPage();
      },
    );
  };

  //返回首页
  back = () => {
    this.props.dispatch({
      type: "revisedRecord/clearList",
      payload: {},
    });
    // this.props.dispatch(routerRedux.push('/examAnalysis'));
    window.close(`${window.location.origin}/exam#/examAnalysis`);
  };

  //订正数据modal
  openRevisedDataModal = (examId, visible) => {
    this.setState({
      examId: examId,
      revisedModal: visible,
    });
  };

  reloadSource = () => {
    this.openRevisedDataModal(undefined, false);
    this.getPage();
  };

  linkAboutToArrive = () => {
    window.open(`${window.origin}/exam#/aboutToArrive`);
  };

  sourceTypeChange = (value) => {
    this.setState(
      {
        sourceType: value,
        pageNo: 1,
      },
      () => {
        if (document.querySelector("#revisedMapList")) {
          document.querySelector("#revisedMapList").scrollTop = 0;
        }
        this.getPage();
      },
    );
  };
  render() {
    const { examOptions, correctionProcessData, currentUser, subjectList } =
      this.props;

    const { defaultSemester, tabValue } = this.state;
    let reviewAllScoreCorrectionPower =
      currentUser && currentUser.reviewAllScoreCorrectionPower ? true : false; //是否有全部订正
    return (
      <div className={styles.reviseBox}>
        <div className={styles.header}>
          <div className={styles.headerLeft} onClick={this.back}>
            <i className={[styles.iconfont, styles.back].join(" ")}>&#xe6ff;</i>
            <span className={styles.headerTitle}>
              {trans("global.revise", "订正管理")}
            </span>
          </div>
          <div className={styles.tabList}>
            <span
              className={[
                styles.tabDiv,
                tabValue == 1 ? styles.SelectDiv : "",
              ].join(" ")}
              onClick={this.changeTab.bind(this, 1)}
            >
              {trans("global.reviseByMe", "我创建的")}
            </span>
            <span
              className={[
                styles.tabDiv,
                tabValue == 2 ? styles.SelectDiv : "",
              ].join(" ")}
              onClick={this.changeTab.bind(this, 2)}
            >
              {trans("global.waitHandle", "待我处理")}
              {typeof this.state.waitHandleTotal === "number" &&
              this.state.waitHandleTotal ? (
                <span className={styles.tabBadge}>
                  {this.state.waitHandleTotal}
                </span>
              ) : null}
            </span>
            <span
              className={[
                styles.tabDiv,
                tabValue == 3 ? styles.SelectDiv : "",
              ].join(" ")}
              onClick={this.changeTab.bind(this, 3)}
            >
              {trans("global.handled", "我已处理")}
            </span>
            {reviewAllScoreCorrectionPower && (
              <span
                className={[
                  styles.tabDiv,
                  tabValue == 4 ? styles.SelectDiv : "",
                ].join(" ")}
                onClick={this.changeTab.bind(this, 4)}
              >
                {trans("global.allRevised", "全部订正")}
                {typeof this.state.allRevisedTotal === "number" &&
                this.state.allRevisedTotal ? (
                  <span className={styles.tabBadge}>
                    {this.state.allRevisedTotal}
                  </span>
                ) : null}
              </span>
            )}
            {reviewAllScoreCorrectionPower || this.state.corrective ? (
              <span
                className={[
                  styles.tabDiv,
                  tabValue == 5 ? styles.SelectDiv : "",
                ].join(" ")}
                onClick={this.changeTab.bind(this, 5)}
              >
                {trans("global.ruleSettings", "规则设置")}
              </span>
            ) : null}
          </div>
        </div>
        {tabValue == 5 ? (
          <RuleSettings dispatch={this.props.dispatch} />
        ) : (
          <div className={styles.testContent}>
            <div className={styles.revisedListBox}>
              <div className={styles.searchBar}>
                <span
                  className={[styles.inline, styles.semesterSelect].join(" ")}
                >
                  <Select
                    onChange={this.changeStage}
                    value={this.state.stageId}
                  >
                    <Option value={0} key={0}>
                      {trans("global.allSemester", "全部学期")}
                    </Option>
                    {examOptions && examOptions.length > 0
                      ? examOptions.map((item) => (
                          <Option value={item.semesterId} key={item.semesterId}>
                            <span title={item.semesterName}>
                              {item.semesterName}
                            </span>
                          </Option>
                        ))
                      : null}
                  </Select>
                </span>
                <span
                  className={[styles.inline, styles.semesterSelect].join(" ")}
                >
                  <Select
                    onChange={this.sourceTypeChange}
                    value={this.state.sourceType}
                  >
                    <Option value={null}>
                      {trans("global.allSources", "全部来源")}
                    </Option>
                    <Option value={0}>
                      {trans("global.fromQuiz", "来自测验")}
                    </Option>
                    <Option value={1}>
                      {trans("global.fromAssessment", "来自评价")}
                    </Option>
                  </Select>
                </span>
                <span className={styles.inline}>
                  <Select
                    onChange={this.changeGrade}
                    value={this.state.gradeId}
                  >
                    <Option value={0} key={0}>
                      {trans("global.allGrade", "全部年级")}
                    </Option>
                    {defaultSemester.gradeList &&
                    defaultSemester.gradeList.length > 0
                      ? defaultSemester.gradeList.map((item) => (
                          <Option value={item.gradeId} key={item.gradeId}>
                            <span title={item.gradeName}>{item.gradeName}</span>
                          </Option>
                        ))
                      : null}
                  </Select>
                </span>
                <span className={styles.inline}>
                  <Select
                    value={this.state.courseId}
                    style={{ width: 120 }}
                    onChange={this.changeCourse}
                  >
                    <Option value={0} key={0}>
                      <span title={trans("global.allSubject", "全部学科")}>
                        {trans("global.allSubject", "全部学科")}
                      </span>
                    </Option>
                    {subjectList &&
                      subjectList.length &&
                      subjectList.map((item) => (
                        <Option value={item.id} key={item.id}>
                          <span>
                            {locale() === "en" ? item.enName : item.name}
                          </span>
                        </Option>
                      ))}
                  </Select>
                </span>
                <span className={styles.inline}>
                  <Select
                    value={this.props.typeValue}
                    style={{ width: 150 }}
                    onChange={this.changeType}
                  >
                    <Option value={0}>
                      {trans("global.allType", "全部类型")}
                    </Option>
                    {defaultSemester.examType &&
                      defaultSemester.examType.length &&
                      defaultSemester.examType.map((item) => (
                        <Option
                          value={item.examTypeCode}
                          key={item.examTypeCode}
                        >
                          <span title={item.examTypeName}>
                            {item.examTypeName}
                          </span>
                        </Option>
                      ))}
                  </Select>
                </span>
                <span className={styles.inline}>
                  <Select
                    value={this.props.status}
                    style={{ width: 150 }}
                    onChange={this.changeStatus}
                  >
                    <Option value={0}>
                      {trans("global.allStatus", "全部状态")}
                    </Option>
                    {defaultSemester.processStatus &&
                      defaultSemester.processStatus.length &&
                      defaultSemester.processStatus.map((item) => (
                        <Option
                          value={item.processStatusType}
                          key={item.processStatusType}
                        >
                          <span title={item.processStatusName}>
                            {item.processStatusName}
                          </span>
                        </Option>
                      ))}
                  </Select>
                </span>
                <span
                  className={styles.inline}
                  style={{ flexGrow: 1, maxWidth: "200px" }}
                >
                  <Search
                    placeholder={trans("revise.searchTestPapers", "搜索试卷")}
                    allowClear
                    value={this.state.examName}
                    onChange={this.changeSearch}
                    onSearch={this.onSearch}
                    style={{ width: "100%" }}
                  />
                </span>
                {tabValue == 1 ? (
                  <span
                    className={styles.addCorrection}
                    onClick={() => this.openRevisedDataModal(undefined, true)}
                  >
                    <i className={styles.iconfont}>&#xe7d5;</i>
                    {trans("global.addRevise", "新增订正")}
                  </span>
                ) : null}
              </div>

              {tabValue == 2 && this.state.aboutToArriveNum ? (
                <div className={styles.remark}>
                  {trans("revisedHome.aboutToArrivePrefix", "还有")}{" "}
                  <span style={{ color: "rgb(4, 69, 252)", cursor: "pointer" }}>
                    {this.state.aboutToArriveNum}
                    {trans("revisedHome.aboutToArriveCountUnit", "条")}
                  </span>
                  {trans(
                    "revisedHome.aboutToArriveSuffix",
                    "订正申请可能到达，需要你审批，",
                  )}
                  <span
                    style={{ color: "rgb(4, 69, 252)", cursor: "pointer" }}
                    onClick={() => {
                      this.linkAboutToArrive();
                    }}
                  >
                    {trans("revisedHome.aboutToArriveLink", "点击查看")}
                  </span>
                </div>
              ) : null}
              <div
                className={styles.revisedMapListWrap}
                id="listBox"
                style={{
                  height:
                    tabValue == 2 && this.state.aboutToArriveNum
                      ? "calc(100% - 121px)"
                      : "calc(100% - 70px)",
                }}
              >
                <Skeleton active loading={this.state.loading}>
                  {correctionProcessData &&
                  correctionProcessData.totalNum &&
                  correctionProcessData.totalNum > 0 ? (
                    <div className={styles.revisedMapList} id="revisedMapList">
                      {correctionProcessData.correctionList &&
                        correctionProcessData.correctionList.map(
                          (item, index) => (
                            <RevisedList
                              info={item}
                              key={index}
                              hasBorder={
                                index ===
                                correctionProcessData.correctionList.length - 1
                                  ? false
                                  : true
                              }
                            />
                          ),
                        )}
                    </div>
                  ) : (
                    <div className={styles.emptyContent}>
                      <img src={noDataImg} alt="" />
                      <div>{trans("global.noData", "当前查询暂无数据")}</div>
                    </div>
                  )}
                  {correctionProcessData &&
                  correctionProcessData.totalNum &&
                  correctionProcessData.totalNum > 0 ? (
                    <div className={styles.showPage}>
                      <Pagination
                        total={correctionProcessData.totalNum || 0}
                        showSizeChanger
                        onChange={this.changePageSize}
                        onShowSizeChange={this.switchPageSize}
                        current={this.state.pageNo}
                        pageSize={this.state.pageSize}
                        hideOnSinglePage={false}
                      />
                    </div>
                  ) : null}
                </Skeleton>
              </div>
            </div>
          </div>
        )}

        {this.state.revisedModal && (
          <RevisedModal
            testId={null}
            stuId={this.stuId}
            courseId={this.courseId}
            semesterId={this.semesterId}
            source={this.source}
            evaluationId={this.evaluationId}
            type={this.type || 1}
            openRevisedDataModal={this.openRevisedDataModal}
            dispatch={this.props.dispatch}
            reloadSource={this.reloadSource}
          />
        )}
      </div>
    );
  }
}

export default connect(({ global, revisedRecord }) => ({
  typeValue: revisedRecord.typeValue,
  status: revisedRecord.status,
  gradeList: revisedRecord.gradeList,
  subjectList: revisedRecord.subjectList,
  examOptions: revisedRecord.examOptions,
  correctionProcessData: revisedRecord.correctionProcessData,
  currentUser: global.currentUser,
}))(RevisedRecord);

//订正列表
import React, { PureComponent } from "react";
import { Icon, Input, Pagination, Select, Skeleton } from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";

import noDataImg from "../../assets/noData.png";
import RevisedList from "../../components/RevisedList/index";
import { locale, trans } from "../../utils/i18n";
import RevisedModal from "../Revised/index";

import styles from "./index.module.less";

const { Option } = Select;
const { Search } = Input;

class RevisedRecord extends PureComponent {
  constructor(properties) {
    super(properties);

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
      tabValue: 1,
      loading: false,
      revisedModal: false, //订正数据modal
    };
  }
  componentDidMount() {
    this.getCurrentUser();
    const {
      match: { params },
    } = this.props;
    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState(
      {
        IconFont: IconFonts,
        tabValue: params && params.tab ? params.tab : 1,
      },
      () => {
        this.props
          .dispatch({
            type: "revisedRecord/getOptions",
            payload: {
              type: 2,
            },
          })
          .then(() => {
            const { examOptions } = this.props;
            this.setState(
              {
                defaultSemester:
                  examOptions && examOptions.length > 0 ? examOptions[0] : {},
                stageId:
                  examOptions && examOptions.length > 0
                    ? examOptions[0].semesterId
                    : 0,
                // gradeId: examOptions && examOptions.length && examOptions[0].gradeList && examOptions[0].gradeList.length ? examOptions[0].gradeList[0].gradeId : 0,
              },
              () => {
                this.getPage();
              },
            );
          });
      },
    );
  }

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
    this.setState(
      {
        tabValue: tab,
        pageNo: 1,
      },
      () => {
        this.getPage();
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
    this.props.dispatch(routerRedux.push("/examAnalysis"));
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

  render() {
    const { examOptions, correctionProcessData, currentUser, subjectList } =
      this.props;

    console.log(`this.props`, this.props);
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
              </span>
            )}
          </div>
        </div>
        <div className={styles.testContent}>
          <div className={styles.revisedListBox}>
            <div className={styles.searchBar}>
              <span
                className={[styles.inline, styles.semesterSelect].join(" ")}
              >
                <Select onChange={this.changeStage} value={this.state.stageId}>
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
              <span className={styles.inline}>
                <Select onChange={this.changeGrade} value={this.state.gradeId}>
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
                      <Option value={item.examTypeCode} key={item.examTypeCode}>
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
              <span className={styles.inline}>
                <Search
                  placeholder={trans("revise.searchTestPapers", "搜索试卷")}
                  allowClear
                  value={this.state.examName}
                  onChange={this.changeSearch}
                  onSearch={this.onSearch}
                  style={{ width: 200 }}
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

            <div className={styles.revisedMapListWrap} id="listBox">
              <Skeleton active loading={this.state.loading}>
                {correctionProcessData &&
                correctionProcessData.totalNum &&
                correctionProcessData.totalNum > 0 ? (
                  <div className={styles.revisedMapList}>
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
        {this.state.revisedModal && (
          <RevisedModal
            testId={null}
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

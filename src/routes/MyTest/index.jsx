//新闻
import React, { PureComponent } from "react";
import { Button, Icon, Modal, Popover, Select } from "antd";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";

import StudyActivity from "../../components/PublishToStudents/StudyActivity/index";
import { trans } from "../../utils/i18n";

import styles from "./index.module.less";
const { Option } = Select;
let sortList = {
  1: "STUDENT_NO",
  2: "STUDENT_NAME",
  3: "STUDENT_E_NAME",
  4: "SCORE",
  5: "SCORE",
};
class Home extends PureComponent {
  constructor(properties) {
    super(properties);

    this.state = {
      scrollTop: 0,
      stageId: 0,
      courseId: 0,
      gradeId: 0,
      status: 2,
      IconFont: null,
      viewData: {},
      testName: "",
      publishStatus: false,
      exampleId: null,
    };
    this.page = 1;
    this.pageSize = 10;
    this.getCardStatus = true;
  }
  componentDidMount() {
    this.props.dispatch({
      type: "global/getStage",
    });
    this.getPage();
    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState({
      IconFont: IconFonts,
    });
  }
  getPage = () => {
    this.props
      .dispatch({
        type: "home/getTest",
        payload: {
          pageNo: this.page,
          isEdit: this.state.status,
          limit: this.pageSize,
          paperType: this.props.typeValue === 0 ? "" : this.props.typeValue,
          subjectId: this.state.courseId === 0 ? "" : this.state.courseId,
          yearPeriodId: this.state.stageId === 0 ? "" : this.state.stageId,
          gradeId: this.state.gradeId === 0 ? "" : this.state.gradeId,
        },
      })
      .then(() => {
        this.getCardStatus = true;
        this.page += 1;
      });
  };

  scrollChange = () => {
    const overflowDom = document.querySelector("#listBox");
    const cardDomList = document.querySelectorAll(".listItem");
    const mastTop = cardDomList.at(-1).offsetTop;
    const scrollTop = overflowDom.scrollTop;
    const innerHeight = window.innerHeight;
    this.setState({
      scrollTop: scrollTop,
    });
    // this.props.saveTop(scrollTop)
    // this.props.dispatch({
    //   type: 'task/Conditions',
    //   payload: {
    //     value: {},
    //     height: scrollTop,
    //   },
    // })
    if (scrollTop + innerHeight > mastTop && this.getCardStatus) {
      this.getCardStatus = false;
      if (scrollTop > this.state.scrollTop) {
        console.log(this.getCardStatus, "xixi");
        // this.props.getExamineList();
        this.getPage();
      }
    }
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
          type: "global/getSubject",
          payload: {
            gradeId: this.state.gradeId,
          },
        });
        this.page = 1;
        this.getPage();
      },
    );
  };
  changeStage = (value) => {
    this.setState(
      {
        stageId: value,
        gradeId: 0,
        courseId: 0,
        scrollTop: 0,
      },
      () => {
        this.props.dispatch({
          type: "global/getGrade",
          payload: {
            stageId: this.state.stageId,
          },
        });
        this.page = 1;
        this.getPage();
      },
    );
  };
  changeScoreVisible = (index) => {
    let state = Object.assign({}, this.state);
    console.log(state);
    state[`itemViesble${index}`] = !state[`itemViesble${index}`];
    this.setState({
      ...state,
    });
  };
  componentWillUnmount() {
    this.props.dispatch({
      type: "global/clearSearch",
    });
  }
  changeType = (value) => {
    console.log(value);
    this.props
      .dispatch({
        type: "home/changeSearch",
        payload: {
          typeValue: value,
        },
      })
      .then(() => {
        this.page = 1;
        this.setState({
          scrollTop: 0,
        });
        this.getPage();
      });
  };
  pushToStu = (item) => {
    // window.open(`${window.location.origin}/#/course`)
    console.log(item, "item---");
    this.setState({
      viewData: { subjectId: (item && item.subjectId) || null, item: item },
      testName: item.title,
      exampleId: item.id,
      publishStatus: true,
    });
  };
  changeCourse = (value) => {
    this.setState(
      {
        courseId: value,
        scrollTop: 0,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };
  deleteTest = (id) => {
    this.changeScoreVisible(id);
    this.props.dispatch({
      type: "home/deteleTest",
      payload: {
        paperId: id,
      },
    });
  };
  changeTestStatus = (value) => {
    this.setState(
      {
        status: value,
      },
      () => {
        this.page = 1;
        this.setState({
          scrollTop: 0,
        });
        this.getPage();
      },
    );
  };
  changeStatus = (value) => {
    console.log(value);
    this.props
      .dispatch({
        type: "home/changeSearch",
        payload: {
          statusValue: value,
        },
      })
      .then(() => {
        this.page = 1;
        this.setState({
          scrollTop: 0,
        });
        this.getPage();
      });
  };

  publishCancel = () => {
    this.setState({
      publishStatus: false,
    });
  };

  returnMyTest = () => {
    this.setState(
      {
        publishStatus: false,
      },
      () => {
        window.location.reload();
      },
    );
  };

  view = () => {
    const {
      viewData: { item },
    } = this.state;
    console.log(item, "999");
    this.props.dispatch(
      routerRedux.push(`/testAnalysis/${item.id}/1/${item.id}/${item.isEdit}`),
    );
  };

  render() {
    const navList = [
      { name: trans("global.mySource", "我的资源"), key: 0, path: "/myTest" },
      {
        name: trans("global.examAnalysis", "考试分析"),
        key: 1,
        path: "/examAnalysis",
      },
    ];
    const menu = [
      {
        name: trans("global.inputStem", "录入题目"),
        key: 0,
        path: "/inputQuestion",
      },
      {
        name: trans("global.myQuestion", "我的题库"),
        key: 1,
        path: "/myQuestion",
      },
      {
        name: trans("global.myTest", "我的测验"),
        key: 2,
        path: "/myTest",
        selected: true,
      },
    ];

    const { testList, subjectList, stageList, gradeList } = this.props;
    const { IconFont, viewData, exampleId, testName } = this.state;
    return (
      <div className={styles.testContent}>
        <div className={styles.testListBox}>
          <div className={styles.searchBar}>
            <span className={styles.inline}>
              <span className={styles.searchTitle}>
                {trans("global.stage", "学段")}
              </span>
              <Select onChange={this.changeStage} value={this.state.stageId}>
                <Option value={0} key={0}>
                  {trans("global.allStage", "全部学段")}
                </Option>
                {stageList && stageList.length > 0
                  ? stageList.map((item) => (
                      <Option value={item.id} key={item.id}>
                        <span title={item.name}>{item.name}</span>
                      </Option>
                    ))
                  : null}
              </Select>
            </span>
            <span className={styles.inline}>
              <span className={styles.searchTitle}>
                {trans("global.grade", "年级")}
              </span>
              <Select onChange={this.changeGrade} value={this.state.gradeId}>
                <Option value={0} key={0}>
                  {trans("global.allGrade", "全部年级")}
                </Option>
                {gradeList && gradeList.length > 0
                  ? gradeList.map((item) => (
                      <Option value={item.gradeId} key={item.gradeId}>
                        <span title={item.name}>{item.name}</span>
                      </Option>
                    ))
                  : null}
              </Select>
            </span>
            <span className={styles.inline}>
              <span className={styles.searchTitle}>
                {trans("global.subject", "学科")}
              </span>
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
                      <span title={item.name}>{item.name}</span>
                    </Option>
                  ))}
              </Select>
            </span>
            <span className={styles.inline}>
              <span className={styles.searchTitle}>
                {trans("global.type", "类型")}
              </span>
              <Select
                value={this.props.typeValue}
                style={{ width: 120 }}
                onChange={this.changeType}
              >
                <Option value={0}>{trans("global.allType", "全部类型")}</Option>
                <Option value={1}>
                  {trans("global.classTest", "课堂小测")}
                </Option>
              </Select>
            </span>
            <span className={styles.inline}>
              <span className={styles.searchTitle}>
                {trans("global.status", "状态")}
              </span>
              <Select
                value={this.state.status}
                style={{ width: 120 }}
                onChange={this.changeTestStatus}
              >
                <Option value={2}>
                  {trans("global.allStatus", "全部状态")}
                </Option>
                <Option value={0}>{trans("global.pushed", "已推送")}</Option>
                <Option value={1}>{trans("global.unPush", "未推送")}</Option>
              </Select>
            </span>
          </div>
          <div
            className={styles.testMapList}
            id="listBox"
            onScroll={this.scrollChange}
          >
            {testList && testList.length > 0 ? (
              testList.map((item, index) => (
                <div
                  className={[styles.mapBox, "listItem"].join(" ")}
                  key={index}
                >
                  <span
                    className={[styles.inline, styles.messageBox].join(" ")}
                  >
                    <div className={styles.header}>{item.title}</div>
                    <div className={styles.content}>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe908;</i>
                        {item.paperTypeName}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe634;</i>
                        {trans("global.manfen", "满分 ")}
                        {item.totalScore}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe798;</i>
                        {item.gradeName}-{item.subjectName}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe61f;</i>
                        {item.year}
                      </span>
                    </div>
                    <div className={styles.bottom}>
                      <span
                        className={[styles.inline, styles.totalScore].join(" ")}
                      >
                        {trans("global.gong", "共")}
                        <span className={styles.point}>
                          {item.questionTotalNum}
                        </span>
                        {trans("global.question", "题")}
                      </span>
                      {item.questionTypeNumberModels &&
                      item.questionTypeNumberModels.length > 0
                        ? item.questionTypeNumberModels.map((index_, newI) => (
                            <span
                              className={[styles.inline, styles.testType].join(
                                " ",
                              )}
                              key={newI}
                            >
                              <span className={styles.point}>
                                {index_.questionNum}
                              </span>
                              {index_.typeName}
                            </span>
                          ))
                        : null}
                    </div>
                  </span>
                  {
                    <span className={[styles.inline, styles.pushBox].join(" ")}>
                      {item.isEdit ? (
                        <span>{trans("global.unPush", "未推送")}</span>
                      ) : (
                        <span>{trans("global.pushed", "已推送")}</span>
                      )}
                    </span>
                  }
                  {item.isEdit ? null : (
                    <span
                      className={[styles.inline, styles.chartBox].join(" ")}
                    >
                      <div className={styles.chartContent}>
                        <span
                          className={styles.completeContent}
                          style={{
                            width: `${
                              (item.completedNum / item.pushNum) * 100
                            }%`,
                          }}
                        ></span>
                      </div>
                      <div className={styles.chartMessage}>
                        <span>
                          <span className={styles.num}>
                            {item.completedNum}
                          </span>
                          {trans("global.completed", "已完成")}
                        </span>
                        <span>
                          <span className={styles.num}>
                            {item.notCompletedNum}
                          </span>
                          {trans("global.notComplete", "未完成")}
                        </span>
                        <span>
                          <span className={styles.num}>{item.pushNum}</span>
                          {trans("global.pushed", "已推送")}
                        </span>
                      </div>
                    </span>
                  )}
                  <span
                    className={[
                      styles.inline,
                      styles.optionBox,
                      item.isEdit ? styles.editOption : null,
                    ].join(" ")}
                    id={`option${item.id}`}
                  >
                    {item.isEdit ? (
                      <div>
                        <div>
                          <Link
                            to={`/testAnalysis/${item.id}/1/${item.id}/${item.isEdit}`}
                          >
                            <span
                              className={[styles.inline, styles.canOption].join(
                                " ",
                              )}
                            >
                              {trans("global.viewTest", "预览测验")}
                            </span>
                          </Link>
                          <Link to={`/detail/false/true/${item.id}`}>
                            <span
                              className={[styles.inline, styles.canOption].join(
                                " ",
                              )}
                            >
                              {trans("global.edit", "编辑")}
                            </span>
                          </Link>
                        </div>
                        <div>
                          <span
                            className={[styles.inline, styles.canOption].join(
                              " ",
                            )}
                            onClick={() => this.pushToStu(item)}
                          >
                            {trans("global.pushToStu", "推送给学生")}
                          </span>
                          <Popover
                            content={
                              <div>
                                <div className={styles.messageContent}>
                                  <span>
                                    {trans(
                                      "global.messageContent",
                                      "你确定要删除这个测验吗？删除后，该测验所有内容将不可恢复。",
                                    )}
                                  </span>
                                </div>
                                <div className={styles.modalBottom}>
                                  <Button
                                    shape="round"
                                    onClick={this.changeScoreVisible.bind(
                                      this,
                                      item.id,
                                    )}
                                  >
                                    {trans("global.cancle", "取消")}
                                  </Button>
                                  <Button
                                    type="primary"
                                    shape="round"
                                    onClick={this.deleteTest.bind(
                                      this,
                                      item.id,
                                    )}
                                  >
                                    {trans("global.sure", "确定")}
                                  </Button>
                                </div>
                              </div>
                            }
                            trigger="click"
                            visible={this.state[`itemViesble${item.id}`]}
                            placement={"bottom"}
                            getPopupContainer={() =>
                              document.getElementById(`option${item.id}`)
                            }
                          >
                            <span
                              className={[styles.inline, styles.canOption].join(
                                " ",
                              )}
                              onClick={this.changeScoreVisible.bind(
                                this,
                                item.id,
                              )}
                            >
                              {trans("global.delete", "删除")}
                            </span>
                          </Popover>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div>
                          <Link
                            to={`/testAnalysis/${item.id}/1/${item.id}/${item.isEdit}`}
                          >
                            <span
                              className={[styles.inline, styles.canOption].join(
                                " ",
                              )}
                            >
                              {trans("global.viewTest", "预览测验")}
                            </span>
                          </Link>
                          <span className={[styles.inline].join(" ")}>
                            {trans("global.edit", "编辑")}
                          </span>
                        </div>
                        <div>
                          <span
                            className={[styles.inline, styles.canOption].join(
                              " ",
                            )}
                            onClick={() => this.pushToStu(item)}
                          >
                            {trans("global.goPushToStu", "继续推送")}
                          </span>
                          <span
                            className={[styles.inline].join(" ")}
                            onClick={this.changeScoreVisible.bind(
                              this,
                              item.id,
                            )}
                          >
                            {trans("global.delete", "删除")}
                          </span>
                        </div>
                        <div>
                          <Link
                            to={`/testAnalysis/${item.id}/2/${item.id}/${item.isEdit}`}
                          >
                            <span
                              className={[styles.inline, styles.canOption].join(
                                " ",
                              )}
                            >
                              {trans("global.statistics", "数据统计")}
                            </span>
                          </Link>
                          <span
                            className={[styles.inline, styles.canOption].join(
                              " ",
                            )}
                          ></span>
                        </div>
                      </div>
                    )}
                  </span>
                </div>
              ))
            ) : IconFont ? (
              <div className={styles.noTest}>
                <div className={styles.iconBox}>
                  <IconFont
                    type="icon-chengguoweikong"
                    className={styles.noSourceIcon}
                  />{" "}
                </div>
                {trans("global.noTest", "暂时没有试卷")}
              </div>
            ) : null}
          </div>
        </div>
        {viewData && viewData.subjectId && exampleId ? (
          <Modal
            title={""}
            footer={null}
            getContainer={false}
            // centered={true}
            visible={this.state.publishStatus}
            closable={false}
            maskClosable={false}
            destroyOnClose={true}
            // onCancel={this.publishCancel}
            width="480px"
            className={styles.studyModal}
          >
            <StudyActivity
              viewData={viewData}
              testName={testName}
              exampleId={exampleId}
              onCancel={this.publishCancel}
              returnMyTest={this.returnMyTest}
              view={this.view}
            />
          </Modal>
        ) : null}
      </div>
    );
  }
}

export default connect(({ home, global }) => ({
  testList: home.testList,
  typeValue: home.typeValue,
  courseValue: home.courseValue,
  statusValue: home.statusValue,
  stageList: global.stageList,
  gradeList: global.gradeList,
  subjectList: global.subjectList,
}))(Home);
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};

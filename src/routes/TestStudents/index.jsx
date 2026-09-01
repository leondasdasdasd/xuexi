import React, { Fragment, PureComponent } from "react";
import { Icon, Input, Modal, Select } from "antd";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";

import noTask from "../../assets/noTask.png";
import ExamSetting from "../../components/ExamSetting/index";
import StudyActivity from "../../components/PublishToStudents/StudyActivity/index";
import { trans } from "../../utils/i18n";
import RevisedModal from "../Revised/index";

import styles from "./index.module.less";

const { Option } = Select;
const { Search } = Input;
let sortList = {
  1: "STUDENT_NO",
  2: "STUDENT_NAME",
  3: "STUDENT_E_NAME",
  4: "SCORE",
  5: "SCORE",
};
class TestStudents extends PureComponent {
  constructor(properties) {
    super(properties);
    const { tab } = properties.match.params;
    this.state = {
      cur: 1,
      scrollTop: 0,
      stageId: 0,
      courseId: 0,
      status: 2,
      IconFont: null,
      viewData: {},
      testName: "",
      publishStatus: false,
      exampleId: null,
      examName: "",
      pageNo: 1,
      pageSize: 1000,
      fileList: [],
      examVisble: false,
      defaultSemester: {},
      revisedModal: false, //订正数据modal
      examId: undefined, //试卷id
      tabId: tab ? tab : 1,
    };
    this.page = 1;
    this.pageSize = 10;
    this.getCardStatus = true;
  }
  componentDidMount() {
    this.props
      .dispatch({
        type: "home/getOptions",
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
            defaultSemester:
              examOptions && examOptions.length > 0 ? examOptions[ind] : {},
            stageId:
              examOptions && examOptions.length > 0
                ? examOptions[ind].semesterId
                : 0,
          },
          () => {
            this.getPage();
          },
        );
      });
    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState({
      IconFont: IconFonts,
    });
  }
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
  getPage = () => {
    this.props
      .dispatch({
        type: "home/postStudentExamList",
        payload: {
          pageNo: this.state.pageNo,
          limit: this.state.pageSize,
          examName: this.state.examName,
          examTypeCode: this.props.typeValue === 0 ? "" : this.props.typeValue,
          subjectId: this.state.courseId === 0 ? "" : this.state.courseId,
          semesterId: this.state.stageId === 0 ? "" : this.state.stageId,
          // gradeId: this.state.gradeId === 0 ? "" : this.state.gradeId,
        },
      })
      .then(() => {
        this.getCardStatus = true;
        this.page += 1;
      });
  };
  onSearch = (value) => {
    this.getPage();
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
  scrollChange = () => {
    const overflowDom = document.querySelector("#listBox");
    const cardDomList = document.querySelectorAll(".listItem");
    const mastTop = cardDomList.at(-1).offsetTop;
    const scrollTop = overflowDom.scrollTop;
    const innerHeight = window.innerHeight;
    this.setState({
      scrollTop: scrollTop,
    });
    if (scrollTop + innerHeight > mastTop && this.getCardStatus) {
      this.getCardStatus = false;
      if (scrollTop > this.state.scrollTop) {
        this.getPage();
      }
    }
  };
  changeGrade = (value) => {
    this.setState(
      {
        // gradeId: value,
        scrollTop: 0,
        courseId: 0,
      },
      () => {
        this.props.dispatch({
          type: "global/getSubject",
          payload: {
            // gradeId: this.state.gradeId,
          },
        });
        this.page = 1;
        this.getPage();
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
        courseId: 0,
        scrollTop: 0,
        defaultSemester: newSemester,
      },
      () => {
        this.props
          .dispatch({
            type: "home/changeSearch",
            payload: {
              typeValue: 0,
            },
          })
          .then(() => {
            this.page = 1;
            this.getPage();
          });
        this.props.dispatch({
          type: "global/getGrade",
          payload: {
            stageId: this.state.stageId,
          },
        });
      },
    );
  };
  changeScoreVisible = (index) => {
    let state = Object.assign({}, this.state);
    console.log(index, "bb");
    state[`itemViesble${index}`] = !state[`itemViesble${index}`];
    this.setState({
      ...state,
    });
  };
  componentWillUnmount() {
    this.props.dispatch({
      type: "global/clearSearch",
    });
    this.props.dispatch({
      type: "home/changeSearch",
      payload: {
        typeValue: 0,
      },
    });
  }
  changeType = (value) => {
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
  changeExamModal = () => {
    this.setState({
      examVisble: !this.state.examVisble,
    });
  };
  publishCancel = () => {
    this.setState({
      publishStatus: false,
    });
  };
  uploadOnChange = (info) => {
    console.log(info, "ii");
    let file = info.file;
    let { fileList } = this.state;
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      let newList = [];
      newList = file.response.content;
      this.setState({
        fileList: newList,
      });
      return;
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} ${file.response.message}`);
      window._czc &&
        window._czc.push([
          "_trackEvent",
          "上传附件",
          "添加附件",
          info.file.name,
        ]);
    }
  };
  cleanFile = () => {
    this.setState({
      fileList: [],
    });
  };
  beforeUpload = (size) => {};
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
  openView = (id, paperId) => {
    window.open(
      `${window.location.origin}/exam#/dataAnalysis/${id || null}/${
        paperId || null
      }/1`,
    );
  };
  view = () => {
    const {
      viewData: { item },
    } = this.state;
    this.props.dispatch(
      routerRedux.push(
        `/dataAnalysis/${item.examId || null}/${item.id || null}/1`,
      ),
    );
  };

  jumpTo = () => {
    window.open(
      `${window.location.origin}/exam#/revisedPage/1/false`,
      "_blank",
    ); //跳转到我创建的
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
    window.open(
      `${window.location.origin}/exam#/revisedPage/1/false`,
      "_blank",
    ); //跳转到我创建的
  };
  back = () => {
    window.close(`${window.location.origin}/#/examAnalysis`);
  };

  clickTab = (id) => {
    this.setState({
      tabId: id,
    });
  };

  render() {
    const {
      testList,
      subjectList,
      stageList,
      gradeList,
      examOptions,
      studentExamList,
      currentUser: { showRevisePaper },
    } = this.props;
    const { IconFont, viewData, exampleId, testName, defaultSemester, tabId } =
      this.state;
    const { showBack } = this.props.match.params;

    return (
      <div className={styles.examBox}>
        <div className={styles.testContent}>
          <div
            className={styles.testListBox}
            style={showBack ? { paddingTop: "20px" } : {}}
          >
            <div
              className={styles.headerTop}
              style={{ display: showBack ? "none" : "block" }}
            >
              <span className={styles.headerLeft} onClick={this.back}>
                <i className={[styles.iconfont, styles.back].join(" ")}>
                  &#xe6ff;
                </i>
                <span className={styles.headerTitle}>
                  {trans("global.goBack", "返回")}
                </span>
              </span>
            </div>
            {tabId == 1 ? (
              <>
                <div className={styles.searchBar} data-block="搜索">
                  <span
                    className={[styles.inline, styles.semesterSelect].join(" ")}
                    data-type="全部学期"
                  >
                    <Select
                      onChange={this.changeStage}
                      value={this.state.stageId}
                      // style={{ width: 290 }}
                    >
                      <Option value={0} key={0}>
                        {trans("global.allSemester", "全部学期")}
                      </Option>
                      {examOptions && examOptions.length > 0
                        ? examOptions.map((item) => (
                            <Option
                              value={item.semesterId}
                              key={item.semesterId}
                            >
                              <span title={item.semesterName}>
                                {item.semesterName}
                              </span>
                            </Option>
                          ))
                        : null}
                    </Select>
                  </span>
                  <span className={styles.inline} data-type="全部学科">
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
                      {defaultSemester.subjectList &&
                        defaultSemester.subjectList.length &&
                        defaultSemester.subjectList.map((item) => (
                          <Option value={item.subjectId} key={item.subjectId}>
                            <span title={item.subjectName}>
                              {item.subjectName}
                            </span>
                          </Option>
                        ))}
                    </Select>
                  </span>
                  <span className={styles.inline} data-type="全部类型">
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
                  <span className={styles.inline} data-type="搜索">
                    <Search
                      placeholder={trans(
                        "global.forKeyWordSearch",
                        "根据关键词搜索测验",
                      )}
                      allowClear
                      value={this.state.examName}
                      onChange={this.changeSearch}
                      onSearch={this.onSearch}
                      style={{ width: 220 }}
                    />
                  </span>
                </div>
                <div className={styles.testMapList} id="listBox">
                  {studentExamList?.studentExamList &&
                  studentExamList?.studentExamList.length ? (
                    studentExamList.studentExamList.map((item, index) => (
                      <div
                        className={[styles.mapBox, "listItem"].join(" ")}
                        key={index}
                      >
                        <Link
                          to={`/testStudents/${item.examId || null}/${
                            item.id || null
                          }/1`}
                          target="_blank"
                        >
                          <span
                            className={[styles.inline, styles.messageBox].join(
                              " ",
                            )}
                          >
                            <div>
                              <span
                                className={
                                  item.examType == 1
                                    ? styles.terminalColor
                                    : item.examType == 2
                                      ? styles.cnterimColor
                                      : item.examType == 3
                                        ? styles.classQuizColor
                                        : item.examType == 4
                                          ? styles.unitQuizColor
                                          : styles.normalTitle
                                }
                              >
                                {item.examTypeName}
                              </span>
                              <span className={styles.header}>
                                {item.examName}
                              </span>
                            </div>
                            <div
                              className={styles.content}
                              style={{ marginTop: "5px" }}
                            >
                              <span
                                className={[styles.inline, styles.time].join(
                                  " ",
                                )}
                              >
                                <i className={styles.iconfont}>&#xe61f;</i>
                                {item.examDate}
                              </span>
                              <span
                                className={[styles.inline, styles.time].join(
                                  " ",
                                )}
                              >
                                <i className={styles.iconfont}>&#xe708;</i>
                                {item.subjectName}
                              </span>
                              <span
                                className={[styles.inline, styles.time].join(
                                  " ",
                                )}
                              >
                                <i className={styles.iconfont}>&#xe745;</i>
                                {item.gradeName}
                              </span>
                              {/* <span
                            className={[styles.inline, styles.time].join(" ")}
                          >
                            <Icon type="user" />
                            {item.createUserName || ""}
                          </span> */}
                            </div>
                          </span>
                        </Link>
                        <Link
                          to={`/testStudents/${item.examId || null}/${
                            item.paperId || null
                          }/2`}
                          target="_blank"
                        >
                          <div
                            style={{ display: "inline-block" }}
                            className={styles.answerSheetBox}
                          >
                            <span
                              className={styles.answerSheet}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <i
                                className={styles.iconfont}
                                style={{ color: "#0445FC" }}
                              >
                                &#xe85d;
                              </i>
                              <span className={styles.butExplain}>
                                {trans("global.answerSheet", "答卷")}
                              </span>
                            </span>
                          </div>
                        </Link>
                        <div
                          style={{ display: "none" }}
                          className={styles.analysisBaogaoBOx}
                        >
                          <span
                            className={styles.answerSheet}
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <i
                              className={styles.iconfont}
                              style={{ color: "#0445FC" }}
                            >
                              &#xe85e;
                            </i>
                            <span className={styles.butExplain}>
                              {trans("global.analysisBaogao", "分析报告")}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))
                  ) : this.props.infoStatus ? (
                    IconFont ? (
                      <div className={styles.noTest}>
                        <div className={styles.iconBox}>
                          {/* <IconFont
                      type="icon-chengguoweikong"
                      className={styles.noSourceIcon}
                    />{" "} */}
                          <img className={styles.noTask} src={noTask}></img>
                        </div>
                        {/* {trans("global.noTest", "暂时没有试卷")} */}
                        {trans(
                          "testStudents.noRelatedTasks",
                          "目前还没有相关任务哦",
                        )}
                      </div>
                    ) : null
                  ) : null}
                </div>
              </>
            ) : tabId == 2 ? (
              <div>111</div>
            ) : (
              <div>222</div>
            )}

            <div
              className={styles.bottomTab}
              style={{ display: showBack ? "none" : "flex" }}
            >
              <span
                className={[
                  styles.tabSwitch,
                  tabId == 1 ? styles.tabBlue : "",
                ].join(" ")}
                onClick={() => this.clickTab(1)}
              >
                {trans("global.testSheet", "测验单")}
              </span>
              <span
                className={[
                  styles.tabSwitch,
                  tabId == 2 ? styles.tabBlue : "",
                ].join(" ")}
                onClick={() => this.clickTab(2)}
              >
                {trans("global.takeQuestions", "拍题拍卷")}
              </span>
              <span
                className={[
                  styles.tabSwitch,
                  tabId == 3 ? styles.tabBlue : "",
                ].join(" ")}
                onClick={() => this.clickTab(3)}
              >
                {trans("global.wrongQuestionBook", "错题本")}
              </span>
            </div>
            {/* <Pagination
              size="small"
              current={this.state.pageNo}
              total={examList?.totalNum || 0}
              onChange={this.changeNo}
              showSizeChanger
              showQuickJumper
              onShowSizeChange={this.onShowSizeChange}
            /> */}
          </div>
        </div>
        {this.state.examVisble ? (
          <ExamSetting
            examVisble={this.state.examVisble}
            history={this.props.history}
            changeExamModal={this.changeExamModal}
            dispatch={this.props.dispatch}
          />
        ) : null}
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
        {this.state.revisedModal && (
          <RevisedModal
            testId={this.state.examId}
            openRevisedDataModal={this.openRevisedDataModal}
            dispatch={this.props.dispatch}
            reloadSource={this.reloadSource}
            source="question"
          />
        )}
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
  examOptions: home.examOptions,
  studentExamList: home.studentExamList,
  currentUser: global.currentUser,
  infoStatus: home.infoStatus,
}))(TestStudents);
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};

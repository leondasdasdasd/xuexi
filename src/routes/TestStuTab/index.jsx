import React, { PureComponent } from "react";
import { Checkbox, Empty, Input, Switch, Tabs } from "antd";
import { connect } from "dva";
const { TextArea } = Input;
import { trans } from "../../utils/i18n";
const { TabPane } = Tabs;
import { Guide } from "bizcharts";
import { routerRedux } from "dva/router";
import pathToRegexp from "path-to-regexp";

import DetailView from "../../components/DetailView";
import PreviewImg from "../../components/PreviewImg";
import QuestionShow from "../../components/QuestionShow";

import styles from "./index.module.less";

const { Search } = Input;
const { Text } = Guide;
const sliceNumber = 0.01;

class TestStuTab extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp(
      "/testStudents/:testId/:paperId/:active/:hideTab?",
    ).exec(this.url);
    this.testId = JSON.parse(this.pathMatch[1]);
    this.paperId = this.pathMatch[2]
      ? Number.parseInt(this.pathMatch[2], 10)
      : null;
    this.active = Number.parseInt(this.pathMatch[3], 10);
    this.hideTab = this.pathMatch[4] ? JSON.parse(this.pathMatch[4]) : null;
    this.state = {
      viewData: {},
      active: this.active || 1,
      check: 1,
      isFull: false,
      checkQuestionId: null,
      checkQuestionId1: null,
      isChecked: false,
      isChecked1: false,
      imgVisible: false,
      url: "",
    };
    this.child = null;
  }
  componentDidUpdate() {
    const imgList = document.querySelectorAll("img");

    for (const element of imgList) {
      let source = element.src;

      if (source.includes("&style=")) {
        source = source.split("&style=")[0];
      }

      element.addEventListener("click", this.showImg.bind(this, source));
    }
    this.resetImg();
  }

  resetImg = () => {
    setTimeout(() => {
      const list = document.querySelectorAll(".img");
      for (const element of list) {
        if (element.naturalWidth) {
          element.width = element.naturalWidth / 2;
        }
      }
    }, 500);
  };

  showImg = (source) => {
    this.setState({
      imgVisible: true,
      url: source,
    });
  };

  componentDidMount() {
    this.props
      .dispatch({
        type: "global/getCurrentUser",
      })
      .then((res) => {
        const { currentUser } = this.props;
        this.props.dispatch({
          type: "home/getStudySituationByStudentId",
          payload: {
            examId: this.testId,
            studentUserId: currentUser.userId,
            isPreview: false,
          },
        });
      });

    this.props.dispatch({
      type: "home/getExamPaper",
      payload: {
        examId: this.testId,
      },
    });
    this.props.dispatch({
      type: "home/getExamPaperResultUrl",
      payload: {
        examId: this.testId,
      },
    });
  }
  getClass = () => {
    this.props.dispatch({
      type: "home/getgroupScore",
      payload: {
        examId: this.testId,
      },
    });
  };
  scrollView = (id) => {
    const ele = document.getElementById(`question${id}`);
    ele.scrollIntoView({ behavior: "smooth", block: "center" });
    this.setState({
      checkQuestionId: id,
    });
  };
  scrollView1 = (id) => {
    const ele = document.getElementById(`question${id}`);
    ele.scrollIntoView({ behavior: "smooth", block: "center" });
    this.setState({
      checkQuestionId1: id,
    });
  };
  onTestRef = (child) => {
    // console.log(child, "c");
    this.child = child;
  };
  view = (index) => {
    this.setState(
      {
        active: index,
        check: 1,
      },
      () => {
        if (index === 1) {
          // this.child && this.child.view(5);
          this.props.dispatch({
            type: "home/getExamPaper",
            payload: {
              examId: this.testId,
            },
          });
        } else if (index == 2) {
          this.props.dispatch({
            type: "home/getExamPaperResultUrl",
            payload: {
              examId: this.testId,
            },
          });
        }
      },
    );
    if (this.hash) {
      this.props.dispatch(
        routerRedux.push(
          `/testStudents/${this.testId}/${this.paperId}/${index}`,
        ),
      );
    } else {
      this.props.dispatch(
        routerRedux.push(
          `/testStudents/${this.testId}/${this.paperId}/${index}`,
        ),
      );
    }
  };
  back = () => {
    const that = this;
    this.props.dispatch({
      type: "home/clearView",
    });
    window.close();
  };

  checkQuestion = (id) => {
    this.setState({
      checkQuestionId: id,
    });
  };
  checkQuestion1 = (id) => {
    this.setState({
      checkQuestionId1: id,
    });
  };
  renderNumber = (id) => {
    const detaiList = this.props.examPaperStu.moduleList;
    let newList = [];
    let count = 0;
    if (detaiList && detaiList.length > 0) {
      detaiList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            newList.push(it);
          });
        }
      });
    }
    if (newList.length > 0) {
      newList.map((item, index) => {
        if (id === item.questionId) {
          count = index + 1;
        }
      });
    }
    return count;
  };

  renderNumber1 = (id) => {
    const detaiList =
      this.props.examPaperResultUrl.examPaperDetailResponse.moduleList;
    let newList = [];
    let count = 0;
    if (detaiList && detaiList.length > 0) {
      detaiList.map((item) => {
        if (item.questionList && item.questionList.length > 0) {
          item.questionList.map((it) => {
            newList.push(it);
          });
        }
      });
    }
    if (newList.length > 0) {
      newList.map((item, index) => {
        if (id === item.questionId) {
          count = index + 1;
        }
      });
    }
    return count;
  };

  changeCheck = (checked) => {
    this.setState({
      isChecked: checked,
    });
  };

  changeCheck1 = (checked) => {
    this.setState({
      isChecked1: checked,
    });
  };

  cancelImg = () => {
    this.setState({
      url: null,
      imgVisible: false,
    });
  };

  render() {
    const { viewData } = this.props;
    return (
      <div className={styles.analysis}>
        {this.state.imgVisible ? (
          <PreviewImg
            imgUrl={this.state.url}
            modalVisible={this.state.imgVisible}
            changeModalVisible={this.cancelImg}
          />
        ) : null}
        <div
          className={[
            styles.header,
            this.state.isFull ? styles.disNone : "",
          ].join(" ")}
        >
          <span className={styles.headerLeft} onClick={this.back}>
            <i className={[styles.iconfont, styles.back].join(" ")}>&#xe6ff;</i>
            <span className={styles.headerTitle}>
              {trans("global.goBack", "返回")}
            </span>
          </span>
          {this.hideTab ? null : (
            <div className={styles.tabBar}>
              <span
                onClick={this.view.bind(this, 1)}
                className={this.state.active === 1 ? styles.activeBar : null}
              >
                {trans("global.testPaper", "题目试卷")}
              </span>
              <span
                onClick={this.view.bind(this, 2)}
                className={this.state.active === 2 ? styles.activeBar : null}
              >
                {trans("global.myTestPaper1", "我的答卷")}
              </span>
              <span
                onClick={this.view.bind(this, 3)}
                className={this.state.active === 3 ? styles.activeBar : null}
              >
                {trans("global.wrongCollection", "错题集合")}
              </span>
            </div>
          )}
        </div>
        {viewData && this.aaa(viewData)}
      </div>
    );
  }
  aaa = (dataAnalysis) => {
    const {
      knowLedgeAnalysis,
      examPaperResultUrl,
      examPaperStu,
      studySituationByStudentIdList,
    } = this.props;
    const { checkQuestionId, checkQuestionId1 } = this.state;
    const { moduleModelList } = studySituationByStudentIdList;

    switch (this.state.active) {
      case 1: {
        return (
          <div>
            <div className={styles.analysisContent}>
              <div className={styles.contentLeft}>
                {examPaperStu && examPaperStu.moduleList && (
                  <div className={styles.testList}>
                    <div className={styles.testName}>
                      <div className={styles.testNameRight}>
                        <h2>{examPaperStu.title}</h2>
                      </div>
                      <div className={styles.testNameSwitch}>
                        <span className={styles.switchTitle}>
                          {trans("global.showAnswers", "显示答案")}
                        </span>
                        <Switch
                          checked={this.state.isChecked}
                          onChange={this.changeCheck}
                        />
                      </div>
                    </div>

                    <DetailView
                      detailList={examPaperStu.moduleList}
                      ifEdit={false}
                      ifTeacherView={true}
                      isChecked={this.state.isChecked}
                      checkQuestionId={checkQuestionId}
                      checkQuestion={this.checkQuestion}
                      dropQuestionChange={this.dropQuestionChange}
                    />
                  </div>
                )}
              </div>
              <div className={styles.contentRight}>
                <div className={styles.contentRightOption}>
                  <div className={styles.optionTitleBox}>
                    <div className={styles.optionTitleLeft}>
                      {trans("detail.questionList", "题目列表")}
                    </div>
                  </div>
                  {examPaperStu &&
                  examPaperStu.moduleList &&
                  examPaperStu.moduleList.length > 0
                    ? examPaperStu.moduleList.map((item, index) => (
                        <div className={styles.moveList} key={index}>
                          <div className={styles.moveListTitle}>
                            <div>
                              <span className={styles.contentVisible}>
                                {item.moduleName}
                              </span>
                              ({item.moduleScore || 0}
                              {trans("global.point", "分")})
                            </div>
                            {this.props.testStatus ? (
                              <div className={styles.modultScore}>
                                <i className={styles.iconfont}>&#xe634;</i>
                                <span className={styles.score}>
                                  {item.moduleScore}
                                </span>
                                {trans("global.point", "分")}
                              </div>
                            ) : null}
                          </div>
                          <div className={styles.moveListContent}>
                            {item.questionList && item.questionList.length > 0
                              ? item.questionList.map((it, ind) => (
                                  <div
                                    className={styles.optionBox}
                                    style={
                                      checkQuestionId &&
                                      checkQuestionId == it.questionId
                                        ? {
                                            border:
                                              "1px solid rgba(2,88,191,1)",
                                          }
                                        : it.studentAnswer &&
                                            it.studentAnswer != ""
                                          ? {
                                              border:
                                                "1px solid rgba(59,111,245,0.36)",
                                            }
                                          : null
                                    }
                                    onClick={this.scrollView.bind(
                                      this,
                                      it.questionId,
                                    )}
                                    key={ind}
                                  >
                                    {this.renderNumber(it.questionId)}
                                  </div>
                                ))
                              : null}
                          </div>
                        </div>
                      ))
                    : null}
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 2: {
        return (
          <div className={styles.myTestImg}>
            {
              examPaperResultUrl &&
              examPaperResultUrl.examPaperDetailResponse &&
              examPaperResultUrl.examPaperDetailResponse.moduleList ? (
                <div className={styles.analysisContent}>
                  <div className={styles.contentLeft}>
                    {examPaperResultUrl.examPaperDetailResponse &&
                      examPaperResultUrl.examPaperDetailResponse.moduleList && (
                        <div className={styles.testList}>
                          <div className={styles.testName}>
                            <div className={styles.testNameRight}>
                              <h2>
                                {
                                  examPaperResultUrl.examPaperDetailResponse
                                    .title
                                }
                              </h2>
                            </div>
                            <div className={styles.testNameSwitch}>
                              <span className={styles.switchTitle}>
                                {trans("global.showAnswers", "显示答案")}
                              </span>
                              <Switch
                                checked={this.state.isChecked1}
                                onChange={this.changeCheck1}
                              />
                            </div>
                          </div>

                          <DetailView
                            detailList={
                              examPaperResultUrl.examPaperDetailResponse
                                .moduleList
                            }
                            ifEdit={false}
                            ifTeacherView={true}
                            isChecked={this.state.isChecked1}
                            checkQuestionId={checkQuestionId1}
                            checkQuestion={this.checkQuestion1}
                            dropQuestionChange={this.dropQuestionChange}
                          />
                        </div>
                      )}
                  </div>
                  <div className={styles.contentRight}>
                    <div className={styles.contentRightOption}>
                      <div className={styles.optionTitleBox}>
                        <div className={styles.optionTitleLeft}>
                          {trans("detail.questionList", "题目列表")}
                        </div>
                      </div>
                      {examPaperResultUrl &&
                      examPaperResultUrl.examPaperDetailResponse &&
                      examPaperResultUrl.examPaperDetailResponse.moduleList &&
                      examPaperResultUrl.examPaperDetailResponse.moduleList
                        .length > 0
                        ? examPaperResultUrl.examPaperDetailResponse.moduleList.map(
                            (item, index) => (
                              <div className={styles.moveList} key={index}>
                                <div className={styles.moveListTitle}>
                                  <div>
                                    <span className={styles.contentVisible}>
                                      {item.moduleName}
                                    </span>
                                    ({item.moduleScore || 0}
                                    {trans("global.point", "分")})
                                  </div>
                                  {this.props.testStatus ? (
                                    <div className={styles.modultScore}>
                                      <i className={styles.iconfont}>
                                        &#xe634;
                                      </i>
                                      <span className={styles.score}>
                                        {item.moduleScore}
                                      </span>
                                      {trans("global.point", "分")}
                                    </div>
                                  ) : null}
                                </div>
                                <div className={styles.moveListContent}>
                                  {item.questionList &&
                                  item.questionList.length > 0
                                    ? item.questionList.map((it, ind) => (
                                        <div
                                          className={styles.optionBox}
                                          style={
                                            checkQuestionId1 &&
                                            checkQuestionId1 === it.questionId
                                              ? {
                                                  border:
                                                    "1px solid rgba(2,88,191,1)",
                                                }
                                              : it.studentAnswer &&
                                                  it.studentAnswer !== ""
                                                ? {
                                                    border:
                                                      "1px solid rgba(59,111,245,0.36)",
                                                  }
                                                : null
                                          }
                                          onClick={this.scrollView1.bind(
                                            this,
                                            it.questionId,
                                          )}
                                          key={ind}
                                        >
                                          {this.renderNumber1(it.questionId)}
                                        </div>
                                      ))
                                    : null}
                                </div>
                              </div>
                            ),
                          )
                        : null}
                    </div>
                  </div>
                </div>
              ) : (
                examPaperResultUrl &&
                examPaperResultUrl.studentExamPaperurls &&
                examPaperResultUrl.studentExamPaperurls.length > 0 &&
                examPaperResultUrl.studentExamPaperurls.map((item) => (
                  <div className={styles.imgBox}>
                    <img src={item} alt="" />
                  </div>
                ))
              )
              // : "暂无试卷图片"
            }
          </div>
        );
      }
      case 3: {
        return (
          <div style={{ width: "100%", height: "100%", padding: "20px" }}>
            <div
              style={{
                background: "#fff",
                width: "100%",
                overflowY: "scroll",
                height: "100%",
              }}
            >
              {moduleModelList ? (
                moduleModelList[2]?.modelValue?.objectModelList[0]
                  ?.objectContentList?.length ? (
                  moduleModelList[2]?.modelValue?.objectModelList[0]?.objectContentList?.map(
                    (item, m) => (
                      <div
                        key={m}
                        className={styles.rowBox}
                        id={`question${item.questionId}`}
                      >
                        <QuestionShow
                          question={item}
                          openTwoWay={this.props.openTwoWay}
                        />
                        <div className={styles.projectStyle}>
                          <span className={styles.labelStyle}>
                            【{trans("global.studentAnswers", "学生答案")}】
                          </span>
                          <span className={styles.projectDetail}>
                            {item.type == 6 &&
                            item.sonQuestionList &&
                            item.sonQuestionList.length > 0 ? (
                              item.sonQuestionList.map((ii, inde) =>
                                ii.studentAnswer || ii.studentAnswerUrl ? (
                                  <div
                                    className={styles.questName}
                                    style={{ display: "flex" }}
                                  >
                                    <span style={{ marginRight: "5px" }}>
                                      {ii.questionSerialNumber}
                                    </span>
                                    {/* 选择题最大作答图片信息的最大宽度为60px 其它是555px */}
                                    {ii.studentAnswerUrl ? (
                                      <img
                                        src={ii.studentAnswerUrl}
                                        style={{ marginTop: "5px" }}
                                        className="img"
                                      />
                                    ) : ii.studentAnswer ? (
                                      ii.studentAnswer
                                    ) : null}
                                  </div>
                                ) : null,
                              )
                            ) : item.studentAnswerUrl ? (
                              <img
                                src={item.studentAnswerUrl}
                                style={{ marginTop: "5px" }}
                                className="img"
                              />
                            ) : item.studentAnswer ? (
                              <div> {item.studentAnswer} </div>
                            ) : null}
                          </span>
                        </div>

                        <div className={styles.projectStyle}>
                          <span className={styles.labelStyle}>
                            【{trans("singleInput.knowledgeTree", "知识点")}】
                          </span>
                          <span className={styles.projectDetail}>
                            {item.type === 6 ? (
                              <div className={styles.itemContent}>
                                {item.knowledgeValues &&
                                item.knowledgeValues.length > 0 ? (
                                  <span className={styles.chapterSort}>
                                    {trans("global.entireQuestion", "整题")}
                                  </span>
                                ) : null}
                                {item.knowledgeValues &&
                                item.knowledgeValues.length > 0
                                  ? item.knowledgeValues.map((index, l) => (
                                      <span key={l}>
                                        <span className={styles.chapterItem}>
                                          {index}
                                        </span>
                                      </span>
                                    ))
                                  : null}
                                {item.sonQuestionList &&
                                item.sonQuestionList.length > 0
                                  ? item.sonQuestionList.map((index, f) => (
                                      <span key={f}>
                                        {index.knowledgeValues &&
                                        index.knowledgeValues ? (
                                          <span className={styles.chapterSort}>
                                            {index.questionSerialNumber}
                                          </span>
                                        ) : null}
                                        {index.knowledgeValues &&
                                        index.knowledgeValues.length > 0
                                          ? index.knowledgeValues.map((ii) => (
                                              <span
                                                className={styles.chapterItem}
                                              >
                                                {ii}
                                              </span>
                                            ))
                                          : null}
                                      </span>
                                    ))
                                  : null}
                              </div>
                            ) : (
                              <div className={styles.itemContent}>
                                {item.knowledgeValues &&
                                item.knowledgeValues.length > 0
                                  ? item.knowledgeValues.map((index, k) => (
                                      <span
                                        className={styles.chapterItem}
                                        key={k}
                                      >
                                        {index}
                                      </span>
                                    ))
                                  : null}
                              </div>
                            )}
                          </span>
                        </div>

                        <div className={styles.projectStyle}>
                          <div className={styles.labelStyle}>
                            【{trans("global.errorAnalysis", "错因分析")}】
                          </div>
                          <div className={styles.projectDetail}>
                            <Checkbox.Group
                              options={[
                                {
                                  label: trans(
                                    "global.carelessMistake",
                                    "粗心大意",
                                  ),
                                  value: "粗心大意",
                                },
                                {
                                  label: trans(
                                    "global.conceptWeakness",
                                    "概念模糊",
                                  ),
                                  value: "概念模糊",
                                },
                                {
                                  label: trans(
                                    "global.misreadQuestions",
                                    "审题错误",
                                  ),
                                  value: "审题错误",
                                },
                                {
                                  label: trans(
                                    "global.wrongApproach",
                                    "思路错误",
                                  ),
                                  value: "思路错误",
                                },
                                {
                                  label: trans("global.other", "其它"),
                                  value: "其它",
                                },
                              ]}
                              value={item.errorAnalysis}
                              // onChange={(values) => { this.errorAnalysisChange(values, m) }}
                            />
                          </div>
                        </div>

                        {/* 非编辑状态作答区域为0不展示作答区域项 */}
                        <div className={styles.projectStyle}>
                          <div className={styles.labelStyle}>
                            【{trans("global.retry", "重新作答")}】
                          </div>
                          <div
                            className={styles.projectDetail}
                            style={{ height: `${item.answerFormat * 20}px` }}
                          ></div>
                        </div>

                        {/* 默认情况展示一行重新作答区域 */}
                        <div className={styles.projectStyle}>
                          <div className={styles.labelStyle}>
                            【{trans("global.retry", "重新作答")}】
                          </div>
                        </div>

                        <div className={styles.projectStyle}>
                          <div className={styles.labelStyle}>
                            【
                            {trans("global.personalizedPractice", "个性化练习")}
                            】
                          </div>
                          <div className={styles.projectDetail}>
                            {item?.personalityQuestionList?.length
                              ? item.personalityQuestionList.map((qu, g) => (
                                  <div key={g}>
                                    <QuestionShow question={qu} />
                                  </div>
                                ))
                              : null}
                          </div>
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                )
              ) : null}
            </div>
          </div>
        );
      }
      // No default
    }
  };
}

export default connect(({ home, studyPictures, inputQuestion, global }) => ({
  scoreData: home.scoreData,
  questionScore: home.questionScore,
  dataAnalysis: home.dataSource,
  viewData: home.viewData,
  knowLedgeAnalysis: home.knowLedgeAnalysis,
  identityJudgement: home.identityJudgement,
  examPaperResultUrl: home.examPaperResultUrl,
  examPaperStu: home.examPaperStu,
  studySituationByStudentIdList: home.studySituationByStudentIdList,
  currentUser: global.currentUser,
}))(TestStuTab);

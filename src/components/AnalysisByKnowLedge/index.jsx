//按试题的数据统计
import React, { PureComponent } from "react";
import { Popover, Spin, Table } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const { Column, ColumnGroup } = Table;

@connect((state) => ({
  answerRateData: state.home.answerRateData,
  knwoLedgeAnalysisList: state.home.knwoLedgeAnalysisList,
}))
class AnalysisByQuestion extends PureComponent {
  constructor(properties) {
    super();
    this.state = {
      pageNumber: 1,
      pageSize: 10,
      loadingTable: false,
      visibleObj: {},
      detailVisible: {},
    };
  }

  componentDidMount() {}

  //渲染题目内容
  renderQuestionContent = (text, record) => {
    let imgReg = /<img [^>]*src=["']([^"']+)[^>]*>/gi;
    let imgText = text.content.replaceAll(imgReg, "[tupian]");
    let htmlReg = /<[^<>]+>/g;
    let htmlText = imgText.replaceAll(htmlReg, "");
    htmlText.replaceAll(/&nbsp;/gi, "");
    if (htmlText.length > 40) {
      htmlText = htmlText.slice(0, 40) + "...";
    }
    return (
      <div>
        <div
          className={styles.questionContent}
          dangerouslySetInnerHTML={{ __html: htmlText }}
        ></div>
        <Popover
          title={null}
          content={this.renderQuestionDetail()}
          placement="rightBottom"
          trigger="click"
          visible={this.state.detailVisible[`${text.questionId}`] || false}
          onVisibleChange={this.changeDetialVisible.bind(this, text)}
        >
          <span className={styles.lookDetails}>
            {trans("analysis.lookDetails", "查看详情")}
          </span>
        </Popover>
      </div>
    );
  };

  //渲染题目详情
  renderQuestionDetail = () => {
    const { answerRateData } = this.props;
    let difficulity =
      answerRateData.questionLevelCode == 1
        ? `${styles.questionLevel} ${styles.easy}`
        : answerRateData.questionLevelCode == 2
          ? `${styles.questionLevel} ${styles.general}`
          : `${styles.questionLevel} ${styles.difficult}`;
    return (
      <div className={styles.classSourceRate}>
        <p>
          <span className={styles.questionType}>
            <i className={icon.iconfont}>&#xe761;</i> {answerRateData.type}
          </span>
          <span className={difficulity}>
            <i className={icon.iconfont}>&#xe764;</i>{" "}
            {this.renderDifficult(answerRateData.questionLevelCode)}
          </span>
        </p>
        <div
          className={styles.rateQustionTxt}
          dangerouslySetInnerHTML={{ __html: answerRateData.content }}
        ></div>
        {answerRateData.answerResponses &&
          answerRateData.answerResponses.length > 0 &&
          answerRateData.answerResponses.map((item, key) => (
            <div key={key} className={styles.optionArea}>
              <p className={styles.optionStyle} style={{ width: "100%" }}>
                <span dangerouslySetInnerHTML={{ __html: item.choose }}></span>
              </p>
            </div>
          ))}
      </div>
    );
  };

  changeDetialVisible = (text, visible) => {
    let detailVisible = JSON.parse(JSON.stringify(this.state.detailVisible));
    detailVisible = {};
    detailVisible[`${text.questionId}`] = visible;
    if (visible) {
      const { dispatch, examPaperId } = this.props;
      dispatch({
        type: "home/getAnswerRate",
        payload: {
          examId: this.props.examId,
          questionBankId: text.questionId,
          keyGroupId: "", //班级id
          keyName: "", //学生关键字
        },
      });
    }
    this.setState({
      detailVisible,
    });
  };
  changeState = (index, e) => {
    console.log(e, index, "111");
    window.event.returnValue == false;
    // e.preventDefault();
    e.stopPropagation();
    let newState = JSON.parse(JSON.stringify(this.state));
    if (newState[`analisis${index}`]) {
      newState[`analisis${index}`] = false;
    } else {
      newState[`analisis${index}`] = true;
    }
    console.log(newState, this.state, "asas");
    this.setState({
      ...newState,
    });
  };
  //渲染试题难度
  renderHard = (text, record) => {
    let color, content;
    if (text.questionLevel == 1) {
      color = "rgb(103, 178, 81)";
      content = trans("global.easy", "简单");
    } else if (text.questionLevel == 2) {
      color = "rgb(233, 182, 53)";
      content = trans("global.general", "普通");
    } else if (text.questionLevel == 3) {
      color = "rgb(221, 107, 71)";
      content = trans("global.difficult", "困难");
    }
    return <span style={{ color: color }}>{content}</span>;
  };

  //渲染总体情况
  renderAccuracy = (text, record) => {
    return (
      <span className={styles.accuracy}>
        <em className={styles.rightTxt}>
          {trans("global.trueRate", "正确率")}
        </em>
        <em className={styles.rightPercent}>{text.questionOverallAccuracy}</em>
        <Popover
          title={null}
          content={this.renderQuestionRate()}
          placement="bottom"
          trigger="click"
          visible={this.state.visibleObj[`${text.questionId}`] || false}
          onVisibleChange={this.changeVisible.bind(this, {}, text)}
        >
          <i className={`${icon.iconfont} ${styles.accuracyIcon}`}>&#xe634;</i>
        </Popover>
      </span>
    );
  };

  //渲染班级统计
  renderGroup = (groupAccuracyModels) => {
    return (
      groupAccuracyModels.length > 0 &&
      groupAccuracyModels.map((item, index) => {
        return (
          <Column
            key={index}
            title={this.renderGroupName(item)}
            align="center"
            render={(text, record) => this.renderGroupRate(text, record, item)}
            width="200px"
          />
        );
      })
    );
  };

  renderGroupName = (item) => {
    return <span className={styles.groupName}>{item.groupName}</span>;
  };

  //渲染班级正确率
  renderGroupRate = (text, record, item) => {
    let groupAccuracyModels = text.groupAccuracyModels || [];
    let questionAccuracy = "";
    for (const groupAccuracyModel of groupAccuracyModels) {
      if (item.groupId == groupAccuracyModel["groupId"]) {
        questionAccuracy = groupAccuracyModel["questionAccuracy"];
      }
    }
    return (
      <span className={styles.accuracy}>
        <em className={styles.rightTxt}>
          {trans("global.trueRate", "正确率")}
        </em>
        <em className={styles.rightPercent}>{questionAccuracy}</em>
        <Popover
          title={null}
          content={this.renderQuestionRate()}
          placement="bottom"
          trigger="click"
          visible={
            this.state.visibleObj[`${item.groupId}-${text.questionId}`] || false
          }
          onVisibleChange={this.changeVisible.bind(this, item, text)}
        >
          <i className={`${icon.iconfont} ${styles.accuracyIcon}`}>&#xe634;</i>
        </Popover>
      </span>
    );
  };

  //查看班级题目正答率
  renderQuestionRate() {
    const { answerRateData } = this.props;
    let difficulity =
      answerRateData.questionLevelCode == 1
        ? `${styles.questionLevel} ${styles.easy}`
        : answerRateData.questionLevelCode == 2
          ? `${styles.questionLevel} ${styles.general}`
          : `${styles.questionLevel} ${styles.difficult}`;
    return (
      <div className={styles.classSourceRate}>
        <p>
          <span className={styles.questionType}>
            <i className={icon.iconfont}>&#xe761;</i> {answerRateData.type}
          </span>
          <span className={difficulity}>
            <i className={icon.iconfont}>&#xe764;</i>{" "}
            {this.renderDifficult(answerRateData.questionLevelCode)}
          </span>
        </p>
        <div
          className={styles.rateQustionTxt}
          dangerouslySetInnerHTML={{ __html: answerRateData.content }}
        ></div>
        {answerRateData.answerResponses &&
          answerRateData.answerResponses.length > 0 &&
          answerRateData.answerResponses.map((item, key) => (
            <div key={key} className={styles.optionArea}>
              <p className={styles.optionStyle}>
                <em
                  className={styles.rateBar}
                  style={{
                    width: item.chooseRate || 0,
                    background: item.trueAnswer ? "#67B251" : "#E5492E",
                  }}
                ></em>
                {/* <span className={styles.choose}>{item.choose}</span> */}
                <span dangerouslySetInnerHTML={{ __html: item.choose }}></span>
              </p>
              <p className={styles.analysisPerson}>
                <span
                  className={styles.person}
                  style={{ color: item.trueAnswer ? "#67B251" : "#E5492E" }}
                >
                  {trans("analysisStudent.totalPerson", "{$num}人", {
                    num: item.chooseNum || "0",
                  })}
                </span>
                <span
                  className={styles.rate}
                  style={{ color: item.trueAnswer ? "#67B251" : "#E5492E" }}
                >
                  {item.chooseRate}
                </span>
              </p>
            </div>
          ))}
        <div className={styles.annlysisBox}>
          <div>
            {answerRateData.answerResponses &&
              answerRateData.answerResponses.length > 0 &&
              answerRateData.answerResponses.map((item) =>
                item.trueAnswer ? (
                  <div className={styles.rightAnswer}>
                    <span>{trans("global.rightAnswer", "正确答案")}： </span>
                    {item.optionKey}
                  </div>
                ) : null,
              )}
          </div>
          <div className={styles.analysisMessage}>
            {trans("global.analysisMessage", "点击柱状图，可查看学生名单")}
          </div>
          {answerRateData.answerResponses &&
            answerRateData.answerResponses.length > 0 &&
            answerRateData.answerResponses.map((item, index) => (
              <div
                className={[
                  styles.analysisAnswerList,
                  item.trueAnswer && this.state[`analisis${index}`]
                    ? styles.rightBox
                    : null,
                ].join(" ")}
              >
                <div className={styles.analisisHeader}>
                  <span className={item.trueAnswer ? styles.rightTitle : null}>
                    【{item.optionKey}】
                  </span>
                  <span>
                    {trans("analysis.optionCountRate", "{$count}人/占{$rate}", {
                      count: item.chooseNum || "0",
                      rate: item.chooseRate,
                    })}
                  </span>
                  <span
                    className={styles.rateBackground}
                    onClick={this.changeState.bind(this, index)}
                  >
                    <span
                      className={[
                        styles.trueRate,
                        item.trueAnswer ? styles.right : styles.wrong,
                      ].join(" ")}
                      style={{ width: item.chooseRate }}
                    ></span>
                  </span>
                </div>
                <div
                  className={styles.userList}
                  style={
                    this.state[`analisis${index}`] ? {} : { display: "none" }
                  }
                >
                  {item.userNameList && item.userNameList.length > 0
                    ? item.userNameList.map((index_, ind) => (
                        <div
                          className={styles.userItem}
                          style={{ marginLeft: "6px", marginTop: "10px" }}
                        >
                          {index_}
                          {ind < item.userNameList.length - 1 ? (
                            <span style={{ marginLeft: "6px" }}>|</span>
                          ) : null}
                        </div>
                      ))
                    : null}
                </div>
                <div
                  className={styles.knowLadgeList}
                  style={
                    this.state[`analisis${index}`] ? {} : { display: "none" }
                  }
                >
                  <div style={{ color: "#4c85f6" }}>
                    {trans("singleInput.knowledgeTree", "知识点")}
                  </div>
                  {item.optionKnowledgeList &&
                  item.optionKnowledgeList.length > 0
                    ? item.optionKnowledgeList.map((item) => (
                        <div className={styles.knowLadgeItem}>{item}</div>
                      ))
                    : null}
                </div>
              </div>
            ))}
          <div className={styles.knowLadgeBox}>
            <span className={styles.title}>
              {trans("singleInput.knowledgeTree", "知识点")}:{" "}
            </span>
            {answerRateData.questionKnowledgeList &&
            answerRateData.questionKnowledgeList.length > 0
              ? answerRateData.questionKnowledgeList.map((item) => (
                  <span className={styles.knowLadge}>{item}</span>
                ))
              : null}
          </div>
          <div className={styles.answerAnalysis}>
            <div className={styles.title}>
              {trans("global.analysis", "解析")}:
            </div>
            <div>{answerRateData.analysis}</div>
          </div>
        </div>
      </div>
    );
  }

  //渲染难易程度
  renderDifficult = (code) => {
    let level = {
      1: trans("global.easy", "简单"),
      2: trans("global.general", "普通"),
      3: trans("global.difficult", "困难"),
    };
    return level[`${code}`];
  };

  changeVisible = (item, text, visible, e) => {
    console.log(visible, e, "1aaa");
    let visibleObject = JSON.parse(JSON.stringify(this.state.visibleObj));
    visibleObject = {};
    if (JSON.stringify(item) == "{}") {
      visibleObject[`${text.questionId}`] = visible;
    } else {
      visibleObject[`${item.groupId}-${text.questionId}`] = visible;
    }
    if (visible) {
      const { dispatch, examPaperId } = this.props;
      dispatch({
        type: "home/getAnswerRate",
        payload: {
          examId: this.props.examId,
          questionBankId: text.questionId,
          keyGroupId: item.groupId || "", //班级id
          keyName: "", //学生关键字
        },
      });
    }
    this.setState({
      visibleObj: visibleObject,
    });
  };

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

  handleVisibleChange = (visible) => {
    this.setState({ visible });
  };
  render() {
    const { questionAnalysisData, knwoLedgeAnalysisList } = this.props;
    let tableSource = knwoLedgeAnalysisList ? knwoLedgeAnalysisList : [];
    let self = this;
    console.log(knwoLedgeAnalysisList, "111");
    let groupAccuracyModels =
      tableSource[0] && tableSource[0].groupAccuracyModels
        ? tableSource[0].groupAccuracyModels
        : [];
    let overflowX =
      groupAccuracyModels.length > 0
        ? groupAccuracyModels.length * 200 + 580
        : 0;
    return (
      <div className={styles.ananlysisQuestion}>
        <Spin spinning={this.props.loadingTable} size="large">
          <Table
            dataSource={tableSource}
            bordered
            rowKey="questionAnalysis"
            pagination={false}
            scroll={{ x: 800 }}
          >
            <Column
              title={trans("analysis.knowLedgeName", "知识点名称（满分）")}
              width="250px"
              key="number"
              align="left"
              render={(text, record) => (
                <span>
                  {text.knowledgeName} ({text.knowledgeScore})
                </span>
              )}
              fixed="left"
            />
            <Column
              title={trans("analysis.knowLedgeQuestionNo", "对应题目")}
              width="200px"
              key="question"
              align="center"
              render={(text, record) => (
                <span>
                  <span>题目</span>
                  {text.paperSaveQuestionModelList &&
                  text.paperSaveQuestionModelList.length > 0
                    ? text.paperSaveQuestionModelList.map((it, ind) => (
                        <span>
                          <span>{it.questionSerialNumber}</span>
                          {ind < text.paperSaveQuestionModelList.length - 1 ? (
                            <span>、</span>
                          ) : null}
                        </span>
                      ))
                    : null}
                </span>
              )}
              fixed="left"
            />
            <ColumnGroup
              title={trans("analysis.knowLedgeGrade", "年级")}
              fixed="left"
            >
              <Column
                title={trans("global.avgScore", "平均分")}
                width="150px"
                key="firstName"
                render={(text, record) => <span>{text.gradeAverage}</span>}
              />
              <Column
                title={trans("analysis.knowLedgeScoreRate", "得分率")}
                width="150px"
                key="lastName"
                render={(text, record) => <span>{text.gradeScoreRate}</span>}
              />
            </ColumnGroup>
            {knwoLedgeAnalysisList &&
            knwoLedgeAnalysisList.length > 0 &&
            knwoLedgeAnalysisList[0].groupAccuracyModelList &&
            knwoLedgeAnalysisList[0].groupAccuracyModelList.length > 0
              ? knwoLedgeAnalysisList[0].groupAccuracyModelList.map(
                  (item, ind) => (
                    <ColumnGroup title={<div>{item.groupName}</div>}>
                      <Column
                        title={trans("global.avgScore", "平均分")}
                        width="150px"
                        key="firstName"
                        render={(text, record, index) => (
                          <span>
                            {
                              knwoLedgeAnalysisList[index]
                                .groupAccuracyModelList[ind].average
                            }
                          </span>
                        )}
                      />
                      <Column
                        title={trans("analysis.knowLedgeScoreRate", "得分率")}
                        width="150px"
                        key="lastName"
                        render={(text, record, index) => (
                          <span>
                            {
                              knwoLedgeAnalysisList[index]
                                .groupAccuracyModelList[ind].scoreRate
                            }
                          </span>
                        )}
                      />
                    </ColumnGroup>
                  ),
                )
              : null}
            <Column
              title={""}
              key="number"
              align="left"
              render={(text, record) => <span></span>}
            />
          </Table>
        </Spin>

        <div className={styles.showPage}>
          {/* <Pagination 
                    total={questionAnalysisData.total || 0}
                    showSizeChanger
                    onChange={this.changePageSize}
                    onShowSizeChange={this.switchPageSize}
                    current={this.state.pageNumber}
                    pageSize={this.state.pageSize}
                    hideOnSinglePage={true}
                /> */}
        </div>
      </div>
    );
  }
}

export default AnalysisByQuestion;

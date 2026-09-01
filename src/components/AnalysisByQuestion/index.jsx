//按试题的数据统计
import React, { PureComponent } from "react";
import { Pagination, Popover, Spin, Table } from "antd";
import { connect } from "dva";

import AnalysisQuestionPreview from "../../routes/DataAnalysis/components/AnalysisQuestionPreview";
import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const { Column } = Table;

@connect((state) => ({
  answerRateData: state.home.answerRateData,
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
      teamModalVisible: false,
      inputValue: "",
      checkStuList: ["1"],
      activeQuestionId: null,
    };
  }

  componentDidMount() {}

  //渲染题目内容
  renderQuestionContent = (text, record) => {
    return (
      <div>
        {this.props.analysisQuestionCatalog ? (
          <div className={styles.questionContent}>
            <AnalysisQuestionPreview
              catalog={this.props.analysisQuestionCatalog}
              mode="question"
              questionId={text.questionId}
            />
          </div>
        ) : null}
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
        {this.props.analysisQuestionCatalog && this.state.activeQuestionId ? (
          <AnalysisQuestionPreview
            catalog={this.props.analysisQuestionCatalog}
            mode="question"
            questionId={this.state.activeQuestionId}
            showAnswer
          />
        ) : null}
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
      activeQuestionId: visible ? text.questionId : null,
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
  changeInput = (e) => {
    this.setState({
      inputValue: e.target.value,
    });
  };
  changeModal = () => {
    this.setState({
      teamModalVisible: !this.state.teamModalVisible,
    });
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
  changeStu = (checkedValues) => {
    this.setState({
      checkStuList: checkedValues,
    });
  };
  closeModal = () => {
    this.setState({
      teamModalVisible: !this.state.teamModalVisible,
    });
  };
  //查看班级题目正答率
  renderQuestionRate() {
    const { answerRateData } = this.props;
    const options = [
      { label: "Apple", value: "1" },
      { label: "Pear", value: "2" },
      { label: "Orange", value: "3" },
    ];

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
        {this.props.analysisQuestionCatalog && this.state.activeQuestionId ? (
          <AnalysisQuestionPreview
            catalog={this.props.analysisQuestionCatalog}
            mode="question"
            questionId={this.state.activeQuestionId}
            showAnswer
          />
        ) : null}
        <div className={styles.annlysisBox}>
          {/* <div className={styles.analysisMessage}>{trans('global.analysisMessage', '点击柱状图，可查看学生名单')}</div> */}
          {answerRateData.answerResponses &&
            answerRateData.answerResponses.length > 0 &&
            answerRateData.answerResponses.map((item, index) => (
              <div
                className={[
                  styles.analysisAnswerList,
                  this.state[`analisis${index}`] ? styles.rightBox : null,
                ].join(" ")}
              >
                <div className={styles.analisisHeader}>
                  <span>{item.optionKey}.</span>
                  <span className={styles.rateBackground}>
                    <span
                      className={[
                        styles.trueRate,
                        item.trueAnswer ? styles.right : styles.wrong,
                      ].join(" ")}
                      style={{ width: item.chooseRate }}
                    ></span>
                  </span>
                  <span>
                    {trans(
                      "analysis.optionCountRateParenthesized",
                      "（{$count}人 / {$rate}）",
                      { count: item.chooseNum || "0", rate: item.chooseRate },
                    )}
                  </span>
                  {this.state[`analisis${index}`] ? (
                    <span
                      onClick={this.changeState.bind(this, index)}
                      className={styles.optionRight}
                    >
                      {trans("global.collapse", "收起")}
                    </span>
                  ) : (
                    <span
                      onClick={this.changeState.bind(this, index)}
                      className={styles.optionRight}
                    >
                      {trans("analysis.lookDetails", "查看详情")}
                    </span>
                  )}
                </div>
                <div
                  className={styles.userList}
                  style={
                    this.state[`analisis${index}`] ? {} : { display: "none" }
                  }
                >
                  {
                    // item.trueAnswer ?
                    // <div style={{width: '100%'}}>
                    //     <div className={styles.teamBox}>
                    //         <span>学生分组</span>
                    //         <span className={styles.addTeam} onClick={this.changeModal}>+ 新建分组</span>
                    //     </div>
                    //     <Modal
                    //         title={''}
                    //         footer={null}
                    //         getContainer={false}
                    //         // centered={true}
                    //         visible={this.state.teamModalVisible}
                    //         closable={false}
                    //         maskClosable={false}
                    //         destroyOnClose={true}
                    //         // onCancel={this.publishCancel}
                    //         width="400px"
                    //         className={styles.uploadModal}
                    //         >
                    //         <div className={styles.teamModal}>
                    //         <div className={styles.header}>
                    //             <div className={styles.uploadTitle}>{trans('global.uploadExam', '上传答卷')}</div>
                    //             <i className={styles.iconfont} onClick={this.closeModal}>&#xe6e2;</i>
                    //         </div>
                    //         <div className={styles.inputBox}>
                    //             <div>{trans('global.teamName', '分组名称')}</div>
                    //             <Input value={this.state.inputValue} onChange={this.changeInput} placeholder={trans('global.unSetName', '未设置分组名称')}/>
                    //         </div>
                    //         <div className={styles.stuBox}>
                    //             <div>{trans('global.addStu', '添加学生')}</div>
                    //             <Checkbox.Group options={options} value={this.state.checkStuList} onChange={this.changeStu} />
                    //         </div>
                    //         </div>
                    //     </Modal>
                    // </div> :
                    item.userNameList && item.userNameList.length > 0
                      ? item.userNameList.map((index_, ind) => (
                          <div
                            className={styles.userItem}
                            style={{ marginLeft: "6px", marginTop: "10px" }}
                          >
                            {index_}
                          </div>
                        ))
                      : null
                  }
                </div>
                {/* <div
                  className={styles.knowLadgeList}
                  style={
                    this.state[`analisis${index}`] ? {} : { display: "none" }
                  }
                >
                  <div className={styles.knowLadgeOptionTitle}>
                    {trans("singleInput.knowledgeTreeOption", "该选项知识点:")}
                  </div>
                  {item.optionKnowledgeList && item.optionKnowledgeList.length
                    ? item.optionKnowledgeList.map((item) => (
                        <div className={styles.knowLadgeItem}>{item}</div>
                      ))
                    : null}
                </div> */}
              </div>
            ))}
          {/* <div className={styles.knowLadgeBox}>
                    <span className={styles.title}>{trans('singleInput.knowledgeTree', '知识点')}: </span>
                    {
                        answerRateData.questionKnowledgeList && answerRateData.questionKnowledgeList.length ?
                        answerRateData.questionKnowledgeList.map(item => (
                            <span className={styles.knowLadge}>{item}</span>
                        )) : null
                    }
                </div> */}
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
    const { answerRateData } = this.props;
    let newState = JSON.parse(JSON.stringify(this.state));
    if (
      answerRateData.answerResponses &&
      answerRateData.answerResponses.length > 0
    ) {
      answerRateData.answerResponses.map((item, index) => {
        if (newState[`analisis${index}`]) {
          newState[`analisis${index}`] = false;
        }
      });
    }

    let visibleObject = JSON.parse(JSON.stringify(this.state.visibleObj));
    visibleObject = {};
    if (JSON.stringify(item) == "{}") {
      visibleObject[`${text.questionId}`] = visible;
    } else {
      visibleObject[`${item.groupId}-${text.questionId}`] = visible;
    }
    newState.visibleObj = visibleObject;
    newState.activeQuestionId = visible ? text.questionId : null;
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
      ...newState,
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
    const { questionAnalysisData } = this.props;
    let tableSource = questionAnalysisData.data
      ? questionAnalysisData.data
      : [];
    console.log(tableSource, "tta");
    let self = this;
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
            scroll={{ x: overflowX }}
          >
            <Column
              title={trans("analysis.questionIndex", "题号")}
              key="number"
              align="center"
              render={(text, record) => (
                <span>{text.questionSerialNumber}</span>
              )}
              fixed="left"
              width="80px"
            />
            <Column
              title={trans("analysis.questionContent", "题目内容")}
              key="contxt"
              align="center"
              render={(text, record) =>
                this.renderQuestionContent(text, record)
              }
              fixed="left"
              width="200px"
            />
            <Column
              title={trans("analysis.questionScore", "分值")}
              key="score"
              align="center"
              render={(text, record) => <span>{text.questionScore}</span>}
              fixed="left"
              width="80px"
            />
            <Column
              title={trans("analysis.hardValue", "难度")}
              align="center"
              key="hard"
              render={(text, record) => this.renderHard(text, record)}
              fixed="left"
              width="100px"
            />
            <Column
              title={trans("anaylysis.allCondition", "总体情况")}
              key="condition"
              align="center"
              render={(text, record) => this.renderAccuracy(text, record)}
              width="160px"
            />
            {this.renderGroup(groupAccuracyModels)}
            <Column title="" key="blank" />
          </Table>
        </Spin>

        <div className={styles.showPage}>
          <Pagination
            total={questionAnalysisData.total || 0}
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

export default AnalysisByQuestion;

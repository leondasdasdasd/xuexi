import React, { PureComponent } from "react";
import { DataSet } from "@antv/data-set";
import G2 from "@antv/g2";
import { Modal, Popover } from "antd";
import { connect } from "dva";
import * as echarts from "echarts";
import pathToRegexp from "path-to-regexp";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

let timer;
class ViewChart extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/viewChart/:testId/:paperId").exec(this.url);
    this.testId = JSON.parse(this.pathMatch[1]) || null;
    this.paperId = JSON.parse(this.pathMatch[2]) || null;
    this.state = {
      modalVisible: false,
      groupId: null,
      viewChart: {},
      teamModalVisible: false,
      inputValue: "",
      checkStuList: ["1"],
      popVisible: false,
    };
    this.child = null;
  }
  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: "home/getClassList",
      payload: {
        examId: this.testId,
      },
    }).then(() => {
      if (this.props.classListData && this.props.classListData.length > 0) {
        this.setState(
          {
            groupId: this.props.classListData[0].groupId,
          },
          () => {
            this.getView();
          },
        );
      }
    });
  }
  getView = () => {
    this.props
      .dispatch({
        type: "home/getViewChart",
        payload: {
          groupId: this.state.groupId,
          examId: this.testId,
        },
      })
      .then(() => {
        if (
          JSON.stringify(this.state.viewChart) !==
          JSON.stringify(this.props.viewChart)
        ) {
          this.renderDashBoard();
          this.renderChart();
          this.setState({
            viewChart: this.props.viewChart,
          });
        }
        timer = setTimeout(() => {
          this.getView();
        }, 5000);
      });
  };
  componentWillUnmount = () => {
    clearTimeout(timer);
  };
  renderChart = () => {
    const { viewChart } = this.props;
    let newData = [];
    let rightObject = {
      name: "正确",
    };
    let wrongObject = {
      name: "错误",
    };
    let newArray = [];
    let newWrong = [];
    const mountNode = document.querySelector("#mountNode");
    if (mountNode.children && mountNode.children.length > 0) {
      mountNode.children[0].remove();
    }
    let questionList = [];
    if (
      viewChart &&
      viewChart.questionModels &&
      viewChart.questionModels.length > 0
    ) {
      viewChart.questionModels.map((item) => {
        rightObject[`题目${item.questionSerialNumber}`] = item.questionAccuracy;
        rightObject.id = item.questionId;
        wrongObject[`题目${item.questionSerialNumber}`] =
          item.questionErrorRate;
        questionList.push(`题目${item.questionSerialNumber}`);
        newArray.push({
          name: "正确",
          year: `题目${item.questionSerialNumber}`,
          value: item.questionAccuracy,
          number: item.questionCorrectNumber || 0,
          className: "rightTooltip",
        });
        newWrong.push({
          name: "错误",
          year: `题目${item.questionSerialNumber}`,
          value: item.questionErrorRate,
          number: item.questionErrorNumber || 0,
          className: "wrongTooltip",
        });
      });
    }
    newData.push(rightObject, wrongObject);
    newData = newArray.concat(newWrong);
    console.log(newData, "nns");
    // var ds = new DataSet();
    // var dv = ds.createView().source(newData);
    // dv.transform({
    //   type: 'percent',
    //   fields: 'value', // 展开字段集
    //   key: 'questionNum', // key字段
    //   value: '比率',
    //   color: 'color', // value字段
    // });
    var ds = new DataSet();
    var dv = ds
      .createView()
      .source(newData)
      .transform({
        type: "percent",
        field: "value", // 统计销量
        dimension: "name", // 每年的占比
        groupBy: ["year"], // 以不同产品类别为分组
        as: "percent",
      });

    var chart = new G2.Chart({
      container: "mountNode",
      forceFit: true,
      height: 500,
    });
    chart.source(dv, {
      percent: {
        min: 0,
        formatter: function formatter(value) {
          return (value * 100).toFixed(2) + "%";
        },
      },
    });
    chart.tooltip({
      containerTpl:
        "<div class='g2-tooltip'>" +
        "<ul class='g2-tooltip-list'></ul>" +
        "</div>",
      itemTpl: `<li><span class={className}></span><span style='margin-left: 10px;'>{name}</span><span style='margin-left: 10px;'>{number}</span>${trans("global.personUnit", "人")}<span style='margin-left: 10px;'>{value}%</span></li>`,
    });
    chart
      .intervalStack()
      .position("year*percent")
      .color("name", ["#0B9C37", "#9C0B11"])
      .tooltip(
        "name*value*number*className",
        function (name, value, number, className) {
          return {
            name,
            value,
            number,
            className,
          };
        },
      )
      .style({
        cursor: "pointer",
      });
    chart.render();
    chart.on("interval:click", (event_) => {
      const newData = event_.data;
      const questionNumber = Number.parseInt(
        newData._origin.year.split("题目")[1],
        10,
      );
      let id = null;
      viewChart.questionModels.map((item) => {
        if (item.questionSerialNumber == questionNumber) {
          id = item.questionId;
        }
      });
      this.props
        .dispatch({
          type: "home/getAnswerRate",
          payload: {
            examId: this.testId,
            questionBankId: id,
            keyGroupId: this.state.groupId, //班级id
            keyName: "", //学生关键字
          },
        })
        .then(() => {
          this.setState({
            modalVisible: !this.state.modalVisible,
          });
        });
    });
    // chart.source(dv, {
    //   percent: {
    //     min: 0,
    //     formatter: function formatter(val) {
    //       console.log(val, ';jj')
    //       return val + '%';
    //     }
    //   }
    // })
    //   chart.intervalStack().position('questionNum*比率').color('name');
    //   chart.render();
  };
  renderDifficult = (code) => {
    let level = {
      1: trans("global.easy", "简单"),
      2: trans("global.general", "普通"),
      3: trans("global.difficult", "困难"),
    };
    return level[`${code}`];
  };
  renderDashBoard = () => {
    const { viewChart } = this.props;
    var chartDom = document.querySelector("#main");
    var myChart = echarts.init(chartDom);
    var option;
    option = {
      color: {
        type: "radial",
        x: 0,
        y: 0.5,
        r: 1,
        colorStops: [
          {
            offset: 0,
            color: "#2c86d7", // 0% 处的颜色
          },
          {
            offset: 1,
            color: "#37c930", // 100% 处的颜色
          },
        ],
        global: false, // 缺省为 false
      },
      legend: {
        padding: 1,
      },
      series: [
        {
          type: "gauge",
          progress: {
            show: true,
            width: 10,
          },
          min: 0,
          max: 100,
          splitNumber: 2,
          pointer: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              width: 10,
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            length: 10,
            lineStyle: {
              width: 2,
              color: "#999",
            },
          },
          axisLabel: {
            distance: 25,
            color: "#999",
            fontSize: 12,
          },
          anchor: {
            show: false,
            showAbove: false,
            size: 20,
            itemStyle: {
              borderWidth: 10,
            },
          },
          title: {
            show: false,
          },
          detail: {
            show: false,
            valueAnimation: false,
            fontSize: 80,
            offsetCenter: [
              0,
              `${Math.floor(
                (viewChart.submitNumber / viewChart.pushNumber) * 100,
              )}`,
            ],
          },
          data: [
            {
              value: Math.floor(
                (viewChart.submitNumber / viewChart.pushNumber) * 100,
              ),
            },
          ],
        },
      ],
    };

    option && myChart.setOption(option);
  };
  back = () => {
    clearTimeout(timer);
    // window.location.href = `${window.location.origin}/exam#/dataAnalysis/${this.testId}/${this.paperId}/2`
    this.props.history.goBack();
  };
  handleOk = () => {};
  handleCancel = () => {
    this.setState({
      modalVisible: !this.state.modalVisible,
    });
  };
  changeGroup = (id) => {
    this.setState(
      {
        groupId: id,
      },
      () => {
        this.props
          .dispatch({
            type: "home/clearView",
          })
          .then(() => {
            clearTimeout(timer);
            this.getView();
          });
      },
    );
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

  changeInput = (e) => {
    this.setState({
      inputValue: e.target.value,
    });
  };
  renderPerson = () => {
    const { analysisPersonData } = this.props;
    return (
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
    );
  };
  changePopVisible(visible) {
    if (visible) {
      const { dispatch, examPaperId } = this.props;
      this.setState({
        loading: true,
      });
      dispatch({
        type: "home/getPersonAnalysis",
        payload: {
          examId: this.testId,
          groupId: this.state.groupId,
          type: 3,
        },
      }).then(() => {
        // this.setState({
        //     loading: false
        // })
      });
    }
    this.setState({
      popVisible: visible,
    });
  }
  changeModal = () => {
    this.setState({
      teamModalVisible: !this.state.teamModalVisible,
    });
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
  render() {
    const { answerRateData, viewChart } = this.props;
    const { groupId } = this.state;
    let difficulity =
      answerRateData.questionLevelCode == 1
        ? `${styles.questionLevel} ${styles.easy}`
        : answerRateData.questionLevelCode == 2
          ? `${styles.questionLevel} ${styles.general}`
          : `${styles.questionLevel} ${styles.difficult}`;
    const options = [
      { label: "Apple", value: "1" },
      { label: "Pear", value: "2" },
      { label: "Orange", value: "3" },
    ];
    return (
      <div className={styles.chartDiv}>
        <div className={styles.header}>
          <i
            className={[styles.iconfont, styles.backIcon].join(" ")}
            onClick={this.back}
          >
            &#xe6ff;
          </i>
          <span className={styles.title}>
            {trans("global.realTimeData", "实时统计数据")}
          </span>
        </div>
        <div className={styles.chartContent}>
          <div className={styles.classBox}>
            {this.props.classListData && this.props.classListData.length > 0
              ? this.props.classListData.map((item, index) => (
                  <div
                    className={
                      groupId === item.groupId ? styles.check : styles.noCheck
                    }
                    onClick={this.changeGroup.bind(this, item.groupId)}
                  >
                    {item.groupName}
                  </div>
                ))
              : null}
          </div>
          <div className={styles.flexBox}>
            <div className={styles.dashboardBox}>
              <div className={styles.dashboardTitle}>
                {trans("global.realTimeRate", "实时错题统计")}
              </div>
              <div className={styles.dashboardDom} id="main"></div>
              <div className={styles.rateBox}>
                <span className={styles.num}>{viewChart.completeRate}</span>
                <span className={styles.rate}>%</span>
              </div>
              <div className={styles.dataExplain}>
                <div className={styles.explainBox}>
                  <span className={styles.text}>
                    {trans("global.pushed", "已推送")}
                  </span>
                  <span className={styles.trans}>- - - - - - - - - -</span>
                  <span className={styles.num}>{viewChart.pushNumber}</span>
                </div>
              </div>
              <div className={styles.dataExplain}>
                <div className={styles.explainBox}>
                  <span className={styles.text}>
                    {trans("global.completed", "已推送")}
                  </span>
                  <span className={styles.trans}>- - - - - - - - - -</span>
                  <span className={styles.num}>{viewChart.submitNumber}</span>
                </div>
              </div>
              <div className={styles.dataExplain}>
                <div className={styles.explainBox}>
                  <span className={styles.text}>
                    {trans("global.unSubmited", "已推送")}
                  </span>
                  <span className={styles.trans}>- - - - - - - - - -</span>
                  <span className={styles.num}>{viewChart.unSubmitNumber}</span>
                  <Popover
                    content={this.renderPerson()}
                    title={null}
                    trigger="click"
                    visible={this.state.popVisible || false}
                    onVisibleChange={this.changePopVisible.bind(this)}
                  >
                    <i className={[styles.iconfont, styles.stuNum].join(" ")}>
                      &#xe74e;
                    </i>
                  </Popover>
                </div>
              </div>
            </div>
            <div className={styles.histogram}>
              <div className={styles.dashboardTitle}>
                {trans("global.realTimeWrong", "实时错题统计")}
              </div>
              <div className={styles.mountNode} id="mountNode"></div>
            </div>
          </div>
        </div>
        <Modal
          title=""
          visible={this.state.modalVisible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={null}
          getContainer={false}
          width={1000}
        >
          {answerRateData && answerRateData.content ? (
            <div className={styles.classSourceRate}>
              <p style={{ marginBottom: "10px" }}>
                <span className={styles.questionType}>
                  <i className={styles.iconfont}>&#xe761;</i>{" "}
                  {answerRateData.type}
                </span>
                <span className={difficulity}>
                  <i className={styles.iconfont}>&#xe764;</i>{" "}
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
                      {/* <em className={styles.rateBar} style={{width: item.chooseRate || 0, background: item.trueAnswer ? '#67B251' : '#E5492E'}}></em> */}
                      {/* <span className={styles.choose}>{item.choose}</span> */}
                      <span
                        dangerouslySetInnerHTML={{ __html: item.choose }}
                      ></span>
                    </p>
                    {/* <p className={styles.analysisPerson}>
                            <span className={styles.person} style={{color: item.trueAnswer ? '#67B251' : '#E5492E'}}>{trans('analysisStudent.totalPerson', '{$num}人', {num: item.chooseNum || "0"})}</span>
                            <span className={styles.rate} style={{color: item.trueAnswer ? '#67B251' : '#E5492E'}}>{item.chooseRate}</span>
                        </p> */}
                  </div>
                ))}
              <div className={styles.annlysisBox}>
                <div>
                  {answerRateData.answerResponses &&
                    answerRateData.answerResponses.length > 0 &&
                    answerRateData.answerResponses.map((item) =>
                      item.trueAnswer ? (
                        <div className={styles.rightAnswer}>
                          <span>
                            {trans("global.rightAnswer", "正确答案")}：{" "}
                          </span>
                          {item.optionKey}
                        </div>
                      ) : null,
                    )}
                </div>
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
                            "viewChart.chooseCountWithRate",
                            "（{$count}人 / {$rate}）",
                            {
                              count: String(item.chooseNum ?? 0),
                              rate: item.chooseRate,
                            },
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
                          this.state[`analisis${index}`]
                            ? {}
                            : { display: "none" }
                        }
                      >
                        {
                          // item.trueAnswer ?
                          // <div style={{width: '100%'}}>
                          //     {/* <div className={styles.teamBox}>
                          //         <span>学生分组</span>
                          //         <span className={styles.addTeam} onClick={this.changeModal}>+ 新建分组</span>
                          //     </div> */}
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
                                  style={{
                                    marginLeft: "6px",
                                    marginTop: "10px",
                                  }}
                                >
                                  {index_}
                                </div>
                              ))
                            : null
                        }
                      </div>
                      {/* <div className={styles.knowLadgeList} style={this.state[`analisis${index}`] ? {} : {display: 'none'}}>
                                <div className={styles.knowLadgeOptionTitle}>{trans('singleInput.knowledgeTreeOption', '该选项知识点:')}</div>
                                {
                                    item.optionKnowledgeList && item.optionKnowledgeList.length ?
                                    item.optionKnowledgeList.map(item => (
                                        <div className={styles.knowLadgeItem}>
                                            {item}
                                        </div>
                                    )) : null
                                }
                            </div> */}
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
                  <div
                    dangerouslySetInnerHTML={{
                      __html: answerRateData.analysis,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    );
  }
}

export default connect(({ home, studyPictures }) => ({
  answerRateData: home.answerRateData,
  classListData: home.classListData,
  viewChart: home.viewChart,
  analysisPersonData: home.analysisPersonData,
}))(ViewChart);

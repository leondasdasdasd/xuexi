import React, { PureComponent } from "react";
import { Icon, Input } from "antd";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import { locale, trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

class AllocationProcess extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/setQuestionBlocks/:examId").exec(this.url);
    this.examId = JSON.parse(this.pathMatch[1]);
    this.state = {
      blocksList: [
        {
          paperModuleName: "题块一",
          questionList: [],
        },
      ],
      clickIndex: null,
    };
  }
  componentDidMount() {
    this.props.dispatch({
      type: "marking/getQuestionList",
      payload: {
        examId: this.examId,
      },
    });
  }

  back = () => {
    // window.parent.postMessage("false", "*");
    window.close() || this.props.history.goBack();
  };
  clickToAllocate = () => {
    window.open(
      `${window.location.origin}/exam#/allocationProcess/${this.examId}`,
      "_self",
    );
  };
  clickSaveToAllocate = () => {
    let array = JSON.parse(JSON.stringify(this.state.blocksList));
    let newArray = [];
    array.length > 0 &&
      array.map((item, index) => {
        let questionArray = [];
        item.questionList &&
          item.questionList.length > 0 &&
          item.questionList.map((item) => {
            questionArray.push(item.questionSettingId);
          });
        newArray.push({
          examId: this.examId,
          paperModuleName: item.paperModuleName,
          questionSettingId: questionArray,
        });
      });

    console.log(newArray, "nn");
    this.props
      .dispatch({
        type: "marking/postInsertOrUpdate",
        payload: newArray,
      })
      .then(() => {
        window.open(
          `${window.location.origin}/exam#/allocationProcess/${this.examId}`,
          "_self",
        );
      });
  };
  clickAddQuestionBlock = (e) => {
    e.stopPropagation();
    let array = JSON.parse(JSON.stringify(this.state.blocksList));
    array.push({
      paperModuleName: "题块",
      questionList: [],
    });
    this.setState({
      blocksList: array,
    });
  };
  changeBlockTitle = (e, ind) => {
    let array = JSON.parse(JSON.stringify(this.state.blocksList));
    let newArray = [];
    array.length > 0 &&
      array.map((item, index) => {
        if (ind == index) {
          newArray.push({
            paperModuleName: e.target.value,
            questionList: item.questionList,
          });
        } else {
          newArray.push(item);
        }
      });
    this.setState({
      blocksList: newArray,
    });
  };
  onBlurTitle = (e, ind) => {
    let array = JSON.parse(JSON.stringify(this.state.blocksList));
    let newArray = [];
    array.length > 0 &&
      array.map((item, index) => {
        if (ind == index) {
          newArray.push({
            paperModuleName: e.target.value,
            questionList: item.questionList,
          });
        } else {
          newArray.push(item);
        }
      });
    this.setState({
      blocksList: newArray,
    });
  };
  clickAddQuestion = (e, ind) => {
    e.stopPropagation();
    let state = Object.assign({}, this.state);
    state[`selQuest${ind}`] = true;
    state[`selQuest${this.state.clickIndex}`] = false;
    this.setState({
      ...state,
      clickIndex: ind,
    });
  };
  clickOuter = () => {
    let state = Object.assign({}, this.state);
    state[`selQuest${this.state.clickIndex}`] = false;
    this.setState({
      ...state,
      clickIndex: null,
    });
  };
  changeQuestion = (e, date, ind) => {
    e.stopPropagation();
    let state = Object.assign({}, this.state);
    if (state[`isSelectedQuestion${date.questionSettingId}`]) return;
    let array = JSON.parse(JSON.stringify(this.state.blocksList));
    let newArray = [];
    array.length > 0 &&
      array.map((item, index) => {
        if (ind == index) {
          newArray.push({
            paperModuleName: item.paperModuleName,
            questionList: [...item.questionList, date],
          });
        } else {
          newArray.push(item);
        }
      });
    state[`isSelectedQuestion${date.questionSettingId}`] = true;
    this.setState({
      ...state,
      blocksList: newArray,
    });
  };
  enterBlock = (ind) => {
    let state = Object.assign({}, this.state);
    state[`enterBlockIndex${ind}`] = true;
    this.setState({
      ...state,
    });
  };
  leaveBlock = (ind) => {
    let state = Object.assign({}, this.state);
    state[`enterBlockIndex${ind}`] = false;
    this.setState({
      ...state,
    });
  };
  deleteBlock = (e, ind) => {
    e.stopPropagation();
    let state = Object.assign({}, this.state);
    let array = JSON.parse(JSON.stringify(this.state.blocksList));
    array.length > 0 &&
      array.map((item, index) => {
        if (ind == index) {
          item.questionList.length > 0 &&
            item.questionList.map((it) => {
              state[`isSelectedQuestion${it.questionSettingId}`] = false;
            });
        }
      });
    let newArray = array.filter((item, index) => index != ind);
    console.log(newArray, "zwl");
    this.setState({
      ...state,
      blocksList: newArray,
    });
  };
  deleteQuestion = (e, ind, id) => {
    e.stopPropagation();
    let state = Object.assign({}, this.state);
    let array = JSON.parse(JSON.stringify(this.state.blocksList));
    let newArray = [];
    array.length > 0 &&
      array.map((item, index) => {
        if (ind == index) {
          let questionArray =
            item.questionList &&
            item.questionList.length > 0 &&
            item.questionList.filter((it) => it.questionSettingId != id);
          newArray.push({
            paperModuleName: item.paperModuleName,
            questionList: questionArray,
          });
        } else {
          newArray.push(item);
        }
      });
    state[`isSelectedQuestion${id}`] = false;
    this.setState({
      ...state,
      blocksList: newArray,
    });
  };
  render() {
    const { blocksList } = this.state;
    const { questionList } = this.props;
    return (
      <div className={styles.allocationProcessBox} onClick={this.clickOuter}>
        <div className={styles.header}>
          <div className={[styles.closeIcon].join(" ")} onClick={this.back}>
            <Icon type="close" />
          </div>
          <div className={[styles.viewTitle].join(" ")}>
            {trans("detail.assignGradingTasks", "分配阅卷任务")}：
          </div>
          <div className={styles.headeRight}>
            <span onClick={this.clickToAllocate}>
              {trans("global.toAllocate", "跳过，直接去分配任务")}
            </span>
            <span
              className={styles.assignComplete}
              onClick={this.clickSaveToAllocate}
            >
              {trans("global.saveToAllocate", "保存，去分配任务")}
            </span>
          </div>
        </div>
        <div className={styles.setQuestionBlocksBox}>
          <div className={styles.title}>
            {trans("global.setQuestionBlocks", "设置题块")}
          </div>
          <p className={styles.blocksTip}>
            {trans(
              "global.questionBlocksTip",
              "阅卷时，同一题块里的题目会放在一个页面里打分。此功能仅支持电脑端批阅，手机阅卷不支持。",
            )}
          </p>
          <div className={styles.questionBlocksList}>
            {blocksList &&
              blocksList.length > 0 &&
              blocksList.map((item, index) => (
                <div
                  className={styles.questionBlocks}
                  onMouseEnter={() => this.enterBlock(index)}
                  onMouseLeave={() => this.leaveBlock(index)}
                  style={
                    this.state[`enterBlockIndex${index}`]
                      ? { border: "1px solid rgba(4,69,252,1)" }
                      : {}
                  }
                >
                  <div className={styles.blocksTitle}>
                    {/* <span>{item.paperModuleName}</span> */}
                    <Input
                      placeholder={trans(
                        "setQuestionBlocks.blockTitlePlaceholder",
                        "请输入题块标题",
                      )}
                      value={item.paperModuleName}
                      onChange={(e) => this.changeBlockTitle(e, index)}
                      onBlur={(e) => this.onBlurTitle(e, index)}
                      onPressEnter={(e) => this.onBlurTitle(e, index)}
                    />
                  </div>

                  {item.questionList && item.questionList.length > 0 ? (
                    <div
                      className={styles.questionList}
                      onClick={(e) => this.clickAddQuestion(e, index)}
                    >
                      {item.questionList.map((it) => (
                        <span className={styles.questionNum}>
                          {it.questionId}
                          {this.state[`enterBlockIndex${index}`] ? (
                            <i
                              className={icon.iconfont}
                              onClick={(e) =>
                                this.deleteQuestion(
                                  e,
                                  index,
                                  it.questionSettingId,
                                )
                              }
                            >
                              &#xe6ca;
                            </i>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={styles.addQuestionTest}
                      onClick={(e) => this.clickAddQuestion(e, index)}
                    >
                      {trans("global.addQuestion", "点此添加题目")}
                    </div>
                  )}
                  {this.state[`selQuest${index}`] ? (
                    <div className={styles.selectQuestion}>
                      {questionList &&
                        questionList.length > 0 &&
                        questionList.map((it) => (
                          <div
                            className={styles.questionBox}
                            onClick={(e) => this.changeQuestion(e, it, index)}
                          >
                            <span className={styles.questionName}>
                              {it.questionId}
                            </span>
                            {this.state[
                              `isSelectedQuestion${it.questionSettingId}`
                            ] ? (
                              <i className={icon.iconfont}>&#xeaf1;</i>
                            ) : null}
                          </div>
                        ))}
                    </div>
                  ) : null}
                  {this.state[`enterBlockIndex${index}`] ? (
                    <i
                      className={[icon.iconfont, styles.iconDelete].join(" ")}
                      onClick={(e) => this.deleteBlock(e, index)}
                    >
                      &#xe896;
                    </i>
                  ) : null}
                </div>
              ))}

            {/* <div className={styles.questionBlocks}>
              <div className={styles.blocksTitle}>222</div>
              <div className={styles.questionList}>
                <span className={styles.questionNum}>
                  4<i className={icon.iconfont}>&#xe6ca;</i>
                </span>
                <span className={styles.questionNum}>5</span>
                <span className={styles.questionNum}>6</span>
              </div>
              <i className={[icon.iconfont, styles.iconDelete].join(" ")}>
                &#xe896;
              </i>
            </div> */}
            <div
              className={[styles.questionBlocks, styles.addBox].join(" ")}
              onClick={(e) => this.clickAddQuestionBlock(e)}
            >
              <i
                className={icon.iconfont}
                style={{ fontSize: 43, color: "#8B93A7" }}
              >
                &#xe75a;
              </i>
              <span className={styles.addQuestionBlock}>
                {trans("global.addQuestionBlock", "添加题块")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default connect(({ home, marking, global }) => ({
  questionList: marking.questionList,
}))(AllocationProcess);

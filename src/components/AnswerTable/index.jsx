// 类组件
import React from "react";
import { Icon, Input, Popover } from "antd";

import activeBad from "../../assets/activeBad.svg";
import activelike from "../../assets/activeLike.svg";
import bad from "../../assets/bad.svg";
import like from "../../assets/like.svg";
import AnalysisQuestionPreview from "../../routes/DataAnalysis/components/AnalysisQuestionPreview";
import { trans } from "../../utils/i18n";
import MyButton from "../MyButton";

import styles from "./index.module.less";
const { TextArea } = Input;
class AnswerTable extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      commentIndex: undefined,
      commentType: undefined,
      visible: false,
      currentQuestionUrl: "",
      scale: 1,
      remark: "",
    };
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      // xxx: nextProps.xxx,
    };
  }

  componentDidMount() {
    if (this.props.getRef) {
      this.props.getRef(this);
    }
  }

  commentChange = (index, commentType) => {
    let copyList = JSON.parse(JSON.stringify(this.props.dataList));
    this.props.onStatusChange &&
      this.props.onStatusChange(copyList[index], commentType);
  };

  changeVal = (e, index) => {
    console.log(e.target.value);
    this.setState({
      remark: e.target.value,
    });
  };

  pressEnter = (index, item) => {
    this.setState({
      commentIndex: undefined,
    });
    let copyList = JSON.parse(JSON.stringify(this.props.dataList));
    this.props.onRemarkChange &&
      this.props.onRemarkChange({
        ...copyList[index],
        remark: this.state.remark,
      });
  };

  openQuestion = (url) => {
    this.setState({
      visible: true,
      currentQuestionUrl: url,
    });
  };

  close = () => {
    this.setState({
      visible: false,
      currentQuestionUrl: "",
      scale: 1,
    });
  };

  openRemark = (index) => {
    let copyList = JSON.parse(JSON.stringify(this.props.dataList));
    this.setState({
      commentIndex: index,
      remark: copyList[index].remark,
      commentType: "remark",
    });
  };

  cancelRemark = (item, index) => {
    // console.log(item, index, this.state.commentIndex);
    this.setState({
      commentIndex: -1,
      remark: "",
    });
  };

  // remarkBlur = (item) => {
  //     this.setState({
  //         commentIndex: undefined,
  //         remark: '',
  //     })
  // }

  render() {
    const {
      arrangeKey,
      width,
      height,
      dataList,
      isShowStuName,
      currentStudentId,
    } = this.props;
    // let w = width ? width : '257.23px'
    // let h = height ? height : '150px'

    let aa = (item, index) => {
      return (
        <>
          <div className={styles.headerContent} id={`text${item.studentId}`}>
            <div className={styles.studentName}>
              {isShowStuName ? item.studentName : ""}
              &nbsp;{item.score}
              {trans("global.point", "分")}
            </div>

            <div
              title={trans("answerTable.addRemark", "添加备注")}
              className={styles.isShow}
            >
              <Popover
                visible={this.state.commentIndex == index}
                placement="bottomRight"
                content={
                  <div className={styles.remarkWarp}>
                    <TextArea
                      value={this.state.remark}
                      placeholder={trans(
                        "answerTable.remarkPlaceholder",
                        "请输入，可回车提交",
                      )}
                      onChange={(e) => {
                        this.changeVal(e, index);
                      }}
                      // autoFocus
                      // onBlur={() => this.cancelRemark(item)}
                      onPressEnter={() => this.pressEnter(index, item)}
                    />
                    <div style={{ textAlign: "right", padding: "8px 0" }}>
                      <MyButton
                        style={{ marginRight: "12px" }}
                        sizeclass="smallBtn"
                        typeclass="cancelBtn"
                        onClick={() => this.cancelRemark(item, index)}
                      >
                        {trans("global.cancle", "取消")}
                      </MyButton>
                      <MyButton
                        style={{ marginRight: "12px" }}
                        sizeclass="smallBtn"
                        typeclass="confirmBtn"
                        onClick={() => this.pressEnter(index, item)}
                      >
                        {trans("global.save", "保存")}
                      </MyButton>
                    </div>
                  </div>
                }
                trigger="click"
              >
                {/* <span style={{ color: 'blue' }} onClick={() => this.openRemark(index)}>
                                备注
                            </span> */}
                <i
                  className={styles.iconfont}
                  onClick={() => this.openRemark(index)}
                  style={{ fontSize: "33px", color: "rgb(179,184,197)" }}
                >
                  &#xe8c6;
                </i>
              </Popover>
            </div>

            <div
              className={styles.like}
              title={trans("answerTable.markExcellentAnswer", "标记为优秀作答")}
            >
              {item.excellentAnswering ? (
                <div
                  style={{
                    width: "32px",
                    height: "33px",
                    textAlign: "center",
                    lineHeight: "33px",
                  }}
                  onClick={() => this.commentChange(index, "un-like")}
                >
                  <img
                    src={activelike}
                    style={{ width: "18px", height: "18px" }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: "33px",
                    height: "33px",
                    textAlign: "center",
                    lineHeight: "34px",
                  }}
                >
                  <img
                    src={like}
                    onClick={() => this.commentChange(index, "like")}
                  />
                </div>
              )}
            </div>
            <div
              className={styles.bad}
              title={trans("answerTable.markTypicalMistake", "标记为典型错因")}
            >
              {item.errorAnalysis ? (
                <div
                  style={{
                    width: "32px",
                    height: "33px",
                    textAlign: "center",
                    lineHeight: "32px",
                  }}
                  onClick={() => this.commentChange(index, "un-bad")}
                >
                  <img
                    src={activeBad}
                    style={{ width: "18px", height: "18px" }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: "32px",
                    height: "33px",
                    textAlign: "center",
                    lineHeight: "33px",
                  }}
                >
                  <img
                    src={bad}
                    onClick={() => this.commentChange(index, "bad")}
                  />
                </div>
              )}
            </div>
          </div>
          <div
            className={styles.answerArea}
            style={{ width: "100%", height: "auto" }}
          >
            {item.studentAnswerPicture ? (
              <img
                src={item.studentAnswerPicture}
                onClick={() => {
                  this.openQuestion(item.studentAnswerPicture);
                }}
                alt=""
                style={{ width: "100%" }}
              />
            ) : this.props.analysisQuestionCatalog && this.props.questionId ? (
              <AnalysisQuestionPreview
                answerJson={item.answerJson}
                catalog={this.props.analysisQuestionCatalog}
                mode="response"
                questionId={this.props.questionId}
              />
            ) : (
              <div
                style={{ width: "100%", height: "100%" }}
                dangerouslySetInnerHTML={{
                  __html:
                    item.studentAnswerContent ||
                    `<div style="text-align:center">${trans("answerTable.noAnswerContent", "暂无作答内容")}</div>`,
                }}
              />
            )}
          </div>
          <div className={styles.bottomContent}>
            <span>{item.remark}</span>
          </div>
        </>
      );
    };

    return (
      <div
        className={`${styles.AnswerTable} ${arrangeKey == 0 ? styles.singleRow : styles.multicolumn}`}
      >
        <div style={{ overflowY: "auto", width: "100%", height: "100%" }}>
          {this.props.dataList && this.props.dataList.length > 0 ? (
            this.props.dataList.map((item, index) => {
              // 单列
              if (arrangeKey == 0) {
                return (
                  <div
                    key={item.studentId ?? index}
                    className={`${styles.answerContent} ${index == this.props.dataList.length - 1 ? styles.borderBorrom : ""} ${currentStudentId == item.studentId ? styles.active : ""}`}
                  >
                    {aa(item, index)}
                  </div>
                );
              } else if (arrangeKey == 1) {
                if (index % 2 == 1) {
                  // 多列(考虑到同一行的两个答题保持高度一致，外层包裹一个div)
                  return (
                    <div
                      className={`${styles.rowBox}`}
                      key={
                        this.props.dataList[index - 1].studentId ?? index - 1
                      }
                    >
                      <div
                        className={`${styles.answerContent}  ${currentStudentId == this.props.dataList[index - 1].studentId ? styles.active : ""}`}
                      >
                        {aa(this.props.dataList[index - 1], index - 1)}
                      </div>
                      <div
                        key={index}
                        className={`${styles.answerContent}  ${currentStudentId == item.studentId ? styles.active : ""} ${this.props.dataList.length % 2 == 1 && index == this.props.dataList.length - 2 ? styles.borderBorrom : ""}`}
                      >
                        {aa(item, index)}
                      </div>
                    </div>
                  );
                }
                // 奇数个补充展示最后一个
                if (
                  this.props.dataList.length % 2 == 1 &&
                  index == this.props.dataList.length - 1
                ) {
                  return (
                    <div
                      key={item.studentId ?? index}
                      className={`${styles.answerContent}  ${currentStudentId == item.studentId ? styles.active : ""}`}
                    >
                      {aa(item, index)}
                    </div>
                  );
                }
              }
            })
          ) : (
            <div
              style={{ textAlign: "center", width: "100%", padding: "10px" }}
            >
              {trans("global.noData", "暂无数据")}
            </div>
          )}
        </div>
        {this.state.visible ? (
          <div className={styles.currentQuestion}>
            <div style={{ width: "100%", height: "100%" }}>
              <div style={{ padding: "12px 0 0 12px" }}>
                <Icon
                  type="close"
                  className={styles.iconfont}
                  onClick={this.close}
                />
              </div>
              <div
                style={{
                  height: "calc(100% - 45px)",
                  width: "100%",
                  overflow: "auto",
                }}
              >
                <div
                  style={{
                    transformOrigin: "0 0",
                    width: "100%",
                    height: "100%",
                    transform: `scale(${this.state.scale})`,
                  }}
                >
                  {this.state.currentQuestionUrl ? (
                    <img
                      src={this.state.currentQuestionUrl}
                      style={{
                        height: "100%",
                        width: "100%",
                        objectFit: "contain",
                      }}
                      alt=""
                      className={styles.img}
                    />
                  ) : null}
                </div>
              </div>
            </div>
            <div className={styles.menuBox}>
              <div
                className={styles.leftIcon}
                onClick={() => {
                  this.setState(({ scale }) => ({ scale: scale + 0.1 }));
                }}
              >
                <i className={styles.iconfont}>&#xe8c7;</i>
              </div>
              <div
                className={styles.contentText}
                onClick={() => {
                  this.setState({ scale: 1 });
                }}
              >
                {trans("answerTable.originalSize", "原始大小")}
              </div>
              <div
                className={styles.rightIcon}
                onClick={() => {
                  this.setState(({ scale }) => ({ scale: scale - 0.1 }));
                }}
              >
                <i className={styles.iconfont}>&#xe8c8;</i>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    );
  }
}

export default AnswerTable;

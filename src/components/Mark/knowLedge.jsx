// 题目结构
import React from "react";
import { Modal, TreeSelect } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import styles from "./knowLedge.module.less";
const { SHOW_PARENT } = TreeSelect;
@connect((state) => ({
  treeData: state.inputQuestion.treeData,
}))
class KnowLedge extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      list: [],
      clickIndex: 0, //当前点击行
      typeVisible: false, //题目类型
      numberVisible: false, // 题号显隐
      issonNum: false,
      sonNum: 0,
      questionNum: null,
      questionType: null,
      score: null,
      selectTree: [],
      selectTreeValue: [],
      addVisible: false, //添加题目弹层
      // markValue: null //打标类型
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
    this.props.dispatch({
      type: "inputQuestion/getKnowledgeTree",
      payload: {
        //   subjectId: this.state.subjectId,
        //   gradeId: this.state.gradeId,
        isSegmentation: true, //写死,后端用
      },
      // callback: () => {
      //   this.setState({
      //     treeLoding: false
      //   })
      // }
    });
  }

  checkIndex = (clickIndex) => {
    this.setState(
      {
        clickIndex,
      },
      () => {
        this.changeTypeVisible();
      },
    );
  };

  //更改分数
  changeQuestionScore = (index, e) => {
    console.log(e.target.value);
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[index].questionNo = e.target.value;
    // this.setState({
    //     list: newList,
    // })
    console.log(newList, "12");
    this.props.updateList(newList);
  };

  sureScore = () => {
    const { clickIndex } = this.state;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[clickIndex].knowLedge = this.state.selectTree;
    this.setState({
      numberVisible: false,
      selectTree: false,
    });
    this.props.updateList(newList);
  };
  // 同步分数
  downScore = () => {
    const { clickIndex } = this.state;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    let number_ = Number.parseInt(
      this.state.score || newList[clickIndex].questionScore,
      10,
    );
    newList[clickIndex].questionScore = number_;
    newList.map((item, index) => {
      if (
        index > clickIndex &&
        number_ &&
        item.questionType !== 1 &&
        !item.haveSon
      ) {
        item.questionScore = number_;
      }
    });
    this.setState({
      numberVisible: false,
      score: null,
    });

    this.props.updateList(newList);
  };

  cancelNo = () => {
    this.setState({
      numberVisible: false,
      score: null,
      selectTree: [],
    });
  };
  changeScore = (e) => {
    console.log(e.target.value, "eee");
    this.setState({
      score: e.target.value,
    });
  };
  focusQuestionScore = (index, list) => {
    this.setState({
      numberVisible: true,
      clickIndex: index,
      selectTree: list || [],
    });
  };
  knowledgeChange = (value, label, extra) => {
    console.log("onChange", value);
    this.setState({
      selectTree: value,
      selectTreeValue: label,
    });
  };
  //上一题
  prev = () => {
    const { clickIndex } = this.state;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[clickIndex].knowLedge = this.state.selectTree;
    this.props.updateList(newList);
    let ind = clickIndex;
    for (var index = newList.length; index > 0; index--) {
      if (index < clickIndex) {
        ind = index;
        if (!newList[index].haveSon && newList[index].questionType !== 1) {
          break;
        }
      }
    }
    this.setState({
      clickIndex: ind,
      selectTree: this.props.list[ind].knowLedge || [],
    });
  };
  //下一题
  next = () => {
    const { clickIndex } = this.state;
    let ind = clickIndex;
    this.props.list.some((item, index) => {
      if (index > clickIndex) {
        ind = index;
        if (!item.haveSon && item.questionType !== 1) {
          return true;
        }
      }
    });
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[clickIndex].knowLedge = this.state.selectTree;
    this.props.updateList(newList);
    console.log(ind, "dd");
    this.setState({
      clickIndex: ind,
      selectTree: this.props.list[ind].knowLedge || [],
    });
  };
  render() {
    const { clickIndex } = this.state;
    const { list, treeData } = this.props;
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px",
      color: "#01113d",
      fontFamily: "PingFangSC-Medium",
      fontSize: "18px",
    };
    console.log(this.state.typeVisible, list, treeData, "111");
    const tProperties = {
      treeData: treeData,
      value: this.state.selectTree,
      onChange: this.knowledgeChange,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: trans("global.pleaseChoose", "请选择"),
      showSearch: true,
      getPopupContainer: () => document.querySelector("#knowLedgeDom"),
      style: {
        maxWidth: "200px",
        minWidth: "200px",
      },
    };
    return (
      <div className={styles.structureBox}>
        <div className={styles.structureHeader}>
          <div
            className={styles.structureHeaderButton}
            onClick={this.addListFirst}
          >
            {trans("mark.addFirstRow", "添加首行")}
          </div>
        </div>
        <div className={styles.structureContent}>
          <div className={styles.structureTh}>
            <div className={styles.thTd}>
              {trans("global.lineNumber", "行号")}
            </div>
            <div className={styles.thTd}>
              {trans("mark.questionNumber", "题号")}
            </div>
            <div className={styles.thFlexTd}>
              {trans("singleInput.knowledgeTree", "知识点")}
            </div>
            <div className={styles.thFlexTd}>{trans("mark.label", "标签")}</div>
          </div>
          <div id={"knowLedgeDom"} className={styles.modalDom}>
            {list && list.length > 0
              ? list.map((item, index) =>
                  item.haveSon ? null : (
                    <div className={styles.structureListItem}>
                      <div style={{ width: "60px" }} className={styles.itemTd}>
                        {index + 1}
                      </div>
                      <div style={{ width: "60px" }} className={styles.itemTd}>
                        {item.questionType == 1 ? (
                          <span
                            style={{ width: "60px" }}
                            className={styles.flexTdSpan}
                          >
                            {item.questionName}
                          </span>
                        ) : item.isSon ? (
                          <span
                            style={{ width: "60px" }}
                            className={styles.flexTdSpan}
                          >
                            {item.parentQuestionNo}.{item.sonQuestionNo}
                          </span>
                        ) : (
                          <span
                            style={{ width: "60px" }}
                            className={styles.flexTdSpan}
                          >
                            {item.questionNo}
                          </span>
                        )}
                      </div>

                      <div className={styles.itemFlexTd}>
                        <span
                          style={{ width: "80px" }}
                          className={[
                            styles.flexTdSpan,
                            clickIndex == index ? styles.clickSpan : "",
                          ].join(" ")}
                          onClick={this.focusQuestionScore.bind(
                            this,
                            index,
                            item.knowLedge,
                          )}
                        >
                          {item.knowLedge && item.knowLedge.length > 0
                            ? item.knowLedge.length
                            : "0"}
                          {trans("global.personUnit", "个")}
                        </span>
                      </div>
                      <div className={styles.itemFlexTd}>
                        <span
                          style={{ width: "80px" }}
                          className={[
                            styles.flexTdSpan,
                            clickIndex == index ? styles.clickSpan : "",
                          ].join(" ")}
                          onClick={this.focusQuestionScore.bind(
                            this,
                            index,
                            item.knowLedge,
                          )}
                        >
                          {item.knowLedge && item.knowLedge.length > 0
                            ? item.knowLedge.length
                            : "0"}
                          {trans("global.personUnit", "个")}
                        </span>
                      </div>
                    </div>
                  ),
                )
              : null}
            <Modal
              visible={this.state.numberVisible}
              title={null}
              footer={null}
              closable={false}
              width={400}
              mask={false}
              getContainer={document.querySelector("#knowLedgeDom")}
              maskClosable={false}
            >
              <TreeSelect {...tProperties} />
              <div className={styles.changeQuestionPop}>
                <div className={styles.typePopButton} onClick={this.prev}>
                  {trans("mark.previousQuestion", "上一题")}
                </div>
                <div className={styles.typePopButton} onClick={this.next}>
                  {trans("mark.nextQuestion", "下一题")}
                </div>
              </div>
              <div className={styles.typePop}>
                <div className={styles.typePopButton} onClick={this.sureScore}>
                  {trans("global.sure", "确定")}
                </div>
                <div className={styles.typePopButton} onClick={this.cancelNo}>
                  {trans("global.cancel", "取消")}
                </div>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    );
  }
}

export default KnowLedge;

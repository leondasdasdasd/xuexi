// 题目结构
import React from "react";
import { Input, Modal } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./markScore.module.less";

class MarkScore extends React.Component {
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

  componentDidMount() {}

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
    // console.log(e.target.value)
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
    let number_ = Number.parseFloat(this.state.score);
    newList[clickIndex].questionScore = number_;
    this.setState({
      numberVisible: false,
      score: null,
    });
    this.props.updateList(newList);
  };
  // 同步分数
  downScore = () => {
    const { clickIndex } = this.state;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    let number_ = Number.parseFloat(
      this.state.score || newList[clickIndex].questionScore,
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
    });
  };
  changeScore = (e) => {
    console.log(e.target.value, "eee");
    this.setState({
      score: e.target.value,
    });
  };
  focusQuestionScore = (index) => {
    this.setState({
      numberVisible: true,
      clickIndex: index,
    });
  };

  render() {
    const { clickIndex } = this.state;
    const { list } = this.props;
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px",
      color: "#01113d",
      fontFamily: "PingFangSC-Medium",
      fontSize: "18px",
    };
    console.log(this.state.typeVisible, list, "111");
    return (
      <div className={styles.structureBox}>
        {/* <div className={styles.structureHeader}>
                    <div className={styles.structureHeaderButton} onClick={this.addListFirst}>添加首行</div>
                </div> */}
        <div className={styles.structureContent}>
          <div className={styles.structureTh}>
            <div className={styles.thTd}>
              {trans("global.lineNumber", "行号")}
            </div>
            <div className={styles.thTd}>
              {trans("analysis.questionIndex", "题号")}
            </div>
            <div className={styles.thFlexTd}>
              {trans("global.score", "分数")}
            </div>
          </div>
          <div id={"modalDom"} className={styles.modalDom}>
            {list && list.length > 0
              ? list.map((item, index) =>
                  item.haveSon ? null : item.questionType === 1 ? (
                    <div className={styles.structureListItem}>
                      <div style={{ width: "60px" }} className={styles.itemTd}>
                        {index + 1}
                      </div>

                      <div className={styles.itemFlexTd}>
                        {item.questionName}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.structureListItem}>
                      <div style={{ width: "60px" }} className={styles.itemTd}>
                        {index + 1}
                      </div>
                      <div style={{ width: "60px" }} className={styles.itemTd}>
                        {item.isSon ? (
                          <span
                            style={{ width: "60px" }}
                            className={styles.flexTdSpan}
                          >
                            {item.parentQuestionName}.{item.sonQuestionNo}
                          </span>
                        ) : (
                          <span
                            style={{ width: "60px" }}
                            className={styles.flexTdSpan}
                          >
                            {item.questionName || item.questionNo}
                          </span>
                        )}
                      </div>

                      <div className={styles.itemFlexTd}>
                        <span
                          style={{ width: "80px" }}
                          className={styles.flexTdSpan}
                          onClick={this.focusQuestionScore.bind(this, index)}
                        >
                          {item.questionScore
                            ? item.questionScore
                            : trans("mark.enterScore", "请输入分数")}
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
              width={200}
              mask={false}
              getContainer={document.querySelector("#modalDom")}
              maskClosable={false}
            >
              <Input onChange={this.changeScore} value={this.state.score} />
              <div className={styles.typePop}>
                <div className={styles.typePopButton} onClick={this.sureScore}>
                  {trans("global.sure", "确定")}
                </div>
                <div className={styles.typePopButton} onClick={this.downScore}>
                  {trans("mark.syncDown", "向下同步")}
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

export default MarkScore;

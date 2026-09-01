// 题目结构
import React from "react";
import { Checkbox, Input, InputNumber, Modal, Radio } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./structure.module.less";

const typeList = {
  1: trans("evaluation.majorTopic", "大题"),
  2: trans("mark.answerAndScoringArea", "作答与打分区"),
  3: trans("global.pack", "填空题"),
  4: trans("global.multipleChoice", "选择题"),
  5: trans("global.check", "多选题"),
  6: trans("global.judge", "判断题"),
  7: trans("global.other", "其他"),
};
class Structure extends React.Component {
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
  //选择打标类型
  changeQuestionType = (e) => {
    // this.setState({
    //     markValue: e.target.value,
    // });
    const { clickIndex } = this.state;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[clickIndex].questionType = e.target.value;
    this.setState({
      questionType: e.target.value,
    });
    let number_ = 1;
    newList.map((item, ind) => {
      if (item.questionType === 1) {
        item.questionNo = "";
      } else {
        if (item.isSon) {
          item.parentQuestionName =
            newList[item.parentQuestionIndex].questionName ||
            newList[item.parentQuestionIndex].questionNo;
          item.parentQuestionNo = newList[item.parentQuestionIndex].questionNo;
        } else {
          item.questionNo = number_;
          number_ += 1;
        }
      }
    });
    this.setState({
      list: newList,
    });
  };
  sure = () => {
    this.props.updateList(this.state.list);
    this.changeTypeVisible();
  };
  //同步题型
  sureDown = () => {
    const { clickIndex, questionType } = this.state;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[clickIndex].questionType = questionType;
    newList.map((item, index) => {
      if (index > clickIndex) {
        item.questionType = questionType;
      }
    });
    let number_ = 1;
    newList.map((item, ind) => {
      if (item.questionType === 1) {
        item.questionNo = "";
      } else {
        if (item.isSon) {
          item.parentQuestionName =
            newList[item.parentQuestionIndex].questionName ||
            newList[item.parentQuestionIndex].questionNo;
          item.parentQuestionNo = newList[item.parentQuestionIndex].questionNo;
        } else {
          item.questionNo = number_;
          number_ += 1;
        }
      }
    });
    this.changeTypeVisible();
    this.props.updateList(newList);
  };
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
  //控制题目类型显隐
  changeTypeVisible = () => {
    this.setState({
      questionType: null,
      typeVisible: !this.state.typeVisible,
    });
  };
  //更改小题号
  changeQuestionNo = (index, value) => {
    console.log(value);
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[index].questionName = value;
    // this.setState({
    //     list: newList,
    // })
    console.log(newList, "12");
    this.props.updateList(newList);
  };
  // 更改大题名称
  changeQuestionName = (index, e) => {
    console.log(e.target.value);
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[index].questionName = e.target.value;
    // this.setState({
    //     list: newList,
    // })
    console.log(newList, "12");
    this.props.updateList(newList);
  };
  // 同步小题号
  downNo = () => {
    const { clickIndex } = this.state;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    let number_ = Number.parseInt(newList[clickIndex].questionName, 10);
    newList.map((item, index) => {
      if (index > clickIndex && number_) {
        if (
          item.questionType === newList[clickIndex].questionType &&
          !item.isSon
        ) {
          number_ += 1;
          item.questionName = number_;
        } else if (
          item.isSon &&
          item.parentQuestionIndex !== undefined &&
          item.parentQuestionIndex !== null
        ) {
          item.parentQuestionName =
            newList[item.parentQuestionIndex].questionName;
          item.parentQuestionNo = newList[item.parentQuestionIndex].questionNo;
        }
      }
    });
    this.setState({
      numberVisible: false,
      issonNum: false,
      sonNum: null,
    });

    this.props.updateList(newList);
  };
  downSon = () => {
    const { clickIndex, sonNum } = this.state;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    let number_ = Number.parseInt(sonNum, 10);
    let parent = newList[clickIndex].questionName;
    let list = [];
    if (number_) {
      for (var index = 0; index < number_; index++) {
        list.push({
          questionNo: null,
          haveSon: false,
          isSon: true,
          questionName: "",
          questionType: null,
          sonQuestionNo: index + 1,
          parentQuestionName: parent,
          parentQuestionNo: newList[clickIndex].questionNo,
          parentQuestionIndex: this.state.clickIndex,
          questionDraw: [],
        });
      }
      const li = newList.splice(
        clickIndex + 1,
        newList.length - (clickIndex + 1),
      );
      console.log(li, newList, list, clickIndex, "hhb");
      newList = newList.concat(list).concat(li);
    }
    this.setState({
      numberVisible: false,
      issonNum: false,
      sonNum: null,
    });
    this.props.updateList(newList);
  };
  // 是否有子题
  changeSon = (index, e) => {
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[index].haveSon = e.target.checked;
    this.setState({
      numberVisible: true,
      issonNum: true,
      clickIndex: index,
    });
    this.props.updateList(newList);
  };
  cancelNo = () => {
    this.setState({
      numberVisible: false,
      issonNum: false,
      questionNum: null,
    });
  };
  cancelAdd = () => {
    this.setState({
      addVisible: false,
      clickIndex: 0,
      sonNum: null,
    });
  };
  downAdd = () => {
    const { clickIndex, questionNum } = this.state;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    let number_ = Number.parseInt(questionNum, 10);
    let list = [];
    if (number_) {
      for (var index = 0; index < number_; index++) {
        list.push({
          questionNo: null,
          haveSon: false,
          isSon: false,
          questionName: "",
          questionType: null,
          sonQuestionNo: null,
          questionDraw: [],
        });
      }
      const li = newList.splice(
        clickIndex + 1,
        newList.length - (clickIndex + 1),
      );
      console.log(li, newList, list, clickIndex, "hhb");
      newList = newList.concat(list).concat(li);
      let newNumber = 1;
      newList.map((item) => {
        if (item.questionType === 1) {
          item.questionNo = "";
        } else {
          if (!item.isSon) {
            item.questionNo = newNumber;
            newNumber += 1;
          }
        }
      });
      console.log(newList, "1111");
      this.setState({
        addVisible: false,
        clickIndex: 0,
        questionNum: null,
      });
      this.props.updateList(newList);
    }
  };
  changeSonNum = (e) => {
    this.setState({
      sonNum: e.target.value,
    });
  };
  addQuestion = (e) => {
    this.setState({
      questionNum: e.target.value,
    });
  };
  addListFirst = () => {
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList.unshift({
      number: 1,
      questionNo: null,
      haveSon: false,
      isSon: false,
      questionName: "",
      questionType: null,
      questionDraw: [],
    });
    this.props.updateList(newList);
  };
  focusQuestionNo = (index) => {
    this.setState({
      numberVisible: true,
      clickIndex: index,
    });
  };
  // 点击添加
  clickAdd = (index) => {
    this.setState({
      addVisible: true,
      clickIndex: index,
    });
  };
  // 点击删除
  deleteItem = (index) => {
    const { indexImg } = this.props;
    let newList = JSON.parse(JSON.stringify(this.props.list));
    let newArray = [];
    newList.map((item, ind) => {
      if (item.isSon && item.parentQuestionIndex == index) {
        console.log(ind, "1111");
        newArray.push(ind);
        // newList.splice(ind, 1);
      }
    });
    let filteredArray = newList.filter(
      (item, index) => !newArray.includes(index),
    );
    filteredArray.splice(index, 1);

    // this.props.updateList(filteredArray);
    let newCo = [];
    if (indexImg && indexImg.length > 0) {
      indexImg.map((item, index) => {
        let list = [];
        if (filteredArray && filteredArray.length > 0) {
          filteredArray.map((it) => {
            if (it.questionDraw && it.questionDraw.length > 0) {
              it.questionDraw.map((index_) => {
                if (index_ && index_.page == index + 1) {
                  list.push(index_);
                }
              });
            }
          });
        }
        newCo[index] = list;
      });
    }
    let number_ = 1;
    filteredArray.map((item, ind) => {
      if (item.questionType === 1) {
        item.questionNo = "";
      } else {
        if (item.isSon) {
          if (item.parentQuestionIndex + 1 > index) {
            item.parentQuestionIndex -= 1;
            item.parentQuestionName =
              filteredArray[item.parentQuestionIndex].questionName == ""
                ? filteredArray[item.parentQuestionIndex].questionNo
                : filteredArray[item.parentQuestionIndex].questionName;
            item.parentQuestionNo =
              filteredArray[item.parentQuestionIndex].questionNo;
          }
        } else {
          item.questionNo = number_;
          number_ += 1;
        }
      }
    });
    console.log(filteredArray, newCo, "111hh");
    this.props.updateCoList(filteredArray, newCo);
  };
  render() {
    const { clickIndex } = this.state;
    const { list, markValue } = this.props;
    const radioStyle = {
      display: "block",
      height: "30px",
      lineHeight: "30px",
      color: "#01113d",
      fontFamily: "PingFangSC-Medium",
      fontSize: "18px",
    };
    console.log(this.state.typeVisible, list, "111");
    const radioList =
      markValue == 1
        ? [
            { name: trans("evaluation.majorTopic", "大题"), value: 1 },
            {
              name: trans("mark.answerAndScoringArea", "作答与打分区"),
              value: 2,
            },
          ]
        : [
            { name: trans("evaluation.majorTopic", "大题"), value: 1 },
            { name: trans("global.pack", "填空题"), value: 3 },
            { name: trans("global.multipleChoice", "选择题"), value: 4 },
            { name: trans("global.check", "多选题"), value: 5 },
            { name: trans("global.judge", "判断题"), value: 6 },
            { name: trans("global.other", "其他"), value: 7 },
          ];
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
              {trans("mark.subQuestionNumber", "小题号")}
            </div>
            <div className={styles.thTd}>
              {trans("mark.childQuestionNumber", "子题号")}
            </div>
            <div className={styles.thFlexTd}>
              {trans("global.questionType", "题目类型")}
            </div>
            <div className={styles.thTd}>{trans("global.option", "操作")}</div>
          </div>
          <div id={"modalDom"} className={styles.modalDom}>
            {list && list.length > 0
              ? list.map((item, index) => (
                  <div className={styles.structureListItem}>
                    <div
                      style={
                        item.isSon ? { width: "120px" } : { width: "60px" }
                      }
                      className={styles.itemTd}
                    >
                      {index + 1}
                    </div>
                    {item.questionType === 1 ? (
                      <div style={{ width: "120px" }} className={styles.itemTd}>
                        <Input
                          style={{ width: "100px", height: "30px" }}
                          onChange={this.changeQuestionName.bind(this, index)}
                          value={item.questionName}
                        />
                      </div>
                    ) : item.isSon ? null : (
                      <div style={{ width: "60px" }} className={styles.itemTd}>
                        <InputNumber
                          style={{ width: "60px", height: "30px" }}
                          placeholder={trans("mark.questionNumber", "题号")}
                          onChange={this.changeQuestionNo.bind(this, index)}
                          value={item.questionName || item.questionNo}
                          onFocus={this.focusQuestionNo.bind(this, index)}
                        />
                      </div>
                    )}
                    {item.questionType === 1 ? null : (
                      <div style={{ width: "60px" }} className={styles.itemTd}>
                        {item.isSon ? (
                          <div>{item.sonQuestionNo}</div>
                        ) : (
                          <Checkbox
                            checked={item.haveSon}
                            onChange={this.changeSon.bind(this, index)}
                          />
                        )}
                      </div>
                    )}
                    <div
                      className={styles.itemFlexTd}
                      onClick={this.checkIndex.bind(this, index)}
                    >
                      {item.questionType
                        ? typeList[item.questionType]
                        : trans("paper.typeRequired", "请选择类型")}
                    </div>
                    <div style={{ width: "60px" }} className={styles.itemTd}>
                      <span
                        className={styles.add}
                        onClick={this.clickAdd.bind(this, index)}
                      >
                        {trans("mark.add", "加")}
                      </span>
                      <span
                        className={styles.delete}
                        onClick={this.deleteItem.bind(this, index)}
                      >
                        {trans("mark.subtract", "减")}
                      </span>
                    </div>
                  </div>
                ))
              : null}
            <Modal
              visible={this.state.typeVisible}
              title={null}
              footer={null}
              closable={false}
              width={200}
              mask={false}
              getContainer={document.querySelector("#modalDom")}
              maskClosable={false}
            >
              <div className={styles.typePop}>
                <Radio.Group
                  onChange={this.changeQuestionType}
                  value={this.state.questionType}
                >
                  {radioList.map((ii, ind) => (
                    <Radio style={radioStyle} value={ii.value} key={ind}>
                      {ii.name}
                    </Radio>
                  ))}
                </Radio.Group>
                <div className={styles.typePopButton} onClick={this.sure}>
                  {trans("global.sure", "确定")}
                </div>
                <div className={styles.typePopButton} onClick={this.sureDown}>
                  {trans("mark.syncDown", "向下同步")}
                </div>
                <div
                  className={styles.typePopButton}
                  onClick={this.changeTypeVisible}
                >
                  {trans("global.cancel", "取消")}
                </div>
              </div>
            </Modal>
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
              {this.state.issonNum ? (
                <Input onChange={this.changeSonNum} value={this.state.sonNum} />
              ) : null}
              <div className={styles.typePop}>
                <div
                  className={styles.typePopButton}
                  onClick={this.state.issonNum ? this.downSon : this.downNo}
                >
                  {this.state.issonNum
                    ? trans("global.sure", "确定")
                    : trans("mark.syncDown", "向下同步")}
                </div>
                <div className={styles.typePopButton} onClick={this.cancelNo}>
                  {trans("global.cancel", "取消")}
                </div>
              </div>
            </Modal>
            <Modal
              visible={this.state.addVisible}
              title={null}
              footer={null}
              closable={false}
              width={200}
              mask={false}
              getContainer={document.querySelector("#modalDom")}
              maskClosable={false}
            >
              <Input
                onChange={this.addQuestion}
                value={this.state.questionNum}
              />
              <div className={styles.typePop}>
                <div className={styles.typePopButton} onClick={this.downAdd}>
                  {this.state.issonNum
                    ? trans("global.sure", "确定")
                    : trans("mark.syncDown", "向下同步")}
                </div>
                <div className={styles.typePopButton} onClick={this.cancelAdd}>
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

export default Structure;

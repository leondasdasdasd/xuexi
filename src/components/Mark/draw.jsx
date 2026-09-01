// 打标类型
import React from "react";
import { Checkbox } from "antd";

import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./draw.module.less";

class Draw extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
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
  changeRadio = (e) => {
    // this.setState({
    //     markValue: e.target.value,
    // });
    this.props.changeMarkType(e.target.value);
  };
  // 是否跨页
  changePage = (index, e) => {
    let newList = JSON.parse(JSON.stringify(this.props.list));
    newList[index].ifTwoPage = e.target.checked;
    this.props.updateList(newList);
  };
  changestu = (e) => {
    console.log(e, "ee");
    this.props.changeStu(e.target.checked);
  };
  delDraw = (index) => {
    const { list, coordinates, checkIndex } = this.props;
    let number_ = null;
    let newLi = JSON.parse(JSON.stringify(coordinates));
    let propertyList = JSON.parse(JSON.stringify(list));
    let number = null;
    let li = null;
    if (propertyList && propertyList.length > 0) {
      number_ = 0;
      propertyList.map((item, ind) => {
        if (!item.haveSon && item.questionType !== 1) {
          number_ += 1;
          if (index + 1 == number_) {
            li = item.questionDraw[0];
            item.questionDraw[0] = null;
          }
          if (item.ifTwoPage) {
            number_ += 1;
            if (index + 1 == number_) {
              li = item.questionDraw[1];
              item.questionDraw[1] = null;
            }
          }
        }
      });
    }
    console.log(li, newLi, "coo");
    if (newLi && newLi.length > 0) {
      newLi.map((item) => {
        if (item && item.length > 0) {
          item.map((it, index) => {
            if (it.id == li.id) {
              item.splice(index, 1);
            }
          });
        }
      });
    }
    this.props.updateCoList(propertyList, newLi);
  };
  rendercoordNo = (index) => {
    const { list, coordinates, checkIndex } = this.props;
    let number_ = null;
    let number = null;
    let li = null;
    if (list && list.length > 0) {
      number_ = 0;
      list.map((item, ind) => {
        li = [];
        if (!item.haveSon && item.questionType !== 1) {
          number_ += 1;

          if (item.ifTwoPage) {
            number_ += 1;
          }
        }
        if (index == ind) {
          if (item.ifTwoPage) {
            li.push(number_ - 1, number_);
            // if(coordinates[num - 2]) {
            number = li;
            // }
          } else {
            li.push(number_);
            // if(coordinates[num - 1]) {
            number = li;
            // }
          }
        }
      });
    }
    console.log(index, number_, number, li, checkIndex, "121");
    return (
      <span>
        {number && number.length > 0
          ? number.map((item, ind) => (
              <span
                onClick={this.checkDraw.bind(this, item - 1, number_)}
                className={[
                  checkIndex + 1 == item
                    ? styles.isCheck
                    : list[index].questionDraw &&
                        list[index].questionDraw.length > 0 &&
                        list[index].questionDraw[ind]
                      ? styles.drawed
                      : styles.noDraw,
                  styles.quart,
                ].join(" ")}
              >
                {trans("mark.boxWithNumber", "框{$number}", { number: item })}
                <i
                  onClick={this.delDraw.bind(this, item - 1)}
                  className={[styles.delQuart, icon.iconfont].join(" ")}
                >
                  &#xe6cd;
                </i>
              </span>
            ))
          : null}
      </span>
    );
  };
  checkDraw = (index) => {
    this.props.checkStu(false);
    this.props.checkDraw(index);
  };
  checkStu = () => {
    this.props.checkStu(true);
  };
  render() {
    const { list, coordinates } = this.props;
    console.log(this.props.ifStu, "ff");
    return (
      <div className={styles.drawBox}>
        <div className={styles.drawContent}>
          <div className={styles.drawTh}>
            <div className={styles.thTd}>
              {trans("global.lineNumber", "行号")}
            </div>
            <div className={styles.thTd}>{trans("mark.question", "题目")}</div>
            <div className={styles.thFlexTd}>{trans("mark.box", "框")}</div>
          </div>

          <div className={styles.drawDom}>
            <div className={styles.structureListItem}>
              <div style={{ width: "150px" }} className={styles.itemTd}>
                <Checkbox
                  checked={this.props.ifStu}
                  onChange={this.changestu.bind(this)}
                >
                  {trans("mark.studentInfoBox", "学生信息框")}
                </Checkbox>
              </div>

              <div className={styles.itemFlexTd} style={{ height: "31px" }}>
                {this.props.ifStu ? (
                  <span
                    onClick={this.checkStu.bind(this)}
                    className={[
                      this.props.ifCheck
                        ? styles.isCheck
                        : this.props.studentCodeAreaList.length > 0
                          ? styles.drawed
                          : styles.noDraw,
                      styles.quart,
                    ].join(" ")}
                  >
                    {trans("mark.infoBox", "信息框")}
                  </span>
                ) : null}
              </div>
            </div>
            {list && list.length > 0
              ? list.map((item, index) =>
                  item.haveSon ? null : (
                    <div className={styles.structureListItem}>
                      <div style={{ width: "60px" }} className={styles.itemTd}>
                        {index + 1}
                      </div>
                      {item.questionType == 1 ? (
                        <div className={styles.itemFlexTd}>
                          <span
                            style={{ width: "60px" }}
                            className={styles.flexTdSpan}
                          >
                            {item.questionName}
                          </span>
                        </div>
                      ) : (
                        <div className={styles.itemFlexTd}>
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
                          <span
                            style={{ width: "80px" }}
                            className={styles.flexTdSpan}
                          >
                            <Checkbox
                              checked={item.ifTwoPage}
                              onChange={this.changePage.bind(this, index)}
                            >
                              {trans("mark.crossPage", "跨页")}
                            </Checkbox>
                          </span>
                          {this.rendercoordNo(index)}
                        </div>
                      )}
                    </div>
                  ),
                )
              : null}
          </div>
        </div>
      </div>
    );
  }
}

export default Draw;

import React, { Component, Fragment } from "react";
import { Checkbox } from "antd";

import { locale, trans } from "../../../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

class SuperSelector extends Component {
  constructor(properties) {
    super(properties);

    this.state = {
      classIndex: 0,
    };
  }
  componentDidMount() {
    this.props.onRef(this);
  }

  changeParentState = (e, item) => {
    let cloneSelectedKeys =
      JSON.parse(JSON.stringify(this.props.selectedKeys)) || [];
    if (e.target.checked) {
      if (item?.studentInfoResponseList?.length) {
        for (
          let index = 0;
          index < item.studentInfoResponseList.length;
          index++
        ) {
          const element = item?.studentInfoResponseList[index];
          if (!cloneSelectedKeys.includes(element.studentId)) {
            cloneSelectedKeys.push(element.studentId);
          }
        }
      }
    } else {
      if (item?.studentInfoResponseList?.length) {
        for (
          let index = 0;
          index < item.studentInfoResponseList.length;
          index++
        ) {
          const element = item?.studentInfoResponseList[index];
          for (const [index_, id] of cloneSelectedKeys.entries()) {
            if (id == element.studentId) {
              cloneSelectedKeys.splice(index_, 1);
            }
          }
        }
      }
    }
    this.props.onChange && this.props.onChange(cloneSelectedKeys);
  };

  changeChildState = (e, item) => {
    let cloneSelectedKeys =
      JSON.parse(JSON.stringify(this.props.selectedKeys)) || [];
    if (e.target.checked) {
      cloneSelectedKeys.push(item.studentId);
    } else {
      for (const [index, id] of cloneSelectedKeys.entries()) {
        if (id === item.studentId) {
          cloneSelectedKeys.splice(index, 1);
        }
      }
    }
    this.props.onChange && this.props.onChange(cloneSelectedKeys);
  };

  getParentState = (item) => {
    if (item?.studentInfoResponseList && item?.studentInfoResponseList.length) {
      let flag = true;
      for (
        let index = 0;
        index < item.studentInfoResponseList.length;
        index++
      ) {
        const element = item.studentInfoResponseList[index];
        if (!this.props.selectedKeys.includes(element.studentId)) {
          // 当前父级的子元素没有被完全选中
          flag = false;
        }
      }
      return flag;
    }
  };

  getIndeterminateState = (item) => {
    if (item?.studentInfoResponseList && item?.studentInfoResponseList.length) {
      let number_ = 0;
      for (
        let index = 0;
        index < item.studentInfoResponseList.length;
        index++
      ) {
        const element = item.studentInfoResponseList[index];
        if (this.props.selectedKeys.includes(element.studentId)) {
          // 当前父级的子元素被选中的个数
          number_ += 1;
        }
      }
      return number_ == item?.studentInfoResponseList?.length || number_ == 0
        ? false
        : true;
    }
  };

  getChildElementState = (item) => {
    if (this.props.selectedKeys?.includes(item.studentId)) {
      return true;
    }
    return false;
  };

  changeAllParentState = (e) => {
    let cloneSelectedKeys =
      JSON.parse(JSON.stringify(this.props.selectedKeys)) || [];
    if (e.target.checked) {
      if (this.props.treeData && this.props.treeData.length > 0) {
        for (const item of this.props.treeData) {
          if (
            item.studentInfoResponseList &&
            item?.studentInfoResponseList.length
          ) {
            for (const item1 of item.studentInfoResponseList) {
              if (!this.props.selectedKeys?.includes(item1.studentId)) {
                cloneSelectedKeys.push(item1.studentId);
              }
            }
          }
        }
      }
    } else {
      if (this.props.treeData && this.props.treeData.length > 0) {
        for (const item of this.props.treeData) {
          if (
            item.studentInfoResponseList &&
            item?.studentInfoResponseList.length
          ) {
            for (const item1 of item.studentInfoResponseList) {
              for (const [index, id] of cloneSelectedKeys.entries()) {
                if (id == item1.studentId) {
                  cloneSelectedKeys.splice(index, 1);
                }
              }
            }
          }
        }
      }
    }
    this.props.onChange && this.props.onChange(cloneSelectedKeys);
  };

  getAllParentState = () => {
    if (this.props.treeData && this.props.treeData.length > 0) {
      let number_ = 0;
      let number1 = 0;
      for (const item of this.props.treeData) {
        if (
          item.studentInfoResponseList &&
          item?.studentInfoResponseList.length
        ) {
          number1 += item.studentInfoResponseList.length;
          for (const item1 of item.studentInfoResponseList) {
            if (this.props.selectedKeys?.includes(item1.studentId)) {
              number_ += 1;
            }
          }
        }
      }
      if (number_ == number1) {
        return true;
      }
    }
  };

  getAllIndeterminateState = () => {
    if (this.props.treeData && this.props.treeData.length > 0) {
      let number_ = 0;
      let number1 = 0;
      for (const item of this.props.treeData) {
        if (
          item.studentInfoResponseList &&
          item?.studentInfoResponseList.length
        ) {
          number1 += item.studentInfoResponseList.length;
          for (const item1 of item.studentInfoResponseList) {
            if (this.props.selectedKeys?.includes(item1.studentId)) {
              number_ += 1;
            }
          }
        }
      }
      return number_ == number1 || number_ == 0 ? false : true;
    }
  };

  getNumber = (item) => {
    let number_ = 0;
    if (item.studentInfoResponseList && item?.studentInfoResponseList.length) {
      for (const item1 of item.studentInfoResponseList) {
        if (this.props.selectedKeys?.includes(item1.studentId)) {
          number_ += 1;
        }
      }
    }
    return number_;
  };

  render() {
    const { classIndex } = this.state;
    const { selectedKeys, treeData = [] } = this.props;
    return (
      <div className={styles.stuModal}>
        <div className={styles.allClass}>
          <div className={styles.allGroups}>
            {this.props.currentTab == "全部" ? null : (
              <Checkbox
                onChange={this.changeAllParentState}
                checked={this.getAllParentState()}
                indeterminate={this.getAllIndeterminateState()}
              ></Checkbox>
            )}

            <span className={styles.allGroupCheck}>
              &nbsp; {trans("global.allGroups", "所有组")}
              {this.props.currentTab == "全部" ? null : (
                <span style={{ marginLeft: "8px" }}>
                  {selectedKeys?.length ? `(${selectedKeys?.length})` : null}
                </span>
              )}
            </span>
          </div>

          <div className={styles.classArr}>
            {treeData &&
              treeData.length > 0 &&
              treeData.map((item, index) => (
                <div
                  className={`${styles.classNames} ${index == this.state.classIndex ? styles.active : ""}`}
                  key={index}
                  onClick={() => this.setState({ classIndex: index })}
                >
                  <div>
                    {this.props.currentTab == "全部" ? null : (
                      <Checkbox
                        indeterminate={this.getIndeterminateState(item)}
                        onChange={(e) => this.changeParentState(e, item)}
                        checked={this.getParentState(item)}
                      ></Checkbox>
                    )}
                    <span className={styles.stuNameBox}>
                      {item.groupName}
                      {this.props.currentTab == "全部" ? null : (
                        <>
                          {" "}
                          &nbsp;
                          {this.getNumber(item)
                            ? `(${this.getNumber(item)})`
                            : null}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className={styles.allStu}>
          <div
            className={styles.allGroupCheck}
            style={{ marginBottom: "15px" }}
          >
            {this.props.currentTab == "全部" ? null : (
              <Checkbox
                indeterminate={this.getIndeterminateState(treeData[classIndex])}
                onChange={(e) =>
                  this.changeParentState(e, treeData[classIndex])
                }
                checked={this.getParentState(treeData[classIndex])}
              ></Checkbox>
            )}
            <span className={styles.stuName}>
              {trans("global.allStudents", "所有学生")}
            </span>
          </div>

          <div className={styles.allStuNames1}>
            {treeData &&
            treeData[classIndex] &&
            treeData[classIndex].studentInfoResponseList &&
            treeData[classIndex].studentInfoResponseList.length > 0
              ? treeData[classIndex].studentInfoResponseList.map((item) => {
                  return (
                    <div className={styles.stuNames} key={item.studentId}>
                      {this.props.currentTab == "全部" ? null : (
                        <Checkbox
                          onChange={(e) => this.changeChildState(e, item)}
                          checked={this.getChildElementState(item)}
                        ></Checkbox>
                      )}
                      <span className={styles.stuName}>{item.name}</span>
                      {this.props.currentTab == "全部" ? (
                        <span style={{ float: "right", marginRight: "10px" }}>
                          {
                            {
                              1: (
                                <span style={{ color: "#04C919" }}>
                                  {trans("global.SentSuccessfully", "发送成功")}
                                </span>
                              ),
                              2: (
                                <span style={{ color: "#FC491E" }}>
                                  {trans("global.SendingFailed", "发送失败")}
                                </span>
                              ),
                              4: (
                                <soan
                                  style={{ color: " rgba(1, 17, 61, 0.6479)" }}
                                >
                                  {trans("pupllAnalyse.withdrawn", "已撤回")}
                                </soan>
                              ),
                              3: (
                                <soan
                                  style={{ color: " rgba(1, 17, 61, 0.6479)" }}
                                >
                                  {trans("pupllAnalyse.withdrawing", "撤回中")}
                                </soan>
                              ),
                              0: (
                                <span
                                  style={{ color: " rgba(1, 17, 61, 0.6479)" }}
                                >
                                  {trans("pupllAnalyse.notSent", "未发送")}
                                </span>
                              ),
                            }[item.status]
                          }
                        </span>
                      ) : null}
                    </div>
                  );
                })
              : null}
          </div>
        </div>
      </div>
    );
  }
}
export default SuperSelector;

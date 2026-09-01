import React, { Component } from "react";
import { Avatar } from "antd";
import { Checkbox, SearchBar } from "antd-mobile";

import alluser from "../../../assets/alluser.png";
import { locale, trans } from "../../../utils/i18n";

import icon from "../../../icon.module.less";
import styles from "./index.module.less";

const CheckboxItem = Checkbox.AgreeItem;

class Student extends Component {
  state = {
    classIndex: 0,
    selectCount: {},
    selectList: [],
  };

  componentDidMount() {
    let { initData } = this.props;
    let { selectCount } = this.state;
    initData &&
      initData.map((element) => {
        element["groupId"] &&
          (selectCount[element["groupId"]]
            ? selectCount[element["groupId"]]++
            : (selectCount[element["groupId"]] = 1));
      });
    initData &&
      this.setState({
        selectList: initData || [],
        selectCount,
      });
  }

  UNSAFE_componentWillReceiveProps(nextProperties) {
    if (
      JSON.stringify(nextProperties.initData) !=
      JSON.stringify(this.state.selectList)
    ) {
      let selectCount = {};
      let initData = nextProperties.initData;
      initData &&
        initData.map((element) => {
          element["groupId"] &&
            (selectCount[element["groupId"]]
              ? selectCount[element["groupId"]]++
              : (selectCount[element["groupId"]] = 1));
        });
      initData &&
        this.setState({
          selectList: initData || [],
          selectCount,
        });
    }
  }

  //删除学生操作
  deleteItem(e, value) {
    e.stopPropagation();
    let newSelectObject = [...this.state.selectList];
    newSelectObject.length > 0 &&
      newSelectObject.map((item, index) => {
        if (item.id == value) {
          newSelectObject.splice(index, 1);
        }
      });

    this.setState({
      selectList: newSelectObject,
    });
    this.propsChange(newSelectObject);
  }

  //清空选择学生
  clear = () => {
    this.setState({
      selectList: [],
    });
    this.propsChange([]);
  };

  searchByName(keyWord) {
    let { onSearch } = this.props;
    typeof onSearch == "function" && onSearch.call(this, keyWord);
  }

  classChange(index) {
    this.setState({
      classIndex: index,
    });
  }

  selectAll(e) {
    const { classIndex, selectList, selectCount } = this.state;
    const {
      sourceData: { classList, studentList },
    } = this.props;
    let list = [...selectList];

    classList &&
      !selectCount[classList[classIndex]["id"]] &&
      (selectCount[classList[classIndex]["id"]] = 0);
    studentList[classIndex].map((element) => {
      let index = this.inArray(element.id, list);
      if (e.target.checked) {
        if (index < 0) {
          classList && selectCount[classList[classIndex]["id"]]++;
          list.push(
            classList
              ? Object.assign(element, { groupId: classList[classIndex]["id"] })
              : element,
          );
        }
      } else {
        classList && selectCount[classList[classIndex]["id"]]--;
        index > -1 && list.splice(index, 1);
      }
    });

    this.setState({
      selectList: list,
      selectCount,
    });
    this.propsChange(list);
  }

  inArray(element, array) {
    let index = -1;
    array = array || [];
    for (var index_ = 0, l = array.length; index_ < l; index_++) {
      if (element == array[index_]["id"]) {
        index = index_;
        break;
      }
    }
    return index;
  }

  onCheckBoxChange(e, element) {
    const { classIndex, selectList, selectCount } = this.state;
    const {
      sourceData: { classList },
    } = this.props;
    let list = [...selectList];
    classList &&
      classList.length > 0 &&
      !selectCount[classList[classIndex]["id"]] &&
      (selectCount[classList[classIndex]["id"]] = 0);
    if (e.target.checked) {
      let object =
        classList && classList.length > 0
          ? Object.assign(element, { groupId: classList[classIndex]["id"] })
          : element;
      classList &&
        classList.length > 0 &&
        selectCount[classList[classIndex]["id"]]++;
      list.push(object);
    } else {
      let index = this.inArray(element["id"], list);
      index > -1 && list.splice(index, 1);
      classList &&
        classList.length > 0 &&
        selectCount[classList[classIndex]["id"]]--;
    }
    this.setState({
      selectList: list,
      selectCount,
    });
    this.propsChange(list);
  }

  ifCheckAll() {
    let ifAll = false,
      selectCount = 0;
    const { classIndex, selectList } = this.state;
    const {
      sourceData: { studentList },
    } = this.props;
    if (studentList && studentList.length > 0) {
      studentList[classIndex] &&
        studentList[classIndex].map((element) => {
          console.log(this.inArray(element.id, selectList));
          this.inArray(element.id, selectList) > -1 && selectCount++;
        });
      console.log(ifAll, selectCount, studentList[classIndex], "111");
      if (
        studentList[classIndex] &&
        studentList[classIndex].length > 0 &&
        selectCount === studentList[classIndex].length
      ) {
        ifAll = true;
      }
      // ifAll = selectCount == studentList[classIndex] && studentList[classIndex].length;
    }

    return ifAll;
  }

  propsChange(list) {
    let { onChange } = this.props;
    typeof onChange == "function" && onChange.call(this, list);
  }

  getName = (element) => {
    return element && element.englishName
      ? element.name + element.englishName
      : element.name;
  };

  render() {
    const {
      sourceData: { classList, studentList },
      initData,
    } = this.props;
    const { classIndex, selectList, selectCount } = this.state;
    let checkedAll = this.ifCheckAll();
    let studentItem =
      selectList.length > 0 ? (
        selectList.map((item, index) => {
          return (
            <span className={styles.studentItem} key={item.id}>
              {item.name}
              <em onClick={(e) => this.deleteItem(e, item.id)}>×</em>
            </span>
          );
        })
      ) : (
        <span className={styles.placeholderContent}>
          {trans("global.searchorselect", "搜索或选择学生")}
        </span>
      );

    return (
      <div className={styles.multiSelect}>
        <div
          className={
            this.state.selectList && this.state.selectList.length > 0
              ? `${styles.stuBox} ${styles.stuFlex}`
              : styles.stuBox
          }
        >
          <span className={styles.selectStu}>{studentItem}</span>
          {this.state.selectList && this.state.selectList.length > 0 ? (
            <span className={styles.clear} onClick={this.clear}>
              <i className={icon.iconfont}>&#xe77d;</i>
            </span>
          ) : null}

          <div className={styles.cancel}>
            <SearchBar
              className={styles.search}
              placeholder={trans("global.messge2", "输入学生姓名搜索")}
              onChange={this.searchByName.bind(this)}
            />
          </div>
        </div>
        <div className={styles.drawerBox}>
          <div className={styles.row}>
            <div className={styles.flexBox}>
              {classList && classList.length > 0 && (
                <div>
                  <ul className={styles.levelBox}>
                    {classList.map((element, index) => (
                      <li
                        key={element.id}
                        onClick={this.classChange.bind(this, index)}
                        className={index == classIndex ? styles.select : ""}
                      >
                        {locale() === "en" ? element.ename : element.name}
                        {selectCount[element["id"]] &&
                        selectCount[element["id"]] > 0 ? (
                          <span>{selectCount[element["id"]]}</span>
                        ) : (
                          <i />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{ maxHeight: 500 }} className={styles.rightFlexItem}>
                {studentList && studentList[classIndex] && (
                  <CheckboxItem
                    className={`${styles.grayBg} ${styles.borderBox}`}
                    key={classIndex}
                    checked={checkedAll}
                    onChange={(e) => this.selectAll(e)}
                  >
                    <Avatar src={alluser} />-
                    {trans("global.allStudents", "全部学生")}
                  </CheckboxItem>
                )}
                {studentList &&
                  studentList[classIndex] &&
                  studentList[classIndex].length > 0 &&
                  studentList[classIndex].map((element, key) => (
                    <CheckboxItem
                      className={`${styles.grayBg} ${styles.borderBox}`}
                      key={element.id}
                      checked={this.inArray(element.id, selectList) > -1}
                      onChange={(e) => this.onCheckBoxChange(e, element)}
                    >
                      <Avatar src={element.stuAvatar} />-{this.getName(element)}
                    </CheckboxItem>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Student;

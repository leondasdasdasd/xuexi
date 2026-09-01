import React, { Component } from "react";
import { Avatar, Tooltip } from "antd";
import { Checkbox, SearchBar } from "antd-mobile";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

const CheckboxItem = Checkbox.AgreeItem;

class MultiSelect extends Component {
  state = {
    classIndex: 0,
    selectCount: {},
    selectList: [],
    open: false,
    studentVisible: false,
    showMask: false,
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
      console.log(initData, "111");
      initData &&
        this.setState({
          selectList: initData || [],
          selectCount,
        });
    }
  }

  renderGroupClass() {
    let groupCount = this.getSelectGoups();
    let { selectList } = this.state;
    selectList = selectList || [];
    if (selectList.length === 0) {
      return "";
    }
    return groupCount <= 0 ? (
      <span style={{ marginLeft: 10 }}>
        {trans("create.message1", "{$num}个学生", { num: selectList.length })}
      </span>
    ) : (
      <span style={{ marginLeft: 10 }}>
        {trans("create.message2", "{$num}个学习组-{$perNum}人", {
          num: groupCount,
          perNum: selectList.length,
        })}
      </span>
    );
  }

  //删除学生操作
  deleteItem(e, value) {
    e.stopPropagation();
    let newSelectObject = [...this.state.selectList];
    newSelectObject.length > 0 &&
      newSelectObject.map((item, index) => {
        if (item.studentUserId == value) {
          newSelectObject.splice(index, 1);
        }
      });
    this.setState({
      selectList: newSelectObject,
    });
    this.propsChange(newSelectObject);
  }

  cancel() {
    this.setState({
      open: false,
    });
  }

  onRightClick() {
    this.setState({
      open: false,
    });
  }

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
      let index = this.inArray(element.studentUserId, list);
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
      if (element == array[index_]["studentUserId"]) {
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
      console.log(element, "12212");
      this.props.getStuScore(element.studentUserId);
    } else {
      let index = this.inArray(element["studentUserId"], list);
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
      studentList[classIndex].map((element) => {
        this.inArray(element.studentUserId, selectList) > -1 && selectCount++;
      });
      ifAll = selectCount == studentList[classIndex].length;
    }

    return ifAll;
  }
  handleOk = () => {
    this.props.handleOk();
    this.setState({
      studentVisible: false,
      showMask: false,
    });
  };
  handleCancel = () => {
    this.props.handleCancel();
    this.setState({
      studentVisible: false,
      showMask: false,
    });
  };
  showStu = () => {
    this.setState({
      studentVisible: true,
      showMask: true,
    });
  };
  focus = () => {
    this.setState({
      studentVisible: false,
      showMask: false,
    });
    this.props.handleCancel();
  };
  getSelectGoups() {
    const { selectList } = this.state;
    const {
      sourceData: { classList },
    } = this.props;
    let groups = [];
    let changeList = selectList || [];
    if (classList && classList.length > 0) {
      changeList.map((element) => {
        if (!groups.includes(element.groupId)) {
          groups.push(element.groupId);
        }
      });
    }
    return groups.length;
  }

  propsChange(list) {
    let { onChange } = this.props;
    typeof onChange == "function" && onChange.call(this, list);
  }

  showDrawer() {
    this.setState({
      open: !this.state.open,
    });
  }

  render() {
    const {
      isMobile,
      sourceData: { classList, studentList },
      hideAddBox,
      hideMask,
      initData,
    } = this.props;
    const { classIndex, selectList, selectCount, open } = this.state;
    console.log(selectList, initData, "aaa");
    let checkedAll = this.ifCheckAll();
    let studentItem =
      selectList.length > 0 ? (
        selectList.map((item, index) => {
          return (
            <span className="studentItem">
              {item.studentName}
              <em onClick={(e) => this.deleteItem(e, item.studentUserId)}>×</em>
            </span>
          );
        })
      ) : (
        <span className="placeholderContent">
          {trans("global.searchorselect", "搜索或选择学生")}
        </span>
      );

    const content = (
      <div className={styles.drawerBox}>
        <div className={styles.cancel}>
          <span>
            <SearchBar
              className={styles.search}
              placeholder={trans("global.messge2", "输入学生姓名搜索")}
              onChange={this.searchByName.bind(this)}
            />
          </span>
        </div>
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
                      {element.name}
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
            <div style={{ maxHeight: 300 }} className={styles.rightFlexItem}>
              {/* {studentList
                && studentList[classIndex]
                && <CheckboxItem
                  className={[styles.grayBg, styles.borderBox].join(' ')}
                  key={classIndex}
                  checked={checkedAll}
                  onChange={(e) => this.selectAll(e)} >
                  <Avatar src={alluser} />
                  -
                    {trans('global.allStudents', '全部学生')}
                </CheckboxItem>
              } */}
              {studentList &&
                studentList[classIndex] &&
                studentList[classIndex].length > 0 &&
                studentList[classIndex].map((element, key) => (
                  <CheckboxItem
                    className={[styles.grayBg, styles.borderBox].join(" ")}
                    key={element.id}
                    checked={
                      this.inArray(element.studentUserId, selectList) > -1
                    }
                    onChange={(e) => this.onCheckBoxChange(e, element)}
                  >
                    <Avatar src={element.stuAvatar} />
                    <span
                      title={`${element.studentName}（${element.studentEName}）`}
                      className={styles.studentName}
                    >
                      -{element.studentName}（{element.studentEName}）
                    </span>
                    {/* -
                    {el.studentName}
                    <span className={styles.gradeClass}>{el.studentEName}</span> */}
                  </CheckboxItem>
                ))}
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div>
        <div
          className="multiSelect"
          style={hideMask ? { zIndex: 0 } : { zIndex: 1059 }}
        >
          <Tooltip
            trigger="click"
            placement="right"
            overlayClassName={styles.overlayBox}
            title={content}
          >
            <div className={styles.addQuestionNo} onClick={this.showModal}>
              <i className={[styles.iconfont, styles.closeIcon].join(" ")}>
                &#xe7d5;
              </i>
              {trans("global.addStu", "添加学生")}
            </div>
          </Tooltip>
        </div>
      </div>
    );
  }
}

export default MultiSelect;

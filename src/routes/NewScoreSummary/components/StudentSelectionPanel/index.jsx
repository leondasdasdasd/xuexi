// 类组件
import React from "react";
import { Input, Select } from "antd";

import { locale, trans } from "../../../../utils/i18n";

import styles from "./index.module.less";
const { Option } = Select;
const { Search } = Input;
const language = locale() == "en" ? false : true;
class StudentSelectionPanel extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      stuName: "",
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

  changeStu = (id) => {
    this.props.onChangeStu && this.props.onChangeStu(id);
  };

  changeClass = (id) => {
    this.props.onChangeClass && this.props.onChangeClass(id);
  };
  changeSearch = () => {};
  onSearch = (value, e) => {
    this.props.onSearchStu && this.props.onSearchStu(value);
  };
  render() {
    const { trendStuList, activeKey, groupId, classListData } = this.props;
    return (
      <div className={styles.stuList}>
        <div className={styles.headerOptionBox}>
          <Search
            placeholder={trans("global.searchStu", "搜索学生")}
            allowClear
            onSearch={this.onSearch}
          />
          <Select
            onChange={this.changeClass}
            value={groupId}
            style={{ width: "100%", marginTop: 10 }}
          >
            <Option value={0} key={0}>
              <span>{trans("global.allClass", "全部班级")}</span>
            </Option>
            {classListData &&
              classListData.length &&
              classListData.map((item) => (
                <Option value={item.groupId} key={item.groupId}>
                  <span>{language ? item.groupName : item.groupEName}</span>
                </Option>
              ))}
          </Select>
        </div>
        <div style={{ flexGrow: "1", marginTop: "10px" }}>
          {trendStuList && trendStuList.length > 0
            ? trendStuList.map((item) => (
                <div
                  key={item.studentId}
                  className={`${styles.userBox} ${activeKey === item.studentId ? styles.isChecked : ""}`}
                  onClick={() => this.changeStu(item.studentId)}
                >
                  <div className={[styles.nameBox].join(" ")}>
                    <div>{item.studentName}</div>
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>
    );
  }
}

export default StudentSelectionPanel;

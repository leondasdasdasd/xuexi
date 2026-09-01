// 类组件
import React from "react";
import { Checkbox } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

/**
 * 选择学生组件
 * @param {{selected: boolean, disabled: boolean, name: string, id: number }[]} groupList 班级列表
 * @param {*} onSelectChange 选择学生回调
 * @param {*} searchKey 搜索关键词
 * @returns
 */
class SelectStu extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      classIndex: 0,
      switchClassesId: "",
    };
  }

  // 点击切换班级
  switchClasses = (index, id) => {
    this.setState({
      classIndex: index,
      switchClassesId: id,
    });
  };

  // 计算每个班级选中学生数量
  getSelectedCountByClass = (index) => {
    const { groupList } = this.props;
    let classes = JSON.parse(JSON.stringify(groupList));
    const cls = classes[index];
    return cls.studentList.filter((stu) => stu.selected).length;
  };

  // 计算总选中学生数量
  getTotalSelectedCount = () => {
    const { groupList } = this.props;
    let classes = JSON.parse(JSON.stringify(groupList));
    return classes.reduce(
      (total, cls) =>
        total + cls.studentList.filter((stu) => stu.selected).length,
      0,
    );
  };

  // 更新班级状态
  toggleClassSelection = (e, id, ind) => {
    const { groupList } = this.props;

    let list = JSON.parse(JSON.stringify(groupList));
    list[ind].studentList = list[ind].studentList.map((stu) => {
      if (!stu.disabled) {
        return {
          ...stu,
          selected: !list[ind].studentList.every((s) => s.selected),
        };
      }
      return stu;
    });
    this.props.onSelectChange && this.props.onSelectChange(list);
  };

  //更新学生状态
  toggleStudentSelection = (e, id) => {
    const { groupList } = this.props;
    const { classIndex } = this.state;
    let list = JSON.parse(JSON.stringify(groupList));
    list[classIndex].studentList = list[classIndex].studentList.map((stu) =>
      stu.id === id && !stu.disabled
        ? { ...stu, selected: !stu.selected }
        : stu,
    );
    this.props.onSelectChange && this.props.onSelectChange(list);
  };

  // 全选/取消全选操作
  toggleAllSelection = () => {
    const allSelected = this.isAllSelected();
    const { groupList } = this.props;
    let list = JSON.parse(JSON.stringify(groupList));
    let resules = list.map((cls) => ({
      ...cls,
      studentList: cls.studentList.map((stu) =>
        stu.disabled
          ? stu
          : {
              ...stu,
              selected: !allSelected,
            },
      ),
    }));
    this.props.onSelectChange && this.props.onSelectChange(resules);
  };

  isAllSelected = () => {
    const { groupList } = this.props;
    let classes = JSON.parse(JSON.stringify(groupList));
    return classes.every((cls) =>
      cls.studentList.every((stu) => stu.selected || stu.disabled),
    );
  };

  // 计算是否部分选中
  isPartiallySelected = () => {
    const { groupList } = this.props;
    let classes = JSON.parse(JSON.stringify(groupList));
    return classes.some(
      (cls) =>
        cls.studentList.some((stu) => stu.selected) &&
        !classes.every((cls) =>
          cls.studentList.every((stu) => stu.selected || stu.disabled),
        ),
    );
  };

  render() {
    const { groupList, style, searchKey = "" } = this.props;
    const { classIndex, switchClassesId } = this.state;

    // 过滤学生列表
    let filteredClasses = [];

    if (groupList && groupList.length > 0) {
      filteredClasses = groupList.map((cls) => ({
        ...cls,
        studentList: cls.studentList.filter((stu) =>
          stu.name.includes(searchKey),
        ),
      }));
    }

    return (
      <div className={styles.selectStu} style={style}>
        <div className={styles.allCaS}>
          <div className={styles.allClass}>
            {groupList && groupList.length > 0 ? (
              <div className={styles.allGroups}>
                <Checkbox
                  onChange={this.toggleAllSelection}
                  checked={this.isAllSelected()}
                  indeterminate={this.isPartiallySelected()}
                >
                  <span className={styles.allGroupCheck}>
                    {trans("global.allGroups", "所有组")}
                    <span style={{ marginLeft: "8px" }}>
                      {this.getTotalSelectedCount()}
                    </span>
                  </span>
                </Checkbox>
              </div>
            ) : null}

            <div className={styles.classNamesBox}>
              {filteredClasses &&
              filteredClasses.length > 0 &&
              filteredClasses[classIndex]
                ? filteredClasses.map((item, index) => (
                    <div
                      className={`${styles.classNames} ${switchClassesId == item.groupCourseId ? styles.blurClassNames : null}`}
                      onClick={() =>
                        this.switchClasses(index, item.groupCourseId)
                      }
                    >
                      <div>
                        <Checkbox
                          onChange={(e) =>
                            this.toggleClassSelection(
                              e,
                              item.groupCourseId,
                              index,
                            )
                          }
                          checked={groupList[index].studentList.every(
                            (stu) => stu.selected,
                          )}
                          indeterminate={
                            !groupList[index].studentList.every(
                              (stu) => stu.selected || stu.disabled,
                            ) &&
                            groupList[index].studentList.some(
                              (stu) => stu.selected,
                            )
                          }
                        ></Checkbox>
                        <span className={styles.stuNameBox}>
                          {item.studentGroupName}&nbsp;
                          {this.getSelectedCountByClass(index)}
                        </span>
                      </div>
                    </div>
                  ))
                : null}
            </div>
          </div>
          <div className={styles.allStu}>
            {filteredClasses &&
            filteredClasses[classIndex] &&
            filteredClasses[classIndex].studentList &&
            filteredClasses[classIndex].studentList.length > 0 ? (
              <>
                <div className={styles.stuNames}>
                  <Checkbox
                    onChange={(e) =>
                      this.toggleClassSelection(
                        e,
                        this.state.switchClassesId,
                        this.state.classIndex,
                      )
                    }
                    //所有学生的checked状态，判断当前班级id是否已经全选，如果全选择默认选中
                    checked={groupList[classIndex].studentList.every(
                      (stu) => stu.selected || stu.disabled,
                    )}
                    indeterminate={
                      !groupList[classIndex].studentList.every(
                        (stu) => stu.selected || stu.disabled,
                      ) &&
                      groupList[classIndex].studentList.some(
                        (stu) => stu.selected,
                      )
                    }
                  ></Checkbox>
                  <span className={styles.stuName}>
                    {trans("global.allStudents", "所有学生")}
                  </span>
                </div>
                <div className={styles.allStuNames}>
                  {filteredClasses[classIndex].studentList.map((item) => (
                    <div className={styles.stuNames} key={item.id}>
                      {item.disabled ? (
                        <Checkbox defaultChecked disabled></Checkbox>
                      ) : (
                        <Checkbox
                          onChange={(e) =>
                            this.toggleStudentSelection(e, item.id)
                          }
                          checked={item.selected}
                        ></Checkbox>
                      )}
                      <span className={styles.stuName}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}
export default SelectStu;

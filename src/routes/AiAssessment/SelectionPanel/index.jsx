import React, { PureComponent } from "react";
import { Dropdown, Menu, Spin } from "antd";

import { locale } from "../../../utils/i18n";

import icon from "../../../icon.module.less";
import styles from "./index.module.less";

class SelectionPanel extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  //渲染班级名称
  renderGroupName = () => {
    const { classListData, groupId } = this.props;

    if (classListData && classListData.length > 0) {
      const group = classListData.find((c) => c.groupId == groupId);
      if (group) {
        return locale() == "en" ? group.groupEName : group.groupName;
      }
    }
    return null;
  };

  render() {
    const {
      classListData,
      studentList,
      studentListLoading,
      studentId,
      changeGroup,
      changeStudent,
      entryKey,
      groupId,
    } = this.props;
    return (
      <div className={styles.studentList}>
        {entryKey == 14 ? (
          <div className={styles.studentArea}>
            <div style={{ flexGrow: 1, overflow: "auto" }}>
              <Spin spinning={studentListLoading} size="large">
                <div className={styles.studentNameList}>
                  {classListData && classListData.length > 0
                    ? classListData.map((c) => {
                        return c.groupId == 0 ? null : (
                          <span
                            onClick={() => changeGroup(c.groupId)}
                            key={c.groupId}
                            className={
                              groupId == c.groupId ? styles.studentSelect : {}
                            }
                          >
                            {locale() == "en" ? c.groupEName : c.groupName}
                          </span>
                        );
                      })
                    : null}
                </div>
              </Spin>
            </div>
          </div>
        ) : null}

        {entryKey == 10 || entryKey == 11 ? (
          <div className={styles.studentArea}>
            <div className={styles.classList}>
              <Dropdown
                overlay={
                  <Menu onClick={changeGroup}>
                    {classListData && classListData.length > 0
                      ? classListData.map((c, index) => {
                          return c.groupId == 0 ? null : (
                            <Menu.Item key={c.groupId}>
                              <span className={styles.regularText}>
                                {locale() == "en" ? c.groupEName : c.groupName}
                              </span>
                            </Menu.Item>
                          );
                        })
                      : null}
                  </Menu>
                }
                trigger={["click"]}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
              >
                <div className={styles.groupName}>
                  <span>{this.renderGroupName()}</span>
                  <i className={icon.iconfont}>&#xe659;</i>
                </div>
              </Dropdown>
            </div>
            <div style={{ flexGrow: 1, overflow: "auto" }}>
              <Spin spinning={studentListLoading} size="large">
                <div className={styles.studentNameList}>
                  {studentList && studentList.length > 0
                    ? studentList.map((s) => (
                        <span
                          onClick={() => changeStudent(s.studentId)}
                          key={s.studentId}
                          className={
                            studentId == s.studentId ? styles.studentSelect : {}
                          }
                        >
                          {s.studentName}
                        </span>
                      ))
                    : null}
                </div>
              </Spin>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
export default SelectionPanel;

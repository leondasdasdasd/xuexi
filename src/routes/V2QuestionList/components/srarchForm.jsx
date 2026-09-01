//新闻
import React, { Fragment, PureComponent } from "react";
import { Dropdown, Icon, Menu, message } from "antd";
import { connect } from "dva";
import PropTypes from "prop-types";

import { questionCreateList } from "../../../services/qustion";
import { trans } from "../../../utils/i18n";
import { loginRedirect } from "../../../utils/utils";
import { isValidQuestionTypeGradeFilter } from "../questionListQueryContext";

import styles from "./srarchForm.module.less";
const difficulty = [
  { key: -1, name: trans("global.every", "全部") },
  { key: 1, name: trans("global.easy", "简单") },
  { key: 2, name: trans("global.general", "普通") },
  { key: 3, name: trans("global.difficult", "困难") },
];

let date = new Date().getFullYear();
let yearList = ["全部", date, date - 1, date - 2];

let SCROLLT = 0;
let TIMEID = null;
export class SrarchForm extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      isExpand: false,
      qustionCreateUserList: [],
    };
  }
  componentDidMount() {
    let tableWarp = document.querySelector("#tableWarp");
    tableWarp.addEventListener("scroll", () => {
      var scrollTop = tableWarp.pageYOffset || tableWarp.scrollTop;
      if (TIMEID) {
        clearTimeout(TIMEID);
      }
      TIMEID = setTimeout(() => {
        SCROLLT = scrollTop;
      }, 100);
      // 滚动到最顶部，并且本次移动距离大于100
      if (scrollTop == 0 && scrollTop - SCROLLT < -100) {
        this.setState({
          isExpand: true,
        });
      } else if (scrollTop - SCROLLT > 100) {
        this.setState({
          isExpand: false,
        });
      }
    });
    this.getQuestionCreateList();

    // 获取场景
    this.props.dispatch({
      type: "home/getExamType",
      payload: { type: 0 },
    });
  }
  getQuestionCreateList = () => {
    questionCreateList().then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          this.setState({
            qustionCreateUserList: response.content,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });
  };
  expandChange = () => {
    this.setState({
      isExpand: !this.state.isExpand,
    });
  };

  onUserChange = (value) => {
    this.props.onUserChange && this.props.onUserChange(value.userId);
  };

  onQuLevelChange = (value) => {
    this.props.onQuLevelChange && this.props.onQuLevelChange(value.key);
  };

  onGradeChange = (value) => {
    this.props.onGradeChange && this.props.onGradeChange(value);
  };

  onQuTypeChange = (value) => {
    this.props.onQuTypeChange && this.props.onQuTypeChange(value);
  };

  handleQuestionTypeKeyDown = (event, value, disabled) => {
    // 题型筛选的键盘操作与点击操作共用同一业务入口。
    if (!disabled && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      this.onQuTypeChange(value);
    }
  };

  onExamTypeChange = (value) => {
    this.props.onExamTypeChange && this.props.onExamTypeChange(value);
  };

  onYearChange = (value) => {
    this.props.onYearChange && this.props.onYearChange(value);
  };

  render() {
    return (
      <>
        <div
          className={`${styles.searchForm} ${this.state.isExpand ? styles.expand_searchForm : ""}`}
        >
          <div
            className={`${this.state.isExpand ? styles.expand_formInnerBox : ""}`}
            style={{ height: "100%", overflow: "hidden" }}
          >
            <div className={styles.form_item}>
              <div className={styles.label}>
                {trans("global.questionType", "题型")}：
              </div>
              <div className={styles.form_item_content}>
                <div style={{ display: "flex" }}>
                  {this.props.typeList && this.props.typeList.length > 0
                    ? [
                        { typeName: "全部", code: -1 },
                        ...this.props.typeList,
                      ].map((item, index) => {
                        const questionTypeIds =
                          item.code === -1 ? [] : [item.code];
                        const disabled = !isValidQuestionTypeGradeFilter(
                          questionTypeIds,
                          this.props.questionTypeGradeIds,
                        );
                        return (
                          <div
                            aria-disabled={disabled}
                            role="button"
                            tabIndex={disabled ? -1 : 0}
                            style={{
                              marginRight: "10px",
                              color: disabled
                                ? "#bfbfbf"
                                : (item.code === -1 &&
                                      this.props.businessQuestionTypeIds
                                        ?.length === 0) ||
                                    this.props.businessQuestionTypeIds?.includes(
                                      item.code,
                                    )
                                  ? "#0445fc"
                                  : "",
                              cursor: disabled ? "not-allowed" : "pointer",
                            }}
                            onClick={() => {
                              if (!disabled) this.onQuTypeChange(item);
                            }}
                            onKeyDown={(event) =>
                              this.handleQuestionTypeKeyDown(
                                event,
                                item,
                                disabled,
                              )
                            }
                            key={index}
                          >
                            {item.typeName}
                          </div>
                        );
                      })
                    : null}
                </div>
              </div>
            </div>
            <div className={styles.form_item}>
              <div className={styles.label}>
                {trans("newMyQuestion.sceneFilterLabel", "场景：")}
              </div>
              <div className={styles.form_item_content}>
                <div
                  style={{
                    display: "flex",
                    whiteSpace: "nowrap",
                  }}
                >
                  {this.props.examTypeList && this.props.examTypeList.length > 0
                    ? [
                        { typeName: "全部", code: -1 },
                        ...this.props.examTypeList,
                      ].map((item, index) => (
                        <div
                          style={{
                            marginRight: "10px",
                            color:
                              this.props.examType == item.code ? "#0445fc" : "",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                          key={index}
                          onClick={() => {
                            this.onExamTypeChange(item);
                          }}
                        >
                          {item.typeName}
                        </div>
                      ))
                    : null}
                </div>
              </div>
            </div>
            <div className={styles.form_item}>
              <div className={styles.label}>
                {trans("newMyQuestion.difficultyFilterLabel", "难度：")}
              </div>
              <div className={styles.form_item_content}>
                <div style={{ display: "flex" }}>
                  {difficulty.map((item, index) => (
                    <div
                      style={{
                        marginRight: "10px",
                        color:
                          (item.key === -1 &&
                            this.props.levels?.length === 0) ||
                          this.props.levels?.includes(item.key)
                            ? "#0445fc"
                            : "",
                        cursor: "pointer",
                      }}
                      key={index}
                      onClick={() => {
                        this.onQuLevelChange(item);
                      }}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.form_item}>
              <div className={styles.label}>
                {trans("newMyQuestion.moreFilterLabel", "更多：")}
              </div>
              <div className={styles.form_item_content}>
                <div style={{ display: "flex" }}>
                  <div style={{ marginRight: "10px" }}>
                    <Dropdown
                      trigger={["click"]}
                      style={{ marginRight: "10px" }}
                      overlayClassName={styles.dropdown}
                      overlay={
                        <Menu>
                          {" "}
                          {yearList.map((item) => (
                            <Menu.Item
                              key={item}
                              onClick={() => {
                                this.props.onYearChange(item);
                              }}
                              style={{
                                color: item == this.props.year ? "#0445fc" : "",
                              }}
                            >
                              {item}
                            </Menu.Item>
                          ))}
                        </Menu>
                      }
                    >
                      <span style={{ cursor: "pointer" }}>
                        {trans("global.year", "年份")}
                        <Icon type="down" />
                      </span>
                    </Dropdown>
                  </div>
                  {this.props.tabKey == 2 ? (
                    <div style={{ marginRight: "10px" }}>
                      <Dropdown
                        trigger={["click"]}
                        overlayClassName={styles.dropdown}
                        overlay={
                          <Menu>
                            {this.props.editionAndGradeData?.gradeList?.length
                              ? [
                                  { name: "全部", gradeId: -1 },
                                  ...this.props.editionAndGradeData.gradeList,
                                ].map((grade) => (
                                  <Menu.Item
                                    disabled={
                                      !isValidQuestionTypeGradeFilter(
                                        this.props.businessQuestionTypeIds ||
                                          [],
                                        grade.gradeId === -1
                                          ? []
                                          : [grade.gradeId],
                                      )
                                    }
                                    key={grade.gradeId}
                                    onClick={() => {
                                      this.onGradeChange(grade);
                                    }}
                                    style={{
                                      color:
                                        (grade.gradeId === -1 &&
                                          this.props.gradeIds?.length === 0) ||
                                        this.props.gradeIds?.includes(
                                          grade.gradeId,
                                        )
                                          ? "#0445fc"
                                          : "",
                                    }}
                                  >
                                    {grade.name}
                                  </Menu.Item>
                                ))
                              : null}
                          </Menu>
                        }
                      >
                        <span style={{ cursor: "pointer" }}>
                          {trans("global.grade", "年级")}
                          <Icon type="down" />
                        </span>
                      </Dropdown>
                    </div>
                  ) : null}

                  <div style={{ marginRight: "10px" }}>
                    <Dropdown
                      trigger={["click"]}
                      overlayClassName={styles.dropdown}
                      overlay={
                        <Menu>
                          {this.state.qustionCreateUserList?.length
                            ? [
                                { userName: "全部", userId: -1 },
                                ...this.state.qustionCreateUserList,
                              ].map((item) => (
                                <Menu.Item
                                  onClick={() => {
                                    this.onUserChange(item);
                                  }}
                                  key={item.userId}
                                >
                                  <span
                                    style={{
                                      color:
                                        item.userId == this.props.createUserId
                                          ? "#0445fc"
                                          : "",
                                    }}
                                  >
                                    {item.userName}
                                  </span>
                                </Menu.Item>
                              ))
                            : null}
                        </Menu>
                      }
                    >
                      <span style={{ cursor: "pointer" }}>
                        {trans("newMyQuestion.collector", "收录人")}
                        <Icon type="down" />
                      </span>
                    </Dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            height: "48px",
            width: "100%",
            background: "#fff",
            position: "relative",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              padding: "0 22px",
              height: "100%",
            }}
          >
            <div style={{ display: "flex", marginRight: "auto" }}>
              <div style={{ marginRight: "10px", color: "#0445fc" }}>
                {trans("newMyQuestion.latest", "最新")}
              </div>
              {/* <div>最热</div> */}
            </div>
            <div style={{ fontSize: "14px" }}>
              {trans("newMyQuestion.questionTotal", "共 {$total} 道题", {
                total: this.props?.total || 0,
              })}
            </div>
          </div>
          <div className={styles.handel} onClick={this.expandChange}>
            {this.state.isExpand ? <Icon type="up" /> : <Icon type="down" />}
          </div>
        </div>
      </>
    );
  }
}

SrarchForm.propTypes = {
  questionTypeGradeIds: PropTypes.arrayOf(PropTypes.number),
};

SrarchForm.defaultProps = {
  questionTypeGradeIds: [],
};

export default connect(({ home }) => ({
  examTypeList: home.examTypeList,
}))(SrarchForm);

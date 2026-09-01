//新闻
import React, { PureComponent } from "react";
import { Icon, Popover } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";

import styles from "./stageSubjectBtn.module.less";
class StageSubjectButton extends PureComponent {
  change = (subject, stage) => {
    this.props.onChange && this.props.onChange(subject, stage);
  };

  handleSubjectKeyDown = (event, subject, stage) => {
    // 键盘选择与点击选择共用同一业务回调，保持学段与学科成对传递。
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.change(subject, stage);
    }
  };

  render() {
    return (
      <div className={styles.gradeSelectBox}>
        <Popover
          trigger="click"
          placement="bottomLeft"
          overlayClassName={styles.hidden_popover_arrow}
          content={
            <div className={styles["stage-subject-list"]}>
              {this.props?.stageSubjects?.map((stage, index) => {
                return (
                  <div className={styles.school_level_content} key={index}>
                    <div className={styles.school_level}>
                      {stage.stageName}：
                    </div>
                    <div className={styles.school_level_subject}>
                      {stage.subjectList?.map((subject, index_) => (
                        <div
                          style={{
                            marginRight: "30px",
                            marginBottom: "6px",
                            cursor: "pointer",
                            color:
                              this.props?.subject?.id == subject?.id &&
                              this.props?.stage?.stageId == stage?.stageId
                                ? "#0445FC"
                                : "#01113d",
                          }}
                          role="button"
                          tabIndex={0}
                          onClick={() => this.change(subject, stage)}
                          onKeyDown={(event) =>
                            this.handleSubjectKeyDown(event, subject, stage)
                          }
                          key={`${index}-${index_}`}
                        >
                          {subject.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          }
        >
          <div className={styles.gradeSelect}>
            <div>
              {this.props?.stage?.stageName || trans("global.stage", "学段")}·
              {this.props?.subject?.name || trans("global.subject", "学科")}
              <Icon
                type="down"
                style={{ fontSize: "11px", marginLeft: "10px" }}
              />
            </div>
          </div>
        </Popover>
      </div>
    );
  }
}

StageSubjectButton.propTypes = {
  onChange: PropTypes.func,
  stage: PropTypes.shape({
    stageId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stageName: PropTypes.string,
  }),
  stageSubjects: PropTypes.arrayOf(
    PropTypes.shape({
      stageId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      stageName: PropTypes.string,
      subjectList: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
          name: PropTypes.string,
        }),
      ),
    }),
  ),
  subject: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
  }),
};

StageSubjectButton.defaultProps = {
  onChange: undefined,
  stage: undefined,
  stageSubjects: [],
  subject: undefined,
};

export default StageSubjectButton;

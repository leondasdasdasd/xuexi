import React, { PureComponent } from "react";

import MyButton from "components/MyButton";

import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

class Header extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  render() {
    const {
      totalScore,
      difficultyIndex,
      easyMediumHard,
      originalStats,
      onSave,
      onPreview,
      time,
      closePage,
    } = this.props;
    return (
      <div className={[styles.twoWayHeader, styles.flexRow].join(" ")}>
        <div className={[styles.headerLeft, styles.flexRow].join(" ")}>
          <i
            onClick={closePage}
            className={[icon.iconfont, styles.closePage].join(" ")}
          >
            &#xe893;
          </i>
          <div>{trans("global.twoWayTest", "双向细目表组卷")}</div>
        </div>
        <div className={[styles.headerCenter, styles.flexRow].join(" ")}>
          <div className={styles.headerCenterBox}>
            <span>{trans("global.manfen", "满分")}</span>
            <span className={styles.centerContent}>{totalScore}</span>
          </div>
          <div className={styles.headerCenterBox}>
            <span>{trans("global.difficultDegree", "难度系数")}</span>
            <span className={styles.centerContent}>{difficultyIndex}</span>
          </div>
          <div className={styles.headerCenterBox}>
            <span>{trans("global.difficultRate", "易中难")}</span>
            <span className={styles.centerContent}>
              {easyMediumHard[0]}
              <span className={styles.colon}>:</span>
              {easyMediumHard[1]}
              <span className={styles.colon}>:</span>
              {easyMediumHard[2]}
            </span>
          </div>
          <div className={styles.headerCenterBox}>
            <span>
              {trans("global.Originalquestion", "原题")}-
              {trans("global.original", "原创")}-{trans("global.adapt", "改编")}
            </span>
            <span className={styles.centerContent}>
              {originalStats[0]}
              <span className={styles.colon}>:</span>
              {originalStats[1]}
              <span className={styles.colon}>:</span>
              {originalStats[2]}
            </span>
          </div>
        </div>
        <div className={[styles.headerRight, styles.flexRow].join(" ")}>
          {time ? (
            <div
              style={{
                fontSize: "12px",
                marginRight: "10px",
                color: "rgba(1,17,61,0.65)",
              }}
            >
              {trans("twoWay.savedAtPrefix", "保存于")}
              {time}
            </div>
          ) : null}
          <MyButton
            sizeclass="commonBtn"
            typeclass="cancelBtn"
            onClick={onPreview}
          >
            {trans("global.previewTestPaper", "试卷预览")}
          </MyButton>

          <MyButton
            sizeclass="commonBtn"
            typeclass="confirmBtn"
            style={{ marginLeft: "10px" }}
            onClick={onSave}
          >
            {trans("global.save", "保存")}
          </MyButton>
        </div>
      </div>
    );
  }
}
export default Header;

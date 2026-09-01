import React, { PureComponent } from "react";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

@connect((state) => ({}))
class revisedList extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  //获取当前类名
  getClassName = (info) => {
    let currentClassName = info.processStatusType
      ? info.processStatusType == 1
        ? styles.delay
        : info.processStatusType == 2
          ? styles.completed
          : styles.refuse
      : null;
    return `${styles.itemRight} ${currentClassName}`;
  };

  //进入详情
  toDetail = (type) => {
    const { info } = this.props;
    const number_ = info.remark === "evaluationScoreCorrectionMark" ? 2 : 1;
    window.open(
      `${window.location.origin}/exam#/revisedDetail/${info.correctionProcessId}/${number_}`,
      "_blank",
    );
    // let str = JSON.stringify({
    //   sourceType: info.sourceType == 0 ? 0 : (info.sourceType || '')
    // })
    // ?data=${aesEncrypt(str, 'lsk')}
    // console.log(str);
  };

  render() {
    const { info, hasBorder } = this.props;

    return (
      <div
        className={styles.revisedListBox}
        onClick={this.toDetail.bind(this, info.remark)}
      >
        {
          <div
            className={
              hasBorder ? styles.revisedMapItem : styles.noBorderRevisedMapItem
            }
          >
            <div className={styles.itemLeft}>
              <div>
                <span
                  className={styles.itemTag}
                  style={{
                    background: "transparent",
                    border: "1px solid #2B4496",
                    color: "#2B4496",
                  }}
                >
                  {info.sourceType == 0
                    ? trans("global.fromQuiz", "来自测验")
                    : trans("global.fromAssessment", "来自评价")}
                </span>
                <span className={styles.itemTag}>{info.examTypeName}</span>
                <span className={styles.reviseItemTitle}>{info.examName}</span>
              </div>
              <div className={styles.addMessageBox}>
                <span>{trans("global.addPerson", "创建人")}：</span>
                <span>{info.createUserName}</span>
                <span style={{ marginLeft: "20px" }}>
                  {trans("global.addTime", "创建时间")}
                </span>
                <span>{info.createTime}</span>
                {info.dealTime ? (
                  <div style={{ display: "inline-block" }}>
                    <span style={{ marginLeft: "20px" }}>
                      {trans("global.dealTime", "处理时间")}
                    </span>
                    <span>{info.createTime}</span>
                  </div>
                ) : null}
                {info.endTime ? (
                  <div style={{ display: "inline-block" }}>
                    <span style={{ marginLeft: "20px" }}>
                      {trans("global.endTime", "完成时间")}
                    </span>
                    <span>{info.endTime}</span>
                  </div>
                ) : null}
              </div>
              <div></div>
            </div>
            <div className={this.getClassName(info)}>
              {info.processStatusDescribe}
            </div>
          </div>
        }
      </div>
    );
  }
}
export default revisedList;

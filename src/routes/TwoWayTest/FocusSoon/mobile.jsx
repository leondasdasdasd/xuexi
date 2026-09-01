import React, { PureComponent } from "react";
import axios from "axios";
import { connect } from "dva";
import moment from "moment";
import { stringify } from "qs";

import { trans } from "../../../utils/i18n";

import styles from "./mobile.module.less";
const getTeacherStatistics = {
  status: true,
  message: "成功",
  code: 1001,
  content: {
    statisticHonorList: [
      {
        honorName: "骊谷奖",
        honorEName: null,
        total: 7,
        percentage: 0.19,
        blueTotal: 1,
        orangeTotal: 1,
      },
      {
        honorName: "谨云奖",
        honorEName: null,
        total: 5,
        percentage: 0.14,
        blueTotal: 2,
        orangeTotal: 1,
      },
      {
        honorName: "霁云奖",
        honorEName: null,
        total: 4,
        percentage: 0.11,
        blueTotal: 3,
        orangeTotal: 1,
      },
      {
        honorName: "弘云奖",
        honorEName: null,
        total: 6,
        percentage: 0.17,
        blueTotal: 1,
        orangeTotal: 1,
      },
      {
        honorName: "雁云奖",
        honorEName: null,
        total: 1,
        percentage: 0.03,
        blueTotal: 1,
        orangeTotal: 1,
      },
      {
        honorName: "嘉谷奖",
        honorEName: null,
        total: 3,
        percentage: 0.08,
        blueTotal: 1,
        orangeTotal: 1,
      },
      {
        honorName: "裕谷奖",
        honorEName: null,
        total: 1,
        percentage: 0.03,
        blueTotal: 3,
        orangeTotal: 2,
      },
      {
        honorName: "睿谷奖",
        honorEName: null,
        total: 3,
        percentage: 0.08,
        blueTotal: 2,
        orangeTotal: 1,
      },
      {
        honorName: "创谷奖",
        honorEName: null,
        total: 3,
        percentage: 0.08,
        blueTotal: 1,
        orangeTotal: 2,
      },
    ],
    bluePercentage: 0.28,
    orangePercentage: 0.72,
  },
  ifLogin: true,
  ifAdmin: false,
  success: true,
  fail: false,
};
@connect((state) => ({
  honorRecordData: state.dataView.honorRecordData,
}))
class HonorsClub extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      textValue: "",
      modalDate: [],
      gradeDate: {},
      focusData: {},
      date: moment().format("YYYY-MM-DD"),
      hour:
        new Date().getHours() < 10
          ? `0${new Date().getHours()}`
          : `${new Date().getHours()}`,
      min:
        new Date().getMinutes() < 10
          ? `0${new Date().getMinutes()}`
          : `${new Date().getMinutes()}`,
      second:
        new Date().getSeconds() < 10
          ? `0${new Date().getSeconds()}`
          : `${new Date().getSeconds()}`,
    };
    this.timeOut = null;
  }
  componentDidMount() {
    const { data, dispatch, item, myRole, selectValue } = this.props;
    let payload = {};
    const that = this;
    if (myRole.roleTagList && myRole.roleTagList) {
      myRole.roleTagList.map((it) => {
        if (it === "CHIEF_TUTOR") {
          payload.groupArr = selectValue;
        } else if (it === "GRADE_PRINCIPAL") {
          payload.gradeIds = selectValue;
        } else if (it !== "TUTOR") {
          payload.stageList = selectValue;
        }
      });
    }
    axios
      .get(
        `${window.location.origin}${item.dataSourceUrl}&${stringify(payload)}`,
      )
      .then(function (response) {
        console.log(response, "rere");
        if (response.data && response.data.status) {
          that.setState({
            focusData: response.data.content,
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  render() {
    const { data, dispatch, item } = this.props;
    const { allDate, gradeDate, focusData } = this.state;

    return (
      <div
        className={styles.dataViewContent}
        style={{ flex: `0 0 100%`, minHeight: "260px" }}
      >
        <div className={styles.viewHeader}>
          <div className={styles.headerCon}></div>
          <div className={styles.boxTitle}>{item.moduleName}</div>
          {item.detailUrl && item.detailUrl !== "" ? (
            <div
              className={styles.more}
              onClick={() => {
                window.open(item.detailUrl);
              }}
            >
              {trans("global.more", "更多")}
            </div>
          ) : null}
        </div>
        <div className={styles.viewChartDom}>
          {/* <div className={styles.soonBox}>
                <div className={styles.headerTitle}>迟到</div>
                <div className={styles.soonContent}>
                    <div className={styles.soonTitle}>今日</div>
                    <div className={styles.soonDetail}>周放  张国国 </div>
                    <div className={styles.soonTitle}>连续3天</div>
                    <div className={styles.soonDetail}>周放  张国国 何晓峰 </div>
                </div>
            </div> */}
          {focusData && focusData.detailList && focusData.detailList.length > 0
            ? focusData.detailList.map((index) =>
                index.typeName.includes("病假") ||
                index.typeName === "迟到" ||
                index.typeName.includes("特殊关注") ? (
                  <div className={styles.soonBox}>
                    <div className={styles.headerTitle}>{index.typeName}</div>
                    <div className={styles.soonContent}>
                      {index.typeDetails && index.typeDetails.length > 0
                        ? index.typeDetails.map((ii) => (
                            <div>
                              <div className={styles.soonTitle}>
                                <div className={styles.soonLabel}></div>
                                <div>{ii.typeName}</div>
                              </div>
                              <div className={styles.soonDetail}>
                                {ii.userModels && ii.userModels.length > 0
                                  ? ii.userModels.map((itt) => (
                                      <span>{itt.name} </span>
                                    ))
                                  : null}
                              </div>
                            </div>
                          ))
                        : null}
                    </div>
                  </div>
                ) : (
                  <div className={styles.soonBox}>
                    <div className={styles.headerTitle}>{index.typeName}</div>
                    <div className={styles.soonContent}>
                      <div className={styles.soonDetail}>
                        {index.userModels && index.userModels.length > 0
                          ? index.userModels.map((itt) => (
                              <div style={{ marginTop: "5px" }}>{itt.name}</div>
                            ))
                          : null}
                      </div>
                    </div>
                  </div>
                ),
              )
            : null}
          {/* <div className={styles.soonBox}>
                <div className={styles.headerTitle}>视力退步关注</div>
                <div className={styles.soonContent}>               
                    <div className={styles.soonDetail}>周放  张国国 吴琼 赵丽丽</div>
                </div>
            </div> */}
        </div>
      </div>
    );
  }
}

export default HonorsClub;

// 类组件
import React from "react";
import { Icon, Spin } from "antd";
import { connect } from "dva";

import OverallView from "../../components/PupllAnalyse/components/OverallView";
import WrongQuestionSet from "../../components/PupllAnalyse/components/WrongQuestionSet";
import WrongQuestionView from "../../components/PupllAnalyse/components/WrongQuestionView";
import { trans } from "../../utils/i18n";

import styles from "../../components/PupllAnalyse/index.module.less";
let timerId = null;
class PupllAnalyse extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      situationConfig: {},
      elevatorIndex: 0,
      modelListLoding: [false, false, false],
      pageLoding: false,
      loading: false,
      reportName: "",
    };
  }

  componentDidMount() {
    this.getDetail();
    document
      .querySelector("#centerContent")
      .addEventListener("scroll", this.scrollChange, true);
  }

  scrollChange = (e) => {
    let scrollY = e.target.pageYOffset || e.target.scrollTop;
    // 防抖
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      if (scrollY > 150) {
        document.querySelector("#maoding").style.display = "block";
      } else {
        document.querySelector("#maoding").style.display = "none";
      }
    }, 300);
  };

  setSelect = (index) => {
    this.setState({
      elevatorIndex: index,
    });
    const dom = document.getElementById(`table${index}`);
    dom && dom.scrollIntoView(true);
  };

  getDetail = (id) => {
    const {
      match: { params },
    } = this.props;
    this.setState({
      examId: params.examId,
      studentUserId: params.stuId,
      pageLoding: true,
    });
    return new Promise((resolve, reject) => {
      this.props
        .dispatch({
          type: "home/getStudySituationByStudentId",
          payload: {
            examId: params.examId,
            studentUserId: params.stuId,
            isPreview: true,
          },
        })
        .then(() => {
          resolve();
          const { studySituationByStudentIdList } = this.props;
          this.setState(
            {
              reportName: studySituationByStudentIdList.reportName,
              situationConfig:
                studySituationByStudentIdList.studySituationConfig,
              pageLoding: false,
            },
            () => {
              this.info?.handelInitChart();
            },
          );

          this.resetImg();
        });
    });
  };

  resetImg = () => {
    setTimeout(() => {
      const list = document.querySelectorAll(".img");
      for (const element of list) {
        if (element.naturalWidth) {
          element.width = element.naturalWidth / 2;
        }
      }
    }, 500);
  };

  downLodaStudy = () => {
    const {
      match: { params },
    } = this.props;
    let string_ = `${window.location.origin}/api/exam/download/allStudentStudySituation?examId=${this.state.examId}&studentIdList=${params.stuId}`;
    window.open(string_);
  };

  render() {
    const { studySituationByStudentIdList } = this.props;

    return (
      <Spin
        wrapperClassName={styles.spinContent}
        spinning={this.state.pageLoding}
      >
        <div className={styles.pupllAnalyse} style={{ height: "100vh" }}>
          <div
            style={{
              height: "100%",
              width: "1359px",
              display: "flex",
              margin: "0 auto",
            }}
          >
            <div
              className={styles.leftContent}
              style={{ background: "transparent" }}
            ></div>
            <div className={styles.centerWarp}>
              <div className={styles.centerContent} id="centerContent">
                <div className={`${styles.titltName} ${styles.reportNameBox}`}>
                  <span>{this.state.reportName}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "17px",
                  }}
                >
                  <div
                    style={{ marginRight: "40px" }}
                    className={styles.name_group}
                  >
                    {trans("global.group", "班级")}：
                    {studySituationByStudentIdList?.groupName}
                  </div>
                  <div className={styles.name_group}>
                    {trans("global.fullName", "姓名")}：
                    {studySituationByStudentIdList?.studentName}
                  </div>
                </div>
                <div className={styles.summarize}>
                  {trans("previewStu.studentGreeting", "{$name} 同学：", {
                    name: studySituationByStudentIdList?.studentName,
                  })}
                  <br />
                  {studySituationByStudentIdList?.statisticsTotal}
                </div>
                <div id="table0" />
                <WrongQuestionView
                  edit={false}
                  spinning={this.state.modelListLoding[0]}
                  studySituationByStudentIdList={
                    studySituationByStudentIdList || {}
                  }
                  titName={"错题概览"}
                  configData={this.state.situationConfig}
                />
                <div id="table1" />
                <OverallView
                  edit={false}
                  spinning={this.state.modelListLoding[1]}
                  studySituationByStudentIdList={
                    studySituationByStudentIdList || {}
                  }
                  configData={this.state.situationConfig}
                  titName={"整体概览"}
                  getRef={(info) => {
                    this.info = info;
                  }}
                />
                <div id="table2" />
                <WrongQuestionSet
                  edit={false}
                  configData={this.state.situationConfig}
                  spinning={this.state.modelListLoding[2]}
                  studySituationByStudentIdList={
                    studySituationByStudentIdList || {}
                  }
                  titName={trans("global.wrongCollection", "错题集合")}
                />
              </div>
            </div>
            <div className={styles.rightContent}>
              <div style={{ height: "100%", overflowY: "auto" }}>
                <div className={styles.pupllAnalyseBoxRight}>
                  <div className={styles.mentBtn} onClick={this.downLodaStudy}>
                    {trans("global.exportTheReport", "下载当前报告")}
                  </div>
                </div>
                <div className={styles.elevator}>
                  <div className={styles.elevatorTitle}>
                    {trans("global.viewList", "看板目录")}
                  </div>
                  <div>
                    {[
                      "错题概览",
                      "整体概况",
                      trans("global.wrongCollection", "错题集合"),
                    ].map((item, index) => (
                      <div
                        className={`${styles.elevatorListItem} ${index == this.state.elevatorIndex ? styles.active : ""}`}
                        onClick={() => this.setSelect(index)}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  id="maoding"
                  style={{
                    position: "absolute",
                    left: "0",
                    bottom: "10px",
                    display: "none",
                  }}
                >
                  <div
                    className={styles.point}
                    onClick={() => {
                      document.querySelector("#centerContent").scrollTop = 0;
                    }}
                  >
                    <Icon
                      type="vertical-align-top"
                      style={{ fontSize: "18px" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Spin>
    );
  }
}

export default connect(({ home, global, publishToStudent }) => ({
  studySituationByStudentIdList: home.studySituationByStudentIdList,
  trendStuList: home.trendStuList,
  classListData: home.classListData,
  studentList: global.studentList,
}))(PupllAnalyse);

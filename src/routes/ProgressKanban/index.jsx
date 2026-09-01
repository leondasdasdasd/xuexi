import React from "react";
import { Input, Progress, Select, Table } from "antd";
import { connect } from "dva";

import GradeProgress from "../../components/Table/gradeProgress";
import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Option } = Select;
const { Search } = Input;
const { Column } = Table;

const period = [
  {
    name: "幼儿园",
    id: 1,
  },
  {
    name: "小学",
    id: 2,
  },
  {
    name: "初中",
    id: 3,
  },
  {
    name: "高中",
    id: 4,
  },
];

class ProgressKanban extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      defaultSemester: {},
      stageId: null,
      gradeId: null,
      elevatorIndex: 0,
      typeValue: 6,
      btnWidth: 0,
    };
  }

  componentDidMount() {
    console.log("开始监听");
    const handleMessage = (event) => {
      console.log("确认消息来源是否可信", event);
      // // 确认消息来源是否可信
      // if (event.origin === 'http://localhost:8020') {
      //   console.log('接收到父页面的消息:', event.data);
      // }
      this.setState({
        btnWidth: event.data?.btnWidth,
      });
    };

    window.addEventListener("message", handleMessage);

    this.props
      .dispatch({
        type: "home/getStageUnderIdentity",
      })
      .then(() => {
        const { stageUnderIdentityList } = this.props;

        this.props
          .dispatch({
            type: "home/getOptions",
            payload: {
              dashJudge: true,
              ...(stageUnderIdentityList?.length && {
                stage: stageUnderIdentityList[0].stage,
              }),
            },
          })
          .then(() => {
            const { examOptions } = this.props;

            const currentOption =
              examOptions && examOptions.length > 0
                ? examOptions.find((item) => item.current) || examOptions[0]
                : {};

            const gradeId = stageUnderIdentityList?.[0]?.stage || 0;
            const stageId = currentOption.semesterId || 0;

            this.setState(
              {
                gradeId: gradeId,
                defaultSemester: currentOption,
                stageId: stageId,
              },
              () => {
                this.getPage();
              },
            );
          });
      });
  }

  getPage = () => {
    this.props
      .dispatch({
        type: "home/getAnalysisVersion",
        payload: {
          semesterId: this.state.stageId,
          stageId: this.state.gradeId,
          examTypeCode: this.state.typeValue,
        },
      })
      .then(() => {
        const { analysisVersion } = this.props;
      });
  };
  changeType = (value) => {
    this.setState(
      {
        typeValue: value,
      },
      () => {
        this.getPage();
      },
    );
  };

  changeStage = (value) => {
    const { examOptions } = this.props;
    let newSemester = {};
    if (examOptions && examOptions.length > 0) {
      examOptions.map((item) => {
        if (item.semesterId === value) {
          newSemester = item;
        }
      });
    }
    this.setState(
      {
        stageId: value,
        defaultSemester: newSemester,
      },
      () => {
        this.getPage();
        // this.props.dispatch({
        //   type: "home/changeSearch",
        //   payload: {
        //     typeValue: 0,
        //   },
        // });
        // this.props.dispatch({
        //   type: "global/getGrade",
        //   payload: {
        //     stageId: this.state.stageId,
        //   },
        // });
      },
    );
  };

  changeGrade = (value) => {
    this.setState(
      {
        gradeId: value,
      },
      () => {
        this.props
          .dispatch({
            type: "home/getOptions",
            payload: {
              dashJudge: true,
              ...(value && { stage: value }),
            },
          })
          .then(() => {
            const { examOptions } = this.props;
            const currentOption =
              examOptions && examOptions.length > 0
                ? examOptions.find(
                    (item) => item.semesterId == this.state.stageId,
                  ) || examOptions[0]
                : {};

            this.setState(
              {
                defaultSemester: currentOption,
              },
              () => {
                this.getPage();
              },
            );
          });
      },
    );
  };

  setSelect = (index) => {
    this.setState({
      elevatorIndex: index,
    });
    const dom = document.getElementById(`kanbanBodyTable${index + 1}`);
    dom.scrollIntoView(true);
  };

  exportImgClk = () => {
    window.CHART.downloadImage("年级进度");
  };

  render() {
    const { examOptions, analysisVersion, stageUnderIdentityList } = this.props;
    const { defaultSemester, elevatorIndex, typeValue, gradeId } = this.state;
    const elevatorList = [{ name: trans("global.gradeProgress", "年级进度") }];
    analysisVersion &&
      analysisVersion.verticalFlipModelList &&
      analysisVersion.verticalFlipModelList.length > 0 &&
      analysisVersion.verticalFlipModelList.map((item) => {
        elevatorList.push({
          name: item.titleName,
        });
      });
    return (
      <div className={styles.progressKanban}>
        <div
          className={styles.searchBar}
          style={{ paddingLeft: `${this.state.btnWidth}px` }}
        >
          <span
            className={[styles.inline, styles.semesterSelect1].join(" ")}
            data-type="全部学期"
            id="allSemesterId"
          >
            <Select
              onChange={this.changeStage}
              value={this.state.stageId}
              style={{ width: 290 }}
              // open="true"
              getPopupContainer={() => document.querySelector(`#allSemesterId`)}
            >
              <Option value={0} key={0}>
                {trans("global.allSemester", "全部学期")}
              </Option>
              {examOptions && examOptions.length > 0
                ? examOptions.map((item) => (
                    <Option value={item.semesterId} key={item.semesterId}>
                      <span title={item.semesterName}>{item.semesterName}</span>
                    </Option>
                  ))
                : null}
            </Select>
          </span>
          <span className={styles.inline} data-type="全部学段">
            <Select
              onChange={this.changeGrade}
              style={{ width: 120 }}
              placeholder={trans("global.allStage", "全部学段")}
              value={gradeId}
            >
              <Option value={0} key={0}>
                {trans("global.allStage", "全部学段")}
              </Option>
              {stageUnderIdentityList && stageUnderIdentityList.length > 0
                ? stageUnderIdentityList.map((item) => (
                    <Option value={item.stage} key={item.stage}>
                      <span title={item.stageText}>{item.stageText}</span>
                    </Option>
                  ))
                : null}
            </Select>
          </span>
          <span className={styles.inline} data-type="全部类型">
            <Select
              style={{ width: 120 }}
              onChange={this.changeType}
              placeholder={trans("global.allType", "全部类型")}
              value={typeValue}
            >
              {/* <Option value={0}>{trans("global.allType", "全部类型")}</Option> */}
              {defaultSemester.examType &&
                defaultSemester.examType.length &&
                defaultSemester.examType.map((item) => (
                  <Option value={item.examTypeCode} key={item.examTypeCode}>
                    <span title={item.examTypeName}>
                      {language ? item.examTypeName : item.examTypeEnName}
                    </span>
                  </Option>
                ))}
            </Select>
          </span>
        </div>
        <div className={styles.kanbanBody}>
          <div className={styles.tableList}>
            <div
              className={[styles.tableBox, styles.newBox].join(" ")}
              id="kanbanBodyTable1"
            >
              <div className={styles.tableBoxHeader}>
                {/* <span className={styles.tableHeaderSpan}></span> */}
                <span className={styles.tableHeaderTitle}>
                  {trans("global.gradeProgress", "年级进度")}
                </span>
                <div className={styles.operation}>
                  {/* {this.state.check == 2 ? ( */}
                  {/* <span
                    className={styles.exportImg1}
                    onClick={() => this.exportImgClk()}
                  >
                    {trans("global.exportPicture", "截图")}
                  </span> */}
                  {/* ) : null} */}
                  {/* <span className={styles.nameSwith2}>
                    {trans("global.specifyAnalysis", "指定分析")}
                    <Switch
                      defaultChecked
                      checked={this.state.courseDetailSpecify}
                      onChange={this.courseDetailSpecifyChange}
                      style={{ marginLeft: "4px" }}
                    />
                  </span> */}
                  <a
                    href={`${window.location.origin}/api/export/exam/groupScoreAnalyse?examId=`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={styles.export1}>
                      {trans("global.export", "导出")}
                    </span>
                  </a>
                </div>
              </div>
              <div
                className={[
                  styles.tableBoxContent,
                  styles.tableCourseDetail,
                ].join(" ")}
                style={
                  analysisVersion?.progressBoardsList?.length > 8
                    ? { overflowX: "scroll", height: 145 }
                    : {}
                }
              >
                {analysisVersion &&
                  analysisVersion.progressBoardsList &&
                  analysisVersion.progressBoardsList.length > 0 &&
                  analysisVersion.progressBoardsList.map((item) => (
                    <div className={styles.progressBox}>
                      <Progress
                        strokeLinecap="square"
                        type="circle"
                        percent={item.gradeProcess}
                        strokeWidth={13}
                        width={100}
                        strokeColor={
                          item.color == 1
                            ? "#599FF8"
                            : item.color == 2
                              ? "#84D190"
                              : "#F6DB6C"
                        }
                        showInfo={false}
                      />
                      <p className={styles.proportion}>
                        <span className={styles.molecule}>{item.molecule}</span>
                        <span style={{ margin: "0 10px" }}>/</span>
                        <span className={styles.denominator}>
                          {item.denominator}
                        </span>
                      </p>
                      <div className={styles.speedCoreBox}>
                        <p className={styles.speedGradeName}>
                          {item.gradeName}
                        </p>
                        <p className={styles.speedGradeProcess}>
                          {item.gradeProcess}%
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            {analysisVersion &&
              analysisVersion.verticalFlipModelList &&
              analysisVersion.verticalFlipModelList.length &&
              analysisVersion.verticalFlipModelList.map((item, index) => (
                <GradeProgress
                  titleName={item.titleName}
                  id={`kanbanBodyTable${index + 2}`}
                  // subjectBoards={item.subjectBoardsList}
                  subjectBoards={item}
                />
              ))}
          </div>
          <div className={styles.rightContent}>
            <div className={styles.elevator}>
              <div className={styles.elevatorTitle}>
                {trans("global.viewList", "看板目录")}
              </div>
              <div>
                {elevatorList.map((item, index) => (
                  <div
                    className={[
                      styles.elevatorListItem,
                      index === elevatorIndex ? styles.select : "",
                    ].join(" ")}
                    onClick={this.setSelect.bind(this, index)}
                    key={index}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ home, global }) => ({
  examOptions: home.examOptions,
  analysisVersion: home.analysisVersion,
  stageUnderIdentityList: home.stageUnderIdentityList,
}))(ProgressKanban);

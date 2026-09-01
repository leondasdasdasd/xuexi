// 类组件
import React from "react";
import { Empty, Input, message, Select, Table, Tooltip } from "antd";
import RViewerJS from "viewerjs-react";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import {
  advanceRetreatAnalysis,
  attentionStudent,
  examSelect,
  getConfig,
  queryStudentOriginal,
  queryStuGrade,
  saveConfig,
} from "../../services/example";
import { locale, trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
const { Option } = Select;
const { Search } = Input;
let timerId1 = null;

const options = {
  zoom: 0.75,
  toolbar: {
    zoomIn: { size: "large" },
    zoomOut: { size: "large" },
    oneToOne: { size: "large" },
    reset: { size: "large" },
    prev: { show: true, size: "large" },
    play: { show: true, size: "large" },
    next: { show: true, size: "large" },
    rotateLeft: { size: "large" },
    rotateRight: { size: "large" },
    flipHorizontal: { size: "large" },
    flipVertical: { size: "large" },
  },
};

let gradeConfig = {
  advanceCount: 30,
  retreatCount: 30,
  frontCount: 30,
  backCount: 30,
};
let classConfig = {
  advanceCount: 10,
  retreatCount: 10,
  frontCount: 10,
  backCount: 10,
};

/**
 *
 * @param text
 */
function getNumber(text) {
  return text === "--" ||
    text === null ||
    text === undefined ||
    text === "" ||
    text === "0"
    ? 0
    : Number(text?.replace("%", ""));
}
class StudentPerformanceAnalyzer extends React.Component {
  fullscreenRef = React.createRef(null);
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreen: false,
      advanceCount: 10,
      retreatCount: 10,
      frontCount: 10,
      backCount: 10,
      scoreStart: 60,
      scoreEnd: 100,
      comparativeExamId: undefined,
      groupId: undefined,
      stuGradeList: [],
      examSelectList: [],
      tableData: [],
      tableLoading: true,
      currentKey: "advanceCount",
      attention: true,
      analysisTotalTitle: "",
      sortedInfo: {
        order: "descend",
        columnKey: "rankChanges",
      },
      imgSize: 1,
    };
  }

  async componentDidMount() {
    // 获取所有对比试卷
    let res = await examSelect({
      subjectId: this.props.subjectId,
      examId: this.props.examId,
    });
    // 获取所有可选年级
    let res1 = await queryStuGrade({ examId: this.props.examId });

    let res2 = await getConfig({ businessId: this.props.examId, type: 1 });

    if (res.status && res1.status && res2.status) {
      let object = res2.content || {};
      this.setState(
        {
          examSelectList: res.content,
          comparativeExamId: res.content[0]?.examId || 0,
          stuGradeList: res1.content,
          groupId: res1.content[0].groupId,
          ...object,
        },
        () => {
          this.getPage();
        },
      );
    } else {
      let message_ = res.message || res1.message || res2.message;
      message.error(message_);
    }
  }

  followedStudent = (record) => {
    this.setState({
      tableLoading: true,
    });

    attentionStudent({
      isAttention: !record.attention,
      studentId: record.studentUserId,
    })
      .then((res) => {
        if (res.status) {
          message.success(trans("global.operateSuccess", "操作成功！"));
          this.getPage();
        } else {
          message.error(res.message);
          // 操作失败则取消loding
          this.setState({
            tableLoading: false,
          });
        }
      })
      .catch(() => {
        // 接口报错取消loding
        this.setState({
          tableLoading: false,
        });
      });
  };

  viewPaper = (record) => {
    queryStudentOriginal({
      examId: this.props.examId,
      studentId: record.studentUserId,
    }).then((res) => {
      if (res.status) {
        if (!res.content) {
          return message.error(
            trans("studentPerformance.noOriginalPaper", "暂无原卷信息！"),
          );
        }
        this.setState(
          {
            imgArr: res.content,
          },
          () => {
            const img = document
              .querySelector("#stuDentPaperID")
              .querySelector("img");
            console.log(img);
            img?.click();
          },
        );
      } else {
        message.error(res.message);
      }
    });
  };

  leftPanelChange = (e, key) => {
    let object = {};
    object[key] = Number(e.target.value);
    this.setState(object);
  };

  onPressEnter = (key) => {
    this.getPage();
  };

  // 保存左侧配置信息
  saveCurrentConfig = () => {
    const {
      advanceCount,
      retreatCount,
      frontCount,
      backCount,
      scoreStart,
      scoreEnd,
    } = this.state;
    saveConfig({
      type: 1,
      businessId: this.props.examId,
      config: JSON.stringify({
        advanceCount,
        retreatCount,
        frontCount,
        backCount,
        scoreStart,
        scoreEnd,
      }),
    });
  };

  getPage = () => {
    const { comparativeExamId, groupId, currentKey } = this.state;

    if (groupId !== 0) {
      //如果不是全年级，每次询进行一次左侧配置信息的保存
      this.saveCurrentConfig();
    }

    this.setState({
      tableLoading: true,
    });
    let object = {};
    object[currentKey] = this.state[currentKey];

    // 如果选中是scoreStart，则scoreEnd带上
    if (currentKey == "scoreStart") {
      object.scoreEnd = this.state.scoreEnd;
    }

    advanceRetreatAnalysis({
      examId: this.props.examId,
      comparativeExamId: comparativeExamId == 0 ? null : comparativeExamId,
      filterFlag: false,
      positiveOrder: false,
      groupId: groupId == 0 ? null : groupId,
      ...object,
    })
      .then((res) => {
        if (res.status) {
          this.setState({
            tableData: res.content?.singleComparativeResultModelList || [],
            analysisTotalTitle: res.content.analysisTotalTitle,
          });
        } else {
          message.error(res.message);
        }
      })
      .finally(() => {
        this.setState({
          tableLoading: false,
        });
      });
  };

  changeCompareTest = (value) => {
    this.setState(
      {
        comparativeExamId: value,
      },
      () => {
        this.getPage();
      },
    );
  };

  changeGrade = (value) => {
    //选中全部年级
    if (value === 0) {
      //  把当前配置信息存下来
      const { advanceCount, retreatCount, frontCount, backCount } = this.state;
      classConfig = {
        advanceCount: advanceCount,
        retreatCount: retreatCount,
        frontCount: frontCount,
        backCount: backCount,
      };

      // 更新当前配置信息为全年级下
      this.setState(gradeConfig);
    } else {
      //从全部年级离开
      this.setState((previous) => {
        const { advanceCount, retreatCount, frontCount, backCount, groupId } =
          previous;
        if (groupId == 0) {
          // 上个选中的年级时全部年级，则需要把配置信息存到全部年级下
          gradeConfig = {
            advanceCount: advanceCount,
            retreatCount: retreatCount,
            frontCount: frontCount,
            backCount: backCount,
          };
          // 更新当前配置信息为班级下的
          return {
            ...previous,
            ...classConfig,
          };
        }
      });
    }
    this.setState(
      {
        groupId: value,
      },
      () => {
        this.getPage();
      },
    );
  };

  fullscreenChange = (value) => {
    this.setState({
      fullscreen: value,
    });
  };

  selectPanelItem = (key) => {
    if (key == this.state.currentKey) return;

    let sortedInfo = {};

    if (key == "advanceCount") {
      // 进步前
      // 名次变化高->低
      sortedInfo.order = "descend";
      sortedInfo.columnKey = "rankChanges";
    } else if (key == "retreatCount") {
      // 退步前
      // 名次变化低->高
      sortedInfo.order = "ascend";
      sortedInfo.columnKey = "rankChanges";
    } else if (key == "frontCount") {
      // 本次前
      // 本次分数高->低
      sortedInfo.order = "descend";
      sortedInfo.columnKey = "examScoreRate";
    } else if (key == "backCount") {
      // 本次后
      // 本次分数低->高
      sortedInfo.order = "ascend";
      sortedInfo.columnKey = "examScoreRate";
    } else if (key == "scoreStart") {
      // 分数段区间
      // 本次分数高->低
      sortedInfo.order = "descend";
      sortedInfo.columnKey = "examScoreRate";
    } else if (key == "attention") {
      // 我关注的学生
      // 本次分数高->低
      sortedInfo.order = "descend";
      sortedInfo.columnKey = "examScoreRate";
    }

    this.setState(
      {
        currentKey: key,
        sortedInfo,
      },
      () => {
        this.getPage();
      },
    );
  };
  exportChange = () => {
    const { comparativeExamId, groupId, currentKey } = this.state;

    let object = {};
    object[currentKey] = this.state[currentKey];
    // 图过当前选中的是分数区间，需要把scoreEnd也给带上
    if (currentKey == "scoreStart") {
      object.scoreEnd = this.state.scoreEnd;
    }

    let parameters = {
      examId: this.props.examId,
      comparativeExamId: comparativeExamId == 0 ? null : comparativeExamId,
      filterFlag: false,
      positiveOrder: false,
      groupId: groupId,
      languageCode: language ? "cn" : "en",
      ...object,
    };
    let string_ = "";
    for (const key in parameters) {
      const element = parameters[key];
      string_ += `${key}=${element}&`;
    }

    window.open(
      `${window.location.origin}/api/trendComparativeAnalysis/advanceRetreatAnalysisExport?${string_}`,
    );
  };

  handleChange = (pagination, filters, sorter) => {
    console.log("Various parameters", pagination, filters, sorter);
    this.setState({
      sortedInfo: sorter,
    });
  };

  lookPaper = () => {
    const { comparativeExamId, examSelectList } = this.state;
    let result = examSelectList.find(
      (item) => item.examId == comparativeExamId,
    );
    console.log(result);
    let url = `${window.location.origin}/exam#/dataAnalysis/${result.examId || null}/${result.examPaperId || null}/2`;
    window.open(url);
  };

  onClickOriginalVolume = (record, id) => {
    queryStudentOriginal({
      examId: this.props.examId,
      studentId: record.studentUserId,
    }).then((res) => {
      if (res.status) {
        if (!res.content) {
          return message.error(
            trans("studentPerformance.noOriginalPaper", "暂无原卷信息！"),
          );
        }
        this.setState({
          imgArr: res.content,
        });
      } else {
        message.error(res.message);
      }
    });

    this.setState(
      {
        isPreviewVisible: true,
        groupId1: this.state.groupId,
        studentUserId: record.studentUserId,
      },
      () => {
        this.getStudenList(true);
      },
    );
  };

  openImg = (record, text) => {
    const img = document.querySelector("#stuDentPaperID").querySelector("img");
    img?.click();
  };

  closePreview = () => {
    this.setState({
      isPreviewVisible: false,
      selectedStudentIndex: 0,
      studentKeyword: "",
    });
  };

  selectGrade = (id) => {
    this.setState(
      {
        groupId1: id,
      },
      () => {
        this.getStudenList();
      },
    );
  };

  getStudenList = (matchDefaultStudent) => {
    const { comparativeExamId, groupId1, currentKey } = this.state;

    let object = {};
    object[currentKey] = this.state[currentKey];

    // 如果选中是scoreStart，则scoreEnd带上
    if (currentKey == "scoreStart") {
      object.scoreEnd = this.state.scoreEnd;
    }

    advanceRetreatAnalysis({
      examId: this.props.examId,
      comparativeExamId: comparativeExamId == 0 ? null : comparativeExamId,
      filterFlag: false,
      positiveOrder: false,
      groupId: groupId1 == 0 ? null : groupId1,
      ...object,
    }).then((res) => {
      if (res.status) {
        if (this.state.studentKeyword) {
          if (res.content?.singleComparativeResultModelList?.length) {
            let array = res.content?.singleComparativeResultModelList.filter(
              (item) => {
                if (locale() == "en") {
                  if (item.studentEnName.includes(this.state.studentKeyword)) {
                    return item;
                  }
                } else {
                  if (item.studentName.includes(this.state.studentKeyword)) {
                    return item;
                  }
                }
              },
            );
            this.setState(
              {
                studentList: array,
                selectedStudentIndex: 0,
              },
              () => {
                if (this.state.studentList?.length) {
                  this.selectStu(this.state.studentList[0], 0);
                }
              },
            );
          }
        } else {
          this.setState(
            {
              studentList: res.content?.singleComparativeResultModelList || [],
            },
            () => {
              let jjj = 0;
              //  是否匹配默认学生
              if (matchDefaultStudent && this.state.studentList?.length) {
                this.state.studentList.map((item, index) => {
                  if (item.studentUserId == this.state.studentUserId) {
                    jjj = index;
                  }
                });
                // 匹配到学生将学生滚动到可视区域
                document.getElementById(`index${jjj}`)?.scrollIntoView(true);
              } else {
                let studentContent = document.querySelector("#studentContent");
                let imgContent = document.querySelector("#imgContent");
                if (studentContent) {
                  studentContent.scrollTop = 0;
                }
                if (imgContent) {
                  imgContent.scrollTop = 0;
                }
              }
              this.setState(
                {
                  selectedStudentIndex: jjj,
                },
                () => {
                  if (this.state.studentList?.length) {
                    this.selectStu(this.state.studentList[jjj], jjj);
                  }
                },
              );
            },
          );
        }
      } else {
        message.error(res.message);
      }
    });
  };

  searchStudent = (value) => {
    this.setState(
      {
        groupId1: 0,
        studentKeyword: value,
      },
      () => {
        this.getStudenList();
      },
    );
  };

  searchKeywordChange = (value) => {
    this.setState(
      {
        studentKeyword: value,
      },
      () => {
        if (timerId1) {
          clearTimeout(timerId1);
        }
        timerId1 = setTimeout(() => {
          this.setState({
            groupId1: 0,
          });
          this.getStudenList();
        }, 800);
      },
    );
  };

  selectStu = (record, index) => {
    queryStudentOriginal({
      examId: this.props.examId,
      studentId: record.studentUserId,
    }).then((res) => {
      if (res.status) {
        if (!res.content) {
          return message.error(
            trans("studentPerformance.noOriginalPaper", "暂无原卷信息！"),
          );
        }
        this.setState({
          imgArr: res.content,
        });
      } else {
        message.error(res.message);
      }
    });
    this.setState({
      selectedStudentIndex: index,
    });
    let imgContent = document.querySelector("#imgContent");
    if (imgContent) {
      imgContent.scrollTop = 0;
    }
  };

  resizeImage = (key) => {
    let number_ = this.state.imgSize;
    if (key == 0) {
      number_ = number_ * 10 - 1;
    } else if (key == 1) {
      number_ = number_ * 10 + 1;
    } else {
      number_ = 10;
    }
    this.setState({
      imgSize: number_ / 10,
    });
  };

  render() {
    const { stuGradeList, examSelectList, fullscreen, currentKey, sortedInfo } =
      this.state;

    let stuName = "";
    if (locale() == "en") {
      if (
        this.state.studentList &&
        this.state.selectedStudentIndex &&
        this.state.studentList[this.state.selectedStudentIndex]
      ) {
        stuName =
          this.state.studentList[this.state.selectedStudentIndex].studentEnName;
      }
    } else {
      if (
        this.state.studentList &&
        this.state.selectedStudentIndex &&
        this.state.studentList[this.state.selectedStudentIndex]
      ) {
        stuName =
          this.state.studentList[this.state.selectedStudentIndex].studentName;
      }
    }

    const columns = [
      {
        title: trans("global.order", "序号"),
        dataIndex: "integer",
        key: "integer",
        align: "center",
        render: (text, record, index) => <span>{index + 1}</span>,
      },
      {
        title: trans("global.student", "学生"),
        dataIndex: locale() == "en" ? "studentEnName" : "studentName",
        key: locale() == "en" ? "studentEnName" : "studentName",
        width: 80,
      },
      {
        title: trans("global.group", "班级"),
        dataIndex: locale() == "en" ? "groupEnName" : "groupName",
        key: locale() == "en" ? "groupEnName" : "groupName",
      },
      {
        className: "examScoreCol",
        title: trans("global.thisScoreRate", "本次分数得分率"),
        key: "examScoreRate",
        dataIndex: "examScoreRate",
        sortOrder: sortedInfo.columnKey === "examScoreRate" && sortedInfo.order,
        sorter: (a, b) =>
          getNumber(a.examScoreRate) - getNumber(b.examScoreRate),
        align: "center",
        // render: (text, record) => {
        //     if (text.indexOf('.' != -1)) {
        //         let str = text.split('.')
        //         let flag = /^[0]+$/.test(str[1])
        //         // 小数位为0
        //         if (flag) {
        //             return str[0]
        //         }
        //         return text
        //     }
        //     return text
        // }
      },
      {
        title: trans("global.lastScoreRate", "上次得分率"),
        key: "comparativeExamScoreRate",
        dataIndex: "comparativeExamScoreRate",
        align: "center",
        // render: (text, record) => {
        //     if (text.indexOf('.' != -1)) {
        //         let str = text.split('.')
        //         let flag = /^[0]+$/.test(str[1])
        //         // 小数位为0
        //         if (flag) {
        //             return str[0]
        //         }
        //         return text
        //     }
        //     return text
        // }
      },
      {
        className: "scoreChangesCol",
        title: trans("global.scoreChange", "分数变化"),
        key: "scoreChangesRate",
        dataIndex: "scoreChangesRate",
        render: (text, record) => {
          // 规范展示规则：
          // 1. 为 null 或空串 => 显示 "--"
          // 2. 为字符串 "0" => 显示 "0"
          // 3. 其他情况 => 原样展示数据本身
          if (
            text === null ||
            text === undefined ||
            text === "" ||
            text === "--"
          ) {
            return <span>--</span>;
          }

          // 按数值正负设置颜色（支持 "+10%" / "-10%" 等），但不改动原始展示内容
          const number_ = Number.parseFloat(text.replace("%", ""));
          let color;
          if (!isNaN(number_)) {
            if (number_ >= 0) {
              color = "#04C919";
            } else if (number_ < 0) {
              color = "#FC491E";
            }
          }

          return <span style={{ color }}>{text}</span>;
        },
        sortOrder:
          sortedInfo.columnKey === "scoreChangesRate" && sortedInfo.order,
        sorter: (a, b) =>
          getNumber(b.scoreChangesRate) - getNumber(a.scoreChangesRate),
        align: "center",
      },
      {
        title: trans("global.thisGradeRank", "本次年级排名"),
        key: "gradeRanking",
        dataIndex: "gradeRanking",
        sortOrder: sortedInfo.columnKey === "gradeRanking" && sortedInfo.order,
        sorter: (a, b) =>
          (a.gradeRanking == "--" ? 0 : Number(a.gradeRanking)) -
          (b.gradeRanking == "--" ? 0 : Number(b.gradeRanking)),
        align: "center",
      },
      {
        title: trans("global.lastGradeRank", "上次年级排名"),
        key: "comparativeGradeRanking",
        dataIndex: "comparativeGradeRanking",
        align: "center",
      },
      {
        title: trans("global.rankChange", "名次变化"),
        className: "rankChangesCol",
        key: "rankChanges",
        dataIndex: "rankChanges",
        defaultSortOrder: "descend",
        // ortDirections: ['descend', 'ascend'],
        render: (text, record) => {
          return (
            <span>
              {text > 0 ? (
                <i className={icon.iconfont} style={{ color: "#04C919" }}>
                  &#xe8a8;
                </i>
              ) : null}
              {text < 0 ? (
                <i className={icon.iconfont} style={{ color: "#FC491E" }}>
                  &#xe8a7;
                </i>
              ) : null}

              <span
                style={{
                  display: "inline-block",
                  minWidth: "20px",
                  marginLeft: "6px",
                }}
              >
                {text == "--" ? (
                  text
                ) : (
                  <span style={{ color: text > 0 ? "#04C919" : "#FC491E" }}>
                    {text.replaceAll(/[+-]/g, "")}
                  </span>
                )}
              </span>
            </span>
          );
        },
        sortOrder: sortedInfo.columnKey === "rankChanges" && sortedInfo.order,
        sorter: (a, b) =>
          (a.rankChanges == "--" ? 0 : Number(a.rankChanges)) -
          (b.rankChanges == "--" ? 0 : Number(b.rankChanges)),
        align: "center",
      },
      {
        title: trans("global.operation", "操作"),
        key: "action",
        width: 140,
        align: "center",
        render: (text, record) => (
          <>
            <div
              className="table-operate-btn"
              style={{ color: record.attention ? "rgba(1, 17, 61, 0.65)" : "" }}
              onClick={() => {
                this.followedStudent(record);
              }}
            >
              {record.attention
                ? `- ${trans("global.follow", "关注")}`
                : `+ ${trans("global.follow", "关注")}`}
            </div>
            <div
              className="table-operate-btn"
              onClick={() => {
                this.onClickOriginalVolume(record);
              }}
            >
              {trans("global.seeTest", "查看原卷")}
            </div>
          </>
        ),
      },
    ];

    return (
      <div
        className={styles.studentPerformanceAnalyzer}
        id="table10"
        style={
          fullscreen
            ? {
                overflowY: "scroll",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                margin: 0,
                background: "#fff",
                zIndex: 99,
              }
            : {}
        }
      >
        <AreaHeaderComponent
          showFullscreenBtn={true} //显示全屏按钮
          onClickFullscreen={this.fullscreenChange}
          showExportBtn={true} //显示导出按钮
          onClickExport={this.exportChange}
          title={trans("global.progressAnalysis", "进退步分析")}
          leftPanelContent={
            <>
              <div className={styles.selectLabel}>
                {trans("global.thisTest", "本次考试")} VS
              </div>
              <Input.Group
                compact
                style={{
                  marginRight: "12px",
                  width: "auto",
                }}
              >
                <Select
                  onChange={this.changeCompareTest}
                  value={this.state.comparativeExamId}
                  placeholder={trans("global.chooseTest", "选择对比的试卷")}
                  style={{ width: 300 }}
                >
                  <Option value={0} key={0}>
                    {trans("global.chooseTest", "选择对比的试卷")}
                  </Option>
                  {examSelectList && examSelectList.length > 0
                    ? examSelectList.map((item) => (
                        <Option value={item.examId} key={item.examName}>
                          <span title={item.examName}>
                            {language ? item.examName : item.examName}（
                            {item.totalScore}）
                          </span>
                        </Option>
                      ))
                    : null}
                </Select>
                <div
                  style={{
                    width: "auto",
                    fontSize: "12px",
                    color: "#0445FC",
                    cursor: "pointer",
                    lineHeight: "32px",
                    padding: "0 10px",
                    border: "1px solid rgb(217, 217, 217)",
                    borderLeft: "none",
                    height: "32px",
                  }}
                  onClick={this.lookPaper}
                >
                  {trans("global.seeTest", "查看原卷")}
                </div>
              </Input.Group>

              <Select
                onChange={this.changeGrade}
                value={this.state.groupId}
                style={{ width: 174 }}
              >
                <Option value={0} key={0}>
                  {trans("global.allClass", "全部班级")}
                </Option>
                {stuGradeList && stuGradeList.length > 0
                  ? stuGradeList.map((item, index) => (
                      <Option value={item.groupId} key={index + 1}>
                        {language ? item.groupName : item.groupEName}
                      </Option>
                    ))
                  : null}
              </Select>
            </>
          }
        />
        <div className={styles.contentBody}>
          <div className={styles.leftPanel}>
            {[
              {
                label: trans("global.beforeProgress", "进步前"),
                key: "advanceCount",
              },
              {
                label: trans("global.beforeDecline", "退步前"),
                key: "retreatCount",
              },
              { label: trans("global.preTest", "本次前"), key: "frontCount" },
              { label: trans("global.postTest", "本次后"), key: "backCount" },
            ].map((item) => {
              return (
                <div
                  className={`${styles.selectItem} ${currentKey == item.key ? styles.active : ""}`}
                  key={item.key}
                  onClick={() => {
                    this.selectPanelItem(item.key);
                  }}
                >
                  {item.label}
                  <Tooltip
                    title={trans(
                      "studentPerformance.dataRequired",
                      "数据不能为空",
                    )}
                    visible={this.state[item.key] === ""}
                  >
                    <Input
                      min={0}
                      onPressEnter={() => {
                        this.onPressEnter(item.key);
                      }}
                      onChange={(e) => {
                        this.leftPanelChange(e, item.key);
                      }}
                      value={this.state[item.key]}
                    />
                  </Tooltip>
                  {trans("global.rank", "名")}
                </div>
              );
            })}
            <div
              className={`${styles.selectItem} ${currentKey == "scoreStart" ? styles.active : ""}`}
              onClick={() => {
                this.selectPanelItem("scoreStart");
              }}
            >
              <Tooltip
                title={trans("studentPerformance.dataRequired", "数据不能为空")}
                visible={this.state.scoreStart === ""}
              >
                <Input
                  style={{ width: 48, margin: 0 }}
                  onPressEnter={() => {
                    this.onPressEnter("scoreStart");
                  }}
                  onChange={(e) => {
                    this.leftPanelChange(e, "scoreStart");
                  }}
                  value={this.state.scoreStart}
                />
              </Tooltip>
              <div style={{ margin: "0 2px" }}>
                ≤ {trans("global.score", "分数")} ≤
              </div>
              <Tooltip
                title={trans("studentPerformance.dataRequired", "数据不能为空")}
                visible={this.state.scoreEnd === ""}
              >
                <Input
                  style={{ width: 48, margin: 0 }}
                  min={0}
                  onPressEnter={() => {
                    this.onPressEnter("scoreEnd");
                  }}
                  onChange={(e) => {
                    this.leftPanelChange(e, "scoreEnd");
                  }}
                  value={this.state.scoreEnd}
                />
              </Tooltip>
            </div>
            <div
              className={`${styles.selectItem} ${currentKey == "attention" ? styles.active : ""}`}
              onClick={() => {
                this.selectPanelItem("attention");
              }}
            >
              {trans("global.myFollowedStudents", "我关注的学生")}
            </div>
          </div>
          <div className={styles.rightPanel}>
            {this.state.analysisTotalTitle &&
            this.state.tableData &&
            this.state.tableData.length > 0 ? (
              <div className={styles.analysisTotalTitle}>
                {this.state.analysisTotalTitle}
              </div>
            ) : null}

            <Table
              columns={columns}
              dataSource={this.state.tableData}
              pagination={false}
              loading={this.state.tableLoading}
              onChange={this.handleChange}
            />
          </div>
        </div>
        <div
          id="stuDentPaperID"
          style={{ display: "none" }}
          className={styles.imgView}
        >
          <RViewerJS options={options}>
            {this.state.imgArr?.map((item, index) => (
              <img key={index} src={item} />
            ))}
          </RViewerJS>
        </div>
        {this.state.isPreviewVisible ? (
          <div
            style={{
              position: "fixed",
              left: "0",
              top: "0",
              width: "100vw",
              height: "100vh",
              backgroundColor: "#fff",
              zIndex: "999",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "56px",
                display: "flex",
                padding: "0 12px",
                background: "#fff",
                boxShadow: "0px 2px 8px -2px rgba(1,17,61,0.1)",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  marginRight: "auto",
                  fontSize: "16px",
                  color: "#01113D",
                  fontWeight: "500",
                }}
              >
                {this.state.studentList?.length
                  ? trans(
                      "studentPerformance.studentPaperTitle",
                      "{$student}的试卷",
                      {
                        student: stuName || "*同学",
                      },
                    )
                  : trans(
                      "studentPerformance.studentPaperTitle",
                      "{$student}的试卷",
                      {
                        student: "*同学",
                      },
                    )}
              </div>
              <div
                style={{
                  textAlign: "center",
                  background: "#FC491E",
                  borderRadius: "7px",
                  fontFamily: "PingFangSC-Medium",
                  fontSize: "14px",
                  color: "#fff",
                  width: "80px",
                  height: "32px",
                  lineHeight: "32px",
                }}
                onClick={this.closePreview}
              >
                {trans("globalutil.exit", "退出")}
              </div>
            </div>
            <div
              style={{
                height: "calc(100% - 56px)",
                width: "100%",
                display: "flex",
              }}
            >
              <div
                style={{
                  width: "200px",
                  borderRight: "1px solid rgba(1,17,61,0.07)",
                  height: "100%",
                  flexShrink: "0",
                }}
              >
                <div style={{ height: "45px", width: "100%", padding: "8px" }}>
                  <Select
                    onChange={(value) => {
                      this.selectGrade(value);
                    }}
                    value={this.state.groupId1}
                    style={{ width: "100%" }}
                  >
                    <Option value={0} key={0}>
                      {trans("global.allClass", "全部班级")}
                    </Option>
                    {stuGradeList && stuGradeList.length > 0
                      ? stuGradeList.map((item, index) => (
                          <Option value={item.groupId} key={index + 1}>
                            {language ? item.groupName : item.groupEName}
                          </Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div style={{ height: "45px", width: "100%", padding: "8px" }}>
                  <Search
                    placeholder={trans(
                      "testAnalysis.searchStudent",
                      "搜索学生",
                    )}
                    onChange={(e) => {
                      this.searchKeywordChange(e.target.value);
                    }}
                    onSearch={(value) => this.searchStudent(value)}
                    value={this.state.studentKeyword}
                    style={{ width: "100%" }}
                  />
                </div>
                <div
                  style={{ height: "calc(100% - 90px)", overflowY: "auto" }}
                  id="studentContent"
                >
                  {this.state.studentList?.length ? (
                    this.state.studentList?.map((item, index) => {
                      return (
                        <div
                          style={{
                            width: "100%",
                            height: "40px",
                            color:
                              this.state.selectedStudentIndex == index
                                ? "#FFF"
                                : "#01113D",
                            fontSize: "14px",
                            borderBottom: "1px solid rgba(1,17,61,0.07)",
                            lineHeight: "40px",
                            padding: "0 16px",
                            cursor: "pointer",
                            backgroundColor:
                              this.state.selectedStudentIndex == index
                                ? "rgba(4,69,252,1)"
                                : "#fff",
                            display: "flex",
                            alignItems: "center",
                          }}
                          id={`index${index}`}
                          onClick={() => {
                            this.selectStu(item, index);
                          }}
                        >
                          <div
                            style={{ marginRight: "auto", fontWeight: "500" }}
                          >
                            {locale() == "en"
                              ? item.studentEnName
                              : item.studentName}
                          </div>
                          <div style={{ fontWeight: "400" }}>
                            {item.studentScore}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              </div>
              <div
                style={{
                  width: "calc(100% - 200px)",
                  height: "100%",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    overflow: "auto",
                    whiteSpace: "nowrap",
                  }}
                  id="imgContent"
                >
                  {this.state.studentList?.length ? (
                    this.state.imgArr?.map((element, index) => {
                      return (
                        <>
                          <img
                            src={element}
                            style={{
                              width: `calc(${(100 * this.state.imgSize) / 2}% - 5px)`,
                              marginBottom: "20px",
                              marginRight: (index + 1) % 2 == 1 ? "10px" : "0",
                            }}
                            onDoubleClick={this.openImg}
                          />
                          {(index + 1) % 2 == 0 ? <br /> : null}
                        </>
                      );
                    })
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "calc(50% - 60px)",
                    color: "#fff",
                    display: "flex",
                    textAlign: "center",
                    userSelect: "none",
                  }}
                >
                  <div
                    style={{
                      marginRight: "12px",
                      background: "rgb(0, 0, 0, 0.5)",
                      borderRadius: "5px",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      this.resizeImage(0);
                    }}
                  >
                    <i className={styles.iconfont} style={{ fontSize: "20px" }}>
                      &#xe8c8;
                    </i>
                  </div>
                  <div
                    style={{
                      padding: "0 7px",
                      marginRight: "12px",
                      minWidth: "32px",
                      height: "32px",
                      background: "rgb(0, 0, 0, 0.5)",
                      fontSize: "16px",
                      textAlign: "center",
                      borderRadius: "5px",
                      lineHeight: "32px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      this.resizeImage(2);
                    }}
                  >
                    <span>1</span>:<span>1</span>
                  </div>
                  <div
                    style={{
                      marginRight: "12px",
                      background: "rgb(0, 0, 0, 0.5)",
                      borderRadius: "5px",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      this.resizeImage(1);
                    }}
                  >
                    <i className={styles.iconfont} style={{ fontSize: "20px" }}>
                      &#xe8c7;
                    </i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default StudentPerformanceAnalyzer;

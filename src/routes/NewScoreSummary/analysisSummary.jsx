import React, { Fragment, PureComponent } from "react";
import {
  Alert,
  Button,
  InputNumber,
  message,
  Popconfirm,
  Radio,
  Spin,
  Tooltip,
} from "antd";
import { connect } from "dva";

import ComnModal from "../../components/ComnModal";
import Directory from "../../components/Directory";
import MyButton from "../../components/MyButton";
import {
  classRate,
  classSummary,
  getExamModule,
  missStudentList,
  summaryDelete,
  summaryDetail,
  summaryFrontAnalysis,
} from "../../services/exam";
import { getConfig, saveConfig } from "../../services/example";
import { checkPermission } from "../../services/global";
import { locale, trans } from "../../utils/i18n";
import { aesDecrypt, aesEncrypt, loginRedirect } from "../../utils/utils";
import AbsentStudentsTable from "./components/AbsentStudentsTable";
import ActionButtons from "./components/ActionButtons";
import AiAnalysis from "./components/AiAnalysis";
import ClassAnalysis from "./components/ClassAnalysis";
import ExamInfoBar from "./components/ExamInfoBar";
import ExamTitle from "./components/ExamTitle";
import FailedAnalysis from "./components/FailedAnalysis";
import NavigationTabs from "./components/NavigationTabs";
import OverallReportCard from "./components/OverallReportCard";
import QualityBenchmark from "./components/QualityBenchmark";
import ScoreChart from "./components/ScoreChart";
import StudentRankingTable from "./components/StudentRankingTable";
// import TeacherRemarks from './components/TeacherRemarks'
import StudentSelectionPanel from "./components/StudentSelectionPanel";
import TopNTable from "./components/TopNTable";

import styles from "./analysisSummary.module.less";
let SIZEMAP = {
  1: 60,
  2: 125,
  3: 140,
  4: 160,
  5: 180,
  6: 200,
};

/**
 * 从 hash 路由中读取查询参数，避免页面标签变化时误把后续 hash 内容拼进加密参数。
 * @param {string} key 需要读取的查询参数名。
 * @returns {string} 查询参数值，未命中时返回空字符串。
 */
/**
 * 解码 hash query 片段，兼容旧链接中未编码的 AES 加密串。
 * @param {string} value query 中的原始 key 或 value。
 * @returns {string} 解码后的值；解码失败时返回原值，避免破坏加密串。
 */
function decodeHashQueryPart(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

/**
 * 从 hash 路由中读取查询参数，避免 URLSearchParams 把 AES 加密串中的 + 改成空格。
 * @param {string} key 需要读取的查询参数名。
 * @returns {string} 查询参数值，未命中时返回空字符串。
 */
export function getHashQueryValue(key) {
  const hash = window.location.hash || "";
  const queryString = hash.includes("?")
    ? hash.slice(hash.indexOf("?") + 1)
    : "";
  if (!queryString) {
    return "";
  }
  const matchedPair = queryString.split("&").find((item) => {
    const equalIndex = item.indexOf("=");
    const queryKey = equalIndex >= 0 ? item.slice(0, equalIndex) : item;
    return decodeHashQueryPart(queryKey) === key;
  });
  if (!matchedPair) {
    return "";
  }
  const equalIndex = matchedPair.indexOf("=");
  const rawValue = equalIndex >= 0 ? matchedPair.slice(equalIndex + 1) : "";
  return decodeHashQueryPart(rawValue);
}

/**
 * 生成成绩汇总分析页 date 查询参数，确保 AES 加密串里的 +、/、= 不被浏览器解析改写。
 * @param {string} encryptedDate AES 加密后的 date 参数。
 * @returns {string} 可拼接到 hash 路由后的查询字符串。
 */
export function buildAnalysisSummaryDateQuery(encryptedDate) {
  return `date=${encodeURIComponent(encryptedDate || "")}`;
}

class AnalysisSummary extends PureComponent {
  constructor(properties) {
    super(properties);
    this.scoreChartRef = React.createRef();

    const { tabsKey = "classAnalysis" } = this.props.match.params;

    this.id = "";
    this.gradeId = "";
    this.semesterId = "";
    this.reportType = "";

    this.studentMultiSubjectReportContentRef = React.createRef();
    const queryParameters = getHashQueryValue("date");
    if (queryParameters) {
      try {
        const objectString = aesDecrypt(queryParameters, "lsk");
        const queryParameters_ = JSON.parse(objectString);
        const { id, gradeId, semesterId, reportType } = queryParameters_;
        console.log(queryParameters_, "queryParams");
        this.id = id; //报告id 可能为空，为空时表示是系统生成的汇总报告页面
        this.gradeId = gradeId;
        this.semesterId = semesterId;
        this.reportType = reportType;
      } catch (error) {
        console.warn("成绩汇总参数解析失败，已按无报告参数继续加载", error);
      }
    }

    this.state = {
      contrastReportId: undefined,
      activeKey: tabsKey,
      loading: false,
      numPhaseList: [],
      selectMethod: 0,
      studentRankingData: [],
      searchStudentKeyWord: "",
      rankingVis: false,
      reportDetail: {},
      rankingStageList: [],
      failedExamResultResponses: [],
      pageSize: 100,
      studentReport: {},
      contrastList: [],
      scoreChartData: [],
      scoreChartData2: [],
      viewGroup: false,
    };
  }
  componentDidMount() {
    checkPermission({
      permissionCode: "exam:scoreSummary:displayRanking",
    }).then((res) => {
      if (res.content) {
        this.setState({
          rankingVis: true,
        });
      }
    });

    // 获取校级配置，根据配置展示不同内容
    getExamModule().then((res) => {
      if (res.status) {
        if (res.content) {
          for (const item of res.content) {
            if (
              item.groupCode == "PRECISION_TEACHING" &&
              item.childModuleCodeList
            ) {
              if (
                item.childModuleCodeList.includes(
                  "SUMMARY_REPORT_FRONT_ANALYSIS",
                )
              ) {
                this.setState({
                  SUMMARY_REPORT_FRONT_ANALYSIS: true,
                });
              }
              if (
                item.childModuleCodeList.includes(
                  "SUMMARY_REPORT_STUDENT_ANALYSIS",
                )
              ) {
                this.setState({
                  SUMMARY_REPORT_STUDENT_ANALYSIS: true,
                });
              }
            }
          }
        }
      } else {
        message.error(res.message);
      }
    });

    this.getPage();
    this.getDetail();
  }

  // 获取详情接口
  getDetail = () => {
    let parameters = {};
    // 系统生成的汇总报告页面编辑规则
    if (this.id) {
      parameters.id = this.id;
    } else {
      parameters.gradeId = this.gradeId;
      parameters.reportType = this.reportType;
      parameters.semesterId = this.semesterId;
    }
    summaryDetail(parameters).then((res) => {
      if (res.status && res.content) {
        let object = {
          ...res.content,
        };

        if (res.content.createTime) {
          object.handelCreateTime = res.content.createTime.split(" ")[0];
        }

        this.setState({
          reportDetail: object,
        });
      } else {
        message.error(res.message);
      }
    });
  };

  editTitle = () => {};

  handleQualityBenchmarkReportIdChange = (summaryReportId) => {
    if (!summaryReportId || this.id) {
      return;
    }
    this.id = summaryReportId;
    this.setState({
      reportDetail: {
        ...this.state.reportDetail,
        id: summaryReportId,
      },
    });
  };

  summaryContrastList = () => {
    this.props.dispatch({
      type: "exam/summaryContrastList",
      payload: {
        // gradeId: this.state.selectedGroupId
      },
      onSuccess: (res) => {
        this.setState({
          contrastList: res.content,
        });
      },
    });
  };

  handleDelete = () => {};

  handleReportSettings = () => {
    const { id, applyGrades, reportType, semesterId } = this.state.reportDetail;
    if (id) {
      window.open(`${window.location.origin}/exam#/newScoreSummary/add/${id}`);
    } else {
      // 系统生成的报告
      window.open(
        `${window.location.origin}/exam#/newScoreSummary/add/${null}/${applyGrades[0]}/${reportType}/${semesterId}`,
      );
    }
  };

  getMenuData = () => {
    let array = [
      {
        label: trans("data.classAnalysis", "班级分析"),
        key: "classAnalysis",
      },
      {
        label: trans("global.studentAnalysis", "学生分析"),
        key: "studentAnalysis",
      },
      {
        label: trans("global.failedAnalysis", "不及格分析"),
        key: "failedAnalysis",
      },
      {
        label: trans("global.absentStudents", "缺考学生"),
        key: "absentStudents",
      },
    ];

    if (this.state.SUMMARY_REPORT_FRONT_ANALYSIS) {
      array.push({
        label: trans("global.topNAnalysis", "前N名分析"),
        key: "topNAnalysis",
      });
    }

    array.push({
      label: trans("scoreSummary.crossSchoolComparison", "校内外对比"),
      key: "qualityBenchmark",
    });

    if (this.state.SUMMARY_REPORT_STUDENT_ANALYSIS) {
      array.push({
        label: trans("global.studentMultiSubjectReport", "学生多科学情报告"),
        key: "studentMultiSubjectReport",
      });
    }
    // arr.push({
    //     label: trans("global.classMultiSubjectReport", "班级多科学情报告"),
    //     key: "classMultiSubjectReport"
    // })

    return array;
  };

  tabChange = (key) => {
    console.log("切换到:", key);

    const queryParameters = getHashQueryValue("date");

    this.props.history.push(
      `/newScoreSummary/analysisSummary/${key}?${buildAnalysisSummaryDateQuery(queryParameters)}`,
    );

    this.setState(
      {
        activeKey: key,
      },
      () => {
        this.getPage(key);
      },
    );
  };

  back = () => {
    window.close();
  };

  exportFail = (value) => {
    let url = window.origin;
    if (value == 1) {
      url += this.id
        ? `/api/exam/summary/export/class/summary?id=${this.id}`
        : `/api/exam/summary/export/class/summary?gradeId=${this.gradeId}&reportType=${this.reportType}&semesterId=${this.semesterId}`;
    } else if (value == 2) {
      url += this.id
        ? `/api/exam/summary/export/class/rate?id=${this.id}`
        : `/api/exam/summary/export/class/rate?gradeId=${this.gradeId}&reportType=${this.reportType}&semesterId=${this.semesterId}`;
    } else if (value == 3) {
      url += this.id
        ? `/api/exam/summary/export/flunkNew/student?id=${this.id}&viewGroup=${this.state.viewGroup}`
        : `/api/exam/summary/export/flunkNew/student?gradeId=${this.gradeId}&reportType=${this.reportType}&semesterId=${this.semesterId}&viewGroup=${this.state.viewGroup}`;
    } else if (value == 4) {
      url += this.id
        ? `/api/exam/summary/export/flunk/student?id=${this.id}`
        : `/api/exam/summary/export/flunk/student?gradeId=${this.gradeId}&reportType=${this.reportType}&semesterId=${this.semesterId}`;
    } else if (value == 5) {
      url += this.id
        ? `/api/exam/summary/export/class/student?id=${this.id}`
        : `/api/exam/summary/export/class/student?gradeId=${this.gradeId}&reportType=${this.reportType}&semesterId=${this.semesterId}`;
    } else if (value == 6) {
      url += this.id
        ? `/api/exam/summary/export/missStudentList?id=${this.id}`
        : `/api/exam/summary/export/missStudentList?gradeId=${this.gradeId}&reportType=${this.reportType}&semesterId=${this.semesterId}`;
    } else if (value == 7) {
      url += this.id
        ? `/api/exam/summary/export/front/analysis?id=${this.id}`
        : `/api/exam/summary/export/front/analysis?gradeId=${this.gradeId}&reportType=${this.reportType}&semesterId=${this.semesterId}`;
    }

    window.open(url);
  };

  getPage = (key = this.state.activeKey) => {
    this.setState({
      loading: true,
    });
    let parameters = {};
    if (this.id) {
      parameters.id = this.id;
    } else {
      parameters.gradeId = this.gradeId;
      parameters.reportType = this.reportType;
      parameters.semesterId = this.semesterId;
    }

    if (key == "classAnalysis") {
      this.setState({
        loading: false,
      });
      classSummary(parameters).then((res) => {
        if (res.ifLogin) {
          if (res.status) {
            if (res.content?.length) {
              this.setState({
                classSummaryData: res.content,
              });
            }
          } else {
            message.error(res.message);
          }
        } else {
          loginRedirect();
        }
      });
      classRate(parameters).then((res) => {
        if (res.status) {
          if (res.content?.length) {
            this.setState({
              classRateData: res.content,
            });
          }
        } else {
          message.error(res.message);
        }
      });
    } else if (key == "studentAnalysis") {
      this.setState({
        loading: true,
      });

      this.props.dispatch({
        type: "home/getScoreSummary1",
        payload: {
          pageNo: this.state.pageNo,
          limit: this.state.pageSize,
          searchStudentKeyWord: this.state.searchStudentKeyWord,
          ...parameters,
        },
        onSuccess: (res) => {
          const { columnSet, studentExamResultSummaryAnalyseRowList } =
            res.content;

          // 学生排行榜
          let list = [];
          if (studentExamResultSummaryAnalyseRowList?.length) {
            studentExamResultSummaryAnalyseRowList.map((item, index) => {
              let newObject = {
                sort: item.sort,
                name: locale() == "en" ? item.studentEnName : item.studentName,
                avatar: item.avatarUrl || "",
                studentEnName: item.studentEnName,
                groupName: item.groupName,
                sex: item.sex || 0,
                item: item,
                sortStu: item,
                key: item.studentId,
                index: index + 1,
              };

              if (item.examResultSummaryAnalyseRow?.length) {
                item.examResultSummaryAnalyseRow.map((index) => {
                  if (columnSet?.length) {
                    columnSet.map((it) => {
                      if (it.subjectId === index.subjectId) {
                        newObject[`${it.subjectId}Score`] = index.score;
                        newObject[`${it.subjectId}scoreRatePass`] =
                          index.scoreRatePass;
                        newObject[`${it.subjectId}sortStu`] = index.sort;
                        newObject[`${it.subjectId}groupName`] = index.groupName;
                        newObject[`${it.subjectId}ratioScore`] =
                          index.ratioScore;
                      }
                    });
                  }
                });
              }
              list.push(newObject);
            });
          }
          this.setState({
            loading: false,
            studentRankingData: list,
          });
        },
      });
    } else if (key == "failedAnalysis") {
      this.props.dispatch({
        type: "home/postFlunkListByStudent1",
        payload: {
          viewGroup: this.state.viewGroup,
          ...parameters,
        },
        onSuccess: (res) => {
          this.setState({
            loading: false,
          });
          if (res.content) {
            this.setState({
              failedAnalysisData: res.content,
            });
          }
        },
      });
    } else if (key == "absentStudents") {
      missStudentList(parameters)
        .then((res) => {
          if (res.ifLogin) {
            if (res.status) {
              if (!res.content) return;

              let newColumns3 = [
                {
                  title: trans("global.order", "序号"),
                  align: "center",
                  children: [
                    {
                      title: "",
                      align: "center",
                      dataIndex: "index",
                    },
                  ],
                },
                {
                  title: trans("global.studentNumber", "学号"),
                  key: "studentNo",
                  align: "center",
                  children: [
                    {
                      align: "center",
                      dataIndex: "studentNo",
                    },
                  ],
                },
                {
                  title: trans("global.student", "学生"),
                  key: "studentName",
                  align: "center",
                  children: [
                    {
                      align: "center",
                      dataIndex: "studentName",
                    },
                  ],
                },
                {
                  title: trans("global.group", "班级"),
                  key: "groupName",
                  sorter: (a, b) => a.groupId - b.groupId,
                  sortDirections: ["descend", "ascend"],
                  align: "center",
                  children: [
                    {
                      align: "center",
                      dataIndex: "groupName",
                    },
                  ],
                },
                {
                  title: trans("global.absentSubjectsCount", "缺考学科数"),
                  key: "missExamCount",
                  sorter: (a, b) => a.missExamCount - b.missExamCount,
                  sortDirections: ["descend", "ascend"],
                  defaultSortOrder: "descend",
                  align: "center",
                  children: [
                    {
                      align: "center",
                      dataIndex: "missExamCount",
                    },
                  ],
                },
              ];
              const {
                columnSet,
                studentExamResultSummaryAnalyseRowList,
                failSubjectList,
              } = res.content;

              if (columnSet?.length) {
                columnSet.map((item, index) => {
                  let failCount = failSubjectList?.find(
                    (ele) => ele.subjectId == item.subjectId,
                  )?.failCount;
                  newColumns3.push({
                    title: `${item.subjectName}${item.totalScore}`,
                    key: `${item.subjectId}Miss`,
                    sorter: (a, b) =>
                      a[`${item.subjectId}Miss`] - b[`${item.subjectId}Miss`],
                    sortDirections: ["descend", "ascend"],
                    align: "center",
                    children: [
                      {
                        align: "center",
                        dataIndex: `${item.subjectId}Miss`,
                        title: failCount
                          ? `${trans("global.gong", "共")}  ${failCount} ${locale() == "en" ? "Students" : "人"}`
                          : null,
                        render: (text, record, index) => {
                          return (
                            <div>
                              <span
                                className={styles.importMessage}
                                style={{ color: "rgba(1,17,61,0.85)" }}
                              >
                                {record[`${item.subjectId}Miss`]
                                  ? trans("global.absent", "缺考")
                                  : ""}
                              </span>
                            </div>
                          );
                        },
                      },
                    ],
                  });
                });
              }

              let missAnExamTableData = [];
              if (studentExamResultSummaryAnalyseRowList?.length) {
                studentExamResultSummaryAnalyseRowList.map((item, index) => {
                  let newObject = {
                    studentNo: item.studentNo,
                    studentName: item.studentName,
                    groupName: item.groupName,
                    missExamCount: item.missExamCount,
                    groupId: item.groupId,
                    key: item.studentNo,
                    index: index + 1,
                  };
                  if (item.examResultSummaryAnalyseRow?.length) {
                    item.examResultSummaryAnalyseRow.map((index) => {
                      if (columnSet && columnSet.length > 0) {
                        columnSet.map((it) => {
                          if (it.subjectId === index.subjectId) {
                            newObject[`${it.subjectId}Miss`] = true;
                          }
                        });
                      }
                    });
                  }
                  missAnExamTableData.push(newObject);
                });
              }

              this.setState({
                newColumns3: newColumns3,
                missAnExamTableData: missAnExamTableData,
              });
            } else {
              message.error(res.message);
            }
          } else {
            loginRedirect();
          }
        })
        .finally(() => {
          this.setState({
            loading: false,
          });
        });
    } else if (key == "topNAnalysis") {
      summaryFrontAnalysis(parameters)
        .then((response) => {
          if (response.ifLogin) {
            if (response.status) {
              let newColumns4 = [
                {
                  title: `${trans("global.zongfen", "总分")}/${trans("global.subject", "科目")}`,
                  dataIndex: "subjectName",
                  key: "subjectName",
                  width: 140,
                  align: "center",
                  render: (text, record, index) => {
                    // 用于存储行跨度信息
                    return {
                      children: (
                        <div
                          style={{
                            color: "rgba(1,17,61,0.85)",
                            textAlign: "center",
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ width: "100%" }}>{text}</div>
                          <div style={{ width: "100%" }}>
                            {trans("global.gradeaverage", "年级均分")}{" "}
                            {record.subjectAvgScore}
                          </div>
                        </div>
                      ),
                      props: {
                        rowSpan: record.rowSpan,
                      },
                    };
                  },
                },
                {
                  title: trans("global.group", "班级"),
                  dataIndex: "groupName",
                  key: "groupName",
                  width: 120,
                  align: "center",
                },
                {
                  title: trans("global.courseTeacher", "授课老师"),
                  dataIndex: "teacherNames",
                  key: "teacherNames",
                  align: "center",
                  render: (text, record, index) => {
                    return (
                      <div>
                        <span
                          className={styles.importMessage}
                          style={{ color: "rgba(1,17,61,0.85)" }}
                        >
                          {text}
                          <br />
                        </span>
                      </div>
                    );
                  },
                },
                {
                  title: trans("global.classAverageScore", "班级均分"),
                  dataIndex: "groupAvgScore",
                  key: "groupAvgScore",
                  align: "center",
                },
              ];

              for (const it of response.content[0].groupScoreList[0]
                .studentSortCount) {
                newColumns4.push({
                  title: trans("scoreSummary.topRank", "前{$count}名", {
                    count: it,
                  }),
                  dataIndex: `ranking${it}`,
                  key: `ranking${it}`,
                  align: "center",
                });
              }

              let tableDataArray = [];
              for (const item of response.content) {
                for (const [index, item1] of item.groupScoreList.entries()) {
                  let parameters_ = {
                    rowSpan: index == 0 ? item.groupScoreList.length : 0,
                    subjectName: item.subjectName,
                    subjectAvgScore: item.subjectAvgScore,
                    groupName: item1.groupName,
                    groupId: item1.groupId,
                    groupAvgScore: item1.groupAvgScore,
                    teacherNames: item1.teacherNames,
                  };

                  for (const [ind, it] of item1.studentSortCount.entries()) {
                    parameters_[`ranking${it}`] = item1.studentSortScore[ind];
                  }

                  tableDataArray.push(parameters_);
                }
              }
              this.setState({
                frontTableData: tableDataArray,
                newColumns4: newColumns4,
              });
            } else {
              message.error(response.message);
            }
          } else {
            loginRedirect();
          }
        })
        .finally(() => {
          this.setState({
            loading: false,
          });
        });
    } else if (key == "qualityBenchmark") {
      this.setState({
        loading: false,
        qualityBenchmarkLoading: true,
      });
      this.props.dispatch({
        type: "home/getScoreSummary1",
        payload: {
          pageNo: 1,
          limit: 9999,
          ...parameters,
        },
        onSuccess: (response) => {
          this.setState({
            qualityBenchmarkScoreSummary: response.content || {},
          });
        },
      });
      Promise.all([classSummary(parameters), classRate(parameters)])
        .then(([summaryResponse, rateResponse]) => {
          if (!summaryResponse.ifLogin || !rateResponse.ifLogin) {
            loginRedirect();
            return;
          }
          if (summaryResponse.status) {
            this.setState({
              qualityBenchmarkSummaryData: summaryResponse.content || [],
            });
          } else {
            message.error(summaryResponse.message);
          }
          if (rateResponse.status) {
            this.setState({
              qualityBenchmarkRateData: rateResponse.content || [],
            });
          } else {
            message.error(rateResponse.message);
          }
        })
        .finally(() => {
          this.setState({
            qualityBenchmarkLoading: false,
          });
        });
    } else if (key == "studentMultiSubjectReport") {
      this.setState({
        loading: true,
      });
      // 系统生成 获取id后更新数据
      if (this.id) {
        this.getGroupData(this.id);
      } else {
        this.props.dispatch({
          type: "exam/summaryCreateSystem",
          payload: {
            gradeId: this.gradeId,
            reportType: this.reportType,
            semesterId: this.semesterId,
          },
          onSuccess: (res) => {
            if (res.content) {
              this.id = res.content;

              const string_ = aesEncrypt(
                JSON.stringify({ id: this.id }),
                "lsk",
              );
              const url = new URL(window.location.href);
              const newUrl = `${url.pathname}${url.hash.split("?")[0]}?${buildAnalysisSummaryDateQuery(
                string_,
              )}`;
              // 将加密后的id参数添加到URL中，但保持URL中的hash部分不变
              // 例如: /path#/tab?date=encryptedId -> /path#/tab?date=newEncryptedId
              window.history.replaceState(null, "", newUrl);

              this.getGroupData(this.id);
            }
          },
        });
      }
    }
  };

  getGroupData = (id) => {
    this.props.dispatch({
      type: "exam/paperGroupNames",
      payload: {
        reportId: id,
      },
      onSuccess: (res) => {
        console.log("onSuccess,onSuccess");
        if (res.content?.length) {
          this.setState(
            {
              classListData: res.content,
              loading: false,
              selectedGroupId: res.content[0].groupId,
              pageNo: 1,
            },
            () => {
              this.getStudentData(this.state.selectedGroupId);
              // 获取对比报告可选的列表
              this.summaryContrastList();
            },
          );
        } else {
          this.clearGroups();
        }
      },
    });
  };

  clickEditSegment = (status) => {
    getConfig({
      type: 5,
      businessId: this.id ? this.id : 0,
      schoolLevel: true,
    }).then((res) => {
      if (res.ifLogin) {
        if (res.status) {
          const { scoreSectionDetailList } = res.content;
          let temporaryList = scoreSectionDetailList?.map(
            (item) => item.endScore - item.startScore,
          );
          this.setState({
            numPhaseList: temporaryList || ["", "", ""],
            numPhase: temporaryList?.length || 3,
            segmentId: res.content.id,
          });
        } else {
          message.error(res.message);
        }
      } else {
        loginRedirect();
      }
    });
    this.setState({
      adjusting: true,
    });
  };

  clickReduce = () => {
    if (this.state.numPhase > 3) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(-2, 1);
      this.setState({
        numPhase: this.state.numPhase - 1,
        numPhaseList: array,
      });
    }
  };

  changeAfter = (value) => {
    if (typeof value == "number" && value > 0) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(0, 1, value);
      this.setState({
        numPhaseList: array,
      });
    }
  };

  chengeMiddle = (index, value) => {
    if (typeof value == "number" && value > 0) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(index, 1, value);
      this.setState({
        numPhaseList: array,
      });
    }
  };

  getMiddle = (index) => {
    let { numPhaseList, numPhase } = this.state;
    if (numPhase == 3) {
      return (
        <span>
          {`(${numPhaseList[index - 1]}%~${Number(numPhaseList[index - 1]) + Number(numPhaseList[index])}%]`}
        </span>
      );
    } else {
      let sum = 0;
      for (let index_ = index - 1; index_ >= 0; index_--) {
        sum += Number(numPhaseList[index_]);
      }
      return <span>{`(${sum}%~${sum + Number(numPhaseList[index])}%]`}</span>;
    }
  };

  changeFront = (value) => {
    if (typeof value == "number" && value > 0) {
      let array = JSON.parse(JSON.stringify(this.state.numPhaseList));
      array.splice(-1, 1, value);
      this.setState({
        numPhaseList: array,
      });
    }
  };

  sum = (array) => {
    var s = 0;
    for (var index = array.length - 1; index >= 0; index--) {
      s = s + (array[index] - 0);
    }
    return s;
  };

  clickAddd = () => {
    let newArray = [""];
    this.state.numPhaseList.map((item) => {
      newArray = [...newArray, ""];
    });
    this.setState({
      numPhase: this.state.numPhase + 1,
      numPhaseList: newArray,
    });
  };

  changeSelectMethod = (e) => {
    this.setState({
      selectMethod: e.target.value,
      numPhaseList: ["", "", ""],
      numPhase: 3,
    });
  };

  handleCancel = () => {
    this.setState({
      adjusting: false,
    });
  };

  handleOk = (status) => {
    console.log(status, "status");

    const { numPhaseList, numPhase } = this.state;

    let array = [];
    if (this.state.numPhaseList.length > 0) {
      this.state.numPhaseList.map((item, index) => {
        if (index == 0) {
          array.push({
            startScore: 0,
            endScore: item,
          });
        } else if (index == numPhase) {
          array.push({
            startScore: 100 - item,
            endScore: 100,
          });
        } else {
          let sum = 0;
          for (let index_ = index - 1; index_ >= 0; index_--) {
            sum += Number(numPhaseList[index_]);
          }
          array.push({
            startScore: sum,
            endScore: sum + Number(numPhaseList[index]),
          });
        }
      });
    }

    if (array.length > 0) {
      let parameters = {
        type: 5,
        businessId: this.id ? this.id : 0, //成绩汇总id
        schoolLevel: status == true ? true : false,
        config: JSON.stringify({
          fraction: this.state.selectMethod,
          scoreSectionDetailList: array,
        }),
      };
      if (this.state.segmentId) {
        parameters.id = this.state.segmentId;
      }
      saveConfig(parameters).then((res) => {
        if (res.ifLogin) {
          if (res.status) {
            this.setState(
              {
                numPhaseList: ["", "", ""],
                corresponding: ["", "", ""],
                adjusting: false,
              },
              () => {
                this.getPage();
              },
            );
          }
        } else {
          loginRedirect();
        }
      });
    }
  };

  changeNo = (value, pageSize) => {
    this.setState(
      {
        pageNo: value,
      },
      () => {
        this.getPage();
      },
    );
  };

  onShowSizeChange = (current, pageSize) => {
    this.setState(
      {
        pageNo: 1,
        pageSize,
      },
      () => {
        this.getPage();
      },
    );
  };

  getStudentRankColumns = () => {
    const { scoreSummary } = this.props;
    // 学生排行榜
    let newColumns = [];
    if (this.state.checkedRanking) {
      if (scoreSummary.columnSet?.length) {
        newColumns = [
          {
            title: trans("global.order", "序号"),
            fixed: "left",
            align: "center",
            children: [
              {
                width: 60,
                dataIndex: "index",
                key: "index",
                align: "center",
              },
            ],
          },
          {
            title: trans("global.student", "学生"),
            width: 100,
            fixed: "left",
            align: "center",
            children: [
              {
                title: `${scoreSummary.studentTotalNum}${trans("global.students", "名学生")}`,
                dataIndex: "name",
                key: "name",
                width: 100,
                align: "center",
              },
            ],
          },
          {
            title: trans("global.intoClass", "所在班级"),
            width: 120,
            align: "center",
            children: [
              {
                title: trans("global.averageScore", "平均成绩"),
                dataIndex: "groupName",
                key: "groupName",
                width: 120,
                align: "center",
              },
            ],
          },
        ];
        scoreSummary.columnSet.map((item, index) => {
          if (item.ratioScore) {
            newColumns.push(
              {
                title: `${item.subjectName}（${item.totalScore}）`,
                sorter: (a, b) =>
                  a[`${item.subjectId}Score`] - b[`${item.subjectId}Score`],
                align: "center",
                children: [
                  {
                    title: `${item.avgScore}`,
                    dataIndex: `${item.subjectId}Score`,
                    key: `${item.subjectId}Score`,
                    width:
                      index == 0
                        ? 140
                        : SIZEMAP[Number(item.subjectName?.length)],
                    align: "center",
                    render: (text, record, index) => {
                      return (
                        <div>
                          <Tooltip
                            placement="bottom"
                            title={record[`${item.subjectId}groupName`]}
                          >
                            <span
                              className={[
                                styles.importMessage,
                                record[`${item.subjectId}scoreRatePass`]
                                  ? ""
                                  : styles.noPass,
                              ].join(" ")}
                            >
                              {record[`${item.subjectId}Score`] ||
                                trans("global.absent", "缺考")}
                            </span>
                          </Tooltip>
                        </div>
                      );
                    },
                  },
                ],
              },
              {
                title: `${item.subjectName}${trans(
                  "scoreSummary.scoreSuffix",
                  "-分",
                )}`,
                align: "center",
                children: [
                  {
                    title: item.ratioScore,
                    dataIndex: `${item.subjectId}ratioScore`,
                    key: `${item.subjectId}ratioScore`,
                    width: SIZEMAP[Number(item.subjectName?.length)],
                    align: "center",
                    render: (text, record, index) => {
                      return (
                        <div>
                          <Tooltip
                            placement="bottom"
                            title={record[`${item.subjectId}groupName`]}
                          >
                            <span
                              className={[
                                styles.importMessage,
                                record[`${item.subjectId}scoreRatePass`]
                                  ? ""
                                  : styles.noPass,
                              ].join(" ")}
                            >
                              {record[`${item.subjectId}ratioScore`] ||
                                trans("global.absent", "缺考")}
                            </span>
                          </Tooltip>
                        </div>
                      );
                    },
                  },
                ],
              },
              {
                title: trans("global.ranking", "排名"),
                width: 60,
                align: "center",
                children: [
                  {
                    title: "",
                    dataIndex: `${item.subjectId}sortStu`,
                    key: `${item.subjectId}sortStu`,
                    width: 60,
                    align: "center",
                    render: (record) => {
                      return <span>{record}</span>;
                    },
                  },
                ],
              },
            );
          } else {
            newColumns.push(
              {
                title: `${item.subjectName}（${item.totalScore}）`,
                sorter: (a, b) =>
                  a[`${item.subjectId}Score`] - b[`${item.subjectId}Score`],
                align: "center",
                children: [
                  {
                    title: `${item.avgScore}`,
                    dataIndex: `${item.subjectId}Score`,
                    key: `${item.subjectId}Score`,
                    width: SIZEMAP[Number(item.subjectName?.length)],
                    align: "center",
                    render: (text, record, index) => {
                      return (
                        <div>
                          <Tooltip
                            placement="bottom"
                            title={record[`${item.subjectId}groupName`]}
                          >
                            <span
                              className={[
                                styles.importMessage,
                                record[`${item.subjectId}scoreRatePass`]
                                  ? ""
                                  : styles.noPass,
                              ].join(" ")}
                            >
                              {record[`${item.subjectId}Score`] ||
                                trans("global.absent", "缺考")}
                            </span>
                          </Tooltip>
                        </div>
                      );
                    },
                  },
                ],
              },
              {
                title: trans("global.ranking", "排名"),
                width: 60,
                align: "center",
                children: [
                  {
                    title: "",
                    dataIndex: `${item.subjectId}sortStu`,
                    key: `${item.subjectId}sortStu`,
                    width: 60,
                    align: "center",
                    render: (record) => {
                      console.log(record, "qqq");
                      return <span>{record}</span>;
                    },
                  },
                ],
              },
            );
          }
        });
      }
    } else {
      if (scoreSummary.columnSet?.length) {
        newColumns = [
          {
            title: trans("global.order", "序号"),
            fixed: "left",
            align: "center",
            children: [
              {
                title: "",
                width: 60,
                dataIndex: "index",
                align: "center",
              },
            ],
          },
          {
            title: trans("global.fullName", "姓名"),
            width: 100,
            fixed: "left",
            align: "center",
            children: [
              {
                title: `${scoreSummary.studentTotalNum}${trans("global.students", "名学生")}`,
                dataIndex: "name",
                key: "name",
                width: 100,
                align: "center",
              },
            ],
          },
          {
            title: trans("global.intoClass", "所在班级"),
            width: 130,
            align: "center",
            children: [
              {
                title: trans("global.averageScore", "平均成绩"),
                dataIndex: "groupName",
                key: "groupName",
                width: 130,
                align: "center",
              },
            ],
          },
        ];

        scoreSummary.columnSet.map((item, index) => {
          if (item.ratioScore) {
            newColumns.push(
              {
                title: `${item.subjectName}（${item.totalScore}）`,
                sorter: (a, b) =>
                  a[`${item.subjectId}Score`] - b[`${item.subjectId}Score`],
                align: "center",
                children: [
                  {
                    title: `${item.avgScore}`,
                    dataIndex: `${item.subjectId}Score`,
                    key: `${item.subjectId}Score`,
                    width: SIZEMAP[Number(item.subjectName?.length)],
                    align: "center",
                    render: (text, record, index) => {
                      return (
                        <div>
                          <Tooltip
                            placement="bottom"
                            title={record[`${item.subjectId}groupName`]}
                          >
                            <span
                              className={[
                                styles.importMessage,
                                record[`${item.subjectId}scoreRatePass`]
                                  ? ""
                                  : styles.noPass,
                              ].join(" ")}
                            >
                              {record[`${item.subjectId}Score`] ||
                                trans("global.absent", "缺考")}
                            </span>
                          </Tooltip>
                        </div>
                      );
                    },
                  },
                ],
              },
              {
                title: `${item.subjectName}${trans(
                  "scoreSummary.convertedScoreSuffix",
                  "-折算分",
                )}`,
                render: (text, record, index) => {
                  return <span>{item.ratioScore}</span>;
                },
                align: "center",
                children: [
                  {
                    title: item.ratioScore,
                    dataIndex: `${item.subjectId}ratioScore`,
                    key: `${item.subjectId}ratioScore`,
                    width: SIZEMAP[Number(item.subjectName?.length)],
                    align: "center",
                    render: (text, record, index) => {
                      console.log(record, "sss");
                      return (
                        <div>
                          <Tooltip
                            placement="bottom"
                            title={record[`${item.subjectId}groupName`]}
                          >
                            <span
                              className={[
                                styles.importMessage,
                                record[`${item.subjectId}scoreRatePass`]
                                  ? ""
                                  : styles.noPass,
                              ].join(" ")}
                            >
                              {record[`${item.subjectId}ratioScore`] ||
                                trans("global.absent", "缺考")}
                            </span>
                          </Tooltip>
                        </div>
                      );
                    },
                  },
                ],
              },
            );
          } else {
            newColumns.push({
              title: `${item.subjectName}（${item.totalScore}）`,
              sorter: (a, b) =>
                a[`${item.subjectId}Score`] - b[`${item.subjectId}Score`],
              align: "center",
              children: [
                {
                  title: `${item.avgScore}`,
                  dataIndex: `${item.subjectId}Score`,
                  key: `${item.subjectId}Score`,
                  width:
                    index == 0
                      ? 140
                      : SIZEMAP[Number(item.subjectName?.length)],
                  align: "center",
                  render: (text, record, index) => {
                    return (
                      <div>
                        <Tooltip
                          placement="bottom"
                          title={record[`${item.subjectId}groupName`]}
                        >
                          <span
                            className={[
                              styles.importMessage,
                              record[`${item.subjectId}scoreRatePass`]
                                ? ""
                                : styles.noPass,
                            ].join(" ")}
                          >
                            {record[`${item.subjectId}Score`] ||
                              trans("global.absent", "缺考")}
                          </span>
                        </Tooltip>
                      </div>
                    );
                  },
                },
              ],
            });
          }
        });
      }
    }

    newColumns.push({
      title: "",
    });

    return newColumns;
  };

  rankIntervalsEdit = () => {
    this.setState({
      rankIntervalsVis: true,
      rankIntervalsLoading: true,
    });
    getConfig({
      businessId: this.id ? this.id : 0,
      type: 10,
      schoolLevel: true,
    })
      .then((res) => {
        if (res.ifLogin) {
          if (res.status) {
            this.setState({
              rankingStageList: res.content,
            });
          } else {
            message.error(res.message);
          }
        } else {
          loginRedirect();
        }
      })
      .finally(() => {
        this.setState({
          rankIntervalsLoading: false,
        });
      });
  };

  searchChange = (value) => {
    this.setState(
      {
        searchStudentKeyWord: value,
      },
      () => {
        this.getPage();
      },
    );
  };

  changeRanking = (e) => {
    this.setState({
      checkedRanking: e.target.checked,
    });
  };

  changeClass1 = (id) => {
    this.setState(
      {
        selectedGroupId: id,
        pageNo: 1,
      },
      () => {
        this.getStudentData(id);
        // 获取对比报告可选的列表
        this.summaryContrastList();
      },
    );
  };

  getStudentData = (id) => {
    this.props.dispatch({
      type: "exam/getStudentInfo",
      payload: {
        reportId: this.id,
        groupId: id,
        searchStudentKeyWord: this.state.searchStudentKeyWord,
      },
      onSuccess: (res) => {
        if (res.content?.length) {
          this.setState({
            studentListData: res.content,
            selectedStuId: res.content[0].studentId,
            loading: false,
          });
          this.getStudentInfo(res.content[0].studentId);
        } else {
          this.clearStudents();
        }
      },
    });
  };

  changeStudent1 = (id) => {
    if (id) {
      this.setState({
        selectedStuId: id,
      });
      this.getStudentInfo(id);
    }
  };

  getStudentInfo = (id) => {
    this.setState({
      loading: true,
    });
    this.props
      .dispatch({
        type: "exam/getStudySituationByStudentId",
        payload: {
          reportId: this.id,
          studentUserId: id,
          isPreview: false,
        },
        onSuccess: (res) => {
          if (res.content) {
            this.setState(
              {
                studentReport: res.content,
              },
              () => {
                let overflow_moduleValue =
                  this.getModuleValue("OVERALL_TRANSCRIPT");
                let tableData = [
                  {
                    name: trans("global.score", "成绩"),
                    key: "1-1",
                  },
                  {
                    name: trans("global.gradeRanking", "年级排名"),
                    key: "1-0",
                  },
                ];

                let columns = [
                  {
                    title: " ",
                    key: "name",
                    dataIndex: "name",
                    align: "center",
                  },
                ];
                if (overflow_moduleValue && overflow_moduleValue[0]) {
                  const { studentExamResultSummaryAnalyseRowList, columnSet } =
                    overflow_moduleValue[0];
                  for (const item of studentExamResultSummaryAnalyseRowList) {
                    if (item.examResultSummaryAnalyseRow)
                      for (const item1 of item.examResultSummaryAnalyseRow) {
                        tableData[0][`sub_${item1.subjectId}`] = item1.score;
                        tableData[1][`sub_${item1.subjectId}`] = item1.sort;
                      }
                  }
                  for (const item of columnSet) {
                    columns.push({
                      title: `${item.subjectName}(${item.totalScore})`,
                      key: `sub_${item.subjectId}`,
                      dataIndex: `sub_${item.subjectId}`,
                      align: "center",
                    });
                  }
                }

                let array1 = [];
                let array2 = [];
                let score_moduleValue = this.getModuleValue("SCORE_CHART");
                if (score_moduleValue && score_moduleValue[0]) {
                  const { studentExamResultSummaryAnalyseRowList, columnSet } =
                    score_moduleValue[0];
                  for (const [index, item] of columnSet.entries()) {
                    let classSubject =
                      studentExamResultSummaryAnalyseRowList[0]?.examResultSummaryAnalyseRow.find(
                        (item1) => item1.subjectId == item.subjectId,
                      );
                    array1.push({
                      subjectName:
                        locale() == "en"
                          ? item.subjectEnName
                          : item.subjectName,
                      score: classSubject?.score || "--",
                      gradeScore: item.avgScore,
                    });
                  }
                }

                if (score_moduleValue && score_moduleValue[1]) {
                  const { studentExamResultSummaryAnalyseRowList, columnSet } =
                    score_moduleValue[1];
                  for (const [index, item] of columnSet.entries()) {
                    let classSubject =
                      studentExamResultSummaryAnalyseRowList[0]?.examResultSummaryAnalyseRow.find(
                        (item1) => item1.subjectId == item.subjectId,
                      );
                    array2.push({
                      subjectName:
                        locale() == "en"
                          ? item.subjectEnName
                          : item.subjectName,
                      score: classSubject?.score || "--",
                      gradeScore: item.avgScore,
                    });
                  }
                }

                let contrastReportId;
                if (
                  this.state.studentReport &&
                  this.state.studentReport.moduleModelList
                ) {
                  for (const item of this.state.studentReport.moduleModelList) {
                    if (item.modelCode == "SCORE_CHART") {
                      contrastReportId = item.contrastReportId;
                    }
                  }
                }

                this.setState(
                  {
                    totalScoreTableData: tableData,
                    totalScoreTableColumns: columns,
                    scoreChartData: array1,
                    scoreChartData2: array2,
                    contrastReportId: contrastReportId,
                  },
                  () => {
                    console.log(array1, array2, "array");

                    if (array1?.length) {
                      this.scoreChartRef?.current?.initThisReportChart();
                    }

                    if (array2?.length) {
                      this.scoreChartRef?.current?.initComparisonReportChart();
                    }
                  },
                );
              },
            );
          } else {
            this.clearStudentInfo();
          }
        },
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };

  clearStudentInfo = () => {
    this.setState({
      selectedStuId: null,
      studentReport: {},
      totalScoreTableData: [],
      totalScoreTableColumns: [],
      scoreChartData: [],
      scoreChartData2: [],
      loading: false,
    });
  };

  clearStudents = () => {
    this.setState({
      selectedStuId: null,
      studentReport: {},
      totalScoreTableData: [],
      totalScoreTableColumns: [],
      scoreChartData: [],
      scoreChartData2: [],
      studentListData: [],
      contrastReportId: null,
      loading: false,
    });
  };

  clearGroups = () => {
    this.setState({
      selectedGroupId: null,
      classListData: null,
      selectedStuId: null,
      studentReport: {},
      totalScoreTableData: [],
      totalScoreTableColumns: [],
      scoreChartData: [],
      scoreChartData2: [],
      studentListData: [],
      contrastReportId: null,
      loading: false,
    });
  };

  delet = (item) => {
    const { id } = this.state.reportDetail;
    summaryDelete({
      id: id,
    }).then((res) => {
      if (res.status) {
        message.success(trans("scoreSummary.operationSuccess", "操作成功！"));
        setTimeout(() => {
          this.back();
        }, 800);
      } else {
        message.error(res.message);
      }
    });
  };

  viewGroupChange = (checked) => {
    this.setState(
      {
        viewGroup: checked,
      },
      () => {
        this.getPage();
      },
    );
  };

  rankIntervalsOk = (key) => {
    this.setState({
      saveLoading: true,
    });

    // 系统生成 获取id后更新数据
    if (this.id) {
      this.saveFun(key);
    } else {
      this.props.dispatch({
        type: "exam/summaryCreateSystem",
        payload: {
          gradeId: this.gradeId,
          reportType: this.reportType,
          semesterId: this.semesterId,
        },
        onSuccess: (res) => {
          if (res.content) {
            this.id = res.content;
            let string_ = aesEncrypt(JSON.stringify({ id: this.id }), "lsk");
            this.props.history.push(
              `/newScoreSummary/analysisTable/${this.state.tabsKey}?${buildAnalysisSummaryDateQuery(
                string_,
              )}`,
            );
            this.saveFun(key);
          }
        },
      });
    }
  };

  // 保存配置
  saveFun = (key) => {
    let array = this.state.rankingStageList?.filter(Boolean) || [];
    saveConfig({
      businessId: this.id,
      type: 10,
      config: JSON.stringify(array),
      schoolLevel: Boolean(key),
    })
      .then((res) => {
        if (res.ifLogin) {
          if (res.status) {
            this.setState({
              rankIntervalsVis: false,
            });
            this.getPage();
          }
        } else {
          loginRedirect();
        }
      })
      .finally(() => {
        this.setState({
          saveLoading: false,
        });
      });
  };

  rankIntervalsValChange = (value, index) => {
    let array = [...this.state.rankingStageList];
    array[index] = value;
    this.setState({
      rankingStageList: array,
    });
  };

  editRankIntervalsVal = () => {
    let array = [...this.state.rankingStageList];
    this.setState({
      rankingStageList: array.sort((a, b) => a - b),
    });
  };

  addRankIntervals = (index) => {
    let array = [...this.state.rankingStageList, ""];
    this.setState({
      rankingStageList: array,
    });
  };

  regenerateChange = () => {
    const { selectedStuId, selectedGroupId } = this.state;
    let leftPos = screen.width - 500;
    // let domain = (window.location.origin.indexOf("daily") > -1 ? 'https://task.daily.yungu-inc.org' : "https://task.yungu.org");
    window.open(
      `${window.location.origin}/exam?studentId=${selectedStuId}&groupId=${selectedGroupId}&reportId=${this.id}&entry_key=11#/aiAssessment`,
    );
  };

  getModuleValue = (key) => {
    let value = "";
    if (this.state.studentReport && this.state.studentReport.moduleModelList) {
      let res = this.state.studentReport.moduleModelList.find(
        (item) => item.modelCode == key,
      );
      if (res) {
        value = res.modelValue;
      }
    }
    return value;
  };

  contrastReportChange = (value) => {
    let parameters = JSON.parse(JSON.stringify(this.state.studentReport));
    let index = parameters.moduleModelList?.findIndex(
      (item) => item.modelCode == "SCORE_CHART",
    );
    if (index > -1) {
      parameters.moduleModelList[index].contrastReportId = value;
    }
    this.setState({
      loading: true,
    });
    // 保存配置
    this.props.dispatch({
      type: "exam/saveStudySituationStructure",
      payload: parameters,
      onSuccess: (res) => {
        if (res.status) {
          // 更新学生信息
          this.getStudentInfo(this.state.selectedStuId);
        }
      },
    });
  };

  render() {
    const { reportDetail, selectMethod, numPhase, numPhaseList } = this.state;
    const { flunkListByStudent } = this.props;
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <div className={styles.headerContent}>
          <i
            className={`${styles.iconfont} ${styles.backBtn}`}
            onClick={this.back}
          >
            &#xe6ff;
          </i>

          {/* 功能：显示考试名称，如"2024学年第一学期九年级11月期中考试" */}
          <ExamTitle
            title={reportDetail.reportName}
            editable={false}
            onEdit={this.editTitle}
          />

          {/* 功能：显示时间、报告名称、等基本信息 */}
          <ExamInfoBar
            createTime={reportDetail.handelCreateTime}
            reportTypeName={reportDetail.reportTypeName}
            gradeName={reportDetail.summaryDetail
              ?.map((item) => item.gradeName)
              .join(",")}
            // totalScore={totalScore}
          />

          {/* 功能：提供多个选项卡，如"班级分析"、"学生分析"、"不及格分析"等 */}
          <NavigationTabs
            tabs={this.getMenuData()}
            activeKey={this.state.activeKey}
            onTabChange={(key) => {
              this.tabChange(key);
            }}
          />

          {/* 功能：页面右上角 */}
          <ActionButtons
            buttons={[
              {
                label: (
                  <Popconfirm
                    placement="top"
                    title={trans(
                      "scoreSummary.deleteReportConfirm",
                      "确认要删除这份成绩汇总报告吗？",
                    )}
                    onConfirm={() => {
                      this.delet();
                    }}
                    okText="确定"
                    cancelText="取消"
                  >
                    {trans("global.delete", "删除")}
                  </Popconfirm>
                ),
                key: "delete",
              },
              {
                label: trans("global.ReportSettings", "报告设置"),
                key: "reportSettings",
                onClick: this.handleReportSettings,
              },
            ]}
          />
        </div>

        <Spin spinning={this.state.loading} delay={500}>
          <div className={styles.pageContentWrapper}>
            {this.state.activeKey == "classAnalysis" ? (
              <ClassAnalysis
                classRateData={this.state.classRateData}
                classSummaryData={this.state.classSummaryData}
                clickEditSegment={this.clickEditSegment}
                exportFail={this.exportFail}
              />
            ) : null}
            {this.state.activeKey == "studentAnalysis" ? (
              <StudentRankingTable
                tableData={this.state.studentRankingData}
                columns={this.getStudentRankColumns()}
                changeNo={this.changeNo}
                onShowSizeChange={this.onShowSizeChange}
                searchChange={this.searchChange}
                exportFail={this.exportFail}
                changeRanking={this.changeRanking}
                checkedRanking={this.state.checkedRanking}
                pageSize={this.state.pageSize}
                total={this.props.scoreSummary?.rowTotalNum || 0}
                pageNo={this.state.pageNo}
                rankingVis={this.state.rankingVis}
              />
            ) : null}

            {this.state.activeKey == "failedAnalysis" ? (
              <FailedAnalysis
                exportFail={this.exportFail}
                failedAnalysisData={this.state.failedAnalysisData}
                viewGroupChange={this.viewGroupChange}
                viewGroup={this.state.viewGroup}
              />
            ) : null}
            {this.state.activeKey == "absentStudents" ? (
              <AbsentStudentsTable
                tableData={this.state.missAnExamTableData || []}
                columns={this.state.newColumns3}
                exportFail={this.exportFail}
              />
            ) : null}

            {this.state.activeKey == "topNAnalysis" ? (
              <TopNTable
                tableData={this.state.frontTableData || []}
                columns={this.state.newColumns4}
                exportFail={this.exportFail}
                rankIntervalsEdit={this.rankIntervalsEdit}
              />
            ) : null}

            {this.state.activeKey == "qualityBenchmark" ? (
              <QualityBenchmark
                reportId={this.id}
                gradeId={this.gradeId}
                reportType={this.reportType}
                semesterId={this.semesterId}
                reportDetail={this.state.reportDetail}
                onSummaryReportIdChange={
                  this.handleQualityBenchmarkReportIdChange
                }
                scoreSummary={
                  this.state.qualityBenchmarkScoreSummary ||
                  this.props.scoreSummary ||
                  {}
                }
                localSummaryData={this.state.qualityBenchmarkSummaryData || []}
                localRateData={this.state.qualityBenchmarkRateData || []}
                loadingLocalData={this.state.qualityBenchmarkLoading}
              />
            ) : null}

            {this.state.activeKey == "studentMultiSubjectReport" ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                }}
              >
                <div style={{ width: "200px", height: "100%" }}>
                  <StudentSelectionPanel
                    trendStuList={this.state.studentListData}
                    activeKey={this.state.selectedStuId}
                    groupId={this.state.selectedGroupId}
                    classListData={this.state.classListData}
                    onChangeStu={this.changeStudent1}
                    onChangeClass={this.changeClass1}
                  />
                </div>

                <div
                  style={{
                    margin: "0 10px",
                    height: "100%",
                    width: "calc(100% - 370px)",
                    overflow: "auto",
                  }}
                  ref={this.studentMultiSubjectReportContentRef}
                >
                  <OverallReportCard
                    tableData={this.state.totalScoreTableData}
                    columns={this.state.totalScoreTableColumns}
                  />

                  <ScoreChart
                    ref={this.scoreChartRef}
                    contrastReportId={this.state.contrastReportId}
                    contrastList={this.state.contrastList}
                    scoreChartData={this.state.scoreChartData}
                    scoreChartData2={this.state.scoreChartData2}
                    contrastReportChange={this.contrastReportChange}
                  />

                  <AiAnalysis
                    remarkVal={this.getModuleValue("AI_ANALYSIS")}
                    moduleSwitch={true} // 模块开关状态
                    edit={true} //是否允许控制模块开关
                    regenerate={this.regenerateChange}
                  />

                  {/* <TeacherRemarks
                                            remarkVal={this.getModuleValue('TEACHER_COMMENTS')}
                                            moduleSwitch={true}// 模块开关状态
                                            edit={false}//是否允许控制模块开关
                                        /> */}
                </div>
                <div
                  style={{ width: "150px", height: "100%", overflowY: "auto" }}
                >
                  <Directory
                    // 内容区域的滚动容器
                    scrollContainer={
                      this.studentMultiSubjectReportContentRef.current
                    }
                    name={trans("global.viewList", "看板目录")}
                    // 内容区域的各个部分
                    items={[
                      {
                        title: trans("global.overallReportCard", "总成绩单"),
                        targetId: "overallReportCard",
                      },
                      {
                        title: trans(
                          "global.subjectLearningComparison",
                          "各学科学情对比",
                        ),
                        targetId: "scoreChart",
                      },
                      {
                        title: trans("global.aiAnalysis", "学情综览"),
                        targetId: "aiAnalysis",
                      },
                      // {
                      //     title: trans("global.teacherComments", '教师评语'),
                      //     targetId: "teacherComments",
                      // },
                    ]}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </Spin>

        <ComnModal
          options={{
            title: trans("global.setSegmentedInterval", "设置分段区间"),
            visible: this.state.adjusting,
            width: "500px",
            getContainer: false,
            onCancel: this.handleCancel,
            footer: (
              <div
                className={styles.footer}
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <Button onClick={this.handleCancel}>
                  {trans("global.cancle")}
                </Button>
                {this.state.isAdmin ? (
                  <div style={{ display: "flex", marginLeft: "10px" }}>
                    <Button
                      onClick={this.handleOk}
                      className={styles.replyDefault}
                    >
                      {trans("global.saveSelf", "保存为自用")}
                    </Button>
                    <Button
                      onClick={() => this.handleOk(true)}
                      className={styles.saveGeneral}
                    >
                      {trans(
                        "global.saveGeneralSettings",
                        "保存为本次校级通用",
                      )}
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", marginLeft: "10px" }}>
                    <Button
                      onClick={() => this.clickEditSegment(true)}
                      className={styles.replyDefault}
                    >
                      {trans("global.replyDefault", "恢复成默认分段")}
                    </Button>
                    <Button
                      type="primary"
                      onClick={this.handleOk}
                      className={styles.saveGeneral}
                    >
                      {trans("global.save", "保存")}
                    </Button>
                  </div>
                )}
              </div>
            ),
          }}
          innerContent={
            <>
              {selectMethod == 0 && this.sum(numPhaseList) != 100 ? (
                <Alert
                  message={trans(
                    "global.segmentsError",
                    "所有分段累加后需等与100%",
                  )}
                  type="error"
                  showIcon
                  height="30px"
                />
              ) : null}

              <div className={styles.selectBox}>
                <span className={styles.selectMethod}>
                  {trans("global.selectMethod", "选择设置方式")}:
                </span>
                <Radio.Group
                  onChange={this.changeSelectMethod}
                  value={selectMethod}
                >
                  <Radio value={0}>
                    <span className={styles.setByPercentage}>
                      {trans("global.setByPercentage", "按百分比设置")}
                    </span>
                  </Radio>
                </Radio.Group>
              </div>

              <div
                className={styles.numPhaseBox}
                style={{ textAlign: "center" }}
              >
                <i
                  className={[styles.iconfont, styles.clickIcon].join(" ")}
                  style={{ fontSize: "18px", cursor: "pointer" }}
                  onClick={this.clickReduce}
                >
                  &#xe838;
                </i>
                <span
                  className={styles.numPhase}
                  style={{ textWrap: "nowrap" }}
                >
                  {trans("scoreSummary.phaseCount", "{$count}段", {
                    count: numPhase,
                  })}
                </span>
                <i
                  className={[styles.iconfont, styles.clickIcon].join(" ")}
                  style={{ fontSize: "18px", cursor: "pointer" }}
                  onClick={this.clickAddd}
                >
                  &#xe839;
                </i>
              </div>
              <div className={styles.numPhaseBox}>
                {selectMethod == 0 ? (
                  <span className={styles.paragraph}>
                    {trans("global.top", "前段")}
                  </span>
                ) : (
                  <span className={styles.paragraph}>
                    {trans("global.subsection", "分段{$num}")}1{" "}
                  </span>
                )}
                <InputNumber
                  min={1}
                  max={selectMethod == 0 ? 100 : 150}
                  value={numPhaseList[0]}
                  className={styles.numPhase}
                  style={{ width: "91px" }}
                  onChange={this.changeAfter}
                />
                {selectMethod == 0 ? (
                  <span>{`[0~${numPhaseList[0]}%]`}</span>
                ) : (
                  <span>{`[0~${numPhaseList[0]})`}</span>
                )}
              </div>
              {numPhaseList && numPhaseList.length > 0
                ? numPhaseList.map((item, index) => {
                    if (index == 0) {
                      return;
                    } else if (index == numPhaseList.length - 1) {
                      return;
                    } else {
                      return (
                        <div className={styles.numPhaseBox} key={index}>
                          {selectMethod == 0 ? (
                            <span className={styles.paragraph}>
                              {trans("global.middle", "中段")}
                              {index}
                            </span>
                          ) : (
                            <span className={styles.paragraph}>
                              {trans("global.subsection", "分段{$num}")}
                              {index + 1}
                            </span>
                          )}

                          <InputNumber
                            min={1}
                            max={selectMethod == 0 ? 100 : 150}
                            value={item}
                            className={styles.numPhase}
                            style={{ width: "91px" }}
                            onChange={(value) =>
                              this.chengeMiddle(index, value)
                            }
                          />

                          {selectMethod == 0 ? (
                            this.getMiddle(index)
                          ) : (
                            <span>
                              {`[${numPhaseList[index - 1]}~${numPhaseList[index]})`}
                            </span>
                          )}
                        </div>
                      );
                    }
                  })
                : null}
              <div className={styles.numPhaseBox}>
                {selectMethod == 0 ? (
                  <span className={styles.paragraph}>
                    {trans("global.after", "后段")}
                  </span>
                ) : (
                  <span className={styles.paragraph}>
                    {trans("global.subsection", "分段{$num}")}
                    {numPhase}
                  </span>
                )}
                <InputNumber
                  min={1}
                  max={selectMethod == 0 ? 100 : 150}
                  value={numPhaseList.at(-1)}
                  className={styles.numPhase}
                  style={{ width: "91px" }}
                  onChange={this.changeFront}
                />
                {selectMethod == 0 ? (
                  <span>{`(${100 - numPhaseList.at(-1)}%~100%]`}</span>
                ) : (
                  <span>
                    {`[${numPhaseList[numPhase - 2]}~${numPhaseList[numPhase - 1]}]`}
                  </span>
                )}
              </div>
            </>
          }
        />

        <ComnModal
          options={{
            title:
              locale() == "en" ? "Set Ranking Segmentation" : "设置名次分段",
            closable: false,
            visible: this.state.rankIntervalsVis,
            width: "500px",
            getContainer: false,
            onOk: this.rankIntervalsOk,
            okButtonProps: { loading: this.state.saveLoading },
            onCancel: () => {
              this.setState({
                rankIntervalsVis: false,
              });
            },
            footer: (
              <div className={styles.footerBox}>
                <MyButton
                  style={{ flexShrink: "0" }}
                  onClick={() => {
                    this.setState({
                      rankIntervalsVis: false,
                    });
                  }}
                  typeclass="cancelBtn"
                  sizeclass="commonBtn"
                >
                  {trans("global.cancel", "取消")}
                </MyButton>
                <MyButton
                  style={{ flexShrink: "0" }}
                  onClick={() => {
                    this.rankIntervalsOk(0);
                  }}
                  typeclass="confirmBtn"
                  sizeclass="commonBtn"
                  loading={this.state.saveLoading}
                >
                  {trans("global.saveSelf", "保存为自用")}
                </MyButton>
                <MyButton
                  style={{ flexShrink: "0" }}
                  onClick={() => {
                    this.rankIntervalsOk(1);
                  }}
                  typeclass="confirmBtn"
                  sizeclass="commonBtn"
                  loading={this.state.saveLoading}
                >
                  {trans("global.saveGeneralThisQuiz", "保存为校级通用")}
                </MyButton>
              </div>
            ),
          }}
          innerContent={
            <div
              style={{
                width: "100%",
                minHeight: "200px",
                maxHeight: "400px",
                overflow: "scroll",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  marginBottom: "10px",
                  fontSize: "16px",
                  textalign: "center",
                }}
              >
                <Alert
                  message={trans(
                    "scoreSummary.rankNodeTip",
                    "新建或修改排名节点，会自动从小到大排序",
                  )}
                  type="info"
                  showIcon
                />
              </div>

              <Spin spinning={this.state.rankIntervalsLoading}>
                {this.state.rankingStageList &&
                this.state.rankingStageList.length > 0 ? (
                  this.state.rankingStageList.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        marginBottom: "15px",
                        paddingLeft: "10px",
                      }}
                    >
                      <span>
                        {trans("scoreSummary.rankPrefix", "前")} &nbsp;
                      </span>
                      <InputNumber
                        value={item}
                        className={styles.numPhase}
                        style={{ width: "91px" }}
                        onChange={(value) => {
                          this.rankIntervalsValChange(value, index);
                        }}
                        onBlur={(e) => {
                          this.editRankIntervalsVal(e, index);
                        }}
                        onPressEnter={(e) => {
                          e.preventDefault(); // 阻止默认事件，防止触发 onBlur
                          e.target.blur(); // 手动失焦
                        }}
                      />
                      <span>
                        &nbsp;[1 ~ {item}]{" "}
                        {trans("scoreSummary.rankSuffix", "名")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ height: "100px", width: "100px" }}></div>
                )}

                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginBottom: "15px",
                    paddingLeft: "10px",
                  }}
                >
                  <MyButton
                    typeclass="text"
                    sizeclass="commonBtn"
                    style={{ marginLeft: "10px" }}
                    onClick={() => {
                      this.addRankIntervals();
                    }}
                  >
                    + {trans("global.newSegmentation", "新分段")}
                  </MyButton>
                </div>
              </Spin>
            </div>
          }
        />
      </div>
    );
  }
}
export default connect(({ home, global, exam }) => ({
  typeValue: home.typeValue,
  gradeList: global.gradeList,
  scoreSummary: home.scoreSummary,
  flunkListByStudent: home.flunkListByStudent,
  allGrade: home.allGrade,
  ratioDealShowList: home.ratioDealShowList,
  subjectListTest: home.subjectListTest,
}))(AnalysisSummary);

import React, { PureComponent } from "react";
import { Chart } from "@antv/g2";
import {
  Checkbox,
  Icon,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Popover,
  Radio,
  Select,
  Spin,
  Switch,
  Table,
  Tooltip,
  TreeSelect,
} from "antd";
import { connect } from "dva";
import * as echarts from "echarts";

import { checkPermission } from "../../services/global";
import { locale, trans } from "../../utils/i18n";
import ErrorQuestion from "../ErrorQuestion";
import PreviewImg from "../PreviewImg/index";
import QueryCriteriaTable from "../queryCriteriaTable";
import StuConditionSelect from "../StuConditionSelect";
import StuStudySelect from "../StuStudySelect";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
const { Search } = Input;
const { Option } = Select;
const { TreeNode } = TreeSelect;

/**
 *
 * @param value
 */
function parsePercent(value) {
  if (typeof value === "string" && value.includes("%")) {
    return Number(value.replace("%", "")) || 0;
  }
  return 0;
}

class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = window.location.hash;
    this.pathMatch = this.url.split("/");
    this.studentId =
      this.pathMatch && this.pathMatch[2] ? this.pathMatch[2] : null;
    this.state = {
      check: 1,
      searchName: "",
      stuId: null,
      pageNo: 1,
      stuName: "",
      treeClass: [],
      subjectId: 0,
      active: 1,
      classStuList: [],
      typeList: [],
      gradeIdList: [],
      testId: [],
      errDetialList: [],
      diyWorkList: [],
      hoverIndexID: null,
      checkAllGardes: false,
      indeterminate: false,
      indeterminate1: false,
      checkAllType: false,
      pageNoDiyWork: 1,
      pageSizeDiyWork: 100,
      pageNoErr: 1,
      pageSizeErr: 40,
      positiveIcon: false,
      fallIcon: false,
      initAllStu: [], // 全部学生列表，初始化时使用
      searchList: [], //搜索学生列表
      studentId: "",
      searchStuId: undefined, //搜索学生id
      loading: false,
      studentList: [], //学生列表
      value: undefined, //学生名字
      gradeId: "",
      groupId: "",
      isKnowledgeGrouping: 1,
      isSelect: true,
      knowLedgeIntervalList: [],
      isKnowLedgeInterval: false,
      isQueryCriteria: false, //保存查询条件
      isStuStudy: false,
      isErrTopic: false,
      tableName: "",
      isSavedCriteria: false,
      saveStuRecord: null,
      isPushStatus: false,
      stuGradeId: null,
      stuStage: null,
      showType: 0,
      endterim: true,
      isShowAnswer: true,
      interim: true,
      url: null,
      imgVisible: false,
      summary: false,
      summaryLoading: false,
      totalScoreTrendMetric: "score",
      totalScoreTrendHoverIndex: null,
      dataOrder: "desc",
      selectedSummaryReportIds: null,
    };
    this.trendChart = undefined;
    this.stuId = "";
  }
  componentDidMount() {
    console.log(this.studentId, "444");
    // chart = new Chart({
    //   container: "trendNode",
    //   forceFit: true,
    //   height: 400,
    //   padding: [30, 100, 120, 80],
    // });
    // this.getAllStudent(true);
    this.getStudentGroupList();
    const overallPermissionPromise = checkPermission({
      permissionCode: "exam:academicAnalysis:overallSituation",
    }).then((res) => {
      const hasOverallPermission = !!res.content;
      if (hasOverallPermission) {
        this.setState({
          summary: true,
        });
      }
      return hasOverallPermission;
    });
    const { dispatch } = this.props;
    dispatch({
      type: "studentLearning/getAllSubject",
    }).then(async () => {
      const hasOverallPermission = await overallPermissionPromise;
      if (this.props.allSubjectList) {
        this.setState(
          {
            subjectId: hasOverallPermission
              ? 0
              : this.props.allSubjectList[0]?.id || "", // 有整体情况权限时默认展示整体情况
          },
          () => {
            if (this.studentId) {
              this.stuId = this.studentId;
              this.setState(
                {
                  studentId: this.studentId,
                },
                () => {
                  this.getTable(); // 默认获取整体情况数据
                  this.getPage(); // 默认获取科目数据
                  this.getType();
                  this.getGrade();
                },
              );
            } else {
              // this.props
              //   .dispatch({
              //     type: "studentLearning/getAllStudents",
              //     payload: {
              //       groupId: this.state.groupId,
              //       matchName: this.state.stuName,
              //     },
              //   })
              //   .then(() => {
              //     if (
              //       this.props.allStudents &&
              //       this.props.allStudents.studentList &&
              //       this.props.allStudents.studentList.length
              //     ) {
              //       this.setState(
              //         {
              //           stuId: this.props.allStudents.studentList[0].id,
              //         },
              //         () => {
              //       this.getType();
              //       this.getGrade();
              //       this.getExamName();
              //       this.getPage();
              //       }
              //       );
              //     }
              //   });
              const { value, groupId } = this.state;
              this.setState({
                loading: true,
              });
              let payloadObject = {
                studentName: value,
                studentGroupIds: this.getGroupIds(),
                typeSource: "0",
                type: 1,
                source: 1,
              };
              if (this.stuId) {
                payloadObject.studentId = Number(this.stuId);
              } else if (this.state.searchStuId) {
                payloadObject.studentId = Number(this.state.searchStuId);
              }
              this.props
                .dispatch({
                  type: "global/postFindUserCaptureCount",
                  payload: {
                    // ...payloadObj,
                    groupIdList: this.getGroupIds().join(","),
                  },
                })
                .then(() => {
                  const { userList } = this.props;
                  this.setState(
                    {
                      studentList: userList,
                      loading: false,
                      studentId: userList?.length > 0 ? userList[0].userId : "",
                      stuGradeId:
                        userList?.length > 0 ? userList[0].gradeId : "",
                      stuStage: userList?.length > 0 ? userList[0].stage : "",
                      searchList: userList,
                      initAllStu: userList,
                      selectedSummaryReportIds: null,
                    },
                    () => {
                      this.getType();
                      this.getGrade();
                      this.getExamName();
                      this.getTable(); //默认获取整体情况数据
                      this.getPage(); //默认获取科目数据
                    },
                  );
                });
            }
          },
        );
      }
    });
  }

  /**
   * 组件卸载时释放成绩趋势图持有的 canvas、HTML 标签和事件监听。
   * @returns {void} 无返回值。
   */
  componentWillUnmount() {
    this.destroyTrendChart(this.trendChart);
  }

  /**
   * 销毁当前成绩趋势图，确保下一次绘制不会保留上一个学生的横轴标签。
   * @param {Chart} [trendChart] 需要销毁的成绩趋势图。
   * @returns {void} 无返回值。
   */
  destroyTrendChart = (trendChart = this.trendChart) => {
    if (trendChart) {
      trendChart.destroy();
      this.trendChart = undefined;
    }
  };

  getExamName = () => {
    const { gradeIdList, typeList, pageNoErr } = this.state;
    this.props.dispatch({
      type: "global/getNameList",
      payload: {
        subjectId: this.state.subjectId == 0 ? "" : this.state.subjectId,
        studentId: this.state.studentId,
        gradeIdList:
          gradeIdList.length == this.props.stuGradeList.length
            ? ""
            : gradeIdList.join(","),
        paperTypeList:
          typeList.length == this.props.stuTypeList.length
            ? ""
            : typeList.join(","),
      },
    });
  };
  getGrade = () => {
    this.props
      .dispatch({
        type: "global/getGradeList",
        payload: {
          studentId: this.state.studentId,
        },
      })
      .then(() => {
        const { stuGradeList } = this.props;
        let newGradeId = [];
        stuGradeList &&
          stuGradeList.length > 0 &&
          stuGradeList.map((item) => {
            if (item.stage == this.state.stuStage) {
              newGradeId.push(item.gradeId);
            }
            this.setState({
              gradeIdList: newGradeId,
            });
          });
      });
  };
  getType = () => {
    this.props.dispatch({
      type: "global/getTypeList",
    });
  };
  getStu = () => {
    this.props
      .dispatch({
        type: "home/getAllStudentByName",
        payload: {
          groupId: this.state.groupId,
          matchName: this.state.stuName,
        },
      })
      .then(() => {
        if (
          this.props.allStudentByName &&
          this.props.allStudentByName.length > 0
        ) {
          this.setState(
            {
              // stuId: this.props.allStudentByName[0]?.nodes[0]?.id || null,
              classStuList: this.props.allStudentByName,
            },
            () => {
              // this.getPage();
            },
          );
        }
      });
  };
  componentDidUpdate(previousProperties, previousState) {
    const imgList = document.querySelectorAll("img");
    for (const element of imgList) {
      let source = element.src;
      if (source.includes("&style=")) {
        source = source.split("&style=")[0];
      }
      element.addEventListener("click", this.showImg.bind(this, source));
    }
    if (
      previousProperties.studentSummaryDashboard !==
        this.props.studentSummaryDashboard ||
      previousState.dataOrder !== this.state.dataOrder
    ) {
      setTimeout(() => this.scrollSummaryContainer(), 0);
    }
  }
  showImg = (source) => {
    this.setState({
      imgVisible: true,
      url: source,
    });
  };
  cancelImg = () => {
    this.setState({
      url: null,
      imgVisible: false,
    });
  };
  changeClass = (value) => {
    // if (value.includes("grade")) {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
      },
      () => {
        const { teachingOrgList } = this.props;
        let classStuList = [];
        teachingOrgList &&
          teachingOrgList.length > 0 &&
          teachingOrgList.map((item) => {
            if (item.id == value) {
              item.nodes.length > 0 &&
                item.nodes.map((ite) => {
                  if (ite.nodes[0]?.nodes) {
                    ite.nodes.length > 0 &&
                      ite.nodes.map((it) => {
                        classStuList.push(it);
                      });
                  } else {
                    classStuList.push(ite);
                  }
                });
            } else {
              item.nodes.length > 0 &&
                item.nodes.map((ite) => {
                  if (ite.nodes[0]?.nodes) {
                    if (ite.id == value) {
                      ite.nodes.length > 0 &&
                        ite.nodes.map((it) => {
                          classStuList.push(it);
                        });
                    } else {
                      ite.nodes.length > 0 &&
                        ite.nodes.map((it) => {
                          if (it.id == value) {
                            classStuList.push(it);
                          }
                        });
                    }
                  } else {
                    if (ite.id == value) {
                      classStuList.push(ite);
                    }
                  }
                });
            }
          });
        this.setState({
          classStuList,
        });
        console.log(classStuList, "sss");
        // this.getStu();
      },
    );
    // }
  };
  getTable = () => {
    this.setState({
      summaryLoading: true,
    });
    const payload = {
      studentId: this.state.studentId,
      sortOrder: this.state.dataOrder,
    };
    if (Array.isArray(this.state.selectedSummaryReportIds)) {
      payload.summaryReportIds =
        this.state.selectedSummaryReportIds.length > 0
          ? this.state.selectedSummaryReportIds
          : [-1];
    }
    this.props
      .dispatch({
        type: "home/getStudentSummaryDashboard",
        payload,
      })
      .then(
        () => {
          this.setState({
            summaryLoading: false,
          });
          setTimeout(() => {
            this.renderRadar();
            this.scrollSummaryContainer();
          }, 0);
        },
        () => {
          this.setState({
            summaryLoading: false,
          });
        },
      );
  };
  getPage = () => {
    // this.props
    //   .dispatch({
    //     type: "home/clearPartScore",
    //     payload: {},
    //   })
    //   .then(() => {
    const {
      gradeIdList,
      typeList,
      testId,
      pageSizeErr,
      pageNoErr,
      knowLedgeIntervalList,
      showType,
    } = this.state;
    if (this.state.active == 1) {
      if (this.state.subjectId == 0) {
        return;
      }
      this.props
        .dispatch({
          type: "home/getTrendAnalysisResultNew",
          payload: {
            studentId: this.state.studentId,
            subjectId: this.state.subjectId == 0 ? "" : this.state.subjectId,
            gradeIdList:
              gradeIdList.length == this.props.stuGradeList.length
                ? ""
                : gradeIdList.join(","),
            examTypeList:
              typeList.length == this.props.stuTypeList.length
                ? ""
                : typeList.join(","),
            examIdList: testId[0] == 0 ? "" : testId.join(","),
            type: 1,
          },
        })
        .then(() => {
          // if (
          //   this.props.newTrendList &&
          //   this.props.newTrendList.trendAnalysisResultModelList &&
          //   this.props.newTrendList.trendAnalysisResultModelList.length
          // ) {
          this.renderChart();
          // }
        });
    } else if (this.state.active == 2) {
      this.props.dispatch({
        type: "global/getKnowledgeQuestionList",
        payload: {
          studentId: this.state.studentId,
          subjectId: this.state.subjectId == 0 ? "" : this.state.subjectId,
          gradeIdList:
            gradeIdList.length == this.props.stuGradeList.length
              ? ""
              : gradeIdList.join(","),
          examTypeList:
            typeList.length == this.props.stuTypeList.length
              ? ""
              : typeList.join(","),
          examIdList: testId[0] == 0 ? "" : testId.join(","),
          queryType: this.state.isKnowledgeGrouping,
          graspDegreeType:
            knowLedgeIntervalList.length == 3
              ? ""
              : knowLedgeIntervalList.join(","),
          descStatus: this.state.positiveIcon ? false : true,
        },
      });
    } else if (this.state.active == 3) {
      this.props
        .dispatch({
          type: "global/getErrorQuestionList",
          payload: {
            studentId: this.state.studentId,
            subjectId: this.state.subjectId == 0 ? "" : this.state.subjectId,
            gradeIdList:
              gradeIdList.length == this.props.stuGradeList.length
                ? ""
                : gradeIdList.join(","),
            examTypeList:
              typeList.length == this.props.stuTypeList.length
                ? ""
                : typeList.join(","),
            examIdList: testId[0] == 0 ? "" : testId.join(","),
            pageNum: pageNoErr,
            pageSize: pageSizeErr,
          },
        })
        .then(() => {
          const { errorQuestionList } = this.props;
          this.setState({
            errDetialList: errorQuestionList?.errorQuestionDetialList || [],
          });
        });
    } else if (this.state.active == 4) {
      this.props
        .dispatch({
          type: "global/getPersonalizedList",
          payload: {
            studentId: this.state.studentId,
            subjectId: this.state.subjectId == 0 ? "" : this.state.subjectId,
            gradeIdList:
              gradeIdList.length == this.props.stuGradeList.length
                ? ""
                : gradeIdList.join(","),
            examTypeList:
              typeList.length == this.props.stuTypeList.length
                ? ""
                : typeList.join(","),
            examIdList: testId[0] == 0 ? "" : testId.join(","),
          },
        })
        .then(() => {
          this.setState({
            diyWorkList: this.props.personalizedList,
          });
        });
    }
    // });
  };

  renderChart = () => {
    if (this.state.subjectId == 0 || !document.querySelector("#trendNode")) {
      return;
    }
    this.destroyTrendChart(this.trendChart);
    let newList = [];
    if (
      this.props.newTrendList &&
      this.props.newTrendList.trendAnalysisResultModelList &&
      this.props.newTrendList.trendAnalysisResultModelList.length > 0
    ) {
      this.props.newTrendList.trendAnalysisResultModelList.map((item) => {
        newList.push({
          学生得分率: Number.parseInt(parsePercent(item.examScoreRate), 10),
          // 学生标准分: parseInt(parsePercent(item.standardExamScoreRate) || 0, 10),
          年级平均得分率: Number.parseInt(
            parsePercent(item.examAverageScoreRate),
            10,
          ),
          年级排名: Number.parseInt(item.examRanking, 10),
          examName: item.examName,
        });
      });
    }

    const trendChart = new Chart({
      container: "trendNode",
      forceFit: true,
      height: 400,
      padding: [35, 80, 50, 80],
    });
    this.trendChart = trendChart;
    trendChart.source(newList);
    trendChart.scale({
      年级排名: {
        min: 0,
      },
      学生得分率: {
        min: 0,
      },
      年级平均得分率: {
        min: 0,
      },
    });
    trendChart.scale("年级排名", {
      range: [1, 0],
      tickCount: 5,
      min: 0,
    });
    trendChart.scale("学生得分率", {
      tickCount: 5,
      min: 0,
      max: 100,
    });
    trendChart.scale("年级平均得分率", {
      tickCount: 5,
      min: 0,
      max: 100,
    });

    trendChart.axis("学生得分率", {
      position: "left", // 强制左侧
      // grid: null,
      label: {
        formatter: (value) => `${value}%`,
        textStyle: {
          fill: "#01113d",
        },
      },
      line: null,
    });
    trendChart.axis("年级排名", {
      grid: null,
      label: {
        offsetX: -10,
        textStyle: {
          fill: "#01113d",
        },
      },
    });
    trendChart.axis("年级平均得分率", {
      position: "left", // 强制左侧
      grid: null,
      label: null,
      line: null,
    });
    // chart.axis("学生标准分", {
    //   position: "left", // 可加上以防止混入右侧
    //   label: null,
    //   line: null,
    // });

    trendChart
      .line()
      .position("examName*学生得分率")
      .color("rgba(59, 140, 255)")
      .size(2)
      .shape("line")
      .label("学生得分率", {
        position: "top",
        textStyle: {
          fill: "rgba(59, 140, 255)",
          fontSize: 12,
          shadowBlur: 2,
          // shadowColor: "rgba(0, 0, 0, .45)",
        },
        formatter: (text) => {
          const value = Number.parseFloat(text);
          // if (val < 0.05) {
          //   return (val * 100).toFixed(1) + "%";
          // }
          return `${text}%`;
        },
        offset: 10,
      });
    // chart
    //   .line()
    //   .position("examName*学生标准分")
    //   .color("rgba(107, 77, 255)")
    //   .size(2)
    //   .shape("line")
    //   .label("学生标准分", {
    //     position: "top",
    //     offset: 0,
    //     textStyle: {
    //       fill: "rgba(107, 77, 255)",
    //       fontSize: 12,
    //       shadowBlur: 2,
    //       // shadowColor: "rgba(0, 0, 0, .45)",
    //     },
    //     formatter: (text) => {
    //       const val = parseFloat(text);
    //       // if (val < 0.05) {
    //       //   return (val * 100).toFixed(1) + "%";
    //       // }
    //       return `${text}%`;
    //     },
    //     offset: 10,
    //   });
    trendChart
      .line()
      .position("examName*年级平均得分率")
      .color("rgba(78, 209, 150)")
      .size(2)
      .shape("line")
      .label("年级平均得分率", {
        position: "top",
        textStyle: {
          fill: "rgba(78, 209, 150)",
          fontSize: 12,
          shadowBlur: 2,
          // shadowColor: "rgba(0, 0, 0, .45)",
        },
        formatter: (text) => {
          const value = Number.parseFloat(text);
          // if (val < 0.05) {
          //   return (val * 100).toFixed(1) + "%";
          // }
          return `${text}%`;
        },
        offset: 10,
      });
    trendChart
      .line()
      .position("examName*年级排名")
      .color("rgba(245, 194, 73)")
      .size(2)
      .shape("dash")
      .label("年级排名", {
        position: "top",
        textStyle: {
          fill: "rgba(245, 194, 73)",
          fontSize: 12,
          shadowBlur: 2,
          // shadowColor: "rgba(0, 0, 0, .45)",
        },
        formatter: (text) => {
          const value = Number.parseFloat(text);
          // if (val < 0.05) {
          //   return (val * 100).toFixed(1) + "%";
          // }
          return text;
        },
        offset: 10,
      });

    trendChart.tooltip({
      useHtml: true,
      // G2 3.5 会为折线图生成默认 crosshairs 配置，当前严格模式构建无法合并该配置，因此显式关闭。
      crosshairs: false,
      htmlContent: function (title, items) {
        console.log(items);

        //   <div class="g2-tooltip-item">
        //   <div style="background:rgba(78, 209, 150)" class="g2-tooltip-item-point"></div>
        //   <div class="g2-tooltip-item-name">年级平均得分率</div>
        //   <div class="g2-tooltip-item-value">${items[1].value}%</div>
        // </div>
        // <div class="g2-tooltip-item">
        //   <div style="background:rgba(245, 194, 73)" class="g2-tooltip-item-point"></div>
        //   <div class="g2-tooltip-item-name">年级排名</div>
        //   <div class="g2-tooltip-item-value">${items[2].value}</div>
        // </div>
        let string_ = "";
        for (const [index, item] of items.entries()) {
          string_ += `<div class="g2-tooltip-item">
                    <div style="background:${item.point.color}" class="g2-tooltip-item-point"></div>
                    <div class="g2-tooltip-item-name">${item.name}</div>
                    <div class="g2-tooltip-item-value">${item.value}${item.name == "年级排名" ? " " : "%"}</div>
                  </div>`;
        }

        return `<div class="g2-tooltip-content g2-tooltip" style="position:absolute">
              <div class="g2-tooltip-title">${title}</div>
              <div class="g2-tooltip-list">
                ${string_}
              </div>
           </div>
           `;
      },
    });

    trendChart.on("tooltip:change", (event_) => {
      const { x, y } = event_;
      const tooltipElement = document.querySelector(".g2-tooltip-content");
      if (tooltipElement) {
        tooltipElement.style.left = `${x + 10}px`;
        tooltipElement.style.top = `${y + 10}px`;
        tooltipElement.style.display = "block"; // 确保显示
      }
    });

    trendChart.on("tooltip:hide", () => {
      const tooltipElement = document.querySelector(".g2-tooltip-content");
      if (tooltipElement) {
        tooltipElement.style.display = "none"; // 隐藏
      }
    });

    trendChart.axis("examName", {
      label: {
        textStyle: {
          textAlign: "center", // 文本对齐方向，可取值为： start center end
          fill: "#404040", // 文本的颜色
          fontSize: "12", // 文本大小
          fontWeight: "bold", // 文本粗细
          textBaseline: "top", // 文本基准线，可取 top middle bottom，默认为middle
        },
        htmlTemplate(text, item, index) {
          // console.log(newList.columnSet.length, "zwl");
          if (newList.length > 15) {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 40px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 40px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 10px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 40px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 40px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 10px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            }
          } else if (newList.length > 10) {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 50px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 50px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 10px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 40px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 40px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 10px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            }
          } else {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 100px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 100px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 100px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 100px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            }
          }
        },
      },
    });
    trendChart.legend({
      // custom: true,
      mode: "single",
      position: "top",
      useHtml: true,
      marker: "square",
      attachLast: true,
      onClick: (e) => {
        console.log("e", e);
      },
    });
    trendChart.render();
  };
  onSearch = (value) => {
    this.getStu();
  };
  changeSearch = (e) => {
    this.setState({
      stuName: e.target.value,
    });
  };
  changeTab = (check) => {
    this.setState(
      {
        check,
        pageNo: 1,
      },
      () => {
        this.getPage();
      },
    );
  };
  chooseStu = (id) => {
    this.setState(
      {
        stuId: id,
      },
      () => {
        this.getPage();
      },
    );
  };
  changeNo = (value) => {
    this.setState(
      {
        pageNo: value,
      },
      () => {
        this.getPage();
      },
    );
  };

  handleTree = (array) => {
    // const { teachingOrgList } = this.props;
    if (array && array.length < 0) return;
    let newArray = [];
    let newPid = 0;
    array &&
      array.map((element) => {
        let object = {};
        if (element.type == "org") {
          newPid = newPid + 1;
          object.title = element.name;
          object.value = element.id;
          // obj.key = el.id;
          object.id = element.id;
          object.pid = newPid;
          if (element.nodes) {
            object.children = this.handleTree(element.nodes);
          }
          newArray.push(object);
        }
      });
    this.setState({
      treeClass: newArray,
    });
    return newArray;
  };

  clickSub = (id) => {
    this.setState(
      {
        subjectId: id,
      },
      () => {
        if (id === 0) {
          this.getTable();
        } else {
          this.getGrade();
          this.getExamName();
          this.getPage();
        }
      },
    );
  };

  changeTotalScoreTrendMetric = (totalScoreTrendMetric) => {
    this.setState({ totalScoreTrendMetric });
  };

  changeTotalScoreTrendHover = (totalScoreTrendHoverIndex) => {
    this.setState({ totalScoreTrendHoverIndex });
  };

  changeDataOrder = (dataOrder) => {
    this.setState(
      {
        dataOrder,
        totalScoreTrendHoverIndex: null,
      },
      () => {
        if (this.state.subjectId === 0) {
          this.getTable();
        }
      },
    );
  };

  getStudentSummaryDashboardData = () =>
    this.props.studentSummaryDashboard || {};

  getSelectedSummaryReportIds = () => {
    const { selectedSummaryReportIds } = this.state;
    if (Array.isArray(selectedSummaryReportIds)) {
      return selectedSummaryReportIds;
    }
    const { summaryReportList = [] } = this.getStudentSummaryDashboardData();
    return summaryReportList
      .filter((item) => item.selected)
      .map((item) => item.summaryReportId);
  };

  renderSummaryReportSelector = (summaryReportList) => {
    if (summaryReportList.length === 0) {
      return null;
    }
    const selectedSummaryReportIds = this.getSelectedSummaryReportIds();
    const selectedSummaryReportList = summaryReportList.filter((item) =>
      selectedSummaryReportIds.includes(item.summaryReportId),
    );
    const firstSelectedSummaryReport = selectedSummaryReportList[0];
    const firstSelectedSummaryReportName = firstSelectedSummaryReport
      ? this.getSummaryReportDisplayName(firstSelectedSummaryReport)
      : "";
    const selectorText = firstSelectedSummaryReport
      ? selectedSummaryReportList.length > 1
        ? `${firstSelectedSummaryReportName} + ${
            selectedSummaryReportList.length - 1
          } ...`
        : firstSelectedSummaryReportName
      : trans("studentSummary.summaryRangePlaceholder", "请选择汇总范围");
    const summaryReportContent = (
      <div className={styles.summaryReportDropdown}>
        <Checkbox.Group
          value={selectedSummaryReportIds}
          onChange={this.changeSummaryReportIds}
        >
          {summaryReportList.map((item) => (
            <Checkbox value={item.summaryReportId} key={item.summaryReportId}>
              <span title={this.getSummaryReportDisplayName(item)}>
                {this.getSummaryReportDisplayName(item)}
              </span>
            </Checkbox>
          ))}
        </Checkbox.Group>
      </div>
    );
    return (
      <div className={styles.summaryReportSelector}>
        <span>{trans("studentSummary.summaryRange", "汇总范围")}</span>
        <Popover
          content={summaryReportContent}
          trigger="click"
          placement="bottomLeft"
          overlayClassName={styles.summaryReportPopover}
        >
          <div
            className={`${styles.summaryReportTrigger} ${
              firstSelectedSummaryReport ? "" : styles.summaryReportPlaceholder
            }`}
            title={selectedSummaryReportList
              .map((item) => this.getSummaryReportDisplayName(item))
              .join("、")}
          >
            <span>{selectorText}</span>
            <Icon type="down" />
          </div>
        </Popover>
      </div>
    );
  };

  /**
   * 获取汇总报告在当前语言下的展示名称。
   * @param {object} item 汇总报告
   * @returns {string} 展示名称
   */
  getSummaryReportDisplayName = (item) => {
    if (!item) {
      return "";
    }
    return locale() === "en" && item.reportEname
      ? item.reportEname
      : item.reportName;
  };

  changeSummaryReportIds = (selectedSummaryReportIds) => {
    this.setState(
      {
        selectedSummaryReportIds,
        totalScoreTrendHoverIndex: null,
      },
      () => this.getTable(),
    );
  };

  /**
   * 计算趋势图上每个报告点的横向坐标。
   * @param {number} index 报告点下标
   * @param {Array} trendData 趋势图数据
   * @param {number} chartWidth 图表绘图区宽度
   * @param {object} padding 图表边距配置
   * @returns {number} 报告点横坐标
   */
  getTotalScoreTrendX = (index, trendData, chartWidth, padding) => {
    if (trendData.length <= 1) {
      return padding.left + chartWidth / 2;
    }
    return padding.left + (chartWidth / (trendData.length - 1)) * index;
  };

  /**
   * 计算中英文混排文本展示宽度，中文按 2 个宽度单位计算。
   * @param {string} text 需要计算的文本
   * @returns {number} 文本展示宽度
   */
  getTextDisplayWidth = (text) => {
    return String(text || "")
      .split("")
      .reduce(
        (width, char) => width + (/[\u4E00-\u9FA5]/.test(char) ? 2 : 1),
        0,
      );
  };

  /**
   * 按展示宽度切割文本，避免 SVG 单行文本互相重叠。
   * @param {string} text 原始文本
   * @param {number} maxWidth 每行最大展示宽度
   * @returns {{line: string, rest: string}} 当前行和剩余文本
   */
  splitTextByDisplayWidth = (text, maxWidth) => {
    const source = String(text || "");
    let width = 0;
    let index = 0;
    while (index < source.length) {
      const char = source[index];
      const charWidth = /[\u4E00-\u9FA5]/.test(char) ? 2 : 1;
      if (width + charWidth > maxWidth) {
        break;
      }
      width += charWidth;
      index++;
    }
    return {
      line: source.slice(0, index),
      rest: source.slice(index),
    };
  };

  /**
   * 将报告名称拆成最多两行，第二行超长时补省略号。
   * @param {string} text 报告名称
   * @param {number} maxWidth 每行最大展示宽度
   * @returns {string[]} 拆分后的报告名称行
   */
  getTotalScoreExamNameLines = (text, maxWidth) => {
    if (this.getTextDisplayWidth(text) <= maxWidth) {
      return [text];
    }
    const firstLine = this.splitTextByDisplayWidth(text, maxWidth);
    const secondLine = this.splitTextByDisplayWidth(
      firstLine.rest,
      maxWidth - 2,
    );
    const hasMore = this.getTextDisplayWidth(secondLine.rest) > 0;
    return [
      firstLine.line,
      hasMore ? `${secondLine.line}...` : secondLine.line,
    ];
  };

  scrollSummaryContainer = () => {
    const scrollLeft = (node) => {
      if (!node) {
        return;
      }
      node.scrollLeft = this.state.dataOrder === "asc" ? node.scrollWidth : 0;
    };
    scrollLeft(this.totalScoreTrendChartNode);
    scrollLeft(this.summaryScoreTableNode);
    scrollLeft(this.summaryRadarListNode);
  };

  getSummaryGradeList = () => {
    const { summaryScoreTable = {} } = this.getStudentSummaryDashboardData();
    return (summaryScoreTable.gradeGroups || []).map((item, index) => ({
      ...item,
      gradeIndex: index,
    }));
  };

  getSummarySubjectRows = () => {
    const { summaryScoreTable = {} } = this.getStudentSummaryDashboardData();
    return (summaryScoreTable.subjectRows || []).map((item) => ({
      ...item,
      name: item.subjectName,
    }));
  };

  getNextGradeName = (gradeName, step) => {
    const gradeNames = [
      "一年级",
      "二年级",
      "三年级",
      "四年级",
      "五年级",
      "六年级",
      "七年级",
      "八年级",
      "九年级",
    ];
    const currentIndex = gradeNames.indexOf(gradeName);
    if (currentIndex > -1 && gradeNames[currentIndex + step]) {
      return gradeNames[currentIndex + step];
    }
    return gradeName;
  };

  getSummaryExamGroups = () => {
    const { summaryScoreTable = {} } = this.getStudentSummaryDashboardData();
    return (summaryScoreTable.gradeGroups || []).map((group, groupIndex) => ({
      ...group,
      schoolYear: group.gradeId || groupIndex,
      gradeIndex: groupIndex,
      exams: (group.reportList || []).map((item, examIndex) => ({
        ...item,
        examIndex,
        examName: item.reportName,
      })),
    }));
  };

  getSummaryScoreValue = (item, subject, examIndex, gradeIndex, isAverage) => {
    const scoreCell = (subject.scoreCells || []).find(
      (cell) => cell.summaryReportId === item.summaryReportId,
    );
    if (!scoreCell) {
      return null;
    }
    return isAverage ? scoreCell.gradeAverageScore : scoreCell.score;
  };

  getTotalScoreTrendData = () => {
    const { trendList = [] } = this.getStudentSummaryDashboardData();
    return trendList;
  };

  getTotalScoreTrendPoint = (
    item,
    index,
    trendData,
    field,
    chartWidth,
    chartHeight,
    padding,
    scale,
    minValue,
  ) => {
    return {
      x: this.getTotalScoreTrendX(index, trendData, chartWidth, padding),
      y: padding.top + chartHeight - ((item[field] || 0) - minValue) * scale,
    };
  };

  renderTotalScoreTrendLine = (
    field,
    color,
    dashArray,
    chartWidth,
    chartHeight,
    padding,
    scale,
    minValue,
  ) => {
    const trendData = this.getTotalScoreTrendData();
    const points = trendData
      .map((item, index) => {
        const point = this.getTotalScoreTrendPoint(
          item,
          index,
          trendData,
          field,
          chartWidth,
          chartHeight,
          padding,
          scale,
          minValue,
        );
        return `${point.x},${point.y}`;
      })
      .join(" ");

    return (
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dashArray}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  };

  renderTotalScoreTrend = () => {
    if (this.state.subjectId !== 0) {
      return null;
    }
    const { dataOrder, totalScoreTrendMetric, totalScoreTrendHoverIndex } =
      this.state;
    const isScoreRate = totalScoreTrendMetric === "scoreRate";
    const isDescOrder = dataOrder === "desc";
    const trendData = this.getTotalScoreTrendData();
    const { summaryReportList = [], trendOverview = {} } =
      this.getStudentSummaryDashboardData();
    if (trendData.length === 0) {
      if (summaryReportList.length === 0) {
        return null;
      }
      return (
        <div className={styles.totalScoreTrendCard}>
          <div className={styles.totalScoreTrendHeader}>
            <div>
              <div className={styles.totalScoreTrendTitle}>
                {trans("studentSummary.totalScoreTrend", "总成绩趋势")}
              </div>
            </div>
            <div className={styles.totalScoreTrendControls}>
              {this.renderSummaryReportSelector(summaryReportList)}
              <div className={styles.totalScoreTrendSwitch}>
                <button
                  type="button"
                  className={
                    isDescOrder ? styles.activeTotalScoreTrendSwitch : ""
                  }
                  onClick={() => this.changeDataOrder("desc")}
                >
                  {trans("studentSummary.desc", "倒序")}
                </button>
                <button
                  type="button"
                  className={
                    isDescOrder ? "" : styles.activeTotalScoreTrendSwitch
                  }
                  onClick={() => this.changeDataOrder("asc")}
                >
                  {trans("studentSummary.asc", "正序")}
                </button>
              </div>
            </div>
          </div>
          <div className={styles.summaryEmpty}>
            {trans("selectCourse.noData", "暂无数据")}
          </div>
        </div>
      );
    }
    const padding = { top: 22, right: 104, bottom: 84, left: 104 };
    const svgWidth = Math.max(980, trendData.length * 112);
    const svgHeight = 324;
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;
    const maxFullScore = Math.max(
      ...trendData.map((item) => item.fullScore || 0),
      100,
    );
    const primaryField = isScoreRate ? "scoreRate" : "score";
    const classField = isScoreRate ? "classAverageRate" : "classAverageScore";
    const gradeField = isScoreRate ? "gradeAverageRate" : "gradeAverageScore";
    const scoreRateValues = trendData.reduce(
      (list, item) => [
        ...list,
        item.scoreRate || 0,
        item.classAverageRate || 0,
        item.gradeAverageRate || 0,
      ],
      [],
    );
    const scoreRateMinValue =
      Math.floor(Math.min(...scoreRateValues) / 10) * 10;
    const scoreRateMaxValue = Math.ceil(Math.max(...scoreRateValues) / 10) * 10;
    const scoreValues = trendData.reduce((list, item) => {
      for (const value of [
        item.score,
        item.classAverageScore,
        item.gradeAverageScore,
      ]) {
        if (value !== null && value !== undefined) {
          list.push(value);
        }
      }

      return list;
    }, []);
    const validScoreValues = scoreValues.length > 0 ? scoreValues : [0];
    const scoreMinValue = Math.max(
      0,
      Math.floor(Math.min(...validScoreValues) / 50) * 50,
    );
    const scoreMaxValue =
      Math.ceil(Math.max(maxFullScore, ...validScoreValues) / 50) * 50;
    const minValue = isScoreRate ? scoreRateMinValue : scoreMinValue;
    const maxValue = isScoreRate
      ? Math.max(scoreRateMaxValue, scoreRateMinValue + 10)
      : Math.max(scoreMaxValue, scoreMinValue + 50);
    const scale = chartHeight / Math.max(maxValue - minValue, 1);
    const yTicks = isScoreRate
      ? Array.from(
          { length: (maxValue - minValue) / 10 + 1 },
          (_, index) => minValue + index * 10,
        )
      : Array.from(
          { length: (maxValue - minValue) / 50 + 1 },
          (_, index) => minValue + index * 50,
        );
    const itemSpace =
      trendData.length > 1 ? chartWidth / (trendData.length - 1) : chartWidth;
    const hoveredItem =
      totalScoreTrendHoverIndex === null
        ? null
        : trendData[totalScoreTrendHoverIndex];
    const hoverX =
      totalScoreTrendHoverIndex === null
        ? padding.left
        : this.getTotalScoreTrendX(
            totalScoreTrendHoverIndex,
            trendData,
            chartWidth,
            padding,
          );
    const tooltipWidth = 178;
    const tooltipHeight = isScoreRate ? 144 : 126;
    const tooltipX = Math.min(
      Math.max(hoverX - tooltipWidth / 2, 4),
      svgWidth - tooltipWidth - 4,
    );
    const tooltipY = padding.top + 8;
    const hoverBandWidth = Math.min(Math.max(itemSpace * 0.72, 34), 90);
    const hoverBandX = Math.min(
      Math.max(hoverX - hoverBandWidth / 2, 4),
      svgWidth - hoverBandWidth - 4,
    );
    const scoreChange = trendOverview.scoreChange;
    const scoreRateChange = trendOverview.scoreRateChange;
    const classLead = trendOverview.classAverageRateDiff;
    const gradeLead = trendOverview.gradeAverageRateDiff;
    const stabilityRange = trendOverview.stabilityRange;

    return (
      <div className={styles.totalScoreTrendCard}>
        <div className={styles.totalScoreTrendHeader}>
          <div>
            <div className={styles.totalScoreTrendTitle}>
              {trans("studentSummary.totalScoreTrend", "总成绩趋势")}
            </div>
          </div>
          <div className={styles.totalScoreTrendControls}>
            {this.renderSummaryReportSelector(summaryReportList)}
            <div className={styles.totalScoreTrendSwitch}>
              <button
                type="button"
                className={
                  isDescOrder ? styles.activeTotalScoreTrendSwitch : ""
                }
                onClick={() => this.changeDataOrder("desc")}
              >
                {trans("studentSummary.desc", "倒序")}
              </button>
              <button
                type="button"
                className={
                  isDescOrder ? "" : styles.activeTotalScoreTrendSwitch
                }
                onClick={() => this.changeDataOrder("asc")}
              >
                {trans("studentSummary.asc", "正序")}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.performanceOverview}>
          <div className={styles.performanceCard}>
            <span>{trans("studentSummary.latestSummary", "最新汇总")}</span>
            <strong>
              {trendOverview.latestScore} / {trendOverview.latestFullScore}
            </strong>
            <em>{trendOverview.latestSummaryName}</em>
          </div>
          <div className={styles.performanceCard}>
            <span>{trans("studentSummary.comparePrevious", "较上次")}</span>
            <strong
              className={scoreChange >= 0 ? styles.upValue : styles.downValue}
            >
              {scoreChange >= 0 ? "+" : ""}
              {scoreChange || 0} {trans("studentSummary.point", "分")}
            </strong>
            <em>
              {trans("studentSummary.scoreRate", "得分率")}{" "}
              {scoreRateChange >= 0 ? "+" : ""}
              {scoreRateChange || 0}%
            </em>
          </div>
          <div className={styles.performanceCard}>
            <span>{trans("studentSummary.classCompare", "班级对比")}</span>
            <strong
              className={classLead >= 0 ? styles.upValue : styles.downValue}
            >
              {classLead >= 0 ? "+" : ""}
              {classLead || 0}%
            </strong>
            <em>
              {trans("studentSummary.classAverageRateDiff", "较班级平均得分率")}
            </em>
          </div>
          <div className={styles.performanceCard}>
            <span>{trans("studentSummary.gradeCompare", "年级对比")}</span>
            <strong
              className={gradeLead >= 0 ? styles.upValue : styles.downValue}
            >
              {gradeLead >= 0 ? "+" : ""}
              {gradeLead || 0}%
            </strong>
            <em>
              {trans("studentSummary.gradeAverageRateDiff", "较年级平均得分率")}
            </em>
          </div>
          <div className={styles.performanceCard}>
            <span>{trans("studentSummary.stability", "稳定性")}</span>
            <strong>{stabilityRange || 0}%</strong>
            <em>
              {trans(
                "studentSummary.recentScoreRateRange",
                "近 4 次得分率波动",
              )}
            </em>
          </div>
        </div>
        <div className={styles.totalScoreChartToolbar}>
          <div className={styles.totalScoreTrendLegend}>
            <span>
              <i className={styles.legendPrimary} />
              {isScoreRate
                ? trans("studentSummary.studentScoreRate", "学生得分率")
                : trans("studentSummary.studentTotalScore", "学生总分")}
            </span>
            <span>
              <i className={styles.legendClass} />
              {trans("studentSummary.classAverage", "班级平均")}
              {isScoreRate
                ? trans("studentSummary.scoreRate", "得分率")
                : trans("studentSummary.point", "分")}
            </span>
            <span>
              <i className={styles.legendGrade} />
              {trans("studentSummary.gradeAverage", "年级平均")}
              {isScoreRate
                ? trans("studentSummary.scoreRate", "得分率")
                : trans("studentSummary.point", "分")}
            </span>
            {isScoreRate ? null : (
              <span>
                <i className={styles.legendFullScore} />
                {trans("studentSummary.fullScore", "满分")}
              </span>
            )}
          </div>
          <div className={styles.totalScoreTrendSwitch}>
            <button
              type="button"
              className={isScoreRate ? "" : styles.activeTotalScoreTrendSwitch}
              onClick={() => this.changeTotalScoreTrendMetric("score")}
            >
              {trans("studentSummary.totalScore", "总分")}
            </button>
            <button
              type="button"
              className={isScoreRate ? styles.activeTotalScoreTrendSwitch : ""}
              onClick={() => this.changeTotalScoreTrendMetric("scoreRate")}
            >
              {trans("studentSummary.scoreRate", "得分率")}
            </button>
          </div>
        </div>
        <div
          className={styles.totalScoreTrendChart}
          ref={(node) => (this.totalScoreTrendChartNode = node)}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            role="img"
            style={{ width: svgWidth }}
            onMouseLeave={() => this.changeTotalScoreTrendHover(null)}
          >
            <title>
              {trans("studentSummary.totalScoreTrendChart", "总成绩趋势图")}
            </title>
            {yTicks.map((tick) => {
              const y = padding.top + chartHeight - (tick - minValue) * scale;
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    className={styles.totalScoreGridLine}
                  />
                  <text
                    x={padding.left - 12}
                    y={y + 4}
                    className={styles.totalScoreAxisText}
                  >
                    {tick}
                  </text>
                </g>
              );
            })}
            <text
              x={padding.left - 38}
              y={padding.top - 8}
              className={styles.totalScoreAxisLabel}
            >
              {isScoreRate
                ? trans("studentSummary.scoreRateAxis", "得分率(%)")
                : trans("studentSummary.scoreAxis", "分数")}
            </text>
            {hoveredItem ? (
              <rect
                x={hoverBandX}
                y={padding.top}
                width={hoverBandWidth}
                height={svgHeight - padding.top}
                rx="6"
                className={styles.totalScoreHoverBand}
              />
            ) : null}
            {trendData.map((item, index) => {
              const x = this.getTotalScoreTrendX(
                index,
                trendData,
                chartWidth,
                padding,
              );
              const barHeight =
                Math.max((item.fullScore || 0) - minValue, 0) * scale;
              const barTop = padding.top + chartHeight - barHeight;
              const examName =
                locale() === "en" && item.examEname
                  ? item.examEname
                  : item.examName;
              const examNameLines = this.getTotalScoreExamNameLines(
                examName,
                Math.max(18, Math.min(28, Math.floor(itemSpace / 6))),
              );
              return (
                <g key={`${item.examName}-${item.examDate}`}>
                  {isScoreRate ? null : (
                    <>
                      <rect
                        x={x - 12}
                        y={barTop}
                        width="24"
                        height={barHeight}
                        rx="5"
                        className={styles.totalScoreFullBar}
                      />
                      <text
                        x={x}
                        y={barTop - 6}
                        className={styles.totalScoreFullText}
                      >
                        {item.fullScore}
                      </text>
                    </>
                  )}
                  <text
                    x={x}
                    y={
                      examNameLines.length > 1 ? svgHeight - 52 : svgHeight - 37
                    }
                    className={styles.totalScoreExamName}
                  >
                    {examNameLines.map((line, lineIndex) => (
                      <tspan
                        x={x}
                        dy={lineIndex === 0 ? 0 : 16}
                        key={`${item.summaryReportId}-${lineIndex}`}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                  <text
                    x={x}
                    y={svgHeight - 16}
                    className={styles.totalScoreExamDate}
                  >
                    {item.examDate}
                  </text>
                </g>
              );
            })}
            {this.renderTotalScoreTrendLine(
              gradeField,
              "#7659e6",
              "7 7",
              chartWidth,
              chartHeight,
              padding,
              scale,
              minValue,
            )}
            {this.renderTotalScoreTrendLine(
              classField,
              "#29b37d",
              "7 7",
              chartWidth,
              chartHeight,
              padding,
              scale,
              minValue,
            )}
            {this.renderTotalScoreTrendLine(
              primaryField,
              "#1769ff",
              "",
              chartWidth,
              chartHeight,
              padding,
              scale,
              minValue,
            )}
            {trendData.map((item, index) => {
              const primaryPoint = this.getTotalScoreTrendPoint(
                item,
                index,
                trendData,
                primaryField,
                chartWidth,
                chartHeight,
                padding,
                scale,
                minValue,
              );
              const classPoint = this.getTotalScoreTrendPoint(
                item,
                index,
                trendData,
                classField,
                chartWidth,
                chartHeight,
                padding,
                scale,
                minValue,
              );
              const gradePoint = this.getTotalScoreTrendPoint(
                item,
                index,
                trendData,
                gradeField,
                chartWidth,
                chartHeight,
                padding,
                scale,
                minValue,
              );
              const valueSuffix = isScoreRate ? "%" : "";
              return (
                <g key={`${item.examDate}-${totalScoreTrendMetric}`}>
                  <circle
                    cx={primaryPoint.x}
                    cy={primaryPoint.y}
                    r="4"
                    className={styles.totalScorePrimaryDot}
                  />
                  <circle
                    cx={classPoint.x}
                    cy={classPoint.y}
                    r="3.5"
                    className={styles.totalScoreClassDot}
                  />
                  <circle
                    cx={gradePoint.x}
                    cy={gradePoint.y}
                    r="3.5"
                    className={styles.totalScoreGradeDot}
                  />
                  <text
                    x={primaryPoint.x}
                    y={primaryPoint.y - 12}
                    className={styles.totalScorePrimaryValue}
                  >
                    {item[primaryField]}
                    {valueSuffix}
                  </text>
                </g>
              );
            })}
            {trendData.map((item, index) => {
              const x = this.getTotalScoreTrendX(
                index,
                trendData,
                chartWidth,
                padding,
              );
              const areaLeft = Math.max(padding.left, x - itemSpace / 2);
              const areaRight = Math.min(
                svgWidth - padding.right,
                x + itemSpace / 2,
              );
              return (
                <rect
                  key={`${item.examDate}-hover`}
                  x={areaLeft}
                  y={padding.top}
                  width={Math.max(areaRight - areaLeft, 28)}
                  height={svgHeight - padding.top}
                  className={styles.totalScoreHoverArea}
                  onMouseEnter={() => this.changeTotalScoreTrendHover(index)}
                />
              );
            })}
            {hoveredItem ? (
              <g className={styles.totalScoreTooltip}>
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="8"
                  className={styles.totalScoreTooltipBg}
                />
                <text
                  x={tooltipX + 12}
                  y={tooltipY + 20}
                  className={styles.totalScoreTooltipTitle}
                >
                  {locale() === "en" && hoveredItem.examEname
                    ? hoveredItem.examEname
                    : hoveredItem.examName}
                </text>
                <text
                  x={tooltipX + 12}
                  y={tooltipY + 37}
                  className={styles.totalScoreTooltipDate}
                >
                  {hoveredItem.examDate}
                </text>
                <text
                  x={tooltipX + 12}
                  y={tooltipY + 60}
                  className={styles.totalScoreTooltipLabel}
                >
                  {trans("studentSummary.fullScore", "满分")}
                </text>
                <text
                  x={tooltipX + tooltipWidth - 12}
                  y={tooltipY + 60}
                  className={styles.totalScoreTooltipValue}
                >
                  {hoveredItem.fullScore}
                </text>
                <text
                  x={tooltipX + 12}
                  y={tooltipY + 78}
                  className={styles.totalScoreTooltipLabel}
                >
                  {trans("studentSummary.score", "得分")}
                </text>
                <text
                  x={tooltipX + tooltipWidth - 12}
                  y={tooltipY + 78}
                  className={styles.totalScoreTooltipValue}
                >
                  {hoveredItem.score}
                </text>
                <text
                  x={tooltipX + 12}
                  y={tooltipY + 96}
                  className={styles.totalScoreTooltipLabel}
                >
                  {isScoreRate
                    ? trans("studentSummary.studentScoreRate", "学生得分率")
                    : trans("studentSummary.classAverage", "班级平均")}
                </text>
                <text
                  x={tooltipX + tooltipWidth - 12}
                  y={tooltipY + 96}
                  className={styles.totalScoreTooltipValue}
                >
                  {isScoreRate
                    ? `${hoveredItem.scoreRate}%`
                    : hoveredItem.classAverageScore}
                </text>
                <text
                  x={tooltipX + 12}
                  y={tooltipY + 114}
                  className={styles.totalScoreTooltipLabel}
                >
                  {isScoreRate
                    ? trans("studentSummary.classScoreRate", "班级得分率")
                    : trans("studentSummary.gradeAverage", "年级平均")}
                </text>
                <text
                  x={tooltipX + tooltipWidth - 12}
                  y={tooltipY + 114}
                  className={styles.totalScoreTooltipValue}
                >
                  {isScoreRate
                    ? `${hoveredItem.classAverageRate}%`
                    : hoveredItem.gradeAverageScore}
                </text>
                {isScoreRate ? (
                  <>
                    <text
                      x={tooltipX + 12}
                      y={tooltipY + 132}
                      className={styles.totalScoreTooltipLabel}
                    >
                      {trans("studentSummary.gradeScoreRate", "年级得分率")}
                    </text>
                    <text
                      x={tooltipX + tooltipWidth - 12}
                      y={tooltipY + 132}
                      className={styles.totalScoreTooltipValue}
                    >
                      {hoveredItem.gradeAverageRate}%
                    </text>
                  </>
                ) : null}
              </g>
            ) : null}
          </svg>
        </div>
      </div>
    );
  };

  renderSummaryCoverageDashboard = () => {
    const examGroups = this.getSummaryExamGroups();
    if (examGroups.length === 0) {
      return null;
    }
    const summaryExamList = examGroups.reduce(
      (list, group, groupIndex) =>
        list.concat(
          group.exams.map((item, examIndex) => ({
            ...item,
            gradeIndex: group.gradeIndex,
            groupIndex,
            isGradeStart: groupIndex > 0 && examIndex === 0,
          })),
        ),
      [],
    );
    const subjectRows = this.getSummarySubjectRows();
    const summaryGridStyle = {
      gridTemplateColumns: `92px repeat(${summaryExamList.length}, minmax(112px, 1fr))`,
    };

    return (
      <>
        <div className={styles.summaryMatrixHeader}>
          <div>
            <div className={styles.summaryMatrixTitle}>
              {trans("studentSummary.scoreDetail", "汇总成绩明细")}
            </div>
          </div>
        </div>
        <div
          className={styles.summaryScoreTable}
          ref={(node) => (this.summaryScoreTableNode = node)}
        >
          <div
            className={styles.summaryScoreGradeHead}
            style={summaryGridStyle}
          >
            <span
              className={[
                styles.summarySubjectCell,
                styles.summarySubjectDivider,
              ].join(" ")}
            >
              {trans("studentSummary.grade", "年级")}
            </span>
            {examGroups.map((group, groupIndex) => (
              <span
                className={[
                  styles.summaryGradeGroup,
                  groupIndex % 2 ? styles.summaryGradeGroupAlt : "",
                  groupIndex > 0 ? styles.summaryGradeDivider : "",
                ].join(" ")}
                key={group.schoolYear}
                style={{ gridColumn: `span ${group.exams.length}` }}
              >
                {group.gradeName}
              </span>
            ))}
          </div>
          <div className={styles.summaryScoreHead} style={summaryGridStyle}>
            <span
              className={[
                styles.summarySubjectCell,
                styles.summarySubjectDivider,
              ].join(" ")}
            >
              {trans("studentSummary.subject", "学科")}
            </span>
            {summaryExamList.map((item) => (
              <span
                className={[
                  item.isGradeStart ? styles.summaryGradeStartCell : "",
                ].join(" ")}
                key={`${item.examName}-${item.examIndex}`}
              >
                <b>
                  {locale() === "en" && item.reportEname
                    ? item.reportEname
                    : item.examName}
                </b>
                <em>{item.examDate}</em>
              </span>
            ))}
          </div>
          {subjectRows.map((subject) => (
            <div
              className={styles.summaryScoreRow}
              key={subject.name}
              style={summaryGridStyle}
            >
              <span
                className={[
                  styles.summarySubjectCell,
                  styles.summarySubjectDivider,
                ].join(" ")}
              >
                {subject.name}
              </span>
              {summaryExamList.map((item) => {
                const scoreValue = this.getSummaryScoreValue(
                  item,
                  subject,
                  item.examIndex,
                  item.gradeIndex,
                );
                return (
                  <span
                    className={[
                      item.isGradeStart ? styles.summaryGradeStartCell : "",
                    ].join(" ")}
                    key={`${subject.name}-${item.examName}-${item.examIndex}`}
                  >
                    <b>
                      {scoreValue === null || scoreValue === undefined
                        ? "--"
                        : scoreValue}
                    </b>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </>
    );
  };

  clickBar = (index) => {
    this.setState(
      {
        active: index,
      },
      () => {
        if (index == 1) {
          if (this.state.subjectId == 0) {
            return;
          }
          const {
            gradeIdList,
            typeList,
            testId,
            pageSizeErr,
            pageNoErr,
            showType,
          } = this.state;
          this.props
            .dispatch({
              type: "home/getTrendAnalysisResultNew",
              payload: {
                studentId: this.state.studentId,
                subjectId:
                  this.state.subjectId == 0 ? "" : this.state.subjectId,
                gradeIdList:
                  gradeIdList.length == this.props.stuGradeList.length
                    ? ""
                    : gradeIdList.join(","),
                examTypeList:
                  typeList.length == this.props.stuTypeList.length
                    ? ""
                    : typeList.join(","),
                examIdList: testId[0] == 0 ? "" : testId.join(","),
                type: showType,
              },
            })
            .then(() => {
              if (
                this.props.newTrendList &&
                this.props.newTrendList.trendAnalysisResultModelList &&
                this.props.newTrendList.trendAnalysisResultModelList.length > 0
              ) {
                this.renderChart();
              }
            });
        } else if (index == 2) {
          this.getPage();
        } else if (index == 3) {
          this.getPage();
        } else if (index == 4) {
          this.getPage();
        }
      },
    );
  };
  changeGrade = (id, plainOptions) => {
    this.setState(
      {
        gradeIdList: id,
        indeterminate: id.length > 0 && id.length < plainOptions.length,
        checkAllGardes: id.length === plainOptions.length,
      },
      () => {
        console.log(this.state.gradeIdList, "zhang2");
        this.getExamName();
        this.getPage();
      },
    );
  };
  changeType = (id, plainOptions) => {
    this.setState(
      {
        typeList: id,
        indeterminate1: id.length > 0 && id.length < plainOptions.length,
        checkAllGardes: id.length === plainOptions.length,
      },
      () => {
        this.getExamName();
        this.getPage();
      },
    );
  };
  changeTest = (id, plainOptions) => {
    let testList = [];
    if (id.includes("0")) {
      testList = ["0"];
    } else {
      testList = id.length == plainOptions.length ? ["0"] : id;
    }
    this.setState(
      {
        testId: testList,
      },
      () => {
        this.getPage();
      },
    );
  };
  onRow = (row, index) => {
    return {
      onClick: (event) => {
        console.log(row, index, "www");
        let state = Object.assign({}, this.state);
        state[`hoverIndex${this.props.hoverIndex}`] = false;
        console.log(this.props.hoverIndex, state, row.questionId, "sasa");
        this.setState(
          {
            ...state,
            hoverIndexID: row.questionId,
          },
          () => {
            this.props
              .dispatch({
                type: "home/hoverIndex",
                payload: {
                  hoverIndex: row.questionId,
                },
              })
              .then(() => {
                // let state = Object.assign({}, this.state);
                state[`hoverIndex${row.questionId}`] = true;
                // state[`hoverIndex${this.props.hoverIndex}`] = false;
                // console.log(state, "sasa1");
                this.setState({
                  ...state,
                  hoverIndexID: row.questionId,
                });
              });
          },
        );
      },
      // onMouseLeave: (event) => {
      //   this.props.dispatch({
      //     type: "home/hoverIndex",
      //     payload: {
      //       hoverIndex: row.questionId,
      //     },
      //   });
      //   console.log(row, index, "www");
      //   let state = Object.assign({}, this.state);
      //   state[`hoverIndex${row.questionId}`] = false;
      //   this.setState({
      //     ...state,
      //     hoverIndexID: null,
      //   });
      // },
    };
  };
  onRow1 = (row, index) => {
    return {
      onClick: (event) => {
        let state = Object.assign({}, this.state);
        state[`hoverIndexc${this.props.hoverIndexc}`] = false;
        this.setState(
          {
            ...state,
          },
          () => {
            this.props
              .dispatch({
                type: "home/hoverIndexc",
                payload: {
                  hoverIndexc: row.questionId,
                },
              })
              .then(() => {
                state[`hoverIndexc${row.questionId}`] = true;

                this.setState({
                  ...state,
                });
              });
          },
        );
        // console.log(row, index, "www");
      },
    };
  };
  scoreChange = (index, e) => {
    const dom = document.getElementById(`question${index}`);

    if (e === 0) {
      return message.error(trans("detail.numMessage2", "请输入正整数"));
    }
    let value = e === "" ? 0 : e;
    const r = /^\d+(\.\d+)?/;
    if (!r.test(value)) {
      // return message.error(trans("detail.numMessage", "请输入数字"));
    }
    let newDateList = JSON.parse(JSON.stringify(this.state.errDetialList));
    newDateList.length > 0 &&
      newDateList.map((item) => {
        if (item.questionId == index) {
          item.answerFormat = value;
        }
      });
    this.setState(
      {
        errDetialList: newDateList,
      },
      () => {
        // clearTimeout(aaa);
        // this.autoSave();
      },
    );
    dom.scrollIntoView();
  };
  scoreChange1 = (index, e) => {
    // const dom = document.getElementById(`question${i}`);
    if (e === 0) {
      return message.error(trans("detail.numMessage2", "请输入正整数"));
    }
    let value = e === "" ? 0 : e;
    const r = /^\d+(\.\d+)?/;
    if (!r.test(value)) {
      // return message.error(trans("detail.numMessage", "请输入数字"));
    }
    let newDateList = JSON.parse(JSON.stringify(this.state.diyWorkList));
    newDateList.length > 0 &&
      newDateList.map((item) => {
        if (item.questionId == index) {
          item.answerFormat = value;
        }
      });
    this.setState(
      {
        diyWorkList: newDateList,
      },
      () => {
        // clearTimeout(aaa);
        // this.autoSave();
      },
    );
    // dom.scrollIntoView();
  };
  clickMoveUp = (e, id) => {
    e.stopPropagation();
    let list = JSON.parse(JSON.stringify(this.state.errDetialList));
    let index = null;
    list.length > 0 &&
      list.map((item, ind) => {
        if (item.questionId == id) {
          index = ind;
        }
      });
    if (index == 0) {
      message.warning(
        trans("allStudentTrend.alreadyAtTop", "已经处于置顶，无法上移"),
      );
    } else {
      // this.swapArray(list, index, index - 1);
      list[index] = list.splice(index - 1, 1, list[index])[0];
    }
    this.setState(
      {
        errDetialList: list,
      },
      () => {
        // clearTimeout(aaa);
        // this.autoSave();
      },
    );
  };
  clickMoveUp1 = (e, id) => {
    e.stopPropagation();
    let list = JSON.parse(JSON.stringify(this.state.diyWorkList));
    let index = null;
    list.length > 0 &&
      list.map((item, ind) => {
        if (item.questionId == id) {
          index = ind;
        }
      });
    if (index == 0) {
      message.warning(
        trans("allStudentTrend.alreadyAtTop", "已经处于置顶，无法上移"),
      );
    } else {
      // this.swapArray(list, index, index - 1);
      list[index] = list.splice(index - 1, 1, list[index])[0];
    }
    this.setState(
      {
        diyWorkList: list,
      },
      () => {
        // clearTimeout(aaa);
        // this.autoSave();
      },
    );
  };
  clickMoveDown = (e, id) => {
    e.stopPropagation();
    let list = JSON.parse(JSON.stringify(this.state.errDetialList));
    let index = null;
    list.length > 0 &&
      list.map((item, ind) => {
        if (item.questionId == id) {
          index = ind;
        }
      });
    if (index + 1 == list.length) {
      message.warning(
        trans("allStudentTrend.alreadyAtBottom", "已经处于置底，无法下移"),
      );
    } else {
      list[index] = list.splice(index + 1, 1, list[index])[0];
    }
    this.setState(
      {
        errDetialList: list,
      },
      () => {
        // clearTimeout(aaa);
        // this.autoSave();
      },
    );
  };
  clickMoveDown1 = (e, id) => {
    e.stopPropagation();
    let list = JSON.parse(JSON.stringify(this.state.diyWorkList));
    let index = null;
    list.length > 0 &&
      list.map((item, ind) => {
        if (item.questionId == id) {
          index = ind;
        }
      });
    if (index + 1 == list.length) {
      message.warning(
        trans("allStudentTrend.alreadyAtBottom", "已经处于置底，无法下移"),
      );
    } else {
      list[index] = list.splice(index + 1, 1, list[index])[0];
    }
    this.setState(
      {
        diyWorkList: list,
      },
      () => {
        // clearTimeout(aaa);
        // this.autoSave();
      },
    );
  };
  deleteQuestion = (e, id) => {
    e.stopPropagation();
    let newDateList = JSON.parse(JSON.stringify(this.state.errDetialList));
    newDateList =
      newDateList.length > 0 &&
      newDateList.filter((item) => item.questionId != id);
    this.setState(
      {
        errDetialList: newDateList,
      },
      () => {
        // clearTimeout(aaa);
        // this.autoSave();
      },
    );
  };
  deleteQuestion1 = (e, id) => {
    e.stopPropagation();
    let newDateList = JSON.parse(JSON.stringify(this.state.diyWorkList));
    newDateList =
      newDateList.length > 0 &&
      newDateList.filter((item) => item.questionId != id);
    this.setState(
      {
        diyWorkList: newDateList,
      },
      () => {
        // clearTimeout(aaa);
        // this.autoSave();
      },
    );
  };
  allGardeChange = (e, newGradeList) => {
    let gradeList = JSON.parse(JSON.stringify(newGradeList));
    let array = [];
    if (e.target.checked) {
      gradeList?.length > 0 &&
        gradeList.map((item) => {
          array.push(item.value);
        });
    }
    this.setState(
      {
        gradeIdList: e.target.checked ? array : [],
        indeterminate: false,
        checkAllGardes: e.target.checked,
      },
      () => {
        // console.log(arr, e.target.checked, "zhang1");
        this.getExamName();
        this.getPage();
      },
    );
  };
  allTypeChange = (e, newGradeList) => {
    let gradeList = JSON.parse(JSON.stringify(newGradeList));
    let array = [];
    if (e.target.checked) {
      gradeList?.length > 0 &&
        gradeList.map((item) => {
          array.push(item.value);
        });
    }
    this.setState(
      {
        typeList: e.target.checked ? array : [],
        indeterminate1: false,
        checkAllType: e.target.checked,
      },
      () => {
        // console.log(arr, e.target.checked, "zhang1");
        this.getExamName();
        this.getPage();
      },
    );
  };
  clickName = (sortOrder) => {
    // window.open(
    //   `${window.location.origin}/exam#/stuWork/${this.paperId}/${sortOrder.studentId}`
    // );
  };
  testClick = (id) => {
    // console.log(id, "111");
    this.props.dispatch({
      type: "home/getItem",
      payload: {
        questionId: id,
        paperId: this.paperId,
      },
    });
  };
  changeNoDiyWork = (value) => {
    this.setState(
      {
        pageNoDiyWork: value,
      },
      () => {
        this.getPage();
      },
    );
  };
  changeNoErr = (value) => {
    this.setState(
      {
        pageNoErr: value,
      },
      () => {
        this.getPage();
      },
    );
  };
  onShowSizeDiyWorkChange = (current, pageSize) => {
    this.setState(
      {
        pageNoDiyWork: 1,
        pageSizeDiyWork: pageSize,
      },
      () => {
        this.getPage();
      },
    );
  };
  onShowSizeErrChange = (current, pageSize) => {
    this.setState(
      {
        pageNoErr: 1,
        pageSizeErr: pageSize,
      },
      () => {
        this.getPage();
      },
    );
  };
  positiveClick = () => {
    this.setState(
      {
        positiveIcon: !this.state.positiveIcon,
        fallIcon: false,
      },
      () => {
        this.props.dispatch({
          type: "global/getKnowledgeQuestionList",
          payload: {
            studentId: this.state.studentId,
            subjectId: this.state.subjectId == 0 ? "" : this.state.subjectId,
            gradeIdList:
              this.state.gradeIdList.length == this.props.stuGradeList.length
                ? ""
                : this.state.gradeIdList.join(","),
            examTypeList:
              this.state.typeList.length == this.props.stuTypeList.length
                ? ""
                : this.state.typeList.join(","),
            examIdList:
              this.state.testId[0] == 0 ? "" : this.state.testId.join(","),
            descStatus: this.state.positiveIcon ? false : true,
            graspDegreeType:
              this.state.knowLedgeIntervalList.length == 3
                ? ""
                : this.state.knowLedgeIntervalList.join(","),
            queryType: this.state.isKnowledgeGrouping,
          },
        });
      },
    );
  };
  fallClick = () => {
    this.setState(
      {
        fallIcon: !this.state.fallIcon,
        positiveIcon: false,
      },
      () => {
        this.props.dispatch({
          type: "global/getKnowledgeQuestionList",
          payload: {
            studentId: this.state.studentId,
            subjectId: this.state.subjectId == 0 ? "" : this.state.subjectId,
            gradeIdList:
              this.state.gradeIdList.length == this.props.stuGradeList.length
                ? ""
                : this.state.gradeIdList.join(","),
            examTypeList:
              this.state.typeList.length == this.props.stuTypeList.length
                ? ""
                : this.state.typeList.join(","),
            examIdList:
              this.state.testId[0] == 0 ? "" : this.state.testId.join(","),
            descStatus: true,
            graspDegreeType:
              this.state.knowLedgeIntervalList.length == 3
                ? ""
                : this.state.knowLedgeIntervalList.join(","),
            queryType: this.state.isKnowledgeGrouping,
          },
        });
      },
    );
  };
  //搜索学生
  handleSearch = (value) => {
    // this.getStudents(value);
    const { initAllStu } = this.state;
    let filterList = initAllStu.filter((item) => item.userName.includes(value));
    this.setState({
      searchList: filterList,
    });
  };
  changeStu = (value) => {
    console.log(" 11212");
    let newStuList = [];
    this.state.initAllStu.length > 0 &&
      this.state.initAllStu.map((item) => {
        if (value == item.userId) {
          newStuList.push(item);
        }
      });
    this.setState(
      {
        studentId: value,
        searchStuId: value,
        gradeId: "",
        groupId: "",
        searchList: this.state.initAllStu,
        studentList: newStuList,
        selectedSummaryReportIds: null,
      },
      () => {
        this.state.searchList.length > 0 &&
          this.state.searchList.map((item) => {
            if (item.userId == this.state.studentId) {
              this.setState({
                stuGradeId: item.gradeId,
                stuStage: item.stage,
              });
            }
          });
        // this.saveCondition();
        // this.getAllStudent();
        this.getGrade();
        this.getExamName();
        console.log("112121");
        if (this.state.subjectId === 0) {
          this.getTable();
        } else {
          this.getPage();
        }
      },
    );
  };
  saveCondition = () => {
    const { changeStudentId } = this.props;
    // typeof changeStudentId === "function" && changeStudentId.call(this, this.state.studentId, this.state.value, this.getGroupIds());
    // let ifTutorStudent = this.state.activeTab == 1 ? 2 : 1;
    typeof changeStudentId === "function" &&
      changeStudentId.call(
        this,
        this.state.studentId,
        this.getGroupIds(),
        // ifTutorStudent
      );
  };
  getAllStudent = (type) => {
    const { value, groupId } = this.state;
    this.setState({
      loading: true,
    });
    let payloadObject = {
      // studentName: value,
      studentGroupIds: this.getGroupIds(),
      typeSource: "0",
      type: 1,
      source: 1,
    };
    if (this.stuId) {
      payloadObject.studentId = Number(this.stuId);
    } else if (this.state.searchStuId) {
      payloadObject.studentId = Number(this.state.searchStuId);
    }
    this.props
      .dispatch({
        type: "global/postFindUserCaptureCount",
        payload: {
          // ...payloadObj,
          groupIdList: this.getGroupIds().join(","),
        },
      })
      .then(() => {
        const { userList } = this.props;
        if (type) {
          this.setState(
            {
              studentList: userList,
              loading: false,
              studentId: userList?.length > 0 ? userList[0].userId : "",
              searchList: userList,
              initAllStu: userList,
              stuGradeId: userList?.length > 0 ? userList[0].gradeId : "",
              stuStage: userList?.length > 0 ? userList[0].stage : "",
              selectedSummaryReportIds: null,
            },
            () => {
              this.getGrade();
              this.getExamName();
              if (this.state.subjectId === 0) {
                this.getTable();
              } else {
                this.getPage();
              }
            },
          );
        } else {
          this.setState(
            {
              studentList: userList,
              loading: false,
              studentId: userList?.length > 0 ? userList[0].userId : "",
              stuGradeId: userList?.length > 0 ? userList[0].gradeId : "",
              stuStage: userList?.length > 0 ? userList[0].stage : "",
              selectedSummaryReportIds: null,
            },
            () => {
              this.getGrade();
              this.getExamName();
              if (this.state.subjectId === 0) {
                this.getTable();
              } else {
                this.getPage();
              }
            },
          );
        }
      });
  };
  getGroupIds = () => {
    const { studentGroupList } = this.props;
    const { gradeId, groupId } = this.state;
    let groupIds = [];
    if (gradeId == "") {
      groupIds = [];
    } else if (groupId === "") {
      let groupList = this.getGroupList();
      let ids = [];
      groupList &&
        groupList.length > 0 &&
        groupList.map((item) => {
          ids.push(item.studentGroupId);
        });
      groupIds = ids;
    } else {
      groupIds = [groupId];
    }
    return groupIds;
  };
  getGroupList = () => {
    const { gradeId } = this.state;
    const { studentGroupList } = this.props;
    let array = [];
    if (gradeId > 0) {
      for (const element of studentGroupList) {
        if (gradeId == element.gradeId) {
          array = element.studentClassModels;
          break;
        }
      }
    }
    return array;
  };
  changeCondition = (value, type) => {
    switch (type) {
      case "grade": {
        this.setState(
          {
            gradeId: value,
            groupId: "",
            // studentId: "",
            searchStuId: undefined,
          },
          () => {
            this.getList();
          },
        );
        break;
      }
      case "group": {
        this.setState(
          {
            groupId: value,
            // studentId: "",
            searchStuId: undefined,
          },
          () => {
            this.getList();
          },
        );
      }
    }
  };
  getList = () => {
    // this.saveCondition();
    this.getAllStudent();
  };
  changeStudentId = (studentId, gradeId, stage) => {
    if (studentId) {
      this.setState(
        {
          studentId,
          stuGradeId: gradeId,
          stuStage: stage,
        },
        () => {
          // this.saveCondition();
          // this.getType();
          this.getGrade();
          this.getExamName();
          if (this.state.subjectId === 0) {
            this.getTable();
          } else {
            this.getPage();
          }
        },
      );
    } else {
      this.setState(
        {
          studentId,
          searchStuId: undefined,
          gradeId: this.setGradeId(),
          groupId: "",
        },
        () => {
          // this.saveCondition();
          this.getAllStudent(true);
          // this.getType();
          // this.getGrade();
          // this.getExamName();
          // this.getPage();
        },
      );
    }
  };
  checkError = (e, defaultImg) => {
    e.target.src = defaultImg;
  };
  getStudentGroupList = () => {
    this.props
      .dispatch({
        type: "global/getStudentGroupList",
        payload: {},
      })
      .then(() => {
        this.setState({
          gradeId: this.setGradeId(),
        });
      });
  };
  setGradeId = () => {
    const { studentGroupList } = this.props;
    let gradeId = "";
    if (studentGroupList && studentGroupList.length == 1) {
      gradeId = studentGroupList[0].gradeId;
    }
    return gradeId;
  };
  clickKnowledgeGrouping = (e) => {
    this.setState(
      {
        isKnowledgeGrouping: e.target.value,
        knowLedgeIntervalList: [],
        positiveIcon: false,
        fallIcon: false,
      },
      () => {
        this.props.dispatch({
          type: "global/getKnowledgeQuestionList",
          payload: {
            studentId: this.state.studentId,
            subjectId: this.state.subjectId == 0 ? "" : this.state.subjectId,
            gradeIdList:
              this.state.gradeIdList.length == this.props.stuGradeList.length
                ? ""
                : this.state.gradeIdList.join(","),
            examTypeList:
              this.state.typeList.length == this.props.stuTypeList.length
                ? ""
                : this.state.typeList.join(","),
            examIdList:
              this.state.testId[0] == 0 ? "" : this.state.testId.join(","),
            queryType: this.state.isKnowledgeGrouping,
            graspDegreeType:
              this.state.knowLedgeIntervalList.length == 3
                ? ""
                : this.state.knowLedgeIntervalList.join(","),
            descStatus: this.state.positiveIcon ? false : true,
          },
        });
      },
    );
  };
  clickShowType = (e) => {
    this.setState(
      {
        showType: e.target.value,
      },
      () => {
        this.getPage();
      },
    );
  };
  clickRetract = () => {
    this.setState({
      isSelect: !this.state.isSelect,
    });
  };
  changeKnowLedgeIntervalList = (e) => {
    this.setState({
      knowLedgeIntervalList: e,
    });
  };
  //点击确认
  intervalOk = () => {
    console.log(this.state.knowLedgeIntervalList, "lll");
    this.setState(
      {
        isKnowLedgeInterval: false,
      },
      () => {
        this.getPage();
      },
    );
  };
  knowLedgeVisibleChange = (e) => {
    this.setState({
      isKnowLedgeInterval: e,
    });
  };
  //点击重置
  intervalResetting = () => {
    this.setState(
      {
        knowLedgeIntervalList: [],
      },
      () => {
        this.getPage();
      },
    );
  };
  //点击查询条件
  clickCriteriaBtn = (record) => {
    this.setState({
      isQueryCriteria: true,
      saveStuRecord: record,
    });
  };
  changeShowAnswer = (checked) => {
    this.setState({
      isShowAnswer: checked,
    });
  };
  visibleChange = () => {
    this.setState({
      isQueryCriteria: false,
    });
  };
  downloadWrongQuestion = () => {
    this.setState(
      {
        isStuStudy: true,
      },
      () => {
        this.props.dispatch({
          type: "global/getStudentGroupListAndStudentList",
        });
      },
    );
  };
  handleCancelDownload = () => {
    this.setState({
      isStuStudy: false,
    });
  };
  onRef = (reference) => {
    this.studentSelect = reference;
  };
  onRef1 = (reference) => {
    this.stuConditionSelect = reference;
  };
  searchStuName = (e) => {
    this.props
      .dispatch({
        type: "global/getStudentGroupListAndStudentList",
        payload: {
          keyWord: e,
        },
      })
      .then(() => {});
  };
  clickQuestionNum = (id, name) => {
    this.setState(
      {
        isErrTopic: true,
        tableName: name,
      },
      () => {
        this.props
          .dispatch({
            type: "global/getKnowledgeErrorQuestionList",
            payload: {
              examIdWithQuestionIdList: id.join(","),
            },
          })
          .then(() => {});
      },
    );
  };
  errTopicChange = () => {
    this.setState({
      isErrTopic: false,
    });
  };
  handleCriteriaBtn = () => {
    this.setState({
      isQueryCriteria: false,
      saveStuRecord: null,
    });
  };
  clickSavedCriteria = () => {
    this.setState({
      isSavedCriteria: true,
    });
  };
  savedCriteriaChange = () => {
    this.setState({
      isSavedCriteria: false,
    });
  };
  pushStatus = () => {
    this.setState({
      isPushStatus: true,
    });
  };
  saveQueryCriteria = (record) => {
    console.log(record, "yyy");
    let newExamIdList = [];
    record &&
      record.examIdList &&
      record.examIdList.length > 0 &&
      record.examIdList.map((item) => {
        newExamIdList.push(item + "");
      });
    this.setState(
      {
        gradeIdList: record.gradeIdList,
        subjectId: record.subjectId,
        typeList: record.examTypeList,
        testId: newExamIdList,
        active: 3,
      },
      () => {
        this.getExamName();
        this.getPage();
      },
    );
  };
  renderRadar = () => {
    const { tableData } = this.props;
    const { endterim, interim, subjectId } = this.state;
    const richSetting = {
      legend0: {
        color: "#FF9451",
        align: "right",
        fontSize: 10,
        padding: [0, 0, 0, 8],
      },
      legend1: {
        color: "#3d94ff",
        fontSize: 10,
        align: "right",
        padding: [0, 0, 0, 0],
      },
    };
    if (subjectId === 0) {
      const examGroups = this.getSummaryExamGroups();
      const subjectRows = this.getSummarySubjectRows();
      examGroups.map((grade, gradeGroupIndex) => {
        grade.exams.map((item, examIndex) => {
          const chartDom = document.getElementById(
            `summaryRadar${gradeGroupIndex}${examIndex}`,
          );
          if (!chartDom) {
            return;
          }
          const oldChart =
            echarts.getInstanceByDom && echarts.getInstanceByDom(chartDom);
          if (oldChart) {
            oldChart.dispose();
          }
          const myChart = echarts.init(chartDom);
          const score = subjectRows.map((subject) =>
            this.getSummaryScoreValue(
              item,
              subject,
              item.examIndex,
              grade.gradeIndex,
            ),
          );
          const avg = subjectRows.map((subject) =>
            this.getSummaryScoreValue(
              item,
              subject,
              item.examIndex,
              grade.gradeIndex,
              true,
            ),
          );
          const maxScore = Math.max(...score, ...avg, 10);
          const indicator = subjectRows.map((subject) => ({
            text: subject.name,
            max: Math.ceil(maxScore * 1.2),
          }));
          const newData = subjectRows.map((subject, index) => ({
            subjectName: subject.name,
            score: score[index],
            avgScore: avg[index],
          }));
          const option = {
            color: ["#FF9451", "#3d94ff"],
            title: {
              text:
                locale() === "en" && item.reportEname
                  ? item.reportEname
                  : item.examName,
              top: 12,
              left: "center",
              textStyle: {
                color: "#0B1B45",
                fontWeight: "normal",
                fontFamily: "PingFangSC-Medium",
                fontSize: 12,
              },
            },
            tooltip: {
              show: true,
              textStyle: {
                fontSize: 8,
              },
              confine: true,
              formatter: (parameters) => {
                let list = `<div class="tooltipDiy"><div class="leftBar"></div><div class="rightBar"><span class="stupersonTitle">${trans("global.stuPersonal", "学生个人")}</span><span class="gradeavgTitle">${trans("global.gradeAvr", "年级平均")}</span></div></div>`;
                if (
                  parameters.data.newData &&
                  parameters.data.newData.length > 0
                ) {
                  parameters.data.newData.map((itt) => {
                    list += `<div class="tooltipDiy"><div class="leftBar">${itt.subjectName}</div><div class="rightBar"><span class="stuperson">${itt.score}</span><span class="gradeavg">${itt.avgScore}</span></div></div>`;
                  });
                }
                return list;
              },
              extraCssText: "width: 220px",
            },
            radar: [
              {
                indicator,
                center: ["50%", "58%"],
                radius: 52,
                axisLabel: {
                  show: true,
                  color: "rgba(11, 27, 69, 0.4)",
                  showMinLabel: false,
                },
                axisName: {
                  color: "#0b1b45",
                  fontSize: 10,
                  textAlign: "left",
                  formatter: function (parameters) {
                    const current = newData.find(
                      (dataItem) => dataItem.subjectName === parameters,
                    );
                    if (!current) {
                      return `{text|${parameters}}`;
                    }
                    return `{text|${parameters}} {legend0|${current.score}}\n{legend1|${current.avgScore}}`;
                  },
                  rich: {
                    textAlign: "left",
                    text: {
                      color: "#0b1b45",
                      fontSize: 10,
                    },
                    ...richSetting,
                  },
                },
              },
            ],
            series: [
              {
                type: "radar",
                data: [
                  {
                    value: score,
                    symbol: "none",
                    newData,
                    areaStyle: {
                      color: "rgba(255, 148, 81, 0.25)",
                    },
                    name: trans("global.stuPersonal", "学生个人"),
                  },
                  {
                    value: avg,
                    symbol: "none",
                    newData,
                    areaStyle: {
                      color: "rgba(61, 148, 255, 0.25)",
                    },
                    name: trans("global.gradeAvr", "年级平均"),
                  },
                ],
              },
            ],
          };
          myChart.setOption(option);
        });
      });
      return;
    }
    if (
      tableData.overallStudentScoreModelList &&
      tableData.overallStudentScoreModelList.length > 0
    ) {
      let lis = JSON.parse(
        JSON.stringify(tableData.overallStudentScoreModelList),
      );

      lis.reverse().map((item, index) => {
        console.log(lis, "rrrlis");
        if (
          item.semesterSubjectModelList &&
          item.semesterSubjectModelList.length > 0
        ) {
          item.semesterSubjectModelList.map((it, ind) => {
            if (it.examTypeModelList && it.examTypeModelList.length > 0) {
              it.examTypeModelList.map((tt, inde) => {
                if (tt.subjectList && tt.subjectList.length > 0) {
                  if (endterim && interim) {
                    console.log(`radar${index}${ind}${inde}`, item, "rrr");
                    let chartDom = document.getElementById(
                      `radar${index}${ind}${inde}`,
                    );
                    console.log(chartDom);
                    if (!chartDom) return;
                    let myChart = echarts.init(chartDom);
                    myChart.dispose();
                    chartDom = document.getElementById(
                      `radar${index}${ind}${inde}`,
                    );
                    myChart = echarts.init(chartDom);
                    let inid = [];
                    let avg = [];
                    let score = [];
                    let newData = [];
                    let option;
                    newData = tt.subjectList;
                    tt.subjectList.map((index_, inde) => {
                      avg.push(index_.avgScore);
                      score.push(index_.score);
                      if (inde === 0) {
                        inid.push({ text: index_.subjectName });
                      } else {
                        inid.push({
                          text: index_.subjectName,
                          axisLabel: { show: false },
                        });
                      }
                    });
                    option = {
                      color: ["#FF9451", "#3d94ff"],

                      title: {
                        text: `${it.semesterName}-${tt.examTypeName}`,
                        top: 30,
                        left: "center",
                        textStyle: {
                          color: "#0B1B45",
                          fontWeight: "normal",
                          fontFamily: "PingFangSC-Medium",
                          fontSize: 12,
                        },
                      },
                      // tooltip: {
                      //   trigger: 'axis'
                      // },
                      tooltip: {
                        show: true,
                        textStyle: {
                          fontSize: 8,
                        },
                        confine: true,
                        // position: 'inside',
                        formatter: (parameters) => {
                          let list = `<div class="tooltipDiy"><div class="leftBar"></div><div class="rightBar"><span class="stupersonTitle">${trans("allStudentTrend.tooltipStudent", "学生个人")}</span><span class="gradeavgTitle">${trans("allStudentTrend.tooltipGradeAverage", "年级平均")}</span></div></div>`;
                          console.log(parameters, "ppap");
                          if (
                            parameters.data.newData &&
                            parameters.data.newData.length > 0
                          ) {
                            parameters.data.newData.map((itt) => {
                              list += `<div class="tooltipDiy"><div class="leftBar">${itt.subjectName}</div><div class="rightBar"><span class="stuperson">${itt.score}</span><span class="gradeavg">${itt.avgScore}</span></div></div>`;
                            });
                          }
                          return list;
                        },
                        extraCssText: "width: 220px",
                        // extraCssText:'width:400px;height:200px;pointer-events:all !important;white-space:pre-wrap;overflow-y:scroll;word-break:break-all;',
                      },
                      // legend: {
                      //   show: true,
                      //   left: 'center',
                      //   bottom: 5,
                      //   // z: 4,
                      //   icon: 'rect',
                      //   itemHeight: 2,
                      //   data: [
                      //         '学生个人',
                      //         '年级平均',
                      //       ]
                      // },
                      radar: [
                        {
                          indicator: inid,
                          center: ["50%", "55%"],
                          radius: 50,
                          // splitNumber: 5,
                          axisLabel: {
                            show: true,
                            color: "rgba(11, 27, 69, 0.4)",
                            showMinLabel: false,
                          },
                          axisName: {
                            color: "#0b1b45",
                            fontSize: 10,
                            // width: 90,
                            textAlign: "left",
                            // overflow: 'breakAll',
                            formatter: function (parameters, indicator) {
                              console.log(parameters, indicator, tt, "asas");
                              let result = "";
                              if (tt.subjectList && tt.subjectList.length > 0) {
                                tt.subjectList.map((ti) => {
                                  if (ti.subjectName === parameters) {
                                    result += `{legend0|${ti.score}}\n{legend1|${ti.avgScore}}`;
                                  }
                                });
                              }
                              console.log(result, parameters, "rere");
                              return `{text|${parameters}} ${result}`;
                            },
                            rich: {
                              textAlign: "left",
                              text: {
                                color: "#0b1b45",
                                fontSize: 10,
                                width: "80%",
                              },
                              ...richSetting,
                            },
                          },
                        },
                      ],
                      series: [
                        {
                          type: "radar",
                          // radarIndex: 1,
                          data: [
                            {
                              value: score,
                              // symbol: 'rect',
                              symbol: "none",
                              symbolSize: 12,
                              // lineStyle: {
                              //   type: 'dashed'
                              // },
                              newData,
                              areaStyle: {
                                color: "rgba(255, 148, 81, 0.25)",
                              },
                              label: {
                                show: true,
                                formatter: function (parameters) {
                                  return parameters.value;
                                },
                              },
                              seriesName: it.gradeSemesterName,
                              name: "学生个人",
                            },
                            {
                              value: avg,
                              // areaStyle: {
                              //   color: new echarts.graphic.RadialGradient(0.1, 0.6, 1, [
                              //     {
                              //       color: 'rgba(255, 145, 124, 0.1)',
                              //       offset: 0
                              //     },
                              //     {
                              //       color: 'rgba(255, 145, 124, 0.9)',
                              //       offset: 1
                              //     }
                              //   ])
                              // },
                              newData,
                              seriesName: it.gradeSemesterName,
                              symbol: "none",
                              areaStyle: {
                                color: "rgba(61, 148, 255, 0.25)",
                              },
                              name: "年级平均",
                            },
                          ],
                        },
                      ],
                    };

                    option && myChart.setOption(option);
                    console.log(option, "oo");
                  } else if (interim) {
                    if (tt.examTypeName.includes("期中")) {
                      let chartDom = document.getElementById(
                        `radar${index}${ind}${inde}`,
                      );
                      let myChart = echarts.init(chartDom);
                      // myChart.clear();
                      myChart.dispose();
                      chartDom = document.getElementById(
                        `radar${index}${ind}${inde}`,
                      );
                      myChart = echarts.init(chartDom);
                      let inid = [];
                      let avg = [];
                      let score = [];
                      let newData = [];
                      let option;
                      newData = tt.subjectList;
                      tt.subjectList.map((index_, inde) => {
                        avg.push(index_.avgScore);
                        score.push(index_.score);
                        if (inde === 0) {
                          inid.push({ text: index_.subjectName });
                        } else {
                          inid.push({
                            text: index_.subjectName,
                            axisLabel: { show: false },
                          });
                        }
                      });
                      option = {
                        color: ["#FF9451", "#3d94ff"],

                        title: {
                          text: it.gradeSemesterName,
                          top: 10,
                          left: "center",
                          textStyle: {
                            color: "#0B1B45",
                            fontWeight: "normal",
                            fontFamily: "PingFangSC-Medium",
                            fontSize: 14,
                          },
                        },
                        // tooltip: {
                        //   trigger: 'axis'
                        // },
                        tooltip: {
                          show: true,
                          textStyle: {
                            fontSize: 8,
                          },
                          confine: true,
                          // position: 'inside',
                          formatter: (parameters) => {
                            let list = `<div class="tooltipDiy"><div class="leftBar"></div><div class="rightBar"><span class="stupersonTitle">${trans("allStudentTrend.tooltipStudent", "学生个人")}</span><span class="gradeavgTitle">${trans("allStudentTrend.tooltipGradeAverage", "年级平均")}</span></div></div>`;
                            console.log(parameters, "ppap");
                            if (
                              parameters.data.newData &&
                              parameters.data.newData.length > 0
                            ) {
                              parameters.data.newData.map((itt) => {
                                list += `<div class="tooltipDiy"><div class="leftBar">${itt.subjectName}</div><div class="rightBar"><span class="stuperson">${itt.score}</span><span class="gradeavg">${itt.avgScore}</span></div></div>`;
                              });
                            }
                            return list;
                          },
                          extraCssText: "width: 220px",
                          // extraCssText:'width:400px;height:200px;pointer-events:all !important;white-space:pre-wrap;overflow-y:scroll;word-break:break-all;',
                        },
                        // legend: {
                        //   show: true,
                        //   left: 'center',
                        //   bottom: 5,
                        //   icon: 'rect',
                        //   itemHeight: 2,
                        //   data: [
                        //         '学生个人',
                        //         '年级平均',
                        //       ]
                        // },
                        radar: [
                          {
                            indicator: inid,
                            center: ["50%", "55%"],
                            radius: 70,
                            // splitNumber: 5,
                            axisLabel: {
                              show: true,
                              color: "rgba(11, 27, 69, 0.4)",
                              showMinLabel: false,
                            },
                            axisName: {
                              color: "#0b1b45",
                              fontSize: 10,
                              // width: 90,
                              textAlign: "left",
                              // overflow: 'breakAll',
                              formatter: function (parameters, indicator) {
                                console.log(parameters, indicator, tt, "asas");
                                let result = "";
                                if (
                                  tt.subjectList &&
                                  tt.subjectList.length > 0
                                ) {
                                  tt.subjectList.map((ti) => {
                                    if (ti.subjectName === parameters) {
                                      result += `{legend0|${ti.score}}\n{legend1|${ti.avgScore}}`;
                                    }
                                  });
                                }
                                console.log(result, parameters, "rere");
                                return `{text|${parameters}} ${result}`;
                              },
                              rich: {
                                textAlign: "left",
                                text: {
                                  color: "#0b1b45",
                                  fontSize: 10,
                                },
                                ...richSetting,
                              },
                            },
                          },
                        ],
                        series: [
                          {
                            type: "radar",
                            // radarIndex: 1,
                            data: [
                              {
                                value: score,
                                // symbol: 'rect',
                                symbol: "none",
                                symbolSize: 12,
                                // lineStyle: {
                                //   type: 'dashed'
                                // },
                                newData,
                                areaStyle: {
                                  color: "rgba(255, 148, 81, 0.25)",
                                },
                                label: {
                                  show: true,
                                  formatter: function (parameters) {
                                    return parameters.value;
                                  },
                                },
                                seriesName: it.gradeSemesterName,
                                name: "学生个人",
                              },
                              {
                                value: avg,
                                // areaStyle: {
                                //   color: new echarts.graphic.RadialGradient(0.1, 0.6, 1, [
                                //     {
                                //       color: 'rgba(255, 145, 124, 0.1)',
                                //       offset: 0
                                //     },
                                //     {
                                //       color: 'rgba(255, 145, 124, 0.9)',
                                //       offset: 1
                                //     }
                                //   ])
                                // },
                                newData,
                                seriesName: it.gradeSemesterName,
                                symbol: "none",
                                areaStyle: {
                                  color: "rgba(61, 148, 255, 0.25)",
                                },
                                name: "年级平均",
                              },
                            ],
                          },
                        ],
                      };

                      option && myChart.setOption(option);
                      console.log(option, "oo");
                    }
                  } else {
                    if (tt.examTypeName.includes("期末")) {
                      let chartDom = document.getElementById(
                        `radar${index}${ind}${inde}`,
                      );
                      let myChart = echarts.init(chartDom);
                      // myChart.clear()
                      myChart.dispose();
                      chartDom = document.getElementById(
                        `radar${index}${ind}${inde}`,
                      );
                      myChart = echarts.init(chartDom);
                      let inid = [];
                      let avg = [];
                      let score = [];
                      let newData = [];
                      let option;
                      newData = tt.subjectList;
                      tt.subjectList.map((index_, inde) => {
                        avg.push(index_.avgScore);
                        score.push(index_.score);
                        if (inde === 0) {
                          inid.push({ text: index_.subjectName });
                        } else {
                          inid.push({
                            text: index_.subjectName,
                            axisLabel: { show: false },
                          });
                        }
                      });
                      option = {
                        color: ["#FF9451", "#3d94ff"],

                        title: {
                          text: it.gradeSemesterName,
                          top: 10,
                          left: "center",
                          textStyle: {
                            color: "#0B1B45",
                            fontWeight: "normal",
                            fontFamily: "PingFangSC-Medium",
                            fontSize: 14,
                          },
                        },
                        // tooltip: {
                        //   trigger: 'axis'
                        // },
                        tooltip: {
                          show: true,
                          textStyle: {
                            fontSize: 8,
                          },
                          confine: true,
                          // position: 'inside',
                          formatter: (parameters) => {
                            let list = `<div class="tooltipDiy"><div class="leftBar"></div><div class="rightBar"><span class="stupersonTitle">${trans("allStudentTrend.tooltipStudent", "学生个人")}</span><span class="gradeavgTitle">${trans("allStudentTrend.tooltipGradeAverage", "年级平均")}</span></div></div>`;
                            console.log(parameters, "ppap");
                            if (
                              parameters.data.newData &&
                              parameters.data.newData.length > 0
                            ) {
                              parameters.data.newData.map((itt) => {
                                list += `<div class="tooltipDiy"><div class="leftBar">${itt.subjectName}</div><div class="rightBar"><span class="stuperson">${itt.score}</span><span class="gradeavg">${itt.avgScore}</span></div></div>`;
                              });
                            }
                            return list;
                          },
                          extraCssText: "width: 220px",
                          // extraCssText:'width:400px;height:200px;pointer-events:all !important;white-space:pre-wrap;overflow-y:scroll;word-break:break-all;',
                        },
                        // legend: {
                        //   show: true,
                        //   left: 'center',
                        //   bottom: 5,
                        //   icon: 'rect',
                        //   itemHeight: 2,
                        //   data: [
                        //         '学生个人',
                        //         '年级平均',
                        //       ]
                        // },
                        radar: [
                          {
                            indicator: inid,
                            center: ["50%", "55%"],
                            radius: 70,
                            // splitNumber: 5,
                            axisLabel: {
                              show: true,
                              color: "rgba(11, 27, 69, 0.4)",
                              showMinLabel: false,
                            },
                            axisName: {
                              color: "#0b1b45",
                              fontSize: 10,
                              // width: 90,
                              textAlign: "left",
                              // overflow: 'breakAll',
                              formatter: function (parameters, indicator) {
                                console.log(parameters, indicator, tt, "asas");
                                let result = "";
                                if (
                                  tt.subjectList &&
                                  tt.subjectList.length > 0
                                ) {
                                  tt.subjectList.map((ti) => {
                                    if (ti.subjectName === parameters) {
                                      result += `{legend0|${ti.score}}\n{legend1|${ti.avgScore}}`;
                                    }
                                  });
                                }
                                console.log(result, parameters, "rere");
                                return `{text|${parameters}} ${result}`;
                              },
                              rich: {
                                textAlign: "left",
                                text: {
                                  color: "#0b1b45",
                                  fontSize: 10,
                                },
                                ...richSetting,
                              },
                            },
                          },
                        ],
                        series: [
                          {
                            type: "radar",
                            // radarIndex: 1,
                            data: [
                              {
                                value: score,
                                // symbol: 'rect',
                                symbol: "none",
                                symbolSize: 12,
                                // lineStyle: {
                                //   type: 'dashed'
                                // },
                                newData,
                                areaStyle: {
                                  color: "rgba(255, 148, 81, 0.25)",
                                },
                                label: {
                                  show: true,
                                  formatter: function (parameters) {
                                    return parameters.value;
                                  },
                                },
                                seriesName: it.gradeSemesterName,
                                name: "学生个人",
                              },
                              {
                                value: avg,
                                // areaStyle: {
                                //   color: new echarts.graphic.RadialGradient(0.1, 0.6, 1, [
                                //     {
                                //       color: 'rgba(255, 145, 124, 0.1)',
                                //       offset: 0
                                //     },
                                //     {
                                //       color: 'rgba(255, 145, 124, 0.9)',
                                //       offset: 1
                                //     }
                                //   ])
                                // },
                                newData,
                                seriesName: it.gradeSemesterName,
                                symbol: "none",
                                areaStyle: {
                                  color: "rgba(61, 148, 255, 0.25)",
                                },
                                name: "年级平均",
                              },
                            ],
                          },
                        ],
                      };

                      option && myChart.setOption(option);
                      console.log(option, "oo");
                    }
                  }
                }
              });
            }
          });
        }
      });
    }
  };
  changeInTerim = (e) => {
    this.setState(
      {
        interim: this.state.endterim ? e.target.checked : true,
      },
      () => {
        this.renderRadar();
      },
    );
  };
  changeEndTerim = (e) => {
    this.setState(
      {
        endterim: this.state.interim ? e.target.checked : true,
      },
      () => {
        this.renderRadar();
      },
    );
  };
  render() {
    const {
      studentGroupListAndStudentList,
      currentUser,
      basketList,
      basketSubjectId,
      questionScore,
      tableClass,
      newTrendList,
      teachingOrgList,
      allStudents,
      allSubjectList,
      stuGradeList,
      stuTypeList,
      stuNameList,
      knowledgeQuestionList,
      errorQuestionList,
      hoverIndex,
      individuationTest,
      questionItem,
      studentGroupList,
      personalizedList,
      knowledgeErrorQuestionList,
      tableData,
    } = this.props;
    const {
      stuGradeId,
      isPushStatus,
      saveStuRecord,
      check,
      stuId,
      treeClass,
      isStuStudy,
      subjectId,
      active,
      classStuList,
      gradeIdList,
      typeList,
      testId,
      errDetialList,
      checkAllGardes,
      checkAllType,
      fallIcon,
      positiveIcon,
      searchStuId,
      searchList,
      gradeId,
      groupId,
      loading,
      studentId,
      studentList,
      isKnowledgeGrouping,
      isSelect,
      knowLedgeIntervalList,
      isKnowLedgeInterval,
      indeterminate,
      diyWorkList,
      isQueryCriteria,
      isErrTopic,
      tableName,
      isSavedCriteria,
      showType,
      endterim,
      interim,
      isShowAnswer,
      summaryLoading,
    } = this.state;
    let newGradeList = [];
    let groupList = this.getGroupList();
    stuGradeList &&
      stuGradeList.length &&
      stuGradeList.map((item) => {
        if (stuGradeId) {
          if (item.gradeId > stuGradeId) return;
          newGradeList.push({
            label: language ? item.gradeName : item.gradeEnName,
            value: item.gradeId,
          });
        } else {
          newGradeList.push({
            label: language ? item.gradeName : item.gradeEnName,
            value: item.gradeId,
          });
        }
      });
    let newTypeList = [];
    stuTypeList &&
      stuTypeList.length &&
      stuTypeList.map((item) => {
        newTypeList.push({
          label: item.typeName,
          value: item.code,
        });
      });
    let newKnowledgeDataSource = [];
    knowledgeQuestionList &&
      knowledgeQuestionList.detail &&
      knowledgeQuestionList.detail.length > 0 &&
      knowledgeQuestionList.detail.map((item) => {
        item.oneLevelKnowledges.length > 0 &&
          item.oneLevelKnowledges.map((ite) => {
            ite.twoLevelKnowledges.length > 0 &&
              ite.twoLevelKnowledges.map((it, index) => {
                it.threeLevelKnowledges.length > 0 &&
                  it.threeLevelKnowledges.map((index_) => {
                    newKnowledgeDataSource.push({
                      graspDegree: item.graspDegree,
                      oneRowSpan: item.oneLevelKnowledges.length,
                      oneLevelKnowledgeName: ite.oneLevelKnowledgeName,
                      twoRowSpan: it.threeLevelKnowledges.length,
                      twoLevelKnowledgeName: it.twoLevelKnowledgeName,
                      // threeColSpan: it.threeLevelKnowledges.length,
                      threeLevelKnowledgeName: index_.threeLevelKnowledgeName,
                      questionNum: index_.questionNum,
                      score: index_.score,
                      scoreRate: index_.scoreRate,
                      levelList: index_.levelList,
                    });
                  });
              });
          });
      });
    // console.log(errorQuestionList.errorQuestionNum, "zhang");
    let newKnowledgeColumns = [
      {
        width: 100,
        title: trans("global.masteryLevel", "掌握程度"),
        dataIndex: "graspDegree",
        key: "graspDegree",
        render: (text, row, index) => {
          return {
            children: <sapn>{text}</sapn>,
            // props: {
            //   rowSpan: index == 0 ? 5 : 0,
            // },
          };
        },
      },
      {
        width: 100,
        title: trans("global.firstLevelKnowledgePoints", "一级知识点"),
        dataIndex: "oneLevelKnowledgeName",
        key: "oneLevelKnowledgeName",
        render: (text, row, index) => {
          return {
            children: <sapn>{text}</sapn>,
            // props: {
            //   rowSpan: index == 1 ? 5 : 0,
            // },
          };
        },
      },
      {
        width: 100,
        title: trans("global.secondaryKnowledgePoints", "二级知识点"),
        dataIndex: "twoLevelKnowledgeName",
        key: "twoLevelKnowledgeName",
        render: (text, row, index) => {
          // let num = 1;
          // if (index == 0) {
          //   num = row.twoRowSpan;
          // } else if (index == row.twoRowSpan - 1) {
          //   num = row.twoRowSpan;
          // }
          return {
            children: <sapn>{text}</sapn>,
            // props: {
            //   rowSpan: row.twoRowSpan,
            // },
          };
        },
      },
      {
        width: 120,
        title: trans("global.levelKnowledgePoints", "三级知识点"),
        dataIndex: "threeLevelKnowledgeName",
        key: "threeLevelKnowledgeName",
      },
      {
        width: 80,
        title: trans("global.questionsNum", "题目数"),
        dataIndex: "questionNum",
        key: "questionNum",
      },
      {
        width: 80,
        title: trans("detail.questionScore", "分值"),
        dataIndex: "score",
        key: "score",
      },
      {
        width: 120,
        title: trans("global.difficultyDegree", "难度分布"),
        dataIndex: "levelList",
        key: "levelList",
      },
      {
        width: 80,
        title: trans("analysis.knowLedgeScoreRate", "得分率"),
        dataIndex: "scoreRate",
        key: "scoreRate",
      },
    ];
    const newcolumns = [
      {
        title: trans("global.wrongCollection", "错题集合"),
        dataIndex: "name",
        key: "name",
        width: "70%",
        render: (text, record, index) => {
          // console.log(hoverIndexID, record.questionId, "222zwl");
          let numberRow = (record.answerFormat - 0) * 20;
          return {
            children: (
              <div
                // style={
                //   this.state[`hoverIndex${record.questionId}`]
                //     ? { border: "1px solid rgba(151,151,151,0.70)" }
                //     : null
                // }
                className={[
                  styles.rowBox,
                  this.state[`hoverIndex${record.questionId}`]
                    ? styles.blurBorder
                    : "",
                ].join(" ")}
                id={`question${record.questionId}`}
              >
                <div className={styles.questName} style={{ display: "flex" }}>
                  {/* <span>{record.questionSerialNumber}.</span> */}
                  <div
                    dangerouslySetInnerHTML={{ __html: record.content }}
                    style={{
                      marginBottom: "10px",
                      flex: "1",
                    }}
                  ></div>
                </div>
                {record.type == 6 &&
                record.sonQuestionList &&
                record.sonQuestionList.length > 0
                  ? record.sonQuestionList.map((ii, inde) => (
                      <div
                        className={styles.questName}
                        style={{ display: "flex" }}
                      >
                        <span>({inde + 1})</span>
                        <div
                          dangerouslySetInnerHTML={{ __html: ii.content }}
                          style={{
                            marginBottom: "10px",
                            flex: "1",
                          }}
                        ></div>
                      </div>
                    ))
                  : null}
                {record.type == 1 || record.type == 2 ? (
                  <>
                    <div
                      className={styles.questName}
                      style={{ paddingLeft: "25px" }}
                    >
                      {record.optionList &&
                        record.optionList.length &&
                        record.optionList.map((it) => (
                          <div
                            key={it}
                            dangerouslySetInnerHTML={{
                              __html: `${it.answers}`,
                            }}
                            style={{
                              marginRight: "10px",
                            }}
                          ></div>
                        ))}
                    </div>
                  </>
                ) : record.type == 6 &&
                  record.sonQuestionList &&
                  record.sonQuestionList.length > 0 ? (
                  record.sonQuestionList.map((ii, inde) =>
                    ii.type == 1 || ii.type == 2 ? (
                      <>
                        <div
                          className={styles.questName}
                          style={{ paddingLeft: "25px" }}
                        >
                          <span>({inde + 1})</span>
                          {ii.optionList &&
                            ii.optionList.length &&
                            ii.optionList.map((it) => (
                              <div
                                key={it}
                                dangerouslySetInnerHTML={{
                                  __html: `${it.answers}`,
                                }}
                                style={{
                                  marginRight: "10px",
                                }}
                              ></div>
                            ))}
                        </div>
                      </>
                    ) : null,
                  )
                ) : null}
                {/* {this.state[`hoverIndex${record.questionId}`] ? (
                <span className={styles.markExempt}>
                  {trans("global.markExempt", "标记为免做")}
                </span>
              ) : null} */}
                <div style={{ height: numberRow }}></div>
                {isShowAnswer ? (
                  <div className={styles.stuAnswer}>
                    {record.type == 6 &&
                    record.sonQuestionList &&
                    record.sonQuestionList.length > 0 ? (
                      record.sonQuestionList.map((ii, inde) => (
                        <div
                          className={styles.questName}
                          style={{
                            paddingLeft: "25px",
                            display: "flex",
                            marginBottom: "10px",
                          }}
                        >
                          <span style={{ width: "80px" }}>({inde + 1})</span>
                          {ii.studentAnswerUrl ? (
                            <img src={ii.studentAnswerUrl} />
                          ) : ii.studentAnswer ? (
                            <div>
                              <span>
                                {trans("global.studentAnswers", "学生答案")} ：
                              </span>
                              {ii.studentAnswer}
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : record.studentAnswerUrl ? (
                      <img src={record.studentAnswerUrl} />
                    ) : record.studentAnswer ? (
                      <div>
                        <span>
                          {trans("global.studentAnswers", "学生答案")}：
                        </span>
                        {record.studentAnswer}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {this.state[`hoverIndex${record.questionId}`] ? (
                  <>
                    <div className={styles.noOperate}>
                      <span>
                        <i className={icon.iconfont}>&#xe798;</i>
                        {record.examName}
                      </span>
                      {record.type === 1 ? (
                        <span
                          className={[
                            styles.questionType1,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe761;</i>
                          {trans("global.radio", "单选题")}
                        </span>
                      ) : record.type === 2 ? (
                        <span
                          className={[
                            styles.questionType2,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe755;</i>
                          {trans("global.check", "多选题")}
                        </span>
                      ) : record.type === 3 ? (
                        <span
                          className={[
                            styles.questionType3,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe802;</i>
                          {trans("global.pack", "填空题")}
                        </span>
                      ) : record.type === 4 ? (
                        <span
                          className={[
                            styles.questionType4,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe800;</i>
                          {trans("global.judge", "判断题")}
                        </span>
                      ) : record.type === 6 ? (
                        <span
                          className={[
                            styles.questionType4,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe800;</i>
                          {trans("global.combination", "组合题")}
                        </span>
                      ) : (
                        <span
                          className={[
                            styles.questionType5,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont} style={{ fontSize: 12 }}>
                            &#xe807;
                          </i>
                          {trans("global.ask", "问答题")}
                        </span>
                      )}
                      <span className={styles.inlineDifficulty}>
                        {/* <Select
                        dropdownClassName="selectStyles"
                        onChange={(value) =>
                          this.changeDifficultyChoice(
                            value,
                            record.id,
                            record.knowledgeIds
                          )
                        }
                        // value={
                        //   this.state[`choiceDifficultyValue${record.id}`]
                        // }
                        defaultValue={record.questionLevel}
                        // value={record.level}
                        // placeholder={trans(
                        //   "global.pleaseChoose",
                        //   "请选择难度"
                        // )}
                        disabled={true}
                        style={{
                          width: 78,
                          height: 30,
                          lineHeight: "30px",
                        }}
                        // open="true"
                      >
                        {difficulty.map((item) => (
                          <Option value={item.key} key={item.key}>
                            <span>{item.name}</span>
                          </Option>
                        ))}
                      </Select> */}
                        {record.questionLevel == 1
                          ? trans("global.easy", "简单")
                          : record.questionLevel == 2
                            ? trans("global.general", "普通")
                            : trans("global.difficult", "困难")}
                      </span>
                    </div>
                    <div className={styles.operateRow}>
                      <span
                        className={styles.addRow}
                        onClick={(e) => this.clickMoveUp(e, record.questionId)}
                      >
                        {trans("global.moveUp", "上移")}
                      </span>
                      <span
                        className={styles.addRow}
                        onClick={(e) =>
                          this.clickMoveDown(e, record.questionId)
                        }
                      >
                        {trans("global.moveDown", "下移")}
                      </span>
                      {/* <Dropdown
                      // visible={true}
                      overlayStyle={{ height: "200px", overflow: "scroll" }}
                      placement="topCenter"
                      overlay={() => (
                        <Menu>
                          {focusQuestionList.length > 0 &&
                            focusQuestionList.map((item) => (
                              <Menu.Item
                                key={item.content}
                                disabled={item.correct}
                              >
                                <div
                                  onClick={(e) =>
                                    this.addTest1(e, index, item.content)
                                  }
                                >
                                  {item.questionName}
                                </div>
                              </Menu.Item>
                            ))}
                        </Menu>
                      )}
                    >
                      <span
                        className={styles.addRow}
                        // onClick={this.showModal.bind(
                        //   this,
                        //   index,
                        //   record.questionId
                        // )}
                      >
                        {trans("global.insertTestQuestions", "插入试题")}
                      </span>
                    </Dropdown> */}
                      <span className={styles.addRow}>
                        {trans("global.addResponseArea", "增加作答区")}
                        <span style={{ padding: "0 5px" }}>
                          <InputNumber
                            defaultValue={record.answerFormat}
                            onChange={this.scoreChange.bind(
                              this,
                              record.questionId,
                            )}
                            precision={0}
                            min={0}
                            autoFocus={true}
                            onPressEnter={this.scoreChange.bind(
                              this,
                              record.questionId,
                            )}
                            // size="small"
                          />
                        </span>
                        {trans("global.go", "行")}
                      </span>
                      <span
                        className={styles.addRow}
                        onClick={(e) =>
                          this.deleteQuestion(e, record.questionId)
                        }
                      >
                        {trans("global.deleteTestQuestions", "删除试题")}
                      </span>
                    </div>
                  </>
                ) : null}
                <div style={{ marginBottom: 20, display: "none" }}>
                  <span>
                    <i className={icon.iconfont}>&#xe798;</i>
                    {record.examName}
                  </span>
                  {record.type === 1 ? (
                    <span
                      className={[
                        styles.questionType1,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe761;</i>
                      {trans("global.radio", "单选题")}
                    </span>
                  ) : record.type === 2 ? (
                    <span
                      className={[
                        styles.questionType2,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe755;</i>
                      {trans("global.check", "多选题")}
                    </span>
                  ) : record.type === 3 ? (
                    <span
                      className={[
                        styles.questionType3,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe802;</i>
                      {trans("global.pack", "填空题")}
                    </span>
                  ) : record.type === 4 ? (
                    <span
                      className={[
                        styles.questionType4,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe800;</i>
                      {trans("global.judge", "判断题")}
                    </span>
                  ) : (
                    <span
                      className={[
                        styles.questionType5,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont} style={{ fontSize: 12 }}>
                        &#xe807;
                      </i>
                      {trans("global.ask", "问答题")}
                    </span>
                  )}
                  <span className={styles.inlineDifficulty}>
                    <Select
                      dropdownClassName="selectStyles"
                      onChange={(value) =>
                        this.changeDifficultyChoice(
                          value,
                          record.id,
                          record.knowledgeIds,
                        )
                      }
                      // value={
                      //   this.state[`choiceDifficultyValue${record.id}`]
                      // }
                      defaultValue={record.questionLevel}
                      // value={record.level}
                      // placeholder={trans(
                      //   "global.pleaseChoose",
                      //   "请选择难度"
                      // )}
                      disabled={true}
                      style={{
                        width: 78,
                        height: 30,
                        lineHeight: "30px",
                      }}
                      // open="true"
                    >
                      {difficulty.map((item) => (
                        <Option value={item.key} key={item.key}>
                          <span>{item.name}</span>
                        </Option>
                      ))}
                    </Select>
                  </span>
                </div>
              </div>
            ),
            // props: {
            //   colSpan: hoverIndexID == record.questionId ? 2 : 1,
            // },
          };
        },
      },
      // {
      //   title: errorAnalysisTitle,
      //   dataIndex: "age",
      //   key: "age",
      // },
    ];
    const difficulty = [
      { key: 1, name: trans("global.easy", "简单") },
      { key: 2, name: trans("global.general", "普通") },
      { key: 3, name: trans("global.difficult", "困难") },
    ];
    const intervalList = [
      { label: "100%", value: 1 },
      { label: "[50%~100%)", value: 2 },
      { label: "[0%~50%)", value: 3 },
    ];
    const filterConfirm = (
      <div className={styles.intervalListBox}>
        <div className={styles.intervalList}>
          <Checkbox.Group
            options={intervalList}
            value={knowLedgeIntervalList}
            onChange={(e) => this.changeKnowLedgeIntervalList(e)}
          />
        </div>
        <div className={styles.okBtn}>
          <span className={styles.resetting} onClick={this.intervalResetting}>
            {trans("global.resetting", "重置")}
          </span>
          <span className={styles.ok} onClick={this.intervalOk}>
            {trans("global.ok", "确认")}
          </span>
        </div>
      </div>
    );
    const newcolumns1 = [
      {
        title: trans("global.personalizedSet", "个性化集合"),
        dataIndex: "name",
        key: "name",
        width: "70%",
        render: (text, record, index) => {
          // console.log(hoverIndexID, record.questionId, "222zwl");
          let numberRow = (record.answerFormat - 0) * 20;
          return {
            children: (
              <div
                // style={
                //   this.state[`hoverIndex${record.questionId}`]
                //     ? { border: "1px solid rgba(151,151,151,0.70)" }
                //     : null
                // }
                className={[
                  styles.rowBox,
                  this.state[`hoverIndexc${record.questionId}`]
                    ? styles.blurBorder
                    : "",
                ].join(" ")}
                // id={`question${record.questionId}`}
              >
                <div className={styles.questName} style={{ display: "flex" }}>
                  {/* <span>{record.questionSerialNumber}.</span> */}
                  <div
                    dangerouslySetInnerHTML={{ __html: record.content }}
                    style={{
                      marginBottom: "10px",
                      flex: "1",
                    }}
                  ></div>
                </div>
                {record.type == 6 &&
                record.sonQuestionList &&
                record.sonQuestionList.length > 0
                  ? record.sonQuestionList.map((ii, inde) => (
                      <div
                        className={styles.questName}
                        style={{ display: "flex" }}
                      >
                        <span>({inde + 1})</span>
                        <div
                          dangerouslySetInnerHTML={{ __html: ii.content }}
                          style={{
                            marginBottom: "10px",
                            flex: "1",
                          }}
                        ></div>
                      </div>
                    ))
                  : null}
                {record.type == 1 || record.type == 2 ? (
                  <>
                    <div
                      className={styles.questName}
                      style={{ paddingLeft: "25px" }}
                    >
                      {record.optionList &&
                        record.optionList.length &&
                        record.optionList.map((it) => (
                          <div
                            key={it}
                            dangerouslySetInnerHTML={{
                              __html: `${it.answers}`,
                            }}
                            style={{
                              marginRight: "10px",
                            }}
                          ></div>
                        ))}
                    </div>
                  </>
                ) : record.type == 6 &&
                  record.sonQuestionList &&
                  record.sonQuestionList.length > 0 ? (
                  record.sonQuestionList.map((ii, inde) =>
                    ii.type == 1 || ii.type == 2 ? (
                      <>
                        <div
                          className={styles.questName}
                          style={{ paddingLeft: "25px" }}
                        >
                          <span>({inde + 1})</span>
                          {ii.optionList &&
                            ii.optionList.length &&
                            ii.optionList.map((it) => (
                              <div
                                key={it}
                                dangerouslySetInnerHTML={{
                                  __html: `${it.answers}`,
                                }}
                                style={{
                                  marginRight: "10px",
                                }}
                              ></div>
                            ))}
                        </div>
                      </>
                    ) : null,
                  )
                ) : null}
                <div style={{ height: numberRow }}></div>

                {this.state[`hoverIndexc${record.questionId}`] ? (
                  <>
                    <div className={styles.noOperate}>
                      <span>
                        <i className={icon.iconfont}>&#xe798;</i>
                        {record.examName}
                      </span>
                      {record.type === 1 ? (
                        <span
                          className={[
                            styles.questionType1,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe761;</i>
                          {trans("global.radio", "单选题")}
                        </span>
                      ) : record.type === 2 ? (
                        <span
                          className={[
                            styles.questionType2,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe755;</i>
                          {trans("global.check", "多选题")}
                        </span>
                      ) : record.type === 3 ? (
                        <span
                          className={[
                            styles.questionType3,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe802;</i>
                          {trans("global.pack", "填空题")}
                        </span>
                      ) : record.type === 4 ? (
                        <span
                          className={[
                            styles.questionType4,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont}>&#xe800;</i>
                          {trans("global.judge", "判断题")}
                        </span>
                      ) : (
                        <span
                          className={[
                            styles.questionType5,
                            styles.questionType,
                          ].join(" ")}
                        >
                          <i className={icon.iconfont} style={{ fontSize: 12 }}>
                            &#xe807;
                          </i>
                          {trans("global.ask", "问答题")}
                        </span>
                      )}
                      <span className={styles.inlineDifficulty}>
                        {record.questionLevel == 1
                          ? trans("global.easy", "简单")
                          : record.questionLevel == 2
                            ? trans("global.general", "普通")
                            : trans("global.difficult", "困难")}
                      </span>
                    </div>
                    <div className={styles.operateRow}>
                      <span
                        className={styles.addRow}
                        onClick={(e) => this.clickMoveUp1(e, record.questionId)}
                      >
                        {trans("global.moveUp", "上移")}
                      </span>
                      <span
                        className={styles.addRow}
                        onClick={(e) =>
                          this.clickMoveDown1(e, record.questionId)
                        }
                      >
                        {trans("global.moveDown", "下移")}
                      </span>
                      <span className={styles.addRow}>
                        {trans("global.addResponseArea", "增加作答区")}
                        <span style={{ padding: "0 5px" }}>
                          <InputNumber
                            defaultValue={record.answerFormat}
                            onChange={this.scoreChange1.bind(
                              this,
                              record.questionId,
                            )}
                            precision={0}
                            min={0}
                            autoFocus={true}
                            onPressEnter={this.scoreChange1.bind(
                              this,
                              record.questionId,
                            )}
                            // size="small"
                          />
                        </span>
                        {trans("global.go", "行")}
                      </span>
                      <span
                        className={styles.addRow}
                        onClick={(e) =>
                          this.deleteQuestion1(e, record.questionId)
                        }
                      >
                        {trans("global.deleteTestQuestions", "删除试题")}
                      </span>
                    </div>
                  </>
                ) : null}
                <div style={{ marginBottom: 20, display: "none" }}>
                  <span>
                    <i className={icon.iconfont}>&#xe798;</i>
                    {record.examName}
                  </span>
                  {record.type === 1 ? (
                    <span
                      className={[
                        styles.questionType1,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe761;</i>
                      {trans("global.radio", "单选题")}
                    </span>
                  ) : record.type === 2 ? (
                    <span
                      className={[
                        styles.questionType2,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe755;</i>
                      {trans("global.check", "多选题")}
                    </span>
                  ) : record.type === 3 ? (
                    <span
                      className={[
                        styles.questionType3,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe802;</i>
                      {trans("global.pack", "填空题")}
                    </span>
                  ) : record.type === 4 ? (
                    <span
                      className={[
                        styles.questionType4,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont}>&#xe800;</i>
                      {trans("global.judge", "判断题")}
                    </span>
                  ) : (
                    <span
                      className={[
                        styles.questionType5,
                        styles.questionType,
                      ].join(" ")}
                    >
                      <i className={icon.iconfont} style={{ fontSize: 12 }}>
                        &#xe807;
                      </i>
                      {trans("global.ask", "问答题")}
                    </span>
                  )}
                  <span className={styles.inlineDifficulty}>
                    <Select
                      dropdownClassName="selectStyles"
                      onChange={(value) =>
                        this.changeDifficultyChoice(
                          value,
                          record.id,
                          record.knowledgeIds,
                        )
                      }
                      // value={
                      //   this.state[`choiceDifficultyValue${record.id}`]
                      // }
                      defaultValue={record.questionLevel}
                      // value={record.level}
                      // placeholder={trans(
                      //   "global.pleaseChoose",
                      //   "请选择难度"
                      // )}
                      disabled={true}
                      style={{
                        width: 78,
                        height: 30,
                        lineHeight: "30px",
                      }}
                      // open="true"
                    >
                      {difficulty.map((item) => (
                        <Option value={item.key} key={item.key}>
                          <span>{item.name}</span>
                        </Option>
                      ))}
                    </Select>
                  </span>
                </div>
              </div>
            ),
            // props: {
            //   colSpan: hoverIndexID == record.questionId ? 2 : 1,
            // },
          };
        },
      },
    ];
    console.log(tableData, allSubjectList, "ttat");

    const firstSemesterType = 1;
    const secondSemesterType = 2;
    const midTermExamType = 6;
    const endTermExamType = 7;
    const getOverallGradeKey = (item = {}) =>
      item.gradeName || item.gradeId || "";
    const getOverallSemesterType = (item = {}) => {
      if (item.semesterType) {
        return item.semesterType;
      }
      const semesterName = `${item.semesterName || ""}${
        item.titleName || ""
      }${item.gradeSemesterName || ""}`;
      return semesterName.includes("下")
        ? secondSemesterType
        : firstSemesterType;
    };
    const getOverallScoreKey = (grade, semesterType, examTypeCode) =>
      `${getOverallGradeKey(grade)}${semesterType}${examTypeCode}Score`;
    let columns0 = [
      {
        title: trans("global.grade", "年级"),
        dataIndex: "subjectName",
        fixed: "left",
        align: "right",
        className: "topConor",
        render: (text) => <div>{text}</div>,
        width: 110,
        children: [
          {
            title: trans("global.subject", "学科"),
            className: "bottomConor",
            width: 110,
            align: "left",
            dataIndex: "subjectName",
            fixed: "left",
          },
        ],
      },
    ];
    if (tableData.gradeList && tableData.gradeList.length > 0) {
      tableData.gradeList.map((item, ind) => {
        if (endterim && interim) {
          columns0.push({
            title: item.gradeName,
            dataIndex: getOverallGradeKey(item),
            key: getOverallGradeKey(item),
            // fixed: item.index == 0 ? "left" : null,
            width: 230,
            className: "firstTh",
            align: "center",
            children: [
              {
                title: trans(
                  "allStudentTrend.firstSemesterMidterm",
                  "上(期中)",
                ),
                dataIndex: getOverallScoreKey(
                  item,
                  firstSemesterType,
                  midTermExamType,
                ),
                key: getOverallScoreKey(
                  item,
                  firstSemesterType,
                  midTermExamType,
                ),
                width: 56,
                align: "center",
                className: "noRightTd",
                render: (text, record, index) => {
                  // console.log(text, record, index, "222");
                  // let txt = text.substring(0, text.length - 1);
                  return (
                    <div style={{}}>
                      {text ? (
                        <div>{text}</div>
                      ) : (
                        <span className={styles.noSummaryScore}>
                          {trans("allStudentTrend.notSummarized", "未汇总")}
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                title: trans("allStudentTrend.firstSemesterFinal", "上(期末)"),
                dataIndex: getOverallScoreKey(
                  item,
                  firstSemesterType,
                  endTermExamType,
                ),
                key: getOverallScoreKey(
                  item,
                  firstSemesterType,
                  endTermExamType,
                ),
                width: 56,
                align: "center",
                className: "noRightTd",
                // sorter: (a, b) => {
                //   let a1 = a[`${item.index}scoreRate`];
                //   let b1 = b[`${item.index}scoreRate`];
                //   a1 = a1.substring(0, a1.length - 1);
                //   b1 = b1.substring(0, b1.length - 1);
                //   // console.log(a1, b1, "ccc");
                //   return a1 - b1;
                // },
                render: (text, record, index) => {
                  // console.log(text, record, index, "222");
                  // let txt = text.substring(0, text.length - 1);
                  return (
                    <div style={{}}>
                      {text ? (
                        <div>{text}</div>
                      ) : (
                        <span className={styles.noSummaryScore}>
                          {trans("allStudentTrend.notSummarized", "未汇总")}
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                title: trans(
                  "allStudentTrend.secondSemesterMidterm",
                  "下(期中)",
                ),
                dataIndex: getOverallScoreKey(
                  item,
                  secondSemesterType,
                  midTermExamType,
                ),
                key: getOverallScoreKey(
                  item,
                  secondSemesterType,
                  midTermExamType,
                ),
                width: 56,
                align: "center",
                className: "noRightTd",
                render: (text, record, index) => {
                  // console.log(text, record, index, "222");
                  // let txt = text.substring(0, text.length - 1);
                  return (
                    <div style={{}}>
                      {text ? (
                        <div>{text}</div>
                      ) : (
                        <span className={styles.noSummaryScore}>
                          {trans("allStudentTrend.notSummarized", "未汇总")}
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                title: trans("allStudentTrend.secondSemesterFinal", "下(期末)"),
                dataIndex: getOverallScoreKey(
                  item,
                  secondSemesterType,
                  endTermExamType,
                ),
                key: getOverallScoreKey(
                  item,
                  secondSemesterType,
                  endTermExamType,
                ),
                width: 56,
                align: "center",
                render: (text, record, index) => {
                  // console.log(text, record, index, "222");
                  // let txt = text.substring(0, text.length - 1);
                  return (
                    <div style={{}}>
                      {text ? (
                        <div>{text}</div>
                      ) : (
                        <span className={styles.noSummaryScore}>
                          {trans("allStudentTrend.notSummarized", "未汇总")}
                        </span>
                      )}
                    </div>
                  );
                },
              },
            ],
          });
        } else if (endterim) {
          columns0.push({
            title: item.gradeName,
            dataIndex: getOverallGradeKey(item),
            key: getOverallGradeKey(item),
            // fixed: item.index == 0 ? "left" : null,
            width: 112,
            className: "firstTh",
            align: "center",
            children: [
              {
                title: trans("global.firstSemes", "上学期"),
                dataIndex: getOverallScoreKey(
                  item,
                  firstSemesterType,
                  endTermExamType,
                ),
                key: getOverallScoreKey(
                  item,
                  firstSemesterType,
                  endTermExamType,
                ),
                width: 56,
                align: "center",
                className: "noRightTd",
                render: (text, record, index) => {
                  // console.log(text, record, index, "222");
                  // let txt = text.substring(0, text.length - 1);
                  return (
                    <div style={{}}>
                      {text ? (
                        <div>{text}</div>
                      ) : (
                        <span className={styles.noSummaryScore}>
                          {trans("allStudentTrend.notSummarized", "未汇总")}
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                title: trans("analysis.secondSemes", "下学期"),
                dataIndex: getOverallScoreKey(
                  item,
                  secondSemesterType,
                  endTermExamType,
                ),
                key: getOverallScoreKey(
                  item,
                  secondSemesterType,
                  endTermExamType,
                ),
                width: 56,
                align: "center",
                render: (text, record, index) => {
                  // console.log(text, record, index, "222");
                  // let txt = text.substring(0, text.length - 1);
                  return (
                    <div style={{}}>
                      {text ? (
                        <div>{text}</div>
                      ) : (
                        <span className={styles.noSummaryScore}>
                          {trans("allStudentTrend.notSummarized", "未汇总")}
                        </span>
                      )}
                    </div>
                  );
                },
                // sorter: (a, b) => {
                //   let a1 = a[`${item.index}scoreRate`];
                //   let b1 = b[`${item.index}scoreRate`];
                //   a1 = a1.substring(0, a1.length - 1);
                //   b1 = b1.substring(0, b1.length - 1);
                //   // console.log(a1, b1, "ccc");
                //   return a1 - b1;
                // },
              },
            ],
          });
        } else {
          columns0.push({
            title: item.gradeName,
            dataIndex: getOverallGradeKey(item),
            key: getOverallGradeKey(item),
            // fixed: item.index == 0 ? "left" : null,
            width: 112,
            className: "firstTh",
            align: "center",
            children: [
              {
                title: trans("global.firstSemes", "上学期"),
                dataIndex: getOverallScoreKey(
                  item,
                  firstSemesterType,
                  midTermExamType,
                ),
                key: getOverallScoreKey(
                  item,
                  firstSemesterType,
                  midTermExamType,
                ),
                width: 56,
                align: "center",
                className: "noRightTd",
                render: (text, record, index) => {
                  // console.log(text, record, index, "222");
                  // let txt = text.substring(0, text.length - 1);
                  return (
                    <div style={{}}>
                      {text ? (
                        <div>{text}</div>
                      ) : (
                        <span className={styles.noSummaryScore}>
                          {trans("allStudentTrend.notSummarized", "未汇总")}
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                title: trans("analysis.secondSemes", "下学期"),
                dataIndex: getOverallScoreKey(
                  item,
                  secondSemesterType,
                  midTermExamType,
                ),
                key: getOverallScoreKey(
                  item,
                  secondSemesterType,
                  midTermExamType,
                ),
                width: 56,
                align: "center",
                render: (text, record, index) => {
                  // console.log(text, record, index, "222");
                  // let txt = text.substring(0, text.length - 1);
                  return (
                    <div style={{}}>
                      {text ? (
                        <div>{text}</div>
                      ) : (
                        <span className={styles.noSummaryScore}>
                          {trans("allStudentTrend.notSummarized", "未汇总")}
                        </span>
                      )}
                    </div>
                  );
                },
                // sorter: (a, b) => {
                //   let a1 = a[`${item.index}scoreRate`];
                //   let b1 = b[`${item.index}scoreRate`];
                //   a1 = a1.substring(0, a1.length - 1);
                //   b1 = b1.substring(0, b1.length - 1);
                //   // console.log(a1, b1, "ccc");
                //   return a1 - b1;
                // },
                // render: (text, record, index) => {
                //   // console.log(text, record, index, "222");
                //   // let txt = text.substring(0, text.length - 1);
                //   return (
                //     <div
                //       // className={txt < 60 ? styles.noPass : ""}
                //       style={{ lineHeight: "40px" }}
                //     >
                //       {text}
                //     </div>
                //   );
                // },
              },
            ],
          });
        }
      });
    }
    console.log(columns0, "ccoc");
    columns0.push({
      title: "",
    });
    let data = [];
    if (
      tableData.overallStudentScoreModelList &&
      tableData.overallStudentScoreModelList.length > 0 &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList
        .length > 0 &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0]
        .examTypeModelList &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0]
        .examTypeModelList.length > 0 &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0]
        .examTypeModelList[0].subjectList &&
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0]
        .examTypeModelList[0].subjectList.length > 0
    ) {
      tableData.overallStudentScoreModelList[0].semesterSubjectModelList[0].examTypeModelList[0].subjectList.map(
        (item) => {
          data.push({
            subjectName: item.subjectName,
          });
        },
      );
    }
    let newLi = [];
    if (
      tableData.overallStudentScoreModelList &&
      tableData.overallStudentScoreModelList.length > 0
    ) {
      newLi = JSON.parse(
        JSON.stringify(tableData.overallStudentScoreModelList),
      );
    }
    if (data.length > 0) {
      data.map((item) => {
        if (
          tableData.overallStudentScoreModelList &&
          tableData.overallStudentScoreModelList.length > 0
        ) {
          tableData.overallStudentScoreModelList.map((ite, inde) => {
            if (
              ite.semesterSubjectModelList &&
              ite.semesterSubjectModelList.length > 0
            ) {
              ite.semesterSubjectModelList.map((it) => {
                if (it.examTypeModelList && it.examTypeModelList.length > 0) {
                  it.examTypeModelList.map((tt) => {
                    if (tt.subjectList && tt.subjectList.length > 0) {
                      tt.subjectList.map((t) => {
                        if (t.subjectName === item.subjectName) {
                          item[
                            getOverallScoreKey(
                              ite,
                              getOverallSemesterType(it),
                              tt.examTypeCode,
                            )
                          ] = t.score;
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
    console.log(data, columns0, "dada");
    return (
      <div className={styles.questionTable} id="table1">
        <div className={styles.tableBox}>
          <div id="table1" className={[styles.homePage].join(" ")}>
            {this.studentId ? null : (
              <div className={styles.stuList} style={{ width: "200px" }}>
                <div className={styles.searchCondition}>
                  <Select
                    className={styles.selectStuStyle}
                    placeholder={trans("global.searchStu", "搜索学生")}
                    showSearch
                    filterOption={false}
                    value={searchStuId}
                    onSearch={this.handleSearch}
                    onSelect={this.changeStu}
                  >
                    {searchList &&
                      searchList.length > 0 &&
                      searchList.map((item, index) => (
                        <Option
                          key={item.userId}
                          value={item.userId}
                          title={item.userName}
                        >
                          {item.userName}
                        </Option>
                      ))}
                  </Select>
                  <div style={{ display: "flex" }}>
                    <Select
                      placeholder={trans(
                        "wrongTable.selectGrade",
                        "请选择年级",
                      )}
                      onChange={(value) => this.changeCondition(value, "grade")}
                      value={gradeId}
                      className={styles.selectGrade}
                      dropdownMatchSelectWidth={false}
                      dropdownStyle={{ width: "200px" }}
                    >
                      <Option value="">
                        {trans("global.allGrade", "全部年级")}
                      </Option>

                      {studentGroupList && studentGroupList.length > 0
                        ? studentGroupList.map((item, index) => {
                            if (
                              item.name == "小班" ||
                              item.name == "中班" ||
                              item.name == "大班"
                            )
                              return;
                            return (
                              <Option
                                value={item.gradeId}
                                key={item.gradeId}
                                title={
                                  locale() === "en"
                                    ? item.englishName
                                    : item.name
                                }
                              >
                                {locale() === "en"
                                  ? item.englishName
                                  : item.name}
                              </Option>
                            );
                          })
                        : null}
                    </Select>
                    <Select
                      placeholder={trans(
                        "wrongTable.selectClass",
                        "请选择班级",
                      )}
                      onChange={(value) => this.changeCondition(value, "group")}
                      value={groupId}
                      className={styles.selectStyle}
                      dropdownMatchSelectWidth={false}
                      dropdownStyle={{ width: "200px" }}
                    >
                      <Option value="" key="">
                        {trans("global.allClass", "全部班级")}
                      </Option>
                      {gradeId != "" && groupList && groupList.length > 0
                        ? groupList.map((item, index) => (
                            <Option
                              value={item.studentGroupId}
                              key={index}
                              title={
                                locale() === "en" ? item.englishName : item.name
                              }
                            >
                              {locale() === "en" ? item.englishName : item.name}
                            </Option>
                          ))
                        : null}
                    </Select>
                  </div>
                </div>
                <div className={styles.menuList}>
                  <Spin spinning={loading} tip="loading...">
                    {/* <div
                      className={
                        studentId == ""
                          ? `${styles.menu} ${styles.activeMenu}`
                          : styles.menu
                      }
                      onClick={() => this.changeStudentId()}
                    >
                      <span className={`${styles.cover} ${styles.all}`}>
                        <i className={icon.iconfont}>&#xe678;</i>
                      </span>
                      <span className={styles.name}>
                        {trans("global.allStudents", "全部学生")}
                      </span>
                    </div> */}
                    {studentList && studentList.length > 0
                      ? studentList.map((item, index) => {
                          let defaultImg =
                            item.sex && item.sex == 1
                              ? "https://assets.yungu.org/statics/0.0.1/task/boy.png"
                              : "https://assets.yungu.org/statics/0.0.1/task/girl.png";
                          let name = locale() === "en" ? item.ename : item.name;
                          return (
                            <div
                              className={
                                studentId == item.userId
                                  ? `${styles.menu} ${styles.activeMenu}`
                                  : styles.menu
                              }
                              key={index}
                              onClick={() =>
                                this.changeStudentId(
                                  item.userId,
                                  item.gradeId,
                                  item.stage,
                                )
                              }
                            >
                              <span className={styles.cover}>
                                <img
                                  src={
                                    item.userAvatar
                                      ? item.userAvatar
                                      : defaultImg
                                  }
                                  onError={(e) =>
                                    this.checkError(e, defaultImg)
                                  }
                                  alt="头像"
                                />
                              </span>
                              <Tooltip title={item.userName}>
                                <span className={styles.name}>
                                  {name ? name : item.userName}
                                </span>
                              </Tooltip>
                            </div>
                          );
                        })
                      : null}
                  </Spin>
                </div>
              </div>
            )}
            <div
              style={{
                flex: 1,
                marginLeft: 10,
                width: "calc(~'100% - 210px')",
              }}
              className={styles.rightBox}
            >
              <div className={styles.tableBoxHeader}>
                <div className={styles.tabSub}>
                  {this.state.summary ? (
                    <span
                      className={styles.subBox}
                      style={
                        subjectId == 0
                          ? {
                              color: "#0445FC",
                              background: "rgb(212, 223, 253)",
                            }
                          : null
                      }
                      onClick={() => this.clickSub(0)}
                    >
                      {trans("global.overallSituation", "整体情况")}
                    </span>
                  ) : null}

                  {allSubjectList &&
                    allSubjectList.length > 0 &&
                    allSubjectList.map((item) => (
                      <span
                        className={styles.subBox}
                        style={
                          subjectId == item.id
                            ? {
                                color: "#0445FC",
                                background: "rgb(212, 223, 253)",
                              }
                            : null
                        }
                        onClick={() => this.clickSub(item.id)}
                      >
                        {locale() == "en" ? item.enName : item.name}
                      </span>
                    ))}
                </div>

                {this.state.summary && subjectId !== 0 ? (
                  <div className={styles.checkDiv}>
                    <Checkbox onChange={this.changeInTerim} checked={interim}>
                      {trans("global.interim", "期中")}
                    </Checkbox>
                    <Checkbox onChange={this.changeEndTerim} checked={endterim}>
                      {trans("global.endterim", "期末")}
                    </Checkbox>
                  </div>
                ) : null}
              </div>
              {subjectId === 0 ? (
                <Spin
                  spinning={summaryLoading}
                  tip={trans("paper.list.loading", "加载中...")}
                >
                  <div className={styles.wholeTable}>
                    {this.renderTotalScoreTrend()}
                    {this.renderSummaryCoverageDashboard()}
                    <div className={styles.wholeRadar}>
                      <div className={[styles.radarLegend].join(" ")}>
                        <span
                          className={[styles.legendItem, styles.personal].join(
                            " ",
                          )}
                        ></span>
                        <span className={styles.legendTitle}>
                          {trans("global.stuPersonal", "学生个人")}
                        </span>
                        <span
                          className={[styles.legendItem, styles.gradeAvr].join(
                            " ",
                          )}
                        ></span>
                        <span className={styles.legendTitle}>
                          {trans("global.gradeAvr", "年级平均")}
                        </span>
                      </div>
                      <div
                        className={styles.radarList}
                        ref={(node) => (this.summaryRadarListNode = node)}
                      >
                        {this.getSummaryExamGroups().length > 0
                          ? this.getSummaryExamGroups().map((item, index) => (
                              <div
                                className={styles.radarSec}
                                key={`${item.gradeName}-${index}`}
                              >
                                <div className={styles.allTitle}>
                                  {item.gradeName}
                                </div>
                                <div className={styles.summaryRadarGrid}>
                                  {item.exams.map((exam, examIndex) => (
                                    <div
                                      className={styles.summaryRadarDom}
                                      id={`summaryRadar${index}${examIndex}`}
                                      key={`${item.gradeName}-${exam.examName}`}
                                    ></div>
                                  ))}
                                </div>
                              </div>
                            ))
                          : null}
                      </div>
                    </div>
                  </div>
                </Spin>
              ) : (
                <div>
                  <div
                    className={styles.selectData}
                    style={isSelect ? null : { padding: "5px 10px" }}
                  >
                    {isSelect ? (
                      <div>
                        <div
                          className={styles.rowSelect}
                          style={{ display: "flex" }}
                        >
                          <span className={styles.leftName}>
                            {trans("global.grade", "年级")}
                          </span>
                          <div style={{ width: "calc(100% - 48px)" }}>
                            <Checkbox
                              style={{ float: "left" }}
                              indeterminate={this.state.indeterminate}
                              onChange={(e) =>
                                this.allGardeChange(e, newGradeList)
                              }
                              checked={checkAllGardes}
                            >
                              {trans("global.allGrade", "全部年级")}
                            </Checkbox>
                            <Checkbox.Group
                              style={{ display: "block" }}
                              options={newGradeList}
                              value={gradeIdList}
                              onChange={(e) =>
                                this.changeGrade(e, newGradeList)
                              }
                            />
                          </div>
                        </div>
                        <div
                          className={styles.rowSelect}
                          style={{ display: "flex" }}
                        >
                          <span className={styles.leftName}>
                            {trans("global.examType", "类型")}
                          </span>
                          <div style={{ width: "calc(100% - 48px)" }}>
                            <Checkbox
                              style={{ float: "left" }}
                              indeterminate={this.state.indeterminate1}
                              onChange={(e) =>
                                this.allTypeChange(e, newTypeList)
                              }
                              checked={checkAllType}
                            >
                              {trans("global.allType", "全部类型")}
                            </Checkbox>
                            <Checkbox.Group
                              style={{ display: "block" }}
                              options={newTypeList}
                              value={typeList}
                              onChange={(e) => this.changeType(e, newTypeList)}
                            />
                          </div>
                        </div>
                        <div className={styles.rowSelect1}>
                          <span className={styles.leftName}>
                            {trans("global.test", "试卷")}
                          </span>
                          <Select
                            mode="multiple"
                            style={{ maxWidth: "90%", width: "50%" }}
                            placeholder={trans(
                              "global.pleaseSelectTest",
                              "请选择试卷",
                            )}
                            onChange={(e) => this.changeTest(e, stuNameList)}
                            value={testId}
                          >
                            <Option key={0}>
                              {trans("global.allTestPaper", "全部试卷")}
                            </Option>
                            {stuNameList &&
                              stuNameList.length > 0 &&
                              stuNameList.map((item) => (
                                <Option key={item.examId}>
                                  {item.examName}
                                </Option>
                              ))}
                          </Select>
                        </div>
                        <div className={styles.saveBtn}>
                          <span
                            className={styles.queryCriteria}
                            onClick={this.clickSavedCriteria}
                          >
                            {trans(
                              "global.savedQueryCriteria",
                              "保存过的查询条件",
                            )}
                          </span>
                          {isPushStatus ? (
                            <span className={styles.hasBeenSent}>
                              {trans("global.hasBeenSent", "已发送")}
                            </span>
                          ) : (
                            <span
                              className={styles.criteriaBtn}
                              onClick={this.clickCriteriaBtn}
                            >
                              {trans("global.savedCriteria", "保存查询条件")}
                            </span>
                          )}
                        </div>
                        <div
                          className={styles.retractBox}
                          onClick={this.clickRetract}
                        >
                          <i
                            className={[icon.iconfont, styles.retract].join(
                              " ",
                            )}
                          >
                            &#xe614;
                          </i>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={styles.retractBox}
                        onClick={this.clickRetract}
                      >
                        <i
                          className={[icon.iconfont, styles.retract].join(" ")}
                        >
                          &#xe613;
                        </i>
                      </div>
                    )}
                  </div>
                  <div
                    className={styles.dataBox}
                    style={
                      isSelect
                        ? { height: "calc(100vh - 170px)" }
                        : { height: "calc(100vh - 75px)" }
                    }
                  >
                    <div className={styles.navbarHeader}>
                      <span
                        className={styles.onebar}
                        style={
                          active == 1 ? { borderBottom: "2px solid blue" } : {}
                        }
                        onClick={() => this.clickBar(1)}
                      >
                        {trans("global.performanceTrends", "成绩趋势")}
                      </span>
                      <span
                        className={styles.onebar}
                        style={
                          active == 2 ? { borderBottom: "2px solid blue" } : {}
                        }
                        onClick={() => this.clickBar(2)}
                      >
                        {trans("analysis.knowledgeAnalysis", "知识点分析")}
                      </span>
                      <span
                        className={styles.onebar}
                        style={
                          active == 3 ? { borderBottom: "2px solid blue" } : {}
                        }
                        onClick={() => this.clickBar(3)}
                      >
                        {trans("global.mistakesCollection", "错题集")}
                      </span>
                      <span
                        className={styles.onebar}
                        style={
                          active == 4 ? { borderBottom: "2px solid blue" } : {}
                        }
                        onClick={() => this.clickBar(4)}
                      >
                        {trans("global.diyWork", "个性化作业")}
                      </span>
                      {active == 2 ? (
                        <a
                          href={`${
                            window.location.origin
                          }/api/trendComparativeAnalysis/export/knowledgeQuestionList?queryType=${isKnowledgeGrouping}&studentId=${studentId}&subjectId=${subjectId}&gradeIdList=${
                            this.state.gradeIdList.length ==
                            this.props.stuGradeList.length
                              ? ""
                              : this.state.gradeIdList
                          }&examTypeList=${
                            this.state.typeList.length ==
                            this.props.stuTypeList.length
                              ? ""
                              : this.state.typeList
                          }&examIdList=${
                            this.state.testId[0] == 0 ? "" : this.state.testId
                          }&graspDegreeType=${
                            knowLedgeIntervalList.length == 3
                              ? ""
                              : knowLedgeIntervalList.join(",")
                          }&descStatus=${this.state.positiveIcon ? false : true}`}
                          target="_blank"
                          className={styles.exportKnowledge}
                          rel="noreferrer"
                        >
                          <span>
                            {trans("global.exportKnowledge", "导出知识点分析")}
                          </span>
                        </a>
                      ) : active == 3 ? (
                        <div className={styles.exportWrongQuestion}>
                          <span
                            className={styles.showAnswer}
                            style={{ right: "238px" }}
                          >
                            {trans("global.showStuAnswer", "显示学生作答")}
                            <Switch
                              // defaultChecked
                              checked={this.state.isShowAnswer}
                              onChange={this.changeShowAnswer}
                              // style={{ marginLeft: "4px" }}
                            />
                          </span>
                          <span
                            className={styles.exportKnowledge}
                            style={{ right: 140, cursor: "pointer" }}
                            onClick={this.downloadWrongQuestion}
                          >
                            <span>
                              {trans("global.batchDownload", "批量下载")}
                            </span>
                          </span>
                          <a
                            href={`${
                              window.location.origin
                            }/api/trendComparativeAnalysis/export/errorQuestionList?queryType=${isKnowledgeGrouping}&studentId=${studentId}&subjectId=${subjectId}&gradeIdList=${
                              this.state.gradeIdList.length ==
                              this.props.stuGradeList.length
                                ? ""
                                : this.state.gradeIdList
                            }&examTypeList=${
                              this.state.typeList.length ==
                              this.props.stuTypeList.length
                                ? ""
                                : this.state.typeList
                            }&examIdList=${
                              this.state.testId[0] == 0 ? "" : this.state.testId
                            }&hasAnswer=${this.state.isShowAnswer}`}
                            target="_blank"
                            className={styles.exportKnowledge}
                            rel="noreferrer"
                          >
                            <span>
                              {trans(
                                "global.exportWrongQuestion",
                                "导出当前错题集",
                              )}
                            </span>
                          </a>
                        </div>
                      ) : active == 4 ? (
                        <div className={styles.exportWrongQuestion}>
                          <a
                            href={`${
                              window.location.origin
                            }/api/trendComparativeAnalysis/export/student/personalized/question/list?queryType=${isKnowledgeGrouping}&studentId=${studentId}&subjectId=${subjectId}&gradeIdList=${
                              this.state.gradeIdList.length ==
                              this.props.stuGradeList.length
                                ? ""
                                : this.state.gradeIdList
                            }&examTypeList=${
                              this.state.typeList.length ==
                              this.props.stuTypeList.length
                                ? ""
                                : this.state.typeList
                            }&examIdList=${
                              this.state.testId[0] == 0 ? "" : this.state.testId
                            }`}
                            target="_blank"
                            className={styles.exportKnowledge}
                            rel="noreferrer"
                          >
                            <span>
                              {trans("global.exportHomework", "导出个性化作业")}
                            </span>
                          </a>
                        </div>
                      ) : null}
                    </div>
                    {active == 1 ? (
                      <>
                        {/* {subjectId != 0 ? ( */}
                        <div className={styles.tipDimension}>
                          <i className={icon.iconfont} style={{ fontSize: 12 }}>
                            &#xe870;
                          </i>
                          {trans(
                            "allStudentTrend.filteredPaperCount",
                            "共筛选到{$count}份试卷",
                            { count: newTrendList?.examNum || "0" },
                          )}
                          {/* <div style={{ display: 'inline-block', fontSize: '13px', color: 'rgba(1, 17, 61, 0.45)', marginLeft: '10px' }}>学生标准分=((学生分数-年级平均分)÷年级标准差)*10+试卷满分*80%</div> */}
                          {/* <span
                          className={[
                            styles.knowledgeGrouping,
                            styles.showTypeBox,
                          ].join(" ")}
                          // onClick={this.clickKnowledgeGrouping}
                        >
                          <Radio.Group
                            onChange={this.clickShowType}
                            value={showType}
                          >
                            <Radio value={1}>
                              {trans("global.displayByStandard", "按标准分显示")}
                            </Radio>
                            <Radio value={0}>
                              {trans(
                                "global.displayByOriginalDivision",
                                "按原始分显示"
                              )}
                            </Radio>
                          </Radio.Group>
                        </span> */}
                        </div>
                        <div
                          className={[
                            styles.trendParent,
                            styles.chartName,
                          ].join(" ")}
                          // style={{ flex: "1", paddingRight: "20px" }}
                        >
                          <div className={styles.fakeTitle}>
                            <div style={{ marginLeft: "54px" }}>
                              {trans("global.scoringRate", "得分率")}
                            </div>
                            <div style={{ marginRight: "61px" }}>
                              {trans("data.ranking", "排名")}
                            </div>
                          </div>
                          <div id="trendNode"></div>
                        </div>

                        {/*  ) : (
                  <div>{trans("selectCourse.noData", "暂无数据")}</div>
                )} */}
                      </>
                    ) : active == 2 ? (
                      <div className={styles.knowledgeAnalysis}>
                        <div
                          className={styles.tipDimension}
                          style={{ marginBottom: 30 }}
                        >
                          <i className={icon.iconfont} style={{ fontSize: 12 }}>
                            &#xe870;
                          </i>
                          {trans(
                            "allStudentTrend.filteredQuestionSummary",
                            "共筛选到{$examCount}份试卷，试题总数{$questionCount}，简单题{$easyCount}，普通题{$generalCount}，困难题{$difficultyCount}，未标记难度{$noLevelQuestionCount}；一级知识点{$oneLevelKnowledgeCount}个，二级知识点{$twoLevelKnowledgeCount}个，三级知识点{$threeLevelKnowledgeCount}个，未标记知识点{$noLevelKnowledgeCount}",
                            {
                              examCount: knowledgeQuestionList?.examNum || "0",
                              questionCount:
                                knowledgeQuestionList?.questionNum || "0",
                              easyCount:
                                knowledgeQuestionList?.easyQuestionNum || "0",
                              generalCount:
                                knowledgeQuestionList?.generalQuestionNum ||
                                "0",
                              difficultyCount:
                                knowledgeQuestionList?.difficultyQuestionNum ||
                                "0",
                              noLevelQuestionCount:
                                knowledgeQuestionList?.noLevelQuestionNum ||
                                "0",
                              oneLevelKnowledgeCount:
                                knowledgeQuestionList?.oneLevelKnowledgeNum ||
                                "0",
                              twoLevelKnowledgeCount:
                                knowledgeQuestionList?.twoLevelKnowledgeNum ||
                                "0",
                              threeLevelKnowledgeCount:
                                knowledgeQuestionList?.threeLevelKnowledgeNum ||
                                "0",
                              noLevelKnowledgeCount:
                                knowledgeQuestionList?.noLevelKnowledgeNum ||
                                "0",
                            },
                          )}
                        </div>
                        <div
                          className={styles.knowledgeGrouping}
                          // onClick={this.clickKnowledgeGrouping}
                        >
                          <Radio.Group
                            onChange={this.clickKnowledgeGrouping}
                            value={isKnowledgeGrouping}
                          >
                            <Radio value={1}>
                              {trans("global.knowledgeGrouping", "知识点分组")}
                            </Radio>
                            <Radio value={2}>
                              {trans("global.rankingRates", "得分率排序")}
                            </Radio>
                          </Radio.Group>
                          {/* {!isKnowledgeGrouping
                          ? trans("global.knowledgeGrouping", "知识点分组")
                          : trans("global.rankingRates", "得分率排序")} */}
                        </div>
                        {knowledgeQuestionList?.detail &&
                        knowledgeQuestionList?.detail.length > 0 ? (
                          <div className={styles.knowledgeTable}>
                            <div className={styles.gaugeOutfit}>
                              <span className={styles.form}>
                                {trans("global.masteryLevel", "掌握程度")}
                              </span>
                              <span
                                className={styles.form}
                                style={{ width: 150 }}
                              >
                                {trans(
                                  "global.firstLevelKnowledgePoints",
                                  "一级知识点",
                                )}
                              </span>
                              <span
                                className={styles.form}
                                style={{ width: 160 }}
                              >
                                {trans(
                                  "global.secondaryKnowledgePoints",
                                  "二级知识点",
                                )}
                              </span>
                              <span
                                className={styles.form}
                                style={{ width: 200 }}
                              >
                                {trans(
                                  "global.levelKnowledgePoints",
                                  "三级知识点",
                                )}
                              </span>
                              <span className={styles.form}>
                                {trans("global.questionsNum", "题目数")}
                              </span>
                              <span className={styles.form}>
                                {trans("global.questionScore", "分值")}
                              </span>
                              <span
                                className={styles.form}
                                style={{ width: 150 }}
                              >
                                {trans(
                                  "global.difficultyDegree",
                                  "难易题数分布",
                                )}
                              </span>
                              <span
                                className={[
                                  styles.form,
                                  styles.knowLedgeScoreRate,
                                ].join(" ")}
                                id="knowLedgeScoreRate"
                              >
                                {trans("analysis.knowLedgeScoreRate", "得分率")}
                                <Icon
                                  type="caret-up"
                                  onClick={this.positiveClick}
                                  style={
                                    positiveIcon ? { color: "blue" } : null
                                  }
                                />
                                <Icon
                                  type="caret-down"
                                  onClick={this.fallClick}
                                  style={fallIcon ? { color: "blue" } : null}
                                />
                                <Popover
                                  content={filterConfirm}
                                  placement="bottom"
                                  trigger="click"
                                  getPopupContainer={() =>
                                    document.querySelector(
                                      "#knowLedgeScoreRate",
                                    )
                                  }
                                  visible={isKnowLedgeInterval}
                                  onVisibleChange={this.knowLedgeVisibleChange}
                                >
                                  {/* <Icon type="filter" /> */}
                                  <i className={icon.iconfont}>&#xe892;</i>
                                </Popover>
                              </span>
                            </div>
                            <div className={styles.tableBody}>
                              {knowledgeQuestionList &&
                                knowledgeQuestionList.detail &&
                                knowledgeQuestionList.detail.length > 0 &&
                                knowledgeQuestionList.detail.map((item) => (
                                  <div className={styles.colBox}>
                                    <span
                                      className={styles.masteryLevel}
                                      style={{
                                        lineHeight:
                                          item.threeLevelNum * 40 + "px",
                                      }}
                                    >
                                      {item.graspDegree}
                                    </span>
                                    <span className={styles.noMasteryLevel}>
                                      {item.oneLevelKnowledges.length > 0 &&
                                        item.oneLevelKnowledges.map((ite) => (
                                          <span className={styles.oneName}>
                                            <span
                                              className={styles.firstLevel}
                                              style={{
                                                lineHeight:
                                                  ite.threeLevelNum * 40 + "px",
                                              }}
                                            >
                                              {ite.oneLevelKnowledgeName}
                                            </span>
                                            <span
                                              className={styles.noFirstLevel}
                                            >
                                              {ite.twoLevelKnowledges.length >
                                                0 &&
                                                ite.twoLevelKnowledges.map(
                                                  (it) => (
                                                    <span
                                                      className={styles.twoName}
                                                    >
                                                      <span
                                                        className={
                                                          styles.twoLevel
                                                        }
                                                        style={{
                                                          lineHeight:
                                                            it.threeLevelNum *
                                                              40 +
                                                            "px",
                                                        }}
                                                      >
                                                        {
                                                          it.twoLevelKnowledgeName
                                                        }
                                                      </span>
                                                      <span
                                                        className={
                                                          styles.noTwoLevel
                                                        }
                                                      >
                                                        {it.threeLevelKnowledges
                                                          .length > 0 &&
                                                          it.threeLevelKnowledges.map(
                                                            (index) => (
                                                              <div
                                                                className={
                                                                  styles.threeName
                                                                }
                                                                style={
                                                                  index.colorType ==
                                                                  1
                                                                    ? {
                                                                        background:
                                                                          "#65CF9B",
                                                                      }
                                                                    : index.colorType ==
                                                                        2
                                                                      ? {
                                                                          background:
                                                                            "#FFD470",
                                                                        }
                                                                      : index.colorType ==
                                                                          3
                                                                        ? {
                                                                            background:
                                                                              "#FF895D",
                                                                          }
                                                                        : null
                                                                }
                                                              >
                                                                <span
                                                                  className={
                                                                    styles.threeLevel
                                                                  }
                                                                >
                                                                  {
                                                                    index.threeLevelKnowledgeName
                                                                  }
                                                                </span>
                                                                <span
                                                                  className={
                                                                    styles.questionNum
                                                                  }
                                                                  onClick={() =>
                                                                    this.clickQuestionNum(
                                                                      index.examIdWithQuestionIdList,
                                                                      index.threeLevelKnowledgeName,
                                                                    )
                                                                  }
                                                                >
                                                                  <span
                                                                    className={
                                                                      styles.borderBom
                                                                    }
                                                                  >
                                                                    {
                                                                      index.questionNum
                                                                    }
                                                                  </span>
                                                                </span>
                                                                <span
                                                                  className={
                                                                    styles.score
                                                                  }
                                                                >
                                                                  {index.score}
                                                                </span>
                                                                <span
                                                                  className={
                                                                    styles.levelList
                                                                  }
                                                                >
                                                                  {
                                                                    index.levelList
                                                                  }
                                                                  {/* {i.levelList?.length >
                                                                0 &&
                                                                i.levelList.map(
                                                                  (ii) => (
                                                                    <span
                                                                      style={{
                                                                        marginLeft: 5,
                                                                      }}
                                                                    >
                                                                      {ii == 1
                                                                        ? "简单"
                                                                        : ii == 2
                                                                        ? "普通"
                                                                        : "困难"}
                                                                    </span>
                                                                  )
                                                                )} */}
                                                                </span>
                                                                <span
                                                                  className={
                                                                    styles.scoreRate
                                                                  }
                                                                >
                                                                  {
                                                                    index.scoreRate
                                                                  }
                                                                </span>
                                                              </div>
                                                            ),
                                                          )}
                                                      </span>
                                                    </span>
                                                  ),
                                                )}
                                            </span>
                                          </span>
                                        ))}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ) : null}

                        {/* <Table
                        dataSource={newKnowledgeDataSource}
                        pagination={false}
                        scroll={{ x: 1100 }}
                        columns={newKnowledgeColumns}
                      /> */}
                      </div>
                    ) : active == 3 ? (
                      <div className={styles.mistakesCollection}>
                        <div className={styles.tipDimension}>
                          <i className={icon.iconfont} style={{ fontSize: 12 }}>
                            &#xe870;
                          </i>
                          {trans(
                            "allStudentTrend.errorQuestionSummary",
                            "共筛选到{$examCount}份试卷，试题总数{$questionCount}题，错题总数{$errorCount}题。",
                            {
                              examCount: errorQuestionList?.examNum || "0",
                              questionCount:
                                errorQuestionList?.questionNum || "0",
                              errorCount:
                                errorQuestionList?.errorQuestionNum || "0",
                            },
                          )}
                        </div>
                        <div className={styles.errorTable}>
                          <Table
                            columns={newcolumns}
                            dataSource={errDetialList}
                            bordered={true}
                            align={"center"}
                            pagination={false}
                            onRow={this.onRow}
                          />
                        </div>
                        <div className={styles.paginations}>
                          <Pagination
                            size="small"
                            pageSize={this.state.pageSizeErr}
                            current={this.state.pageNoErr}
                            total={errorQuestionList.errorQuestionNum || 0}
                            onChange={this.changeNoErr}
                            showSizeChanger
                            showQuickJumper
                            onShowSizeChange={this.onShowSizeErrChange}
                            pageSizeOptions={[50, 100, 150, 200]}
                          />
                        </div>
                      </div>
                    ) : active == 4 ? (
                      <div
                        className={styles.mistakesCollection}
                        style={{ padding: 10 }}
                      >
                        <div className={styles.diyWorkTable}>
                          <Table
                            columns={newcolumns1}
                            dataSource={diyWorkList}
                            bordered={true}
                            align={"center"}
                            pagination={false}
                            onRow={this.onRow1}
                          />
                        </div>
                        {/* <div className={styles.paginations}>
                        <Pagination
                          size="small"
                          pageSize={this.state.pageSizeDiyWork}
                          current={this.state.pageNoDiyWork}
                          // total={
                          //   individuationTest?.individuationTestsData?.length || 0
                          // }
                          total={diyWorkList.length}
                          onChange={this.changeNoDiyWork}
                          showSizeChanger
                          showQuickJumper
                          onShowSizeChange={this.onShowSizeDiyWorkChange}
                          pageSizeOptions={[50, 100, 150, 200]}
                        />
                      </div> */}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 保存查询条件+发送学生 */}
        <Modal
          visible={isQueryCriteria}
          // visible={true}
          onCancel={this.modalCancel}
          className={styles.queryCriteriaModal}
          footer={null}
          closable={false}
          bodyStyle={{ padding: 0 }}
          width={660}
          getContainer={false}
          destroyOnClose={true}
        >
          {/* <div>
            <div className={styles.stuHeader}>
              <i
                className={[icon.iconfont, styles.closeIcon].join(" ")}
                onClick={this.visibleChange.bind(this)}
              >
                &#xe6a9;
              </i>
              <span className={styles.stuTitle}>
                {trans("global.savedCriteria", "保存查询条件")}
              </span>
              <span></span>
            </div>
            <div className={styles.conditionBox}>
              <div className={styles.conditionRow}>
                <span className={styles.rowLeft}>
                  {trans("global.queryConditionName", "查询条件名称")}
                </span>
                <div style={{ width: "84%", display: "inline-block" }}>
                  <Input
                    // style={{ width: "100%" }}
                    onChange={this.changeExamName}
                    value={queryConditionName}
                  />
                </div>
              </div>
            </div>
          </div> */}
          <StuConditionSelect
            // groupList={this.props.studentGroupListAndStudentList} //学生列表
            // visible={this.state.isStuStudy} // 开关
            modalVisible={this.handleCriteriaBtn} //关闭方法
            disabledStu={[]} //禁用学生
            publishText={trans("global.batchDownload", "批量下载")} //发布
            sureStu={this.handleCriteriaBtn} //发布完后的内容
            // search={this.searchStuName} //搜索
            onRef={this.onRef1} //
            ifDeadLine={true}
            dispatch={this.props.dispatch}
            studentId={studentId}
            subjectId={subjectId}
            gradeIdList={this.state.gradeIdList}
            queryType={isKnowledgeGrouping}
            examIdList={this.state.testId}
            examTypeList={this.state.typeList}
            newGradeList={newGradeList}
            newTypeList={newTypeList}
            stuNameList={stuNameList}
            saveStuRecord={saveStuRecord}
            pushStatus={this.pushStatus}
          />
        </Modal>
        {/* 知识点下的错题 */}
        <Modal
          visible={isErrTopic}
          // visible={true}
          onCancel={this.modalCancel}
          className={styles.errTopicModal}
          footer={null}
          closable={false}
          bodyStyle={{ padding: 0 }}
          width={957}
          getContainer={false}
          destroyOnClose={true}
        >
          <div>
            <div className={styles.stuHeader}>
              <i
                className={[icon.iconfont, styles.closeIcon].join(" ")}
                onClick={this.errTopicChange.bind(this)}
              >
                &#xe6a9;
              </i>
            </div>
            <ErrorQuestion
              errDetialList={knowledgeErrorQuestionList}
              title={tableName}
            />
          </div>
        </Modal>
        {/* 保存过的查询条件 */}
        <Modal
          visible={isSavedCriteria}
          // visible={true}
          onCancel={this.modalCancel}
          className={styles.errTopicModal}
          footer={null}
          closable={false}
          bodyStyle={{ padding: 0 }}
          width={957}
          getContainer={false}
          destroyOnClose={true}
        >
          <div>
            <div className={styles.stuHeader}>
              <i
                className={[icon.iconfont, styles.closeIcon].join(" ")}
                onClick={this.savedCriteriaChange.bind(this)}
              >
                &#xe6a9;
              </i>
              <span className={styles.stuTitle}>
                {trans("global.savedQueryCriteria", "保存过的查询条件")}
              </span>
            </div>
            <QueryCriteriaTable
              dispatch={this.props.dispatch}
              clickCriteriaBtn={this.clickCriteriaBtn}
              savedCriteriaChange={this.savedCriteriaChange}
              saveQueryCriteria={this.saveQueryCriteria}
            />
          </div>
        </Modal>
        {this.state.imgVisible ? (
          <PreviewImg
            imgUrl={this.state.url}
            modalVisible={this.state.imgVisible}
            changeModalVisible={this.cancelImg}
          />
        ) : null}
        {/* 错题集批量导出 */}
        <StuStudySelect
          groupList={this.props.studentGroupListAndStudentList} //学生列表
          visible={this.state.isStuStudy} // 开关
          isShowAnswer={this.state.isShowAnswer}
          title={trans("global.selectStu", "选择要下载的学生")}
          modalVisible={this.handleCancelDownload} //关闭方法
          disabledStu={[]} //禁用学生
          publishText={trans("global.batchDownload", "批量下载")} //发布
          sureStu={this.handleCancelDownload} //发布完后的内容
          search={this.searchStuName} //搜索
          onRef={this.onRef} //
          ifDeadLine={true}
          dispatch={this.props.dispatch}
          studentId={studentId}
          subjectId={subjectId}
          gradeIdList={
            this.state.gradeIdList.length == this.props.stuGradeList.length
              ? ""
              : this.state.gradeIdList
          }
          queryType={isKnowledgeGrouping}
          examIdList={this.state.testId[0] == 0 ? "" : this.state.testId}
          examTypeList={
            this.state.typeList.length == this.props.stuTypeList.length
              ? ""
              : this.state.typeList
          }
        />
      </div>
    );
  }
}
export default connect(({ home, studentLearning, global }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  teachingOrgList: studentLearning.teachingOrgList,
  allStudents: studentLearning.allStudents,
  allSubjectList: studentLearning.allSubjectList,
  stuGradeList: global.stuGradeList,
  stuTypeList: global.stuTypeList,
  stuNameList: global.stuNameList,
  knowledgeQuestionList: global.knowledgeQuestionList,
  errorQuestionList: global.errorQuestionList,
  hoverIndex: home.hoverIndex,
  hoverIndexc: home.hoverIndexc,
  individuationTest: home.individuationTest,
  questionItem: home.questionItem,
  newTrendList: home.newTrendList,
  allStudentByName: home.allStudentByName,
  studentGroupList: global.studentGroupList,
  userList: global.userList,
  personalizedList: global.personalizedList,
  studentList: global.studentList,
  studentGroupListAndStudentList: global.studentGroupListAndStudentList,
  knowledgeErrorQuestionList: global.knowledgeErrorQuestionList,
  tableData: home.tableData,
  studentSummaryDashboard: home.studentSummaryDashboard,
}))(GlobalHeader);

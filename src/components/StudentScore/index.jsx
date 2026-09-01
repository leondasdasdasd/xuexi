import React, { PureComponent } from "react";
import {
  Button,
  Checkbox,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Popover,
  Select,
  Spin,
  Table,
  Tooltip,
} from "antd";
import { connect } from "dva";
import $ from "jquery";
import RViewerJS from "viewerjs-react";

import AreaHeaderComponent from "components/AreaHeaderComponent";
import ChartSwitch from "components/ChartSwitch";
import MyTabs from "components/MyTabs";

import svg from "../../assets/订正.svg";
import { queryStuScore } from "../../services/example";
import { locale, trans } from "../../utils/i18n";
import { comparePercentages } from "../../utils/utils";
import {
  buildOriginalVolumePdf,
  downloadOriginalVolumePdf,
} from "./originalVolumePdf";
import {
  buildOriginalVolumeZip,
  downloadOriginalVolumeZip,
} from "./originalVolumeZip";

import "viewerjs-react/dist/index.css";
import "viewerjs/dist/viewer.css";
import icon from "../../icon.module.less";
import styles from "./index.module.less";

const language = locale() == "en" ? false : true;
let timerId1 = null;
const { Option } = Select;
const { Search } = Input;
const { Column } = Table;
export class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      check: 1,
      groupId: undefined,
      pageNo: 1,
      pageSize: 30,
      stuName: "",
      imageDisplay: false,
      imgArr: [],
      correction: false,
      nameChecked: true,
      averageChecked: true,
      showStuScore: true,
      stuScoreSpecify: false,
      selectedStudentIndex: 1,
      isPreviewVisible: false,
      imgSize: 1,
      studentList: [],
      groupId1: 0,
      studentUserId: undefined,
      exportingOriginalVolume: false,
      exportingOriginalVolumePdf: false,
    };
    this.imgRef = React.createRef();
    this.originalVolumeExportTracking = false;
    this.originalVolumeExportSequence = 0;
    this.originalVolumeExportActiveSequence = undefined;
  }
  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
    if (this.props.isParentInit) {
      console.log("从父组件加载完成后再初始化数据");
    } else {
      // 获取全部班级
      this.props.dispatch({
        type: "home/getStuGrade",
        payload: {
          examId: this.props.examId,
        },
        callback: (response) => {
          if (response.status) {
            const data = response.content;
            // 存在班级则默认选中第一个班级，不存在则显示全部班级
            if (data && data.length > 0) {
              this.setState(
                {
                  groupId: data[0].groupId,
                },
                () => {
                  if (this.props.examSourceType !== 0) {
                    this.getPage();
                    this.renderScoreChart();
                  }
                },
              );
            } else {
              this.setState(
                {
                  groupId: 0,
                },
                () => {
                  if (this.props.examSourceType !== 0) {
                    this.getPage();
                    this.renderScoreChart();
                  }
                },
              );
            }
          } else {
            message.error(response.message);
          }
        },
      });
    }
  }

  /**
   * 组件卸载时停止处理原卷 zip 异步回调，避免卸载后继续更新状态。
   * @returns {void}
   */
  componentWillUnmount() {
    this.originalVolumeExportTracking = false;
    this.originalVolumeExportActiveSequence = undefined;
  }

  // 父组加载完毕后可以调用次函数初始化数据，相当于父组件加载完毕之后调用
  initData = () => {
    if (this.props.examSourceType !== 0) {
      this.setState(
        {
          groupId: this.props.groupId,
        },
        () => {
          this.getPage();
          this.renderScoreChart();
        },
      );
    }
  };

  getPage = () => {
    this.props.dispatch({
      type: "home/getStuScore",
      payload: {
        examId: this.props.examId,
        groupId: this.state.groupId,
        pageNo: this.state.check == 1 ? this.state.pageNo : 1,
        limit: this.state.check == 1 ? this.state.pageSize : 1000,
        searchStudentKeyWord: this.state.stuName,
        scoreCorrectionType: this.state.correction === false ? 0 : 1,
        isSort: this.state.check == 1 ? true : false,
        filterFlag: this.state.stuScoreSpecify,
      },
    });
  };
  changeGrade = (value) => {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
      },
      () => {
        if (this.state.check == 2) {
          this.renderScoreChart();
        } else {
          this.getPage();
        }
      },
    );
  };

  onSearch = (value) => {
    this.setState(
      {
        pageNo: 1,
      },
      () => {
        if (this.state.check == 2) {
          this.renderScoreChart();
        } else {
          this.getPage();
        }
      },
    );
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
      },
      () => {
        // this.getPage();
        if (check == 2) {
          this.renderScoreChart();
        } else {
          this.getPage();
        }
      },
    );
  };
  onShowSizeChange = (current, pageSize) => {
    console.log(pageSize, "aas");
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
  changeNo = (value, pageSize) => {
    console.log(value, pageSize, "aa");
    this.setState(
      {
        pageNo: value,
      },
      () => {
        this.getPage();
      },
    );
  };

  clickReductionHistory = (id) => {
    console.log(id, this.props.examId);
    this.props
      .dispatch({
        type: "home/getReductionHistory",
        payload: {
          examId: this.props.examId,
          studentUserId: id,
        },
      })
      .then(() => {
        const { reductionHistory } = this.props;
      });
  };
  changeCorrection = (e) => {
    this.setState(
      {
        correction: e.target.checked,
      },
      () => {
        if (this.state.check == 2) {
          this.renderScoreChart();
        } else {
          this.getPage();
        }
      },
    );
  };
  nameChange = (checked) => {
    this.setState(
      {
        nameChecked: checked,
      },
      () => {
        this.renderScoreChart();
        console.log(this.state.nameChecked, "222");
      },
    );
  };
  averageChange = (checked) => {
    this.setState(
      {
        averageChecked: checked,
      },
      () => {
        this.renderScoreChart();
      },
    );
  };
  showStuScoreChange = (checked) => {
    this.setState(
      {
        showStuScore: checked,
      },
      () => {
        this.renderScoreChart();
      },
    );
  };
  // initStuScoreChart = (data) => {
  //   let chartDom = document.getElementById('scoreChart');
  //   if (!chartDom) return
  //   let myChart = echarts.init(chartDom);
  //   let option;
  //   console.log({ data });

  //   let xData = []
  //   let ydata = []
  //   data.examResultList?.forEach((item, index) => {
  //     if (index !== 0) {
  //       xData.push(item.studentName)
  //       ydata.push(item.studentScore)
  //     }
  //   });
  //   xData = [...xData,...xData,...xData,...xData,...xData,...xData,...xData,...xData,...xData,...xData,...xData,...xData]
  //   ydata = [...ydata,...ydata,...ydata,...ydata,...ydata,...ydata,...ydata,...ydata,...ydata,...ydata,...ydata,...ydata]
  //   option = {
  //     color: ["#3d94ff", "#12CC67", "#FFE030", "#FC7D7D", "#4BE4E7", "#19A978", "#FF9451", "#B169EB", "#E286D2", "#3D82D6", "#CC8C47", "#B0CAFF", "#CE6C6C", "#C0DF35", "#D4B589", "#C1C1C1"],
  //     grid: {
  //       left: '5%',
  //       top: '5%',
  //       bottom: '10%',
  //       right: '5%',
  //       width: xData.length * 60
  //     },
  //     xAxis: {
  //       type: 'category',
  //       data: xData
  //     },
  //     yAxis: {
  //       type: 'value'
  //     },
  //     series: [
  //       {
  //         data: ydata,
  //         type: 'bar',
  //         barMaxWidth: '32px',
  //       }
  //     ]
  //   };
  //   option && myChart.setOption(option);
  // }

  renderScoreChart = () => {
    if (this.state.check !== 2) return;

    this.props
      .dispatch({
        type: "home/getStuScore",
        payload: {
          examId: this.props.examId,
          groupId: this.state.groupId,
          pageNo: 1,
          limit: 1000,
          searchStudentKeyWord: this.state.stuName,
          scoreCorrectionType: this.state.correction === false ? 0 : 1,
          isSort: this.state.check == 1 ? true : false,
          filterFlag: this.state.stuScoreSpecify,
        },
      })
      .then(() => {
        $("#scoreChart").find("canvas").remove();
        // console.log("212");
        const { stuScore } = this.props;
        console.log(stuScore.examResultList, "111");
        let dom = document.querySelector("#scoreChart");
        // console.log(dom, "ddd");
        let newData = [];
        if (stuScore.examResultList && stuScore.examResultList.length > 0) {
          stuScore.examResultList.map((item, index) => {
            if (index == 0) return;
            let newObject = {
              studentName:
                locale() == "en" ? item.studentEnName : item.studentName,
              studentScore: item.studentScore,
            };
            newData.push(newObject);
          });
        }

        console.log(newData, "222");
        let data = newData;
        const chart = new G2.Chart({
          container: "scoreChart",
          // forceFit: true,
          // height: dom.offsetHeight,
          height:
            document.querySelector("#StudentScore_chartBox")?.offsetHeight - 30,
          padding: [20, 20, 50, 40],
          width:
            stuScore.examResultList?.length > 52
              ? stuScore.examResultList?.length * 25
              : stuScore.examResultList?.length > 10
                ? 1180
                : stuScore.examResultList?.length > 8
                  ? 1000
                  : stuScore.examResultList?.length > 6
                    ? 800
                    : stuScore.examResultList?.length > 3
                      ? 500
                      : stuScore.examResultList?.length > 1
                        ? 200
                        : 1180,
        });
        chart.source(data);
        if (this.state.nameChecked) {
          if (stuScore.examResultList?.length > 38) {
            chart.axis("studentName", {
              label: {
                textStyle: {
                  fill: "#aaaaaa",
                },
                rotate: 0.7,
              },
              tickLine: {
                alignWithLabel: false,
                length: 0,
              },
            });
          } else {
            chart.axis("studentName", {
              label: {
                textStyle: {
                  fill: "#aaaaaa",
                },
              },
              tickLine: {
                alignWithLabel: false,
                length: 0,
              },
            });
          }
        } else {
          chart.axis("studentName", {
            label: {
              textStyle: {
                fill: "#aaaaaa",
              },
              offsetY: 0,
              htmlTemplate(text, item, index) {
                return ``;
              },
            },
            tickLine: {
              alignWithLabel: false,
              length: 0,
            },
          });
        }

        if (this.state.averageChecked == true) {
          chart.guide().line({
            top: true,
            start: ["min", stuScore.examResultList[0].studentScore],
            end: ["max", stuScore.examResultList[0].studentScore],
            lineStyle: {
              stroke: "#0239D4",
              lineDash: [4, 2],
              lineWidth: 1,
            },
            text: {
              content: `平均分 ${stuScore.examResultList[0].studentScore}`,
              position: "start",
              // autoRotate: true,
              // offsetX: -75,
              // offsetY: 5,
              style: {
                fontSize: 12,
                fill: "#0239D4",
                // opacity: 5,
              },
            },
          });
        }
        chart.scale("studentScore", {
          alias: "分数",
          max: stuScore.examTotalScore,
          min: 0,
          tickCount: 5,
        });
        chart.axis("studentScore", {
          label: {
            textStyle: {
              fill: "#aaaaaa",
            },
          },
        });
        chart.legend(false);
        if (this.state.showStuScore) {
          if (stuScore.examResultList.length > 16) {
            chart
              .interval()
              .position("studentName*studentScore")
              .opacity(1)
              .size(20)
              .color("studentName", [
                "#3d94ff",
                "#12CC67",
                "#FFE030",
                "#FC7D7D",
                "#4BE4E7",
                "#19A978",
                "#FF9451",
                "#B169EB",
                "#E286D2",
                "#3D82D6",
                "#CC8C47",
                "#B0CAFF",
                "#CE6C6C",
                "#C0DF35",
                "#D4B589",
                "#C1C1C1",
              ])
              .label("studentScore", {
                position: "top",
                textStyle: {
                  fill: "#333",
                  fontSize: 12,
                  shadowBlur: 2,
                },
                formatter: (text) => {
                  return text;
                },
                offset: 10,
              });
          } else if (stuScore.examResultList.length > 38) {
            chart
              .interval()
              .position("studentName*studentScore")
              .opacity(1)
              .size(20)
              .color("studentName", [
                "#3d94ff",
                "#12CC67",
                "#FFE030",
                "#FC7D7D",
                "#4BE4E7",
                "#19A978",
                "#FF9451",
                "#B169EB",
                "#E286D2",
                "#3D82D6",
                "#CC8C47",
                "#B0CAFF",
                "#CE6C6C",
                "#C0DF35",
                "#D4B589",
                "#C1C1C1",
              ])
              .label("studentScore", {
                position: "top",
                textStyle: {
                  fill: "#333",
                  fontSize: 12,
                  shadowBlur: 2,
                },
                formatter: (text) => {
                  return text;
                },
                offset: 10,
              });
          } else {
            chart
              .interval()
              .position("studentName*studentScore")
              .opacity(1)
              .size(32)
              .color("studentName", [
                "#3d94ff",
                "#12CC67",
                "#FFE030",
                "#FC7D7D",
                "#4BE4E7",
                "#19A978",
                "#FF9451",
                "#B169EB",
                "#E286D2",
                "#3D82D6",
                "#CC8C47",
                "#B0CAFF",
                "#CE6C6C",
                "#C0DF35",
                "#D4B589",
                "#C1C1C1",
              ])
              .label("studentScore", {
                position: "top",
                textStyle: {
                  fill: "#333",
                  fontSize: 12,
                  shadowBlur: 2,
                },
                formatter: (text) => {
                  return text;
                },
                offset: 10,
              });
          }
        } else {
          if (stuScore.examResultList.length > 16) {
            chart
              .interval()
              .position("studentName*studentScore")
              .opacity(1)
              .size(20)
              .color("studentName", [
                "#3d94ff",
                "#12CC67",
                "#FFE030",
                "#FC7D7D",
                "#4BE4E7",
                "#19A978",
                "#FF9451",
                "#B169EB",
                "#E286D2",
                "#3D82D6",
                "#CC8C47",
                "#B0CAFF",
                "#CE6C6C",
                "#C0DF35",
                "#D4B589",
                "#C1C1C1",
              ]);
          } else if (stuScore.examResultList.length > 38) {
            chart
              .interval()
              .position("studentName*studentScore")
              .opacity(1)
              .size(20)
              .color("studentName", [
                "#3d94ff",
                "#12CC67",
                "#FFE030",
                "#FC7D7D",
                "#4BE4E7",
                "#19A978",
                "#FF9451",
                "#B169EB",
                "#E286D2",
                "#3D82D6",
                "#CC8C47",
                "#B0CAFF",
                "#CE6C6C",
                "#C0DF35",
                "#D4B589",
                "#C1C1C1",
              ]);
          } else {
            chart
              .interval()
              .position("studentName*studentScore")
              .opacity(1)
              .size(32)
              .color("studentName", [
                "#3d94ff",
                "#12CC67",
                "#FFE030",
                "#FC7D7D",
                "#4BE4E7",
                "#19A978",
                "#FF9451",
                "#B169EB",
                "#E286D2",
                "#3D82D6",
                "#CC8C47",
                "#B0CAFF",
                "#CE6C6C",
                "#C0DF35",
                "#D4B589",
                "#C1C1C1",
              ]);
          }
        }

        // chart.destroy();
        // chart.repaint();
        chart.render();
        window.CHART = chart;
      });
  };
  exportImgClk = () => {
    window.CHART.downloadImage("学生得分柱状图");
  };

  courseDetailSpecifyChange = (checked) => {
    this.setState(
      {
        stuScoreSpecify: checked,
      },
      () => {
        this.renderScoreChart();
      },
    );
  };
  exportChange = () => {
    let isCheck = this.state.check == 1 ? true : false;
    let url = `${window.location.origin}/api/export/exam/resultListByGroup?examId=${this.props.examId}&groupId=${this.state.groupId}&searchStudentKeyWord=${this.state.stuName}&isSort=${isCheck}&filterFlag=${this.state.stuScoreSpecify}`;
    window.open(url);
  };

  /**
   * 组装原卷 zip 导出的列表筛选参数，保持与学生得分列表筛选条件一致。
   * @returns {object} 当前学生得分列表筛选参数。
   */
  getOriginalVolumeExportParameters = () => {
    const isCheck = this.state.check == 1 ? true : false;
    return {
      examId: this.props.examId,
      groupId: this.state.groupId,
      searchStudentKeyWord: this.state.stuName,
      isSort: isCheck,
      filterFlag: this.state.stuScoreSpecify,
    };
  };

  /**
   * 组装原卷 zip 导出拉取全集学生列表的请求参数，避免当前分页导致漏学生。
   * @returns {object} 学生得分列表全集查询参数。
   */
  getOriginalVolumeExportListParameters = () => {
    return {
      ...this.getOriginalVolumeExportParameters(),
      pageNo: undefined,
      limit: undefined,
      scoreCorrectionType: this.state.correction === false ? 0 : 1,
    };
  };

  /**
   * 获取原卷 zip 文件名所需测验名称，兜底值只用于异常数据缺失场景。
   * @returns {string} 测验名称。
   */
  getOriginalVolumeExamName = () => {
    return (
      this.props.examName ||
      this.props.questionScore?.examName ||
      trans("global.originalVolume", "原卷")
    );
  };

  /**
   * 在浏览器中拉取原卷图片并生成 zip，避免再创建后端异步打包任务。
   * @returns {Promise<void>|void} 前端 zip 生成流程。
   */
  exportOriginalVolumeZip = () => {
    if (this.state.exportingOriginalVolume) {
      message.info(
        trans(
          "studentScore.originalVolumeExportProcessing",
          "原卷压缩包生成中",
        ),
      );
      return;
    }
    const exportSequence = this.originalVolumeExportSequence + 1;
    this.originalVolumeExportSequence = exportSequence;
    this.originalVolumeExportActiveSequence = exportSequence;
    this.originalVolumeExportTracking = true;
    this.setState({
      exportingOriginalVolume: true,
    });
    return queryStuScore(this.getOriginalVolumeExportListParameters())
      .then((response) => {
        if (!this.isOriginalVolumeExportActive(exportSequence)) {
          return;
        }
        if (!response || !response.status) {
          this.finishOriginalVolumeExport(
            false,
            response?.message ||
              trans(
                "studentScore.originalVolumeExportCreateFailed",
                "原卷压缩包任务创建失败",
              ),
          );
          return;
        }
        return buildOriginalVolumeZip({
          examName: this.getOriginalVolumeExamName(),
          studentList: response.content?.examResultList || [],
        });
      })
      .then((zipResult) => {
        if (!zipResult || !this.isOriginalVolumeExportActive(exportSequence)) {
          return;
        }
        downloadOriginalVolumeZip(zipResult);
        this.finishOriginalVolumeExport(true);
        return;
      })
      .catch((error) => {
        if (!this.isOriginalVolumeExportActive(exportSequence)) {
          return;
        }
        this.finishOriginalVolumeExport(
          false,
          error?.message ||
            trans(
              "studentScore.originalVolumeExportCreateFailed",
              "原卷压缩包任务创建失败",
            ),
        );
        return;
      });
  };

  /**
   * 完成或终止原卷 zip 导出流程，并给用户反馈结果。
   * @param {boolean} success 是否成功生成并即将下载。
   * @param {string} errorMessage 失败时展示的错误信息。
   * @returns {void}
   */
  finishOriginalVolumeExport = (success, errorMessage) => {
    this.originalVolumeExportTracking = false;
    this.originalVolumeExportActiveSequence = undefined;
    this.setState({
      exportingOriginalVolume: false,
    });
    if (success) {
      message.success(
        trans("studentScore.originalVolumeExportSuccess", "原卷压缩包生成完成"),
      );
    } else if (errorMessage) {
      message.error(errorMessage);
    }
  };

  /**
   * 判断回调是否仍属于当前原卷 zip 导出任务，避免旧任务响应覆盖新任务。
   * @param {number} exportSequence 本次导出流水号。
   * @returns {boolean} true 表示仍可处理当前回调。
   */
  isOriginalVolumeExportActive = (exportSequence) => {
    return (
      this.originalVolumeExportTracking &&
      exportSequence !== undefined &&
      this.originalVolumeExportActiveSequence === exportSequence
    );
  };

  /**
   * 用户主动关闭生成中提示时二次确认，确认后停止本次任务跟踪。
   * @returns {void}
   */
  cancelOriginalVolumeExportTracking = () => {
    Modal.confirm({
      title: trans(
        "studentScore.originalVolumeExportCancelTitle",
        "确认关闭生成提示？",
      ),
      content: trans(
        "studentScore.originalVolumeExportCancelContent",
        "关闭后本次生成不会继续提示，后续下载需要重新发起。",
      ),
      okText: trans("global.sure", "确定"),
      cancelText: trans("global.cancle", "取消"),
      onOk: () => {
        this.originalVolumeExportTracking = false;
        this.originalVolumeExportActiveSequence = undefined;
        this.setState({
          exportingOriginalVolume: false,
        });
      },
    });
  };

  /**
   * 判断查看原卷弹层是否可以按班级导出 PDF；全部班级不能导出，避免一次性生成过大文件。
   * @returns {boolean} true 表示 PDF 导出按钮需要禁用。
   */
  isOriginalVolumePdfExportDisabled = () => {
    return !this.state.groupId1 || this.state.groupId1 === 0;
  };

  /**
   * 获取当前查看原卷弹层选中班级名称，用于 PDF 文件名。
   * @returns {string} 班级名称。
   */
  getOriginalVolumePdfGroupName = () => {
    const group = (this.props.stuGradeList || []).find((item) => {
      return String(item.groupId) === String(this.state.groupId1);
    });
    if (!group) {
      return this.state.studentList?.find((student) => student?.groupName)
        ?.groupName;
    }
    return language ? group.groupName : group.groupEName || group.groupName;
  };

  /**
   * 组装当前班级原卷 PDF 导出查询参数；导出必须忽略弹层搜索词，确保导出整个班级。
   * @returns {object} 当前班级学生得分列表查询参数。
   */
  getOriginalVolumePdfListParameters = () => {
    return {
      examId: this.props.examId,
      groupId: this.state.groupId1,
      pageNo: 1,
      limit: 1000,
      searchStudentKeyWord: "",
      scoreCorrectionType: this.state.correction === false ? 0 : 1,
      isSort: this.state.check == 1 ? true : false,
      filterFlag: this.state.stuScoreSpecify,
    };
  };

  /**
   * 导出当前具体班级的所有学生原卷 PDF，不调用新增后端导出接口。
   * @returns {Promise<void>|void} PDF 生成流程。
   */
  exportOriginalVolumePdf = () => {
    if (this.isOriginalVolumePdfExportDisabled()) {
      message.info(
        trans(
          "studentScore.exportPdfSwitchClassTip",
          "切换到具体班级后才可以导出",
        ),
      );
      return;
    }
    if (this.state.exportingOriginalVolumePdf) {
      message.info(
        trans("studentScore.originalVolumePdfProcessing", "原卷 PDF 生成中"),
      );
      return;
    }
    this.setState({
      exportingOriginalVolumePdf: true,
    });
    return queryStuScore(this.getOriginalVolumePdfListParameters())
      .then((response) => {
        if (!response || !response.status) {
          throw new Error(
            response?.message ||
              trans(
                "studentScore.originalVolumePdfLoadFailed",
                "原卷数据获取失败",
              ),
          );
        }
        return buildOriginalVolumePdf({
          examName: this.getOriginalVolumeExamName(),
          groupName: this.getOriginalVolumePdfGroupName(),
          studentList: response.content?.examResultList || [],
        });
      })
      .then((pdfResult) => {
        downloadOriginalVolumePdf(pdfResult);
        this.setState({
          exportingOriginalVolumePdf: false,
        });
        message.success(
          trans("studentScore.originalVolumePdfSuccess", "原卷 PDF 生成完成"),
        );
        return;
      })
      .catch((error) => {
        this.setState({
          exportingOriginalVolumePdf: false,
        });
        message.error(
          error?.message ||
            trans("studentScore.originalVolumePdfFailed", "原卷 PDF 生成失败"),
        );
        return;
      });
  };

  /**
   * 渲染查看原卷弹层内的按班级导出 PDF 按钮。
   * @returns {React.ReactNode} PDF 导出按钮。
   */
  renderOriginalVolumePdfButton = () => {
    const disabled = this.isOriginalVolumePdfExportDisabled();
    const button = (
      <Button
        disabled={disabled || this.state.exportingOriginalVolumePdf}
        loading={this.state.exportingOriginalVolumePdf}
        onClick={this.exportOriginalVolumePdf}
        style={{
          marginRight: "8px",
        }}
      >
        {trans("studentScore.exportClassPdf", "按班级导出 PDF")}
      </Button>
    );
    return (
      <Tooltip
        title={
          disabled
            ? trans(
                "studentScore.exportPdfSwitchClassTip",
                "切换到具体班级后才可以导出",
              )
            : ""
        }
      >
        <span>{button}</span>
      </Tooltip>
    );
  };

  handleTableChange = (pagination, filters, sorter) => {
    console.log(pagination, filters, sorter);
  };

  onClickOriginalVolume = (record, id) => {
    this.setState(
      {
        isPreviewVisible: true,
        groupId1: this.state.groupId,
        studentUserId: id,
      },
      () => {
        this.getStudenList(true);
      },
    );
  };

  openImg = (record, text) => {
    const img = document.querySelector("#img").querySelector("img");
    img?.click();
  };

  closePreview = () => {
    this.setState({
      isPreviewVisible: false,
      selectedStudentIndex: 1,
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
    queryStuScore({
      examId: this.props.examId,
      groupId: this.state.groupId1,
      pageNo: 1,
      limit: 1000,
      searchStudentKeyWord: this.state.studentKeyword
        ? this.state.studentKeyword
        : "",
      scoreCorrectionType: this.state.correction === false ? 0 : 1,
      isSort: this.state.check == 1 ? true : false,
      filterFlag: this.state.stuScoreSpecify,
    }).then((res) => {
      if (res.status) {
        this.setState(
          {
            studentList: res.content.examResultList || [],
          },
          () => {
            let jjj = 1;
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
            this.setState({
              selectedStudentIndex: jjj,
            });
          },
        );
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

  selectStu = (index) => {
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
    const {
      currentUser,
      basketList,
      basketSubjectId,
      questionScore,
      stuGradeList,
      stuScore,
      tableClass,
    } = this.props;
    const { check } = this.state;
    let isCheck = this.state.check == 1 ? true : false;
    let newDataSource = [];
    questionScore?.examResultList &&
      questionScore.examResultList.length &&
      questionScore.examResultList.map((item) => {
        // console.log(item);
        let newObject = {
          key: item.studentUserId ?? "student-score-summary",
          name: item.studentName,
          eName: item.studentEnName,
          score: item.studentScore,
          id: item.studentUserId,
          no: item.studnetNo,
          hasScoreCorrectionStatus: item.hasScoreCorrectionStatus,
          studentExamPaperUrl: item.studentExamPaperUrl,
          avator: item.avatarUrl || "",
          sex: item.sex || 0,
          studentNo: item.studentNo,
        };
        newDataSource.push(newObject);
      });
    const dataSource = newDataSource;

    let newColumns = [];
    questionScore.columnSet &&
      questionScore.columnSet.length &&
      questionScore.columnSet.map((item) => {
        newColumns.push({
          title: () => {
            return (
              <div>
                <div>
                  <span className={styles.importMessage}>
                    {item.questionTitle}
                  </span>
                  <i
                    className={[
                      icon.iconfont,
                      styles.publicMessage,
                      styles.reportFormIcon,
                    ].join(" ")}
                  >
                    &#xe7d3;
                  </i>
                  <span className={styles.publicMessage}>
                    {item.questionScore}
                  </span>
                </div>
                <div>
                  <span className={styles.publicMessage}>
                    {trans("global.yourScore", "得分")}
                  </span>
                  <span
                    className={[styles.publicMessage, styles.divider].join(" ")}
                  >
                    /
                  </span>
                  <span className={styles.publicMessage}>
                    {trans("analysis.knowLedgeScoreRate", "得分率")}
                  </span>
                </div>
              </div>
            );
          },
          dataIndex: item.questionId,
          key: item.questionId,
          render: (text, record, index) => {
            console.log(record, index, item.questionId, "rr");
            return (
              <div>
                <span className={styles.importMessage}>
                  {record[`${item.questionId}Score`]}
                </span>
                <span
                  className={[styles.publicMessage, styles.divider].join(" ")}
                >
                  /
                </span>
                <span className={styles.publicMessage}>
                  {record[`${item.questionId}ScoreRate`]}
                </span>
              </div>
            );
          },
        });
      });
    const content = (
      <Table dataSource={this.props.reductionHistory} pagination={false}>
        <Column
          title={trans("studentScore.correctionTime", "订正时间")}
          dataIndex="correctionDate"
          key="correctionDate"
        />
        <Column
          title={trans("studentScore.correctionContent", "订正内容")}
          dataIndex="correctionContent"
          key="correctionContent"
          render={(text, record) => (
            <span>{record.correctionContent.join(",")}</span>
          )}
        />
        <Column
          title={trans("studentScore.originalTotalScore", "原总分")}
          dataIndex="oldTotal"
          key="oldTotal"
        />
        <Column
          title={trans("studentScore.newTotalScore", "新总分")}
          dataIndex="newTotal"
          key="newTotal"
        />
      </Table>
    );
    const columns = [
      {
        title: trans("global.stuName", "学生姓名"),
        dataIndex: "name",
        key: "name",
        width: 300,
        render: (text, record, index) => {
          // console.log(record);
          return (
            <div>
              {record.avator === "" ? null : (
                <span className={styles.imgBox}>
                  <img
                    src={record.avator}
                    onError={(e) =>
                      record.sex === 2
                        ? (e.target.src =
                            "https://assets.yungu.org/studentmanage/0.0.4.5/static/female.a5d49377.png")
                        : (e.target.src =
                            "https://assets.yungu.org/studentmanage/0.0.4.5/static/male.acd26c2c.png")
                    }
                  />
                </span>
              )}

              <span className={styles.inline}>
                <div className={styles.importMessage}>
                  <span>{record.name}</span>
                  <span>&nbsp;&nbsp;</span>
                  <span>{record.eName}</span>
                </div>
                {/* <div className={styles.publicMessage}>{record.no}</div> */}
              </span>
            </div>
          );
        },
      },
      {
        title: trans("global.studentNumber", "学号"),
        dataIndex: "studentNo",
        key: "studentNo",
        width: 150,
        // sorter: true,
      },
      {
        title: (sortOrder, sortColumn, filters) => {
          console.log(sortOrder, sortColumn, filters, "11");
          return (
            <div>
              <span>
                <span className={styles.importMessage}>
                  {trans("global.yourScore", "得分")}
                </span>
              </span>
              <span>
                <i
                  className={[
                    icon.iconfont,
                    styles.publicMessage,
                    styles.reportFormIcon,
                  ].join(" ")}
                >
                  &#xe7d3;
                </i>
                <span className={styles.publicMessage}>
                  {questionScore.examTotalScore}
                </span>
              </span>
            </div>
          );
        },
        dataIndex: "score",
        key: "score",
        width: 150,
        render: (text, record) => {
          return (
            <div
              className={`${styles.importMessage} ${comparePercentages(text, newDataSource[0]?.score) == -1 ? styles.noPass : ""}`}
            >
              {record.score}{" "}
              {record.hasScoreCorrectionStatus ? (
                <Popover content={content} placement="right">
                  <img
                    src={svg}
                    type="message"
                    style={{ color: "#ccc", margin: "5px" }}
                    onMouseOver={() => this.clickReductionHistory(record.id)}
                  />
                </Popover>
              ) : null}
            </div>
          );
        },
      },

      {
        title: trans("global.caozuo", "操作"),
        dataIndex: "id",
        key: "id",
        align: "left",
        render: (text, record, index) => {
          // return record.studentExamPaperUrl && record.studentExamPaperUrl.length
          //   ? record.studentExamPaperUrl.map((i, ind) => (
          //       <a href={i} key={ind} target="_blank">
          //         <span className={styles.viewExam}>
          //           {trans("global.seeTestPaper", "查看原卷")}
          //         </span>
          //       </a>
          //     ))
          //   : null;

          return record.studentExamPaperUrl &&
            record.studentExamPaperUrl.length > 0 ? (
            <div>
              <span
                className={styles.viewExam}
                style={{ cursor: "pointer" }}
                onClick={() => this.onClickOriginalVolume(record, text, index)}
              >
                {trans("global.seeTestPaper", "查看原卷")}[
                {record.studentExamPaperUrl?.length || null}]
              </span>
            </div>
          ) : null;
        },
      },
    ];
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
    return (
      <div
        className={styles.stuScoreOutBox}
        id="table1"
        style={this.props.isParentInit ? { padding: "0" } : {}}
      >
        <div className={styles.stuScoreBox}>
          {/* img盒子 */}
          <div id="img" style={{ display: "none" }} className={styles.imgView}>
            <RViewerJS options={options}>
              {this.state.studentList?.length
                ? this.state.studentList[
                    this.state.selectedStudentIndex
                  ]?.studentExamPaperUrl?.map((item, index) => (
                    <img key={index} src={item} />
                  ))
                : null}
            </RViewerJS>
          </div>
          <div className={styles.tableBox}>
            <AreaHeaderComponent
              // fullscreenElementId="table10"//全屏的节点id
              // showFullscreenBtn={true}//显示全屏按钮
              // onClickFullscreen={this.fullscreenChange}
              showExportBtn={true} //显示导出按钮
              onClickExport={this.exportChange}
              exportMenuItems={[
                {
                  key: "detail",
                  label: trans("studentScore.exportDetail", "导出明细"),
                  onClick: this.exportChange,
                },
                {
                  key: "originalVolume",
                  label: trans("studentScore.exportOriginalVolume", "导出原卷"),
                  onClick: this.exportOriginalVolumeZip,
                },
              ]}
              title={trans("global.stuScore", "学生得分")}
              rightPanelContent={
                <>
                  {check == 2 ? (
                    <>
                      <ChartSwitch
                        label={trans(
                          "global.showStudentScores",
                          "显示学生得分",
                        )}
                        defaultChecked
                        checked={this.state.showStuScore}
                        onChange={this.showStuScoreChange}
                      />
                      <ChartSwitch
                        label={trans("global.displayName", "显示姓名")}
                        defaultChecked
                        checked={this.state.nameChecked}
                        onChange={this.nameChange}
                      />
                      <ChartSwitch
                        label={trans("global.showAverageScore1", "显示均分")}
                        defaultChecked
                        checked={this.state.averageChecked}
                        onChange={this.averageChange}
                      />
                    </>
                  ) : null}
                  {this.props.filterStudentListPermissions
                    .haveFilterStudentList ? (
                    <ChartSwitch
                      label={trans("global.specifyAnalysis", "指定分析")}
                      defaultChecked
                      checked={this.state.stuScoreSpecify}
                      onChange={this.courseDetailSpecifyChange}
                    />
                  ) : null}
                  {check == 2 ? (
                    <span
                      className={styles.exportImg}
                      onClick={() => this.exportImgClk()}
                    >
                      {trans("global.exportPicture", "截图")}
                    </span>
                  ) : null}
                </>
              }
              leftPanelContent={
                <>
                  <MyTabs
                    data={[
                      { tab: trans("global.listView", "列表视图"), key: 1 },
                      { tab: trans("global.histogram", "柱状图"), key: 2 },
                    ]}
                    onChange={(value) => {
                      this.changeTab(value.key);
                    }}
                    activeKey={1}
                  />
                  {this.props.isParentInit ? null : (
                    <span
                      className={styles.inline}
                      style={{ width: 240, marginLeft: "5px" }}
                    >
                      <Select
                        onChange={this.changeGrade}
                        value={this.state.groupId}
                        style={{ width: 240 }}
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
                    </span>
                  )}
                  {check == 1 ? (
                    <>
                      <Search
                        placeholder={trans(
                          "testAnalysis.searchStudent",
                          "搜索学生",
                        )}
                        allowClear
                        value={this.state.stuName}
                        onChange={this.changeSearch}
                        onSearch={this.onSearch}
                        style={{ width: 200, margin: "0 10px" }}
                      />
                      <Checkbox
                        checked={this.state.correction}
                        onChange={this.changeCorrection}
                      >
                        {trans("global.onlyDependsResults", "只看成绩有订正的")}
                      </Checkbox>
                    </>
                  ) : null}
                </>
              }
            />
            <Modal
              visible={this.state.exportingOriginalVolume}
              footer={null}
              closable
              maskClosable={false}
              title={trans(
                "studentScore.originalVolumeExportProcessing",
                "原卷压缩包生成中",
              )}
              onCancel={this.cancelOriginalVolumeExportTracking}
            >
              <Spin />
              <span style={{ marginLeft: "8px" }}>
                {trans(
                  "studentScore.originalVolumeExportProcessingTip",
                  "原卷压缩包生成中，请稍候",
                )}
              </span>
            </Modal>

            <div className={styles.tableBoxContent}>
              {check === 1 ? (
                <Table
                  dataSource={dataSource}
                  pagination={false}
                  scroll={{ x: 800 }}
                  columns={columns}
                  onChange={this.handleTableChange}
                />
              ) : (
                <div
                  style={{ height: "100%" }}
                  id="StudentScore_chartBox"
                  className={styles.chartBox}
                >
                  <div
                    id="scoreChart"
                    className={styles.scoreChart}
                    style={{
                      maxWidth: 30_000,
                      overflowX: "auto",
                      height: "100%",
                      overflowY: "hidden",
                      display: "flex",
                    }}
                  >
                    {/* {!this.state.nameChecked ? (
                      <div
                        className={styles.hideName}
                        style={{
                          width:
                            stuScore.examResultList.length > 52
                              ? stuScore.examResultList.length * 25
                              : 1180,
                        }}
                      ></div>
                    ) : null} */}
                  </div>
                </div>
              )}
            </div>
            {check == 1 ? (
              <Pagination
                size="small"
                pageSize={this.state.pageSize}
                current={this.state.pageNo}
                total={questionScore.studentTotalNum}
                onChange={this.changeNo}
                showSizeChanger
                showQuickJumper
                onShowSizeChange={this.onShowSizeChange}
              />
            ) : null}
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
                          student:
                            this.state.studentList[
                              this.state.selectedStudentIndex
                            ]?.studentName || "*同学",
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
                {this.renderOriginalVolumePdfButton()}
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
                  <div
                    style={{ height: "45px", width: "100%", padding: "8px" }}
                  >
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
                  <div
                    style={{ height: "45px", width: "100%", padding: "8px" }}
                  >
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
                        return index == 0 ? null : (
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
                              this.selectStu(index);
                            }}
                          >
                            <div
                              style={{ marginRight: "auto", fontWeight: "500" }}
                            >
                              {item.studentName}
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
                      this.state.studentList[
                        this.state.selectedStudentIndex
                      ]?.studentExamPaperUrl?.map((element, index) => {
                        return (
                          <>
                            <img
                              src={element}
                              style={{
                                width: `calc(${(100 * this.state.imgSize) / 2}% - 5px)`,
                                marginBottom: "20px",
                                marginRight:
                                  (index + 1) % 2 == 1 ? "10px" : "0",
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
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "20px" }}
                      >
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
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "20px" }}
                      >
                        &#xe8c7;
                      </i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}
export default connect(({ home }) => ({
  count: home.count,
  basketList: home.basketList,
  basketSubjectId: home.basketSubjectId,
  reductionHistory: home.reductionHistory,
  stuScore: home.stuScore,
  tableClass: home.tableClass,
  stuGradeList: home.stuGradeList,
}))(GlobalHeader);

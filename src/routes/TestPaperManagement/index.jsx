import React from "react";
import {
  Button,
  Dropdown,
  Icon,
  Input,
  Menu,
  message,
  Modal,
  Pagination,
  Select,
  Spin,
  Table,
  Tooltip,
  Upload,
} from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import pathToRegexp from "path-to-regexp";

import ModalOnlineTest from "components/ModalOnlineTest";

import ExamSetting from "../../components/ExamSetting/index";
import ImportPaperUploadModal from "../../components/ImportPaperUploadModal";
import ModalDotMatrixPen from "../../components/ModalDotMatrixPen";
import InitiateMachineTestModal from "../../components/ModalMachineTest";
import ModalTest from "../../components/ModalTest";
import PaperCard from "../../components/PaperCard";
import StudyActivity from "../../components/PublishToStudents/StudyActivity/index";
import ScoreSetting from "../../components/ScoreSetting/index";
import { getExamModule } from "../../services/exam";
import { paperEndScan, paperStartScan } from "../../services/paper";
import { buildHashRouteUrl } from "../../utils/hashRoute";
import { trans } from "../../utils/i18n";
import { buildPaperEditorPreviewPath } from "../PaperEditor/paperEditorPageContext";
import { downloadExamPaperPdf } from "../PaperEditor/paperPdf";

import styles from "./index.module.less";

const { Option } = Select;
const { Search } = Input;
const { Column } = Table;
const OCR_POLL_INTERVAL = 10_000;
const PROCESSING_AI_RECOGNITION_CODE = 1;

export const isPaperAiRecognitionProcessing = (paper) =>
  Number(paper?.aiRecognition) === PROCESSING_AI_RECOGNITION_CODE;
const IMPORT_PAPER_ALLOWED_USER_IDS = new Set([
  "100000336459",
  "100000346359",
  "100000287069",
  "100000139280",
  "2353",
  "100000368202",
  "100000113253",
  "3335",
  "1",
]);
const AI_RECOGNITION_USER_RESTRICTED_SCHOOL_IDS = new Set(["1", "3300002019"]);
const AI_RECOGNITION_ALLOWED_SCHOOL_IDS = new Set([
  "3300002072",
  "3300002109",
  "3300002127",
  "3300002067",
]);

export const canShowAiRecognitionAction = (currentUser) => {
  const schoolId = String(currentUser?.schoolId || "");
  const userId = String(currentUser?.userId || "");

  if (AI_RECOGNITION_ALLOWED_SCHOOL_IDS.has(schoolId)) {
    return true;
  }

  return (
    AI_RECOGNITION_USER_RESTRICTED_SCHOOL_IDS.has(schoolId) &&
    IMPORT_PAPER_ALLOWED_USER_IDS.has(userId)
  );
};

// 仅控制试卷管理页导入试卷入口，避免复用学校级开关影响卡片内其它功能。
export const canShowImportPaperAction = (currentUser) =>
  IMPORT_PAPER_ALLOWED_USER_IDS.has(String(currentUser?.userId || "")) ||
  canShowAiRecognitionAction(currentUser);

export class TestPaperManagement extends React.Component {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/testPaperManagement/:tab?").exec(this.url);
    this.tab = this.pathMatch[1] ? JSON.parse(this.pathMatch[1]) : 2;
    this.state = {
      modalTestOptions: {
        visible: false,
        title: trans("global.initiateTest", "发起测验"),
        footer: null,
        onCancel: () => {
          const { modalTestOptions } = this.state;
          this.setState({
            modalTestOptions: {
              ...modalTestOptions,
              visible: false,
            },
          });
        },
      },
      // window.open(
      //   `${window.location.origin}/#/examAnalysis/${this.state.jumpExamPaperId}/1`
      // );
      modalTestProps: {
        clickLaunchOnline: this.clickLaunchOnline,
        clickMachine: this.dispatchMachine,
        clickDotMatrixPen: this.clickDotMatrixPen,
        clickTestPaperOnline: this.clickTestPaperOnline,
        clickDownloadTestPaper: this.clickDownloadTestPaper,
        isSegmentation: null, //配置弹窗是否能够发起机阅测验
      },
      initiateMachineTestOptions: {
        visible: false,
        title: trans("global.initiateMachine", "发起机阅测验"),
        wrapClassName: "modalMachineTest",
        width: 700,
        onOk: () => {
          const { initiateMachineTestOptions } = this.state;

          this.setState({
            initiateMachineTestOptions: {
              ...initiateMachineTestOptions,
              visible: false,
            },
          });
          if (window.top) {
            window.top.location.href = `${window.top.origin}/#/examAnalysis`;
          }
        },
        onCancel: () => {
          const { initiateMachineTestOptions } = this.state;
          this.setState({
            initiateMachineTestOptions: {
              ...initiateMachineTestOptions,
              visible: false,
            },
          });
        },
      },
      initiateMachineTestModalProps: {
        paperId: null,
      },
      modalOnlineTestOptions: {
        visible: false,
        width: 700,
        title: trans("global.launchOnlineQuiz", "发起线上测验"),
        onCancel: () => {
          const { modalOnlineTestOptions } = this.state;
          this.setState({
            modalOnlineTestOptions: {
              ...modalOnlineTestOptions,
              visible: false,
            },
          });
        },
        onOk: () => {
          const { modalOnlineTestOptions } = this.state;
          this.setState({
            modalOnlineTestOptions: {
              ...modalOnlineTestOptions,
              visible: false,
            },
          });
          if (window.top) {
            window.top.location.href = `${window.top.origin}/#/examAnalysis`;
          }
        },
      },
      modalOnlineTestProps: {
        paperId: "",
      },
      importPaperUploadModalVisible: false,
      modalDotMatrixPenOptions: {
        visible: false,
        width: 700,
        title: trans("global.editTestSettings", "编辑测验设置"),
        onCancel: () => {
          const { modalDotMatrixPenOptions } = this.state;
          this.setState({
            modalDotMatrixPenOptions: {
              ...modalDotMatrixPenOptions,
              visible: false,
            },
          });
        },
        onOk: () => {
          const { modalDotMatrixPenOptions } = this.state;
          this.setState({
            modalDotMatrixPenOptions: {
              ...modalDotMatrixPenOptions,
              visible: false,
            },
          });
        },
      },
      modalDotMatrixPenProps: {
        paperId: "",
      },
      // 搜索
      check: this.tab, //我的试卷/全部试卷
      stageId: 0, //学期
      gradeId: 0, //年级
      courseId: 0, //学科
      scrollTop: "",
      defaultSemester: {},
      examName: "",
      // 列表
      IconFont: null,
      modifyTest: false, //修改试卷弹层显示
      isSetGrades: false, //修改成绩分段弹出框
      isDownloadTest: false, // 下载试卷
      isKnowledgeLiteracy: false, // 导入知识素养
      inquireId: null, //试卷id
      fileId: null,
      downloadInquireId: null, //导入知识素养id
      paperId: null,
      literacyFail: false, //素养失败弹出框
      disabled: true, //素养按钮禁用
      filelist: null,
      visible: false, //更多下拉菜单
      delId: null, // 删除id
      isspining: false,
      newfileList: [],
      spining: false,
      testName: "",
      exampleId: null,
      publishStatus: false,
      viewData: {},
      examTestId: null,
      jumpExamPaperId: null,
      isExamTitle: false,
      subjectValue: null,
      examType1: null,
      titleVal: "",
      loading: false,
      currentItem: null,
      similarPaperPermission: false,
    };
    this.page = 1;
    this.pageSize = 50;
    this.downloadTestList = []; //下载试卷列表
    this.url = "";
    this.ocrPollingTimer = null;
    this.pageRefreshing = false;
  }

  componentDidMount() {
    this.props.dispatch({
      type: "home/getErrorMsg",
    });

    this.props
      .dispatch({
        type: "home/getOptions",
      })
      .then(() => {
        const { examOptions } = this.props;
        let examOptionsList = [];
        examOptionsList = examOptions.filter((item) => item.current === true);
        this.setState(
          {
            defaultSemester:
              examOptions && examOptions.length > 0 ? examOptions[0] : {},
            stageId:
              examOptionsList && examOptionsList.length > 0
                ? examOptionsList[0].semesterId
                : 0,
          },
          () => {
            this.getPage();
          },
        );
      });

    this.props.dispatch({
      type: "home/getAllTestSubject",
      payload: this.state.gradeId,
    });

    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });

    this.setState({
      IconFont: IconFonts,
    });

    // 获取校级配置，决定列表是否拥有平行卷操作权限
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
                  "Parallel test paper generation",
                )
              ) {
                this.setState({
                  similarPaperPermission: true,
                });
              }
              if (item.childModuleCodeList.includes("AI_EXAM_MAKE_PAPER")) {
                this.setState({
                  AI_EXAM_MAKE_PAPER: true,
                });
              }
            }
          }
        }
      } else {
        message.error(res.message);
      }
    });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  componentWillUnmount() {
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.stopOcrPolling();
  }

  handleVisibilityChange = () => {
    if (document.hidden) {
      this.stopOcrPolling();
      return;
    }
    this.getPage();
  };

  getCurrentPageExamList = () => {
    const { paperList } = this.props;
    return paperList && Array.isArray(paperList.examList)
      ? paperList.examList
      : [];
  };

  hasProcessingOcrTask = () =>
    this.getCurrentPageExamList().some((item) =>
      isPaperAiRecognitionProcessing(item),
    );

  isSelectedPaperRecognizing = () => {
    const { jumpExamPaperId } = this.state;
    if (!jumpExamPaperId) {
      return false;
    }

    const selectedPaper = this.getCurrentPageExamList().find(
      (item) => String(item?.id) === String(jumpExamPaperId),
    );
    return isPaperAiRecognitionProcessing(selectedPaper);
  };

  startOcrPolling = () => {
    if (this.ocrPollingTimer || document.hidden) {
      return;
    }
    this.ocrPollingTimer = window.setInterval(() => {
      if (this.pageRefreshing || document.hidden) {
        return;
      }
      this.getPage();
    }, OCR_POLL_INTERVAL);
  };

  stopOcrPolling = () => {
    if (!this.ocrPollingTimer) {
      return;
    }
    window.clearInterval(this.ocrPollingTimer);
    this.ocrPollingTimer = null;
  };

  syncOcrPolling = () => {
    if (document.hidden || !this.hasProcessingOcrTask()) {
      this.stopOcrPolling();
      return;
    }
    this.startOcrPolling();
  };

  clickLaunchOnline = () => {
    if (this.isSelectedPaperRecognizing()) {
      return;
    }

    const {
      modalOnlineTestOptions,
      modalOnlineTestProps,
      modalTestOptions,
      paperId,
    } = this.state;
    this.setState({
      modalOnlineTestOptions: {
        ...modalOnlineTestOptions,
        visible: true,
      },
      modalOnlineTestProps: {
        ...modalOnlineTestProps,
        paperId: paperId,
      },
      modalTestOptions: {
        ...modalTestOptions,
        visible: false,
      },
    });
  };

  clickDotMatrixPen = () => {
    const {
      modalDotMatrixPenOptions,
      modalTestOptions,
      modalDotMatrixPenProps,
      paperId,
    } = this.state;
    this.setState({
      modalDotMatrixPenOptions: {
        ...modalDotMatrixPenOptions,
        visible: true,
      },
      modalDotMatrixPenProps: {
        ...modalDotMatrixPenProps,
        paperId: paperId,
      },
      modalTestOptions: {
        ...modalTestOptions,
        visible: false,
      },
    });
  };

  dispatchMachine = () => {
    const {
      initiateMachineTestOptions,
      modalTestProps,
      paperId,
      modalTestOptions,
      initiateMachineTestModalProps,
    } = this.state;
    if (modalTestProps.isSegmentation) {
      this.setState({
        initiateMachineTestOptions: {
          ...initiateMachineTestOptions,
          visible: true,
        },
        initiateMachineTestModalProps: {
          ...initiateMachineTestModalProps,
          paperId: paperId,
        },
        modalTestOptions: {
          ...modalTestOptions,
          visible: false,
        },
      });
    }
  };

  // 切换
  switchTab = (check) => {
    this.setState(
      {
        check,
      },
      () => {
        window.location.href = `${window.origin}/exam#/testPaperManagement/${check}`;
        this.getPage();
      },
    );
  };

  // 更新
  getPage = (callBack) => {
    if (this.pageRefreshing) {
      if (callBack) callBack();
      return Promise.resolve();
    }
    const { check, stageId, gradeId, courseId, examName } = this.state;
    this.pageRefreshing = true;
    return this.props
      .dispatch({
        type: "home/getPaperList",
        payload: {
          semesterId: stageId === 0 ? null : stageId, //学期id
          gradeId: gradeId === 0 ? null : gradeId, //年级id
          examTypeCode:
            this.props.typeValue === 0 ? null : this.props.typeValue, //考试类型code
          subjectId: courseId === 0 ? null : courseId, //科目id
          examName: examName, //试卷名字
          viewType: check === 0 ? null : check, //我的/全部试卷
          pageNo: this.page, //pageNo是当前页码
          limit: this.pageSize, //limit是每页的数据数量
        },
      })
      .then(() => {
        this.getCardStatus = true;
        this.syncOcrPolling();
        if (callBack) callBack();
      })
      .finally(() => {
        this.pageRefreshing = false;
      });
  };

  // 学期
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
        scrollTop: "",
        defaultSemester: newSemester,
        gradeId: 0,
        courseId: 0,
      },
      () => this.getPage(),
    );
  };

  // 年级
  changeGrade = (value) => {
    this.setState(
      {
        gradeId: value,
        scrollTop: 0,
      },
      () => {
        this.props.dispatch({
          type: "home/getAllTestSubject",
          payload: {
            gradeId: this.state.gradeId,
          },
          onSuccess: (res) => {
            if (res) {
              let index = res.findIndex(
                (item) => item.id == this.state.courseId,
              );
              if (index === -1) {
                this.setState({
                  courseId: 0,
                });
              }
              this.getPage();
            }
          },
        });
      },
    );
  };

  // 学科
  changeCourse = (value) => {
    this.setState(
      {
        courseId: value,
        scrollTop: 0,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };

  // 类型
  changeType = (value) => {
    this.props
      .dispatch({
        type: "home/changeSearch",
        payload: {
          typeValue: value,
        },
      })
      .then(() => {
        this.page = 1;
        this.setState({
          scrollTop: 0,
        });
        this.getPage();
      });
  };

  // 搜索
  changeSearch = (e) => {
    this.setState({
      examName: e.target.value,
    });
  };

  onSearch = (value) => {
    this.getPage();
  };

  // 修改成绩
  changeModify = (id) => {
    this.setState({
      modifyTest: !this.state.modifyTest,
      inquireId: id,
      visible: false,
    });
  };

  // 分页
  onShowSizeChange = (current, pageSize) => {
    this.page = 1;
    this.pageSize = pageSize;
    this.getPage();
  };

  changeNo = (value, pageSize) => {
    this.page = value;
    this.getPage();
  };

  //设置成绩分档
  clickSetGrades = (id) => {
    this.setState({
      isSetGrades: !this.state.isSetGrades,
      paperId: id,
    });
  };

  // 下载试卷
  clickDownloadTest = (id, item) => {
    this.setState(
      {
        currentItem: item,
        isDownloadTest: true,
      },
      () => {
        this.props
          .dispatch({
            type: "home/historyTestList",
            payload: {
              paperId: id,
            },
          })
          .then(() => {
            const { historyTestList } = this.props;
            let newHistoryTestList = JSON.parse(
              JSON.stringify(historyTestList),
            );
            // this.downloadTestList = historyTestList;
            for (const [index, value] of newHistoryTestList.entries()) {
              value["originalTest"] = "下载";
              value["printingTest"] = "下载";
            }
            this.props.dispatch({
              type: "home/changeHistoryTestList",
              payload: {
                historyTestList: newHistoryTestList,
              },
            });
          });
      },
    );
  };

  // 确定
  okTest = (e) => {
    this.setState({
      isDownloadTest: false,
    });
  };

  // 取消
  cancelTest = (e) => {
    this.setState({
      isDownloadTest: false,
    });
  };

  // 确定
  okKnowledgeLiteracy = (e) => {
    this.props
      .dispatch({
        type: "home/getAttainmentTest",
        payload: {
          fileId: this.state.fileId,
          paperId: this.state.downloadInquireId,
        },
      })
      .then(() => {
        if (this.props.attainmentTest === null) {
          this.cancelKnowledgeLiteracy();
          this.setState({
            isKnowledgeLiteracy: false,
          });
          message.success(trans("scoreImport.importSuccess", "导入成功"));
          this.getPage();
        } else {
          this.setState({
            literacyFail: true,
          });
          const { attainmentTest } = this.props;
          let newAttainmentTest = JSON.parse(JSON.stringify(attainmentTest));
          let array = [];
          newAttainmentTest?.map((item) => {
            array.push({ lineNumber: item, mistake: "错误内容文案" });
          });
          this.props.dispatch({
            type: "home/changeAttainmentTest",
            payload: {
              attainmentTest: array,
            },
          });
        }
      });
  };

  // 重新提交
  Resubmit = () => {
    this.setState({
      literacyFail: false,
      disabled: true,
    });
  };

  // 取消
  cancelKnowledgeLiteracy = (e) => {
    this.setState({
      isKnowledgeLiteracy: false,
      literacyFail: false,
      disabled: this.props.qualityFileModel?.fileId ? false : true,
    });
    if (this.state.filelist) {
      this.setState({
        disabled: false,
      });
    } else {
      this.setState({
        disabled: true,
      });
    }
  };

  // 删除
  delOk = (id) => {
    this.setState({
      deleteLoading: true,
    });
    this.props
      .dispatch({
        type: "home/DeleteTestList",
        payload: { paperId: id },
      })
      .then((res) => {
        this.setState({
          deleteLoading: false,
          deleteId: null,
        });
        this.getPage();
      });
  };

  // 取消删除
  cancelDeletion = (e) => {
    this.setState({
      deleteLoading: false,
      deleteId: null,
    });
  };

  handleMenuClick = (e) => {
    if (e.key === "1") {
      this.setState({ visible: false });
    }
  };

  //上传
  changupload = (info) => {
    let file = info.file;
    let fileList = [...info.fileList];
    this.setState({
      filelist: info.file,
    });
    fileList = fileList.slice(-1);

    fileList = fileList.map((file) => {
      if (file.response) {
        // Component will show file.url as link
        file.url = file.response.url;
        this.setState({
          fileId: file.response.content[0].fileId,
        });
      }
      return file;
    });

    this.setState({
      disabled: false,
      newfileList: fileList,
    });
  };

  // 下载素养模板
  clickDownloadTemplate = () => {
    let url = `${window.location.origin}/api/paper/export/template?paperId=${this.state.downloadInquireId}`;
    window.location.href = url;
  };

  openPaperDetail = (paperId) => {
    window.open(buildHashRouteUrl(buildPaperEditorPreviewPath(paperId)));
  };

  previewPaperDetail = (item) => {
    this.openPaperDetail(item.id);
  };

  previewOriginalPaper = async (item) => {
    try {
      await this.props.dispatch({
        type: "home/getViewOrDownPaper",
        payload: {
          paperId: item.id,
        },
      });

      if (this.props.viewOrDownPaper.url) {
        window.open(this.props.viewOrDownPaper.url);
        return;
      }
    } catch (error) {
      void error;
    }

    message.error(
      trans("global.originalPaperPreviewUnavailable", "当前原卷暂不可预览"),
    );
  };

  publishCancel = () => {
    this.setState({
      publishStatus: false,
    });
  };

  returnMyTest = () => {
    this.setState(
      {
        publishStatus: false,
      },
      () => {
        window.location.reload();
      },
    );
  };

  view = () => {
    const {
      viewData: { item },
    } = this.state;
    this.props.dispatch(
      routerRedux.push(
        `/dataAnalysis/${item.examId || null}/${item.id || null}/1`,
      ),
    );
  };

  onlineQuizClick = () => {
    window.location.href = `${window.location.origin}/exam#/twoWayTest`;
  };

  //AI组卷
  openAiGeneratePaper = () => {
    let leftPos = screen.width - 500;
    window.open(`${window.location.origin}#/aiGeneratePaper`);
  };

  // 点击在线查看试卷
  clickTestPaperOnline = () => {
    this.openPaperDetail(this.state.jumpExamPaperId);
  };

  clickDownloadTestPaper = () => {
    this.props
      .dispatch({
        type: "home/getViewOrDownPaper",
        payload: {
          paperId: this.state.jumpExamPaperId,
        },
      })
      .then(() => {
        if (this.props.viewOrDownPaper.url) {
          window.open(this.props.viewOrDownPaper.url);
        } else {
          void downloadExamPaperPdf({
            paperId: this.state.jumpExamPaperId,
          });
        }
      });
  };

  doubleClickExamName = (id, e) => {
    e.stopPropagation();
    console.log(111);
    let state = Object.assign({}, this.state);
    state[`isExamTitle${id}`] = true;
    this.setState(
      {
        ...state,
      },
      () => {
        const titleInp = document.querySelector("#headerInputPaper");
        titleInp.focus();
      },
    );
  };

  blueInputTitle = (id, e) => {
    let state = Object.assign({}, this.state);
    state[`isExamTitle${id}`] = false;
    this.props
      .dispatch({
        type: "home/getEditPaperOrExamName",
        payload: {
          examPaperId: id,
          name: e.target.value,
        },
      })
      .then(() => {
        this.setState({
          ...state,
        });
        this.getPage();
      });
  };
  downloadTest = (record, text, herfUrl) => {
    this.props
      .dispatch({
        type: "home/getExamLog",
        payload: {
          paperId: record.paperId,
          type: text,
          examNum: record.examNum,
        },
      })
      .then(() => {
        window.open(herfUrl);
      });
  };

  initiateTestChange = (item) => {
    console.log(item, 1);
    const { modalTestOptions, modalTestProps } = this.state;
    this.setState({
      jumpExamPaperId: item.id,
      subjectValue: item.subjectId,
      examType1: item.type,
      modalTestOptions: {
        ...modalTestOptions,
        visible: true,
      },
      modalTestProps: {
        ...modalTestProps,
        isSegmentation: item.isSegmentation,
      },
      paperId: item.id,
    });
  };

  importPaperChange = () => {
    this.setState({
      importPaperUploadModalVisible: true,
    });
  };

  closeImportPaperUploadModal = () => {
    this.setState({
      importPaperUploadModalVisible: false,
    });
  };

  handleImportPaperUploadConfirm = () => {
    this.page = 1;
    this.getPage();
    this.closeImportPaperUploadModal();
  };

  optionChange = (value) => {
    if (value.scanStatus == 0) {
      paperEndScan({
        examPaperId: this.state.currentItem?.id,
        examNum: value.examNum,
      }).then((res) => {
        if (res.status) {
          message.success(trans("global.operateSuccess", "操作成功"));
          this.clickDownloadTest(
            this.state.currentItem?.id,
            this.state.currentItem,
          );
        }
      });
    } else if (value.scanStatus == 1 || value.scanStatus == 3) {
      paperStartScan({
        examPaperId: this.state.currentItem?.id,
        examNum: value.examNum,
      }).then((res) => {
        if (res.status) {
          message.success(trans("global.operateSuccess", "操作成功"));
          this.clickDownloadTest(
            this.state.currentItem?.id,
            this.state.currentItem,
          );
        } else {
          message.error(res.message);
        }
      });
    }
  };
  render() {
    const {
      examOptions,
      testSubject,
      paperList,
      historyTestList,
      attainmentTest,
      allGrade,
      currentUser,
    } = this.props;
    const {
      check,
      defaultSemester,
      IconFont,
      modifyTest,
      inquireId,
      testName,
      exampleId,
      viewData,
      examTestId,
    } = this.state;
    const canShowSchoolRestrictedAction =
      canShowAiRecognitionAction(currentUser);
    let device = window.yg;
    return (
      <div className={styles.testPaper}>
        <Spin spinning={this.state.spining}>
          <div className={styles.paperContent}>
            <div className={styles.navBox}>
              <div
                className={styles.searchBar}
                id="testPaperSearchBar"
                data-block="搜索栏"
              >
                <div className={styles.filterToolbar}>
                  {/* 切换 */}
                  <span className={styles.viewBox}>
                    <span
                      onClick={() => this.switchTab(1)}
                      className={[
                        styles.viewTab,
                        check === 1 ? styles.isCheck : "",
                      ].join(" ")}
                      data-type="我的试卷"
                    >
                      {trans("test.myTest", "我的试卷")}
                    </span>
                    <span
                      onClick={() => this.switchTab(2)}
                      className={[
                        styles.viewTab,
                        check === 2 ? styles.isCheck : "",
                      ].join(" ")}
                      data-type="全部试卷"
                    >
                      {trans("test.allTest", "全部试卷")}
                    </span>
                  </span>
                  {/* 搜索 */}
                  <span
                    className={[styles.inline, styles.semesterSelect].join(" ")}
                    data-type="全部学期"
                  >
                    <Select
                      onChange={this.changeStage}
                      value={this.state.stageId}
                      dropdownMatchSelectWidth={false}
                    >
                      <Option value={0} key={0}>
                        {trans("global.allSemester", "全部学期")}
                      </Option>
                      {examOptions && examOptions.length > 0
                        ? examOptions.map((item) => (
                            <Option
                              value={item.semesterId}
                              key={item.semesterId}
                            >
                              <span title={item.semesterName}>
                                {item.semesterName}
                              </span>
                            </Option>
                          ))
                        : null}
                    </Select>
                  </span>
                  <span
                    className={[styles.inline, styles.allGrade].join(" ")}
                    data-type="全部年级"
                  >
                    <Select
                      onChange={this.changeGrade}
                      value={this.state.gradeId}
                      width={148}
                      dropdownMatchSelectWidth={false}
                    >
                      <Option value={0} key={0}>
                        {trans("global.allGrade", "全部年级")}
                      </Option>
                      {defaultSemester.gradeList &&
                      defaultSemester.gradeList.length > 0
                        ? defaultSemester.gradeList.map((item) => (
                            <Option value={item.gradeId} key={item.gradeId}>
                              <span title={item.gradeName}>
                                {item.gradeName}
                              </span>
                            </Option>
                          ))
                        : null}
                    </Select>
                  </span>
                  <span className={styles.inline} data-type="全部学科">
                    <Select
                      value={this.state.courseId}
                      style={{ width: 148 }}
                      onChange={this.changeCourse}
                      dropdownMatchSelectWidth={false}
                    >
                      <Option value={0} key={0}>
                        <span title={trans("global.allSubject", "全部学科")}>
                          {trans("global.allSubject", "全部学科")}
                        </span>
                      </Option>
                      {testSubject &&
                        testSubject.length &&
                        testSubject.map((item) => (
                          <Option value={item.id} key={item.id}>
                            <span title={item.name}>{item.name}</span>
                          </Option>
                        ))}
                    </Select>
                  </span>
                  <span className={styles.inline} data-type="全部类型">
                    <Select
                      value={this.props.typeValue}
                      style={{ width: 130 }}
                      onChange={this.changeType}
                      dropdownMatchSelectWidth={false}
                    >
                      <Option value={0}>
                        {trans("global.allType", "全部类型")}
                      </Option>
                      {defaultSemester.examType &&
                        defaultSemester.examType.length &&
                        defaultSemester.examType.map((item) => (
                          <Option
                            value={item.examTypeCode}
                            key={item.examTypeCode}
                          >
                            <span title={item.examTypeName}>
                              {item.examTypeName}
                            </span>
                          </Option>
                        ))}
                    </Select>
                  </span>
                  <span className={styles.search} data-type="搜索试卷">
                    <Search
                      placeholder={trans("global.searchPapers", "搜索试卷")}
                      allowClear
                      value={this.state.examName}
                      onChange={this.changeSearch}
                      onSearch={this.onSearch}
                      style={{ width: 130 }}
                    />
                  </span>
                </div>
                <div
                  className={
                    device == "ipad" ? styles.ipadTestLine : styles.testLine
                  }
                >
                  {canShowImportPaperAction(currentUser) ? (
                    <span
                      className={styles.importTest}
                      onClick={this.importPaperChange}
                    >
                      {trans("global.importTest", "导入试卷")}
                    </span>
                  ) : null}
                  <Dropdown
                    // visible={true}
                    getPopupContainer={() =>
                      document.querySelector("#testPaperSearchBar")
                    }
                    placement="bottomRight"
                    overlay={() => {
                      return (
                        <Menu>
                          <Menu.Item
                            key="1"
                            data-type="线上测验"
                            onClick={this.onlineQuizClick}
                          >
                            <div className={styles.dropTitle}>
                              {trans("global.twoWayTest", "细目表组卷")}
                            </div>
                            <span className={styles.trans}>
                              {trans(
                                "global.onlineMakeEx",
                                "先设置试卷的细目表，再选题组卷",
                              )}
                            </span>
                          </Menu.Item>
                          {this.state.AI_EXAM_MAKE_PAPER ? (
                            <Menu.Item
                              key="2"
                              data-type="AI组卷"
                              onClick={this.openAiGeneratePaper}
                            >
                              <div className={styles.dropTitle}>
                                {trans("global.aiGeneratePaperTitle", "AI组卷")}
                              </div>
                              <span className={styles.trans}>
                                {trans(
                                  "global.aiGeneratePaperTips",
                                  "输入试卷的要求，借助AI自动生成试卷，方便高效，尤其适合题量少的小测验。",
                                )}
                              </span>
                            </Menu.Item>
                          ) : null}
                        </Menu>
                      );
                    }}
                  >
                    <span
                      // className="initiateTest"
                      className={styles.importTest}
                      id="initiateTest1"
                      style={{ cursor: "pointer" }}
                    >
                      {trans("global.onlineMake", "组卷")}
                      <Icon style={{ marginLeft: "6px" }} type="down" />
                    </span>
                  </Dropdown>
                  <div
                    data-type="机阅测验"
                    className={styles.importTest}
                    onClick={() =>
                      this.setState({ modifyTest: true, ReviseUpload: 2 })
                    }
                  >
                    {trans("global.uploadTestPaper", "机阅测验")}
                  </div>
                  <span
                    className={styles.importTest}
                    id="makeCard"
                    data-type="制作答题卡"
                  >
                    <a
                      href="http://129.211.106.195:1234/#/datika"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {trans("global.makeCard", "制作答题卡")}
                    </a>
                  </span>
                </div>
              </div>

              {/* 列表 */}
              <div className={styles.testMapList} id="listBox">
                {paperList?.examList && paperList?.examList.length ? (
                  paperList?.examList.map((item) => (
                    <PaperCard
                      key={item.id}
                      item={item}
                      isIpad={device == "ipad"}
                      canShowSchoolRestrictedAction={
                        canShowSchoolRestrictedAction
                      }
                      similarPaperPermission={this.state.similarPaperPermission}
                      onPreviewDetail={this.previewPaperDetail}
                      onPreviewPdf={this.previewOriginalPaper}
                      onEditConfig={this.changeModify}
                      onInitiateTest={this.initiateTestChange}
                      onOpenDownloadHistory={this.clickDownloadTest}
                      onRefresh={this.getPage}
                      onResetToFirstPageAndRefresh={() => {
                        this.page = 1;
                        this.getPage();
                      }}
                      onDelete={this.delOk}
                      onShowDeleteConfirm={(id) =>
                        this.setState({ deleteId: id })
                      }
                      onCancelDeletion={this.cancelDeletion}
                      deleteId={this.state.deleteId}
                      deleteLoading={this.state.deleteLoading}
                    />
                  ))
                ) : this.props.paperStatus ? (
                  IconFont ? (
                    <div className={styles.noTest}>
                      <div className={styles.iconBox}>
                        <IconFont
                          type="icon-chengguoweikong"
                          className={styles.noSourceIcon}
                        />{" "}
                      </div>
                      {trans("global.noTest", "暂时没有试卷")}
                    </div>
                  ) : null
                ) : null}
              </div>
              <div className={styles.pagination}>
                <Pagination
                  size="small"
                  current={this.page}
                  pageSize={this.pageSize}
                  pageSizeOptions={[50, 100, 150, 200]}
                  total={paperList?.totalNum || 0}
                  onChange={this.changeNo}
                  showSizeChanger
                  showQuickJumper
                  onShowSizeChange={this.onShowSizeChange}
                />
              </div>
              {viewData && viewData.subjectId && exampleId ? (
                <Modal
                  title={""}
                  footer={null}
                  getContainer={false}
                  // centered={true}
                  visible={this.state.publishStatus}
                  closable={false}
                  maskClosable={false}
                  destroyOnClose={true}
                  // onCancel={this.publishCancel}
                  width="480px"
                  className={styles.studyModal}
                >
                  <StudyActivity
                    viewData={viewData}
                    testName={testName}
                    exampleId={exampleId}
                    onCancel={this.publishCancel}
                    returnMyTest={this.returnMyTest}
                    view={this.view}
                    examId={examTestId}
                  />
                </Modal>
              ) : null}
              {modifyTest ? (
                <ExamSetting
                  examVisble={this.state.modifyTest}
                  changeExamModal={this.changeModify}
                  dispatch={this.props.dispatch}
                  inquireId={inquireId}
                  getPage={this.getPage}
                  defaultSemester={this.state.defaultSemester}
                />
              ) : null}
              {/* 成绩分段弹出框 */}
              <div className={styles.visSet}>
                {this.state.isSetGrades ? (
                  <ScoreSetting
                    isSetGrades={this.state.isSetGrades}
                    clickSetGrades={this.clickSetGrades}
                    source={"list"}
                    id={this.state.paperId}
                  />
                ) : null}
              </div>
              {/* 下载试卷 */}
              <div className={styles.downloadTestPaperModal}>
                <Modal
                  title={trans("global.downloadTestPaper", "下载打印试卷")}
                  visible={this.state.isDownloadTest}
                  onOk={this.okTest}
                  width={800}
                  onCancel={this.cancelTest}
                  footer={[]}
                  wrapClassName={styles.downloadTest}
                >
                  <Table dataSource={historyTestList} pagination={false}>
                    <Column
                      title={trans("global.versionNumber", "版本号")}
                      width={130}
                      dataIndex="examNum"
                      key="examNum"
                      render={(text, record) => (
                        <Tooltip title={text}>
                          <div
                            style={{
                              maxWidth: "130px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {text}
                          </div>
                        </Tooltip>
                      )}
                    />
                    <Column
                      title={trans("global.creationTime", "创建时间")}
                      dataIndex="createDate"
                      key="createDate"
                    />
                    <Column
                      title={trans("global.status", "状态")}
                      dataIndex="scanMessage"
                      key="scanMessage"
                      render={(text, record) => (
                        <span>
                          {text}&nbsp;
                          <span
                            className={styles.downloadSpan}
                            onClick={() => {
                              this.optionChange(record);
                            }}
                          >
                            {
                              {
                                0: trans("global.stopScanning", "结束扫描"),
                                1: trans("global.startScanning", "打开扫描"),
                                3: trans("global.startScanning", "打开扫描"),
                              }[record.scanStatus]
                            }
                          </span>
                        </span>
                      )}
                    />
                    <Column
                      title={trans("global.originalVolume", "原卷")}
                      dataIndex="originalTest"
                      key="originalTest"
                      render={(text, record) => (
                        <span
                          // href={`${window.location.origin}/api/insert/exam/log?paperId=${record.paperId}&type=原卷&examNum=${record.examNum}`}
                          // target="_blank"
                          className={styles.downloadSpan}
                          onClick={() =>
                            this.downloadTest(record, "原卷", record.wordFile)
                          }
                        >
                          {trans("global.download", "下载")}
                        </span>
                      )}
                    />
                    <Column
                      title={trans("global.printedVolume", "印刷卷")}
                      dataIndex="printingTest"
                      key="printingTest"
                      render={(text, record) =>
                        record.needMark ? (
                          <span>{trans("global.download", "下载")}</span>
                        ) : (
                          <span
                            // href={`${window.location.origin}/api/insert/exam/log?paperId=${record.paperId}&type=印刷卷&
                            // target="_blank"
                            className={styles.downloadSpan}
                            onClick={() =>
                              this.downloadTest(
                                record,
                                trans("global.printedVolume", "印刷卷"),
                                record.pdfFile,
                              )
                            }
                          >
                            {trans("global.download", "下载")}
                          </span>
                        )
                      }
                    />
                    <Column
                      title={trans("global.option", "操作")}
                      dataIndex="printingTest"
                      key="printingTest"
                      render={(text, record) => (
                        <div>
                          {record.isMarkShow ? (
                            <span
                              className={styles.downloadSpan}
                              onClick={() =>
                                this.downloadTest(
                                  record,
                                  "批阅打标",
                                  record.makePaperUrl,
                                )
                              }
                            >
                              {trans("global.markingAndMarking", "批阅打标")}
                            </span>
                          ) : null}
                        </div>
                      )}
                    />
                  </Table>
                </Modal>
              </div>
              {/* 导入知识素养 */}
              <div className={styles.visSet}>
                {this.state.literacyFail ? (
                  <Modal
                    title={trans(
                      "global.importKnowledgeLiteracy",
                      "导入知识素养",
                    )}
                    visible={this.state.isKnowledgeLiteracy}
                    onOk={this.okKnowledgeLiteracy}
                    className={styles.importLiteracy}
                    onCancel={this.cancelKnowledgeLiteracy}
                    wrapClassName={styles.importLiteracy}
                    footer={[
                      <Button
                        key="submit"
                        type="primary"
                        onClick={this.Resubmit}
                      >
                        {trans("global.resubmit", "重新提交")}
                      </Button>,
                    ]}
                  >
                    <div>
                      <Table dataSource={attainmentTest} pagination={false}>
                        <Column
                          title={trans("global.lineNumber", "行号")}
                          dataIndex="lineNumber"
                          key="lineNumber"
                        />
                        <Column
                          title={trans("global.error", "错误")}
                          dataIndex="mistake"
                          key="mistake"
                        />
                      </Table>
                    </div>
                  </Modal>
                ) : (
                  <Modal
                    title={trans(
                      "global.importKnowledgeLiteracy",
                      "导入知识素养",
                    )}
                    wrapClassName={styles.importLiteracy}
                    visible={this.state.isKnowledgeLiteracy}
                    // onOk={this.okKnowledgeLiteracy}
                    onCancel={this.cancelKnowledgeLiteracy}
                    // okButtonProps={{ disabled: this.state.disabled }}
                    footer={[
                      <Button key="back" onClick={this.cancelKnowledgeLiteracy}>
                        {trans("global.cancel", "取消")}
                      </Button>,
                      <Button
                        key="submit"
                        type="primary"
                        onClick={this.okKnowledgeLiteracy}
                        disabled={this.state.disabled}
                      >
                        {trans("global.ok", "确定")}
                      </Button>,
                    ]}
                  >
                    <p className={styles.setInstruction}>
                      1.
                      {trans(
                        "global.downloadTheImportTemplateAndFillInTheImportInformationInBatches",
                        "下载导入模板，批量填写导入信息",
                      )}
                    </p>
                    <Button onClick={this.clickDownloadTemplate}>
                      {trans("global.downloadTemplate", "下载模板")}
                    </Button>
                    <p className={styles.information}>
                      2.{" "}
                      {trans(
                        "global.uploadTheCompletedImportInformationForm",
                        "上传填写好的导入信息表",
                      )}
                    </p>
                    <Upload
                      name="files"
                      action="/api/upload_file"
                      onChange={this.changupload.bind(this)}
                      fileList={this.state.newfileList}
                      // onDownload
                    >
                      <Button>{trans("global.selectFile", "选择文件")}</Button>
                    </Upload>
                  </Modal>
                )}
              </div>

              <ModalTest
                modalTestProps={{
                  options: this.state.modalTestOptions,
                  ...this.state.modalTestProps,
                  onlineTestDisabled: this.isSelectedPaperRecognizing(),
                  onlineTestDisabledReason: trans(
                    "global.onlineTestDisabledDuringRecognition",
                    "试卷识别中，暂不可发起线上测验",
                  ),
                }}
              />
              {this.state.initiateMachineTestOptions.visible ? (
                <InitiateMachineTestModal
                  modalMachineTestProps={{
                    options: this.state.initiateMachineTestOptions,
                    ...this.state.initiateMachineTestModalProps,
                  }}
                />
              ) : null}
              {this.state.modalOnlineTestOptions.visible ? (
                <ModalOnlineTest
                  modalOnlineTestProps={{
                    options: this.state.modalOnlineTestOptions,
                    ...this.state.modalOnlineTestProps,
                    dispatch: this.props.dispatch,
                    publicationContract: "V2",
                  }}
                />
              ) : null}
              {this.state.importPaperUploadModalVisible ? (
                <ImportPaperUploadModal
                  visible={this.state.importPaperUploadModalVisible}
                  title={trans("global.importTest", "导入试卷")}
                  onCancel={this.closeImportPaperUploadModal}
                  onConfirm={this.handleImportPaperUploadConfirm}
                  gradeOptions={defaultSemester.gradeList || []}
                  subjectOptions={testSubject || []}
                  paperTypeOptions={defaultSemester.examType || []}
                />
              ) : null}

              {this.state.modalDotMatrixPenOptions.visible ? (
                <ModalDotMatrixPen
                  modalDotMatrixPenProps={{
                    options: this.state.modalDotMatrixPenOptions,
                    ...this.state.modalDotMatrixPenProps,
                    dispatch: this.props.dispatch,
                  }}
                />
              ) : null}
            </div>
          </div>
        </Spin>
      </div>
    );
  }
}

export default connect(({ home, global }) => ({
  testList: home.testList,
  typeValue: home.typeValue,
  courseValue: home.courseValue,
  statusValue: home.statusValue,
  stageList: global.stageList,
  gradeList: global.gradeList,
  subjectList: global.subjectList,
  examOptions: home.examOptions,
  examList: home.examList,
  currentUser: global.currentUser,
  testSubject: home.testSubject,
  paperList: home.paperList,
  deleteTestList: home.deleteTestList,
  inquireTest: home.inquireTest,
  historyTestList: home.historyTestList,
  originalVolumeDownload: home.originalVolumeDownload,
  fileUrl: global.fileUrl,
  attainmentTest: home.attainmentTest,
  downLoadRul: home.downLoadRul,
  paperStatus: home.paperStatus,
  allGrade: home.allGrade,
  subjectListTest: home.subjectListTest,
  examTypeList: home.examTypeList,
  uploadPaper: home.uploadPaper,
  viewOrDownPaper: home.viewOrDownPaper,
}))(TestPaperManagement);

import React from "react";
import {
  Button,
  Checkbox,
  Dropdown,
  Icon,
  Input,
  InputNumber,
  Menu,
  message,
  Modal,
  Pagination,
  Popover,
  Radio,
  Select,
  Spin,
  Table,
  Upload,
} from "antd";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";

import ExamSetting from "../../components/ExamSetting/index";
import StudyActivity from "../../components/PublishToStudents/StudyActivity/index";
import ScoreSetting from "../../components/ScoreSetting/index";
import { locale, trans } from "../../utils/i18n";
import { downloadExamPaperPdf } from "../PaperEditor/paperPdf";
import ModalImportPager from "./components/ModalImportPager";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Option } = Select;
const { Search } = Input;
const { Column } = Table;

class TestPaperManagement extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      // 搜索
      check: 2, //我的试卷/全部试卷
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
      delVisible: false, //删除
      delId: null, // 删除id
      isspining: false,
      newfileList: [
        // {
        //   uid: "-1",
        //   // name: " ",
        //   status: "done",
        // },
      ],
      spining: false,
      importTestIng: false,
      fileList1: [],
      examPaperName: "", //试卷名称
      totalScore: null,
      subjectValue: null,
      courseId1: null,
      examType1: null,
      successful: false,
      testName: "",
      exampleId: null,
      publishStatus: false,
      viewData: {},
      examTestId: null,
      impComPaperId: null,
      jumpExamPaperId: null,
      isLaunch: true,
      isExamTitle: false,
      upVisible: false,
      downloadVisible: false,
      checkWorkList: [],
      workType: [1],
      searchexamName: "",
      upSpining: false,
      pdfList: [],
      modalImportPagerProps: {},
      modalImportPagerOptions: {
        visible: false,
        title: trans("global.importHomework", "导入作业单"),
        onCancel: () => {
          this.setState({
            modalImportPagerOptions: {
              ...this.state.modalImportPagerOptions,
              visible: false,
            },
          });
        },
        onOk: () => {
          this.page = 1;
          this.getPage();
          this.setState({
            modalImportPagerOptions: {
              ...this.state.modalImportPagerOptions,
              visible: false,
            },
          });
        },
      },
    };
    this.page = 1;
    this.pageSize = 50;
    this.downloadTestList = []; //下载试卷列表
    this.url = "";
  }

  componentDidMount() {
    // arr.map((item, index) => {
    //   this.downloadTestList.push(Object.assign({},item,{sex: 'men'}))
    // }))
    const { check, stageId, gradeId, courseId, examName } = this.state;
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
        console.log(examOptionsList);
        this.setState(
          {
            defaultSemester:
              examOptions && examOptions.length > 0 ? examOptions[0] : {},
            // stageId:
            //   examOptionsList && examOptionsList.length
            //     ? examOptionsList[0].semesterId
            //     : 0,
            // gradeId:
            //   examOptions &&
            //   examOptions.length &&
            //   examOptions[0].gradeList &&
            //   examOptions[0].gradeList.length
            //     ? examOptions[0].gradeList[0].gradeId
            //     : 0,
          },
          () => {
            this.props
              .dispatch({
                type: "home/getPaperList",
                payload: {
                  semesterId:
                    this.state.stageId === 0 ? null : this.state.stageId, //学期id
                  gradeId: gradeId === 0 ? null : gradeId, //年级id
                  examTypeCode: null, //考试类型code
                  subjectId: courseId === 0 ? null : courseId, //科目id
                  examName: examName, //试卷名字
                  viewType: check, //我的/全部试卷
                  pageNo: this.page, //pageNo是当前页码
                  limit: this.pageSize, //limit是每页的数据数量
                  loadHomeWork: true,
                },
              })
              .then(() => {
                const { paperList } = this.props;
              });
          },
        );
      });
    this.props
      .dispatch({
        type: "home/getAllTestSubject",
        payload: this.state.gradeId,
      })
      .then(() => {
        const { testSubject } = this.props;
        console.log(testSubject, "ws");
      });

    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState({
      IconFont: IconFonts,
    });
  }
  // 切换
  switchTab = (check) => {
    this.setState(
      {
        check,
      },
      () => this.getPage(),
    );
  };
  // 更新
  getPage = () => {
    const { check, stageId, gradeId, courseId, examName } = this.state;
    this.props
      .dispatch({
        type: "home/getPaperList",
        payload: {
          semesterId: stageId === 0 ? null : stageId, //学期id
          gradeId: gradeId === 0 ? null : gradeId, //年级id
          examTypeCode: null, //考试类型code
          subjectId: courseId === 0 ? null : courseId, //科目id
          examName: examName, //试卷名字
          viewType: check === 0 ? null : check, //我的/全部试卷
          pageNo: this.page, //pageNo是当前页码
          limit: this.pageSize, //limit是每页的数据数量
          loadHomeWork: true, //作业单参数
        },
      })
      .then(() => {
        this.getCardStatus = true;
        // this.page += 1;
      });
  };
  getPageSearch = () => {
    const { check, stageId, gradeId, courseId, searchexamName } = this.state;
    this.props
      .dispatch({
        type: "home/getPaperListSearch",
        payload: {
          semesterId: stageId === 0 ? null : stageId, //学期id
          gradeId: gradeId === 0 ? null : gradeId, //年级id
          examTypeCode: null, //考试类型code
          subjectId: courseId === 0 ? null : courseId, //科目id
          examName: searchexamName, //试卷名字
          viewType: check === 0 ? null : check, //我的/全部试卷
          pageNo: 1, //pageNo是当前页码
          limit: 1000, //limit是每页的数据数量
          loadHomeWork: true, //作业单参数
        },
      })
      .then(() => {
        // this.getCardStatus = true;
        // this.page += 1;
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
        courseId: 0,
      },
      () => {
        this.getPage();
        this.props
          .dispatch({
            type: "home/getAllTestSubject",
            payload: {
              gradeId: this.state.gradeId,
            },
          })
          .then(() => {});
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
    // this.props
    //   .dispatch({
    //     type: "home/getInquireTest",
    //     payload: id,
    //   })
    //   .then(() => {
    //     const { inquireTest } = this.props;
    //   });
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
  // 确定
  handleOk = (e) => {
    this.setState({
      isSetGrades: false,
    });
  };
  // 取消
  handleCancel = (e) => {
    this.setState({
      isSetGrades: false,
    });
  };
  // 下载试卷
  clickDownloadTest = (id) => {
    this.setState(
      {
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
  // 导入知识素养
  clickKnowledgeLiteracy = (item) => {
    if (item.qualityFileModel) {
      this.setState(
        {
          isKnowledgeLiteracy: true,
          downloadInquireId: item.id,
          newfileList: [
            {
              uid: item.qualityFileModel?.fileId || null,
              name: item.qualityFileModel?.fileName || null,
              status: "done",
              url: item.qualityFileModel?.downloadUrl,
            },
          ],
        },
        () => {
          if (this.state.filelist) {
            this.setState({
              disabled: false,
            });
          } else if (item.qualityFileModel?.fileId) {
            this.setState({
              disabled: false,
            });
          } else {
            this.setState({
              disabled: true,
            });
          }
        },
      );
    } else {
      this.setState(
        {
          isKnowledgeLiteracy: true,
          downloadInquireId: item.id,
          newfileList: null,
        },
        () => {
          if (this.state.filelist) {
            this.setState({
              disabled: false,
            });
          } else if (item.qualityFileModel?.fileId) {
            this.setState({
              disabled: false,
            });
          } else {
            this.setState({
              disabled: true,
            });
          }
        },
      );
    }
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
          message.success(trans("homeWorkNew.importSuccess", "导入成功"));
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
  downloadCard = (id) => {
    window.top.open(
      `${window.location.origin}/api/exam/convert/word/export?paperId=${id}`,
    );
    // this.setState({
    //   isspining: true,
    // })
    // this.props.dispatch({
    //   type: 'home/getdownloadUrl',
    //   payload: {
    //     paperId: id,
    //   }
    // }).then(() => {
    //   console.log(this.props.downLoadRul, 'pp');
    //   this.setState({
    //     isspining: false
    //   })
    //   if(this.props.downLoadRul) {
    //     // const a = document.createElement('a');
    //     // console.log(a);
    //     // a.href = this.props.downLoadRul;
    //     // a.target = '_blank';
    //     // a.setAttribute('download', '');
    //     // a.click();
    //     // this.props.dispatch({
    //     //   type: 'home/clearUrl'
    //     // })
    //   }
    // })
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
  // 删除试卷列表
  // clickDeleteTestList = (id) => {
  //   console.log("deltet", id);
  //   this.props
  //     .dispatch({
  //       type: "home/DeleteTestList",
  //       payload: { paperId: id },
  //     })
  //     .then(() => {
  //       this.getPage();
  //     });
  // };
  // 确定删除
  // confirmDeletion = (id) => {
  //   this.props
  //     .dispatch({
  //       type: "home/DeleteTestList",
  //       payload: { paperId: id },
  //     })
  //     .then(() => {
  //       this.getPage();
  //     });
  // };
  // 删除
  delOk = () => {
    this.props
      .dispatch({
        type: "home/DeleteTestList",
        payload: { paperId: this.state.delId },
      })
      .then(() => {
        this.setState({
          delVisible: false,
        });
        this.getPage();
      });
  };
  handleMenuClick = (e) => {
    if (e.key === "1") {
      this.setState({ visible: false });
    }
  };
  handleVisibleChange = (flag) => {
    this.setState({ visible: flag });
  };
  // 取消删除
  cancelDeletion = (e) => {
    this.setState({
      delVisible: false,
    });
  };
  //上传
  changupload = (info) => {
    let file = info.file;
    let fileList = [...info.fileList];
    this.setState({
      filelist: info.file,
    });
    fileList = fileList.slice(-1);
    // console.log("file", info.file);
    // if (info.fileList.length === 2) {
    //   info.fileList = info.fileList.splice(0, 1);
    // }
    // if (
    //   file.status === "done" &&
    //   file.response.status &&
    //   file.response.ifLogin
    // ) {
    //   console.log(file.response.content[0]);
    //   this.setState({
    //     fileId: file.response.content[0].fileId,
    //   });
    // }
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
  // popover 提示
  getContent = (item) => (
    <div>
      <p style={{ color: "#6CBB5A" }}>
        <Icon
          type="check-circle"
          theme="twoTone"
          twoToneColor="#52c41a"
          className={styles.dowicon}
        />
        {trans("homeWorkNew.imported", "已导入")}
      </p>
      <p>{item.qualityFileModel?.fileName}</p>
    </div>
  );
  // 不显示
  noContent = () => (
    <div>
      <p style={{ color: "#ccc" }}>
        {trans(
          "homeWorkNew.knowledgeImportScanTip",
          "试卷扫描完成后，才会回流小题的题号，之后才能导入每个题目的知识素养进行分析",
        )}
      </p>
    </div>
  );
  // 跳转试卷分析
  clickAnalysis = (item) => {
    // console.log(item);
    if (item.pdfOrModelOrOthers == 1) {
      window.open(
        `${window.location.origin}/exam#/detail/true/true/${item.id}`,
      );
    } else if (item.pdfOrModelOrOthers == 0) {
      this.props
        .dispatch({
          type: "home/getViewOrDownPaper",
          payload: {
            paperId: item.id,
          },
        })
        .then(() => {
          window.open(this.props.viewOrDownPaper.url);
        });
    }
  };
  // 点击编辑试卷
  clickEditTest = (item) => {
    window.open(
      `${window.location.origin}/exam#/detail/false/true/${item.subjectId}/${item.id}`,
    );
  };
  ContentTemplate = (item) => {
    if (item.allowPutQualityFileStatus === true) {
      return item.qualityFileModel?.fileId ? (
        <Popover
          overlayClassName="attainment"
          placement="bottomLeft"
          content={this.getContent(item)}
          title={null}
        >
          <a
            className={styles.grades}
            onClick={() => this.clickKnowledgeLiteracy(item)}
          >
            <Icon
              type="check-circle"
              theme="twoTone"
              twoToneColor="#52c41a"
              className={styles.dowicon}
            />
            {trans("global.importKnowledgeLiteracy", "导入知识素养")}
          </a>
        </Popover>
      ) : (
        <a
          className={styles.grades}
          onClick={() => this.clickKnowledgeLiteracy(item)}
        >
          {trans("global.importKnowledgeLiteracy", "导入知识素养")}
        </a>
      );
    } else if (item.allowPutQualityFileStatus === false) {
      return (
        <Popover
          overlayClassName="attainment"
          placement="bottomLeft"
          content={this.noContent()}
          title={null}
        >
          <a
            className={[styles.grades, styles.loadcolor].join(" ")}
            style={{ color: "#bfbfbf" }}
          >
            {trans("global.importKnowledgeLiteracy", "导入知识素养")}
          </a>
        </Popover>
      );
    }
  };
  uploadOnChange = (info) => {
    console.log(info, "ii");
    let file = info.file;
    let { fileList } = this.state;
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      let newList = [];
      newList = file.response.content;
      this.setState({
        fileList: newList,
        uploadSucceeded: true,
      });
      return;
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} ${file.response.message}`);
      window._czc &&
        window._czc.push([
          "_trackEvent",
          "上传附件",
          "添加附件",
          info.file.name,
        ]);
    }
  };
  uploadPdfChange = (info) => {
    console.log(info, "ii");
    let file = info.file;
    let { pdfList } = this.state;
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      let newList = [];
      newList = file.response.content;
      this.setState({
        pdfList: newList,
        uploadSucceeded: true,
      });
      return;
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} ${file.response.message}`);
      window._czc &&
        window._czc.push([
          "_trackEvent",
          "上传附件",
          "添加附件",
          info.file.name,
        ]);
    }
  };
  uploadWork = (info) => {
    let file = info.file;
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      // let newList = [];
      // newList = file.response.content;
      this.setState(
        {
          pageNo: 1,
        },
        () => {
          this.getPage();
        },
      );
      return;
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} ${file.response.message}`);
      window._czc &&
        window._czc.push([
          "_trackEvent",
          "上传附件",
          "添加附件",
          info.file.name,
        ]);
    }
  };
  uploadOnChange1 = (info) => {
    let file = info.file;
    let newList = JSON.parse(JSON.stringify(this.state.fileList1));
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      // console.log("come");
      console.log(newList, file, "ss");
      newList.push(file.response.content.uploadFileResponseModelList[0]);
      console.log(newList, "222");
      this.setState(
        {
          fileList1: [newList[0]],
          impComPaperId: file.response.content.paperId,
          subjectValue: file.response.content.subjectId,
        },
        () => {
          // let fileIdList = [];
          // newList.map((item) => {
          //   fileIdList.push(item.fileId);
          // });
          // this.props.dispatch({
          //   type: "home/PostBindUploadedFile",
          //   payload: {
          //     examId: this.testId,
          //     fileIdList: [file.response.content[0].fileId],
          //   },
          // });
        },
      );
    }
  };
  cleanFile = () => {
    this.setState({
      fileList: {},
    });
  };
  beforeUpload = (maxSize, file) => {
    // if (file.size / 1024 / 1024 <= maxSize) {
    //   return true;
    // } else {
    //   message.info(trans("global.fileLarge", "上传文件过大！"));
    //   return false;
    // }
  };

  // 点击导入试卷
  clickImportTest = () => {
    this.setState(
      {
        importTestIng: true,
      },
      () => {
        this.props.dispatch({
          type: "home/getAllGrade",
          payload: {
            paperId: null,
          },
        });
        this.props.dispatch({
          type: "home/getExamType",
          payload: {
            type: 1,
          },
        });
        this.props.dispatch({
          type: "home/getSubjectList",
        });
      },
    );
  };

  // 点击发起测验
  clickInitiateTest = (item) => {
    this.setState({
      importTestIng: true,
      successful: true,
      jumpExamPaperId: item.id,
      isLaunch: false,
    });
  };

  changeExamName = (e) => {
    this.setState({
      examPaperName: e.target.value,
    });
  };

  changeScore = (value) => {
    this.setState({
      totalScore: value,
    });
  };

  changeSubject = (value) => {
    this.setState(
      {
        subjectValue: value,
      },
      () => {
        // this.props
        //   .dispatch({
        //     type: "home/getAllSubject",
        //     payload: {
        //       gradeIdList: this.state.grade,
        //       subjectId: value,
        //     },
        //   })
        //   .then(() => {
        //     this.setState({
        //       subjectList: this.props.allSubject,
        //       courseIdList: [],
        //       group: [],
        //     });
        //   });
      },
    );
  };

  changeCourse1 = (e) => {
    console.log(e, "ss");
    this.props.dispatch({
      type: "home/getSubjectList",
    });
    this.setState({
      courseId1: e.target.value,
    });
  };

  changeExamType = (e) => {
    this.setState({
      examType1: e.target.value,
    });
  };

  closeCancle = () => {
    this.clearData();
    this.setState({
      importTestIng: false,
      successful: false,
    });
  };

  // 清除导入modal数据
  clearData = () => {
    this.setState({
      fileList1: [],
      examPaperName: "",
      totalScore: null,
      courseId1: null,
      subjectValue: null,
      examType1: null,
      isLaunch: true,
    });
  };

  closeSure = () => {
    const {
      fileList1,
      examPaperName,
      totalScore,
      courseId1,
      subjectValue,
      examType1,
      impComPaperId,
    } = this.state;
    if (!this.state.fileList1[0]?.fileId) {
      message.error(trans("paper.uploadPaperRequired", "请上传试卷"));
      return;
    }
    if (!this.state.examPaperName) {
      message.error(trans("paper.paperNameRequired", "请输入试卷名称"));
      return;
    }
    if (!this.state.totalScore) {
      message.error(trans("paper.totalScoreRequired", "请输入总分"));
      return;
    }
    if (!this.state.courseId1) {
      message.error(trans("paper.gradeRequired", "请选择年级"));
      return;
    }
    if (!this.state.subjectValue) {
      message.error(trans("paper.subjectRequired", "请选择学科"));
      return;
    }
    if (!examType1) {
      message.error(trans("paper.typeRequired", "请选择类型"));
      return;
    }
    this.props
      .dispatch({
        type: "home/postSaveUploadPaper",
        payload: {
          examPaperName: examPaperName,
          totalScore: totalScore,
          gradeId: courseId1,
          subjectId: subjectValue,
          examType: examType1,
          wordUrl: fileList1[0].url,
          uploadFileId: fileList1[0].fileId,
          paperId: impComPaperId ? impComPaperId : null,
        },
      })
      .then(() => {
        this.setState({
          // importTestIng: false,
          successful: true,
          jumpExamPaperId: this.props.uploadPaper.paperId,
        });
      });
  };

  clickLaunchOnline = () => {
    window.open(
      `${window.location.origin}/#/examAnalysis/${this.state.jumpExamPaperId}/1`,
    );
  };

  clickMachine = () => {
    window.open(
      `${window.location.origin}/#/examAnalysis/${this.state.jumpExamPaperId}/2`,
    );
  };

  pushToStu = (item) => {
    // window.open(`${window.location.origin}/#/course`)
    this.setState({
      viewData: { subjectId: (item && item.subjectId) || null, item: item },
      testName: item.title,
      exampleId: item.id,
      publishStatus: true,
      examTestId: item.examId,
    });
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

  // 点击在线查看试卷
  clickTestPaperOnline = () => {
    // this.props
    //   .dispatch({
    //     type: "home/getViewOrDownPaper",
    //     payload: {
    //       paperId: this.state.jumpExamPaperId,
    //     },
    //   })
    //   .then(() => {
    //     if (this.props.viewOrDownPaper.moduleList.length == 0) {
    //       window.open(this.props.viewOrDownPaper.url);
    //     } else {
    // window.open(
    //   `${window.location.origin}/exam#/dataAnalysis/${this.props.uploadPaper.paperId}/${this.props.uploadPaper.paperId}/1/3`
    // );
    if (this.state.examType1 == 10) {
      window.open(
        `${window.location.origin}/exam#/detail/true/true/${this.state.subjectValue}/${this.state.jumpExamPaperId}/true`,
      );
    } else {
      window.open(
        `${window.location.origin}/exam#/detail/true/true/${this.state.subjectValue}/${this.state.jumpExamPaperId}`,
      );
    }

    // }
    // });
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

  clickDownload = (id) => {
    void downloadExamPaperPdf({ paperId: id });
  };
  createCard = (id) => {
    window.open(
      `${window.location.origin}/api/exam/convert/word/export?paperId=${id}`,
    );
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
  changeUpVisible = (id) => {
    if (!this.state.upVisible) {
      this.getPageSearch();
    }
    this.setState({
      upVisible: !this.state.upVisible,
      fileList: [],
      pdfFile: [],
      checkWorkList: id ? [id] : [],
      searchexamName: "",
    });
  };
  changeDownVisible = () => {
    if (!this.state.downloadVisible) {
      this.getPageSearch();
    }
    this.setState({
      downloadVisible: !this.state.downloadVisible,
      checkWorkList: [],
      searchexamName: "",
      workType: [1],
    });
  };
  uploadCard = () => {};
  cancelUp = () => {
    this.changeUpVisible();
  };
  sureUp = () => {
    if (!this.state.fileList || this.state.fileList.length === 0) {
      return message.info(trans("homeWorkNew.selectFileFirst", "请先选择文件"));
    }
    if (!this.state.pdfList || this.state.pdfList.length === 0) {
      return message.info(trans("homeWorkNew.selectPdfFirst", "请先选择PDF"));
    }

    this.setState(
      {
        upSpining: true,
      },
      () => {
        this.props
          .dispatch({
            type: "home/uploadCard",
            payload: {
              examPaperAnswerSheetFileId: this.state.fileList[0].fileId,
              paperIdList: this.state.checkWorkList,
              examPaperAnswerSheetPdfFileId: this.state.pdfList[0].fileId,
            },
          })
          .then(() => {
            this.setState(
              {
                upSpining: false,
              },
              () => {
                this.changeUpVisible();
              },
            );
          });
      },
    );
  };
  cancelDown = () => {
    this.changeDownVisible();
  };
  sureDown = () => {
    this.changeDownVisible();
  };
  changeWorkList = (id, e) => {
    console.log(id, e, "da");
    let newList = JSON.parse(JSON.stringify(this.state.checkWorkList));
    if (e.target.checked) {
      newList.push(id);
    } else {
      let index_ = null;
      newList.map((item, index) => {
        if (item === id) {
          index_ = index;
        }
      });
      newList.splice(index_, 1);
    }
    this.setState(
      {
        checkWorkList: newList,
      },
      () => {
        console.log(this.state.checkWorkList);
      },
    );
  };
  changeWorkType = (checkedValues) => {
    console.log("checked =", checkedValues);
    this.setState({
      workType: checkedValues,
    });
  };
  searchValue = (value) => {
    this.setState(
      {
        searchexamName: value,
      },
      () => {
        this.getPageSearch();
      },
    );
  };
  importPaperChange = () => {
    const { modalImportPagerProps, modalImportPagerOptions } = this.state;
    this.setState(
      {
        modalImportPagerOptions: {
          ...modalImportPagerOptions,
          visible: true,
        },
        modalImportPagerProps: {
          ...modalImportPagerProps,
        },
      },
      () => {
        console.log(modalImportPagerOptions);
      },
    );
  };
  render() {
    const {
      examOptions,
      testSubject,
      paperList,
      paperSearchList,
      inquireTest,
      historyTestList,
      attainmentTest,
      currentUser,
      allGrade,
      subjectListTest,
      examTypeList,
    } = this.props;
    const {
      check,
      defaultSemester,
      IconFont,
      modifyTest,
      inquireId,
      examPaperName,
      totalScore,
      subjectValue,
      courseId1,
      examType1,
      successful,
      testName,
      exampleId,
      viewData,
      examTestId,
      isLaunch,
      upVisible,
      downloadVisible,
      fileList,
      workType,
      checkWorkList,
    } = this.state;
    let newGradeList = [];
    allGrade &&
      allGrade.length &&
      allGrade.map((item) => {
        newGradeList.push({
          label: language ? item.gradeName : item.gradeEnName,
          value: item.gradeId,
        });
      });
    const plainOptions = [
      { label: trans("global.workList", "作业单"), value: 1 },
      { label: trans("global.workCard", "作业单"), value: 2 },
    ];
    const uploadProperties = {
      name: "file",
      action: "/api/upload_file",
      multiple: true,
      accept: "file/*",
      showUploadList: false,
      headers: {
        authorization: "authorization-text",
      },
      onChange: this.uploadOnChange,
      beforeUpload: this.beforeUpload.bind(this, 20),
    };
    const uploadPdfProperties = {
      name: "file",
      action: "/api/upload_file",
      multiple: true,
      accept: ".pdf",
      showUploadList: false,
      headers: {
        authorization: "authorization-text",
      },
      onChange: this.uploadPdfChange,
      beforeUpload: this.beforeUpload.bind(this, 20),
    };
    const upWorkProperties = {
      name: "file",
      action: "/api/upload_file",
      multiple: true,
      accept: "file/*",
      showUploadList: false,
      headers: {
        authorization: "authorization-text",
      },
      onChange: this.uploadWork,
      beforeUpload: this.beforeUpload.bind(this, 20),
    };
    const uploadPropertiesImportTest = {
      name: "files",
      action: "/api/word/upload_analysis_word",
      showUploadList: false,
      onChange: this.uploadOnChange1.bind(this),
    };
    let device = window.yg;
    console.log(this.props.uploadPaper.wordUrl, "333");
    return (
      <div className={styles.testPaper}>
        <Spin spinning={this.state.spining}>
          <div className={styles.paperContent}>
            <div className={styles.navBox}>
              <div
                className={styles.searchBar}
                style={device == "ipad" ? {} : { height: "40px" }}
                data-block="搜索栏"
              >
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
                    {trans("test.myHomeWork", "我的作业")}
                  </span>
                  <span
                    onClick={() => this.switchTab(2)}
                    className={[
                      styles.viewTab,
                      check === 2 ? styles.isCheck : "",
                    ].join(" ")}
                    data-type="全部试卷"
                  >
                    {trans("test.schoolWork", "校本作业")}
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
                  >
                    <Option value={0} key={0}>
                      {trans("global.allSemester", "全部学期")}
                    </Option>
                    {examOptions && examOptions.length > 0
                      ? examOptions.map((item) => (
                          <Option value={item.semesterId} key={item.semesterId}>
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
                  >
                    <Option value={0} key={0}>
                      {trans("global.allGrade", "全部年级")}
                    </Option>
                    {defaultSemester.gradeList &&
                    defaultSemester.gradeList.length > 0
                      ? defaultSemester.gradeList.map((item) => (
                          <Option value={item.gradeId} key={item.gradeId}>
                            <span title={item.gradeName}>{item.gradeName}</span>
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
                {/* <span className={styles.inline} data-type="全部类型">
                  <Select
                    value={this.props.typeValue}
                    style={{ width: 148 }}
                    onChange={this.changeType}
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
                </span> */}
                <span className={styles.search} data-type="搜索试卷">
                  <Search
                    placeholder={trans("global.searchPapers", "搜索试卷")}
                    allowClear
                    value={this.state.examName}
                    onChange={this.changeSearch}
                    onSearch={this.onSearch}
                    style={{ width: 148 }}
                  />
                </span>
                <span
                  className={styles.importTest}
                  style={{ marginLeft: "14px" }}
                  onClick={this.importPaperChange}
                >
                  {trans("global.importHomework", "导入作业单")}
                </span>
                {/* {currentUser && currentUser.reviewExamAnalysisPower ? (
                  <span
                    className={[styles.inline, styles.uploadWord].join(" ")}
                  >
                    <Upload {...uploadProps}>
                      <div className={styles.uploadWordButton}>
                        {trans("global.uploadWord", "上传Word试卷")}
                      </div>
                    </Upload>
                  </span>
                ) : null} */}
                {/* <span className={styles.btn}> */}
                {/* <span
                  className={styles.uploadBtn}
                  onClick={() =>
                    this.setState({ modifyTest: true, ReviseUpload: 2 })
                  }
                >
                  上传试卷
                </span>
                <span className={styles.makeBtn}>制作答题卡</span> */}
                {/* <span
                  className={
                    device == "ipad" ? styles.ipadTestLine : styles.testLine
                  }
                >
                  <span
                    className={[styles.inline, styles.makeExam].join(" ")}
                    data-type="上传试卷"
                  >
                    <div
                      className={styles.makeCardButton}
                      onClick={this.changeDownVisible}
                    >
                      {trans("global.batchDownload", "批量下载")}
                    </div>
                  </span>
                </span> */}

                {/* </span> */}
              </div>
              {/* 列表 */}
              <div className={styles.testMapList} id="listBox">
                {paperList?.examList && paperList?.examList.length ? (
                  paperList?.examList.map((item, index) => (
                    <div
                      className={[styles.mapBox, "listItem"].join(" ")}
                      key={index}
                      style={device == "ipad" ? { paddingBottom: "30px" } : {}}
                    >
                      <Link
                        className={styles.workMessageBox}
                        to={`/detail/true/true/${item.id}`}
                        target="_blank"
                      >
                        <span
                          className={[styles.inline, styles.messageBox].join(
                            " ",
                          )}
                          // style={device == "ipad" ? { width: "500px" } : {}}
                        >
                          <div
                          // style={{ marginBottom: "14px" }}
                          >
                            {/* <span className={styles.header}>{item.title}</span> */}
                            {/* {!this.state[`isExamTitle${item.id}`] ? ( */}
                            <span
                              className={styles.header}
                              // onClick={(e) =>
                              //   this.doubleClickExamName(item.id, e)
                              // }
                            >
                              {item.title}
                            </span>
                            <span
                              to={`/detail/true/true/${item.id}`}
                              target="_blank"
                            >
                              <Icon
                                type="eye"
                                style={{ color: "#0445fc", marginLeft: 6 }}
                              />
                            </span>
                            {/* ) : (
                              <Input
                                className={styles.headerInput}
                                id="headerInputPaper"
                                // value={item.examName}
                                // onChange={(e) =>
                                //   this.examNameChange(item.examId, e)
                                // }
                                onClick={(e) => e.preventDefault()}
                                onBlur={(e) => this.blueInputTitle(item.id, e)}
                              />
                            )} */}
                          </div>
                          <div
                            className={styles.content}
                            // style={{ marginTop: "5px" }}
                          >
                            <span
                              className={[
                                styles.examTypeBox,
                                styles.green,
                              ].join(" ")}
                            >
                              {item.examTypeName}
                            </span>
                            <span
                              className={[styles.inline, styles.time].join(" ")}
                            >
                              <i className={styles.iconfont}>&#xe61f;</i>
                              {item.createDate}
                            </span>
                            <span
                              className={[styles.inline, styles.time].join(" ")}
                            >
                              <i className={styles.iconfont}>&#xe708;</i>
                              {item.subjectName}
                            </span>
                            <span
                              className={[
                                styles.inline,
                                styles.time,
                                styles.grade,
                              ].join(" ")}
                            >
                              <i className={styles.iconfont}>&#xe745;</i>
                              {item.gradeName}
                            </span>
                            <span
                              className={[styles.inline, styles.time].join(" ")}
                            >
                              <Icon type="user" />
                              {item.createUserName}
                            </span>
                            <span
                              className={[styles.inline, styles.time].join(" ")}
                            >
                              <i className={styles.iconfont}>&#xe7fe;</i>
                              {item.examNum}
                            </span>
                          </div>
                        </span>
                      </Link>

                      <div className={styles.downloadBox}>
                        <div
                          className={styles.download}
                          style={{ minWidth: "80px" }}
                        >
                          {/* {item.sourceType == 0 && !item.publishStatus ? ( */}
                          {/* <div
                            className={styles.initiateTest}
                            onClick={() => this.clickInitiateTest(item)}
                          >
                            <i
                              className={styles.iconfont}
                              style={{ fontSize: "14px", color: "#0445FC" }}
                            >
                              &#xe85c;
                            </i>
                            <span
                              className={[styles.grades, styles.dir].join(" ")}
                            >
                              {trans("global.initiateTest", "发起测验")}
                            </span>
                          </div> */}
                          {/* ) : item.sourceType == 0 && item.publishStatus ? (
                            <div
                              className={styles.initiateTest}
                              onClick={() => this.pushToStu(item)}
                            >
                              <i
                                className={styles.iconfont}
                                style={{ fontSize: "14px", color: "#0445FC" }}
                              >
                                &#xe85c;
                              </i>
                              <span
                                className={[styles.grades, styles.dir].join(
                                  " "
                                )}
                              >
                                {trans("global.goPushToStu", "继续推送")}
                              </span>
                            </div>
                          ) : null} */}
                        </div>
                        <div className={styles.download} data-block="试卷操作">
                          {/* {item.showDownloadAnswerSheet &&
                          item.examTypeCode &&
                          item.examTypeCode !== 1 ? (
                            <a
                              className={styles.grades}
                              onClick={this.downloadCard.bind(this, item.id)}
                              data-type="下载答题卡"
                            >
                              {trans("global.downLoadCard", "下载答题卡")}
                            </a>
                          ) : null} */}
                          {/* {item.examTypeCode && item.examTypeCode !== 1 ? (
                            <a
                              className={styles.grades}
                              onClick={() => this.changeModify(item.id)}
                              data-type="上传答题卡"
                            >
                              {trans("global.uploadCard", "上传答题卡")}
                            </a>
                          ) : null} */}
                          {/* {item.examTypeCode && item.examTypeCode !== 1 ? (
                            <a
                              className={styles.grades}
                              onClick={() => this.clickDownloadTest(item.id)}
                              data-type="下载试卷"
                            >
                              {trans("global.downloadTestPaper", "下载试卷")}
                            </a>
                          ) : null} */}

                          {/* {this.ContentTemplate(item)} */}
                          {/* {item.examId ? ( */}
                          {/* <div
                            className={styles.testPaperAnalysis}
                            onClick={() => this.clickAnalysis(item)}
                          >
                            <i
                              className={styles.iconfont}
                              style={{ fontSize: "14px", color: "#0445FC" }}
                            >
                              &#xe85d;
                            </i>
                            <sapn
                              className={[styles.grades, styles.dir].join(" ")}
                              data-type="试卷分析"
                            >
                              {trans("global.preview", "预览")}
                            </sapn>
                          </div> */}

                          {/* ) : null} */}

                          {/* {item.allowPutQualityFileStatus ? (
                          item.qualityFileModel?.fileId ? (
                            <Popover
                              placement="bottomLeft"
                              content={this.getContent(item)}
                              title={null}
                            >
                              <a
                                className={styles.grades}
                                onClick={() =>
                                  this.clickKnowledgeLiteracy(item)
                                }
                              >
                                <Icon
                                  type="check-circle"
                                  theme="twoTone"
                                  twoToneColor="#52c41a"
                                  className={styles.dowicon}
                                />
                                导入知识素养
                              </a>
                            </Popover>
                          ) : (
                            <a
                              className={styles.grades}
                              onClick={() => this.clickKnowledgeLiteracy(item)}
                            >
                              导入知识素养
                            </a>
                          )
                        ) : (
                          <Popover
                            placement="bottomLeft"
                            content={this.noContent()}
                            title={null}
                          >
                            <a
                              className={[styles.grades, styles.loadcolor].join(
                                " "
                              )}
                              style={{ color: "#bfbfbf" }}
                              onClick={() => this.clickKnowledgeLiteracy(item)}
                            >
                              导入知识素养
                            </a>
                          </Popover>
                        )} */}

                          {/* <a
                          className={styles.grades}
                          onClick={this.clickSetGrades.bind(this, item.paperId)}
                        >
                          设置成绩分档
                        </a> */}
                        </div>
                        <div style={{ minWidth: "52px" }}>
                          {/* {item.examTypeCode && item.examTypeCode !== 1 ? ( */}
                          <div
                            // to={`/detail/false/true/${item.subjectId}/${item.id}`}
                            className={styles.editTestPaperBox}
                            onClick={() => this.clickDownload(item.id)}
                          >
                            <i
                              className={styles.iconfont}
                              style={{ fontSize: "14px", color: "#0445FC" }}
                            >
                              &#xe7c6;
                            </i>
                            <span
                              className={styles.editTestPaper}
                              data-type="下载"
                            >
                              {trans("global.downloadHomeWork", "下载作业")}
                            </span>
                          </div>
                          {/* ) : null} */}
                        </div>
                        <div style={{ minWidth: "52px" }}>
                          {/* {item.examTypeCode && item.examTypeCode !== 1 ? ( */}
                          <div
                            // to={`/detail/false/true/${item.subjectId}/${item.id}`}
                            className={styles.editTestPaperBox}
                            onClick={() => this.createCard(item.id)}
                          >
                            <i
                              className={styles.iconfont}
                              style={{ fontSize: "14px", color: "#0445FC" }}
                            >
                              &#xe7c6;
                            </i>
                            <span
                              className={styles.editTestPaper}
                              data-type="下载"
                            >
                              {trans("global.createCard", "生成答题卡")}
                            </span>
                          </div>
                          {/* ) : null} */}
                        </div>
                        <div style={{ minWidth: "52px" }}>
                          {/* {item.examTypeCode && item.examTypeCode !== 1 ? ( */}
                          <div
                            // to={`/detail/false/true/${item.subjectId}/${item.id}`}
                            className={styles.editTestPaperBox}
                            onClick={() => this.changeUpVisible(item.id)}
                          >
                            <i
                              className={styles.iconfont}
                              style={{ fontSize: "14px", color: "#0445FC" }}
                            >
                              &#xe87a;
                            </i>
                            <span
                              className={styles.editTestPaper}
                              data-type="下载"
                            >
                              {trans("global.uploadCard", "继续推送")}
                            </span>
                          </div>
                          {/* ) : null} */}
                        </div>
                        <div style={{ minWidth: "66px" }}>
                          <div
                            // to={`/detail/false/true/${item.subjectId}/${item.id}`}
                            className={styles.editTestPaperBox}
                            onClick={() => this.clickDownloadTest(item.id)}
                          >
                            <i
                              className={styles.iconfont}
                              style={{ fontSize: "14px", color: "#0445FC" }}
                            >
                              &#xe7c6;
                            </i>
                            <span
                              className={styles.editTestPaper}
                              data-type="答题卡"
                            >
                              {trans("global.downLoadCard", "下载答题卡")}
                            </span>
                          </div>
                        </div>

                        {item.examId ? (
                          <Link
                            to={`/dataAnalysis/${item.examId || null}/${
                              item.id || null
                            }/2`}
                            target="_blank"
                          >
                            <div className={styles.testPaperAnalysis}>
                              <i
                                className={styles.iconfont}
                                style={{
                                  fontSize: "14px",
                                  color: "#0445FC",
                                }}
                              >
                                &#xe85e;
                              </i>
                              <span
                                className={[styles.grades, styles.dir].join(
                                  " ",
                                )}
                              >
                                {trans("global.analytical", "分析")}
                              </span>
                            </div>
                          </Link>
                        ) : (
                          <div style={{ width: "100px" }}></div>
                        )}

                        {/* <div style={{ minWidth: "52px" }}>
                          {item.isEdit ? (
                            <div
                              // to={`/detail/false/true/${item.subjectId}/${item.id}`}
                              className={styles.editTestPaperBox}
                              onClick={() => this.clickEditTest(item)}
                            >
                              <i
                                className={styles.iconfont}
                                style={{ fontSize: "14px", color: "#0445FC" }}
                              >
                                &#xe7a1;
                              </i>
                              <span
                                className={styles.editTestPaper}
                                data-type="编辑试卷"
                              >
                                {trans("global.edit", "编辑")}
                              </span>
                            </div>
                          ) : (
                            <div
                              // to={`/detail/false/true/${item.subjectId}/${item.id}`}
                              className={styles.editTestPaperBox}
                              onClick={() => this.changeModify(item.id)}
                            >
                              <i
                                className={styles.iconfont}
                                style={{ fontSize: "14px", color: "#0445FC" }}
                              >
                                &#xe7a1;
                              </i>
                              <span
                                className={styles.editTestPaper}
                                data-type="编辑试卷"
                              >
                                {trans("global.edit", "编辑")}
                              </span>
                            </div>
                          )}
                        </div> */}
                        {/* 
                        <div style={{ minWidth: "52px" }}>
                          <div
                            className={styles.deleteTestPaperBox}
                            onClick={() =>
                              this.setState({
                                delVisible: true,
                                delId: item.id,
                              })
                            }
                          >
                            <i
                              className={styles.iconfont}
                              style={{ fontSize: "14px", color: "#0445FC" }}
                            >
                              &#xe7a8;
                            </i>
                            <span
                              className={[styles.deleteTestPaper].join(" ")}
                              data-type="删除试卷"
                            >
                              {trans("global.delete", "删除")}
                            </span>
                          </div>
                        </div> */}
                      </div>
                      <div
                        id="testMenu"
                        className={styles.testMenu}
                        data-block="更多"
                      >
                        <Dropdown
                          overlay={() => {
                            return (
                              <Menu onClick={this.handleMenuClick}>
                                {/* <Menu.Item key="4" data-type="复制试卷">
                                      {trans("global.copyTest", "复制试卷")}
                                    </Menu.Item> */}
                                {/* <Menu.Item
                                      onClick={() => this.changeModify(item.id)}
                                      key="1"
                                      data-type="修改试卷"
                                    >
                                      {trans(
                                        "global.reviseTestPaper",
                                        "修改试卷"
                                      )}
                                    </Menu.Item> */}
                                {
                                  <Menu.Item key="3" data-type="编辑试卷">
                                    <Link
                                      to={`/detail/false/true/${item.subjectId}/${item.id}`}
                                      target="_blank"
                                    >
                                      {trans("global.editHomeWork", "编辑试卷")}
                                    </Link>
                                  </Menu.Item>
                                }

                                <Menu.Item
                                  key="2"
                                  data-type="删除试卷"
                                  onClick={() =>
                                    this.setState({
                                      delVisible: true,
                                      delId: item.id,
                                    })
                                  }
                                >
                                  {/* <Popconfirm
                                      title="确定删除当前试卷?"
                                      autoAdjustOverflow
                                      onConfirm={() =>
                                        this.confirmDeletion(item.id)
                                      }
                                      onCancel={this.cancelDeletion}
                                      okText="确定"
                                      cancelText="取消"
                                      placement="top"
                                    >
                                      删除试卷
                                    </Popconfirm> */}
                                  {trans("global.deleteHomeWork", "删除试卷")}
                                </Menu.Item>
                              </Menu>
                            );
                          }}
                          placement="bottomRight"
                          getPopupContainer={() =>
                            document.querySelector("#testMenu")
                          }
                        >
                          {/* <span
                                className="ant-dropdown-link"
                                
                              >
                                {trans("global.more", "更多")}
                                <Icon
                                  style={{ marginLeft: "6px" }}
                                  type="down"
                                /> </span>*/}
                          <i
                            className={[styles.iconfont, styles.more].join(" ")}
                            onClick={(e) => e.preventDefault()}
                            // style={{ display: "none" }}
                          >
                            &#xe6fd;
                          </i>
                        </Dropdown>
                      </div>
                    </div>
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
                      {trans("global.noHomework", "暂时没有试卷")}
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
                  width={600}
                  onCancel={this.cancelTest}
                  footer={[]}
                  wrapClassName={styles.downloadTest}
                >
                  <Table dataSource={historyTestList} pagination={false}>
                    <Column
                      title={trans("global.versionNumber", "版本号")}
                      // width={80}
                      dataIndex="examNum"
                      key="examNum"
                    />
                    <Column
                      title={trans("global.creationTime", "创建时间")}
                      dataIndex="createDate"
                      key="createDate"
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
                      render={(text, record) =>
                        record.isMarkShow ? (
                          <span
                            // href={`${window.location.origin}/api/insert/exam/log?paperId=${record.paperId}&type=批阅打标&examNum=${record.examNum}`}
                            // target="_blank"
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
                        ) : null
                      }
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
              {/* 删除试卷 */}
              <Modal
                title={trans("global.deleteTestPaper", "删除试卷")}
                visible={this.state.delVisible}
                onOk={this.delOk}
                wrapClassName={styles.delModal}
                onCancel={this.cancelDeletion}
              >
                <p>
                  {trans(
                    "global.areYouSureToDeleteTheCurrentTestPaper",
                    "确定删除当前试卷?",
                  )}
                </p>
                <Button type="primary" onClick={this.delOk}>
                  {trans("global.ok", "确定")}
                </Button>
                <Button type="primary" onClick={this.cancelDeletion}>
                  {trans("global.cancel", "取消")}
                </Button>
              </Modal>
              {/* 导入试卷 */}
              <Modal
                title={
                  isLaunch ? (
                    trans("global.importTest", "导入试卷")
                  ) : (
                    <div>{("global.initiateTest", "发起测验")}</div>
                  )
                }
                visible={this.state.importTestIng}
                onCancel={this.closeCancle}
                className={styles.importTestModel}
                getContainer={false}
                width={1000}
                centered={true}
                footer={
                  successful ? (
                    false
                  ) : (
                    <div className="footer">
                      <button onClick={this.closeCancle} className="cancle">
                        {trans("global.cancle")}
                      </button>
                      <button onClick={this.closeSure} className="sure">
                        {trans("global.sure")}
                      </button>
                    </div>
                  )
                }
              >
                {successful ? (
                  <div className="successBody">
                    <div className="operateSuccess">
                      {isLaunch ? (
                        <div>
                          <Icon
                            type="check-circle"
                            style={{
                              fontSize: "28px",
                              color: "#52C41A",
                              marginRight: 15,
                            }}
                          />
                          <span className="successTip">
                            {trans("global.operateSuccess", "操作成功")}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="operateButton">
                      <span className="onlineBOx">
                        <span className="lanTit">
                          {trans("global.onlineQuiz", "线上测验")}
                        </span>
                        <span className="onlineTip">
                          {trans(
                            "global.launchOnlineQuizTest",
                            "以任务的形式发送给学生，学生在线完成答题，系统实时生成分析数据",
                          )}
                        </span>
                        <span
                          className="onlineBut"
                          onClick={this.clickLaunchOnline}
                        >
                          {trans("global.launchOnlineQuiz", "发起线上测验")}
                        </span>
                      </span>
                      <span className="machineBox">
                        {/* <span className="incomplete">功能未完成</span> */}
                        <span className="lanTit">
                          {trans("global.machineReadingTest", "机阅测验")}
                        </span>
                        <span className="print">
                          {trans(
                            "global.initiateMachineTest",
                            "需打印成纸质试卷，阅卷完成后，将考卷放入指定的阅卷机器完成数据分析",
                          )}
                        </span>
                        <span
                          className="machineTest"
                          // onClick={this.clickMachine}
                        >
                          {trans("global.initiateMachine", "发起机阅测验")}
                        </span>
                      </span>
                      <span className="testBtn">
                        <span className="lanTit">
                          {trans("global.otherOptions", "其他选项")}
                        </span>
                        <span
                          className="online"
                          onClick={this.clickTestPaperOnline}
                        >
                          {trans("global.testPaperOnline", "在线查看试卷")}
                        </span>
                        <span
                          className="download"
                          // href={this.props.uploadPaper.wordUrl}
                          // href="https://www.baidu.com"
                          // target="_blank"
                          onClick={this.clickDownloadTestPaper}
                        >
                          {trans("global.downloadTestPaper", "下载打印试卷")}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="uploadRow">
                      <div style={{ minWidth: "120px" }} className="chooseFile">
                        {trans("global.chooseFile1", "选择文档")}
                      </div>

                      <div className="uploadImportTest">
                        <Upload {...uploadPropertiesImportTest}>
                          <span className="selectFile">
                            {trans("global.selectFile", "选择文件")}
                          </span>
                        </Upload>
                        {/* <Upload
                          onChange={this.uploadOnChange1.bind(this)}
                          name="files"
                          action="/api/word/upload_analysis_word"
                          fileList={this.state.fileList1}
                        >
                          <span className="selectFile">
                            {trans("global.selectFile", "选择文件")}
                          </span>
                        </Upload> */}
                      </div>
                      {/* <Upload onChange={this.changupload.bind(this)}>
                      <Button type="primary">
                        {trans("global.viewUpload", "浏览")}
                      </Button>
                    </Upload> */}
                      <div className="fileContent">
                        {this.state.fileList1 &&
                        this.state.fileList1[0]?.fileName ? (
                          <span>{this.state.fileList1[0].fileName}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="uploadRow">
                      <span className="radioTitle">
                        {trans("global.examName1", "试卷名称：")}
                      </span>
                      <Input
                        style={{
                          width: "80%",
                          borderRadius: "10px",
                          height: "36px",
                        }}
                        onChange={this.changeExamName}
                        value={examPaperName}
                      />
                    </div>
                    <div className="uploadRow">
                      <div className="radioBox">
                        <span className="radioTitle">
                          {trans("global.manfen", "满分")}
                        </span>
                        <InputNumber
                          onChange={this.changeScore}
                          value={totalScore}
                          style={{ borderRadius: "10px", height: "36px" }}
                        />
                      </div>
                    </div>
                    <div className="uploadRow">
                      <span
                        className="radioTitle"
                        style={
                          newGradeList.length > 9
                            ? { verticalAlign: "top" }
                            : null
                        }
                      >
                        {trans("global.grade", "年级")}
                      </span>
                      {/* <Select
                        showSearch
                        style={{
                          width: 220,
                          borderRadius: "10px",
                          height: "36px",
                        }}
                        placeholder={trans("global.selectGrade", "选择年级")}
                        onChange={this.changeCourse1}
                        // value={courseId1}
                      >
                        {allGrade &&
                          allGrade.length &&
                          allGrade.map((item, index) => (
                            <Option value={item.gradeId}>
                              {language ? item.gradeName : item.gradeEnName}
                            </Option>
                          ))}
                      </Select> */}
                      {/* <Checkbox.Group
                        options={newGradeList}
                        value={courseId1}
                        onChange={this.changeCourse1}
                        style={{ width: "84%" }}
                      /> */}
                      <Radio.Group
                        onChange={this.changeCourse1}
                        value={courseId1}
                        style={{ width: "84%" }}
                      >
                        {allGrade && allGrade.length > 0
                          ? allGrade.map((item) => (
                              <Radio value={item.gradeId}>
                                {language ? item.gradeName : item.gradeEnName}
                              </Radio>
                            ))
                          : null}
                      </Radio.Group>
                    </div>
                    <div className="uploadRow">
                      <span className="radioTitle">
                        {trans("global.subject", "学科")}
                      </span>
                      <Select
                        showSearch
                        style={{
                          width: 220,
                          borderRadius: "10px",
                          height: "36px",
                        }}
                        placeholder={trans(
                          "global.selectDiscipline",
                          "选择学科",
                        )}
                        onChange={this.changeSubject}
                        value={subjectValue}
                      >
                        {/* {subjectListTest && subjectListTest.length
                      ? subjectListTest.map((item) => ( */}
                        {/* <Option value={0}>
                          {trans("global.selectDiscipline", "选择学科")}
                        </Option> */}
                        {/* ))
                      : null} */}
                        {subjectListTest && subjectListTest.length > 0
                          ? subjectListTest.map((item) => (
                              <Option value={item.id}>{item.name}</Option>
                            ))
                          : null}
                      </Select>
                    </div>
                    <div className="uploadRow">
                      <span
                        className="radioTitle"
                        style={
                          examTypeList.length > 8
                            ? { verticalAlign: "top" }
                            : null
                        }
                      >
                        {trans("global.examType1", "类型")}
                      </span>
                      {/* <Select
                        showSearch
                        style={{
                          width: 220,
                          borderRadius: "10px",
                          height: "36px",
                        }}
                        placeholder={trans("global.selectType", "选择类型")}
                        onChange={this.changeExamType}
                        // value={examType1}
                      >
                        {examTypeList &&
                          examTypeList.length &&
                          examTypeList.map((item) => (
                            <Option value={item.code} key={item.code}>
                              {item.typeName}
                            </Option>
                          ))}
                      </Select> */}
                      <Radio.Group
                        onChange={this.changeExamType}
                        value={examType1}
                        style={{ width: "84%" }}
                      >
                        {examTypeList && examTypeList.length > 0
                          ? examTypeList.map((item) => (
                              <Radio value={item.code}>{item.typeName}</Radio>
                            ))
                          : null}
                      </Radio.Group>
                    </div>
                  </>
                )}
              </Modal>
              <Modal
                title={""}
                footer={null}
                getContainer={false}
                // centered={true}
                visible={upVisible}
                closable={false}
                maskClosable={false}
                destroyOnClose={true}
                // onCancel={this.publishCancel}
                width="500px"
                className={styles.studyModal}
              >
                <Spin spinning={this.state.upSpining}>
                  <div className={styles.uploadDom}>
                    <div className={styles.uploadHeader}>
                      <i
                        className={[styles.iconfont, styles.closeIcon].join(
                          " ",
                        )}
                        onClick={this.changeUpVisible}
                      >
                        &#xe6a9;
                      </i>
                      {trans("global.uploadCard")}
                    </div>
                    <div className={styles.uploadContent}>
                      <div className={styles.upFile}>
                        <div className={styles.upTitle}>
                          {trans("global.chooseWord", "选择Word")}
                        </div>
                        {fileList && fileList.length > 0 ? (
                          <div className={styles.fileMessage}>
                            {fileList[0].fileName}
                          </div>
                        ) : null}
                        <Upload {...uploadProperties}>
                          <div className={styles.fileButton}>
                            {trans("global.selectFile", "浏览")}
                          </div>
                        </Upload>
                      </div>
                      <div className={styles.upFile}>
                        <div className={styles.upTitle}>
                          {trans("global.choosePdf", "选择PDF")}
                        </div>
                        {this.state.pdfList && this.state.pdfList.length > 0 ? (
                          <div className={styles.fileMessage}>
                            {this.state.pdfList[0].fileName}
                          </div>
                        ) : null}
                        <Upload {...uploadPdfProperties}>
                          <div className={styles.fileButton}>
                            {trans("global.selectFile", "浏览")}
                          </div>
                        </Upload>
                      </div>
                      <div className={styles.selectMessage}>
                        {trans(
                          "global.selectMessage",
                          "该答题卡的样式如果要通用给其他作业使用，请在下方勾选",
                        )}
                      </div>
                      <div className={styles.searchDom}>
                        <Search
                          placeholder={trans("global.searchWork", "搜索作业单")}
                          onSearch={(value) => this.searchValue(value)}
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div className={styles.workList}>
                        {paperSearchList?.examList &&
                        paperSearchList?.examList.length
                          ? paperSearchList?.examList.map((it) => (
                              <Checkbox
                                checked={checkWorkList.includes(it.id)}
                                onChange={this.changeWorkList.bind(this, it.id)}
                              >
                                {it.title}
                              </Checkbox>
                            ))
                          : null}
                      </div>
                      <div className={styles.uploadBottom}>
                        <div
                          className={styles.cancelButton}
                          onClick={this.cancelUp}
                        >
                          {trans("global.cancle")}
                        </div>
                        <div
                          className={styles.sureButton}
                          onClick={this.sureUp}
                        >
                          {trans("global.ok")}
                        </div>
                      </div>
                    </div>
                  </div>
                </Spin>
              </Modal>
              <Modal
                title={""}
                footer={null}
                getContainer={false}
                // centered={true}
                visible={downloadVisible}
                closable={false}
                maskClosable={false}
                destroyOnClose={true}
                // onCancel={this.publishCancel}
                width="500px"
                className={styles.studyModal}
              >
                <div className={styles.uploadDom}>
                  <div className={styles.uploadHeader}>
                    <i
                      className={[styles.iconfont, styles.closeIcon].join(" ")}
                      onClick={this.changeDownVisible}
                    >
                      &#xe6a9;
                    </i>
                    {trans("global.batchDownload")}
                  </div>
                  <div className={styles.uploadContent}>
                    <div className={styles.upFile}>
                      <div className={styles.upTitle}>
                        {trans("global.downloadContent", "下载内容")}
                      </div>
                      <Checkbox.Group
                        options={plainOptions}
                        defaultValue={workType}
                        onChange={this.changeWorkType}
                      />
                    </div>
                    {/* <div className={styles.selectMessage}>{trans('global.selectMessage', '该答题卡的样式如果要通用给其他作业使用，请在下方勾选')}</div> */}
                    <div className={styles.searchDom}>
                      <Search
                        placeholder={trans("global.searchWork", "搜索作业单")}
                        onSearch={(value) => console.log(value)}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className={styles.workList}>
                      {paperSearchList?.examList &&
                      paperSearchList?.examList.length
                        ? paperSearchList?.examList.map((it) => (
                            <Checkbox
                              checked={checkWorkList.includes(it.id)}
                              onChange={this.changeWorkList.bind(this, it.id)}
                            >
                              {it.title}
                            </Checkbox>
                          ))
                        : null}
                    </div>
                    <div className={styles.uploadBottom}>
                      <div
                        className={styles.cancelButton}
                        onClick={this.cancelDown}
                      >
                        {trans("global.cancle")}
                      </div>
                      <div
                        className={styles.sureButton}
                        onClick={this.sureDown}
                      >
                        {trans("global.ok")}
                      </div>
                    </div>
                  </div>
                </div>
              </Modal>
            </div>
          </div>
        </Spin>
        {this.state.modalImportPagerOptions.visible ? (
          <ModalImportPager
            modalImportPagerProps={{
              options: this.state.modalImportPagerOptions,
              ...this.state.modalImportPagerProps,
            }}
          />
        ) : null}
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
  paperSearchList: home.paperSearchList,
}))(TestPaperManagement);

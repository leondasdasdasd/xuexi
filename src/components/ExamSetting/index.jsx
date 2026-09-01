//数学公式编辑器
import React, { PureComponent } from "react";
import { SearchTeacher } from "@yungu-fed/yungu-selector";
import {
  Button,
  Checkbox,
  Icon,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Spin,
  Upload,
} from "antd";
import { connect } from "dva";

import { getExamConfig, thisSemester } from "../../services/global";
import { locale, trans } from "../../utils/i18n";
import {
  isPaperTitleTooLong,
  PAPER_TITLE_LENGTH_LIMIT_MESSAGE_KEY,
  PAPER_TITLE_MAX_LENGTH,
} from "../../utils/paperTitle";
import { CuModal } from "../Custom";

import "katex/dist/katex.min.css";
import styles from "./index.module.less";
const { TextArea } = Input;
const { Option } = Select;
const stuNoList = ["bazima", "kaoshihao", "barcode"];
const language = locale() == "en" ? false : true;

var date = new Date();
var year = date.getFullYear();
var month = date.getMonth() + 1;
if (month < 7 || month === 7) {
  year -= 1;
}
/**
 *
 * @param inquireTest
 */
export function getPlatformValueFromInquireTest(inquireTest) {
  return inquireTest?.madePlatformUtil ? 1 : 2;
}

export class ExamSetting extends PureComponent {
  constructor() {
    super();
    this.state = {
      mathContent: "",
      fileList: [],
      uploadFile: [],
      examAnswerFile: [],
      subjectValue: "",
      stuNo: 3,
      grade: null,
      semester: null,
      group: [],
      classList: [],
      subjectList: [],
      platform: 1,
      examType: null,
      spin: false,
      secrecy: true,
      showDownLoad: false,
      examPaperName: "",
      courseIdList: [],
      totalScore: null,
      uploadFileId: null,
      examPaperAnswerSheetFileId: null,
      errVisible: false,
      errText: "",
      isCorrection: false,
      markingTeachers: [],
      necessaryTeacherVisible: false,
      teacherNameList: [],
      newTeacherIds: [],
      baseExamNmae: "",
      Dot_Matrix_Pen: false,
      dotMatrixPen: false,
      studentNumber: undefined,
    };
  }

  async componentDidMount() {
    getExamConfig().then((res) => {
      if (res?.content?.Dot_Matrix_Pen === "true") {
        this.setState({
          Dot_Matrix_Pen: true,
        });
      }
    });

    let res = await thisSemester();
    if (res.status) {
      this.setState(
        {
          baseExamNmae: res.content,
        },
        () => {
          this.props.dispatch({
            type: "home/getAllGrade",
            payload: {
              paperId: this.props.inquireId,
            },
          });

          this.props.dispatch({
            type: "home/getExamType",
            payload: {
              type: 1,
            },
          });

          this.props?.inquireId &&
            this.props
              .dispatch({
                type: "home/getInquireTest",
                payload: {
                  paperId: this.props.inquireId,
                },
              })
              .then(() => {
                const { inquireTest } = this.props;
                if (inquireTest.sourceType == 3) {
                  this.setState({
                    dotMatrixPen: true,
                    studentNumber: inquireTest.studentNumber,
                  });
                }

                this.setState(
                  {
                    totalScore: inquireTest.totalScore, //总分
                    courseIdList: inquireTest.courseIdList, //课程
                    group: inquireTest.groupIdList, //班级
                    examType: inquireTest.examType, //类型
                    grade: inquireTest.gradeIdList, //年级
                    subjectValue: inquireTest.subjectId, //学科
                    stuNo: inquireTest.paperId, //学号
                    // 制作方式只映射到 madePlatformUtil，编辑态保留历史值，避免静默改写旧试卷。
                    platform: getPlatformValueFromInquireTest(inquireTest),
                    secrecy: Boolean(inquireTest.whetherOrNotPrivate), //保密要求
                    examPaperAnswerSheetFileId:
                      inquireTest.examPaperAnswerSheetFileId, //试卷fileid

                    fileList: inquireTest.examPaperAnswerSheetFileId
                      ? [
                          {
                            uid: inquireTest.examPaperAnswerSheetFileId || -1,
                            fileId: inquireTest.examPaperAnswerSheetFileId,
                            name: inquireTest.wordName,
                            type: "doc",
                            url: `/api/preview_file?id=${inquireTest.examPaperAnswerSheetFileId}`,
                          },
                        ]
                      : [],

                    uploadFile: inquireTest.paperUploadFileId
                      ? [
                          {
                            uid: inquireTest.paperUploadFileId || -1,
                            fileId: inquireTest.paperUploadFileId,
                            name: inquireTest.paperUploadFileName,
                            type: "doc",
                            url: `/api/preview_file?id=${inquireTest.paperUploadFileId}`,
                          },
                        ]
                      : [],

                    examAnswerFile: inquireTest.examAnswerFileId
                      ? [
                          {
                            uid: inquireTest.examAnswerFileId || -1,
                            fileId: inquireTest.examAnswerFileId,
                            name: inquireTest.examAnswerFileName,
                            type: "doc",
                            url: `/api/preview_file?id=${inquireTest.examAnswerFileId}`,
                          },
                        ]
                      : [],

                    teacherNameList:
                      inquireTest.onlineMarkingManageUserList?.map(
                        (it) => it.userId,
                      ),
                    teacherArr: inquireTest.onlineMarkingManageUserList?.map(
                      (it) => ({
                        teacherId: it.userId,
                        teacherName: it.userName,
                      }),
                    ),
                    newTeacherIds: inquireTest.onlineMarkingManageUserList?.map(
                      (it) => it.userId,
                    ),
                    isCorrection: Boolean(
                      inquireTest.onlineMarkingManageUserList &&
                      inquireTest.onlineMarkingManageUserList.length > 0,
                    ),
                  },
                  () => {
                    this.props?.inquireId &&
                      this.props.dispatch({
                        type: "home/getSubjectByStage",
                        payload: {
                          gradeIdList: this.state.grade,
                          paperId: this.props.inquireId,
                        },
                      });

                    this.props?.inquireId &&
                      this.props
                        .dispatch({
                          type: "home/getAllSubject",
                          payload: {
                            gradeIdList: this.state.grade,
                            subjectId: this.state.subjectValue,
                          },
                        })
                        .then(() => {
                          const { inquireTest } = this.props;
                          let gradeText = "";
                          this.props.allGrade &&
                            this.props.allGrade.length &&
                            this.props.allGrade.map((item) => {
                              if (
                                inquireTest.gradeIdList?.length > 0 &&
                                item.gradeId == inquireTest.gradeIdList[0]
                              ) {
                                gradeText = item.gradeName;
                              }
                            });

                          let subjectText = "";
                          this.props.stageSubjectList &&
                            this.props.stageSubjectList.length &&
                            this.props.stageSubjectList.map((item) => {
                              if (item.id == inquireTest.subjectId) {
                                subjectText = item.name;
                              }
                            });

                          let examText =
                            this.state.baseExamNmae + gradeText + subjectText;
                          let test = inquireTest.examPaperName;
                          let reg2 = new RegExp(examText);
                          let newTest = test.replace(reg2, "");
                          this.setState({
                            examPaperName: newTest,
                            subjectList: this.props.allSubject,
                          });
                        });

                    this.props?.inquireId &&
                      this.props
                        .dispatch({
                          type: "home/getGradeClass",
                          payload: {
                            gradeIdList: this.state.grade,
                            subjectId: this.state.subjectValue,
                            courseIdList: this.state.courseIdList,
                          },
                        })
                        .then(() => {
                          this.setState({
                            classList: this.props.classList,
                          });
                        });
                  },
                );
              });
          this.props.dispatch({
            type: "marking/getListAllOrgTeachers",
          });
        },
      );
    } else {
      message.error(res.message);
    }
  }

  uploadOnChange = ({ file, fileList }, key) => {
    console.log(file, fileList, "ii");

    // 数据埋点
    if (file.status === "error") {
      message.error(`${file.name} ${file.response?.message}`);
      window._czc &&
        window._czc.push([
          "_trackEvent",
          "上传附件",
          "添加附件",
          info.file.name,
        ]);
    }

    // 上传多个文件
    // this.setState({
    //   fileList: fileList.map(file => {
    //     if (file.response && file.response.content) {
    //       file.url = file.response.content[0].url;
    //     }
    //     return file;
    //   })
    // })

    if (file.status === "removed") {
      this.setState({ [key]: [] });
      return;
    }

    // 单文件上传
    this.setState({
      [key]: [
        {
          ...file,
          url: file.response?.content?.[0]?.url,
          fileId: file.response?.content?.[0]?.fileId,
        },
      ],
    });
  };

  cleanFile = () => {
    this.setState({
      fileList: [],
    });
  };
  beforeUpload = (maxSize, file) => {
    if (file.size / 1024 / 1024 <= maxSize) {
      return true;
    } else {
      message.info(trans("global.fileLarge", "上传文件过大！"));
      return false;
    }
  };
  closeModal = () => {
    this.setState(
      {
        fileList: [],
        subjectValue: "",
        stuNo: null,
        grade: null,
        semester: null,
        group: [],
        classList: [],
        subjectList: [],
        platform: null,
        examType: null,
        secrecy: false,
        showDownLoad: false,
      },
      () => {
        this.props.changeExamModal && this.props.changeExamModal();
      },
    );
  };
  changeStuNo = (e) => {
    console.log("radio checked", e.target.value);
    this.setState({
      stuNo: e.target.value,
    });
  };
  changeExamType = (e) => {
    this.setState({
      examType: e.target.value,
    });
  };
  changeExamName = (e) => {
    this.setState({
      examPaperName: e.target.value,
    });
  };
  changePlatform = (e) => {
    console.log("radio checked", e.target.value);
    this.setState({
      platform: e.target.value,
    });
  };
  changeGrade = (checkedValues) => {
    this.props
      .dispatch({
        type: "home/getSubjectByStage",
        payload: {
          gradeIdList: checkedValues,
          paperId: this.props.inquireId,
        },
      })
      .then(() => {
        console.log(this.props.stageSubjectList);
      });
    this.setState({
      grade: checkedValues,
      subjectValue: null,
      // courseIdList: [],
      // group: [],
    });
  };
  changeSubject = (value) => {
    // this.props.dispatch({
    //     type: 'home/getAllSubject',
    //     payload: {
    //         gradeIdList: checkedValues,
    //     }
    // }).then(() => {
    //     this.setState({
    //         subjectList: this.props.allSubject,
    //     })
    // })
    this.setState(
      {
        subjectValue: value,
      },
      () => {
        this.props
          .dispatch({
            type: "home/getAllSubject",
            payload: {
              gradeIdList: this.state.grade,
              subjectId: value,
            },
          })
          .then(() => {
            this.setState({
              subjectList: this.props.allSubject,
              courseIdList: [],
              group: [],
            });
          });
      },
    );
  };
  changeCourse = (value) => {
    this.setState(
      {
        courseIdList: value,
      },
      () => {
        if (this.state.subjectValue) {
          this.props
            .dispatch({
              type: "home/getGradeClass",
              payload: {
                gradeIdList: this.state.grade,
                subjectId: this.state.subjectValue,
                courseIdList: value,
              },
            })
            .then(() => {
              let groupList = [];
              if (this.props.classList && this.props.classList.length > 0) {
                this.props.classList.map((item) => {
                  groupList.push(item.groupId);
                });
              }
              this.setState({
                classList: this.props.classList,
                group: groupList,
              });
            });
        } else {
          message.error(trans("global.selectSubjectFirst", "请先选择学科"));
        }
      },
    );
  };
  changeMarkingTeachers = (value) => {
    this.setState({
      markingTeachers: value,
    });
  };
  changeScore = (value) => {
    this.setState({
      totalScore: value,
    });
  };
  changeSemester = (value) => {
    this.setState({
      semester: value,
    });
  };
  changeClass = (value) => {
    this.setState({
      group: value,
    });
  };
  submit = () => {
    const { mathToImage } = this.props;
    if (!this.state.mathContent) {
      message.error(trans("mathEditor.fillNotBlank", "提交内容不能为空哦~"));
      return false;
    }
    let newContent = String.raw`${this.state.mathContent}`;
    typeof mathToImage == "function" &&
      mathToImage.call(this, newContent, () => {
        this.hideModal();
      });
  };
  changeSecrecy = (e) => {
    console.log(`checked = ${e.target.checked}`);
    this.setState({
      secrecy: e.target.checked,
    });
  };
  changeCorrection = (e) => {
    // console.log(`checked = ${e.target.checked}`);
    this.setState({
      isCorrection: e.target.checked,
    });
  };
  makePaper = () => {
    console.log("ccc", this.props.wordPdfUrl, this.props.modifyTest);
    if (
      this.props.wordPdfUrl.content &&
      this.props.wordPdfUrl.content.makePaperUrl &&
      this.props.wordPdfUrl.content.makePaperUrl !== ""
    ) {
      // const a = document.createElement('a');
      // a.href = this.props.wordPdfUrl;
      // a.download = 'exam.pdf';
      // a.target = '_blank';
      // a.click();
      // console.log('come')
      window.open(this.props.wordPdfUrl.content.makePaperUrl);
    } else if (
      this.props.modifyTest?.content?.makePaperUrl &&
      this.props.modifyTest?.content?.makePaperUrl !== ""
    ) {
      // console.log(this.props.modifyTest);
      // console.log(this.props.modifyTest, 'momo');
      window.open(this.props.modifyTest.content?.makePaperUrl);
    }
    this.closeModal();
  };
  viewExam = () => {
    if (
      this.props.wordPdfUrl?.content?.wordPdfUrl &&
      this.props.wordPdfUrl?.content?.wordPdfUrl !== ""
    ) {
      window.open(this.props.wordPdfUrl.content.wordPdfUrl);
    } else if (
      this.props.modifyTest?.content?.wordPdfUrl &&
      this.props.modifyTest?.content?.wordPdfUrl !== ""
    ) {
      window.open(this.props.modifyTest.content?.wordPdfUrl);
    }
    this.closeModal();
  };
  closeMessage = () => {
    message.destroy();
  };
  surePass = () => {
    if (!this.state.stuNo) {
      message.error(trans("examSetting.studentNumberRequired", "请选择学号"));
      return;
    }
    if (!this.state.grade) {
      message.error(trans("wrongTable.selectGrade", "请选择年级"));
      return;
    }
    if (!this.state.subjectValue) {
      message.error(trans("paper.subjectRequired", "请选择学科"));
      return;
    }
    if (!this.state.group || this.state.group.length === 0) {
      message.error(trans("wrongTable.selectClass", "请选择班级"));
      return;
    }
    if (!this.state.examType) {
      message.error(trans("paper.typeRequired", "请选择类型"));
      return;
    }
    if (!this.state.platform) {
      message.error(
        trans("examSetting.documentFormatRequired", "请选择文档格式"),
      );
      return;
    }
    if (this.state.isCorrection && this.state.teacherNameList.length === 0) {
      message.error(trans("examSetting.teacherRequired", "请选择教师"));
      return;
    }
    if (this.state.uploadFile.length === 0) {
      message.error(trans("examSetting.questionnaireRequired", "请上传问卷"));
      return;
    }
    if (
      this.props.inquireId &&
      !this.state.fileList?.[0]?.fileId &&
      !this.state.examPaperAnswerSheetFileId
    ) {
      message.error(trans("global.uploadAnswerSheetRequired", "请上传答题卡"));
      return;
    }

    let gradeText = "";
    this.props.allGrade &&
      this.props.allGrade.length &&
      this.props.allGrade.map((item) => {
        if (
          this.state.grade?.length > 0 &&
          item.gradeId == this.state.grade[0]
        ) {
          gradeText = item.gradeName;
        }
      });
    let subjectText = "";
    this.props.stageSubjectList &&
      this.props.stageSubjectList.length &&
      this.props.stageSubjectList.map((item) => {
        if (item.id == this.state.subjectValue) {
          subjectText = item.name;
        }
      });

    let examText = this.state.baseExamNmae + gradeText + subjectText;
    if (isPaperTitleTooLong(examText + this.state.examPaperName)) {
      message.error(
        trans(PAPER_TITLE_LENGTH_LIMIT_MESSAGE_KEY, "标题长度超过字数限制"),
      );
      return;
    }

    this.setState({
      spin: true,
    });

    if (this.props.inquireId) {
      const {
        examType,
        examPaperName,
        totalScore,
        grade,
        subjectValue,
        courseIdList,
        group,
        secrecy,
        fileList,
        examPaperAnswerSheetFileId,
      } = this.state;

      this.props
        .dispatch({
          type: "home/ModifyTest",
          payload: {
            paperId: this.props.inquireId,
            examPaperName: examText + examPaperName,
            totalScore: totalScore,
            outStudentNoType: "barcode",
            madePlatformUtil: this.state.platform === 1 ? true : false,
            gradeIdList: grade,
            subjectId: subjectValue,
            courseIdList: courseIdList,
            groupIdList: group,
            examType: examType,
            whetherOrNotPrivate: secrecy,
            wordUrl: fileList[0]?.url || "",
            examPaperAnswerSheetFileId:
              fileList[0]?.fileId || examPaperAnswerSheetFileId,
            onlineMarkingStatus: this.state.isCorrection,
            manageTeacherIdList: this.state.teacherNameList,
            dotMatrixPen: this.state.dotMatrixPen,
            studentNumber:
              this.state.dotMatrixPen === true
                ? this.state.studentNumber
                : undefined,
            paperUploadFileId: this.state.uploadFile?.[0]?.fileId,
            examAnswerFileId: this.state.examAnswerFile?.[0]?.fileId,
          },
        })
        .then(() => {
          this.setState(
            {
              spin: false,
            },
            () => {
              if (this.props.modifyTest.status === true) {
                if (
                  this.props.modifyTest?.content?.wordPdfUrl &&
                  this.props.modifyTest?.content?.wordPdfUrl !== "" &&
                  this.props.modifyTest?.content?.wordPdfUrl !== null
                ) {
                  this.setState({
                    showDownLoad: true,
                  });
                } else {
                  this.setState({
                    showDownLoad: false,
                    platform: null,
                  });
                  this.props.changeExamModal();
                  message.success(trans("global.editSuccess", "修改成功"));
                }
                this.props.getPage();
              } else {
                console.log(111);
                this.setState({
                  errVisible: true,
                  errText: this.props.modifyTest.message || "",
                });
              }
              this.props.getPage && this.props.getPage();
            },
          );
        });
    } else {
      let newPay = {};
      newPay.wordUrl =
        this.state.fileList && this.state.fileList[0]?.url
          ? this.state.fileList[0].url
          : "";
      newPay.paperUploadFileId = this.state.uploadFile?.[0]?.fileId;
      newPay.gradeIdList = this.state.grade;
      newPay.groupIdList = this.state.group;
      newPay.subjectId = this.state.subjectValue;
      newPay.courseIdList = this.state.courseIdList;
      newPay.totalScore = this.state.totalScore;
      newPay.outStudentNoType = this.state.stuNo
        ? stuNoList[this.state.stuNo - 1]
        : null;
      newPay.examType = this.state.examType;
      newPay.examPaperName = examText + this.state.examPaperName;
      newPay.whetherOrNotPrivate = this.state.secrecy;
      newPay.madePlatformUtil = this.state.platform === 1 ? true : false;
      newPay.examPaperAnswerSheetFileId = this.state.fileList[0]?.fileId;
      newPay.onlineMarkingStatus = this.state.isCorrection;
      newPay.manageTeacherIdList = this.state.teacherNameList;
      newPay.dotMatrixPen = this.state.dotMatrixPen;
      newPay.studentNumber = this.state.studentNumber;

      this.props
        .dispatch({
          type: "home/uploadExam",
          payload: newPay,
        })
        .then(() => {
          this.setState(
            {
              spin: false,
            },
            () => {
              console.log(this.props.wordPdfUrl, "333");
              if (this.props.wordPdfUrl.status == true) {
                if (
                  this.props.wordPdfUrl.content?.wordPdfUrl &&
                  this.props.wordPdfUrl.content?.wordPdfUrl !== ""
                ) {
                  this.setState({
                    showDownLoad: true,
                  });
                } else {
                  this.setState({
                    showDownLoad: false,
                  });
                }
                if (window.location.hash === "#/testPaperManagement") {
                  this.props.getPage();
                } else {
                  window.top.location.href = `${window.location.origin}/#/testPaperManagement/1`;
                  this.props.getPage();
                }
                this.props.history &&
                  this.props.history.push("/testPaperManagement/1");
              } else if (this.props.wordPdfUrl.status == false) {
                this.setState({
                  errVisible: true,
                  errText: this.props.wordPdfUrl.message,
                });
              }
              this.props.getPage && this.props.getPage();
            },
          );
        });
    }
  };
  changupload = (info) => {
    this.state.uploadFileId({
      uploadFileId: info.file.originFileObj,
    });
    this.props
      .dispatch({
        type: "global/uploadFile",
        payload: info.file.originFileObj,
      })
      .then(() => {
        console.log("ppp", this.props.fileUrl);
      });
  };
  componentWillUnmount() {
    this.props.dispatch({
      type: "home/clearPdf",
    });
  }
  changeNecessaryTeacherVisible = () => {
    this.setState({
      necessaryTeacherVisible: false,
    });
  };

  clickTeacherName = () => {
    if (this.state.isCorrection) {
      const { teacherArr } = this.state;
      let nameList = [];
      teacherArr &&
        teacherArr.length > 0 &&
        teacherArr.map((item) => {
          nameList.push({
            id: item.teacherId,
            name: item.teacherName,
          });
        });
      this.setState({
        necessaryTeacherVisible: true,
        newTeacherIds: nameList,
      });
    }
  };

  searchTeacherConfirm = (ids) => {
    const { allOrgTeachersList } = this.props;
    let teacherArray = [];
    ids &&
      ids.length > 0 &&
      ids.map((item) => {
        if (allOrgTeachersList && allOrgTeachersList.length > 0) {
          allOrgTeachersList.map((it) => {
            if (item == it.id) {
              teacherArray.push({
                teacherId: it.id,
                teacherName: it.name,
              });
            }
          });
        }
      });

    this.setState(
      {
        teacherNameList: ids,
        teacherArr: teacherArray,
      },
      () => {
        this.changeNecessaryTeacherVisible();
      },
    );
  };

  render() {
    const { visible, allGrade, allSubject, examTypeList, stageSubjectList } =
      this.props;
    const {
      subjectValue,
      grade,
      group,
      classList,
      subjectList,
      examType,
      platform,
      showDownLoad,
      examPaperName,
      totalScore,
      courseIdList,
      necessaryTeacherVisible,
      teacherArr,
      baseExamNmae,
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
    const commonUploadProperties = {
      name: "file",
      action: "/api/upload_file",
      accept: "file/*",
      headers: {
        authorization: "authorization-text",
      },
      beforeUpload: this.beforeUpload.bind(this, 20),
    };

    const uploadProperties = {
      ...commonUploadProperties,
      // 判断是否有文件
      fileList: this.state.fileList || [],
      onChange: (info) => this.uploadOnChange(info, "fileList"),
    };

    const testPaperUploadProperties = {
      ...commonUploadProperties,
      fileList: this.state.uploadFile || [],
      onChange: (info) => this.uploadOnChange(info, "uploadFile"),
    };

    const answerSheetUploadProperties = {
      ...commonUploadProperties,
      fileList: this.state.examAnswerFile || [],
      onChange: (info) => this.uploadOnChange(info, "examAnswerFile"),
    };

    //上传
    let gradeText = "";
    allGrade &&
      allGrade.length &&
      allGrade.map((item) => {
        if (grade?.length > 0 && item.gradeId == grade[0]) {
          gradeText = item.gradeName;
        }
      });
    let subjectText = "";
    stageSubjectList &&
      stageSubjectList.length &&
      stageSubjectList.map((item) => {
        if (item.id == subjectValue) {
          subjectText = item.name;
        }
      });
    let examTypeText = "";
    examTypeList &&
      examTypeList.length &&
      examTypeList.map((item) => {
        if (item.code == examType) {
          examTypeText = item.typeName;
        }
      });
    let semesterText = month > 7 ? "S1" : "S2";

    console.log(year, "tyy");
    // let examText = year + "-" + semesterText + gradeText + subjectText;
    let examText = baseExamNmae + gradeText + subjectText;
    const examNameMaxLength = Math.max(
      PAPER_TITLE_MAX_LENGTH - examText.length,
      0,
    );
    // console.log(examText, "vvv");
    return (
      <div>
        <CuModal
          footer={
            showDownLoad ? (
              <div className={styles.footer}>
                <Button onClick={this.closeModal}>
                  {trans("global.cancle")}
                </Button>
                <Button type="primary" onClick={this.closeModal}>
                  {trans("global.sure")}
                </Button>
              </div>
            ) : (
              <div className={styles.footer}>
                <Button onClick={this.closeModal}>
                  {trans("global.cancle")}
                </Button>
                <Button type="primary" onClick={this.surePass}>
                  {trans("global.sure")}
                </Button>
              </div>
            )
          }
          onCancel={this.closeModal}
          centered={true}
          getContainer={false}
          visible={this.props.examVisble}
          closable={true}
          maskClosable={false}
          destroyOnClose={true}
          // onCancel={this.publishCancel}
          width="90%"
          className={styles.uploadModal}
          title={
            this.props.inquireId
              ? trans("global.reviseTestPaper", "修改试卷")
              : trans("global.uploadTestPaper", "修改试卷")
          }
        >
          <Spin
            tip="正在上传中，预计需要1~2分钟，请耐心等待"
            spinning={this.state.spin}
          >
            {showDownLoad ? (
              this.state.platform && this.state.platform === 2 ? (
                <div className={styles.downLoadContent}>
                  <div className={styles.paperTitle}>
                    {trans(
                      "examSetting.markingGuideLine1",
                      "你的试卷若要实现机器阅卷和采集数据，还进行题目的虚线标记，点击去",
                    )}
                    <span className={styles.makePaper} onClick={this.makePaper}>
                      {trans("global.markingAndMarking", "批阅打标")}
                    </span>
                  </div>
                  <div className={styles.paperContent}>
                    {trans(
                      "examSetting.markingGuideLine2",
                      "关闭后，也可通过 【试卷管理-下载试卷】弹框中找到",
                    )}
                    {trans(
                      "examSetting.markingGuideAction",
                      "「批阅打标」 的操作",
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.downLoadContent}>
                  <Button type="primary" onClick={this.viewExam}>
                    {trans("global.viewTestPaper", "查看试卷")}
                  </Button>
                </div>
              )
            ) : (
              <div className={styles.uploadContent}>
                <div className={styles.radioBox}>
                  <span className={styles.radioTitle}>
                    {trans("global.grade", "年级")}
                  </span>
                  <Checkbox.Group
                    options={newGradeList}
                    value={grade}
                    onChange={this.changeGrade}
                  />
                </div>
                <div className={styles.radioBox} style={{ width: "40%" }}>
                  <span className={styles.radioTitle}>
                    {trans("global.subject", "学科")}
                  </span>
                  <Select
                    style={{ flexGrow: "1" }}
                    showSearch
                    placeholder={trans("global.subjectName", "学科名称")}
                    onChange={this.changeSubject}
                    value={subjectValue}
                  >
                    {stageSubjectList && stageSubjectList.length > 0
                      ? stageSubjectList.map((item) => (
                          <Option value={item.id}>{item.name}</Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div className={styles.radioBox} style={{ width: "60%" }}>
                  <span
                    className={styles.radioTitle}
                    style={{ paddingLeft: "10px" }}
                  >
                    {trans("global.course", "课程")}
                  </span>
                  <Select
                    showSearch
                    mode="multiple"
                    style={{ flexGrow: "1" }}
                    placeholder={trans("global.courseName", "课程名称")}
                    onChange={this.changeCourse}
                    value={courseIdList}
                  >
                    {subjectList && subjectList.length > 0
                      ? subjectList.map((item) => (
                          <Option value={item.courseId}>
                            {item.courseName}
                          </Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div className={styles.radioBox} style={{ width: "100%" }}>
                  <span className={styles.radioTitle}>
                    {trans("global.group", "班级")}
                  </span>
                  <Select
                    showSearch
                    style={{ flexGrow: "1" }}
                    mode="multiple"
                    placeholder={trans(
                      "global.chooseClass",
                      "选择参与考试的班级",
                    )}
                    onChange={this.changeClass}
                    value={group}
                  >
                    {classList && classList.length > 0
                      ? classList.map((item) => (
                          <Option value={item.groupId}>
                            {language ? item.groupName : item.groupEnName}
                          </Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div className={styles.radioBox} style={{ width: "100%" }}>
                  <span className={styles.radioTitle}>
                    {trans("global.examType", "类型")}
                  </span>
                  <Radio.Group onChange={this.changeExamType} value={examType}>
                    {examTypeList && examTypeList.length > 0
                      ? examTypeList.map((item) => (
                          <Radio value={item.code}>{item.typeName}</Radio>
                        ))
                      : null}
                  </Radio.Group>
                </div>
                <div
                  className={styles.radioBox}
                  style={{ width: "400px", marginRight: "10px" }}
                >
                  <span className={styles.radioTitle}>
                    {trans("global.examName", "测验名称")}
                  </span>
                  <span style={{ marginRight: "4px", flexShrink: 0 }}>
                    {examText}
                  </span>
                  <Input
                    style={{ flexGrow: "1" }}
                    maxLength={examNameMaxLength}
                    onChange={this.changeExamName}
                    value={examPaperName}
                  />
                </div>
                <div
                  className={styles.radioBox}
                  style={{ width: "150px", marginRight: "10px" }}
                >
                  <span className={styles.radioTitle}>
                    {trans("global.manfen", "满分")}
                  </span>
                  <InputNumber
                    style={{ flexGrow: "1" }}
                    onChange={this.changeScore}
                    value={totalScore}
                    min={0}
                  />
                </div>

                {this.state.Dot_Matrix_Pen ? (
                  <div
                    className={styles.radioBox}
                    style={{ width: "400px", marginRight: "auto" }}
                  >
                    <span className={styles.radioTitle}>
                      {trans(
                        "examSetting.dotMatrixPenMode",
                        "是否点阵笔模式：",
                      )}
                    </span>
                    <Checkbox
                      disabled={Boolean(this.props.inquireId)}
                      checked={this.state.dotMatrixPen}
                      onChange={(e) => {
                        this.setState({
                          dotMatrixPen: e.target.checked,
                        });
                      }}
                    ></Checkbox>
                    {this.state.dotMatrixPen === true ? (
                      <div className={styles.matrixPenType}>
                        <Radio.Group
                          value={this.state.studentNumber}
                          onChange={(e) =>
                            this.setState({ studentNumber: e.target.value })
                          }
                        >
                          <Radio value={null}>
                            {trans("examSetting.oneCodePerPaper", "一卷一码")}
                          </Radio>
                          <Radio value={100}>
                            {trans("examSetting.oneCodePerStudent", "一生一码")}
                          </Radio>
                        </Radio.Group>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* 强制换行 */}
                <div style={{ width: "100%" }}></div>
                <div className={styles.radioBox} style={{ width: "200px" }}>
                  <span className={styles.radioTitle}>
                    {trans("global.stuNo", "学号")}
                  </span>
                  <Radio.Group onChange={this.changeStuNo} value={3}>
                    <Radio value={3}>
                      {trans("global.pasteBarCodeOrQRcode", "贴条形码或二维码")}
                    </Radio>
                  </Radio.Group>
                </div>
                <div className={styles.radioBox} style={{ width: "342px" }}>
                  <span className={styles.radioTitle}>
                    {trans("global.productionMethod", "制作方式")}
                  </span>
                  <Radio.Group onChange={this.changePlatform} value={platform}>
                    <Radio value={1}>
                      {trans("globakl.platform", "平台工具制作")}
                    </Radio>
                    <Radio value={2}>
                      {trans("globakl.noplatform", "非平台工具制作")}
                    </Radio>
                  </Radio.Group>
                </div>
                <div className={styles.radioBox} style={{ width: "200px" }}>
                  <span className={styles.radioTitle}>
                    {trans("global.confidentialityRequirements", "保密要求：")}
                  </span>
                  <Checkbox
                    onChange={this.changeSecrecy}
                    checked={this.state.secrecy}
                  >
                    {trans("global.secrecy", "保密")}
                  </Checkbox>
                </div>

                {typeof isYungu !== "undefined" && !isYungu ? (
                  <div className={styles.radioBox}>
                    <span className={styles.radioTitle}>
                      {trans("global.onlineCorrection", "在线批改")}
                    </span>
                    <Checkbox
                      onChange={this.changeCorrection}
                      checked={this.state.isCorrection}
                    >
                      {trans("global.open", "开启")}
                    </Checkbox>
                    <div
                      className={styles.teacherName}
                      onClick={this.clickTeacherName}
                    >
                      {teacherArr && teacherArr.length > 0 ? (
                        teacherArr.map((item) => (
                          <span>{item.teacherName}、</span>
                        ))
                      ) : (
                        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                          {trans(
                            "create.teacherAdminSelect",
                            "请选择管理老师，后续可分配阅卷任务",
                          )}
                        </span>
                      )}
                      <span
                        style={{ display: "inline-block", height: "20px" }}
                      ></span>
                    </div>
                  </div>
                ) : null}

                {/* 强制换行 */}
                <div style={{ width: "100%" }}></div>

                <div
                  className={styles.radioBox}
                  style={{ width: "350px", alignItems: "flex-start" }}
                >
                  <span
                    className={styles.radioTitle}
                    style={{ marginTop: "5px" }}
                  >
                    {trans("global.uploadAnswerSheet", "上传答题卡")}
                  </span>
                  <div className={styles.uploadBox}>
                    <Upload {...uploadProperties}>
                      <Button>
                        <Icon type="upload" />{" "}
                        {trans("zhixueScoreImport.uploadFile", "上传文件")}
                      </Button>
                    </Upload>
                    <span className={styles.importMessage}>
                      {trans("examSetting.wordOnly", "仅支持Word文件")}
                    </span>
                  </div>
                </div>

                <div
                  className={styles.radioBox}
                  style={{ width: "350px", alignItems: "flex-start" }}
                >
                  <span
                    className={styles.radioTitle}
                    style={{ marginTop: "5px" }}
                  >
                    {trans("global.uploadAquestionnaire", "上传问卷")}
                    <span style={{ color: "red" }}> *</span>
                  </span>
                  <div className={styles.uploadBox}>
                    <Upload {...testPaperUploadProperties}>
                      <Button>
                        <Icon type="upload" />{" "}
                        {trans("zhixueScoreImport.uploadFile", "上传文件")}
                      </Button>
                    </Upload>
                    <span className={styles.importMessage}>
                      {trans("examSetting.wordOnly", "仅支持Word文件")}
                    </span>
                  </div>
                </div>

                <div
                  className={styles.radioBox}
                  style={{ width: "350px", alignItems: "flex-start" }}
                >
                  <span
                    className={styles.radioTitle}
                    style={{ marginTop: "5px" }}
                  >
                    {trans("examSetting.uploadAnswerSheet", "上传答案卷")}
                  </span>
                  <div className={styles.uploadBox}>
                    <Upload {...answerSheetUploadProperties}>
                      <Button>
                        <Icon type="upload" />
                        {trans("zhixueScoreImport.uploadFile", "上传文件")}
                      </Button>
                    </Upload>
                    <span className={styles.importMessage}>
                      {trans("examSetting.wordOnly", "仅支持Word文件")}
                    </span>
                  </div>
                </div>

                {necessaryTeacherVisible ? (
                  <SearchTeacher
                    modalVisible={necessaryTeacherVisible}
                    cancel={this.changeNecessaryTeacherVisible}
                    language={"zh_CN"}
                    confirm={(ids) => this.searchTeacherConfirm(ids)}
                    selectType="1" // 1:全体人员 2：人员和组织id {nodeList：组织id数组，idList： 人员id数组}
                    selectedList={this.state.newTeacherIds}
                  />
                ) : null}
              </div>
            )}
            <div className={styles.errText}>
              <Modal
                visible={this.state.errVisible}
                footer={false}
                onCancel={() => this.setState({ errVisible: false })}
                // getContainer={false}
                maskClosable={false}
                width={600}
                centered={true}
                className={styles.errModal}
              >
                <div className={styles.errTextDiv}>{this.state.errText}</div>
              </Modal>
            </div>
          </Spin>
        </CuModal>
      </div>
    );
  }
}

export default connect((state) => ({
  allGrade: state.home.allGrade,
  classList: state.home.classList,
  allSubject: state.home.allSubject,
  examTypeList: state.home.examTypeList,
  wordPdfUrl: state.home.wordPdfUrl,
  stageSubjectList: state.home.stageSubjectList,
  inquireTest: state.home.inquireTest,
  modifyTest: state.home.modifyTest,
  allOrgTeachersList: state.marking.allOrgTeachersList,
}))(ExamSetting);

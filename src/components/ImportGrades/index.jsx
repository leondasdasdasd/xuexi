//数学公式编辑器
import React, { PureComponent } from "react";
import {
  Checkbox,
  Input,
  InputNumber,
  message,
  Radio,
  Select,
  Upload,
} from "antd";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";
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
if (month < 9 || month === 9) {
  year -= 1;
}
@connect((state) => ({
  allGrade: state.home.allGrade,
  classList: state.home.classList,
  allSubject: state.home.allSubject,
  examTypeList: state.home.examTypeList,
  wordPdfUrl: state.home.wordPdfUrl,
  stageSubjectList: state.home.stageSubjectList,
  inquireTest: state.home.inquireTest,
  modifyTest: state.home.modifyTest,
}))
class MathEditor extends PureComponent {
  constructor() {
    super();
    this.state = {
      mathContent: "",
      fileList: {},
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
      newfileList: [],
      fileId: "",
      semesterId: "",
    };
  }
  componentDidMount() {
    this.props.dispatch({
      type: "home/getAllGrade",
      payload: {
        paperId: this.props.inquireId,
      },
    });
    this.props
      .dispatch({
        type: "home/getExamType",
        payload: {
          type: 1,
        },
      })
      .then(() => {
        const { examTypeList } = this.props;
      });

    let defaultSemesterId = "";
    if (this.props?.examOptions?.length) {
      defaultSemesterId = this.props?.examOptions.find(
        (item) => item.current,
      ).semesterId;
    }
    this.setState({
      semesterId: defaultSemesterId,
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
          this.setState(
            {
              // examPaperName: inquireTest.examPaperName, //试卷名称
              totalScore: inquireTest.totalScore, //总分
              courseIdList: inquireTest.courseIdList, //课程
              group: inquireTest.groupIdList, //班级
              examType: inquireTest.examType, //类型
              grade: inquireTest.gradeIdList, //年级
              subjectValue: inquireTest.subjectId, //学科
              stuNo: inquireTest.paperId, //学号
              platform: inquireTest.madePlatformUtil ? 1 : 2, //平台工具制作
              secrecy: inquireTest.whetherOrNotPrivate, //保密要求
              examPaperAnswerSheetFileId:
                inquireTest.examPaperAnswerSheetFileId, //试卷fileid
              fileList: {
                fileId: inquireTest.examPaperAnswerSheetFileId,
                fileName: inquireTest.wordName,
                type: "doc",
                url: " ",
              },
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
                    let semesterText = month > 9 ? "S1" : "S2";
                    let examText =
                      year + "-" + semesterText + gradeText + subjectText;
                    let test = inquireTest.examPaperName;
                    let reg2 = new RegExp(examText);
                    let newTest = test.replace(reg2, "");
                    // connect.log(newTest, "sss");
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
                      semesterId: this.state.semesterId,
                    },
                  })
                  .then(() => {
                    console.log(this.props.classList);
                    this.setState({
                      classList: this.props.classList,
                    });
                  });
            },
          );
        });
  }
  uploadOnChange = (info) => {
    console.log(info, "ii");
    let file = info.file;
    let { fileList } = this.state;
    if (file.status === "uploading") {
      // let index = this.haveId(file.uid, fileList);
      // if (index > -1) {
      //   //数组中包含id
      //   file.fileName = file.name;
      //   fileList[index] = file;
      // } else {
      //   file.fileName = file.name;
      //   fileList.push(file);
      // }
      // this.fileChange(fileList);
      // this.props.holdback(false)
    }
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      let newList = [];
      newList = file.response.content;
      // console.log("ewList[0]", newList[0]);
      this.setState({
        fileList: newList[0],
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
  cleanFile = () => {
    this.setState({
      fileList: {},
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
        fileList: {},
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
    this.props.dispatch({
      type: "home/subjectListByGrades",
      payload: {
        gradeIds: checkedValues.join(","),
      },
    });

    this.setState({
      grade: checkedValues,
      subjectValue: null,
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
                semesterId: this.state.semesterId,
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
      this.props.wordPdfUrl.content.wordPdfUrl &&
      this.props.wordPdfUrl.content.wordPdfUrl !== ""
    ) {
      // const a = document.createElement('a');
      // a.href = this.props.wordPdfUrl;
      // a.download = 'exam.pdf';
      // a.target = '_blank';
      // a.click();
      window.open(this.props.wordPdfUrl.content.wordPdfUrl);
    } else if (
      this.props.modifyTest?.content?.wordPdfUrl &&
      this.props.modifyTest?.content?.wordPdfUrl !== ""
    ) {
      // console.log(this.props.modifyTest);
      window.open(this.props.modifyTest.content?.wordPdfUrl);
    }
    this.closeModal();
  };
  surePass = () => {
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

    this.setState({
      confirmLoading: true,
    });
    const {
      fileId,
      platform,
      examPaperName,
      grade,
      subjectValue,
      courseIdList,
      group,
      examType,
      totalScore,
    } = this.state;
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
    // let subjectText = "";
    // this.props.stageSubjectList &&
    //   this.props.stageSubjectList.length &&
    //   this.props.stageSubjectList.map((item) => {
    //     if (item.id == this.state.subjectValue) {
    //       subjectText = item.name;
    //     }
    //   });
    if (platform == 1) {
      this.props
        .dispatch({
          type: "global/getTotalScore",
          payload: {
            examName: examPaperName,
            gradeIdList: "," + grade.join(",") + ",",
            subjectId: subjectValue,
            totalScore: totalScore,
            examType: examType,
            groupIdList: "," + group.join(",") + ",",
            sourceType: 1,
            file: fileId,
            courseId: "," + courseIdList.join(",") + ",",
            semesterId: this.state.semesterId,
          },
          onSuccess: () => {
            this.props.getPage();
            this.closeModal();
            this.setState({
              confirmLoading: false,
            });
          },
        })
        .then((res) => {
          this.setState({
            confirmLoading: false,
          });
        });
    } else {
      this.props
        .dispatch({
          type: "global/getUniformExaminationScore",
          payload: {
            examName: examPaperName,
            gradeIdList: "," + grade.join(",") + ",",
            subjectId: subjectValue,
            totalScore: totalScore,
            examType: examType,
            groupIdList: "," + group.join(",") + ",",
            sourceType: 1,
            file: fileId,
            verifyQuestionNum: true,
            courseId: "," + courseIdList.join(",") + ",",
            semesterId: this.state.semesterId,
          },
          onSuccess: () => {
            this.props.getPage();
            this.closeModal();
            this.setState({
              confirmLoading: false,
            });
          },
        })
        .then((res) => {
          this.setState({
            confirmLoading: false,
          });
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
  changupload1 = (info) => {
    let file = info.file;
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1);
    fileList = fileList.map((file) => {
      if (file.response) {
        file.url = file.response.url;
        this.setState({
          fileId: file.response.content[0].fileId,
        });
      }
      return file;
    });
    this.setState({
      newfileList: fileList,
    });
  };
  deleteIcon = () => {
    this.setState({
      newfileList: [],
      fileId: null,
    });
  };
  clickDownloadTemplate = () => {
    const { classList, grade, subjectValue, courseIdList, semesterId } =
      this.state;
    // 构建班级参数，传递班级ID列表
    const groupIdList =
      classList && classList.length > 0
        ? classList.map((item) => item.groupId).join(",")
        : "";

    const parameters = {
      fullScore: this.state.platform == 1 ? true : false,
      subjectId: subjectValue,
      gradeIdList: grade ? grade.join(",") : "",
      courseIdList: courseIdList ? courseIdList.join(",") : "",
      semesterId: semesterId,
      groupIdList: groupIdList,
    };
    const parametersString = new URLSearchParams(parameters).toString();
    window.open(
      `${window.location.origin}/api/exam/download/uniformExaminationScore?${parametersString}`,
    );
  };

  changeStage = (value) => {
    this.setState({
      semesterId: value,
    });
  };
  render() {
    // console.log(window.location.hash, "aaaa");
    const { visible, allGrade, allSubject, examTypeList, stageSubjectList } =
      this.props;
    const {
      stuNo,
      subjectValue,
      grade,
      semester,
      group,
      classList,
      subjectList,
      examType,
      platform,
      showDownLoad,
      examPaperName,
      totalScore,
      courseIdList,
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
    // console.log(language, "cc");
    // console.log(grade, "vvv");
    //上传
    let gradeText = "";
    allGrade &&
      allGrade.length &&
      allGrade.map((item) => {
        if (grade?.length > 0 && item.gradeId == grade[0]) {
          gradeText = item.gradeName;
        }
      });
    // let subjectText = "";
    // stageSubjectList && stageSubjectList.length &&
    //   stageSubjectList.map((item) => {
    //     if (item.id == subjectValue) {
    //       subjectText = item.name;
    //     }
    //   });
    let examTypeText = "";
    examTypeList &&
      examTypeList.length &&
      examTypeList.map((item) => {
        if (item.code == examType) {
          examTypeText = item.typeName;
        }
      });
    let semesterText = month > 9 ? "S1" : "S2";

    console.log(year, "tyy");
    // let examText = year + "-" + semesterText + gradeText + subjectText;
    // console.log(examText, "vvv");
    let property = {
      name: "files",
      action: "/api/upload_file",
      showUploadList: false,
      onChange: this.changupload1.bind(this),
      fileList: this.state.newfileList,
    };
    return (
      <CuModal
        visible={this.props.examVisble}
        onCancel={this.closeModal}
        title={trans("global.importGrades", "导入成绩")}
        width={1000}
        centered={true}
        closable={true}
        maskClosable={false}
        destroyOnClose={true}
        onOk={this.surePass}
        confirmLoading={this.state.confirmLoading}
      >
        <div className={styles.uploadContent}>
          <div className={styles.radioBox}>
            <span className={styles.radioTitle}>
              {trans("global.examName", "测验名称：")}
            </span>
            <div style={{ width: "300px", display: "inline-block" }}>
              <Input onChange={this.changeExamName} value={examPaperName} />
            </div>
            <span className={styles.radioTitle}>
              {trans("revised.semester", "学期")}：
            </span>
            <Select
              onChange={this.changeStage}
              value={this.state.semesterId}
              style={{ width: 250 }}
            >
              <Option value={0} key={0}>
                {trans("global.allSemester", "全部学期")}
              </Option>
              {this.props.examOptions && this.props.examOptions.length > 0
                ? this.props.examOptions.map((item) => (
                    <Option value={item.semesterId} key={item.semesterId}>
                      <span title={item.semesterName}>{item.semesterName}</span>
                    </Option>
                  ))
                : null}
            </Select>
          </div>
          <div className={styles.radioBox}>
            <span className={styles.radioTitle}>
              {trans("global.grade", "年级")}：
            </span>
            <Checkbox.Group
              options={newGradeList}
              value={grade}
              onChange={this.changeGrade}
            />
          </div>
          <div className={styles.radioBox}>
            <span className={styles.radioTitle}>
              {trans("global.subject", "学科")}：
            </span>
            <Select
              showSearch
              style={{ width: 250 }}
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
          <div className={styles.radioBox}>
            <span className={styles.radioTitle}>
              {trans("global.course", "课程")}：
            </span>
            <Select
              showSearch
              mode="multiple"
              style={{ width: "87%" }}
              placeholder={trans("global.courseName", "课程名称")}
              onChange={this.changeCourse}
              value={courseIdList}
            >
              {subjectList && subjectList.length > 0
                ? subjectList.map((item) => (
                    <Option value={item.courseId}>{item.courseName}</Option>
                  ))
                : null}
            </Select>
          </div>
          <div className={styles.radioBox}>
            <span className={styles.radioTitle}>
              {trans("global.group", "班级")}：
            </span>
            <Select
              showSearch
              style={{ width: "87%" }}
              mode="multiple"
              placeholder={trans("global.chooseClass", "选择参与考试的班级")}
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
          <div className={styles.radioBox}>
            <span className={styles.radioTitle}>
              {trans("global.testType", "测验类型")}：
            </span>
            <Radio.Group onChange={this.changeExamType} value={examType}>
              {examTypeList && examTypeList.length > 0
                ? examTypeList.map((item) => (
                    <Radio value={item.code}>{item.typeName}</Radio>
                  ))
                : null}
            </Radio.Group>
          </div>
          <div className={styles.radioBox}>
            <span className={styles.radioTitle}>
              {trans("global.manfen", "满分")}：
            </span>
            <InputNumber
              onChange={this.changeScore}
              value={totalScore}
              min={0}
            />
          </div>
          <div className={styles.radioBox}>
            <span className={styles.radioTitle}>
              {trans("global.scoreGranularity", "成绩颗粒度")}：
            </span>
            <Radio.Group
              style={{ lineHeight: "30px" }}
              onChange={this.changePlatform}
              value={platform}
            >
              <Radio value={1}>
                {trans("global.onlyTotalScore", "仅学生总得分")}
              </Radio>
              <Radio value={2}>
                {trans("global.tudentsScoresQuestion", "有学生每小题得分")}
              </Radio>
            </Radio.Group>
          </div>
          <div className={styles.radioBox}>
            <span
              className={styles.radioTitle}
              style={{ verticalAlign: "top", marginTop: 5 }}
            >
              {trans("global.importGrades", "导入成绩")}：
            </span>
            <span className={styles.uploadDown}>
              <div className={styles.downloadBox}>
                1.{" "}
                {trans(
                  "global.downloadTemplateTip",
                  "下载导入成绩模板，批量填写",
                )}
                {grade && subjectValue && group.length > 0 ? (
                  <span
                    className={styles.downloadTemplate}
                    onClick={this.clickDownloadTemplate}
                  >
                    {trans("global.downloadTemplate", "下载模板")}
                  </span>
                ) : (
                  <span className={styles.noDownloadTemplate}>
                    {trans("global.downloadTemplate", "下载模板")}
                  </span>
                )}
              </div>
              <div className={styles.downloadBox}>
                2. {trans("global.uploadFilesTip", "上传填写好的成绩")}
                <Upload {...property}>
                  <span className={styles.downloadTemplate}>
                    {trans("global.uploadFiles", "上传文件")}
                  </span>
                </Upload>
                {this.state.newfileList.length > 0 ? (
                  <div className={styles.fileBox}>
                    <span className={styles.fileName}>
                      {this.state.newfileList[0].name}
                      <i
                        className={[styles.iconfont, styles.closeIcon].join(
                          " ",
                        )}
                        onClick={this.deleteIcon}
                      >
                        &#xe6ca;
                      </i>
                    </span>
                  </div>
                ) : null}
              </div>
            </span>
          </div>
        </div>
      </CuModal>
    );
  }
}

export default MathEditor;

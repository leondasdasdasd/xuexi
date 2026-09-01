//数学公式编辑器
import React, { PureComponent } from "react";
import { Input, InputNumber, message, Radio, Select, Upload } from "antd";
import { connect } from "dva";

import { queryAllSubject } from "../../services/example";
import {
  downloadTotalScoreBySubjectTemplate,
  importTotalScoreBySubject,
} from "../../services/global";
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
class MultiImportGrades extends PureComponent {
  constructor() {
    super();
    this.state = {
      mathContent: "",
      fileList: {},
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
      uploadFileId: null,
      examPaperAnswerSheetFileId: null,
      errVisible: false,
      errText: "",
      newfileList: [],
      fileId: "",
      semesterId: "",
      importScoreSubjectGroup: [
        {
          totalScore: undefined,
          subjectId: undefined,
          courseId: [],
        },
      ],
      subjectMapCourse: {},
    };
  }
  componentWillUnmount() {
    this.props.dispatch({
      type: "home/clearPdf",
    });
  }

  componentDidMount() {
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

    if (this.props?.examOptions?.length) {
      const { semesterId } =
        this.props.examOptions.find((item) => item.current) || {};

      this.setState({
        semesterId: semesterId,
      });
    }
  }
  closeModal = () => {
    this.setState(
      {
        fileList: {},
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

  changeExamType = (e) => {
    this.setState({
      examType: e.target.value,
      examPaperName: this.getExamName({ examType: e.target.value }),
    });
  };

  changeExamName = (e) => {
    this.setState({
      examPaperName: e.target.value,
    });
  };

  changePlatform = (e) => {
    this.setState({
      platform: e.target.value,
    });
  };

  changeGrade = (e) => {
    this.setState({
      grade: e.target.value,
    });

    this.props
      .dispatch({
        type: "home/getGradeClass",
        payload: {
          gradeIdList: [e.target.value],
          hasAdministrativeClass: true,
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
          examPaperName: this.getExamName({ gradeId: e.target.value }),
        });

        this.props
          .dispatch({
            type: "home/subjectListByGrades",
            payload: {
              gradeIds: e.target.value,
              // paperId: this.props.inquireId,
            },
          })
          .then(() => {});
      });
  };

  changeSubject = (object, index) => {
    const { key, label } = object;
    let cloneList = JSON.parse(
      JSON.stringify(this.state.importScoreSubjectGroup),
    );
    cloneList[index].subjectId = key;
    cloneList[index].subjectName = label;
    this.setState({
      importScoreSubjectGroup: cloneList,
    });
    queryAllSubject({
      gradeIdList: [this.state.grade],
      subjectId: key,
    }).then((res) => {
      if (res.status) {
        this.setState({
          subjectMapCourse: {
            ...this.state.subjectMapCourse,
            [key]: res.content,
          },
        });
      } else {
        message.error(res.message);
      }
    });
  };

  changeCourse = (value, index) => {
    let cloneList = JSON.parse(
      JSON.stringify(this.state.importScoreSubjectGroup),
    );
    cloneList[index].courseId = value;
    this.setState({
      importScoreSubjectGroup: cloneList,
    });
  };

  changeScore = (value, index) => {
    let cloneList = JSON.parse(
      JSON.stringify(this.state.importScoreSubjectGroup),
    );
    cloneList[index].totalScore = value;
    this.setState({
      importScoreSubjectGroup: cloneList,
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
    this.setState({
      secrecy: e.target.checked,
    });
  };

  addScoreSubjectGroup = (index) => {
    let cloneList = JSON.parse(
      JSON.stringify(this.state.importScoreSubjectGroup),
    );
    const newSubjectGroup = {
      totalScore: undefined,
      subjectId: undefined,
      subjectName: undefined,
      courseId: [],
    };
    if (typeof index === "number") {
      cloneList.splice(index + 1, 0, newSubjectGroup);
    } else {
      cloneList.push(newSubjectGroup);
    }
    this.setState({
      importScoreSubjectGroup: cloneList,
    });
  };

  deletScoreSubjectGroup = (index) => {
    let cloneList = JSON.parse(
      JSON.stringify(this.state.importScoreSubjectGroup),
    );
    if (cloneList.length <= 1) {
      message.warning(
        trans("multiImportGrades.keepOneSubject", "至少保留一行学科"),
      );
      return;
    }
    cloneList.splice(index, 1);
    this.setState({
      importScoreSubjectGroup: cloneList,
    });
  };

  surePass = () => {
    if (!this.state.grade) {
      message.error(trans("paper.gradeRequired", "请选择年级"));
      return;
    }
    if (!this.state.group || this.state.group.length === 0) {
      message.error(trans("learningAnalysis.classRequired", "请选择班级"));
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
      examPaperName,
      grade,
      importScoreSubjectGroup,
      group,
      examType,
    } = this.state;
    importTotalScoreBySubject({
      file: fileId,
      semesterId: this.state.semesterId,
      examName: examPaperName,
      gradeIdList: grade,
      examType: examType,
      groupIdList: "," + group.join(",") + ",",
      sourceType: 1,
      importScoreSubjectGroup: importScoreSubjectGroup,
    })
      .then((res) => {
        if (res.status) {
          message.success(trans("global.operateSuccess", "操作成功"));
          this.closeModal();
        } else {
          message.error(res.message);
        }
        this.setState({
          confirmLoading: false,
        });
      })
      .then(() => {
        this.setState({
          confirmLoading: false,
        });
      });
  };

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
    const { classList, grade, semesterId, spin } = this.state;
    if (spin) {
      return;
    }

    const list = this.state.importScoreSubjectGroup || [];
    const subjectNameList = list
      .map((item) => item.subjectName)
      .filter(Boolean);
    const subjectNameListString = subjectNameList.join(",");

    if (!semesterId && semesterId !== 0) {
      message.error(trans("learningAnalysis.semesterRequired", "请选择学期"));
      return;
    }
    if (!grade) {
      message.error(trans("paper.gradeRequired", "请选择年级"));
      return;
    }
    if (!subjectNameListString) {
      message.error(trans("paper.subjectRequired", "请选择学科"));
      return;
    }

    // 构建班级参数，传递班级ID列表
    const groupIdList =
      classList && classList.length > 0
        ? classList.map((item) => item.groupId).join(",")
        : "";

    const parameters = {
      subjectNameListString: subjectNameListString,
      gradeIdList: grade || "",
      semesterId: semesterId,
      groupIdList: groupIdList,
      hasAdministrativeClass: true,
    };
    this.setState({
      spin: true,
    });
    downloadTotalScoreBySubjectTemplate(parameters)
      .then((res) => {
        if (!res || !res.success) {
          message.error(
            res?.message ||
              trans("scoreImport.downloadTemplateFailed", "下载模板失败"),
          );
          return;
        }
        const blobUrl = window.URL.createObjectURL(res.blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = res.fileName || "多学科导入模板.xlsx";
        document.body.append(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        message.error(
          trans("scoreImport.downloadTemplateFailed", "下载模板失败"),
        );
      })
      .finally(() => {
        this.setState({
          spin: false,
        });
      });
  };

  changeStage = (value) => {
    this.setState({
      semesterId: value,
      examPaperName: this.getExamName({ semesterId: value }),
    });
  };

  getExamName = ({ semesterId, gradeId, examType }) => {
    semesterId = semesterId ? semesterId : this.state.semesterId;
    gradeId = gradeId ? gradeId : this.state.grade;
    examType = examType ? examType : this.state.examType;

    let result = this.props.examOptions.find(
      (item) => item.semesterId == semesterId,
    );
    let result1 = this.props.allGrade.find((item) => item.gradeId == gradeId);
    let result2 = this.props.examTypeList.find((item) => item.code == examType);

    return `${result?.semesterName || ""}-${result1?.gradeName || ""}-${result2?.typeName || ""}`;
  };

  render() {
    const { allGrade, examTypeList, stageSubjectList } = this.props;
    const { grade, group, classList, examType, platform, examPaperName, spin } =
      this.state;

    let newGradeList = [];

    allGrade &&
      allGrade.length &&
      allGrade.map((item) => {
        newGradeList.push({
          label: language ? item.gradeName : item.gradeEnName,
          value: item.gradeId,
        });
      });

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
            <Radio.Group
              options={newGradeList}
              value={grade}
              onChange={this.changeGrade}
            />
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
              {trans("global.examName", "测验名称：")}
            </span>
            <div style={{ width: "300px", display: "inline-block" }}>
              <Input onChange={this.changeExamName} value={examPaperName} />
            </div>
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
                {trans("global.studentSubjectScoreOnly", "仅学生学科分数")}
              </Radio>
            </Radio.Group>
          </div>

          {this.state.importScoreSubjectGroup &&
          this.state.importScoreSubjectGroup.length > 0
            ? this.state.importScoreSubjectGroup.map((rowData, index) => {
                return (
                  <div
                    key={index}
                    className={[styles.radioBox, styles.subjectRow].join(" ")}
                  >
                    <div className={styles.subjectFields}>
                      <span className={styles.radioTitle}>
                        {trans("global.subject", "学科")}：
                      </span>
                      <Select
                        showSearch
                        labelInValue
                        style={{ width: 250 }}
                        placeholder={trans("global.subjectName", "学科名称")}
                        onChange={(value) => this.changeSubject(value, index)}
                        value={{
                          key: rowData.subjectId,
                          label: rowData.subjectName,
                        }}
                      >
                        {stageSubjectList && stageSubjectList.length > 0
                          ? stageSubjectList.map((item) => (
                              <Option value={item.id}>{item.name}</Option>
                            ))
                          : null}
                      </Select>

                      <span
                        className={styles.radioTitle}
                        style={{ width: "60px" }}
                      >
                        {trans("global.course", "课程")}：
                      </span>
                      <Select
                        showSearch
                        mode="multiple"
                        placeholder={trans("global.courseName", "课程名称")}
                        onChange={(value) => this.changeCourse(value, index)}
                        style={{ width: "300px" }}
                        value={rowData.courseId}
                      >
                        {this.state.subjectMapCourse[rowData.subjectId] &&
                        this.state.subjectMapCourse[rowData.subjectId].length >
                          0
                          ? this.state.subjectMapCourse[rowData.subjectId].map(
                              (item) => (
                                <Option value={item.courseId}>
                                  {item.courseName}
                                </Option>
                              ),
                            )
                          : null}
                      </Select>

                      <span
                        className={styles.radioTitle}
                        style={{ width: "60px" }}
                      >
                        {trans("global.manfen", "满分")}：
                      </span>
                      <InputNumber
                        onChange={(value) => {
                          this.changeScore(value, index);
                        }}
                        value={rowData.totalScore}
                        min={0}
                      />
                    </div>
                    <div className={styles.subjectActions}>
                      <i
                        className={styles.iconfont}
                        style={{
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          this.addScoreSubjectGroup(index);
                        }}
                      >
                        &#xe758;
                      </i>
                      <i
                        className={styles.iconfont}
                        style={{
                          cursor:
                            this.state.importScoreSubjectGroup.length <= 1
                              ? "not-allowed"
                              : "pointer",
                          color:
                            this.state.importScoreSubjectGroup.length <= 1
                              ? "#bfbfbf"
                              : undefined,
                        }}
                        onClick={() => {
                          this.deletScoreSubjectGroup(index);
                        }}
                      >
                        &#xe739;
                      </i>
                    </div>
                  </div>
                );
              })
            : null}

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
                <span
                  className={styles.downloadTemplate}
                  style={{
                    cursor: spin ? "not-allowed" : "pointer",
                    opacity: spin ? 0.6 : 1,
                  }}
                  onClick={this.clickDownloadTemplate}
                >
                  {spin
                    ? "下载中..."
                    : trans("global.downloadTemplate", "下载模板")}
                </span>
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

export default MultiImportGrades;

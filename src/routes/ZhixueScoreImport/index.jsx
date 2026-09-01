import React, { PureComponent } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Icon,
  Input,
  InputNumber,
  message,
  Table,
  Tabs,
  Upload,
} from "antd";

import {
  getQuestionWorkbookColumns,
  getQuestionWorkbookGroups,
  getQuestionWorkbookPreviewRows,
  getScoreWorkbookRows,
  getScoreWorkbookSubjectColumns,
} from "../../components/ScoreImportModal/scoreImportUtils";
import { confirmScoreImport } from "../../services/global";
import { trans } from "../../utils/i18n";
import {
  parseZhixueFilesFromBuffers,
  summarizeZhixuePreview,
} from "./zhixueParser";

import styles from "./index.module.less";

const { Dragger } = Upload;
const { TabPane } = Tabs;
const { TextArea } = Input;
const OVERWRITE_SKIP = "skipExistingQuestionScore";
const OVERWRITE_REPLACE = "overwriteExistingQuestionScore";

/**
 *
 * @param columns
 * @param minWidth
 */
function getPreviewTableScrollX(columns, minWidth = 760) {
  const width = (columns || []).reduce(
    (total, column) => total + (Number(column?.width) || 140),
    0,
  );
  return Math.max(minWidth, width);
}

/**
 *
 * @param file
 */
function readUploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve({
        name: file.name,
        buffer: reader.result,
      });
    });
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 *
 * @param file
 */
function normalizeUploadFile(file) {
  return file?.originFileObj || file;
}

class ZhixueScoreImport extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      examId: 9001,
      examName: "第八、九章单元复习周末作业4.10",
      examTime: "2026-04-10",
      subjectName: "物理",
      courseName: "物理G8",
      fullScore: 100,
      fileList: [],
      previewData: null,
      parsing: false,
      importing: false,
      overwriteExisting: false,
    };
  }

  beforeUpload = (file) => {
    const lowerName = String(file.name || "").toLowerCase();
    const supported = lowerName.endsWith(".xlsx") || lowerName.endsWith(".zip");
    if (!supported) {
      message.error(
        trans(
          "zhixueScoreImport.unsupportedFileType",
          "当前工具支持 .xlsx 或智学网 zip，.xls 请先另存为 .xlsx",
        ),
      );
      return false;
    }
    if (file.size === 0) {
      message.error(trans("zhixueScoreImport.emptyFile", "上传文件为空"));
      return false;
    }
    return false;
  };

  changeFiles = ({ fileList }) => {
    this.setState({
      fileList: fileList.slice(-4),
      previewData: null,
    });
  };

  removeFile = (file) => {
    this.setState({
      fileList: this.state.fileList.filter((item) => item.uid !== file.uid),
      previewData: null,
    });
  };

  getExamConfig = () => ({
    examId: this.state.examId,
    examName: this.state.examName,
    examTime: this.state.examTime,
    subjectName: this.state.subjectName,
    courseName: this.state.courseName,
    fullScore: this.state.fullScore,
  });

  parseFiles = () => {
    if (this.state.fileList.length === 0) {
      message.error(
        trans("zhixueScoreImport.uploadFileFirst", "请先上传智学网文件"),
      );
      return;
    }
    if (!String(this.state.examName || "").trim()) {
      message.error(
        trans("zhixueScoreImport.examNameRequired", "请输入当前系统考试名称"),
      );
      return;
    }
    if (!String(this.state.subjectName || "").trim()) {
      message.error(
        trans("zhixueScoreImport.subjectRequired", "请输入当前考试学科"),
      );
      return;
    }
    if (!Number(this.state.fullScore)) {
      message.error(
        trans("zhixueScoreImport.fullScoreRequired", "请输入当前考试学科满分"),
      );
      return;
    }

    this.setState({
      parsing: true,
      previewData: null,
    });

    Promise.all(
      this.state.fileList.map((file) =>
        readUploadFile(normalizeUploadFile(file)),
      ),
    )
      .then((fileItems) =>
        parseZhixueFilesFromBuffers(fileItems, this.getExamConfig()),
      )
      .then((previewData) => {
        this.setState({
          previewData,
        });
        if (previewData.errors?.length) {
          message.error(
            trans(
              "zhixueScoreImport.parseCompleteWithBlockingErrors",
              "解析完成，但存在阻断错误",
            ),
          );
          return;
        }
        message.success(
          trans("zhixueScoreImport.parseComplete", "解析完成，可以确认导入"),
        );
      })
      .catch((error) => {
        message.error(
          error?.message ||
            trans("zhixueScoreImport.parseFailed", "解析失败，请检查文件格式"),
        );
      })
      .finally(() => {
        this.setState({
          parsing: false,
        });
      });
  };

  confirmImport = () => {
    const { previewData, overwriteExisting } = this.state;
    if (!previewData?.previewId) {
      message.error(
        trans("zhixueScoreImport.parsePreviewFirst", "请先解析预览"),
      );
      return;
    }
    if (previewData.errors?.length) {
      message.error(
        trans(
          "zhixueScoreImport.fixBlockingErrorsFirst",
          "存在阻断错误，请修正后重新上传",
        ),
      );
      return;
    }

    this.setState({
      importing: true,
    });
    confirmScoreImport({
      previewId: previewData.previewId,
      overwritePolicy: overwriteExisting ? OVERWRITE_REPLACE : OVERWRITE_SKIP,
    })
      .then((res) => {
        if (res?.status) {
          message.success(
            res.message || trans("zhixueScoreImport.importSuccess", "导入成功"),
          );
          return;
        }
        message.error(
          res?.message || trans("zhixueScoreImport.importFailed", "导入失败"),
        );
      })
      .catch(() => {
        message.error(trans("zhixueScoreImport.importFailed", "导入失败"));
      })
      .finally(() => {
        this.setState({
          importing: false,
        });
      });
  };

  renderExamConfig = () => (
    <div className={styles.configGrid}>
      <label>
        <span>{trans("zhixueScoreImport.examId", "考试 ID")}</span>
        <InputNumber
          min={1}
          value={this.state.examId}
          onChange={(examId) => this.setState({ examId, previewData: null })}
        />
      </label>
      <label className={styles.wideField}>
        <span>
          {trans("zhixueScoreImport.currentExamName", "当前系统考试名称")}
        </span>
        <Input
          value={this.state.examName}
          onChange={(event) =>
            this.setState({ examName: event.target.value, previewData: null })
          }
        />
      </label>
      <label>
        <span>{trans("zhixueScoreImport.examTime", "考试时间")}</span>
        <Input
          value={this.state.examTime}
          onChange={(event) =>
            this.setState({ examTime: event.target.value, previewData: null })
          }
        />
      </label>
      <label>
        <span>{trans("zhixueScoreImport.subject", "学科")}</span>
        <Input
          value={this.state.subjectName}
          onChange={(event) =>
            this.setState({
              subjectName: event.target.value,
              previewData: null,
            })
          }
        />
      </label>
      <label>
        <span>{trans("zhixueScoreImport.course", "课程")}</span>
        <Input
          value={this.state.courseName}
          onChange={(event) =>
            this.setState({ courseName: event.target.value, previewData: null })
          }
        />
      </label>
      <label>
        <span>{trans("zhixueScoreImport.subjectFullScore", "学科满分")}</span>
        <InputNumber
          min={1}
          precision={1}
          value={this.state.fullScore}
          onChange={(fullScore) =>
            this.setState({ fullScore, previewData: null })
          }
        />
      </label>
    </div>
  );

  renderUpload = () => (
    <div className={styles.uploadPanel}>
      <Dragger
        multiple
        accept=".xlsx,.zip"
        fileList={this.state.fileList}
        beforeUpload={this.beforeUpload}
        onChange={this.changeFiles}
        onRemove={this.removeFile}
      >
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">
          {trans(
            "zhixueScoreImport.uploadZhixueScoreFile",
            "上传智学网下载的成绩文件",
          )}
        </p>
        <p className="ant-upload-hint">
          {trans(
            "zhixueScoreImport.uploadHint",
            "建议同时上传“学生成绩.xlsx”和“所有班级学生小题得分明细.xlsx”，也支持智学网 zip。",
          )}
        </p>
      </Dragger>
      <div className={styles.actionRow}>
        <Button
          type="primary"
          loading={this.state.parsing}
          disabled={this.state.fileList.length === 0}
          onClick={this.parseFiles}
        >
          {trans("zhixueScoreImport.parsePreview", "解析预览")}
        </Button>
        <Checkbox
          checked={this.state.overwriteExisting}
          onChange={(event) =>
            this.setState({ overwriteExisting: event.target.checked })
          }
        >
          {trans(
            "zhixueScoreImport.overwriteExistingQuestionScore",
            "覆盖已有单题分数",
          )}
        </Checkbox>
        <Button
          loading={this.state.importing}
          disabled={
            !this.state.previewData?.previewId ||
            Boolean(this.state.previewData?.errors?.length)
          }
          onClick={this.confirmImport}
        >
          {trans("zhixueScoreImport.confirmImport", "确认导入")}
        </Button>
      </div>
    </div>
  );

  renderSummary = () => {
    const summary = summarizeZhixuePreview(this.state.previewData);
    const items = [
      [
        trans("zhixueScoreImport.recognizedStudents", "识别学生"),
        summary.studentCount,
      ],
      [
        trans("zhixueScoreImport.subjectScores", "学科分"),
        summary.subjectScoreCount,
      ],
      [
        trans("zhixueScoreImport.totalScoreRows", "总分行"),
        summary.scoreWorkbookRowCount,
      ],
      [
        trans("zhixueScoreImport.questionWorkbooks", "小题列表"),
        summary.questionWorkbookCount,
      ],
      [
        trans("zhixueScoreImport.questionScoreRecords", "单题记录"),
        summary.questionScoreCount,
      ],
      [trans("zhixueScoreImport.errors", "错误"), summary.errorCount],
      [trans("zhixueScoreImport.warnings", "警告"), summary.warningCount],
      [
        trans("zhixueScoreImport.importable", "可导入"),
        summary.importableCount,
      ],
    ];
    return (
      <div className={styles.summaryGrid}>
        {items.map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    );
  };

  renderIssues = () => {
    const previewData = this.state.previewData;
    const issueList = [
      ...(previewData?.errors || []).map((item) => ({
        ...item,
        level: trans("zhixueScoreImport.errorLevel", "错误"),
      })),
      ...(previewData?.warnings || []).map((item) => ({
        ...item,
        level: trans("zhixueScoreImport.warningLevel", "警告"),
      })),
    ];
    if (issueList.length === 0) {
      return null;
    }
    const columns = [
      {
        title: trans("zhixueScoreImport.issueLevel", "级别"),
        dataIndex: "level",
        width: 80,
      },
      {
        title: trans("zhixueScoreImport.issuePosition", "位置"),
        dataIndex: "position",
        width: 260,
      },
      {
        title: trans("zhixueScoreImport.issueDescription", "说明"),
        dataIndex: "message",
        width: 420,
      },
    ];
    return (
      <Table
        className={styles.previewTable}
        size="small"
        pagination={{ pageSize: 6 }}
        scroll={{ x: getPreviewTableScrollX(columns), y: 300 }}
        columns={columns}
        dataSource={issueList.map((item, index) => ({
          ...item,
          key: index,
        }))}
      />
    );
  };

  renderScorePreview = () => {
    const previewData = this.state.previewData;
    const subjectColumns = getScoreWorkbookSubjectColumns(previewData);
    const rows = getScoreWorkbookRows(previewData);
    const columns = [
      {
        title: trans("zhixueScoreImport.status", "状态"),
        dataIndex: "status",
        width: 90,
      },
      {
        title: trans("zhixueScoreImport.studentNo", "学号"),
        dataIndex: "studentNo",
        width: 120,
      },
      {
        title: trans("zhixueScoreImport.admissionNo", "准考证号"),
        dataIndex: "admissionNo",
        width: 120,
      },
      {
        title: trans("zhixueScoreImport.studentName", "姓名"),
        dataIndex: "studentName",
        width: 100,
      },
      {
        title: trans("zhixueScoreImport.className", "班级"),
        dataIndex: "className",
        width: 120,
      },
      {
        title: trans("zhixueScoreImport.totalScore", "总分"),
        dataIndex: "totalScore",
        width: 90,
      },
      {
        title: trans("zhixueScoreImport.fullScore", "满分"),
        dataIndex: "fullScore",
        width: 90,
      },
      ...subjectColumns.map((subject) => ({
        title: subject.subjectName,
        key: subject.subjectName,
        width: 90,
        render: (text, record) => record.subjectScoreMap?.[subject.subjectName],
      })),
    ];
    return (
      <Table
        className={styles.previewTable}
        size="small"
        pagination={{ pageSize: 8 }}
        scroll={{ x: getPreviewTableScrollX(columns), y: 320 }}
        columns={columns}
        dataSource={rows.map((item, index) => ({
          ...item,
          key: index,
        }))}
      />
    );
  };

  renderQuestionPreview = () => {
    const questionGroups = getQuestionWorkbookGroups(this.state.previewData);
    if (questionGroups.length === 0) {
      return (
        <Alert
          type="info"
          showIcon
          message={trans(
            "zhixueScoreImport.noQuestionDetails",
            "当前没有小题明细",
          )}
          description={trans(
            "zhixueScoreImport.noQuestionDetailsDescription",
            "如果只上传学生成绩文件，本次预览会只包含学科总分结构。",
          )}
        />
      );
    }
    return (
      <Tabs>
        {questionGroups.map((group) => {
          const questionColumns = getQuestionWorkbookColumns(group).map(
            (question) => ({
              title: (
                <div className={styles.questionColumnTitle}>
                  <strong>{question.questionNo}</strong>
                  <span>
                    {trans(
                      "zhixueScoreImport.moduleWithNumber",
                      "大题 {$num}",
                      {
                        num: question.moduleNo || "-",
                      },
                    )}
                  </span>
                </div>
              ),
              key: question.questionNo,
              width: 96,
              render: (text, record) =>
                record.questionScoreMap?.[question.questionNo],
            }),
          );
          const columns = [
            {
              title: trans("zhixueScoreImport.status", "状态"),
              dataIndex: "status",
              width: 90,
            },
            {
              title: trans("zhixueScoreImport.studentNo", "学号"),
              dataIndex: "studentNo",
              width: 120,
            },
            {
              title: trans("zhixueScoreImport.studentName", "姓名"),
              dataIndex: "studentName",
              width: 100,
            },
            {
              title: trans("zhixueScoreImport.className", "班级"),
              dataIndex: "className",
              width: 120,
            },
            ...questionColumns,
          ];
          return (
            <TabPane
              tab={group.sheetName || group.subjectName}
              key={group.sheetName || group.subjectName}
            >
              <Table
                className={styles.previewTable}
                size="small"
                pagination={false}
                scroll={{ x: getPreviewTableScrollX(columns, 1200), y: 360 }}
                columns={columns}
                dataSource={getQuestionWorkbookPreviewRows(group, 8).map(
                  (item, index) => ({
                    ...item,
                    key: index,
                  }),
                )}
              />
            </TabPane>
          );
        })}
      </Tabs>
    );
  };

  renderJsonPreview = () => {
    const previewData = this.state.previewData;
    if (!previewData) {
      return null;
    }
    return (
      <TextArea
        readOnly
        className={styles.jsonBox}
        autosize={{ minRows: 12, maxRows: 24 }}
        value={JSON.stringify(previewData, null, 2)}
      />
    );
  };

  renderPreview = () => {
    if (!this.state.previewData) {
      return (
        <Alert
          showIcon
          type="info"
          message={trans(
            "zhixueScoreImport.previewEmptyMessage",
            "上传两个智学网文件后会在这里预览",
          )}
          description={trans(
            "zhixueScoreImport.previewEmptyDescription",
            "解析结果会输出 scoreWorkbookRows、subjectScoreRows、questionWorkbookList、questionScoreRows、errors 和 warnings，可直接对接统一导入接口。",
          )}
        />
      );
    }

    return (
      <div className={styles.previewPanel}>
        {this.renderSummary()}
        {this.renderIssues()}
        <div className={styles.sectionTitle}>
          {trans("zhixueScoreImport.totalScorePreview", "总分预览")}
        </div>
        {this.renderScorePreview()}
        <div className={styles.sectionTitle}>
          {trans("zhixueScoreImport.questionScorePreview", "小题预览")}
        </div>
        {this.renderQuestionPreview()}
        <div className={styles.sectionTitle}>
          {trans("zhixueScoreImport.systemImportStructure", "系统导入结构")}
        </div>
        {this.renderJsonPreview()}
      </div>
    );
  };

  render() {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1>{trans("zhixueScoreImport.title", "智学网成绩导入工具")}</h1>
            <p>
              {trans(
                "zhixueScoreImport.description",
                "上传智学网原始文件，解析为系统成绩导入结构，确认后复用统一导入接口写入。",
              )}
            </p>
          </div>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.leftPane}>
            <div className={styles.panelTitle}>
              {trans("zhixueScoreImport.bindCurrentExam", "绑定当前考试")}
            </div>
            {this.renderExamConfig()}
            <div className={styles.panelTitle}>
              {trans("zhixueScoreImport.uploadFile", "上传文件")}
            </div>
            {this.renderUpload()}
          </div>
          <div className={styles.rightPane}>{this.renderPreview()}</div>
        </div>
      </div>
    );
  }
}

export default ZhixueScoreImport;

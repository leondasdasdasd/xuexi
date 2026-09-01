import React, { PureComponent } from "react";
import { Button, message, Modal, Table, Upload } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

const { Column } = Table;

export const IMPORT_MODE = "import";
export const EDIT_MODE = "edit";

/**
 *
 * @param fileInfo
 */
export function buildImportedFileList(fileInfo) {
  if (!fileInfo || !fileInfo.fileId) {
    return [];
  }

  return [
    {
      uid: fileInfo.fileId || null,
      name: fileInfo.fileName || null,
      status: "done",
      url: fileInfo.downloadUrl,
    },
  ];
}

/**
 *
 * @param info
 */
export function buildUploadFileState(info) {
  const fileList = [...(info.fileList || [])].slice(-1).map((file) => {
    if (file.response) {
      return {
        ...file,
        url: file.response.url,
      };
    }
    return file;
  });
  const currentFile = fileList[0];
  const responseContent =
    currentFile && currentFile.response && currentFile.response.content;

  return {
    fileId:
      responseContent && responseContent[0] ? responseContent[0].fileId : null,
    fileList,
  };
}

/**
 *
 * @param errorList
 * @param mistake
 */
export function buildImportErrorRows(errorList, mistake) {
  return (errorList || []).map((lineNumber) => ({
    lineNumber,
    mistake,
  }));
}

export class AnalysisDimensionImportModalBase extends PureComponent {
  state = {
    errorRows: [],
    fileId: null,
    fileList: [],
    importFailed: false,
    mode: IMPORT_MODE,
    visible: false,
  };

  open = (mode = IMPORT_MODE) => {
    const { dispatch, examId, modifyAnalysisDimension } = this.props;

    if (!dispatch || !examId) {
      this.openWithFileInfo(mode, modifyAnalysisDimension);
      return Promise.resolve();
    }

    return dispatch({
      type: "home/getModifyAnalysisDimension",
      payload: {
        examId,
      },
    }).then((response) => {
      this.openWithFileInfo(
        mode,
        response && response.status
          ? response.content
          : this.props.modifyAnalysisDimension,
      );
    });
  };

  openWithFileInfo = (mode, fileInfo) => {
    this.setState({
      errorRows: [],
      fileId: fileInfo && fileInfo.fileId ? fileInfo.fileId : null,
      fileList: buildImportedFileList(fileInfo),
      importFailed: false,
      mode,
      visible: true,
    });
  };

  close = () => {
    this.setState({
      errorRows: [],
      importFailed: false,
      visible: false,
    });
  };

  handleUploadChange = (info) => {
    const nextFileState = buildUploadFileState(info);
    this.setState({
      fileId: nextFileState.fileId,
      fileList: nextFileState.fileList,
    });
  };

  handleConfirm = () => {
    const { dispatch, onSuccess, paperId } = this.props;

    // 确认导入时只绑定已上传文件，后端负责解析维度并返回缺失题号。
    return dispatch({
      type: "home/getAttainmentTest",
      payload: {
        fileId: this.state.fileId,
        paperId,
      },
    }).then((response) => {
      const attainmentTest =
        response && Object.prototype.hasOwnProperty.call(response, "content")
          ? response.content
          : this.props.attainmentTest;

      if (attainmentTest === null) {
        message.success(
          trans("global.analysisDimensionImportSuccess", "导入成功"),
        );
        this.close();
        onSuccess && onSuccess();
        return;
      }

      const errorRows = buildImportErrorRows(
        attainmentTest,
        trans(
          "global.analysisDimensionImportError",
          "请检查该行的分析维度内容",
        ),
      );

      dispatch({
        type: "home/changeAttainmentTest",
        payload: {
          attainmentTest: errorRows,
        },
      });
      this.setState({
        errorRows,
        importFailed: true,
      });
    });
  };

  handleResubmit = () => {
    this.setState({
      errorRows: [],
      importFailed: false,
    });
  };

  handleDownloadTemplate = () => {
    window.location.href = `${window.location.origin}/api/paper/export/template?paperId=${this.props.paperId}`;
  };

  getTitle = () => {
    if (this.state.mode === EDIT_MODE) {
      return trans("global.editAnalysisDimensions", "修改分析维度");
    }
    return trans("global.importAnalysisDimensions", "导入分析维度");
  };

  renderTrigger = () => {
    const { renderTrigger } = this.props;

    if (renderTrigger) {
      return renderTrigger({ open: this.open });
    }

    return (
      <Button type="primary" onClick={() => this.open(IMPORT_MODE)}>
        {trans("global.importAnalysisDimension", "导入分析维度")}
      </Button>
    );
  };

  renderErrorContent = () => (
    <Table
      dataSource={this.state.errorRows}
      pagination={false}
      rowKey="lineNumber"
    >
      <Column
        title={trans("global.lineNumber", "行号")}
        dataIndex="lineNumber"
        key="lineNumber"
      />
      <Column
        title={trans("global.wrong", "错误")}
        dataIndex="mistake"
        key="mistake"
      />
    </Table>
  );

  renderImportContent = () => (
    <>
      <p className={styles.setInstruction}>
        1.
        {trans(
          "global.downloadTheImportTemplateAndFillInTheImportInformationInBatches",
          "下载导入模板，批量填写导入信息",
        )}
      </p>
      <Button onClick={this.handleDownloadTemplate}>
        {trans("global.downloadTemplate", "下载模板")}
      </Button>
      <p className={styles.information}>
        2.
        {trans(
          "global.uploadTheCompletedImportInformationForm",
          "上传填写好的导入信息表",
        )}
      </p>
      <Upload
        name="files"
        action="/api/upload_file"
        onChange={this.handleUploadChange}
        fileList={this.state.fileList}
      >
        <Button>{trans("global.selectFile", "选择文件")}</Button>
      </Upload>
    </>
  );

  renderFooter = () => {
    if (this.state.importFailed) {
      return [
        <Button key="submit" type="primary" onClick={this.handleResubmit}>
          {trans("global.resubmit", "重新提交")}
        </Button>,
      ];
    }

    return [
      <Button key="back" onClick={this.close}>
        {trans("global.cancle", "取消")}
      </Button>,
      <Button key="submit" type="primary" onClick={this.handleConfirm}>
        {trans("global.sure", "确定")}
      </Button>,
    ];
  };

  render() {
    return (
      <>
        {this.renderTrigger()}
        <Modal
          title={this.getTitle()}
          wrapClassName={styles.importLiteracy}
          visible={this.state.visible}
          onCancel={this.close}
          footer={this.renderFooter()}
        >
          {this.state.importFailed
            ? this.renderErrorContent()
            : this.renderImportContent()}
        </Modal>
      </>
    );
  }
}

export default connect(({ home }) => ({
  attainmentTest: home.attainmentTest,
  modifyAnalysisDimension: home.modifyAnalysisDimension,
}))(AnalysisDimensionImportModalBase);

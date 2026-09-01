import React, { useEffect, useState } from "react";
import { Button, Icon, message, Modal, Upload } from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

const FileUploadModal = ({
  defaultFile,
  customButton = null, // 传 JSX 覆盖按钮
  onOk,
  paperId,
  dispatch,
}) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isUpload, setIsUpload] = useState(false);

  useEffect(() => {
    if (visible && defaultFile && defaultFile.id) {
      setFileList([
        {
          uid: defaultFile.id,
          name: defaultFile?.name || "--",
          status: "done",
          response: "Server Error 500", // custom error message to show
          url: `${window.location.origin}/api/new_download_file?id=${defaultFile.id}`,
        },
      ]);
    }
  }, [visible]);

  const onFileChange = (info) => {
    let { file, fileList } = info;
    console.log(info, "info");

    // 必须用 info.fileList 更新 state
    setFileList(fileList);

    // 删除文件
    if (file.status == "removed") {
      setFileList([]);
    }

    if (file.status == "done" && isUpload) {
      setIsUpload(false);
    } else if (file.status == "uploading" && !isUpload) {
      setIsUpload(true);
    }

    if (
      file &&
      file.status === "done" &&
      file.response &&
      file.response.status
    ) {
      setFileList([
        {
          uid: file.response.content[0].fileId,
          name: file?.name,
          status: "done",
          response: "Server Error 500", // custom error message to show
          url: `${window.location.origin}/api/new_download_file?id=${file.response.content[0].fileId}`,
        },
      ]);
      message.success(trans("fileUpload.uploadSuccess", "上传成功"));
    }
  };

  const uploadProperties = {
    name: "file",
    action: "/api/upload_file",
    accept: "file/*",
    multiple: false,
    headers: {
      authorization: "authorization-text",
    },
    fileList: fileList,
    onChange: onFileChange,
  };

  const uploadConfirm = () => {
    if (isUpload) {
      return message.warning(trans("fileUpload.uploading", "正在上传！"));
    }

    if (fileList && fileList.length > 0) {
      setLoading(true);
      dispatch({
        type: "global/updatePaperFile",
        payload: {
          id: paperId,
          paperUploadFileId: fileList[0].uid,
        },
        onSuccess: (res) => {
          message.success(trans("scoreSummary.operationSuccess", "操作成功！"));
          setLoading(false);
          setVisible(false);
          onOk && onOk(fileList[0].uid, fileList[0].name);
          setFileList([]);
        },
      });
    } else {
      message.error(trans("fileUpload.uploadFileRequired", "请上传文件"));
    }
  };

  return (
    <>
      {customButton ? (
        <div
          onClick={() => {
            console.log("visible", visible);
            setVisible(true);
          }}
        >
          {customButton}
        </div>
      ) : (
        <Button type="primary" onClick={() => setVisible(true)}>
          {trans("zhixueScoreImport.uploadFile", "上传文件")}
        </Button>
      )}

      <Modal
        title={trans("global.OriginalQuestionnaire", "原始问卷")}
        visible={visible}
        onOk={() => {
          uploadConfirm();
        }}
        onCancel={() => {
          setFileList([]);
          setVisible(false);
        }}
        width={400}
        confirmLoading={loading}
        wrapClassName={styles.fileUploadModal}
      >
        <Upload {...uploadProperties}>
          <div className={styles.uploadButton}>
            <Icon type="upload" className={styles.uploadIcon} />
            <div className={styles.uploadText}>
              {trans("global.uploadOriginalPaper", "上传原始问卷")}
            </div>
          </div>
        </Upload>

        {/* 已上传文件 */}
        {/* {
                    id ? <div className={styles.uploadedFiles}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Icon type="paper-clip" className={styles.fileIcon} />
                            <div
                                className={styles.fileNameBox}
                                onClick={() => download(file)}
                            >
                                {file.name || '原始问卷'}
                            </div>
                        </div>
                    </div> : null
                } */}
      </Modal>
    </>
  );
};

export default connect(() => ({}))(FileUploadModal);

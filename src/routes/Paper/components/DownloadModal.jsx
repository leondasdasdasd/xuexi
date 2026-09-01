import React, { useEffect, useState } from "react";
import { Icon, message, Modal, Upload } from "antd";
import { connect } from "dva";

import { trans } from "../../../utils/i18n";

import styles from "./DownloadModal.module.less";

const FileUploadModal = ({
  fileId,
  fileName,
  visible,
  onConfirm,
  baseUrl,
  onClose,
  immediateUpload,
  titleText,
}) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isUpload, setIsUpload] = useState(false);
  const [hasNewFile, setHasNewFile] = useState(false); // 标记是否有新上传的文件

  useEffect(() => {
    if (visible && fileId && fileName) {
      setFileList([
        {
          uid: fileId,
          name: fileName || "--",
          status: "done",
          response: "Server Error 500", // custom error message to show
          url: `${window.location.origin}${baseUrl}?id=${fileId}`,
        },
      ]);
      setHasNewFile(false); // 回显的文件，不是新上传的
    } else if (visible) {
      // 如果没有 fileId 和 fileName，清空文件列表
      setFileList([]);
      setHasNewFile(false);
    }
  }, [visible]);

  const validateFile = (file) => {
    // 文件类型仅支持word
    const isWord =
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isLt20M = file.size / 1024 / 1024 <= 20;

    return {
      isWord: isWord,
      isLt20M: isLt20M,
    };
  };

  const onFileChange = (info) => {
    const { file, fileList } = info;

    // 1️⃣ 删除文件（最高优先级）
    if (file.status === "removed") {
      setFileList([]);
      setHasNewFile(false);
      setIsUpload(false);
      return;
    }

    // 2️⃣ 业务校验（格式 / 大小）
    const { isWord, isLt20M } = validateFile(file);

    if (!isWord || !isLt20M) {
      // setFileList([]);
      // setHasNewFile(false);
      // setIsUpload(false);
      return;
    }

    // 3️⃣ 上传中
    if (file.status === "uploading") {
      setIsUpload(true);
      setFileList(fileList);
      return;
    }

    // 4️⃣ 上传失败
    if (file.status === "error") {
      message.error(trans("global.fileUploadFailure", "上传失败"));
      setIsUpload(false);
      setFileList([]);
      return;
    }

    // 5️⃣ 上传成功
    if (file.status === "done" && file.response?.status) {
      const newFile = {
        ...file,
        fileId: file.response.content?.[0]?.fileId,
      };

      setFileList([newFile]); // 单文件场景
      setHasNewFile(true);
      setIsUpload(false);
      message.success(trans("paper.upload.success", "上传成功"));
      return;
    }

    // 6️⃣ 兜底（极少触发）
    setFileList(fileList);
  };

  const beforeUpload = (file, fileList) => {
    const { isWord, isLt20M } = validateFile(file);

    if (!isWord) {
      message.error(
        trans("paper.upload.wordFormatOnly", "仅支持上传Word格式!"),
      );
    }

    if (!isLt20M) {
      message.info(trans("global.fileLarge", "上传文件过大！"));
    }

    if (!immediateUpload && isWord && isLt20M) {
      setHasNewFile(true);
      setFileList([file]);
      return false;
    }

    return isWord && isLt20M;
  };

  const commonUploadProperties = {
    name: "file",
    accept:
      "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    multiple: false,
  };
  const uploadProperties = immediateUpload
    ? {
        ...commonUploadProperties,
        action: "/api/upload_file",
        headers: {
          authorization: "authorization-text",
        },
        fileList: fileList,
        onChange: onFileChange,
        beforeUpload: beforeUpload,
      }
    : {
        ...commonUploadProperties,
        onRemove: (file) => {
          setHasNewFile(false);
          setFileList([]);
        },
        beforeUpload: beforeUpload,
        fileList: fileList || [],
      };

  const uploadConfirm = () => {
    if (isUpload) {
      return message.warning(trans("paper.upload.uploading", "正在上传！"));
    }
    if (hasNewFile && fileList && fileList.length > 0) {
      onConfirm && onConfirm(fileList[0], setLoading);
    } else if (!fileList || fileList.length === 0) {
      message.error(trans("paper.upload.fileRequired", "请上传文件"));
    } else {
      onClose && onClose();
    }
  };

  return (
    <Modal
      title={titleText}
      visible={visible}
      onOk={uploadConfirm}
      onCancel={() => {
        setFileList([]);
        setHasNewFile(false);
        onClose && onClose();
      }}
      width={400}
      confirmLoading={loading}
      wrapClassName={styles.downloadModal}
      zIndex={1001}
    >
      <Upload {...uploadProperties}>
        <div className={styles.uploadButton}>
          <Icon type="upload" className={styles.uploadIcon} />
          <div className={styles.uploadText}>
            {trans("global.uploadOriginalPaper", "上传原始问卷")}
          </div>
        </div>
      </Upload>
    </Modal>
  );
};

export default connect(() => ({}))(FileUploadModal);

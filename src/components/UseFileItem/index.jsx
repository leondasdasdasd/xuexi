import React, { PureComponent } from "react";
import { Tooltip } from "antd";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

class UseFileItem extends PureComponent {
  constructor(properties) {
    super();

    this.state = {};
  }

  //渲染附件封面
  renderFileCover = (item) => {
    if (item.type == "video") {
      return (
        <span
          className={`${styles.fileCover} ${styles.videoCover}`}
          style={{ backgroundImage: `url(${item.previewImage})` }}
          data-type="预览视频附件"
        >
          <em>
            <i className={`${icon.iconfont} ${styles.videoIcon}`}>&#xe7d0;</i>
          </em>
        </span>
      );
    } else if (item.type == "pdf") {
      return (
        <span
          className={`${styles.fileCover} ${styles.pdfCover}`}
          style={{ backgroundImage: `url(${item.previewImage})` }}
          data-type="预览pdf附件"
        >
          {/* <em>
              <i className={`${icon.iconfont} ${styles.pdfIcon}`}>PDF</i>
          </em> */}
        </span>
      );
    } else if (item.type == "link") {
      //在线地址或在线音视频
      return (
        <span
          className={styles.fileCover}
          data-type="预览在线地址&视频"
          style={{ backgroundImage: `url(${item.previewImage})` }}
        ></span>
      );
    } else {
      return (
        <span
          className={styles.fileCover}
          style={{ backgroundImage: `url(${item.previewImage})` }}
          data-type="预览附件"
        />
      );
    }
  };
  //获取文件名、文件类型
  getName = (fileName, type) => {
    if (fileName && !fileName.includes(".")) {
      return type === "name" ? fileName : null;
    }
    if (!fileName) return "";
    return type === "name"
      ? fileName.slice(0, Math.max(0, fileName.lastIndexOf(".")))
      : fileName.slice(Math.max(0, fileName.lastIndexOf(".")));
  };
  //点击附件区块查看附件
  clickPreviewFile = (item, e) => {
    if (e && e.target.dataset.type === "delete") return;

    if (item.fileContentUrl) {
      return false;
    } else if (this.props.lookDetail === undefined) {
      return false;
    } else {
      this.props.lookDetail(true, item);
    }
    // else if (item.type == "link") {
    //   this.previewLink(item);
    // }
  };
  //查看在线音视频或地址
  // previewLink = (item) => {
  //   if (item.url) {
  //     if (item.url.indexOf("iframe") != -1) {
  //       this.props.lookIframe(true,item.url);
  //     } else {
  //       window.open(item.url);
  //     }
  //   }
  // }

  render() {
    const { fileItem, deleteFile } = this.props;

    return (
      <div
        className={styles.fileOne}
        // onMouseDown={() => !deleteFile ? this.clickPreviewFile(fileItem) : null }
        // onTouchStart={() => !deleteFile ? this.clickPreviewFile(fileItem) : null }
        onClick={this.clickPreviewFile.bind(this, fileItem)}
      >
        {this.renderFileCover(fileItem)}
        {deleteFile ? (
          <i
            className={`${icon.iconfont} ${styles.deleteIcon}`}
            data-type="delete"
            onClick={() => deleteFile(fileItem.fileId)}
          >
            &#xe743;
          </i>
        ) : null}
        <span className={styles.fileInfo}>
          <Tooltip placement="top" title={fileItem.fileName || fileItem.url}>
            <em className={styles.fileName}>
              {this.getName(fileItem.fileName, "name") || fileItem.url}
            </em>
          </Tooltip>
          {/* {
            fileItem.type == "link"
              ? <em className={styles.fileSize}>{fileItem.type} {fileItem.fileSize}</em>
              : <em className={styles.fileSize}>{this.getName(fileItem.fileName, 'type') || fileItem.type} {fileItem.fileSize}</em>
          } */}
        </span>
      </div>
    );
  }
}

export default UseFileItem;

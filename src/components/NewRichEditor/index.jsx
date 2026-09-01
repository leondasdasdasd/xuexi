//最新富文本编辑器
import React, { PureComponent } from "react";
import RichEditor from "@yungu-fed/static-richeditor";
import OSS from "ali-oss";
import { message } from "antd";
import { connect } from "dva";

import ReloadModal from "components/ReloadModal/index";

import { trans } from "../../utils/i18n";
import { formatDate } from "../../utils/utils";

import styles from "./index.module.less";

let canSave = true;

@connect((state) => ({
  ossAssumeResult: state.global.ossAssumeResult,
  uploadFileResponse: state.global.uploadFileResponse,
}))
class NewRichEditor extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      timer: {},
      autoSaveTime: 0,
      reloadModalVisible: false,
      //   editorState: BraftEditor.createEditorState(props.initContent),
      editorState: properties.initContent,
      contenetText: "",
    };
  }

  getSaveTime() {
    let date = formatDate(new Date(), 7);
    this.setState({
      autoSaveTime: date,
    });
  }

  componentDidMount() {
    const { needAutoSave, source } = this.props;
    typeof this.props.onRefBraftEditor == "function" &&
      this.props.onRefBraftEditor(this);
    // if (
    //   (needAutoSave && needAutoSave === "no") ||
    //   (source && source === "Jpk")
    // ) {
    // } else {
    //   let timer = setInterval(() => {
    //     this.autoSave();
    //   }, 30000);
    //   this.setState({
    //     timer,
    //   });
    // }
  }

  clearTimer = () => {
    clearInterval(this.state.timer);
  };

  componentWillUnmount() {
    // this.clearTimer();
  }

  handleEditorChange = (editorState) => {
    console.log(editorState, "eeee");
    const { needAutoSave, updateEditorData } = this.props;
    editorState = editorState.replaceAll("\n", "");
    this.setState(
      {
        contenetText: editorState,
      },
      () => {
        if (needAutoSave && needAutoSave === "no") {
          typeof updateEditorData == "function" &&
            updateEditorData.call(this, editorState, this.props.questionId);
        }
      },
    );
  };

  autoSave = () => {
    const { editorState } = this.state;
    let reg = /<(p+)(?:\s[^>]*)?>\s*<\/\1>/gi;
    let htmlContent;
    htmlContent =
      editorState.replaceAll(reg, "") == ""
        ? ""
        : editorState.replaceAll(
            /<td([^>]*)>(.*?)<\/td>/gi,
            '<td$1><div style="padding: 10px 20px; display: block;">$2</div></td>',
          );
    this.saveEditor(htmlContent, true);
  };

  saveEditor = (htmlContent, isAutoSave, callback) => {
    const {
      dispatch,
      elementId,
      relationType,
      relationId,
      uuId,
      source,
      packId,
      fromJpk,
    } = this.props;
    if (!canSave) return false;
    canSave = false;
    let payloadObject =
      source && source === "Jpk"
        ? {
            id: packId,
            description: htmlContent,
          }
        : {
            elementId: elementId,
            relationType: relationType, //1：单元 2：日课
            relationId: relationId,
            resultType: 1, //(1:富文本结果 2:目标结果 3：素养指标结果)",
            uuId: uuId,
            content: htmlContent,
            isAutoSave: isAutoSave, //是否自动保存 true:自动 false:手动
          };
    if (fromJpk) {
      payloadObject.courseResourcesId = packId;
    }

    dispatch({
      type:
        source && source === "Jpk"
          ? "courseResource/updateDescription"
          : "unitDetail/addElementResult",
      payload: {
        ...payloadObject,
      },
      onSuccess: () => {
        this.getSaveTime();
        if (!isAutoSave) {
          //手动保存需要清空定时器
          const { reloadSource, cancelEditor } = this.props;
          this.clearTimer();
          typeof callback == "function" && callback(); //父组件手动保存回调
          message.success(
            trans("global.targetDetail.goalSetting.save.success", "保存成功"),
          );
          typeof cancelEditor == "function" && cancelEditor.call(this);
          typeof reloadSource == "function" && reloadSource.call(this); //手动保存需调用详情接口
        }
      },
      onReload: () => {
        this.setState({
          reloadModalVisible: true,
        });
      },
    }).then(() => {
      canSave = true;
    });
  };

  saveEdit = (callback) => {
    const { editorState } = this.state;
    let reg = /<(p+)(?:\s[^>]*)?>\s*<\/\1>/gi;
    let htmlContent;
    htmlContent =
      editorState.replaceAll(reg, "") == ""
        ? ""
        : editorState.replaceAll(
            /<td([^>]*)>(.*?)<\/td>/gi,
            '<td$1><div style="padding: 10px 20px; display: block;">$2</div></td>',
          );
    this.saveEditor(htmlContent, false, () => {
      typeof callback == "function" && callback();
    });
  };

  uploadImage = (files, callback) => {
    for (const [index, file] of files.entries()) {
      file["uuid"] = Date.now() + index;
      this.readFile(file, (responseFile) => {
        if (responseFile["uuid"] == file["uuid"]) {
          let imageList = [
            { url: `${window.location.origin}${responseFile.url}` },
          ];
          typeof callback == "function" && callback.call(this, imageList);
        }
      });
    }
  };

  dataURLtoFile = (newUrl, urlType, filename) => {
    /* let arr = newUrl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), */
    let bstr = atob(newUrl);
    let n = bstr.length;
    let u8array = new Uint8Array(n);
    console.log("arr", 11);
    while (n--) {
      u8array[n] = bstr.charCodeAt(n);
    }
    return new File([u8array], filename, { type: urlType });
  };

  //支持复制粘贴word文档中的图片
  uploadPasteWordImg = (blobInfo, callback) => {
    let uuid = Date.now();
    this.getOssAssume("").then(() => {
      const { ossAssumeResult } = this.props;
      let newBinary = blobInfo.blob();
      let client = new OSS({
        region: ossAssumeResult.region,
        accessKeyId: ossAssumeResult.accessKeyId,
        accessKeySecret: ossAssumeResult.accessSecret,
        bucket: ossAssumeResult.bucketName,
        endpoint: ossAssumeResult.endpoint,
        stsToken: ossAssumeResult.stsToken,
        ossPath: ossAssumeResult.ossPath,
      });
      let dataUrl = this.dataURLtoFile(blobInfo.base64(), newBinary.type, "");
      client
        .multipartUpload(
          `${ossAssumeResult.ossPath}${uuid}_${blobInfo.filename()}`,
          dataUrl,
          {},
        )
        .then((response) => {
          if (response.res && response.res.status == "200") {
            let origin = ossAssumeResult.endpoint.split("//")[1];
            let fileUrl = `https://${ossAssumeResult.bucketName}.${origin}/${
              ossAssumeResult.ossPath
            }${uuid}_${blobInfo.filename()}?x-oss-process=image/resize,w_800`;
            typeof callback == "function" && callback(fileUrl);
          } else {
            message.error(trans("newRichEditor.uploadFailed", "上传失败"));
          }
        })
        .catch((error) => {
          message.error(trans("newRichEditor.ossError", "哎呀，oss出错了"));
        });
    });
  };

  uploadFolder = (files, callback) => {
    for (const [index, file] of files.entries()) {
      file["uuid"] = Date.now() + index;
      this.readFile(file, (responseFile) => {
        if (responseFile["uuid"] == file["uuid"]) {
          let fileList = [
            {
              url: `${window.location.origin}${responseFile.url}`,
              name: responseFile.fileName,
            },
          ];
          typeof callback == "function" && callback.call(this, fileList);
        }
      });
    }
  };

  uploadMedia = (files, callback) => {
    for (const [index, file] of files.entries()) {
      file["uuid"] = Date.now() + index;
      this.readFile(file, (responseFile) => {
        if (responseFile["uuid"] == file["uuid"]) {
          let videoList = [
            { url: `${window.location.origin}${responseFile.url}` },
          ];
          typeof callback == "function" && callback.call(this, videoList);
        }
      });
    }
  };

  getOssAssume(type) {
    const { dispatch } = this.props;
    return dispatch({
      type: "global/getOssAssume",
      payload: {
        type: type,
      },
    });
  }

  readFile = (file, callback) => {
    this.uploadToOss(file, (res) => {
      typeof callback == "function" && callback(res);
    });
  };

  uploadToOss = (files, callback) => {
    this.getOssAssume(1).then(() => {
      const { ossAssumeResult, dispatch } = this.props;
      let client = new OSS({
        region: ossAssumeResult.region,
        accessKeyId: ossAssumeResult.accessKeyId,
        accessKeySecret: ossAssumeResult.accessSecret,
        bucket: ossAssumeResult.bucketName,
        endpoint: ossAssumeResult.endpoint,
        stsToken: ossAssumeResult.stsToken,
        ossPath: ossAssumeResult.ossPath,
      });
      client
        .multipartUpload(
          `${ossAssumeResult.ossPath}${files.uuid}_${files.name}`,
          files,
          {},
        )
        .then((response) => {
          if (response.res && response.res.status == "200") {
            let fileUrl = `${ossAssumeResult.ossPath}${files.uuid}_${files.name}`;
            dispatch({
              type: "global/payloadUploadFile",
              payload: {
                fileName: files.name,
                bucketName: ossAssumeResult.bucketName,
                fileSize: files.size || 0,
                fileType: files.type || "",
                fileUrl: fileUrl,
                percent: 100,
                uuid: files.uuid,
              },
              onSuccess: () => {
                const { uploadFileResponse } = this.props;
                typeof callback == "function" && callback(uploadFileResponse);
              },
            });
          } else {
            message.error(trans("newRichEditor.uploadFailed", "上传失败"));
          }
        })
        .catch((error) => {
          message.error(trans("newRichEditor.ossError", "哎呀，oss出错了"));
        });
    });
  };

  render() {
    const { needAutoSave, placeholder, height, noBorder } = this.props;
    return (
      <div data-block="富文本">
        <div className={styles.editorWrapper} id="editorWrapper">
          <RichEditor
            height={height || 413}
            placeholder={placeholder || trans("study.pleaseFill", "请输入")}
            // language={locale() == "en" ? "en" : "zh_CN"}
            statusbar={false}
            skin={noBorder === true ? "noBorder" : "border"}
            initContent={this.state.editorState}
            uploadImage={this.uploadImage}
            uploadFolder={this.uploadFolder}
            uploadMedia={this.uploadMedia}
            handleEditorChange={this.handleEditorChange}
            uploadPasteWordImg={this.uploadPasteWordImg}
          />
        </div>
        {needAutoSave && needAutoSave === "no" ? (
          noBorder === true ? null : (
            <div className={styles.noBtn}></div>
          )
        ) : (
          <p className={styles.operButton}>
            <span
              className={styles.saveBtn}
              onClick={this.saveEdit}
              data-type="手动保存富文本内容"
            >
              {trans("template.finish", "完成")}
            </span>
            {this.state.autoSaveTime ? (
              <span className={styles.lockTime}>
                {trans("teachingPlan.autoSaveTime", "自动保存于")}{" "}
                {this.state.autoSaveTime}
              </span>
            ) : null}
          </p>
        )}

        {this.state.reloadModalVisible && (
          <ReloadModal reloadModalVisible={this.state.reloadModalVisible} />
        )}
      </div>
    );
  }
}

export default NewRichEditor;

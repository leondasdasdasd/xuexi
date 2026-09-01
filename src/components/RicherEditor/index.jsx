//学习计划富文本编辑器
import React, { PureComponent } from "react";
import { message } from "antd";
import BraftEditor from "braft-editor";
import Table from "braft-extensions/dist/table";
import { connect } from "dva";

import { locale, trans } from "../../utils/i18n";
import { formatDate } from "../../utils/utils";

import "braft-editor/dist/index.css";
import "braft-extensions/dist/table.css";
import styles from "./index.module.less";

let canSave = true;
class RicherEditor extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      editorState: BraftEditor.createEditorState(properties.initContent),
      timer: {},
      autoSaveTime: 0,
      reloadModalVisible: false,
      reloadModalVisibleEdit: false,
    };
    this.editorInstance = null;
  }

  //获取自动保存时间
  getSaveTime = () => {
    let date = formatDate(new Date(), 7);
    this.setState(
      {
        autoSaveTime: date,
      },
      () => {
        // console.log(this.state.autoSaveTime, "333");
      },
    );
  };

  //获取焦点
  foucusFn = () => {
    let draftInstance = this.editorInstance.getDraftInstance();
    draftInstance.focus();
  };

  componentDidMount() {
    if (this.props.blankBraft) {
      return false; //空的富文本不用加载
    }
    typeof this.props.onRefBraftEditor == "function" &&
      this.props.onRefBraftEditor(this);
    //this.foucusFn();
    let timer = setInterval(() => {
      this.autoSave();
    }, 25_000); //自动保存时间30000，暂时改成10000，方便测试
    this.setState({
      timer,
    });
    this.props.onRef(this);
  }

  componentWillUnmount() {
    this.clearTimer();
  }

  handleEditorChange = (editorState) => {
    this.setState({
      editorState,
    });
  };

  //清除定时器
  clearTimer = () => {
    clearInterval(this.state.timer);
  };

  //自动保存功能
  autoSave = () => {
    let editorValue = BraftEditor.createEditorState(this.state.editorState);
    let reg = /<(p+)(?:\s[^>]*)?>\s*<\/\1>/gi;
    let htmlContent;
    htmlContent =
      editorValue.toHTML().replaceAll(reg, "") == ""
        ? ""
        : editorValue
            .toHTML()
            .replaceAll(
              /<td([^>]*)>(.*?)<\/td>/gi,
              '<td$1><div style="padding: 10px 20px; display: block;">$2</div></td>',
            );
    this.saveEditor(htmlContent, true);
  };

  //保存富文本
  saveEditor = (htmlContent, isAutoSave = false, callback) => {
    console.log(htmlContent);
    console.log(htmlContent.length - 7, "333");
    const { examId, modelKey, uuId } = this.props;
    if (!canSave) return false;
    canSave = false;
    this.props
      .dispatch({
        type: "home/postEditReport",
        payload: {
          examId: examId,
          modelKey: modelKey, //1：命题分析 2：备课组长总结
          contentString: htmlContent,
          uuId,
          isAutoSave,
        },
        onSuccess: (res) => {
          // console.log(res.content.code, "444");
          if (res.content.code == 3) {
            // this.setState(
            //   {
            //     reloadModalVisibleEdit: true,
            //   },
            //   () => {
            //     this.props.reloadModalVisibleEditText()
            //     if (!isAutoSave) {
            //       this.props.blurEdit();
            //     }
            //   }
            // );
            this.props.reloadModalVisibleEditText();
            if (!isAutoSave) {
              this.props.blurEdit();
              this.props.releaseLock();
            }
            // console.log("eee", "444");
          } else {
            if (!isAutoSave) {
              this.props.blurEdit();
              this.props.releaseLock();
              message.success(trans("global.saveSuccess", "保存成功"));
            }
          }

          // this.getSaveTime();
          // if (!isAutoSave) {
          //   //手动保存需要清空定时器
          //   const { reloadSource, cancelEditor } = this.props;
          //   this.clearTimer();
          //   typeof callback == "function" && callback(); //父组件手动保存回调
          //   message.success(trans("global.saveSuccess", "保存成功"));
          //   typeof cancelEditor == "function" && cancelEditor.call(this);
          //   typeof reloadSource == "function" && reloadSource.call(this); //手动保存需调用详情接口
          // }
        },
      })
      .then(() => {
        this.getSaveTime();
        // if (!isAutoSave) {
        canSave = true;
        this.props.changeText(htmlContent);
        // console.log(this.props.editReport, "444");
        // this.props.blurEdit();
        // if (this.props.editReport.content.code == 3) {
        //   this.setState({
        //     reloadModalVisibleEdit: true,
        //   });
        // }
        // }
      });
  };

  //取消编辑
  cancelEditor = () => {
    const { cancelEditor } = this.props;
    this.clearTimer();
    typeof cancelEditor == "function" && cancelEditor.call(this, "releseLock");
  };

  //保存编辑内容
  saveEdit = (callback) => {
    let editorValue = BraftEditor.createEditorState(this.state.editorState);
    console.log(this.state.editorState, "333");
    let reg = /<(p+)(?:\s[^>]*)?>\s*<\/\1>/gi;
    let htmlContent;
    htmlContent =
      editorValue.toHTML().replaceAll(reg, "") == ""
        ? ""
        : editorValue
            .toHTML()
            .replaceAll(
              /<td([^>]*)>(.*?)<\/td>/gi,
              '<td$1><div style="padding: 10px 20px; display: block;">$2</div></td>',
            );
    this.saveEditor(htmlContent, false, () => {
      typeof callback == "function" && callback(); //父级组件手动保存的回调
    });
    this.clearTimer();
    // this.props.blurEdit();
  };

  //媒体上传
  mediaUpload = (parameter) => {
    const filesImg = parameter.file;
    // if (!/image\/\w+/.test(filesimg.type)) {
    //     alert('选择的文件不是图片');
    //     return false;
    // }
    this.uploadImg(filesImg, parameter);
  };

  uploadImg = (imgSource, parameters) => {
    const file = imgSource;
    //执行上传文件，然后成功之后，params.success({url: url})
    const { dispatch } = this.props;
    dispatch({
      type: "global/uploadFile",
      payload: file,
      onSuccess: (res) => {
        let fileUrl = res && res[0] && res[0].url;
        let PinFileUrl = window.location.origin.includes("localhost")
          ? "https://task.daily.yungu-inc.org/" + fileUrl
          : window.location.origin + fileUrl;
        parameters.success({
          url: PinFileUrl,
          meta: {
            loop: true, // 指定音视频是否循环播放
            autoPlay: false, // 指定音视频是否自动播放
            controls: true, // 指定音视频是否显示控制栏
          },
        });
      },
    });
  };

  render() {
    const { editorState } = this.state;
    let options = {
      defaultColumns: 5, // 默认列数
      defaultRows: 5, // 默认行数
      withDropdown: true, // 插入表格前是否弹出下拉菜单
      columnResizable: true, // 是否允许拖动调整列宽，默认false
      exportAttrString:
        'border="1" style="border-collapse: collapse; word-break: break-all;border: 1px solid rgba(1,17,61,0.16); width: 98%;"', // 指定输出HTML时附加到table标签上的属性字符串
    };
    BraftEditor.use(Table(options));
    return (
      <div data-block="富文本">
        <div className={styles.editorWrapper} id="editorWrapper">
          <BraftEditor
            ref={(instance) => (this.editorInstance = instance)}
            value={editorState}
            contentFormat={"html"}
            language={locale() == "en" ? "en" : "zh"}
            onChange={this.handleEditorChange}
            media={{
              uploadFn: this.mediaUpload,
              externals: {
                "externals.image": false,
                "externals.video": false,
                "externals.audio": false,
                "externals.embed": false,
              },
            }}
            style={{
              border: "1px solid rgba(1,17,61,0.16)",
              borderRadius: "10px 10px 0 0",
              borderBottom: "0 none",
            }}
          />
        </div>
        <p className={styles.operButton}>
          {/* <span className={styles.cancelBtn} onClick={this.cancelEditor}>{trans("global.cancel", "取消")}</span> */}
          <span
            className={styles.saveBtn}
            onClick={this.saveEdit}
            data-type="手动保存富文本内容"
          >
            {trans("global.complete", "完成")}
          </span>
          {this.state.autoSaveTime ? (
            <span className={styles.lockTime}>
              {trans("teachingPlan.autoSaveTime", "自动保存于")}{" "}
              {this.state.autoSaveTime}
            </span>
          ) : null}
        </p>

        {/* {this.state.reloadModalVisibleEdit ? (
          <ReloadModal reloadModalVisible={this.state.reloadModalVisibleEdit} />
        ) : null} */}
      </div>
    );
  }
}
export default connect(({ home }) => ({
  editReport: home.editReport,
}))(RicherEditor);

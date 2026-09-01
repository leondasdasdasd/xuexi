//学习计划富文本编辑器
import React, { PureComponent } from "react";
import BraftEditor from "braft-editor";
import Table from "braft-extensions/dist/table";
import { connect } from "dva";

import { locale } from "../../utils/i18n";
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
    // let timer = setInterval(() => {
    //   this.autoSave();
    // }, 25000); //自动保存时间30000，暂时改成10000，方便测试
    // this.setState({
    //   timer,
    // });
    this.props.onRef(this);
  }

  componentWillUnmount() {
    // this.clearTimer();
  }

  handleEditorChange = (editorState) => {
    this.setState(
      {
        editorState,
      },
      () => {
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
        this.props.changeText(this.props.questionId, htmlContent);
      },
    );
  };

  //清除定时器
  // clearTimer = () => {
  //   clearInterval(this.state.timer);
  // };

  //自动保存功能
  // autoSave = () => {
  //   let editorValue = BraftEditor.createEditorState(this.state.editorState);
  //   let reg = /<([p]+?)(?:\s+?[^>]*?)?>\s*?<\/\1>/gi;
  //   let htmlContent;
  //   if (editorValue.toHTML().replace(reg, "") == "") {
  //     htmlContent = "";
  //   } else {
  //     htmlContent = editorValue
  //       .toHTML()
  //       .replace(
  //         /<td([^>]*)>(.*?)<\/td>/gi,
  //         '<td$1><div style="padding: 10px 20px; display: block;">$2</div></td>'
  //       );
  //   }
  //   this.saveEditor(htmlContent, true);
  // };

  //保存富文本
  // saveEditor = (htmlContent, isAutoSave = false, callback) => {
  //   console.log(htmlContent);
  //   console.log(htmlContent.length - 7, "333");
  //   const {} = this.props;
  //   if (!canSave) return false;
  //   canSave = false;
  // };

  //取消编辑
  // cancelEditor = () => {
  //   const { cancelEditor } = this.props;
  //   this.clearTimer();
  //   typeof cancelEditor == "function" && cancelEditor.call(this, "releseLock");
  // };

  //保存编辑内容
  // saveEdit = (callback) => {
  //   let editorValue = BraftEditor.createEditorState(this.state.editorState);
  //   console.log(this.state.editorState, "333");
  //   let reg = /<([p]+?)(?:\s+?[^>]*?)?>\s*?<\/\1>/gi;
  //   let htmlContent;
  //   if (editorValue.toHTML().replace(reg, "") == "") {
  //     htmlContent = "";
  //   } else {
  //     htmlContent = editorValue
  //       .toHTML()
  //       .replace(
  //         /<td([^>]*)>(.*?)<\/td>/gi,
  //         '<td$1><div style="padding: 10px 20px; display: block;">$2</div></td>'
  //       );
  //   }
  //   this.saveEditor(htmlContent, false, () => {
  //     typeof callback == "function" && callback(); //父级组件手动保存的回调
  //   });
  //   this.clearTimer();
  // };

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
        {/* <p className={styles.operButton}>
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
        </p> */}

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

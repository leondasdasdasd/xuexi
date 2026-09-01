//单题录入富文本编辑器
import React, { PureComponent } from "react";
import BraftEditor from "braft-editor";
import { connect } from "dva";

import MathEditor from "components/MathEditor";

import { locale, trans } from "../../utils/i18n";

import "braft-editor/dist/index.css";
import icon from "../../icon.module.less";
import styles from "./index.module.less";

@connect((state) => ({
  mathImage: state.inputQuestion.mathImage, //公式转为图片
}))
class RicherEditor extends PureComponent {
  constructor(properties) {
    super(properties);
    console.log(
      properties.initContent,
      ">>>",
      BraftEditor.createEditorState(properties.initContent).toHTML(),
    );
    this.state = {
      editorState: BraftEditor.createEditorState(properties.initContent),
      mathEditorVisible: false,
      target: null,
    };
    this.editorInstance = null;
    this.child = null;
  }

  UNSAFE_componentWillReceiveProps(nextProperties) {
    if (nextProperties.questionType != this.props.questionType) {
      //切换题目类型，重置富文本
      this.setState({
        editorState: BraftEditor.createEditorState(nextProperties.initContent),
      });
    }
  }

  componentDidMount() {
    const that = this;
    this.props.onRef(this);
    window.addEventListener(
      "dblclick",
      function (event_) {
        let event = event_ || window.event;
        let target = event.target || event.srcElement;
        // console.log(event, "222");
        if (target.nodeName.toLowerCase() == "img") {
          let url = target.dataset.value || null;
          let number_ = target.currentSrc.lastIndexOf("mathUrl");
          let mathUrl = target.currentSrc.substring(
            number_ + 8,
            target.currentSrc.length,
          );
          console.log(mathUrl, "kkk");
          that.child && that.child.setContent(mathUrl);
          if (mathUrl) {
            that.setState({
              target: target,
              mathEditorVisible: true,
            });
          }
        }
      },
      true,
    );
  }
  onRef = (reference) => {
    this.child = reference;
  };
  handleEditorChange = (editorState) => {
    console.log(editorState, "jje");
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
            : editorValue.toHTML();
        console.log(htmlContent, "jj");
        this.saveChange(htmlContent);
      },
    );
  };

  //存取输入的内容
  saveChange = (htmlContent) => {
    const { braftType, changeFill } = this.props;
    if (braftType == "option") {
      //题目选项内容
      typeof changeFill == "function" && changeFill.call(this, htmlContent);
    } else if (braftType == "questionContent") {
      //题干
      typeof changeFill == "function" && changeFill.call(this, htmlContent);
    } else if (braftType == "analysisContent") {
      //答案解析
      typeof changeFill == "function" && changeFill.call(this, htmlContent);
    } else if (braftType == "answerContent") {
      //答案解析
      typeof changeFill == "function" && changeFill.call(this, htmlContent);
    } else if (braftType == "propositionalAnalysis") {
      //命题分析
      typeof changeFill == "function" && changeFill.call(this, htmlContent);
    } else if (braftType == "text0") {
      //命题分析
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text1") {
      //命题分析
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text2") {
      //命题分析
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text3") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text4") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text5") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text6") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text7") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text8") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text9") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text10") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text11") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text12") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text13") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text14") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text15") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text16") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text17") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text18") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text19") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text20") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    } else if (braftType == "text21") {
      typeof changeFill == "function" &&
        changeFill.call(this, htmlContent, this.props.questionId);
    }
  };

  //媒体上传
  mediaUpload = (parameters) => {
    const filesImg = parameters.file;
    this.uploadImg(filesImg, parameters);
  };

  uploadImg = (imgSource, parameters) => {
    const file = imgSource;
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

  //展示公式编辑器
  showMathEditor = (visible) => {
    this.setState({
      mathEditorVisible: visible,
    });
  };

  //公式转为图片
  mathToImage = (content, callback) => {
    const { dispatch } = this.props;
    dispatch({
      type: "inputQuestion/mathToImage",
      payload: {
        latex: content,
      },
      onSuccess: () => {
        const { mathImage } = this.props;
        callback && callback();
        // let htmlStr = `<img src=${mathImage} data-value=${encodeURI(
        //   content
        // )} class="f-marker"/>`;
        let htmlString = `<img src=${mathImage}?mathUrl=${encodeURI(
          content,
        )} class="f-marker"/>`;
        //拼接内容，重新赋值到富文本
        let editorValue = BraftEditor.createEditorState(this.state.editorState);
        let reg = /<(p+)(?:\s[^>]*)?>\s*<\/\1>/gi;
        let htmlContent = editorValue.toHTML().replaceAll(reg, "");
        let newHtml = htmlContent + htmlString;
        console.log(newHtml, "hhnb");
        this.setState({
          editorState: BraftEditor.createEditorState(newHtml),
        });
      },
    });
  };

  //失去焦点退出编辑操作
  blurFun = () => {
    if (this.props.blue) {
      if (this.state.mathEditorVisible) return false;
      const { blurEdit } = this.props;
      typeof blurEdit == "function" && blurEdit.call(this);
    }
  };

  //获取焦点
  foucusFn = () => {
    let draftInstance = this.editorInstance.getDraftInstance();
    if (this.props.focus) {
      draftInstance?.focus();
    }
  };

  render() {
    const { braftType } = this.props;
    const { editorState } = this.state;
    console.log(editorState.toHTML(), "render");
    //自定义按钮
    let extendControls = [
      {
        key: "math-button", // 控件唯一标识，必传
        type: "button",
        title: trans("batchInput.mathButton", "数学公式"), // 指定鼠标悬停提示文案
        className: styles.mathButton, // 指定按钮的样式名
        html: `<i class="${icon.iconfont}">&#xe785;</i>`, // 指定在按钮中渲染的html字符串
        text: "Hello", // 指定按钮文字，此处可传入jsx，若已指定html，则text不会显示
        onClick: () => {
          this.showMathEditor(true);
        },
      },
    ];
    return (
      <div>
        <div
          className={`${styles.editorWrapper} braftEditorDiv`}
          key={this.props.key}
        >
          <BraftEditor
            key={this.props.key}
            ref={(instance) => (this.editorInstance = instance)}
            value={editorState}
            contentFormat={"html"}
            language={locale() == "en" ? "en" : "zh"}
            onChange={this.handleEditorChange}
            extendControls={extendControls}
            excludeControls={[
              "letter-spacing",
              "remove-styles",
              "emoji",
              "text-indent",
              "clear",
              "line-height",
              "font-family",
              "link",
              "headings",
              "blockquote",
              "code",
              "hr",
              "separator",
            ]}
            onBlur={this.blurFun}
            media={{
              uploadFn: this.mediaUpload,
              externals: {
                "externals.image": false,
                "externals.video": false,
                "externals.audio": false,
                "externals.embed": false,
              },
            }}
            placeholder={this.props.placeholder || ""}
            style={{
              border:
                braftType == "option" ? "1px solid #ddd" : "1px solid #ddd",
              borderRadius: "10px",
              minHeight: "150px",
            }}
          />
          <MathEditor
            visible={this.state.mathEditorVisible}
            showMathEditor={(bool) => this.showMathEditor(bool)}
            onRef={this.onRef}
            target={this.state.target}
            mathToImage={(content, callback) =>
              this.mathToImage(content, callback)
            }
          />
        </div>
      </div>
    );
  }
}

export default RicherEditor;

//数学公式编辑器
import React, { PureComponent } from "react";
import { Icon, Input, message, Modal } from "antd";
import { BlockMath } from "react-katex";

import { trans } from "../../utils/i18n";

import "katex/dist/katex.min.css";
import icon from "../../icon.module.less";
import styles from "./index.module.less";
const { TextArea } = Input;

class MathEditor extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      mathContent: "",
    };
  }

  componentDidMount() {
    console.log(this.props.target, ">>ß");
    this.props.onRef && this.props.onRef(this);
  }

  setContent = (value) => {
    this.setState({
      mathContent: decodeURI(value),
    });
  };
  hideModal = () => {
    const { showMathEditor } = this.props;
    this.setState({
      mathContent: "",
    });
    typeof showMathEditor == "function" && showMathEditor.call(this, false);
  };

  textBlur = () => {
    let newContent = this.state.mathContent;
    newContent = newContent
      .replaceAll("——", "-")
      .replaceAll("。", ".")
      .replaceAll("（", "(")
      .replaceAll("）", ")")
      .replaceAll("﹣", "-")
      .replaceAll("+", "+")
      .replaceAll("*", "*")
      .replaceAll("/", "/")
      .replaceAll("，", ",");
    console.log(newContent, "blur");
    this.setState({
      mathContent: newContent,
    });
  };
  fillChange = (e) => {
    let newContent = e.target.value;
    newContent = newContent
      .replaceAll("＝", "=")
      .replaceAll("——", "-")
      .replaceAll("。", ".")
      .replaceAll("（", "(")
      .replaceAll("）", ")")
      .replaceAll("﹣", "-")
      .replaceAll("+", "+")
      .replaceAll("*", "*")
      .replaceAll("/", "/")
      .replaceAll("，", ",");
    this.setState({
      mathContent: newContent,
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

  render() {
    const { visible } = this.props;
    const { mathContent } = this.state;
    console.log(visible, "bv");
    return (
      <div>
        <Modal
          title={null}
          footer={null}
          visible={visible}
          onCancel={this.hideModal}
          className={styles.editorModal}
          closable={false}
        >
          <Icon
            type="close"
            className="quxiao"
            onClick={this.hideModal}
            style={{ fontSize: "20px" }}
          />
          <h3>{trans("mathEditor.latexEditor", "公式编辑器")}</h3>
          <p className={styles.learnRule}>
            <a
              href="https://www.yuque.com/yuque/gpvawt/brzicb"
              target="_blank"
              rel="noreferrer"
            >
              <i className={icon.iconfont}>&#xe880;</i>
              {trans("mathEditor.learnRules", "了解LaTex语法")}
            </a>
          </p>
          <div className={styles.inputArea}>
            <TextArea
              value={mathContent}
              className={styles.textAreaStyle}
              onChange={this.fillChange}
              onBlur={this.textBlur}
              placeholder={trans(
                "mathEditor.placeholder",
                "目前只支持LaTex语法输入公式，公式插入后，会变成图片插入题目中，直接支持公式复制粘贴和再次编辑，我们正在找解决方案，请耐心等待下~",
              )}
            />
          </div>
          <div className={styles.showArea}>
            <p className={styles.tips}>
              {trans("mathEditor.previewLatex", "公式预览")}：
            </p>
            <BlockMath errorColor={"#cc0000"}>{mathContent}</BlockMath>
          </div>
          <div className={styles.operBtn}>
            <span className={styles.whiteBtn} onClick={this.hideModal}>
              {trans("global.cancle", "取消")}
            </span>
            <span className={styles.blueBtn} onClick={this.submit}>
              {trans("global.sure", "确定")}
            </span>
          </div>
        </Modal>
      </div>
    );
  }
}

export default MathEditor;

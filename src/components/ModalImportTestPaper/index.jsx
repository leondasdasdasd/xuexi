// 类组件
import React from "react";
import { Button, Form, Icon, message, Radio, Upload } from "antd";

import { trans } from "../../utils/i18n";
import request from "../../utils/request";
import ComnModal from "../ComnModal";
class ModalImportTestPaper extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      onOKLoding: false,
      fileList: [],
      bigNumberReset: 0,
      formItemLayout: {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
      },
    };
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      // xxx: nextProps.xxx,
    };
  }

  componentDidMount() {}
  bigNumberResetChange = (e) => {
    this.setState({
      bigNumberReset: e.target.value,
    });
  };

  handleSubmit = () => {
    const { fileList } = this.state;

    if ((fileList || []).length === 0) {
      return message.error(trans("paper.uploadPaperRequired", "请上传试卷"));
    }

    const { paperId, subjectId, gradeId } =
      this.props.modalImportTestPaperProps;
    const { bigNumberReset } = this.state;
    // 创建 formData
    const formData = new FormData();
    // 添加名字为files的文件数据
    // files会作为调用接口时的参数名，需要根据接口修改
    formData.append("files", fileList[0]);
    formData.append("paperId", paperId);
    formData.append("bigNumberReset", Boolean(bigNumberReset));
    formData.append("gradeId", gradeId);
    formData.append("subjectId", subjectId);
    this.setState({ onOKLoding: true });

    request("/api/word/upload_analysis_word", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (res.status) {
          let hide = null;
          let url = null;
          if (res.content?.haveQuestion) {
            hide = message.loading({
              icon: (
                <Icon
                  type="check-circle"
                  theme="filled"
                  style={{ color: "#52c41a" }}
                />
              ),
              content: "题目解析成功，将跳转到试卷编辑，请再次核对题目内容。",
              duration: 0,
            });
            url = `${window.location.origin}/exam#/detail/false/true/${subjectId}/${res.content.paperId}/${null}/${true}`;
          } else {
            hide = message.loading({
              icon: (
                <Icon
                  type="exclamation-circle"
                  theme="filled"
                  style={{ color: "#faad14" }}
                />
              ),
              content: "试卷已创建，但题目未能解析成功，将跳转到试卷在线预览。",
              duration: 0,
            });
            let uploadFileResponseModelList =
              res.content?.uploadFileResponseModelList[0]?.url;
            url = `${window.location.origin}${uploadFileResponseModelList}`;
          }
          let timeId1 = setTimeout(hide, 3000);
          let timeid2 = setTimeout(() => {
            clearTimeout(timeId1);
            clearTimeout(timeid2);
            // TODO:这里需要刷新试卷列表
            this.props.modalImportTestPaperProps.options.onOk();
            this.setState({ onOKLoding: false });

            window.open(url);
          }, 3200);
        } else {
          message.error(res.message);
          this.setState({ onOKLoding: false });
        }
      })
      .catch((error) => {
        this.setState({
          onOKLoding: false,
        });
      });
  };
  onClick = () => {};
  render() {
    const { onOKLoding, formItemLayout, fileList, bigNumberReset } = this.state;
    const { modalImportTestPaperProps } = this.props;
    const { options } = modalImportTestPaperProps;

    const uploadProperties = {
      onRemove: (file) => {
        this.setState((state) => {
          return {
            fileList: [],
          };
        });
      },
      beforeUpload: (file) => {
        this.setState({
          fileList: [file],
        });
        return false;
      },
      fileList,
    };

    return (
      <div className="ModalImportTestPaper">
        <ComnModal
          options={{
            ...options,
            title: trans("global.uploadTest", "上传试题卷"),
            okButtonProps: {
              loading: onOKLoding,
            },
            centered: true,
            onOk: this.handleSubmit, // 提交表单
            cancelButtonProps: {
              // 点击取消按钮
              onClick: () => {
                this.props.modalImportTestPaperProps.options.onCancel();
              },
            },
          }}
          innerContent={
            <Form
              {...formItemLayout}
              onSubmit={this.handleSubmit}
              colon={false}
              className="login-form"
            >
              <Form.Item
                label={trans("paper.questionNumberingRule", "题号编排规则")}
                required
                className="lh28"
              >
                <Radio.Group
                  onChange={this.bigNumberResetChange}
                  value={bigNumberReset}
                  style={{ lineHeight: "2" }}
                >
                  <Radio value={0}>
                    {trans(
                      "paper.questionNumberingGlobalIncrement",
                      "题号全局递增",
                    )}
                  </Radio>
                  <Radio value={1}>
                    {trans(
                      "paper.questionNumberingSectionIncrement",
                      "大题内从1递增",
                    )}
                  </Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label={trans("global.uploadTest", "上传试题卷")}
                required
              >
                <Upload {...uploadProperties}>
                  <Button>
                    <Icon type="upload" />
                    {trans("global.uploadFiles", "上传文件")}
                  </Button>
                  <div
                    style={{ position: "absolute", left: "0", bottom: "-26px" }}
                  >
                    <Icon type="warning" theme="twoTone" /> &nbsp;
                    {trans("global.pleaseUpload", "请上传Word格式的试题卷")}
                  </div>
                </Upload>
              </Form.Item>
            </Form>
          }
        />
      </div>
    );
  }
}

export default ModalImportTestPaper;

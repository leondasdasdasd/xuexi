// 类组件
// import styles from './index.less';
import React from "react";
import {
  Button,
  Form,
  Icon,
  Input,
  InputNumber,
  message,
  Radio,
  Select,
  Upload,
} from "antd";

import ComnModal from "../../../components/ComnModal";
import {
  queryAllGrade,
  queryAllTestSubject,
  queryExamType,
} from "../../../services/example";
import { locale, trans } from "../../../utils/i18n";
import request from "../../../utils/request";
const language = locale() == "en" ? false : true;
const { Option } = Select;
class ModalImportPager extends React.Component {
  formRef = React.createRef();
  constructor(properties) {
    super(properties);
    this.state = {
      paperName: undefined,
      totalScore: undefined,
      gradeId: undefined,
      subjectId: undefined,
      type: undefined,
      subjectListTest: [],
      allGrade: [],
      fileList: [],
      examTypeList: [],
      bigNumberReset: 0,
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

  componentDidMount() {
    // 获取年级
    queryAllGrade().then((res) => {
      if (res.status) {
        this.setState({
          allGrade: res.content,
        });
      } else {
        message.error(res.message);
      }
    });
    queryExamType({ type: 1 }).then((res) => {
      if (res.status) {
        // 作业单内导入
        let temporaryExamTypeList = res.content.filter(
          (item) => item.typeName === "作业单",
        );
        for (const element of res.content) {
          if (element.typeName === "作业单") {
            this.setState({
              type: element.code,
              examTypeList: temporaryExamTypeList,
            });
          }
        }
      } else {
        message.error(res.message);
      }
    });
  }

  handleSubmit = () => {
    const {
      fileList,
      paperName,
      totalScore,
      gradeId,
      subjectId,
      type,
      bigNumberReset,
    } = this.state;

    if ((fileList || []).length === 0) {
      return message.error(trans("paper.uploadPaperRequired", "请上传试卷"));
    }
    if (!paperName) {
      return message.error(trans("paper.paperNameRequired", "请输入试卷名称"));
    }
    if (!totalScore) {
      return message.error(trans("paper.totalScoreRequired", "请输入总分"));
    }
    if (!gradeId) {
      return message.error(trans("paper.gradeRequired", "请选择年级"));
    }
    if (!subjectId) {
      return message.error(trans("paper.subjectRequired", "请选择学科"));
    }
    if (!type) {
      return message.error(trans("paper.typeRequired", "请选择类型"));
    }
    this.setState({
      onOKLoding: true,
    });
    // 创建 formData
    const formData = new FormData();
    // 添加名字为files的文件数据
    // files会作为调用接口时的参数名，需要根据接口修改
    formData.append("files", fileList[0]);
    formData.append("paperName", paperName);
    formData.append("totalScore", totalScore);
    formData.append("gradeId", gradeId);
    formData.append("subjectId", subjectId);
    formData.append("type", type);
    formData.append("bigNumberReset", Boolean(bigNumberReset));

    console.log(formData);

    request("/api/word/upload_analysis_word", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (res.status) {
          let hide = null;
          let url = null;
          if (res.content.haveQuestion) {
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
              res.content.uploadFileResponseModelList[0]?.url;
            url = `${window.location.origin}${uploadFileResponseModelList}`;
          }
          let timeId1 = setTimeout(hide, 3000);
          let timeid2 = setTimeout(() => {
            clearTimeout(timeId1);
            clearTimeout(timeid2);

            this.props.modalImportPagerProps.options.onOk();
            this.setState({ onOKLoding: false });
            window.open(url);
          }, 3200);
        } else {
          message.error(res.message);
        }
      })
      .catch((error) => {
        this.setState({
          onOKLoding: false,
        });
      });
  };

  changeScore = (value) => {
    this.setState({
      totalScore: value,
    });
  };

  changeExamName = (e) => {
    this.setState({
      paperName: e.target.value,
    });
  };

  gradeChange = (e) => {
    this.setState({
      gradeId: e.target.value,
      subjectId: undefined,
    });
    queryAllTestSubject({
      gradeId: e.target.value,
    }).then((res) => {
      if (res.status) {
        this.setState({
          subjectListTest: res.content,
        });
      } else {
        message.error(res.message);
      }
    });
  };

  changeSubject = (value) => {
    this.setState({
      subjectId: value,
    });
  };

  changeExamType = (e) => {
    this.setState({
      type: e.target.value,
    });
  };
  bigNumberResetChange = (e) => {
    this.setState({
      bigNumberReset: e.target.value,
    });
  };

  async findSubiectIdInString(string_, gradeId) {
    let res = await queryAllTestSubject({
      gradeId: gradeId,
    });
    if (res.status) {
      const subiectList = res.content;
      this.setState({
        subjectListTest: subiectList,
      });
      for (const element of subiectList) {
        if (string_.includes(element.name)) {
          this.setState({
            subjectId: element.id,
          });
          return;
        }
      }
    }
  }

  findGradeIdInString(string_, grades) {
    for (const grade of grades) {
      if (string_.includes(grade.gradeName)) {
        return grade.gradeId;
      }
    }
    return; // 没有找到任何年级
  }
  render() {
    const {
      onOKLoding,
      paperName,
      totalScore,
      examTypeList,
      gradeId,
      subjectId,
      type,
      allGrade,
      subjectListTest,
      fileList,
      bigNumberReset,
    } = this.state;
    const { modalImportPagerProps } = this.props;
    console.log("modalImportPagerProps", modalImportPagerProps);
    const { options } = modalImportPagerProps;

    const uploadProperties = {
      onRemove: (file) => {
        this.setState((state) => {
          return {
            fileList: [],
          };
        });
      },
      beforeUpload: (file) => {
        let temporaryGradeId = this.findGradeIdInString(file.name, allGrade);
        this.findSubiectIdInString(file.name, temporaryGradeId);
        // console.log('tempSubjectId', tempSubjectId);
        this.setState({
          paperName: file.name,
          gradeId: temporaryGradeId,
          fileList: [file],
        });
        return false;
      },
      fileList,
    };

    return (
      <div className="ModalImportPager">
        <ComnModal
          options={{
            ...options,
            width: 700,
            okButtonProps: {
              loading: onOKLoding,
            },
            centered: true,
            cancelButtonProps: {
              // 点击取消按钮
              onClick: () => {
                options.onCancel();
              },
            },
            onOk: this.handleSubmit, // 提交表单
          }}
          innerContent={
            <>
              <Form
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
                colon={false}
              >
                <Form.Item
                  label={trans("global.chooseFile1", "选择文档")}
                  required
                >
                  <Upload {...uploadProperties}>
                    <Button>
                      <Icon type="upload" />
                      {trans("global.selectFile", "选择文件")}
                    </Button>
                  </Upload>
                </Form.Item>
                <Form.Item
                  wrapperCol={{ span: 15 }}
                  label={trans("global.examName1", "试卷名称：")}
                  required
                >
                  <Input
                    onChange={this.changeExamName}
                    placeholder={trans("global.pleaseEnter", "请输入")}
                    value={paperName}
                  />
                </Form.Item>
                <Form.Item label={trans("global.manfen", "满分")} required>
                  <InputNumber
                    onChange={this.changeScore}
                    placeholder={trans("global.pleaseEnter", "请输入")}
                    value={totalScore}
                  />
                </Form.Item>
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
                  label={trans("global.grade", "年级")}
                  required
                  className="lh28"
                >
                  {allGrade && allGrade.length > 0 ? (
                    <Radio.Group
                      onChange={this.gradeChange}
                      value={gradeId}
                      style={{ lineHeight: "2" }}
                    >
                      {allGrade.map((item) => (
                        <Radio value={item.gradeId} key={item.gradeId}>
                          {language ? item.gradeName : item.gradeEnName}
                        </Radio>
                      ))}
                    </Radio.Group>
                  ) : (
                    <span style={{ lineHeight: "28px" }}>
                      {trans("global.noData", "暂无数据")}
                    </span>
                  )}
                </Form.Item>
                <Form.Item
                  label={trans("global.subject", "学科")}
                  wrapperCol={{ span: 15 }}
                  required
                >
                  <Select
                    showSearch
                    placeholder={trans("global.selectDiscipline", "选择学科")}
                    onChange={this.changeSubject}
                    value={subjectId}
                    filterOption={(input, option) =>
                      option.props.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {subjectListTest && subjectListTest.length > 0
                      ? subjectListTest.map((item) => (
                          <Option value={item.id} key={item.id}>
                            {item.name}
                          </Option>
                        ))
                      : null}
                  </Select>
                </Form.Item>
                <Form.Item
                  label={trans("global.examType1", "类型")}
                  required
                  className="lh28"
                >
                  {examTypeList && examTypeList.length > 0 ? (
                    <Radio.Group
                      onChange={this.changeExamType}
                      value={type}
                      style={{ lineHeight: "2" }}
                    >
                      {examTypeList.map((item) => (
                        <Radio value={item.code} key={item.code}>
                          {item.typeName}
                        </Radio>
                      ))}
                    </Radio.Group>
                  ) : (
                    <span style={{ lineHeight: "28px" }}>
                      {trans("global.noData", "暂无数据")}
                    </span>
                  )}
                </Form.Item>
              </Form>
            </>
          }
        ></ComnModal>
      </div>
    );
  }
}

export default ModalImportPager;

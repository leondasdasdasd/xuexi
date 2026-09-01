//数学公式编辑器
import React, { PureComponent } from "react";
import {
  Alert,
  Button,
  Icon,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
} from "antd";
import { connect } from "dva";

import { trans } from "../../utils/i18n";

import "katex/dist/katex.min.css";
import styles from "./index.module.less";
const { TextArea } = Input;
const { Option } = Select;
const stuNoList = ["bazima", "kaoshihao", "barcode"];
const rankList = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
@connect((state) => ({
  scoreSettingList: state.home.scoreSettingList,
}))
class MathEditor extends PureComponent {
  constructor() {
    super();
    this.state = {
      isAdmin: false,
      scoreSettingList: [],
      adminScoreSettingList: [],
      maxNum: 0,
      minNum: 0,
    };
  }
  componentDidMount() {
    this.props.dispatch({
      type: "home/getIfAdmin",
      onSuccess: (res) => {
        this.setState(
          {
            isAdmin: res,
          },
          () => {
            this.getScoreData(res);
          },
        );
      },
    });
  }
  getScoreData = (res) => {
    let payload = {};
    if (this.props.source === "list") {
      payload.examPaperId = this.props.id;
    } else {
      payload.examId = this.props.id;
    }
    this.props
      .dispatch({
        type: "home/getScoreSetting",
        payload,
      })
      .then(() => {
        const { scoreSettingList } = this.props;
        let maxNumber = 0;
        let minNumber = 0;
        const that = this;
        let dataList = [];
        if (res) {
          dataList =
            scoreSettingList &&
            scoreSettingList.scoreSections &&
            scoreSettingList.scoreSections.length > 0 &&
            scoreSettingList.scoreSections.length > 0
              ? scoreSettingList.scoreSections
              : scoreSettingList.adminScoreSections;
        } else {
          dataList = scoreSettingList.scoreSections;
        }
        if (dataList && dataList.length > 0) {
          // for(let i=0; i<this.props.scoreSettingList.length;i++) {
          //   if(i = 0) {
          //     maxNum = parseInt(this.props.scoreSettingList[i].endScore);
          //     minNum = parseInt(this.props.scoreSettingList[i].startScore);
          //   } else {
          //     // if(parseInt(this.props.scoreSettingList[i].endScore) > parseInt(this.props.scoreSettingList[i - 1].endScore) ) {
          //     //   maxNum = parseInt(this.props.scoreSettingList[i].endScore)
          //     // }
          //     // if(parseInt(this.props.scoreSettingList[i].startScore) < parseInt(this.props.scoreSettingList[i - 1].startScore) ) {
          //     //   minNum = parseInt(this.props.scoreSettingList[i].startScore);
          //     // }
          //   }

          // }
          dataList.map((item, index) => {
            if (index === 0) {
              maxNumber = Number.parseInt(item.endScore, 10);
              minNumber = Number.parseInt(item.startScore, 10);
            } else {
              // console.log(i, dataList, "jjj");
              if (
                Number.parseInt(dataList[index].endScore) >
                Number.parseInt(dataList[index - 1].endScore)
              ) {
                maxNumber = Number.parseInt(dataList[index].endScore);
              }
              if (
                Number.parseInt(dataList[index].startScore) <
                Number.parseInt(dataList[index - 1].startScore)
              ) {
                minNumber = Number.parseInt(dataList[index].startScore, 10);
              }
            }
          });
        }
        console.log(dataList);
        this.setState({
          scoreSettingList: dataList,
          adminScoreSettingList:
            (scoreSettingList && scoreSettingList.adminScoreSections) || [],
          minNum: minNumber,
          maxNum: maxNumber,
        });
      });
  };
  deleteScore = (index) => {
    const { scoreSettingList, minNum, maxNum } = this.state;
    console.log("blur", minNum, maxNum);
    let numberList = [minNum, maxNum];
    let newList = JSON.parse(JSON.stringify(scoreSettingList));
    newList.splice(index, 1);
    newList.map((item) => {
      numberList.push(Number.parseInt(item.endScore, 10));
    });
    /**
     *
     * @param value1
     * @param value2
     */
    function compare(value1, value2) {
      if (value1 < value2) {
        return 1;
      } else if (value1 > value2) {
        return -1;
      } else {
        return 0;
      }
    }
    numberList.sort(compare);
    console.log(numberList);
    newList.map((item, index) => {
      item.startScore = numberList[index + 2];
      item.endScore = numberList[index + 1];
      item.levelName = rankList[newList.length - index - 1] + "等";
    });
    console.log(newList, "hh");
    this.setState({
      scoreSettingList: newList,
    });
  };
  addSubsection = () => {
    const { scoreSettingList } = this.state;
    let newList = JSON.parse(JSON.stringify(scoreSettingList));
    newList.push({
      startScore: "",
      endScore: "",
      // levelName: rankList[newList.length] + "等",
      levelName: "",
    });
    this.setState({
      scoreSettingList: newList,
    });
  };
  beforeUpload = (maxSize, file) => {
    if (file.size / 1024 / 1024 <= maxSize) {
      return true;
    } else {
      message.info(trans("global.fileLarge", "上传文件过大！"));
      return false;
    }
  };
  closeModal = () => {
    this.setState(
      {
        fileList: {},
        subjectValue: "",
        stuNo: null,
        grade: null,
        semester: null,
        group: [],
        classList: [],
        subjectList: [],
        platform: null,
        examType: null,
        secrecy: false,
        showDownLoad: false,
      },
      () => {
        this.props.clickSetGrades && this.props.clickSetGrades();
      },
    );
  };

  changeScore = (index, value) => {
    console.log(value, "11");
    const { scoreSettingList } = this.state;
    if (value > this.state.maxNum) {
      this.setState({
        maxNum: value,
      });
    }
    let newList = JSON.parse(JSON.stringify(scoreSettingList));
    newList[index].endScore = value;
    this.setState({
      scoreSettingList: newList,
    });
  };
  onBlur = () => {
    const { scoreSettingList, minNum, maxNum } = this.state;
    // console.log("blur", minNum, maxNum);
    let numberList = [minNum, maxNum];
    let newList = JSON.parse(JSON.stringify(scoreSettingList));
    let testList = [];
    newList.map((item) => {
      numberList.push(Number.parseInt(item.endScore, 10));
      testList.push(item.levelName);
    });
    /**
     *
     * @param value1
     * @param value2
     */
    function compare(value1, value2) {
      if (value1 < value2) {
        return 1;
      } else if (value1 > value2) {
        return -1;
      } else {
        return 0;
      }
    }
    numberList.sort(compare);
    console.log(testList, numberList, "hhh");
    newList.map((item, index) => {
      item.startScore = numberList[index + 2];
      item.endScore = numberList[index + 1];
      // item.levelName = rankList[newList.length - index - 1] + "等";
      // item.levelName = newList[index].levelName;
    });
    console.log(newList, "hh");
    this.setState({
      scoreSettingList: newList,
    });
  };
  surePass = () => {
    const { isAdmin } = this.state;
    let payload = {};
    if (this.props.source === "list") {
      payload.examPaperId = this.props.id;
    } else {
      payload.examId = this.props.id;
    }
    payload.scoreSectionModelList = this.state.scoreSettingList;
    payload.schoolLevel = false;
    this.props.dispatch({
      type: "home/submitScoreSectionPlan",
      payload,
      onSuccess: () => {
        this.props.reloadChart && this.props.reloadChart(true);
        this.props.clickSetGrades();
        // window.location.reload();
      },
    });
  };
  //保存为本校校级通用
  saveGeneral = () => {
    let payload = {};
    if (this.props.source === "list") {
      payload.examPaperId = this.props.id;
    } else {
      payload.examId = this.props.id;
    }
    payload.scoreSectionModelList = this.state.scoreSettingList;
    payload.schoolLevel = true;
    this.props.dispatch({
      type: "home/submitScoreSectionPlan",
      payload,
      onSuccess: () => {
        this.props.reloadChart && this.props.reloadChart(true);
        this.props.clickSetGrades();
        // window.location.reload();
      },
    });
  };
  //恢复成默认分段
  replyDefault = () => {
    this.setState({
      scoreSettingList: this.state.adminScoreSettingList,
    });
  };
  titChange = (index, e) => {
    const { scoreSettingList } = this.state;
    let newList = JSON.parse(JSON.stringify(scoreSettingList));
    newList[index].levelName = e.target.value;
    this.setState({
      scoreSettingList: newList,
    });
  };
  enTitChange = (index, e) => {
    const { scoreSettingList } = this.state;
    let newList = JSON.parse(JSON.stringify(scoreSettingList));
    newList[index].levelEName = e.target.value;
    this.setState({
      scoreSettingList: newList,
    });
  };
  render() {
    const { isSetGrades } = this.props;
    const { scoreSettingList, isAdmin } = this.state;
    // console.log(scoreSettingList, "222");
    return (
      <div>
        <Modal
          footer={
            <div
              className={styles.footer}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button onClick={this.closeModal}>
                {trans("global.cancle")}
              </Button>
              {isAdmin ? (
                <div style={{ display: "flex", marginLeft: "10px" }}>
                  <Button
                    onClick={this.surePass}
                    className={styles.replyDefault}
                  >
                    {trans("global.saveSelf", "保存为自用")}
                  </Button>
                  <Button
                    onClick={this.saveGeneral}
                    className={styles.saveGeneral}
                  >
                    {trans("global.saveGeneralSettings", "保存为本次校级通用")}
                  </Button>
                </div>
              ) : (
                <div style={{ display: "flex", marginLeft: "10px" }}>
                  <Button
                    onClick={this.replyDefault}
                    className={styles.replyDefault}
                  >
                    {trans("global.replyDefault", "恢复成默认分段")}
                  </Button>

                  <Button
                    onClick={this.surePass}
                    className={styles.saveGeneral}
                  >
                    {trans("global.save", "保存")}
                  </Button>
                </div>
              )}
            </div>
          }
          onCancel={this.closeModal}
          centered={true}
          getContainer={false}
          // centered={true}
          visible={this.props.isSetGrades}
          closable={false}
          // maskClosable={false}
          destroyOnClose={true}
          // onCancel={this.publishCancel}
          width="600px"
          className={styles.uploadModal}
          title={
            <div className={styles.modalHeader}>
              <Icon type="close" onClick={this.closeModal} />
              <span style={{ marginLeft: "40%" }}>
                {trans("global.scoreSubsection", "成绩分档")}
              </span>
            </div>
          }
        >
          <div className={styles.scoreSettingList}>
            <Alert
              message={trans(
                "global.createOrEditSegmentScore",
                "新建或修改分段分数，会自动从大到小排序",
              )}
              type="info"
              showIcon
            />
            <div className={styles.scoreSettingBox}>
              <div style={{ width: "150px" }}>
                {trans("global.segmentName", "分段名称")}
              </div>
              <div style={{ width: "150px", marginLeft: "10px" }}>
                {trans("global.nameInEnglish", "名称英文")}
              </div>
              <div style={{ width: "100px" }}>
                {trans("global.segmentScore", "分段分数")}
              </div>
            </div>
            {scoreSettingList && scoreSettingList.length > 0
              ? scoreSettingList.map((item, index) => (
                  <div className={styles.scoreSettingBox}>
                    <div style={{ width: "150px" }}>
                      <Input
                        value={item.levelName}
                        onChange={this.titChange.bind(this, index)}
                      ></Input>
                    </div>
                    <div style={{ width: "150px", marginLeft: "10px" }}>
                      <Input
                        value={item.levelEName}
                        onChange={this.enTitChange.bind(this, index)}
                      ></Input>
                    </div>
                    <InputNumber
                      onBlur={this.onBlur}
                      value={
                        item.endScore
                          ? Number.parseInt(item.endScore, 10)
                          : null
                      }
                      onChange={this.changeScore.bind(this, index)}
                    />
                    <div>
                      {scoreSettingList && index == 0
                        ? `[${item.startScore}~${item.endScore}]`
                        : index + 1 == scoreSettingList.length
                          ? `[${item.startScore}~${item.endScore})`
                          : `[${item.startScore}~${item.endScore})`}
                    </div>
                    <i
                      className={[styles.iconfont, styles.deleteIcon].join(" ")}
                      onClick={this.deleteScore.bind(this, index)}
                    >
                      &#xe6e2;
                    </i>
                  </div>
                ))
              : null}
            <div className={styles.newSubsection} onClick={this.addSubsection}>
              <i className={styles.iconfont}>&#xe7d5;</i>
              <span className={styles.subsectionWord}>
                {trans("global.newSegmentation", "新分段")}
              </span>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default MathEditor;

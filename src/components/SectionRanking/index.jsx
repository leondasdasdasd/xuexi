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
@connect((state) => ({
  // scoreSettingList: state.home.scoreSettingList,
  scoreSettingList: state.global.rankList,
  scoreByRank: state.global.scoreByRank,
}))
class MathEditor extends PureComponent {
  constructor() {
    super();
    this.state = {
      scoreSettingList: [],
      maxNum: 0,
      minNum: 0,
      isAdmin: false,
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
            this.getScoreData(false);
          },
        );
      },
    });
  }
  getScoreData = (status, number_) => {
    const { isAdmin } = this.state;
    let payload = {};
    if (this.props.source === "list") {
      payload.examPaperId = this.props.id;
    } else {
      payload.examId = this.props.id;
    }
    this.props
      .dispatch({
        type: "global/getRankList",
        payload: {
          examId: this.props.id,
          filterFlag: this.props.scoreSegmentationSpecify,
          schoolLevel: status,
        },
      })
      .then(() => {
        let maxNumber = 0;
        let minNumber = 0;
        const that = this;
        if (
          this.props.scoreSettingList &&
          this.props.scoreSettingList.length > 0
        ) {
          this.props.scoreSettingList.map((item, index) => {
            if (index === 0) {
              maxNumber = Number.parseInt(item.endIndex, 10);
              minNumber = Number.parseInt(item.startIndex, 10);
            } else {
              console.log(index, this.props.scoreSettingList, "jjj");
              if (
                Number.parseInt(that.props.scoreSettingList[index].endIndex) >
                Number.parseInt(that.props.scoreSettingList[index - 1].endIndex)
              ) {
                maxNumber = Number.parseInt(
                  that.props.scoreSettingList[index].endIndex,
                );
              }
              if (
                Number.parseInt(that.props.scoreSettingList[index].startIndex) <
                Number.parseInt(
                  that.props.scoreSettingList[index - 1].startIndex,
                )
              ) {
                minNumber = Number.parseInt(
                  that.props.scoreSettingList[index].startIndex,
                  10,
                );
              }
            }
          });
        } else if (isAdmin) {
          if (number_) {
            return;
          }
          this.getScoreData(true, 2);
        }
        this.setState({
          scoreSettingList: this.props.scoreSettingList,
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
      numberList.push(Number.parseInt(item.endIndex, 10));
    });
    /**
     *
     * @param value1
     * @param value2
     */
    function compare(value1, value2) {
      if (value1 < value2) {
        return -1;
      } else if (value1 > value2) {
        return 1;
      } else {
        return 0;
      }
    }
    numberList.sort(compare);
    console.log(numberList);
    newList.map((item, index) => {
      item.startIndex = numberList[index];
      item.endIndex = numberList[index + 1];
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
      endIndex: "",
      startIndex: "",
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
    let newList = JSON.parse(JSON.stringify(scoreSettingList));
    newList[index].endIndex = value;
    this.setState({
      scoreSettingList: newList,
    });
  };
  onBlur = () => {
    const { scoreSettingList, minNum, maxNum } = this.state;
    console.log("blur", minNum, maxNum);
    let numberList = [minNum, maxNum];
    let newList = JSON.parse(JSON.stringify(scoreSettingList));
    newList.map((item) => {
      numberList.push(Number.parseInt(item.endIndex, 10));
    });
    /**
     *
     * @param value1
     * @param value2
     */
    function compare(value1, value2) {
      if (value1 < value2) {
        return -1;
      } else if (value1 > value2) {
        return 1;
      } else {
        return 0;
      }
    }
    numberList.sort(compare);
    console.log(numberList);
    newList.map((item, index) => {
      item.startIndex = numberList[index];
      item.endIndex = numberList[index + 1];
    });
    let newListArray = newList;
    newList.length > 0 &&
      newList.map((item, index) => {
        this.props.dispatch({
          type: "global/getScoreByRank",
          payload: {
            startIndex: item.startIndex,
            endIndex: item.endIndex,
            examId: this.props.id,
            filterFlag: this.props.scoreSegmentationSpecify,
          },
          onSuccess: (scoreByRank) => {
            newListArray[index].endScore = scoreByRank.endScore;
            newListArray[index].startScore = scoreByRank.startScore;
          },
        });
        // .then(() => {
        //   newListArr[index].endScore = this.props.scoreByRank.endScore;
        //   newListArr[index].startScore = this.props.scoreByRank.startScore;
        // });
      });
    console.log(newListArray, "hh");
    this.setState({
      scoreSettingList: newListArray,
    });
  };
  surePass = () => {
    let payload = {};
    if (this.props.source === "list") {
      payload.examPaperId = this.props.id;
    } else {
      payload.examId = this.props.id;
    }
    // payload.scoreSectionModelList = this.state.scoreSettingList;
    this.props.dispatch({
      type: "global/saveGetRankList",
      payload: {
        examId: this.props.id,
        rankQueryJsonString: JSON.stringify(this.state.scoreSettingList),
        filterFlag: this.props.scoreSegmentationSpecify,
        schoolLevel: false,
      },
      onSuccess: () => {
        this.props.reloadChart && this.props.reloadChart(true);
        this.props.clickSetGrades();
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
    // payload.scoreSectionModelList = this.state.scoreSettingList;
    this.props.dispatch({
      type: "global/saveGetRankList",
      payload: {
        examId: this.props.id,
        rankQueryJsonString: JSON.stringify(this.state.scoreSettingList),
        filterFlag: this.props.scoreSegmentationSpecify,
        schoolLevel: true,
      },
      onSuccess: () => {
        this.props.reloadChart && this.props.reloadChart(true);
        this.props.clickSetGrades();
      },
    });
  };
  //恢复成默认分段
  replyDefault = () => {
    this.getScoreData(true);
  };
  titChange = (index, e) => {
    const { scoreSettingList } = this.state;
    let newList = JSON.parse(JSON.stringify(scoreSettingList));
    newList[index].levelName = e.target.value;
    this.setState({
      scoreSettingList: newList,
    });
  };
  render() {
    const { isSetGrades } = this.props;
    const { scoreSettingList, isAdmin } = this.state;
    console.log(scoreSettingList, "222");
    let rank = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
    ];
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
                    type="primary"
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
          // visible={true}
          closable={false}
          maskClosable={false}
          destroyOnClose={true}
          // onCancel={this.publishCancel}
          width="600px"
          className={styles.uploadModal}
          title={
            <div className={styles.modalHeader}>
              <Icon type="close" onClick={this.closeModal} />
              <span style={{ marginLeft: "40%" }}>
                {trans("global.setLevelSegmentation", "设置等级分段")}
              </span>
            </div>
          }
        >
          <div className={styles.scoreSettingList}>
            <Alert
              message={trans(
                "global.createOrEditRankingNode",
                "新建或修改排名节点，会自动从小到大排序，并实时计算对应的分数区间",
              )}
              type="info"
              showIcon
            />
            <div className={styles.scoreSettingBox}>
              <div style={{ width: "189px" }}>
                {trans("global.tierName", "分层名称")}
              </div>
              <div style={{ width: "100px" }}>
                {trans("global.segmentRanking", "分段名次")}
              </div>
              <div style={{ width: "100px" }}>
                {trans("global.rankingRange", "名次区间")}
              </div>
              <div style={{ width: "100px" }}>
                {trans("global.correspondingScore", "对应分数")}
              </div>
            </div>
            {scoreSettingList && scoreSettingList.length > 0
              ? scoreSettingList.map((item, index) => (
                  <div className={styles.scoreSettingBox}>
                    <div>
                      <Input
                        defaultValue={item.levelName}
                        style={{ width: "80%" }}
                        onChange={this.titChange.bind(this, index)}
                        width={100}
                      ></Input>
                    </div>
                    <InputNumber
                      onBlur={this.onBlur}
                      value={
                        item.endIndex
                          ? Number.parseInt(item.endIndex, 10)
                          : null
                      }
                      onChange={this.changeScore.bind(this, index)}
                    />
                    {index == 0 ? (
                      <div style={{ width: "100px" }}>
                        {scoreSettingList && scoreSettingList.length - 1 > index
                          ? `[${item.startIndex}~${item.endIndex}]`
                          : `[${item.startIndex}~${item.endIndex}]`}
                        {trans("global.rank", "名")}
                      </div>
                    ) : index == scoreSettingList.length - 1 ? (
                      <div style={{ width: "100px" }}>
                        {scoreSettingList && scoreSettingList.length - 1 > index
                          ? `[${item.startIndex}~${item.endIndex}]`
                          : `[${item.startIndex}~${item.endIndex}]`}
                        {trans("global.rank", "名")}
                      </div>
                    ) : (
                      <div style={{ width: "100px" }}>
                        {scoreSettingList && scoreSettingList.length - 1 > index
                          ? `(${item.startIndex}~${item.endIndex}]`
                          : `(${item.startIndex}~${item.endIndex}]`}
                        {trans("global.rank", "名")}
                      </div>
                    )}
                    {index == 0 ? (
                      <div>
                        {`[${item.startScore}~${item.endScore}]`}
                        {trans("global.point", "分")}
                      </div>
                    ) : index == scoreSettingList.length - 1 ? (
                      <div>
                        {`[${item.startScore}~${item.endScore})`}
                        {trans("global.point", "分")}
                      </div>
                    ) : (
                      <div>
                        {`[${item.startScore}~${item.endScore})`}
                        {trans("global.point", "分")}
                      </div>
                    )}
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

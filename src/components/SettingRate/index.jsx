//数学公式编辑器
import React, { PureComponent } from "react";
import { Button, Icon, Input, message, Modal, Select, Spin } from "antd";
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
  currentUser: state.global.currentUser,
}))
class SettingRate extends PureComponent {
  constructor() {
    super();
    this.state = {
      valueList: [],
      closeIconShowIndex: null,
      isAdmin: false,
      loading: false,
      btnLoading: false,
    };
  }
  componentDidMount() {
    this.getCurrentUser();
    this.getAdmin();
  }
  getValue = (status, type) => {
    const { dispatch, testId } = this.props;
    dispatch({
      type: "home/getSettingRateValue",
      payload: {
        type: 2,
        businessId: testId,
        schoolLevel: type ? true : status ? false : false,
      },
      onSuccess: (res) => {
        if (status == true && res && res.length > 0 && res.length > 0) {
          this.setState({
            valueList: res,
          });
        } else if (status == false) {
          this.setState({
            valueList: res || [],
          });
        } else {
          this.getValue(false, true);
        }
      },
    }).then(() => {
      this.setState({
        loading: false,
        btnLoading: false,
      });
    });
  };
  getAdmin = () => {
    this.setState({
      loading: true,
    });
    const { dispatch } = this.props;
    dispatch({
      type: "home/getIfAdmin",
      onSuccess: (res) => {
        this.setState(
          {
            isAdmin: res,
          },
          () => {
            this.getValue(res);
          },
        );
      },
    });
  };
  //取消
  closeModal = () => {
    this.props.rateModalStatus();
  };
  getCurrentUser = () => {
    this.props.dispatch({
      type: "global/getCurrentUser",
    });
  };
  //保存三率
  saveData = (status) => {
    const { dispatch, paperId, testId, currentUser } = this.props;
    console.log(currentUser);
    const { valueList } = this.state;
    let listString = Array.isArray(valueList)
      ? JSON.stringify(valueList)
      : "[]";
    dispatch({
      type: "home/saveSettingRate",
      payload: {
        id: paperId,
        teacherId: currentUser && currentUser.userId,
        type: 2,
        businessId: testId,
        config: listString,
        schoolLevel: status,
      },
      onSuccess: () => {
        this.props.rateModalStatus();
      },
    }).then(() => {
      this.setState({
        btnLoading: false,
      });
    });
  };
  //保存为自用
  sureSelf = () => {
    this.setState({
      btnLoading: true,
    });
    this.saveData(false);
  };
  //保存为本次校级通用
  saveSchoolGeneral = () => {
    this.setState({
      btnLoading: true,
    });
    this.saveData(true);
  };
  //恢复成默认分段
  replyDefault = () => {
    this.setState({
      loading: true,
      btnLoading: true,
    });
    this.getValue(false, true);
  };
  //保存
  save = () => {
    this.setState({
      btnLoading: true,
    });
    this.saveData(false);
  };
  nameChange = (e, index) => {
    const { valueList } = this.state;
    let newArray = JSON.parse(JSON.stringify(valueList));
    newArray[index].name = e.target.value;
    this.setState({
      valueList: newArray,
    });
  };

  ENameChange = (e, index) => {
    const { valueList } = this.state;
    let newArray = JSON.parse(JSON.stringify(valueList));
    newArray[index].EName = e.target.value;
    this.setState({
      valueList: newArray,
    });
  };

  //区间设置
  scoreChange = (e, index, type) => {
    if (!this.isNum(e.target.value) && e.target.value) {
      console.log(this.isNum(e.target.value), e.target.value);
      message.warning(trans("settingRate.maxTwoDecimals", "最多支持两位小数"));
    } else {
      const { valueList } = this.state;
      let newArray = JSON.parse(JSON.stringify(valueList));
      newArray[index][type] = e.target.value;
      this.setState({
        valueList: newArray,
      });
      console.log(newArray);
    }
  };
  //正则校验
  isNum = (number_) => {
    return /^\d+(\.\d{1,2})?$/.test(number_);
  };
  //新增分段
  addScoreClick = () => {
    const { valueList } = this.state;
    let newArray = [];
    if (valueList && valueList.length > 0) {
      newArray = JSON.parse(JSON.stringify(valueList));
    }
    let notArray = { name: "", startScore: "", endScore: "" };
    this.setState({
      valueList: [...newArray, notArray],
    });
  };
  //显示关闭按钮
  closeIconShowMove = (index) => {
    this.setState({
      closeIconShowIndex: index,
    });
  };
  //移出事件
  closeIconShowOut = (index) => {
    this.setState({
      closeIconShowIndex: null,
    });
  };
  //点击关闭按钮
  closeScoreClick = (index) => {
    const { valueList } = this.state;
    let newArray = JSON.parse(JSON.stringify(valueList));
    newArray.splice(index, 1);
    this.setState({
      valueList: newArray,
    });
  };
  render() {
    const { valueList, closeIconShowIndex, isAdmin, loading, btnLoading } =
      this.state;
    const { visible } = this.props;
    return (
      <div>
        <Modal
          footer={
            <div
              className={styles.footer}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button onClick={this.closeModal}>
                {trans("global.cancle", "取消")}
              </Button>
              {isAdmin ? (
                <div style={{ marginLeft: "10px" }}>
                  <Button
                    onClick={this.sureSelf}
                    className={styles.replyDefault}
                    loading={btnLoading}
                  >
                    {trans("global.saveSelf", "保存为自用")}
                  </Button>
                  <Button
                    onClick={this.saveSchoolGeneral}
                    className={styles.saveGeneral}
                    loading={btnLoading}
                  >
                    {trans("global.saveGeneralSettings", "保存为本次校级通用")}
                  </Button>
                </div>
              ) : (
                <div style={{ marginLeft: "10px" }}>
                  <Button
                    onClick={this.replyDefault}
                    className={styles.replyDefault}
                    loading={btnLoading}
                  >
                    {trans("global.replyDefault", "恢复成默认分段")}
                  </Button>
                  <Button
                    onClick={this.save}
                    className={styles.saveGeneral}
                    loading={btnLoading}
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
          visible={visible}
          closable={false}
          maskClosable={false}
          destroyOnClose={true}
          width="700px"
          className={styles.uploadModal}
          title={
            <div className={styles.modalHeader}>
              <Icon type="close" onClick={this.closeModal} />
              <span style={{ marginLeft: "40%" }}>
                {trans("global.settingRate", "设置三率")}
              </span>
            </div>
          }
        >
          <div className={styles.scoreSettingList}>
            <div
              style={{
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div style={{ width: "30%" }}>
                {trans("global.nameThreeRates", "三率名称")}
              </div>
              <div style={{ width: "28%", padding: "0 5px" }}>
                {trans("global.nameInEnglish", "名称英文")}
              </div>
              <div style={{ width: "40%" }}>
                {trans("global.scoreRangeSettings", "得分率区间设置")}
              </div>
            </div>
            <Spin
              spinning={loading}
              style={{ display: "flex", justifyContent: "center" }}
            >
              {valueList && valueList.length > 0 && valueList.length > 0
                ? valueList.map((item, index) => (
                    <div
                      className={[styles.title, styles.titleInput].join(" ")}
                      key={index}
                      onMouseMove={() => this.closeIconShowMove(index)}
                      onMouseOut={() => this.closeIconShowOut(index)}
                    >
                      <span style={{ width: "30%" }}>
                        <Input
                          value={item.name}
                          onChange={(e) => this.nameChange(e, index)}
                        />
                      </span>
                      <span style={{ width: "30%", padding: "0 5px" }}>
                        <Input
                          value={item.EName}
                          onChange={(e) => this.ENameChange(e, index)}
                        />
                      </span>
                      <span style={{ width: "35%", whiteSpace: "nowrap" }}>
                        <div className={styles.intervalInput}>
                          <Input
                            suffix="%"
                            defaultValue={item.startScore}
                            onChange={(e) =>
                              this.scoreChange(e, index, "startScore")
                            }
                          />
                          <span>&nbsp;≦ ~ ≦&nbsp;</span>
                          <Input
                            suffix="%"
                            defaultValue={item.endScore}
                            onChange={(e) =>
                              this.scoreChange(e, index, "endScore")
                            }
                          />
                        </div>
                      </span>
                      <Icon
                        type="close"
                        onClick={() => this.closeScoreClick(index)}
                        style={
                          closeIconShowIndex == index
                            ? { marginLeft: "12px" }
                            : { display: "none" }
                        }
                      />
                    </div>
                  ))
                : null}
            </Spin>
            <div style={{ height: "20px" }}></div>
            <span className={styles.addScoreBtn} onClick={this.addScoreClick}>
              +&nbsp;&nbsp;&nbsp;
              {trans("global.newSegmentation", "新分段")}
            </span>
          </div>
        </Modal>
      </div>
    );
  }
}

export default SettingRate;

import React, { PureComponent } from "react";
import { Alert, Button, Icon, InputNumber, Modal, Radio } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

class SetIntervalModal extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  sum = (array) => {
    var s = 0;
    for (var index = array.length - 1; index >= 0; index--) {
      s = s + (array[index] - 0);
    }
    return s;
  };

  getMiddle = (index) => {
    let { numPhaseList, numPhase } = this.props;
    if (numPhase == 3) {
      return (
        <span>{`(${numPhaseList[index - 1]}%~${
          Number(numPhaseList[index - 1]) + Number(numPhaseList[index])
        }%]`}</span>
      );
    } else {
      let sum = 0;
      for (let index_ = index - 1; index_ >= 0; index_--) {
        sum += Number(numPhaseList[index_]);
      }
      return <span>{`(${sum}%~${sum + Number(numPhaseList[index])}%]`}</span>;
    }
  };

  handleOk = (status) => {
    this.props.onOk && this.props.onOk();
  };

  clickEditSegment = (status) => {
    this.props.onEditSegment && this.props.onEditSegment();
  };

  handleCancel = () => {
    this.props.onCancel && this.props.onCancel();
  };

  render() {
    const { selectMethod, numPhaseList, numPhase } = this.props;

    return (
      <Modal
        title={
          <div className={styles.modalHeader}>
            <Icon
              type="close"
              onClick={() => {
                this.handleCancel();
              }}
            />
            <span style={{ marginLeft: "35%" }}>
              {trans("global.setSegmentedInterval", "设置分段区间")}
            </span>
          </div>
        }
        closable={false}
        visible={this.props.visible}
        width="500px"
        getContainer={false}
        footer={
          <div
            className={styles.footer}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Button
              onClick={() => {
                this.handleCancel();
              }}
            >
              {trans("global.cancle")}
            </Button>
            {this.state.isAdmin ? (
              <div style={{ display: "flex", marginLeft: "10px" }}>
                <Button
                  onClick={() => {
                    this.handleOk();
                  }}
                  className={styles.replyDefault}
                >
                  {trans("global.saveSelf", "保存为自用")}
                </Button>
                <Button
                  onClick={() => this.handleOk(true)}
                  className={styles.saveGeneral}
                >
                  {trans("global.saveGeneralSettings", "保存为本次校级通用")}
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", marginLeft: "10px" }}>
                <Button
                  onClick={() => this.clickEditSegment(true)}
                  className={styles.replyDefault}
                >
                  {trans("global.replyDefault", "恢复成默认分段")}
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    this.handleOk();
                  }}
                  className={styles.saveGeneral}
                >
                  {trans("global.save", "保存")}
                </Button>
              </div>
            )}
          </div>
        }
      >
        {selectMethod == 0 && this.sum(numPhaseList) != 100 ? (
          <Alert
            message={trans("global.segmentsError", "所有分段累加后需等与100%")}
            type="error"
            showIcon
            height="30px"
          />
        ) : null}
        <div className={styles.selectBox}>
          <span className={styles.selectMethod}>
            {trans("global.selectMethod", "选择设置方式")}:
          </span>
          <Radio.Group onChange={this.changeSelectMethod} value={selectMethod}>
            <Radio value={0}>
              <span className={styles.setByPercentage}>
                {trans("global.setByPercentage", "按百分比设置")}
              </span>
            </Radio>
          </Radio.Group>
        </div>
        <div className={styles.numPhaseBox} style={{ textAlign: "center" }}>
          <i
            className={[styles.iconfont, styles.clickIcon].join(" ")}
            style={{ fontSize: "18px", cursor: "pointer" }}
            onClick={() => {
              this.props.clickReduce();
            }}
          >
            &#xe838;
          </i>
          <span className={styles.numPhase}>
            {trans("setIntervalModal.segmentCount", "{$count}段", {
              count: numPhase,
            })}
          </span>
          <i
            className={[styles.iconfont, styles.clickIcon].join(" ")}
            style={{ fontSize: "18px", cursor: "pointer" }}
            onClick={() => {
              this.props.clickAddd();
            }}
          >
            &#xe839;
          </i>
        </div>

        <div className={styles.numPhaseBox}>
          {selectMethod == 0 ? (
            <span className={styles.paragraph}>
              {trans("global.top", "前段")}
            </span>
          ) : (
            <span className={styles.paragraph}>
              {trans("global.subsection", "分段{$num}")}1
            </span>
          )}
          <InputNumber
            min={1}
            max={selectMethod == 0 ? 100 : 150}
            value={numPhaseList[0]}
            className={styles.numPhase}
            style={{ width: "91px" }}
            onChange={this.props.changeAfter}
            onBlur={this.props.blurAfter}
          />
          {selectMethod == 0 ? (
            <span>{`[0~${numPhaseList[0]}%]`}</span>
          ) : (
            <span>{`[0~${numPhaseList[0]})`}</span>
          )}

          <span className="floatRight"></span>
        </div>
        {numPhaseList &&
          numPhaseList.length > 0 &&
          numPhaseList.map((item, index) => {
            if (index == 0) {
              return;
            } else if (index == numPhaseList.length - 1) {
              return;
            } else {
              return (
                <div className={styles.numPhaseBox} key={index}>
                  {selectMethod == 0 ? (
                    <span className={styles.paragraph}>
                      {trans("global.middle", "中段")}
                      {index}
                    </span>
                  ) : (
                    <span className={styles.paragraph}>
                      {trans("global.subsection", "分段{$num}")}
                      {index + 1}
                    </span>
                  )}

                  <InputNumber
                    min={1}
                    max={selectMethod == 0 ? 100 : 150}
                    value={item}
                    className={styles.numPhase}
                    style={{ width: "91px" }}
                    onChange={(value) => this.props.chengeMiddle(index, value)}
                    onBlur={(value) => this.props.blurMiddle(index, value)}
                  />
                  {selectMethod == 0 ? (
                    this.getMiddle(index)
                  ) : (
                    <span>{`[${numPhaseList[index - 1]}~${numPhaseList[index]})`}</span>
                  )}
                  <span className="floatRight"></span>
                </div>
              );
            }
          })}
        <div className={styles.numPhaseBox}>
          {selectMethod == 0 ? (
            <span className={styles.paragraph}>
              {trans("global.after", "后段")}
            </span>
          ) : (
            <span className={styles.paragraph}>
              {trans("global.subsection", "分段{$num}")}
              {numPhase}
            </span>
          )}
          <InputNumber
            min={1}
            max={selectMethod == 0 ? 100 : 150}
            value={numPhaseList.at(-1)}
            className={styles.numPhase}
            style={{ width: "91px" }}
            onChange={() => {
              this.changeFront();
            }}
            onBlur={() => {
              this.blurFront();
            }}
          />
          {selectMethod == 0 ? (
            <span>{`(${100 - numPhaseList.at(-1)}%~100%]`}</span>
          ) : (
            <span>
              {`[${numPhaseList[numPhase - 2]}~${numPhaseList[numPhase - 1]}]`}
            </span>
          )}

          <span className="floatRight"></span>
        </div>
      </Modal>
    );
  }
}
export default SetIntervalModal;

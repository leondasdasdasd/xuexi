import React, { PureComponent } from "react";
import { Spin } from "antd";
import ReactMarkdown from "react-markdown";

import { trans } from "../../../../utils/i18n";
import ChartSwitch from "../../../ChartSwitch";
import MyButton from "../../../MyButton";
import TableHeader from "../TableHeader";

import styles from "./index.module.less";

class AiAnalysis extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  render() {
    const {
      studySituationByStudentIdList,
      titName,
      edit = true,
      spinning,
    } = this.props;
    const { moduleModelList } = studySituationByStudentIdList;

    let moduleSwitch = false;
    let result = {};
    if (moduleModelList?.length) {
      result = moduleModelList.find((item) => {
        return item.modelCode === "AI_POWERED_LEARNING_ANALYTICS";
      });
      moduleSwitch = result?.modelShow;
    }

    return (
      <div className={styles.overallView}>
        <Spin spinning={spinning}>
          <TableHeader
            titleName={titName}
            slot={
              edit ? (
                <div
                  style={{
                    justifyContent: "flex-end",
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <MyButton
                    typeclass="text"
                    sizeclass="commonBtn"
                    onClick={() => {
                      this.props.regenerate && this.props.regenerate();
                    }}
                  >
                    {trans("global.regenerate", "重新生成")}
                  </MyButton>

                  <ChartSwitch
                    checked={Boolean(moduleSwitch)}
                    onChange={this.props.onChange}
                  />
                </div>
              ) : null
            }
          />
          <div
            className={styles.youChart1}
            style={{
              color: "#01113D",
              display: moduleSwitch ? "block" : "none",
              background: "rgba(1, 17, 61, 0.04)",
              padding: "10px 20px",
              borderRadius: "10px",
            }}
          >
            <ReactMarkdown
              source={result?.modelValue} // ✅ 5.x版本用 `source`
              //   plugins={[remarkGfm]} // ✅ 插件写法
            />
            {/* <ReactMarkdown> {result?.modelValue}</ReactMarkdown> */}
          </div>
        </Spin>
      </div>
    );
  }
}
export default AiAnalysis;

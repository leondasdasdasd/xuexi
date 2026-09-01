import React, { PureComponent } from "react";
import ReactMarkdown from "react-markdown";

import ChartSwitch from "../../../../../components/ChartSwitch";
import MyButton from "../../../../../components/MyButton";
import TableHeader from "../../../../../components/PupllAnalyse/components/TableHeader";
import { trans } from "../../../../../utils/i18n";
import EditableText from "../EditableText";

import styles from "./index.module.less";

class ReportModule extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  resetRemark = () => {
    this.props.onResetRemark && this.props.onResetRemark();
  };

  isShowResetBtn = () => {
    const { modelData } = this.props;
    return (
      modelData?.modelCode == "AI_GROUP_POWERED_LEARNING_ANALYTICS" ||
      modelData?.modelCode == "AI_GRADE_POWERED_LEARNING_ANALYTICS"
    );
  };

  render() {
    const { onNameChange, modelData, onBlurModelName, onVisibilityChange } =
      this.props;
    return (
      <div>
        <TableHeader
          titleName={
            <EditableText
              size="small"
              onChange={onNameChange}
              onBlur={onBlurModelName}
              value={modelData?.modelName}
            />
          }
          slot={
            <div
              style={{
                justifyContent: "flex-end",
                display: "flex",
                alignItems: "center",
                width: "100%",
              }}
            >
              {this.isShowResetBtn() ? (
                <MyButton
                  typeclass="text"
                  sizeclass="commonBtn"
                  onClick={this.resetRemark}
                >
                  {trans("global.regenerate", "生成报告")}
                </MyButton>
              ) : null}

              {
                <ChartSwitch
                  checked={Boolean(modelData?.modelShow)}
                  onChange={onVisibilityChange}
                />
              }
            </div>
          }
        />

        <div
          className={styles.youChart1}
          style={{
            color: "#01113D",
            display: modelData?.modelShow ? "block" : "none",
            background: "rgba(1, 17, 61, 0.04)",
            padding: "10px 20px",
            borderRadius: "10px",
            minHeight: "30px",
          }}
        >
          <ReactMarkdown
            source={modelData?.modelValue} // ✅ 5.x版本用 `source`
          />
        </div>
      </div>
    );
  }
}
export default ReportModule;

import React, { PureComponent } from "react";
import ReactMarkdown from "react-markdown";

import AreaHeaderComponent from "components/AreaHeaderComponent";

import MyButton from "../../../../components/MyButton";
import { trans } from "../../../../utils/i18n";

import styles from "./index.module.less";

class AiAnalysis extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreen: false,
    };
  }

  exportFail = (key) => {
    this.props.exportFail && this.props.exportFail(key);
  };

  onChange = (checked) => {
    this.props.onChange && this.props.onChange(checked);
  };

  render() {
    const { edit = true, moduleSwitch = false, remarkVal } = this.props;

    // const { moduleModelList } = studySituationByStudentIdList

    // let moduleSwitch = false
    // let result = {}
    // if (moduleModelList?.length) {
    //     result = moduleModelList.find((item) => {
    //         return item.modelCode === 'AI_POWERED_LEARNING_ANALYTICS'
    //     })
    //     moduleSwitch = result?.modelShow
    // }

    return (
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "11px",
          marginTop: "10px",
        }}
        id="aiAnalysis"
        className={`${this.state.fullscreen ? styles.fullscreen : ""}`}
      >
        <AreaHeaderComponent
          showFullscreenBtn={true} //显示全屏按钮
          // showExportBtn={true}
          onClickExport={() => {
            this.exportFail(2);
          }}
          onClickFullscreen={(value) => {
            this.setState({ fullscreen: value });
          }}
          title={trans("global.aiAnalysis", "学情综览")}
          rightPanelContent={
            edit ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <MyButton
                  typeclass="text"
                  sizeclass="commonBtn"
                  onClick={() => {
                    this.props.regenerate && this.props.regenerate();
                  }}
                >
                  {trans("global.regenerate", "生成报告")}
                </MyButton>
                {/* <ChartSwitch
                                    checked={Boolean(moduleSwitch)}
                                    onChange={this.onChange}
                                /> */}
              </div>
            ) : null
          }
        />
        {/* <TableHeader
                        titleName={titName}
                        slot={edit ?
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <div style={{ marginLeft: 'auto' }}>
                                    {
                                        <ChartSwitch
                                            checked={Boolean(moduleSwitch)}
                                            onChange={this.props.onChange}
                                        />
                                    }

                                </div>
                            </div> : null
                        }
                    /> */}
        <div
          className={styles.youChart1}
          style={{
            color: "#01113D",
            background: "#fff",
            padding: "0 20px 10px 20px",
            borderRadius: "10px",
          }}
        >
          {moduleSwitch ? (
            <ReactMarkdown
              source={remarkVal} // ✅ 5.x版本用 `source`
              //   plugins={[remarkGfm]} // ✅ 插件写法
            />
          ) : null}
        </div>
      </div>
    );
  }
}
export default AiAnalysis;

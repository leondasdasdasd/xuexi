import React, { PureComponent } from "react";
import { Icon, Popover, Progress, Table } from "antd";
import { connect } from "dva";
import pathToRegexp from "path-to-regexp";

import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

class CorrectionDetails extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    this.pathMatch = pathToRegexp("/correctionDetails/:examId").exec(this.url);
    this.examId = JSON.parse(this.pathMatch[1]);
    this.state = {
      active: 1,
    };
  }
  componentDidMount() {
    this.getPage();
    // 在 a 标签页中监听 localStorage 的变化
    window.addEventListener("storage", (event) => {
      if (event.key === "tab_b_closed") {
        // 检测到 b 标签页关闭，执行刷新操作
        console.log("Tab B closed, refreshing data...");
        this.getPage(); // 刷新页面数据
      }
    });
  }

  getPage = () => {
    const { active } = this.state;
    this.props.dispatch({
      type: "marking/getCheckQuestionList",
      payload: {
        questionPaperType: active,
        examId: this.examId,
        limit: 1000,
        pageNo: 1,
      },
    });
  };
  back = () => {
    // window.parent.postMessage("false", "*");
    window.close() || this.props.history.goBack();
  };
  clickBar = (index) => {
    this.setState({
      active: index,
    });
  };
  switchTab = (check) => {
    this.setState(
      {
        active: check,
      },
      () => {
        this.getPage();
      },
    );
  };
  clickImmediateCorrection = (id, papers) => {
    window.open(
      `${window.location.origin}/exam#/gradingPapers/${this.examId}/${id}/${this.state.active}`,
    );
  };
  goToMymarking = (id) => {
    let url = `${window.location.origin}/exam#/myMarking/${this.examId}/${id}/${this.state.active}`;
    window.open(url);
  };

  uploadTestPaper = () => {
    this.props
      .dispatch({
        type: "marking/getUploadPaperScore",
        payload: {
          examId: this.examId,
        },
      })
      .then(() => {
        this.getPage();
      });
  };

  render() {
    const { active } = this.state;
    const { checkQuestionList } = this.props;
    let fileOrgin = {
      fileId: 3_015_090,
      currentFileType: 2,
      currentFileTotalNumber: 1,
      // currentFileUrl:
      // "https://yungu-common.oss-cn-hangzhou.aliyuncs.com/taskFile/1675575344021-1596-IMG_1194-3312590069911fb60faa9139f568fa02.pdf?Expires=1676197768&OSSAccessKeyId=LTAILWTov4XBhVYI&Signature=ou4kZnCjerokkCjfNHNqRq1ZLzs%3D",
      currentUrl:
        '{"bucket":"yungu-common","fileKey":"taskFile/1675828797697-100000100572-IMG_1194-3312590069911fb60faa9139f568fa02_Composed.pdf"}',
      achievementId: null,
      createTime: null,
      contentArray: [
        {
          lineMap: [
            {
              screenWidth: 1194,
              lineColor: "#E35038",
              whichPage: 0,
              creatName: "包晓明 Bao",
              type: 0,
              lineAlpha: 1,
              lineWidth: 2,
              isRubber: false,
              creatTime: 1_675_575_302_450,
              creatUserId: 1596,
              imageShowWidth: 1013.500_060_471_679,
              imageShowHeight: 759.999_999_999_999_9,
              pointArr: [[122.750_030_235_839_52, 501.999_999_999_999_94]],
              imageOrginWidth: 793.890_600_000_000_1,
              operationType: 1,
              imageOrginHeight: 595.32,
              pathStr:
                "YnBsaXN0MDDUAQIDBAUGBwpYJHZlcnNpb25ZJGFyY2hpdmVyVCR0b3BYJG9iamVjdHMSAAGGoF8QD05TS2V5ZWRBcmNoaXZlctEICVRyb290gAGlCwwgJCxVJG51bGzaDQ4PEBESExQVFhcYGRobHBgdHh9WJGNsYXNzXxAcVUlCZXppZXJQYXRoTGluZUpvaW5TdHlsZUtleV8QI1VJQmV6aWVyUGF0aExpbmVEYXNoUGF0dGVybkNvdW50S2V5XxAZVUlCZXppZXJQYXRoTWl0ZXJMaW1pdEtleV8QGVVJQmV6aWVyUGF0aENHUGF0aERhdGFLZXlfEBxVSUJlemllclBhdGhMaW5lRGFzaFBoYXNlS2V5XxAbVUlCZXppZXJQYXRoTGluZUNhcFN0eWxlS2V5XxAYVUlCZXppZXJQYXRoTGluZVdpZHRoS2V5XxAXVUlCZXppZXJQYXRoRmxhdG5lc3NLZXlfECJVSUJlemllclBhdGhVc2VzRXZlbk9kZEZpbGxSdWxlS2V5gAQQARAAIkEgAACAAiIAAAAAIkAAAAAiPxmZmgjSIQ0iI1dOUy5kYXRhTxAQAAAAAAEAAAAEgPVCAAD7Q4AD0iUmJyhaJGNsYXNzbmFtZVgkY2xhc3Nlc11OU011dGFibGVEYXRhoykqK11OU011dGFibGVEYXRhVk5TRGF0YVhOU09iamVjdNIlJi0uXFVJQmV6aWVyUGF0aKIvK1xVSUJlemllclBhdGgACAARABoAJAApADIANwBJAEwAUQBTAFkAXwB0AHsAmgDAANwA+AEXATUBUAFqAY8BkQGTAZUBmgGcAaEBpgGrAawBsQG5AcwBzgHTAd4B5wH1AfkCBwIOAhcCHAIpAiwAAAAAAAACAQAAAAAAAAAwAAAAAAAAAAAAAAAAAAACOQ==",
            },
            {
              screenWidth: 1194,
              lineColor: "#E35038",
              creatName: "包晓明 Bao",
              whichPage: 0,
              type: 0,
              lineAlpha: 1,
              isRubber: false,
              lineWidth: 2,
              creatTime: 1_675_575_304_518,
              creatUserId: 1596,
              imageShowWidth: 1013.500_060_471_679,
              imageShowHeight: 759.999_999_999_999_9,
              imageOrginWidth: 793.890_600_000_000_1,
              pointArr: [
                [175.449_993_903_522_45, 585.801_403_575_93],
                [175.449_993_903_522_45, 585.801_403_575_93],
                [175.449_993_903_522_45, 585.801_403_575_93],
                [175.449_993_903_522_45, 586.195_617_171_876],
                [175.449_993_903_522_45, 586.195_617_171_876],
                [175.844_207_499_468_55, 586.589_830_767_822_1],
                [175.844_207_499_468_55, 586.589_830_767_822_1],
                [177.421_061_883_253, 586.589_830_767_822_1],
                [177.815_275_479_199_16, 586.589_830_767_822_1],
                [178.603_702_671_091_36, 586.589_830_767_822_1],
                [180.574_770_650_821_96, 585.801_403_575_93],
                [182.151_625_034_606_47, 585.012_976_384_037_8],
                [183.728_479_418_390_92, 584.224_549_192_145_4],
                [184.516_906_610_283_17, 583.830_335_596_199_3],
                [185.305_333_802_175_37, 583.436_122_000_253_2],
                [185.699_547_398_121_52, 583.041_908_404_307_2],
                [186.093_760_994_067_62, 581.070_840_424_576_5],
                [186.093_760_994_067_62, 580.676_626_828_630_4],
                [184.911_120_206_229_27, 578.311_345_252_953_7],
                [183.728_479_418_390_92, 577.128_704_465_115_3],
                [179.392_129_862_983_6, 573.974_995_697_546_4],
                [177.815_275_479_199_16, 572.398_141_313_761_9],
                [172.296_285_135_953_5, 568.061_791_758_354_7],
                [168.354_149_176_492_34, 564.513_869_394_839_6],
                [166.383_081_196_761_74, 562.937_015_011_055_1],
                [160.864_090_853_516_13, 557.418_024_667_809_5],
                [158.498_809_277_839_43, 554.264_315_900_240_6],
              ],
              operationType: 1,
              imageOrginHeight: 595.32,
              pathStr:
                "YnBsaXN0MDDUAQIDBAUGBwpYJHZlcnNpb25ZJGFyY2hpdmVyVCR0b3BYJG9iamVjdHMSAAGGoF8QD05TS2V5ZWRBcmNoaXZlctEICVRyb290gAGlCwwgJCxVJG51bGzaDQ4PEBESExQVFhcYGRobHBgdHh9WJGNsYXNzXxAcVUlCZXppZXJQYXRoTGluZUpvaW5TdHlsZUtleV8QI1VJQmV6aWVyUGF0aExpbmVEYXNoUGF0dGVybkNvdW50S2V5XxAZVUlCZXppZXJQYXRoTWl0ZXJMaW1pdEtleV8QGVVJQmV6aWVyUGF0aENHUGF0aERhdGFLZXlfEBxVSUJlemllclBhdGhMaW5lRGFzaFBoYXNlS2V5XxAbVUlCZXppZXJQYXRoTGluZUNhcFN0eWxlS2V5XxAYVUlCZXppZXJQYXRoTGluZVdpZHRoS2V5XxAXVUlCZXppZXJQYXRoRmxhdG5lc3NLZXlfECJVSUJlemllclBhdGhVc2VzRXZlbk9kZEZpbGxSdWxlS2V5gAQQARAAIkEgAACAAiIAAAAAIkAAAAAiPxmZmgjSIQ0iI1dOUy5kYXRhTxECgAAAAAABAAAAM3MvQ0pzEkQCAAAAAgAAADNzL0NKcxJEM3MvQ0pzEkQCAAAAAgAAADNzL0NKcxJEM3MvQ0pzEkQCAAAAAgAAADNzL0NKcxJEM3MvQ+h/EkQCAAAAAgAAADNzL0OFjBJEM3MvQ4WMEkQCAAAAAgAAADNzL0OFjBJEqKUvQyKZEkQCAAAAAgAAAB7YL0PApRJEHtgvQ8ClEkQCAAAAAgAAAB7YL0PApRJE9KEwQ8ClEkQCAAAAAgAAAMtrMUPApRJEQJ4xQ8ClEkQCAAAAAgAAALbQMUPApRJEoTUyQ8ClEkQCAAAAAgAAAIyaMkPApRJE2JYzQ4WMEkQCAAAAAgAAACSTNENKcxJE+1w1Qw9aEkQCAAAAAgAAANEmNkPVQBJEp/A2Q5onEkQCAAAAAgAAAH66N0NfDhJEaR84Q8IBEkQCAAAAAgAAAFSEOEMk9RFEP+k4Q4foEUQCAAAAAgAAACpOOUPp2xFEoIA5Q0zPEUQCAAAAAgAAABazOUOvwhFEi+U5Q5yDEUQCAAAAAgAAAAEYOkOJRBFEARg6Q+s3EUQCAAAAAgAAAAEYOkNOKxFEoIA5Q53fEEQCAAAAAgAAAD/pOEPtkxBE3lE4QxVuEEQCAAAAAgAAAH66N0M9SBBEcI81Q1LjD0QCAAAAAgAAAGNkM0Nmfg9EjJoyQ/FLD0QCAAAAAgAAALbQMUN7GQ9ESA4vQ7iODkQCAAAAAgAAANlLLEP0Aw5EQVMqQ2ySDUQCAAAAAgAAAKpaKEPjIA1EXl4nQ27uDEQCAAAAAgAAABJiJkP4uwxEo58jQ1wLDEQCAAAAAgAAADXdIEPBWgtEdK4fQ9b1CkSAA9IlJicoWiRjbGFzc25hbWVYJGNsYXNzZXNdTlNNdXRhYmxlRGF0YaMpKitdTlNNdXRhYmxlRGF0YVZOU0RhdGFYTlNPYmplY3TSJSYtLlxVSUJlemllclBhdGiiLytcVUlCZXppZXJQYXRoAAgAEQAaACQAKQAyADcASQBMAFEAUwBZAF8AdAB7AJoAwADcAPgBFwE1AVABagGPAZEBkwGVAZoBnAGhAaYBqwGsAbEBuQQ9BD8ERARPBFgEZgRqBHgEfwSIBI0EmgSdAAAAAAAAAgEAAAAAAAAAMAAAAAAAAAAAAAAAAAAABKo=",
            },
            {
              screenWidth: 1194,
              lineColor: "#E35038",
              creatName: "包晓明 Bao",
              whichPage: 0,
              type: 0,
              lineAlpha: 1,
              isRubber: false,
              lineWidth: 2,
              creatTime: 1_675_575_306_426,
              creatUserId: 1596,
              imageShowWidth: 1013.500_060_471_679,
              imageShowHeight: 759.999_999_999_999_9,
              imageOrginWidth: 793.890_600_000_000_1,
              pointArr: [
                [204.227_586_407_589, 315.765_090_352_839_7],
                [204.227_586_407_589, 315.765_090_352_839_7],
                [203.833_372_811_642_9, 315.765_090_352_839_7],
                [203.833_372_811_642_9, 315.765_090_352_839_7],
                [203.439_159_215_696_75, 315.765_090_352_839_7],
                [203.044_945_619_750_65, 315.765_090_352_839_7],
                [203.044_945_619_750_65, 315.765_090_352_839_7],
                [202.650_732_023_804_55, 315.370_876_756_893_6],
                [202.650_732_023_804_55, 315.370_876_756_893_6],
                [202.650_732_023_804_55, 314.976_663_160_947_5],
                [202.650_732_023_804_55, 314.976_663_160_947_5],
                [203.044_945_619_750_65, 314.582_449_565_001_4],
                [203.439_159_215_696_75, 314.188_235_969_055_26],
                [205.016_013_599_481_25, 313.399_808_777_163],
                [206.198_654_387_319_6, 312.611_381_585_270_8],
                [207.775_508_771_104_06, 312.217_167_989_324_7],
                [209.352_363_154_888_5, 311.428_740_797_432_45],
                [210.535_003_942_726_86, 311.034_527_201_486_3],
                [212.111_858_326_511_37, 310.246_100_009_594_1],
                [212.506_071_922_457_47, 309.851_886_413_648],
                [213.294_499_114_349_72, 308.669_245_625_809_6],
                [213.294_499_114_349_72, 308.275_032_029_863_5],
                [213.294_499_114_349_72, 307.486_604_837_971_3],
                [212.111_858_326_511_37, 305.909_750_454_186_8],
                [209.746_576_750_834_66, 303.544_468_878_510_1],
                [206.198_654_387_319_6, 300.784_973_706_887_3],
                [202.256_518_427_858_4, 297.631_264_939_318_4],
                [197.131_741_680_558_9, 294.083_342_575_803_3],
                [192.401_178_529_205_48, 290.141_206_616_342_1],
                [190.430_110_549_474_88, 288.564_352_232_557_67],
                [185.305_333_802_175_37, 283.439_575_485_258_16],
                [184.122_693_014_337_02, 282.256_934_697_419_75],
                [182.545_838_630_552_57, 280.680_080_313_635_36],
              ],
              operationType: 1,
              imageOrginHeight: 595.32,
              pathStr:
                "YnBsaXN0MDDUAQIDBAUGBwpYJHZlcnNpb25ZJGFyY2hpdmVyVCR0b3BYJG9iamVjdHMSAAGGoF8QD05TS2V5ZWRBcmNoaXZlctEICVRyb290gAGlCwwgJCxVJG51bGzaDQ4PEBESExQVFhcYGRobHBgdHh9WJGNsYXNzXxAcVUlCZXppZXJQYXRoTGluZUpvaW5TdHlsZUtleV8QI1VJQmV6aWVyUGF0aExpbmVEYXNoUGF0dGVybkNvdW50S2V5XxAZVUlCZXppZXJQYXRoTWl0ZXJMaW1pdEtleV8QGVVJQmV6aWVyUGF0aENHUGF0aERhdGFLZXlfEBxVSUJlemllclBhdGhMaW5lRGFzaFBoYXNlS2V5XxAbVUlCZXppZXJQYXRoTGluZUNhcFN0eWxlS2V5XxAYVUlCZXppZXJQYXRoTGluZVdpZHRoS2V5XxAXVUlCZXppZXJQYXRoRmxhdG5lc3NLZXlfECJVSUJlemllclBhdGhVc2VzRXZlbk9kZEZpbGxSdWxlS2V5gAQQARAAIkEgAACAAiIAAAAAIkAAAAAiPxmZmgjSIQ0iI1dOUy5kYXRhTxEDEAAAAAABAAAAQzpMQ+7hnUMCAAAAAgAAAEM6TEPu4Z1DQzpMQ+7hnUMCAAAAAgAAAEM6TEPu4Z1DzgdMQ+7hnUMCAAAAAgAAAFjVS0Pu4Z1DWNVLQ+7hnUMCAAAAAgAAAFjVS0Pu4Z1D4qJLQ+7hnUMCAAAAAgAAAG1wS0Pu4Z1D9z1LQ+7hnUMCAAAAAgAAAIILS0Pu4Z1DggtLQ+7hnUMCAAAAAgAAAIILS0Pu4Z1DDNlKQ7TInUMCAAAAAgAAAJamSkN5r51DlqZKQ3mvnUMCAAAAAgAAAJamSkN5r51DlqZKQz6WnUMCAAAAAgAAAJamSkMDfZ1DlqZKQwN9nUMCAAAAAgAAAJamSkMDfZ1DDNlKQ8ljnUMCAAAAAgAAAIILS0OOSp1D9z1LQ1MxnUMCAAAAAgAAAG1wS0MYGJ1DQzpMQ6PlnEMCAAAAAgAAABkETUMts5xDeptNQ7eAnEMCAAAAAgAAANsyTkNCTpxDsfxOQwc1nEMCAAAAAgAAAIjGT0PMG5xDXpBQQ1fpm0MCAAAAAgAAADRaUUPhtptDlfFRQ6adm0MCAAAAAgAAAPaIUkNrhJtDzFJTQ/ZRm0MCAAAAAgAAAKMcVEOAH5tDGE9UQ0UGm0MCAAAAAgAAAI6BVEML7ZpDeeZUQ1qhmkMCAAAAAgAAAGRLVUOqVZpDZEtVQ288mkMCAAAAAgAAAGRLVUM0I5pDZEtVQ7/wmUMCAAAAAgAAAGRLVUNJvplDBLRUQ15ZmUMCAAAAAgAAAKMcVENz9JhD4e1SQxJdmEMCAAAAAgAAACC/UUOxxZdD/fhPQxYVl0MCAAAAAgAAANsyTkN6ZJZDQzpMQ6SalUMCAAAAAgAAAKtBSkPN0JRDs7FHQ7ztk0MCAAAAAgAAALohRUOrCpNDN8RCQ18OkkMCAAAAAgAAALRmQEMTEpFDaGo/QyitkEMCAAAAAgAAABxuPkM9SJBDI947Q0AAj0MCAAAAAgAAACpOOUNEuI1DyrY4Q5RsjUMCAAAAAgAAAGkfOEPjII1DklU3Q/i7jEOAA9IlJicoWiRjbGFzc25hbWVYJGNsYXNzZXNdTlNNdXRhYmxlRGF0YaMpKitdTlNNdXRhYmxlRGF0YVZOU0RhdGFYTlNPYmplY3TSJSYtLlxVSUJlemllclBhdGiiLytcVUlCZXppZXJQYXRoAAgAEQAaACQAKQAyADcASQBMAFEAUwBZAF8AdAB7AJoAwADcAPgBFwE1AVABagGPAZEBkwGVAZoBnAGhAaYBqwGsAbEBuQTNBM8E1ATfBOgE9gT6BQgFDwUYBR0FKgUtAAAAAAAAAgEAAAAAAAAAMAAAAAAAAAAAAAAAAAAABTo=",
            },
          ],
          creatUsers: [
            {
              creatUserAvtar:
                "https://yungu-public.oss-cn-hangzhou.aliyuncs.com/00db1ad6-e0eb-4ce4-ad52-f7f600ecc208.jpg?x-oss-process=image/crop,x_27,y_0,w_724,h_724",
              creatUserName: "包晓明",
              creatUserId: 1596,
            },
            {
              creatUserAvtar:
                "https://yungu-public.oss-cn-hangzhou.aliyuncs.com/83a7a989-1129-4b45-9c23-ec64446841c0.jpg?x-oss-process=image/crop,x_90,y_0,w_500,h_500",
              creatUserName: "孔致睿",
              creatUserId: 100_000_100_572,
            },
          ],
          imageOrginWidth: 793.890_600_000_000_1,
          isQuanjingData: false,
          imageOrginHeight: 595.32,
        },
      ],
    };
    let columns = [
      {
        title: trans("global.questionBlock", "题号/题块"),
        dataIndex: "questionInfo",
        key: "questionInfo",
        width: 100,
      },
      {
        title: trans("global.correctionStatus", "批改状态"),
        dataIndex: "checkStatus",
        key: "checkStatus",
        width: 100,
        render: (text, record) => {
          return (
            <span>
              {text
                ? trans("global.completed", "已完成")
                : trans("global.notComplete", "未完成")}
            </span>
          );
        },
      },
      {
        title: trans("global.allCorrectionProgress", "整体批改进度"),
        dataIndex: "allNum",
        key: "allNum",
        width: 180,
        render: (text, record) => {
          let number_ = (record.checkNum / record.allNum) * 100;
          console.log(number_, "zwl");
          return (
            <div className={styles.allCorrectionProgress}>
              <Progress
                percent={number_}
                showInfo={false}
                strokeColor="#56A601"
                strokeWidth={12}
                width={120}
              />
              <span className={styles.progressNum}>
                {record.checkNum} / {record.allNum}
              </span>
            </div>
          );
        },
      },
      {
        title: trans("global.needMyCheckNum", "需我完成的"),
        dataIndex: "needMyCheckNum",
        key: "needMyCheckNum",
        width: 100,
      },
      {
        title: checkQuestionList.manageStatus
          ? trans("global.progressReviewer", "各批改人进度")
          : trans("global.myCorrection", "我的批改量"),
        dataIndex: checkQuestionList.manageStatus
          ? "checkDetail"
          : "myCheckNum",
        key: checkQuestionList.manageStatus ? "checkDetail" : "myCheckNum",
        width: 100,
      },
      {
        title: trans("global.needMyArbitrationNum", "需我仲裁的"),
        dataIndex: "needMyArbitrationNum",
        key: "needMyArbitrationNum",
        width: 100,
      },
      {
        title: trans("global.option", "操作"),
        dataIndex: "checkNum",
        key: "checkNum",
        width: 100,
        render: (text, record) => {
          return (
            <div style={{ display: "flex" }}>
              {checkQuestionList.processStatus == 5 ||
              checkQuestionList.scoreUploadStatus ? (
                <div
                  style={{ color: "#0445fc", cursor: "pointer" }}
                  onClick={() =>
                    this.clickImmediateCorrection(
                      record.questionSettingIdList.join(","),
                    )
                  }
                >
                  {trans("global.nowView", "立即查看")}
                </div>
              ) : (
                <div
                  style={{ color: "#0445fc", cursor: "pointer" }}
                  onClick={() =>
                    this.clickImmediateCorrection(
                      record.questionSettingIdList.join(","),
                    )
                  }
                >
                  {trans("global.immediateCorrection", "立即批改")}
                </div>
              )}
              <div
                style={{
                  color: "#0445fc",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
                onClick={() => {
                  this.goToMymarking(record.questionSettingIdList.join(","));
                }}
              >
                {trans("myMarking.title", "我的批改")}
              </div>
            </div>
          );
          // <Link
          //   to={`/gradingPapers/${
          //     this.examId
          //   }/${record.questionSettingIdList.join(",")}`}
          //   target="_blank"
          // >

          // </Link>
        },
      },
    ];
    let columns1 = [
      {
        title: trans("global.questionBlock", "题号/题块"),
        dataIndex: "questionInfo",
        key: "questionInfo",
        width: 100,
      },
      {
        title: trans("global.correctionStatus", "批改状态"),
        dataIndex: "checkStatus",
        key: "checkStatus",
        width: 100,
        render: (text, record) => {
          return (
            <span>
              {text
                ? trans("global.completed", "已完成")
                : trans("global.notComplete", "未完成")}
            </span>
          );
        },
      },
      {
        title: trans("global.allCorrectionProgress", "整体批改进度"),
        dataIndex: "allNum",
        key: "allNum",
        width: 180,
        render: (text, record) => {
          let number_ = (record.checkNum / record.allNum) * 100;
          console.log(number_, "zwl");
          return (
            <div className={styles.allCorrectionProgress}>
              <Progress
                percent={number_}
                showInfo={false}
                strokeColor="#56A601"
                strokeWidth={12}
                width={120}
              />
              <span className={styles.progressNum}>
                {record.checkNum} / {record.allNum}
              </span>
            </div>
          );
        },
      },
      {
        title: checkQuestionList.manageStatus
          ? trans("global.progressReviewer", "各批改人进度")
          : trans("global.myCorrection", "我的批改量"),
        dataIndex: checkQuestionList.manageStatus
          ? "checkDetail"
          : "myCheckNum",
        key: checkQuestionList.manageStatus ? "checkDetail" : "myCheckNum",
        width: 100,
      },
      {
        title: trans("global.option", "操作"),
        dataIndex: "checkNum",
        key: "checkNum",
        width: 100,
        render: (text, record) => {
          return (
            // <Link
            //   to={`/gradingPapers/${
            //     this.examId
            //   }/${record.questionSettingIdList.join(",")}`}
            //   target="_blank"
            // >
            checkQuestionList.processStatus == 5 ||
              checkQuestionList.scoreUploadStatus ? (
              <div
                style={{ color: "#0445fc", cursor: "pointer" }}
                onClick={() =>
                  this.clickImmediateCorrection(
                    record.questionSettingIdList.join(","),
                  )
                }
              >
                {trans("global.nowView", "立即查看")}
              </div>
            ) : (
              <div
                style={{ color: "#0445fc", cursor: "pointer" }}
                onClick={() =>
                  this.clickImmediateCorrection(
                    record.questionSettingIdList.join(","),
                  )
                }
              >
                {trans("global.immediateCorrection", "立即批改")}
              </div>
            )
            // </Link>
          );
        },
      },
    ];
    return (
      <div className={styles.correctionDetailsBox}>
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <Icon
              type="left"
              className={[styles.closeIcon].join(" ")}
              onClick={this.back}
            />
            <span className={styles.testTitle}>
              {checkQuestionList?.examName}
            </span>
          </div>
          {checkQuestionList.manageStatus ? (
            <>
              {checkQuestionList.processStatus == 4 ? (
                <div
                  className={styles.uploadGradesBtn}
                  style={{ color: "#0445fc", background: "#dde5fd" }}
                  onClick={this.uploadTestPaper}
                >
                  {trans("global.uploadGrades", "上传成绩")}
                </div>
              ) : (
                <Popover
                  content={
                    checkQuestionList.processStatus === 5
                      ? trans("global.uploaded", "成绩已上传")
                      : trans(
                          "global.noUpContent",
                          "题目未批改完，暂时无法上传",
                        )
                  }
                  title={null}
                  trigger="hover"
                >
                  <div className={styles.uploadGradesBtn}>
                    {trans("global.uploadGrades", "上传成绩")}
                  </div>
                </Popover>
              )}
            </>
          ) : null}
        </div>
        <div className={styles.navbarHeader}>
          <span className={styles.viewBox}>
            <span
              onClick={() => this.switchTab(1)}
              className={[
                styles.viewTab,
                active === 1 ? styles.isCheck : "",
              ].join(" ")}
              data-type="批改进度"
            >
              {trans("global.correctionProgress", "批改进度")}
            </span>
            <span
              onClick={() => this.switchTab(2)}
              className={[
                styles.viewTab,
                active === 2 ? styles.isCheck : "",
              ].join(" ")}
              data-type="问题卷处理"
            >
              {trans("global.problemVolumeProcessing", "问题卷处理")}
            </span>
          </span>
        </div>
        <div className={styles.statusContent}>
          {active == 1 ? (
            <div>
              {/* <DrawingBoardPC fileOrgin={fileOrgin}></DrawingBoardPC> */}
              <Table
                dataSource={checkQuestionList?.questionCheckList || []}
                pagination={false}
                scroll={{ y: true }}
                columns={columns}
              />
            </div>
          ) : (
            <div>
              <Table
                dataSource={checkQuestionList?.questionCheckList || []}
                pagination={false}
                // scroll={{ y: true }}
                columns={columns1}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}
export default connect(({ home, marking, global }) => ({
  checkQuestionList: marking.checkQuestionList,
}))(CorrectionDetails);

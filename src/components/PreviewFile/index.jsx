//预览附件组件
import React, { PureComponent } from "react";
import { Icon, Slider, Tooltip } from "antd";
import Iframe from "react-iframe";

import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

let scaleIndex = 3;
let rotateIndex = 0;

class PreviewFile extends PureComponent {
  constructor(properties) {
    super();
    this.state = {
      isPlaying: false, //是否播放
      dotLeft: 0, //拖动点距离
      playPercent: 0, //播放进度
      Iconfont: null,
      duration: 0, //录音时长
      toolbarVisble: false,
    };
    this.scaleTimes = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];
    this.rotateDeg = [0, -90, -180, -270];
    this.audio = null;
    this.imageWidth = 0;
    this.paletteObj = {};
  }

  //处理录音组件
  getAudio(previewInfo) {
    let info = previewInfo || {};
    this.audio = document.querySelector("#audioEle") || null;
    if (this.audio) {
      this.audio.src = `${window.location.origin}${info.url}`;
      this.audio.load();
      let self = this;
      this.audio.addEventListener("canplay", function () {
        self.setState({
          duration: self.audio.duration || 0,
        });
      });
    }
  }

  componentDidMount() {
    const { previewInfo } = this.props;
    let info = previewInfo || {};
    this.handleInitStatus(info);
    const Iconfonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_hpvg0re4gd.js",
    });
    this.setState({
      Iconfont: Iconfonts,
    });
  }

  //postmessage
  postMessageFun(info, event_) {
    let data = info.storeMeta || "";
    if (event_.data && event_.data == "giveMeData") {
      //富文本：我要给你传消息了！
      let documentIframe =
        document.querySelector("#documentIframe") &&
        document.querySelector("#documentIframe").contentWindow;
      console.log(documentIframe, "documentIframe");
      if (documentIframe) {
        console.log("接收givemedata,发送");
        documentIframe.postMessage({ delta: data }, "*");
      }
    }
  }

  //预览文件处理
  handleInitStatus = (info) => {
    if (info.type == "audio") {
      this.getAudio(info);
    }
    let self = this;
    if (info.type == "onlineDocument") {
      //在线文档
      // let data = info.storeMeta || "";
      window.removeEventListener(
        "message",
        this.postMessageFun.bind(this, info),
      );
      window.addEventListener("message", this.postMessageFun.bind(this, info));
      // window.addEventListener("message", function(ev,n) {
      //     if(ev.data && ev.data == "giveMeData") {
      //         //富文本：我要给你传消息了！
      //          let documentIframe = document.getElementById('documentIframe') && document.getElementById('documentIframe').contentWindow;
      //          console.log(documentIframe, 'documentIframe');
      //         if(documentIframe) {
      //             console.log("接收givemedata,发送");
      //             documentIframe.postMessage({'delta': data}, '*');
      //         }
      //         //typeof self.props.goToEdit == "function" && self.props.goToEdit.call(self);
      //     }
      // }, false)
    }
  };

  componentDidUpdate(previousProperties, previousState) {
    if (
      JSON.stringify(previousProperties.previewInfo) !=
      JSON.stringify(this.props.previewInfo)
    ) {
      let info = this.props.previewInfo || {};
      if (info.type == "onlineDocument") {
        var documentIframe =
          document.querySelector("#documentIframe") &&
          document.querySelector("#documentIframe").contentWindow;
        if (documentIframe) {
          documentIframe.postMessage("changeInfo", "*");
        }
        console.log("changeInfo");
      }
      this.handleInitStatus(info);
    }
  }

  //放大图片
  toBigImg = () => {
    scaleIndex = scaleIndex + 1 >= 9 ? 9 : scaleIndex + 1;
    let scale = this.scaleTimes[scaleIndex];
    let deg = this.rotateDeg[rotateIndex];
    if (scale) {
      this.setZoom(scale, deg);
    }
  };

  //缩小图片
  toSmallImg = () => {
    scaleIndex = scaleIndex - 1 <= 0 ? 0 : scaleIndex - 1;
    let scale = this.scaleTimes[scaleIndex];
    let deg = this.rotateDeg[rotateIndex];
    if (scale) {
      this.setZoom(scale, deg);
    }
  };

  //重置图片
  resetImage = () => {
    scaleIndex = 3;
    let scale = this.scaleTimes[scaleIndex];
    let deg = this.rotateDeg[rotateIndex];
    this.setZoom(scale, deg);
  };

  setZoom(zoom, rotateDeg) {
    let imgBox = document.querySelectorAll(".previewImgBox");
    for (const element of imgBox) {
      element.style.cssText = `-webkit-transform: scale(${zoom}) rotate(${rotateDeg}deg);`;
    }
  }

  //旋转
  rotateImg = () => {
    let scale = this.scaleTimes[scaleIndex];
    rotateIndex = rotateIndex + 1 >= 4 ? 0 : rotateIndex + 1;
    let deg = this.rotateDeg[rotateIndex];
    this.setZoom(scale, deg);
  };

  //录音时长格式化
  formatDuration = (duration) => {
    duration = duration || 0;
    let second = Number.parseInt(duration),
      minute = 0,
      hour = 0;
    if (second > 59) {
      minute = Number.parseInt(second / 60);
      second = Number.parseInt(second % 60);
    }
    if (minute > 59) {
      hour = Number.parseInt(minute / 60);
      minute = Number.parseInt(minute % 60);
    }
    second = second < 10 ? `0${second}` : second;
    minute = minute < 10 ? `0${minute}` : minute;
    hour = hour < 10 ? `0${hour}` : hour;
    return minute > 59
      ? hour + ":" + minute + ":" + second
      : minute + ":" + second;
  };

  //重置
  resetPlay() {
    this.setState({
      isPlaying: false,
    });
  }

  //播放录音
  playAudio = () => {
    this.setState({
      isPlaying: true,
    });
    this.audio = document.querySelector("#audioEle");
    this.audio && this.audio.play();
    this.updatePlayInfo();
    let self = this;
    if (this.audio) {
      this.audio.addEventListener(
        "timeupdate",
        function () {
          //监听播放进度
          self.updatePlayInfo();
        },
        false,
      );
      this.audio.addEventListener("ended", function () {
        //播放结束重置
        self.resetPlay();
      });
    }
  };

  //停止播放
  pauseAudio = () => {
    this.setState({
      isPlaying: false,
    });
    this.audio && this.audio.pause();
    this.updatePlayInfo();
  };

  //获取播放时间和播放进度
  updatePlayInfo() {
    let instance = this.audio
      ? (this.audio.currentTime / this.audio.duration) * 100
      : 0;
    this.setState({
      dotLeft: instance,
      playPercent: instance,
    });
  }

  //拖拽播放设置进度
  handleDot = (rate) => {
    //音乐播放中 或者播放了暂停了 才可以调节
    if (this.audio && (!this.audio.paused || this.audio.currentTime != 0)) {
      // let audioBarWidth = this.refs.audioBar.offsetWidth;
      // let rate = e.target.offsetLeft / audioBarWidth;
      if (this.audio && this.audio.currentTime) {
        this.audio.currentTime = this.audio.duration * (rate / 100);
      }
      this.updatePlayInfo();
    }
  };

  //关闭预览--点击空白处关闭预览
  closePreview = (e, className) => {
    let target = e.target || e.srcElement;
    console.log(target, "target");
    if (target.className != className) {
      this.onClose();
    }
  };

  //渲染画板附件
  renderDrawingFiles = () => {
    const { previewInfo } = this.props;
    let info = previewInfo || {};
    // console.log(info, "asa");
    if (info.type == "image") {
      return (
        <div
          className={styles.imageStyle}
          onMouseDown={(e) => this.closePreview(e, "previewImgBox")}
          onTouchStart={(e) => this.closePreview(e, "previewImgBox")}
        >
          <img
            className="previewImgBox"
            src={info.fileContentUrl || info.url}
          />
        </div>
      );
    } else if (info.type == "pdf") {
      return (
        <Iframe
          url={`${info.fileContentUrl || info.url}#toolbar=0`}
          display="initial"
          position="relative"
          border="0"
          marginWidth="0"
          marginHeight="0"
          scrolling="yes"
          width="80%"
          id="pdfIframe"
          className={styles.iframeStyle}
        />
      );
    } else if (!info.type) {
      //上传中的附件
      return (
        <div className={styles.imageStyle}>
          <img
            className="previewImgBox"
            src="https://assets.yungu.org/statics/0.0.1/fileCover/uploading.gif"
          />
        </div>
      );
    }
  };

  //渲染附件
  renderFiles = () => {
    const { previewInfo, fullScreen } = this.props;
    const { Iconfont } = this.state;
    let info = previewInfo || {};
    console.log(info, "asa");
    if (info.type == "image") {
      //图片
      return (
        <div
          className={styles.imageStyle}
          onMouseDown={(e) => this.closePreview(e, "previewImgBox")}
          onTouchStart={(e) => this.closePreview(e, "previewImgBox")}
        >
          <img className="previewImgBox" src={info.url} />
        </div>
      );
    } else if (info.type == "pdf") {
      //pdf
      return (
        <Iframe
          url={`${info.url}#toolbar=0`}
          display="initial"
          position="relative"
          border="0"
          marginWidth="0"
          marginHeight="0"
          scrolling="yes"
          width="80%"
          id="pdfIframe"
          className={styles.iframeStyle}
        />
      );
    } else if (info.type == "video") {
      //视频
      return (
        <video
          src={info.url}
          controls="controls"
          controlsList="nodownload"
          className={styles.videoStyle}
        >
          {trans("previewFile.videoUnsupported", "您的浏览器不支持video标签")}
        </video>
      );
    } else if (info.type == "audio") {
      //音频
      return (
        <div
          className={fullScreen ? styles.noFullAudioStyle : styles.audioStyle}
        >
          <i
            className={`${icon.iconfont} ${styles.closeModal}`}
            onMouseDown={this.onClose}
            onTouchStart={this.onClose}
          >
            &#xe6e2;
          </i>
          <span className={styles.audioPreview}>
            {this.state.isPlaying ? (
              <em className={styles.playButton} key="speakTips">
                <i
                  className={`${icon.iconfont2} ${styles.playIcon}`}
                  data-type="录音附件停止播放"
                  onMouseDown={this.pauseAudio}
                  onTouchStart={this.pauseAudio}
                >
                  &#xe6a4;
                </i>
              </em>
            ) : (
              <em className={styles.playButton} key="speakTips">
                <i
                  className={`${icon.iconfont2} ${styles.playIcon}`}
                  style={{ paddingLeft: 5 }}
                  data-type="录音附件开始播放"
                  onMouseDown={this.playAudio}
                  onTouchStart={this.playAudio}
                >
                  &#xe6a7;
                </i>
              </em>
            )}
            <audio
              id="audioEle"
              src={`${window.location.origin}${info.url}`}
              width="381"
              preload="auto"
            >
              {trans("previewFile.audioUnsupported", "该浏览器不支持播放")}
            </audio>
            <em className={styles.audioBar}>
              <Slider
                value={this.state.playPercent}
                onChange={this.handleDot}
                tooltipVisible={false}
              />
            </em>
            <em className={styles.audioTime}>
              <span className={styles.playTime}>
                {this.formatDuration(this.audio && this.audio.currentTime)}
              </span>
              <span className={styles.duration}>
                {this.formatDuration(this.audio && this.state.duration)}
              </span>
            </em>
          </span>
        </div>
      );
    } else if (info.type == "onlineDocument") {
      //在线文档预览
      let iframeUrl = `${window.location.origin}/#/onlinePreview`;
      //let iframeUrl = 'http://localhost:8020/#/onlinePreview';
      return (
        <Iframe
          url={iframeUrl}
          display="initial"
          position="relative"
          border="0"
          marginWidth="0"
          marginHeight="0"
          scrolling="yes"
          width="80%"
          id="documentIframe"
          className={`${styles.iframeStyle} iframePage`}
        />
      );
    } else if (info.type) {
      //不支持预览的封面
      return (
        <div
          className={styles.imageStyle}
          onMouseDown={(e) => this.closePreview(e, "noPreview")}
          onTouchStart={(e) => this.closePreview(e, "noPreview")}
        >
          <div className={`${styles.noPreview} noPreview`}>
            <i>{Iconfont ? <Iconfont type="icon-Folderbeifen" /> : null}</i>
            <span>
              {trans("previewFile.unPreviewTips", "该文件当前不支持预览")}
            </span>
            <span>
              {trans(
                "previewFile.pleaseDown",
                "点击右上角下载到本地后再进行查看",
              )}
            </span>
          </div>
        </div>
      );
    } else {
      //上传中的附件
      return (
        <div className={styles.imageStyle}>
          <img
            className="previewImgBox"
            src="https://assets.yungu.org/statics/0.0.1/fileCover/uploading.gif"
          />
        </div>
      );
    }
  };

  //关闭弹窗
  onClose = () => {
    const { onClose } = this.props;
    typeof onClose == "function" && onClose.call(this, false, {}, "");
  };

  //下载
  downloadFile = (url) => {
    window.open(url);
  };

  //切换全屏与非全屏
  switchScreen = (bool) => {
    const { switchScreen } = this.props;
    typeof switchScreen == "function" && switchScreen.call(this, bool);
  };

  showToolbar = (visible) => {
    //滑入滑出
    this.setState({
      toolbarVisble: visible,
    });
  };

  //切换上一个
  switchPrevious = () => {
    this.props.clickPrevious();
  };

  //切换下一个
  switchNext = () => {
    this.props.clickNext();
  };

  render() {
    /**
     * fullScreen: true|false 是否全屏
     * showCloseBtn: true|false 是否显示关闭
     * showSwitchScreen: true|false 是否展示切换全屏 非全屏
     * previewInfo: {} 预览附件信息
     */
    const {
      previewInfo,
      fullScreen,
      showCloseBtn,
      showSwitchScreen,
      hasBorderRadius,
    } = this.props;
    let info = previewInfo || {};
    let isShowFullIcon =
      info.type == "image" ||
      info.type == "pdf" ||
      info.type == "video" ||
      info.type == "onlineDocument" ||
      info.fileContentUrl
        ? true
        : false; //是否显示全屏按钮
    console.log(previewInfo, "previewInfo >>>", this.state.toolbarVisble);
    return (
      <div
        onMouseEnter={() => this.showToolbar(true)}
        onMouseLeave={() => this.showToolbar(false)}
        className={
          hasBorderRadius && !fullScreen
            ? [styles.previewModal, styles.borderRadiusBox].join(" ")
            : styles.previewModal
        }
        style={{
          position: fullScreen ? "fixed" : "relative",
          zIndex: fullScreen ? "1000" : "900",
        }}
      >
        {info.fileContentUrl && fullScreen ? null : this.state.toolbarVisble ? ( //画板全屏模式下隐藏头部按钮 */}
          <p
            className={styles.modalBtn}
            style={{
              borderRadius:
                hasBorderRadius && !fullScreen ? "20px 20px 0 0" : "0 none",
            }}
          >
            {fullScreen && info.type == "audio" ? (
              <span>{null}</span>
            ) : (
              <i
                className={[icon.iconfont, styles.closeBtn].join(" ")}
                style={{ opacity: fullScreen || showCloseBtn ? "1" : "0" }}
                onMouseDown={this.onClose}
                onTouchStart={this.onClose}
              >
                &#xe6e2;
              </i>
            )}
            {info.type == "image" && !info.fileContentUrl && (
              <div className={styles.operation}>
                <Tooltip
                  placement="bottom"
                  title={trans("global.rotation", "旋转")}
                >
                  <span
                    className={`${styles.imageIcon} ${styles.scaleIcon}`}
                    data-type="附件查看-旋转图片"
                    onMouseDown={this.rotateImg}
                    onTouchStart={this.rotateImg}
                  >
                    <i className={icon.iconfont}>&#xe608;</i>
                  </span>
                </Tooltip>
                <Tooltip
                  placement="bottom"
                  title={trans("global.scale", "缩小")}
                >
                  <span
                    className={styles.imageIcon}
                    data-type="附件查看-缩小图片"
                    onMouseDown={this.toSmallImg}
                    onTouchStart={this.toSmallImg}
                  >
                    <i className={icon.iconfont}>&#xe676;</i>
                  </span>
                </Tooltip>
                <Tooltip
                  placement="bottom"
                  title={trans("global.actualSize", "实际尺寸")}
                >
                  <span
                    className={`${styles.imageIcon} ${styles.resetImg}`}
                    data-type="附件查看-重置图片"
                    onMouseDown={this.resetImage}
                    onTouchStart={this.resetImage}
                  >
                    1 : 1
                  </span>
                </Tooltip>
                <Tooltip
                  placement="bottom"
                  title={trans("global.enlarge", "放大")}
                >
                  <span
                    className={styles.imageIcon}
                    data-type="附件查看-放大图片"
                    onMouseDown={this.toBigImg}
                    onTouchStart={this.toBigImg}
                  >
                    <i className={icon.iconfont}>&#xe674;</i>
                  </span>
                </Tooltip>
              </div>
            )}
            <span>
              {info.isDownload == true || info.isDownload == undefined ? (
                info.type == "onlineDocument" ? null : (
                  <Tooltip
                    placement="bottom"
                    title={trans("selectStudent.downloadFile", "下载")}
                  >
                    <i
                      className={`${icon.iconfont} ${styles.downIcon}`}
                      data-type="下载附件"
                      onMouseDown={() =>
                        this.downloadFile(
                          info.fileContentDownloadUrl || info.downloadUrl,
                        )
                      }
                      onTouchStart={() =>
                        this.downloadFile(
                          info.fileContentDownloadUrl || info.downloadUrl,
                        )
                      }
                    >
                      &#xe6aa;
                    </i>
                  </Tooltip>
                )
              ) : null}
              {isShowFullIcon && showSwitchScreen && !fullScreen && (
                <Tooltip
                  placement="bottom"
                  title={trans("global.fullScreen", "全屏")}
                >
                  <i
                    className={icon.iconfont}
                    data-type="查看附件全屏"
                    onMouseDown={() => this.switchScreen(true)}
                    onTouchStart={() => this.switchScreen(true)}
                  >
                    &#xe7d6;
                  </i>
                </Tooltip>
              )}
              {isShowFullIcon && showSwitchScreen && fullScreen && (
                <Tooltip
                  placement="bottom"
                  title={trans("global.exitFullScreen", "退出全屏")}
                >
                  <i
                    className={icon.iconfont2}
                    data-type="切换附件非全屏查看"
                    onMouseDown={() => this.switchScreen(false)}
                    onTouchStart={() => this.switchScreen(false)}
                  >
                    &#xe6af;
                  </i>
                </Tooltip>
              )}
            </span>
          </p>
        ) : null}
        <div
          className={styles.filesArea}
          style={{ top: info.fileContentUrl ? 0 : fullScreen ? 52 : 0 }}
        >
          {this.renderFiles()}
        </div>
        {this.state.toolbarVisble &&
        (info.type == "image" ||
          info.type == "onlineDocument" ||
          info.type == "pdf") ? (
          <span className={styles.showFileName}>
            {info.fileName || info.url}
          </span>
        ) : null}
        {this.props.btnId == "stuAnswerImg" ? null : (
          <>
            <i
              className={`${icon.iconfont} ${styles.switchBtn} ${styles.previousBtn}`}
              onMouseDown={this.switchPrevious}
              onTouchStart={this.switchPrevious}
            >
              &#xe786;
            </i>
            <i
              className={`${icon.iconfont} ${styles.switchBtn} ${styles.nextBtn}`}
              onMouseDown={this.switchNext}
              onTouchStart={this.switchNext}
            >
              &#xe787;
            </i>
          </>
        )}
      </div>
    );
  }
}

export default PreviewFile;

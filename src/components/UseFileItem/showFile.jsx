import React, { Fragment, PureComponent } from "react";
import { message } from "antd";

import { trans } from "../../utils/i18n";
import PreviewFile from "../PreviewFile";

class ShowFile extends PureComponent {
  constructor(properties) {
    super();

    this.state = {
      previewIndex: 0,
    };
  }
  clickPrevious = () => {
    if (this.state.previewIndex == 0) {
      message.info(trans("previewFile.previous", "当前已经是第一个了哦~"));
      return false;
    } else {
      this.setState({
        previewIndex: this.state.previewIndex - 1,
      });
    }
  };
  clickNext = () => {
    if (this.state.previewIndex == this.props.previewInfo.length - 1) {
      message.info(trans("previewFile.next", "当前已经是最后一个了哦~"));
      return false;
    } else {
      this.setState({
        previewIndex: this.state.previewIndex + 1,
      });
    }
  };

  render() {
    const { previewVisible, previewInfo } = this.props; // iframeVisible, iframeUrl
    const { previewIndex } = this.state;
    console.log(previewInfo, "zwl33");
    return (
      <Fragment>
        {previewVisible && (
          <PreviewFile
            visible={previewVisible}
            onClose={this.props.lookDetail}
            previewInfo={
              this.props.imgchange ? previewInfo[previewIndex] : previewInfo
            }
            // previewInfo={previewInfo}
            fullScreen={true}
            clickPrevious={this.clickPrevious}
            clickNext={this.clickNext}
            btnId={this.props.btnId}
          />
        )}

        {/* {
                    iframeVisible &&
                    <div className={styles.linkFile}>
                        <i className={`${styles.closeBtn}`} onMouseDown={this.props.lookIframe} onTouchStart={this.props.lookIframe}>&#xe6e2;</i>
                        <div dangerouslySetInnerHTML={{ __html: iframeUrl || '' }}></div>
                    </div>
                } */}
      </Fragment>
    );
  }
}

export default ShowFile;

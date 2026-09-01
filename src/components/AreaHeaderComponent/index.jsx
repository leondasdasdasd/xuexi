// 类组件
import React from "react";
import { Dropdown, Icon, Menu } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import { closeFullscreen, openFullscreen } from "../../utils/utils";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

export class AreaHeaderComponent extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      fullscreenStatus: false,
    };
  }

  componentDidMount() {
    if (this.props.showFullscreenBtn) {
      // 监听退出全屏事件 --- chrome 用 esc 退出全屏并不会触发 keyup 事件
      document.addEventListener(
        "webkitfullscreenchange",
        this.fullscreenChange,
      ); /* Chrome, Safari and Opera */
      document.addEventListener(
        "mozfullscreenchange",
        this.fullscreenChange,
      ); /* Firefox */
      document.addEventListener(
        "fullscreenchange",
        this.fullscreenChange,
      ); /* Standard syntax */
      document.addEventListener(
        "msfullscreenchange",
        this.fullscreenChange,
      ); /* IE / Edge */
    }
  }

  fullscreenChange = (e) => {
    // 获取当前全屏元素
    var element = document.fullscreenElement;
    if (element === null) {
      console.log("全屏已关闭");
      // 这里为了处理esc时退出全屏，同步所有fullscreenStatus的值为false
      this.setState(
        {
          fullscreenStatus: false,
        },
        () => {
          if (typeof this.props.onClickFullscreen == "function") {
            this.props.onClickFullscreen(false);
          }
        },
      );
    } else {
      console.log("全屏已打开");
    }
  };

  clickFullscreen = () => {
    if (this.state.fullscreenStatus) {
      closeFullscreen();
    } else {
      openFullscreen(document.documentElement);
    }
    this.setState(
      {
        fullscreenStatus: !this.state.fullscreenStatus,
      },
      () => {
        if (typeof this.props.onClickFullscreen == "function") {
          this.props.onClickFullscreen(this.state.fullscreenStatus);
        }
      },
    );
  };

  exportChange = () => {
    this.props.onClickExport();
  };

  /**
   * 点击导出下拉菜单项时，按菜单 key 找到对应业务动作。
   * @param {object} menuInfo antd Menu 传入的点击信息。
   * @returns {void}
   */
  exportMenuChange = (menuInfo) => {
    const exportMenuItems = this.props.exportMenuItems || [];
    const activeItem = exportMenuItems.find(
      (item) => item.key === menuInfo.key,
    );
    if (activeItem && typeof activeItem.onClick === "function") {
      activeItem.onClick(menuInfo);
    }
  };

  /**
   * 渲染导出入口；传入菜单项时展示下拉菜单，否则保持历史单按钮行为。
   * @returns {React.ReactNode}
   */
  renderExport = () => {
    const { exportMenuItems = [] } = this.props;
    if (exportMenuItems.length > 0) {
      const exportMenu = (
        <Menu onClick={this.exportMenuChange}>
          {exportMenuItems.map((item) => (
            <Menu.Item key={item.key} disabled={item.disabled}>
              {item.label}
            </Menu.Item>
          ))}
        </Menu>
      );
      return (
        <Dropdown overlay={exportMenu} trigger={["click"]}>
          <div className={styles.export}>
            {trans("global.export", "导出")}
            <Icon className={styles["export-arrow"]} type="down" />
          </div>
        </Dropdown>
      );
    }
    return (
      <div className={styles.export} onClick={this.exportChange}>
        {trans("global.export", "导出")}
      </div>
    );
  };

  render() {
    const {
      title,
      leftPanelContent,
      rightPanelContent,
      showFullscreenBtn,
      showExportBtn,
    } = this.props;
    const { fullscreenStatus } = this.state;
    return (
      <div className={styles.areaHeaderComponent}>
        <div className={styles.title}>{title}</div>
        <div className={styles.leftPanel}>{leftPanelContent}</div>
        <div className={styles.rightPanel}>
          {rightPanelContent}
          {showExportBtn ? this.renderExport() : null}
          {showFullscreenBtn ? (
            <div className={styles.fullscreenBtn}>
              {fullscreenStatus ? (
                <div onClick={this.clickFullscreen}>
                  <i className={icon.iconfont}>&#xe8a3;</i>
                </div>
              ) : (
                <div onClick={this.clickFullscreen}>
                  <i className={icon.iconfont}>&#xe8a4;</i>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  componentWillUnmount() {
    //销毁时清除监听
    document.removeEventListener(
      "webkitfullscreenchange",
      this.fullscreenChange,
    );
    document.removeEventListener("mozfullscreenchange", this.fullscreenChange);
    document.removeEventListener("fullscreenchange", this.fullscreenChange);
    document.removeEventListener("MSFullscreenChange", this.fullscreenChange);
  }
}

AreaHeaderComponent.propTypes = {
  exportMenuItems: PropTypes.arrayOf(
    PropTypes.shape({
      disabled: PropTypes.bool,
      key: PropTypes.string,
      label: PropTypes.node,
      onClick: PropTypes.func,
    }),
  ),
  leftPanelContent: PropTypes.node,
  onClickExport: PropTypes.func,
  onClickFullscreen: PropTypes.func,
  rightPanelContent: PropTypes.node,
  showExportBtn: PropTypes.bool,
  showFullscreenBtn: PropTypes.bool,
  title: PropTypes.node,
};

export default AreaHeaderComponent;

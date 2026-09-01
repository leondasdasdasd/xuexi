import React, { PureComponent } from "react";
import iro from "@jaames/iro";
import { Popover } from "antd";

import pickColor from "../../../../assets/color.png";

import icon from "../../../../icon.module.less";
import styles from "./paintBrush.module.less";

const SELECT_COLOR = [
  "#ff0000",
  "#000000",
  "#f6db4d",
  "#72c140",
  "#57bfc1",
  "#3d90f7",
  "#6839c9",
  "#d94494",
  "#5c360e",
  "#e33c39",
  "#595959",
  "#ffffff",
]; //画笔颜色

class PaintBrush extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      pickerVisible: {},
    };
    this.pickerColorEle = null;
  }

  //改变picker状态
  changePickerVisible = (type, visible) => {
    let pickerType = {};
    pickerType[type] = visible;
    this.setState(
      {
        pickerVisible: pickerType,
      },
      () => {
        if (visible) {
          const { watchToolOperation } = this.props;
          setTimeout(() => {
            let pickerColorEle = this.pickerColorEle;
            if (pickerColorEle) {
              pickerColorEle.innerHTML = "";
              let colorBox = new iro.default.ColorPicker(pickerColorEle, {
                width: 100,
                color: "#ff0000",
                borderWidth: 1,
                borderColor: "#fff",
              });
              colorBox.on("color:change", function (color) {
                watchToolOperation(color.hexString, "color", true);
              });
            }
          }, 500);
        }
      },
    );
  };

  render() {
    const { pencilColor, pencilPicker, pencilThickness, watchToolOperation } =
      this.props;
    const { pickerVisible } = this.state;
    return (
      <div className={styles.brushTool}>
        {SELECT_COLOR.map((item, index) => (
          <span
            className={
              pencilColor == item && pencilPicker === false
                ? `${styles.colorBox} ${styles.selectBox}`
                : styles.colorBox
            }
            key={index}
            style={{ background: item }}
            onClick={() => watchToolOperation(item, "color", false)}
          >
            {pencilColor == item ? (
              <i className={`${icon.iconfont} ${styles.selected}`}>&#xe6b1;</i>
            ) : null}
          </span>
        ))}
        <Popover
          content={
            <div style={{ width: "100px", minHeight: "140px" }}>
              <div ref={(node) => (this.pickerColorEle = node)} />
            </div>
          }
          title={null}
          overlayClassName={styles.pickerColor}
          trigger="click"
          visible={pickerVisible["pencil"] || false}
          onVisibleChange={(visible) =>
            this.changePickerVisible("pencil", visible)
          }
        >
          <span
            className={
              pencilPicker === true
                ? `${styles.colorBox} ${styles.pickerBox} ${styles.selectBox}`
                : `${styles.colorBox} ${styles.pickerBox}`
            }
            style={{ backgroundImage: `url(${pickColor})` }}
          >
            {pencilPicker === true ? (
              <i className={`${icon.iconfont} ${styles.selected}`}>&#xe6b1;</i>
            ) : null}
          </span>
        </Popover>
        <em className={styles.dividerLine} />
        <i
          className={`${icon.iconfont} ${styles.penThick}`}
          style={{ color: pencilThickness == 1 ? pencilColor : "#575757" }}
          onClick={() => watchToolOperation(1, "thickness")}
        >
          &#xe878;
        </i>
        <i
          className={`${icon.iconfont} ${styles.penThick}`}
          style={{ color: pencilThickness == 2 ? pencilColor : "#575757" }}
          onClick={() => watchToolOperation(2, "thickness")}
        >
          &#xe87e;
        </i>
        <i
          className={`${icon.iconfont} ${styles.penThick}`}
          style={{ color: pencilThickness == 3 ? pencilColor : "#575757" }}
          onClick={() => watchToolOperation(3, "thickness")}
        >
          &#xe881;
        </i>
        <i
          className={`${icon.iconfont} ${styles.penThick}`}
          style={{ color: pencilThickness == 5 ? pencilColor : "#575757" }}
          onClick={() => watchToolOperation(5, "thickness")}
        >
          &#xe882;
        </i>
        <i
          className={`${icon.iconfont} ${styles.penThick}`}
          style={{ color: pencilThickness == 7 ? pencilColor : "#575757" }}
          onClick={() => watchToolOperation(7, "thickness")}
        >
          &#xe87f;
        </i>
      </div>
    );
  }
}

export default PaintBrush;

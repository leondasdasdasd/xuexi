import React, { PureComponent } from "react";

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

class ColorSelector extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      pickerVisible: {},
    };
  }

  render() {
    const { selectedColor, onChange } = this.props;
    return (
      <div className={styles.brushTool}>
        {SELECT_COLOR.map((item, index) => (
          <span
            className={
              selectedColor == item
                ? `${styles.colorBox} ${styles.selectBox}`
                : styles.colorBox
            }
            key={index}
            style={{ background: item }}
            onClick={() => onChange(item)}
          >
            {selectedColor == item ? (
              <i className={`${icon.iconfont} ${styles.selected}`}>&#xe6b1;</i>
            ) : null}
          </span>
        ))}
      </div>
    );
  }
}

export default ColorSelector;

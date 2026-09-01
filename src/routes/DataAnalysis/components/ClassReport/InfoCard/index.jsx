import React, { PureComponent } from "react";

import styles from "./index.module.less";
class InfoCard extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  render() {
    const { dataList = [] } = this.props;
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "17px",
        }}
      >
        {dataList.map((item) => {
          return (
            <div
              style={{ marginRight: "40px" }}
              className={styles.name_group}
              key={item.name}
            >
              {item.name}： {item.value}
            </div>
          );
        })}
      </div>
    );
  }
}
export default InfoCard;

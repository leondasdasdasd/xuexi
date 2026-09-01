import React from "react";

import styles from "./index.module.less";

const Toolbar = ({ tools = [], currentTool, onSelect }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        paddingTop: "300px",
      }}
    >
      {tools.map((item) => (
        <div
          key={item.key}
          className={`${styles.toolBoxItem} ${
            currentTool === item.key ? styles.active : ""
          }`}
          onClick={() => onSelect(item.key)}
          style={{
            cursor: "pointer",
            height: "40px",
            width: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {item.icon || item.title}
        </div>
      ))}
    </div>
  );
};

export default Toolbar;

import React, { useRef, useState } from "react";
import { Popover } from "antd";

import styles from "./index.module.less";

const HoverTooltip = ({ text, maxWidth = 200, handelClick }) => {
  const textReference = useRef(null);
  const [isOverflow, setIsOverflow] = useState(false);

  const handleMouseEnter = () => {
    const element = textReference.current;
    if (element) {
      const overflow = element.scrollWidth > element.clientWidth;
      setIsOverflow(overflow);
    }
  };
  const handleMouseLeave = () => {
    const element = textReference.current;
    if (element) {
      setIsOverflow(false);
    }
  };
  const content = (
    <div
      onClick={() => {
        handelClick && handelClick();
      }}
      className={styles.ellipsisContainer}
      ref={textReference}
      style={{ maxWidth }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {text}
    </div>
  );

  return (
    <Popover
      content={text}
      trigger="hover"
      visible={isOverflow} // 仅在溢出时展示
    >
      {content}
    </Popover>
  );
};

export default HoverTooltip;

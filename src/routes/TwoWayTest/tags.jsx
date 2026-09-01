// 类组件
import React from "react";

import deletSvg from "../../assets/delet.svg";

import styles from "./question.less";

class tags extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  componentDidMount() {}

  deletQuality = (item, index) => {
    let ls = JSON.parse(JSON.stringify(this.props.data));
    ls.splice(index, 1);
    if (this.props.onChange) {
      this.props.onChange(ls);
    }
  };
  render() {
    const { labelKey, data } = this.props;
    let temporaryLabe = labelKey || "title";
    return (
      <div className={styles.tagBox}>
        {data?.map((item, index) => (
          <div className={styles.selectTag} key={index}>
            <img
              src={deletSvg}
              onClick={() => {
                this.deletQuality(item, index);
              }}
            />
            {item[temporaryLabe]}
          </div>
        ))}
      </div>
    );
  }
}

export default tags;

//横向菜单
import React, { PureComponent } from "react";
import { Link } from "dva/router";

import styles from "./index.less";

class GlobalNav extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  onChange(key) {
    let { switchNavList } = this.props;
    typeof switchNavList == "function" && switchNavList.call(this, key);
  }

  render() {
    let { navList, cur } = this.props;
    return (
      <div className={styles.navContent}>
        {navList &&
          navList.map((element, key) => (
            <Link
              key={key}
              to={element.path}
              className={key == cur ? styles.cur : ""}
              onClick={this.onChange.bind(this, key)}
            >
              {element.name}
            </Link>
          ))}
      </div>
    );
  }
}

export default GlobalNav;

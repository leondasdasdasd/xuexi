//侧边栏
import React, { PureComponent } from "react";
import DrawerMenu from "rc-drawer";

import SiderMenu from "./SiderMenu";

import "rc-drawer/assets/index.css";

class SiderMenuWrapper extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }
  render() {
    const { onCollapse, collapsed } = this.props;
    return (
      <div>
        <DrawerMenu
          getContainer={null}
          level={null}
          handler={false}
          onHandleClick={() => {
            onCollapse(!collapsed);
          }}
          open={!collapsed}
          onClose={() => {
            onCollapse(true);
          }}
        >
          <SiderMenu {...this.props} />
        </DrawerMenu>
      </div>
    );
  }
}

export default SiderMenuWrapper;

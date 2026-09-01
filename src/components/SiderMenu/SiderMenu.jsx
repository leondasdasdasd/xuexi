import React, { PureComponent } from "react";
import { Layout, Menu } from "antd";
import { connect } from "dva";
import { Link } from "dva/router";

import siderLogo from "../../assets/test-white.png";
import { menuList } from "../../common/menu";
import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

const { Sider } = Layout;
const { SubMenu } = Menu;

@connect((state) => ({}))
class SiderMenu extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  UNSAFE_componentWillMount() {
    const { dispatch } = this.props;
    //wm修改
    dispatch({
      type: "global/havePower",
      payload: {},
    });
    // dispatch({
    //     type: 'global/havePayPower',
    //     payload: {}
    // })
  }

  componentDidMount() {
    let self = this;
    window.onmessage = function (message) {
      if (message.data == "close") {
        self.setState({
          iframeVisible: false,
        });
      } else if (message.data == "reload") {
        self.setState({
          iframeVisible: false,
        });
        window.location.reload();
      }
    };
  }

  handleOpenChange = (openKeys) => {
    const lastOpenKey = openKeys.at(-1);
  };

  render() {
    const { onCollapse } = this.props;
    let menuData = menuList;
    console.log(menuData, "mms");
    return (
      <Sider
        trigger={null}
        collapsible
        breakpoint="lg"
        className={styles.sider}
      >
        <div className={styles.userInfo} key="logo">
          <Link to="/examAnalysis" className={styles.logoTitle}>
            <img src={siderLogo} alt="" />
            <span className={styles.logoTxt}>
              {trans("global.examTest", "题库测验")}
            </span>
          </Link>
          <Link to="/" className={styles.logoTitle}>
            <img src={siderLogo} alt="" />
            <span className={styles.logoTxt}>
              {trans("global.examAnalysis", "题库测验")}
            </span>
          </Link>
        </div>

        <Menu
          key="Menu"
          theme="dark"
          mode="inline"
          className={styles.menu}
          onOpenChange={this.handleOpenChange}
          style={{ padding: "16px 0", width: "100%" }}
        >
          {menuData.map((item) => (
            <Menu.Item className={styles.subMenu} key={item.key}>
              <Link to={item.path} onClick={() => onCollapse(true)}>
                <i className={`${icon.iconfont} ${styles.menuTitle}`}>
                  &#xe6f0;
                </i>
                <span className={styles.menuTitle}>{item.name}</span>
              </Link>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
    );
  }
}

export default SiderMenu;

import "../common/menu";

import React, { PureComponent } from "react";
import { Layout } from "antd";
import { connect } from "dva";
import { Link, Redirect, Route, Switch } from "dva/router";

import GlobalHeader from "components/GlobalHeader";
import SiderMenu from "components/SiderMenu";

import { pageList } from "../common/pageList";
import { trans } from "../utils/i18n";

import styles from "./BasicLayout.module.less";

const { Header, Sider, Content } = Layout;
let redirectData = [
  { path: "/inputQuestion", name: trans("global.inputStem", "录入题目") },
  { path: "/myQuestion", name: trans("global.myQuestion", "我的题库") },
  { path: "/examAnalysis", name: trans("global.examAnalysis", "我的测验") },
  {
    path: "/testPaperManagement",
    name: trans("global.testPaperManagement", "试卷管理"),
  },
  {
    path: "/adaptive-learning",
    name: trans("global.adaptiveLearning", "自适应学习"),
  },
];
@connect((state) => ({
  collapsed: state.global.collapsed,
  currentUser: state.global.currentUser,
}))
class BasicLayout extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  handleMenuCollapse = (collapsed) => {
    const { dispatch } = this.props;
    dispatch({
      type: "global/changeLayoutCollapsed",
      payload: collapsed,
    });
  };

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch({
      type: "global/getCurrentUser",
    }).then(() => {
      //登录失效后的操作
      // if (window.location.search !== '') {
      //     if(window.location.search.indexOf('hash=') > -1) {
      //       let url = window.location.search.split('hash=')[1] || ''
      //       if(url.indexOf('&ticket=') > -1) {
      //         url = url.split('&ticket=')[0]
      //       }
      //       window.location.href = window.location.origin + '/#/' + url;
      //     }else if(window.location.search.indexOf('ifClose=true') > -1) {
      //       window.close();
      //     }else if(window.location.search.indexOf('ifH5=true') > -1) {
      //       const modal = window.top.document.getElementsByClassName('loginModal')[0];
      //       modal.parentNode.parentNode.remove();
      //     }
      //      else {
      //       window.location.href = window.location.origin + '/' + window.location.hash
      //     }
      //   }
    });
    typeof setCustomProperty == "function" && setCustomProperty(pageList);
    window.addEventListener("hashchange", function () {
      //设置全局埋点
      typeof setCustomProperty == "function" && setCustomProperty(pageList);
    });
  }

  render() {
    const { collapsed, currentUser, mainRouterData, isHidden } = this.props;
    console.log(mainRouterData);
    let path = location.hash && location.hash.split("#")[1];
    console.log(redirectData, "rr");
    return (
      <div className={styles.mainPage}>
        <SiderMenu collapsed={collapsed} onCollapse={this.handleMenuCollapse} />
        <GlobalHeader
          currentUser={currentUser || currentPayUser}
          onCollapse={this.handleMenuCollapse}
          collapsed={collapsed}
        />
        {isHidden ? null : (
          <div className={styles.menu}>
            {redirectData.length &&
              redirectData.map((item, index) => {
                let selected = window.location.hash.includes(item.path)
                  ? true
                  : false;
                return (
                  <Link to={item.path} key={index}>
                    <span
                      className={
                        selected ? styles.selectedMenu : styles.menuTitle
                      }
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })}
          </div>
        )}
        <Switch>
          {mainRouterData &&
            mainRouterData.length &&
            mainRouterData.map(({ path, name, component }) => {
              return (
                <Route path={path} key={name} exact component={component} />
              );
            })}
          <Route path="/" render={() => <Redirect to="examAnalysis" />} />
        </Switch>
      </div>
    );
  }
}

export default BasicLayout;

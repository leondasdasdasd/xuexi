import React from "react";
import { ConfigProvider } from "antd";
import enUS from "antd/lib/locale-provider/en_US";
import zhCN from "antd/lib/locale-provider/zh_CN";
import { Route, routerRedux, Switch } from "dva/router";
import PropTypes from "prop-types";

import LocalQuickNavigation from "components/LocalQuickNavigation";
import { isAdaptiveLearningPath } from "components/LocalQuickNavigation/routeVisibility";

import { getRouterData } from "./common/routes";
import { locale } from "./utils/i18n";

const { ConnectedRouter } = routerRedux;

/**
 *
 * @param routerData
 * @param mainRouter
 */
function getSubRouter(routerData, mainRouter) {
  for (let index = 0; index < routerData.length; index++) {
    for (const element of mainRouter) {
      if (routerData[index]["path"] === element["path"]) {
        routerData.splice(index, 1);
      }
    }
  }
  return routerData;
}

/**
 *
 * @param root0
 * @param root0.history
 * @param root0.app
 */
function RouterConfig({ history, app }) {
  const routerData = getRouterData(app);
  let layoutObject = routerData.find((item) => item.path == "/");
  let BasicLayout = layoutObject["component"];
  let mainRouterData = routerData.filter((item) => item.mainPage);
  let isHidden = routerData.filter((item) => item.isHidden);
  // console.log(routerData);
  let subRouterData = getSubRouter(routerData, mainRouterData);
  return (
    <ConfigProvider locale={locale() == "en" ? enUS : zhCN}>
      <ConnectedRouter history={history}>
        <>
          <Route
            render={({ location }) =>
              import.meta.env.DEV &&
              !isAdaptiveLearningPath(location.pathname) ? (
                <LocalQuickNavigation />
              ) : null
            }
          />
          {/* <Switch>
          {
            routerData.map(({ path, name, component }) => {
              return <Route path={path} key={name} exact component={component} />
            })
          }
          <Route path="/" render={() => <Redirect to="examAnalysis" />} />
        </Switch> */}
          <Switch>
            {subRouterData.map(({ path, component, exact = true }) => {
              return (
                <Route
                  path={path}
                  key={path}
                  exact={exact}
                  component={component}
                />
              );
            })}
            <Route
              render={(properties) => {
                return (
                  <BasicLayout
                    {...properties}
                    mainRouterData={mainRouterData}
                    isHidden={isHidden}
                  />
                );
              }}
            />
          </Switch>
        </>
      </ConnectedRouter>
    </ConfigProvider>
  );
}

RouterConfig.propTypes = {
  app: PropTypes.shape({
    _models: PropTypes.arrayOf(
      PropTypes.shape({ namespace: PropTypes.string.isRequired }),
    ).isRequired,
  }).isRequired,
  history: PropTypes.shape({
    listen: PropTypes.func.isRequired,
    location: PropTypes.shape({ pathname: PropTypes.string.isRequired })
      .isRequired,
    push: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }).isRequired,
};

export default RouterConfig;

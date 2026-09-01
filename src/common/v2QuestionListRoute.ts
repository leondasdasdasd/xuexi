/** V2 题目列表的唯一公开路由契约，供路由注册和页面跳转共享。 */
export const V2_QUESTION_LIST_ROUTE = {
  name: "V2QuestionList",
  path: "/V2QuestionList",
} as const;

/**
 * 将 V2 题目列表页面注册到公开路由契约。
 * @param {Component} component 动态加载后的 V2 题目列表页面组件
 * @returns {{name: string, path: string, mainPage: boolean, component: Component}} 路由配置
 */
export const createV2QuestionListRoute = <Component>(component: Component) => ({
  ...V2_QUESTION_LIST_ROUTE,
  mainPage: true,
  component,
});

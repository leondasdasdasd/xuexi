/**
 * 自适应学习页面以参考前端为视觉基准，不叠加测验项目的本地调试入口。
 * @param {string} pathname 当前路由路径
 * @returns {boolean} 是否属于自适应学习路由
 */
export const isAdaptiveLearningPath = (pathname) =>
  String(pathname || "").startsWith("/adaptive-learning");

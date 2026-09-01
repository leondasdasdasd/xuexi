export default {
  extends: ["stylelint-config-standard-less"],
  customSyntax: "postcss-less",
  rules: {
    // 当前 Less 构建链路不支持 CSS Media Queries Level 4 的范围写法。
    "media-feature-range-notation": "prefix",
    // 避免 --fix 把历史颜色写法批量改成现代语法，降低旧页面视觉和兼容性回归风险。
    "color-function-notation": "legacy",
    "alpha-value-notation": "number",
    "color-hex-length": null,
  },
};

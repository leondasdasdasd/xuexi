import { trans } from "../utils/i18n";

export const menuList = [
  {
    name: trans("global.examTest", "题库测验"),
    key: "inputQuestion",
    path: "/inputQuestion",
    children: [],
  },
  {
    name: trans("newDom.title", "新页面"),
    key: "newPage",
    path: "/newPage",
    children: [],
  },
];

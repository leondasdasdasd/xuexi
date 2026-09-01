import dva from "dva";

import router from "./router";
import { trans } from "./utils/i18n";

import "antd/dist/antd.less";
import "antd-mobile/dist/antd-mobile.less";
import "../node_modules/@yungu-fed/question-editor/dist/index.css";
import "./index.css";
import "./index.less";

// 1. Initialize
const app = dva();
// const app = dva({
//     history: browserHistory(),
//   });
// 2. Plugins
// app.use({});

// 3. Model
// app.model(require('./models/example').default);

// 4. Router
app.router(router);

// 5. Start
app.start("#root");

document.title = trans("global.examTest", "题库测验");

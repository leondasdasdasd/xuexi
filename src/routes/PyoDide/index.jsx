//新闻
import React, { PureComponent } from "react";
import { Input, Select } from "antd";
import { connect } from "dva";

import styles from "./index.module.less";
const { Option } = Select;
const { TextArea } = Input;
let sortList = {
  1: "STUDENT_NO",
  2: "STUDENT_NAME",
  3: "STUDENT_E_NAME",
  4: "SCORE",
  5: "SCORE",
};
class Home extends PureComponent {
  constructor(properties) {
    super(properties);

    this.state = {
      value: "",
      turtle: "",
    };
    this.prodide = null;
  }
  componentDidMount() {
    this.main();
  }
  async main() {
    console.log(111);
    const output = document.querySelector("#output");
    // this.pyodide = await loadPyodide();
    let pyodide = await loadPyodide();
    output.innerHTML += "Ready!\n";
    console.log(pyodide, "pp");
    return pyodide;
  }
  changeValue = (e) => {
    this.setState({
      value: e.target.value,
    });
  };
  changeTurtle = (e) => {
    this.setState({
      turtle: e.target.value,
    });
  };
  enter = (e) => {
    this.evaluatePython();
  };
  async evaluatePython() {
    let pyodide = await this.main();
    const input = document.querySelector("#input");
    console.log(pyodide, this.pyodide, "11");
    try {
      const value = this.state.value;
      // console.log(this.state.value, 'vv')
      // let a = pyodide.runPython('print(1+3)')
      // console.log(a, 'vv1')
      // let output = pyodide.runPython(this.state.value);
      // const sc =  document.createElement('script')
      // sc.innerHTML = value;
      // sc.type = 'text/javascript';
      //   console.log(sc, 'ss')
      // // 插入到DOM中
      //   document.body.appendChild(sc);
      //   // console.log(value, a, a(), 'v2')
      await pyodide.loadPackage(
        "./turtle/dist/turtle-0.0.1-py2.py3-none-any.whl",
      );
      await pyodide.loadPackagesFromImports(input.value);
      let output = await pyodide.runPython(input.value);
      console.log(output, "hhb");
      this.addToOutput(output);
    } catch (error) {
      this.addToOutput(error);
    }
  }
  addToOutput = (value) => {
    console.log(value, "oo");
    const output = document.querySelector("#output");
    output.innerHTML = value;
  };
  render() {
    const { testList, subjectList, stageList, gradeList } = this.props;
    const { IconFont, viewData, exampleId, testName } = this.state;
    return (
      <div className={styles.testContent}>
        <TextArea
          id="input"
          autoSize={true}
          value={this.state.turtle}
          onChange={this.changeTurtle}
        />
        <TextArea
          autoSize={true}
          value={this.state.value}
          onPressEnter={this.enter}
          onChange={this.changeValue}
        />
        <div id="output"></div>
      </div>
    );
  }
}

export default connect(({ home, global }) => ({
  testList: home.testList,
  typeValue: home.typeValue,
  courseValue: home.courseValue,
  statusValue: home.statusValue,
  stageList: global.stageList,
  gradeList: global.gradeList,
  subjectList: global.subjectList,
}))(Home);
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};

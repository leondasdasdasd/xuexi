//新闻
import React, { Fragment, PureComponent } from "react";
import { connect } from "dva";

import "./index.less";

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

    this.state = {};
  }
  componentDidMount() {}
  ondragstart(event_) {
    let t = event_.target;
    //ev.dataTransfer.setDragImage(t, t.offsetLeft, t.offsetTop);
    event_.dataTransfer.setData("text", t.id);
  }
  ondragover(event_) {
    event_.preventDefault();
  }

  ondragenter(event_) {
    let t = event_.target;
    t.style.opacity = 0.3;
    t.style.backgroundColor = "#333";
  }

  ondragleave(event_) {
    let t = event_.target;
    t.style.opacity = 1;
    t.style.backgroundColor = "#fff";
  }

  ondrop = (event_) => {
    console.log(event_);
    let d = event_.dataTransfer.getData("text"),
      target = event_.target,
      targetId = event_.target.id;
    console.log(event_, target, targetId);

    target.style.opacity = 1;
    target.style.backgroundColor = "#fff";
    //  d != targetId && setTimeout(() => {
    //    typeof this.props.dropChange == 'function'
    //      && this.props.dropChange(d, targetId);
    //  }, 0);
  };

  render() {
    return <Fragment></Fragment>;
  }
}

export default connect(({ home, studyPictures }) => ({
  allScore: home.allScore,
  evaluationList: home.evaluationList,
  baseAllData: home.baseAllData,
  subject: studyPictures.subject,
  baseAllStudents: studyPictures.baseAllStudents,
  termList: home.termList,
  tableClass: home.tableClass,
  scoreStandard: home.scoreStandard,
  termStandard: home.termStandard,
  achievementList: home.achievementList,
  selectedKeys: home.selectedKeys,
  openKeys: home.openKeys,
  typeObj: home.typeObj,
  semester: home.semester,
  total: home.total,
  semesterList: home.semesterList,
  chart: home.chart,
  source: home.source,
  sourceData: home.sourceData,
  group: home.group,
  statisticalSource: home.statisticalSource,
  updateAchievementSource: home.updateAchievementSource,
  isCalculating: home.isCalculating,
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

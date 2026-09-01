import React, { PureComponent } from "react";
import { connect } from "dva";

import { menuList } from "../../common/menu";
import { trans } from "../../utils/i18n";
class GlobalHeader extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      cur: 2,
    };
  }
  componentDidMount() {
    // this.props.dispatch({
    //   type: "home/getCount",
    // });
    // this.props.dispatch({
    //   type: "home/getBasketList",
    // });
    console.log(window.location.hash, "1112");
    if (window.location.hash.includes("examAnalysis")) {
      this.setState({
        cur: 2,
      });
    } else if (
      window.location.hash.includes("myQuestion") ||
      window.location.hash.includes("inputQuestion")
    ) {
      this.setState({
        cur: 0,
      });
    } else if (window.location.hash.includes("scoreSummary")) {
      this.setState({
        cur: 3,
      });
    } else if (window.location.hash.includes("testPaperManagement")) {
      this.setState({
        cur: 1,
      });
    }
  }
  openTree = () => {
    window.open(`${window.location.origin}/api/knowledge/index`);
  };
  toggle = () => {
    const { onCollapse, collapsed } = this.props;
    onCollapse(!collapsed);
    this.triggerResizeEvent();
  };

  triggerResizeEvent() {
    const event = document.createEvent("HTMLEvents");
    event.initEvent("resize", true, false);
    window.dispatchEvent(event);
    ("");
  }

  getTitle() {
    let path = window.location.hash && window.location.hash.split("#")[1];
    let array = menuList;
    let pageTitle;
    for (const element of array) {
      if (path == element.path) {
        pageTitle = element.name;
        break;
      }
    }
    if (path == "/") {
      pageTitle = "题库测验";
    }
    return pageTitle;
  }

  switchNavList = (key) => {
    this.setState({
      cur: key,
    });
  };

  render() {
    const { currentUser, basketList, basketSubjectId } = this.props;
    const { cur } = this.state;
    const pageTitle = this.getTitle();
    let navList = currentUser.reviewExamAnalysisPower
      ? [
          {
            name: trans("global.questionSource", "题目资源"),
            id: 0,
            path: "/myQuestion",
          },
          {
            name: trans("global.testPaperManagement", "试卷管理"),
            id: 1,
            path: "/testPaperManagement/2",
          },
          {
            name: trans("global.testReport", "测验报告"),
            id: 2,
            path: "/examAnalysis",
          },
          {
            name: trans("global.scoreSummary", "成绩汇总"),
            id: 3,
            path: "/scoreSummary",
          },
        ]
      : [
          {
            name: trans("global.questionSource", "题目资源"),
            id: 0,
            path: "/myQuestion",
          },
          {
            name: trans("global.testPaperManagement", "试卷管理"),
            id: 1,
            path: "/testPaperManagement/2",
          },
          {
            name: trans("global.testReport", "测验报告"),
            id: 2,
            path: "/examAnalysis",
          },
        ];
    return (
      // <div className={styles.header} id="header">
      //   {/* <i className={`${icon.iconfont} ${styles.triggerIcon}`} onClick={this.toggle}>&#xe908;</i> */}
      //   <i className={`${icon.iconfont} ${styles.triggerIcon}`}>&#xe908;</i>
      //   <div className={styles.headerTitle}>
      //     <img src={logo} />
      //     <span className={styles.titleTxt}>
      //       {trans("global.examTest", "题库测验")}
      //     </span>
      //     {/* <span className={styles.titleTxt}>{pageTitle}</span> */}
      //   </div>
      //   <div className={styles.right}>
      //     <div className={styles.globalNav}>
      //       <div className={styles.navContent}>
      //         {navList &&
      //           navList.map((el) => (
      //             <Link
      //               key={el.id}
      //               to={el.path}
      //               className={el.id == cur ? styles.cur : ""}
      //               onClick={() => this.switchNavList(el.id)}
      //             >
      //               {el.name}
      //             </Link>
      //           ))}
      //       </div>
      //     </div>
      //     {IsKnowledgeWhite ? (
      //       <div className={styles.treeHeader}>
      //         <Button onClick={this.openTree} type="primary">
      //           知识点
      //         </Button>
      //       </div>
      //     ) : null}
      //     <div className={styles.utilContent} id="utilContent">
      //       <Popover
      //         content={
      //           <Basket
      //             count={this.props.count}
      //             dispatch={this.props.dispatch}
      //             basketList={basketList}
      //             basketSubjectId={basketSubjectId}
      //           />
      //         }
      //         title={null}
      //         trigger="click"
      //         getPopupContainer={() => document.getElementById("utilContent")}
      //       >
      //         <div className={styles.buyCar}>
      //           <Badge count={this.props.count} showZero={true}>
      //             <Tooltip
      //               placement="top"
      //               title={trans("global.basketName", "试题篮")}
      //               trigger={"hover"}
      //             >
      //               <i className={`${icon.iconfont} ${styles.buyCarIcon}`}>
      //                 &#xe73c;
      //               </i>
      //             </Tooltip>
      //           </Badge>
      //         </div>
      //       </Popover>
      //       <GlobalUtil currentUser={currentUser} />
      //     </div>
      //   </div>
      // </div>
      <div></div>
    );
  }
}
export default connect(({ home }) => ({
  // count: home.count,
  // basketList: home.basketList,
  // basketSubjectId: home.basketSubjectId,
}))(GlobalHeader);

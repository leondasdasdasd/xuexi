// 类组件
import React from "react";
import { message, Pagination, Skeleton } from "antd";
import { connect } from "dva";

import noDataImg from "../../assets/noData.png";
import RevisedList from "../../components/RevisedList/index";
import { correctionProcessList } from "../../services/correctionProcess";
import { trans } from "../../utils/i18n";

import styles from "./aboutToArrive.module.less";

class AboutToArrive extends React.Component {
  constructor(properties) {
    super(properties);
    const { testId } = properties.match.params;
    this.state = {
      correctionProcessData: {},
      pageNo: 1,
      pageSize: 10,
      loading: false,
    };
    this.testId = testId;
  }

  componentDidMount() {
    this.getPage();
  }
  getPage = () => {
    this.setState({
      loading: true,
    });
    correctionProcessList({
      limit: this.state.pageSize,
      pageNo: this.state.pageNo,
    }).then((res) => {
      this.setState({
        loading: false,
      });
      if (res.status) {
        this.setState({
          correctionProcessData: res.content,
        });
      } else {
        message.error(res.message);
      }
    });
  };
  back = () => {
    window.close();
  };
  //调整页数
  switchPageSize = (current, size) => {
    this.setState(
      {
        pageNo: 1,
        pageSize: size,
      },
      () => {
        this.getPage();
      },
    );
  };

  //切换分页
  changePageSize = (page, size) => {
    this.setState(
      {
        pageNo: page,
        pageSize: size,
      },
      () => {
        this.getPage();
      },
    );
  };
  render() {
    const { correctionProcessData } = this.state;
    const { correctionList, totalNum } = correctionProcessData || {};
    return (
      <div className={styles.aboutToArrive}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <i
              className={[styles.iconfont, styles.closeIcon].join(" ")}
              onClick={this.back}
            >
              &#xe76d;
            </i>
            {trans("revisedHome.aboutToArriveTitle", "可能到达的订正申请")}
          </div>
        </div>
        <div
          style={{
            width: "90%",
            height: "calc(100% - 70px)",
            margin: "0 auto",
          }}
        >
          <Skeleton active loading={this.state.loading}>
            {totalNum ? (
              <div className={styles.revisedMapList}>
                {correctionList
                  ? correctionList.map((item, index) => (
                      <RevisedList
                        info={item}
                        key={index}
                        hasBorder={
                          index === correctionList.length - 1 ? false : true
                        }
                      />
                    ))
                  : null}
              </div>
            ) : (
              <div className={styles.emptyContent}>
                <img src={noDataImg} alt="" />
                <div>{trans("global.noData", "当前查询暂无数据")}</div>
              </div>
            )}
            {totalNum ? (
              <div className={styles.showPage}>
                <Pagination
                  total={totalNum || 0}
                  showSizeChanger
                  onChange={this.changePageSize}
                  onShowSizeChange={this.switchPageSize}
                  current={this.state.pageNo}
                  pageSize={this.state.pageSize}
                  hideOnSinglePage={false}
                />
              </div>
            ) : null}
          </Skeleton>
        </div>
      </div>
    );
  }
}

export default connect(() => ({}))(AboutToArrive);

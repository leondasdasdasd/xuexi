import React, { PureComponent } from "react";
import { message } from "antd";
import { connect } from "dva";
import MultiCrops from "react-multi-crops";

import Draw from "../../components/Mark/draw";
import MarkAnswer from "../../components/Mark/markAnswer";
import MarkScore from "../../components/Mark/markScore";
import Structure from "../../components/Mark/structure";
import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

let timer = null;
const tabList = [
  // '打标类型',
  trans("testMouse.questionStructure", "题目结构"),
  trans("testMouse.drawBox", "画框"),
  trans("global.score", "分数"),
  trans("global.answer", "答案"),
  // '知识点',
  trans("testMouse.upload", "上传"),
];

class ViewChart extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      list: [],
      tabIndex: 0,
      drawIndex: 0,
      deleteIndex: 0,
      checkIndex: 0,
      coordinates: [],
      questionList: [],
      ifKuang: false,
      ifStu: false,
      ifCheck: false,
      studentCodeAreaList: [],
      markValue: 2, //打标类型
    };
  }

  componentDidMount() {
    const {
      dispatch,
      match: { params },
    } = this.props;
    const that = this;
    this.props
      .dispatch({
        type: "home/getPaperIndex",
        payload: {
          paperId: Number.parseInt(params.id, 10),
          version: params.version,
        },
      })
      .then(() => {
        this.props
          .dispatch({
            type: "home/getIndexImg",
            payload: {
              paperId: Number.parseInt(params.id, 10),
              version: params.version,
            },
          })
          .then(() => {
            const { indexImg } = this.props;
            console.log(indexImg, "inin");
            const rate = Math.round((window.innerHeight / 1123) * 100) / 100;
            const widthRate = 794 * rate;
            let newLi = JSON.parse(
              JSON.stringify(
                this.props.paperIndexList.paperIndexDetailModel
                  ?.paperIndexModelList || [],
              ),
            );
            let newStu = JSON.parse(
              JSON.stringify(
                this.props.paperIndexList.paperIndexDetailModel
                  ?.studentCodeAreaList || [],
              ),
            );
            let newCo = [];
            if (indexImg && indexImg.length > 0) {
              indexImg.map((item, index) => {
                let list = [];
                if (newLi && newLi.length > 0) {
                  newLi.map((it) => {
                    if (it.questionDraw && it.questionDraw.length > 0) {
                      it.questionDraw.map((index_) => {
                        if (index_ && index_.page == index + 1) {
                          index_.x =
                            Math.round((index_.x / 210) * widthRate * 1000) /
                            1000;
                          index_.y =
                            Math.round(
                              (index_.y / 297) * window.innerHeight * 1000,
                            ) / 1000;
                          index_.width =
                            Math.round(
                              (index_.width / 210) * widthRate * 1000,
                            ) / 1000;
                          index_.height =
                            Math.round(
                              (index_.height / 297) * window.innerHeight * 1000,
                            ) / 1000;
                          list.push(index_);
                        }
                      });
                    }
                  });
                }
                newCo[index] = list;
              });
            }
            if (newStu && newStu.length > 0) {
              newStu.map((index) => {
                index.x = Math.round((index.x / 210) * widthRate * 1000) / 1000;
                index.y =
                  Math.round((index.y / 297) * window.innerHeight * 1000) /
                  1000;
                index.width =
                  Math.round((index.width / 210) * widthRate * 1000) / 1000;
                index.height =
                  Math.round((index.height / 297) * window.innerHeight * 1000) /
                  1000;
                // list.push(i)
              });
              newCo[newStu[0].page] = newCo[newStu[0].page].concat(newStu);
              this.setState({
                studentCodeAreaList: newStu,
                ifStu: true,
              });
            }
            this.setState({
              list: newLi,
              coordinates: newCo,
            });
          });
      });
    // document.addEventListener('mousedown', function(e) {
    //   console.log(e.clientX, e.clientY, 'ee');
    //   let newLi = that.state.list.length ? JSON.parse(JSON.stringify(that.state.list)) : [];
    //   timer = true;
    //   newLi.push({startX: e.clientX, startY: e.clientY, endX: null, endY: null});
    //   document.addEventListener('mousemove', function(e) {
    //     if(!timer) {
    //       return;
    //     }
    //     console.log(e.clientX, e.clientY, 'ee1');
    //     newLi[newLi.length - 1].endX = e.clientX;
    //     newLi[newLi.length - 1].endY = e.clientY;
    //     that.setState({
    //       list: newLi,
    //     })
    //   });
    // });
    document.addEventListener("mouseup", function (e) {
      that.setState({
        deleteIndex: 0,
      });
    });
  }
  //画框更改触发
  changeCoordinate = (ind, coordinate, index, coordinates) => {
    console.log(ind, coordinate, index, coordinates, "hhb1");
    let newC = JSON.parse(JSON.stringify(coordinate));
    let newIn = ind;
    if (this.state.tabIndex !== 1) {
      return;
    }

    if (this.state.ifCheck && this.state.ifStu) {
      newC.page = newIn;
      let neWcoord = JSON.parse(JSON.stringify(this.state.coordinates));
      neWcoord[ind] = coordinates;
      let domList = document.querySelectorAll(".rmc-number");
      if (domList && domList.length > 0) {
        console.log(domList, "ddh");
        for (const element of domList) {
          let parent = element.parentNode;
          if (newC) {
            let x = `${newC.x}`;
            let y = `${newC.y}`;
            let width = `${newC.width}px`;
            let height = `${newC.height}px`;
            console.log(
              x,
              y,
              width,
              height,
              parent.style.left,
              parent.style.top,
              parent.style.width,
              parent.style.height,
              "hhb>>",
            );
            if (
              Number.parseFloat(Number.parseFloat(x).toFixed(2)) ==
                Number.parseFloat(
                  Number.parseFloat(parent.style.left.split("px")[0]).toFixed(
                    2,
                  ),
                ) &&
              Number.parseFloat(Number.parseFloat(y).toFixed(2)) ==
                Number.parseFloat(
                  Number.parseFloat(parent.style.top.split("px")[0]).toFixed(2),
                ) &&
              width == parent.style.width &&
              height == parent.style.height
            ) {
              const text = trans("testMouse.studentLabel", "学生");
              console.log(text, "hhb>>>");
              element.innerHTML = text;
              element.style.width = "40px";
            }
          }
        }
      }
      this.setState({
        studentCodeAreaList: [newC],
        coordinates: neWcoord,
      });
    } else {
      const { questionList, list, deleteIndex, checkIndex } = this.state;
      let newLi = JSON.parse(JSON.stringify(list));
      let neWcoord = JSON.parse(JSON.stringify(this.state.coordinates));

      if (deleteIndex) {
        console.log("hhbcome");
        //  const l = neWcoord.splice(index, this.state.coordinates.length - index);
        if (
          neWcoord[ind][deleteIndex] &&
          neWcoord[ind][deleteIndex].id !== coordinate.id
        ) {
          neWcoord[ind].splice(deleteIndex, 0, coordinate);
        } else {
          neWcoord[ind][deleteIndex] = coordinate;
        }

        console.log(neWcoord, coordinate, "huhu");
        //  newList = neWcoord.push(coordinate).concat(l);
      } else {
        neWcoord[ind] = coordinates;
      }
      console.log(deleteIndex, index, 1, neWcoord, coordinates, "hhb");
      this.setState(
        {
          coordinates: neWcoord,
        },
        () => {
          // setTimeout(() => {
          const { coordinates } = this.state;
          let number_ = null;
          let domList = document.querySelectorAll(".rmc-number");
          console.log(domList, coordinates, "ddom");
          let text = "";
          let nowInd = 0;
          if (coordinates && coordinates.length > 0) {
            coordinates.map((item) => {
              if (item && item.length > 0) {
                item.map((it) => {
                  if (it.id == coordinate.id) {
                    return;
                  } else {
                    console.log(nowInd, "ddom2");
                    nowInd += 1;
                  }
                });
              }
            });
          }
          if (newLi && newLi.length > 0) {
            number_ = 0;
            console.log(newLi, "<<<0");
            // console.log(nowInd,newLi, 'ddom1')
            newLi.map((item, ind) => {
              if (!item.haveSon && item.questionType !== 1) {
                number_ += 1;
                console.log(number_, nowInd, newLi, deleteIndex, "ddom1");

                if (checkIndex + 1 - deleteIndex == number_) {
                  if (!item.questionDraw) {
                    item.questionDraw = [];
                  }

                  item.questionDraw[0] = coordinate;
                  item.questionDraw[0].page = newIn + 1;
                }
                if (item.ifTwoPage) {
                  number_ += 1;

                  if (checkIndex + 1 - deleteIndex == number_) {
                    console.log("<<<2");
                    // if(!item.isSon) {
                    // text = `${item.questionNo}`;
                    // } else {
                    // text = `${item.parentQuestionNo}.${item.sonQuestionNo}`;
                    // }
                    // if(!item.page) {
                    //   item.page = [];
                    // }
                    if (!item.questionDraw) {
                      item.questionDraw = [];
                    }
                    // item.page[1] = newIn + 1;
                    item.questionDraw[1] = coordinate;
                    item.questionDraw[1].page = newIn + 1;
                    // if(domList[nowInd]) {
                    //   domList[nowInd].innerHTML = text;
                    // }
                  }
                }
              }
            });
            if (domList && domList.length > 0) {
              console.log(domList, "ddh");
              console.log(newLi, checkIndex, "1111");
              for (const element of domList) {
                let parent = element.parentNode;

                newLi.map((it, ind) => {
                  if (it.questionDraw && it.questionDraw.length > 0) {
                    it.questionDraw.map((iit) => {
                      if (iit) {
                        let x = `${iit.x}`;
                        let y = `${iit.y}`;
                        let width = `${iit.width}px`;
                        let height = `${iit.height}px`;
                        console.log(
                          x,
                          y,
                          width,
                          height,
                          parent.style.left,
                          parent.style.top,
                          parent.style.width,
                          parent.style.height,
                          "hhb>>",
                        );
                        if (
                          Number.parseFloat(Number.parseFloat(x).toFixed(2)) ==
                            Number.parseFloat(
                              Number.parseFloat(
                                parent.style.left.split("px")[0],
                              ).toFixed(2),
                            ) &&
                          Number.parseFloat(Number.parseFloat(y).toFixed(2)) ==
                            Number.parseFloat(
                              Number.parseFloat(
                                parent.style.top.split("px")[0],
                              ).toFixed(2),
                            ) &&
                          width == parent.style.width &&
                          height == parent.style.height
                        ) {
                          text = it.isSon
                            ? `${it.parentQuestionNo}.${it.sonQuestionNo}`
                            : `${it.questionNo}`;
                          console.log(text, "hhb>>>");
                          element.innerHTML = text;
                        }
                      }
                    });
                  }
                });
              }
            }
          }

          this.setState({
            list: newLi,
            // checkIndex: this.state.checkIndex + 1 > num ? num : this.state.checkIndex + 1,
          });
          this.delay(number_);
          console.log(newLi, number_, "newL");
          // }, 500)
        },
      );
    }
  };
  delay = (number_) => {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      this.setState({
        checkIndex:
          this.state.checkIndex + 1 > number_
            ? number_
            : this.state.checkIndex + 1,
      });
      timer = null;
    }, 500);
  };
  //删除画框
  deleteCoordinate = (ind, coordinate, index, coordinates) => {
    console.log(coordinate, index, coordinates);
    if (this.state.tabIndex !== 1) {
      return;
    }
    const { questionList, list } = this.state;
    let neWcoord = JSON.parse(JSON.stringify(this.state.coordinates));

    let newLi = JSON.parse(JSON.stringify(list));
    newLi.map((item, ind) => {
      if (item.questionDraw && item.questionDraw.length > 0) {
        item.questionDraw.map((it, ii) => {
          if (it && it.id == coordinate.id) {
            newLi[ind].questionDraw[ii] = null;
          }
        });
      }
    });
    neWcoord.map((item) => {
      if (item && item.length > 0) {
        item.map((it, index) => {
          if (it.id == coordinate.id) {
            item.splice(index, 1);
          }
        });
      }
    });
    console.log(coordinate, coordinates, neWcoord, newLi, "newLL");
    neWcoord[ind] = coordinates;
    this.setState({
      coordinates: neWcoord,
      list: newLi,
      deleteIndex: index,
    });
  };
  changeKuang = () => {
    this.setState({
      ifKuang: !this.state.ifKuang,
    });
  };
  changeType = (index, value) => {
    const { questionList } = this.state;
    let newLi = JSON.parse(JSON.stringify(questionList));
    newLi[index].type = value;
    this.setState({
      questionList: newLi,
    });
  };
  changeScore = (index, e) => {
    const { questionList } = this.state;
    let newLi = JSON.parse(JSON.stringify(questionList));
    newLi[index].score = e.target.value;
    this.setState({
      questionList: newLi,
    });
  };
  // 上一步
  prev = () => {
    this.setState(
      {
        tabIndex: this.state.tabIndex === 0 ? 0 : this.state.tabIndex - 1,
      },
      () => {
        let newLi = JSON.parse(JSON.stringify(this.state.list));
        let newStu = JSON.parse(JSON.stringify(this.state.studentCodeAreaList));
        let domList = document.querySelectorAll(".rmc-number");
        console.log(domList, newLi, "ddh");
        if (domList && domList.length > 0) {
          console.log(newLi, "1111");
          for (const element of domList) {
            let parent = element.parentNode;

            newLi.map((it, ind) => {
              if (it.questionDraw && it.questionDraw.length > 0) {
                it.questionDraw.map((iit) => {
                  let text = "";
                  if (iit) {
                    let x = `${iit.x}`;
                    let y = `${iit.y}`;
                    let width = `${iit.width}px`;
                    let height = `${iit.height}px`;
                    console.log(
                      x,
                      y,
                      width,
                      height,
                      x.includes(parent.style.left.split("px")[0]),
                      parent.style.left,
                      parent.style.top,
                      parent.style.width,
                      parent.style.height,
                      "hhb>>",
                    );
                    if (
                      Number.parseFloat(Number.parseFloat(x).toFixed(2)) ==
                        Number.parseFloat(
                          Number.parseFloat(
                            parent.style.left.split("px")[0],
                          ).toFixed(2),
                        ) &&
                      Number.parseFloat(Number.parseFloat(y).toFixed(2)) ==
                        Number.parseFloat(
                          Number.parseFloat(
                            parent.style.top.split("px")[0],
                          ).toFixed(2),
                        ) &&
                      width == parent.style.width &&
                      height == parent.style.height
                    ) {
                      text = it.isSon
                        ? `${it.parentQuestionNo}.${it.sonQuestionNo}`
                        : `${it.questionNo}`;
                      console.log(text, "hhb>>>");
                      element.innerHTML = text;
                    }
                  }
                });
              }
            });
            newStu.length &&
              newStu.map((iit) => {
                if (iit) {
                  let x = `${iit.x}`;
                  let y = `${iit.y}`;
                  let width = `${iit.width}px`;
                  let height = `${iit.height}px`;
                  console.log(
                    x,
                    y,
                    width,
                    height,
                    x.includes(parent.style.left.split("px")[0]),
                    parent.style.left,
                    parent.style.top,
                    parent.style.width,
                    parent.style.height,
                    "hhb>>",
                  );
                  if (
                    Number.parseFloat(Number.parseFloat(x).toFixed(2)) ==
                      Number.parseFloat(
                        Number.parseFloat(
                          parent.style.left.split("px")[0],
                        ).toFixed(2),
                      ) &&
                    Number.parseFloat(Number.parseFloat(y).toFixed(2)) ==
                      Number.parseFloat(
                        Number.parseFloat(
                          parent.style.top.split("px")[0],
                        ).toFixed(2),
                      ) &&
                    width == parent.style.width &&
                    height == parent.style.height
                  ) {
                    const text = trans("testMouse.studentLabel", "学生");
                    console.log(text, "hhb>>>");
                    element.innerHTML = text;
                    element.style.width = "40px";
                  }
                }
              });
          }
        }
      },
    );
  };
  // 下一步
  next = () => {
    let ifOk = true;

    const { list, coordinates, ifKuang, questionList, tabIndex, markValue } =
      this.state;
    switch (this.state.tabIndex) {
      case 0: {
        if (!markValue) {
          ifOk = false;
          message.error(trans("testMouse.chooseMarkType", "请选择打标类型"));
        }
        break;
      }
      case 1: {
        if (!list || list.length === 0) {
          ifOk = false;
          message.error(
            trans("testMouse.setupQuestionStructure", "请设置题目结构"),
          );
        }

        break;
      }
    }
    if (!ifOk) {
      return;
    }
    this.setState(
      {
        tabIndex:
          this.state.tabIndex === tabList.length - 1
            ? tabList.length - 1
            : this.state.tabIndex + 1,
      },
      () => {
        let newLi = JSON.parse(JSON.stringify(this.state.list));
        let newStu = JSON.parse(JSON.stringify(this.state.studentCodeAreaList));
        let domList = document.querySelectorAll(".rmc-number");
        console.log(domList, newLi, "ddh");
        if (domList && domList.length > 0) {
          console.log(newLi, "1111");
          for (const element of domList) {
            let parent = element.parentNode;

            newLi.map((it, ind) => {
              if (it.questionDraw && it.questionDraw.length > 0) {
                it.questionDraw.map((iit) => {
                  let text = "";
                  if (iit) {
                    let x = `${iit.x}`;
                    let y = `${iit.y}`;
                    let width = `${iit.width}px`;
                    let height = `${iit.height}px`;
                    console.log(
                      x,
                      y,
                      width,
                      height,
                      x.includes(parent.style.left.split("px")[0]),
                      parent.style.left,
                      parent.style.top,
                      parent.style.width,
                      parent.style.height,
                      "hhb>>",
                    );
                    if (
                      Number.parseFloat(Number.parseFloat(x).toFixed(2)) ==
                        Number.parseFloat(
                          Number.parseFloat(
                            parent.style.left.split("px")[0],
                          ).toFixed(2),
                        ) &&
                      Number.parseFloat(Number.parseFloat(y).toFixed(2)) ==
                        Number.parseFloat(
                          Number.parseFloat(
                            parent.style.top.split("px")[0],
                          ).toFixed(2),
                        ) &&
                      width == parent.style.width &&
                      height == parent.style.height
                    ) {
                      text = it.isSon
                        ? `${it.parentQuestionNo}.${it.sonQuestionNo}`
                        : `${it.questionNo}`;
                      console.log(text, "hhb>>>");
                      element.innerHTML = text;
                    }
                  }
                });
              }
            });
            newStu.length &&
              newStu.map((iit) => {
                if (iit) {
                  let x = `${iit.x}`;
                  let y = `${iit.y}`;
                  let width = `${iit.width}px`;
                  let height = `${iit.height}px`;
                  console.log(
                    x,
                    y,
                    width,
                    height,
                    x.includes(parent.style.left.split("px")[0]),
                    parent.style.left,
                    parent.style.top,
                    parent.style.width,
                    parent.style.height,
                    "hhb>>",
                  );
                  if (
                    Number.parseFloat(Number.parseFloat(x).toFixed(2)) ==
                      Number.parseFloat(
                        Number.parseFloat(
                          parent.style.left.split("px")[0],
                        ).toFixed(2),
                      ) &&
                    Number.parseFloat(Number.parseFloat(y).toFixed(2)) ==
                      Number.parseFloat(
                        Number.parseFloat(
                          parent.style.top.split("px")[0],
                        ).toFixed(2),
                      ) &&
                    width == parent.style.width &&
                    height == parent.style.height
                  ) {
                    const text = trans("testMouse.studentLabel", "学生");
                    console.log(text, "hhb>>>");
                    element.innerHTML = text;
                    element.style.width = "40px";
                  }
                }
              });
          }
        }
      },
    );
  };
  // 选择打标类型
  changeMarkType = (value) => {
    this.setState({
      markValue: value,
    });
  };
  // 更新题目列表
  updateList = (list) => {
    this.setState({
      list,
    });
  };
  changeStu = (value) => {
    console.log(value, "ffv");
    this.setState({
      ifStu: value,
    });
  };
  checkStu = (value) => {
    this.setState({
      ifCheck: value,
    });
  };
  updateCoList = (list, coordinates) => {
    console.log(list, coordinates, "coo");
    this.setState({
      list,
      coordinates,
    });
  };
  upload = (rate) => {
    const { list, studentCodeAreaList } = this.state;
    const widthRate = 794 * rate;
    const {
      match: { params },
    } = this.props;
    let newLi = JSON.parse(JSON.stringify(list));
    let newStu = JSON.parse(JSON.stringify(studentCodeAreaList));
    if (newLi && newLi.length > 0) {
      newLi.map((item) => {
        if (item.questionDraw && item.questionDraw.length > 0) {
          item.questionDraw.map((index) => {
            if (index) {
              index.x = Math.round((index.x / widthRate) * 210 * 1000) / 1000;
              index.y =
                Math.round((index.y / window.innerHeight) * 297 * 1000) / 1000;
              index.width =
                Math.round((index.width / widthRate) * 210 * 1000) / 1000;
              index.height =
                Math.round((index.height / window.innerHeight) * 297 * 1000) /
                1000;
            }
          });
        }
      });
    }
    if (newStu && newStu.length > 0) {
      newStu.map((index) => {
        if (index) {
          index.x = Math.round((index.x / widthRate) * 210 * 1000) / 1000;
          index.y =
            Math.round((index.y / window.innerHeight) * 297 * 1000) / 1000;
          index.width =
            Math.round((index.width / widthRate) * 210 * 1000) / 1000;
          index.height =
            Math.round((index.height / window.innerHeight) * 297 * 1000) / 1000;
        }
      });
    }
    this.props.dispatch({
      type: "inputQuestion/upload",
      payload: {
        paperId: Number.parseInt(params.id, 10),
        version: params.version,
        paperIndexDetailModel: {
          studentCodeAreaList: newStu,
          paperIndexModelList: newLi,
        },
      },
    });
  };
  checkDraw = (index, number_) => {
    this.setState({
      checkIndex: index,
    });
  };
  render() {
    const {
      list,
      coordinates,
      ifKuang,
      questionList,
      tabIndex,
      markValue,
      checkIndex,
    } = this.state;
    const { indexImg } = this.props;
    console.log(coordinates, list, "<<<4");
    const rate = Math.round((window.innerHeight / 1123) * 100) / 100;
    const wh = window.innerHeight;
    return (
      <div className={styles.mouseDiv}>
        {/* {
          list && list.length ? 
          list.map((item, index) => (
            <div style={{
              width: `${Math.abs(item.startX - item.endX)}px`, 
              height: `${Math.abs(item.startY - item.endY)}px`, 
              left: `${item.startX < item.endX ? item.startX : item.endX}px`,
              top: `${item.startY < item.endY ? item.startY : item.endY}px`
            }} 
            className={styles.overDiv}
            key={index}
            ></div>
          )) : null
        } */}
        <div className={styles.leftBox}>
          <div className={styles.flexCrop}>
            {indexImg && indexImg.length > 0
              ? indexImg.map((it, ind) => (
                  <MultiCrops
                    src={it}
                    width={794 * rate}
                    height={wh}
                    coordinates={this.state.coordinates[ind] || []}
                    onChange={this.changeCoordinate.bind(this, ind)}
                    onDelete={this.deleteCoordinate.bind(this, ind)}
                  />
                ))
              : null}
          </div>
        </div>
        <div className={styles.centerBox}>
          {tabList.map((item, index) => (
            <div
              className={
                index < tabIndex
                  ? styles.isOver
                  : index == tabIndex
                    ? styles.nowInd
                    : styles.tabNav
              }
            >
              {item}
            </div>
          ))}
        </div>
        <div className={styles.rightBox}>
          {/* <div className={styles.buttonBox}>
            <div className={styles.kuangButton} onClick={this.changeKuang}>
              {ifKuang ? '取消' : '框选'}
            </div>
          </div> */}
          <div className={styles.rightContent}>
            {
              // tabIndex == 0 ?
              // <MarkType
              // markValue={markValue}
              // changeMarkType={this.changeMarkType}
              // />:
              tabIndex == 0 ? (
                <Structure
                  list={list}
                  markValue={markValue}
                  updateList={this.updateList}
                  indexImg={indexImg}
                  updateCoList={this.updateCoList}
                />
              ) : tabIndex == 1 ? (
                <Draw
                  list={list}
                  coordinates={coordinates}
                  checkIndex={checkIndex}
                  checkDraw={this.checkDraw}
                  updateList={this.updateList}
                  changeStu={this.changeStu}
                  updateCoList={this.updateCoList}
                  ifStu={this.state.ifStu}
                  ifCheck={this.state.ifCheck}
                  checkStu={this.checkStu}
                  studentCodeAreaList={this.state.studentCodeAreaList}
                />
              ) : tabIndex == 2 ? (
                <MarkScore
                  list={list}
                  coordinates={coordinates}
                  updateList={this.updateList}
                  updateCoList={this.updateCoList}
                />
              ) : tabIndex == 3 ? (
                <MarkAnswer
                  list={list}
                  coordinates={coordinates}
                  updateList={this.updateList}
                />
              ) : // :tabIndex == 5 ?
              // <KnowLedge
              // list={list}
              // coordinates={coordinates}
              // updateList={this.updateList}
              // />
              tabIndex == 4 ? (
                <div>
                  {/* <div onClick={this.upload.bind(this, rate)}>上传</div> */}
                </div>
              ) : null
            }
          </div>
          <div className={styles.bottomButton}>
            <div className={styles.prevButton} onClick={this.prev}>
              {trans("global.previousStep", "上一步")}
            </div>
            {tabIndex == 4 ? (
              <div
                className={styles.prevButton}
                onClick={this.upload.bind(this, rate)}
              >
                {trans("testMouse.upload", "上传")}
              </div>
            ) : (
              <div className={styles.prevButton} onClick={this.next}>
                {trans("global.NextStep", "下一步")}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ home, studyPictures }) => ({
  answerRateData: home.answerRateData,
  classListData: home.classListData,
  viewChart: home.viewChart,
  analysisPersonData: home.analysisPersonData,
  paperIndexList: home.paperIndexList,
  indexImg: home.indexImg,
}))(ViewChart);

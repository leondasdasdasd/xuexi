import React, { PureComponent } from "react";
import { Icon, message, Popover, Select } from "antd";
import html2canvas from "html2canvas";

import { getConfig, saveConfig } from "../../../../services/example";
import { trans } from "../../../../utils/i18n";
import request from "../../../../utils/request";
import ColorSelector from "./ColorSelector";
import GradeScoreOverviewCanvas from "./GradeScoreOverviewCanvas";
import PaintBrush from "./paintBrush";
import QuestionTableCanvas from "./QuestionTableCanvas";
import StudentScoreCanvas from "./StudentScoreCanvas.jsx";

import icon from "../../../../icon.module.less";
import styles from "./index.module.less";
const { Option } = Select;

let pressTimer;
let isLongPress = false;

// 获取Canvas元素并设置绘图环境
let textArea = null;
var canvasMain = null;
var context = null;
let editingIndex = false; // 当前编辑的文本索引
let isDrawing = false; // 标记是否正在拖拽或者绘制
let currentPath = [];
let cloneList = [];
let gapX = null;
let gapY = null;
class PresentationSlides extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      popVisible: {}, //弹窗的显隐
      currentIndex: 0,
      currentTool: "",
      clearActives: [], //存储撤回历史线集合
      pencilColor: "#ff0000", //铅笔颜色
      pencilThickness: 2, //铅笔粗细
      width: 1000,
      height: 500,
      textSize: 16,
      componentsActions: [], //保存组件下的绘制的历史记录
      isOk: true,
    };
  }

  componentDidMount() {
    textArea = document.querySelector("#textArea");
    canvasMain = document.querySelector("#canvasMain");
    context = canvasMain.getContext("2d");

    // 为canvas元素添加事件监听
    canvasMain.addEventListener("mousedown", this.mousedown);
    canvasMain.addEventListener("mouseup", this.mouseup);
    canvasMain.addEventListener("mouseout", this.onMouseOut);
    // 动态调整 `textarea` 的宽度和高度
    textArea.addEventListener("input", this.adjustTextArea);
    textArea.addEventListener("blur", this.finishEditing);
    // 监听 `Enter` 键或失去焦点完成编辑
    textArea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        // 移除blur监听，防止在按下enter键时候触发该监听。
        textArea.removeEventListener("blur", this.finishEditing);
        this.finishEditing();
        // 延迟恢复 `blur` 监听，以确保 `keydown` 已经完成
        setTimeout(() => {
          textArea.addEventListener("blur", this.finishEditing);
        }, 10);
      }
    });

    getConfig({
      type: 8,
      businessId: this.props.examId,
    }).then((response) => {
      if (response.status) {
        if (response.content) {
          this.setState({
            componentsActions: response.content,
            width: response.content[0].originalImageWidth,
            height: response.content[0].originalImageHeight,
          });
          setTimeout(() => {
            this.drawAllActions(response.content[0].actions);
          }, 0);
        } else {
          setTimeout(() => {
            this.componentToCanvas(this.props.tags[0].id);
          }, 0);
        }
      }
    });
  }

  mousedown = (e) => {
    isLongPress = false;
    const { componentsActions, currentIndex } = this.state;
    cloneList = JSON.parse(JSON.stringify(componentsActions));

    pressTimer = setTimeout(() => {
      console.log("长按：如果是文本操作工具，则进行文本拖拽");
      isLongPress = true;
      cloneList = JSON.parse(JSON.stringify(componentsActions));
      if (this.state.currentTool == "text") {
        isDrawing = true;
        const rect = canvasMain.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // 检查是否点击已有文本
        const clickedTextIndex = cloneList[currentIndex].actions.findIndex(
          ({ x: tx, y: ty, text, type, size }) => {
            if (type == "text") {
              const lines = text.split("\n");
              return lines.some((line, index) => {
                context.font = `${size}px Arial`;
                const textWidth = context.measureText(line).width;
                const textHeight = size * 1.15;
                return (
                  x >= tx &&
                  x <= tx + textWidth &&
                  y >= ty + index * textHeight &&
                  y <= ty + (index + 1) * textHeight
                );
              });
            }
          },
        );

        if (clickedTextIndex !== -1) {
          editingIndex = clickedTextIndex;
          gapX = e.offsetX - cloneList[currentIndex].actions[editingIndex].x;
          gapY = e.offsetY - cloneList[currentIndex].actions[editingIndex].y;
          canvasMain.addEventListener("mousemove", this.draw);
          canvasMain.style.cursor = "move";
        }
      }
    }, 300);

    console.log("按下：如果是是画笔或者橡皮擦则直接进行绘制");
    if (
      this.state.currentTool == "pencil" ||
      this.state.currentTool == "eraser"
    ) {
      isDrawing = true;
      currentPath = [[e.offsetX, e.offsetY]];
      context.beginPath();
      context.scale(2, 2);
      context.moveTo(e.offsetX, e.offsetY);
      context.globalAlpha = 1;
      context.strokeStyle = this.state.pencilColor;
      context.lineWidth = this.state.pencilThickness;
      context.lineJoin = "round";
      context.lineCap = "round";
      if (this.state.currentTool == "eraser") {
        context.lineWidth = 30;
        context.globalCompositeOperation = "destination-out";
      } else {
        context.globalCompositeOperation = "source-over";
      }
      canvasMain.addEventListener("mousemove", this.draw);
    }
  };

  mouseup = (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
    }
    if (!isLongPress) {
      console.log("点击");
      const { componentsActions, currentIndex } = this.state;
      cloneList = JSON.parse(JSON.stringify(componentsActions));
      if (this.state.currentTool == "text") {
        const rect = canvasMain.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // 检查是否点击已有文本
        const clickedTextIndex = cloneList[currentIndex].actions.findIndex(
          ({ x: tx, y: ty, text, type, size }) => {
            if (type == "text") {
              const lines = text.split("\n");
              return lines.some((line, index) => {
                context.font = `${size}px Arial`;
                const textWidth = context.measureText(line).width;
                // const height = this.state.textSize * 1.15
                const textHeight = size * 1.15;
                return (
                  x >= tx &&
                  x <= tx + textWidth &&
                  y >= ty + index * textHeight &&
                  y <= ty + (index + 1) * textHeight
                );
              });
            }
          },
        );

        context.globalCompositeOperation = "source-over";
        if (clickedTextIndex === -1) {
          // 显示 `textarea`，并定位到点击位置
          textArea.style.display = "block";
          textArea.style.left = `${e.clientX}px`;
          textArea.style.top = `${e.clientY}px`;
          textArea.style.width = "auto";
          textArea.style.height = "auto";
          textArea.style.zIndex = 101;
          textArea.style.background = "transparent";
          textArea.style.fontSize = `${this.state.textSize}px`;
          textArea.style.color = this.state.textColor;
          textArea.style.borderColor = this.state.textColor;
          // textArea.style.border = 'none';
          editingIndex = null;
          textArea.value = "";
          textArea.focus();
        } else {
          editingIndex = clickedTextIndex;
          const {
            x: tx,
            y: ty,
            text,
            color,
            size,
          } = cloneList[currentIndex].actions[clickedTextIndex];
          // 显示 `textarea`，并定位到点击位置
          textArea.style.display = "block";
          textArea.style.left = `${rect.left + tx}px`;
          textArea.style.top = `${rect.top + ty}px`;
          textArea.style.width = "auto";
          textArea.style.height = "auto";
          textArea.style.zIndex = 101;
          textArea.style.fontSize = `${size}px`;
          textArea.style.color = color;
          // textArea.style.border = 'none';
          textArea.style.borderColor = color;
          textArea.style.background = "#fff";
          textArea.value = text;
          textArea.focus();
          this.adjustTextArea();
        }
      }
    }
    if (isLongPress) {
      console.log("长按松开");
      canvasMain.style.cursor = "pointer";
      this.endDrawing(e);
    } else {
      console.log("点击松开");
      this.endDrawing(e);
    }
  };

  finishEditing = () => {
    console.log("finishEditing");
    const content = textArea.value;
    const { currentIndex } = this.state;
    if (editingIndex !== null) {
      cloneList[currentIndex].actions[editingIndex].text = content;
      this.setState({
        componentsActions: cloneList,
      });
      this.drawAllActions(cloneList[currentIndex].actions);
    } else if (content) {
      // 添加新文本
      const rect = canvasMain.getBoundingClientRect();
      const x = Number.parseInt(textArea.style.left) - rect.left;
      const y = Number.parseInt(textArea.style.top) - rect.top;
      cloneList[currentIndex].actions.push({
        type: "text",
        text: content,
        x,
        y,
        color: this.state.textColor,
        size: this.state.textSize,
        lineWidth: this.state.pencilThickness,
      });
      this.setState({
        componentsActions: cloneList,
      });

      context.scale(2, 2);

      context.font = `${this.state.textSize}px Arial`;
      context.fillStyle = this.state.textColor;
      const lines = content.split("\n");

      for (const [index, line] of lines.entries()) {
        const height = this.state.textSize * 1.15;
        const startY = y + this.state.textSize + height * index;

        context.fillText(line, x, startY);
      }
      context.resetTransform();
    }
    textArea.style.display = "none";
  };

  // 绘制所有文本
  drawAllActions = (data) => {
    context.clearRect(0, 0, canvasMain.width, canvasMain.height);
    context.scale(2, 2);
    if (data)
      for (const [
        index,
        { type, text, x, y, color, size, points, lineWidth },
      ] of data.entries()) {
        switch (type) {
          case "pencil": {
            context.beginPath();
            context.globalAlpha = 1;
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.lineJoin = "round";
            context.lineCap = "round";
            for (const [index, point] of points.entries()) {
              if (index === 0) {
                // 第一个点需要用 moveTo 设为起点
                context.moveTo(point[0], point[1]);
              } else {
                // 其余点连接成路径
                context.lineTo(point[0], point[1]);
              }
            }
            context.stroke();

            break;
          }
          case "text": {
            context.font = `${size}px Arial`;
            context.fillStyle = color;
            const lines = text.split("\n");
            for (const [index, line] of lines.entries()) {
              const height = size * 1.15;
              const startY = y + height * index + size;
              context.fillText(line, x, startY);
            }

            break;
          }
          case "eraser": {
            context.beginPath();
            context.globalAlpha = 1;
            context.lineWidth = 30;
            context.lineJoin = "round";
            context.lineCap = "round";
            context.globalCompositeOperation = "destination-out";
            for (const [index, point] of points.entries()) {
              if (index === 0) {
                // 第一个点需要用 moveTo 设为起点
                context.moveTo(point[0], point[1]);
              } else {
                // 其余点连接成路径
                context.lineTo(point[0], point[1]);
              }
            }
            context.stroke();
            context.globalCompositeOperation = "source-over";

            break;
          }
          // No default
        }
      }
    context.resetTransform();
  };
  // 调整 `textarea` 尺寸的函数
  adjustTextArea = () => {
    const textMirror = document.querySelector("#textMirror");
    textMirror.style.font = getComputedStyle(textArea).font;
    textMirror.style.padding = getComputedStyle(textArea).padding;
    textMirror.style.lineHeight = getComputedStyle(textArea).lineHeight;
    textMirror.innerText = textArea.value + "\u200B"; // 使用零宽字符来保证显示空内容
    textArea.style.width = `${textMirror.offsetWidth + 20}px`; // 限制最大宽度
    textArea.style.height = `${textMirror.offsetHeight + 20}px`; // 动态调整高度
  };

  onQuestionTableDidMount = () => {};

  //一键擦除
  clearScreen = () => {
    const { componentsActions, currentIndex } = this.state;
    let list = JSON.parse(JSON.stringify(componentsActions));
    let clearActives = JSON.parse(JSON.stringify(list[currentIndex].actions));
    list[currentIndex].actions = [];
    this.setState(
      {
        clearActives: clearActives,
        componentsActions: list,
      },
      () => {
        context.clearRect(0, 0, canvasMain.width, canvasMain.height);
      },
    );
  };

  startDrawing = (e) => {};

  draw = (e) => {
    if (this.state.currentTool == "text") {
      const { currentIndex } = this.state;
      cloneList[currentIndex].actions[editingIndex].x = e.offsetX - gapX;
      cloneList[currentIndex].actions[editingIndex].y = e.offsetY - gapY;
      this.drawAllActions(cloneList[currentIndex].actions);
    } else {
      const x = e.offsetX;
      const y = e.offsetY;
      currentPath.push([e.offsetX, e.offsetY]);
      context.lineTo(x, y);
      context.stroke();
    }
  };

  endDrawing = (e) => {
    if (isDrawing) {
      isDrawing = false;
      const { currentIndex } = this.state;
      if (this.state.currentTool == "eraser") {
        cloneList[currentIndex].actions.push({
          type: "eraser",
          points: currentPath,
          lineWidth: 30,
        });
      } else if (this.state.currentTool == "pencil") {
        cloneList[currentIndex].actions.push({
          type: "pencil",
          points: currentPath,
          color: context.strokeStyle,
          lineWidth: context.lineWidth,
        });
      }
      this.setState({
        componentsActions: cloneList,
      });
      context.resetTransform();
      canvasMain.removeEventListener("mousemove", this.draw);
    }
  };

  undo = () => {
    const { currentIndex, componentsActions } = this.state;
    let list = JSON.parse(JSON.stringify(componentsActions));
    let cloneClearActives = JSON.parse(JSON.stringify(this.state.clearActives));
    if (this.state.clearActives && this.state.clearActives.length > 0) {
      list[currentIndex].actions = cloneClearActives;
      this.setState({
        componentsActions: list,
        clearActives: [],
      });
      this.drawAllActions(list[currentIndex].actions);
    } else {
      list[currentIndex].actions.pop();
      this.setState({
        componentsActions: list,
      });
      this.drawAllActions(list[currentIndex].actions);
    }
  };

  onMouseOut = (e) => {
    this.endDrawing();
  };

  nextSlide = () => {
    let index_ = this.state.currentIndex + 1;
    let list = JSON.parse(JSON.stringify(this.state.componentsActions));
    setTimeout(() => {
      this.drawAllActions(list[index_]?.actions);
    }, 0);

    this.setState({
      direction: "next",
      currentIndex: index_,
    });
    // 存在url说明是编辑界面
    if (this.state.componentsActions[index_]?.originalImageURL) {
      this.setState({
        width: this.state.componentsActions[index_]?.originalImageWidth,
        height: this.state.componentsActions[index_]?.originalImageHeight,
        isOk: true,
      });
      for (const [index, { id }] of this.props.tags.entries()) {
        let canvas = document.getElementById(`${id}_canvas`);
        if (canvas) {
          canvas.style.left = "100%";
          canvas.style.transform = "translateX(0%)";
        }
      }
    } else {
      for (const [index, { id }] of this.props.tags.entries()) {
        if (index_ == index) {
          let canvas = document.getElementById(`${id}_canvas`);
          if (canvas) {
            canvas.style.left = "50%";
            canvas.style.transform = "translateX(-50%)";
            this.setState({
              width: canvas.clientWidth,
              height: canvas.clientHeight,
              isOk: true,
            });
          } else {
            this.componentToCanvas(id);
          }
        } else {
          let canvas = document.getElementById(`${id}_canvas`);
          if (canvas) {
            canvas.style.left = "100%";
            canvas.style.transform = "translateX(0%)";
          }
        }
      }
    }
  };

  prevSlide = () => {
    let index_ = this.state.currentIndex - 1;

    let list = JSON.parse(JSON.stringify(this.state.componentsActions));

    setTimeout(() => {
      this.drawAllActions(list[index_]?.actions);
    }, 0);
    this.setState({
      direction: "prev",
      currentIndex: index_,
    });
    // 如果已经保存过标注信息
    if (this.state.componentsActions[index_]?.originalImageURL) {
      //  直接配置图片尺寸
      this.setState({
        width: this.state.componentsActions[index_].originalImageWidth,
        height: this.state.componentsActions[index_].originalImageHeight,
        isOk: true,
      });
      // 隐藏由dom元素转换成的canvas
      for (const [index, { id }] of this.props.tags.entries()) {
        let canvas = document.getElementById(`${id}_canvas`);
        if (canvas) {
          canvas.style.left = "100%";
          canvas.style.transform = "translateX(0%)";
        }
      }
    } else {
      for (const [index, { id }] of this.props.tags.entries()) {
        if (index_ == index) {
          let canvas = document.getElementById(`${id}_canvas`);
          if (canvas) {
            canvas.style.left = "50%";
            canvas.style.transform = "translateX(-50%)";
            this.setState({
              width: canvas.clientWidth,
              height: canvas.clientHeight,
              isOk: true,
            });
          } else {
            this.componentToCanvas(id);
          }
        } else {
          let canvas = document.getElementById(`${id}_canvas`);
          if (canvas) {
            canvas.style.left = "100%";
            canvas.style.transform = "translateX(0%)";
          }
        }
      }
    }
  };

  componentToCanvas = (id) => {
    if (document.getElementById(`${id}_component`)) {
      this.setState({
        isOk: true,
      });
      html2canvas(document.getElementById(`${id}_component`)).then((canvas) => {
        document.querySelector("#provew").append(canvas);
        canvas.style.top =
          window.innerHeight >= canvas.clientHeight
            ? `${(window.innerHeight - canvas.clientHeight) / 2}px`
            : 0;
        canvas.style.position = "absolute";
        canvas.setAttribute("id", `${id}_canvas`);
        canvas.style.left = "50%";
        canvas.style.transform = "translateX(-50%)";
        canvas.style.zIndex = 99;
        let list = JSON.parse(JSON.stringify(this.state.componentsActions));
        list.push({
          code: id,
          originalImageURL: "",
          actions: [],
          originalImageWidth: canvas.clientWidth,
          originalImageHeight: canvas.clientHeight,
        });

        this.setState({
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          componentsActions: list,
        });
      });
    } else {
      this.setState({
        isOk: false,
      });
    }
  };

  changePopVisible = (type, visible) => {
    let popVisible = {};
    popVisible[type] = visible;
    this.setState({
      popVisible,
    });
  };

  //选择模式
  selectMode = (mode) => {
    this.setState(
      {
        currentTool: mode,
      },
      () => {},
    );
  };

  watchToolOperation = (value, type, picker) => {
    if (type == "color") {
      this.setState({
        pencilColor: value,
      });
    } else if (type == "thickness") {
      this.setState({
        pencilThickness: value,
      });
    }
  };

  colorChange = (value, key) => {
    this.setState({
      textColor: value,
    });
  };

  fontSizeChange = (value) => {
    this.setState({
      textSize: value,
    });
  };

  saveRemark = () => {
    let list = JSON.parse(JSON.stringify(this.state.componentsActions));
    let canvasFromDOM = [];
    for (const [index, item] of list.entries()) {
      if (
        !item.originalImageURL &&
        document.getElementById(`${item.code}_canvas`)
      ) {
        canvasFromDOM.push({
          index: index,
          canvas: document.getElementById(`${item.code}_canvas`),
        });
      }
    }
    //将canvas转换成blob
    let filesFromCanvas = canvasFromDOM.map(({ index, canvas }) => {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          // 创建 FormData 对象
          const formData = new FormData();
          formData.append("file", blob, "canvas-image.png"); // 设定文件名
          resolve({ index, formData });
        }, "image/png");
      });
    });

    // 等待所有canvas转换成blob
    new Promise((resolve, reject) => {
      Promise.all(filesFromCanvas)
        .then((res) => {
          resolve(res);
        })
        .catch((error) => {});
    }).then((res) => {
      // 等待所有blob文件上传成功
      Promise.all(
        res.map(({ index, formData }) => {
          return new Promise((resolve, reject) => {
            request("/api/upload_file", {
              method: "POST",
              body: formData,
            }).then((res) => {
              if (res.status) {
                resolve({
                  index,
                  url: res.content[0].url,
                });
              }
            });
          });
        }),
      )
        .then((res1) => {
          // 输出: [{"index": 0, "url": "/api/preview_file?id=29000" }]
          for (const { index, url } of res1) {
            list[index].originalImageURL = url;
          }
          saveConfig({
            type: 8,
            businessId: this.props.examId,
            config: JSON.stringify(list),
          }).then((res) => {
            if (res.status) {
              message.success(trans("global.operateSuccess", "操作成功"));
            }
          });
        })
        .catch((error) => {});
    });
  };
  render() {
    const { width, height, currentIndex } = this.state;

    return (
      <div className={styles.presentationSlides}>
        {this.state.currentIndex == 0 ? null : (
          <div
            onClick={this.prevSlide}
            style={{ rotate: "90deg", left: "-4px", color: "#fff" }}
            className={styles.changePageBtn}
          >
            <i className={styles.iconfont}>&#xe7aa;</i>
          </div>
        )}
        {this.state.currentIndex == this.props.tags.length - 1 ? null : (
          <div
            onClick={this.nextSlide}
            className={styles.changePageBtn}
            style={{ rotate: "270deg", right: "-5px", color: "#fff" }}
          >
            <i className={styles.iconfont}>&#xe7aa;</i>
          </div>
        )}
        <div
          className={styles.closeBtn}
          onClick={() => {
            this.props.exitFullscreen("classroomEvaluation");
          }}
        >
          <Icon type="close" />
        </div>

        <div
          id="provew"
          style={{
            width: "100vw",
            height: "100vh",
            position: "absolute",
            left: "0",
            top: "0",
            zIndex: 11,
            textAlign: "center",
          }}
        >
          {this.state.componentsActions.map((item, index) => {
            if (item.originalImageURL && index == currentIndex) {
              return (
                <img
                  src={item?.originalImageURL}
                  alt=""
                  key={index}
                  style={{
                    zIndex: 99,
                    position: "absolute",
                    top: `${window.innerHeight >= height ? (window.innerHeight - height) / 2 : 0}px`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: `${width}px`,
                    height: `${height}px`,
                  }}
                />
              );
            }
          })}

          {this.state.isOk ? null : (
            <h3
              style={{
                position: "absolute",
                left: "50%",
                top: "30%",
                transform: "translateX(-50%)",
                color: "#fff",
              }}
            >
              {trans(
                "presentationSlides.moduleNotSupported",
                "此模块暂时不支持...",
              )}
            </h3>
          )}

          <canvas
            id="canvasMain"
            title={trans("presentationSlides.canvas", "画布")}
            width={width * 2}
            height={height * 2}
            style={{
              zIndex: 100,
              position: "absolute",
              top: `${window.innerHeight >= height ? (window.innerHeight - height) / 2 : 0}px`,
              left: "50%",
              transform: "translateX(-50%)",
              width: `${width}px`,
              height: `${height}px`,
            }}
          >
            {trans(
              "presentationSlides.canvasUnsupported",
              "您的浏览器不支持 HTML5 canvas 标签。",
            )}
          </canvas>

          <textarea
            id="textArea"
            style={{
              position: "absolute",
              display: "none",
              resize: "none",
              fontSize: `${this.state.textSize}px`,
              color: this.state.textColor,
              padding: 0,
              margin: 0,
              fontFamily: "Arial",
            }}
          ></textarea>
          <div
            id="textMirror"
            style={{
              position: "absolute",
              visibility: "hidden",
              whiteSpace: "preWrap",
              wordWrap: "break-word",
            }}
          ></div>

          <div
            style={{
              width: "calc(100% - 112px)",
              height: "calc(100% - 60px)",
              position: "absolute",
              left: "10000px",
              bottom: "100%",
            }}
            id="renderContent"
          >
            {this.props.tags.map(({ id }) => {
              if (id == "groupQuestion") {
                return (
                  <QuestionTableCanvas
                    onDidMount={this.onQuestionTableDidMount}
                    examId={this.props.examId}
                    groupId={this.props.groupId}
                  />
                );
              } else if (id == "groupScore") {
                return (
                  <GradeScoreOverviewCanvas
                    dataSource={this.props.dataSource}
                    viewData={this.props.viewData}
                  />
                );
              } else if (id == "studentScore") {
                return (
                  <StudentScoreCanvas
                    groupId={this.props.groupId}
                    questionScore={this.props.questionScore}
                  />
                );
              }
            })}
          </div>
        </div>

        <div
          className={styles.saveRemarkBtn}
          onClick={() => {
            this.saveRemark();
          }}
        >
          {trans("presentationSlides.saveAnnotationInfo", "保存标注信息")}
        </div>

        <div className={styles.toolbar}>
          <Popover
            overlayClassName={styles.popContent}
            trigger="click"
            content={
              <div style={{ display: "flex", alignItems: "center" }}>
                <ColorSelector
                  onChange={this.colorChange}
                  selectedColor={this.state.textColor}
                />
                <Select
                  defaultValue={17}
                  style={{ width: 120 }}
                  onChange={this.fontSizeChange}
                >
                  <Option value={14}>14px</Option>
                  <Option value={16}>16px</Option>
                  <Option value={17}>17px</Option>
                  <Option value={20}>20px</Option>
                  <Option value={40}>40px</Option>
                </Select>
              </div>
            }
          >
            <span onClick={() => this.selectMode("text")}>
              {this.state.currentTool == "text" ? (
                <i className={icon.iconfont} style={{ color: "#0445FC" }}>
                  &#xe84e;
                </i>
              ) : (
                <i className={icon.iconfont}>&#xe84e;</i>
              )}
            </span>
          </Popover>

          <Popover
            overlayClassName={styles.popContent}
            trigger="click"
            visible={this.state.popVisible["pencil"] || false}
            onVisibleChange={(visible) =>
              this.changePopVisible("pencil", visible)
            }
            content={
              <PaintBrush
                pencilColor={this.state.pencilColor}
                pencilPicker={true}
                pencilThickness={this.state.pencilThickness}
                watchToolOperation={this.watchToolOperation}
              />
            }
          >
            <span onClick={() => this.selectMode("pencil")}>
              {this.state.currentTool == "pencil" ? (
                <i
                  className={icon.iconfont}
                  style={{ color: this.state.pencilColor }}
                >
                  &#xe690;
                </i>
              ) : (
                <i className={icon.iconfont}>&#xe851;</i>
              )}
            </span>
          </Popover>

          <span onClick={() => this.selectMode("eraser")}>
            {this.state.currentTool == "eraser" ? (
              <i className={icon.iconfont} style={{ color: "#0445FC" }}>
                &#xe696;
              </i>
            ) : (
              <i className={icon.iconfont}>&#xe84d;</i>
            )}
          </span>
          <span onClick={() => this.clearScreen("clearAll")}>
            {this.state.currentTool == "clearAll" ? (
              <i className={icon.iconfont} style={{ color: "#0445FC" }}>
                &#xe890;
              </i>
            ) : (
              <i className={icon.iconfont}>&#xe890;</i>
            )}
          </span>
          <span>
            {this.state.componentsActions[this.state.currentIndex]?.actions
              ?.length > 0 || this.state.clearActives.length > 0 ? (
              <i className={icon.iconfont} onClick={this.undo}>
                &#xe84b;
              </i>
            ) : (
              <i
                className={icon.iconfont}
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                &#xe84b;
              </i>
            )}
          </span>
        </div>
      </div>
    );
  }
}
export default PresentationSlides;

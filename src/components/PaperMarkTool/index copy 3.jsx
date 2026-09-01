import React, { PureComponent } from "react";
import { Select } from "antd";
import { fabric } from "fabric";

import styles from "./index.module.less";
const { Option } = Select;

let selectedPosition = null;
class PaperMarkTool extends PureComponent {
  constructor(properties) {
    super(properties);
    this.canvas = null;
    this.beforClickActiveObj = null;
    this.isDrawing = false; // 是否正在绘制
    // 状态栈与索引
    this.stateStack = [];
    this.currentStateIndex = -1;
    this.isUndoing = false; //是否正在撤销
    this.startX = null;
    this.startY = null;
    this.isEditing = null;
    this._clipboard = null;
    this.state = {
      fontSize: 16,
      index: 0,
      currentTool: "select",
      left: 10,
      top: 10,
    };
  }

  componentDidMount() {
    this.props.ref && this.props.ref(this);

    document.addEventListener("keydown", (e) => {
      const target = e.target;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) {
        // 忽略输入框中的键盘事件
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        this.deleteSelectedObjects();
      }
    });
  }

  showTextControl = (left, top) => {
    let textControl = document.querySelector("#textControl");
    let canvasDom = document.getElementById(this.props.canvasId);
    let { x: x1, y: y1 } = canvasDom.getBoundingClientRect();

    textControl.style.display = "block";
    // 设置悬浮层的位置
    textControl.style.left = `${left + x1}px`;
    textControl.style.top = `${top + 30 + y1}px`;
    // 显示悬浮层
    textControl.style.display = "block";
    // 保存第一次点击的位置
    selectedPosition = { x: left, y: top };
  };

  hideTextControl = () => {
    let textControl = document.querySelector("#textControl");
    // 隐藏悬浮层
    textControl.style.display = "none";
    // 保存第一次点击的位置
    selectedPosition = {};
  };

  showLineControl = (left, top) => {
    let lineControl = document.querySelector("#lineControl");

    let canvasDom = document.getElementById(this.props.canvasId);
    let { x: x1, y: y1 } = canvasDom.getBoundingClientRect();
    lineControl.style.display = "block";
    // 设置悬浮层的位置
    lineControl.style.left = `${left + x1}px`;
    lineControl.style.top = `${top + 30 + y1}px`;
    // 显示悬浮层
    lineControl.style.display = "block";
    // 保存第一次点击的位置
    selectedPosition = { x: left, y: top };
  };

  hideLineControl = () => {
    let lineControl = document.querySelector("#lineControl");
    // 隐藏悬浮层
    lineControl.style.display = "none";
    // 保存第一次点击的位置
    selectedPosition = {};
  };

  initializeFabricCanvas = (jsonData) => {
    const { canvasId } = this.props;
    if (canvasId) {
      this.canvas = new fabric.Canvas(canvasId, {
        selection: false,
      });
      // 全局设置控制点颜色和样式
      fabric.Object.prototype.set({
        cornerColor: "blue", // 控制点的填充颜色
        cornerStrokeColor: "black", // 控制点的边框颜色
        cornerSize: 10, // 控制点的大小
        cornerStyle: "rect", // 控制点的形状：'rect' 或 'circle'
        transparentCorners: false, // 是否显示透明的控制点,
        // lockRotation: false,
      });

      fabric.Object.prototype.setControlsVisibility({
        mtr: false, // 禁用旋转控制点
      });

      // 监听路径创建事件
      this.canvas.on("path:created", (event) => {
        console.log("path:created");

        if (!this.isUndoing) {
          this.saveState();
        }
      });

      // 监听对象修改和画布事件，保存状态
      this.canvas.on("object:added", () => {
        console.log("object:added");
      });

      this.canvas.on("object:modified", () => {
        console.log("object:modified");
        this.saveState();
      });

      this.canvas.on("object:removed", () => {
        console.log("object:removed");
        // 忽略矩形工具下点击canvas而不拖拽，会手动将这个无用的矩形删除
        console.log(this.isDrawing);

        // isUndoing为true代表正在撤销，每次撤销都会删除画布上所有元素重新绘制。
        if (!this.isUndoing) {
          this.saveState();
        }
      });

      // 开始绘制时清除选中
      // canvas.on("mouse:down:before", () => {
      //     if (canvas.isDrawingMode) {
      //         // 清空选中状态
      //         canvas.discardActiveObject();
      //     }
      // });

      // 监听鼠标点击事件
      this.canvas.on("mouse:down", (event) => {
        console.log("mouse:down");
        console.log(event, "event");

        // 检查点击的对象类型
        const clickedObject = this.canvas.findTarget(event.e);
        console.log(clickedObject, "clickedObject1");

        if (this.state.currentTool == "textbox") {
          if (clickedObject) {
            this.hideLineControl();
            this.hideTextControl();

            // 鼠标在画布上按下地方存在对象
            this.beforClickActiveObj = clickedObject;

            const { type, left, top, height } = clickedObject;
            if (type == "path" || type == "rect") {
              this.showLineControl(left, top + height);
            } else if (type == "textbox") {
              this.showTextControl(left, top + height);
            }
          } else if (this.beforClickActiveObj) {
            // 鼠标在画布上按下 且在本次按下之前存在选中对象
            this.beforClickActiveObj = null;
            this.hideLineControl();
            this.hideTextControl();
          } else {
            // 鼠标在画布上按下
            this.createTextBox(event);
          }
        } else if (this.state.currentTool == "select") {
          this.hideLineControl();
          this.hideTextControl();
          if (clickedObject) {
            // 鼠标在画布上按下地方存在对象
            this.beforClickActiveObj = clickedObject;

            const { type, left, top, height } = clickedObject;
            if (type == "path" || type == "rect") {
              this.showLineControl(left, top + height);
            } else if (type == "textbox") {
              this.showTextControl(left, top + height);
            }
          } else if (this.beforClickActiveObj) {
            // 鼠标在画布上按下 且在本次按下之前存在选中对象
            this.beforClickActiveObj = null;
          }
        } else if (this.state.currentTool == "pen") {
          // Pen tool has no mousedown side effect here.
        } else if (this.state.currentTool == "rect") {
          this.hideLineControl();
          this.hideTextControl();

          if (clickedObject) {
            // 鼠标在画布上按下地方存在对象
            this.beforClickActiveObj = clickedObject;

            const { type, left, top, height } = clickedObject;
            if (type == "path" || type == "rect") {
              this.showLineControl(left, top + height);
            } else if (type == "textbox") {
              this.showTextControl(left, top + height);
            }
            return;
          }

          const pointer = this.canvas.getPointer(event.e); // 获取鼠标位置
          this.startX = pointer.x;
          this.startY = pointer.y;
          this.isDrawing = true;
          // 创建一个临时的矩形对象
          let rect = new fabric.Rect({
            left: this.startX,
            top: this.startY,
            strokeWidth: 3,
            stroke: "#ff0000",
            fill: "transparent",
            selected: true,
            strokeUniform: true, // 保持边框粗细一致
          });

          this.canvas.add(rect);
          this.beforClickActiveObj = rect;
        } else if (
          this.state.currentTool == "tick" ||
          this.state.currentTool == "cross" ||
          this.state.currentTool == "halfCorrect"
        ) {
          this.hideLineControl();
          this.hideTextControl();
          if (clickedObject) {
            // 鼠标在画布上按下地方存在对象
            this.beforClickActiveObj = clickedObject;

            const { type, left, top, height } = clickedObject;
            if (type == "path" || type == "rect") {
              this.showLineControl(left, top + height);
            } else if (type == "textbox") {
              this.showTextControl(left, top + height);
            }
          } else if (this.beforClickActiveObj) {
            // 鼠标在画布上按下 且在本次按下之前存在选中对象
            this.beforClickActiveObj = null;
          }
        }
      });

      // 鼠标移动事件：动态调整矩形宽高
      this.canvas.on("mouse:move", (event) => {
        if (!this.isDrawing || this.state.currentTool !== "rect") return;

        const pointer = this.canvas.getPointer(event.e);
        const width = pointer.x - this.startX;
        const height = pointer.y - this.startY;
        // 动态调整矩形的位置和尺寸
        this.beforClickActiveObj.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : this.startX,
          top: height < 0 ? pointer.y : this.startY,
        });
        this.canvas.renderAll();
      });

      // 鼠标松开事件：完成矩形绘制
      this.canvas.on("mouse:up", () => {
        if (!this.isDrawing || this.state.currentTool !== "rect") return;
        // 移除临时矩形的可选状态
        this.beforClickActiveObj.set({ selectable: true, evented: true });
        this.canvas.setActiveObject(this.beforClickActiveObj);
        console.log(this.beforClickActiveObj, "beforClickActiveObj");

        if (
          this.beforClickActiveObj.width > 5 ||
          this.beforClickActiveObj.height > 5
        ) {
          this.saveState();

          // const { left, top, height } = this.beforClickActiveObj
          // this.showLineControl(left, top + height)
        } else {
          // this.hideLineControl()
          this.canvas.remove(this.beforClickActiveObj);
        }
        this.isDrawing = false;

        console.log("矩形绘制完成");
      });

      // 如果jsonData为空，需要手动执行saveState而无需执行loadCanvas
      if (jsonData) {
        this.loadCanvas(jsonData);
      } else {
        this.saveState();
      }
    }
  };

  deleteSelectedObjects() {
    const { isComponentActive = true } = this.props;
    if (!isComponentActive) return;

    const activeObjects = this.canvas.getActiveObjects(); // 获取所有选中对象
    if (activeObjects.length > 0) {
      for (const activeObject of activeObjects) {
        this.canvas.remove(activeObject); // 删除对象
      }
      this.canvas.discardActiveObject(); // 清除选中状态
      this.canvas.renderAll(); // 重新渲染画布
    }
  }

  // 创建文本框的方法
  createTextBox = (event) => {
    const pointer = this.canvas.getPointer(event.e); // 获取点击位置

    const textbox = new fabric.Textbox("", {
      left: pointer.x,
      top: pointer.y,
      fill: "#ff0000",
      strokeWidth: 1,
      stroke: "#ff0000",
      fontSize: this.state.fontSize,
    });

    // 将新文本框添加到画布上
    this.canvas.add(textbox);

    const { type, left, top, height } = textbox;
    this.showTextControl(left, top + height);

    textbox.on("editing:exited", function () {
      console.log("editing:exited", "退出文本编辑模式");
      // 退出编辑时检查文本是否为空
      if (textbox.text.trim() === "") {
        // 如果文本框为空，删除该文本框
        this.canvas.remove(textbox);
        console.log("空文本框已被删除");
      }
    });

    this.beforClickActiveObj = textbox;
    this.canvas.setActiveObject(textbox);
    textbox.enterEditing();
  };

  selectTool = (tool) => {
    if (tool == "textbox") {
      console.log("切换到文本工具");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    } else if (tool == "select") {
      console.log("切换到框选工具");
      this.canvas.selection = true;
      this.canvas.isDrawingMode = false;
    } else if (tool == "pen") {
      console.log("切换到画笔工具");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = true; // 使用户可以进行自由绘制。
      this.canvas.freeDrawingBrush.color = "#ff0000";
      this.canvas.freeDrawingBrush.width = 3;
      this.beforClickActiveObj = null;
    } else if (tool == "tick") {
      console.log("切换到对勾");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    } else if (tool == "cross") {
      console.log("切换到叉号");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    } else if (tool == "halfCorrect") {
      console.log("切换到半对");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    } else if (tool == "rect") {
      console.log("切换到矩形工具");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    }

    this.setState({
      currentTool: tool,
    });

    // 更新页面用的
    this.setState({
      index: this.state.index + 1,
    });
  };

  resetTool = () => {
    this.canvas.selection = false;
    this.canvas.isDrawingMode = false;
    this.setState({
      currentTool: "select",
    });
  };

  clearCanvas = () => {
    console.log("清空了");
    this.stateStack = [];
    this.currentStateIndex = -1;
    this.beforClickActiveObj = null;
    this.canvas.selection = false;
    this.canvas.isDrawingMode = false;
    this.setState({
      currentTool: "select",
    });
    this.canvas.dispose();
  };

  // 撤销操作
  undo = () => {
    this.isUndoing = true;
    if (this.currentStateIndex > 0) {
      this.currentStateIndex -= 1; // 回退索引
      this.canvas.loadFromJSON(this.stateStack[this.currentStateIndex], () => {
        this.canvas.renderAll(); // 重新渲染画布
        console.log("加载状态完成");
      });
      console.log("撤销到状态：", this.currentStateIndex);
    } else {
      console.log("没有更多状态可以撤销");
    }
    this.isUndoing = false;
  };

  disableDeleteButton = () => {
    fabric.Object.prototype.controls.deleteControl.visible = false; // 隐藏删除按钮
    this.canvas.renderAll(); // 刷新画布
  };

  enableDeleteButton = () => {
    fabric.Object.prototype.controls.deleteControl.visible = true; // 显示删除按钮
    this.canvas.renderAll(); // 刷新画布
  };

  // 添加对勾批注的方法
  addCheckmark = (type) => {
    let l = this.state.left + 10;
    let t = this.state.top + 10;

    this.setState({
      left: l,
      top: t,
    });

    let path = [];
    if (type == "tick") {
      path = "M10 40 L30 60 L70 10";
    } else if (type == "cross") {
      path = "M10 10 L70 70 M70 10 L10 70";
    } else if (type == "halfCorrect") {
      path = "M10 40 L30 60 L70 10 M45 25 L65 40";
    }

    // 创建路径对象（对勾）
    const checkmark = new fabric.Path(path, {
      left: l,
      top: t,
      stroke: "#ff0000", // 对勾颜色
      strokeWidth: 5, // 对勾线条宽度
      fill: "", // 无填充色
      selectable: true, // 允许选择
      evented: true, // 允许交互
      hasRotatingPoint: false,
    });

    const { left, top, height } = checkmark;
    this.showLineControl(left, top + height);

    // 将对勾添加到画布
    this.canvas.add(checkmark);
    // 设置为活动对象（可以立即调整或移动）
    this.canvas.setActiveObject(checkmark);
    this.beforClickActiveObj = checkmark;
  };

  // 加载标注数据并还原
  loadCanvas = (loadData) => {
    // 将加载的数据还原到画布
    this.canvas.loadFromJSON(loadData, () => {
      this.canvas.renderAll(); // 重新渲染画布
      console.log("标注加载完成！");
      this.saveState();
    });
  };

  // 保存画布对象数据
  getCanvasJsonData = () => {
    if (this.canvas) {
      // 获取画布中的所有对象数据
      return this.canvas.toJSON();
    }
  };

  // 保存画布状态
  saveState = () => {
    const state = this.canvas.toJSON();

    // 当保存新状态时，将索引之后的所有状态清除
    this.stateStack = this.stateStack.slice(0, this.currentStateIndex + 1);
    this.stateStack.push(state);
    this.currentStateIndex = this.stateStack.length - 1;
    console.log("状态保存：", this.stateStack);
  };

  fontSizeChange = (e) => {
    const { value } = e.target;
    console.log(value, "value");
    let fontSize = "";
    if (value) {
      fontSize = Number.parseInt(value, 10);
    }
    this.setState({
      fontSize: fontSize,
    });
  };

  endedFontSizeChange = (e) => {
    if (e.key == "Enter") {
      console.log(this.state.fontSize, "fontSize----");
      // 获取当前选中的所有对象
      const activeObjects = this.canvas.getActiveObjects();
      // 如果选中了文本框对象，批量修改字体大小
      for (const object of activeObjects) {
        if (object.type === "textbox") {
          object.set({ fontSize: this.state.fontSize });
        }
      }
      // 刷新画布显示
      this.canvas.renderAll();
    }
  };

  penWidthChange = (e) => {
    this.setState({
      penWidth: e,
    });
    this.canvas.freeDrawingBrush.width = Number.parseInt(e, 10);
    // 获取当前选中的所有对象
    const activeObjects = this.canvas.getActiveObjects();
    // 如果选中了文本框对象，批量修改字体大小
    for (const object of activeObjects) {
      console.log(object);
      if (object.type === "path" || object.type === "rect") {
        object.set("strokeWidth", Number.parseInt(e, 10));
      }
    }
    // 刷新画布显示
    this.canvas.renderAll();
  };

  // clear = () => {
  //     this.canvas.clear();
  //     this.stateStack = []
  //     this.currentStateIndex = -1
  //     this.saveState()
  //     this.setState({
  //         currentTool: 'select'
  //     })
  //     this.beforClickActiveObj = null
  // }

  // copy = () => {
  //     // clone what are you copying since you
  //     // may want copy and paste on different moment.
  //     // and you do not want the changes happened
  //     // later to reflect on the copy.
  //     this.canvas
  //         .getActiveObject()
  //         .clone()
  //         .then((cloned) => {
  //             this._clipboard = cloned;
  //         });
  // }

  // paste = async () => {
  //     // clone again, so you can do multiple copies.
  //     const clonedObj = await this._clipboard.clone();
  //     this.canvas.discardActiveObject();
  //     clonedObj.set({
  //         left: clonedObj.left + 10,
  //         top: clonedObj.top + 10,
  //         evented: true,
  //     });
  //     if (clonedObj instanceof fabric.ActiveSelection) {
  //         // active selection needs a reference to the canvas.
  //         clonedObj.canvas = this.canvas;
  //         clonedObj.forEachObject((obj) => {
  //             this.canvas.add(obj);
  //         });
  //         // this should solve the unselectability
  //         clonedObj.setCoords();
  //     } else {
  //         this.canvas.add(clonedObj);
  //     }
  //     this._clipboard.top += 10;
  //     this._clipboard.left += 10;
  //     this.canvas.setActiveObject(clonedObj);
  //     this.canvas.requestRenderAll();
  // }

  hendelDelet = () => {
    this.canvas.remove(this.beforClickActiveObj);
    this.hideLineControl();
    this.hideTextControl();
    this.beforClickActiveObj = null;
  };

  render() {
    return (
      <div>
        <div id="textControl" style={{ position: "fixed", display: "none" }}>
          <div
            style={{
              width: "183px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              background: "rgba(1, 17, 61, 0.85)",
              borderRadius: "5px",
              zIndex: "999999",
              padding: "6px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#fff",
                borderRadius: "4px",
                height: "100%",
                border: "1px solid rgba(1, 17, 61, 0.65)",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  width: "25px",
                  textAlign: "center",
                  height: "100%",
                  borderRight: "1px solid rgba(1, 17, 61, 0.65)",
                  color: "#3B4568",
                  lineHeight: "1",
                }}
              >
                -
              </div>

              <input
                style={{
                  width: "60px",
                  padding: "0 10px",
                  border: "none",
                }}
                value={this.state.fontSize}
                onChange={this.fontSizeChange}
                onKeyDown={this.endedFontSizeChange}
              />

              <div
                style={{
                  fontSize: "18px",
                  width: "25px",
                  textAlign: "center",
                  height: "100%",
                  borderLeft: "1px solid rgba(1, 17, 61, 0.65)",
                  color: "#3B4568",
                  lineHeight: "1",
                }}
              >
                +
              </div>
            </div>
            <i
              className={styles.iconfont}
              style={{
                color: "#fff",
                fontSize: "20px",
                marginLeft: "20px",
              }}
              onClick={this.hendelDelet}
            >
              &#xea6b;
            </i>
          </div>
        </div>
        <div id="lineControl" style={{ position: "fixed", display: "none" }}>
          <div
            style={{
              width: "183px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              background: "rgba(1, 17, 61, 0.85)",
              borderRadius: "5px",
              zIndex: "999999",
              padding: "6px 10px",
            }}
          >
            <div
              style={{
                width: "80px",
                backgroundColor: "#fff",
                cursor: "pointer",
                height: "2px",
                border: "3px solid",
                boxSizing: "content-box",
                borderColor:
                  this.state.penWidth == 3
                    ? "#6080F1"
                    : "rgba(1, 17, 61, 0.85)",
              }}
              onClick={() => {
                this.penWidthChange(3);
              }}
            ></div>
            <div
              style={{
                width: "80px",
                backgroundColor: "#fff",
                marginLeft: "7px",
                cursor: "pointer",
                height: "3px",
                border: "3px solid",
                boxSizing: "content-box",
                borderColor:
                  this.state.penWidth == 6
                    ? "#6080F1"
                    : "rgba(1, 17, 61, 0.85)",
              }}
              onClick={() => {
                this.penWidthChange(6);
              }}
            ></div>
            <div
              style={{
                width: "80px",
                backgroundColor: "#fff",
                marginLeft: "7px",
                cursor: "pointer",
                height: "4px",
                boxSizing: "content-box",
                border: "3px solid",
                borderColor:
                  this.state.penWidth == 8
                    ? "#6080F1"
                    : "rgba(1, 17, 61, 0.85)",
              }}
              onClick={() => {
                this.penWidthChange(8);
              }}
            ></div>
            <i
              className={styles.iconfont}
              style={{
                color: "#fff",
                fontSize: "20px",
                marginLeft: "10px",
              }}
              onClick={this.hendelDelet}
            >
              &#xea6b;
            </i>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          {[
            {
              title: "文本",
              icon: (
                <i
                  style={{ fontSize: "18px", marginRight: "5px" }}
                  className={styles.iconfont}
                >
                  {" "}
                  &#xe8fa;
                </i>
              ),
              key: "textbox",
            },
            {
              title: "画笔",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "20px" }}>
                  &#xe88e;
                </i>
              ),
              key: "pen",
            },
            {
              title: "打上对勾",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "30px" }}>
                  &#xeaf1;
                </i>
              ),
              key: "tick",
            },
            {
              title: "打上叉号",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "30px" }}>
                  &#xe893;
                </i>
              ),
              key: "cross",
            },
            {
              title: "打上半对",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "30px" }}>
                  &#xe894;
                </i>
              ),
              key: "halfCorrect",
            },
            {
              title: "矩形",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "24px" }}>
                  &#xe8fb;
                </i>
              ),
              key: "rect",
            },
            {
              title: "框选",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "20px" }}>
                  &#xe719;
                </i>
              ),
              key: "select",
              popoverContent: null,
            },
          ].map((item) => {
            return (
              <div
                key={item.key}
                className={`${styles.noSelect} ${this.state.currentTool == item.key ? styles.active : null}`}
                onClick={() => {
                  if (
                    item.key == "tick" ||
                    item.key == "cross" ||
                    item.key == "halfCorrect"
                  ) {
                    this.addCheckmark(item.key);
                    this.saveState();
                  }
                  this.selectTool(item.key);
                }}
                style={{
                  marginLeft: "30px",
                  cursor: "pointer",
                  height: "20px",
                  lineHeight: "20px",
                }}
              >
                {item.icon || item.title}
              </div>
            );
          })}
          <div
            className={styles.noSelect}
            onClick={this.undo}
            style={{
              marginLeft: "30px",
              cursor: "pointer",
              height: "20px",
              lineHeight: "20px",
            }}
          >
            <i className={styles.iconfont} style={{ fontSize: "20px" }}>
              &#xe6a2;
            </i>
          </div>
        </div>
      </div>
    );
  }
}
export default PaperMarkTool;

import React, { PureComponent } from "react";
import { Popover, Select, Slider } from "antd";
import { fabric } from "fabric";

import styles from "./index.module.less";
const { Option } = Select;

var deleteImg = null;
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
      currentTool: "",
      left: 10,
      top: 10,
    };
  }

  componentDidMount() {
    this.props.ref && this.props.ref(this);
    const svg = `<svg t="1735547414626" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="25460" width="200" height="200"><path d="M928 224l-160 0L768 160c0-52.928-42.72-96-95.264-96L352 64C299.072 64 256 107.072 256 160l0 64L96 224C78.304 224 64 238.304 64 256s14.304 32 32 32l832 0c17.696 0 32-14.304 32-32S945.696 224 928 224z" p-id="25461"></path><path d="M800 352 224 352c-0.032 0 0.096 0 0.064 0-8.48 0-16.64 3.136-22.656 9.088C195.392 367.104 192 375.008 192 383.52L192 864c0 52.928 43.136 96 96.064 96l448.064 0C789.056 960 832 916.928 832 864L832 384C832 366.368 817.664 352.064 800 352zM448 800c0 17.696-14.304 32-32 32s-32-14.304-32-32L384 448c0-17.696 14.304-32 32-32s32 14.304 32 32L448 800zM640 800c0 17.696-14.304 32-32 32s-32-14.304-32-32L576 448c0-17.696 14.304-32 32-32s32 14.304 32 32L640 800z" p-id="25462"></path></svg>`;
    // Base64 转换
    const base64 = btoa(svg);
    const deleteIcon = `data:image/svg+xml;base64,${base64}`;
    deleteImg = document.createElement("img");
    deleteImg.src = deleteIcon;

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

  initializeFabricCanvas = (jsonData) => {
    const { canvasId } = this.props;
    if (canvasId) {
      this.canvas = new fabric.Canvas(canvasId, {
        selection: false,
      });
      // 添加全局自定义删除控件
      fabric.Object.prototype.controls.deleteControl = new fabric.Control({
        x: -0.3,
        y: 0.5,
        offsetY: 20,
        cursorStyleHandler: () => "pointer", // 鼠标样式
        mouseUpHandler: function (eventData, transform) {
          const canvas = transform.target.canvas; // 获取画布
          const target = transform.target; // 获取目标对象
          canvas.remove(target); // 从画布中移除目标
          return true;
        },
        render: function (context, left, top, styleOverride, fabricObject) {
          const size = 20; // 按钮尺寸
          context.save();
          context.translate(left, top); // 按钮位置
          context.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));
          context.drawImage(deleteImg, -size / 2, -size / 2, size, size); // 删除按钮图标
          context.restore();
        },
        // cornerSize: 24,
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

      // 选择
      this.canvas.on("selection:created", () => {
        this.handleSelection();
      });
      this.canvas.on("selection:updated", () => {
        this.handleSelection();
      });

      // 监听路径创建事件
      this.canvas.on("path:created", (event) => {
        console.log("path:created");

        if (!this.isUndoing) {
          this.saveState();
        }
        // const path = event.path; // 获取创建的路径
        // this.canvas.setActiveObject(path); // 设置路径为激活状态
        // this.canvas.renderAll(); // 重新渲染画布
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

        if (this.state.currentTool == "text") {
          if (clickedObject) {
            // 鼠标在画布上按下地方存在对象
            this.beforClickActiveObj = clickedObject;
            return;
          }
          if (this.beforClickActiveObj) {
            // 鼠标在画布上按下 且在本次按下之前存在选中对象
            this.beforClickActiveObj = null;
            return;
          }
          // 鼠标在画布上按下
          this.createTextBox(event);
        } else if (this.state.currentTool == "select") {
          // Select tool has no mousedown side effect here.
        } else if (this.state.currentTool == "pen") {
          // Pen tool has no mousedown side effect here.
        } else if (this.state.currentTool == "rect") {
          if (clickedObject) {
            // 鼠标在画布上按下地方存在对象
            this.beforClickActiveObj = clickedObject;
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

        if (
          this.beforClickActiveObj.width > 5 ||
          this.beforClickActiveObj.height > 5
        ) {
          this.saveState();
        } else {
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
    const left = pointer.x;
    const top = pointer.y;

    const textbox = new fabric.Textbox("", {
      left: left,
      top: top,
      fill: "#ff0000",
      strokeWidth: 1,
      stroke: "#ff0000",
      fontSize: this.state.fontSize,
    });
    textbox.controls.deleteControl = new fabric.Control({
      x: -0.3,
      y: 0.5,
      offsetY: 20,
      cursorStyleHandler: () => "pointer", // 鼠标样式
      mouseUpHandler: function (eventData, transform) {
        const canvas = transform.target.canvas; // 获取画布
        const target = transform.target; // 获取目标对象
        canvas.remove(target); // 从画布中移除目标
        return true;
      },
      render: function (context, left, top, styleOverride, fabricObject) {
        const size = 20; // 按钮尺寸
        context.save();
        context.translate(left, top); // 按钮位置
        context.rotate(fabric.util.degreesToRadians(fabricObject.angle || 0));
        context.drawImage(deleteImg, -size / 2, -size / 2, size, size); // 删除按钮图标
        context.restore();
      },
      // cornerSize: 30,
    });
    // 将新文本框添加到画布上
    this.canvas.add(textbox);

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
    if (tool == "text") {
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
      currentTool: "",
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
      currentTool: "",
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

  handleSelection = () => {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length > 1) {
      this.disableDeleteButton(); // 禁用删除按钮
    } else {
      this.enableDeleteButton(); // 启用删除按钮
    }
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

  handleVisibleChange = () => {};

  fontSizeChange = (value) => {
    const fontSize = Number.parseInt(value, 10);
    // 获取当前选中的所有对象
    const activeObjects = this.canvas.getActiveObjects();
    // 如果选中了文本框对象，批量修改字体大小
    for (const object of activeObjects) {
      if (object.type === "textbox") {
        object.set({ fontSize: fontSize });
      }
    }
    this.setState({
      fontSize: fontSize,
    });
    // 刷新画布显示
    this.canvas.renderAll();
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

  clear = () => {
    this.canvas.clear();
    this.stateStack = [];
    this.currentStateIndex = -1;
    this.saveState();
    this.setState({
      currentTool: "",
    });
    this.beforClickActiveObj = null;
  };

  copy = () => {
    // clone what are you copying since you
    // may want copy and paste on different moment.
    // and you do not want the changes happened
    // later to reflect on the copy.
    this.canvas
      .getActiveObject()
      .clone()
      .then((cloned) => {
        this._clipboard = cloned;
      });
  };

  paste = async () => {
    // clone again, so you can do multiple copies.
    const clonedObject = await this._clipboard.clone();
    this.canvas.discardActiveObject();
    clonedObject.set({
      left: clonedObject.left + 10,
      top: clonedObject.top + 10,
      evented: true,
    });
    if (clonedObject instanceof fabric.ActiveSelection) {
      // active selection needs a reference to the canvas.
      clonedObject.canvas = this.canvas;
      clonedObject.forEachObject((object) => {
        this.canvas.add(object);
      });
      // this should solve the unselectability
      clonedObject.setCoords();
    } else {
      this.canvas.add(clonedObject);
    }
    this._clipboard.top += 10;
    this._clipboard.left += 10;
    this.canvas.setActiveObject(clonedObject);
    this.canvas.requestRenderAll();
  };

  render() {
    return (
      <div>
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
              key: "text",
              popoverContent: (
                <div style={{ display: "flex" }}>
                  <Select
                    value={this.state.fontSize}
                    style={{ width: 120 }}
                    onChange={this.fontSizeChange}
                  >
                    {[8, 12, 16, 24, 36, 48, 60, 72].map((item) => (
                      <Option value={item}>{item}px</Option>
                    ))}
                  </Select>
                </div>
              ),
            },
            {
              title: "画笔",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "20px" }}>
                  &#xe88e;
                </i>
              ),
              key: "pen",
              popoverContent: (
                <div style={{ display: "flex" }}>
                  <div style={{ width: "130px" }}>
                    <Slider
                      min={3}
                      max={8}
                      value={this.state.penWidth}
                      onChange={(e) => {
                        this.penWidthChange(e);
                      }}
                    />
                  </div>
                </div>
              ),
            },
            {
              title: "打上对勾",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "30px" }}>
                  &#xeaf1;
                </i>
              ),
              key: "tick",
              popoverContent: (
                <div style={{ display: "flex" }}>
                  <div style={{ width: "130px" }}>
                    <Slider
                      min={3}
                      max={8}
                      onChange={(e) => {
                        this.penWidthChange(e);
                      }}
                    />
                  </div>
                </div>
              ),
            },
            {
              title: "打上叉号",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "30px" }}>
                  &#xe893;
                </i>
              ),
              key: "cross",
              popoverContent: (
                <div style={{ display: "flex" }}>
                  <div style={{ width: "130px" }}>
                    <Slider
                      min={3}
                      max={8}
                      onChange={(e) => {
                        this.penWidthChange(e);
                      }}
                    />
                  </div>
                </div>
              ),
            },
            {
              title: "打上半对",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "30px" }}>
                  &#xe894;
                </i>
              ),
              key: "halfCorrect",
              popoverContent: (
                <div style={{ display: "flex" }}>
                  <div style={{ width: "130px" }}>
                    <Slider
                      min={3}
                      max={8}
                      onChange={(e) => {
                        this.penWidthChange(e);
                      }}
                    />
                  </div>
                </div>
              ),
            },
            {
              title: "矩形",
              icon: (
                <i className={styles.iconfont} style={{ fontSize: "24px" }}>
                  &#xe8fb;
                </i>
              ),
              key: "rect",
              popoverContent: (
                <div style={{ display: "flex" }}>
                  <div style={{ width: "130px" }}>
                    <Slider
                      min={3}
                      max={8}
                      onChange={(e) => {
                        this.penWidthChange(e);
                      }}
                    />
                  </div>
                </div>
              ),
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
              <Popover
                content={item.popoverContent}
                trigger="click"
                visible={Boolean(
                  this.state.currentTool == item.key && item.popoverContent,
                )}
                onVisibleChange={this.handleVisibleChange}
                overlayClassName={styles.toolPropertiesContent}
              >
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
              </Popover>
            );
          })}
          {/* <div
                        className={styles.noSelect}
                        onClick={this.clear}
                        style={{ marginLeft: '30px', cursor: 'pointer', height: '20px', lineHeight: '20px' }}
                    >
                        <i className={styles.iconfont} style={{ fontSize: '26px' }}>&#xe890;</i>
                    </div> */}
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

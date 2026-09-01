import React, { createRef } from "react";
import { Input, Select } from "antd";
import { fabric } from "fabric";

import styles from "./index.module.less";
const { Option } = Select;

let selectedPosition = null;
class PaperMarkTool extends React.Component {
  constructor(properties) {
    super(properties);
    console.log("ChildComponent this:", this);

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
    this.myCanvaRef = createRef();
    this.myContainerRef = createRef();
    this.myLineControl = createRef();
    this.myTextControl = createRef();
    this.state = {
      fontSize: 32,
      left: 10,
      top: 10,
      penWidth: 3,
    };
  }
  componentDidUpdate(previousProperties) {
    // 判断 currentTool 是否发生变化
    if (previousProperties.currentTool !== this.props.currentTool) {
      this.handleToolChange();
    }
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
    let textControl = this.myTextControl.current;
    let canvasDom = this.myCanvaRef.current;
    let { x: x1, y: y1 } = canvasDom.getBoundingClientRect();

    textControl.style.display = "block";
    // 设置悬浮层的位置
    textControl.style.left = `${left}px`;
    textControl.style.top = `${top + 30}px`;
    // 显示悬浮层
    textControl.style.display = "block";
    // 保存第一次点击的位置
    selectedPosition = { x: left, y: top };
  };

  hideTextControl = () => {
    let textControl = this.myTextControl.current;
    // 隐藏悬浮层
    textControl.style.display = "none";
    // 保存第一次点击的位置
    selectedPosition = {};
  };

  showLineControl = (left, top) => {
    let lineControl = this.myLineControl.current;
    let canvasDom = this.myCanvaRef.current;
    let { x: x1, y: y1 } = canvasDom.getBoundingClientRect();
    lineControl.style.display = "block";
    // 设置悬浮层的位置
    lineControl.style.left = `${left}px`;
    lineControl.style.top = `${top + 30}px`;
    // 显示悬浮层
    lineControl.style.display = "block";
    // 保存第一次点击的位置
    selectedPosition = { x: left, y: top };
  };

  hideLineControl = () => {
    let lineControl = this.myLineControl.current;
    // 隐藏悬浮层
    lineControl.style.display = "none";
    // 保存第一次点击的位置
    selectedPosition = {};
  };

  initializeFabricCanvas = (jsonData) => {
    const containerElement = this.myContainerRef.current;
    const canvasElement = this.myCanvaRef.current;

    if (containerElement && canvasElement) {
      const { offsetWidth, offsetHeight } = containerElement;
      canvasElement.width = offsetWidth;
      canvasElement.height = offsetHeight;
    }

    this.canvas = new fabric.Canvas(this.myCanvaRef.current, {
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

    // 扩展 fabric.Object 的 toObject 方法，包含 customType 属性
    fabric.Object.prototype.toObject = (function (toObject) {
      return function (propertiesToInclude) {
        propertiesToInclude = propertiesToInclude
          ? [...propertiesToInclude, "customType"]
          : ["customType"];
        return toObject.call(this, propertiesToInclude);
      };
    })(fabric.Object.prototype.toObject);

    // 监听路径创建事件（只有画笔触发）
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

      if (!this.props.currentTool) {
        this.hideLineControl();
        this.hideTextControl();
        if (clickedObject) {
          // 鼠标在画布上按下地方存在对象
          this.beforClickActiveObj = clickedObject;

          // const { type, left, top, height, strokeWidth, customType } = clickedObject
          // if (type == 'path' || type == 'rect') {
          //     this.showLineControl(left, top + height)
          //     this.penWidthChange(strokeWidth)
          // } else if (type == "textbox" && customType == "score") {
          //     this.showTextControl(left, top + height)
          // } else {
          //     this.showTextControl(left, top + height)
          // }
        } else if (this.beforClickActiveObj) {
          // 鼠标在画布上按下 且在本次按下之前存在选中对象
          this.beforClickActiveObj = null;
        }
      } else if (this.props.currentTool == "textbox") {
        if (clickedObject) {
          this.hideLineControl();
          this.hideTextControl();

          // 鼠标在画布上按下地方存在对象
          this.beforClickActiveObj = clickedObject;

          // const { type, left, top, height, strokeWidth, customType } = clickedObject
          // if (type == 'path' || type == 'rect') {
          //     this.showLineControl(left, top + height)
          //     this.penWidthChange(strokeWidth)
          // } else if (type == 'textbox' && customType == 'normal') {
          //     this.showTextControl(left, top + height)
          // } else {
          //     this.showTextControl(left, top + height)
          // }
        } else if (this.beforClickActiveObj) {
          // 鼠标在画布上按下 且在本次按下之前存在选中对象
          this.beforClickActiveObj = null;
          this.hideLineControl();
          this.hideTextControl();
        } else {
          // 鼠标在画布上按下
          this.createTextBox(event);
        }
      } else if (this.props.currentTool == "pen") {
        // Pen tool has no mousedown side effect here.
      } else if (this.props.currentTool == "rect") {
        this.hideLineControl();
        this.hideTextControl();

        if (clickedObject) {
          // 鼠标在画布上按下地方存在对象
          this.beforClickActiveObj = clickedObject;

          // const { type, left, top, height, strokeWidth } = clickedObject
          // if (type == 'path' || type == 'rect') {
          //     this.showLineControl(left, top + height)
          //     this.penWidthChange(strokeWidth)
          // } else if (type == 'textbox') {
          //     this.showTextControl(left, top + height)
          // }
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
        this.props.currentTool == "tick" ||
        this.props.currentTool == "cross" ||
        this.props.currentTool == "halfCorrect"
      ) {
        this.hideLineControl();
        this.hideTextControl();
        if (clickedObject) {
          // 鼠标在画布上按下地方存在对象
          this.beforClickActiveObj = clickedObject;

          // const { type, left, top, height, strokeWidth } = clickedObject
          // if (type == 'path' || type == 'rect') {
          //     this.showLineControl(left, top + height)
          //     this.penWidthChange(strokeWidth)
          // } else if (type == 'textbox') {
          //     this.showTextControl(left, top + height)
          // }
        } else if (this.beforClickActiveObj) {
          // 鼠标在画布上按下 且在本次按下之前存在选中对象
          this.beforClickActiveObj = null;
        } else {
          console.log("绘制标注");
          let path = [];
          if (this.props.currentTool == "tick") {
            path = "M10 40 L30 60 L70 10";
          } else if (this.props.currentTool == "cross") {
            path = "M10 10 L70 70 M70 10 L10 70";
          } else if (this.props.currentTool == "halfCorrect") {
            path = "M10 40 L30 60 L70 10 M45 25 L65 40";
          }
          const pointer = this.canvas.getPointer(event.e);
          // 创建路径对象（对勾）
          const checkmark = new fabric.Path(path, {
            left: pointer.x,
            top: pointer.y,
            stroke: "#ff0000", // 对勾颜色
            strokeWidth: 3, // 对勾线条宽度
            fill: "", // 无填充色
            selectable: true, // 允许选择
            evented: true, // 允许交互
            hasRotatingPoint: false,
          });

          const { left, top, height } = checkmark;
          this.showLineControl(left, top + height);
          this.penWidthChange(3);

          // 将对勾添加到画布
          this.canvas.add(checkmark);
          // 设置为活动对象（可以立即调整或移动）
          this.canvas.setActiveObject(checkmark);
          this.beforClickActiveObj = checkmark;
          this.saveState();
        }
      } else if (this.props.currentTool == "scoreRemark") {
        this.hideLineControl();
        this.hideTextControl();

        if (clickedObject) {
          this.hideLineControl();
          this.hideTextControl();

          // 鼠标在画布上按下地方存在对象
          this.beforClickActiveObj = clickedObject;

          // const { type, left, top, height, strokeWidth } = clickedObject
          // if (type == 'path' || type == 'rect') {
          //     this.showLineControl(left, top + height)
          //     this.penWidthChange(strokeWidth)
          // } else if (type == 'textbox') {
          //     this.showTextControl(left, top + height)
          // }
        } else if (this.beforClickActiveObj) {
          // 鼠标在画布上按下 且在本次按下之前存在选中对象
          this.beforClickActiveObj = null;
          this.hideLineControl();
          this.hideTextControl();
        } else {
          this.props.canvasMouseDown((content) => {
            // 鼠标在画布上按下
            const pointer = this.canvas.getPointer(event.e); // 获取点击坐标
            // 创建一个文本对象，内容为followEl的文本
            const numberText = new fabric.Textbox(content, {
              left: pointer.x,
              top: pointer.y,
              fill: "#ff0000",
              strokeWidth: 1,
              stroke: "#ff0000",
              editable: false,
              fontSize: this.state.fontSize,
            });
            numberText.customType = "numberText";
            // 添加文本对象到画布上
            this.canvas.add(numberText);
            this.beforClickActiveObj = null;
            this.saveState();
          });
        }
      }
    });

    // 鼠标移动事件：动态调整矩形宽高
    this.canvas.on("mouse:move", (event) => {
      if (!this.isDrawing || this.props.currentTool !== "rect") return;

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
      console.log(this.beforClickActiveObj, "beforClickActiveObj");

      if (this.beforClickActiveObj) {
        const { type, left, top, height, strokeWidth } =
          this.beforClickActiveObj;
        if (type == "path" || type == "rect") {
          this.showLineControl(left, top + height);
          this.penWidthChange(strokeWidth);
        } else if (type == "textbox") {
          this.showTextControl(left, top + height);
        }
      }

      if (!this.isDrawing || this.props.currentTool !== "rect") return;
      // 移除临时矩形的可选状态
      this.beforClickActiveObj.set({ selectable: true, evented: true });
      this.canvas.setActiveObject(this.beforClickActiveObj);
      console.log(this.beforClickActiveObj, "beforClickActiveObj");

      if (
        this.beforClickActiveObj.width > 5 ||
        this.beforClickActiveObj.height > 5
      ) {
        this.saveState();
        const { left, top, height } = this.beforClickActiveObj;
        this.showLineControl(left, top + height);
        this.penWidthChange(3);
      } else {
        this.hideLineControl();
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
  };

  addText = (content, x, y) => {
    console.log(content);

    // 创建一个文本对象
    const numberText = new fabric.Textbox(content, {
      left: x - x / 2,
      top: y,
      fill: "#ff0000",
      strokeWidth: 1,
      stroke: "#ff0000",
      editable: false,
      fontSize: this.state.fontSize,
    });
    numberText.customType = "numberText";
    // 添加文本对象到画布上
    this.canvas.add(numberText);

    this.beforClickActiveObj = null;
    // 使用动画将 left 属性从 initialX 动画到目标 x 坐标
    let _this = this;

    numberText.animate(
      { left: x },
      {
        duration: 600, // 动画时间（毫秒）
        onChange: () => _this.canvas.renderAll(),
        easing: fabric.util.ease.easeOutExpo,
        onComplete: () => {
          console.log("动画完成");
        },
      },
    );
    this.saveState();
  };

  deleteSelectedObjects() {
    this.hideLineControl();
    this.hideTextControl();

    const activeObjects = this.canvas.getActiveObjects(); // 获取所有选中对象
    if (activeObjects.length > 0) {
      for (const activeObject of activeObjects) {
        // 删除分数文本，并将分数从props中移除
        if (activeObject.customType == "numberText") {
          this.props.deletQuestionScore &&
            this.props.deletQuestionScore(activeObject.text);
        }

        this.canvas.remove(activeObject); // 删除对象
      }
      this.canvas.discardActiveObject(); // 清除选中状态
      this.canvas.renderAll(); // 重新渲染画布
    }
  }

  // 创建文本框的方法
  createTextBox = (event, customType) => {
    const pointer = this.canvas.getPointer(event.e); // 获取点击位置

    const textbox = new fabric.Textbox("", {
      left: pointer.x,
      top: pointer.y,
      fill: "#ff0000",
      strokeWidth: 1,
      stroke: "#ff0000",
      fontSize: this.state.fontSize,
    });
    textbox.customType = customType ? customType : "normal";
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

  clearCanvas = () => {
    console.log("清空了");
    this.stateStack = [];
    this.currentStateIndex = -1;
    this.beforClickActiveObj = null;
    this.canvas.selection = false;
    this.canvas.isDrawingMode = false;
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

  // 删除所有 customType 为 'numberText' 的对象
  removeNumberText = () => {
    const objects = this.canvas?.getObjects(); // 获取画布上的所有对象
    if (objects)
      for (const object of objects) {
        if (object.customType === "numberText") {
          this.canvas.remove(object); // 从画布中移除该对象
        }
      }
    this.canvas?.renderAll(); // 刷新画布
  };

  disableDeleteButton = () => {
    fabric.Object.prototype.controls.deleteControl.visible = false; // 隐藏删除按钮
    this.canvas.renderAll(); // 刷新画布
  };

  enableDeleteButton = () => {
    fabric.Object.prototype.controls.deleteControl.visible = true; // 显示删除按钮
    this.canvas.renderAll(); // 刷新画布
  };

  // 加载标注数据并还原
  loadCanvas = (loadData) => {
    // 将加载的数据还原到画布
    // this.canvas.loadFromJSON(loadData, () => {
    //     this.canvas.renderAll(); // 重新渲染画布
    //     console.log('标注加载完成！');
    //     this.saveState()
    // });
    try {
      const { offsetWidth, offsetHeight } = this.myContainerRef.current;
      const parsed =
        typeof loadData === "string" ? JSON.parse(loadData) : loadData;

      const oldSize = parsed.canvasSize || {
        width: offsetWidth,
        height: offsetHeight,
      };
      const scaleX = offsetWidth / oldSize.width;
      const scaleY = offsetHeight / oldSize.height;

      fabric.util.enlivenObjects(parsed.objects, (objects) => {
        this.canvas.clear();
        for (const object of objects) {
          object.scaleX *= scaleX;
          object.scaleY *= scaleY;
          object.left *= scaleX;
          object.top *= scaleY;
          object.setCoords();
          this.canvas.add(object);
        }
        this.canvas.renderAll();
      });
    } catch (error) {
      console.error("加载画布失败:", error);
    }
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

  fontSizeChange = (type, e) => {
    if (type == "reduce") {
      this.setState(
        {
          fontSize: this.state.fontSize - 3,
        },
        () => {
          this.endedFontSizeChange({ key: "Enter" });
        },
      );
    } else if (type == "add") {
      this.setState(
        {
          fontSize: this.state.fontSize + 3,
        },
        () => {
          this.endedFontSizeChange({ key: "Enter" });
        },
      );
    } else {
      const { value } = e.target;
      console.log(value, "value");
      let fontSize = "";
      if (value) {
        fontSize = Number.parseInt(value, 10);
        this.setState({
          fontSize: fontSize,
        });
      }
    }
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

  handleToolChange = () => {
    if (this.props.currentTool == "textbox") {
      console.log("切换到文本工具");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    } else if (this.props.currentTool == "select") {
      console.log("切换到框选工具");
      this.canvas.selection = true;
      this.canvas.isDrawingMode = false;
    } else if (this.props.currentTool == "pen") {
      console.log("切换到画笔工具");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = true; // 使用户可以进行自由绘制。
      this.canvas.freeDrawingBrush.color = "#ff0000";
      this.canvas.freeDrawingBrush.width = 3;
      this.beforClickActiveObj = null;
    } else if (this.props.currentTool == "tick") {
      console.log("切换到对勾");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    } else if (this.props.currentTool == "cross") {
      console.log("切换到叉号");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    } else if (this.props.currentTool == "halfCorrect") {
      console.log("切换到半对");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    } else if (this.props.currentTool == "rect") {
      console.log("切换到矩形工具");
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    } else if (this.props.currentTool == "scoreRemark") {
      this.canvas.selection = false;
      this.canvas.isDrawingMode = false;
    }

    // 更新页面用的
    this.setState({
      index: this.state.index + 1,
    });
  };

  resetTool = () => {
    this.canvas.selection = false;
    this.canvas.isDrawingMode = false;
  };

  penWidthChange = (e) => {
    this.setState({
      penWidth: e,
    });
    this.canvas.freeDrawingBrush.width = Number.parseInt(e, 10);
    // 获取当前选中的所有对象
    const activeObjects = this.canvas.getActiveObjects();
    console.log(this.myContainerRef.current, "myContainerRef1");

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

  hendelDelet = () => {
    this.canvas.remove(this.beforClickActiveObj);
    this.hideLineControl();
    this.hideTextControl();
    if (this.beforClickActiveObj.customType == "numberText") {
      this.props.deletQuestionScore &&
        this.props.deletQuestionScore(this.beforClickActiveObj.text);
    }
    console.log(this.beforClickActiveObj);

    this.beforClickActiveObj = null;
  };

  render() {
    return (
      <div>
        <div
          ref={this.myTextControl}
          style={{
            position: "absolute",
            display: "none",
            zIndex: "999999",
          }}
        >
          <div
            style={{
              width: "183px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              background: "rgba(1, 17, 61, 0.85)",
              borderRadius: "5px",
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
                onClick={() => {
                  this.fontSizeChange("reduce");
                }}
                style={{
                  fontSize: "18px",
                  width: "25px",
                  textAlign: "center",
                  height: "100%",
                  borderRight: "1px solid rgba(1, 17, 61, 0.65)",
                  color: "#3B4568",
                  lineHeight: "1",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                -
              </div>

              <Input
                style={{
                  width: "46px",
                  padding: "0 10px",
                  height: "100%",
                  border: "none",
                  color: "#01113D",
                }}
                placeholder="size"
                value={this.state.fontSize}
                onChange={(e) => {
                  this.fontSizeChange("put", e);
                }}
                onKeyDown={this.endedFontSizeChange}
              />
              <div style={{ fontSize: "13px", padding: "0 3px" }}>.PX</div>
              <div
                onClick={() => {
                  this.fontSizeChange("add");
                }}
                style={{
                  fontSize: "18px",
                  width: "25px",
                  textAlign: "center",
                  height: "100%",
                  borderLeft: "1px solid rgba(1, 17, 61, 0.65)",
                  color: "#3B4568",
                  lineHeight: "1",
                  cursor: "pointer",
                  userSelect: "none",
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
                marginLeft: "8px",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={this.hendelDelet}
            >
              &#xea6b;
            </i>
          </div>
        </div>

        <div
          ref={this.myLineControl}
          style={{
            position: "absolute",
            display: "none",
            zIndex: "999999",
          }}
        >
          <div
            style={{
              width: "183px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              background: "rgba(1, 17, 61, 0.85)",
              borderRadius: "5px",
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
          ref={this.myContainerRef}
          style={{
            position: "absolute",
            left: "0",
            top: "0",
            width: "100%",
            height: "100%",
          }}
        >
          <canvas
            className={styles.annotationCanvas}
            ref={this.myCanvaRef}
          ></canvas>
        </div>
      </div>
    );
  }
}
export default PaperMarkTool;

import React, { PureComponent } from "react";

import { throttle } from "../../utils/utils";

import styles from "./index.module.less";
class Directory extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      activeId: "",
    };
    this.disableScrollHighlight = false;
  }

  componentDidMount() {
    this.tryBindScroll();
  }

  componentWillUnmount() {
    this.unbindScroll(this.props.scrollContainer);
  }

  componentDidUpdate(previousProperties) {
    if (previousProperties.scrollContainer !== this.props.scrollContainer) {
      this.unbindScroll(previousProperties.scrollContainer);
      this.tryBindScroll();
    }

    if (previousProperties.items !== this.props.items) {
      this.setState({
        activeId: this.props.items[0]?.targetId || "",
      });
    }
  }

  tryBindScroll = () => {
    const { scrollContainer } = this.props;
    if (scrollContainer && scrollContainer.addEventListener) {
      scrollContainer.addEventListener(
        "scroll",
        throttle(this.handleScroll, 200),
        { passive: true },
      );
    }
  };

  unbindScroll = (container) => {
    if (container && container.removeEventListener) {
      container.removeEventListener("scroll", this.handleScroll);
    }
  };

  handleScroll = () => {
    if (this.disableScrollHighlight) return;

    const { items, scrollContainer } = this.props;
    if (!scrollContainer) return;

    const containerRect = scrollContainer.getBoundingClientRect();
    let currentId = "";

    for (const item of items) {
      const element = document.getElementById(item.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;

        if (relativeTop <= 100) {
          currentId = item.targetId;
        }
      }
    }

    if (currentId && currentId !== this.state.activeId) {
      this.setState({ activeId: currentId });
    }
  };

  scrollTo = (id) => {
    this.disableScrollHighlight = true;
    this.setState({ activeId: id });
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // 恢复滚动监听高亮（延迟可调）
    clearTimeout(this.reenableTimer);
    this.reenableTimer = setTimeout(() => {
      this.disableScrollHighlight = false;
    }, 500);
  };

  render() {
    const { items, name } = this.props;
    const { activeId } = this.state;
    return (
      <div className={styles.directory}>
        <div className={styles.elevatorTitle}>
          {name || trans("global.viewList", "看板目录")}
        </div>
        <div>
          {items.map((item) => {
            return (
              <div
                className={`${styles.elevatorListItem} ${item.targetId == activeId ? styles.active : ""}`}
                key={item.title}
                onClick={() => this.scrollTo(item.targetId)}
              >
                {item.title}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
export default Directory;

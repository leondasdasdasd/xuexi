import type { CSSProperties } from "react";

import { trans } from "../../utils/i18n";

type CheckStatus = {
  label: string;
  value: string;
};

const checkStatuses: CheckStatus[] = [
  {
    label: trans("hiddenCheck.statusLabel", "Status / 状态"),
    value: "Ready / 就绪",
  },
  {
    label: trans("hiddenCheck.accessLabel", "Access / 访问"),
    value: "Hidden / 隐藏",
  },
];

const styles = {
  item: {
    alignItems: "center",
    borderBottom: "1px solid #e6e7ec",
    display: "flex",
    justifyContent: "space-between",
    padding: "0.75rem 0",
  },
  label: {
    color: "rgba(1, 17, 61, 0.62)",
  },
  page: {
    background: "#fff",
    color: "#01113d",
    minHeight: "100vh",
    padding: "2rem",
  },
  panel: {
    border: "1px solid #e6e7ec",
    borderRadius: "0.5rem",
    maxWidth: "42rem",
    padding: "1.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
    margin: "0 0 0.5rem",
  },
  value: {
    fontWeight: 600,
  },
} satisfies Record<string, CSSProperties>;

const HiddenCheck = () => (
  <main style={styles.page}>
    <section style={styles.panel}>
      <h1 style={styles.title}>
        {trans("hiddenCheck.title", "Status Check / 状态检查")}
      </h1>
      <p>
        {trans(
          "hiddenCheck.directRouteDescription",
          "This page is available by direct route. 此页面通过直接路由访问。",
        )}
      </p>
      <div aria-label="Status check">
        {checkStatuses.map(({ label, value }) => (
          <div key={label} style={styles.item}>
            <span style={styles.label}>{label}</span>
            <strong style={styles.value}>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  </main>
);

export default HiddenCheck;

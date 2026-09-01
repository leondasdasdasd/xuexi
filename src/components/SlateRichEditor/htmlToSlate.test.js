import { deserializeHtml } from "./htmlToSlate";

const getListItemText = (listItem) =>
  (listItem.children || []).map((child) => child.text || "").join("");

describe("SlateRichEditor htmlToSlate", () => {
  it("preserves paragraph-wrapped list item text from pasted question HTML", () => {
    const html = `<ol style="box-sizing: border-box; margin: 0px 0px 0.75rem; color: rgb(58, 69, 99); font-family: -apple-system, &quot;system-ui&quot;, &quot;Segoe UI&quot;, &quot;PingFang SC&quot;, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, &quot;Helvetica Neue&quot;, Helvetica, Arial, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;"><li style="box-sizing: border-box;"><p style="box-sizing: border-box; margin: 0px; padding: 0px;">截至 2025 年 1 月，电影《疯狂动物城 2》累计票房达四十亿零八十万四千五百元，横线上的数写作（）；这是一个（）位数；它的最高位是（）位；省略亿位后面的尾数约是（）亿。</p></li><li style="box-sizing: border-box;"><p style="box-sizing: border-box; margin: 0px; padding: 0px;">在横线里填上“＞”“＜”或“</p></li></ol>`;

    const [numberedList] = deserializeHtml(html);

    expect(numberedList.type).toBe("numbered-list");
    expect(numberedList.children).toHaveLength(2);
    expect(getListItemText(numberedList.children[0])).toBe(
      "截至 2025 年 1 月，电影《疯狂动物城 2》累计票房达四十亿零八十万四千五百元，横线上的数写作（）；这是一个（）位数；它的最高位是（）位；省略亿位后面的尾数约是（）亿。",
    );
    expect(getListItemText(numberedList.children[1])).toBe(
      "在横线里填上“＞”“＜”或“",
    );
  });

  it("keeps direct text children in list items", () => {
    const [numberedList] = deserializeHtml("<ol><li>第一题</li></ol>");

    expect(numberedList).toEqual({
      children: [
        {
          children: [{ text: "第一题" }],
          type: "list-item",
        },
      ],
      type: "numbered-list",
    });
  });

  it("keeps top-level text and formula images in the same paragraph", () => {
    const formulaHtml =
      '<img src="https://example.com/formula.png?mathUrl=A" alt="A">';
    const [paragraph] = deserializeHtml(`点 ${formulaHtml}, B 都在格点上`);

    expect(paragraph.type).toBe("paragraph");
    expect(paragraph.children).toEqual([
      { text: "点 " },
      {
        children: [{ text: "" }],
        latex: "A",
        src: "https://example.com/formula.png?mathUrl=A",
        type: "formula",
      },
      { text: "" },
      { text: ", B 都在格点上" },
    ]);
  });
});

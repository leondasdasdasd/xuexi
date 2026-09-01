declare module "postcss-prefix-selector" {
  import type { Plugin } from "postcss";

  type PrefixSelectorOptions = Readonly<{
    prefix: string;
    transform?: (
      prefix: string,
      selector: string,
      prefixedSelector: string,
      filePath: string,
    ) => string;
  }>;

  export default function prefixSelector(
    options: PrefixSelectorOptions,
  ): Plugin;
}

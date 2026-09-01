import fs from "node:fs/promises";

const DEFAULT_MAX_LINES = 800;
const COMMENT_START = "/*";
const COMMENT_END = "*/";

const normalizeArguments = (rawArguments) => {
  const files = [];
  let max = DEFAULT_MAX_LINES;

  for (let index = 0; index < rawArguments.length; index += 1) {
    const argument = rawArguments[index];

    if (argument === "--max") {
      max = Number(rawArguments[index + 1] || DEFAULT_MAX_LINES);
      index += 1;
      continue;
    }

    files.push(argument);
  }

  return {
    files,
    max,
  };
};

const countEffectiveLines = (source) => {
  let isInsideBlockComment = false;

  return source.split("\n").reduce((count, line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return count;
    }

    if (isInsideBlockComment) {
      if (trimmedLine.includes(COMMENT_END)) {
        isInsideBlockComment = false;
      }

      return count;
    }

    if (trimmedLine.startsWith("//")) {
      return count;
    }

    if (trimmedLine.startsWith(COMMENT_START)) {
      if (!trimmedLine.includes(COMMENT_END)) {
        isInsideBlockComment = true;
      }

      return count;
    }

    return count + 1;
  }, 0);
};

const main = async () => {
  const { files, max } = normalizeArguments(process.argv.slice(2));
  const failures = [];

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");
    const lineCount = countEffectiveLines(source);

    if (lineCount > max) {
      failures.push({ filePath, lineCount });
    }
  }

  if (failures.length === 0) {
    return;
  }

  for (const { filePath, lineCount } of failures) {
    console.error(
      `${filePath} exceeds the max line limit (${lineCount}/${max}). Split the file by responsibility instead of mechanically trimming it.`,
    );
  }

  process.exitCode = 1;
};

await main();

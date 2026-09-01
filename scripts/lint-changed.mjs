import { spawnSync } from "node:child_process";

const getGitFiles = (repositoryRoot, fixedArguments) => {
  const result = spawnSync("git", fixedArguments, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  return {
    files: result.stdout
      .split("\n")
      .map((filePath) => filePath.trim())
      .filter(Boolean),
    status: result.status || 0,
  };
};

const getChangedFiles = (repositoryRoot = process.cwd()) => {
  const tracked = getGitFiles(repositoryRoot, [
    "diff",
    "--name-only",
    "--diff-filter=ACMR",
    "HEAD",
  ]);
  const untracked = getGitFiles(repositoryRoot, [
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);

  return {
    files: [...new Set([...tracked.files, ...untracked.files])],
    status: tracked.status || untracked.status,
  };
};

const runCommand = (command, fixedArguments, files) => {
  if (files.length === 0) {
    return 0;
  }

  const result = spawnSync(command, [...fixedArguments, ...files], {
    stdio: "inherit",
  });

  return result.status || 0;
};

const byExtension = (files, pattern) =>
  files.filter((filePath) => pattern.test(filePath));

const ESLINT_DISABLED_FILES = new Set(["src/i18n/en.js", "src/i18n/zh-CN.js"]);

const changedFilesResult = getChangedFiles();
const changedFiles = changedFilesResult.files;
const scriptFiles = byExtension(
  changedFiles,
  /\.(?:js|jsx|ts|tsx|mjs|cjs)$/,
).filter((filePath) => !ESLINT_DISABLED_FILES.has(filePath));
const tsFiles = byExtension(changedFiles, /\.(?:ts|tsx)$/);
const styleFiles = byExtension(changedFiles, /\.(?:css|less)$/);
const documentFiles = byExtension(changedFiles, /\.(?:json|md)$/);

process.exitCode =
  changedFilesResult.status ||
  [
    runCommand("eslint", ["--fix"], scriptFiles),
    runCommand(
      "node",
      ["scripts/check-max-lines.mjs", "--max", "800"],
      styleFiles,
    ),
    runCommand("stylelint", ["--fix"], styleFiles),
    runCommand("prettier", ["--write"], styleFiles),
    runCommand("prettier", ["--write"], documentFiles),
    runCommand("prettier", ["--write"], scriptFiles),
    runCommand("tsc-files", ["-p", "tsconfig.json", "--noEmit"], tsFiles),
  ].find((status) => status !== 0) ||
  0;

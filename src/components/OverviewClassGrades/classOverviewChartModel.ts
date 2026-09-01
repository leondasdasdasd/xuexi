export type ClassOverviewSourceRow = {
  avgScore?: unknown;
  boxplot?: unknown;
  courseTeacherNames?: unknown;
  gradeAndGroupEnName?: unknown;
  gradeAndGroupName?: unknown;
  lowRate?: unknown;
  maxScore?: unknown;
  minScore?: unknown;
  outstandingRate?: unknown;
  passRate?: unknown;
};

type ChartRow = {
  className: string;
  classScore: number;
  courseTeacherNames: string | null;
};

type NamedChartRow = ChartRow & { scoreName: string };

type NamedMetric = {
  label: string;
  normalize: (value: unknown) => number | null;
  value: (row: ClassOverviewSourceRow) => unknown;
};

type BoxPlotSource = {
  max?: unknown;
  min?: unknown;
  outlierHigh?: unknown;
  outlierLow?: unknown;
  q1?: unknown;
  q2?: unknown;
  q3?: unknown;
};

export type BoxPlotChartRow = {
  className: string;
  classNameEn: string;
  courseTeacherNames: string | null;
  outlierHigh: number[];
  outlierLow: number[];
  values: [number, number, number, number, number];
};

export type ClassOverviewBenchmark = {
  averageScore: number | null;
  lowRate: number | null;
  maximumScore: number | null;
  minimumScore: number | null;
  outstandingRate: number | null;
  passRate: number | null;
};

type ReleasableChart = {
  destroy?: () => void;
  dispose?: () => void;
  downloadImage?: (name: string) => void;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "boolean"
  ) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toPercentageNumber = (value: unknown): number | null => {
  if (typeof value === "string") {
    return toFiniteNumber(value.trim().replace(/%$/, ""));
  }
  return toFiniteNumber(value);
};

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const teacherNames = (value: unknown): string | null =>
  Array.isArray(value) && value.length > 0
    ? value.filter((item): item is string => typeof item === "string").join(" ")
    : null;

const finiteNumbers = (value: unknown): number[] =>
  Array.isArray(value)
    ? value
        .map((item) => toFiniteNumber(item))
        .filter((item): item is number => item !== null)
    : [];

const sourceRows = (
  rows: ClassOverviewSourceRow[],
): ClassOverviewSourceRow[] => (Array.isArray(rows) ? rows : []);

const classRows = (rows: ClassOverviewSourceRow[]): ClassOverviewSourceRow[] =>
  sourceRows(rows).slice(1);

// 将后端首行的全年级数据转换为明确、稳定的图表基准。
export const buildClassOverviewBenchmark = (
  rows: ClassOverviewSourceRow[],
): ClassOverviewBenchmark => {
  const grade = sourceRows(rows)[0];
  return {
    averageScore: toFiniteNumber(grade?.avgScore),
    lowRate: toPercentageNumber(grade?.lowRate),
    maximumScore: toFiniteNumber(grade?.maxScore),
    minimumScore: toFiniteNumber(grade?.minScore),
    outstandingRate: toPercentageNumber(grade?.outstandingRate),
    passRate: toPercentageNumber(grade?.passRate),
  };
};

export const buildAverageChartRows = (
  rows: ClassOverviewSourceRow[],
): ChartRow[] =>
  classRows(rows).flatMap((row) => {
    const classScore = toFiniteNumber(row.avgScore);
    return classScore === null
      ? []
      : [
          {
            className: text(row.gradeAndGroupName),
            classScore,
            courseTeacherNames: teacherNames(row.courseTeacherNames),
          },
        ];
  });

const buildNamedChartRows = (
  rows: ClassOverviewSourceRow[],
  metrics: NamedMetric[],
): NamedChartRow[] =>
  classRows(rows).flatMap((row) =>
    metrics.flatMap((metric) => {
      const classScore = metric.normalize(metric.value(row));
      return classScore === null
        ? []
        : [
            {
              className: text(row.gradeAndGroupName),
              classScore,
              courseTeacherNames: teacherNames(row.courseTeacherNames),
              scoreName: metric.label,
            },
          ];
    }),
  );

export const buildTripleChartRows = (
  rows: ClassOverviewSourceRow[],
  labels: [string, string, string],
): NamedChartRow[] =>
  buildNamedChartRows(rows, [
    {
      label: labels[0],
      normalize: toFiniteNumber,
      value: (row) => row.avgScore,
    },
    {
      label: labels[1],
      normalize: toFiniteNumber,
      value: (row) => row.maxScore,
    },
    {
      label: labels[2],
      normalize: toFiniteNumber,
      value: (row) => row.minScore,
    },
  ]);

export const buildRateChartRows = (
  rows: ClassOverviewSourceRow[],
  labels: [string, string, string],
): NamedChartRow[] =>
  buildNamedChartRows(rows, [
    {
      label: labels[0],
      normalize: toPercentageNumber,
      value: (row) => row.outstandingRate,
    },
    {
      label: labels[1],
      normalize: toPercentageNumber,
      value: (row) => row.passRate,
    },
    {
      label: labels[2],
      normalize: toPercentageNumber,
      value: (row) => row.lowRate,
    },
  ]);

export const buildBoxPlotRows = (
  rows: ClassOverviewSourceRow[],
): BoxPlotChartRow[] =>
  sourceRows(rows).flatMap((row) => {
    if (!row.boxplot || typeof row.boxplot !== "object") return [];
    const source = row.boxplot as BoxPlotSource;
    const values = [
      source.min,
      source.q1,
      source.q2,
      source.q3,
      source.max,
    ].map((value) => toFiniteNumber(value));
    if (values.includes(null)) return [];
    return [
      {
        className: text(row.gradeAndGroupName),
        classNameEn: text(row.gradeAndGroupEnName),
        courseTeacherNames: teacherNames(row.courseTeacherNames),
        outlierHigh: finiteNumbers(source.outlierHigh),
        outlierLow: finiteNumbers(source.outlierLow),
        values: values as [number, number, number, number, number],
      },
    ];
  });

export const legacyG2TooltipOptions = (
  options: Record<string, unknown> = {},
): Record<string, unknown> => ({ ...options, crosshairs: false });

/** 集中管理班级成绩图表实例，切换视图时释放 canvas 和事件监听。 */
export class ClassOverviewChartRegistry {
  private readonly charts = new Map<string, ReleasableChart>();

  download(key: string, fileName: string): boolean {
    const chart = this.charts.get(key);
    if (!chart || typeof chart.downloadImage !== "function") return false;
    chart.downloadImage(fileName);
    return true;
  }

  replace(key: string, chart: ReleasableChart): void {
    this.destroy(key);
    this.charts.set(key, chart);
  }

  destroy(key: string): void {
    const chart = this.charts.get(key);
    if (!chart) return;
    if (typeof chart.destroy === "function") chart.destroy();
    else if (typeof chart.dispose === "function") chart.dispose();
    this.charts.delete(key);
  }

  destroyAll(): void {
    for (const key of this.charts.keys()) this.destroy(key);
  }
}

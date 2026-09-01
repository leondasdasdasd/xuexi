export interface PaperStructureQuestionView {
  key: string;
  number: number;
}

export interface PaperStructureModuleView {
  key: string;
  name: string;
  order: number;
  questionCount: number;
  questions: PaperStructureQuestionView[];
  score: string;
}

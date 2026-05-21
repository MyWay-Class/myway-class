export type ClipSuggestion = {
  lecture_id: string;
  lecture_title: string;
  start_time_ms: number;
  end_time_ms: number;
  label: string;
  description: string;
};

export type WizardStep = 1 | 2 | 3;

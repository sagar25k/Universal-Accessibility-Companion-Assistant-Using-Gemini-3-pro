export enum AppMode {
  DESCRIBE = 'DESCRIBE',
  SIMPLIFY = 'SIMPLIFY',
  GUIDE = 'GUIDE'
}

export interface AnalysisRequest {
  text: string;
  imageBase64?: string;
  imageMimeType?: string;
  mode: AppMode;
}

export interface AnalysisResponse {
  markdown: string;
  error?: string;
}

export interface ModeConfig {
  id: AppMode;
  title: string;
  description: string;
  icon: string;
  ariaLabel: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: AppMode;
  inputText: string;
  response: string;
  hasImage: boolean;
}
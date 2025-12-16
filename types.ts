export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface RiskAnalysis {
  overallScore: number; // 0-100
  verdict: 'Yüksek Risk' | 'Orta Risk' | 'Düşük Risk' | 'Yayına Hazır';
  details: {
    criterion: string;
    score: number; // 1-10
    feedback: string;
  }[];
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isLoading?: boolean;
  isError?: boolean;
  // If the model suggests a full document rewrite, we store it here
  suggestedContent?: string;
  // If the model performs a risk analysis, we store the data here
  riskAnalysis?: RiskAnalysis;
}

export interface AgentContext {
  currentDocument: string;
  attachedFiles: FileData[];
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64
}

export type AgentMode = 'general' | 'apa-checker' | 'reviewer' | 'data-analyst';
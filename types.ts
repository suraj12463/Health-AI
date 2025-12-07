
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

// Structured Data Interfaces
export interface KeyFinding {
  label: string;
  value: string;
}

export interface RiskFactor {
  category: string;
  factor: string;
  explanation: string;
}

export interface NextStep {
  action: string;
  description: string;
  dosage?: string;
  frequency?: string;
  warning?: string;
  interactions?: string;
  sideEffects?: string;
}

export interface AnalysisSchema {
  confidenceScore: 'Low' | 'Medium' | 'High';
  confidenceReason: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  riskFactors: RiskFactor[];
  keyFindings: KeyFinding[];
  earlyWarningAlerts: string; // "None" or the alert text
  clinicalInterpretation: string;
  simplifiedExplanation: string;
  suggestedNextSteps: NextStep[];
}

export interface MedicalAnalysisResult {
  // We keep text for backward compatibility in Chat, but the UI uses the structured data
  text: string; 
  structuredData: AnalysisSchema;
  groundingChunks: GroundingChunk[];
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: MedicalAnalysisResult | null;
}

export enum FileType {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  NONE = 'NONE'
}

export interface UploadedFile {
  data: string; // base64
  mimeType: string;
  type: FileType;
  previewUrl: string;
}

export interface SavedAnalysis {
  id: string;
  timestamp: number;
  dateLabel: string;
  riskLevel: string;
  summary: string;
  result: MedicalAnalysisResult;
}

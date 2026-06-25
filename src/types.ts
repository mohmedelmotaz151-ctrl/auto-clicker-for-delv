export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ConditionOperator = '>' | '<' | '==' | '>=' | '<=';

export interface AutomationSettings {
  operator: ConditionOperator;
  thresholdValue: number;
  clickX: number;
  clickY: number;
  cropRegion: CropRegion;
  intervalMs: number; // Interval for OCR in ms
}

export interface OcrLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  extractedText?: string;
  extractedNumber?: number;
}

export interface AndroidConfig {
  packageName: string;
  appName: string;
  serviceName: string;
  overlayTitle: string;
}

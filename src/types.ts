export interface AnalysisStep {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'UNKNOWN';
  value: string; // The data found (e.g., "1.85 Odds", "1.6 Avg Goals")
  threshold: string; // The rule required (e.g., "1.60 - 3.00")
  details: string; // Explanation
}

export interface MatchAnalysis {
  matchName: string;
  selectedTeam: string;
  predictionTarget: string; // e.g., "Home Team Over 0.5 Goals"
  
  step1_OddsFilter: AnalysisStep;
  step2_OffensivePower: AnalysisStep;
  step3_DefensiveWeakness: AnalysisStep;
  
  finalVerdict: {
    eligible: boolean;
    confidenceScore: number; // 0-100
    reasoning: string;
  };
}

export interface AnalysisResult {
  matches: MatchAnalysis[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
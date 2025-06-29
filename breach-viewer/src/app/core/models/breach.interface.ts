export interface Breach {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  modifiedDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
  isFabricated: boolean;
  isSensitive: boolean;
  isRetired: boolean;
  isSpamList: boolean;
  isMalware: boolean;
  logoPath: string;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface BreachFilterState {
  dateRange: DateRangeParams;
  loading: boolean;
  error: string | null;
}

export enum RiskLevel {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}

export interface AiRiskSummary {
  breachName: string;
  riskLevel: RiskLevel;
  executiveSummary: string;
  businessImpact: string;
  recommendedActions: string[];
  industryContext: string;
  generatedAt: string;
  isFromCache: boolean;
}
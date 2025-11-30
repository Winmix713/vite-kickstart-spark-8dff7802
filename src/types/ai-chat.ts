// AI Chat types for OpenAI GPT-4 + RAG integration

export type ChatRole = 'user' | 'assistant';
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  metadata?: {
    teams?: {
      home: string;
      away: string;
    };
    league?: string;
    matchData?: Record<string, unknown>;
    patterns?: Pattern[];
    prediction?: PredictionData;
  };
}
export interface Pattern {
  type: string;
  confidence: number;
  description: string;
  data?: Record<string, unknown>;
}
export interface PredictionData {
  outcome: 'home_win' | 'draw' | 'away_win';
  confidence: number;
  keyFactors: string[];
}
export interface TeamPair {
  home: string;
  away: string;
}
export interface MatchAnalysisData {
  teams: TeamPair;
  homeTeamId?: string;
  awayTeamId?: string;
  league?: string;
  recentForm?: {
    home: number;
    away: number;
  };
  h2hHistory?: Array<{
    homeScore: number;
    awayScore: number;
    date: string;
  }>;
  patterns?: Pattern[];
  prediction?: {
    outcome: 'home_win' | 'draw' | 'away_win';
    confidence: number;
    factors?: string[];
  };
  statistics?: {
    homeTeam?: Record<string, number>;
    awayTeam?: Record<string, number>;
  };
}
export interface AIChatRequest {
  message: string;
  context?: {
    league?: string;
    dateRange?: {
      from: string;
      to: string;
    };
    userId?: string;
  };
  conversationHistory?: ChatMessage[];
}
export interface AIChatResponse {
  success: boolean;
  message?: string;
  analysis?: MatchAnalysisData;
  error?: string;
  metadata?: {
    responseTime: number;
    tokensUsed?: number;
    model?: string;
  };
}
export interface RAGContext {
  teams: {
    id: string;
    name: string;
    league: string;
    statistics: Record<string, unknown>;
  }[];
  matches: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    date: string;
    league: string;
  }>;
  patterns: Array<{
    templateName: string;
    confidence: number;
    teams: string[];
    metrics: Record<string, unknown>;
  }>;
}
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
export interface EmbeddingResult {
  text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}
export interface VectorSearchResult {
  id: string;
  text: string;
  similarity: number;
  metadata: Record<string, unknown>;
}
export type TechnicalSignal =
  | "Bullish momentum"
  | "Neutral consolidation"
  | "Possible support test"
  | "High volatility"
  | "Trend confirmation"
  | "Breakout watch";

export type TechnicalIndicators = {
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  rsi14: number;
  macd: string;
  atr: number;
  bollingerBands: string;
  volumeTrend: string;
  support: number;
  resistance: number;
  signal: TechnicalSignal;
};

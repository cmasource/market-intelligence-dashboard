export type Timeframe = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y";

export type OHLCVPoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type ChartSeriesData = {
  symbol: string;
  timeframe: Timeframe;
  candles: OHLCVPoint[];
  volume: Array<Pick<OHLCVPoint, "time" | "volume">>;
};

export type TodayMarket = "international" | "argentina" | "crypto";
export type MarketSessionStatus = "open" | "preopen" | "afterhours" | "holiday" | "weekend" | "continuous";

export type TodayMarketSession = {
  market: TodayMarket;
  status: MarketSessionStatus;
  statusLabel: string;
  detail: string;
  marketDate: string;
  previousSessionDate: string;
  nextSessionDate: string;
  isTradingDay: boolean;
  isOpen: boolean;
};

export type TodayMarketSessions = Record<TodayMarket, TodayMarketSession>;

type Language = "en" | "es";
type DateParts = { year: number; month: number; day: number; hour: number; minute: number };

const MARKET_CONFIG = {
  international: { timeZone: "America/New_York", openMinutes: 9 * 60 + 30, closeMinutes: 16 * 60 },
  argentina: { timeZone: "America/Argentina/Buenos_Aires", openMinutes: 11 * 60, closeMinutes: 17 * 60 },
} as const;

function zonedParts(now: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute") };
}

function key(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function utcDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function moveDate(dateKey: string, amount: number) {
  const date = utcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return key(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

function weekday(dateKey: string) {
  return utcDate(dateKey).getUTCDay();
}

function nthWeekday(year: number, month: number, weekdayNumber: number, occurrence: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const day = 1 + ((7 + weekdayNumber - first.getUTCDay()) % 7) + (occurrence - 1) * 7;
  return key(year, month, day);
}

function lastWeekday(year: number, month: number, weekdayNumber: number) {
  const last = new Date(Date.UTC(year, month, 0));
  const day = last.getUTCDate() - ((7 + last.getUTCDay() - weekdayNumber) % 7);
  return key(year, month, day);
}

function observedFixedHoliday(year: number, month: number, day: number) {
  const holiday = key(year, month, day);
  const dayOfWeek = weekday(holiday);
  return dayOfWeek === 6 ? moveDate(holiday, -1) : dayOfWeek === 0 ? moveDate(holiday, 1) : holiday;
}

function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return key(year, month, day);
}

function usHoliday(dateKey: string): string | null {
  const year = Number(dateKey.slice(0, 4));
  const holidays = new Map<string, string>([
    [observedFixedHoliday(year, 1, 1), "New Year's Day"],
    [nthWeekday(year, 1, 1, 3), "Martin Luther King Jr. Day"],
    [nthWeekday(year, 2, 1, 3), "Washington's Birthday"],
    [moveDate(easterSunday(year), -2), "Good Friday"],
    [lastWeekday(year, 5, 1), "Memorial Day"],
    [observedFixedHoliday(year, 6, 19), "Juneteenth"],
    [observedFixedHoliday(year, 7, 4), "Independence Day"],
    [nthWeekday(year, 9, 1, 1), "Labor Day"],
    [nthWeekday(year, 11, 4, 4), "Thanksgiving Day"],
    [observedFixedHoliday(year, 12, 25), "Christmas Day"],
    [observedFixedHoliday(year + 1, 1, 1), "New Year's Day"],
  ]);
  return holidays.get(dateKey) ?? null;
}

function argentinaTransferredHoliday(year: number, month: number, day: number) {
  const date = key(year, month, day);
  const dayOfWeek = weekday(date);
  if (dayOfWeek === 2 || dayOfWeek === 3) return moveDate(date, -(dayOfWeek - 1));
  if (dayOfWeek === 4 || dayOfWeek === 5) return moveDate(date, 8 - dayOfWeek);
  return date;
}

function argentinaHoliday(dateKey: string): string | null {
  const year = Number(dateKey.slice(0, 4));
  const easter = easterSunday(year);
  const holidays = new Map<string, string>([
    [key(year, 1, 1), "Año Nuevo"],
    [moveDate(easter, -48), "Carnaval"],
    [moveDate(easter, -47), "Carnaval"],
    [key(year, 3, 24), "Día de la Memoria"],
    [key(year, 4, 2), "Día del Veterano y de los Caídos en Malvinas"],
    [moveDate(easter, -2), "Viernes Santo"],
    [key(year, 5, 1), "Día del Trabajador"],
    [key(year, 5, 25), "Día de la Revolución de Mayo"],
    [argentinaTransferredHoliday(year, 6, 17), "Paso a la Inmortalidad de Güemes"],
    [key(year, 6, 20), "Paso a la Inmortalidad de Belgrano"],
    [key(year, 7, 9), "Día de la Independencia"],
    [argentinaTransferredHoliday(year, 8, 17), "Paso a la Inmortalidad de San Martín"],
    [argentinaTransferredHoliday(year, 10, 12), "Día del Respeto a la Diversidad Cultural"],
    [argentinaTransferredHoliday(year, 11, 20), "Día de la Soberanía Nacional"],
    [key(year, 12, 8), "Inmaculada Concepción de María"],
    [key(year, 12, 25), "Navidad"],
  ]);
  return holidays.get(dateKey) ?? null;
}

function holidayFor(market: Exclude<TodayMarket, "crypto">, dateKey: string) {
  return market === "international" ? usHoliday(dateKey) : argentinaHoliday(dateKey);
}

function isTradingDay(market: Exclude<TodayMarket, "crypto">, dateKey: string) {
  const day = weekday(dateKey);
  return day !== 0 && day !== 6 && !holidayFor(market, dateKey);
}

function adjacentSession(market: Exclude<TodayMarket, "crypto">, marketDate: string, direction: -1 | 1) {
  let candidate = moveDate(marketDate, direction);
  while (!isTradingDay(market, candidate)) candidate = moveDate(candidate, direction);
  return candidate;
}

function dateLabel(dateKey: string, language: Language) {
  return new Intl.DateTimeFormat(language === "es" ? "es-AR" : "en-US", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(utcDate(dateKey));
}

function regularSession(market: Exclude<TodayMarket, "crypto">, language: Language, now: Date): TodayMarketSession {
  const config = MARKET_CONFIG[market];
  const parts = zonedParts(now, config.timeZone);
  const marketDate = key(parts.year, parts.month, parts.day);
  const holiday = holidayFor(market, marketDate);
  const day = weekday(marketDate);
  const minutes = parts.hour * 60 + parts.minute;
  const tradingDay = day !== 0 && day !== 6 && !holiday;
  const status: MarketSessionStatus = !tradingDay
    ? holiday ? "holiday" : "weekend"
    : minutes < config.openMinutes ? "preopen"
      : minutes < config.closeMinutes ? "open"
        : "afterhours";
  const previousSessionDate = tradingDay && status === "afterhours" ? marketDate : adjacentSession(market, marketDate, -1);
  const nextSessionDate = tradingDay && status === "preopen" ? marketDate : adjacentSession(market, marketDate, 1);
  const localizedHoliday = holiday && language === "es" && market === "international"
    ? ({ "New Year's Day": "Año Nuevo", "Martin Luther King Jr. Day": "Día de Martin Luther King Jr.", "Washington's Birthday": "Día de los Presidentes", "Good Friday": "Viernes Santo", "Memorial Day": "Memorial Day", Juneteenth: "Juneteenth", "Independence Day": "Día de la Independencia", "Labor Day": "Labor Day", "Thanksgiving Day": "Día de Acción de Gracias", "Christmas Day": "Navidad" }[holiday] ?? holiday)
    : holiday;
  const statusLabel = language === "es"
    ? ({ open: "Abierto", preopen: "Preapertura", afterhours: "Rueda finalizada", holiday: "Cerrado por feriado", weekend: "Cerrado por fin de semana", continuous: "Abierto 24/7" }[status])
    : ({ open: "Open", preopen: "Pre-market", afterhours: "Session ended", holiday: "Closed for holiday", weekend: "Closed for weekend", continuous: "Open 24/7" }[status]);
  const detail = localizedHoliday
    ? `${localizedHoliday} · ${language === "es" ? "próxima rueda" : "next session"}: ${dateLabel(adjacentSession(market, marketDate, 1), language)}`
    : status === "preopen"
      ? `${language === "es" ? "Abre hoy" : "Opens today"} · ${market === "international" ? "09:30 ET" : "11:00 ART"}`
      : status === "open"
        ? `${language === "es" ? "Rueda en curso" : "Session in progress"} · ${market === "international" ? "ET" : "ART"}`
        : `${language === "es" ? "Próxima rueda" : "Next session"}: ${dateLabel(adjacentSession(market, marketDate, 1), language)}`;

  return {
    market,
    status,
    statusLabel,
    detail,
    marketDate,
    previousSessionDate,
    nextSessionDate,
    isTradingDay: tradingDay,
    isOpen: status === "open",
  };
}

export function getTodayMarketSessions(language: Language, now = new Date()): TodayMarketSessions {
  const argentina = regularSession("argentina", language, now);
  const international = regularSession("international", language, now);
  const cryptoParts = zonedParts(now, "UTC");
  const cryptoDate = key(cryptoParts.year, cryptoParts.month, cryptoParts.day);
  return {
    international,
    argentina,
    crypto: {
      market: "crypto",
      status: "continuous",
      statusLabel: language === "es" ? "Abierto 24/7" : "Open 24/7",
      detail: language === "es" ? "Mercado continuo" : "Continuous market",
      marketDate: cryptoDate,
      previousSessionDate: cryptoDate,
      nextSessionDate: cryptoDate,
      isTradingDay: true,
      isOpen: true,
    },
  };
}

export function snapshotBelongsToCurrentSession(observedAt: string | null, market: TodayMarket, sessions: TodayMarketSessions) {
  if (!observedAt) return false;
  const session = sessions[market];
  if (market !== "crypto" && (!session.isTradingDay || session.status === "preopen")) return false;
  const timeZone = market === "international" ? MARKET_CONFIG.international.timeZone : market === "argentina" ? MARKET_CONFIG.argentina.timeZone : "UTC";
  const parts = zonedParts(new Date(observedAt), timeZone);
  return key(parts.year, parts.month, parts.day) === session.marketDate;
}

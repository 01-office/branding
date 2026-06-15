import { badge, emit, type ConsoleStyle, type LogConsole } from "./core.js";

export type Level = "info" | "warn" | "error" | "success" | "debug";

export type LoggerOptions = {
  /** Console target to emit to. Defaults to the global console. */
  console?: LogConsole;
  /** Per-level style overrides (CSS object or string). */
  levels?: Partial<Record<Level, ConsoleStyle>>;
};

export type Logger = Record<Level, (...args: unknown[]) => void>;

const LEVELS: readonly Level[] = ["info", "warn", "error", "success", "debug"];

const DEFAULT_LEVEL_STYLES: Record<Level, string> = {
  info: "background: #2563eb; color: #fff;",
  warn: "background: #d97706; color: #fff;",
  error: "background: #dc2626; color: #fff;",
  success: "background: #16a34a; color: #fff;",
  debug: "background: #6b7280; color: #fff;",
};

/**
 * Create a level logger. Each level prints a colored badge (the level name,
 * uppercased) followed by the raw arguments, so objects keep their interactive
 * console inspection.
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const consoleTarget = options.console ?? globalThis.console;
  const logger = {} as Logger;
  for (const level of LEVELS) {
    const style = options.levels?.[level] ?? DEFAULT_LEVEL_STYLES[level];
    logger[level] = (...args: unknown[]) => {
      emit(consoleTarget, [badge(level.toUpperCase(), style)], ...args);
    };
  }
  return logger;
}

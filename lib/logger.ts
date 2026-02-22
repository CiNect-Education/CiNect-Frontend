type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = process.env.NEXT_PUBLIC_ENV === "prod" ? "warn" : "debug";
  }

  private shouldLog(level: LogLevel) {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog("debug")) console.debug(`[DEBUG] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog("info")) console.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog("warn")) console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, error?: unknown, ...args: unknown[]) {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }
}

export const logger = new Logger();

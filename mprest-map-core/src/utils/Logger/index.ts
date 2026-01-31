import type { LogLevel, LogEntry, ILogger, LogHandler } from "../../types/core/types/logging";

/**
 * Module-level log handler - set by the map component
 */
let globalLogHandler: LogHandler | null = null;

/**
 * Set the global log handler
 * Called by the map component to wire up logging to the viewer's onLog handler
 */
export function setLogHandler(handler: LogHandler | null): void {
  globalLogHandler = handler;
}

/**
 * Get the current global log handler
 */
export function getLogHandler(): LogHandler | null {
  return globalLogHandler;
}

/**
 * Create a logger instance for a specific origin/module
 * @param origin - The name of the module/component creating logs
 * @returns Logger instance with debug, info, warn, error methods
 */
export function createLogger(origin: string): ILogger {
  const log = (level: LogLevel, message: string, data?: unknown, error?: Error): void => {
    const entry: LogEntry = {
      level,
      message,
      origin,
      timestamp: Date.now(),
      data,
      error,
    };

    if (globalLogHandler) {
      globalLogHandler(entry);
    } else {
      // Fallback to console when no handler is set
      const consoleMethod = level === "debug" ? "log" : level;
      const prefix = `[${origin}]`;
      if (error) {
        console[consoleMethod](prefix, message, error, data);
      } else if (data !== undefined) {
        console[consoleMethod](prefix, message, data);
      } else {
        console[consoleMethod](prefix, message);
      }
    }
  };

  return {
    debug: (message: string, data?: unknown) => log("debug", message, data),
    info: (message: string, data?: unknown) => log("info", message, data),
    warn: (message: string, data?: unknown) => log("warn", message, data),
    error: (message: string, errorOrData?: Error | unknown, data?: unknown) => {
      // Handle both error(msg, Error) and error(msg, data) signatures
      if (errorOrData instanceof Error) {
        log("error", message, data, errorOrData);
      } else {
        log("error", message, errorOrData);
      }
    },
  };
}

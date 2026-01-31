/**
 * Log levels for the unified logging system
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Log entry structure
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Origin module/component that generated the log */
  origin: string;
  /** Timestamp of the log entry */
  timestamp: number;
  /** Additional contextual data */
  data?: unknown;
  /** Error object (for error level logs) */
  error?: Error;
}

/**
 * Logger interface for creating scoped loggers
 */
export interface ILogger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, errorOrData?: Error | unknown, data?: unknown) => void;
}

/**
 * Log handler callback type
 */
export type LogHandler = (entry: LogEntry) => void;

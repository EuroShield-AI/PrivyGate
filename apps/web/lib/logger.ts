type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private formatLog(level: LogLevel, message: string, metadata?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as unknown as Error : undefined,
    };
  }

  private writeLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry);
    
    if (entry.level === "error") {
      console.error(logString);
    } else if (entry.level === "warn") {
      console.warn(logString);
    } else {
      console.log(logString);
    }

    // In production, you might want to send to a logging service
    // e.g., Sentry, Datadog, CloudWatch, etc.
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.writeLog(this.formatLog("info", message, metadata));
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.writeLog(this.formatLog("warn", message, metadata));
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.writeLog(this.formatLog("error", message, metadata, error));
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      this.writeLog(this.formatLog("debug", message, metadata));
    }
  }
}

export const logger = new Logger();

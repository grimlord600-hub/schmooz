export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface ExampleLogger {
  showLogs: boolean;
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/** Strip phone-like values from log lines and serialized data. */
export function redactSensitive(text: string): string {
  return text
    .replace(/\+?\d{1,3}[\s-]?\d{6,14}/g, "[redacted-phone]")
    .replace(/"contact_no"\s*:\s*"[^"]*"/gi, '"contact_no":"[redacted]"')
    .replace(/"phone_number"\s*:\s*"[^"]*"/gi, '"phone_number":"[redacted]"')
    .replace(/"phone_no"\s*:\s*"[^"]*"/gi, '"phone_no":"[redacted]"');
}

function formatLine(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const base = `${ts} ${level.padEnd(5)} ${redactSensitive(message)}`;
  if (!meta || Object.keys(meta).length === 0) {
    return base;
  }
  const metaStr = redactSensitive(JSON.stringify(meta));
  return `${base} ${metaStr}`;
}

export function createExampleLogger(showLogs: boolean): ExampleLogger {
  const write = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
    const line = formatLine(level, message, meta);
    if (level === "ERROR") {
      console.error(line);
      return;
    }
    if (level === "WARN") {
      console.warn(line);
      return;
    }
    if (!showLogs && level !== "ERROR" && level !== "WARN") {
      return;
    }
    console.log(line);
  };

  return {
    showLogs,
    debug: (m, meta) => write("DEBUG", m, meta),
    info: (m, meta) => write("INFO", m, meta),
    warn: (m, meta) => write("WARN", m, meta),
    error: (m, meta) => write("ERROR", m, meta),
  };
}

function parseShowLogsFlag(value: string): boolean {
  const v = value.toLowerCase();
  return v !== "false" && v !== "0" && v !== "no";
}

export function parseExampleArgs(argv: string[]): {
  configPath?: string;
  showLogs: boolean;
} {
  let showLogs: boolean | undefined;
  let configPath: string | undefined;

  for (const arg of argv) {
    if (arg === "--no-logs" || arg === "--show-logs=false") {
      showLogs = false;
      continue;
    }
    if (arg === "--show-logs" || arg === "--show-logs=true") {
      showLogs = true;
      continue;
    }
    if (arg.startsWith("--show-logs=")) {
      showLogs = parseShowLogsFlag(arg.slice("--show-logs=".length));
      continue;
    }
    if (arg.startsWith("-")) {
      continue;
    }
    configPath = arg;
  }

  if (showLogs === undefined) {
    const env = process.env.SCHMOOZE_SHOW_LOGS;
    showLogs =
      env === undefined ? true : parseShowLogsFlag(env);
  }

  return { configPath, showLogs };
}

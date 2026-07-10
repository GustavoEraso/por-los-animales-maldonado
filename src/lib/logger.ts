import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level?: LogLevel;
  code: string;
  errorType?: string;
  statusCode?: number;
  message: string;
  data?: unknown;
}

const levelLabel: Record<LogLevel, string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG',
};

function formatTimestamp(): string {
  return new Date().toISOString();
}

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (data instanceof Error) {
    return { name: data.name, message: data.message, stack: data.stack };
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    // Firebase errors often have code/message on the prototype, not as own properties.
    // Access them directly via property access (not 'in' or try-catch).
    const extracted: Record<string, unknown> = {};
    if (obj.code !== undefined) extracted.code = obj.code;
    if (obj.message !== undefined) extracted.message = obj.message;
    if (obj.name !== undefined) extracted.name = obj.name;
    if (obj.stack !== undefined) extracted.stack = obj.stack;
    if (Object.keys(extracted).length > 0) return extracted;
    // No useful properties found — always return a string so it never logs as {}
    try {
      return `[${obj.constructor?.name || 'Object'}] ${String(obj)}`;
    } catch {
      return '[unserializable object]';
    }
  }
  return data;
}

export function logger(entry: LogEntry): void {
  const level = entry.level ?? 'info';
  const ts = formatTimestamp();
  const label = levelLabel[level];
  const prefix = `${ts} [${label}] [${entry.code}]`;

  const sanitized = entry.data !== undefined ? sanitize(entry.data) : undefined;

  // Safety net: if sanitize still returned an empty object, convert to string
  const safeSanitized =
    sanitized !== null &&
    sanitized !== undefined &&
    typeof sanitized === 'object' &&
    Object.keys(sanitized as Record<string, unknown>).length === 0
      ? `[${(sanitized as Record<string, unknown>).constructor?.name || 'Unknown'}]`
      : sanitized;

  const base = {
    message: entry.message,
    ...(entry.errorType ? { errorType: entry.errorType } : {}),
    ...(entry.statusCode ? { statusCode: entry.statusCode } : {}),
  };

  if (safeSanitized !== undefined) {
    if (level === 'error') {
      console.error(prefix, JSON.stringify(base), safeSanitized);
    } else if (level === 'warn') {
      console.warn(prefix, JSON.stringify(base), safeSanitized);
    } else {
      console.log(prefix, JSON.stringify(base), safeSanitized);
    }
  } else {
    if (level === 'error') {
      console.error(prefix, JSON.stringify(base));
    } else if (level === 'warn') {
      console.warn(prefix, JSON.stringify(base));
    } else {
      console.log(prefix, JSON.stringify(base));
    }
  }

  if (process.env.NODE_ENV === 'production') {
    persistToFirestore(entry, safeSanitized);
  }
}

function persistToFirestore(entry: LogEntry, sanitized: unknown): void {
  try {
    addDoc(collection(db, 'logs'), {
      level: entry.level ?? 'info',
      code: entry.code,
      errorType: entry.errorType ?? null,
      statusCode: entry.statusCode ?? null,
      message: entry.message,
      data: sanitized ?? null,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Silently ignore Firestore write failures
  }
}

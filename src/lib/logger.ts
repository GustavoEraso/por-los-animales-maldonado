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
  if (data instanceof Error) {
    return { name: data.name, message: data.message, stack: data.stack };
  }
  if (data !== null && typeof data === 'object' && 'code' in data && 'message' in data) {
    const err = data as Record<string, unknown>;
    return {
      name: err.name,
      code: err.code,
      message: err.message,
      stack: err.stack,
    };
  }
  return data;
}

export function logger(entry: LogEntry): void {
  const level = entry.level ?? 'info';
  const ts = formatTimestamp();
  const label = levelLabel[level];
  const prefix = `${ts} [${label}] [${entry.code}]`;

  const sanitized = entry.data !== undefined ? sanitize(entry.data) : undefined;

  const base = {
    message: entry.message,
    ...(entry.errorType ? { errorType: entry.errorType } : {}),
    ...(entry.statusCode ? { statusCode: entry.statusCode } : {}),
  };

  if (sanitized !== undefined) {
    if (level === 'error') {
      console.error(prefix, JSON.stringify(base), sanitized);
    } else if (level === 'warn') {
      console.warn(prefix, JSON.stringify(base), sanitized);
    } else {
      console.log(prefix, JSON.stringify(base), sanitized);
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
    persistToFirestore(entry, sanitized);
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

import { logger } from '@/lib/logger';

function generateId() {
  // Use Web Crypto's randomUUID when available (typed safely)
  try {
    const maybeCrypto =
      typeof crypto !== 'undefined'
        ? (crypto as unknown as { randomUUID?: () => string })
        : undefined;
    if (maybeCrypto?.randomUUID) return maybeCrypto.randomUUID();
  } catch (e) {
    logger({ level: 'error', code: 'GENERATE_ID', message: 'Error generating UUID with crypto.randomUUID:', data: e });
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; // fallback
}

export default generateId;

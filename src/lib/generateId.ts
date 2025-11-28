function generateId() {
  // Use Web Crypto's randomUUID when available (typed safely)
  try {
    const maybeCrypto =
      typeof crypto !== 'undefined'
        ? (crypto as unknown as { randomUUID?: () => string })
        : undefined;
    if (maybeCrypto?.randomUUID) return maybeCrypto.randomUUID();
  } catch (e) {
    console.error('Error generating UUID with crypto.randomUUID:', e);
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; // fallback
}

export default generateId;

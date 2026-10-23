export const normalizePhoneNumber = (value: string): string | null => {
  const trimmed = value.trim();
  if (!/^\+[0-9\s().-]+$/.test(trimmed)) return null;

  const digits = trimmed.slice(1).replace(/\D/g, '');
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
};

export const looksLikePhoneNumber = (value: string): boolean =>
  /^[+()\d\s.-]+$/.test(value) && /\d/.test(value);

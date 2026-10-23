export const normalizePhoneNumber = (value: string): string | null => {
  let trimmed = value.trim();
  if (!trimmed) return null;

  // Auto-prefix with +91 if user provides standard 10-digit mobile number
  if (!trimmed.startsWith('+')) {
    const rawDigits = trimmed.replace(/\D/g, '');
    if (rawDigits.length === 10) {
      trimmed = `+91${rawDigits}`;
    } else if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
      trimmed = `+91${rawDigits.slice(1)}`;
    } else if (rawDigits.length >= 10 && rawDigits.length <= 15) {
      trimmed = `+${rawDigits}`;
    } else {
      return null;
    }
  }

  const digits = trimmed.slice(1).replace(/\D/g, '');
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
};

export const looksLikePhoneNumber = (value: string): boolean =>
  /^[+()\d\s.-]+$/.test(value) && /\d{4,}/.test(value);


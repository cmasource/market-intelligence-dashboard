export const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validatePassword(value: FormDataEntryValue | null) {
  const password = String(value ?? "");
  return password.length >= MIN_PASSWORD_LENGTH ? password : null;
}

export function normalizeDisplayName(value: FormDataEntryValue | null) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  return name.length >= 2 && name.length <= 80 ? name : null;
}


/** Normalize Rwanda mobile numbers to E.164 before they enter auth or order data. */
export function normalizeRwandaPhone(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (/^07\d{8}$/.test(compact)) return `+250${compact.slice(1)}`;
  if (/^7\d{8}$/.test(compact)) return `+250${compact}`;
  if (/^2507\d{8}$/.test(compact)) return `+${compact}`;
  if (/^\+2507\d{8}$/.test(compact)) return compact;
  return null;
}

/** Stable internal Better Auth identifier for accounts that sign in by phone. */
export function customerPhoneAuthEmail(phoneNumber: string): string {
  return `phone-${phoneNumber.replace(/\D/g, "")}@accounts.shinebabashop.com`;
}

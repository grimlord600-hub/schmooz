/** E.164 contact number for IAM OTP (send + verify). */
export function formatContactNo(phone: string, defaultPrefix = "+91"): string {
  const trimmed = phone.replace(/\s/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("00")) return `+${trimmed.slice(2)}`;
  const digits = trimmed.replace(/\D/g, "");
  const prefixDigits = defaultPrefix.replace(/\D/g, "");
  if (digits.startsWith(prefixDigits)) {
    return `+${digits}`;
  }
  return `${defaultPrefix}${digits}`;
}

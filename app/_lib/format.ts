/** Show only the last 3 digits of a phone number, e.g. "*****234". */
export function maskPhone(phone: string): string {
  if (!phone) return phone;
  const visible = 3;
  return phone.length <= visible
    ? phone
    : "*".repeat(phone.length - visible) + phone.slice(-visible);
}

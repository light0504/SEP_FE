export function formatBookingTimestamp(value: string): string {
  // The API example has no timezone. Display its wall-clock time without assuming UTC.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);
  if (!match) return value;
  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} · ${hour}:${minute}`;
}

export function bookingStatusLabel(status: string): string {
  return ({ CANCELLED: 'Đã hủy', RESERVED: 'Đã đặt', CHECKED_IN: 'Đã check-in' } as Record<string, string>)[status] || status;
}

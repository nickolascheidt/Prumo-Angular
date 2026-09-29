/**
 * Due dates, work dates, pay periods and journal dates are calendar days, not instants.
 * The API stores them as midnight UTC. Reading one with `new Date(value)` and showing it
 * in local time moves it to the previous day anywhere west of Greenwich — and a form
 * that loads it that way saves the wrong day back, one day earlier on every edit.
 *
 * So: forms build local dates from the `YYYY-MM-DD` part and send `YYYY-MM-DD` back, and
 * templates display these fields with the `'UTC'` time zone.
 */

/** A local Date for the calendar day in `value` (`YYYY-MM-DD` or an ISO timestamp). */
export function fromDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** `YYYY-MM-DD` for the calendar day the user picked, read in local time. */
export function toDateOnly(value: Date | string): string {
  const d = value instanceof Date ? value : fromDateOnly(value);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

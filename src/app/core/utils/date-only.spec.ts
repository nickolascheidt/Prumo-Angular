import { fromDateOnly, toDateOnly } from './date-only';

describe('date-only helpers', () => {
  it('reads the calendar day from an ISO timestamp at midnight UTC', () => {
    // What the API sends for a due date. new Date() of this in any zone west of
    // Greenwich lands on the 4th.
    const d = fromDateOnly('2026-09-05T00:00:00Z');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(5);
  });

  it('reads a plain YYYY-MM-DD', () => {
    expect(fromDateOnly('2026-01-31').getDate()).toBe(31);
  });

  it('round-trips the day the user picked', () => {
    expect(toDateOnly(new Date(2026, 8, 5))).toBe('2026-09-05');
    expect(toDateOnly(fromDateOnly('2026-12-31T00:00:00Z'))).toBe('2026-12-31');
  });
});

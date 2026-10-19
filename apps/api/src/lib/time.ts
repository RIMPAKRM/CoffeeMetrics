export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** yyyy-mm-dd in local time */
export function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface PeriodRange {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
}

/** Current window = last `period` days including today; previous = the `period` days right before it. */
export function periodRanges(period: number, now = new Date()): PeriodRange {
  const start = startOfDay(addDays(now, -(period - 1)));
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = startOfDay(addDays(start, -period));
  return { start, end: now, prevStart, prevEnd };
}

/** How many times each weekday (0=Mon..6=Sun) occurs inside [start, end]. */
export function weekdayCounts(start: Date, end: Date): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (let d = startOfDay(start); d <= end; d = addDays(d, 1)) {
    counts[(d.getDay() + 6) % 7] += 1;
  }
  return counts;
}

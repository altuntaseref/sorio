export type ResetPeriod = 'DAILY' | 'MONTHLY' | 'NEVER';

export function getPeriodRange(resetPeriod: ResetPeriod, now: Date = new Date()) {
  if (resetPeriod === 'DAILY') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return { periodStart: start, periodEnd: end };
  }

  if (resetPeriod === 'MONTHLY') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return { periodStart: start, periodEnd: end };
  }

  return {
    periodStart: new Date(0),
    periodEnd: new Date(8640000000000000),
  };
}

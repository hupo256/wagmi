// utils/calculateInterest.ts
export function calculateEstimatedInterest(principal: number, apy: number, days: number): number {
  const dailyRate = apy / 365;
  const futureValue = principal * Math.pow(1 + dailyRate, days);
  return futureValue - principal;
}

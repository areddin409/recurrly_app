import { toMonthlyAmount, totalMonthlySpend, daysUntil, cycleToDays } from "../../utils/billing";

describe("toMonthlyAmount", () => {
  it("returns monthly amount unchanged", () => {
    expect(toMonthlyAmount(10, "monthly")).toBe(10);
  });
  it("multiplies weekly by 4.33", () => {
    expect(toMonthlyAmount(10, "weekly")).toBeCloseTo(43.3, 1);
  });
  it("divides yearly by 12", () => {
    expect(toMonthlyAmount(120, "yearly")).toBeCloseTo(10, 5);
  });
});

describe("totalMonthlySpend", () => {
  it("sums normalized amounts", () => {
    const subs = [
      { amount: 10, billingCycle: "monthly" as const },
      { amount: 120, billingCycle: "yearly" as const },
    ];
    expect(totalMonthlySpend(subs)).toBeCloseTo(20, 5);
  });
  it("returns 0 for empty array", () => {
    expect(totalMonthlySpend([])).toBe(0);
  });
});

describe("daysUntil", () => {
  it("returns 0 for past dates", () => {
    expect(daysUntil(Date.now() - 1000)).toBe(0);
  });
  it("returns correct days for future date", () => {
    const future = Date.now() + 3 * 24 * 60 * 60 * 1000;
    expect(daysUntil(future)).toBe(3);
  });
});

describe("cycleToDays", () => {
  it("returns 7 for weekly", () => expect(cycleToDays("weekly")).toBe(7));
  it("returns 30 for monthly", () => expect(cycleToDays("monthly")).toBe(30));
  it("returns 365 for yearly", () => expect(cycleToDays("yearly")).toBe(365));
});

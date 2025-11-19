import { calculateInterest, calculateFees, convertCurrency } from "@/lib/utils";

describe("Financial Calculations", () => {
  // Test for calculateInterest function
  describe("calculateInterest", () => {
    it("should correctly calculate simple interest", () => {
      expect(calculateInterest(1000, 0.05, 1)).toBeCloseTo(50);
      expect(calculateInterest(5000, 0.03, 2)).toBeCloseTo(300);
    });

    it("should return 0 if principal is 0", () => {
      expect(calculateInterest(0, 0.05, 1)).toBe(0);
    });

    it("should return 0 if rate is 0", () => {
      expect(calculateInterest(1000, 0, 1)).toBe(0);
    });

    it("should return 0 if time is 0", () => {
      expect(calculateInterest(1000, 0.05, 0)).toBe(0);
    });

    it("should handle negative principal gracefully", () => {
      expect(calculateInterest(-1000, 0.05, 1)).toBeCloseTo(-50);
    });

    it("should handle negative rate gracefully", () => {
      expect(calculateInterest(1000, -0.05, 1)).toBeCloseTo(-50);
    });

    it("should handle negative time gracefully", () => {
      expect(calculateInterest(1000, 0.05, -1)).toBeCloseTo(-50);
    });
  });

  // Test for calculateFees function
  describe("calculateFees", () => {
    it("should correctly calculate fees based on a percentage", () => {
      expect(calculateFees(1000, 0.02)).toBeCloseTo(20);
      expect(calculateFees(500, 0.015)).toBeCloseTo(7.5);
    });

    it("should return 0 if amount is 0", () => {
      expect(calculateFees(0, 0.02)).toBe(0);
    });

    it("should return 0 if fee rate is 0", () => {
      expect(calculateFees(1000, 0)).toBe(0);
    });

    it("should handle negative amount gracefully", () => {
      expect(calculateFees(-1000, 0.02)).toBeCloseTo(-20);
    });

    it("should handle negative fee rate gracefully", () => {
      expect(calculateFees(1000, -0.02)).toBeCloseTo(-20);
    });
  });

  // Test for convertCurrency function
  describe("convertCurrency", () => {
    it("should correctly convert currency with a given exchange rate", () => {
      expect(convertCurrency(100, 1.2)).toBeCloseTo(120);
      expect(convertCurrency(50, 0.85)).toBeCloseTo(42.5);
    });

    it("should return 0 if amount is 0", () => {
      expect(convertCurrency(0, 1.2)).toBe(0);
    });

    it("should return 0 if exchange rate is 0", () => {
      expect(convertCurrency(100, 0)).toBe(0);
    });

    it("should handle negative amount gracefully", () => {
      expect(convertCurrency(-100, 1.2)).toBeCloseTo(-120);
    });

    it("should handle negative exchange rate gracefully", () => {
      expect(convertCurrency(100, -1.2)).toBeCloseTo(-120);
    });
  });
});

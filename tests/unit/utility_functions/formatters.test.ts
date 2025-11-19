import { formatCurrency, formatDate, capitalizeFirstLetter } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("formatCurrency", () => {
    it("should format currency correctly for USD", () => {
      expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
    });

    it("should format currency correctly for EUR", () => {
      expect(formatCurrency(1234.56, "EUR")).toBe("€1,234.56");
    });

    it("should handle zero correctly", () => {
      expect(formatCurrency(0, "USD")).toBe("$0.00");
    });

    it("should handle negative values correctly", () => {
      expect(formatCurrency(-123.45, "USD")).toBe("-$123.45");
    });

    it("should handle large numbers", () => {
      expect(formatCurrency(123456789.123, "USD")).toBe("$123,456,789.12");
    });
  });

  describe("formatDate", () => {
    it("should format date correctly", () => {
      const date = new Date("2023-01-15T10:30:00Z");
      expect(formatDate(date)).toBe("Jan 15, 2023");
    });

    it("should handle different date objects", () => {
      const date = new Date("2024-12-25T00:00:00Z");
      expect(formatDate(date)).toBe("Dec 25, 2024");
    });
  });

  describe("capitalizeFirstLetter", () => {
    it("should capitalize the first letter of a string", () => {
      expect(capitalizeFirstLetter("hello")).toBe("Hello");
    });

    it("should handle empty string", () => {
      expect(capitalizeFirstLetter("")).toBe("");
    });

    it("should handle single letter string", () => {
      expect(capitalizeFirstLetter("a")).toBe("A");
    });

    it("should handle already capitalized string", () => {
      expect(capitalizeFirstLetter("World")).toBe("World");
    });
  });
});

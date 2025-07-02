import { processTransaction, validateTransaction } from "@/lib/utils";
import { mockWallet, mockTransaction } from "@/test/utils";

describe("Transaction Business Logic", () => {
  describe("validateTransaction", () => {
    it("should return true for a valid transaction", () => {
      expect(validateTransaction(mockTransaction, mockWallet)).toBe(true);
    });

    it("should return false if transaction amount is negative", () => {
      const invalidTransaction = { ...mockTransaction, amount: -100 };
      expect(validateTransaction(invalidTransaction, mockWallet)).toBe(false);
    });

    it("should return false if transaction amount is zero", () => {
      const invalidTransaction = { ...mockTransaction, amount: 0 };
      expect(validateTransaction(invalidTransaction, mockWallet)).toBe(false);
    });

    it("should return false if wallet balance is insufficient for withdrawal", () => {
      const withdrawalTransaction = { ...mockTransaction, type: "withdrawal", amount: 2000 };
      expect(validateTransaction(withdrawalTransaction, mockWallet)).toBe(false);
    });

    it("should return true if wallet balance is sufficient for withdrawal", () => {
      const withdrawalTransaction = { ...mockTransaction, type: "withdrawal", amount: 500 };
      expect(validateTransaction(withdrawalTransaction, mockWallet)).toBe(true);
    });

    it("should return false if transaction currency does not match wallet currency", () => {
      const invalidTransaction = { ...mockTransaction, currency: "EUR" };
      expect(validateTransaction(invalidTransaction, mockWallet)).toBe(false);
    });
  });

  describe("processTransaction", () => {
    it("should correctly process a deposit transaction", () => {
      const initialBalance = mockWallet.balance;
      const updatedWallet = processTransaction(mockTransaction, mockWallet);
      expect(updatedWallet.balance).toBe(initialBalance + mockTransaction.amount);
    });

    it("should correctly process a withdrawal transaction", () => {
      const withdrawalTransaction = { ...mockTransaction, type: "withdrawal", amount: 50 };
      const initialBalance = mockWallet.balance;
      const updatedWallet = processTransaction(withdrawalTransaction, mockWallet);
      expect(updatedWallet.balance).toBe(initialBalance - withdrawalTransaction.amount);
    });

    it("should not process an invalid transaction", () => {
      const invalidTransaction = { ...mockTransaction, amount: -100 };
      const initialBalance = mockWallet.balance;
      const updatedWallet = processTransaction(invalidTransaction, mockWallet);
      expect(updatedWallet.balance).toBe(initialBalance);
    });

    it("should handle insufficient funds for withdrawal", () => {
      const withdrawalTransaction = { ...mockTransaction, type: "withdrawal", amount: 2000 };
      const initialBalance = mockWallet.balance;
      const updatedWallet = processTransaction(withdrawalTransaction, mockWallet);
      expect(updatedWallet.balance).toBe(initialBalance);
    });
  });
});



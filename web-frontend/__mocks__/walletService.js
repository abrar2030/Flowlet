const { Wallet } = require("lucide-react");

const mockWalletData = {
  quickStats: [
    {
      title: "Total Balance",
      value: "$100.00",
      change: "+1.0%",
      trend: "up",
      icon: Wallet,
    },
  ],
  recentTransactions: [
    {
      id: 1,
      description: "Test Transaction",
      amount: 50.0,
      date: "2024-01-01",
      category: "Test",
    },
  ],
};

const fetchWalletData = jest.fn(() => Promise.resolve(mockWalletData));

module.exports = { fetchWalletData };

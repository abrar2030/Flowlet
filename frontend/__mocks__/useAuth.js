const useAuth = jest.fn(() => ({
  user: { name: "Test User" },
  // Add other auth functions if needed
}));

module.exports = { useAuth };

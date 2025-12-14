import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("content-type", "application/json");
    return headers;
  },
});
export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["User", "Wallet", "Transaction", "Card", "Analytics"],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User", "Wallet", "Transaction", "Card"],
    }),
    validateToken: builder.query({
      query: (token) => ({
        url: "/auth/validate",
        headers: { authorization: `Bearer ${token}` },
      }),
      providesTags: ["User"],
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
    // User endpoints
    getProfile: builder.query({
      query: () => "/user/profile",
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation({
      query: (updates) => ({
        url: "/user/profile",
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: ["User"],
    }),
    // Wallet endpoints
    getWallets: builder.query({
      query: () => "/wallets",
      providesTags: ["Wallet"],
    }),
    getWallet: builder.query({
      query: (id) => `/wallets/${id}`,
      providesTags: (result, error, id) => [{ type: "Wallet", id }],
    }),
    createWallet: builder.mutation({
      query: (wallet) => ({
        url: "/wallets",
        method: "POST",
        body: wallet,
      }),
      invalidatesTags: ["Wallet"],
    }),
    updateWallet: builder.mutation({
      query: ({ id, updates }) => ({
        url: `/wallets/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Wallet", id }],
    }),
    // Transaction endpoints
    getTransactions: builder.query({
      query: (params) => ({
        url: "/transactions",
        params,
      }),
      providesTags: ["Transaction"],
    }),
    getTransaction: builder.query({
      query: (id) => `/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: "Transaction", id }],
    }),
    createTransaction: builder.mutation({
      query: (transaction) => ({
        url: "/transactions",
        method: "POST",
        body: transaction,
      }),
      invalidatesTags: ["Transaction", "Wallet", "Analytics"],
    }),
    updateTransaction: builder.mutation({
      query: ({ id, updates }) => ({
        url: `/transactions/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Transaction", id },
        "Analytics",
      ],
    }),
    // Card endpoints
    getCards: builder.query({
      query: () => "/cards",
      providesTags: ["Card"],
    }),
    getCard: builder.query({
      query: (id) => `/cards/${id}`,
      providesTags: (result, error, id) => [{ type: "Card", id }],
    }),
    createCard: builder.mutation({
      query: (card) => ({
        url: "/cards",
        method: "POST",
        body: card,
      }),
      invalidatesTags: ["Card"],
    }),
    updateCard: builder.mutation({
      query: ({ id, updates }) => ({
        url: `/cards/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Card", id }],
    }),
    blockCard: builder.mutation({
      query: (id) => ({
        url: `/cards/${id}/block`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Card", id }],
    }),
    unblockCard: builder.mutation({
      query: (id) => ({
        url: `/cards/${id}/unblock`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Card", id }],
    }),
    // Analytics endpoints
    getAnalytics: builder.query({
      query: (params) => ({
        url: "/analytics",
        params,
      }),
      providesTags: ["Analytics"],
    }),
    getSpendingAnalytics: builder.query({
      query: (params) => ({
        url: "/analytics/spending",
        params,
      }),
      providesTags: ["Analytics"],
    }),
    getIncomeAnalytics: builder.query({
      query: (params) => ({
        url: "/analytics/income",
        params,
      }),
      providesTags: ["Analytics"],
    }),
  }),
});
export const {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useValidateTokenQuery,
  useRefreshTokenMutation,
  // User hooks
  useGetProfileQuery,
  useUpdateProfileMutation,
  // Wallet hooks
  useGetWalletsQuery,
  useGetWalletQuery,
  useCreateWalletMutation,
  useUpdateWalletMutation,
  // Transaction hooks
  useGetTransactionsQuery,
  useGetTransactionQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  // Card hooks
  useGetCardsQuery,
  useGetCardQuery,
  useCreateCardMutation,
  useUpdateCardMutation,
  useBlockCardMutation,
  useUnblockCardMutation,
  // Analytics hooks
  useGetAnalyticsQuery,
  useGetSpendingAnalyticsQuery,
  useGetIncomeAnalyticsQuery,
} = api;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "./index";
import {
  User,
  Wallet,
  Transaction,
  Card,
  AnalyticsData,
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  RegisterData,
} from "@/types";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
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
    login: builder.mutation<
      ApiResponse<{ user: User; token: string }>,
      LoginCredentials
    >({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    register: builder.mutation<
      ApiResponse<{ user: User; token: string }>,
      RegisterData
    >({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),

    logout: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User", "Wallet", "Transaction", "Card"],
    }),

    validateToken: builder.query<
      ApiResponse<{ user: User; token: string }>,
      string
    >({
      query: (token) => ({
        url: "/auth/validate",
        headers: { authorization: `Bearer ${token}` },
      }),
      providesTags: ["User"],
    }),

    refreshToken: builder.mutation<
      ApiResponse<{ user: User; token: string }>,
      void
    >({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    // User endpoints
    getProfile: builder.query<ApiResponse<User>, void>({
      query: () => "/user/profile",
      providesTags: ["User"],
    }),

    updateProfile: builder.mutation<ApiResponse<User>, Partial<User>>({
      query: (updates) => ({
        url: "/user/profile",
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: ["User"],
    }),

    // Wallet endpoints
    getWallets: builder.query<ApiResponse<Wallet[]>, void>({
      query: () => "/wallets",
      providesTags: ["Wallet"],
    }),

    getWallet: builder.query<ApiResponse<Wallet>, string>({
      query: (id) => `/wallets/${id}`,
      providesTags: (result, error, id) => [{ type: "Wallet", id }],
    }),

    createWallet: builder.mutation<ApiResponse<Wallet>, Partial<Wallet>>({
      query: (wallet) => ({
        url: "/wallets",
        method: "POST",
        body: wallet,
      }),
      invalidatesTags: ["Wallet"],
    }),

    updateWallet: builder.mutation<
      ApiResponse<Wallet>,
      { id: string; updates: Partial<Wallet> }
    >({
      query: ({ id, updates }) => ({
        url: `/wallets/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Wallet", id }],
    }),

    // Transaction endpoints
    getTransactions: builder.query<
      PaginatedResponse<Transaction>,
      {
        walletId?: string;
        page?: number;
        limit?: number;
        type?: string;
        status?: string;
        dateRange?: { start: string; end: string };
      }
    >({
      query: (params) => ({
        url: "/transactions",
        params,
      }),
      providesTags: ["Transaction"],
    }),

    getTransaction: builder.query<ApiResponse<Transaction>, string>({
      query: (id) => `/transactions/${id}`,
      providesTags: (result, error, id) => [{ type: "Transaction", id }],
    }),

    createTransaction: builder.mutation<
      ApiResponse<Transaction>,
      Partial<Transaction>
    >({
      query: (transaction) => ({
        url: "/transactions",
        method: "POST",
        body: transaction,
      }),
      invalidatesTags: ["Transaction", "Wallet", "Analytics"],
    }),

    updateTransaction: builder.mutation<
      ApiResponse<Transaction>,
      { id: string; updates: Partial<Transaction> }
    >({
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
    getCards: builder.query<ApiResponse<Card[]>, void>({
      query: () => "/cards",
      providesTags: ["Card"],
    }),

    getCard: builder.query<ApiResponse<Card>, string>({
      query: (id) => `/cards/${id}`,
      providesTags: (result, error, id) => [{ type: "Card", id }],
    }),

    createCard: builder.mutation<ApiResponse<Card>, Partial<Card>>({
      query: (card) => ({
        url: "/cards",
        method: "POST",
        body: card,
      }),
      invalidatesTags: ["Card"],
    }),

    updateCard: builder.mutation<
      ApiResponse<Card>,
      { id: string; updates: Partial<Card> }
    >({
      query: ({ id, updates }) => ({
        url: `/cards/${id}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Card", id }],
    }),

    blockCard: builder.mutation<ApiResponse<Card>, string>({
      query: (id) => ({
        url: `/cards/${id}/block`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Card", id }],
    }),

    unblockCard: builder.mutation<ApiResponse<Card>, string>({
      query: (id) => ({
        url: `/cards/${id}/unblock`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [{ type: "Card", id }],
    }),

    // Analytics endpoints
    getAnalytics: builder.query<
      ApiResponse<AnalyticsData>,
      {
        period?: "week" | "month" | "quarter" | "year";
        walletId?: string;
      }
    >({
      query: (params) => ({
        url: "/analytics",
        params,
      }),
      providesTags: ["Analytics"],
    }),

    getSpendingAnalytics: builder.query<
      ApiResponse<any>,
      {
        period?: "week" | "month" | "quarter" | "year";
        category?: string;
      }
    >({
      query: (params) => ({
        url: "/analytics/spending",
        params,
      }),
      providesTags: ["Analytics"],
    }),

    getIncomeAnalytics: builder.query<
      ApiResponse<any>,
      {
        period?: "week" | "month" | "quarter" | "year";
      }
    >({
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

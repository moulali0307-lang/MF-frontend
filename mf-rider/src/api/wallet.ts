import { apiRequest } from "./client";

export interface Wallet {
  id: string;
  userId: string;
  availableMinor: string;
  heldMinor: string;
  currency: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
}

export type WalletTransactionType =
  | "CREDIT"
  | "DEBIT"
  | "REFUND"
  | "WITHDRAWAL"
  | "ADJUSTMENT";

export type WalletTransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED";

export type WalletReferenceType =
  | "DEPOSIT"
  | "RIDE"
  | "MOVIE"
  | "RECHARGE"
  | "WITHDRAWAL"
  | "REFUND"
  | "ADJUSTMENT";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amountMinor: string;
  balanceAfterMinor: string;
  referenceType: WalletReferenceType;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface WalletResponse {
  wallet: Wallet;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[];
}

export function fetchWallet(
  token: string,
): Promise<WalletResponse> {
  return apiRequest<WalletResponse>("/api/wallet", {
    method: "GET",
    token,
  });
}

export function fetchWalletTransactions(
  token: string,
  limit = 50,
): Promise<WalletTransactionsResponse> {
  return apiRequest<WalletTransactionsResponse>(
    `/api/wallet/transactions?limit=${limit}`,
    {
      method: "GET",
      token,
    },
  );
}

/*
 * Convert paise/minor units to rupees.
 *
 * Example:
 * "50000" -> ₹500.00
 */
export function minorToRupees(amountMinor: string): number {
  return Number(amountMinor) / 100;
}
import { apiRequest } from "./client";

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  createdAt: string;
}

export interface WalletResult {
  wallet: Wallet;
}

export interface WalletTransactionsResult {
  transactions: WalletTransaction[];
}

export function fetchWallet(token: string): Promise<WalletResult> {
  return apiRequest<WalletResult>("/api/wallet", {
    method: "GET",
    token,
  });
}

export function fetchWalletTransactions(
  token: string,
  limit = 50,
): Promise<WalletTransactionsResult> {
  return apiRequest<WalletTransactionsResult>(
    `/api/wallet/transactions?limit=${limit}`,
    {
      method: "GET",
      token,
    },
  );
}
export function minorToRupees(minor: number): number {
  return minor / 100;
}

export function rupeesToMinor(rupees: number): number {
  return Math.round(rupees * 100);
}

export function availableWalletMinor(
  balanceMinor: number | null | undefined,
): number {
  if (
    typeof balanceMinor !== "number" ||
    !Number.isFinite(balanceMinor)
  ) {
    return 0;
  }

  return Math.max(0, Math.trunc(balanceMinor));
}
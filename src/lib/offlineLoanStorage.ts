// Offline loan storage with encryption
import { Loan } from '@/hooks/useLoans';

interface OfflineLoanRequest extends Omit<Loan, 'id'> {
  transaction_code: string;
  sync_status: 'pending_sync' | 'synced' | 'failed';
  created_offline: boolean;
  local_timestamp: number;
}

// Simple encryption (for demo - use proper library in production)
const encryptData = (data: string): string => {
  try {
    return btoa(encodeURIComponent(data));
  } catch (e) {
    console.error('Encryption failed:', e);
    return data;
  }
};

const decryptData = (data: string): string => {
  try {
    return decodeURIComponent(atob(data));
  } catch (e) {
    console.error('Decryption failed:', e);
    return data;
  }
};

const STORAGE_KEY = 'sabiboss_offline_loans';

export const generateTransactionCode = (): string => {
  const prefix = 'LN';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${random}${timestamp}`;
};

export const saveOfflineLoanRequest = (loan: Omit<Loan, 'id'>): string => {
  const transactionCode = generateTransactionCode();
  const offlineLoan: OfflineLoanRequest = {
    ...loan,
    transaction_code: transactionCode,
    sync_status: 'pending_sync',
    created_offline: true,
    local_timestamp: Date.now(),
  };

  const existingLoans = getOfflineLoanRequests();
  existingLoans.push(offlineLoan);

  const encrypted = encryptData(JSON.stringify(existingLoans));
  localStorage.setItem(STORAGE_KEY, encrypted);

  return transactionCode;
};

export const getOfflineLoanRequests = (): OfflineLoanRequest[] => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return [];

    const decrypted = decryptData(encrypted);
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Failed to retrieve offline loans:', e);
    return [];
  }
};

export const getPendingSyncLoans = (): OfflineLoanRequest[] => {
  return getOfflineLoanRequests().filter(loan => loan.sync_status === 'pending_sync');
};

export const markLoanAsSynced = (transactionCode: string): void => {
  const loans = getOfflineLoanRequests();
  const updated = loans.map(loan =>
    loan.transaction_code === transactionCode
      ? { ...loan, sync_status: 'synced' as const }
      : loan
  );

  const encrypted = encryptData(JSON.stringify(updated));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const deleteSyncedLoans = (): void => {
  const loans = getOfflineLoanRequests();
  const pendingOnly = loans.filter(loan => loan.sync_status !== 'synced');

  const encrypted = encryptData(JSON.stringify(pendingOnly));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const updateLoanSyncStatus = (
  transactionCode: string,
  status: 'pending_sync' | 'synced' | 'failed'
): void => {
  const loans = getOfflineLoanRequests();
  const updated = loans.map(loan =>
    loan.transaction_code === transactionCode
      ? { ...loan, sync_status: status }
      : loan
  );

  const encrypted = encryptData(JSON.stringify(updated));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const deleteOfflineLoan = (transactionCode: string): void => {
  const loans = getOfflineLoanRequests();
  const filtered = loans.filter(loan => loan.transaction_code !== transactionCode);

  const encrypted = encryptData(JSON.stringify(filtered));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

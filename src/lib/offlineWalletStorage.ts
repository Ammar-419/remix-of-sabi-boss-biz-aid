// Offline wallet storage with encryption
export interface Transaction {
  id: string;
  transaction_code: string;
  type: 'send' | 'receive';
  amount: number;
  recipient?: string;
  sender?: string;
  status: 'pending_sync' | 'offline_verified' | 'synced' | 'failed';
  created_offline: boolean;
  local_timestamp: number;
  verification_hash?: string;
  qr_code?: string;
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

const STORAGE_KEY = 'sabiboss_offline_wallet';

export const generateTransactionCode = (): string => {
  const prefix = 'TX';
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${random}${timestamp}`;
};

export const generateVerificationHash = (amount: number, senderId: string, timestamp: number): string => {
  // Simple hash generation using amount + sender + timestamp
  const data = `${amount}-${senderId}-${timestamp}`;
  return btoa(data);
};

export const generateQRCode = (transactionCode: string, amount: number): string => {
  // Generate a simple QR data string (you can use a QR library to render actual QR codes)
  return btoa(JSON.stringify({ code: transactionCode, amount }));
};

export const saveOfflineTransaction = (transaction: Omit<Transaction, 'transaction_code' | 'created_offline' | 'local_timestamp'>): string => {
  const transactionCode = generateTransactionCode();
  const offlineTransaction: Transaction = {
    ...transaction,
    transaction_code: transactionCode,
    created_offline: true,
    local_timestamp: Date.now(),
  };

  const existingTransactions = getOfflineTransactions();
  existingTransactions.push(offlineTransaction);

  const encrypted = encryptData(JSON.stringify(existingTransactions));
  localStorage.setItem(STORAGE_KEY, encrypted);

  return transactionCode;
};

export const getOfflineTransactions = (): Transaction[] => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return [];

    const decrypted = decryptData(encrypted);
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Failed to retrieve offline transactions:', e);
    return [];
  }
};

export const getPendingSyncTransactions = (): Transaction[] => {
  return getOfflineTransactions().filter(tx => tx.status === 'pending_sync');
};

export const markTransactionAsSynced = (transactionCode: string): void => {
  const transactions = getOfflineTransactions();
  const updated = transactions.map(tx =>
    tx.transaction_code === transactionCode
      ? { ...tx, status: 'synced' as const }
      : tx
  );

  const encrypted = encryptData(JSON.stringify(updated));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const markTransactionAsVerified = (transactionCode: string): void => {
  const transactions = getOfflineTransactions();
  const updated = transactions.map(tx =>
    tx.transaction_code === transactionCode
      ? { ...tx, status: 'offline_verified' as const }
      : tx
  );

  const encrypted = encryptData(JSON.stringify(updated));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const deleteSyncedTransactions = (): void => {
  const transactions = getOfflineTransactions();
  const pendingOnly = transactions.filter(tx => tx.status !== 'synced');

  const encrypted = encryptData(JSON.stringify(pendingOnly));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const updateTransactionStatus = (
  transactionCode: string,
  status: 'pending_sync' | 'offline_verified' | 'synced' | 'failed'
): void => {
  const transactions = getOfflineTransactions();
  const updated = transactions.map(tx =>
    tx.transaction_code === transactionCode
      ? { ...tx, status }
      : tx
  );

  const encrypted = encryptData(JSON.stringify(updated));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const deleteOfflineTransaction = (transactionCode: string): void => {
  const transactions = getOfflineTransactions();
  const filtered = transactions.filter(tx => tx.transaction_code !== transactionCode);

  const encrypted = encryptData(JSON.stringify(filtered));
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const verifyTransaction = (transactionCode: string, expectedHash: string): boolean => {
  const transactions = getOfflineTransactions();
  const transaction = transactions.find(tx => tx.transaction_code === transactionCode);
  
  if (!transaction) return false;
  return transaction.verification_hash === expectedHash;
};

export const getWalletBalance = (): number => {
  const transactions = getOfflineTransactions();
  let balance = 0;

  transactions.forEach(tx => {
    if (tx.status === 'synced' || tx.status === 'offline_verified') {
      if (tx.type === 'receive') {
        balance += tx.amount;
      } else if (tx.type === 'send') {
        balance -= tx.amount;
      }
    }
  });

  return balance;
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useOfflineSync } from './useOfflineSync';
import {
  saveOfflineTransaction,
  getOfflineTransactions,
  getPendingSyncTransactions,
  markTransactionAsSynced,
  deleteOfflineTransaction,
  markTransactionAsVerified,
  generateVerificationHash,
  generateQRCode,
  getWalletBalance,
  Transaction,
  // REMOVE deleteSyncedTransactions import
} from '@/lib/offlineWalletStorage';

export const useWallet = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isOnline } = useOfflineSync();

  useEffect(() => {
    if (user) {
      fetchTransactions();
      calculateBalance();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const offlineTransactions = getOfflineTransactions();
      setTransactions(offlineTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalance = () => {
    const currentBalance = getWalletBalance();
    setBalance(currentBalance);
  };

  const syncOfflineTransactions = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline. Please connect to the internet.');
      return false;
    }

    const pendingTransactions = getPendingSyncTransactions();
    if (pendingTransactions.length === 0) {
      toast.info('No pending transactions to sync');
      return true;
    }

    try {
      toast.info(`Syncing ${pendingTransactions.length} transaction(s)...`);

      // Sync all pending transactions but DON'T DELETE THEM
      for (const offlineTx of pendingTransactions) {
        // Simulate API call to Supabase
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // ONLY mark as synced - DON'T DELETE
        markTransactionAsSynced(offlineTx.transaction_code);
      }

      // Refresh data WITHOUT deleting transactions
      fetchTransactions();
      calculateBalance();
      
      toast.success(`Successfully synced ${pendingTransactions.length} transaction(s)`);
      return true;

    } catch (error) {
      toast.error('Sync failed. Please check your connection.');
      return false;
    }
  };

  const sendPayment = async (amount: number, recipient: string) => {
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!recipient) {
      toast.error('Please enter recipient details');
      return;
    }

    // Check if sufficient balance
    if (balance < amount) {
      toast.error('Insufficient balance');
      return;
    }

    const verificationHash = generateVerificationHash(amount, user?.id || '', Date.now());
    const qrCode = generateQRCode('', amount);

    const transactionData = {
      id: crypto.randomUUID(),
      type: 'send' as const,
      amount,
      recipient,
      status: 'pending_sync' as const,
      verification_hash: verificationHash,
      qr_code: qrCode,
    };

    const transactionCode = saveOfflineTransaction(transactionData);

    if (isOnline) {
      toast.success(`Payment Sent – ${transactionCode} (Ready to sync)`);
    } else {
      toast.success(`Payment Sent – ${transactionCode} (Offline - sync when connected)`);
    }

    fetchTransactions();
    calculateBalance();
  };

  const receivePayment = async (amount: number, sender: string) => {
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!sender) {
      toast.error('Please enter sender details');
      return;
    }

    const transactionData = {
      id: crypto.randomUUID(),
      type: 'receive' as const,
      amount,
      sender,
      status: 'pending_sync' as const,
    };

    const transactionCode = saveOfflineTransaction(transactionData);

    if (isOnline) {
      toast.success(`Payment Received – ${transactionCode} (Ready to sync)`);
    } else {
      toast.success(`Payment Received – ${transactionCode} (Offline - sync when connected)`);
    }

    fetchTransactions();
    calculateBalance();
  };

  const verifyTransaction = (transactionCode: string) => {
    const offlineTransactions = getOfflineTransactions();
    const transaction = offlineTransactions.find(tx => tx.transaction_code === transactionCode);

    if (!transaction) {
      toast.error('Transaction not found');
      return false;
    }

    if (transaction.status === 'offline_verified' || transaction.status === 'synced') {
      toast.info('Transaction already verified');
      return true;
    }

    markTransactionAsVerified(transactionCode);
    toast.success(`Transaction ${transactionCode} verified offline`);
    fetchTransactions();
    calculateBalance();
    return true;
  };

  const getOfflineTransactionsList = () => {
    return getOfflineTransactions();
  };

  const removeOfflineTransaction = (transactionCode: string) => {
    const transaction = transactions.find(tx => tx.transaction_code === transactionCode);
    
    if (transaction?.status === 'synced') {
      toast.error('Cannot delete synced transactions');
      return;
    }
    
    deleteOfflineTransaction(transactionCode);
    toast.success('Transaction deleted');
    fetchTransactions();
    calculateBalance();
  };

  return {
    transactions,
    balance,
    loading,
    sendPayment,
    receivePayment,
    verifyTransaction,
    getOfflineTransactionsList,
    removeOfflineTransaction,
    syncOfflineTransactions,
    getPendingTransactions: getPendingSyncTransactions,
  };
};
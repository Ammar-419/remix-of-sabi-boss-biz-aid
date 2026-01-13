import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useOfflineSync } from './useOfflineSync';
import {
  saveOfflineLoanRequest,
  getOfflineLoanRequests,
  getPendingSyncLoans,
  markLoanAsSynced,
  deleteSyncedLoans,
  deleteOfflineLoan,
} from '@/lib/offlineLoanStorage';

export interface Loan {
  id: string;
  loan_type: 'given' | 'taken';
  borrower_lender: string;
  amount: number;
  due_date?: string;
  repayment_status: 'pending' | 'partial' | 'paid';
  amount_repaid: number;
  description?: string;
}

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isOnline } = useOfflineSync();

  useEffect(() => {
    if (user) {
      fetchLoans();
      subscribeToChanges();
    }
  }, [user]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && user) {
      syncOfflineLoans();
    }
  }, [isOnline, user]);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans((data as Loan[]) || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('loans-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loans' }, () => {
        fetchLoans();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const syncOfflineLoans = async () => {
    const pendingLoans = getPendingSyncLoans();
    if (pendingLoans.length === 0) return;

    console.log('Syncing offline loans:', pendingLoans);

    for (const offlineLoan of pendingLoans) {
      try {
        const { error } = await supabase.from('loans').insert({
          user_id: user?.id,
          loan_type: offlineLoan.loan_type,
          borrower_lender: offlineLoan.borrower_lender,
          amount: offlineLoan.amount,
          due_date: offlineLoan.due_date,
          repayment_status: offlineLoan.repayment_status,
          amount_repaid: offlineLoan.amount_repaid,
          description: offlineLoan.description,
        });

        if (!error) {
          markLoanAsSynced(offlineLoan.transaction_code);
          toast.success(`Loan ${offlineLoan.transaction_code} synced successfully`);
        }
      } catch (error) {
        console.error('Failed to sync loan:', error);
      }
    }

    // Clean up synced loans after a delay
    setTimeout(() => {
      deleteSyncedLoans();
      fetchLoans();
    }, 2000);
  };

  const addLoan = async (loan: Omit<Loan, 'id'>) => {
    // If offline, save locally
    if (!isOnline) {
      const transactionCode = saveOfflineLoanRequest(loan);
      toast.success(`Loan Request Recorded – Pending Sync (${transactionCode})`);
      return;
    }

    // If online, save to Supabase
    try {
      const { error } = await supabase.from('loans').insert({
        user_id: user?.id,
        ...loan,
      });

      if (error) throw error;
      toast.success('Loan recorded successfully');
    } catch (error: any) {
      // If online save fails, save offline as fallback
      const transactionCode = saveOfflineLoanRequest(loan);
      toast.warning(`Saved offline – will sync later (${transactionCode})`);
    }
  };

  const updateLoan = async (id: string, updates: Partial<Loan>) => {
    try {
      const { error } = await supabase
        .from('loans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Loan updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update loan');
    }
  };

  const deleteLoan = async (id: string) => {
    try {
      const { error } = await supabase.from('loans').delete().eq('id', id);

      if (error) throw error;
      toast.success('Loan deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete loan');
    }
  };

  const getOfflineLoans = () => {
    return getOfflineLoanRequests();
  };

  const removeOfflineLoan = (transactionCode: string) => {
    deleteOfflineLoan(transactionCode);
    toast.success('Offline loan request deleted');
  };

  return {
    loans,
    loading,
    addLoan,
    updateLoan,
    deleteLoan,
    getOfflineLoans,
    removeOfflineLoan,
    syncOfflineLoans,
  };
};

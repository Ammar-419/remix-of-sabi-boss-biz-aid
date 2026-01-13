import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchExpenses();
      subscribeToChanges();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchExpenses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'expense_date'>) => {
    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: user?.id,
        ...expense,
      });

      if (error) throw error;
      toast.success('Expense logged successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);

      if (error) throw error;
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete expense');
    }
  };

  return { expenses, loading, addExpense, deleteExpense };
};

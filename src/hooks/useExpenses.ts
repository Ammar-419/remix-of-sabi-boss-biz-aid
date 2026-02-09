import { useState, useEffect, useCallback } from 'react';
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

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExpenses();
      
      // Subscribe to realtime changes
      const channel = supabase
        .channel('expenses-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
          fetchExpenses();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchExpenses]);

  const addExpense = async (expense: Omit<Expense, 'id' | 'expense_date'>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Use insert().select() to get the created record back
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          ...expense,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Immediately update local state with the new record
      if (data) {
        setExpenses(prevExpenses => [data, ...prevExpenses]);
      }
      
      toast.success('Expense logged successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to log expense');
      return false;
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);

      if (error) throw error;
      
      // Immediately update local state
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
      
      toast.success('Expense deleted successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete expense');
      return false;
    }
  };

  return { expenses, loading, addExpense, deleteExpense, refetch: fetchExpenses };
};

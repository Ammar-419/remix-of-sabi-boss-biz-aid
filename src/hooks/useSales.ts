import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Sale {
  id: string;
  product: string;
  quantity: number;
  price: number;
  customer?: string;
  sale_date: string;
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSales = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSales();
      
      // Subscribe to realtime changes
      const channel = supabase
        .channel('sales-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
          fetchSales();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchSales]);

  const addSale = async (sale: Omit<Sale, 'id' | 'sale_date'>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Use insert().select() to get the created record back
      const { data, error } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          ...sale,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Immediately update local state with the new record
      if (data) {
        setSales(prevSales => [data, ...prevSales]);
      }
      
      toast.success('Sale recorded successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to record sale');
      return false;
    }
  };

  const deleteSale = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);

      if (error) throw error;
      
      // Immediately update local state
      setSales(prevSales => prevSales.filter(sale => sale.id !== id));
      
      toast.success('Sale deleted successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sale');
      return false;
    }
  };

  return { sales, loading, addSale, deleteSale, refetch: fetchSales };
};

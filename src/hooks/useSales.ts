import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (user) {
      fetchSales();
      subscribeToChanges();
    }
  }, [user]);

  const fetchSales = async () => {
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
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        fetchSales();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addSale = async (sale: Omit<Sale, 'id' | 'sale_date'>) => {
    try {
      const { error } = await supabase.from('sales').insert({
        user_id: user?.id,
        ...sale,
      });

      if (error) throw error;
      toast.success('Sale recorded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to record sale');
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);

      if (error) throw error;
      toast.success('Sale deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sale');
    }
  };

  return { sales, loading, addSale, deleteSale };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  reorder_level: number;
}

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInventory();
      subscribeToChanges();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchInventory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      const { error } = await supabase.from('inventory').insert({
        user_id: user?.id,
        ...item,
      });

      if (error) throw error;
      toast.success('Item added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add item');
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Item updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);

      if (error) throw error;
      toast.success('Item deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
    }
  };

  return { inventory, loading, addItem, updateItem, deleteItem };
};

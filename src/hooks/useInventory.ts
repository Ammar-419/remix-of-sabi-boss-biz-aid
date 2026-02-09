import { useState, useEffect, useCallback } from 'react';
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

  const fetchInventory = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchInventory();
      
      // Subscribe to realtime changes
      const channel = supabase
        .channel('inventory-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
          fetchInventory();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchInventory]);

  const addItem = async (item: Omit<InventoryItem, 'id'>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Use insert().select() to get the created record back
      const { data, error } = await supabase
        .from('inventory')
        .insert({
          user_id: user.id,
          ...item,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Immediately update local state with the new record
      if (data) {
        setInventory(prevInventory => [data, ...prevInventory]);
      }
      
      toast.success('Item added successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to add item');
      return false;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Immediately update local state
      if (data) {
        setInventory(prevInventory => 
          prevInventory.map(item => item.id === id ? data : item)
        );
      }
      
      toast.success('Item updated successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update item');
      return false;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);

      if (error) throw error;
      
      // Immediately update local state
      setInventory(prevInventory => prevInventory.filter(item => item.id !== id));
      
      toast.success('Item deleted successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
      return false;
    }
  };

  return { inventory, loading, addItem, updateItem, deleteItem, refetch: fetchInventory };
};

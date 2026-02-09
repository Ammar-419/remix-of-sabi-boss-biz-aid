import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  total_purchases: number;
  last_visit: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('last_visit', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
      
      // Subscribe to realtime changes
      const channel = supabase
        .channel('customers-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
          fetchCustomers();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchCustomers]);

  const addCustomer = async (customer: Omit<Customer, 'id' | 'total_purchases' | 'last_visit'>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Use insert().select() to get the created record back
      const { data, error } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          ...customer,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Immediately update local state with the new record
      if (data) {
        setCustomers(prevCustomers => [data, ...prevCustomers]);
      }
      
      toast.success('Customer added successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to add customer');
      return false;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Immediately update local state
      if (data) {
        setCustomers(prevCustomers => 
          prevCustomers.map(customer => customer.id === id ? data : customer)
        );
      }
      
      toast.success('Customer updated successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update customer');
      return false;
    }
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);

      if (error) throw error;
      
      // Immediately update local state
      setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== id));
      
      toast.success('Customer deleted successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete customer');
      return false;
    }
  };

  return { customers, loading, addCustomer, updateCustomer, deleteCustomer, refetch: fetchCustomers };
};

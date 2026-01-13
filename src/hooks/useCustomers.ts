import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (user) {
      fetchCustomers();
      subscribeToChanges();
    }
  }, [user]);

  const fetchCustomers = async () => {
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
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('customers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addCustomer = async (customer: Omit<Customer, 'id' | 'total_purchases' | 'last_visit'>) => {
    try {
      const { error } = await supabase.from('customers').insert({
        user_id: user?.id,
        ...customer,
      });

      if (error) throw error;
      toast.success('Customer added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add customer');
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Customer updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update customer');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);

      if (error) throw error;
      toast.success('Customer deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete customer');
    }
  };

  return { customers, loading, addCustomer, updateCustomer, deleteCustomer };
};

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Phone, Mail, MessageCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCustomers } from "@/hooks/useCustomers";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const Customers = () => {
  const { customers, loading, addCustomer, deleteCustomer } = useCustomers();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCustomer(formData);
    setIsOpen(false);
    setFormData({ name: "", phone: "", email: "" });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer(id);
    }
  };

  const sendWhatsApp = (phone: string, name: string) => {
    if (!phone || phone.trim() === '') {
      toast.error('Please add a phone number for this customer first');
      return;
    }
    
    // Clean phone number and convert to international format
    const cleanPhone = phone.replace(/\s+/g, '').replace(/^0/, '234');
    
    if (cleanPhone.length < 10) {
      toast.error('Invalid phone number format');
      return;
    }
    
    const message = encodeURIComponent(`Hello ${name}, thank you for being a valued customer at our business!`);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp...');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <p className="text-lg">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('customers')}</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('name')}
                  required
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('phone')}
                  required
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={`${t('email')} (${t('optional')})`}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary">
                Add Customer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6 shadow-card bg-secondary-light">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
            <Users className="h-8 w-8 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="text-lg text-muted-foreground">Total Customers</h3>
            <p className="text-4xl font-bold">{customers.length}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="p-6 shadow-card hover:shadow-elevated transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {customer.name.charAt(0)}
                </span>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">{customer.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                {customer.phone}
              </div>
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                {customer.email}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-muted-foreground">Total Purchases:</span>
                <span className="font-semibold">₦{customer.total_purchases.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Last Visit:</span>
                <span className="text-sm">{new Date(customer.last_visit).toLocaleDateString()}</span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => sendWhatsApp(customer.phone, customer.name)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleDelete(customer.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Customers;

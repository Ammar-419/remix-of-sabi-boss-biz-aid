import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSales } from "@/hooks/useSales";
import { useInventory } from "@/hooks/useInventory";
import { useLanguage } from "@/contexts/LanguageContext";
import { VoiceRecorder } from "@/components/VoiceRecorder";

const Sales = () => {
  const { sales, loading, addSale, deleteSale } = useSales();
  const { inventory } = useInventory();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ product: "", quantity: 1, price: 0, customer: "" });
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addSale(formData);
    setIsOpen(false);
    setFormData({ product: "", quantity: 1, price: 0, customer: "" });
    setVoiceNote(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this sale?')) {
      await deleteSale(id);
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);

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
          <h1 className="text-3xl font-bold">{t('sales')}</h1>
          <p className="text-muted-foreground">Record and track your sales</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Product</Label>
                <Select value={formData.product} onValueChange={(value) => setFormData({ ...formData, product: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('product')} />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map((item) => (
                      <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div>
                <Label>Total Price (₦)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  placeholder={t('price')}
                  required
                />
              </div>
              <div>
                <Label>Customer Name</Label>
                <Input
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  placeholder={`${t('customer')} (${t('optional')})`}
                />
              </div>
              <div>
                <Label>Voice Note (Optional)</Label>
                <VoiceRecorder onRecordingComplete={(blob) => setVoiceNote(blob)} />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary">
                {t('recordSale')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6 shadow-card bg-gradient-success text-secondary-foreground">
        <h3 className="text-lg mb-2">Total Sales Today</h3>
        <p className="text-4xl font-bold">₦{totalSales.toLocaleString()}</p>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Recent Sales</h3>
        {sales.map((sale) => (
          <Card key={sale.id} className="p-6 shadow-card hover:shadow-elevated transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold">{sale.product}</h4>
                    <p className="text-sm text-muted-foreground">
                      Qty: {sale.quantity} {sale.customer && `• Customer: ${sale.customer}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center space-x-4">
                <p className="text-2xl font-bold text-secondary">₦{(sale.price * sale.quantity).toLocaleString()}</p>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleDelete(sale.id)}
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

export default Sales;

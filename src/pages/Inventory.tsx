import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useInventory } from "@/hooks/useInventory";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Inventory = () => {
  const { inventory, loading, addItem, updateItem, deleteItem } = useInventory();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    category: "", 
    quantity: 0, 
    unit_price: 0, 
    reorder_level: 5 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await updateItem(editingProduct.id, formData);
    } else {
      await addItem(formData);
    }
    setIsOpen(false);
    setFormData({ name: "", category: "", quantity: 0, unit_price: 0, reorder_level: 5 });
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      unit_price: product.unit_price,
      reorder_level: product.reorder_level,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(id);
    }
  };

  const filteredProducts = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.quantity <= item.reorder_level);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <p className="text-lg">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {lowStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lowStockItems.length} item(s) are low on stock! Please restock soon.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('inventory')}</h1>
          <p className="text-muted-foreground">Manage your products and stock</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('product')}
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder={t('category')}
                  required
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder={t('quantity')}
                  required
                />
              </div>
              <div>
                <Label>Unit Price (₦)</Label>
                <Input
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseInt(e.target.value) || 0 })}
                  placeholder={t('price')}
                  required
                />
              </div>
              <div>
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 5 })}
                  placeholder="5"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary">
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={`${t('search')}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="p-6 shadow-card hover:shadow-elevated transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground">Quantity: {product.quantity}</p>
              </div>
              <div className="flex space-x-2">
                <Button size="icon" variant="ghost" onClick={() => handleEdit(product)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-semibold">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-semibold">₦{product.unit_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-semibold text-secondary">₦{(product.unit_price * product.quantity).toLocaleString()}</span>
              </div>
              {product.quantity <= product.reorder_level && (
                <div className="text-xs text-destructive flex items-center mt-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Low stock alert!
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Inventory;

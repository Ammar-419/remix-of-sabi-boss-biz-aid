import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenses } from "@/hooks/useExpenses";
import { useLanguage } from "@/contexts/LanguageContext";
import { VoiceRecorder } from "@/components/VoiceRecorder";

const Expenses = () => {
  const { expenses, loading, addExpense, deleteExpense } = useExpenses();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ category: "", amount: 0, description: "" });
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null);

  const categories = ["Rent", "Transport", "Utilities", "Stock", "Marketing", "Salary", "Others"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExpense(formData);
    setIsOpen(false);
    setFormData({ category: "", amount: 0, description: "" });
    setVoiceNote(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(id);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <p className="text-lg">{t('loading')}</p>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    "Rent": "primary",
    "Transport": "secondary",
    "Utilities": "accent",
    "Stock": "muted",
    "Marketing": "primary",
    "Salary": "secondary",
    "Others": "accent",
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('expenses')}</h1>
          <p className="text-muted-foreground">Track your business expenses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-soft">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₦)</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
                  placeholder={t('amount')}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('description')}
                  required
                />
              </div>
              <div>
                <Label>Voice Note (Optional)</Label>
                <VoiceRecorder onRecordingComplete={(blob) => setVoiceNote(blob)} />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary">
                Log Expense
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6 shadow-card bg-accent text-accent-foreground">
        <h3 className="text-lg mb-2">Total Expenses This Month</h3>
        <p className="text-4xl font-bold">₦{totalExpenses.toLocaleString()}</p>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Recent Expenses</h3>
        {expenses.map((expense) => (
          <Card key={expense.id} className="p-6 shadow-card hover:shadow-elevated transition-all">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl bg-${categoryColors[expense.category]}-light flex items-center justify-center`}>
                    <Receipt className={`h-6 w-6 text-${categoryColors[expense.category]}`} />
                  </div>
                  <div>
                    <h4 className="font-bold">{expense.category}</h4>
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center space-x-4">
                <p className="text-2xl font-bold text-destructive">-₦{expense.amount.toLocaleString()}</p>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleDelete(expense.id)}
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

export default Expenses;

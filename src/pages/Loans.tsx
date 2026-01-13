import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wallet, TrendingUp, Calendar, Plus, CheckCircle2, Clock, XCircle, WifiOff, CloudOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLoans } from "@/hooks/useLoans";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const Loans = () => {
  const { t } = useLanguage();
  const { loans, loading, addLoan, getOfflineLoans, removeOfflineLoan } = useLoans();
  const { isOnline } = useOfflineSync();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [offlineLoans, setOfflineLoans] = useState<any[]>([]);

  // Form state
  const [loanType, setLoanType] = useState<'given' | 'taken'>('taken');
  const [borrowerLender, setBorrowerLender] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const offline = getOfflineLoans();
    setOfflineLoans(offline);
  }, [loans, isOnline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!borrowerLender || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    await addLoan({
      loan_type: loanType,
      borrower_lender: borrowerLender,
      amount: parseFloat(amount),
      due_date: dueDate || undefined,
      repayment_status: 'pending',
      amount_repaid: 0,
      description: description || undefined,
    });

    // Reset form
    setBorrowerLender('');
    setAmount('');
    setDueDate('');
    setDescription('');
    setIsDialogOpen(false);

    // Refresh offline loans
    const offline = getOfflineLoans();
    setOfflineLoans(offline);
  };

  const totalBorrowed = loans.filter(l => l.loan_type === 'taken').reduce((sum, l) => sum + Number(l.amount), 0);
  const totalLent = loans.filter(l => l.loan_type === 'given').reduce((sum, l) => sum + Number(l.amount), 0);
  const pendingRepayment = loans.filter(l => l.repayment_status !== 'paid').reduce((sum, l) => sum + (Number(l.amount) - Number(l.amount_repaid)), 0);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header with offline banner */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('loansAndSavings')}</h1>
            <p className="text-muted-foreground">{t('manageFinances')}</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-soft">
                <Plus className="h-4 w-4 mr-2" />
                {t('requestLoan')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('requestLoan')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>{t('loanType')}</Label>
                  <Select value={loanType} onValueChange={(val) => setLoanType(val as 'given' | 'taken')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="taken">{t('moneyBorrowed')}</SelectItem>
                      <SelectItem value="given">{t('moneyLent')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{loanType === 'taken' ? t('lenderName') : t('borrowerName')}</Label>
                  <Input
                    placeholder={loanType === 'taken' ? t('lenderName') : t('borrowerName')}
                    value={borrowerLender}
                    onChange={(e) => setBorrowerLender(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>{t('amount')}</Label>
                  <Input
                    type="number"
                    placeholder={t('amount')}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>{t('dueDate')}</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>{t('description')} ({t('optional')})</Label>
                  <Textarea
                    placeholder={t('description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  {isOnline ? t('submitRequest') : t('saveOffline')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Offline Mode Banner */}
        {!isOnline && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <div className="flex items-center space-x-3">
              <WifiOff className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Offline Mode</p>
                <p className="text-sm text-muted-foreground">
                  Loan requests will sync automatically once internet is available.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 shadow-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('totalBorrowed')}</p>
              <p className="text-2xl font-bold">₦{totalBorrowed.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('totalLent')}</p>
              <p className="text-2xl font-bold">₦{totalLent.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('pendingRepayment')}</p>
              <p className="text-2xl font-bold">₦{pendingRepayment.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Offline Pending Loans */}
      {offlineLoans.length > 0 && (
        <Card className="p-6 shadow-card border-secondary">
          <div className="flex items-center space-x-2 mb-4">
            <CloudOff className="h-5 w-5 text-secondary" />
            <h3 className="font-bold text-lg">{t('offlineRequests')}</h3>
            <Badge variant="secondary">{offlineLoans.length}</Badge>
          </div>
          <div className="space-y-3">
            {offlineLoans.map((loan) => (
              <div key={loan.transaction_code} className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{loan.borrower_lender}</p>
                    <p className="text-2xl font-bold text-primary">₦{Number(loan.amount).toLocaleString()}</p>
                  </div>
                  <Badge variant={loan.sync_status === 'pending_sync' ? 'secondary' : 'default'}>
                    {loan.sync_status === 'pending_sync' && <Clock className="h-3 w-3 mr-1" />}
                    {loan.sync_status === 'synced' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {loan.sync_status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                    {loan.sync_status === 'pending_sync' ? t('pendingSync') : loan.sync_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{loan.transaction_code}</span>
                  <Badge variant="outline">{loan.loan_type === 'taken' ? t('borrowed') : t('lent')}</Badge>
                </div>
                {loan.description && (
                  <p className="text-sm text-muted-foreground mt-2">{loan.description}</p>
                )}
                {loan.sync_status === 'pending_sync' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      removeOfflineLoan(loan.transaction_code);
                      setOfflineLoans(getOfflineLoans());
                    }}
                    className="mt-2 text-destructive"
                  >
                    {t('delete')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="p-6 shadow-card">
        <h3 className="font-bold text-lg mb-4">{t('transactionHistory')}</h3>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">{t('loading')}...</p>
        ) : loans.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('noLoansYet')}</p>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <div key={loan.id} className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{loan.borrower_lender}</p>
                    <p className="text-2xl font-bold text-primary">₦{Number(loan.amount).toLocaleString()}</p>
                  </div>
                  <Badge
                    variant={
                      loan.repayment_status === 'paid'
                        ? 'default'
                        : loan.repayment_status === 'partial'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {loan.repayment_status === 'paid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {loan.repayment_status === 'partial' && <Clock className="h-3 w-3 mr-1" />}
                    {loan.repayment_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{loan.loan_type === 'taken' ? t('borrowed') : t('lent')}</Badge>
                  {loan.due_date && (
                    <span className="text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(loan.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {loan.description && (
                  <p className="text-sm text-muted-foreground mt-2">{loan.description}</p>
                )}
                {loan.amount_repaid > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t('repaid')}: ₦{Number(loan.amount_repaid).toLocaleString()} / ₦{Number(loan.amount).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Loans;

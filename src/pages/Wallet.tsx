import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Send, Download, CheckCircle2, Clock, XCircle, WifiOff, CloudOff, QrCode, RefreshCw, TrendingUp, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/hooks/useWallet";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const WalletPage = () => {
  const { t } = useLanguage();
  const { balance, transactions, loading, sendPayment, receivePayment, verifyTransaction, getOfflineTransactionsList, removeOfflineTransaction, syncOfflineTransactions } = useWallet();
  const { isOnline } = useOfflineSync();
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [offlineTransactions, setOfflineTransactions] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Credit score state
  const [showCreditScore, setShowCreditScore] = useState(false);
  const [creditScore, setCreditScore] = useState(0);
  const [creditLevel, setCreditLevel] = useState('');

  // Send form state
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  // Receive form state
  const [receiveAmount, setReceiveAmount] = useState('');
  const [sender, setSender] = useState('');

  // Verify form state
  const [verifyCode, setVerifyCode] = useState('');

  // Utility functions for credit score calculation
  const calculateVariance = (numbers: number[]) => {
    if (numbers.length === 0) return 0;
    const avg = numbers.reduce((a, b) => a + b) / numbers.length;
    const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
    return squareDiffs.reduce((a, b) => a + b) / numbers.length;
  };

  const calculateHistoryMonths = (transactions: any[]) => {
    if (transactions.length === 0) return 1;
    
    const dates = transactions.map(tx => new Date(tx.local_timestamp || tx.timestamp));
    const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const months = (new Date().getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(1, months);
  };

  const calculateMonthlyVolume = (transactions: any[]) => {
    if (transactions.length === 0) return 0;
    
    const amounts = transactions.map(tx => tx.amount);
    const totalVolume = amounts.reduce((a: number, b: number) => a + b, 0);
    const historyMonths = calculateHistoryMonths(transactions);
    
    return totalVolume / Math.max(1, historyMonths);
  };

  // Enhanced credit score calculation factors
  const calculatePaymentHistory = (completedTransactions: any[]) => {
    if (completedTransactions.length === 0) return 50;
    
    const totalAmount = completedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const averageTransaction = totalAmount / completedTransactions.length;
    
    let score = 50;
    
    if (completedTransactions.length >= 10) score += 20;
    if (completedTransactions.length >= 20) score += 15;
    
    const amounts = completedTransactions.map(tx => tx.amount);
    const variance = calculateVariance(amounts);
    if (variance < averageTransaction * 0.5) score += 15;
    
    return Math.min(100, score);
  };

  const calculateCreditUtilization = (balance: number, completedTransactions: any[]) => {
    const monthlyVolume = calculateMonthlyVolume(completedTransactions);
    if (monthlyVolume === 0) return 50;
    
    const utilization = balance / monthlyVolume;
    
    if (utilization < 0.3) return 100;
    if (utilization < 0.5) return 80;
    if (utilization < 0.7) return 60;
    if (utilization < 0.9) return 40;
    return 20;
  };

  const calculateCreditHistoryLength = (completedTransactions: any[]) => {
    if (completedTransactions.length === 0) return 20;
    
    const historyMonths = calculateHistoryMonths(completedTransactions);
    
    if (historyMonths > 24) return 100;
    if (historyMonths > 12) return 80;
    if (historyMonths > 6) return 60;
    if (historyMonths > 3) return 40;
    return 20;
  };

  const calculateCreditMix = (completedTransactions: any[]) => {
    const transactionTypes = completedTransactions.reduce((acc: any, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {});

    const typeCount = Object.keys(transactionTypes).length;
    
    if (typeCount >= 3) return 100;
    if (typeCount === 2) return 75;
    if (typeCount === 1) return 50;
    return 25;
  };

  const calculateNewCredit = (pendingTransactions: any[], completedTransactions: any[]) => {
    const recentTransactions = completedTransactions.filter(tx => {
      const txDate = new Date(tx.local_timestamp || tx.timestamp);
      const daysAgo = (new Date().getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo < 30;
    });

    const recentActivity = recentTransactions.length;
    const pendingCount = pendingTransactions.length;
    
    let score = 70;
    
    if (pendingCount > 5) score -= 30;
    else if (pendingCount > 2) score -= 15;
    
    if (recentActivity >= 5) score += 20;
    else if (recentActivity >= 2) score += 10;
    
    const avgMonthly = completedTransactions.length / Math.max(1, calculateHistoryMonths(completedTransactions));
    if (recentActivity > avgMonthly * 3) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  };

  const getCreditLevel = (score: number) => {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  };

  // Enhanced credit score calculation
  const calculateCreditScore = () => {
    const allTransactions = [...transactions, ...offlineTransactions];
    const completedTransactions = allTransactions.filter(tx => 
      tx.status === 'synced' || tx.status === 'offline_verified'
    );
    
    const pendingTransactions = allTransactions.filter(tx => 
      tx.status === 'pending_sync'
    );

    // Calculate factors for credit score
    const factors = {
      paymentHistory: calculatePaymentHistory(completedTransactions),
      creditUtilization: calculateCreditUtilization(balance, completedTransactions),
      creditHistoryLength: calculateCreditHistoryLength(completedTransactions),
      creditMix: calculateCreditMix(completedTransactions),
      newCredit: calculateNewCredit(pendingTransactions, completedTransactions)
    };

    // Weighted calculation (standard FICO model weights)
    let score = 0;
    score += factors.paymentHistory * 0.35;
    score += factors.creditUtilization * 0.30;
    score += factors.creditHistoryLength * 0.15;
    score += factors.creditMix * 0.10;
    score += factors.newCredit * 0.10;

    // Convert to 300-850 scale
    score = Math.round((score / 100) * 550 + 300);
    
    // Cap between 300-850
    score = Math.max(300, Math.min(850, score));
    
    setCreditScore(score);
    setCreditLevel(getCreditLevel(score));
    setShowCreditScore(true);
    
    toast.success(`Credit Score Calculated: ${score} (${getCreditLevel(score)})`);
  };

  const getCreditScoreColor = () => {
    if (creditScore >= 800) return 'text-green-400';
    if (creditScore >= 740) return 'text-blue-400';
    if (creditScore >= 670) return 'text-green-500';
    if (creditScore >= 580) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCreditProgress = () => {
    return ((creditScore - 300) / (850 - 300)) * 100;
  };

  // Refresh offline transactions
  const refreshOfflineTransactions = useCallback(() => {
    const offline = getOfflineTransactionsList();
    setOfflineTransactions(offline);
  }, [getOfflineTransactionsList]);

  // Effect to sync transactions when online
  useEffect(() => {
    refreshOfflineTransactions();
  }, [transactions, isOnline, refreshOfflineTransactions]);

  const handleManualSync = async () => {
    if (offlineTransactions.length === 0) return;
    
    setIsSyncing(true);
    try {
      await syncOfflineTransactions();
      refreshOfflineTransactions();
      toast.success(t('transactionsSynced'));
    } catch (error) {
      toast.error(t('syncFailed'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sendAmount || !recipient) {
      toast.error(t('fillAllFields'));
      return;
    }

    const amount = parseFloat(sendAmount);
    if (amount <= 0) {
      toast.error(t('invalidAmount'));
      return;
    }

    try {
      await sendPayment(amount, recipient);
      toast.success(isOnline ? t('paymentSent') : t('paymentSavedOffline'));
      
      // Reset form
      setSendAmount('');
      setRecipient('');
      setIsSendDialogOpen(false);

      // Refresh transactions
      refreshOfflineTransactions();
    } catch (error) {
      toast.error(t('paymentFailed'));
    }
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiveAmount || !sender) {
      toast.error(t('fillAllFields'));
      return;
    }

    const amount = parseFloat(receiveAmount);
    if (amount <= 0) {
      toast.error(t('invalidAmount'));
      return;
    }

    try {
      await receivePayment(amount, sender);
      toast.success(isOnline ? t('paymentReceived') : t('paymentSavedOffline'));
      
      // Reset form
      setReceiveAmount('');
      setSender('');
      setIsReceiveDialogOpen(false);

      // Refresh transactions
      refreshOfflineTransactions();
    } catch (error) {
      toast.error(t('paymentFailed'));
    }
  };

  const handleVerifyTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verifyCode) {
      toast.error(t('enterTransactionCode'));
      return;
    }

    try {
      const verified = await verifyTransaction(verifyCode);
      if (verified) {
        toast.success(t('transactionVerified'));
        setVerifyCode('');
        setIsVerifyDialogOpen(false);
        refreshOfflineTransactions();
      } else {
        toast.error(t('verificationFailed'));
      }
    } catch (error) {
      toast.error(t('verificationFailed'));
    }
  };

  const handleRemoveOfflineTransaction = (transactionCode: string) => {
    removeOfflineTransaction(transactionCode);
    refreshOfflineTransactions();
    toast.success(t('transactionRemoved'));
  };

  // Combine and sort all transactions for display
  const getAllTransactions = () => {
    const allTx = [...transactions, ...offlineTransactions];
    
    // Remove duplicates based on transaction_code
    const uniqueTx = allTx.filter((tx, index, self) => 
      index === self.findIndex(t => t.transaction_code === tx.transaction_code)
    );
    
    // Sort by timestamp (newest first)
    return uniqueTx.sort((a, b) => {
      const dateA = new Date(a.local_timestamp || a.timestamp || 0);
      const dateB = new Date(b.local_timestamp || b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const allTransactions = getAllTransactions();

  // Filter only pending sync transactions for the offline section
  const pendingSyncTransactions = offlineTransactions.filter(tx => 
    tx.status === 'pending_sync' || tx.status === 'offline_verified'
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header with offline banner */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('wallet')}</h1>
            <p className="text-muted-foreground">{t('managePayments')}</p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-soft">
                  <Send className="h-4 w-4 mr-2" />
                  {t('sendPayment')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('sendPayment')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSendPayment} className="space-y-4">
                  <div>
                    <Label htmlFor="send-amount">{t('amount')}</Label>
                    <Input
                      id="send-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipient">{t('recipient')}</Label>
                    <Input
                      id="recipient"
                      placeholder={t('recipientPlaceholder') || "Enter recipient"}
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? t('processing') : (isOnline ? t('sendNow') : t('saveOffline'))}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="shadow-soft">
                  <Download className="h-4 w-4 mr-2" />
                  {t('receivePayment')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('receivePayment')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleReceivePayment} className="space-y-4">
                  <div>
                    <Label htmlFor="receive-amount">{t('amount')}</Label>
                    <Input
                      id="receive-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={receiveAmount}
                      onChange={(e) => setReceiveAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sender">{t('sender')}</Label>
                    <Input
                      id="sender"
                      placeholder={t('senderPlaceholder') || "Enter sender"}
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? t('processing') : (isOnline ? t('confirmReceipt') : t('saveOffline'))}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Calculate Credit Score Button */}
            <Button 
              variant="outline" 
              className="shadow-soft"
              onClick={calculateCreditScore}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Calculate Credit Score
            </Button>

            <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="shadow-soft">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t('verifyTransaction')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('verifyTransaction')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleVerifyTransaction} className="space-y-4">
                  <div>
                    <Label htmlFor="verify-code">{t('transactionCode')}</Label>
                    <Input
                      id="verify-code"
                      placeholder="TX-XXXXX"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    {t('verify')}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Offline Mode Banner */}
        {!isOnline && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <div className="flex items-center space-x-3">
              <WifiOff className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-medium text-destructive">{t('offlineMode')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('transactionsSyncMessage')}
                </p>
              </div>
              {pendingSyncTransactions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {isSyncing ? t('syncing') : t('trySync')}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Balance Card */}
      <Card className="p-6 shadow-card bg-gradient-primary">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-primary-foreground/80">{t('currentBalance')}</p>
            <p className="text-3xl font-bold text-primary-foreground">₦{balance.toLocaleString()}</p>
          </div>
          {pendingSyncTransactions.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingSyncTransactions.length} {t('pending')}
            </Badge>
          )}
        </div>
      </Card>

      {/* Credit Score Card - Only shows after calculation */}
      {showCreditScore && (
        <Card className="p-6 shadow-card bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-white/80">Credit Score</p>
                <p className={`text-3xl font-bold ${getCreditScoreColor()}`}>
                  {creditScore}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              {creditLevel}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">300</span>
              <span className="text-white/80">850</span>
            </div>
            <Progress value={getCreditProgress()} className="h-2 bg-white/20" />
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1">
                <span>Based on {allTransactions.length} transactions</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Updated just now</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Sync Transactions with Sync All Button */}
      {pendingSyncTransactions.length > 0 && (
        <Card className="p-6 shadow-card border-secondary">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CloudOff className="h-5 w-5 text-secondary" />
              <h3 className="font-bold text-lg">{t('offlineTransactions')}</h3>
              <Badge variant="secondary">{pendingSyncTransactions.length}</Badge>
            </div>
            {isOnline && (
              <Button
                variant="default"
                size="sm"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CloudOff className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? t('syncing') : 'Sync All'}
              </Button>
            )}
          </div>
          
          {/* Sync Info Message */}
          {isOnline && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Sync All:</strong> Click the button above to sync all pending transactions to the cloud. 
                After successful sync, these transactions will be removed from this list.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {pendingSyncTransactions.map((tx) => (
              <div key={tx.transaction_code} className="p-4 bg-muted rounded-lg border-l-4 border-l-secondary">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {tx.type === 'send' ? t('sentTo') : t('receivedFrom')}: {tx.recipient || tx.sender}
                    </p>
                    <p className="text-2xl font-bold text-primary">₦{Number(tx.amount).toLocaleString()}</p>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {t('pendingSync')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tx.transaction_code}</span>
                  <Badge variant="outline">
                    {tx.type === 'send' ? t('sent') : t('received')}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(tx.local_timestamp).toLocaleString()}
                </div>
                {tx.qr_code && (
                  <div className="mt-2 flex items-center text-sm text-muted-foreground">
                    <QrCode className="h-4 w-4 mr-1" />
                    <span>{t('qrCodeAvailable')}</span>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOfflineTransaction(tx.transaction_code)}
                    className="text-destructive"
                  >
                    {t('delete')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Combined Transaction History - ALL transactions stay here forever */}
      <Card className="p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{t('transactionHistory')}</h3>
          {allTransactions.length > 0 && (
            <Badge variant="outline">
              {allTransactions.length} {t('transactions')}
            </Badge>
          )}
        </div>
        
        {loading ? (
          <p className="text-center text-muted-foreground py-8">{t('loading')}...</p>
        ) : allTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('noTransactionsYet')}</p>
        ) : (
          <div className="space-y-3">
            {allTransactions.map((tx) => (
              <div 
                key={tx.transaction_code || tx.id} 
                className={`p-4 rounded-lg border-l-4 ${
                  tx.status === 'pending_sync' 
                    ? 'bg-yellow-50 border-l-yellow-400' 
                    : tx.status === 'offline_verified'
                    ? 'bg-blue-50 border-l-blue-400'
                    : 'bg-muted border-l-primary'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {tx.type === 'send' ? t('sentTo') : t('receivedFrom')}: {tx.recipient || tx.sender}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      ₦{Number(tx.amount).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      tx.status === 'synced' || tx.status === 'offline_verified'
                        ? 'default'
                        : tx.status === 'pending_sync'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {tx.status === 'synced' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {tx.status === 'offline_verified' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {tx.status === 'pending_sync' && <Clock className="h-3 w-3 mr-1" />}
                    {tx.status === 'synced' ? t('synced') : 
                     tx.status === 'offline_verified' ? t('offlineVerified') : 
                     tx.status === 'pending_sync' ? t('pendingSync') : 
                     tx.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{tx.transaction_code}</span>
                  <Badge variant="outline">
                    {tx.type === 'send' ? t('sent') : t('received')}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(tx.local_timestamp || tx.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default WalletPage;
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, Package, Receipt, Wallet, CreditCard, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useSales } from "@/hooks/useSales";
import { useExpenses } from "@/hooks/useExpenses";
import { useInventory } from "@/hooks/useInventory";
import { useCustomers } from "@/hooks/useCustomers";
import { useLoans } from "@/hooks/useLoans";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gamification } from "@/components/Gamification";
import { useMemo } from "react";

const Dashboard = () => {
  const { sales, loading: salesLoading } = useSales();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { inventory, loading: inventoryLoading } = useInventory();
  const { customers, loading: customersLoading } = useCustomers();
  const { loans, loading: loansLoading } = useLoans();
  const { balance: walletBalance, loading: walletLoading } = useWallet();
  const { t } = useLanguage();

  // Calculate real stats
  const totalSales = useMemo(() => 
    sales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0), [sales]
  );
  
  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]
  );
  
  const profit = totalSales - totalExpenses;
  
  const totalLoans = useMemo(() => 
    loans
      .filter(loan => loan.loan_type === 'taken')
      .reduce((sum, loan) => sum + loan.amount - loan.amount_repaid, 0), [loans]
  );

  const lowStockItems = useMemo(() => 
    inventory.filter(item => item.quantity <= item.reorder_level).length, [inventory]
  );

  const stats = [
    { 
      label: t('totalSales'), 
      value: `₦${totalSales.toLocaleString()}`, 
      change: `${sales.length} ${t('sales')}`, 
      trend: "up",
      icon: TrendingUp,
      color: "primary"
    },
    { 
      label: t('customers'), 
      value: customers.length.toString(), 
      change: `${t('total')} ${t('customers')}`, 
      trend: "up",
      icon: Users,
      color: "secondary"
    },
    { 
      label: t('expenses'), 
      value: `₦${totalExpenses.toLocaleString()}`, 
      change: `${expenses.length} entries`, 
      trend: "down",
      icon: Receipt,
      color: "accent"
    },
    { 
      label: t('loans'), 
      value: `₦${totalLoans.toLocaleString()}`, 
      change: `${lowStockItems} low stock`, 
      trend: totalLoans > 0 ? "neutral" : "up",
      icon: Wallet,
      color: "destructive"
    },
  ];

  // Group sales by day for chart
  const salesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map((date, index) => {
      const daySales = sales.filter(sale => sale.sale_date.startsWith(date));
      const total = daySales.reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[new Date(date).getDay()];
      return { day: dayName, sales: total };
    });
  }, [sales]);

  // Group expenses by category
  const expensesData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const colors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--destructive))"];
    return Object.entries(categoryTotals).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  }, [expenses]);

  if (salesLoading || expensesLoading || inventoryLoading || customersLoading || loansLoading || walletLoading) {
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
          <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
          <p className="text-muted-foreground">Here's what's happening with your business today</p>
        </div>
      </div>

      {/* Gamification */}
      <Gamification />

      {/* Wallet and Loan Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/wallet">
          <Card className="p-6 shadow-card hover:shadow-elevated transition-all cursor-pointer bg-gradient-to-br from-primary/10 to-secondary/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('wallet')}</p>
                  <p className="text-2xl font-bold">₦{walletBalance.toLocaleString()}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{t('managePayments')}</p>
          </Card>
        </Link>

        <Link to="/loans">
          <Card className="p-6 shadow-card hover:shadow-elevated transition-all cursor-pointer bg-gradient-to-br from-accent/10 to-destructive/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('loans')}</p>
                  <p className="text-2xl font-bold">₦{totalLoans.toLocaleString()}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {loans.length} {t('loans')} • {loans.filter(l => l.repayment_status !== 'paid').length} {t('pending')}
            </p>
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 shadow-card hover:shadow-elevated transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${stat.color}-light`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}`} />
              </div>
              {stat.trend === "up" && (
                <TrendingUp className="h-5 w-5 text-secondary" />
              )}
              {stat.trend === "down" && (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className={`text-sm mt-1 ${
                stat.trend === "up" ? "text-secondary" : 
                stat.trend === "down" ? "text-destructive" : 
                "text-muted-foreground"
              }`}>
                {stat.change}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-card">
          <h3 className="text-xl font-bold mb-4">Weekly Sales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `₦${value.toLocaleString()}`}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="text-xl font-bold mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expensesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `₦${value.toLocaleString()}`}
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 rounded-xl bg-primary-light hover:bg-primary hover:text-primary-foreground transition-all text-left">
            <Package className="h-6 w-6 mb-2 text-primary" />
            <p className="font-medium">Add Product</p>
          </button>
          <button className="p-4 rounded-xl bg-secondary-light hover:bg-secondary hover:text-secondary-foreground transition-all text-left">
            <TrendingUp className="h-6 w-6 mb-2 text-secondary" />
            <p className="font-medium">Record Sale</p>
          </button>
          <button className="p-4 rounded-xl bg-accent-light hover:bg-accent hover:text-accent-foreground transition-all text-left">
            <Users className="h-6 w-6 mb-2 text-accent" />
            <p className="font-medium">Add Customer</p>
          </button>
          <button className="p-4 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-all text-left">
            <Receipt className="h-6 w-6 mb-2 text-primary" />
            <p className="font-medium">Log Expense</p>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;

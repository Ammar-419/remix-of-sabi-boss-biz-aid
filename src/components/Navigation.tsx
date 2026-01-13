import { NavLink } from "react-router-dom";
import { Home, Package, ShoppingCart, Receipt, Users, Wallet, CreditCard, Lightbulb, User, Moon, Sun, LogOut, Globe, WifiOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Navigation = () => {
  const [isDark, setIsDark] = useState(false);
  const { signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isOnline, isSyncing } = useOfflineSync();

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const navItems = [
    { to: "/", icon: Home, label: t('dashboard') },
    { to: "/inventory", icon: Package, label: t('inventory') },
    { to: "/sales", icon: ShoppingCart, label: t('sales') },
    { to: "/expenses", icon: Receipt, label: t('expenses') },
    { to: "/customers", icon: Users, label: t('customers') },
    { to: "/wallet", icon: Wallet, label: t('wallet') },
    { to: "/loans", icon: CreditCard, label: t('loans') },
    { to: "/tips", icon: Lightbulb, label: t('tips') },
    { to: "/profile", icon: User, label: t('profile') },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-card border-b shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                SabiBoss
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-muted"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
              
              {/* Offline/Syncing Indicator */}
              {!isOnline && (
                <div className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-destructive/10 text-destructive">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('offlineMode')}</span>
                </div>
              )}
              {isSyncing && (
                <div className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-secondary/10 text-secondary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">{t('syncing')}</span>
                </div>
              )}

              {/* Language Selector */}
              <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                <SelectTrigger className="w-[100px]">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                  <SelectItem value="pidgin">Pidgin</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDark(!isDark)}
                className="ml-2"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="ml-2"
                title={t('logout')}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-card border-b shadow-soft sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">S</span>
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SabiBoss
            </span>
            {!isOnline && <WifiOff className="h-4 w-4 text-destructive" />}
            {isSyncing && <Loader2 className="h-4 w-4 animate-spin text-secondary" />}
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
              <SelectTrigger className="w-[90px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="ha">HA</SelectItem>
                <SelectItem value="pidgin">PG</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-elevated z-50">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1 px-2 pb-2">
          {navItems.slice(4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

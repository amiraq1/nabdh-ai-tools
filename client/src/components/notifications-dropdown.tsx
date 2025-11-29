import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  Check,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Supplier, Transaction } from "@shared/schema";

interface Notification {
  id: string;
  type: "high_balance" | "low_activity" | "large_transaction";
  title: string;
  description: string;
  supplierId?: string;
  supplierName?: string;
  severity: "warning" | "info" | "critical";
  createdAt: Date;
}

export default function NotificationsDropdown() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("dismissedNotifications");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  useEffect(() => {
    localStorage.setItem("dismissedNotifications", JSON.stringify(Array.from(dismissedIds)));
  }, [dismissedIds]);

  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    const HIGH_BALANCE_THRESHOLD = 10000;
    const NEGATIVE_BALANCE_THRESHOLD = -5000;

    suppliers.forEach((supplier) => {
      const balance = supplier.balance || 0;
      
      if (balance > HIGH_BALANCE_THRESHOLD) {
        notifications.push({
          id: `high-balance-${supplier.id}`,
          type: "high_balance",
          title: "رصيد مرتفع",
          description: `المورد "${supplier.name}" لديه رصيد مرتفع (${balance.toLocaleString('ar-SA')} ر.س)`,
          supplierId: supplier.id,
          supplierName: supplier.name,
          severity: "warning",
          createdAt: new Date(),
        });
      }
      
      if (balance < NEGATIVE_BALANCE_THRESHOLD) {
        notifications.push({
          id: `negative-balance-${supplier.id}`,
          type: "high_balance",
          title: "رصيد مستحق علينا",
          description: `المورد "${supplier.name}" له رصيد مستحق (${Math.abs(balance).toLocaleString('ar-SA')} ر.س)`,
          supplierId: supplier.id,
          supplierName: supplier.name,
          severity: "critical",
          createdAt: new Date(),
        });
      }

      const supplierTransactions = transactions.filter(t => t.supplierId === supplier.id);
      if (supplierTransactions.length > 0) {
        const lastTransaction = supplierTransactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        const daysSinceLastTransaction = Math.floor(
          (Date.now() - new Date(lastTransaction.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastTransaction > 30 && Math.abs(balance) > 1000) {
          notifications.push({
            id: `inactive-${supplier.id}`,
            type: "low_activity",
            title: "نشاط منخفض",
            description: `لم تتم معاملات مع "${supplier.name}" منذ ${daysSinceLastTransaction} يوم`,
            supplierId: supplier.id,
            supplierName: supplier.name,
            severity: "info",
            createdAt: new Date(),
          });
        }
      }
    });

    const recentLargeTransactions = transactions
      .filter(t => t.amount > 50000)
      .filter(t => {
        const daysSince = Math.floor(
          (Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSince <= 7;
      });

    recentLargeTransactions.forEach((transaction) => {
      const supplier = suppliers.find(s => s.id === transaction.supplierId);
      notifications.push({
        id: `large-transaction-${transaction.id}`,
        type: "large_transaction",
        title: "معاملة كبيرة",
        description: `تم تسجيل ${transaction.type === 'debit' ? 'مشتريات' : 'دفعة'} بمبلغ ${transaction.amount.toLocaleString('ar-SA')} ر.س`,
        supplierId: transaction.supplierId,
        supplierName: supplier?.name,
        severity: "info",
        createdAt: new Date(transaction.date),
      });
    });

    return notifications;
  };

  const allNotifications = generateNotifications();
  const activeNotifications = allNotifications.filter(n => !dismissedIds.has(n.id));
  const unreadCount = activeNotifications.length;

  const dismissNotification = (id: string) => {
    setDismissedIds(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.add(id);
      return newSet;
    });
  };

  const dismissAll = () => {
    setDismissedIds(prev => {
      const newSet = new Set(Array.from(prev));
      allNotifications.forEach(n => newSet.add(n.id));
      return newSet;
    });
  };

  const getSeverityColor = (severity: Notification["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400";
      default:
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
    }
  };

  const getSeverityIcon = (severity: Notification["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>الإشعارات</span>
          {activeNotifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={dismissAll}
              data-testid="button-dismiss-all"
            >
              <Check className="h-3 w-3 ml-1" />
              تمت القراءة
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {activeNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد إشعارات جديدة</p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {activeNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-md hover-elevate"
                  data-testid={`notification-${notification.id}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${getSeverityColor(notification.severity)}`}>
                    {getSeverityIcon(notification.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        data-testid={`button-dismiss-${notification.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.description}
                    </p>
                    {notification.supplierId && (
                      <Link
                        href={`/suppliers/${notification.supplierId}`}
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                        data-testid={`link-notification-supplier-${notification.supplierId}`}
                      >
                        عرض التفاصيل
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

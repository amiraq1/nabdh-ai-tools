import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpLeft,
  ArrowDownRight,
  PlusCircle,
  Eye,
  BarChart3,
  PieChart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Supplier, Transaction } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";
import { supplierCategories } from "@shared/schema";
import { numberToArabicWords } from "@/lib/arabic-numbers";

function StatCard({ 
  title, 
  value, 
  valueInWords,
  subtitle, 
  icon: Icon, 
  trend,
  trendUp,
  isLoading 
}: { 
  title: string; 
  value: string | number; 
  valueInWords?: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {valueInWords && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{valueInWords}</p>
            )}
            {subtitle && !valueInWords && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trendUp ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {trend}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecentTransactionRow({ transaction, supplierName }: { transaction: Transaction; supplierName: string }) {
  const isCredit = transaction.type === "credit";
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
          isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          {isCredit ? (
            <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <ArrowUpLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{supplierName}</p>
          <p className="text-xs text-muted-foreground">{transaction.description || (isCredit ? "دفعة للمورد" : "مشتريات")}</p>
        </div>
      </div>
      <div className="text-left">
        <p className={`text-sm font-semibold ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isCredit ? '-' : '+'}{transaction.amount.toLocaleString('ar-IQ')} د.ع
        </p>
        <p className="text-xs text-muted-foreground">{transaction.date}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">لا توجد بيانات بعد</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        ابدأ بإضافة موردين جدد لتتبع أرصدتهم ومعاملاتهم المالية
      </p>
      <Button asChild>
        <Link href="/suppliers/new" data-testid="button-add-first-supplier">
          <PlusCircle className="h-4 w-4 ml-2" />
          إضافة مورد جديد
        </Link>
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const totalBalance = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);
  const positiveBalance = suppliers.filter(s => (s.balance || 0) > 0).reduce((sum, s) => sum + (s.balance || 0), 0);
  const negativeBalance = suppliers.filter(s => (s.balance || 0) < 0).reduce((sum, s) => sum + Math.abs(s.balance || 0), 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || "غير معروف";
  };

  const isLoading = suppliersLoading || transactionsLoading;
  const hasData = suppliers.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">لوحة التحكم</h1>
          <p className="text-muted-foreground">نظرة عامة على الموردين والأرصدة</p>
        </div>
        <Button asChild>
          <Link href="/suppliers/new" data-testid="button-add-supplier">
            <PlusCircle className="h-4 w-4 ml-2" />
            إضافة مورد
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الموردين"
          value={suppliers.length}
          subtitle="مورد مسجل"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="إجمالي الرصيد"
          value={`${totalBalance.toLocaleString('ar-IQ')} د.ع`}
          valueInWords={numberToArabicWords(totalBalance)}
          icon={Wallet}
          isLoading={isLoading}
        />
        <StatCard
          title="رصيد لنا"
          value={`${positiveBalance.toLocaleString('ar-IQ')} د.ع`}
          valueInWords={numberToArabicWords(positiveBalance)}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="رصيد علينا"
          value={`${negativeBalance.toLocaleString('ar-IQ')} د.ع`}
          valueInWords={numberToArabicWords(Math.abs(negativeBalance))}
          icon={TrendingDown}
          isLoading={isLoading}
        />
      </div>

      {hasData && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                المعاملات الشهرية
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const monthlyData = transactions.reduce((acc, t) => {
                  const month = new Date(t.date).toLocaleDateString('ar-SA', { month: 'short' });
                  if (!acc[month]) acc[month] = { month, debits: 0, credits: 0 };
                  if (t.type === 'debit') acc[month].debits += t.amount;
                  else acc[month].credits += t.amount;
                  return acc;
                }, {} as Record<string, { month: string; debits: number; credits: number }>);
                
                const chartData = Object.values(monthlyData).slice(-6);
                
                return chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
                      <YAxis className="text-xs" tick={{ fill: 'currentColor' }} tickFormatter={(value) => `${(value/1000).toFixed(0)}ك`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          direction: 'rtl'
                        }}
                        formatter={(value: number) => [`${value.toLocaleString('ar-IQ')} د.ع`]}
                        labelFormatter={(label) => `شهر ${label}`}
                      />
                      <Legend 
                        formatter={(value) => value === 'debits' ? 'مشتريات' : 'دفعات'}
                        wrapperStyle={{ direction: 'rtl' }}
                      />
                      <Bar dataKey="debits" name="debits" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="credits" name="credits" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    لا توجد بيانات كافية للعرض
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                توزيع الموردين حسب الفئة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const categoryData = supplierCategories.map(cat => ({
                  name: cat,
                  value: suppliers.filter(s => s.category === cat).length,
                  balance: suppliers.filter(s => s.category === cat).reduce((sum, s) => sum + (s.balance || 0), 0)
                })).filter(c => c.value > 0);

                const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1'];

                return categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          direction: 'rtl'
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `${value} مورد - رصيد: ${props.payload.balance.toLocaleString('ar-IQ')} د.ع`,
                          props.payload.name
                        ]}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    لا توجد بيانات كافية للعرض
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">آخر المعاملات</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions" data-testid="link-view-all-transactions">
                <Eye className="h-4 w-4 ml-1" />
                عرض الكل
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentTransactions.length > 0 ? (
              <div>
                {recentTransactions.map((transaction) => (
                  <RecentTransactionRow 
                    key={transaction.id} 
                    transaction={transaction}
                    supplierName={getSupplierName(transaction.supplierId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد معاملات حتى الآن
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">أعلى الأرصدة</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/suppliers" data-testid="link-view-all-suppliers">
                <Eye className="h-4 w-4 ml-1" />
                عرض الكل
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hasData ? (
              <div className="space-y-3">
                {[...suppliers]
                  .sort((a, b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0))
                  .slice(0, 5)
                  .map((supplier) => (
                    <Link 
                      key={supplier.id} 
                      href={`/suppliers/${supplier.id}`}
                      className="flex items-center justify-between py-2 border-b last:border-0 hover-elevate rounded-md px-2 -mx-2"
                      data-testid={`link-supplier-${supplier.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {supplier.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{supplier.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {supplier.category}
                          </Badge>
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${
                        (supplier.balance || 0) >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {(supplier.balance || 0).toLocaleString('ar-IQ')} د.ع
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

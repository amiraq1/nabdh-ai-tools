import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search, 
  PlusCircle, 
  ArrowUpLeft,
  ArrowDownRight,
  Receipt,
  Filter,
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import type { Supplier, Transaction } from "@shared/schema";
import TransactionFormWithSupplier from "@/components/transaction-form-with-supplier";

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Receipt className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {hasFilter ? "لا توجد نتائج" : "لا توجد معاملات"}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {hasFilter 
          ? "جرب تغيير معايير البحث أو التصفية"
          : "لم يتم تسجيل أي معاملات بعد"
        }
      </p>
    </div>
  );
}

export default function TransactionsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || "غير معروف";
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const supplierName = getSupplierName(transaction.supplierId);
    const matchesSearch = 
      supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const hasFilter = searchQuery !== "" || typeFilter !== "all";
  const isLoading = suppliersLoading || transactionsLoading;

  const totalCredit = transactions
    .filter(t => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebit = transactions
    .filter(t => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const handleTransactionSuccess = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">المعاملات</h1>
          <p className="text-muted-foreground">
            سجل جميع المعاملات المالية ({transactions.length} معاملة)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-transaction">
              <PlusCircle className="h-4 w-4 ml-2" />
              إضافة معاملة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة معاملة جديدة</DialogTitle>
              <DialogDescription>
                أضف معاملة مالية جديدة لأحد الموردين
              </DialogDescription>
            </DialogHeader>
            <TransactionFormWithSupplier
              suppliers={suppliers}
              onSuccess={handleTransactionSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المعاملات</p>
                <p className="text-xl font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ArrowUpLeft className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {totalDebit.toLocaleString('ar-SA')} ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {totalCredit.toLocaleString('ar-SA')} ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالمورد أو الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                data-testid="input-search"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-type-filter">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المعاملات</SelectItem>
                <SelectItem value="debit">مشتريات</SelectItem>
                <SelectItem value="credit">مدفوعات</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : sortedTransactions.length === 0 ? (
            <EmptyState hasFilter={hasFilter} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">المورد</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right hidden md:table-cell">الوصف</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.map((transaction) => {
                    const isCredit = transaction.type === "credit";
                    const supplierName = getSupplierName(transaction.supplierId);
                    return (
                      <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              {isCredit ? (
                                <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : (
                                <ArrowUpLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <Badge variant={isCredit ? "default" : "secondary"}>
                              {isCredit ? "دفعة" : "مشتريات"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/suppliers/${transaction.supplierId}`}
                            className="font-medium hover:underline"
                            data-testid={`link-supplier-${transaction.supplierId}`}
                          >
                            {supplierName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {isCredit ? '-' : '+'}{transaction.amount.toLocaleString('ar-SA')} ر.س
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                          {transaction.description || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{transaction.date}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  ArrowRight, 
  Pencil, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  PlusCircle,
  ArrowUpLeft,
  ArrowDownRight,
  Wallet,
  Calendar,
  Building2,
  Download,
  FileSpreadsheet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportSupplierReportToPDF } from "@/lib/export-utils";
import * as XLSX from "xlsx";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Supplier, Transaction } from "@shared/schema";
import TransactionForm from "@/components/transaction-form";

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="p-6">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Building2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">المورد غير موجود</h2>
        <p className="text-muted-foreground mb-6">
          لم نتمكن من العثور على المورد المطلوب
        </p>
        <Button asChild>
          <Link href="/suppliers" data-testid="button-back-to-suppliers">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للموردين
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function SupplierDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("debit");

  const { data: supplier, isLoading: supplierLoading } = useQuery<Supplier>({
    queryKey: ["/api/suppliers", id],
  });

  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const transactions = allTransactions.filter(t => t.supplierId === id);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المورد بنجاح",
      });
      navigate("/suppliers");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف المورد",
        variant: "destructive",
      });
    },
  });

  const handleTransactionSuccess = () => {
    setIsTransactionDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/suppliers", id] });
    queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
  };

  if (supplierLoading) {
    return <LoadingSkeleton />;
  }

  if (!supplier) {
    return <NotFound />;
  }

  const balance = supplier.balance || 0;
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/suppliers" data-testid="button-back">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-supplier-name">{supplier.name}</h1>
            <Badge variant="secondary" className="mt-1">{supplier.category}</Badge>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export-supplier">
                <Download className="h-4 w-4 ml-2" />
                تصدير كشف الحساب
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => {
                  const data = transactions.map((t) => ({
                    "التاريخ": t.date,
                    "النوع": t.type === "debit" ? "مشتريات (له)" : "دفعة (منه)",
                    "المبلغ": t.amount,
                    "الوصف": t.description || "-",
                  }));
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "كشف الحساب");
                  XLSX.writeFile(wb, `كشف_حساب_${supplier.name}.xlsx`);
                }}
                data-testid="button-export-supplier-excel"
              >
                <FileSpreadsheet className="h-4 w-4 ml-2" />
                تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => exportSupplierReportToPDF(supplier, transactions)}
                data-testid="button-export-supplier-pdf"
              >
                <FileText className="h-4 w-4 ml-2" />
                تصدير PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setTransactionType("debit")} data-testid="button-add-transaction">
                <PlusCircle className="h-4 w-4 ml-2" />
                إضافة معاملة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة معاملة جديدة</DialogTitle>
                <DialogDescription>
                  أضف معاملة مالية جديدة للمورد {supplier.name}
                </DialogDescription>
              </DialogHeader>
              <TransactionForm 
                supplierId={id!}
                initialType={transactionType}
                onSuccess={handleTransactionSuccess}
                onCancel={() => setIsTransactionDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" asChild>
            <Link href={`/suppliers/${id}/edit`} data-testid="button-edit">
              <Pencil className="h-4 w-4 ml-2" />
              تعديل
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive" data-testid="button-delete">
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف المورد "{supplier.name}"؟ 
                  سيتم حذف جميع المعاملات المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary">
                  {supplier.name.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-semibold">{supplier.name}</h2>
              <Badge variant="secondary" className="mt-2">{supplier.category}</Badge>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">الرصيد الحالي</span>
              </div>
              <div className={`text-2xl font-bold text-center ${
                balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`} data-testid="text-balance">
                {balance.toLocaleString('ar-SA')} ر.س
              </div>
              <p className="text-xs text-center text-muted-foreground mt-1">
                {balance >= 0 ? 'رصيد لنا' : 'رصيد علينا'}
              </p>
            </div>

            <div className="space-y-4">
              {supplier.phone && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">الهاتف</p>
                    <p className="text-sm font-medium" dir="ltr">{supplier.phone}</p>
                  </div>
                </div>
              )}

              {supplier.email && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="text-sm font-medium">{supplier.email}</p>
                  </div>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">العنوان</p>
                    <p className="text-sm font-medium">{supplier.address}</p>
                  </div>
                </div>
              )}

              {supplier.notes && (
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ملاحظات</p>
                    <p className="text-sm">{supplier.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>المعاملات المالية</CardTitle>
            <CardDescription>
              سجل جميع المعاملات المالية مع هذا المورد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all" data-testid="tab-all">الكل</TabsTrigger>
                <TabsTrigger value="debit" data-testid="tab-debit">مشتريات</TabsTrigger>
                <TabsTrigger value="credit" data-testid="tab-credit">مدفوعات</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <TransactionsTable 
                  transactions={sortedTransactions} 
                  isLoading={transactionsLoading} 
                />
              </TabsContent>
              <TabsContent value="debit">
                <TransactionsTable 
                  transactions={sortedTransactions.filter(t => t.type === "debit")} 
                  isLoading={transactionsLoading}
                />
              </TabsContent>
              <TabsContent value="credit">
                <TransactionsTable 
                  transactions={sortedTransactions.filter(t => t.type === "credit")} 
                  isLoading={transactionsLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TransactionsTable({ transactions, isLoading }: { transactions: Transaction[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">لا توجد معاملات</h3>
        <p className="text-sm text-muted-foreground">
          لم يتم تسجيل أي معاملات بعد
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">النوع</TableHead>
            <TableHead className="text-right">المبلغ</TableHead>
            <TableHead className="text-right hidden sm:table-cell">الوصف</TableHead>
            <TableHead className="text-right">التاريخ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const isCredit = transaction.type === "credit";
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
                    <span className="text-sm font-medium">
                      {isCredit ? "دفعة" : "مشتريات"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${
                    isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isCredit ? '-' : '+'}{transaction.amount.toLocaleString('ar-SA')} ر.س
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {transaction.description || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {transaction.date}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowUpLeft, ArrowDownRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const transactionFormSchema = z.object({
  type: z.enum(["credit", "debit"], { required_error: "يرجى اختيار نوع المعاملة" }),
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  description: z.string().optional(),
  date: z.string().min(1, "يرجى تحديد التاريخ"),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  supplierId: string;
  initialType?: "credit" | "debit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TransactionForm({ 
  supplierId, 
  initialType = "debit",
  onSuccess,
  onCancel 
}: TransactionFormProps) {
  const { toast } = useToast();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: initialType,
      amount: 0,
      description: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      const response = await apiRequest("POST", "/api/transactions", {
        ...data,
        supplierId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم إضافة المعاملة بنجاح",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المعاملة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionFormValues) => {
    createMutation.mutate(data);
  };

  const selectedType = form.watch("type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>نوع المعاملة *</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={field.value === "debit" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => field.onChange("debit")}
                  data-testid="button-type-debit"
                >
                  <ArrowUpLeft className="h-4 w-4 ml-2" />
                  مشتريات (له)
                </Button>
                <Button
                  type="button"
                  variant={field.value === "credit" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => field.onChange("credit")}
                  data-testid="button-type-credit"
                >
                  <ArrowDownRight className="h-4 w-4 ml-2" />
                  دفعة (منا)
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المبلغ (ر.س) *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  {...field}
                  data-testid="input-amount"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>التاريخ *</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  data-testid="input-date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوصف</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={selectedType === "credit" ? "مثال: دفعة نقدية" : "مثال: فاتورة رقم 123"}
                  className="resize-none"
                  rows={2}
                  {...field}
                  data-testid="textarea-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1"
            data-testid="button-submit-transaction"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                حفظ المعاملة
              </>
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              data-testid="button-cancel-transaction"
            >
              إلغاء
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
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
import { ArrowRight, Save, Loader2, User, Phone, Mail, MapPin, Tag, FileText, Wallet } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Supplier, InsertSupplier } from "@shared/schema";
import { supplierCategories } from "@shared/schema";

const supplierFormSchema = z.object({
  name: z.string().min(2, "اسم المورد يجب أن يكون حرفين على الأقل"),
  phone: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  address: z.string().optional(),
  category: z.string().min(1, "يرجى اختيار الفئة"),
  notes: z.string().optional(),
  balance: z.coerce.number().default(0),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export default function SupplierForm() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id && id !== "new";

  const { data: supplier, isLoading: supplierLoading } = useQuery<Supplier>({
    queryKey: ["/api/suppliers", id],
    enabled: isEditing,
  });

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      category: "",
      notes: "",
      balance: 0,
    },
  });

  useEffect(() => {
    if (supplier && isEditing) {
      form.reset({
        name: supplier.name,
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        category: supplier.category,
        notes: supplier.notes || "",
        balance: supplier.balance || 0,
      });
    }
  }, [supplier, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "تم الحفظ",
        description: "تم إضافة المورد بنجاح",
      });
      navigate("/suppliers");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المورد",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const response = await apiRequest("PATCH", `/api/suppliers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers", id] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث بيانات المورد بنجاح",
      });
      navigate("/suppliers");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المورد",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupplierFormValues) => {
    const supplierData: InsertSupplier = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      category: data.category,
      notes: data.notes || null,
      balance: data.balance,
    };

    if (isEditing) {
      updateMutation.mutate(supplierData);
    } else {
      createMutation.mutate(supplierData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && supplierLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/suppliers" data-testid="button-back">
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {isEditing ? "تعديل المورد" : "إضافة مورد جديد"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "تعديل بيانات المورد" : "أدخل بيانات المورد الجديد"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات المورد</CardTitle>
          <CardDescription>
            أدخل معلومات المورد الأساسية ومعلومات التواصل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        اسم المورد *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="أدخل اسم المورد" 
                          {...field} 
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        الفئة *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supplierCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        رقم الهاتف
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="05xxxxxxxx" 
                          dir="ltr"
                          {...field} 
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        البريد الإلكتروني
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="example@email.com" 
                          dir="ltr"
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        الرصيد الافتتاحي
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="0" 
                          {...field} 
                          data-testid="input-balance"
                        />
                      </FormControl>
                      <FormDescription>
                        رصيد موجب = لنا عنده، رصيد سالب = له عندنا
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        العنوان
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="المدينة، الحي" 
                          {...field} 
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      ملاحظات
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="أضف أي ملاحظات إضافية..."
                        className="resize-none"
                        rows={3}
                        {...field} 
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={isPending}
                  data-testid="button-submit"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      {isEditing ? "حفظ التغييرات" : "إضافة المورد"}
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/suppliers" data-testid="button-cancel">
                    إلغاء
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

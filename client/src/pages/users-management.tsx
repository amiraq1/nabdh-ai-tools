import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Shield, ShieldCheck, ShieldAlert, Eye, ChevronRight, ChevronLeft, Key, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const roleLabels: Record<string, string> = {
  admin: "مدير",
  editor: "محرر",
  viewer: "مشاهد"
};

const roleIcons: Record<string, React.ElementType> = {
  admin: ShieldAlert,
  editor: ShieldCheck,
  viewer: Eye
};

const roleColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  admin: "destructive",
  editor: "default",
  viewer: "secondary"
};

export default function UsersManagement() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const limit = 20;
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== "admin")) {
      toast({
        title: "غير مصرح",
        description: "لا تملك صلاحية الوصول لهذه الصفحة",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/"), 500);
    }
  }, [currentUser, authLoading, toast, setLocation]);

  const { data: usersData, isLoading } = useQuery<UsersResponse>({
    queryKey: ["/api/users", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    enabled: currentUser?.role === "admin",
  });

  const users = usersData?.users;

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"], exact: false });
      toast({
        title: "تم التحديث",
        description: "تم تحديث صلاحية المستخدم بنجاح",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مصرح",
          description: "يتم تسجيل الخروج...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ",
        description: "فشل في تحديث الصلاحية",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}/password`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"], exact: false });
      toast({
        title: "تم تعيين كلمة المرور",
        description: "تم تعيين كلمة المرور الجديدة بنجاح. يرجى إبلاغ المستخدم بكلمة المرور الجديدة.",
      });
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مصرح",
          description: "يتم تسجيل الخروج...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ",
        description: error.message || "فشل في تعيين كلمة المرور",
        variant: "destructive",
      });
    },
  });

  const handleSetPassword = () => {
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمتا المرور غير متطابقتين",
        variant: "destructive",
      });
      return;
    }
    updatePasswordMutation.mutate({ userId: selectedUser.id, password: newPassword });
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordDialogOpen(true);
  };

  if (authLoading || !currentUser || currentUser.role !== "admin") {
    return null;
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          إدارة المستخدمين
        </h1>
        <p className="text-muted-foreground mt-1">
          عرض وتعديل صلاحيات المستخدمين
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            قائمة المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-9 w-28" />
                </div>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>تغيير الصلاحية</TableHead>
                  <TableHead>كلمة المرور</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role] || Eye;
                  const initials = user.firstName && user.lastName
                    ? `${user.firstName[0]}${user.lastName[0]}`
                    : user.email?.[0]?.toUpperCase() || "م";
                  const displayName = user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : "مستخدم";
                  
                  return (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={user.profileImageUrl || undefined} 
                              alt={displayName}
                              className="object-cover"
                            />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{displayName}</p>
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs mt-1">
                                أنت
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleColors[user.role] || "secondary"}>
                          <RoleIcon className="h-3 w-3 ml-1" />
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(role) => 
                            updateRoleMutation.mutate({ userId: user.id, role })
                          }
                          disabled={user.id === currentUser?.id || updateRoleMutation.isPending}
                        >
                          <SelectTrigger 
                            className="w-28"
                            data-testid={`select-role-${user.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" />
                                مدير
                              </span>
                            </SelectItem>
                            <SelectItem value="editor">
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                محرر
                              </span>
                            </SelectItem>
                            <SelectItem value="viewer">
                              <span className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                مشاهد
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPasswordDialog(user)}
                          disabled={user.id === currentUser?.id}
                          data-testid={`button-set-password-${user.id}`}
                        >
                          <Key className="h-4 w-4 ml-1" />
                          تعيين كلمة مرور
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {usersData && usersData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  صفحة {usersData.page} من {usersData.totalPages} ({usersData.total} مستخدم)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(usersData.totalPages, p + 1))}
                    disabled={page === usersData.totalPages}
                    data-testid="button-next-page"
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد مستخدمون بعد</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users?.filter(u => u.role === "admin").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">مدير</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users?.filter(u => u.role === "editor").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">محرر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900/20 text-gray-600">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {users?.filter(u => u.role === "viewer").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">مشاهد</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              تعيين كلمة مرور جديدة
            </DialogTitle>
            <DialogDescription>
              تعيين كلمة مرور جديدة للمستخدم: {selectedUser?.email || selectedUser?.firstName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                كلمة المرور الجديدة
              </label>
              <Input
                id="new-password"
                type="password"
                placeholder="أدخل كلمة المرور الجديدة"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-new-password" className="text-sm font-medium">
                تأكيد كلمة المرور
              </label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="أعد إدخال كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-new-password"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              ملاحظة: يرجى إبلاغ المستخدم بكلمة المرور الجديدة بشكل آمن.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              data-testid="button-cancel-password"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSetPassword}
              disabled={updatePasswordMutation.isPending}
              data-testid="button-confirm-password"
            >
              {updatePasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                "تعيين كلمة المرور"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

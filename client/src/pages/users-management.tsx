import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Shield, ShieldCheck, ShieldAlert, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

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

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: currentUser?.role === "admin",
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>تغيير الصلاحية</TableHead>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
    </div>
  );
}

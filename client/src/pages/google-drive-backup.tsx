import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Cloud, 
  CloudUpload, 
  FileJson, 
  Trash2, 
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  User,
  ExternalLink
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BackupFile {
  id: string;
  name: string;
  createdTime: string;
  size: string;
  webViewLink: string;
}

interface BackupsResponse {
  backups: BackupFile[];
  folderId: string;
  managedBy: string;
}

interface DriveStatus {
  connected: boolean;
  user?: {
    displayName: string;
    emailAddress: string;
    photoLink: string;
  };
  managedBy: string;
  error?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: string | number) {
  const size = typeof bytes === "string" ? parseInt(bytes) : bytes;
  if (!size || isNaN(size)) return "غير معروف";
  
  if (size < 1024) return `${size} بايت`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} كيلوبايت`;
  return `${(size / (1024 * 1024)).toFixed(2)} ميجابايت`;
}

export default function GoogleDriveBackup() {
  const { toast } = useToast();

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<DriveStatus>({
    queryKey: ["/api/google-drive/status"],
  });

  const { data: backupsData, isLoading: backupsLoading, refetch: refetchBackups } = useQuery<BackupsResponse>({
    queryKey: ["/api/google-drive/backups"],
    enabled: status?.connected === true,
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/google-drive/backup");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: `تم حفظ النسخة "${data.fileName}" بنجاح`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/google-drive/backups"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest("DELETE", `/api/google-drive/backups/${fileId}`);
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف النسخة الاحتياطية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/google-drive/backups"] });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف النسخة الاحتياطية",
        variant: "destructive",
      });
    },
  });

  const isLoading = statusLoading || backupsLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">النسخ الاحتياطي</h1>
          <p className="text-muted-foreground">مزامنة البيانات مع Google Drive</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refetchStatus();
              refetchBackups();
            }}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button
            onClick={() => createBackupMutation.mutate()}
            disabled={!status?.connected || createBackupMutation.isPending}
            data-testid="button-create-backup"
          >
            {createBackupMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <CloudUpload className="h-4 w-4 ml-2" />
                إنشاء نسخة احتياطية
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              حالة الاتصال
            </CardTitle>
            <CardDescription>اتصال Google Drive</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-32" />
              </div>
            ) : status?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">متصل بنجاح</p>
                    <p className="text-sm text-muted-foreground">
                      {status.user?.emailAddress}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">إدارة:</span>
                    <span className="font-medium">{status.managedBy}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium">غير متصل</p>
                  <p className="text-sm text-muted-foreground">
                    {status?.error || "يرجى ربط حساب Google Drive"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              إحصائيات النسخ
            </CardTitle>
            <CardDescription>معلومات النسخ الاحتياطية</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">عدد النسخ المحفوظة</span>
                  <Badge variant="secondary">{backupsData?.backups.length || 0}</Badge>
                </div>
                {backupsData?.backups && backupsData.backups.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">آخر نسخة</span>
                    <span className="text-sm">
                      {formatDate(backupsData.backups[0].createdTime)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>النسخ الاحتياطية المحفوظة</CardTitle>
          <CardDescription>
            جميع النسخ الاحتياطية المخزنة في Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div>
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : !status?.connected ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Cloud className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">غير متصل بـ Google Drive</h3>
              <p className="text-sm text-muted-foreground">
                يرجى ربط حساب Google Drive لعرض النسخ الاحتياطية
              </p>
            </div>
          ) : backupsData?.backups.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileJson className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">لا توجد نسخ احتياطية</h3>
              <p className="text-sm text-muted-foreground mb-4">
                ابدأ بإنشاء أول نسخة احتياطية لحفظ بياناتك
              </p>
              <Button onClick={() => createBackupMutation.mutate()} data-testid="button-create-first-backup">
                <CloudUpload className="h-4 w-4 ml-2" />
                إنشاء نسخة احتياطية
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {backupsData?.backups.map((backup) => (
                <div 
                  key={backup.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`backup-item-${backup.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileJson className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{backup.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(backup.createdTime)}</span>
                        <span>•</span>
                        <span>{formatFileSize(backup.size)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.webViewLink && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        data-testid={`button-view-${backup.id}`}
                      >
                        <a href={backup.webViewLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-delete-${backup.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ هذا الإجراء لا يمكن التراجع عنه.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBackupMutation.mutate(backup.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

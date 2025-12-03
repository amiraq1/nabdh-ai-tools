import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrendingUp, Loader2, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

const registerSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمتا المرور غير متطابقتين",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
    mode: "onSubmit",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في نظام إدارة الموردين",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "فشل تسجيل الدخول",
        description: error.message || "تحقق من بياناتك وحاول مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const res = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "مرحباً بك في نظام إدارة الموردين",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "فشل إنشاء الحساب",
        description: error.message || "تحقق من بياناتك وحاول مرة أخرى",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">نظام إدارة الموردين</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isRegister ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </CardTitle>
            <CardDescription>
              {isRegister 
                ? "أنشئ حسابك للبدء في إدارة مورديك" 
                : "أدخل بياناتك للوصول إلى حسابك"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isRegister ? (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      الاسم الأول
                    </label>
                    <Input 
                      id="firstName"
                      placeholder="أحمد" 
                      {...registerForm.register("firstName")}
                      data-testid="input-first-name"
                    />
                    {registerForm.formState.errors.firstName && (
                      <p className="text-sm font-medium text-destructive">{registerForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      الاسم الأخير
                    </label>
                    <Input 
                      id="lastName"
                      placeholder="محمد" 
                      {...registerForm.register("lastName")}
                      data-testid="input-last-name"
                    />
                    {registerForm.formState.errors.lastName && (
                      <p className="text-sm font-medium text-destructive">{registerForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    البريد الإلكتروني
                  </label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="example@email.com" 
                    {...registerForm.register("email")}
                    data-testid="input-register-email"
                    autoComplete="email"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm font-medium text-destructive">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      {...registerForm.register("password")}
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute left-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm font-medium text-destructive">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    تأكيد كلمة المرور
                  </label>
                  <Input 
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    {...registerForm.register("confirmPassword")}
                    data-testid="input-confirm-password"
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm font-medium text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    "إنشاء حساب"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    البريد الإلكتروني
                  </label>
                  <Input 
                    id="login-email"
                    type="email" 
                    placeholder="example@email.com" 
                    {...loginForm.register("email")}
                    data-testid="input-email"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <Input 
                      id="login-password"
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      {...loginForm.register("password")}
                      data-testid="input-login-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute left-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm font-medium text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    أو
                  </span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => window.location.href = "/api/auth/google"}
                data-testid="button-google-login"
              >
                <FcGoogle className="h-5 w-5 ml-2" />
                تسجيل الدخول عبر Google
              </Button>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              {isRegister ? (
                <>
                  لديك حساب بالفعل؟{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto" 
                    onClick={() => setIsRegister(false)}
                    data-testid="link-login"
                  >
                    تسجيل الدخول
                  </Button>
                </>
              ) : (
                <>
                  ليس لديك حساب؟{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto" 
                    onClick={() => setIsRegister(true)}
                    data-testid="link-register"
                  >
                    إنشاء حساب جديد
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </main>

      <footer className="border-t py-4 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          نظام إدارة الموردين والأرصدة
        </div>
      </footer>
    </div>
  );
}

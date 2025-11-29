import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Users, TrendingUp, FileText, Shield, BarChart3, Bell } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: "إدارة الموردين",
      description: "أضف وعدّل وتابع جميع الموردين في مكان واحد"
    },
    {
      icon: TrendingUp,
      title: "تتبع الأرصدة",
      description: "راقب أرصدة الموردين بشكل مباشر ودقيق"
    },
    {
      icon: FileText,
      title: "تقارير شاملة",
      description: "صدّر التقارير بصيغة PDF و Excel بسهولة"
    },
    {
      icon: BarChart3,
      title: "رسوم بيانية",
      description: "تحليلات مرئية للمعاملات والأرصدة"
    },
    {
      icon: Bell,
      title: "تنبيهات ذكية",
      description: "إشعارات للأرصدة المرتفعة والمدفوعات المستحقة"
    },
    {
      icon: Shield,
      title: "صلاحيات متعددة",
      description: "تحكم كامل بصلاحيات المستخدمين"
    }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">نظام إدارة الموردين</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              أدِر مورديك وأرصدتك
              <br />
              <span className="text-primary">بكفاءة وسهولة</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              نظام متكامل لإدارة الموردين والمعاملات المالية، مع تقارير تفصيلية
              ورسوم بيانية تفاعلية ونظام إشعارات ذكي
            </p>
            <Button 
              size="lg" 
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-get-started"
            >
              ابدأ الآن
            </Button>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">المميزات الرئيسية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover-elevate transition-all">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-12">
                <h2 className="text-2xl font-bold mb-4">جاهز للبدء؟</h2>
                <p className="text-muted-foreground mb-6">
                  سجّل دخولك الآن وابدأ بإدارة مورديك بشكل احترافي
                </p>
                <Button 
                  size="lg"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-login-cta"
                >
                  تسجيل الدخول
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>نظام إدارة الموردين والأرصدة</p>
        </div>
      </footer>
    </div>
  );
}

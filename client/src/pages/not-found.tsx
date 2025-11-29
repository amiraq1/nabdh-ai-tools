import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2" data-testid="text-404-title">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها
          </p>
          <Button asChild>
            <Link href="/" data-testid="button-go-home">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للرئيسية
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

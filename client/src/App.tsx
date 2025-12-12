import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import NotificationsDropdown from "@/components/notifications-dropdown";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("@/pages/dashboard"));
const SuppliersList = lazy(() => import("@/pages/suppliers-list"));
const SupplierForm = lazy(() => import("@/pages/supplier-form"));
const SupplierDetails = lazy(() => import("@/pages/supplier-details"));
const TransactionsList = lazy(() => import("@/pages/transactions-list"));
const UsersManagement = lazy(() => import("@/pages/users-management"));
const GoogleDriveBackup = lazy(() => import("@/pages/google-drive-backup"));
const Landing = lazy(() => import("@/pages/landing"));
const Login = lazy(() => import("@/pages/login"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function AuthenticatedRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/suppliers" component={SuppliersList} />
        <Route path="/suppliers/new" component={SupplierForm} />
        <Route path="/suppliers/:id" component={SupplierDetails} />
        <Route path="/suppliers/:id/edit" component={SupplierForm} />
        <Route path="/transactions" component={TransactionsList} />
        <Route path="/users" component={UsersManagement} />
        <Route path="/backup" component={GoogleDriveBackup} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b px-4 shrink-0 sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationsDropdown />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <AuthenticatedRouter />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function UnauthenticatedRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Landing} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <UnauthenticatedRouter />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="suppliers-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

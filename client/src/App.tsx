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
import Dashboard from "@/pages/dashboard";
import SuppliersList from "@/pages/suppliers-list";
import SupplierForm from "@/pages/supplier-form";
import SupplierDetails from "@/pages/supplier-details";
import TransactionsList from "@/pages/transactions-list";
import UsersManagement from "@/pages/users-management";
import GoogleDriveBackup from "@/pages/google-drive-backup";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { UserMenu } from "@/components/user-menu";

function AuthenticatedRouter() {
  return (
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
    return <Landing />;
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

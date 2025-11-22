import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import ForgotPasswordPage from "@/pages/forgot-password";
import VerifyOtpPage from "@/pages/verify-otp";
import DashboardPage from "@/pages/dashboard";
import NotesPage from "@/pages/notes";
import TasksPage from "@/pages/tasks";
import GamesPage from "@/pages/games";
import TicTacToePage from "@/pages/tic-tac-toe";
import FourInRowPage from "@/pages/four-in-row";
import MessagesPage from "@/pages/messages";
import ImagesPage from "@/pages/images";
import AdminPage from "@/pages/admin";

function AuthenticatedApp() {
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<{ username: string; isAdmin: boolean } | null>({
    username: "demo_user",
    isAdmin: false,
  });

  const handleLogout = () => {
    setUser(null);
    setLocation("/login");
  };

  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} onLogout={handleLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">iNotebook</span>
                <span>/</span>
                <span>
                  {location === "/"
                    ? "Dashboard"
                    : location.substring(1).charAt(0).toUpperCase() +
                      location.substring(2)}
                </span>
              </div>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/notes" component={NotesPage} />
              <Route path="/tasks" component={TasksPage} />
              <Route path="/games" component={GamesPage} />
              <Route path="/games/tic-tac-toe" component={TicTacToePage} />
              <Route path="/games/four-in-row" component={FourInRowPage} />
              <Route path="/messages" component={MessagesPage} />
              <Route path="/images" component={ImagesPage} />
              {user?.isAdmin && <Route path="/admin" component={AdminPage} />}
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/login">
            <LoginPage onLogin={async () => setIsAuthenticated(true)} />
          </Route>
          <Route path="/signup">
            <SignupPage onSignup={async () => setIsAuthenticated(true)} />
          </Route>
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/verify-otp" component={VerifyOtpPage} />
          <Route>
            <LoginPage onLogin={async () => setIsAuthenticated(true)} />
          </Route>
        </>
      ) : (
        <AuthenticatedApp />
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

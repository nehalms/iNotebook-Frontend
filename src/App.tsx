import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { logout as apiLogout, getState } from "@/lib/api/auth";
import { getUserProfile } from "@/lib/api/profile";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { SecurityPin } from "@/components/security-pin";
import { SpeedInsights } from "@vercel/speed-insights/react"
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
import ProfilePage from "@/pages/profile";
import CalendarPage from "@/pages/calendar";
import NewsPage from "@/pages/news";
import { useSessionStore } from "@/store/sessionStore";
import { getApiUrl } from "@/lib/api/config";

function AuthenticatedApp() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, email, isAdmin, isPinSet, isPinVerified, login: setLogin, logout: setLogout } = useSessionStore();
  const [showSecurityPin, setShowSecurityPin] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || isAdmin) return;

    const getOrCreateDeviceId = () => {
      let id = sessionStorage.getItem('deviceId');
      if (!id) {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        sessionStorage.setItem('deviceId', id);
      }
      return id;
    };

    const sendHeartBeat = async () => {
      const id = getOrCreateDeviceId();
      try {
        const response = await fetch(getApiUrl(`heartbeat/${id}`), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.status === 0) {
          return;
        }
      } catch (error) {
        console.error('Error in heartbeat:', error);
      }
    };

    sendHeartBeat();

    const heartBeatInterval = setInterval(() => {
      sendHeartBeat();
    }, 25000);

    return () => {
      clearInterval(heartBeatInterval);
    };
  }, [isLoggedIn, isAdmin]);

  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        const state = await getState();
        if (state.status === 1) {
          setLogin({
            email: state.data.email,
            isAdmin: state.data.isAdminUser,
            permissions: state.data.permissions,
            isPinSet: state.data.isPinSet,
            isPinVerified: state.data.isPinVerified,
          });

          // Fetch secret key for encryption
          if (!useSessionStore.getState().secretKey) {
            await useSessionStore.getState().fetchAndSetSecretKey();
          }

          // Show security pin only if pin is set AND not verified
          // If pin is not set (disabled), don't show pin dialog
          if (state.data.isPinSet && !state.data.isPinVerified) {
            setShowSecurityPin(true);
          } else {
            setShowSecurityPin(false);
          }
        }
      } catch (error) {
        console.error("Failed to get state:", error);
        setLogout();
        setLocation("/login");
      } finally {
        setCheckingPin(false);
      }
    };

    if (isLoggedIn) {
      checkPinStatus();
    } else {
      setCheckingPin(false);
    }
  }, [isLoggedIn, setLogin, setLogout, setLocation]);

  // Watch for pin verification status changes
  useEffect(() => {
    if (isLoggedIn && !isAdmin) {
      // Only show security pin if pin is set AND not verified
      if (isPinSet && !isPinVerified) {
        setShowSecurityPin(true);
      } else {
        setShowSecurityPin(false);
      }
    }
  }, [isLoggedIn, isAdmin, isPinSet, isPinVerified]);

  // Fetch user profile to get name
  useEffect(() => {
    const fetchUserName = async () => {
      if (isLoggedIn && !checkingPin) {
        try {
          const response = await getUserProfile();
          if (response.status === 1 && response.user) {
            setUserName(response.user.name);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };
    fetchUserName();
  }, [isLoggedIn, checkingPin]);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    // Clear React Query cache to prevent showing previous user's data
    queryClient.clear();
    setLogout();
    setLocation("/login");
  };

  const handlePinSuccess = () => {
    setShowSecurityPin(false);
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  const user = email ? { 
    username: userName || email, 
    name: userName,
    isAdmin 
  } : null;

  if (checkingPin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} onLogout={handleLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
            {showSecurityPin ? (
              <div className="flex items-center justify-center h-full p-1">
                <SecurityPin
                  mode={isPinSet ? "verify" : "set"}
                  onSuccess={handlePinSuccess}
                />
              </div>
            ) : (
              <Switch>
                <Route path="/" component={DashboardPage} />
                <Route path="/notes" component={NotesPage} />
                <Route path="/tasks" component={TasksPage} />
                <Route path="/games" component={GamesPage} />
                <Route path="/games/tic-tac-toe" component={TicTacToePage} />
                <Route path="/games/four-in-row" component={FourInRowPage} />
                <Route path="/messages" component={MessagesPage} />
                <Route path="/images" component={ImagesPage} />
                <Route path="/calendar" component={CalendarPage} />
                <Route path="/news" component={NewsPage} />
                <Route path="/profile" component={ProfilePage} />
                {isAdmin && <Route path="/admin" component={AdminPage} />}
                <Route component={NotFound} />
              </Switch>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isLoggedIn, login: setLogin } = useSessionStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status on mount only
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const state = await getState();
        if (state.status === 1) {
          setLogin({
            email: state.data.email,
            isAdmin: state.data.isAdminUser,
            permissions: state.data.permissions,
            isPinSet: state.data.isPinSet,
          });
        } else {
          // Clear React Query cache to prevent showing previous user's data
          queryClient.clear();
          useSessionStore.getState().logout();
        }
      } catch (error) {
        // Clear React Query cache to prevent showing previous user's data
        queryClient.clear();
        useSessionStore.getState().logout();
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [setLogin]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return <AuthenticatedApp />;
  }

  return (
    <Switch>
      <Route path="/login">
        <LoginPage onLogin={async () => {
          // Login handled by login page via session store
        }} />
      </Route>
      <Route path="/signup">
        <SignupPage onSignup={async () => {
          // Signup handled by signup page via session store
        }} />
      </Route>
      <Route path="/forgot-password">
        <ForgotPasswordPage />
      </Route>
      <Route path="/verify-otp">
        <VerifyOtpPage />
      </Route>
      <Route>
        <LoginPage onLogin={async () => {}} />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <SpeedInsights />
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import TechnicalDashboard from "@/pages/technical-dashboard";
import EnhancedEvents from "@/pages/enhanced-events";
import Profile from "@/pages/profile";
import RSVPScanner from "@/pages/rsvp-scanner";
import Social from "@/pages/social";
import Resources from "@/pages/resources";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    window.location.href = "/dashboard";
    return null;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>

      <Route path="/register">
        <PublicRoute>
          <Register />
        </PublicRoute>
      </Route>

      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/teacher">
        <ProtectedRoute>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/technical">
        <ProtectedRoute>
          <TechnicalDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/events">
        <ProtectedRoute>
          <EnhancedEvents />
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      <Route path="/scanner">
        <ProtectedRoute>
          <RSVPScanner />
        </ProtectedRoute>
      </Route>

      <Route path="/social">
        <ProtectedRoute>
          <Social />
        </ProtectedRoute>
      </Route>

      <Route path="/resources">
        <ProtectedRoute>
          <Resources />
        </ProtectedRoute>
      </Route>

      {/* Default Route */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      {/* 404 Route */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <AppRoutes />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from "@/store/userStore";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import CreateGroup from "./pages/CreateGroup";
import JoinGroup from "./pages/JoinGroup";
import GroupDetail from "./pages/GroupDetail";
import MatchBetting from "./pages/MatchBetting";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";

const queryClient = new QueryClient();

const PublicOnlyRoute = ({ isAuthenticated, children }: { isAuthenticated: boolean; children: JSX.Element }) => {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const ProtectedRoute = ({ isAuthenticated, children }: { isAuthenticated: boolean; children: JSX.Element }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const bootstrapSession = useUserStore((s) => s.bootstrapSession);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  useEffect(() => {
    bootstrapSession().finally(() => {
      setIsBootstrapping(false);
    });
  }, [bootstrapSession]);

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Restoring your session...</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute isAuthenticated={isAuthenticated}>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute isAuthenticated={isAuthenticated}>
                  <Signup />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/verify-email"
              element={
                <PublicOnlyRoute isAuthenticated={isAuthenticated}>
                  <VerifyEmail />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/create"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <CreateGroup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/join"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <JoinGroup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <GroupDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/match/:id"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <MatchBetting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

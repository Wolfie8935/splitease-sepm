
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/hooks/use-theme";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import CreateGroup from "./pages/CreateGroup";
import GroupDetail from "./pages/GroupDetail";
import EditGroup from "./pages/EditGroup";
import Analytics from "./pages/Analytics";
import SettleUp from "./pages/SettleUp";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

// Create a client for React Query
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/groups" element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                } />
                
                <Route path="/groups/new" element={
                  <ProtectedRoute>
                    <CreateGroup />
                  </ProtectedRoute>
                } />
                
                <Route path="/groups/:groupId" element={
                  <ProtectedRoute>
                    <GroupDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/groups/:groupId/edit" element={
                  <ProtectedRoute>
                    <EditGroup />
                  </ProtectedRoute>
                } />
                
                <Route path="/groups/:groupId/settle" element={
                  <ProtectedRoute>
                    <SettleUp />
                  </ProtectedRoute>
                } />
                
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } />
                
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

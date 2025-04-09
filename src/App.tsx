import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminProvider } from "@/contexts/AdminContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { ThemeProvider } from "@/hooks/use-theme";
import AdminDashboard from "@/pages/AdminDashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Analytics from "./pages/Analytics";
import CreateGroup from "./pages/CreateGroup";
import Dashboard from "./pages/Dashboard";
import EditGroup from "./pages/EditGroup";
import GroupDetail from "./pages/GroupDetail";
import Groups from "./pages/Groups";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import SettleUp from "./pages/SettleUp";
import Signup from "./pages/Signup";

// Create a client for React Query
const queryClient = new QueryClient();

const ADMIN_EMAIL = 'ag2351@srmist.edu.in';

// Special route guard for admin access
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  
  if (currentUser?.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <AuthProvider>
          <AdminProvider>
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
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <Layout>
                          <AdminDashboard />
                        </Layout>
                      </AdminRoute>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/groups" element={
                    <ProtectedRoute>
                      <Layout>
                        <Groups />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/groups/new" element={
                    <ProtectedRoute>
                      <Layout>
                        <CreateGroup />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/groups/:groupId" element={
                    <ProtectedRoute>
                      <Layout>
                        <GroupDetail />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/groups/:groupId/edit" element={
                    <ProtectedRoute>
                      <Layout>
                        <EditGroup />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/groups/:groupId/settle" element={
                    <ProtectedRoute>
                      <Layout>
                        <SettleUp />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <Layout>
                        <Analytics />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </DataProvider>
          </AdminProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

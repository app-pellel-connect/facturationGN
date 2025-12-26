import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Clients from "./pages/Clients";
import ClientForm from "./pages/ClientForm";
import Invoices from "./pages/Invoices";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceDetail from "./pages/InvoiceDetail";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";
import CompanyRegister from "./pages/CompanyRegister";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 300000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthGuard>
            <Routes>
            {/* Routes publiques */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Routes protégées nécessitant une authentification */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={true}>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/register-company" 
              element={
                <ProtectedRoute requireAuth={true} requireCompany={false}>
                  <CompanyRegister />
                </ProtectedRoute>
              } 
            />
            
            {/* Routes nécessitant une entreprise approuvée */}
            <Route 
              path="/clients" 
              element={
                <ProtectedRoute requireAuth={true} requireApprovedCompany={true}>
                  <Clients />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clients/new" 
              element={
                <ProtectedRoute requireAuth={true} requireApprovedCompany={true}>
                  <ClientForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clients/:id/edit" 
              element={
                <ProtectedRoute requireAuth={true} requireApprovedCompany={true}>
                  <ClientForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices" 
              element={
                <ProtectedRoute requireAuth={true} requireApprovedCompany={true}>
                  <Invoices />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices/new" 
              element={
                <ProtectedRoute requireAuth={true} requireApprovedCompany={true}>
                  <InvoiceForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoices/:id" 
              element={
                <ProtectedRoute requireAuth={true} requireApprovedCompany={true}>
                  <InvoiceDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requireAuth={true} requireApprovedCompany={true}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/team" 
              element={
                <ProtectedRoute 
                  requireAuth={true} 
                  requireApprovedCompany={true}
                  requireRoles={['company_admin', 'company_manager']}
                >
                  <Team />
                </ProtectedRoute>
              } 
            />
            
            {/* Route admin - nécessite le propriétaire de la plateforme */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAuth={true} requirePlatformOwner={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthGuard>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

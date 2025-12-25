import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import LandingPage from '@/components/landing/LandingPage';
import Dashboard from './Dashboard';
import AdminDashboard from './admin/AdminDashboard';
import CompanyRegister from './CompanyRegister';
import PendingApproval from './PendingApproval';
import CompanyRejected from './CompanyRejected';
import CompanySuspended from './CompanySuspended';

const Index = () => {
  const { user, loading, isPlatformOwner, companyMembership, companyId } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center animate-pulse">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show landing page
  if (!user) {
    return <LandingPage />;
  }

  // Platform owner - show admin dashboard
  if (isPlatformOwner) {
    return <AdminDashboard />;
  }

  // User has no company - redirect to company registration
  if (!companyMembership) {
    return <CompanyRegister />;
  }

  // Check company status
  const companyStatus = companyMembership.company?.status;

  switch (companyStatus) {
    case 'pending':
      return <PendingApproval />;
    case 'rejected':
      return <CompanyRejected />;
    case 'suspended':
      return <CompanySuspended />;
    case 'approved':
      return <Dashboard />;
    default:
      return <PendingApproval />;
  }
};

export default Index;

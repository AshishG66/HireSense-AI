import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import useAuthStore from '../stores/useAuthStore';
import { LoginForm, RegisterForm } from '../features/auth';

// Lazy Loaded Candidate Portal Pages
const CandidateDashboard = lazy(() => import('../features/candidate/pages/Dashboard'));
const ResumeAnalysis = lazy(() => import('../features/candidate/pages/ResumeAnalysis'));
const ATSScore = lazy(() => import('../features/candidate/pages/ATSScore'));
const MockInterview = lazy(() => import('../features/candidate/pages/MockInterview'));
const InterviewReport = lazy(() => import('../features/candidate/pages/InterviewReport'));
const CandidateProfile = lazy(() => import('../features/candidate/pages/Profile'));
const CandidateSettings = lazy(() => import('../features/candidate/pages/Settings'));
const ResumeDetails = lazy(() => import('../features/candidate/pages/ResumeDetails'));
const ResumeComparison = lazy(() => import('../features/candidate/pages/ResumeComparison'));
const CandidateAssessments = lazy(() => import('../features/candidate/pages/CandidateAssessments'));
const CodingWorkspace = lazy(() => import('../features/candidate/pages/CodingWorkspace'));
const SavedJobs = lazy(() => import('../features/candidate/pages/SavedJobs'));
const Applications = lazy(() => import('../features/candidate/pages/Applications'));
const ResumeBuilder = lazy(() => import('../features/candidate/pages/ResumeBuilder'));

// Lazy Loaded Recruiter Portal Pages
const RecruiterDashboard = lazy(() => import('../features/recruiter/pages/Dashboard'));
const RecruiterJobs = lazy(() => import('../features/recruiter/pages/Jobs'));
const RecruiterCandidates = lazy(() => import('../features/recruiter/pages/Candidates'));
const RecruiterAnalytics = lazy(() => import('../features/recruiter/pages/Analytics'));
const RecruiterCompanyProfile = lazy(() => import('../features/recruiter/pages/CompanyProfile'));
const RecruiterInterviewReports = lazy(() => import('../features/recruiter/pages/RecruiterInterviewReports'));
const RecruiterAssessments = lazy(() => import('../features/recruiter/pages/RecruiterAssessments'));

// Lazy Loaded Admin Portal Pages
const AdminDashboard = lazy(() => import('../features/admin/pages/Dashboard'));
const AdminUserManagement = lazy(() => import('../features/admin/pages/UserManagement'));
const AdminPlatformAnalytics = lazy(() => import('../features/admin/pages/PlatformAnalytics'));
const AdminAIUsage = lazy(() => import('../features/admin/pages/AIUsage'));
const AdminAuditLogs = lazy(() => import('../features/admin/pages/AuditLogs'));
const AdminMonitoring = lazy(() => import('../features/admin/pages/Monitoring'));

// Lazy Loaded design system page
const Showroom = lazy(() => import('../features/design-system/Showroom'));
const AboutArchitecture = lazy(() => import('../features/design-system/AboutArchitecture'));

// Dynamic Index Dashboard Switcher Component
// RoleGuard component to authorize route access
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user, isAuthenticated } = useAuthStore() as any;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Dynamic Index Dashboard Switcher Component
const DashboardSwitcher = () => {
  const { user, isAuthenticated } = useAuthStore() as any;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'CANDIDATE':
      return <CandidateDashboard />;
    case 'RECRUITER':
      return <RecruiterDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    default:
      return <Navigate to="/design-system" replace />;
  }
};

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground font-semibold">Loading page components...</div>}>
      <Routes>
        <Route path="/login" element={<div className="flex min-h-screen items-center justify-center bg-background"><div className="w-full max-w-md p-8 bg-card border border-border/40 rounded-2xl shadow-xl"><h1 className="text-2xl font-display font-bold text-foreground mb-6 text-center">Sign In</h1><LoginForm /></div></div>} />
        <Route path="/register" element={<div className="flex min-h-screen items-center justify-center bg-background"><div className="w-full max-w-md p-8 bg-card border border-border/40 rounded-2xl shadow-xl"><h1 className="text-2xl font-display font-bold text-foreground mb-6 text-center">Create Account</h1><RegisterForm /></div></div>} />
        <Route path="/" element={<DashboardLayout />}>
          {/* Dynamic workspace role home */}
          <Route index element={<DashboardSwitcher />} />

          {/* Candidate Portal paths */}
          <Route path="candidate/resume-analysis" element={<RoleGuard allowedRoles={['CANDIDATE']}><ResumeAnalysis /></RoleGuard>} />
          <Route path="candidate/resume-builder" element={<RoleGuard allowedRoles={['CANDIDATE']}><ResumeBuilder /></RoleGuard>} />
          <Route path="candidate/ats-score" element={<RoleGuard allowedRoles={['CANDIDATE']}><ATSScore /></RoleGuard>} />
          <Route path="candidate/resumes/:id" element={<RoleGuard allowedRoles={['CANDIDATE']}><ResumeDetails /></RoleGuard>} />
          <Route path="candidate/resumes/compare" element={<RoleGuard allowedRoles={['CANDIDATE']}><ResumeComparison /></RoleGuard>} />
          <Route path="candidate/mock-interview" element={<RoleGuard allowedRoles={['CANDIDATE']}><MockInterview /></RoleGuard>} />
          <Route path="candidate/mock-interview/report/:id" element={<RoleGuard allowedRoles={['CANDIDATE']}><InterviewReport /></RoleGuard>} />
          <Route path="candidate/profile" element={<RoleGuard allowedRoles={['CANDIDATE']}><CandidateProfile /></RoleGuard>} />
          <Route path="candidate/settings" element={<RoleGuard allowedRoles={['CANDIDATE']}><CandidateSettings /></RoleGuard>} />
          <Route path="candidate/assessments" element={<RoleGuard allowedRoles={['CANDIDATE']}><CandidateAssessments /></RoleGuard>} />
          <Route path="candidate/assessments/workspace/:id" element={<RoleGuard allowedRoles={['CANDIDATE']}><CodingWorkspace /></RoleGuard>} />
          <Route path="candidate/saved-jobs" element={<RoleGuard allowedRoles={['CANDIDATE']}><SavedJobs /></RoleGuard>} />
          <Route path="candidate/applications" element={<RoleGuard allowedRoles={['CANDIDATE']}><Applications /></RoleGuard>} />

          {/* Recruiter Portal paths */}
          <Route path="recruiter/jobs" element={<RoleGuard allowedRoles={['RECRUITER']}><RecruiterJobs /></RoleGuard>} />
          <Route path="recruiter/candidates" element={<RoleGuard allowedRoles={['RECRUITER']}><RecruiterCandidates /></RoleGuard>} />
          <Route path="recruiter/analytics" element={<RoleGuard allowedRoles={['RECRUITER']}><RecruiterAnalytics /></RoleGuard>} />
          <Route path="recruiter/company-profile" element={<RoleGuard allowedRoles={['RECRUITER']}><RecruiterCompanyProfile /></RoleGuard>} />
          <Route path="recruiter/interview-reports" element={<RoleGuard allowedRoles={['RECRUITER']}><RecruiterInterviewReports /></RoleGuard>} />
          <Route path="recruiter/assessments" element={<RoleGuard allowedRoles={['RECRUITER']}><RecruiterAssessments /></RoleGuard>} />

          {/* Admin Portal paths */}
          <Route path="admin/user-management" element={<RoleGuard allowedRoles={['ADMIN']}><AdminUserManagement /></RoleGuard>} />
          <Route path="admin/platform-analytics" element={<RoleGuard allowedRoles={['ADMIN']}><AdminPlatformAnalytics /></RoleGuard>} />
          <Route path="admin/ai-usage" element={<RoleGuard allowedRoles={['ADMIN']}><AdminAIUsage /></RoleGuard>} />
          <Route path="admin/audit-logs" element={<RoleGuard allowedRoles={['ADMIN']}><AdminAuditLogs /></RoleGuard>} />
          <Route path="admin/monitoring" element={<RoleGuard allowedRoles={['ADMIN']}><AdminMonitoring /></RoleGuard>} />

          {/* Showroom design components paths */}
          <Route path="design-system" element={<Showroom />} />
          <Route path="architecture" element={<AboutArchitecture />} />

          {/* Fallback route */}
          <Route path="interviews" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import useAuthStore from '../stores/useAuthStore';

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
const DashboardSwitcher = () => {
  const { user } = useAuthStore() as any;

  switch (user?.role) {
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
        <Route path="/" element={<DashboardLayout />}>
          {/* Dynamic workspace role home */}
          <Route index element={<DashboardSwitcher />} />

          {/* Candidate Portal paths */}
          <Route path="candidate/resume-analysis" element={<ResumeAnalysis />} />
          <Route path="candidate/ats-score" element={<ATSScore />} />
          <Route path="candidate/resumes/:id" element={<ResumeDetails />} />
          <Route path="candidate/resumes/compare" element={<ResumeComparison />} />
          <Route path="candidate/mock-interview" element={<MockInterview />} />
          <Route path="candidate/mock-interview/report/:id" element={<InterviewReport />} />
          <Route path="candidate/profile" element={<CandidateProfile />} />
          <Route path="candidate/settings" element={<CandidateSettings />} />
          <Route path="candidate/assessments" element={<CandidateAssessments />} />
          <Route path="candidate/assessments/workspace/:id" element={<CodingWorkspace />} />
          <Route path="candidate/saved-jobs" element={<SavedJobs />} />
          <Route path="candidate/applications" element={<Applications />} />

          {/* Recruiter Portal paths */}
          <Route path="recruiter/jobs" element={<RecruiterJobs />} />
          <Route path="recruiter/candidates" element={<RecruiterCandidates />} />
          <Route path="recruiter/analytics" element={<RecruiterAnalytics />} />
          <Route path="recruiter/company-profile" element={<RecruiterCompanyProfile />} />
          <Route path="recruiter/interview-reports" element={<RecruiterInterviewReports />} />
          <Route path="recruiter/assessments" element={<RecruiterAssessments />} />

          {/* Admin Portal paths */}
          <Route path="admin/user-management" element={<AdminUserManagement />} />
          <Route path="admin/platform-analytics" element={<AdminPlatformAnalytics />} />
          <Route path="admin/ai-usage" element={<AdminAIUsage />} />
          <Route path="admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="admin/monitoring" element={<AdminMonitoring />} />

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

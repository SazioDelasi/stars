import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/dashboard/Dashboard';
import StudentsPage from './pages/students/StudentsPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import StudentProfilePage from './pages/students/StudentProfilePage';
import ResultsPage from './pages/results/ResultsPage';
import ResultEntryPage from './pages/results/ResultEntryPage';
import ReportsPage from './pages/results/ReportsPage';
import MasterSearchPage from './pages/results/MasterSearchPage';
import GrievancesPage from './pages/grievances/GrievancesPage';
import GrievanceDetailPage from './pages/grievances/GrievanceDetailPage';
import CourseOfferingPage from './pages/reports/CourseOfferingPage';
import ProgrammePage from './pages/reports/ProgrammePage';
import DangerGraduationPage from './pages/reports/DangerGraduationPage';
import SemesterReportPage from './pages/reports/SemesterReportPage';
import UniversityComparisonPage from './pages/reports/UniversityComparisonPage';
import BatchUploadPage from './pages/reports/BatchUploadPage';
import StudentRegistrationPage from './pages/registration/StudentRegistrationPage';
import StaffRegistrationPage from './pages/registration/StaffRegistrationPage';
import CourseSetupPage from './pages/admin/CourseSetupPage';
import RegistrationStatusPage from './pages/reports/RegistrationStatusPage';
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="loading-spinner">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />

        {/* Students */}
        <Route path="students"                 element={<StudentsPage />} />
        <Route path="students/:id"             element={<StudentDetailPage />} />
        <Route path="profile"                  element={<StudentProfilePage />} />

        {/* Results */}
        <Route path="results"                  element={<ResultsPage />} />
        <Route path="results/entry"            element={<ResultEntryPage />} />
        <Route path="results/reports"          element={<ReportsPage />} />
        <Route path="results/master-search"    element={<MasterSearchPage />} />

        {/* Reports */}
        <Route path="reports/courses"          element={<CourseOfferingPage />} />
        <Route path="reports/programmes"       element={<ProgrammePage />} />
        <Route path="reports/semester"         element={<SemesterReportPage />} />
        <Route path="reports/danger"           element={<DangerGraduationPage />} />
        <Route path="reports/university"       element={<UniversityComparisonPage />} />
        <Route path="reports/batch"            element={<BatchUploadPage />} />
        <Route path="reports/registration-status" element={<RegistrationStatusPage />} />
        
        {/* Registration */}
        <Route path="registration"             element={<StudentRegistrationPage />} />
        <Route path="registration/manage"      element={<StaffRegistrationPage />} />
        <Route path="admin/course-setup" element={<CourseSetupPage />} />
        {/* Grievances */}
        <Route path="grievances"               element={<GrievancesPage />} />
        <Route path="grievances/:id"           element={<GrievanceDetailPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router><AppRoutes /></Router>
    </AuthProvider>
  );
}

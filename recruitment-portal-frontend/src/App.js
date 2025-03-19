// src/App.js (Updated with new routes)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Candidate pages
import CandidateDashboard from './components/candidate/Dashboard';
import CandidateProfile from './components/candidate/Profile';
import UploadCV from './components/candidate/UploadCV';
import JobSearch from './components/candidate/JobSearch';
import ApplicationsView from './components/candidate/ApplicationsView';
import AccountSettings from './components/candidate/AccountSettings';

// Company pages
import CompanyDashboard from './components/company/Dashboard';
import CompanyProfile from './components/company/Profile';
import VacancyManagement from './components/company/VacancyManagement';
import CreateVacancy from './components/company/CreateVacancy';
import EditVacancy from './components/company/EditVacancy';
import ApplicationsManagement from './components/company/ApplicationsManagement';
import InterviewConfig from './components/company/InterviewConfig';
import CandidateMatches from './components/company/CandidateMatches';
import CandidateSearch from './components/company/CandidateSearch';
import RecommendationsDashboard from './components/company/RecommendationsDashboard';
import CandidateComparison from './components/company/CandidateComparison';

// Admin pages
import AdminDashboard from './components/admin/Dashboard';
import UserManagement from './components/admin/UserManagement';
import CompanyManagement from './components/admin/CompanyManagement';
import CreateCompany from './components/admin/CreateCompany';
import CreateAdmin from './components/admin/CreateAdmin';

// Shared components
import HomePage from './components/HomePage';
import NotFound from './components/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Candidate routes */}
          <Route path="/candidate/dashboard" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <CandidateDashboard />
            </ProtectedRoute>
          } />
          <Route path="/candidate/profile" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <CandidateProfile />
            </ProtectedRoute>
          } />
          <Route path="/candidate/upload-cv" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <UploadCV />
            </ProtectedRoute>
          } />
          <Route path="/candidate/jobs" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <JobSearch />
            </ProtectedRoute>
          } />
          <Route path="/candidate/applications" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <ApplicationsView />
            </ProtectedRoute>
          } />
          <Route path="/candidate/account" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <AccountSettings />
            </ProtectedRoute>
          } />
          
          {/* Company routes */}
          <Route path="/company/dashboard" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <CompanyDashboard />
            </ProtectedRoute>
          } />
          <Route path="/company/profile" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <CompanyProfile />
            </ProtectedRoute>
          } />
          <Route path="/company/vacancies" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <VacancyManagement />
            </ProtectedRoute>
          } />
          <Route path="/company/vacancies/create" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <CreateVacancy />
            </ProtectedRoute>
          } />
          <Route path="/company/vacancies/:id/edit" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <EditVacancy />
            </ProtectedRoute>
          } />
          <Route path="/company/vacancies/:id/applications" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <ApplicationsManagement />
            </ProtectedRoute>
          } />
          <Route path="/company/vacancies/:id/interview-config" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <InterviewConfig />
            </ProtectedRoute>
          } />
          
          {/* New comparison route */}
          <Route path="/company/vacancies/:id/comparison" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <CandidateComparison />
            </ProtectedRoute>
          } />
          
          {/* Candidate profile viewing */}
          <Route path="/company/candidates/:id" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <CandidateProfile />
            </ProtectedRoute>
          } />

          {/* Candidate profile for a specific vacancy */}
          <Route path="/company/vacancies/:vacancyId/candidates/:id" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <CandidateProfile />
            </ProtectedRoute>
          } />
          
          {/* Matching and AI features */}
          <Route path="/company/vacancies/:id/matches" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <CandidateMatches />
            </ProtectedRoute>
          } />

          <Route path="/company/candidate-search" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <CandidateSearch />
            </ProtectedRoute>
          } />

          <Route path="/company/recommendations" element={
            <ProtectedRoute allowedRoles={['company', 'admin']}>
              <RecommendationsDashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/companies" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CompanyManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/companies/create" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateCompany />
            </ProtectedRoute>
          } />
          <Route path="/admin/users/create-admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateAdmin />
            </ProtectedRoute>
          } />
          
          {/* Redirect to login if not found */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
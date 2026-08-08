import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { Login } from '../pages/auth/Login';
import { DashboardLayout } from '../components/layout/DashboardLayout';

import { DoctorDashboard } from '../pages/doctor/Dashboard';
import { DoctorPatients } from '../pages/doctor/Patients';
import { PatientDetails } from '../pages/doctor/PatientDetails';
import { DoctorAssessments } from '../pages/doctor/Assessments';
import { DoctorPredictions } from '../pages/doctor/Predictions';
import { DoctorReferrals } from '../pages/doctor/Referrals';
import { DoctorSettings } from '../pages/doctor/Settings';

import { AdminDashboard } from '../pages/admin/Dashboard';
import { AdminAnalytics } from '../pages/admin/Analytics';
import { AdminVillages } from '../pages/admin/Villages';
import { AdminReports } from '../pages/admin/Reports';
import { AdminUsers } from '../pages/admin/Users';
import { AdminSettings } from '../pages/admin/Settings';

import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRole="doctor" />}>
        <Route path="/doctor" element={<DashboardLayout role="doctor" />}>
          <Route index element={<DoctorDashboard />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="patients/:id" element={<PatientDetails />} />
          <Route path="assessments" element={<DoctorAssessments />} />
          <Route path="predictions" element={<DoctorPredictions />} />
          <Route path="referrals" element={<DoctorReferrals />} />
          <Route path="settings" element={<DoctorSettings />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="villages" element={<AdminVillages />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
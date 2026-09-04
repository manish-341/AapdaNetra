import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/Login';
import Signup from '../pages/Signup';
import AuthCallback from '../pages/AuthCallback';

import Dashboard from '../pages/Dashboard';
import DisasterMap from '../pages/DisasterMap';
import AIAssistant from '../pages/AIAssistant';
import AICopilot from '../pages/AICopilot';
import CitizenReports from '../pages/CitizenReports';
import Forecasts from '../pages/Forecasts';
import Simulation from '../pages/Simulation';
import RiskAnalysis from '../pages/RiskAnalysis';

import CarryingCapacity from '../pages/CarryingCapacity';
import VulnerableHabitations from '../pages/VulnerableHabitations';
import RelocationPlan from '../pages/RelocationPlan';
import UserManage from '../pages/UserManage';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';

import { isAuthenticated, getUserRole } from '../lib/auth';

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function RequireGuest({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

function RequireResponder({ children }) {
  const role = getUserRole();
  const isResponder = ["ADMIN", "DISTRICT_OFFICER", "FIELD_OFFICER", "RESPONDER"].includes(role);
  return isAuthenticated() && isResponder ? children : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
      <Route path="/signup" element={<RequireGuest><Signup /></RequireGuest>} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/disaster-map" element={<RequireAuth><DisasterMap /></RequireAuth>} />
      <Route path="/ai-assistant" element={<RequireAuth><AIAssistant /></RequireAuth>} />
      <Route path="/ai-copilot" element={<RequireResponder><AICopilot /></RequireResponder>} />
      <Route path="/citizen-reports" element={<RequireAuth><CitizenReports /></RequireAuth>} />
      <Route path="/forecasts" element={<RequireAuth><Forecasts /></RequireAuth>} />
      <Route path="/risk-analysis" element={<RequireAuth><RiskAnalysis /></RequireAuth>} />
      <Route path="/simulation" element={<RequireResponder><Simulation /></RequireResponder>} />

      <Route path="/carrying-capacity" element={<RequireAuth><CarryingCapacity /></RequireAuth>} />
      <Route path="/vulnerable-habitations" element={<RequireAuth><VulnerableHabitations /></RequireAuth>} />
      <Route path="/relocation-planning" element={<RequireAuth><RelocationPlan /></RequireAuth>} />
      <Route path="/user-management" element={<RequireAuth><UserManage /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

      <Route path="/" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

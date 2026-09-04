import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Bot, 
  FileCheck2, 
  TrendingUp, 
  Sliders, 
  SearchCode, 
  BarChart3, 
  AlertTriangle, 
  Navigation, 
  Users, 
  FileText, 
  Settings,
  Lock
} from 'lucide-react';
import { Tooltip } from '@mui/material';
import { getUserRole } from '../lib/auth';
import { useThemeMode } from '../context/ThemeContext';
import AdminOnlyModal from '../components/AdminOnlyModal';

const Sidebar = () => {
  const role = getUserRole();
  const { isDark } = useThemeMode();
  const isAdmin = ["ADMIN", "ADMINISTRATOR"].includes(role);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminModalFeature, setAdminModalFeature] = useState('');

  const handleAdminOnlyClick = (e, featureName) => {
    e.preventDefault();
    setAdminModalFeature(featureName);
    setAdminModalOpen(true);
  };

  return (
    <aside className="sidebar">
      <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '1.15rem',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
          }}>
            A
          </div>
          <div>
            <h2 style={{ color: isDark ? '#38bdf8' : '#0284c7', margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              AapdaNetra
            </h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              AI Disaster Intelligence
            </span>
          </div>
        </div>
      </div>

      <nav style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
        
        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
          Command & Intelligence
        </div>
        
        <NavLink to="/dashboard" className="nav-item"><LayoutDashboard size={17} /> Command Dashboard</NavLink>
        <NavLink to="/disaster-map" className="nav-item"><Map size={17} /> Live Disaster Map</NavLink>
        <NavLink to="/ai-assistant" className="nav-item"><Bot size={17} /> AI Emergency Assistant</NavLink>

        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', margin: '0.85rem 0 0.25rem 0', paddingLeft: '0.5rem' }}>
          Analytics & Predictions
        </div>

        <NavLink to="/citizen-reports" className="nav-item"><FileCheck2 size={17} /> Citizen Reports</NavLink>
        <NavLink to="/forecasts" className="nav-item"><TrendingUp size={17} /> Temporal Forecasts</NavLink>
        <NavLink to="/risk-analysis" className="nav-item"><SearchCode size={17} /> Risk Analysis (XAI)</NavLink>

        {/* What If Simulation */}
        {isAdmin ? (
          <NavLink to="/simulation" className="nav-item">
            <Sliders size={17} /> "What If?" Simulation
          </NavLink>
        ) : (
          <Tooltip title="Only for Admin uses" arrow placement="right">
            <div
              className="nav-item"
              onClick={(e) => handleAdminOnlyClick(e, '"What-If?" Disaster Simulation')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Sliders size={17} /> "What If?" Simulation
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                ADMIN
              </span>
            </div>
          </Tooltip>
        )}

        {/* Operations & Relocation */}
        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', margin: '0.85rem 0 0.25rem 0', paddingLeft: '0.5rem' }}>
          Operations & Relocation
        </div>
        
        {isAdmin ? (
          <NavLink to="/vulnerable-habitations" className="nav-item"><AlertTriangle size={17} /> Vulnerable Habitations</NavLink>
        ) : (
          <Tooltip title="Only for Admin uses" arrow placement="right">
            <div
              className="nav-item"
              onClick={(e) => handleAdminOnlyClick(e, 'Vulnerable Habitations Assessment')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <AlertTriangle size={17} /> Vulnerable Habitations
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                ADMIN
              </span>
            </div>
          </Tooltip>
        )}

        {/* Shelter Capacity */}
        {isAdmin ? (
          <NavLink to="/carrying-capacity" className="nav-item"><BarChart3 size={17} /> Shelter Capacity</NavLink>
        ) : (
          <Tooltip title="Only for Admin uses" arrow placement="right">
            <div
              className="nav-item"
              onClick={(e) => handleAdminOnlyClick(e, 'Shelter Capacity & Intake Logistics')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <BarChart3 size={17} /> Shelter Capacity
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                ADMIN
              </span>
            </div>
          </Tooltip>
        )}

        {isAdmin ? (
          <NavLink to="/relocation-planning" className="nav-item"><Navigation size={17} /> Relocation Plans</NavLink>
        ) : (
          <Tooltip title="Only for Admin uses" arrow placement="right">
            <div
              className="nav-item"
              onClick={(e) => handleAdminOnlyClick(e, 'Relocation Planning & Routing')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Navigation size={17} /> Relocation Plans
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                ADMIN
              </span>
            </div>
          </Tooltip>
        )}

        {isAdmin ? (
          <NavLink to="/user-management" className="nav-item"><Users size={17} /> User Management</NavLink>
        ) : (
          <Tooltip title="Only for Admin uses" arrow placement="right">
            <div
              className="nav-item"
              onClick={(e) => handleAdminOnlyClick(e, 'User Access & Role Management')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Users size={17} /> User Management
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 5px', borderRadius: 4, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                ADMIN
              </span>
            </div>
          </Tooltip>
        )}

        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', margin: '0.85rem 0 0.25rem 0', paddingLeft: '0.5rem' }}>
          System
        </div>
        
        {isAdmin && (
          <NavLink to="/reports" className="nav-item"><FileText size={17} /> System Reports</NavLink>
        )}
        <NavLink to="/settings" className="nav-item"><Settings size={17} /> Settings</NavLink>
      </nav>

      {/* Admin Only Modal */}
      <AdminOnlyModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        featureName={adminModalFeature}
      />
    </aside>
  );
};

export default Sidebar;
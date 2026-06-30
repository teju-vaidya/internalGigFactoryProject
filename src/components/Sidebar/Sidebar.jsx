import React from 'react';
import { 
  LayoutDashboard, BarChart3, Briefcase, Users, Building, 
  FileText, User, FileCheck, LogOut 
} from 'lucide-react';
import './Sidebar.css';
import gigfactoryLogo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';

export const Sidebar = ({ currentRole, onRoleChange }) => {


   const navigate = useNavigate();
  return (
    <aside className="portal-sidebar">
      <div className="sidebar-brand-wrapper">
        <img 
          src={gigfactoryLogo} 
          alt="Gigfactory Branding Logo" 
          className="sidebar-brand-img" 
        />
        {/* <div className="brand-logo-accent">⚡</div>
        <span className="brand-text">Gigfactory</span>  */}
      </div>

      {/* Role Switcher Sandbox Simulator */}
      <div className="role-simulator-box">
        <label>Simulate Role:</label>
        <select value={currentRole} onChange={(e) => onRoleChange(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="gig_expert">Gig Expert</option>
          <option value="agency">Agency</option>
        </select>
      </div>

      {/* Profile Block */}

      

      {/* <div className="sidebar-user-profile clickable-profile-card"
    onClick={() => navigate('/profile')} >
        <div className="profile-avatar">
          {currentRole === 'admin' ? 'AD' : 'AX'} 
        </div>
        <div className="profile-details">
          <h4>{currentRole === 'admin' ? 'Admin User' : 'Alex'}</h4> 
          <p>{currentRole.toUpperCase()}</p>
        </div>
      </div> */}

      {/* Contextual Navigation Menu */}

      <nav className="sidebar-navigation-menu">
        <a href="#overview" className="menu-link ">
          <LayoutDashboard size={18} /> <span>Dashboard</span> 
        </a>

        {/* Admin Navigation System */}

        {currentRole === 'admin' && (
          <>
            <a href="#analytics" className="menu-link">
              <BarChart3 size={18} /> <span>Analytics</span> 
            </a>
            <a href="#projects" className="menu-link">
              <Briefcase size={18} /> <span>Projects</span> 
            </a>
            <a href="#gigExperts" className="menu-link">
              <Users size={18} /> <span>Gig Experts</span>
            </a>
            <a href="#agencies" className="menu-link">
              <Building size={18} /> <span>Agencies</span> 
            </a>
            <a href="#requests" className="menu-link">
              <FileText size={18} /> <span>Requests</span> 
            </a>
          </>
        )}

        {/* Gig Expert & Agency Shared Core Views */}

        {(currentRole === 'gig_expert' || currentRole === 'agency') && (
          <>
            <a href="#browse" className="menu-link">
              <Briefcase size={18} /> <span>Browse Projects</span> 
            </a>
            <a href="#applications" className="menu-link">
              <FileCheck size={18} /> <span>My Applications</span>
            </a>
            <a href="#profile" className="menu-link">
              <User size={18} /> <span>My Profile</span> 
            </a>
          </>
        )}
      </nav>

      <button className="sidebar-logout-action">
        <LogOut size={18} /> <span>Logout</span> 
      </button>
    </aside>
  );
};
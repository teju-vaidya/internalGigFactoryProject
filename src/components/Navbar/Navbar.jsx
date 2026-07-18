import React, { useState } from 'react';
import { Bell, User, X } from 'lucide-react';
import './Navbar.css';
import gigfactoryLogo from '../../assets/logo.png'; 

const profilePhotoImg = "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah";


export const Navbar = ({ role, currentView, onViewChange }) => {
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(3); // Mock live badge count

  return (
    <header className="portal-top-navbar">
      {/* Left Section: Branding Title/Logo */}
      <div className="navbar-left-brand" onClick={() => onViewChange('dashboard')} role="button" tabIndex={0}>
        <img src={gigfactoryLogo} alt="Gigfactory Logo" className="navbar-logo-img" />
      </div>

      {/* Right Section: Interactions, Badges, Profile Action Blocks */}
      <div className="navbar-right-actions">
        
        {/* Notification Icon Bell Button */}
        <div className="navbar-notification-bell-box" onClick={() => setNotificationsCount(0)} title="View Notifications">
          <Bell size={20} className="bell-vector-icon" />
          {notificationsCount > 0 && (
            <span className="notification-badge-counter">{notificationsCount}</span>
          )}
        </div>

        {/* Clickable Profile Interactive Block -> Navigates to full profile screen */}
        <div 
          className={`navbar-user-profile-trigger ${currentView === 'profile' ? 'is-active-view' : ''}`}
          onClick={() => onViewChange('profile')}
          role="button"
          tabIndex={0}
          title="Go to My Profile"
        >
          <div className="user-text-details">
            <span className="user-name-txt">{role === 'admin' ? 'Admin User' : 'Sarah Johnson'}</span>
            <span className="user-role-badge">{role.toUpperCase()}</span>
          </div>
          
          {/* Circular profile click wrapper to launch the photo overlay lightbox */}
          <div 
            className="navbar-avatar-circle"
            onClick={(e) => {
              e.stopPropagation(); // Stops view navigation from firing when clicking just the photo container
              setIsPhotoOpen(true);
            }}
            title="Expand Profile Photo"
          >
            <User size={18} className="navbar-avatar-fallback-icon" />
          </div>
        </div>
      </div>

      {/* ==========================================
          PROFILE PHOTO LIGHTBOX MODAL OVERLAY
         ========================================== */}
      {isPhotoOpen && (
        <div className="profile-photo-modal-overlay" onClick={() => setIsPhotoOpen(false)}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal-close-btn" onClick={() => setIsPhotoOpen(false)}>
              <X size={20} />
            </button>
            <div className="photo-wrapper">
              <img src={profilePhotoImg} alt="Sarah Johnson Profile Preview" className="large-profile-preview-img" />
            </div>
            <div className="photo-modal-footer">
              <h3>{role === 'admin' ? 'Admin User' : 'Sarah Johnson'}</h3>
              <p>{role.toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
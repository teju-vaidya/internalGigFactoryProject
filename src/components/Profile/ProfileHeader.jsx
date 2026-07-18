import React from 'react';
import { Mail, MapPin, Phone, Globe, Calendar, Edit2 } from 'lucide-react';
import './ProfileHeader.css';

export const ProfileHeader = ({
  role,
  isGigExpert,
  name,
  avatar,
  subtitle,
  emailVal,
  phoneVal,
  locationVal,
  webVal,
  foundedYear,
  initials,
  availability,
  handleEditClick,
  hideEditButton
}) => {

  return (

    <header className="profile-identity-banner">
      <div className="profile-identity-main">
        <div className="profile-large-avatar p-0 overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="profile-title-details">
          <div className="profile-name-row">
            <h1>{name || 'No Name Found'}</h1>
            <div className="availability-tooltip">
              <span className="availability-chip " >
                {isGigExpert ? (availability || 'AVAILABLE') : 'ACTIVE PORTAL'}
              </span>

              <div className="tooltip-content">
                {availability === "full-time" ? 'Available for the entire 10 hours' : 'Available for working hours'}
              </div>
            </div>
          </div>

          <p className="profile-subtitle-text">{subtitle}</p>

          <div className="meta-contact-links-grid">
            {emailVal && <span><Mail size={14} /> {emailVal}</span>}
            {locationVal && <span><MapPin size={14} /> {locationVal}</span>}
            {phoneVal && <span><Phone size={14} /> {phoneVal}</span>}
            {webVal && (
              <span>
                <Globe size={14} />
                <a href={webVal.startsWith('http') ? webVal : `https://${webVal}`} target="_blank" rel="noreferrer" className="text-inherit underline">
                  {webVal}
                </a>
              </span>
            )}
            {!isGigExpert && foundedYear && (
              <span><Calendar size={14} /> Est. {foundedYear}</span>
            )}
          </div>
        </div>
      </div>

      {!hideEditButton && handleEditClick && (
        <button className="edit-profile-action-btn" onClick={handleEditClick}>
          <Edit2 size={14} /> Edit Profile
        </button>
      )}
    </header>
  );
};

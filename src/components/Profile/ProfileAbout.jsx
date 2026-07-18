import React from 'react';

export const ProfileAbout = ({ isGigExpert, bio, description }) => {

  return (
    <div className="pane-content-card">
      <h3>{isGigExpert ? 'About Me' : 'About Our Agency'}</h3>
      
      <p className="narrative-biography-text">
        {isGigExpert 
          ? (bio || 'No biography details provided yet.') 
          : (description || 'No description details provided yet.')
        }
      </p>
    </div>
  );
};

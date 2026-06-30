import React from 'react';

export const ProfileStats = ({ isGigExpert, totalProjects, hourlyRate, commercialBasis, employeeCount }) => {
  return (
    <section className="profile-quick-stats-row">
      <div className="stat-metric-box">
        <span className="stat-label">Projects Assigned</span>
        <span className="stat-value">{totalProjects || 0}</span>
      </div>

      {isGigExpert ? (
        <div className="stat-metric-box">
          <span className="stat-label">Commercial Rate</span>
          <span className="stat-value">
            {hourlyRate ? `INR ${hourlyRate}/${commercialBasis || 'hr'}` : 'Not Specified'}
          </span>
        </div>
      ) : (
        <div className="stat-metric-box">
          <span className="stat-label">Total Team Size</span>
          <span className="stat-value">{employeeCount} Members</span>
        </div>
      )}
    </section>
  );
};

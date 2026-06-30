import React from 'react';
import { Briefcase, Users, Building, FileText, TrendingUp } from 'lucide-react';

export const DashboardMetrics = ({ role, isRequestsLoading, registrationRequests, applicationsCount = 0, activeCount = 0, completedCount = 0, totalEarnings = 0 }) => {
  if (role === 'admin') {
    return (
      <section className="portal-metrics-grid">
        <div className="metric-card-item">
          <div className="m-card-head"><span>TOTAL PROJECTS</span><Briefcase size={16} /></div>
          <div className="m-card-val">3</div>
        </div>
        <div className="metric-card-item">
          <div className="m-card-head"><span>TOTAL GIG EXPERTS</span><Users size={16} /></div>
          <div className="m-card-val">0</div>
        </div>
        <div className="metric-card-item">
          <div className="m-card-head"><span>TOTAL AGENCY</span><Building size={16} /></div>
          <div className="m-card-val">1</div>
        </div>
        <div className="metric-card-item">
          <div className="m-card-head"><span>NEW REQUESTS</span><FileText size={16} /></div>
          <div className="m-card-val">
            {isRequestsLoading ? (
              <span className="skeleton-pulse inline-block w-10 h-7 rounded" />
            ) : (
              registrationRequests.filter(r => r.status === 'pending').length
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="portal-metrics-grid">
      <div className="metric-card-item">
        <div className="m-card-head"><span>APPLICATIONS</span><FileText size={16} /></div>
        <div className="m-card-val">{applicationsCount}</div>
      </div>
      <div className="metric-card-item">
        <div className="m-card-head"><span>ACTIVE PROJECTS</span><Briefcase size={16} /></div>
        <div className="m-card-val">{activeCount}</div>
      </div>
      <div className="metric-card-item">
        <div className="m-card-head"><span>COMPLETED PROJECTS</span><Briefcase size={16} /></div>
        <div className="m-card-val">{completedCount}</div>
      </div>
      <div className="metric-card-item insight-gradient">
        <div className="m-card-head"><span>TOTAL EARNINGS</span><TrendingUp size={16} className="text-[#70d64d]" /></div>
        <div className="m-card-val text-[#70d64d]">
          ₹{Number(totalEarnings).toLocaleString('en-IN')}
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Clock, Check, XCircle, FileText } from 'lucide-react';

export const EmptyProjectsState = ({ applications = [] }) => {
  const navigate = useNavigate();

  // Filter pending applications
  const pendingApps = applications.filter(app => 
    ['applied', 'pending', 'reviewed', 'shortlisted'].includes(app.status?.toLowerCase())
  );
  const acceptedApps = applications.filter(app => 
    app.status?.toLowerCase() === 'accepted'
  );
  
  // Format budget helper
  const formatBudget = (budget) => {
    return budget ? `₹${Number(budget).toLocaleString('en-IN')}` : 'Undisclosed';
  };

  // Limit list to 3 items
  const recentApps = [...applications]
    .sort((a, b) => new Date(b.applied_at || 0) - new Date(a.applied_at || 0))
    .slice(0, 3);

  return (
    <div className="empty-projects-card-panel max-w-[90vw] w-full mx-auto p-6 md:p-8 bg-[#121215] border border-[#23232a] rounded-xl flex flex-col items-center text-center shadow-xl transition-all duration-300">
      
      {/* Icon */}
      <div className="empty-illustrative-icon bg-[#1c1c22] border border-[#23232a] text-[#b5ff14] w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(181,255,20,0.1)]">
        <Briefcase size={32} strokeWidth={1.5} />
      </div>

      <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">No Active Projects</h2>
      
      {applications.length > 0 ? (
        <div className="w-full flex flex-col items-center">
          <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed">
            {acceptedApps.length > 0 
              ? "You have approved applications waiting for kickoff! Admin will start your project workspace soon."
              : `You have no active project workspaces yet, but you have ${pendingApps.length} proposal(s) currently under review.`}
          </p>

          {/* Recent Applications Listing */}
          <div className="w-full flex flex-col gap-3 mb-6 text-left">
            <span className="text-[0.7rem] uppercase font-bold text-[#6c727f] tracking-wider border-b border-[#23232a] pb-1.5 block">
              Recent Application Status
            </span>
            {recentApps.map((app) => {
              const project = app.project || {};
              const statusLower = app.status?.toLowerCase();
              let statusText = 'PENDING';
              let statusClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

              if (statusLower === 'accepted') {
                statusText = 'APPROVED';
                statusClass = 'bg-[#70d64d]/10 text-[#70d64d] border border-[#70d64d]/20';
              } else if (statusLower === 'rejected') {
                statusText = 'NOT SELECTED';
                statusClass = 'bg-red-500/10 text-red-400 border border-red-500/20';
              }

              return (
                <div 
                  key={app.id} 
                  className="flex items-center justify-between bg-[#0c0c0e] border border-[#23232a] hover:border-white/10 rounded-lg p-3.5 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <h4 className="text-white text-[0.88rem] font-bold truncate hover:text-[#70d64d] transition-colors">
                      {project.title || 'Untitled Project'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[0.75rem] text-[#6c727f]">
                      <span>Budget: {formatBudget(project.budget)}</span>
                      <span>•</span>
                      <span>Applied: {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}</span>
                    </div>
                  </div>
                  <span className={`text-[0.62rem] font-extrabold px-2.5 py-1 rounded tracking-wider uppercase shrink-0 ${statusClass}`}>
                    {statusText}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <button 
              type="button"
              onClick={() => navigate('/applications')}
              className="check-status-action-trigger w-full sm:w-auto cursor-pointer"
            >
              VIEW ALL APPLICATIONS <ArrowRight size={14} />
            </button>
            <button 
              type="button"
              onClick={() => navigate('/projects')}
              className="w-full sm:w-auto bg-transparent border border-[#23232a] hover:border-white/10 text-gray-300 font-bold px-[24px] py-[12px] rounded-[6px] text-[0.82rem] cursor-pointer transition-colors"
            >
              BROWSE OPEN PROJECTS
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <p className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
            You don't have any active projects or open applications yet. Check out open opportunities and start applying!
          </p>
          <button 
            type="button"
            onClick={() => navigate('/projects')}
            className="check-status-action-trigger cursor-pointer"
          >
            BROWSE OPEN PROJECTS <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

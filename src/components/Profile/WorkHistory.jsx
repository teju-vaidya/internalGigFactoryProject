import React from 'react';
import { Briefcase, CheckCircle, RefreshCw } from 'lucide-react';

export const WorkHistory = ({ workHistory, platformProjects = [] }) => {
  const completedProjects = platformProjects.filter(p => p.status === 'completed');
  const ongoingProjects = platformProjects.filter(p => p.status === 'active' || p.status === 'assigned');

  return (
    <div className="pane-content-card">
      {/* 1. Projects Completed on GigFactory */}
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-[0.95rem] font-bold text-white border-b border-white/5 pb-2 mb-3">
          <CheckCircle size={16} className="text-[#b5ff14]" /> Projects Completed on GigFactory
        </h3>
        {completedProjects.length === 0 ? (
          <div className="bg-[#0c0c0e] border border-[#23232a] rounded-lg p-3">
            <p className="text-[0.78rem] text-[#8a8f98] m-0">
              No completed projects on GigFactory yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {completedProjects.map((assignment) => (
              <div key={assignment.id} className="bg-[#0c0c0e] border border-[#232328] rounded-md p-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <strong className="text-white text-[0.82rem] block truncate">
                      {assignment.project?.title || 'Untitled Project'}
                    </strong>
                    <span className="text-[0.7rem] text-[#8a8f98]">
                      Code: {assignment.project?.project_code || 'N/A'}
                    </span>
                  </div>
                  <span className="text-[0.7rem] bg-[#1c1c22] border border-[#23232a] text-[#b5ff14] px-2 py-0.5 rounded flex-shrink-0">
                    {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Completed'}
                  </span>
                </div>
                {assignment.assigned_amount && (
                  <p className="text-[0.74rem] text-white mt-1.5 mb-0">
                    Contract Value: <span className="font-bold text-[#b5ff14]">INR {Number(assignment.assigned_amount).toLocaleString('en-IN')}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>


      {/* 2. Ongoing Projects on GigFactory */}
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-[0.95rem] font-bold text-white border-b border-white/5 pb-2 mb-3">
          <RefreshCw size={16} className="text-[#38bdf8]" /> Ongoing Projects on GigFactory
        </h3>
        {ongoingProjects.length === 0 ? (
          <div className="bg-[#0c0c0e] border border-[#23232a] rounded-lg p-3">
            <p className="text-[0.78rem] text-[#8a8f98] m-0">
              No active or ongoing projects on GigFactory.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ongoingProjects.map((assignment) => (
              <div key={assignment.id} className="bg-[#0c0c0e] border border-[#232328] rounded-md p-3">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <strong className="text-white text-[0.82rem] block truncate">
                      {assignment.project?.title || 'Untitled Project'}
                    </strong>
                    <span className="text-[0.7rem] text-[#8a8f98]">
                      Code: {assignment.project?.project_code || 'N/A'}
                    </span>
                  </div>
                  <span className="text-[0.7rem] bg-[#1c1c22] border border-[#23232a] text-[#38bdf8] px-2 py-0.5 rounded flex-shrink-0">
                    In Progress ({assignment.project?.progress_percentage ?? 0}%)
                  </span>
                </div>
                {assignment.assigned_amount && (
                  <p className="text-[0.74rem] text-white mt-1.5 mb-0">
                    Allocated Amount: <span className="font-bold text-[#38bdf8]">INR {Number(assignment.assigned_amount).toLocaleString('en-IN')}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. External Work History */}
      {/* <div>
        <h3 className="flex items-center gap-2 text-[0.95rem] font-bold text-white border-b border-white/5 pb-2 mb-3">
          <Briefcase size={16} className="text-gray-400" /> Prior Work Experience
        </h3>
        {(!workHistory || workHistory.length === 0) ? (
          <p className="job-summary-details italic text-gray-500 text-[0.8rem] m-0">No professional experience history listed yet.</p>
        ) : (
          <div className="history-timeline-list">
            {workHistory.map((job) => (
              <div key={job.id} className="history-item">
                <div className="history-meta-row">
                  <strong>{job.designation}</strong>
                  <span className="timeline-badge-year">
                    {job.start_date ? new Date(job.start_date).getFullYear() : ''} - {job.end_date ? new Date(job.end_date).getFullYear() : 'Present'}
                  </span>
                </div>
                <span className="company-attribution-text">{job.company_name}</span>
                <p className="job-summary-details">{job.description}</p>
              </div>
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
};


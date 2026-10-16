import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_BADGE_MAP = {
  shortlisted: { color: '#70d64d', label: 'SHORTLISTED' },
  reviewed: { color: '#38bdf8', label: 'REVIEWED' },
  rejected: { color: '#ef4444', label: 'REJECTED' },
  pending: { color: '#f59e0b', label: 'PENDING' },
};

export function RecentFulltimeRequestsWidget() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: requests = [] } = useQuery({
    queryKey: ['admin-fulltime-requests', 'overview'],
    queryFn: () => api.get('/fulltime-requests?limit=5&sort=newest').then((r) => r.requests || []),
  });

  if (!requests || requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[24px]">
      <div className="flex justify-between items-center mb-[20px]">
        <div className="flex items-center gap-2">
          <h2 className="text-white text-[1rem] font-extrabold m-0">
            Recent Full-Time Career Requests
          </h2>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-transparent border-none text-gray-500 hover:text-white cursor-pointer flex items-center p-1"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        <button
          onClick={() => navigate('/admin/fulltime-requests')}
          className="bg-transparent border border-[#23232a] text-[#70d64d] rounded-[6px] px-[12px] py-[6px] text-[0.75rem] font-bold cursor-pointer flex items-center gap-[5px]"
        >
          View All <ArrowRight size={12} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-[12px] animate-fade-in">
          {requests.map((req) => {
            const statusConfig = STATUS_BADGE_MAP[req.status] || {
              color: '#f59e0b',
              label: (req.status || 'PENDING').toUpperCase(),
            };
            const roleColor = '#38bdf8';

            return (
              <div
                key={req.id}
                onClick={() => navigate(`/admin/fulltime-requests?id=${req.id}`)}
                className="flex items-center gap-[12px] px-[8px] py-[10px] border-b border-[#1a1a22] cursor-pointer rounded-[6px] transition-colors duration-200 hover:bg-[#181820]"
              >
                {/* Avatar initial */}
                <div
                  style={{ background: `${roleColor}18`, borderColor: `${roleColor}40`, color: roleColor }}
                  className="w-[36px] h-[36px] rounded-full border flex items-center justify-center font-extrabold text-[0.75rem] shrink-0"
                >
                  {req.full_name?.charAt(0).toUpperCase() || '?'}
                </div>

                {/* Candidate Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-[8px]">
                    <span className="text-white font-semibold text-[0.85rem] whitespace-nowrap overflow-hidden text-ellipsis capitalize">
                      {req.full_name}
                    </span>
                    <span
                      style={{ background: `${roleColor}18`, color: roleColor }}
                      className="text-[0.62rem] font-bold px-[6px] py-[2px] rounded-[4px] shrink-0 max-w-[150px] truncate"
                      title={req.interested_in || 'FULL TIME'}
                    >
                      {req.interested_in ? req.interested_in.toUpperCase() : 'FULL TIME'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-[0.75rem] m-0 mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis">
                    {req.email}
                  </p>
                </div>

                {/* Status & Date */}
                <div className="flex flex-col items-end gap-[4px] shrink-0">
                  <span
                    style={{ background: `${statusConfig.color}18`, color: statusConfig.color }}
                    className="text-[0.62rem] font-bold px-[7px] py-[2px] rounded-[4px]"
                  >
                    {statusConfig.label}
                  </span>
                  <span className="text-[#4b4b57] text-[0.68rem]">{fmtDate(req.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

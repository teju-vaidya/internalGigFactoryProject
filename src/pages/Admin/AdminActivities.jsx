import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  User,
  Activity,
  Briefcase,
  TrendingUp,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../../utils/api';

const fmtDateTime = (dStr) => {
  if (!dStr) return '—';
  const d = new Date(dStr);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export default function AdminActivities() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all', 'feed', 'auth'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data: activitiesResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-activities', page, limit, debouncedSearch, selectedModule, selectedType],
    queryFn: () =>
      api.get(`/profiles/admin/activities`, {
        headers: {},
        // Fetch parameters appended in query string manually or through fetch helper
      }),
    // Workaround since our custom fetch helper accepts full query in URL
    // We construct the query string manually
    queryFn: () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type: selectedType,
        module: selectedModule,
        search: debouncedSearch
      });
      return api.get(`/profiles/admin/activities?${queryParams.toString()}`);
    },
    refetchInterval: 30_000 // refresh every 30 seconds
  });

  const data = activitiesResponse?.data || {};
  const activities = data.activities || [];
  const total = data.total || 0;
  const totalPages = data.totalPages || 1;

  // Determine badge styling based on action/operation and module
  const getBadgeStyle = (module, action, type) => {
    const mod = (module || '').toLowerCase();
    const act = (action || '').toLowerCase();

    // 1. Auth/Security type
    if (type === 'auth' || mod === 'auth') {
      if (act.includes('fail') || act.includes('lock') || act.includes('block') || act.includes('reject')) {
        return 'bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[rgba(239,68,68,0.25)]'; // Red
      }
      return 'bg-[rgba(56,189,248,0.12)] text-[#38bdf8] border-[rgba(56,189,248,0.25)]'; // Blue
    }

    // 2. Approvals, completions, successes (Green)
    if (
      act.includes('approve') || 
      act.includes('complete') || 
      act.includes('accept') || 
      act.includes('verify') ||
      act.includes('success')
    ) {
      return 'bg-[rgba(112,214,77,0.12)] text-[#70d64d] border-[rgba(112,214,77,0.25)]';
    }

    // 3. Rejections, deletions, revokes, blocks (Red)
    if (
      act.includes('reject') || 
      act.includes('delete') || 
      act.includes('revoke') || 
      act.includes('remove') ||
      act.includes('block')
    ) {
      return 'bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[rgba(239,68,68,0.25)]';
    }

    // 4. Resets, undos, reverts (Pink)
    if (act.includes('reset') || act.includes('undo') || act.includes('revert')) {
      return 'bg-[rgba(236,72,153,0.12)] text-[#ec4899] border-[rgba(236,72,153,0.25)]';
    }

    // 5. Payment, payout, records (Amber)
    if (mod === 'payment' || act.includes('payment') || act.includes('pay')) {
      return 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[rgba(245,158,11,0.25)]';
    }

    // 6. Milestones (Purple)
    if (mod === 'milestone') {
      return 'bg-[rgba(192,132,252,0.12)] text-[#c084fc] border-[rgba(192,132,252,0.25)]';
    }

    // 7. Projects (Cyan)
    if (mod === 'project') {
      return 'bg-[rgba(6,182,212,0.12)] text-[#06b6d4] border-[rgba(6,182,212,0.25)]';
    }

    return 'bg-[rgba(255,255,255,0.06)] text-[#9ca3af] border-[rgba(255,255,255,0.1)]';
  };

  const getModuleIcon = (module, type) => {
    if (type === 'auth') return <ShieldAlert size={14} className="text-[#38bdf8]" />;
    
    const mod = (module || '').toLowerCase();
    switch (mod) {
      case 'project':
        return <Briefcase size={14} className="text-[#70d64d]" />;
      case 'milestone':
        return <Activity size={14} className="text-[#c084fc]" />;
      case 'payment':
        return <TrendingUp size={14} className="text-[#f59e0b]" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="flex flex-col gap-[24px] pb-[40px]">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white text-[1.8rem] font-extrabold m-0 tracking-tight">System Logs & Activities</h1>
          <p className="text-gray-400 text-[0.85rem] mt-[4px]">Monitor portal logs, administrative actions, and logins in real-time</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="flex items-center gap-[8px] bg-[#121215] border border-[#23232a] hover:border-[#70d64d] text-gray-300 hover:text-white px-[16px] py-[10px] rounded-[8px] transition-all text-[0.85rem] font-medium disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh Logs
        </button>
      </div>

      {/* Tabs / Filters Bar */}
      <div className="flex flex-col md:flex-row gap-[16px] justify-between items-start md:items-center bg-[#121215] border border-[#23232a] rounded-[12px] p-[16px]">
        {/* Logs Type Tabs */}
        <div className="flex gap-[6px] bg-[#0c0c0e] p-[4px] rounded-[8px] border border-[#23232a]">
          <button
            onClick={() => { setSelectedType('all'); setPage(1); }}
            className={`px-[16px] py-[8px] rounded-[6px] text-[0.85rem] font-bold transition-all ${
              selectedType === 'all'
                ? 'bg-[#23232a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => { setSelectedType('feed'); setPage(1); }}
            className={`px-[16px] py-[8px] rounded-[6px] text-[0.85rem] font-bold transition-all ${
              selectedType === 'feed'
                ? 'bg-[#23232a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            System Feeds
          </button>
          <button
            onClick={() => { setSelectedType('auth'); setPage(1); }}
            className={`px-[16px] py-[8px] rounded-[6px] text-[0.85rem] font-bold transition-all ${
              selectedType === 'auth'
                ? 'bg-[#23232a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Security Logs
          </button>
        </div>

        {/* Search & Module Filters */}
        <div className="flex flex-col sm:flex-row gap-[12px] w-full md:w-auto items-stretch sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-[240px]">
            <Search size={16} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search performer or action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0c0c0e] border border-[#23232a] focus:border-[#70d64d] text-white pl-[38px] pr-[12px] py-[8px] rounded-[8px] w-full text-[0.85rem] outline-none transition-all"
            />
          </div>

          {/* Module Selector */}
          <div className="relative flex items-center bg-[#0c0c0e] border border-[#23232a] rounded-[8px] px-[12px]">
            <Filter size={14} className="text-gray-500 mr-[8px]" />
            <select
              value={selectedModule}
              onChange={(e) => { setSelectedModule(e.target.value); setPage(1); }}
              className="bg-[#0c0c0e] text-white py-[8px] pr-[16px] outline-none text-[0.85rem] cursor-pointer appearance-none"
            >
              <option value="all">All Modules</option>
              <option value="project">Projects</option>
              <option value="milestone">Milestones</option>
              <option value="payment">Payments</option>
              <option value="auth">Auth & Session</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-[#121215] border border-[#23232a] rounded-[12px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#23232a] bg-[#0c0c0e] text-gray-400 uppercase text-[0.7rem] font-bold tracking-[1.2px]">
                <th className="py-[16px] px-[20px]">Timestamp</th>
                <th className="py-[16px] px-[20px]">Performer</th>
                <th className="py-[16px] px-[20px]">Module / Action</th>
                <th className="py-[16px] px-[20px]">Description</th>
                <th className="py-[16px] px-[20px]">Context / Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-[#23232a]/60">
                    <td className="py-[18px] px-[20px]"><div className="skeleton-pulse w-[140px] h-[16px] rounded-[4px]" /></td>
                    <td className="py-[18px] px-[20px]"><div className="skeleton-pulse w-[120px] h-[16px] rounded-[4px]" /></td>
                    <td className="py-[18px] px-[20px]"><div className="skeleton-pulse w-[100px] h-[20px] rounded-[12px]" /></td>
                    <td className="py-[18px] px-[20px]"><div className="skeleton-pulse w-[250px] h-[16px] rounded-[4px]" /></td>
                    <td className="py-[18px] px-[20px]"><div className="skeleton-pulse w-[80px] h-[16px] rounded-[4px]" /></td>
                  </tr>
                ))
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-[48px] px-[20px] text-center text-gray-500">
                    <div className="flex flex-col items-center gap-[12px]">
                      <Info size={32} className="text-gray-600" />
                      <p className="text-[0.85rem] m-0">No matching activity logs found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-[#23232a]/40 hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                    {/* Timestamp */}
                    <td className="py-[16px] px-[20px] text-gray-400 text-[0.8rem] whitespace-nowrap">
                      {fmtDateTime(activity.created_at)}
                    </td>
                    
                    {/* Performer */}
                    <td className="py-[16px] px-[20px]">
                      {activity.user ? (
                        <div
                          onClick={() => navigate(`/admin/users/${activity.user.id}/profile`)}
                          className="flex items-center gap-[10px] cursor-pointer group"
                        >
                          {activity.user.profile_photo ? (
                            <img
                              src={activity.user.profile_photo}
                              alt={activity.user.full_name}
                              className="w-[28px] h-[28px] rounded-full object-cover border border-[#23232a]"
                            />
                          ) : (
                            <div className="w-[28px] h-[28px] rounded-full bg-[#23232a] flex items-center justify-center text-[0.7rem] text-gray-300 font-bold">
                              {activity.user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || <User size={12} />}
                            </div>
                          )}
                          <div>
                            <p className="text-white text-[0.82rem] font-bold m-0 group-hover:text-[#70d64d] transition-colors leading-normal">
                              {activity.user.full_name}
                            </p>
                            <p className="text-gray-500 text-[0.72rem] m-0 leading-normal">
                              {activity.user.role}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-[0.8rem] font-medium italic">System</span>
                      )}
                    </td>

                    {/* Module / Action */}
                    <td className="py-[16px] px-[20px] whitespace-nowrap">
                      <div className="flex flex-col gap-[6px]">
                        <span className={`inline-flex items-center gap-[6px] px-[10px] py-[3px] rounded-full border text-[0.7rem] font-bold tracking-[0.2px] w-fit ${getBadgeStyle(activity.module, activity.action, activity.type)}`}>
                          {getModuleIcon(activity.module, activity.type)}
                          {activity.module?.toUpperCase() || 'SYSTEM'}
                        </span>
                        <span className="text-[0.75rem] font-mono text-gray-400 capitalize pl-[2px]">
                          {activity.action?.replace(/_/g, ' ') || 'action'}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-[16px] px-[20px] text-[0.82rem] text-gray-300 max-w-[320px] break-words">
                      {activity.description}
                    </td>

                    {/* Context / Details */}
                    <td className="py-[16px] px-[20px] text-[0.8rem]">
                      {activity.type === 'auth' ? (
                        <span className="text-gray-400 font-mono text-[0.75rem] bg-[#0c0c0e] px-[8px] py-[4px] border border-[#23232a] rounded-[4px]">
                          IP: {activity.ipAddress || 'unknown'}
                        </span>
                      ) : activity.project ? (
                        <div
                          onClick={() => navigate(`/admin/projects/${activity.project.id}`)}
                          className="flex items-center gap-[4px] text-[#70d64d] hover:text-white cursor-pointer transition-colors font-medium"
                        >
                          <span className="truncate max-w-[150px]">{activity.project.title}</span>
                          <ArrowUpRight size={12} className="shrink-0" />
                        </div>
                      ) : (activity.module === 'user' || activity.module === 'registration' || activity.entity_type === 'user' || activity.entity_type === 'gig_expert' || activity.entity_type === 'agency') && activity.entity_id ? (
                        <div
                          onClick={() => navigate(`/admin/users/${activity.entity_id}/profile`)}
                          className="flex items-center gap-[4px] text-[#70d64d] hover:text-white cursor-pointer transition-colors font-medium"
                        >
                          <span>View Profile</span>
                          <ArrowUpRight size={12} className="shrink-0" />
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-[16px] px-[20px] py-[16px] bg-[#0c0c0e] border-t border-[#23232a]">
            <div className="flex flex-wrap items-center gap-[16px]">
              <div className="text-gray-500 text-[0.78rem]">
                Showing <span className="text-white font-semibold">{((page - 1) * limit) + 1}</span> to{' '}
                <span className="text-white font-semibold">
                  {Math.min(page * limit, total)}
                </span>{' '}
                of <span className="text-white font-semibold">{total}</span> logs
              </div>
              
              <div className="flex items-center gap-[8px] text-gray-500 text-[0.78rem]">
                <span>Show:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="bg-[#121215] border border-[#23232a] text-white text-[0.78rem] rounded-[6px] px-[8px] py-[4px] outline-none cursor-pointer hover:border-gray-600 transition-all"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex gap-[8px]">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="bg-[#121215] border border-[#23232a] hover:border-gray-600 disabled:hover:border-[#23232a] text-white disabled:text-gray-600 p-[8px] rounded-[6px] transition-all disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex items-center gap-[4px]">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pNum = i + 1;
                    if (
                      pNum === 1 || 
                      pNum === totalPages || 
                      Math.abs(pNum - page) <= 1
                    ) {
                      return (
                        <button
                          key={pNum}
                          onClick={() => handlePageChange(pNum)}
                          className={`w-[32px] h-[32px] rounded-[6px] text-[0.8rem] font-bold transition-all border ${
                            page === pNum
                              ? 'bg-[#70d64d] text-[#0c0c0e] border-[#70d64d]'
                              : 'bg-[#121215] border-[#23232a] text-gray-400 hover:text-white'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    } else if (
                      (pNum === 2 && page > 3) || 
                      (pNum === totalPages - 1 && page < totalPages - 2)
                    ) {
                      return <span key={pNum} className="text-gray-600 px-[4px]">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="bg-[#121215] border border-[#23232a] hover:border-gray-600 disabled:hover:border-[#23232a] text-white disabled:text-gray-600 p-[8px] rounded-[6px] transition-all disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

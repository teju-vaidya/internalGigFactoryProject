import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users, Building2, FileText, Clock, Search, RefreshCw, Filter,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../utils/api';
import { Pagination, PageSizeSelector } from '../../components/AdminShared';

// Import subcomponents
import { RegistrationRequestsTable } from '../../components/Admin/RegistrationRequestsTable';
import { RegistrationRequestDetailModal } from '../../components/Admin/RegistrationRequestDetailModal';
import { RegistrationRequestRejectModal } from '../../components/Admin/RegistrationRequestRejectModal';


export default function RegistrationRequests() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [search,       setSearch]       = useState('');
  const [dSearch,      setDSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('requests_status_filter') || 'all');
  const [roleFilter,   setRoleFilter]   = useState(() => localStorage.getItem('requests_role_filter') || 'all');
  const [sortBy,       setSortBy]       = useState(() => localStorage.getItem('requests_sort_by') || 'newest');
  const [page,         setPage]         = useState(1);
  const [limit,        setLimit]        = useState(() => Number(localStorage.getItem('admin_requests_limit')) || 10);
  const [selectedReq,  setSelectedReq]  = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    localStorage.setItem('requests_status_filter', statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    localStorage.setItem('requests_role_filter', roleFilter);
  }, [roleFilter]);

  useEffect(() => {
    localStorage.setItem('requests_sort_by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('admin_requests_limit', limit);
  }, [limit]);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [dSearch, statusFilter, roleFilter, sortBy, limit]);
  
  const { data: allRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-registration-requests'],
    queryFn:  () => api.get('/auth/registration-requests').then(r => r.requests || []),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reqId = params.get('id');
    if (reqId && allRequests.length > 0) {
      const match = allRequests.find(r => r.id === reqId || String(r.id) === String(reqId));
      if (match) {
        setSelectedReq(match);
      }
    }
  }, [location.search, allRequests]);

  const { data: historyData = null, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['reg-request-history', selectedReq?.id],
    queryFn: () => api.get(`/auth/registration-requests/${selectedReq.id}/history`),
    enabled: !!selectedReq?.id,
  });

  const [reviewParams, setReviewParams] = useState(null);
  const reviewQuery = useQuery({
    queryKey: ['reg-review', reviewParams],
    queryFn: () => api.post(`/auth/registration-requests/${reviewParams.id}/review`, {
      status: reviewParams.status,
      rejectionReason: reviewParams.rejectionReason,
      canReapplyAt: reviewParams.canReapplyAt,
    }),
    enabled: !!reviewParams,
    retry: false, staleTime: 0, gcTime: 0,
  });

  useEffect(() => {
    if (reviewQuery.data) {
      toast.success('Application decision saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-registration-requests'] });
      setSelectedReq(null); setRejectTarget(null); setReviewParams(null);
      if (new URLSearchParams(location.search).has('id')) {
        navigate('/admin/requests', { replace: true });
      }
    }
  }, [reviewQuery.data, queryClient, location.search, navigate]);

  useEffect(() => {
    if (reviewQuery.error) { toast.error(reviewQuery.error.message || 'Operation failed.'); setReviewParams(null); }
  }, [reviewQuery.error]);

  const handleApprove       = (id)         => setReviewParams({ id, status: 'approved' });
  const handleOpenReject    = (req)        => setRejectTarget(req);
  const handleConfirmReject = (id, reason) => setReviewParams({ id, status: 'rejected', rejectionReason: reason });
  const handleUpdateDecision = (id, p)    => setReviewParams({ id, ...p });
  
  // client-side filter + sort + paginate
  const sorted = useMemo(() => {
    let arr = [...allRequests].filter(r => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchRole   = roleFilter   === 'all' || r.role   === roleFilter;
      const q = dSearch.toLowerCase();
      const matchSearch = !q || r.full_name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.mobile?.includes(q);
      return matchStatus && matchRole && matchSearch;
    });
    if (sortBy === 'newest')    arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    else if (sortBy === 'oldest')    arr.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    else if (sortBy === 'name') arr.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    return arr;
  }, [allRequests, statusFilter, roleFilter, dSearch, sortBy]);
  const totalPages = Math.ceil(sorted.length / limit);
  const pageItems  = sorted.slice((page - 1) * limit, page * limit);

  const stats = useMemo(() => ({
    total:    allRequests.length,
    pending:  allRequests.filter(r => r.status === 'pending').length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
  }), [allRequests]);

  const filterBtnClass = "bg-[#0c0c0e] border border-[#23232a] text-gray-500 rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer transition-all duration-100";
  const filterBtnActiveClass = "bg-[#70d64d] text-black border-[#70d64d] font-bold";
  const selectClass = "bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[12px] py-[7px] text-[0.8rem] outline-none cursor-pointer";

  return (
    <div className="flex flex-col gap-[24px]">

      {/* Stat cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[16px]">
        {[
          { label: 'Total Requests', value: stats.total,    Icon: FileText,  accent: false },
          { label: 'Pending Review', value: stats.pending,  Icon: Clock,     accent: true  },
          { label: 'Approved',       value: stats.approved, Icon: Users,     accent: false },
          { label: 'Rejected',       value: stats.rejected, Icon: Building2, accent: false },
        ].map(({ label, value, Icon, accent }) => (
          <div 
            key={label} 
            className={`border rounded-[8px] px-[20px] py-[18px] ${
              accent 
                ? 'bg-gradient-to-br from-[#121215] to-[#162203] border-[#374f05]' 
                : 'bg-[#121215] border-[#23232a]'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-[0.68rem] font-bold tracking-[0.5px] uppercase">{label}</span>
              <Icon size={16} color={accent ? '#70d64d' : '#6b7280'} />
            </div>
            <div className="text-[2rem] font-extrabold text-white mt-[6px]">
              {isLoading ? <span className="skeleton-pulse inline-block w-[40px] h-[28px] rounded-[4px] align-middle" /> : value}
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[24px]">
        {/* Controls */}
        <div className="flex justify-between items-start mb-[20px] flex-wrap gap-[12px]">
          {/* Left: search */}
          <div className="relative flex items-center flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-[12px] text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-[#23232a] rounded-[6px] text-white text-[0.85rem] pl-[36px] pr-[12px] py-[8px] outline-none"
            />
          </div>

          {/* Right: filters */}
          <div className="flex gap-[8px] flex-wrap items-center">
            {/* Status filter pills */}
            <div className="flex gap-[5px] items-center">
              <Filter size={12} color="#6b7280" />
              {['all', 'pending', 'approved', 'not selected'].map(s => (
                <button 
                  key={s} 
                  onClick={() => setStatusFilter(s)} 
                  className={`${filterBtnClass} ${statusFilter === s ? filterBtnActiveClass : ''}`}
                >
                  {s === 'rejected' ? 'Not Selected' : (s.charAt(0).toUpperCase() + s.slice(1))}
                </button>
              ))}
            </div>
            {/* Role filter */}
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectClass}>
              <option value="all">All Roles</option>
              <option value="gig_expert">Gig Expert</option>
              <option value="agency">Agency</option>
            </select>
            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectClass}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
            </select>
            <button onClick={() => refetch()} className={`${filterBtnClass} flex items-center gap-[5px]`}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <RegistrationRequestsTable
          pageItems={pageItems}
          isLoading={isLoading}
          onSelectReq={setSelectedReq}
          onApprove={handleApprove}
          onReject={handleOpenReject}
          reviewQueryFetching={reviewQuery.isFetching}
        />

        {/* Footer: count + pagination */}
        <div className="mt-[20px] flex justify-between items-center flex-wrap gap-[12px]">
          <span className="text-gray-500 text-[0.8rem]">
            Showing {Math.min((page - 1) * limit + 1, sorted.length)}–{Math.min(page * limit, sorted.length)} of {sorted.length} results
          </span>

          <PageSizeSelector limit={limit} onChangeLimit={setLimit} total={sorted.length} isLoading={isLoading} />

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReq && (
        <RegistrationRequestDetailModal
          request={selectedReq} historyData={historyData} isLoadingHistory={isLoadingHistory}
          onClose={() => {
            setSelectedReq(null);
            if (new URLSearchParams(location.search).has('id')) {
              navigate('/admin/requests', { replace: true });
            }
          }} onApprove={handleApprove} onReject={handleOpenReject}
          onUpdateDecision={handleUpdateDecision} isPending={reviewQuery.isFetching}
        />
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RegistrationRequestRejectModal
          request={rejectTarget} onClose={() => setRejectTarget(null)}
          onConfirm={handleConfirmReject} isPending={reviewQuery.isFetching}
        />
      )}
    </div>
  );
}

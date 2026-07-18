import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Filter, SortAsc, LayoutGrid, LayoutList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { Pagination, PageSizeSelector } from '../../components/AdminShared';

// Import subcomponents
import { GigExpertTable } from '../../components/Admin/GigExpertTable';
import { GigExpertCard } from '../../components/Admin/GigExpertCard';

export default function AdminGigExperts() {
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState(() => localStorage.getItem('gig_expert_status_filter') || '');
  const [sort, setSort]       = useState(() => localStorage.getItem('gig_expert_sort') || 'newest');
  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(() => Number(localStorage.getItem('admin_gig_experts_limit')) || 10);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('admin_view_mode') || 'list');
  const navigate = useNavigate();

  // debounce search
  const [dSearch, setDSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    localStorage.setItem('gig_expert_status_filter', status);
  }, [status]);

  useEffect(() => {
    localStorage.setItem('gig_expert_sort', sort);
  }, [sort]);

  useEffect(() => {
    localStorage.setItem('admin_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('admin_gig_experts_limit', limit);
  }, [limit]);

  useEffect(() => { setPage(1); }, [dSearch, status, sort, limit]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-gigExperts', page, limit, dSearch, status, sort],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit, sort });
      if (dSearch) params.set('search', dSearch);
      if (status)  params.set('status', status);
      return api.get(`/profiles/admin/gigExperts?${params}`);
    },
    keepPreviousData: true,
  });

  const gigExperts = data?.gigExperts || [];
  const total       = data?.total        || 0;
  const totalPages  = data?.totalPages   || 1;

  const filterBtnClass = "bg-[#0c0c0e] border border-[#23232a] text-gray-500 rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer transition-colors duration-100";
  const filterBtnActiveClass = "bg-[#70d64d] text-black border-[#70d64d] font-bold";
  const selectClass = "bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[12px] py-[7px] text-[0.8rem] outline-none cursor-pointer";

  return (
    <div className="flex flex-col gap-[20px]">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-[12px]">
        <div>
          <h2 className="text-white font-extrabold text-[1.4rem] m-0">Gig Experts</h2>
          <p className="text-gray-500 text-[0.82rem] m-0 mt-[4px]">
            {isLoading ? 'Loading…' : `${total} gig experts registered on the platform`}
          </p>
        </div>
        <button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          className={`${filterBtnClass} flex items-center gap-[6px] ${isFetching ? 'opacity-50' : 'opacity-100'}`}
        >
          <RefreshCw size={13} className={isFetching ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-[10px] flex-wrap items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by skills, expertises, bio, name, email, or mobile…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-[#23232a] rounded-[6px] text-white text-[0.85rem] pl-[36px] pr-[12px] py-[9px] outline-none box-border"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-[5px] items-center flex-wrap">
          <Filter size={12} color="#6b7280" />
          {[['', 'All'], ['approved', 'Approved'], ['inactive', 'Inactive'], ['suspended', 'Suspended']].map(([v, l]) => (
            <button 
              key={v} 
              onClick={() => setStatus(v)} 
              className={`${filterBtnClass} ${status === v ? filterBtnActiveClass : ''}`}
            >
              {l}
            </button>
          ))}
        </div>
        {/* Sort */}
        <div className="flex items-center gap-[6px]">
          <SortAsc size={13} color="#6b7280" />
          <select value={sort} onChange={e => setSort(e.target.value)} className={selectClass}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name A→Z</option>
            <option value="name_desc">Name Z→A</option>
          </select>
        </div>
        {/* Layout Toggle */}
        <div className="flex border border-[#23232a] rounded-[6px] overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`border-none px-[10px] py-[7px] cursor-pointer flex items-center justify-center transition-colors duration-200 ${
              viewMode === 'list' ? 'bg-[#70d64d] text-black' : 'bg-[#0c0c0e] text-[#8a8a8a]'
            }`}
            title="List View"
          >
            <LayoutList size={16} />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`border-none px-[10px] py-[7px] cursor-pointer flex items-center justify-center transition-colors duration-200 ${
              viewMode === 'card' ? 'bg-[#70d64d] text-black' : 'bg-[#0c0c0e] text-[#8a8a8a]'
            }`}
            title="Card View"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'list' ? (
        <GigExpertTable
          gigExperts={gigExperts}
          isLoading={isLoading}
          onSelectGigExpert={(gigExpert) => navigate(`/admin/users/${gigExpert.id}/profile?from=GigExperts+Listing`)}
          status={status}
          searchQuery={dSearch}
        />
      ) : (
        <GigExpertCard
          gigExperts={gigExperts}
          isLoading={isLoading}
          onSelectGigExpert={(gigExpert) => navigate(`/admin/users/${gigExpert.id}/profile?from=GigExperts+Listing`)}
          status={status}
          searchQuery={dSearch}
        />
      )}

      {/* Common Pagination Footer */}
      <div className="bg-[#121215] border border-[#23232a] rounded-[10px] px-[24px] py-[16px] flex justify-between items-center flex-wrap gap-[12px]">
        <span className="text-gray-500 text-[0.8rem]">
          {isLoading ? '…' : `Page ${page} of ${totalPages} · ${total} total`}
        </span>

        <PageSizeSelector limit={limit} onChangeLimit={setLimit} total={total} isLoading={isLoading} />

        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

    </div>
  );
}

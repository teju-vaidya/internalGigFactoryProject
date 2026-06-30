import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Briefcase, Filter, SortAsc, RefreshCw, Check, 
  FileText, Clock, XCircle, ArrowRight, ClipboardList
} from 'lucide-react';
import { api } from '../../utils/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Pagination, PageSizeSelector } from '../../components/AdminShared';

export default function MyApplications() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user) || {};
  const userRole = user.role || 'gig_expert';

  // Search, Filter & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [dSearch, setDSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => Number(localStorage.getItem('my_applications_limit')) || 10);

  // Debounce search term (400ms for responsiveness)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Persist limit in localStorage
  useEffect(() => {
    localStorage.setItem('my_applications_limit', limit);
  }, [limit]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [dSearch, statusFilter, sortBy, limit]);

  // Fetch applications from dashboard endpoint
  const { data: dashboardData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['my-applications-list'],
    queryFn: () => api.get('/projects/my-projects'),
    keepPreviousData: true,
  });

  const rawApplications = dashboardData?.applications || [];

  // Calculate high-level stats from all applications
  const stats = useMemo(() => {
    const total = rawApplications.length;
    const pending = rawApplications.filter(app => 
      ['applied', 'pending', 'reviewed', 'shortlisted'].includes(app.status?.toLowerCase())
    ).length;
    const approved = rawApplications.filter(app => 
      app.status?.toLowerCase() === 'accepted'
    ).length;
    const rejected = rawApplications.filter(app => 
      app.status?.toLowerCase() === 'rejected'
    ).length;

    return { total, pending, approved, rejected };
  }, [rawApplications]);

  // Filter & Sort list client-side
  const processedApplications = useMemo(() => {
    let list = [...rawApplications];

    // 1. Search Filter
    if (dSearch.trim()) {
      const query = dSearch.toLowerCase();
      list = list.filter(app => 
        app.project?.title?.toLowerCase().includes(query) ||
        app.project?.description?.toLowerCase().includes(query) ||
        app.project?.project_code?.toLowerCase().includes(query)
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        list = list.filter(app => 
          ['applied', 'pending', 'reviewed', 'shortlisted'].includes(app.status?.toLowerCase())
        );
      } else {
        list = list.filter(app => app.status?.toLowerCase() === statusFilter);
      }
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.applied_at) - new Date(a.applied_at);
      }
      if (sortBy === 'oldest') {
        return new Date(a.applied_at) - new Date(b.applied_at);
      }
      if (sortBy === 'budget_desc') {
        const budgetA = Number(a.project?.budget || 0);
        const budgetB = Number(b.project?.budget || 0);
        return budgetB - budgetA;
      }
      if (sortBy === 'budget_asc') {
        const budgetA = Number(a.project?.budget || 0);
        const budgetB = Number(b.project?.budget || 0);
        return budgetA - budgetB;
      }
      return 0;
    });

    return list;
  }, [rawApplications, dSearch, statusFilter, sortBy]);

  // Paginated subset
  const total = processedApplications.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedApplications = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return processedApplications.slice(startIndex, startIndex + limit);
  }, [processedApplications, page, limit]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="mx-auto flex flex-col gap-6">
      
      {/* Header Row */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-white font-extrabold text-[1.6rem] m-0">My Applications</h2>
          <p className="text-gray-500 text-[0.85rem] m-0">
            Track and manage all your {userRole === 'agency' ? "agency's" : "gig expert's"} project proposals
          </p>
        </div>
        
        <div className="flex items-center gap-[10px]">
          <button 
            onClick={() => refetch()} 
            disabled={isFetching} 
            className="bg-[#0c0c0e] border border-[#23232a] text-gray-500 rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer transition-colors duration-100 flex items-center gap-[6px] hover:text-white hover:border-white/10 disabled:opacity-50"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {/* Metrics Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric card 1: Total */}
        <div className="bg-[#121215] border border-[#23232a] p-5 rounded-[8px] flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-center text-[#8a8a8a] text-[0.7rem] font-bold tracking-wider uppercase">
            <span>Total Applications</span>
            <div className="w-7 h-7 bg-[#1c1c22] rounded-full flex items-center justify-center text-gray-400 border border-[#23232a]">
              <ClipboardList size={13} />
            </div>
          </div>
          <span className="text-[2.2rem] font-extrabold text-white leading-none mt-2">{stats.total}</span>
        </div>

        {/* Metric card 2: Pending */}
        <div className="bg-[#121215] border border-[#23232a] p-5 rounded-[8px] flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-center text-[#8a8a8a] text-[0.7rem] font-bold tracking-wider uppercase">
            <span>Pending</span>
            <div className="w-7 h-7 bg-[#1c1c22] rounded-full flex items-center justify-center text-amber-500/80 border border-[#23232a]">
              <Clock size={13} />
            </div>
          </div>
          <span className="text-[2.2rem] font-extrabold text-white leading-none mt-2">{stats.pending}</span>
        </div>

        {/* Metric card 3: Approved/Selected */}
        <div className="bg-[#121215] border border-[#23232a] p-5 rounded-[8px] flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-center text-[#8a8a8a] text-[0.7rem] font-bold tracking-wider uppercase">
            <span>Approved</span>
            <div className="w-7 h-7 bg-[#1c1c22] rounded-full flex items-center justify-center text-[#70d64d] border border-[#23232a]">
              <Check size={13} />
            </div>
          </div>
          <span className="text-[2.2rem] font-extrabold text-white leading-none mt-2">{stats.approved}</span>
        </div>

        {/* Metric card 4: Rejected */}
        <div className="bg-[#121215] border border-[#23232a] p-5 rounded-[8px] flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-center text-[#8a8a8a] text-[0.7rem] font-bold tracking-wider uppercase">
            <span>Not Selected</span>
            <div className="w-7 h-7 bg-[#1c1c22] rounded-full flex items-center justify-center text-red-500/80 border border-[#23232a]">
              <XCircle size={13} />
            </div>
          </div>
          <span className="text-[2.2rem] font-extrabold text-white leading-none mt-2">{stats.rejected}</span>
        </div>
      </section>

      {/* Filter and Search Bar Row */}
      <section className="flex gap-[10px] flex-wrap items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] w-full">
          <Search size={14} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search proposals by title, description or code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] text-[0.85rem] pl-[36px] pr-[12px] py-[9px] outline-none box-border focus:border-[#70d64d] focus:ring-1 focus:ring-[#70d64d]/10 transition-all duration-200"
          />
        </div>
        
        {/* Status Dropdown */}
        <div className="flex items-center gap-[6px] w-full min-[500px]:w-auto justify-between min-[500px]:justify-start">
          <span className="text-[#8a8a8a] text-[0.8rem] flex items-center gap-[4px] shrink-0">
            <Filter size={12} color="#6b7280" />
            Status:
          </span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[12px] py-[7px] text-[0.8rem] outline-none cursor-pointer focus:border-[#70d64d] transition-all flex-1 min-[500px]:flex-initial text-right min-[500px]:text-left"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending / Applied</option>
            <option value="accepted">Selected / Approved</option>
            <option value="rejected">Not Selected</option>
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-[6px] w-full min-[500px]:w-auto justify-between min-[500px]:justify-start">
          <span className="text-[#8a8a8a] text-[0.8rem] flex items-center gap-[4px] shrink-0">
            <SortAsc size={12} color="#6b7280" />
            Sort By:
          </span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[12px] py-[7px] text-[0.8rem] outline-none cursor-pointer focus:border-[#70d64d] transition-all flex-1 min-[500px]:flex-initial text-right min-[500px]:text-left"
          >
            <option value="newest">Applied: Newest First</option>
            <option value="oldest">Applied: Oldest First</option>
            <option value="budget_desc">Budget: High to Low</option>
            <option value="budget_asc">Budget: Low to High</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || statusFilter !== 'all' || sortBy !== 'newest') && (
          <button
            onClick={handleClearFilters}
            className="bg-[#0c0c0e] border border-[#ef444433] text-[#ef4444] rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer transition-colors duration-100 hover:bg-[#ef444411] w-full min-[500px]:w-auto text-center"
          >
            Clear Filters
          </button>
        )}
      </section>

      {/* Main List Area */}
      <main className="space-y-3">
        {isLoading ? (
          // Loading Skeleton Cards
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#121215] border border-[#23232a] rounded-[8px] p-5 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-11 h-11 bg-[#0c0c0e] rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="w-1/3 h-4 bg-[#0c0c0e] rounded" />
                    <div className="w-1/4 h-3 bg-[#0c0c0e] rounded" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-[#0c0c0e] rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-[#121215] border border-[#23232a] rounded-[8px] p-10 text-center">
            <p className="text-red-500 font-semibold text-sm">Failed to load applications. Please try again later.</p>
          </div>
        ) : paginatedApplications.length === 0 ? (
          // Empty State
          <div className="bg-[#121215] border border-[#23232a] rounded-[8px] p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#0c0c0e] border border-[#23232a] rounded-full flex items-center justify-center text-gray-500 mb-4">
              <Briefcase size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Applications Found</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-5 leading-relaxed">
              {rawApplications.length === 0 
                ? "You haven't applied for any projects yet. Check out open opportunities."
                : "No matching proposals were found with the current search or filters."}
            </p>
            {rawApplications.length === 0 ? (
              <button 
                onClick={() => navigate('/projects')}
                className="bg-[#70d64d] hover:bg-[#8ee67b] text-black font-bold px-[18px] py-[8px] rounded-[6px] text-xs transition-all duration-150 flex items-center gap-1.5"
              >
                Browse Open Projects <ArrowRight size={13} />
              </button>
            ) : (
              <button 
                onClick={handleClearFilters}
                className="bg-transparent border border-[#70d64d] text-[#70d64d] hover:bg-[#70d64d]/5 px-[14px] py-[7px] rounded-[6px] text-xs font-semibold transition-all duration-150"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          // Premium Stretched Row Cards
          <div className="space-y-3">
            {paginatedApplications.map((app) => {
              const project = app.project || {};
              
              // Get the first letter of the project title
              const firstLetter = project.title ? project.title.trim().charAt(0).toUpperCase() : 'P';
              
              // Format applied date
              const appliedDate = app.applied_at
                ? new Date(app.applied_at).toLocaleDateString('en-CA') // YYYY-MM-DD format
                : 'N/A';

              // Format budget
              const formattedBudget = project.budget
                ? `₹${Number(project.budget).toLocaleString('en-IN')}`
                : 'Undisclosed';

              // Map status to badges
              const statusLower = app.status?.toLowerCase();
              let badgeText = 'PENDING';
              let badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

              if (statusLower === 'accepted') {
                badgeText = 'SELECTED';
                badgeClass = 'bg-[#70d64d]/10 text-[#70d64d] border border-[#70d64d]/20';
              } else if (statusLower === 'rejected') {
                badgeText = 'NOT SELECTED';
                badgeClass = 'bg-red-500/10 text-red-400 border border-red-500/20';
              }

              return (
                <div 
                  key={app.id} 
                  className="bg-[#121215] border border-[#23232a] rounded-[8px] p-5 flex items-center justify-between hover:border-[#70d64d]/60 hover:shadow-[0_4px_15px_rgba(112,214,77,0.05)] transition-all duration-150 cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Circle Avatar */}
                    <div className="w-11 h-11 bg-[#1c1c22] border border-[#23232a] rounded-full flex items-center justify-center text-white text-md font-bold shrink-0">
                      {firstLetter}
                    </div>
                    
                    {/* Project and Application Details */}
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-white text-[0.95rem] font-bold truncate hover:text-[#70d64d] transition-colors duration-100">
                        {project.title || 'Untitled Project'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-500 text-[0.78rem]">
                        <span className="font-semibold uppercase tracking-wider text-[0.7rem] text-gray-400">
                          Budget: <span className="text-white normal-case font-bold">{formattedBudget}</span>
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#23232a]" />
                        <span className="font-semibold uppercase tracking-wider text-[0.7rem] text-gray-400">
                          Applied: <span className="text-white normal-case font-bold">{appliedDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="ml-4 shrink-0">
                    <span className={`text-[0.65rem] font-extrabold px-3 py-1.5 rounded-[4px] tracking-wider uppercase ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Pagination Footer */}
      {!isLoading && !error && total > 0 && (
        <div className="bg-[#121215] border border-[#23232a] rounded-[8px] px-5 py-4 flex justify-between items-center flex-wrap gap-3">
          <span className="text-gray-500 text-[0.8rem]">
            {isLoading ? '…' : `Page ${page} of ${totalPages} · ${total} total`}
          </span>

          <PageSizeSelector limit={limit} onChangeLimit={setLimit} total={total} isLoading={isLoading} />

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      )}

    </div>
  );
}

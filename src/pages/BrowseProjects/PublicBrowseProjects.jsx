import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, ArrowRight, Filter, SortAsc, RefreshCw, Share2, Check, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { ShareButton } from 'react-share-utilities';
import { api } from '../../utils/api';
import { Pagination, PageSizeSelector } from '../../components/AdminShared';
import { useMetaTags } from '../../hooks/useMetaTags';
import { stripHtml } from '../../utils/text';

const renderWithTbdTooltip = (val, tooltipText) => {
  if (val === 'TBD') {
    return (
      <span className="relative group inline-block">
        <span className="underline decoration-dotted decoration-gray-500 cursor-help text-[#a1a1aa] font-semibold">{val}</span>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-[9999]">
          <span className="bg-[#18181b] border border-[#2d2d30] text-gray-200 text-[10.5px] font-semibold px-2 py-1 rounded-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] whitespace-nowrap">
            {tooltipText}
          </span>
          <span className="w-1.5 h-1.5 bg-[#18181b] border-r border-b border-[#2d2d30] rotate-45 -mt-1" />
        </span>
      </span>
    );
  }
  return val;
};

export default function PublicBrowseProjects() {
  const navigate = useNavigate();

  // Search & Filter & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [dSearch, setDSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => Number(localStorage.getItem('public_projects_limit')) || 10);

  // Debounce search term (750ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDSearch(searchTerm);
    }, 750);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Persist limit in localStorage
  useEffect(() => {
    localStorage.setItem('public_projects_limit', limit);
  }, [limit]);

  // Reset page to 1 when search query, category, sorting, or limit changes
  useEffect(() => {
    setPage(1);
  }, [dSearch, selectedCategory, sortBy, limit]);

  // Fetch backend public projects with pagination, sorting, search, category
  const { data: projectsData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['public-browse-projects', page, limit, dSearch, selectedCategory, sortBy],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit, sort: sortBy });
      if (dSearch) {
        params.set('search', dSearch);
      }
      if (selectedCategory) {
        params.set('category', selectedCategory);
      }
      return api.get(`/projects/public?${params}`);
    },
    keepPreviousData: true,
  });

  // Fetch dynamic categories suggestions list from metadata
  const { data: categoriesData } = useQuery({
    queryKey: ['public-projects-categories'],
    queryFn: () => api.get('/projects/public-meta/categories').catch(() => ({ categories: [] })),
  });

  const projects = projectsData?.projects || [];
  const total = projectsData?.total || 0;
  const totalPages = projectsData?.totalPages || 1;
  const categoriesList = categoriesData?.categories || [];

  // Generate ItemList JSON-LD Schema for search engines and LLM context extraction
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": projects.length,
    "itemListElement": projects.map((proj, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `${window.location.origin}/public-projects/${proj.id}`,
      "name": proj.title,
      "description": proj.description ? stripHtml(proj.description).substring(0, 150) + "..." : "Open project opportunity on GigFactory"
    }))
  };

  useMetaTags({
    title: "Open Opportunities & Gigs | GigFactory",
    description: "Explore open project specifications and freelance opportunities on GigFactory. Find client-sponsored developer, design, marketing, and engineering gigs.",
    keywords: "freelance jobs, developer gigs, design contracts, remote client projects, GigFactory opportunities, gig search engine",
    jsonLd: projects.length > 0 ? itemListSchema : null
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('newest');
  };

  const handleApplyRedirect = (projectId, e) => {
    e.stopPropagation();
    navigate(`/?redirect=/projects/${projectId}`);
  };

  return (
    <div className="mx-auto flex flex-col gap-6">
      
      {/* Header Block */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-white font-extrabold text-[1.6rem] m-0">Open Opportunities</h1>
          <p className="text-gray-500 text-[0.85rem] m-0">Discover projects and apply to start collaborating with GigFactory clients.</p>
        </div>
        
        <div className="flex items-center gap-[10px]">
          <button 
            onClick={() => refetch()} 
            disabled={isFetching} 
            className="bg-[#0c0c0e] border border-[#23232a] text-gray-400 rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer transition-colors duration-100 flex items-center gap-[6px] hover:text-white hover:border-white/10 disabled:opacity-50"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {/* Filter Controls Row */}
      <section className="flex gap-[10px] flex-wrap items-center">
        {/* Debounced Search */}
        <div className="relative flex-1 min-w-[240px] w-full">
          <Search size={14} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by title, description, skills..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] text-[0.85rem] pl-[36px] pr-[12px] py-[9px] outline-none box-border focus:border-[#70d64d] focus:ring-1 focus:ring-[#70d64d]/10 transition-all duration-200"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center gap-[6px] w-full min-[500px]:w-auto justify-between min-[500px]:justify-start">
          <span className="text-[#8a8a8a] text-[0.8rem] flex items-center gap-[4px] shrink-0">
            <Filter size={12} color="#6b7280" />
            Category:
          </span>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[12px] py-[7px] text-[0.8rem] outline-none cursor-pointer focus:border-[#70d64d] transition-all flex-1 min-[500px]:flex-initial text-right min-[500px]:text-left"
          >
            <option value="">All Categories</option>
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Sort By Filter */}
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
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="budget_desc">Budget: High to Low</option>
            <option value="budget_asc">Budget: Low to High</option>
            <option value="end_date_asc">Deadline: Closest</option>
            <option value="end_date_desc">Deadline: Furthest</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(searchTerm || selectedCategory || sortBy !== 'newest') && (
          <button
            onClick={handleClearFilters}
            className="bg-[#0c0c0e] border border-[#ef444433] text-[#ef4444] rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer transition-colors duration-100 hover:bg-[#ef444411] w-full min-[500px]:w-auto text-center"
          >
            Clear Filters
          </button>
        )}
      </section>

      {/* Projects Listing Area */}
      <main className="space-y-4">
        {isLoading ? (
          // Loading Skeletons
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#121215] border border-[#23232a] rounded-[10px] p-6 space-y-4 animate-pulse">
                <div className="w-1/3 h-5 bg-[#0c0c0e] rounded-[4px]" />
                <div className="w-full h-12 bg-[#0c0c0e] rounded-[6px]" />
                <div className="w-2/3 h-4 bg-[#0c0c0e] rounded-[4px]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-12 text-center">
            <p className="text-red-500 font-semibold text-sm">Failed to fetch open projects. Please check your connection.</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#0c0c0e] border border-[#23232a] rounded-full flex items-center justify-center text-gray-500 mb-4">
              <Briefcase size={28} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Projects Found</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-5 leading-relaxed">We couldn't find any public open projects matching your search criteria.</p>
            <button 
              onClick={handleClearFilters}
              className="bg-transparent border border-[#70d64d] text-[#70d64d] hover:bg-[#70d64d]/5 px-[14px] py-[7px] rounded-[6px] text-xs font-semibold transition-all duration-200"
            >
              Clear Search & Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const skillsList = project.project_skills || [];
              const tagsList = project.project_tags || [];
              
              const formattedBudget = project.budget 
                ? `₹${Number(project.budget).toLocaleString('en-IN')}` 
                : 'Undisclosed';

              const formattedStartDate = project.start_date 
                ? new Date(project.start_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'TBD';

              const formattedHours = project.estimated_hours 
                ? `${Number(project.estimated_hours)} hrs` 
                : 'TBD';

              const formattedDeadline = project.end_date 
                ? new Date(project.end_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'TBD';

              return (
                <article 
                  key={project.id} 
                  className="bg-[#121215] border border-[#23232a] rounded-[10px] p-6 hover:border-[#70d64d] hover:shadow-[0_4px_20px_rgba(112,214,77,0.08)] hover:-translate-y-[2px] transition-all duration-200 flex flex-col relative"
                >
                  {/* Header Row */}
                  <header className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3 min-w-0 w-full">
                    <div className="space-y-1.5 min-w-0 flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0">
                        <h2 
                          className="text-lg font-bold text-white cursor-pointer hover:text-[#70d64d] transition-all duration-150 break-words line-clamp-2"
                          onClick={() => navigate(`/public-projects/${project.id}`)}
                        >
                          {project.title}
                        </h2>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[0.62rem] font-bold px-[6px] py-[2px] rounded-[4px] uppercase ${project.priority === 'high' ? 'bg-red-500/10 text-red-400' : project.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
                            {project.priority || 'medium'}
                          </span>

                          <span className="text-[0.62rem] font-bold px-[6px] py-[2px] rounded-[4px] uppercase bg-blue-500/10 text-blue-400">
                            {project.project_type || 'fixed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {project.category && (
                      <div className="bg-[#0c0c0e] text-[#a1a1aa] border border-[#23232a] text-[10px] uppercase font-extrabold tracking-widest px-3 py-1.5 rounded-[4px] shrink-0 h-fit w-fit">
                        {project.category}
                      </div>
                    )}
                  </header>

                  {/* Description Paragraph */}
                  <p className="text-[#a1a1aa] text-[0.85rem] leading-relaxed mb-4 break-words">
                    {stripHtml(project.description) || 'No detailed description provided for this project.'}
                  </p>

                  {/* Skill and Deliverable Tags Lists */}
                  <div className="flex flex-col gap-3 mb-4">
                    {skillsList.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Required Skills:</span>
                        {skillsList.map((skill, index) => (
                          <span 
                            key={index} 
                            className="bg-[#0c0c0e] border border-[#23232a] text-gray-300 text-xs px-2.5 py-1 rounded-[4px]"
                          >
                            {skill.skill_name}
                          </span>
                        ))}
                      </div>
                    )}

                    {tagsList.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Deliverables:</span>
                        {tagsList.map((tag, index) => (
                          <span 
                            key={index} 
                            className="bg-transparent border border-dashed border-[#23232a] text-gray-400 text-xs px-2.5 py-1 rounded-[4px]"
                          >
                            {tag.tag_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Horizontal Details Panel */}
                  <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[6px] p-4 grid grid-cols-1 min-[375px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 w-full">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#121215] border border-[#23232a] rounded-[6px] flex items-center justify-center text-md shrink-0">💰</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase truncate">BUDGET</span>
                        <span className="text-[0.85rem] font-bold text-white truncate">{formattedBudget}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#121215] border border-[#23232a] rounded-[6px] flex items-center justify-center text-md shrink-0">📅</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase truncate">START DATE</span>
                        <span className="text-[0.85rem] font-bold text-white">
                          {renderWithTbdTooltip(formattedStartDate, "To Be Decided / Determined by client")}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#121215] border border-[#23232a] rounded-[6px] flex items-center justify-center text-md shrink-0">⏱️</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase truncate">EST. HOURS</span>
                        <span className="text-[0.85rem] font-bold text-white">
                          {renderWithTbdTooltip(formattedHours, "To Be Determined based on requirements")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#121215] border border-[#23232a] rounded-[6px] flex items-center justify-center text-md shrink-0">📅</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase truncate">DEADLINE</span>
                        <span className="text-[0.85rem] font-bold text-white">
                          {renderWithTbdTooltip(formattedDeadline, "To Be Decided / Finalized by client")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-[#121215] border border-[#23232a] rounded-[6px] flex items-center justify-center text-md shrink-0">🏆</div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase truncate">Milestones</span>
                        <span className="text-[0.85rem] font-bold text-white truncate">{project.milestones?.length || project.total_milestones || 0} Stages</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Row */}
                  <footer className="flex justify-end items-center gap-3">
                    <span onClick={(e) => e.stopPropagation()}>
                      <ShareButton
                        variant="custom"
                        className="bg-[#0c0c0e] hover:bg-[#1a1a22] border border-[#23232a] text-white p-[8px] rounded-[6px] text-[0.78rem] font-semibold transition-colors duration-150 flex items-center justify-center cursor-pointer"
                        data={{ url: `${window.location.origin}/public-projects/${project.id}` }}
                        options={{ preferNative: false, fallback: 'clipboard' }}
                        customLabelIcons={{
                          default: <Share2 size={14} />,
                          success: <Check size={14} />,
                          busy: <Loader2 size={14} />,
                          error: <X size={14} />
                        }}
                        label=""
                        successLabel=""
                        busyLabel=""
                        onSuccess={() => {
                          toast.success('Public project link copied to clipboard!');
                        }}
                        onError={() => {
                          toast.error('Failed to copy project link.');
                        }}
                        title="Share Project Link"
                      />
                    </span>
                    
                    <button
                      onClick={() => navigate(`/public-projects/${project.id}`)}
                      className="bg-[#0c0c0e] hover:bg-[#1a1a22] border border-[#23232a] text-white py-[8px] px-[16px] rounded-[6px] text-[0.78rem] font-semibold transition-colors duration-150 cursor-pointer"
                    >
                      View Details
                    </button>
                    
                    <button
                      onClick={(e) => handleApplyRedirect(project.id, e)}
                      className="bg-[#70d64d] hover:bg-[#8ee67b] text-black border-none py-[8px] px-[16px] rounded-[6px] text-[0.78rem] font-bold flex items-center gap-[6px] transition-colors duration-150 cursor-pointer"
                    >
                      Apply Now <ArrowRight size={13} />
                    </button>
                  </footer>

                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Pagination Footer */}
      {!isLoading && !error && projects.length > 0 && (
        <div className="bg-[#121215] border border-[#23232a] rounded-[10px] px-[24px] py-[16px] flex justify-between items-center flex-wrap gap-[12px]">
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

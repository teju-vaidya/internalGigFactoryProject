import React, { useState, useEffect } from 'react';
import { Search, Filter, LayoutGrid, LayoutList, RefreshCw, SortAsc } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { Pagination, PageSizeSelector } from '../../components/AdminShared';
import ProjectsGrid from '../../components/Admin/ProjectsGrid';
import ProjectMilestones from '../../components/Admin/ProjectMilestones';
import NewProjectModal from '../../components/Admin/NewProjectModal';
import EditProjectModal from '../../components/Admin/EditProjectModal';
import ConfirmDialog from '../../components/Admin/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
// import { deleteProject, getProjects, saveProjects } from '../../data/projectDataStore';
import { toast } from 'react-toastify';

export default function AdminProjects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    variant: 'primary',
    promptPlaceholder: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  const showConfirm = ({
    title,
    message,
    type = 'confirm',
    variant = 'primary',
    promptPlaceholder = '',
    defaultValue = '',
    onConfirm,
  }) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      type,
      variant,
      promptPlaceholder,
      defaultValue,
      onConfirm: async (val) => {
        if (onConfirm) await onConfirm(val);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Search & Filter & Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [dSearch, setDSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(() => localStorage.getItem('project_status_filter') || 'All Status');
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('project_sort_by') || 'newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => Number(localStorage.getItem('admin_projects_limit')) || 10);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('admin_view_mode') || 'list');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [activeProjectForMilestones, setActiveProjectForMilestones] = useState(null);
    // const [getAllProject, setGetAllProjects] = useState([]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDSearch(searchTerm);
    }, 750);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Persist filters in localStorage
  useEffect(() => {
    localStorage.setItem('project_status_filter', selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    localStorage.setItem('project_sort_by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('admin_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('admin_projects_limit', limit);
  }, [limit]);

  // Reset page to 1 when filters, sorting, or page size change
  useEffect(() => {
    setPage(1);
  }, [dSearch, selectedStatus, sortBy, limit]);


  
   
  // React Query backend projects call with pagination and sorting
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-projects', page, limit, dSearch, selectedStatus, sortBy],
    queryFn: () => {
      const params = new URLSearchParams({ page, limit, sort: sortBy });
      if (dSearch) {
        params.set('search', dSearch);
      }
      if (selectedStatus && selectedStatus !== 'All Status') {
        params.set('status', selectedStatus);
      }
      return api.get(`/projects?${params}`);
    },
    keepPreviousData: true,
  });

  const projects = data?.projects || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleEdit = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setEditingProject(project);
    setIsEditProjectModalOpen(true);
  };

  const handleUpdateProject = (updatedProject) => {
    queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
  };

  const handleCloseEditProjectModal = () => {
    setIsEditProjectModalOpen(false);
    setEditingProject(null);
  };

  
 const handleDelete = (projectId) => {
  const project = projects.find((p) => p.id === projectId);

  if (!project) return;

  showConfirm({
    title: 'Delete Project',
    message: 'Are you sure you want to delete this project?',
    variant: 'danger',

    onConfirm: async () => {
      try {
        await api.delete(`/projects/${projectId}`);

        toast.success("Project deleted successfully");

        await queryClient.invalidateQueries({
          queryKey: ['admin-projects']
        });

      } catch (error) {
        console.error(error);

        toast.error(
          error.response?.data?.message || "Unable to delete project"
        );
      }
    }
  });
};

  // const handleDelete = (projectId) => {
  //   const project = projects.find((p) => p.id === projectId);
  //   if (!project) return;
  //     showConfirm({
  //         title: 'Delete Project',
  //         message: 'Are you sure you want to delete this project?',
  //         variant: 'danger',
  //         onConfirm: () => {
  //           deleteProject(project.id);
  //           toast.success('Project removed');
  //           refresh();
  //         }
  //       });
  //   // showConfirm({
  //   //   title: 'Action Not Allowed',
  //   //   message: 'Project deletion API is not implemented on the backend.',
  //   //   type: 'alert',
  //   //   variant: 'warning',
  //   // });
  // };

  const handleViewDetails = (projectId) => {
    navigate(`/admin/projects/${projectId}`);
  };

  const handleTrackProgress = (projectId) => {
    navigate(`/admin/projects/${projectId}`);
  };

  const handleOpenMilestones = (project) => {
    setActiveProjectForMilestones(project);
  };

  const handleCloseMilestones = () => setActiveProjectForMilestones(null);

  const handleOpenApplications = (project) => {
    navigate(`/admin/projects/${project.id}?tab=applications`);
  };

  const handleStartNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleCloseNewProjectModal = () => {
    setIsNewProjectModalOpen(false);
  };

  const handleCreateNewProject = (createdProject) => {
    queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All Status');
    setSortBy('newest');
  };

  const controlBtnClass = "bg-[#0c0c0e] border border-[#23232a] text-gray-500 rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer transition-colors duration-100";

  return (
    <div className="flex flex-col gap-[20px]">
      
      {/* Header with statistics and CTA */}
      <div className="flex justify-between items-center flex-wrap gap-[12px]">
        <div>
          <h2 className="text-white font-extrabold text-[1.4rem] m-0">Projects</h2>
          <p className="text-gray-500 text-[0.82rem] m-0 mt-[4px]">
            {isLoading ? 'Loading…' : `${total} projects found`}
          </p>
        </div>
        <div className="flex items-center gap-[10px]">
          <button 
            onClick={() => refetch()} 
            disabled={isFetching} 
            className={`${controlBtnClass} flex items-center gap-[6px] ${isFetching ? 'opacity-50' : 'opacity-100'}`}
          >
            <RefreshCw size={13} className={isFetching ? 'spin' : ''} /> Refresh
          </button>
          <button 
            onClick={handleStartNewProject} 
            className="bg-[#70d64d] text-black border-[#70d64d] font-bold flex items-center gap-[6px] px-[14px] py-[7px] text-[0.8rem] rounded-[6px] cursor-pointer hover:bg-[#8ee67b] transition-colors border-none"
          >
            + Add Project
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-[10px] flex-wrap items-center">
        
        {/* Debounced Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, description, skills, deliverables, category, type, priority..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-[#23232a] rounded-[6px] text-white text-[0.85rem] pl-[36px] pr-[12px] py-[9px] outline-none box-border"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-[6px]">
          <span className="text-[#8a8a8a] text-[0.8rem] flex items-center gap-[4px]">
            <Filter size={12} color="#6b7280" />
            Status:
          </span>
          <select 
            value={selectedStatus} 
            onChange={e => setSelectedStatus(e.target.value)} 
            className="bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[12px] py-[7px] text-[0.8rem] outline-none cursor-pointer"
          >
            <option value="All Status">All Status</option>
            <option value="open">Not Started</option>
            <option value="assigned">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Sort Dropdown Filter */}
        <div className="flex items-center gap-[6px]">
          <span className="text-[#8a8a8a] text-[0.8rem] flex items-center gap-[4px]">
            <SortAsc size={12} color="#6b7280" />
            Sort By:
          </span>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)} 
            className="bg-[#0c0c0e] border border-[#23232a] text-white rounded-[6px] px-[12px] py-[7px] text-[0.8rem] outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="start_date_asc">Start Date: Earliest</option>
            <option value="start_date_desc">Start Date: Latest</option>
            <option value="end_date_asc">Deadline: Closest</option>
            <option value="end_date_desc">Deadline: Furthest</option>
            <option value="budget_desc">Budget: High to Low</option>
            <option value="budget_asc">Budget: Low to High</option>
            <option value="title_asc">Title: A→Z</option>
            <option value="title_desc">Title: Z→A</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedStatus !== 'All Status' || sortBy !== 'newest') && (
          <button
            onClick={handleClearFilters}
            className="bg-[#0c0c0e] border border-[#ef444433] text-[#ef4444] rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer transition-colors duration-100 hover:bg-[#ef444411]"
          >
            Clear Filters
          </button>
        )}

        {/* View Mode Toggle */}
        <div className="flex border border-[#23232a] rounded-[6px] overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`border-none px-[10px] py-[7px] cursor-pointer flex items-center justify-center transition-colors duration-200 ${
              viewMode === 'list' ? 'bg-[#70d64d] text-black' : 'bg-[#0c0c0e] text-[#8a8a8a]'
            }`}
            title="List (Table) View"
          >
            <LayoutList size={16} />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`border-none px-[10px] py-[7px] cursor-pointer flex items-center justify-center transition-colors duration-200 ${
              viewMode === 'card' ? 'bg-[#70d64d] text-black' : 'bg-[#0c0c0e] text-[#8a8a8a]'
            }`}
            title="Card (Grid) View"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid/Table Content */}
      <ProjectsGrid
        projects={projects}
        isLoading={isLoading}
        viewMode={viewMode}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        onTrackProgress={handleTrackProgress}
        onMilestones={handleOpenMilestones}
        onApplications={handleOpenApplications}
        onSimApply={() => {}}
        searchQuery={dSearch}
      />

      {/* Pagination Footer */}
      <div className="bg-[#121215] border border-[#23232a] rounded-[10px] px-[24px] py-[16px] flex justify-between items-center flex-wrap gap-[12px]">
        <span className="text-gray-500 text-[0.8rem]">
          {isLoading ? '…' : `Page ${page} of ${totalPages} · ${total} total`}
        </span>

        <PageSizeSelector limit={limit} onChangeLimit={setLimit} total={total} isLoading={isLoading} />

        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      {/* Modals & Detail overlays */}
      {activeProjectForMilestones && (
        <ProjectMilestones project={activeProjectForMilestones} onClose={handleCloseMilestones} />
      )}
      {isNewProjectModalOpen && (
        <NewProjectModal onClose={handleCloseNewProjectModal} onCreate={handleCreateNewProject} />
      )}
      {isEditProjectModalOpen && editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={handleCloseEditProjectModal}
          onSave={handleUpdateProject}
        />
      )}

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        variant={confirmConfig.variant}
        promptPlaceholder={confirmConfig.promptPlaceholder}
        defaultValue={confirmConfig.defaultValue}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

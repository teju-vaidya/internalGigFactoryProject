import React from 'react';
import ProjectCard from './ProjectCard';
import ProjectTable from './ProjectTable';

const ProjectsGrid = ({ 
  projects, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onTrackProgress, 
  onMilestones,
  onApplications,
  onSimApply,
  viewMode,
  isLoading,
  searchQuery,
}) => {
  const isList = viewMode === 'list';

  if (isLoading) {
    if (isList) {
      return <ProjectTable isLoading={true} />;
    }
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[16px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[20px] flex flex-col gap-[14px]">
            <div className="flex justify-between items-center">
              <div className="skeleton-pulse w-[50px] h-[18px] rounded-[4px]" />
              <div className="skeleton-pulse w-[60px] h-[18px] rounded-[4px]" />
            </div>
            <div className="skeleton-pulse w-[80%] h-[18px] rounded-[4px] mt-[4px]" />
            <div className="skeleton-pulse w-[40%] h-[12px] rounded-[4px]" />
            <div className="skeleton-pulse w-[100%] h-[50px] rounded-[6px]" />
            <div className="skeleton-pulse w-[100%] h-[12px] rounded-[4px]" />
            <div className="border-t border-[#1c1c20] pt-[12px] flex gap-[8px]">
              <div className="skeleton-pulse flex-1 h-[28px] rounded-[6px]" />
              <div className="skeleton-pulse flex-1 h-[28px] rounded-[6px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isList) {
    return (
      <ProjectTable
        projects={projects}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        onTrackProgress={onTrackProgress}
        onApplications={onApplications}
      />
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[48px] text-center text-gray-500">
        No projects found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[16px]">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
          onTrackProgress={onTrackProgress}
          onMilestones={onMilestones}
          onApplications={onApplications}
          onSimApply={onSimApply}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
};

export default ProjectsGrid;

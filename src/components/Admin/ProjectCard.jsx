import React, { useState } from 'react';
import { Edit2, Trash2, Eye, TrendingUp, Users, MoreVertical, Share2, Check, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { ShareButton } from 'react-share-utilities';
import { CompletionBar } from '../AdminShared';
import { ProjectStatusBadge } from './ProjectTable';
import { stripHtml } from '../../utils/text';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const getMatchReasons = (project, query) => {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const reasons = [];

  const title = project.title?.toLowerCase() || '';
  const description = (project.description || '').toLowerCase();
  const category = project.category?.toLowerCase() || '';
  const projectType = project.project_type?.toLowerCase() || '';
  const priority = project.priority?.toLowerCase() || '';
  const skills = project.project_skills?.map(s => s.skill_name?.toLowerCase() || '') || [];
  const tags = project.project_tags?.map(t => t.tag_name?.toLowerCase() || '') || [];
  const budgetStr = project.budget ? `₹${Number(project.budget).toLocaleString('en-IN')}` : '';

  if (title.includes(q)) reasons.push('Title Match');
  if (description.includes(q)) reasons.push('Description Match');
  if (category.includes(q)) reasons.push('Category Match');
  if (projectType.includes(q)) reasons.push('Type Match');
  if (priority.includes(q)) reasons.push('Priority Match');
  if (skills.some(s => s.includes(q))) reasons.push('Skill Match');
  if (tags.some(t => t.includes(q))) reasons.push('Deliverable Match');
  if (budgetStr.toLowerCase().includes(q)) reasons.push('Budget Match');

  return reasons;
};

export const ProjectCard = ({ 
  project, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onTrackProgress, 
  onMilestones, 
  onApplications, 
  onSimApply,
  searchQuery 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const assignedUser = project.assignments?.[0]?.assigned_to;
  const avatarSeed = encodeURIComponent(assignedUser?.full_name || 'Unassigned');
  
  const isNewProject = project.status === 'open' || project.status === 'NOT STARTED';
  const matchReasons = getMatchReasons(project, searchQuery);

  return (
    <div className="group bg-[#121215] border border-[#23232a] rounded-[10px] p-[20px] flex flex-col gap-[14px] relative cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:border-[#70d64d]">
      
      {/* Match Reason Overlay on Hover */}
      {searchQuery && matchReasons.length > 0 && (
        <div className="absolute inset-0 bg-[#0c0c0e]/95 backdrop-blur-sm rounded-[10px] p-[20px] flex flex-col justify-center items-center gap-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 text-center">
          <span className="text-gray-500 text-[0.7rem] uppercase tracking-wider font-bold">Query Match Details</span>
          <div className="flex flex-wrap gap-[6px] justify-center max-w-full">
            {matchReasons.map(r => (
              <span key={r} className="bg-[#70d64d]/10 text-[#70d64d] border border-[#70d64d]/30 text-[0.72rem] font-semibold px-[10px] py-[4px] rounded-[6px]">
                {r}
              </span>
            ))}
          </div>
          <span className="text-gray-500 text-[0.68rem] mt-[10px]">Click card to view project</span>
        </div>
      )}
      
      {/* Top Status Badge, Priority & 3-Dot Options Dropdown */}
      <div className="flex justify-between items-center">
        <span className={`text-[0.62rem] font-bold px-[6px] py-[2px] rounded-[4px] uppercase ${project.priority === 'high' ? 'bg-red-500/10 text-red-400' : project.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>
          {project.priority || 'medium'}
        </span>
        <div className="flex items-center gap-[8px] relative">
          <ProjectStatusBadge status={project.status} />
          
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }} 
            className="p-[4px] hover:bg-[#1c1c24] border border-transparent rounded text-gray-500 hover:text-white cursor-pointer transition-colors bg-transparent flex items-center justify-center"
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
              <div className="absolute right-0 top-[26px] bg-[#0c0c0e] border border-[#23232a] rounded-[6px] py-[4px] min-w-[100px] shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-[101] flex flex-col">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit && onEdit(project.id);
                  }}
                  className="px-[12px] py-[8px] text-left text-gray-300 hover:text-white hover:bg-[#1a1a22] text-[0.75rem] font-semibold border-none bg-transparent cursor-pointer flex items-center gap-[6px] w-full"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete && onDelete(project.id);
                  }}
                  className="px-[12px] py-[8px] text-left text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef444411] text-[0.75rem] font-semibold border-none bg-transparent cursor-pointer flex items-center gap-[6px] w-full"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Title & Start Date */}
      <div>
        <h4 
          onClick={() => onViewDetails && onViewDetails(project.id)} 
          className="text-white text-[1rem] font-bold m-0 hover:text-[#70d64d] transition-colors cursor-pointer text-ellipsis overflow-hidden line-clamp-1"
        >
          {project.title}
        </h4>
        <p className="text-gray-500 text-[0.72rem] m-0 mt-[4px]">
          Start Date: <span className="text-gray-300 font-semibold">{fmtDate(project.start_date)}</span>
          <span className="text-[#4b4b57] mx-[6px]">·</span>
          <span className="capitalize">{project.project_type || 'fixed'}</span>
        </p>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-gray-400 text-[0.78rem] m-0 line-clamp-2 leading-relaxed">
          {stripHtml(project.description)}
        </p>
      )}

      {/* Budget & Deadline */}
      <div className="grid grid-cols-2 gap-[12px] bg-[#0c0c0e] p-[10px] rounded-[6px] border border-[#1a1a22]">
        <div>
          <span className="text-[#8a8a8a] text-[0.65rem] block uppercase font-semibold">Budget</span>
          <span className="text-[#70d64d] font-bold text-[0.88rem]">
            {project.budget ? `₹${Number(project.budget).toLocaleString('en-IN')}` : '—'}
          </span>
        </div>
        <div>
          <span className="text-[#8a8a8a] text-[0.65rem] block uppercase font-semibold">Deadline</span>
          <span className="text-white font-semibold text-[0.8rem]">{fmtDate(project.end_date)}</span>
        </div>
      </div>

      {/* Progress & Bids */}
      <div className="flex flex-col gap-[10px]">
        {!isNewProject && (
          <div>
            <CompletionBar value={project.progress_percentage || 0} label="Progress" />
          </div>
        )}
        
        {isNewProject && (
          <div className="flex items-center text-[0.72rem] mt-[2px]">
            <button 
              onClick={() => onApplications && onApplications(project)}
              className="flex items-center gap-[4px] bg-[#1e293b] hover:bg-[#2e3e56] text-[#38bdf8] text-[0.68rem] font-bold px-[8px] py-[4px] rounded-[4px] border-none cursor-pointer transition-colors shrink-0"
            >
              <Users size={10} />
              {project.applications_count || 0} Bids
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-[#1a1a22] pt-[12px] mt-auto flex gap-[8px]">
        <span onClick={(e) => e.stopPropagation()}>
          <ShareButton
            variant="custom"
            className="bg-[#0c0c0e] hover:bg-[#1a1a22] border border-[#23232a] text-white p-[8px] rounded-[6px] text-[0.78rem] font-semibold flex items-center justify-center cursor-pointer transition-colors"
            data={{ url: `${window.location.origin}/public-projects/${project.id}` }}
            options={{ preferNative: false, fallback: 'clipboard' }}
            customLabelIcons={{
              default: <Share2 size={13} />,
              success: <Check size={13} />,
              busy: <Loader2 size={13} />,
              error: <X size={13} />
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
        {isNewProject ? (
          <button
            onClick={() => onViewDetails && onViewDetails(project.id)}
            className="flex-1 bg-[#0c0c0e] hover:bg-[#1a1a22] border border-[#23232a] text-white py-[8px] rounded-[6px] text-[0.78rem] font-semibold flex items-center justify-center gap-[6px] cursor-pointer transition-colors"
          >
            <Eye size={13} /> View Details
          </button>
        ) : (
          <button
            onClick={() => onTrackProgress && onTrackProgress(project.id)}
            className="flex-1 bg-[#70d64d] hover:bg-[#8ee67b] text-black border-none py-[8px] rounded-[6px] text-[0.78rem] font-bold flex items-center justify-center gap-[6px] cursor-pointer transition-colors"
          >
            <TrendingUp size={13} /> Track Progress
          </button>
        )}
      </div>

    </div>
  );
};

export default ProjectCard;

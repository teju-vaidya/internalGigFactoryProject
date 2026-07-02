import React from "react";
import { Briefcase, Calendar, Clock, Users, Wallet, Share2, Check, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import { ShareButton } from "react-share-utilities";

const renderWithTbdTooltip = (val, tooltipText) => {
  if (val === "TBD") {
    return (
      <span className="relative group inline-block">
        <span className="underline decoration-dotted decoration-gray-500 cursor-help text-[#a1a1aa] font-semibold">
          {val}
        </span>
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

export default function ProjectHeader({
  project,
  formattedBudget,
  formattedStartDate,
  formattedDeadline,
  formattedHours,
}) {
  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-6 sm:p-8 flex flex-col gap-6 relative">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          {/* Badges */}
          <div className="flex items-center gap-[8px] flex-wrap">
            <span className="bg-[#0c0c0e] border border-[#23232a] text-white text-[0.65rem] px-[10px] py-[4px] rounded-[4px] font-bold uppercase tracking-wider">
              {project.project_type || "FIXED"}
            </span>
            <span
              className={`uppercase font-bold text-[0.65rem] px-[10px] py-[4px] rounded-[4px] tracking-wider border ${
                project.priority === "high"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {project.priority || "MEDIUM"} PRIORITY
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-4 mb-2 leading-tight break-words">
            {project.title}
          </h1>

          {/* Sub-label/Company */}
          <div className="flex items-center gap-2 text-[#8a8a8a] text-[0.85rem] mt-3">
            <Briefcase size={14} className="text-gray-500" />
            <span className="font-semibold text-gray-300">
              {project.client || "Internal Client"}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="text-left md:text-right shrink-0 mt-4 md:mt-0 flex md:flex-col items-start items-end gap-2 w-full md:w-auto">
          <div>
            <span className="text-gray-500 text-[0.68rem] font-bold uppercase tracking-wider block mb-2">
              Project Status
            </span>
            <span
              className={`inline-flex items-center gap-[6px] uppercase font-bold text-[0.7rem] px-[12px] py-[6px] rounded-[6px] border ${
                project.status === "completed"
                  ? "bg-[#182318] text-[#70d64d] border-[#70d64d]/30"
                  : project.status === "assigned"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  project.status === "completed"
                    ? "bg-[#70d64d]"
                    : project.status === "assigned"
                      ? "bg-blue-400"
                      : "bg-amber-400"
                }`}
              />
              {project.status === "completed"
                ? "Completed"
                : project.status === "assigned"
                  ? "In Progress"
                  : "Not Started"}
            </span>
          </div>
          <ShareButton
            variant="custom"
            className="bg-[#0c0c0e] hover:bg-[#1a1a22] border border-[#23232a] text-white py-[6px] px-[12px] rounded-[6px] text-[0.78rem] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer mt-1"
            data={{ url: `${window.location.origin}/public-projects/${project.id}` }}
            options={{ preferNative: false, fallback: 'clipboard' }}
            customLabelIcons={{
              default: <Share2 size={13} />,
              success: <Check size={13} />,
              busy: <Loader2 size={13} />,
              error: <X size={13} />
            }}
            label="Share Project"
            successLabel="Copied!"
            busyLabel="Copying..."
            onSuccess={() => {
              toast.success('Public project link copied to clipboard!');
            }}
            onError={() => {
              toast.error('Failed to copy project link.');
            }}
          />
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-1 min-[375px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-6 pt-6 border-t border-[#23232a] w-full">
        {/* Budget */}
        <div className="flex items-start gap-3 min-w-0">
          <Wallet className="text-[#8a8a8a] mt-1 shrink-0" size={18} />
          <div className="min-w-0">
            <span className="text-gray-500 text-[0.68rem] font-bold uppercase tracking-wider block">
              Budget
            </span>
            <span className="text-white font-extrabold text-[1.1rem] sm:text-[1.2rem] mt-1 block truncate">
              {formattedBudget}
            </span>
          </div>
        </div>
        {/* Start Date */}
        <div className="flex items-start gap-3 min-w-0">
          <Calendar className="text-[#8a8a8a] mt-1 shrink-0" size={18} />
          <div className="min-w-0">
            <span className="text-gray-500 text-[0.68rem] font-bold uppercase tracking-wider block">
              Start Date
            </span>
            <span className="text-white font-extrabold text-[1.1rem] sm:text-[1.2rem] mt-1 block">
              {renderWithTbdTooltip(
                formattedStartDate,
                "To Be Decided / Determined by client",
              )}
            </span>
          </div>
        </div>
        {/* Est. Hours */}
        <div className="flex items-start gap-3 min-w-0">
          <Clock className="text-[#8a8a8a] mt-1 shrink-0" size={18} />
          <div className="min-w-0">
            <span className="text-gray-500 text-[0.68rem] font-bold uppercase tracking-wider block">
              Est. Hours
            </span>
            <span className="text-white font-extrabold text-[1.1rem] sm:text-[1.2rem] mt-1 block">
              {renderWithTbdTooltip(
                formattedHours,
                "To Be Determined based on requirements",
              )}
            </span>
          </div>
        </div>
        {/* Deadline */}
        <div className="flex items-start gap-3 min-w-0">
          <Calendar className="text-[#8a8a8a] mt-1 shrink-0" size={18} />
          <div className="min-w-0">
            <span className="text-gray-500 text-[0.68rem] font-bold uppercase tracking-wider block">
              Deadline
            </span>
            <span className="text-white font-extrabold text-[1.1rem] sm:text-[1.2rem] mt-1 block">
              {renderWithTbdTooltip(
                formattedDeadline,
                "To Be Decided / Finalized by client",
              )}
            </span>
          </div>
        </div>
        {/* Applicants */}
        <div className="flex items-start gap-3 min-w-0">
          <Users className="text-[#8a8a8a] mt-1 shrink-0" size={18} />
          <div className="min-w-0">
            <span className="text-gray-500 text-[0.68rem] font-bold uppercase tracking-wider block">
              Applicants
            </span>
            <span className="text-white font-extrabold text-[1.1rem] sm:text-[1.2rem] mt-1 block truncate">
              {project.applications_count || 0} Users
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

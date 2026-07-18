import React from "react";
import { CheckCircle, Wallet, Pencil } from "lucide-react";

const ProgressBar = ({ value, label }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[11px] font-semibold">
      <span className="text-gray-400">{label}</span>
      <span className="text-[#70d64d] font-bold">{value}%</span>
    </div>
    <div className="w-full bg-[#1c1c24] h-2 rounded-full overflow-hidden border border-[#23232a]">
      <div
        className="bg-[#70d64d] h-full rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default function ProjectSidebar({
  isAssigned,
  activeAssignment,
  project,
  userRole,
  myApplication,
  isProjectCompleted,
  handleApplyTrigger,
  handleEditTrigger,
}) {
  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-6 shadow-lg">
      {isAssigned ? (
        // Active assignment contract box
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <CheckCircle className="text-[#70d64d] shrink-0" size={18} />
            <h3 className="text-white font-bold text-sm">Active Contract</h3>
          </div>

          <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[6px] p-3.5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-semibold uppercase">
                Contract Budget
              </span>
              <span className="text-[#70d64d] font-extrabold text-sm">
                ₹
                {Number(
                  activeAssignment.assigned_amount || project.budget,
                ).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-[#1c1c24] pt-2">
              <span className="text-gray-500 font-semibold uppercase">
                Assigned Date
              </span>
              <span className="text-white font-bold">
                {new Date(activeAssignment.assigned_at).toLocaleDateString(
                  "en-IN",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  },
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-[#1c1c24] pt-2">
              <span className="text-gray-500 font-semibold uppercase">
                Your Role
              </span>
              <span className="text-white font-bold capitalize">
                {userRole}
              </span>
            </div>
          </div>

          <div className="border-t border-[#23232a] pt-4 mt-3 space-y-3">
            <ProgressBar
              value={project.progress_percentage || 0}
              label="Overall Completion"
            />

            <div className="flex justify-between items-center text-xs text-gray-400 font-semibold mt-2">
              <span>Milestones Completed</span>
              <span className="text-white font-bold">
                {project.completed_milestones || 0} /{" "}
                {project.total_milestones || 0}
              </span>
            </div>
          </div>

          <p className="text-gray-500 text-[10.5px] leading-relaxed mt-2 italic border-t border-[#23232a] pt-3">
            You are officially assigned as the executor of this project. Track
            milestone statuses and submit deliverables for review below.
          </p>
        </div>
      ) : myApplication ? (
        // Already applied box
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <CheckCircle className="text-[#70d64d] shrink-0" size={18} />
            <h3 className="text-white font-bold text-sm">Proposal Submitted</h3>
          </div>

          <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[6px] p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-semibold">YOUR BID</span>
              <span className="text-[#70d64d] font-bold">
                ₹{Number(myApplication.bid_amount).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-semibold">DURATION</span>
              <span className="text-white font-bold">
                {myApplication.estimated_days} Days
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-semibold">STATUS</span>
              <span
                className="px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]"
                style={{
                  backgroundColor:
                    myApplication.status === "accepted"
                      ? "#70d64d1c"
                      : myApplication.status === "rejected"
                        ? "#ef44441c"
                        : "#f59e0b1c",
                  color:
                    myApplication.status === "accepted"
                      ? "#70d64d"
                      : myApplication.status === "rejected"
                        ? "#ef4444"
                        : "#f59e0b",
                }}
              >
                {myApplication.status === "rejected"
                  ? "not selected"
                  : myApplication.status || "applied"}
              </span>
            </div>
            
          </div>
          {myApplication.proposal && (
            <div className="border-t border-[#23232a] pt-4 mt-3 space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Your Proposal Strategy
                </span>
                <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[6px] p-3 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
                  {myApplication.proposal}
                </div>
              </div>

              {myApplication.cover_letter && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Cover Letter
                  </span>
                  <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[6px] p-3 text-xs text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-y-auto">
                    {myApplication.cover_letter}
                  </div>
                </div>
              )}

              {myApplication.attachment_url && (
                <div className="flex items-center justify-between bg-[#0c0c0e] border border-[#23232a] rounded-[6px] px-3 py-2 text-xs">
                  <span className="text-gray-500 font-semibold">
                    Supporting Doc:
                  </span>
                  <a
                    href={myApplication.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#70d64d] font-bold hover:underline truncate max-w-[150px]"
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          )}

          <p className="text-gray-500 text-[10.5px] leading-relaxed mt-2 italic">
            You have successfully submitted your execution strategy. The admin
            will review it and notify you via email when a decision is made.
          </p>

          {/* Edit Proposal button — only visible while status is 'applied' */}
          {myApplication.status === 'applied' && handleEditTrigger && (
            <button
              onClick={handleEditTrigger}
              className="w-full mt-2 flex items-center justify-center gap-1.5 bg-transparent border border-[#23232a] hover:border-[#70d64d]/50 hover:bg-[#70d64d]/5 text-gray-400 hover:text-[#70d64d] font-bold py-2.5 rounded-[6px] text-xs transition-all duration-150 cursor-pointer"
            >
              <Pencil size={12} /> Edit Proposal
            </button>
          )}
        </div>
      ) : isProjectCompleted ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <CheckCircle className="text-[#70d64d] shrink-0" size={18} />
            <h3 className="text-white font-bold text-sm">Project Completed</h3>
          </div>

          <p className="text-gray-500 text-xs leading-relaxed">
            This project has been completed, so new proposals are no longer
            being accepted.
          </p>
        </div>
      ) : (
        // Single Apply Now button
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="text-white font-bold text-base">Submit Proposal</h3>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              Submit your execution strategy and commercial bid to the platform.
            </p>
          </div>

          <div>
            <button
              onClick={() => handleApplyTrigger(userRole)}
              className="w-full bg-[#70d64d] hover:bg-[#8ee67b] text-black border-none py-[12px] rounded-[6px] text-[0.8rem] font-bold flex items-center justify-center gap-[6px] cursor-pointer transition-colors duration-150 shadow-[0_4px_12px_rgba(112,214,77,0.15)]"
            >
              Apply Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

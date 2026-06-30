import React from "react";
import { X, FileText, Paperclip, ExternalLink } from "lucide-react";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";export default function ViewProposalModal({
  selectedBidForProposal,
  hasCompletedMilestone = false,
  onClose,
  onApprove,
  onChangeBidStatus,
  onReject,
  onResetAssignment,
}) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-[800]"
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[650px] max-h-[90vh] bg-[#121215] border border-[#23232a] rounded-[16px] shadow-2xl z-[801] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#23232a] bg-[#0c0c0e] shrink-0">
          <div>
            <h3 className="text-white font-extrabold text-[1.1rem] m-0">
              Proposal Details
            </h3>
            <p className="text-gray-500 text-[0.75rem] m-0 mt-1">
              Submitted by {selectedBidForProposal.applicant?.full_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white border-none bg-transparent cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-5 m-0 overflow-y-auto flex-1 text-[0.85rem] text-gray-300">
          {/* Profile Overview Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-[#0c0c0e] border border-[#23232a] p-4 rounded-[10px]">
            <div>
              <span className="text-gray-500 text-[0.68rem] uppercase font-bold tracking-[0.5px] block">
                Applicant
              </span>
              <span className="text-white font-semibold block mt-0.5">
                {selectedBidForProposal.applicant?.full_name ||
                  "Anonymous User"}
              </span>
              <span className="text-gray-500 text-[0.72rem] block mt-0.5">
                {selectedBidForProposal.applicant?.email}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[0.68rem] uppercase font-bold tracking-[0.5px] block">
                Bid Amount
              </span>
              <span className="text-[#70d64d] font-bold block mt-0.5">
                {selectedBidForProposal.bid_amount
                  ? `₹${Number(selectedBidForProposal.bid_amount).toLocaleString("en-IN")}`
                  : "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-[0.68rem] uppercase font-bold tracking-[0.5px] block">
                Delivery Time
              </span>
              <span className="text-white font-semibold block mt-0.5">
                {selectedBidForProposal.estimated_days
                  ? `${selectedBidForProposal.estimated_days} Days`
                  : "—"}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-3 border-t border-[#1a1a22] pt-3 mt-1 flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="text-gray-500 text-[0.68rem] uppercase font-bold tracking-[0.5px] block">
                  Applicant Role
                </span>
                <span className="text-white font-semibold block mt-0.5 capitalize">
                  {selectedBidForProposal.applicant?.role || "Gig Expert"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[0.68rem] uppercase font-bold tracking-[0.5px] block mb-1">
                  Status
                </span>
                <span
                  className={`text-[0.65rem] font-bold px-[8px] py-[3px] rounded-[4px] uppercase ${
                    selectedBidForProposal.status === "accepted"
                      ? "bg-[#70d64d]/10 text-[#70d64d]"
                      : selectedBidForProposal.status === "rejected"
                        ? "bg-red-500/10 text-red-400"
                        : selectedBidForProposal.status === "shortlisted"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-sky-500/10 text-sky-400"
                  }`}
                >
                  {selectedBidForProposal.status === 'rejected' ? 'not selected' : selectedBidForProposal.status}
                </span>
              </div>
            </div>
          </div>

          {/* Proposal Text */}
          {selectedBidForProposal.proposal && (
            <div className="flex flex-col gap-1.5">
              <span className="text-gray-500 text-[0.68rem] uppercase font-bold tracking-[0.5px]">
                Execution Strategy / Proposal
              </span>
              <div className="bg-[#0c0c0e] border border-[#23232a] p-4 rounded-[8px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedBidForProposal.proposal}
              </div>
            </div>
          )}

          {/* Cover Letter Text */}
          {selectedBidForProposal.cover_letter && (
            <div className="flex flex-col gap-1.5">
              <span className="text-gray-500 text-[0.68rem] uppercase font-bold tracking-[0.5px]">
                Cover Letter
              </span>
              <div className="bg-[#0c0c0e] border border-[#23232a] p-4 rounded-[8px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedBidForProposal.cover_letter}
              </div>
            </div>
          )}

          {/* Attachment Link */}
          {selectedBidForProposal.attachment_url && (
            <div className="flex flex-col gap-1.5">
              <span className="text-gray-500 text-[0.68rem] uppercase font-bold tracking-[0.5px]">
                Supporting Document / Attachment
              </span>
              <div className="bg-[#0c0c0e] border border-[#23232a] p-4 rounded-[8px] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip size={16} className="text-gray-500 shrink-0" />
                  <span
                    className="text-white text-[0.82rem] font-medium truncate"
                    title={selectedBidForProposal.attachment_url.split("/").pop()}
                  >
                    {selectedBidForProposal.attachment_url.split("/").pop() ||
                      "attached_document.pdf"}
                  </span>
                </div>
                <a
                  href={selectedBidForProposal.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#202024] hover:bg-[#2d2d34] border border-[#2d2d38] text-gray-300 hover:text-white rounded-[6px] px-3.5 py-2 text-[0.75rem] font-bold cursor-pointer transition-colors no-underline shrink-0 flex items-center gap-1.5 hover:border-[#70d64d]/40"
                >
                  <ExternalLink size={13} /> View Attachment
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons if pending/shortlisted/rejected */}
          <div className="flex justify-between items-center gap-3 border-t border-[#23232a] pt-4 mt-2">
            <div className="flex gap-2 flex-wrap">
              {!hasCompletedMilestone && (
                <>
                  {/* Pending / Applied bids: Approve, Shortlist, Reject */}
                  {(selectedBidForProposal.status === "pending" ||
                    selectedBidForProposal.status === "applied" ||
                    selectedBidForProposal.status === "reviewed") && (
                    <>
                      <button
                        onClick={() => {
                          onApprove(selectedBidForProposal.id);
                          onClose();
                        }}
                        className="bg-[#70d64d] text-black border-none font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer hover:bg-[#8ee67b] transition-colors"
                      >
                        Approve & Assign
                      </button>
                      <button
                        onClick={() => {
                          onChangeBidStatus(
                            selectedBidForProposal.id,
                            "shortlisted",
                            "Shortlisted",
                          );
                          onClose();
                        }}
                        className="bg-amber-500/20 text-amber-400 border-none font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer hover:bg-amber-500/30 transition-colors"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => {
                          onReject(selectedBidForProposal.id);
                          onClose();
                        }}
                        className="bg-[#ef444433] text-[#ef4444] border-none font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer hover:bg-[#ef444455] transition-colors"
                      >
                        Not Select
                      </button>
                    </>
                  )}

                  {/* Shortlisted bids: Approve, Reject, or Reset */}
                  {selectedBidForProposal.status === "shortlisted" && (
                    <>
                      <button
                        onClick={() => {
                          onApprove(selectedBidForProposal.id);
                          onClose();
                        }}
                        className="bg-[#70d64d] text-black border-none font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer hover:bg-[#8ee67b] transition-colors"
                      >
                        Approve & Assign
                      </button>
                      <button
                        onClick={() => {
                          onReject(selectedBidForProposal.id);
                          onClose();
                        }}
                        className="bg-[#ef444433] text-[#ef4444] border-none font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer hover:bg-[#ef444455] transition-colors"
                      >
                        Not Select
                      </button>
                      <button
                        onClick={() => {
                          onChangeBidStatus(
                            selectedBidForProposal.id,
                            "pending",
                            "Pending",
                          );
                          onClose();
                        }}
                        className="bg-gray-500/20 text-gray-400 border-none font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer hover:bg-gray-500/30 transition-colors"
                      >
                        Reset Decision
                      </button>
                    </>
                  )}

                  {/* Rejected bids: Reset or Shortlist */}
                  {selectedBidForProposal.status === "rejected" && (
                    <>
                      <button
                        onClick={() => {
                          onChangeBidStatus(
                            selectedBidForProposal.id,
                            "pending",
                            "Pending",
                          );
                          onClose();
                        }}
                        className="bg-sky-500/20 text-sky-400 border-none font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer hover:bg-sky-500/30 transition-colors"
                      >
                        Reset to Pending
                      </button>
                      <button
                        onClick={() => {
                          onChangeBidStatus(
                            selectedBidForProposal.id,
                            "shortlisted",
                            "Shortlisted",
                          );
                          onClose();
                        }}
                        className="bg-amber-500/20 text-amber-400 border-none font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer hover:bg-amber-500/30 transition-colors"
                      >
                        Shortlist
                      </button>
                    </>
                  )}

                  {/* Accepted bids: Revoke */}
                  {selectedBidForProposal.status === "accepted" && (
                    <button
                      onClick={() => {
                        onResetAssignment();
                        onClose();
                      }}
                      className="bg-[#ef444433] text-[#ef4444] border border-[#ef4444]/30 font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer hover:bg-[#ef444455] transition-colors"
                    >
                      Revoke Assignment
                    </button>
                  )}
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="bg-[#202024] hover:bg-[#2d2d34] border border-[#2d2d38] text-gray-300 hover:text-white font-bold rounded-[6px] px-[14px] py-[8px] text-[0.75rem] cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

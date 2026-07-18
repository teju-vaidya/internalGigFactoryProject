import React from "react";
import { Link } from "react-router-dom";
import { Users, FileText, Paperclip } from "lucide-react";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function AdminBidsCard({
  applications,
  hasCompletedMilestone = false,
  onViewProposal,
  onApprove,
  onChangeBidStatus,
  onReject,
  onResetAssignment,
}) {
  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[24px]">
      <div className="border-b border-[#23232a] pb-3 mb-4 flex items-center gap-[10px]">
        <Users className="text-[#70d64d]" size={18} />
        <h2 className="text-white font-bold text-[1rem] m-0">
          Incoming Bids / Applications
        </h2>
      </div>

      {applications.length === 0 ? (
        <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[24px] text-center text-gray-500 text-[0.82rem]">
          No applications submitted yet.
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[16px] flex flex-col gap-[10px]"
            >
              <div className="flex justify-between items-start flex-wrap gap-2 border-b border-[#1a1a22] pb-2">
                <div>
                  <Link
                    to={`/admin/users/${app.applicant?.id}/profile?from=Project+Applications`}
                    className="cursor-pointer group no-underline"
                  >
                    <p className="text-white font-bold text-[0.88rem] group-hover:text-[#70d64d] transition-colors m-0">
                      {app.applicant?.full_name || "Anonymous User"}
                    </p>
                  </Link>
                  <p className="text-[#8a8a8a] text-[0.72rem] block mt-[2px] mb-0">
                    {app.applicant?.email}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[#70d64d] font-bold text-[0.9rem] block">
                    {app.bid_amount
                      ? `₹${Number(app.bid_amount).toLocaleString("en-IN")}`
                      : "—"}
                  </span>
                  <span className="text-[#8a8a8a] text-[0.68rem] block mt-[2px]">
                    {app.estimated_days || "—"} days delivery
                  </span>
                </div>
              </div>

              {app.proposal && (
                <div
                  onClick={() => onViewProposal(app)}
                  className="bg-[#121215] border border-[#1a1a22] hover:border-gray-500/50 p-[12px] rounded-[6px] cursor-pointer transition-colors group"
                  title="Click to view full proposal & details"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#8a8a8a] text-[0.62rem] block uppercase font-bold tracking-[0.5px]">
                      Proposal
                    </span>
                    <span className="text-[0.65rem] text-[#70d64d] opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view full details →
                    </span>
                  </div>
                  <p
                    className="text-[#8a8a8a] text-[0.78rem] m-0 leading-relaxed italic"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    "{app.proposal}"
                  </p>
                </div>
              )}

              {(app.attachment_url || app.cover_letter) && (
                <div className="flex gap-2.5 items-center text-[0.7rem] text-gray-500 mt-1">
                  {app.cover_letter && (
                    <span className="flex items-center gap-1">
                      <FileText size={12} className="text-gray-400" /> Cover
                      Letter
                    </span>
                  )}
                  {app.attachment_url && (
                    <a href={app.attachment_url} target="__blank" className="flex items-center gap-1 text-[#70d64d]">
                      <Paperclip size={12} /> Attachment
                    </a>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center flex-wrap gap-3 pt-2">
                <div className="flex gap-[12px] items-center">
                  <span className="text-[0.72rem] text-gray-500">
                    Applicant Role:{" "}
                    <span className="capitalize text-white font-semibold">
                      {app.applicant?.role}
                    </span>
                  </span>
                  <span
                    className={`text-[0.65rem] font-bold px-[8px] py-[3px] rounded-[4px] uppercase ${
                      app.status === "accepted"
                        ? "bg-[#70d64d]/10 text-[#70d64d]"
                        : app.status === "rejected"
                          ? "bg-red-500/10 text-red-400"
                          : app.status === "shortlisted"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-sky-500/10 text-sky-400"
                    }`}
                  >
                    {app.status === 'rejected' ? 'not selected' : app.status}
                  </span>
                </div>

                <div className="flex gap-[8px] flex-wrap">
                  <button
                    onClick={() => onViewProposal(app)}
                    className="bg-[#1a1a20] hover:bg-[#252530] border border-[#2d2d38] text-gray-300 hover:text-white font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer transition-colors"
                  >
                    View Proposal
                  </button>

                  {!hasCompletedMilestone && (
                    <>
                      {/* Pending / Applied bids: Approve & Reject */}
                      {(app.status === "pending" ||
                        app.status === "applied" ||
                        app.status === "reviewed") && (
                        <>
                          <button
                            onClick={() => onApprove(app.id)}
                            className="bg-[#70d64d] text-black border-none font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer hover:bg-[#8ee67b] transition-colors"
                          >
                            Approve & Assign
                          </button>
                          <button
                            onClick={() =>
                              onChangeBidStatus(
                                app.id,
                                "shortlisted",
                                "Shortlisted",
                              )
                            }
                            className="bg-amber-500/20 text-amber-400 border-none font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer hover:bg-amber-500/30 transition-colors"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => onReject(app.id)}
                            className="bg-[#ef444433] text-[#ef4444] border-none font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer hover:bg-[#ef444455] transition-colors"
                          >
                            Not Select
                          </button>
                        </>
                      )}

                      {/* Accepted bids: Revoke Assignment */}
                      {app.status === "accepted" && (
                        <button
                          onClick={() => onResetAssignment()}
                          className="bg-[#ef444433] text-[#ef4444] border border-[#ef4444]/30 font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer hover:bg-[#ef444455] transition-colors"
                        >
                          Revoke Assignment
                        </button>
                      )}

                      {/* Rejected bids: Reset to Pending or Shortlist */}
                      {app.status === "rejected" && (
                        <>
                          <button
                            onClick={() =>
                              onChangeBidStatus(app.id, "pending", "Pending")
                            }
                            className="bg-sky-500/20 text-sky-400 border-none font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer hover:bg-sky-500/30 transition-colors"
                          >
                            Reset to Pending
                          </button>
                          <button
                            onClick={() =>
                              onChangeBidStatus(app.id, "shortlisted", "Shortlisted")
                            }
                            className="bg-amber-500/20 text-amber-400 border-none font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer hover:bg-amber-500/30 transition-colors"
                          >
                            Shortlist
                          </button>
                        </>
                      )}

                      {/* Shortlisted bids: Approve, Reject, or Reset */}
                      {app.status === "shortlisted" && (
                        <>
                          <button
                            onClick={() => onApprove(app.id)}
                            className="bg-[#70d64d] text-black border-none font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer hover:bg-[#8ee67b] transition-colors"
                          >
                            Approve & Assign
                          </button>
                          <button
                            onClick={() => onReject(app.id)}
                            className="bg-[#ef444433] text-[#ef4444] border-none font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer hover:bg-[#ef444455] transition-colors"
                          >
                            Not Select
                          </button>
                          <button
                            onClick={() =>
                              onChangeBidStatus(app.id, "pending", "Pending")
                            }
                            className="bg-gray-500/20 text-gray-400 border-none font-bold rounded-[6px] px-[12px] py-[6px] text-[0.72rem] cursor-pointer hover:bg-gray-500/30 transition-colors"
                          >
                            Reset Decision
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

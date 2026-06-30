import { Award, Wallet, Edit, Download, FileArchive } from "lucide-react";
import { api } from "../../../utils/api";
import { toast } from "react-toastify";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    : "—";

export default function AdminProjectMilestones({
  milestones,
  project,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onReviewDeliverable,
  onViewReceipt,
  onEditPayment,
  onCompleteMilestone,
  onRecordPayment,
}) {
  const isProjectCompleted = project?.status?.toLowerCase() === "completed";

  const handleDownloadZip = (milestoneId, deliverableId) => {
    try {
      const downloadUrl = api.getDownloadUrl(`/projects/milestones/deliverables/${deliverableId}/zip`);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(err.message || "Failed to download ZIP archive.");
    }
  };

  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[24px] flex flex-col gap-[16px]">
      <div className="flex justify-between items-center border-b border-[#23232a] pb-3">
        <div className="flex items-center gap-[10px]">
          <Award className="text-[#70d64d]" size={18} />
          <h2 className="text-white font-bold text-[1rem] m-0">
            Project Milestones
          </h2>
        </div>
        {!isProjectCompleted && (
          <button
            onClick={onAddMilestone}
            className="bg-[#70d64d] text-black border-none font-bold rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer hover:bg-[#8ee67b] transition-colors"
          >
            + Add Milestone
          </button>
        )}
      </div>

      {milestones.length === 0 ? (
        <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[24px] text-center text-gray-500 text-[0.82rem]">
          No milestones defined for this project.
        </div>
      ) : (
        <div className="flex flex-col gap-[12px]">
          {milestones.map((ms) => {
            // Find payment associated with this milestone
            const milestonePayment = project.milestone_payments?.find(
              (p) => p.milestone_id === ms.id,
            );

            return (
              <div
                key={ms.id}
                className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[16px] flex flex-col gap-[12px]"
              >
                <div className="flex justify-between items-start flex-wrap gap-2 border-b border-[#1a1a22] pb-2">
                  <div>
                    <span className="text-[#8a8a8a] text-[0.65rem] font-bold uppercase block">
                      Milestone #{ms.milestone_no}
                    </span>
                    <h4 className="text-white font-bold text-[0.9rem] m-0 mt-1">
                      {ms.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold text-[0.9rem]">
                      {ms.budget
                        ? `₹${Number(ms.budget).toLocaleString("en-IN")}`
                        : "₹0"}
                    </span>
                    <span className="text-[#8a8a8a] text-[0.68rem] block mt-1">
                      Due: {fmtDate(ms.due_date)}
                    </span>
                  </div>
                </div>

                {ms.description ? (
                  <div
                    className="ql-editor-display text-[#8a8a8a] text-[0.78rem] m-0 leading-relaxed break-words max-w-full overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: ms.description }}
                  />
                ) : (
                  <p className="text-[#8a8a8a] text-[0.78rem] m-0 leading-relaxed">
                    No milestone description provided.
                  </p>
                )}

                {/* Deliverables review block if there is deliverable */}
                {ms.deliverables && ms.deliverables.length > 0 && (
                  <div className="bg-[#121215] border border-[#1a1a22] p-[12px] rounded-[6px] flex flex-col gap-2 mt-2">
                    <span className="text-[#8a8a8a] text-[0.65rem] block uppercase font-bold tracking-[0.5px]">
                      Deliverable Submission
                    </span>
                    {ms.deliverables.map((del) => (
                      <div
                        key={del.id}
                        className="text-[0.78rem] text-gray-300 flex flex-col gap-1 border-b border-[#1c1c20] pb-2 last:border-none last:pb-0"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-white">
                            {del.title || "Submission Details"}
                          </span>
                          <span className="text-gray-500 text-[0.7rem]">
                            {fmtDate(del.submitted_at)}
                          </span>
                        </div>
                        {del.description && (
                          <p className="text-gray-400 m-0 mt-1">
                            {del.description}
                          </p>
                        )}
                        {del.submission_notes && (
                          <p className="text-gray-400 m-0 italic">
                            "{del.submission_notes}"
                          </p>
                        )}

                        {del.files && del.files.length > 0 && (
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="flex justify-between items-center bg-[#18181b] border border-[#27272a] rounded-[6px] px-[10px] py-[6px]">
                              <span className="text-gray-400 text-[0.7rem] font-bold flex items-center gap-1.5">
                                <FileArchive size={14} className="text-gray-400" />
                                Submitted Files ({del.files.length})
                              </span>
                              <button
                                onClick={() => handleDownloadZip(ms.id, del.id)}
                                className="bg-[#70d64d]/15 text-[#70d64d] hover:bg-[#70d64d]/25 border border-[#70d64d]/30 hover:border-[#70d64d]/40 rounded-[4px] px-[8px] py-[4px] text-[0.68rem] font-bold cursor-pointer transition-all flex items-center gap-[4px]"
                              >
                                <Download size={12} />
                                Download Zip
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {del.files.map((f) => (
                                <a
                                  key={f.id}
                                  href={f.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-300 hover:text-white bg-[#0e0e11] border border-[#1e1e24] hover:border-[#70d64d] text-[0.7rem] rounded-[4px] px-[8px] py-[4px] transition-all truncate max-w-[200px]"
                                  title={f.file_name}
                                >
                                  {f.file_name}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                          <div>
                            <span className="text-gray-500 text-[0.7rem]">
                              Status:{" "}
                            </span>
                            <span
                              className={`text-[0.7rem] uppercase font-bold ${del.status === "approved"
                                  ? "text-[#70d64d]"
                                  : del.status === "rejected"
                                    ? "text-red-400"
                                    : "text-amber-400"
                                }`}
                            >
                              {del.status === 'rejected' ? 'not selected' : del.status}
                            </span>
                          </div>

                          {del.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  onReviewDeliverable(ms.id, "approved")
                                }
                                className="bg-[#70d64d]/20 text-[#70d64d] border border-[#70d64d]/30 font-bold rounded-[4px] px-[8px] py-[3px] text-[0.68rem] cursor-pointer hover:bg-[#70d64d]/30"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  onReviewDeliverable(ms.id, "rejected")
                                }
                                className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-[4px] px-[8px] py-[3px] text-[0.68rem] cursor-pointer hover:bg-red-500/30"
                              >
                                Not Select
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center flex-wrap gap-3 pt-1">
                  <div className="flex gap-4 items-center">
                    <div className="text-[0.72rem]">
                      <span className="text-gray-500">Status: </span>
                      <span
                        className={`font-semibold uppercase ${ms.status === "completed"
                            ? "text-[#70d64d]"
                            : "text-amber-500"
                          }`}
                      >
                        {ms.status}
                      </span>
                    </div>
                    <div className="text-[0.72rem] flex items-center gap-1.5">
                      <span className="text-gray-500">Payment: </span>
                      <span
                        className={`font-semibold uppercase ${ms.payment_status === "paid"
                            ? "text-[#70d64d]"
                            : "text-gray-400"
                          }`}
                      >
                        {ms.payment_status}
                      </span>
                      {milestonePayment && milestonePayment.status === "paid" && (
                        <div className="flex gap-1.5 items-center ml-1">
                          <button
                            onClick={() => onViewReceipt(milestonePayment, ms.title)}
                            className="bg-[#202024] hover:bg-[#2d2d34] border border-[#2d2d34] text-[#70d64d] rounded-[4px] px-[8px] py-[3px] text-[0.68rem] font-bold cursor-pointer transition-colors flex items-center gap-1 hover:border-[#70d64d]/40"
                          >
                            <Wallet size={11} /> View Receipt
                          </button>
                          {!isProjectCompleted && (
                            <button
                              onClick={() => onEditPayment(milestonePayment)}
                              className="bg-[#202024] hover:bg-[#2d2d34] border border-[#2d2d34] text-amber-500 rounded-[4px] px-[8px] py-[3px] text-[0.68rem] font-bold cursor-pointer transition-colors flex items-center gap-1 hover:border-amber-500/40"
                            >
                              <Edit size={11} /> Edit Payment
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isProjectCompleted && (
                      <>
                        <button
                          onClick={() => onEditMilestone(ms)}
                          className="bg-[#0c0c0e] border border-[#23232a] text-[#8a8a8a] hover:text-white font-bold rounded-[6px] px-[10px] py-[5px] text-[0.72rem] cursor-pointer transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteMilestone(ms.id)}
                          className="bg-[#0c0c0e] border border-[#ef444433] text-[#ef4444] hover:bg-[#ef444411] font-bold rounded-[6px] px-[10px] py-[5px] text-[0.72rem] cursor-pointer transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}

                    {!isProjectCompleted &&
                      project.status === "assigned" &&
                      ms.status !== "completed" && (
                        <button
                          onClick={() => onCompleteMilestone(ms.id)}
                          className="bg-[#70d64d] text-black border-none font-bold rounded-[6px] px-[12px] py-[5px] text-[0.72rem] cursor-pointer hover:bg-[#8ee67b] transition-colors"
                        >
                          Mark Completed
                        </button>
                      )}

                    {!isProjectCompleted &&
                      milestonePayment &&
                      milestonePayment.status === "pending" && (
                        <button
                          onClick={() => onRecordPayment(milestonePayment)}
                          className="bg-amber-500 text-black border-none font-bold rounded-[6px] px-[12px] py-[5px] text-[0.72rem] cursor-pointer hover:bg-amber-600 transition-colors"
                        >
                          Record Payment
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

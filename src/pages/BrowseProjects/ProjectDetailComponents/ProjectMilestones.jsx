import { useState } from "react";
import {
  ClipboardList,
  Paperclip,
  Wallet,
  Download,
  FileArchive,
} from "lucide-react";
import { api } from "../../../utils/api";
import { toast } from "react-toastify";
import ConfirmDialog from "../../../components/Admin/ConfirmDialog";

export default function ProjectMilestones({
  milestones,
  isAssigned,
  project,
  isProjectCompleted,
  user,
  setSelectedMilestoneForDeliverable,
  setSelectedMilestoneForReceipt,
  setSelectedPaymentForReceipt,
  setSelectedDeliverableForEdit,
  onRefresh,
}) {
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm",
    variant: "primary",
    promptPlaceholder: "",
    defaultValue: "",
    onConfirm: () => {},
  });

  const showConfirm = ({
    title,
    message,
    type = "confirm",
    variant = "primary",
    promptPlaceholder = "",
    defaultValue = "",
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

  const handleDownloadZip = (milestoneId, deliverableId) => {
    try {
      const downloadUrl = api.getDownloadUrl(
        `/projects/milestones/deliverables/${deliverableId}/zip`,
      );
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

  const handleDeleteSubmission = (deliverableId) => {
    showConfirm({
      title: "Delete Submission",
      message:
        "Are you sure you want to delete this deliverable submission? This will permanently delete all associated files from storage.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(
            `/projects/milestones/deliverables/${deliverableId}`,
          );
          toast.success("Deliverable submission deleted successfully.");
          if (onRefresh) {
            onRefresh();
          }
        } catch (err) {
          toast.error(
            err.message || "Failed to delete deliverable submission.",
          );
        }
      },
    });
  };
  return (
    <>
      <section className="bg-[#121215] border border-[#23232a] rounded-[10px] p-6 md:p-8">
        <div className="flex items-center gap-[10px] mb-6 border-b border-[#23232a] pb-3">
          <ClipboardList size={18} className="text-[#70d64d]" />
          <h3 className="text-white font-bold text-[1rem] m-0">
            Project Milestones
          </h3>
        </div>

        {milestones.length === 0 ? (
          <p className="text-gray-500 text-[0.82rem] m-0 italic">
            No milestones defined for this project.
          </p>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6">
            {/* Vertical line running through the nodes */}
            <div className="absolute left-[9px] sm:left-[11px] top-2 bottom-2 w-[2px] bg-[#23232a]" />

            {milestones.map((milestone) => (
              <div key={milestone.id} className="relative">
                {/* Glowing Node Dot indicator */}
                <div className="absolute -left-[25px] sm:-left-[33px] top-1.5 w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] rounded-full bg-[#0c0c0e] border-2 border-[#70d64d] flex items-center justify-center text-[9px] sm:text-[10px] font-extrabold text-[#70d64d] shadow-[0_0_10px_rgba(112,214,77,0.2)] z-10">
                  {milestone.milestone_no}
                </div>

                {/* Timeline card container */}
                <div className="bg-[#0c0c0e] border border-[#23232a] hover:border-[#70d64d]/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)] rounded-[6px] p-4 flex flex-col gap-4 transition-all duration-150">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <h4 className="text-white font-bold text-sm">
                        {milestone.title}
                      </h4>
                      <div
                        className="text-gray-400 text-xs leading-relaxed ql-editor-display break-words max-w-full overflow-x-auto"
                        dangerouslySetInnerHTML={{
                          __html: milestone.description,
                        }}
                      />
                    </div>
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5 shrink-0 border-t md:border-t-0 border-[#1c1c24] pt-2 md:pt-0">
                      <span className="text-xs text-gray-500">
                        Weight:{" "}
                        <strong className="text-white font-semibold">
                          {Number(milestone.weight_percentage)}%
                        </strong>
                      </span>
                      <span className="text-sm font-extrabold text-[#70d64d]">
                        ₹{Number(milestone.budget).toLocaleString("en-IN")}
                      </span>
                      <span className="text-[#8a8a8a] text-[10px] font-semibold block mt-1">
                        Start:{" "}
                        {milestone.start_date
                          ? new Date(milestone.start_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "TBD"}
                        &nbsp;|&nbsp;
                        Due:{" "}
                        {milestone.due_date
                          ? new Date(milestone.due_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "TBD"}
                      </span>
                    </div>
                  </div>

                  {/* If the user is assigned, show additional project tracking/payment status row */}
                  {isAssigned &&
                    (() => {
                      const milestonePayment =
                        project?.milestone_payments?.find(
                          (p) => p.milestone_id === milestone.id,
                        );
                      return (
                        <div className="border-t border-[#1c1c24] pt-3.5 mt-1 space-y-3.5">
                          {/* Status and Payment indicators */}
                          <div className="flex justify-between items-center flex-wrap gap-2.5">
                            <div className="flex gap-4 items-center flex-wrap">
                              <div className="text-[11px] font-semibold flex items-center gap-1.5">
                                <span className="text-gray-500 uppercase tracking-wide">
                                  Status:
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]`}
                                  style={{
                                    backgroundColor:
                                      milestone.status === "completed"
                                        ? "#70d64d1c"
                                        : milestone.status === "rejected"
                                          ? "#ef44441c"
                                          : milestone.status === "submitted"
                                            ? "#3b82f61c"
                                            : "#f59e0b1c",
                                    color:
                                      milestone.status === "completed"
                                        ? "#70d64d"
                                        : milestone.status === "rejected"
                                          ? "#ef4444"
                                          : milestone.status === "submitted"
                                            ? "#3b82f6"
                                            : "#f59e0b",
                                  }}
                                >
                                  {milestone.status === "completed"
                                    ? "completed"
                                    : milestone.status === "rejected"
                                      ? "revision required"
                                      : milestone.status === "submitted"
                                        ? "under review"
                                        : "pending"}
                                </span>
                              </div>

                              <div className="text-[11px] font-semibold flex items-center gap-1.5">
                                <span className="text-gray-500 uppercase tracking-wide">
                                  Payment:
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px]`}
                                  style={{
                                    backgroundColor:
                                      milestone.payment_status === "paid"
                                        ? "#70d64d1c"
                                        : milestone.payment_status === "pending"
                                          ? "#f59e0b1c"
                                          : "#23232a",
                                    color:
                                      milestone.payment_status === "paid"
                                        ? "#70d64d"
                                        : milestone.payment_status === "pending"
                                          ? "#f59e0b"
                                          : "#a1a1aa",
                                  }}
                                >
                                  {milestone.payment_status || "unpaid"}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {/* Submit Deliverable Button */}
                              {!isProjectCompleted &&
                                milestone.status !== "completed" && (
                                  <button
                                    onClick={() =>
                                      setSelectedMilestoneForDeliverable(
                                        milestone,
                                      )
                                    }
                                    className="bg-[#70d64d]/10 hover:bg-[#70d64d]/20 text-[#70d64d] border border-[#70d64d]/30 font-bold rounded-[4px] px-3 py-1.5 text-xs cursor-pointer transition-colors"
                                  >
                                    {milestone.status === "rejected"
                                      ? "Re-submit Deliverable"
                                      : "Submit Deliverable"}
                                  </button>
                                )}

                              {/* View Receipt Button */}
                              {milestone.payment_status === "paid" &&
                                milestonePayment && (
                                  <button
                                    onClick={() => {
                                      setSelectedMilestoneForReceipt(milestone);
                                      setSelectedPaymentForReceipt(
                                        milestonePayment,
                                      );
                                    }}
                                    className="bg-[#202024] hover:bg-[#2d2d34] border border-[#2d2d34] text-[#70d64d] font-bold rounded-[4px] px-3 py-1.5 text-xs cursor-pointer transition-colors flex items-center gap-1 hover:border-[#70d64d]/40"
                                  >
                                    <Wallet size={12} className="shrink-0" />{" "}
                                    View Receipt
                                  </button>
                                )}
                            </div>
                          </div>

                          {/* Submissions Log (Deliverables & Reviews) */}
                          {((milestone.deliverables &&
                            milestone.deliverables.length > 0) ||
                            (milestone.reviews &&
                              milestone.reviews.length > 0)) && (
                            <div className="bg-[#121215] border border-[#1c1c24] rounded-[6px] p-3 space-y-3.5">
                              {/* Deliverables List */}
                              {milestone.deliverables &&
                                milestone.deliverables.length > 0 && (
                                  <div className="space-y-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                                      Deliverable Submissions
                                    </span>
                                    <div className="divide-y divide-[#1c1c24] space-y-3">
                                      {milestone.deliverables.map(
                                        (deliv, dIdx) => (
                                          <div
                                            key={deliv.id}
                                            className={`text-xs space-y-1.5 ${
                                              dIdx > 0 ? "pt-3" : ""
                                            }`}
                                          >
                                            <div className="flex justify-between items-center text-gray-300">
                                              <span className="font-bold text-white">
                                                {deliv.title}
                                              </span>
                                              <span className="text-[10px] text-gray-500">
                                                {new Date(
                                                  deliv.submitted_at,
                                                ).toLocaleDateString("en-IN", {
                                                  day: "numeric",
                                                  month: "short",
                                                  year: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </span>
                                            </div>
                                            <p className="text-gray-400 leading-relaxed m-0">
                                              {deliv.description}
                                            </p>
                                            {deliv.submission_notes && (
                                              <div className="bg-[#0c0c0e] border border-[#1c1c24] rounded-[4px] p-2 text-[11px] text-gray-400 font-mono whitespace-pre-wrap">
                                                <strong>Notes:</strong>{" "}
                                                {deliv.submission_notes}
                                              </div>
                                            )}
                                            {deliv.files &&
                                              deliv.files.length > 0 && (
                                                <div className="flex flex-col gap-2 mt-2">
                                                  <div className="flex justify-between items-center bg-[#18181b] border border-[#27272a] rounded-[6px] px-[10px] py-[6px]">
                                                    <span className="text-gray-400 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                                      <FileArchive
                                                        size={14}
                                                        className="text-gray-400"
                                                      />
                                                      Attachments (
                                                      {deliv.files.length})
                                                    </span>
                                                    <button
                                                      onClick={() =>
                                                        handleDownloadZip(
                                                          milestone.id,
                                                          deliv.id,
                                                        )
                                                      }
                                                      className="bg-[#70d64d]/15 text-[#70d64d] hover:bg-[#70d64d]/25 border border-[#70d64d]/30 hover:border-[#70d64d]/40 rounded-[4px] px-[8px] py-[4px] text-[10px] font-bold cursor-pointer transition-all flex items-center gap-[4px]"
                                                    >
                                                      <Download size={12} />
                                                      Download Zip
                                                    </button>
                                                  </div>
                                                  <div className="flex flex-wrap gap-2">
                                                    {deliv.files.map((f) => (
                                                      <a
                                                        key={f.id}
                                                        href={f.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-300 hover:text-white bg-[#0e0e11] border border-[#1e1e24] hover:border-[#70d64d] text-[10px] rounded-[4px] px-[8px] py-[4px] transition-all truncate max-w-[200px]"
                                                        title={f.file_name}
                                                      >
                                                        <Paperclip
                                                          size={10}
                                                          className="inline mr-1"
                                                        />
                                                        {f.file_name}
                                                      </a>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            {deliv.status !== "approved" &&
                                              deliv.submitted_by === user.id &&
                                              !isProjectCompleted && (
                                                <div className="flex justify-end gap-2 mt-2">
                                                  <button
                                                    onClick={() => {
                                                      setSelectedMilestoneForDeliverable(
                                                        milestone,
                                                      );
                                                      setSelectedDeliverableForEdit(
                                                        deliv,
                                                      );
                                                    }}
                                                    className="bg-[#202024] hover:bg-[#2d2d34] border border-[#2d2d34] hover:border-[#70d64d]/30 text-[#70d64d] hover:text-[#8ee67b] font-bold rounded-[4px] px-2.5 py-1 text-[10px] cursor-pointer transition-colors"
                                                  >
                                                    Edit Submission
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      handleDeleteSubmission(
                                                        deliv.id,
                                                      )
                                                    }
                                                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-bold rounded-[4px] px-2.5 py-1 text-[10px] cursor-pointer transition-colors"
                                                  >
                                                    Delete Submission
                                                  </button>
                                                </div>
                                              )}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Reviews List */}
                              {milestone.reviews &&
                                milestone.reviews.length > 0 && (
                                  <div className="space-y-3 border-t border-[#1c1c24] pt-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                                      Admin Feedback &amp; Reviews
                                    </span>
                                    <div className="divide-y divide-[#1c1c24] space-y-3">
                                      {milestone.reviews.map((rev, rIdx) => (
                                        <div
                                          key={rev.id}
                                          className={`text-xs space-y-1.5 ${
                                            rIdx > 0 ? "pt-3" : ""
                                          }`}
                                        >
                                          <div className="flex justify-between items-center text-gray-300">
                                            <span className="font-bold flex items-center gap-1.5">
                                              <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                  rev.status === "approved"
                                                    ? "bg-[#70d64d]"
                                                    : "bg-red-400"
                                                }`}
                                              />
                                              {rev.status === "approved"
                                                ? "Approved"
                                                : "Revision Requested"}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                              {new Date(
                                                rev.reviewed_at,
                                              ).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                          </div>
                                          {rev.comments && (
                                            <p className="text-gray-400 leading-relaxed italic m-0">
                                              "{rev.comments}"
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        {...confirmConfig}
        onCancel={() =>
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </>
  );
}

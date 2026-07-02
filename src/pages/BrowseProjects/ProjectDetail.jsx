import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "react-toastify";

// Subcomponents
import ApplyModal from "./ApplyModal";
import SubmitDeliverableModal from "./SubmitDeliverableModal";
import ViewReceiptModal from "./ViewReceiptModal";
import ProjectHeader from "./ProjectDetailComponents/ProjectHeader";
import ProjectDescription from "./ProjectDetailComponents/ProjectDescription";
import ProjectMilestones from "./ProjectDetailComponents/ProjectMilestones";
import NoDuesCard from "./ProjectDetailComponents/NoDuesCard";
import ProjectSidebar from "./ProjectDetailComponents/ProjectSidebar";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("gig_expert");
  const [selectedMilestoneForDeliverable, setSelectedMilestoneForDeliverable] =
    useState(null);
  const [selectedMilestoneForReceipt, setSelectedMilestoneForReceipt] =
    useState(null);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] =
    useState(null);
  const [selectedDeliverableForEdit, setSelectedDeliverableForEdit] =
    useState(null);

  // Get active user info from store to auto-detect role name
  const user = useAuthStore((state) => state.user) || {};
  const userRole = user.role || "gig_expert";

  useEffect(() => {
    if (userRole === "admin") {
      navigate(`/admin/projects/${id}`, { replace: true });
    }
  }, [userRole, id, navigate]);

  // Query to fetch project details from the backend API
  const {
    data: detailData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["project-detail", id],
    queryFn: () => api.get(`/projects/${id}`),
    enabled: !!id && userRole !== "admin",
  });

  const project = detailData?.project;
  const milestones = project?.milestones || [];
  const files = project?.files || [];
  const myApplication = project?.my_application;

  const activeAssignment = project?.assignments?.find(
    (asm) => asm.assigned_to_user_id === user.id && asm.status === "active",
  );
  const isAssigned = !!activeAssignment;

  const { data: noDues, refetch: refetchNoDues } = useQuery({
    queryKey: ["project-no-dues", id],
    queryFn: () => api.get(`/projects/${id}/no-dues`),
    enabled: !!id && isAssigned,
  });

  const [signMethod, setSignMethod] = useState('electronic'); // 'electronic' or 'manual'
  const [signatureFile, setSignatureFile] = useState(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [useSavedSignature, setUseSavedSignature] = useState(false);
  const [saveSignature, setSaveSignature] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    if (noDues?.saved_signature_url) {
      setUseSavedSignature(true);
    } else {
      setUseSavedSignature(false);
    }
  }, [noDues]);

  const handleSignatureChange = (e) => {
    const file = e.target.files[0] || null;
    setSignatureFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSignaturePreview(null);
    }
  };

  const handleSignNoDues = async (e) => {
    e.preventDefault();
    if (signMethod === 'electronic' && !useSavedSignature && !signatureFile) {
      toast.error("Please upload your signature file.");
      return;
    }
    if (signMethod === 'manual' && !signatureFile) {
      toast.error("Please upload the signed document.");
      return;
    }

    const formData = new FormData();
    formData.append("sign_method", signMethod);
    formData.append("use_saved_signature", useSavedSignature);
    formData.append("save_signature", saveSignature);
    if (signatureFile) {
      formData.append("signature", signatureFile);
    }

    setIsSigning(true);
    try {
      await api.postFile(`/projects/${id}/no-dues/sign`, formData);
      toast.success("No Dues Certificate signed successfully!");
      setSignatureFile(null);
      setSignaturePreview(null);
      setSaveSignature(false);
      refetchNoDues();
    } catch (err) {
      toast.error(err.message || "Failed to sign certificate.");
    } finally {
      setIsSigning(false);
    }
  };

  const handlePreviewOnDoc = async () => {
    if (signMethod === 'electronic' && !useSavedSignature && !signatureFile) {
      toast.error("Please upload your signature file first.");
      return;
    }
    const formData = new FormData();
    formData.append("use_saved_signature", useSavedSignature);
    if (signatureFile) {
      formData.append("signature", signatureFile);
    }
    setIsPreviewing(true);
    try {
      const res = await api.postFile(`/projects/${id}/no-dues/preview-sign`, formData);
      if (res.preview_url) {
        window.open(res.preview_url, '_blank');
      } else {
        toast.error("Failed to generate preview.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to generate preview.");
    } finally {
      setIsPreviewing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <div className="animate-spin w-8 h-8 border-4 border-[#70d64d] border-t-transparent rounded-full" />
        <span className="text-gray-400 text-sm">
          Loading project details...
        </span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <p className="text-red-500 font-semibold text-sm">
          Project details could not be loaded.
        </p>
        <button
          onClick={() => navigate("/projects")}
          className="bg-transparent border border-[#23232a] px-4 py-2 rounded-[6px] text-xs hover:bg-white/5 text-white transition cursor-pointer"
        >
          Back to Browse Projects
        </button>
      </div>
    );
  }

  const formattedBudget = project.budget
    ? `₹${Number(project.budget).toLocaleString("en-IN")}`
    : "Undisclosed";

  const formattedStartDate = project.start_date
    ? new Date(project.start_date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBD";

  const formattedHours = project.estimated_hours
    ? `${Number(project.estimated_hours)} hrs`
    : "TBD";

  const formattedDeadline = project.end_date
    ? new Date(project.end_date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBD";

  const isProjectCompleted = project.status?.toLowerCase() === "completed";

  const handleApplyTrigger = (role) => {
    setSelectedRole(role);
    setIsApplyOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-20 lg:pb-0">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer font-semibold text-[0.85rem] transition-colors"
        >
          <ArrowLeft size={16} /> Back to Browse Projects
        </button>
      </div>

      {/* Project Header Component */}
      <ProjectHeader
        project={project}
        formattedBudget={formattedBudget}
        formattedStartDate={formattedStartDate}
        formattedDeadline={formattedDeadline}
        formattedHours={formattedHours}
      />

      {/* Details Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] gap-[20px] items-start">
        {/* Left main column */}
        <div className="flex flex-col gap-[20px]">
          {/* No Dues Certificate Component - Rendered at top ONLY when project is completed */}
          {isProjectCompleted && (
            <NoDuesCard
              isAssigned={isAssigned}
              noDues={noDues}
              signMethod={signMethod}
              setSignMethod={setSignMethod}
              signatureFile={signatureFile}
              handleSignatureChange={handleSignatureChange}
              signaturePreview={signaturePreview}
              isSigning={isSigning}
              handleSignNoDues={handleSignNoDues}
              useSavedSignature={useSavedSignature}
              setUseSavedSignature={setUseSavedSignature}
              saveSignature={saveSignature}
              setSaveSignature={setSaveSignature}
              isPreviewing={isPreviewing}
              handlePreviewOnDoc={handlePreviewOnDoc}
            />
          )}

          {/* Project Description Component */}
          <ProjectDescription project={project} files={files} />

          {/* Project Milestones Component */}
          <ProjectMilestones
            milestones={milestones}
            isAssigned={isAssigned}
            project={project}
            isProjectCompleted={isProjectCompleted}
            user={user}
            setSelectedMilestoneForDeliverable={setSelectedMilestoneForDeliverable}
            setSelectedMilestoneForReceipt={setSelectedMilestoneForReceipt}
            setSelectedPaymentForReceipt={setSelectedPaymentForReceipt}
            setSelectedDeliverableForEdit={setSelectedDeliverableForEdit}
            onRefresh={refetch}
          />
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-[20px]">
          <ProjectSidebar
            isAssigned={isAssigned}
            activeAssignment={activeAssignment}
            project={project}
            userRole={userRole}
            myApplication={myApplication}
            isProjectCompleted={isProjectCompleted}
            handleApplyTrigger={handleApplyTrigger}
          />
        </div>
      </div>

      {isApplyOpen && (
        <ApplyModal
          project={project}
          onClose={() => setIsApplyOpen(false)}
          defaultRole={selectedRole}
          onApplied={refetch}
        />
      )}

      {selectedMilestoneForDeliverable && (
        <SubmitDeliverableModal
          milestone={selectedMilestoneForDeliverable}
          deliverableToEdit={selectedDeliverableForEdit}
          onClose={() => {
            setSelectedMilestoneForDeliverable(null);
            setSelectedDeliverableForEdit(null);
          }}
          onSubmitted={refetch}
        />
      )}

      {selectedMilestoneForReceipt && selectedPaymentForReceipt && (
        <ViewReceiptModal
          milestone={selectedMilestoneForReceipt}
          payment={selectedPaymentForReceipt}
          onClose={() => {
            setSelectedMilestoneForReceipt(null);
            setSelectedPaymentForReceipt(null);
          }}
        />
      )}

      {/* Sticky bottom CTA bar for mobile/tablet */}
      {!isAssigned && !myApplication && !isProjectCompleted && userRole !== 'admin' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#121215]/95 backdrop-blur border-t border-[#23232a] p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-[1.5px] mb-0.5">Submit Proposal</span>
            <span className="text-white text-xs font-semibold line-clamp-1">Apply for this active gig</span>
          </div>
          <button
            onClick={() => handleApplyTrigger(userRole)}
            className="bg-[#70d64d] hover:bg-[#8ee67b] text-black border-none py-[10px] px-5 rounded-[6px] text-[0.8rem] font-extrabold cursor-pointer transition-colors duration-150 shadow-[0_4px_12px_rgba(112,214,77,0.15)] whitespace-nowrap"
          >
            Apply Now
          </button>
        </div>
      )}
    </div>
  );
}

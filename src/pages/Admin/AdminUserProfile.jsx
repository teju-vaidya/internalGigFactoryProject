import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  User,
  ShieldAlert,
  Clock,
  Activity,
  FileText,
  Briefcase,
  Wallet,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "../../utils/api";
import {
  CompletionBar,
  ActivityHistoryView,
} from "../../components/AdminShared";
import { ProfileHeader } from "../../components/Profile/ProfileHeader";
import { ProfileStats } from "../../components/Profile/ProfileStats";
import { ProfileAbout } from "../../components/Profile/ProfileAbout";
import { WorkHistory } from "../../components/Profile/WorkHistory";
import { TeamStructure } from "../../components/Profile/TeamStructure";
import { CapabilityCloud } from "../../components/Profile/CapabilityCloud";
import { ServiceSpecs } from "../../components/Profile/ServiceSpecs";
import { DocumentsList } from "../../components/Profile/DocumentsList";
import { ProfileSkeleton } from "../../components/Profile/ProfileSkeleton";
import "../Profile/Profile.css";
import { useEffect } from "react";

const SERVICE_LABELS = {
  BIM: "BIM & 2D Drafting",
  Audit: "As-Built Audit",
  Peer: "Peer Review",
  BOQ: "BOQ Creation",
  Viz: "3D Visualisation",
};

const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const AdminUserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendInput, setShowSuspendInput] = useState(false);
  const [searchParams] = useSearchParams();
  const comming_from = searchParams.get("from") || "listing";
  const [expandedProposalId, setExpandedProposalId] = useState(null);

  useEffect(() => {
    if (comming_from !== "listing") {
      document.documentElement.scrollTop = 0;
    }
  }, [comming_from]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-profile", id],
    queryFn: () => api.get(`/admin/users/${id}/profile-history`),
    enabled: !!id,
  });

  const suspendMutation = useMutation({
    mutationFn: () =>
      api.post(`/admin/users/${id}/suspend`, { reason: suspendReason }),
    onSuccess: (res) => {
      toast.success(res.message || "Account suspended.");
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", id] });
      setShowSuspendInput(false);
      setSuspendReason("");
    },
    onError: (err) => {
      toast.error(err.message || "Suspension failed.");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${id}/unsuspend`),
    onSuccess: (res) => {
      toast.success(res.message || "Account reactivated.");
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", id] });
    },
    onError: (err) => {
      toast.error(err.message || "Reactivation failed.");
    },
  });

  const resetAssignmentMutation = useMutation({
    mutationFn: (projectId) => api.post(`/projects/${projectId}/reset-assignment`),
    onSuccess: (res) => {
      toast.success(res.message || "Assignment reset successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", id] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reset assignment.");
    }
  });

  const handleResetAssignment = (projectId) => {
    if (window.confirm("Are you sure you want to reset this project's assignment? This will remove the assigned gigExpert/agency, set the project status back to 'open', and restore all bids back to 'applied' status.")) {
      resetAssignmentMutation.mutate(projectId);
    }
  };

  const updateBidStatusMutation = useMutation({
    mutationFn: ({ bidId, status }) => api.put(`/projects/applications/${bidId}/status`, { status, remarks: "Updated from user profile" }),
    onSuccess: (res) => {
      toast.success(res.message || `Bid status updated.`);
      queryClient.invalidateQueries({ queryKey: ["admin-user-profile", id] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update bid status.");
    }
  });

  const handleUpdateBidStatus = (bidId, status) => {
    updateBidStatusMutation.mutate({ bidId, status });
  };

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-6 bg-transparent">
        {/* Top Navigation Skeleton */}
        <div className="flex items-center justify-between mb-6 border-b border-[#23232a] pb-4">
          <div className="skeleton-pulse w-[120px] h-4 rounded" />
          <div className="skeleton-pulse w-[80px] h-4 rounded" />
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (error || !data || !data.user) {
    return (
      <div className="p-10 text-center text-[#ef4444] bg-[#0c0c0e] min-h-[80vh]">
        <ShieldAlert size={48} className="mx-auto mb-4" />
        <h3 className="text-[1.25rem] font-extrabold mb-2 m-0">
          Failed to Load Profile
        </h3>
        <p className="text-[0.9rem] text-[#8a8a8a] mb-5">
          {error?.message || "User not found or database query failed."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-[#1c1c20] border border-[#23232a] text-white px-5 py-2.5 rounded-md cursor-pointer font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { user, assignedProjects = [], applications = [], paymentTracking = [], milestonePayments = [], registrationTracker = null, registrationHistory = [], profileDocuments = [] } = data;
  const isGigExpert = user.role === "gig_expert";
  const fp = user.gig_expert_profile || {};
  const ap = user.agency_profile || {};


  const name = isGigExpert ? user.full_name : ap.agency_name || user.full_name;
  const avatar = isGigExpert ? user.profile_photo : ap.logo;
  const subtitle = isGigExpert
    ? fp.title
    : ap.industry || "Digital Services Agency";
  const emailVal = user.email;
  const phoneVal = user.mobile;
  const locationVal = isGigExpert
    ? fp.city && fp.country
      ? `${fp.city}, ${fp.country}`
      : "Not Specified"
    : ap.city && ap.country
      ? `${ap.city}, ${ap.country}`
      : "Not Specified";
  const webVal = isGigExpert ? fp.portfolio_url : ap.website;
  const initials = getInitials(name);

  const skills = isGigExpert
    ? fp.gig_expert_skills || []
    : (ap.service_details?.selectedServices || []).map((code) => ({
        skill_name: SERVICE_LABELS[code] || code,
      }));

  const statusBg =
    user.account_status === "approved"
      ? "rgba(112,214,77,0.12)"
      : user.account_status === "suspended"
        ? "rgba(239,68,68,0.12)"
        : "rgba(245,158,11,0.12)";
  const statusColor =
    user.account_status === "approved"
      ? "#70d64d"
      : user.account_status === "suspended"
        ? "#ef4444"
        : "#f59e0b";

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 bg-transparent">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6 border-b border-[#23232a] pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-transparent border-none text-[#8a8a8a] cursor-pointer text-[0.9rem] font-bold"
        >
          <ArrowLeft size={16} /> Back to {comming_from}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] font-extrabold uppercase text-[#6b7280]">
            ADMIN VIEW
          </span>
          <span
            className="inline-flex px-2.5 py-1 rounded text-[0.7rem] font-extrabold"
            style={{ background: statusBg, color: statusColor }}
          >
            {user.account_status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#23232a] mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 bg-transparent border-none border-b-2 py-3 px-5 text-[0.9rem] font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === "profile" ? "border-[#70d64d] text-[#70d64d]" : "border-transparent text-[#8a8a8a]"}`}
        >
          <User size={16} /> Profile Information
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex items-center gap-2 bg-transparent border-none border-b-2 py-3 px-5 text-[0.9rem] font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === "projects" ? "border-[#70d64d] text-[#70d64d]" : "border-transparent text-[#8a8a8a]"}`}
        >
          <Briefcase size={16} /> Projects & Bids
        </button>
        <button
          onClick={() => setActiveTab("financials")}
          className={`flex items-center gap-2 bg-transparent border-none border-b-2 py-3 px-5 text-[0.9rem] font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === "financials" ? "border-[#70d64d] text-[#70d64d]" : "border-transparent text-[#8a8a8a]"}`}
        >
          <Wallet size={16} /> Financials & Payments
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 bg-transparent border-none border-b-2 py-3 px-5 text-[0.9rem] font-bold cursor-pointer transition-all whitespace-nowrap ${activeTab === "activity" ? "border-[#70d64d] text-[#70d64d]" : "border-transparent text-[#8a8a8a]"}`}
        >
          <Clock size={16} /> Activity History & Logs
        </button>
      </div>

      {/* Profile Details Tab */}
      {activeTab === "profile" && (
        <div className="profile-workspace-view animate-fade-in p-0 bg-transparent">
          <ProfileHeader
            isGigExpert={isGigExpert}
            name={name}
            avatar={avatar}
            subtitle={subtitle}
            emailVal={emailVal}
            phoneVal={phoneVal}
            locationVal={locationVal}
            webVal={webVal}
            foundedYear={isGigExpert ? undefined : ap.founded_year}
            initials={getInitials(name)}
            availability={isGigExpert ? fp.availability : undefined}
            hideEditButton={true}
          />

          <ProfileStats
            isGigExpert={isGigExpert}
            totalProjects={assignedProjects.length}
            hourlyRate={isGigExpert ? fp.hourly_rate : undefined}
            commercialBasis={
              isGigExpert ? fp.commercial_basis : ap.commercial_basis
            }
            employeeCount={isGigExpert ? undefined : ap.employee_count}
          />

          {/* Section-wise detailed profile cards matching mockup in a Pinterest-like balanced 2-column grid */}
          <div className="profile-sections-grid mt-5">
            {/* Left Column */}
            <div className="profile-grid-column">
              {/* Card 1: ABOUT ME / AGENCY DESCRIPTION */}
              <ProfileAbout
                isGigExpert={isGigExpert}
                bio={isGigExpert ? fp.bio : undefined}
                description={isGigExpert ? undefined : ap.description}
              />

              {/* Card 2: EXPERIENCE / TEAM STRUCTURE / PROJECTS */}
              {isGigExpert ? (
                <WorkHistory 
                  workHistory={fp.work_history || []} 
                  platformProjects={(assignedProjects || []).filter(p => ['completed', 'active', 'assigned'].includes(p.status))}
                />
              ) : (
                <>
                  <TeamStructure
                    teamMembers={ap.team_members || []}
                    employeeCount={ap.employee_count}
                  />
                  <WorkHistory 
                    workHistory={null} 
                    platformProjects={(assignedProjects || []).filter(p => ['completed', 'active', 'assigned'].includes(p.status))}
                  />
                </>
              )}

              {/* Card 3: PERSONAL & CONTACT */}
              <div className="profile-section-card">
                <h3 className="profile-section-card-title">Personal & Contact</h3>
                <div className="profile-section-row">
                  <span className="profile-section-label">Email:</span>
                  <span className="profile-section-value">{emailVal || 'N/A'}</span>
                </div>
                <div className="profile-section-row">
                  <span className="profile-section-label">Mobile:</span>
                  <span className="profile-section-value">{phoneVal || 'N/A'}</span>
                </div>
                <div className="profile-section-row">
                  <span className="profile-section-label">Designation:</span>
                  <span className="profile-section-value">
                    {isGigExpert ? (fp.title || 'N/A') : (ap.designation || 'N/A')}
                  </span>
                </div>
                <div className="profile-section-row">
                  <span className="profile-section-label">Location:</span>
                  <span className="profile-section-value">{locationVal || 'Not Specified'}</span>
                </div>
                {isGigExpert ? (
                  fp.linkedin_url && (
                    <div className="profile-section-row">
                      <span className="profile-section-label">LinkedIn:</span>
                      <span className="profile-section-value">
                        <a href={fp.linkedin_url} target="_blank" rel="noopener noreferrer">View Profile</a>
                      </span>
                    </div>
                  )
                ) : (
                  ap.linkedin_url && (
                    <div className="profile-section-row">
                      <span className="profile-section-label">LinkedIn:</span>
                      <span className="profile-section-value">
                        <a href={ap.linkedin_url} target="_blank" rel="noopener noreferrer">View Profile</a>
                      </span>
                    </div>
                  )
                )}
                {!isGigExpert && ap.website && (
                  <div className="profile-section-row">
                    <span className="profile-section-label">Website:</span>
                    <span className="profile-section-value">
                      <a href={ap.website} target="_blank" rel="noopener noreferrer">View Website</a>
                    </span>
                  </div>
                )}
              </div>

              {/* Card 4: LEGAL & IDENTIFICATION */}
              <div className="profile-section-card">
                <h3 className="profile-section-card-title">Legal & Identification</h3>
                {isGigExpert ? (
                  <>
                    <div className="profile-section-row">
                      <span className="profile-section-label">Registered Name:</span>
                      <span className="profile-section-value">{fp.legal_name_pan || 'N/A'}</span>
                    </div>
                   
                    <div className="profile-section-row">
                      <span className="profile-section-label">Personal PAN:</span>
                      <span className="profile-section-value uppercase">{fp.personal_pan || 'N/A'}</span>
                    </div>
             
                  </>
                ) : (
                  <>
                    <div className="profile-section-row">
                      <span className="profile-section-label">Registered Name:</span>
                      <span className="profile-section-value">{ap.agency_name || 'N/A'}</span>
                    </div>
                    <div className="profile-section-row">
                      <span className="profile-section-label">Auth. Person:</span>
                      <span className="profile-section-value">{user.full_name || 'N/A'}</span>
                    </div>
                    <div className="profile-section-row">
                      <span className="profile-section-label">Company PAN:</span>
                      <span className="profile-section-value uppercase">{ap.company_pan || 'N/A'}</span>
                    </div>
                    <div className="profile-section-row">
                      <span className="profile-section-label">GSTIN:</span>
                      <span className="profile-section-value uppercase">{ap.gst_number || 'N/A'}</span>
                    </div>
                    <div className="profile-section-row">
                      <span className="profile-section-label">CIN:</span>
                      <span className="profile-section-value uppercase">{ap.cin || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="profile-grid-column">

              {/* Card 1: PROFILE DOCUMENTS */}
              <DocumentsList   role={user.role}
                isGigExpert={isGigExpert}
                resumeUrl={fp.resume_url||fp.portfolio_url }
                portfolioPdfUrl={fp.portfolio_pdf_url || ap.portfolio_pdf_url}
                verifications={user.verifications}
                documents={profileDocuments}
                isAdmin={true}
              />

              {/* Card 2: SERVICES & CAPABILITY */}
              <div className="profile-section-card">
                <h3 className="profile-section-card-title">Services & Capability</h3>
                <div className="flex flex-wrap gap-[6px] mb-[12px]">
                  {((isGigExpert ? fp.service_details?.selectedServices : ap.service_details?.selectedServices) || []).length > 0 ? (
                    ((isGigExpert ? fp.service_details?.selectedServices : ap.service_details?.selectedServices) || []).map(srv => (
                      <span key={srv} className="bg-[#1e293b] text-[#38bdf8] text-[0.72rem] font-semibold px-[8px] py-[3px] rounded-[4px]">
                        {SERVICE_LABELS[srv] || srv}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-[0.8rem]">No services selected.</span>
                  )}
                </div>
              
              </div>
              <div className="profile-section-card">
                <h3 className="profile-section-card-title">Commercial Rates</h3>
                <div className="profile-section-row">
                  <span className="profile-section-label">Base Rate:</span>
                  <span className="profile-section-value font-bold text-[#b5ff14]">
                    {isGigExpert 
                      ? (fp.hourly_rate ? `INR ${fp.hourly_rate}` : 'Not Specified')
                      : ((isGigExpert ? fp.commercial_basis : ap.commercial_basis) ? 'Project/Contract rate' : 'N/A')}
                  </span>
                </div>
                <div className="profile-section-row">
                  <span className="profile-section-label">Billing Basis:</span>
                  <span className="profile-section-value">
                    {isGigExpert ? 'Hourly' : 'Project-based'}
                  </span>
                </div>
                <div className="profile-section-row">
                  <span className="profile-section-label">Commercial Basis:</span>
                  <span className="profile-section-value">
                    {(isGigExpert ? fp.commercial_basis : ap.commercial_basis) || (isGigExpert ? 'Hourly Rate' : 'N/A')}
                  </span>
                </div>
              </div>

              {/* Card 4: AVAILABILITY & SIGN-OFF */}
              <div className="profile-section-card">
                <h3 className="profile-section-card-title">Availability & Sign-Off</h3>
                <div className="profile-section-row">
                  <span className="profile-section-label">Availability:</span>
                  <span className="profile-section-value">
                    {isGigExpert 
                      ? (fp.availability === 'AVAILABLE' ? 'Immediate / Full-time' : fp.availability || 'Project basis') 
                      : 'Project basis'}
                  </span>
                </div>
                <div className="profile-section-row">
                  <span className="profile-section-label">Notice Period:</span>
                  <span className="profile-section-value">{isGigExpert ? fp.notice_period : ap.notice_period || 'N/A'}</span>
                </div>
                <div className="profile-section-row">
                  <span className="profile-section-label">Team Size:</span>
                  <span className="profile-section-value">
                    {isGigExpert ? 'Individual / 1 member' : `${ap.employee_count || 0} employees`}
                  </span>
                </div>
              
               
              </div>

              {/* Card 5: Account Suspension Panel */}
              <div className="bg-[#1c0c0e] border border-[#ef4444]/20 rounded-lg p-[18px]">
                <h4 className="text-[0.72rem] font-extrabold uppercase tracking-[0.6px] text-[#ef4444] mb-3.5 pb-1.5 border-b border-[#ef4444]/10 m-0">
                  Account Management (Admin Controls)
                </h4>
                {user.account_status === "suspended" ? (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-[#ef4444] text-[0.8rem] m-0">
                      This account is currently suspended.
                    </p>
                    <button
                      disabled={reactivateMutation.isPending}
                      onClick={() => reactivateMutation.mutate()}
                      className="bg-[#70d64d] text-black border-none rounded-md p-2.5 text-[0.8rem] font-extrabold cursor-pointer text-center w-full"
                    >
                      {reactivateMutation.isPending
                        ? "Reactivating..."
                        : "REACTIVATE ACCOUNT"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {!showSuspendInput ? (
                      <button
                        onClick={() => setShowSuspendInput(true)}
                        className="bg-transparent border border-[#ef4444] text-[#ef4444] rounded-md p-2.5 text-[0.8rem] font-extrabold cursor-pointer text-center w-full"
                      >
                        SUSPEND ACCOUNT
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Reason for suspension..."
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          className="bg-black border border-[#ef4444] rounded-md py-2 px-3 text-white text-[0.8rem] outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowSuspendInput(false)}
                            className="flex-1 bg-[#1c1c20] border border-[#23232a] text-[#8a8a8a] rounded-md p-2 text-[0.75rem] font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={suspendMutation.isPending}
                            onClick={() => {
                              if (!suspendReason.trim()) {
                                toast.error(
                                  "Please enter a suspension reason.",
                                );
                                return;
                              }
                              suspendMutation.mutate();
                            }}
                            className="flex-1 bg-[#ef4444] text-white border-none rounded-md p-2 text-[0.75rem] font-bold cursor-pointer"
                          >
                            {suspendMutation.isPending
                              ? "Suspending..."
                              : "Confirm Suspend"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects & Bids tab */}
      {activeTab === "projects" && (
        <div className="animate-fade-in flex flex-col gap-6">
          {/* Assigned Projects */}
          <div className="bg-[#121215] border border-[#23232a] rounded-[10px] overflow-hidden">
            <div className="p-4 border-b border-[#23232a] bg-[#0c0c0e] flex justify-between items-center">
              <h3 className="text-[0.9rem] font-extrabold uppercase tracking-[0.6px] text-[#70d64d] m-0">
                Assigned Projects
              </h3>
              <span className="text-[0.75rem] font-bold text-gray-500 bg-[#1c1c20] px-2.5 py-0.5 rounded">
                {assignedProjects.length} Total
              </span>
            </div>
            {assignedProjects.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[0.85rem]">
                No projects assigned to this user yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#0c0c0e] border-b border-[#23232a]">
                      {['Project Details', 'Priority & Type', 'Assigned Amount', 'Timeline', 'Progress', 'Assignment Status', 'Actions'].map(h => (
                        <th key={h} className="text-gray-500 text-[0.65rem] font-bold px-4 py-3 tracking-[0.6px] uppercase whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assignedProjects.map(p => {
                      const proj = p.project || {};
                      return (
                        <tr key={p.id} className="transition-colors hover:bg-[#181820] border-b border-[#1a1a22]">
                          <td className="p-4">
                            <div className="flex flex-col">
                              <a
                                href={`/admin/projects/${proj.id}`}
                                className="text-white hover:text-[#70d64d] font-bold text-[0.85rem] flex items-center gap-1.5 transition-colors"
                              >
                                {proj.title} <ExternalLink size={12} className="opacity-60" />
                              </a>
                              <span className="text-gray-500 text-[0.7rem] font-semibold mt-0.5">{proj.project_code || "N/A"}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-white text-[0.78rem] capitalize font-medium">{proj.project_type || "fixed"}</span>
                              <span className={`text-[0.6rem] font-extrabold px-1.5 py-0.5 rounded self-start uppercase ${
                                proj.priority === 'high' ? 'bg-red-500/10 text-red-400' : proj.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'
                              }`}>
                                {proj.priority || 'medium'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[#70d64d] font-bold text-[0.82rem]">
                              {p.assigned_amount ? `₹${Number(p.assigned_amount).toLocaleString('en-IN')}` : proj.budget ? `₹${Number(proj.budget).toLocaleString('en-IN')}` : '—'}
                            </span>
                          </td>
                          <td className="p-4 text-[0.75rem] text-[#8a8a8a]">
                            <div className="flex flex-col gap-0.5">
                              <span><span className="text-gray-600 font-semibold text-[0.62rem] uppercase mr-1">Start:</span>{proj.start_date ? new Date(proj.start_date).toLocaleDateString('en-IN') : '—'}</span>
                              <span><span className="text-gray-600 font-semibold text-[0.62rem] uppercase mr-1">End:</span>{proj.end_date ? new Date(proj.end_date).toLocaleDateString('en-IN') : '—'}</span>
                            </div>
                          </td>
                          <td className="p-4 min-w-[120px]">
                            <CompletionBar value={proj.progress_percentage || 0} label="Progress" />
                          </td>
                          <td className="p-4">
                            <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase ${
                              p.status === 'active' ? 'bg-[#70d64d]/10 text-[#70d64d]' : p.status === 'completed' ? 'bg-sky-500/10 text-sky-400' : 'bg-gray-500/10 text-gray-400'
                            }`}>
                              {p.status || 'active'}
                            </span>
                          </td>
                          <td className="p-4">
                            {p.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleResetAssignment(proj.id)}
                                className="bg-transparent border border-[#ef4444]/40 hover:bg-[#ef4444]/10 text-[#ef4444] text-[0.7rem] px-2.5 py-1 rounded font-bold cursor-pointer transition-all"
                              >
                                Reset Assignment
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Project Applications & Bids */}
          <div className="bg-[#121215] border border-[#23232a] rounded-[10px] overflow-hidden">
            <div className="p-4 border-b border-[#23232a] bg-[#0c0c0e] flex justify-between items-center">
              <h3 className="text-[0.9rem] font-extrabold uppercase tracking-[0.6px] text-[#38bdf8] m-0">
                Project Applications & Bids
              </h3>
              <span className="text-[0.75rem] font-bold text-gray-500 bg-[#1c1c20] px-2.5 py-0.5 rounded">
                {applications.length} Submitted
              </span>
            </div>
            {applications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-[0.85rem]">
                No bids submitted by this user yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#0c0c0e] border-b border-[#23232a]">
                      {['Project Details', 'Bid Details', 'Submitted At', 'Status', 'Proposal', 'Actions'].map(h => (
                        <th key={h} className="text-gray-500 text-[0.65rem] font-bold px-4 py-3 tracking-[0.6px] uppercase whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => {
                      const proj = app.project || {};
                      const isExpanded = expandedProposalId === app.id;
                      return (
                        <React.Fragment key={app.id}>
                          <tr className="transition-colors hover:bg-[#181820] border-b border-[#1a1a22]">
                            <td className="p-4">
                              <div className="flex flex-col">
                                <a
                                  href={`/admin/projects/${proj.id}`}
                                  className="text-white hover:text-[#38bdf8] font-bold text-[0.85rem] flex items-center gap-1.5 transition-colors"
                                >
                                  {proj.title} <ExternalLink size={12} className="opacity-60" />
                                </a>
                                <span className="text-gray-500 text-[0.7rem] font-semibold mt-0.5">{proj.project_code || "N/A"}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-[0.8rem]">
                                  ₹{Number(app.bid_amount).toLocaleString('en-IN')}
                                </span>
                                <span className="text-gray-400 text-[0.7rem] mt-0.5">{app.estimated_days} days delivery</span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-400 text-[0.78rem]">
                              {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="p-4">
                              <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase ${
                                app.status === 'accepted' ? 'bg-[#70d64d]/12 text-[#70d64d]' : app.status === 'rejected' ? 'bg-red-500/12 text-red-400' : app.status === 'shortlisted' ? 'bg-amber-500/12 text-amber-400' : 'bg-gray-500/12 text-gray-400'
                              }`}>
                                {app.status === 'rejected' ? 'not selected' : (app.status || 'applied')}
                              </span>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => setExpandedProposalId(isExpanded ? null : app.id)}
                                className="bg-[#1c1c20] border border-[#23232a] text-white hover:text-[#38bdf8] px-2.5 py-1 rounded text-[0.72rem] font-bold cursor-pointer transition-all flex items-center gap-1"
                              >
                                {isExpanded ? "Hide" : "Read Proposal"} {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {app.status === 'applied' || app.status === 'pending' || app.status === 'reviewed' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBidStatus(app.id, 'shortlisted')}
                                      className="bg-transparent border border-amber-500/40 hover:bg-amber-500/10 text-amber-400 text-[0.65rem] px-2 py-0.5 rounded font-bold cursor-pointer transition-all"
                                    >
                                      Shortlist
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBidStatus(app.id, 'rejected')}
                                      className="bg-transparent border border-[#ef4444]/40 hover:bg-[#ef4444]/10 text-[#ef4444] text-[0.65rem] px-2 py-0.5 rounded font-bold cursor-pointer transition-all"
                                    >
                                      Not Select
                                    </button>
                                  </>
                                ) : app.status === 'accepted' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#70d64d] text-[0.7rem] font-bold">Assigned</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Revoke assignment for this project? This will remove the current assignee, set the project back to "open", and reset all bids to "pending" so you can approve a different person.`)) {
                                          resetAssignmentMutation.mutate(proj.id);
                                        }
                                      }}
                                      disabled={resetAssignmentMutation.isPending}
                                      className="bg-transparent border border-[#ef4444]/40 hover:bg-[#ef4444]/10 text-[#ef4444] text-[0.65rem] px-2 py-0.5 rounded font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Revoke this assignment so you can approve a different bidder"
                                    >
                                      {resetAssignmentMutation.isPending ? 'Revoking...' : 'Revoke Assignment'}
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBidStatus(app.id, 'pending')}
                                      className="bg-transparent border border-gray-500/40 hover:bg-gray-500/10 text-gray-400 text-[0.65rem] px-2 py-0.5 rounded font-bold cursor-pointer transition-all"
                                      title="Reset bid status to Pending"
                                    >
                                      Reset Decision
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBidStatus(app.id, 'shortlisted')}
                                      className="bg-transparent border border-amber-500/40 hover:bg-amber-500/10 text-amber-400 text-[0.65rem] px-2 py-0.5 rounded font-bold cursor-pointer transition-all"
                                    >
                                      Shortlist
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateBidStatus(app.id, 'rejected')}
                                      className="bg-transparent border border-[#ef4444]/40 hover:bg-[#ef4444]/10 text-[#ef4444] text-[0.65rem] px-2 py-0.5 rounded font-bold cursor-pointer transition-all"
                                    >
                                      Not Select
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="bg-[#0e0e11] p-4 border-b border-[#1a1a22]">
                                <div className="text-[0.8rem] text-gray-300 leading-relaxed max-w-[900px] whitespace-pre-wrap">
                                  <div className="text-[0.68rem] uppercase font-bold text-gray-500 mb-2 tracking-wider">Proposal Text:</div>
                                  {app.proposal || "No proposal text provided."}
                                  {app.cover_letter && (
                                    <div className="mt-4 border-t border-[#1a1a22] pt-3">
                                      <div className="text-[0.68rem] uppercase font-bold text-gray-500 mb-2 tracking-wider">Cover Letter:</div>
                                      {app.cover_letter}
                                    </div>
                                  )}
                                  {app.attachment_url && (
                                    <div className="mt-3">
                                      <a
                                        href={app.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-[#38bdf8] hover:underline font-bold text-[0.75rem]"
                                      >
                                        View Attachment <ExternalLink size={12} />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financials & Payments tab */}
      {activeTab === "financials" && (() => {
        const totalContractValue = assignedProjects.reduce((acc, p) => acc + Number(p.assigned_amount || 0), 0);
        const totalReceived = paymentTracking.reduce((acc, p) => acc + Number(p.received_payment || 0), 0);
        const totalPending = paymentTracking.reduce((acc, p) => acc + Number(p.pending_payment || 0), 0);

        return (
          <div className="animate-fade-in flex flex-col gap-6">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-5">
                <span className="text-[0.68rem] text-gray-500 font-extrabold uppercase tracking-wider block">Total Contract Value</span>
                <h2 className="text-[1.8rem] font-extrabold text-[#70d64d] mt-2 mb-0">₹{totalContractValue.toLocaleString('en-IN')}</h2>
                <p className="text-[0.72rem] text-gray-500 mt-1 mb-0">Across {assignedProjects.length} assigned projects</p>
              </div>
              <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-5">
                <span className="text-[0.68rem] text-gray-500 font-extrabold uppercase tracking-wider block">Total Received</span>
                <h2 className="text-[1.8rem] font-extrabold text-[#38bdf8] mt-2 mb-0">₹{totalReceived.toLocaleString('en-IN')}</h2>
                <p className="text-[0.72rem] text-gray-500 mt-1 mb-0">Successfully released payments</p>
              </div>
              <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-5">
                <span className="text-[0.68rem] text-gray-500 font-extrabold uppercase tracking-wider block">Pending Balance</span>
                <h2 className="text-[1.8rem] font-extrabold text-amber-400 mt-2 mb-0">₹{totalPending.toLocaleString('en-IN')}</h2>
                <p className="text-[0.72rem] text-gray-500 mt-1 mb-0">Awaiting release or completion</p>
              </div>
            </div>

            {/* Project Financial Tracking */}
            <div className="bg-[#121215] border border-[#23232a] rounded-[10px] overflow-hidden">
              <div className="p-4 border-b border-[#23232a] bg-[#0c0c0e] flex justify-between items-center">
                <h3 className="text-[0.9rem] font-extrabold uppercase tracking-[0.6px] text-[#70d64d] m-0">
                  Project-wise Financial Tracking
                </h3>
                <span className="text-[0.75rem] font-bold text-gray-500 bg-[#1c1c20] px-2.5 py-0.5 rounded">
                  {paymentTracking.length} Projects Tracked
                </span>
              </div>
              {paymentTracking.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-[0.85rem]">
                  No project financials tracked for this user.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#0c0c0e] border-b border-[#23232a]">
                        {['Project Details', 'Payment Type', 'Received Payment', 'Pending Payment', 'Total Value', 'Status'].map(h => (
                          <th key={h} className="text-gray-500 text-[0.65rem] font-bold px-4 py-3 tracking-[0.6px] uppercase whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paymentTracking.map(pt => {
                        const proj = pt.project || {};
                        return (
                          <tr key={pt.id} className="transition-colors hover:bg-[#181820] border-b border-[#1a1a22]">
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-[0.85rem]">{proj.title || "N/A"}</span>
                                <span className="text-gray-500 text-[0.7rem] font-semibold mt-0.5">{proj.project_code || "N/A"}</span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-300 text-[0.8rem] capitalize">
                              {pt.payment_type || "milestone"}
                            </td>
                            <td className="p-4 text-[#38bdf8] font-bold text-[0.82rem]">
                              ₹{Number(pt.received_payment || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-4 text-amber-400 font-bold text-[0.82rem]">
                              ₹{Number(pt.pending_payment || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-4 text-white font-bold text-[0.82rem]">
                              ₹{Number(pt.total_payment || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-4">
                              <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase ${
                                pt.payment_satus?.toLowerCase() === 'paid' || pt.payment_satus?.toLowerCase() === 'completed' || pt.payment_satus?.toLowerCase() === 'received'
                                  ? 'bg-[#70d64d]/10 text-[#70d64d]'
                                  : pt.payment_satus?.toLowerCase() === 'pending'
                                    ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-gray-500/10 text-gray-400'
                              }`}>
                                {pt.payment_satus || 'pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Milestone Payout Transactions */}
            <div className="bg-[#121215] border border-[#23232a] rounded-[10px] overflow-hidden">
              <div className="p-4 border-b border-[#23232a] bg-[#0c0c0e] flex justify-between items-center">
                <h3 className="text-[0.9rem] font-extrabold uppercase tracking-[0.6px] text-[#c084fc] m-0">
                  Milestone Payout Transactions
                </h3>
                <span className="text-[0.75rem] font-bold text-gray-500 bg-[#1c1c20] px-2.5 py-0.5 rounded">
                  {milestonePayments.length} Transactions
                </span>
              </div>
              {milestonePayments.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-[0.85rem]">
                  No milestone payout transactions found for this user.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#0c0c0e] border-b border-[#23232a]">
                        {['Milestone & Project', 'Amount', 'Method & Reference', 'Release Date', 'Status', 'Remarks'].map(h => (
                          <th key={h} className="text-gray-500 text-[0.65rem] font-bold px-4 py-3 tracking-[0.6px] uppercase whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {milestonePayments.map(mp => {
                        const proj = mp.projects || {};
                        const mil = mp.project_milestones || {};
                        return (
                          <tr key={mp.id} className="transition-colors hover:bg-[#181820] border-b border-[#1a1a22]">
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-[0.82rem]">{mil.title || `Milestone #${mil.milestone_no || ''}`}</span>
                                <span className="text-gray-500 text-[0.7rem] mt-0.5">{proj.title || "N/A"} ({proj.project_code || "N/A"})</span>
                              </div>
                            </td>
                            <td className="p-4 text-[#70d64d] font-bold text-[0.82rem]">
                              ₹{Number(mp.amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-white text-[0.78rem] font-semibold">{mp.payment_method || "N/A"}</span>
                                <span className="text-gray-500 text-[0.68rem] font-mono mt-0.5">{mp.transaction_reference || "N/A"}</span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-400 text-[0.78rem]">
                              {mp.payment_date ? new Date(mp.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="p-4">
                              <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase ${
                                mp.status?.toLowerCase() === 'paid' || mp.status?.toLowerCase() === 'completed' || mp.status?.toLowerCase() === 'released'
                                  ? 'bg-[#70d64d]/10 text-[#70d64d]'
                                  : mp.status?.toLowerCase() === 'failed'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-amber-500/10 text-amber-400'
                              }`}>
                                {mp.status || 'pending'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400 text-[0.78rem]">
                              {mp.remarks || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Activity tab */}
      {activeTab === "activity" && (
        <div className="animate-fade-in">
          <ActivityHistoryView id={user.id} />
        </div>
      )}
    </div>
  );
};

export default AdminUserProfile;

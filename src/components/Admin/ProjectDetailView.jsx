import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import EditProjectModal from './EditProjectModal';
import MilestoneModal from './MilestoneModal';
import ConfirmDialog from './ConfirmDialog';

// Subcomponents
import AdminProjectHeader from '../../pages/BrowseProjects/ProjectDetailComponents/AdminProjectHeader';
import AdminProjectDescription from '../../pages/BrowseProjects/ProjectDetailComponents/AdminProjectDescription';
import AdminProjectMilestones from '../../pages/BrowseProjects/ProjectDetailComponents/AdminProjectMilestones';
import AdminNoDuesCard from '../../pages/BrowseProjects/ProjectDetailComponents/AdminNoDuesCard';
import AdminBidsCard from '../../pages/BrowseProjects/ProjectDetailComponents/AdminBidsCard';
import AdminProjectSidebar from '../../pages/BrowseProjects/ProjectDetailComponents/AdminProjectSidebar';

// Modals
import RecordPaymentModal from '../../pages/BrowseProjects/ProjectDetailComponents/RecordPaymentModal';
import EditPaymentModal from '../../pages/BrowseProjects/ProjectDetailComponents/EditPaymentModal';
import ViewPaymentModal from '../../pages/BrowseProjects/ProjectDetailComponents/ViewPaymentModal';
import ViewProposalModal from '../../pages/BrowseProjects/ProjectDetailComponents/ViewProposalModal';
import InitiateNoDuesModal from '../../pages/BrowseProjects/ProjectDetailComponents/InitiateNoDuesModal';

export default function ProjectDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');
  const comming_from = searchParams.get('from') || 'all+projects';

  const queryClient = useQueryClient();

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    variant: 'primary',
    promptPlaceholder: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  const showConfirm = ({
    title,
    message,
    type = 'confirm',
    variant = 'primary',
    confirmText,
    cancelText,
    promptPlaceholder = '',
    defaultValue = '',
    onConfirm,
    onCancel,
  }) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      type,
      variant,
      confirmText,
      cancelText,
      promptPlaceholder,
      defaultValue,
      onConfirm: async (val) => {
        if (onConfirm) await onConfirm(val);
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ['admin-project-detail', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.project),
    enabled: !!id
  });

  const { data: noDues, refetch: refetchNoDues } = useQuery({
    queryKey: ['admin-project-no-dues', id],
    queryFn: () => api.get(`/projects/${id}/no-dues`),
    enabled: !!id
  });

  const handleApprove = (appId) => {
    showConfirm({
      title: 'Approve Bid & Assign Project',
      message: 'Are you sure you want to approve this application and assign the project? All other bids will be auto-rejected.',
      onConfirm: async () => {
        try {
          await api.post(`/projects/applications/${appId}/approve`, { remarks: 'Approved from details portal' });
          toast.success('Bid approved and project assigned!');
          queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        } catch (err) {
          toast.error(err.message || 'Approval failed');
        }
      }
    });
  };

  const handleReject = (appId) => {
    showConfirm({
      title: 'Reject Bid',
      message: 'Are you sure you want to reject this bid?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.put(`/projects/applications/${appId}/status`, { status: 'rejected', remarks: 'Rejected from details portal' });
          toast.success('Bid rejected successfully.');
          queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        } catch (err) {
          toast.error(err.message || 'Not selecting failed');
        }
      }
    });
  };

  const handleResetAssignment = () => {
    showConfirm({
      title: 'Revoke Project Assignment',
      message: 'This will remove the current assignee, set the project back to "open", and reset all bids to "applied" status so you can approve a different person.',
      variant: 'danger',
      confirmText: 'Revoke Assignment',
      onConfirm: async () => {
        try {
          await api.post(`/projects/${id}/reset-assignment`);
          toast.success('Assignment revoked. Project is now open for re-assignment.');
          queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        } catch (err) {
          toast.error(err.message || 'Failed to reset assignment.');
        }
      }
    });
  };

  const handleChangeBidStatus = (appId, newStatus, label) => {
    showConfirm({
      title: `Change Bid Status to "${label}"`,
      message: `Are you sure you want to change this bid's status to "${label}"?`,
      variant: newStatus === 'rejected' ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          await api.put(`/projects/applications/${appId}/status`, { status: newStatus, remarks: `Status changed to ${newStatus} from project details` });
          toast.success(`Bid status updated to ${label}.`);
          queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        } catch (err) {
          toast.error(err.message || 'Failed to update bid status.');
        }
      }
    });
  };

  const handleCompleteMilestone = (milestoneId) => {
    showConfirm({
      title: 'Mark Milestone Completed',
      message: 'Are you sure you want to mark this milestone as completed? This will trigger pending payments.',
      variant: 'success',
      onConfirm: async () => {
        try {
          await api.post(`/projects/milestones/${milestoneId}/complete`);
          toast.success('Milestone marked as completed!');
          queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        } catch (err) {
          toast.error(err.message || 'Action failed');
        }
      }
    });
  };

  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isViewPaymentModalOpen, setIsViewPaymentModalOpen] = useState(false);
  const [paymentDetailsToView, setPaymentDetailsToView] = useState(null);
  const [viewingMilestoneTitle, setViewingMilestoneTitle] = useState('');
  const [selectedBidForProposal, setSelectedBidForProposal] = useState(null);

  // New edit payment states
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // No Dues states
  const [isNoDuesModalOpen, setIsNoDuesModalOpen] = useState(false);

  // Disable background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isEditProjectOpen || isMilestoneModalOpen || isPaymentModalOpen || isViewPaymentModalOpen || isEditPaymentModalOpen || !!selectedBidForProposal || isNoDuesModalOpen;
    if (isAnyModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isEditProjectOpen, isMilestoneModalOpen, isPaymentModalOpen, isViewPaymentModalOpen, isEditPaymentModalOpen, selectedBidForProposal, isNoDuesModalOpen]);

  const handleDeleteDocument = (fileId) => {
    showConfirm({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this supporting document?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/projects/files/${fileId}`);
          toast.success('Document deleted successfully!');
          queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
        } catch (err) {
          toast.error(err.message || 'Failed to delete document.');
        }
      }
    });
  };

  const handleSaveProject = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
  };

  const handleDeleteProject = () => {
    showConfirm({
      title: 'Delete Project',
      message: 'WARNING: Are you sure you want to delete this project? This will permanently delete the project and all related milestones, assignments, bids, and payments. This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/projects/${id}`);
          toast.success('Project deleted successfully.');
          navigate('/admin/projects');
          queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        } catch (err) {
          toast.error(err.message || 'Failed to delete project.');
        }
      }
    });
  };

  const handleMilestoneSave = async (payload) => {
    const otherMilestones = editingMilestone
      ? (project.milestones || []).filter(m => m.id !== editingMilestone.id)
      : (project.milestones || []);
    const otherBudgetsSum = otherMilestones.reduce((sum, m) => sum + (Number(m.budget || m.amount) || 0), 0);
    const newMilestoneBudget = Number(payload.budget || payload.amount) || 0;
    const totalMilestoneBudget = otherBudgetsSum + newMilestoneBudget;
    const projectBudget = Number(project.budget) || 0;

    const executeSave = async () => {
      try {
        if (editingMilestone) {
          await api.put(`/projects/milestones/${editingMilestone.id}`, payload);
          toast.success('Milestone updated successfully!');
        } else {
          await api.post(`/projects/${id}/milestones`, payload);
          toast.success('Milestone created successfully!');
        }
        setIsMilestoneModalOpen(false);
        setEditingMilestone(null);
        queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
        queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      } catch (err) {
        toast.error(err.message || 'Failed to save milestone.');
      }
    };

    if (totalMilestoneBudget > projectBudget) {
      showConfirm({
        title: 'Budget Validation Warning',
        message: `The sum of milestone budgets ($${totalMilestoneBudget}) exceeds the project budget ($${projectBudget}). Do you want to enforce this budget validation constraint (selecting 'Yes' will block saving so you can edit the budgets, while selecting 'No' will bypass this check and save)?`,
        variant: 'warning',
        confirmText: 'Yes, Enforce & Edit',
        cancelText: 'No, Bypass & Save',
        onConfirm: () => {
          toast.warn('Please adjust the milestone budget.');
        },
        onCancel: () => {
          executeSave();
        }
      });
    } else {
      await executeSave();
    }
  };

  const handleDeleteMilestone = (milestoneId) => {
    showConfirm({
      title: 'Delete Milestone',
      message: 'Are you sure you want to delete this milestone? Associated deliverable submissions and payment logs will be removed.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/projects/milestones/${milestoneId}`);
          toast.success('Milestone deleted successfully!');
          queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        } catch (err) {
          toast.error(err.message || 'Failed to delete milestone.');
        }
      }
    });
  };

  const handleReviewDeliverable = (milestoneId, status) => {
    showConfirm({
      title: `Submit Review Remarks`,
      message: `Please enter review remarks for this milestone ${status === 'approved' ? 'approval' : 'not selected'}:`,
      type: 'prompt',
      promptPlaceholder: 'Enter review remarks...',
      variant: status === 'approved' ? 'success' : 'warning',
      onConfirm: async (comments) => {
        try {
          await api.post(`/projects/milestones/${milestoneId}/review`, { status, comments });
          toast.success(`Milestone deliverable review submitted as ${status}!`);
          queryClient.invalidateQueries({ queryKey: ['admin-project-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        } catch (err) {
          toast.error(err.message || 'Review submission failed.');
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-[20px]">
        {/* Back navigation button skeleton */}
        <div className="w-[120px] h-[16px] skeleton-pulse rounded-[4px]" />

        {/* Top Header Card Skeleton */}
        <div className="bg-[#121215] border border-[#23232a]  rounded-[10px] p-[24px] flex flex-col md:flex-row justify-between gap-[20px] items-start md:items-center">
          <div className="flex flex-col gap-3 w-full md:w-2/3">
            <div className="flex items-center gap-[10px] flex-wrap">
              <div className="h-[28px] w-[250px] skeleton-pulse rounded-[6px]" />
              <div className="h-[20px] w-[80px] skeleton-pulse rounded-[4px]" />
            </div>
            <div className="h-[16px] w-[90%] skeleton-pulse rounded-[4px]" />
            <div className="h-[16px] w-[60%] skeleton-pulse rounded-[4px]" />
          </div>
          <div className="flex items-center gap-[12px] flex-wrap shrink-0">
            <div className="h-[32px] w-[70px] skeleton-pulse rounded-[6px]" />
            <div className="h-[22px] w-[80px] skeleton-pulse rounded-[4px]" />
          </div>
        </div>

        {/* Main Section Grid Skeleton */}
        <div className="grid gap-[20px] lg:grid-cols-[1.6fr_0.9fr] items-start">
          
          {/* Main Content Area Skeleton */}
          <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[24px] flex flex-col gap-[20px]">
            
            {/* Tab Header Selector Skeleton */}
            <div className="flex border-b border-[#23232a] pb-[10px] gap-[10px]">
              <div className="h-[34px] w-[90px] skeleton-pulse rounded-[6px]" />
              <div className="h-[34px] w-[90px] skeleton-pulse rounded-[6px]" />
              <div className="h-[34px] w-[110px] skeleton-pulse rounded-[6px]" />
            </div>

            {/* Metrics cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
              <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[16px] h-[72px] flex flex-col justify-between">
                <div className="h-[12px] w-[60px] skeleton-pulse rounded" />
                <div className="h-[16px] w-[80%] skeleton-pulse rounded" />
              </div>
              <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[16px] h-[72px] flex flex-col justify-between">
                <div className="h-[12px] w-[80px] skeleton-pulse rounded" />
                <div className="h-[20px] w-[100px] skeleton-pulse rounded" />
              </div>
              <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[16px] h-[72px] flex flex-col justify-between">
                <div className="h-[12px] w-[70px] skeleton-pulse rounded" />
                <div className="h-[20px] w-[60px] skeleton-pulse rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <button 
            onClick={() => navigate('/admin/projects')} 
            className="flex items-center gap-2 text-gray-300 hover:text-white border-none bg-transparent cursor-pointer font-semibold text-[0.85rem] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Projects
          </button>
        </div>
        <div className="bg-[#121215] border border-[#ef444433] rounded-xl p-6 text-center text-red-500 font-bold max-w-xl mx-auto w-full">
          Project not found.
        </div>
      </div>
    );
  }

  const milestones = project.milestones || [];
  const applications = project.applications || [];
  const assignments = project.assignments || [];

  const activeAssignment = assignments.find(a => a.status === 'active');
  const assignedAmount = activeAssignment ? Number(activeAssignment.assigned_amount) : null;
  const totalPaid = project.milestone_payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const remainingBidBalance = assignedAmount !== null ? assignedAmount - totalPaid : null;
  const hasCompletedMilestone = milestones.some(m => m.status?.toLowerCase() === 'completed');

  return (
    <div className="flex flex-col gap-[20px]">
        
        {/* Back navigation & Admin Controls */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <button 
            onClick={() => navigate('/admin/projects')} 
            className="flex items-center gap-2 text-gray-400 hover:text-white border-none bg-transparent cursor-pointer font-semibold text-[0.85rem] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Projects
          </button>
          
          <div className="flex gap-2.5">
            <button
              onClick={() => setIsEditProjectOpen(true)}
              className="bg-[#1a1a20] hover:bg-[#252530] border border-[#2d2d38] text-gray-300 hover:text-white font-bold rounded-[6px] px-3.5 py-2 text-[0.78rem] cursor-pointer flex items-center gap-1.5 transition-colors border-none"
            >
              <Edit size={14} className="text-[#70d64d]" /> Edit Project
            </button>
            <button
              onClick={handleDeleteProject}
              className="bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-red-400 font-bold rounded-[6px] px-3.5 py-2 text-[0.78rem] cursor-pointer flex items-center gap-1.5 transition-colors border-none"
            >
              <Trash2 size={14} /> Delete Project
            </button>
          </div>
        </div>

        {/* Admin Project Header Component */}
        <AdminProjectHeader project={project} applications={applications} />

        {/* Main Grid Layout */}
        <div className="grid gap-[20px] lg:grid-cols-[1.6fr_0.9fr] items-start">
          
          {/* Left Column content */}
          <div className="flex flex-col gap-[20px]">
            {/* Admin No Dues Card Component - Rendered at top ONLY when project is completed */}
            {project.status === 'completed' && (
              <AdminNoDuesCard
                activeAssignment={activeAssignment}
                noDues={noDues}
                onInitiateNoDues={() => setIsNoDuesModalOpen(true)}
              />
            )}

            {/* Admin Project Description Component */}
            <AdminProjectDescription
              project={project}
              projectId={id}
              handleDeleteDocument={handleDeleteDocument}
              onDocumentUploaded={() => refetch()}
            />

            {/* Admin Project Milestones Component */}
            <AdminProjectMilestones
              milestones={milestones}
              project={project}
              onAddMilestone={() => {
                setEditingMilestone(null);
                setIsMilestoneModalOpen(true);
              }}
              onEditMilestone={(ms) => {
                setEditingMilestone(ms);
                setIsMilestoneModalOpen(true);
              }}
              onDeleteMilestone={handleDeleteMilestone}
              onReviewDeliverable={handleReviewDeliverable}
              onCompleteMilestone={handleCompleteMilestone}
              onViewReceipt={(milestonePayment, msTitle) => {
                setPaymentDetailsToView(milestonePayment);
                setViewingMilestoneTitle(msTitle);
                setIsViewPaymentModalOpen(true);
              }}
              onEditPayment={(milestonePayment) => {
                setEditingPayment(milestonePayment);
                setIsEditPaymentModalOpen(true);
              }}
              onRecordPayment={(milestonePayment) => {
                setSelectedPayment(milestonePayment);
                setIsPaymentModalOpen(true);
              }}
            />

            {/* Admin Bids Card Component */}
            <AdminBidsCard
              applications={applications}
              hasCompletedMilestone={hasCompletedMilestone}
              onViewProposal={(app) => setSelectedBidForProposal(app)}
              onApprove={handleApprove}
              onChangeBidStatus={handleChangeBidStatus}
              onReject={handleReject}
              onResetAssignment={handleResetAssignment}
            />
          </div>

          {/* Right Sidebar Component */}
          <div className="flex flex-col gap-[20px]">
            <AdminProjectSidebar project={project} assignments={assignments} />
          </div>

        </div>

        {/* Modals */}
        {isEditProjectOpen && (
          <EditProjectModal
            project={project}
            onClose={() => setIsEditProjectOpen(false)}
            onSave={handleSaveProject}
          />
        )}

        {isMilestoneModalOpen && (
          <MilestoneModal
            milestone={editingMilestone}
            projectBudget={project.budget}
            existingMilestones={project.milestones || []}
            onClose={() => {
              setIsMilestoneModalOpen(false);
              setEditingMilestone(null);
            }}
            onSave={handleMilestoneSave}
          />
        )}

        {isPaymentModalOpen && selectedPayment && (
          <RecordPaymentModal
            selectedPayment={selectedPayment}
            assignedAmount={assignedAmount}
            totalPaid={totalPaid}
            remainingBidBalance={remainingBidBalance}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedPayment(null);
            }}
            onSuccess={() => {
              setIsPaymentModalOpen(false);
              setSelectedPayment(null);
              queryClient.invalidateQueries({ queryKey: ["admin-project-detail", id] });
              queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
            }}
          />
        )}

        {isEditPaymentModalOpen && editingPayment && (
          <EditPaymentModal
            editingPayment={editingPayment}
            assignedAmount={assignedAmount}
            totalPaid={totalPaid}
            remainingBidBalance={remainingBidBalance}
            onClose={() => {
              setIsEditPaymentModalOpen(false);
              setEditingPayment(null);
            }}
            onSuccess={() => {
              setIsEditPaymentModalOpen(false);
              setEditingPayment(null);
              queryClient.invalidateQueries({ queryKey: ["admin-project-detail", id] });
              queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
            }}
          />
        )}

        {isViewPaymentModalOpen && paymentDetailsToView && (
          <ViewPaymentModal
            paymentDetailsToView={paymentDetailsToView}
            viewingMilestoneTitle={viewingMilestoneTitle}
            onClose={() => {
              setIsViewPaymentModalOpen(false);
              setPaymentDetailsToView(null);
            }}
          />
        )}

        {selectedBidForProposal && (
          <ViewProposalModal
            selectedBidForProposal={selectedBidForProposal}
            hasCompletedMilestone={hasCompletedMilestone}
            onClose={() => setSelectedBidForProposal(null)}
            onApprove={handleApprove}
            onChangeBidStatus={handleChangeBidStatus}
            onReject={handleReject}
            onResetAssignment={handleResetAssignment}
          />
        )}

        {isNoDuesModalOpen && (
          <InitiateNoDuesModal
            projectId={id}
            noDues={noDues}
            onClose={() => setIsNoDuesModalOpen(false)}
            onSuccess={() => {
              setIsNoDuesModalOpen(false);
              refetchNoDues();
            }}
          />
        )}

        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type}
          variant={confirmConfig.variant}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          promptPlaceholder={confirmConfig.promptPlaceholder}
          defaultValue={confirmConfig.defaultValue}
          onConfirm={confirmConfig.onConfirm}
          onCancel={confirmConfig.onCancel || (() => setConfirmConfig(prev => ({ ...prev, isOpen: false })))}
        />

    </div>
  );
}

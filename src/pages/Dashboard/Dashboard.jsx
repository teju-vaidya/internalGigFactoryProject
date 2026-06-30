import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable, getCoreRowModel
} from '@tanstack/react-table';
import {
  Briefcase, Check, X, RotateCcw, Eye
} from 'lucide-react';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/useAuthStore';

// Import split subcomponents
import { RejectModal } from '../../components/Dashboard/RejectModal';
import { DashboardMetrics } from '../../components/Dashboard/DashboardMetrics';
import { ProjectsTable } from '../../components/Dashboard/ProjectsTable';
import { ActivityTimeline } from '../../components/Dashboard/ActivityTimeline';

export const Dashboard = () => {
  const loggedInUser = useAuthStore((state) => state.user) || {};
  const profile = useAuthStore((state) => state.profile);
  const role = loggedInUser.role || 'freelancer';
  
  const [activeAdminTab, setActiveAdminTab] = useState('applications');
  const [rejectTarget, setRejectTarget] = useState(null); // drives reject modal

  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  // ── Fetch registration requests ────────────────────────────────────────────
  const { data: registrationRequests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ['registrationRequests'],
    queryFn: async () => {
      const response = await api.get('/auth/registration-requests');
      const list = response.requests || [];
      return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    },
    enabled: role === 'admin',
  });

  // ── Fetch user specific dashboard data ────────────────────────────────────────────
  const { data: dashboardData } = useQuery({
    queryKey: ['my-projects-dashboard'],
    queryFn: () => api.get('/projects/my-projects'),
    enabled: role !== 'admin',
    keepPreviousData: true,
  });

  // ── Fetch notifications ────────────────────────────────────────────────────────
  const { data: notificationsData } = useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: () => api.get('/notifications'),
    enabled: role !== 'admin',
  });

  const rawApplications = dashboardData?.applications || [];
  const ongoing = dashboardData?.ongoing || [];
  const notifications = notificationsData?.notifications || [];

  // Re-fetch when role becomes admin
  useEffect(() => {
    if (role === 'admin') {
      queryClient.invalidateQueries({ queryKey: ['registrationRequests'] });
    }
  }, [role, queryClient]);

  // ── Query Mutations ────────────────────────────────────────────────────────
  const [approveId, setApproveId] = useState(null);
  const approveQuery = useQuery({
    queryKey: ['registration-approve', approveId],
    queryFn: () => api.post(`/auth/registration-requests/${approveId}/review`, { status: 'approved' }),
    enabled: !!approveId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (approveQuery.data) {
      toast.success('Registration request approved!');
      queryClient.invalidateQueries({ queryKey: ['registrationRequests'] });
      setApproveId(null);
    }
  }, [approveQuery.data, queryClient]);

  useEffect(() => {
    if (approveQuery.error) {
      toast.error(approveQuery.error.message || 'Approve failed.');
      setApproveId(null);
    }
  }, [approveQuery.error]);

  const [rejectParams, setRejectParams] = useState(null);
  const rejectQuery = useQuery({
    queryKey: ['registration-reject', rejectParams],
    queryFn: () => api.post(`/auth/registration-requests/${rejectParams.id}/review`, {
      status: 'rejected',
      rejectionReason: rejectParams.reason,
    }),
    enabled: !!rejectParams,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (rejectQuery.data) {
      toast.success('Registration request rejected.');
      queryClient.invalidateQueries({ queryKey: ['registrationRequests'] });
      setRejectTarget(null);
      setRejectParams(null);
    }
  }, [rejectQuery.data, queryClient]);

  useEffect(() => {
    if (rejectQuery.error) {
      toast.error(rejectQuery.error.message || 'Rejection failed.');
      setRejectParams(null);
    }
  }, [rejectQuery.error]);

  const handleApproveRequest = (id)         => setApproveId(id);
  const handleOpenReject     = (req)        => setRejectTarget(req);
  const handleConfirmReject  = (id, reason) => setRejectParams({ id, reason });

  /* Mock Datasets mapped for Admin state */
  const [adminApplications, setAdminApplications] = useState([
    { id: 1, type: 'GIG_EXPERT', name: 'Sarah Johnson', project: 'E-commerce Website Redesign', email: 'sarah.j@email.com', status: 'PENDING' },
    { id: 2, type: 'AGENCY', name: 'Creative Studios Inc.', project: 'Mobile App Development', email: 'contact@creativestudios.com', status: 'SELECTED' }
  ]);

  const handleAdminAction = (id, nextStatus) => {
    setAdminApplications(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
  };

  /* TanStack Table Columns Configurations */
  const adminColumns = useMemo(() => [
    {
      header: 'TYPE',
      accessorKey: 'type',
      cell: info => (
        <span className={`role-chip chip-${info.getValue().toLowerCase()}`}>
          {info.getValue()}
        </span>
      )
    },
    {
      header: 'NAME',
      accessorKey: 'name',
      cell: info => (
        <div className="name-details-cell">
          <strong>{info.getValue()}</strong>
          <span className="project-reference-text">For: {info.row.original.project}</span>
        </div>
      )
    },
    { header: 'EMAIL', accessorKey: 'email' },
    {
      header: 'STATUS',
      accessorKey: 'status',
      cell: info => <span className={`status-badge state-${info.getValue().toLowerCase()}`}>{info.getValue()}</span>
    },
    {
      header: 'PORTFOLIO',
      cell: () => <button className="view-portfolio-btn"><Eye size={16} /></button>
    },
    {
      header: 'ACTIONS',
      cell: info => {
        const item = info.row.original;
        return (
          <div className="table-actions-cluster">
            {item.status === 'PENDING' ? (
              <>
                <button className="btn-act accept" onClick={() => handleAdminAction(item.id, 'SELECTED')}><Check size={12} /> ACCEPT</button>
                <button className="btn-act reject" onClick={() => handleAdminAction(item.id, 'REJECT')}><X size={12} /> NOT SELECT</button>
              </>
            ) : (
              <button className="btn-act reset" onClick={() => handleAdminAction(item.id, 'PENDING')}><RotateCcw size={12} /> RESET</button>
            )}
          </div>
        );
      }
    }
  ], [adminApplications]);

  const userProjects = useMemo(() => {
    return ongoing.map(item => ({
      id: item.project?.id,
      title: item.project?.title || 'Untitled Project',
      subtitle: item.project?.description || 'No description provided.',
      budget: item.assigned_amount ? `₹${Number(item.assigned_amount).toLocaleString('en-IN')}` : (item.project?.budget ? `₹${Number(item.project.budget).toLocaleString('en-IN')}` : 'Undisclosed'),
      status: item.project?.status ? item.project.status.toUpperCase() : 'IN PROGRESS',
    }));
  }, [ongoing]);

  const userColumns = useMemo(() => [
    {
      header: 'PROJECT WORKSPACE',
      accessorKey: 'title',
      cell: info => {
        const rawSubtitle = info.row.original.subtitle || '';
        // Replace non-breaking spaces (both HTML entity and unicode character) with regular spaces
        const cleanSubtitle = rawSubtitle.replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ');
        return (
          <div className="name-details-cell">
            <strong>{info.getValue()}</strong>
            <div 
              className="project-reference-text"
              dangerouslySetInnerHTML={{ __html: cleanSubtitle }}
            />
          </div>
        );
      }
    },
    { header: 'BUDGET', accessorKey: 'budget' },
    {
      header: 'STATUS',
      accessorKey: 'status',
      cell: info => {
        const val = info.getValue() || 'IN PROGRESS';
        const cleanVal = val.replace(/\s+/g, '').toLowerCase();
        return <span className={`status-badge state-${cleanVal}`}>{val}</span>;
      }
    },
    {
      header: 'MANAGEMENT',
      cell: info => (
        <button 
          className="btn-details-action" 
          onClick={() => navigate(`/projects/${info.row.original.id}`)}
        >
          VIEW DETAILS
        </button>
      )
    }
  ], [navigate]);

  // Set selected dataset dynamically
  const tableData = useMemo(() => role === 'admin' ? adminApplications : userProjects, [role, adminApplications, userProjects]);
  const tableColumns = useMemo(() => role === 'admin' ? adminColumns : userColumns, [role, adminColumns, userColumns]);

  const tableInstance = useReactTable({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel()
  });

  const completedProjectsCount = useMemo(() => {
    return role === 'gig_expert' 
      ? (profile?.completed_projects || 0) 
      : (profile?.total_completed_projects || 0);
  }, [profile, role]);

  const totalEarnings = useMemo(() => {
    // If profile has total_earnings, use that
    const profileEarnings = Number(profile?.total_earnings || profile?.total_completed_projects_earnings || 0);
    if (profileEarnings > 0) return profileEarnings;
    
    // Otherwise calculate from ongoing project milestones
    let earnings = 0;
    ongoing.forEach(item => {
      const milestones = item.project?.milestones || [];
      milestones.forEach(m => {
        if (m.status === 'completed' || m.payment_status === 'paid') {
          earnings += m.budget ? Number(m.budget) : 0;
        }
      });
    });
    return earnings;
  }, [ongoing, profile]);

  const combinedActivities = useMemo(() => {
    const list = [];

    // 1. Add real notifications
    notifications.forEach(n => {
      const refType = n.reference_type || n.referenceType;
      const refId = n.reference_id || n.referenceId;
      const targetUrl = n.action_url || (refType === 'project' && refId ? `/projects/${refId}` : null);
      list.push({
        id: n.id,
        title: n.title,
        message: n.message,
        created_at: n.created_at,
        type: n.type || 'notification',
        targetUrl,
      });
    });

    // 2. Add application/bid activities
    rawApplications.forEach(app => {
      list.push({
        id: `app-${app.id}`,
        title: 'Proposal Submitted',
        message: `Submitted a bid of ₹${Number(app.bid_amount).toLocaleString('en-IN')} for project "${app.project?.title || 'Untitled'}"`,
        created_at: app.applied_at,
        type: 'applied',
        targetUrl: '/applications',
      });
    });

    // 3. Add milestone deliverable submission activities
    ongoing.forEach(item => {
      const projectTitle = item.project?.title || 'Untitled Project';
      const milestones = item.project?.milestones || [];
      milestones.forEach(m => {
        const deliverables = m.deliverables || [];
        deliverables.forEach(del => {
          list.push({
            id: `del-${del.id}`,
            title: 'Deliverable Submitted',
            message: `Submitted deliverable for Milestone #${m.milestone_no} ("${m.title}") in project "${projectTitle}"`,
            created_at: del.submitted_at,
            type: 'deliverable',
            targetUrl: `/projects/${item.project?.id}`,
          });
        });
      });
    });

    // Sort by timestamp descending
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return list;
  }, [notifications, rawApplications, ongoing]);

  return (
    <div>
      {/* Dynamic Contextual Metrics Cards Blocks */}
      <DashboardMetrics
        role={role}
        isRequestsLoading={isRequestsLoading}
        registrationRequests={registrationRequests}
        applicationsCount={rawApplications.length}
        activeCount={ongoing.length}
        completedCount={completedProjectsCount}
        totalEarnings={totalEarnings}
      />

      {/* Primary Data Content Area splits: Table Left, Activity Timeline Right if User */}
      <div className="portal-content-split-row">
        <ProjectsTable
          role={role}
          activeAdminTab={activeAdminTab}
          setActiveAdminTab={setActiveAdminTab}
          registrationRequests={registrationRequests}
          isRequestsLoading={isRequestsLoading}
          approveQuery={approveQuery}
          rejectQuery={rejectQuery}
          handleApproveRequest={handleApproveRequest}
          handleOpenReject={handleOpenReject}
          tableInstance={tableInstance}
          tableData={tableData}
        />

        {/* Contextual Side Activity Panel rendered for Gig Expert / Agency views */}
        <ActivityTimeline role={role} notifications={combinedActivities} />
      </div>

      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleConfirmReject}
          isPending={rejectQuery.isFetching}
        />
      )}
    </div>
  );
};
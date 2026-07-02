import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, FileSearch, CheckCircle2,
  TrendingUp, ArrowRight, Clock, UserCheck, Bell, X,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../utils/api';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function StatCard({ label, value, Icon, accent, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[12px] p-[24px] flex flex-col gap-[12px] transition-all duration-150 ${accent
        ? 'bg-gradient-to-br from-[#121215] to-[#16220a] border border-[#374f05]'
        : 'bg-[#121215] border border-[#23232a]'
        } ${onClick ? 'cursor-pointer hover:-translate-y-[2px] hover:shadow-lg' : 'cursor-default'}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-[0.68rem] font-bold tracking-[0.8px] uppercase m-0">
            {label}
          </p>
          <p className="text-white text-[2.4rem] font-extrabold m-0 mt-[6px] leading-none">
            {value ?? <span className="skeleton-pulse inline-block w-[50px] h-[36px] rounded-[6px]" />}
          </p>
        </div>
        <div className={`w-[44px] h-[44px] rounded-[10px] flex items-center justify-center border ${accent ? 'bg-[rgba(112,214,77,0.12)] border-[rgba(112,214,77,0.25)]' : 'bg-[rgba(255,255,255,0.04)] border-[#23232a]'
          }`}>
          <Icon size={20} color={accent ? '#70d64d' : '#6b7280'} />
        </div>
      </div>
      {sub && <p className="text-gray-500 text-[0.75rem] m-0">{sub}</p>}
      {onClick && (
        <div className="flex items-center gap-[4px] text-[#70d64d] text-[0.75rem] font-semibold">
          View all <ArrowRight size={12} />
        </div>
      )}
    </div>
  );
}

function QuickLink({ icon: Icon, label, desc, to, color }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(to)}
      className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[20px] cursor-pointer flex items-center gap-[16px] transition-all duration-150"
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#23232a'; }}
    >
      <div
        style={{ background: `${color}18`, borderColor: `${color}40` }}
        className="w-[44px] h-[44px] rounded-[10px] border flex items-center justify-center shrink-0"
      >
        <Icon size={20} color={color} />
      </div>
      <div className="flex-1">
        <p className="text-white font-bold text-[0.9rem] m-0">{label}</p>
        <p className="text-gray-500 text-[0.75rem] m-0 mt-[3px]">{desc}</p>
      </div>
      <ArrowRight size={16} color="#6b7280" />
    </div>
  );
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const [isSenderOpen, setIsSenderOpen] = useState(false);
  const [isRequestsCollapsed, setIsRequestsCollapsed] = useState(false);
  const [isBidsCollapsed, setIsBidsCollapsed] = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/profiles/admin/stats'),
    refetchInterval: 60_000,
  });

  const { data: reqData, isLoading: isReqLoading } = useQuery({
    queryKey: ['admin-registration-requests-overview'],
    queryFn: () => api.get('/auth/registration-requests').then(r => r.requests || []),
  });

  const { data: freelancersData } = useQuery({
    queryKey: ['admin-gigExperts-list'],
    queryFn: () => api.get('/profiles/admin/gigExperts?limit=100').then(r => r.gigExperts || []),
  });

  const { data: agenciesData } = useQuery({
    queryKey: ['admin-agencies-list'],
    queryFn: () => api.get('/profiles/admin/agencies?limit=100').then(r => r.agencies || []),
  });

  const usersList = useMemo(() => {
    const list = [];
    if (freelancersData) {
      freelancersData.forEach(f => {
        list.push({ id: f.id, name: `${f.full_name} (Gig Expert)`, email: f.email });
      });
    }
    if (agenciesData) {
      agenciesData.forEach(a => {
        list.push({ id: a.id, name: `${a.agency_profile?.agency_name || a.full_name} (Agency)`, email: a.email });
      });
    }
    return list;
  }, [freelancersData, agenciesData]);

  const stats = statsData?.stats || {};
  const recentRequests = [...(reqData || [])]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);
  const recentBids = statsData?.recentBids || [];

  return (
    <div className="flex flex-col gap-[28px]">

      {/* Stats Row */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[16px]">
        <StatCard
          label="Active Gig Experts"
          value={stats.totalFreelancers}
          Icon={Users}
          sub="Approved accounts"
          onClick={() => navigate('/admin/gigExperts')}
        />
        <StatCard
          label="Active Agencies"
          value={stats.totalAgencies}
          Icon={Building2}
          sub="Approved accounts"
          onClick={() => navigate('/admin/agencies')}
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingRequests}
          Icon={Clock}
          accent
          sub="Awaiting decision"
          onClick={() => navigate('/admin/requests')}
        />
        <StatCard
          label="Approved This Month"
          value={stats.approvedThisMonth}
          Icon={UserCheck}
          sub="Registration approvals"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

        <div className="flex flex-col gap-6">
          {/* Recent registration requests */}
          {recentRequests.length > 0 && (
            <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[24px]">
              <div className="flex justify-between items-center mb-[20px]">
                <div className="flex items-center gap-2">
                  <h2 className="text-white text-[1rem] font-extrabold m-0">
                    Recent Registration Requests
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsRequestsCollapsed(!isRequestsCollapsed)}
                    className="bg-transparent border-none text-gray-500 hover:text-white cursor-pointer flex items-center p-1"
                  >
                    {isRequestsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => navigate('/admin/requests')}
                  className="bg-transparent border border-[#23232a] text-[#70d64d] rounded-[6px] px-[12px] py-[6px] text-[0.75rem] font-bold cursor-pointer flex items-center gap-[5px]"
                >
                  View All <ArrowRight size={12} />
                </button>
              </div>

              {!isRequestsCollapsed && (
                <div className="flex flex-col gap-[12px] animate-fade-in">
                  {recentRequests.map(req => {
                    const statusColor = req.status === 'approved' ? '#70d64d' : req.status === 'rejected' ? '#ef4444' : '#f59e0b';
                    const roleColor = req.role === 'agency' ? '#c084fc' : '#38bdf8';
                    return (
                      <div
                        key={req.id}
                        onClick={() => navigate(`/admin/requests?id=${req.id}`)}
                        className="flex items-center gap-[12px] px-[8px] py-[10px] border-b border-[#1a1a22] cursor-pointer rounded-[6px] transition-colors duration-200 hover:bg-[#181820]"
                      >
                        <div
                          style={{ background: `${roleColor}18`, borderColor: `${roleColor}40`, color: roleColor }}
                          className="w-[36px] h-[36px] rounded-full border flex items-center justify-center font-extrabold text-[0.75rem] shrink-0"
                        >
                          {req.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-[8px]">
                            <span className="text-white font-semibold text-[0.85rem] whitespace-nowrap overflow-hidden text-ellipsis">
                              {req.full_name}
                            </span>
                            <span
                              style={{ background: `${roleColor}18`, color: roleColor }}
                              className="text-[0.62rem] font-bold px-[6px] py-[2px] rounded-[4px] shrink-0"
                            >
                              {req.role === "freelancer" ? "GIG EXPERT" : req.role?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-500 text-[0.75rem] m-0 mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis">
                            {req.email}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-[4px] shrink-0">
                          <span
                            style={{ background: `${statusColor}18`, color: statusColor }}
                            className="text-[0.62rem] font-bold px-[7px] py-[2px] rounded-[4px]"
                          >
                            {req.status === 'rejected' ? 'NOT SELECTED' : req.status?.toUpperCase()}
                          </span>
                          <span className="text-[#4b4b57] text-[0.68rem]">{fmtDate(req.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recent project bids */}
          <div className="bg-[#121215] border border-[#23232a] rounded-[12px] p-[24px]">
            <div className="flex justify-between items-center mb-[20px]">
              <div className="flex items-center gap-2">
                <h2 className="text-white text-[1rem] font-extrabold m-0">
                  Recent Project Bids
                </h2>
                <button
                  type="button"
                  onClick={() => setIsBidsCollapsed(!isBidsCollapsed)}
                  className="bg-transparent border-none text-gray-500 hover:text-white cursor-pointer flex items-center p-1"
                >
                  {isBidsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
              <button
                onClick={() => navigate('/admin/projects')}
                className="bg-transparent border border-[#23232a] text-[#38bdf8] rounded-[6px] px-[12px] py-[6px] text-[0.75rem] font-bold cursor-pointer flex items-center gap-[5px]"
              >
                View Projects <ArrowRight size={12} />
              </button>
            </div>

            {!isBidsCollapsed && (
              <div className="flex flex-col gap-[12px] animate-fade-in">
                {recentBids.length === 0 ? (
                  <p className="text-gray-500 text-[0.85rem] m-0 text-center py-[24px]">
                    No recent project bids.
                  </p>
                ) : (
                  recentBids.map(bid => {
                    const bidderName = bid.applicant?.full_name || 'Bidder';
                    const role = bid.applicant_type || bid.applicant?.role || 'gig_expert';
                    const roleColor = role === 'agency' ? '#c084fc' : '#38bdf8';
                    const statusColor = bid.status === 'accepted' ? '#70d64d' : bid.status === 'rejected' ? '#ef4444' : '#f59e0b';
                    const proj = bid.project || {};

                    return (
                      <div
                        key={bid.id}
                        onClick={() => navigate(`/admin/projects/${proj.id}`)}
                        className="flex items-center gap-[12px] px-[8px] py-[10px] border-b border-[#1a1a22] cursor-pointer rounded-[6px] transition-colors duration-200 hover:bg-[#181820]"
                      >
                        <div
                          style={{ background: `${roleColor}18`, borderColor: `${roleColor}40`, color: roleColor }}
                          className="w-[36px] h-[36px] rounded-full border flex items-center justify-center font-extrabold text-[0.75rem] shrink-0"
                        >
                          {bidderName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-[8px]">
                            <span className="text-white font-semibold text-[0.85rem] whitespace-nowrap overflow-hidden text-ellipsis">
                              {bidderName}
                            </span>
                            <span
                              style={{ background: `${roleColor}18`, color: roleColor }}
                              className="text-[0.62rem] font-bold px-[6px] py-[2px] rounded-[4px] shrink-0"
                            >
                              {role === "freelancer" ? "GIG EXPERT" : role.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-500 text-[0.75rem] m-0 mt-[2px] whitespace-nowrap overflow-hidden text-ellipsis">
                            Bid <span className="text-[#70d64d] font-bold">₹{Number(bid.bid_amount).toLocaleString('en-IN')}</span> on <span className="text-white font-semibold">{proj.title}</span> ({proj.project_code})
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-[4px] shrink-0">
                          <span
                            style={{ background: `${statusColor}18`, color: statusColor }}
                            className="text-[0.62rem] font-bold px-[7px] py-[2px] rounded-[4px]"
                          >
                            {bid.status === 'rejected' ? 'NOT SELECTED' : bid.status?.toUpperCase()}
                          </span>
                          <span className="text-[#4b4b57] text-[0.68rem]">{fmtDate(bid.applied_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-col gap-[12px]">
          <h2 className="text-white text-[1rem] font-extrabold m-0 mb-[4px]">Quick Access</h2>
          <QuickLink icon={FileSearch} label="Reg. Requests" desc="Review & approve applications" to="/admin/requests" color="#f59e0b" />
          <QuickLink icon={Users} label="Gig Experts" desc="Manage gigExpert accounts" to="/admin/gigExperts" color="#38bdf8" />
          <QuickLink icon={Building2} label="Agencies" desc="Manage agency accounts" to="/admin/agencies" color="#c084fc" />
          <QuickLink icon={TrendingUp} label="Analytics" desc="Platform performance metrics" to="/admin/analytics" color="#70d64d" />

          <h2 className="text-white text-[1rem] font-extrabold mt-[12px] mb-[4px] mx-0">Communications</h2>
          <div onClick={() => setIsSenderOpen(true)}
            className="bg-gradient-to-br from-[#121215] to-[#16220a] border border-[#23232a] rounded-[10px] p-[20px] cursor-pointer flex items-center gap-[16px] transition-colors duration-150 hover:border-[#70d64d]"
          >
            <div className="w-[44px] h-[44px] rounded-[10px] bg-[rgba(112,214,77,0.08)] border border-[rgba(112,214,77,0.25)] flex items-center justify-center shrink-0">
              <Bell size={20} color="#70d64d" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-[0.9rem] m-0">Notification Hub</p>
              <p className="text-gray-500 text-[0.75rem] m-0 mt-[3px]">Send manual alerts & emails</p>
            </div>
            <ArrowRight size={16} color="#6b7280" />
          </div>
        </div>
      </div>

      {isSenderOpen && (
        <SendManualNotificationModal
          onClose={() => setIsSenderOpen(false)}
          usersList={usersList}
        />
      )}
    </div>
  );
}

/* ─── Send Manual Notification Modal ─────────────────────────────────────── */
function SendManualNotificationModal({ onClose, usersList }) {
  const [targetUserId, setTargetUserId] = useState('ALL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('manual');
  const [sendEmail, setSendEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailHtml, setEmailHtml] = useState('');

  const sendMutation = useMutation({
    mutationFn: (body) => api.post('/notifications/manual', body),
    onSuccess: () => {
      toast.success('Notification & email sent successfully!');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send notification.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    sendMutation.mutate({
      userId: targetUserId,
      title,
      message,
      type,
      sendEmail,
      emailSubject: emailSubject.trim() || undefined,
      emailHtml: emailHtml.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[8px] flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-[#121215] border border-[#23232a] rounded-[16px] w-[580px] max-w-[95vw] p-[30px] text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex flex-col gap-[20px]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#23232a] pb-[16px]">
          <div className="flex items-center gap-[10px]">
            <Bell size={20} color="#70d64d" />
            <h3 className="m-0 text-[1.2rem] font-extrabold">Manual Notification Hub</h3>
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-gray-500 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">

          {/* Recipient */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-gray-500 text-[0.7rem] font-bold uppercase tracking-[0.5px]">Recipient</label>
            <select
              value={targetUserId}
              onChange={e => setTargetUserId(e.target.value)}
              className="bg-[#1c1c20] border border-[#2c2c35] rounded-[8px] p-[10px] text-white text-[0.85rem] focus:outline-none"
            >
              <option value="ALL">All Users (Broadcast)</option>
              {usersList.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Row for Title & Type */}
          <div className="grid grid-cols-[1fr_150px] gap-[12px]">
            <div className="flex flex-col gap-[6px]">
              <label className="text-gray-500 text-[0.7rem] font-bold uppercase tracking-[0.5px]">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Schedule Update"
                className="bg-[#1c1c20] border border-[#2c2c35] rounded-[8px] p-[10px] text-white text-[0.85rem] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label className="text-gray-500 text-[0.7rem] font-bold uppercase tracking-[0.5px]">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="bg-[#1c1c20] border border-[#2c2c35] rounded-[8px] p-[10px] text-white text-[0.85rem] focus:outline-none"
              >
                <option value="manual">Manual</option>
                <option value="project">Project</option>
                <option value="payment">Payment</option>
                <option value="meeting">Meeting</option>
                <option value="approved">Approved</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          {/* Message */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-gray-500 text-[0.7rem] font-bold uppercase tracking-[0.5px]">Message Body</label>
            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter the notification content..."
              className="bg-[#1c1c20] border border-[#2c2c35] rounded-[8px] p-[10px] text-white text-[0.85rem] resize-y focus:outline-none"
            />
          </div>

          {/* Send Email Toggle */}
          <div className="flex items-center gap-[8px] py-[4px]">
            <input
              type="checkbox"
              id="sendEmailCheckbox"
              checked={sendEmail}
              onChange={e => setSendEmail(e.target.checked)}
              className="accent-[#70d64d] w-[16px] h-[16px] cursor-pointer"
            />
            <label htmlFor="sendEmailCheckbox" className="text-white text-[0.85rem] font-semibold cursor-pointer flex items-center gap-[6px]">
              Also Send Email notification
            </label>
          </div>

          {/* Expandable Email Fields */}
          {sendEmail && (
            <div className="bg-white/[0.02] border border-dashed border-[#2c2c35] rounded-[10px] p-[16px] flex flex-col gap-[12px]">
              <div className="flex flex-col gap-[6px]">
                <label className="text-gray-500 text-[0.65rem] font-bold uppercase tracking-[0.5px]">Custom Email Subject (Optional)</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  placeholder="Defaults to notification title"
                  className="bg-[#1c1c20] border border-[#2c2c35] rounded-[8px] px-[10px] py-[8px] text-white text-[0.8rem] focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="text-gray-500 text-[0.65rem] font-bold uppercase tracking-[0.5px]">Custom Email HTML body (Optional)</label>
                <textarea
                  rows={2}
                  value={emailHtml}
                  onChange={e => setEmailHtml(e.target.value)}
                  placeholder="HTML tags allowed. Defaults to styled message."
                  className="bg-[#1c1c20] border border-[#2c2c35] rounded-[8px] px-[10px] py-[8px] text-white text-[0.8rem] resize-y focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-[10px] border-t border-[#23232a] pt-[16px] mt-[10px]">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent border border-[#2c2c35] text-[#a1a1aa] rounded-[8px] px-[16px] py-[10px] text-[0.85rem] font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className={`bg-[#70d64d] text-black border-none rounded-[8px] px-[22px] py-[10px] text-[0.85rem] font-bold cursor-pointer transition-opacity ${sendMutation.isPending ? 'opacity-60' : 'opacity-100'}`}
            >
              {sendMutation.isPending ? 'Sending...' : 'Send Notification'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

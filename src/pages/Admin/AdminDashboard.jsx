import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Building2, FileText, Clock, Check, X, Eye,
  Search, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../utils/api';

/* ─── helpers ─────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_STYLES = {
  pending:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  approved: { bg: 'rgba(112,214,77,0.12)',  color: '#70d64d' },
  rejected: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
};
const ROLE_STYLES = {
  gig_expert: { bg: '#1e293b', color: '#38bdf8' },
  agency:     { bg: '#2e1065', color: '#c084fc' },
};

/* ─── sub-components ──────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span 
      style={{ background: s.bg, color: s.color }} 
      className="text-[0.68rem] font-bold px-[8px] py-[3px] rounded-[4px]"
    >
      {status.toUpperCase()}
    </span>
  );
}

function RoleChip({ role }) {
  const r = ROLE_STYLES[role] || ROLE_STYLES.gig_expert;
  return (
    <span 
      style={{ background: r.bg, color: r.color }} 
      className="text-[0.68rem] font-bold px-[8px] py-[3px] rounded-[4px]"
    >
      {role?.toUpperCase()}
    </span>
  );
}

function StatCard({ label, value, Icon, accent }) {
  return (
    <div className={`border rounded-[8px] px-[20px] py-[18px] ${
      accent 
        ? 'bg-gradient-to-br from-[#121215] to-[#162203] border-[#374f05]' 
        : 'bg-[#121215] border-[#23232a]'
    }`}>
      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-[0.68rem] font-bold tracking-[0.5px] uppercase">{label}</span>
        <Icon size={16} color={accent ? '#70d64d' : '#6b7280'} />
      </div>
      <div className="text-[2rem] font-extrabold text-white mt-[6px]">{value}</div>
    </div>
  );
}

/* Detail modal */
function DetailModal({ request, historyData, isLoadingHistory, onClose, onApprove, onReject, onUpdateDecision, isPending }) {
  if (!request) return null;
  const app = request.application_data || {};

  const [isEditingDecision, setIsEditingDecision] = useState(false);
  const [newStatus, setNewStatus] = useState(request.status);
  const [rejectReason, setRejectReason] = useState(request.rejection_reason || '');
  const [noReason, setNoReason] = useState(false);
  
  // Cooldown selection states
  const [cooldownOption, setCooldownOption] = useState('30'); // '7', '14', '30', '90', 'none', 'custom'
  const [customDate, setCustomDate] = useState('');

  // Pre-fill states when opening edit decision mode
  const handleOpenEditDecision = () => {
    setNewStatus(request.status);
    setRejectReason(request.rejection_reason || '');
    setIsEditingDecision(true);
    
    if (request.can_reapply_at) {
      const diffMs = new Date(request.can_reapply_at) - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if ([7, 14, 30, 90].includes(diffDays)) {
        setCooldownOption(String(diffDays));
      } else {
        setCooldownOption('custom');
        setCustomDate(new Date(request.can_reapply_at).toISOString().split('T')[0]);
      }
    } else {
      setCooldownOption('30');
    }
  };

  const handleSaveDecisionUpdate = (e) => {
    e.preventDefault();
    let calculatedDate = null;
    if (newStatus === 'rejected') {
      if (cooldownOption === 'none') {
        calculatedDate = new Date(Date.now() - 1000).toISOString(); // expired (now - 1s)
      } else if (cooldownOption === 'custom') {
        calculatedDate = customDate ? new Date(customDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        const days = parseInt(cooldownOption) || 30;
        calculatedDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    onUpdateDecision(request.id, {
      status: newStatus,
      rejectionReason: newStatus === 'rejected' ? (noReason ? '' : rejectReason.trim()) : null,
      canReapplyAt: calculatedDate
    });
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-[4px] z-[600]" />
      <div style={{ animation: 'modalIn 0.2s ease-out' }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[780px] bg-[#181818] border border-[#2c2c2c] rounded-[10px] overflow-hidden z-[601] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-[12px] px-[24px] py-[20px] border-b border-[#2c2c2c]">
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-[1.25rem] font-extrabold m-0">
                Registration Profile: {request.full_name}
              </h2>
              <button onClick={onClose} className="bg-transparent border border-[#2c2c2c] text-[#8a8a8a] rounded-[6px] px-[8px] py-[6px] cursor-pointer flex items-center shrink-0"><X size={16} /></button>
            </div>
            <div className="flex gap-[8px] mt-[8px]">
              <RoleChip role={request.role} />
              <StatusBadge status={request.status} />
              {request.status === 'rejected' && request.can_reapply_at && (
                <span className="text-[0.72rem] bg-[#3b2314] text-[#f59e0b] px-[8px] py-[3px] rounded-[4px] font-semibold">
                  Cooldown until: {fmtDate(request.can_reapply_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-[24px]">
          {/* Main profile view */}
          {!isEditingDecision ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Info cards */}
              <div className="flex flex-col gap-[16px]">
                {/* 1. Contact & Designation Card */}
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px] flex flex-col gap-[8px]">
                  <h3 className="text-[0.82rem] font-extrabold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[8px] pb-[6px] border-b border-[#2c2c2c]">Personal & Contact Details</h3>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Email:</strong> <span>{request.email}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Mobile:</strong> <span>{request.mobile}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Designation:</strong> <span>{app.designation || app.title || 'N/A'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Location:</strong> <span>{app.location || app.headquarters || 'N/A'}</span></div>
                  {app.linkedinUrl && (
                    <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]">
                      <strong>LinkedIn:</strong> 
                      <a href={app.linkedinUrl} target="_blank" rel="noreferrer" className="text-[#70d64d] no-underline font-semibold hover:underline">View Profile</a>
                    </div>
                  )}
                  {app.website && (
                    <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]">
                      <strong>Website:</strong> 
                      <a href={app.website} target="_blank" rel="noreferrer" className="text-[#70d64d] no-underline font-semibold hover:underline">{app.website}</a>
                    </div>
                  )}
                </div>

                {/* 2. Legal Details Card */}
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px] flex flex-col gap-[8px]">
                  <h3 className="text-[0.82rem] font-extrabold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[8px] pb-[6px] border-b border-[#2c2c2c]">Legal & Identification</h3>
                  {request.role === 'gig_expert' ? (
                    <>
                      <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Legal Name (PAN):</strong> <span>{app.legalNamePan || 'N/A'}</span></div>
                      <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Personal PAN:</strong> <span className="uppercase">{app.personalPan || 'N/A'}</span></div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Registered Name:</strong> <span>{app.registeredName || 'N/A'}</span></div>
                      <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Authorized Person:</strong> <span>{app.authPersonName || 'N/A'}</span></div>
                      <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Company PAN:</strong> <span className="uppercase">{app.companyPan || 'N/A'}</span></div>
                      <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>GSTIN:</strong> <span className="uppercase">{app.gstNumber || 'N/A'}</span></div>
                      <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>CIN:</strong> <span className="uppercase">{app.cin || 'N/A'}</span></div>
                    </>
                  )}
                </div>

                {/* 3. Availability & Sign-off Card */}
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px] flex flex-col gap-[8px]">
                  <h3 className="text-[0.82rem] font-extrabold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[8px] pb-[6px] border-b border-[#2c2c2c]">Availability & Sign-off</h3>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Availability:</strong> <span>{app.availability || 'Project basis'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Notice Period:</strong> <span>{app.noticePeriod || 'Immediate'}</span></div>
                  {request.role === 'agency' && (
                    <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Team Size:</strong> <span>{app.teamSize || 'N/A'} employees</span></div>
                  )}
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Signee Name:</strong> <span>{app.signatureName || 'N/A'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]">
                    <strong>Declaration:</strong> 
                    <span className="font-semibold" style={{ color: app.declarationAccepted ? '#70d64d' : '#ef4444' }}>
                      {app.declarationAccepted ? 'Accepted' : 'Declined'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Skills, Details and Decision logs */}
              <div className="flex flex-col gap-[16px]">
                {/* 4. Selected Services & Skills */}
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px] flex flex-col gap-[8px]">
                  <h3 className="text-[0.82rem] font-extrabold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[8px] pb-[6px] border-b border-[#2c2c2c]">Services & Capability Stack</h3>
                  <div className="flex flex-wrap gap-[8px] mb-[12px]">
                    {(app.selectedServices || []).map(srv => (
                      <span key={srv} className="bg-[#1e293b] text-[#38bdf8] text-[0.72rem] font-semibold px-[8px] py-[3px] rounded-[4px]">{srv}</span>
                    ))}
                  </div>

                  {app.bimDetails && (
                    <div className="mt-[12px] bg-[#1c1c20] p-[10px] rounded-[6px]">
                      <p className="m-0 mb-[6px] text-[0.75rem] font-bold text-gray-500">BIM DETAILS</p>
                      <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Software Stack:</strong> <span>{Array.isArray(app.bimDetails.softwareStack) ? app.bimDetails.softwareStack.join(', ') : 'N/A'}</span></div>
                      <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Experience:</strong> <span>{app.bimDetails.experience || 'N/A'} yrs</span></div>
                    </div>
                  )}
                  {app.portfolioUrl && (
                    <div className="mt-[12px]">
                      <strong>Portfolio link: </strong>
                      <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-[#70d64d] no-underline font-semibold hover:underline">Open Link</a>
                    </div>
                  )}
                </div>

                {/* 5. Commercials Card */}
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px] flex flex-col gap-[8px]">
                  <h3 className="text-[0.82rem] font-extrabold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[8px] pb-[6px] border-b border-[#2c2c2c]">Commercial Rates</h3>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Base Rate:</strong> <span>INR {app.baseRate || 'N/A'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Billing Basis:</strong> <span>{app.billingBasis || 'Hourly'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Commercial Basis:</strong> <span>{app.commercialBasis || 'N/A'}</span></div>
                </div>

                {/* 5.1 Registration History & Attempts */}
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px] flex flex-col gap-[8px]">
                  <h3 className="text-[0.82rem] font-extrabold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[8px] pb-[6px] border-b border-[#2c2c2c]">Attempts & History Tracker</h3>
                  {isLoadingHistory ? (
                    <div className="text-[#888] text-[0.8rem] py-[10px]">Loading history...</div>
                  ) : historyData ? (
                    <>
                      <div className="grid grid-cols-2 gap-[12px] mb-[12px]">
                        <div className="bg-[#121215] border border-[#2c2c2c] p-[8px] rounded-[6px] text-center">
                          <span className="text-[0.65rem] text-gray-500 uppercase font-bold">Total Attempts</span>
                          <div className="text-[1.2rem] text-white font-extrabold mt-[2px]">
                            {historyData.tracker?.total_attempts || 0}
                          </div>
                        </div>
                        <div className="bg-[#121215] border border-[#2c2c2c] p-[8px] rounded-[6px] text-center">
                          <span className="text-[0.65rem] text-gray-500 uppercase font-bold">Rejections</span>
                          <div className="text-[1.2rem] text-[#ef4444] font-extrabold mt-[2px]">
                            {historyData.tracker?.rejection_count || 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-[10px] max-h-[180px] overflow-y-auto pr-[4px]">
                        {(!historyData.history || historyData.history.length === 0) ? (
                          <div className="text-gray-500 text-[0.75rem] text-center py-[10px]">No history records logged yet.</div>
                        ) : (
                          historyData.history.map((log) => {
                            let actionColor = '#70d64d'; // Approved
                            if (log.action === 'REJECTED') actionColor = '#ef4444';
                            else if (log.action === 'SUBMITTED') actionColor = '#3b82f6';
                            else if (log.action === 'DECISION_CHANGED') actionColor = '#f59e0b';

                            return (
                              <div key={log.id} style={{ borderLeft: `2px solid ${actionColor}` }} className="pl-[10px] text-[0.75rem]">
                                <div className="flex justify-between items-center">
                                  <strong style={{ color: actionColor }}>{log.action}</strong>
                                  <span className="text-gray-500 text-[0.65rem]">
                                    {new Date(log.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-[#d1d5db] mt-[2px] text-[0.72rem]">
                                  {log.action === 'SUBMITTED' ? 'Submitted a new application request' : (
                                    <>
                                      Reviewed by: <strong>{log.performer?.full_name || 'Admin'}</strong>
                                    </>
                                  )}
                                </div>
                                {log.rejection_reason && (
                                  <div className="text-[#fca5a5] italic bg-[#271c1c] px-[6px] py-[4px] rounded-[4px] mt-[4px] break-all text-[0.7rem]">
                                    Reason: {log.rejection_reason}
                                  </div>
                                )}
                                {log.can_reapply_at && (
                                  <div className="text-[#fcd34d] text-[0.68rem] mt-[2px]">
                                    Cooldown until: {new Date(log.can_reapply_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-[#888] text-[0.8rem]">Unable to retrieve history.</div>
                  )}
                </div>

                {/* 6. Current Decision info & Actions */}
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px] flex flex-col gap-[8px] border-dashed bg-[#17171a]">
                  <h3 className="text-[0.82rem] font-extrabold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[8px] pb-[6px] border-b border-[#2c2c2c]">Status & Reviews</h3>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#232328] pb-[4px]"><strong>Current State:</strong> <span>{request.status.toUpperCase()}</span></div>
                  {request.status === 'rejected' && (
                    <div className="mt-[8px] text-[0.8rem] text-[#ef4444]">
                      <strong>Rejection Reason:</strong> {request.rejection_reason || 'None provided.'}
                    </div>
                  )}
                  <div className="mt-[16px] flex justify-end">
                    <button onClick={handleOpenEditDecision} className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer transition-opacity duration-150 bg-transparent border border-[#70d64d] text-[#70d64d] px-[12px] py-[7px]">
                      Change Decision / Cooldown
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Decision form view */
            <form onSubmit={handleSaveDecisionUpdate} className="flex flex-col gap-[16px]">
              <h3 className="text-white text-[1rem] font-extrabold m-0 mb-[10px]">
                Change Decision & Cooldown Period
              </h3>

              {/* Status Radio Choice */}
              <div>
                <label className="text-gray-500 text-[0.75rem] font-semibold uppercase tracking-[0.5px] pr-[12px] shrink-0 block mb-[8px]">
                  New Decision Status
                </label>
                <div className="flex gap-[16px]">
                  <label className="flex items-center gap-[8px] text-white cursor-pointer">
                    <input
                      type="radio"
                      name="newStatus"
                      value="approved"
                      checked={newStatus === 'approved'}
                      onChange={() => setNewStatus('approved')}
                    />
                    Approve Request
                  </label>
                  <label className="flex items-center gap-[8px] text-white cursor-pointer">
                    <input
                      type="radio"
                      name="newStatus"
                      value="rejected"
                      checked={newStatus === 'rejected'}
                      onChange={() => setNewStatus('rejected')}
                    />
                    Reject Request
                  </label>
                </div>
              </div>

              {/* Rejected options */}
              {newStatus === 'rejected' && (
                <div className="animate-fade-in flex flex-col gap-[12px] bg-[#1c1c20] p-[16px] rounded-[8px]">
                  {/* Cooldown option dropdown */}
                  <div>
                    <label className="text-gray-500 text-[0.75rem] font-semibold uppercase tracking-[0.5px] pr-[12px] shrink-0 block mb-[6px]">
                      Cooldown Period
                    </label>
                    <select
                      value={cooldownOption}
                      onChange={e => setCooldownOption(e.target.value)}
                      className="w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-[6px] text-white text-[0.85rem] px-[12px] py-[10px] outline-none resize-y font-inherit h-[38px] py-[6px] px-[10px]"
                    >
                      <option value="7">7 Days Cooldown</option>
                      <option value="14">14 Days Cooldown</option>
                      <option value="30">30 Days Cooldown (Standard)</option>
                      <option value="90">90 Days Cooldown</option>
                      <option value="none">No Cooldown (Can reapply immediately)</option>
                      <option value="custom">Custom Date</option>
                    </select>
                  </div>

                  {/* Custom Date Input */}
                  {cooldownOption === 'custom' && (
                    <div className="animate-fade-in">
                      <label className="text-gray-500 text-[0.75rem] font-semibold uppercase tracking-[0.5px] pr-[12px] shrink-0 block mb-[6px]">
                        Select Re-apply Date
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        className="w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-[6px] text-white text-[0.85rem] px-[12px] py-[10px] outline-none resize-y font-inherit h-[38px] py-[6px] px-[10px]"
                        required
                      />
                    </div>
                  )}

                  {/* Optional Rejection Reason checkbox */}
                  <div className="mt-[8px]">
                    <label className="flex items-center gap-[8px] text-white text-[0.8rem] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noReason}
                        onChange={e => setNoReason(e.target.checked)}
                      />
                      Do not provide a rejection reason
                    </label>
                  </div>

                  {/* Rejection Reason Textarea */}
                  {!noReason && (
                    <div>
                      <label className="text-gray-500 text-[0.75rem] font-semibold uppercase tracking-[0.5px] pr-[12px] shrink-0 block mb-[6px]">
                        Reason for Rejection
                      </label>
                      <textarea
                        rows={3}
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Provide reasons for rejection..."
                        className="w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-[6px] text-white text-[0.85rem] px-[12px] py-[10px] outline-none resize-y font-inherit"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Form buttons */}
              <div className="flex gap-[10px] mt-[16px]">
                <button type="submit" className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer border-none transition-opacity duration-150 bg-[#70d64d] text-black px-[16px] py-[8px]" disabled={isPending}>
                  {isPending ? 'Saving Update…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setIsEditingDecision(false)} className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer transition-opacity duration-150 bg-transparent border border-[#23232a] text-[#8a8a8a] px-[12px] py-[7px]">
                  Back to Profile
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer actions for pending status */}
        {!isEditingDecision && request.status === 'pending' && (
          <div className="px-[24px] py-[16px] border-t border-[#2c2c2c] flex gap-[10px] justify-end">
            <button className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer border-none transition-opacity duration-150 bg-[#70d64d] text-black px-[16px] py-[8px]" onClick={() => onApprove(request.id)} disabled={isPending}>
              <Check size={14} /> Approve
            </button>
            <button className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer border-none transition-opacity duration-150 bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] px-[16px] py-[8px]" onClick={() => onReject(request)} disabled={isPending}>
              <X size={14} /> Reject
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* Reject modal */
function RejectModal({ request, onClose, onConfirm, isPending }) {
  const [reason, setReason] = useState('');
  const [noReason, setNoReason] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(request.id, noReason ? '' : reason.trim());
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/75 backdrop-blur-[4px] z-[600]" onClick={onClose} />
      <div style={{ animation: 'modalIn 0.2s ease-out' }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] bg-[#181818] border border-[#2c2c2c] rounded-[10px] overflow-hidden z-[601] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-[12px] px-[24px] py-[20px] border-b border-[#2c2c2c]">
          <div className="w-[36px] h-[36px] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] rounded-full flex items-center justify-center shrink-0"><AlertCircle size={20} color="#ef4444" /></div>
          <div>
            <h3 className="text-white text-[1rem] font-extrabold m-0">Reject Application</h3>
            <p className="text-gray-500 text-[0.78rem] mt-[2px]">{request?.full_name} — {request?.role}</p>
          </div>
          <button onClick={onClose} className="bg-transparent border border-[#2c2c2c] text-[#8a8a8a] rounded-[6px] px-[8px] py-[6px] cursor-pointer flex items-center shrink-0"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-[24px] pt-0">
          <div className="my-[16px] mx-0 mb-[8px]">
            <label className="flex items-center gap-[8px] text-white text-[0.82rem] cursor-pointer">
              <input
                type="checkbox"
                checked={noReason}
                onChange={e => setNoReason(e.target.checked)}
              />
              Do not provide a rejection reason
            </label>
          </div>

          {!noReason && (
            <div className="mt-[12px]">
              <label className="text-gray-500 text-[0.75rem] font-semibold uppercase tracking-[0.5px] pr-[12px] shrink-0 block mb-[8px]">
                Reason for Not Selecting
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe why this application is not being selected…"
                className="w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-[6px] text-white text-[0.85rem] px-[12px] py-[10px] outline-none resize-y font-inherit"
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-[10px] mt-[20px]">
            <button type="submit" className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer border-none transition-opacity duration-150 bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] px-[16px] py-[8px] flex-1" disabled={isPending}>
              <X size={14} /> {isPending ? 'Processing…' : 'Confirm Not Selected'}
            </button>
            <button type="button" onClick={onClose} className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer transition-opacity duration-150 bg-transparent border border-[#23232a] text-[#8a8a8a] px-[12px] py-[7px]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ─── Main AdminDashboard (content only — AppLayout provides shell) ─── */
export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReq,  setSelectedReq]  = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  /* ── fetch request history ── */
  const { data: historyData = null, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['admin-registration-request-history', selectedReq?.id],
    queryFn: () => api.get(`/auth/registration-requests/${selectedReq.id}/history`),
    enabled: !!selectedReq?.id,
  });

  /* ── fetch ── */
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-registration-requests'],
    queryFn:  () => api.get('/auth/registration-requests').then(r => r.requests || []),
  });

  /* ── query mutations ── */
  const [reviewParams, setReviewParams] = useState(null);
  const reviewQuery = useQuery({
    queryKey: ['admin-registration-review', reviewParams],
    queryFn: () => api.post(`/auth/registration-requests/${reviewParams.id}/review`, {
      status: reviewParams.status,
      rejectionReason: reviewParams.rejectionReason,
      canReapplyAt: reviewParams.canReapplyAt,
    }),
    enabled: !!reviewParams,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (reviewQuery.data) {
      toast.success('Application decision saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-registration-requests'] });
      setSelectedReq(null);
      setRejectTarget(null);
      setReviewParams(null);
    }
  }, [reviewQuery.data, queryClient]);

  useEffect(() => {
    if (reviewQuery.error) {
      toast.error(reviewQuery.error.message || 'Operation failed.');
      setReviewParams(null);
    }
  }, [reviewQuery.error]);

  /* ── handlers ── */
  const handleApprove       = (id)          => setReviewParams({ id, status: 'approved' });
  const handleOpenReject    = (req)         => setRejectTarget(req);
  const handleConfirmReject = (id, reason)  => setReviewParams({ id, status: 'rejected', rejectionReason: reason });
  const handleUpdateDecision = (id, params) => setReviewParams({ id, ...params });

  const filtered = useMemo(() => {
    const list = requests.filter(r => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        r.full_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.mobile?.includes(q);
      return matchStatus && matchSearch;
    });
    return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [requests, statusFilter, search]);

  const stats = useMemo(() => ({
    total:    requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }), [requests]);

  /* ── render (content only) ── */
  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[16px] mb-[28px]">
        <StatCard label="TOTAL REQUESTS"  value={isLoading ? <span className="skeleton-pulse inline-block w-[40px] h-[28px] rounded-[4px] align-middle" /> : stats.total}    Icon={FileText}  />
        <StatCard label="PENDING REVIEW"  value={isLoading ? <span className="skeleton-pulse inline-block w-[40px] h-[28px] rounded-[4px] align-middle" /> : stats.pending}  Icon={Clock}     accent />
        <StatCard label="APPROVED"        value={isLoading ? <span className="skeleton-pulse inline-block w-[40px] h-[28px] rounded-[4px] align-middle" /> : stats.approved} Icon={Users}     />
        <StatCard label="NOT SELECTED"     value={isLoading ? <span className="skeleton-pulse inline-block w-[40px] h-[28px] rounded-[4px] align-middle" /> : stats.rejected} Icon={Building2} />
      </div>

      {/* Table card */}
      <div className="bg-[#121215] border border-[#23232a] rounded-[8px] p-[24px]">
        {/* controls */}
        <div className="flex justify-between items-center mb-[20px] flex-wrap gap-[12px]">
          <div className="relative flex items-center flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-[12px] text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-[#23232a] rounded-[6px] text-white text-[0.85rem] pl-[36px] pr-[12px] py-[8px] outline-none"
            />
          </div>
          <div className="flex gap-[6px] flex-wrap">
            {['all', 'pending', 'approved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`bg-[#0c0c0e] border border-[#23232a] rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer ${
                  statusFilter === s ? 'bg-[#70d64d] text-black border-[#70d64d] font-bold' : 'text-gray-500'
                }`}
              >
                {s === 'rejected' ? 'Not Selected' : (s.charAt(0).toUpperCase() + s.slice(1))}
              </button>
            ))}
            <button
              onClick={() => refetch()}
              className="bg-[#0c0c0e] border border-[#23232a] text-gray-500 rounded-[6px] px-[14px] py-[7px] text-[0.8rem] cursor-pointer flex items-center gap-[5px]"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {['Full Name', 'Email', 'Mobile', 'Role', 'Status', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="text-gray-500 text-[0.68rem] font-bold px-[14px] py-[12px] border-b border-[#23232a] tracking-[0.5px] whitespace-nowrap">{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                      <div className="skeleton-pulse w-[120px] h-[16px] rounded-[4px]" />
                    </td>
                    <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                      <div className="skeleton-pulse w-[150px] h-[14px] rounded-[4px]" />
                    </td>
                    <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                      <div className="skeleton-pulse w-[90px] h-[14px] rounded-[4px]" />
                    </td>
                    <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                      <div className="skeleton-pulse w-[80px] h-[22px] rounded-[12px]" />
                    </td>
                    <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                      <div className="skeleton-pulse w-[70px] h-[20px] rounded-[4px]" />
                    </td>
                    <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                      <div className="skeleton-pulse w-[100px] h-[14px] rounded-[4px]" />
                    </td>
                    <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                      <div className="flex gap-[8px]">
                        <div className="skeleton-pulse w-[70px] h-[28px] rounded-[6px]" />
                        <div className="skeleton-pulse w-[70px] h-[28px] rounded-[6px]" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-[40px] text-gray-500 text-[0.88rem]">No requests match your criteria.</td></tr>
              ) : filtered.map(req => (
                <tr key={req.id} className="transition-colors duration-100">
                  <td className="p-[14px] border-b border-[#1a1a22] align-middle"><strong className="text-white text-[0.88rem]">{req.full_name}</strong></td>
                  <td className="p-[14px] border-b border-[#1a1a22] align-middle text-[#8a8a8a] text-[0.83rem]">{req.email}</td>
                  <td className="p-[14px] border-b border-[#1a1a22] align-middle text-[#8a8a8a] text-[0.83rem]">{req.mobile}</td>
                  <td className="p-[14px] border-b border-[#1a1a22] align-middle"><RoleChip role={req.role} /></td>
                  <td className="p-[14px] border-b border-[#1a1a22] align-middle"><StatusBadge status={req.status} /></td>
                  <td className="p-[14px] border-b border-[#1a1a22] align-middle text-[#6b6b6b] text-[0.8rem]">{fmtDate(req.created_at)}</td>
                  <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                    <div className="flex gap-[6px] items-center">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer transition-opacity duration-150 bg-transparent border border-[#23232a] text-[#8a8a8a] px-[8px] py-[5px]"
                        title="View details"
                      >
                        <Eye size={13} />
                      </button>
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={reviewQuery.isFetching}
                            className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer border-none transition-opacity duration-150 bg-[rgba(112,214,77,0.1)] text-[#70d64d] border border-[rgba(112,214,77,0.3)] px-[9px] py-[5px]"
                            title="Approve"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenReject(req)}
                            disabled={reviewQuery.isFetching}
                            className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer border-none transition-opacity duration-150 bg-[rgba(239,68,68,0.08)] text-[#ef4444] border border-[rgba(239,68,68,0.25)] px-[9px] py-[5px]"
                            title="Reject"
                          >
                            <X size={12} /> Reject
                          </button>
                        </>
                      )}
                      {req.status !== 'pending' && (
                        <button
                          onClick={() => setSelectedReq(req)}
                          className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer transition-opacity duration-150 bg-transparent border border-[#70d64d] text-[#70d64d] px-[8px] py-[3px]"
                        >
                          Change Decision
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="mt-[16px] flex justify-end">
          <span className="text-[#6b6b6b] text-[0.8rem]">
            Showing {filtered.length} of {requests.length} entries
          </span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReq && (
        <DetailModal
          request={selectedReq}
          historyData={historyData}
          isLoadingHistory={isLoadingHistory}
          onClose={() => setSelectedReq(null)}
          onApprove={handleApprove}
          onReject={handleOpenReject}
          onUpdateDecision={handleUpdateDecision}
          isPending={reviewQuery.isFetching}
        />
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleConfirmReject}
          isPending={reviewQuery.isFetching}
        />
      )}
    </div>
  );
}

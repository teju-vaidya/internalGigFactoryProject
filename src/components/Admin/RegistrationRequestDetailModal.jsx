import React, { useState } from 'react';
import { X, Check, AlertCircle, Users, Building2, FileText, Clock } from 'lucide-react';
import { StatusBadge } from '../AdminShared';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const ROLE_STYLES = {
  gig_expert: { bg: '#1e293b', color: '#38bdf8' },
  agency: { bg: '#2e1065', color: '#c084fc' },
};

function RoleChip({ role }) {
  const r = ROLE_STYLES[role] || ROLE_STYLES.gig_expert;
  return (
    <span
      style={{ background: r.bg, color: r.color }}
      className="text-[0.68rem] font-bold px-[8px] py-[3px] rounded-[4px]"
    >
      {role === 'gig_expert' ? 'GIG EXPERT' : role?.toUpperCase()}
    </span>
  );
}

export const RegistrationRequestDetailModal = ({ request, historyData, isLoadingHistory, onClose, onApprove, onReject, onUpdateDecision, isPending }) => {
  if (!request) return null;
  const app = request.application_data || {};
  const [isEditingDecision, setIsEditingDecision] = useState(false);
  const [newStatus, setNewStatus] = useState(request.status);
  const [rejectReason, setRejectReason] = useState(request.rejection_reason || '');
  const [noReason, setNoReason] = useState(false);
  const [cooldownOption, setCooldownOption] = useState('30');
  const [customDate, setCustomDate] = useState('');

  const handleOpenEditDecision = () => {
    setNewStatus(request.status);
    setRejectReason(request.rejection_reason || '');
    setIsEditingDecision(true);
    if (request.can_reapply_at) {
      const diffDays = Math.ceil((new Date(request.can_reapply_at) - Date.now()) / (1000 * 60 * 60 * 24));
      if ([7, 14, 30, 90].includes(diffDays)) setCooldownOption(String(diffDays));
      else {
        setCooldownOption('custom');
        setCustomDate(new Date(request.can_reapply_at).toISOString().split('T')[0]);
      }
    } else setCooldownOption('30');
  };

  const handleSaveDecisionUpdate = (e) => {
    e.preventDefault();
    let calculatedDate = null;
    if (newStatus === 'rejected') {
      if (cooldownOption === 'none') calculatedDate = new Date(Date.now() - 1000).toISOString();
      else if (cooldownOption === 'custom') calculatedDate = customDate ? new Date(customDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      else calculatedDate = new Date(Date.now() + (parseInt(cooldownOption) || 30) * 24 * 60 * 60 * 1000).toISOString();
    }
    onUpdateDecision(request.id, { status: newStatus, rejectionReason: newStatus === 'rejected' ? (noReason ? '' : rejectReason.trim()) : null, canReapplyAt: calculatedDate });
  };

  const btnBaseClass = "inline-flex items-center gap-[5px] rounded-[5px] text-[0.8rem] font-bold cursor-pointer transition-opacity duration-150";
  const textareaClass = "w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-[6px] text-white text-[0.85rem] px-[12px] py-[10px] outline-none resize-y font-inherit box-border";
  const selectClass = "w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-[6px] text-white text-[0.85rem] px-[10px] py-[6px] outline-none resize-y font-inherit h-[38px] box-border";

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/75 backdrop-blur-[4px] z-[600]" />
      <div
        style={{ animation: 'modalIn 0.2s ease-out' }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[800px] bg-[#181818] border border-[#2c2c2c] rounded-[12px] overflow-hidden z-[601] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-start justify-between padding-[24px] p-[24px] border-b border-[#2c2c2c]">
          <div>
            <h2 className="text-white text-[1.2rem] font-extrabold m-0 mb-[8px]">
              {request.full_name}
            </h2>
            <div className="flex gap-[8px] flex-wrap">
              <RoleChip role={request.role === 'gig_expert' ? 'GIG EXPERT' : request.role} />
              <StatusBadge status={request.status} />
              {request.status === 'rejected' && request.can_reapply_at && (
                <span className="text-[0.72rem] bg-[#3b2314] text-[#f59e0b] px-[8px] py-[3px] rounded-[4px] font-semibold">
                  Cooldown until: {fmtDate(request.can_reapply_at)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border border-[#2c2c2c] text-[#8a8a8a] rounded-[6px] px-[8px] py-[6px] cursor-pointer flex items-center"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto p-[24px]">
          {!isEditingDecision ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left */}
              <div className="flex flex-col gap-[14px]">
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px]">
                  <p className="text-[0.75rem] font-bold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[12px] pb-[8px] border-b border-[#2c2c2c]">Personal & Contact</p>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Email:</strong> <span>{request.email}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Mobile:</strong> <span>{request.mobile}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Designation:</strong> <span>{app.designation || app.title || 'N/A'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Location:</strong> <span>{app.location || app.headquarters || 'N/A'}</span></div>
                  {app.linkedinUrl && <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>LinkedIn:</strong> <a href={app.linkedinUrl} target="_blank" rel="noreferrer" className="text-[#70d64d] hover:underline">View Profile</a></div>}
                  {app.website && <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Website:</strong> <a href={app.website} target="_blank" rel="noreferrer" className="text-[#70d64d] hover:underline">{app.website}</a></div>}
                </div>
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px]">
                  <p className="text-[0.75rem] font-bold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[12px] pb-[8px] border-b border-[#2c2c2c]">Legal & Identification</p>
                  {request.role === 'gig_expert' ? (<>
                    <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Legal Name (PAN):</strong> <span>{app.legalNamePan || 'N/A'}</span></div>
                    <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Personal PAN:</strong> <span className="uppercase">{app.personalPan || 'N/A'}</span></div>
                  </>) : (<>
                    <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Registered Name:</strong> <span>{app.registeredName || 'N/A'}</span></div>
                    <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Auth. Person:</strong> <span>{app.authPersonName || 'N/A'}</span></div>
                    <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Company PAN:</strong> <span className="uppercase">{app.companyPan || 'N/A'}</span></div>
                    <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>GSTIN:</strong> <span className="uppercase">{app.gstNumber || 'N/A'}</span></div>
                    <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>CIN:</strong> <span className="uppercase">{app.cin || 'N/A'}</span></div>
                  </>)}
                </div>
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px]">
                  <p className="text-[0.75rem] font-bold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[12px] pb-[8px] border-b border-[#2c2c2c]">Availability & Sign-off</p>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Availability:</strong> <span>{app.availability || 'Project basis'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Notice Period:</strong> <span>{app.noticePeriod || 'Immediate'}</span></div>
                  {request.role === 'agency' && <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Team Size:</strong> <span>{app.teamSize || 'N/A'} employees</span></div>}
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Signee:</strong> <span>{app.signatureName || 'N/A'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]">
                    <strong>Declaration:</strong>
                    <span
                      className="font-semibold"
                      style={{ color: app.declarationAccepted ? '#70d64d' : '#ef4444' }}
                    >
                      {app.declarationAccepted ? 'Accepted' : 'Declined'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Right */}
              <div className="flex flex-col gap-[14px]">
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px]">
                  <p className="text-[0.75rem] font-bold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[12px] pb-[8px] border-b border-[#2c2c2c]">Services & Capability</p>
                  <div className="flex flex-wrap gap-[6px] mb-[12px]">
                    {(app.selectedServices || []).map(srv => (
                      <span key={srv} className="bg-[#1e293b] text-[#38bdf8] text-[0.72rem] font-semibold px-[8px] py-[3px] rounded-[4px]">{srv}</span>
                    ))}
                  </div>
                  {app.portfolioUrl && <div><strong className="text-[0.82rem]">Portfolio: </strong><a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-[#70d64d] text-[0.82rem] hover:underline">Open Link</a></div>}
                  {app.portfolioPdfUrl && <div className="mt-1"><strong className="text-[0.82rem]">Portfolio PDF: </strong><a href={app.portfolioPdfUrl} target="_blank" rel="noreferrer" className="text-[#70d64d] text-[0.82rem] hover:underline">View PDF</a></div>}
                </div>
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px]">
                  <p className="text-[0.75rem] font-bold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[12px] pb-[8px] border-b border-[#2c2c2c]">Commercial Rates</p>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Base Rate:</strong> <span>INR {app.baseRate || 'N/A'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Billing Basis:</strong> <span>{app.billingBasis || 'Hourly'}</span></div>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Commercial Basis:</strong> <span>{app.commercialBasis || 'N/A'}</span></div>
                </div>
                {/* History */}
                {isLoadingHistory ? (
                  <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px]"><p className="text-[0.75rem] font-bold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[12px] pb-[8px] border-b border-[#2c2c2c]">Attempts & History</p><p className="text-gray-500 text-[0.8rem]">Loading...</p></div>
                ) : historyData && (
                  <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px]">
                    <p className="text-[0.75rem] font-bold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[12px] pb-[8px] border-b border-[#2c2c2c]">Attempts & History</p>
                    <div className="grid grid-cols-2 gap-[10px] mb-[12px]">
                      {[
                        ['Total Attempts', historyData.tracker?.total_attempts || 0, '#fff'],
                        ['Not Selected', historyData.tracker?.rejection_count || 0, '#ef4444']
                      ].map(([l, v, c]) => (
                        <div key={l} className="bg-[#121215] border border-[#2c2c2c] p-[8px] rounded-[6px] text-center">
                          <p className="text-[0.65rem] text-gray-500 uppercase font-bold m-0">{l}</p>
                          <p style={{ color: c }} className="text-[1.2rem] font-extrabold m-0 mt-[4px]">{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-[8px] max-h-[150px] overflow-y-auto">
                      {(historyData.history || []).map(log => {
                        const c = log.action === 'REJECTED' ? '#ef4444' : log.action === 'SUBMITTED' ? '#3b82f6' : log.action === 'DECISION_CHANGED' ? '#f59e0b' : '#70d64d';
                        return (
                          <div key={log.id} style={{ borderLeft: `2px solid ${c}` }} className="pl-[10px] text-[0.75rem]">
                            <div className="flex justify-between">
                              <strong style={{ color: c }}>{log.action === 'REJECTED' ? 'NOT SELECTED' : log.action}</strong>
                              <span className="text-gray-500 text-[0.65rem]">{new Date(log.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="text-[#d1d5db] mt-[2px]">
                              {log.action === 'SUBMITTED' ? 'Submitted application' : <>Reviewed by <strong>{log.performer?.full_name || 'Admin'}</strong></>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Decision card */}
                <div className="bg-[#1c1c20] border border-[#2c2c2c] rounded-[8px] p-[16px] border-dashed bg-[#17171a]">
                  <p className="text-[0.75rem] font-bold uppercase tracking-[0.5px] text-[#70d64d] m-0 mb-[12px] pb-[8px] border-b border-[#2c2c2c]">Status & Reviews</p>
                  <div className="flex justify-between text-[0.82rem] border-b border-[#1e1e1e] py-[5px]"><strong>Current State:</strong> <span>{request.status?.toUpperCase()}</span></div>
                  {request.status === 'rejected' && <div className="mt-[8px] text-[0.8rem] text-[#ef4444]"><strong>Not Selected Reason:</strong> {request.rejection_reason || 'None.'}</div>}
                  <div className="mt-[16px] flex justify-end">
                    <button
                      onClick={handleOpenEditDecision}
                      className="inline-flex items-center gap-[5px] rounded-[5px] text-[0.8rem] font-bold cursor-pointer border border-[#70d64d] text-[#70d64d] bg-transparent px-[14px] py-[7px] transition-opacity duration-150"
                    >
                      Change Decision / Cooldown
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveDecisionUpdate} className="flex flex-col gap-[16px]">
              <h3 className="text-white text-[1rem] font-extrabold m-0 mb-[10px]">Change Decision & Cooldown</h3>
              <div className="flex gap-[20px]">
                {['approved', 'not Selected'].map(v => (
                  <label key={v} className="flex items-center gap-[8px] text-white cursor-pointer">
                    <input type="radio" name="newStatus" value={v} checked={newStatus === v} onChange={() => setNewStatus(v)} className="accent-[#70d64d]" />
                    {v === 'rejected' ? 'Not Selected' : (v.charAt(0).toUpperCase() + v.slice(1))} Request
                  </label>
                ))}
              </div>
              {newStatus === 'rejected' && (
                <div className="flex flex-col gap-[12px] bg-[#1c1c20] p-[16px] rounded-[8px]">
                  <div>
                    <label className="text-gray-500 text-[0.75rem] font-semibold uppercase block mb-[6px]">Cooldown Period</label>
                    <select value={cooldownOption} onChange={e => setCooldownOption(e.target.value)} className={selectClass}>
                      {[['7', '7 Days'], ['14', '14 Days'], ['30', '30 Days (Standard)'], ['90', '90 Days'], ['none', 'No Cooldown'], ['custom', 'Custom Date']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  {cooldownOption === 'custom' && (
                    <div>
                      <label className="text-gray-500 text-[0.75rem] font-semibold uppercase block mb-[6px]">Re-apply Date</label>
                      <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className={selectClass} required />
                    </div>
                  )}
                  <label className="flex items-center gap-[8px] text-white text-[0.8rem] cursor-pointer">
                    <input type="checkbox" checked={noReason} onChange={e => setNoReason(e.target.checked)} className="accent-[#70d64d]" />
                    Do not provide a not selected reason
                  </label>
                  {!noReason && (
                    <div>
                      <label className="text-gray-500 text-[0.75rem] font-semibold uppercase block mb-[6px]">Reason For Not Selected</label>
                      <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Describe why..." className={textareaClass} />
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-[10px] mt-[8px]">
                <button type="submit" className={`${btnBaseClass} bg-[#70d64d] text-black px-[18px] py-[9px]`} disabled={isPending}>
                  {isPending ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setIsEditingDecision(false)} className={`${btnBaseClass} bg-transparent border border-[#23232a] text-[#8a8a8a] px-[18px] py-[9px]`}>
                  Back to Profile
                </button>
              </div>
            </form>
          )}
        </div>

        {!isEditingDecision && request.status === 'pending' && (
          <div className="p-[24px] pt-[16px] pb-[16px] border-t border-[#2c2c2c] flex justify-end gap-[10px]">
            <button className={`${btnBaseClass} bg-[#70d64d] text-black px-[18px] py-[9px]`} onClick={() => onApprove(request.id)} disabled={isPending}>
              <Check size={14} /> Approve
            </button>
            <button className={`${btnBaseClass} bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] px-[18px] py-[9px]`} onClick={() => onReject(request)} disabled={isPending}>
              <X size={14} /> Not Select
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default RegistrationRequestDetailModal;

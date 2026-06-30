import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, FileText, Globe, ExternalLink } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../utils/api';
import { CompletionBar, STATUS_CFG, ActivityHistoryView } from '../AdminShared';

// Import Profile Detailed View subcomponents
import { ProfileHeader } from '../Profile/ProfileHeader';
import { ProfileStats } from '../Profile/ProfileStats';
import { ProfileAbout } from '../Profile/ProfileAbout';
import { WorkHistory } from '../Profile/WorkHistory';
import { CapabilityCloud } from '../Profile/CapabilityCloud';
import { ServiceSpecs } from '../Profile/ServiceSpecs';
import { DocumentsList } from '../Profile/DocumentsList';
import '../../pages/Profile/Profile.css';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function Avatar({ name, photo, size = 40 }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return photo ? (
    <img 
      src={photo} 
      alt={name} 
      style={{ width: size, height: size }} 
      className="rounded-full object-cover shrink-0 border border-[#23232a]" 
    />
  ) : (
    <div 
      style={{ width: size, height: size, fontSize: `${size * 0.35}px` }} 
      className="rounded-full bg-gradient-to-br from-[#1e293b] to-[#2563eb22] border border-[#23232a] flex items-center justify-center font-extrabold text-[#38bdf8] shrink-0"
    >
      {initials}
    </div>
  );
}

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const GigExpertModal = ({ gigExpert, onClose }) => {
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendInput, setShowSuspendInput] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${gigExpert?.id}/suspend`, { reason: suspendReason }),
    onSuccess: (res) => {
      toast.success(res.message || 'Account suspended.');
      queryClient.invalidateQueries({ queryKey: ['admin-gigExperts'] });
      if (gigExpert) gigExpert.account_status = 'suspended';
      setShowSuspendInput(false);
      setSuspendReason('');
    },
    onError: (err) => {
      toast.error(err.message || 'Suspension failed.');
    }
  });

  const reactivateMutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${gigExpert?.id}/unsuspend`),
    onSuccess: (res) => {
      toast.success(res.message || 'Account reactivated.');
      queryClient.invalidateQueries({ queryKey: ['admin-gigExperts'] });
      if (gigExpert) gigExpert.account_status = 'approved';
    },
    onError: (err) => {
      toast.error(err.message || 'Reactivation failed.');
    }
  });

  if (!gigExpert) return null;
  const fp = gigExpert.gig_expert_profile || {};
  const skills = fp?.gig_expert_skills?.map(s => s.skill_name) || [];

  const statusCfg = STATUS_CFG[gigExpert.account_status] || STATUS_CFG.pending;

  const btnBaseClass = "inline-flex items-center gap-[5px] rounded-[5px] text-[0.8rem] font-bold cursor-pointer transition-opacity duration-150";

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-[5px] z-[600]" />
      <div 
        style={{ animation: 'modalIn 0.2s ease-out' }} 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[800px] bg-[#121215] border border-[#23232a] rounded-[12px] overflow-hidden z-[601] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-[24px] border-b border-[#23232a] bg-[#0c0c0e]">
          <div className="flex items-center gap-[16px]">
            <Avatar name={gigExpert.full_name} photo={gigExpert.profile_photo} size={50} />
            <div>
              <h2 className="text-white text-[1.25rem] font-extrabold m-0 mb-[4px]">
                {gigExpert.full_name}
              </h2>
              <div className="flex gap-[8px] items-center">
                <span 
                  style={{ background: statusCfg.bg, color: statusCfg.color }} 
                  className="inline-flex items-center gap-[5px] px-[8px] py-[3px] rounded-[4px] text-[0.68rem] font-bold"
                >
                  {gigExpert.account_status?.toUpperCase()}
                </span>
                <span className="text-[0.75rem] text-gray-500">
                  {gigExpert.is_verified ? '✓ VERIFIED USER' : 'UNVERIFIED USER'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[12px]">
            <button 
              onClick={() => {
                onClose();
                navigate(`/admin/users/${gigExpert.id}/profile`);
              }}
              className="bg-[rgba(112,214,77,0.1)] border border-[rgba(112,214,77,0.3)] text-[#70d64d] px-[12px] py-[6px] rounded-[6px] text-[0.75rem] font-bold cursor-pointer flex items-center gap-[6px] transition-opacity hover:opacity-90"
            >
              Open Full View <ExternalLink size={12} />
            </button>
            <button 
              onClick={onClose} 
              className="bg-transparent border border-[#23232a] text-[#8a8a8a] rounded-[6px] px-[8px] py-[6px] cursor-pointer flex items-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-[#23232a] bg-[#0c0c0e] px-[24px]">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`bg-transparent border-none border-b-2 px-[16px] py-[12px] text-[0.85rem] cursor-pointer focus:outline-none transition-all duration-150 ${
              activeTab === 'overview' 
                ? 'border-b-[#70d64d] text-[#70d64d] font-bold' 
                : 'border-b-transparent text-[#8a8a8a] font-medium'
            }`}
          >
            Admin Overview
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`bg-transparent border-none border-b-2 px-[16px] py-[12px] text-[0.85rem] cursor-pointer focus:outline-none transition-all duration-150 ${
              activeTab === 'profile' 
                ? 'border-b-[#70d64d] text-[#70d64d] font-bold' 
                : 'border-b-transparent text-[#8a8a8a] font-medium'
            }`}
          >
            Detailed Profile View
          </button>
          <button 
            onClick={() => setActiveTab('activity')} 
            className={`bg-transparent border-none border-b-2 px-[16px] py-[12px] text-[0.85rem] cursor-pointer focus:outline-none transition-all duration-150 ${
              activeTab === 'activity' 
                ? 'border-b-[#70d64d] text-[#70d64d] font-bold' 
                : 'border-b-transparent text-[#8a8a8a] font-medium'
            }`}
          >
            Activity & History
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[68vh] overflow-y-auto p-[24px]">
          
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
              
              {/* Left Column */}
              <div className="flex flex-col gap-[16px]">
                {/* About */}
                <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[18px]">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.6px] text-[#70d64d] m-0 mb-[14px] pb-[6px] border-b border-[#23232a]">About / Bio</p>
                  <p className="text-[#8a8a8a] text-[0.88rem] leading-[1.5] m-0">
                    {fp.bio || 'No bio provided.'}
                  </p>
                </div>

                {/* Profile Details */}
                <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[18px]">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.6px] text-[#70d64d] m-0 mb-[14px] pb-[6px] border-b border-[#23232a]">Profile Overview</p>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Designation:</strong> <span>{fp.title || '—'}</span></div>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Experience:</strong> <span>{fp.experience_years ? `${fp.experience_years} Years` : '—'}</span></div>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]">
                    <strong>Availability:</strong> 
                    <span style={{ color: fp.availability === 'AVAILABLE' ? '#70d64d' : '#8a8a8a' }}>{fp.availability || '—'}</span>
                  </div>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Notice Period:</strong> <span>{fp.notice_period || '—'}</span></div>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Commercial Basis:</strong> <span>{fp.commercial_basis || '—'}</span></div>
                  {fp.legal_name_pan && <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Legal Name (PAN):</strong> <span>{fp.legal_name_pan}</span></div>}
                  {fp.personal_pan && <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Personal PAN:</strong> <span className="uppercase">{fp.personal_pan}</span></div>}
                </div>

                {/* Account Management Actions */}
                <div className="bg-[#1c0c0e] border border-[#ef444433] rounded-[8px] p-[18px]">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.6px] text-[#ef4444] m-0 mb-[14px] pb-[6px] border-b border-[#ef444433]">Account Management</p>
                  {gigExpert.account_status === 'suspended' ? (
                    <div className="flex flex-col gap-[10px]">
                      <p className="text-[#ef4444] text-[0.8rem] m-0">This account is currently suspended.</p>
                      <button
                        disabled={reactivateMutation.isPending}
                        onClick={() => reactivateMutation.mutate()}
                        className="bg-[#70d64d] text-black border-none rounded-[6px] p-[10px] text-[0.8rem] font-bold cursor-pointer text-center w-full transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {reactivateMutation.isPending ? 'Reactivating...' : 'REACTIVATE ACCOUNT'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-[10px]">
                      {!showSuspendInput ? (
                        <button
                          onClick={() => setShowSuspendInput(true)}
                          className="bg-transparent border border-[#ef4444] text-[#ef4444] rounded-[6px] p-[10px] text-[0.8rem] font-bold cursor-pointer text-center w-full transition-colors hover:bg-[#ef4444]/10"
                        >
                          SUSPEND ACCOUNT
                        </button>
                      ) : (
                        <div className="flex flex-col gap-[8px]">
                          <input
                            type="text"
                            placeholder="Reason for suspension..."
                            value={suspendReason}
                            onChange={e => setSuspendReason(e.target.value)}
                            className="bg-black border border-[#ef4444] rounded-[6px] px-[12px] py-[8px] text-white text-[0.8rem] outline-none"
                          />
                          <div className="flex gap-[8px]">
                            <button
                              type="button"
                              onClick={() => setShowSuspendInput(false)}
                              className="flex-1 bg-[#1c1c20] border border-[#23232a] text-[#8a8a8a] rounded-[6px] py-[8px] text-[0.75rem] font-bold cursor-pointer transition-colors hover:bg-[#23232a]/20"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={suspendMutation.isPending}
                              onClick={() => {
                                if (!suspendReason.trim()) {
                                  toast.error('Please enter a suspension reason.');
                                  return;
                                  }
                                suspendMutation.mutate();
                              }}
                              className="flex-1 bg-[#ef4444] text-white border-none rounded-[6px] py-[8px] text-[0.75rem] font-bold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                              {suspendMutation.isPending ? 'Suspending...' : 'Confirm Suspend'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-[16px]">
                {/* Key Rates & Stats */}
                <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[18px]">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.6px] text-[#70d64d] m-0 mb-[14px] pb-[6px] border-b border-[#23232a]">Rates & Completion</p>
                  <div className="flex justify-between items-center mb-[14px]">
                    <span className="text-[0.85rem] text-gray-500 font-semibold">HOURLY RATE</span>
                    <span className="text-[1.2rem] text-[#70d64d] font-bold">{fp.hourly_rate ? `₹${fp.hourly_rate}/hr` : '—'}</span>
                  </div>
                  <CompletionBar value={fp.profile_completion || 0} />
                </div>

                {/* Contact Information */}
                <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[18px]">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.6px] text-[#70d64d] m-0 mb-[14px] pb-[6px] border-b border-[#23232a]">Contact Info</p>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Email:</strong> <span>{gigExpert.email}</span></div>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Phone:</strong> <span>{gigExpert.mobile || '—'}</span></div>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Location:</strong> <span>{fp.city && fp.country ? `${fp.city}, ${fp.country}` : '—'}</span></div>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Registered On:</strong> <span>{fmtDate(gigExpert.created_at)}</span></div>
                  <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Last Login:</strong> <span>{fmtDate(gigExpert.last_login)}</span></div>
                </div>

                {/* Skills */}
                <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[18px]">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.6px] text-[#70d64d] m-0 mb-[14px] pb-[6px] border-b border-[#23232a]">Skills</p>
                  <div className="flex flex-wrap gap-[6px]">
                    {skills.map(s => (
                      <span key={s} className="bg-[#1e293b] text-[#38bdf8] text-[0.72rem] font-semibold px-[8px] py-[3px] rounded-[4px]">
                        {s}
                      </span>
                    ))}
                    {skills.length === 0 && <span className="text-gray-500 text-[0.8rem] italic">No skills listed.</span>}
                  </div>
                </div>

                {/* Documents & Links */}
                <div className="bg-[#0c0c0e] border border-[#23232a] rounded-[8px] p-[18px]">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.6px] text-[#70d64d] m-0 mb-[14px] pb-[6px] border-b border-[#23232a]">Links & Attachments</p>
                  <div className="flex flex-col gap-[8px]">
                    {fp.resume_url && (
                      <a
                        href={fp.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-[6px] bg-[#70d64d] text-black text-[0.8rem] font-bold p-[8px] rounded-[6px] text-center no-underline transition-opacity hover:opacity-90"
                      >
                        <FileText size={14} /> View Resume / CV
                      </a>
                    )}
                    {fp.portfolio_url && (
                      <a
                        href={fp.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-[6px] border border-[#23232a] text-white text-[0.8rem] font-bold p-[8px] rounded-[6px] text-center no-underline bg-[#0c0c0e] transition-colors hover:border-gray-500"
                      >
                        <Globe size={14} /> Portfolio Site <ExternalLink size={11} />
                      </a>
                    )}
                    {fp.portfolio_pdf_url && (
                      <a
                        href={fp.portfolio_pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-[6px] border border-[#23232a] text-white text-[0.8rem] font-bold p-[8px] rounded-[6px] text-center no-underline bg-[#0c0c0e] transition-colors hover:border-gray-500"
                      >
                        <FileText size={14} /> Portfolio PDF <ExternalLink size={11} />
                      </a>
                    )}
                    {fp.linkedin_url && (
                      <a
                        href={fp.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-[6px] border border-[#23232a] text-white text-[0.8rem] font-bold p-[8px] rounded-[6px] text-center no-underline bg-[#0c0c0e] transition-colors hover:border-gray-500"
                      >
                        LinkedIn Profile <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-workspace-view animate-fade-in" style={{ padding: '0', background: 'transparent' }}>
              <ProfileHeader
                isGigExpert={true}
                name={gigExpert.full_name}
                avatar={gigExpert.profile_photo}
                subtitle={fp.title}
                emailVal={gigExpert.email}
                phoneVal={gigExpert.mobile}
                locationVal={fp.city && fp.country ? `${fp.city}, ${fp.country}` : 'Not Specified'}
                webVal={fp.portfolio_url}
                initials={getInitials(gigExpert.full_name)}
                availability={fp.availability}
                hideEditButton={true}
              />

              <ProfileStats
                isGigExpert={true}
                totalProjects={fp.total_projects}
                hourlyRate={fp.hourly_rate}
                commercialBasis={fp.commercial_basis}
              />

              <div className="profile-details-split-grid mt-[20px]">
                <div className="profile-details-left-pane">
                  <ProfileAbout
                    isGigExpert={true}
                    bio={fp.bio}
                  />
                  <WorkHistory workHistory={gigExpert.work_history} />
                </div>

                <div className="profile-details-right-pane">
                  <CapabilityCloud
                    isGigExpert={true}
                    skills={fp.gig_expert_skills || []}
                  />
                  <ServiceSpecs serviceDetails={fp.service_details} />
                  <DocumentsList
                    isGigExpert={true}
                    resumeUrl={fp.resume_url}
                    portfolioPdfUrl={fp.portfolio_pdf_url}
                    verifications={gigExpert.verifications}
                    isAdmin={true}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <ActivityHistoryView id={gigExpert.id} />
          )}

        </div>
      </div>
    </>
  );
};

export default GigExpertModal;

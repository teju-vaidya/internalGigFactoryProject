import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Globe, Users, Briefcase, Mail, Phone, MapPin, ExternalLink, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../utils/api';
import { CompletionBar, STATUS_CFG, ActivityHistoryView } from '../AdminShared';


// Import Profile Detailed View subcomponents
import { ProfileHeader } from '../Profile/ProfileHeader';
import { ProfileStats } from '../Profile/ProfileStats';
import { ProfileAbout } from '../Profile/ProfileAbout';
import { TeamStructure } from '../Profile/TeamStructure';
import { CapabilityCloud } from '../Profile/CapabilityCloud';
import { ServiceSpecs } from '../Profile/ServiceSpecs';
import { DocumentsList } from '../Profile/DocumentsList';
import '../../pages/Profile/Profile.css';

const SERVICE_LABELS = {
  BIM: 'BIM & 2D Drafting',
  Audit: 'As-Built Audit',
  Peer: 'Peer Review',
  BOQ: 'BOQ Creation',
  Viz: '3D Visualisation',
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};


const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function AgencyLogo({ name, logo, size = 42 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  return logo ? (
    <img 
      src={logo} 
      alt={name} 
      className="rounded-lg object-cover shrink-0 border border-[#23232a] bg-[#1c1c20]"
      style={{ width: size, height: size }} 
    />
  ) : (
    <div 
      className="rounded-lg border border-[#3b2a6a] flex items-center justify-center font-extrabold text-[#c084fc] shrink-0 bg-gradient-to-br from-[#2e1065] to-[#4c1d95]"
      style={{ width: size, height: size, fontSize: `${size * 0.3}px` }}
    >
      {initials}
    </div>
  );
}

export const AgencyModal = ({ agency, onClose }) => {
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendInput, setShowSuspendInput] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${agency?.id}/suspend`, { reason: suspendReason }),
    onSuccess: (res) => {
      toast.success(res.message || 'Account suspended.');
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      if (agency) agency.account_status = 'suspended';
      setShowSuspendInput(false);
      setSuspendReason('');
    },
    onError: (err) => {
      toast.error(err.message || 'Suspension failed.');
    }
  });

  const reactivateMutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${agency?.id}/unsuspend`),
    onSuccess: (res) => {
      toast.success(res.message || 'Account reactivated.');
      queryClient.invalidateQueries({ queryKey: ['admin-agencies'] });
      if (agency) agency.account_status = 'approved';
    },
    onError: (err) => {
      toast.error(err.message || 'Reactivation failed.');
    }
  });

  if (!agency) return null;
  const ap = agency.agency_profile || {};

  const statusCfg = STATUS_CFG[agency.account_status] || STATUS_CFG.pending;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-[5px] z-[600]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[800px] bg-[#121215] border border-[#23232a] rounded-xl overflow-hidden z-[601] shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-[modalIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#23232a] bg-[#0c0c0e]">
          <div className="flex items-center gap-4">
            <AgencyLogo name={ap?.agency_name || agency.full_name} logo={ap?.logo} size={50} />
            <div>
              <h2 className="text-white text-[1.25rem] font-extrabold mb-1">
                {ap?.agency_name || agency.full_name}
              </h2>
              <div className="flex gap-2 items-center">
                <span 
                  className="inline-flex items-center gap-[5px] py-[3px] px-2 rounded text-[0.68rem] font-bold"
                  style={{ background: statusCfg.bg, color: statusCfg.color }}
                >
                  {agency.account_status?.toUpperCase()}
                </span>
                <span className="text-[0.75rem] text-[#6b7280]">
                  {agency.is_verified ? '✓ VERIFIED AGENCY' : 'UNVERIFIED AGENCY'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                onClose();
                navigate(`/admin/users/${agency.id}/profile`);
              }}
              className="bg-[#70d64d]/10 border border-[#70d64d]/30 text-[#70d64d] px-3 py-1.5 rounded-md text-[0.75rem] font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              Open Full View <ExternalLink size={12} />
            </button>
            <button onClick={onClose} className="bg-transparent border border-[#23232a] text-[#8a8a8a] rounded-md py-[6px] px-[8px] cursor-pointer flex items-center"><X size={16} /></button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-[#23232a] bg-[#0c0c0e] px-6">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`bg-transparent border-none py-3 px-4 text-[0.85rem] cursor-pointer outline-none transition-all duration-150 border-b-2 ${activeTab === 'overview' ? 'border-[#70d64d] text-[#70d64d] font-bold' : 'border-transparent text-[#8a8a8a] font-medium'}`}
          >
            Admin Overview
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`bg-transparent border-none py-3 px-4 text-[0.85rem] cursor-pointer outline-none transition-all duration-150 border-b-2 ${activeTab === 'profile' ? 'border-[#70d64d] text-[#70d64d] font-bold' : 'border-transparent text-[#8a8a8a] font-medium'}`}
          >
            Detailed Profile View
          </button>
          <button 
            onClick={() => setActiveTab('activity')} 
            className={`bg-transparent border-none py-3 px-4 text-[0.85rem] cursor-pointer outline-none transition-all duration-150 border-b-2 ${activeTab === 'activity' ? 'border-[#70d64d] text-[#70d64d] font-bold' : 'border-transparent text-[#8a8a8a] font-medium'}`}
          >
            Activity & History
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[68vh] overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
            
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              {/* Description */}
              <div className="bg-[#0c0c0e] border border-[#23232a] rounded-lg p-[18px]">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.6px] text-[#70d64d] mb-3.5 pb-1.5 border-b border-[#23232a]">Agency Description</p>
                <p className="text-[#8a8a8a] text-[0.88rem] leading-[1.5] m-0">
                  {ap.description || 'No description provided.'}
                </p>
              </div>

              {/* Profile Overview */}
              <div className="bg-[#0c0c0e] border border-[#23232a] rounded-lg p-[18px]">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.6px] text-[#70d64d] mb-3.5 pb-1.5 border-b border-[#23232a]">Business Overview</p>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Primary Industry:</strong> <span>{ap.industry || '—'}</span></div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Founded Year:</strong> <span>{ap.founded_year || '—'}</span></div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Employee Count:</strong> <span>{ap.employee_count ? `${ap.employee_count} Employees` : '—'}</span></div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Office Location:</strong> <span>{ap.address || '—'}</span></div>
                {ap.gst_number && <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>GSTIN / Tax ID:</strong> <span className="uppercase">{ap.gst_number}</span></div>}
                {ap.cin && <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Corporate Identification (CIN):</strong> <span className="uppercase">{ap.cin}</span></div>}
                {ap.company_pan && <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Company PAN:</strong> <span className="uppercase">{ap.company_pan}</span></div>}
              </div>

              {/* Team Members List */}
              <div className="bg-[#0c0c0e] border border-[#23232a] rounded-lg p-[18px]">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.6px] text-[#70d64d] mb-3.5 pb-1.5 border-b border-[#23232a]">Team Members ({ap.team_members?.length || 0})</p>
                {(!ap.team_members || ap.team_members.length === 0) ? (
                  <p className="text-[#6b7280] text-[0.8rem] italic m-0">
                    No team members listed for this agency.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {ap.team_members.map((member) => (
                      <div
                        key={member.id}
                        className="bg-[#121215] border border-[#23232a] rounded-lg p-[12px_14px] flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-white text-[0.88rem] font-bold">{member.full_name}</strong>
                            <p className="text-[#c084fc] text-[0.72rem] font-semibold mt-0.5 m-0">
                              {member.designation?.toUpperCase() || 'TEAM MEMBER'}
                            </p>
                          </div>
                          <span
                            className={`text-[0.62rem] font-bold px-1.5 py-0.5 rounded uppercase ${member.status === 'active' ? 'bg-[#70d64d]/10 text-[#70d64d]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'}`}
                          >
                            {member.status || 'ACTIVE'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 border-t border-[#1a1a22] pt-2 mt-0.5">
                          <span className="flex items-center gap-1.25 text-[#8a8a8a] text-[0.75rem] overflow-hidden">
                            <Mail size={11} color="#6b7280" className="shrink-0" />
                            <span className="truncate" title={member.email}>
                              {member.email}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.25 text-[#8a8a8a] text-[0.75rem]">
                            <Phone size={11} color="#6b7280" className="shrink-0" />
                            <span>{member.mobile || '—'}</span>
                          </span>
                        </div>

                        {member.resume_url && (
                          <div className="flex justify-end border-t border-dashed border-[#1a1a22] pt-1.5 mt-0.5">
                            <a
                              href={member.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#70d64d] text-[0.72rem] no-underline font-bold"
                            >
                              View CV / Resume <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Account Management Actions */}
              <div className="bg-[#1c0c0e] border border-[#ef4444]/20 rounded-lg p-[18px] mt-4">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.6px] text-[#ef4444] mb-3.5 pb-1.5 border-b border-[#ef4444]/20">Account Management</p>
                {agency.account_status === 'suspended' ? (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-[#ef4444] text-[0.8rem] m-0">This account is currently suspended.</p>
                    <button
                      disabled={reactivateMutation.isPending}
                      onClick={() => reactivateMutation.mutate()}
                      className="bg-[#70d64d] text-black border-none rounded-md p-2.5 text-[0.8rem] font-extrabold cursor-pointer text-center w-full"
                    >
                      {reactivateMutation.isPending ? 'Reactivating...' : 'REACTIVATE ACCOUNT'}
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
                          onChange={e => setSuspendReason(e.target.value)}
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
                                toast.error('Please enter a suspension reason.');
                                return;
                              }
                              suspendMutation.mutate();
                            }}
                            className="flex-1 bg-[#ef4444] text-white border-none rounded-md p-2 text-[0.75rem] font-bold cursor-pointer"
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
            <div className="flex flex-col gap-4">
              {/* Statistics */}
              <div className="bg-[#0c0c0e] border border-[#23232a] rounded-lg p-[18px]">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.6px] text-[#70d64d] mb-3.5 pb-1.5 border-b border-[#23232a]">Stats & Quality Rating</p>
                <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                  <div className="bg-[#121215] border border-[#23232a] p-2 rounded-md text-center">
                    <p className="text-[0.65rem] text-[#6b7280] uppercase font-bold m-0">TEAM SIZE</p>
                    <p className="text-[1.1rem] text-[#c084fc] font-extrabold mt-1 mb-0 mx-0">{ap?._count?.team_members ?? ap?.employee_count ?? 0}</p>
                  </div>
                  <div className="bg-[#121215] border border-[#23232a] p-2 rounded-md text-center">
                    <p className="text-[0.65rem] text-[#6b7280] uppercase font-bold m-0">PROJECTS</p>
                    <p className="text-[1.1rem] text-[#70d64d] font-extrabold mt-1 mb-0 mx-0">{ap.total_projects ?? 0}</p>
                  </div>
                </div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Rating:</strong> <span>{ap.rating ? `★ ${ap.rating}` : '—'}</span></div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Completed Projects:</strong> <span>{ap.total_completed_projects ?? '—'}</span></div>
                <div className="mt-3">
                  <CompletionBar value={ap.profile_completion || 0} />
                </div>
              </div>

              {/* Point of Contact & Info */}
              <div className="bg-[#0c0c0e] border border-[#23232a] rounded-lg p-[18px]">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.6px] text-[#70d64d] mb-3.5 pb-1.5 border-b border-[#23232a]">Point of Contact</p>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Authorized Signee:</strong> <span>{agency.full_name}</span></div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Email:</strong> <span>{agency.email}</span></div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Phone:</strong> <span>{agency.mobile || '—'}</span></div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Location:</strong> <span>{ap.city && ap.country ? `${ap.city}, ${ap.country}` : '—'}</span></div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Registered On:</strong> <span>{fmtDate(agency.created_at)}</span></div>
                <div className="flex justify-between text-[0.85rem] border-b border-[#1a1a22] py-[7px] text-[#d1d5db]"><strong>Last Login:</strong> <span>{fmtDate(agency.last_login)}</span></div>
              </div>

              {/* Links */}
              <div className="bg-[#0c0c0e] border border-[#23232a] rounded-lg p-[18px]">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.6px] text-[#70d64d] mb-3.5 pb-1.5 border-b border-[#23232a]">Corporate Links</p>
                <div className="flex flex-col gap-2">
                  {ap.website && (
                    <a
                      href={ap.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-[#70d64d] text-black no-underline text-[0.8rem] font-extrabold p-2 rounded-md text-center"
                    >
                      <Globe size={14} /> Visit Corporate Website <ExternalLink size={11} color="#000" />
                    </a>
                  )}
                  {ap.portfolio_pdf_url && (
                    <a
                      href={ap.portfolio_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 border border-[#23232a] text-white no-underline text-[0.8rem] font-bold p-2 rounded-md text-center bg-[#0c0c0e] transition-colors hover:border-gray-500"
                    >
                      <FileText size={14} /> Portfolio PDF <ExternalLink size={11} />
                    </a>
                  )}
                  {ap.linkedin_url && (
                    <a
                      href={ap.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 border border-[#23232a] text-white no-underline text-[0.8rem] font-bold p-2 rounded-md text-center bg-[#0c0c0e]"
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
            <div className="profile-workspace-view animate-fade-in p-0 bg-transparent">
              <ProfileHeader
                isGigExpert={false}
                name={ap.agency_name || agency.full_name}
                avatar={ap.logo}
                subtitle={ap.industry || 'Digital Services Agency'}
                emailVal={agency.email}
                phoneVal={agency.mobile}
                locationVal={ap.city && ap.country ? `${ap.city}, ${ap.country}` : 'Not Specified'}
                webVal={ap.website}
                foundedYear={ap.founded_year}
                initials={getInitials(ap.agency_name || agency.full_name)}
                hideEditButton={true}
              />

              <ProfileStats
                isGigExpert={false}
                totalProjects={ap.total_projects}
                commercialBasis={ap.commercial_basis}
                employeeCount={ap.employee_count}
              />

              <div className="profile-details-split-grid mt-5">
                <div className="profile-details-left-pane">
                  <ProfileAbout
                    isGigExpert={false}
                    description={ap.description}
                  />
                  <TeamStructure employeeCount={ap.employee_count} />
                </div>

                <div className="profile-details-right-pane">
                  <CapabilityCloud
                    isGigExpert={false}
                    skills={(ap.service_details?.selectedServices || []).map(code => ({ skill_name: SERVICE_LABELS[code] || code }))}
                  />
                  <ServiceSpecs serviceDetails={ap.service_details} />
                  <DocumentsList
                    isGigExpert={false}
                    portfolioPdfUrl={ap.portfolio_pdf_url}
                    verifications={agency.verifications}
                    isAdmin={true}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <ActivityHistoryView id={agency.id} />
          )}

        </div>
      </div>
    </>
  );
};

export default AgencyModal;

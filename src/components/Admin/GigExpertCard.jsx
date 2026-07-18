import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { StatusBadge, CompletionBar } from '../AdminShared';

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

const getMatchReasons = (f, query) => {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const reasons = [];

  const fullName = f.full_name?.toLowerCase() || '';
  const email = f.email?.toLowerCase() || '';
  const mobile = f.mobile || '';
  const title = f.gig_expert_profile?.title?.toLowerCase() || '';
  const bio = f.gig_expert_profile?.bio?.toLowerCase() || '';
  const skills = f.gig_expert_profile?.gig_expert_skills?.map(s => s.skill_name?.toLowerCase() || '') || [];

  const SERVICE_LABELS = {
    BIM: 'bim & 2d drafting',
    Audit: 'as-built audit',
    Peer: 'peer review',
    BOQ: 'boq creation',
    Viz: '3d visualisation',
  };
  const selectedServices = f.gig_expert_profile?.service_details?.selectedServices || [];
  const servicesTexts = selectedServices.map(srv => {
    const code = srv?.toLowerCase() || '';
    const label = SERVICE_LABELS[srv]?.toLowerCase() || '';
    return [code, label];
  }).flat();

  if (fullName.includes(q)) reasons.push('Name Match');
  if (email.includes(q)) reasons.push('Email Match');
  if (mobile.includes(q)) reasons.push('Mobile Match');
  if (title.includes(q)) reasons.push('Title Match');
  if (bio.includes(q)) reasons.push('Bio Match');
  if (skills.some(s => s.includes(q))) reasons.push('Skill Match');
  if (servicesTexts.some(s => s.includes(q))) reasons.push('Expertise Match');

  return reasons;
};

export const GigExpertCard = ({ gigExperts, isLoading, onSelectGigExpert, status, searchQuery }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[16px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[20px] flex flex-col gap-[14px]">
            <div className="flex items-center gap-[12px]">
              <div className="skeleton-pulse w-[48px] h-[48px] rounded-full" />
              <div className="flex-1">
                <div className="skeleton-pulse w-[60%] h-[14px] rounded-[4px] mb-[6px]" />
                <div className="skeleton-pulse w-[40%] h-[10px] rounded-[4px]" />
              </div>
            </div>
            <div className="skeleton-pulse w-[80%] h-[12px] rounded-[4px]" />
            <div className="flex gap-[6px]">
              <div className="skeleton-pulse w-[50px] h-[18px] rounded-[4px]" />
              <div className="skeleton-pulse w-[60px] h-[18px] rounded-[4px]" />
              <div className="skeleton-pulse w-[45px] h-[18px] rounded-[4px]" />
            </div>
            <div className="border-t border-[#1c1c20] pt-[12px]">
              <div className="skeleton-pulse w-[100%] h-[18px] rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (gigExperts.length === 0) {
    return (
      <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[48px] text-center text-gray-500">
        No gigExperts found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[16px]">
      {gigExperts.map(f => {
        const fp = f.gig_expert_profile;
        const skills = fp?.gig_expert_skills?.slice(0, 3).map(s => s.skill_name) || [];
        const matchReasons = getMatchReasons(f, searchQuery);
        return (
          <div
            key={f.id}
            onClick={() => onSelectGigExpert(f)}
            className="group bg-[#121215] border border-[#23232a] rounded-[10px] p-[20px] flex flex-col gap-[14px] relative cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:border-[#70d64d]"
          >
            {/* Status Badge top right */}
            <div className="absolute top-[20px] right-[20px]">
              <StatusBadge status={f.account_status} />
            </div>

            {/* Match Reason Overlay on Hover */}
            {searchQuery && matchReasons.length > 0 && (
              <div className="absolute inset-0 bg-[#0c0c0e]/95 backdrop-blur-sm rounded-[10px] p-[20px] flex flex-col justify-center items-center gap-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 text-center">
                <span className="text-gray-500 text-[0.7rem] uppercase tracking-wider font-bold">Query Match Details</span>
                <div className="flex flex-wrap gap-[6px] justify-center max-w-full">
                  {matchReasons.map(r => (
                    <span key={r} className="bg-[#70d64d]/10 text-[#70d64d] border border-[#70d64d]/30 text-[0.72rem] font-semibold px-[10px] py-[4px] rounded-[6px]">
                      {r}
                    </span>
                  ))}
                </div>
                <span className="text-gray-500 text-[0.68rem] mt-[10px]">Click card to view profile</span>
              </div>
            )}

            {/* Profile header */}
            <div className="flex items-center gap-[12px]">
              <Avatar name={f.full_name} photo={f.profile_photo} size={46} />
              <div className="overflow-hidden pr-[60px]">
                <h4 className="text-white text-[0.92rem] font-bold m-0 text-ellipsis overflow-hidden whitespace-nowrap">
                  {f.full_name}
                </h4>
                <p className="text-gray-500 text-[0.72rem] m-0 mt-[2px]">
                  {f.is_verified ? '✓ Verified Member' : 'Unverified Member'}
                </p>
              </div>
            </div>

            {/* Designation */}
            <div>
              <p className="text-[#d1d5db] text-[0.82rem] m-0 font-semibold text-ellipsis overflow-hidden whitespace-nowrap">
                {fp?.title || 'No Title'}
              </p>
              <div className="flex justify-between items-center mt-[6px]">
                <span className="flex items-center gap-[4px] text-[#8a8a8a] text-[0.75rem]">
                  <MapPin size={11} color="#6b7280" />
                  {fp?.city && fp?.country ? `${fp.city}, ${fp.country}` : 'Remote'}
                </span>
                <span className="text-[#70d64d] font-bold text-[0.82rem]">
                  {fp?.hourly_rate ? `₹${fp.hourly_rate}/hr` : '—'}
                </span>
              </div>
            </div>

            {/* Skills chips */}
            <div className="flex flex-wrap gap-[4px] min-h-[22px]">
              {skills.map(s => (
                <span key={s} className="bg-[#1e293b] text-[#38bdf8] text-[0.62rem] font-semibold px-[6px] py-[2px] rounded-[4px]">
                  {s}
                </span>
              ))}
              {(fp?.gig_expert_skills?.length || 0) > 3 && (
                <span className="text-gray-500 text-[0.62rem] px-[4px] py-[2px] self-center">
                  +{fp.gig_expert_skills.length - 3} more
                </span>
              )}
              {skills.length === 0 && (
                <span className="text-[#4b4b57] text-[0.7rem] italic">No skills listed</span>
              )}
            </div>

            {/* Profile Completion */}
            <div className="bg-[#0c0c0e] p-[10px] rounded-[6px] border border-[#1a1a22]">
              <CompletionBar value={fp?.profile_completion || 0} />
            </div>

            {/* Contact and Registered Date Footer */}
            <div className="border-t border-[#1a1a22] pt-[12px] mt-auto flex flex-col gap-[6px]">
              <div className="flex items-center gap-[6px] text-[#8a8a8a] text-[0.74rem] overflow-hidden">
                <Mail size={12} color="#6b7280" className="shrink-0" />
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">{f.email}</span>
              </div>
              <div className="flex items-center gap-[6px] text-[#8a8a8a] text-[0.74rem]">
                <Phone size={12} color="#6b7280" className="shrink-0" />
                <span>{f.mobile || '—'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#1a1a22] pt-[8px] mt-[4px] text-[0.7rem] text-[#5b5b67] flex-wrap gap-1">
                <span>Registered: {fmtDate(f.created_at)}</span>
                {status === 'inactive' && (
                  <span>Last Login: {fmtDate(f.last_login)}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GigExpertCard;

import React from 'react';
import { Mail, Phone, Briefcase, Users, MapPin, Globe } from 'lucide-react';
import { StatusBadge, CompletionBar } from '../AdminShared';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function AgencyLogo({ name, logo, size = 42 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  return logo ? (
    <img 
      src={logo} 
      alt={name} 
      style={{ width: size, height: size }} 
      className="rounded-[8px] object-cover shrink-0 border border-[#23232a] bg-[#1c1c20]" 
    />
  ) : (
    <div 
      style={{ width: size, height: size, fontSize: `${size * 0.3}px` }} 
      className="rounded-[8px] bg-gradient-to-br from-[#2e1065] to-[#4c1d95] border border-[#3b2a6a] flex items-center justify-center font-extrabold text-[#c084fc] shrink-0"
    >
      {initials}
    </div>
  );
}

const getMatchReasons = (a, query) => {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  const reasons = [];

  const contactName = a.full_name?.toLowerCase() || '';
  const email = a.email?.toLowerCase() || '';
  const mobile = a.mobile || '';
  const agencyName = a.agency_profile?.agency_name?.toLowerCase() || '';
  const industry = a.agency_profile?.industry?.toLowerCase() || '';
  const description = a.agency_profile?.description?.toLowerCase() || '';
  const teamMembers = a.agency_profile?.team_members || [];

  const SERVICE_LABELS = {
    BIM: 'bim & 2d drafting',
    Audit: 'as-built audit',
    Peer: 'peer review',
    BOQ: 'boq creation',
    Viz: '3d visualisation',
  };
  const selectedServices = a.agency_profile?.service_details?.selectedServices || [];
  const servicesTexts = selectedServices.map(srv => {
    const code = srv?.toLowerCase() || '';
    const label = SERVICE_LABELS[srv]?.toLowerCase() || '';
    return [code, label];
  }).flat();

  if (agencyName.includes(q)) reasons.push('Agency Name Match');
  if (contactName.includes(q)) reasons.push('POC Name Match');
  if (email.includes(q)) reasons.push('Email Match');
  if (mobile.includes(q)) reasons.push('Mobile Match');
  if (industry.includes(q)) reasons.push('Industry Match');
  if (description.includes(q)) reasons.push('Bio Match');
  if (servicesTexts.some(s => s.includes(q))) reasons.push('Capability Match');

  const teamMatches = teamMembers.some(tm => {
    const tmName = tm.full_name?.toLowerCase() || '';
    const tmEmail = tm.email?.toLowerCase() || '';
    const tmDesig = tm.designation?.toLowerCase() || '';
    const tmMob = tm.mobile || '';
    return tmName.includes(q) || tmEmail.includes(q) || tmDesig.includes(q) || tmMob.includes(q);
  });
  if (teamMatches) reasons.push('Team Member Match');

  return reasons;
};

export const AgencyCard = ({ agencies, isLoading, onSelectAgency, status, searchQuery }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[16px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[20px] flex flex-col gap-[14px]">
            <div className="flex items-center gap-[12px]">
              <div className="skeleton-pulse w-[48px] h-[48px] rounded-[8px]" />
              <div className="flex-1">
                <div className="skeleton-pulse w-[70%] h-[14px] rounded-[4px] mb-[6px]" />
                <div className="skeleton-pulse w-[30%] h-[10px] rounded-[4px]" />
              </div>
            </div>
            <div className="skeleton-pulse w-[80%] h-[12px] rounded-[4px]" />
            <div className="border-t border-[#1c1c20] pt-[12px]">
              <div className="skeleton-pulse w-[100%] h-[18px] rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (agencies.length === 0) {
    return (
      <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[48px] text-center text-gray-500">
        No agencies found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-[16px]">
      {agencies.map(a => {
        const ap = a.agency_profile;
        const matchReasons = getMatchReasons(a, searchQuery);
        return (
          <div
            key={a.id}
            onClick={() => onSelectAgency(a)}
            className="group bg-[#121215] border border-[#23232a] rounded-[10px] p-[20px] flex flex-col gap-[14px] relative cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:border-[#70d64d]"
          >
            {/* Status Badge top right */}
            <div className="absolute top-[20px] right-[20px]">
              <StatusBadge status={a.account_status} />
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
              <AgencyLogo name={ap?.agency_name || a.full_name} logo={ap?.logo} size={46} />
              <div className="overflow-hidden pr-[60px]">
                <h4 className="text-white text-[0.92rem] font-bold m-0 text-ellipsis overflow-hidden whitespace-nowrap">
                  {ap?.agency_name || a.full_name}
                </h4>
                {ap?.website && (
                  <a 
                    href={ap.website} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-[4px] text-[#70d64d] text-[0.7rem] no-underline mt-[2px] text-ellipsis overflow-hidden whitespace-nowrap hover:underline" 
                    onClick={e => e.stopPropagation()}
                  >
                    <Globe size={10} className="shrink-0" /> {ap.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>

            {/* Industry chip & info */}
            <div>
              <div className="flex flex-wrap gap-[6px] items-center">
                {ap?.industry ? (
                  <span className="bg-[#1c1917] text-[#f59e0b] text-[0.65rem] font-semibold px-[8px] py-[2px] rounded-[4px]">
                    {ap.industry}
                  </span>
                ) : (
                  <span className="text-[#4b4b57] text-[0.7rem] italic">No industry specified</span>
                )}
              </div>
              {/* Location & Contact Person */}
              <div className="flex justify-between items-center mt-[8px] text-[0.75rem] text-[#8a8a8a]">
                <span className="flex items-center gap-[4px]">
                  <MapPin size={11} color="#6b7280" />
                  {ap?.city && ap?.country ? `${ap.city}, ${ap.country}` : 'Remote'}
                </span>
                <span className="font-medium text-[#d1d5db]">
                  POC: {a.full_name}
                </span>
              </div>
            </div>

            {/* Key stats: team members & projects */}
            <div className="flex gap-[10px] bg-[#0c0c0e] p-[10px] rounded-[6px] border border-[#1a1a22] justify-around">
              <div className="flex flex-col items-center gap-[2px]">
                <span className="text-gray-500 text-[0.65rem] font-semibold uppercase">Team</span>
                <div className="flex items-center gap-[4px] mt-[2px]">
                  <Users size={12} color="#c084fc" />
                  <span className="text-white text-[0.85rem] font-bold">
                    {ap?._count?.team_members ?? ap?.employee_count ?? 0}
                  </span>
                </div>
              </div>
              <div className="w-[1px] bg-[#1a1a22]" />
              <div className="flex flex-col items-center gap-[2px]">
                <span className="text-gray-500 text-[0.65rem] font-semibold uppercase">Projects</span>
                <div className="flex items-center gap-[4px] mt-[2px]">
                  <Briefcase size={12} color="#70d64d" />
                  <span className="text-white text-[0.85rem] font-bold">
                    {ap?.total_projects ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="bg-[#0c0c0e] p-[10px] rounded-[6px] border border-[#1a1a22]">
              <CompletionBar value={ap?.profile_completion || 0} />
            </div>

            {/* Contact and Registered Date Footer */}
            <div className="border-t border-[#1a1a22] pt-[12px] mt-auto flex flex-col gap-[6px]">
              <div className="flex items-center gap-[6px] text-[#8a8a8a] text-[0.74rem] overflow-hidden">
                <Mail size={12} color="#6b7280" className="shrink-0" />
                <span className="text-ellipsis overflow-hidden whitespace-nowrap">{a.email}</span>
              </div>
              <div className="flex items-center gap-[6px] text-[#8a8a8a] text-[0.74rem]">
                <Phone size={12} color="#6b7280" className="shrink-0" />
                <span>{a.mobile || '—'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#1a1a22] pt-[8px] mt-[4px] text-[0.7rem] text-[#5b5b67] flex-wrap gap-1">
                <span>Registered: {fmtDate(a.created_at)}</span>
                {status === 'inactive' && (
                  <span>Last Login: {fmtDate(a.last_login)}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AgencyCard;

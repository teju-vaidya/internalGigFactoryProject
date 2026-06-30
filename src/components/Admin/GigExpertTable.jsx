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

export const GigExpertTable = ({ gigExperts, isLoading, onSelectGigExpert, status }) => {
  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[10px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#0c0c0e]">
              {['Gig Expert', 'Contact', 'Title & Skills', 'Location', 'Rate', 'Profile', 'Status', 'Registered'].map(h => (
                <th key={h} className="text-gray-500 text-[0.65rem] font-bold px-[16px] py-[14px] border-b border-[#23232a] tracking-[0.6px] whitespace-nowrap">
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[200, 160, 180, 100, 80, 100, 80, 90].map((w, j) => (
                    <td key={j} className="p-[16px] border-b border-[#1a1a22]">
                      <div className="skeleton-pulse h-[14px] rounded-[4px]" style={{ width: `${w}px` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : gigExperts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-[48px] text-gray-500">
                  No gigExperts found.
                </td>
              </tr>
            ) : gigExperts.map(f => {
              const fp = f.gig_expert_profile;
              const skills = fp?.gig_expert_skills?.slice(0, 3).map(s => s.skill_name) || [];
              return (
                <tr 
                  key={f.id}
                  onClick={() => onSelectGigExpert(f)}
                  className="transition-colors duration-100 cursor-pointer hover:bg-[#181820]"
                >
                  {/* Gig Expert info */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <div className="flex items-center gap-[10px]">
                      <Avatar name={f.full_name} photo={f.profile_photo} />
                      <div>
                        <p className="text-white font-bold text-[0.88rem] m-0">{f.full_name}</p>
                        <p className="text-gray-500 text-[0.72rem] m-0 mt-[2px]">
                          {f.is_verified ? '✓ Verified' : 'Unverified'}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <div className="flex flex-col gap-[4px]">
                      <span className="flex items-center gap-[5px] text-[#8a8a8a] text-[0.75rem]">
                        <Mail size={11} color="#6b7280" /> {f.email}
                      </span>
                      <span className="flex items-center gap-[5px] text-[#8a8a8a] text-[0.75rem]">
                        <Phone size={11} color="#6b7280" /> {f.mobile || '—'}
                      </span>
                    </div>
                  </td>
                  {/* Title + Skills */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <p className="text-[#d1d5db] text-[0.82rem] m-0 mb-[6px] font-semibold">{fp?.title || '—'}</p>
                    <div className="flex flex-wrap gap-[4px]">
                      {skills.map(s => (
                        <span key={s} className="bg-[#1e293b] text-[#38bdf8] text-[0.62rem] font-semibold px-[6px] py-[2px] rounded-[4px]">{s}</span>
                      ))}
                      {(fp?.gig_expert_skills?.length || 0) > 3 && (
                        <span className="text-gray-500 text-[0.62rem] px-[4px] py-[2px]">+{fp.gig_expert_skills.length - 3}</span>
                      )}
                    </div>
                  </td>
                  {/* Location */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <span className="flex items-center gap-[5px] text-[#8a8a8a] text-[0.78rem]">
                      <MapPin size={11} color="#6b7280" />
                      {fp?.city && fp?.country ? `${fp.city}, ${fp.country}` : '—'}
                    </span>
                  </td>
                  {/* Rate */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <span className="text-[#70d64d] font-bold text-[0.82rem]">
                      {fp?.hourly_rate ? `₹${fp.hourly_rate}/hr` : '—'}
                    </span>
                  </td>
                  {/* Completion */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle min-w-[100px]">
                    <CompletionBar value={fp?.profile_completion || 0} />
                  </td>
                  {/* Status */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <StatusBadge status={f.account_status} />
                  </td>
                  {/* Joined */}
                  <td className="p-[16px] border-b border-[#1a1a22] text-gray-500 text-[0.75rem] align-middle whitespace-nowrap">
                    <div>Reg: {fmtDate(f.created_at)}</div>
                    {status === 'inactive' && (
                      <div className="text-gray-400 mt-[4px]">Login: {fmtDate(f.last_login)}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

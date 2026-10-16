import React from 'react';
import { Mail, Phone, Globe, FileText, ExternalLink, Eye } from 'lucide-react';

const STATUS_BADGE_STYLES = {
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'PENDING' },
  reviewed: { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8', label: 'REVIEWED' },
  shortlisted: { bg: 'rgba(112,214,77,0.12)', color: '#70d64d', label: 'SHORTLISTED' },
  rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'REJECTED' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.pending;
  return (
    <span
      style={{ background: cfg.bg, color: cfg.color }}
      className="text-[0.65rem] font-bold px-[8px] py-[3px] rounded-[4px]"
    >
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = 36 }) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CA';

  return (
    <div
      style={{ width: size, height: size, fontSize: `${size * 0.38}px` }}
      className="rounded-full bg-gradient-to-br from-[#1e293b] to-[#2563eb22] border border-[#23232a] flex items-center justify-center font-extrabold text-[#70d64d] shrink-0"
    >
      {initials}
    </div>
  );
}

export const FulltimeRequestTable = ({ requests, isLoading, onSelectRequest }) => {
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="bg-[#121215] border border-[#23232a] rounded-[10px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#0c0c0e]">
              {['Candidate', 'Interested In', 'Contact', 'Portfolio', 'Resume / CV', 'Status', 'Applied Date', 'Action'].map((h) => (
                <th
                  key={h}
                  className="text-gray-500 text-[0.65rem] font-bold px-[16px] py-[14px] border-b border-[#23232a] tracking-[0.6px] whitespace-nowrap uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[180, 140, 160, 100, 100, 80, 90, 60].map((w, j) => (
                    <td key={j} className="p-[16px] border-b border-[#1a1a22]">
                      <div className="skeleton-pulse h-[14px] rounded-[4px]" style={{ width: `${w}px` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-[48px] text-gray-500 text-sm">
                  No full-time career requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelectRequest(r)}
                  className="transition-colors duration-100 cursor-pointer hover:bg-[#181820]"
                >
                  {/* Candidate */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <div className="flex items-center gap-[10px]">
                      <Avatar name={r.full_name} />
                      <div>
                        <p className="text-white font-bold text-[0.88rem] m-0">{r.full_name}</p>
                        <p className="text-gray-500 text-[0.72rem] m-0 mt-[2px]">
                          {r.phone || 'Candidate'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Interested In */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-white font-medium text-[0.8rem] whitespace-nowrap">
                        {r.interested_in || '—'}
                      </span>
                      {r.other_interested_in && (
                        <span className="text-[#38bdf8] text-[0.72rem] italic">
                          ({r.other_interested_in})
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <div className="flex flex-col gap-[4px]">
                      <span className="flex items-center gap-[5px] text-[#8a8a8a] text-[0.75rem]">
                        <Mail size={11} color="#6b7280" /> {r.email}
                      </span>
                      <span className="flex items-center gap-[5px] text-[#8a8a8a] text-[0.75rem]">
                        <Phone size={11} color="#6b7280" /> {r.phone || '—'}
                      </span>
                    </div>
                  </td>

                  {/* Portfolio */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    {r.portfolio ? (
                      <a
                        href={r.portfolio.startsWith('http') ? r.portfolio : `https://${r.portfolio}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#38bdf8] text-xs hover:underline"
                      >
                        <Globe size={12} /> Portfolio <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Resume / CV */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    {r.cv_url ? (
                      <a
                        href={r.cv_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[#70d64d] text-xs font-semibold hover:underline bg-[#70d64d]/10 px-2.5 py-1 rounded-md"
                      >
                        <FileText size={12} /> CV <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-gray-600 text-xs">No file</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <StatusBadge status={r.status} />
                  </td>

                  {/* Date */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle text-gray-400 text-xs whitespace-nowrap">
                    {fmtDate(r.created_at)}
                  </td>

                  {/* Action */}
                  <td className="p-[16px] border-b border-[#1a1a22] align-middle">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRequest(r);
                      }}
                      className="bg-[#1e1e24] hover:bg-[#70d64d] hover:text-black text-gray-300 p-2 rounded-lg transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

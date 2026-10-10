import React from 'react';
import { Mail, Phone, Globe, FileText, Calendar, ExternalLink, ArrowRight } from 'lucide-react';

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

function Avatar({ name, size = 44 }) {
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

export const FulltimeRequestCard = ({ requests, isLoading, onSelectRequest }) => {
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[16px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[20px] flex flex-col gap-[14px]">
            <div className="flex items-center gap-[12px]">
              <div className="skeleton-pulse w-[44px] h-[44px] rounded-full" />
              <div className="flex-1">
                <div className="skeleton-pulse w-[60%] h-[14px] rounded-[4px] mb-[6px]" />
                <div className="skeleton-pulse w-[40%] h-[10px] rounded-[4px]" />
              </div>
            </div>
            <div className="skeleton-pulse w-[100%] h-[12px] rounded-[4px]" />
            <div className="skeleton-pulse w-[80%] h-[12px] rounded-[4px]" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-[#121215] border border-[#23232a] rounded-[10px] p-[48px] text-center text-gray-500 text-sm">
        No full-time career requests found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[16px]">
      {requests.map((r) => (
        <div
          key={r.id}
          onClick={() => onSelectRequest(r)}
          className="bg-[#121215] border border-[#23232a] rounded-[12px] p-5 flex flex-col justify-between gap-4 cursor-pointer hover:border-[#70d64d]/40 transition-all hover:-translate-y-0.5"
        >
          {/* Top Info */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <Avatar name={r.full_name} />
                <div>
                  <h4 className="text-white font-bold text-sm m-0 leading-tight">{r.full_name}</h4>
                  <span className="text-gray-500 text-[11px] flex items-center gap-1 mt-1">
                    <Calendar size={11} /> {fmtDate(r.created_at)}
                  </span>
                </div>
              </div>
              <StatusBadge status={r.status} />
            </div>

            {/* Contacts */}
            <div className="space-y-1.5 py-2 text-xs border-y border-[#1c1c22]">
              <div className="flex items-center gap-2 text-gray-400">
                <Mail size={12} className="text-[#70d64d] shrink-0" />
                <span className="truncate">{r.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Phone size={12} className="text-[#70d64d] shrink-0" />
                <span>{r.phone || '—'}</span>
              </div>
            </div>

            {/* Cover letter excerpt */}
            {r.cover_letter && (
              <p className="text-gray-400 text-xs mt-3 line-clamp-2 leading-relaxed">
                &ldquo;{r.cover_letter}&rdquo;
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1c1c22]">
            <div className="flex items-center gap-2">
              {r.portfolio && (
                <a
                  href={r.portfolio.startsWith('http') ? r.portfolio : `https://${r.portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#38bdf8] text-xs hover:underline flex items-center gap-1"
                >
                  <Globe size={11} /> Portfolio
                </a>
              )}
              {r.cv_url && (
                <a
                  href={r.cv_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#70d64d] text-xs font-semibold hover:underline flex items-center gap-1 bg-[#70d64d]/10 px-2 py-0.5 rounded"
                >
                  <FileText size={11} /> CV
                </a>
              )}
            </div>

            <button
              onClick={() => onSelectRequest(r)}
              className="text-[#70d64d] hover:text-[#5dbd3d] text-xs font-bold flex items-center gap-1"
            >
              Details <ArrowRight size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

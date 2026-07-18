import React, { useState } from 'react';
import { Layers, Users, Mail, Phone, Briefcase, Calendar, ChevronDown, ChevronUp, FileText, Shield } from 'lucide-react';

/* ── Designation normaliser ─────────────────────────────────── */
function normaliseDesignation(raw = '') {
  const d = raw.trim().toLowerCase();
  if (!d || d === 'unknown') return 'UNASSIGNED';
  if (/\b(dev|developer|engineer|architect|backend|frontend|full.?stack|software)\b/.test(d)) return 'DEVELOPERS';
  if (/\b(design|designer|ui|ux|graphic|visual)\b/.test(d)) return 'DESIGNERS';
  if (/\b(pm|project.?manager|programme|program)\b/.test(d)) return 'PROJECT MANAGERS';
  if (/\b(qa|quality|tester|test)\b/.test(d)) return 'QA / TESTERS';
  if (/\b(devops|infra|cloud|sre|ops)\b/.test(d)) return 'DEVOPS / INFRA';
  if (/\b(data|analyst|bi|science|ml|ai)\b/.test(d)) return 'DATA / ANALYTICS';
  if (/\b(sales|business|bd|account|crm)\b/.test(d)) return 'SALES / BD';
  if (/\b(hr|human|recruit|talent|people)\b/.test(d)) return 'HR / TALENT';
  if (/\b(finance|cfo|billing)\b/.test(d)) return 'FINANCE';
  if (/\b(legal|compli|counsel)\b/.test(d)) return 'LEGAL';
  if (/\b(support|helpdesk|customer|service)\b/.test(d)) return 'SUPPORT';
  if (/\b(content|write|editor|copy|market|seo|social)\b/.test(d)) return 'MARKETING / CONTENT';
  return raw.trim().toUpperCase();
}

const SEGMENT_COLORS = [
  '#70d64d', '#38bdf8', '#c084fc', '#f59e0b',
  '#f87171', '#34d399', '#fb923c', '#a78bfa',
];

const STATUS_STYLES = {
  active:   { bg: 'rgba(112,214,77,0.12)',  color: '#70d64d'  },
  inactive: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b'  },
  pending:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b'  },
  removed:  { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444'  },
};

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'M';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Individual member row ───────────────────────────────────── */
function MemberRow({ member, index }) {
  const [expanded, setExpanded] = useState(false);
  const initials = getInitials(member.full_name);
  const statusStyle = STATUS_STYLES[member.status?.toLowerCase()] || STATUS_STYLES.active;
  const colorIndex = index % SEGMENT_COLORS.length;
  const accentColor = SEGMENT_COLORS[colorIndex];

  return (
    <div 
      className="bg-[#0c0c0e] border border-[#1c1c22] rounded-[8px] overflow-hidden transition-colors duration-200"
      style={{
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {/* Collapsed Row */}
      <div
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-[12px] px-[16px] py-[12px] cursor-pointer select-none"
      >
        {/* Avatar */}
        <div 
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[0.75rem] font-extrabold shrink-0 overflow-hidden"
          style={{
            background: `${accentColor}22`,
            border: `1.5px solid ${accentColor}55`,
            color: accentColor,
          }}
        >
          {member.user?.profile_photo ? (
            <img src={member.user.profile_photo} alt={member.full_name} className="w-full h-full object-cover rounded-full" />
          ) : initials}
        </div>

        {/* Name + designation */}
        <div className="flex-1 min-w-0">
          <div className="text-[0.88rem] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
            {member.full_name || 'Unnamed Member'}
          </div>
          <div className="text-[0.72rem] text-gray-500 mt-[1px]">
            {member.designation || 'No designation'}
          </div>
        </div>

        {/* Status badge */}
        <span 
          className="text-[0.65rem] font-extrabold uppercase px-[8px] py-[2px] rounded-[4px] shrink-0"
          style={{
            background: statusStyle.bg,
            color: statusStyle.color,
          }}
        >
          {member.status || 'Active'}
        </span>

        {/* Expand toggle */}
        <span className="text-[#4b4b57] shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {/* Expanded Detail Panel */}
      {expanded && (
        <div 
          className="border-t border-[#1c1c22] px-[16px] py-[14px] grid gap-[12px] bg-[#0a0a0d]"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          }}
        >
          {member.email && (
            <DetailItem icon={<Mail size={12} />} label="Email" value={member.email} />
          )}
          {member.mobile && (
            <DetailItem icon={<Phone size={12} />} label="Mobile" value={member.mobile} />
          )}
          {member.joined_at && (
            <DetailItem icon={<Calendar size={12} />} label="Added On" value={formatDate(member.joined_at)} />
          )}
          {member.designation && (
            <DetailItem icon={<Briefcase size={12} />} label="Designation" value={member.designation} />
          )}
          {member.permissions && Object.keys(member.permissions).length > 0 && (
            <DetailItem
              icon={<Shield size={12} />}
              label="Permissions"
              value={Object.entries(member.permissions)
                .filter(([, v]) => v)
                .map(([k]) => k.replace(/_/g, ' '))
                .join(', ') || 'None'}
            />
          )}
          {member.resume_url && (
            <div className="col-span-full">
              <a
                href={member.resume_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-[6px] text-[0.75rem] font-bold no-underline px-[12px] py-[5px] rounded-[5px]"
                style={{
                  color: accentColor,
                  border: `1px solid ${accentColor}33`,
                  background: `${accentColor}11`,
                }}
              >
                <FileText size={12} /> View Resume / CV
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-[5px] text-[0.65rem] uppercase tracking-[0.5px] text-[#4b4b57] mb-[3px]">
        {icon} {label}
      </div>
      <div className="text-[0.8rem] text-gray-300 break-words">{value || '—'}</div>
    </div>
  );
}

/* ── Main Export ─────────────────────────────────────────────── */
export const TeamStructure = ({ teamMembers = [], employeeCount }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const hasRealMembers = Array.isArray(teamMembers) && teamMembers.length > 0;

  if (!hasRealMembers) {
    const count = employeeCount || 0;
    return (
      <div className="pane-content-card">
        <h3><Layers size={18} /> Agency Team Structure</h3>
        <div className="flex items-center gap-[12px] py-[16px] text-[#8a8a8a] text-[0.85rem]">
          <Users size={28} className="text-[#4b4b57]" />
          <div>
            <span className="text-[1.6rem] font-extrabold text-white block">{count}</span>
            <span className="text-[0.7rem] uppercase tracking-[0.5px]">Total Employees — no member records available</span>
          </div>
        </div>
      </div>
    );
  }

  /* Designation breakdown */
  const groups = {};
  for (const m of teamMembers) {
    const key = normaliseDesignation(m.designation || '');
    groups[key] = (groups[key] || 0) + 1;
  }
  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);

  /* Filtered member list */
  const q = searchQuery.trim().toLowerCase();
  const filtered = teamMembers.filter(m =>
    !q ||
    (m.full_name || '').toLowerCase().includes(q) ||
    (m.designation || '').toLowerCase().includes(q) ||
    (m.email || '').toLowerCase().includes(q)
  );

  return (
    <div className="pane-content-card">
      {/* Header */}
      <h3 className="flex justify-between items-center mb-[14px]">
        <span className='flex flex-row gap-2 justify-center items-center'><Layers size={18} /> Agency Team Structure</span>
        <span className="text-[0.72rem] font-bold text-gray-500 bg-[#1c1c20] px-[10px] py-[3px] rounded-[4px]">
          {teamMembers.length} ADDED
        </span>
      </h3>

      {/* Breakdown pills */}
      <div className="team-distribution-matrix mb-[20px]" style={{ gridTemplateColumns: `repeat(${Math.min(sorted.length, 3)}, 1fr)` }}>
        {sorted.map(([label, count], i) => (
          <div className="team-segment-card" key={label} style={{ borderTop: `2px solid ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}33` }}>
            <span className="segment-number" style={{ color: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }}>{count}</span>
            <span className="segment-title">{label}</span>
          </div>
        ))}
      </div>

      {/* Divider + listing header */}
      <div className="flex items-center justify-between mb-[12px] border-t border-[#1c1c22] pt-[16px]">
        <div className="flex items-center gap-[7px] text-[0.75rem] font-extrabold uppercase tracking-[0.5px] text-gray-500">
          <Users size={13} /> All Members
        </div>
        {/* Search */}
        <input
          type="text"
          placeholder="Search name, role, email…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-[#0c0c0e] border border-[#23232a] rounded-[6px] px-[10px] py-[5px] text-white text-[0.75rem] outline-none w-[180px] focus:border-[#70d64d] transition-colors"
        />
      </div>

      {/* Member rows */}
      <div className="flex flex-col gap-[8px]">
        {filtered.length === 0 ? (
          <p className="text-[#4b4b57] text-[0.8rem] italic text-center py-[20px]">
            No members match your search.
          </p>
        ) : (
          filtered.map((m, i) => <MemberRow key={m.id || i} member={m} index={i} />)
        )}
      </div>
    </div>
  );
};

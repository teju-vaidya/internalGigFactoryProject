import React from 'react';
import { Eye, Check, X } from 'lucide-react';
import { StatusBadge } from '../AdminShared';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const ROLE_STYLES = {
  gig_expert: { bg: '#1e293b', color: '#38bdf8' },
  agency:     { bg: '#2e1065', color: '#c084fc' },
};

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

export const RegistrationRequestsTable = ({ pageItems, isLoading, onSelectReq, onApprove, onReject, reviewQueryFetching }) => {
  const btnBaseClass = "inline-flex items-center gap-[5px] rounded-[5px] text-[0.72rem] font-bold cursor-pointer border-none transition-opacity duration-150";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {['Full Name', 'Email', 'Mobile', 'Role', 'Status', 'Submitted', 'Actions'].map(h => (
              <th key={h} className="text-gray-500 text-[0.68rem] font-bold px-[14px] py-[12px] border-b border-[#23232a] tracking-[0.5px] whitespace-nowrap">
                {h.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i}>
                {[120, 160, 90, 80, 70, 100, 140].map((w, j) => (
                  <td key={j} className="p-[14px] border-b border-[#1a1a22]">
                    <div className="skeleton-pulse h-[14px] rounded-[4px]" style={{ width: `${w}px` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : pageItems.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center p-[48px] text-gray-500 text-[0.88rem]">
                No requests match your filters.
              </td>
            </tr>
          ) : pageItems.map(req => (
            <tr 
              key={req.id} 
              className="transition-colors duration-100 hover:bg-[#181818]"
            >
              <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                <strong className="text-white text-[0.88rem]">{req.full_name}</strong>
              </td>
              <td className="p-[14px] border-b border-[#1a1a22] text-[#8a8a8a] text-[0.83rem] align-middle">{req.email}</td>
              <td className="p-[14px] border-b border-[#1a1a22] text-[#8a8a8a] text-[0.83rem] align-middle">{req.mobile}</td>
              <td className="p-[14px] border-b border-[#1a1a22] align-middle"><RoleChip role={req.role} /></td>
              <td className="p-[14px] border-b border-[#1a1a22] align-middle"><StatusBadge status={req.status} /></td>
              <td className="p-[14px] border-b border-[#1a1a22] text-[#6b6b6b] text-[0.8rem] align-middle">{fmtDate(req.created_at)}</td>
              <td className="p-[14px] border-b border-[#1a1a22] align-middle">
                <div className="flex gap-[6px] items-center">
                  <button 
                    onClick={() => onSelectReq(req)} 
                    className={`${btnBaseClass} bg-transparent border border-[#23232a] text-[#8a8a8a] px-[8px] py-[5px]`} 
                    title="View details"
                  >
                    <Eye size={13} />
                  </button>
                  {req.status === 'pending' && (<>
                    <button 
                      onClick={() => onApprove(req.id)} 
                      disabled={reviewQueryFetching} 
                      className={`${btnBaseClass} bg-[rgba(112,214,77,0.1)] text-[#70d64d] border border-[rgba(112,214,77,0.3)] px-[9px] py-[5px]`}
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button 
                      onClick={() => onReject(req)} 
                      disabled={reviewQueryFetching} 
                      className={`${btnBaseClass} bg-[rgba(239,68,68,0.08)] text-[#ef4444] border border-[rgba(239,68,68,0.25)] px-[9px] py-[5px]`}
                    >
                      <X size={12} /> Not Select
                    </button>
                  </>)}
                  {req.status !== 'pending' && (
                    <button 
                      onClick={() => onSelectReq(req)} 
                      className={`${btnBaseClass} bg-transparent border border-[#70d64d] text-[#70d64d] px-[9px] py-[4px] text-[0.72rem]`}
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
  );
};

export default RegistrationRequestsTable;

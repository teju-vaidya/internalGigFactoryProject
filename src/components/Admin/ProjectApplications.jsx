import React from 'react';
import { X, Check, XCircle } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ProjectApplications({ project, applications = [], onClose, onApprove, onReject }) {
  const apps = applications.filter(a => a.projectId === project.id);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-[3px] z-[700]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[800px] bg-[#121215] border border-[#23232a] rounded-[10px] overflow-hidden z-[701] shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#23232a] bg-[#0c0c0e]">
          <div>
            <h3 className="text-white font-bold">Applications — {project.title}</h3>
            <p className="text-gray-500 text-sm">Manage incoming applications for this project</p>
          </div>
          <div>
            <button onClick={onClose} className="bg-transparent border border-[#23232a] text-gray-300 p-2 rounded"><X size={16} /></button>
          </div>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {apps.length === 0 ? (
            <div className="text-gray-500 p-6">No applications yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {apps.map(a => (
                <div key={a.id} className="bg-[#0c0c0e] border border-[#23232a] p-3 rounded flex justify-between items-center">
                  <div>
                    <div className="text-white font-semibold">{a.name} <span className="text-xs text-gray-400 ml-2">({a.applicantType})</span></div>
                    <div className="text-gray-400 text-sm">Submitted: {fmtDate(a.submittedAt)}</div>
                    <div className="text-sm text-gray-300 mt-1">Status: <span className={`font-bold ${a.status === 'approved' ? 'text-[#70d64d]' : a.status === 'rejected' ? 'text-[#ef4444]' : 'text-gray-400'}`}>{a.status === 'rejected' ? 'not selected' : a.status}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onApprove(a.id)} disabled={a.status==='approved'} className="px-3 py-2 bg-[#70d64d] text-black rounded font-bold flex items-center gap-2"><Check size={14}/>Approve</button>
                    <button onClick={() => onReject(a.id)} disabled={a.status==='rejected'} className="px-3 py-2 bg-[#ef4444] text-white rounded font-bold flex items-center gap-2"><XCircle size={14}/>Not Select</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

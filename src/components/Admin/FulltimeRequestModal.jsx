import React, { useState } from 'react';
import { X, Mail, Phone, Globe, FileText, Calendar, ExternalLink, Trash2, CheckCircle2, Briefcase } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../../utils/api';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 'reviewed', label: 'Reviewed', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  { value: 'shortlisted', label: 'Shortlisted', color: '#70d64d', bg: 'rgba(112,214,77,0.12)' },
  { value: 'rejected', label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
];

export const FulltimeRequestModal = ({ request, onClose }) => {
  const [status, setStatus] = useState(request?.status || 'pending');
  const [adminNotes, setAdminNotes] = useState(request?.admin_notes || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`/fulltime-requests/${request.id}/status`, data),
    onSuccess: (res) => {
      toast.success(res.message || 'Application updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-fulltime-requests'] });
      if (request) {
        request.status = status;
        request.admin_notes = adminNotes;
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/fulltime-requests/${request.id}`),
    onSuccess: () => {
      toast.success('Application deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-fulltime-requests'] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete application');
    },
  });

  if (!request) return null;

  const handleSaveStatus = () => {
    updateMutation.mutate({ status, admin_notes: adminNotes });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to permanently delete this application?')) {
      deleteMutation.mutate();
    }
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const initials = request.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CA';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-[#23232a] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#23232a] flex items-center justify-between bg-[#0c0c0e]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1e293b] to-[#2563eb22] border border-[#23232a] flex items-center justify-center font-bold text-[#70d64d] text-lg shrink-0">
              {initials}
            </div>
            <div>
              <h3 className="text-white font-extrabold text-xl m-0">{request.full_name}</h3>
              <p className="text-gray-500 text-xs mt-1 flex items-center gap-2">
                <Calendar size={13} /> Applied on {fmtDate(request.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#1f1f25] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          {/* Area of Interest */}
          <div className="bg-[#181820] border border-[#23232a] p-4 rounded-xl space-y-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">Area of Interest</span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-[#22c55e]/10 text-[#4ade80] border border-[#22c55e]/30 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2">
                <Briefcase size={14} />
                {request.interested_in || 'Not specified'}
              </span>
              {request.other_interested_in && (
                <div className="text-gray-300 text-xs">
                  <span className="text-gray-500 mr-1.5 font-medium">Specified Interest:</span>
                  <span className="text-[#38bdf8] font-semibold">{request.other_interested_in}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact & Links Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#181820] border border-[#23232a] p-4 rounded-xl space-y-2.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">Contact Details</span>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail size={14} className="text-[#70d64d] shrink-0" />
                <a href={`mailto:${request.email}`} className="hover:text-white truncate">{request.email}</a>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone size={14} className="text-[#70d64d] shrink-0" />
                <a href={`tel:${request.phone}`} className="hover:text-white">{request.phone}</a>
              </div>
            </div>

            <div className="bg-[#181820] border border-[#23232a] p-4 rounded-xl space-y-2.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">Attachments & Portfolio</span>
              {request.portfolio ? (
                <div className="flex items-center gap-2 text-gray-300">
                  <Globe size={14} className="text-[#38bdf8] shrink-0" />
                  <a
                    href={request.portfolio.startsWith('http') ? request.portfolio : `https://${request.portfolio}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#38bdf8] hover:underline flex items-center gap-1 truncate"
                  >
                    View Portfolio <ExternalLink size={12} />
                  </a>
                </div>
              ) : (
                <p className="text-gray-500 text-xs italic">No portfolio provided</p>
              )}
              {request.cv_url && (
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[#70d64d] shrink-0" />
                  <a
                    href={request.cv_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#70d64d] hover:underline font-semibold flex items-center gap-1 truncate"
                  >
                    {request.cv_file_name || 'Download / View Resume'} <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Cover Letter (if exists for legacy requests) */}
          {request.cover_letter && (
            <div className="bg-[#181820] border border-[#23232a] p-4 rounded-xl space-y-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">Cover Letter (Legacy)</span>
              <p className="text-gray-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-2 text-xs sm:text-sm">
                {request.cover_letter}
              </p>
            </div>
          )}

          {/* Status & Review Controls */}
          <div className="bg-[#181820] border border-[#23232a] p-4 rounded-xl space-y-4">
            <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">Application Status & Admin Notes</span>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <label className="text-gray-400 text-xs shrink-0">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-[#0c0c0e] border border-[#23232a] text-white rounded-lg px-3 py-2 text-xs outline-none cursor-pointer flex-1"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={handleSaveStatus}
                disabled={updateMutation.isPending}
                className="bg-[#70d64d] hover:bg-[#5dbd3d] text-black font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <CheckCircle2 size={14} />
                {updateMutation.isPending ? 'Saving...' : 'Update Status'}
              </button>
            </div>

            <div>
              <label className="text-gray-400 text-xs block mb-1.5">Internal Review Notes:</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about candidate interview, experience, or next steps..."
                className="w-full bg-[#0c0c0e] border border-[#23232a] text-white rounded-xl p-3 text-xs outline-none focus:border-[#70d64d] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#23232a] bg-[#0c0c0e] flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1.5 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={14} /> Delete Application
          </button>
          <button
            onClick={onClose}
            className="bg-[#1f1f25] hover:bg-[#2a2a33] text-gray-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

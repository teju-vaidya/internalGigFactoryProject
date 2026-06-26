import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';

export const RejectModal = ({ request, onClose, onConfirm, isPending }) => {
  const [reason, setReason] = useState('');
  if (!request) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.warning('Not selected reason is required.');
      return;
    }
    onConfirm(request.id, reason.trim());
  };

  return (
    <>
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/70 backdrop-blur-[3px] z-[900]" 
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] bg-[#181818] border border-[#2c2c2c] rounded-[10px] overflow-hidden z-[901] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        <div className="h-[3px] bg-[#ef4444]" />
        <div className="py-5 px-6 border-b border-[#2c2c2c] flex items-center gap-3">
          <div className="w-9 h-9 bg-[#ef4444]/10 border border-[#ef4444]/25 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={18} color="#ef4444" />
          </div>
          <div className="flex-1">
            <p className="text-white font-extrabold text-[0.95rem] m-0">Not Selected Application</p>
            <p className="text-[#6b7280] text-[0.78rem] mt-0.5 mb-0 mx-0">{request.full_name} — {request.role}</p>
          </div>
          <button 
            onClick={onClose} 
            className="bg-transparent border border-[#2c2c2c] text-[#8a8a8a] rounded-md py-[5px] px-[7px] cursor-pointer flex items-center"
          >
            <X size={15}/>
          </button>
        </div>
        <div className="py-5 px-6">
          <label className="text-[#8a8a8a] text-[0.78rem] font-semibold block mb-2">
            Reason for Not Selected <span className="text-[#ef4444]">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe why this application is being not selected…"
            autoFocus
            className="w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-md text-white text-[0.85rem] py-2.5 px-3 outline-none resize-y font-inherit"
          />
          <div className="flex gap-2.5 mt-4">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30 rounded-md py-2.5 px-4 text-[0.83rem] font-bold cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X size={13}/> {isPending ? 'Not Selecting…' : 'Confirm Not Selected'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-transparent border border-[#2c2c2c] text-[#8a8a8a] rounded-md py-2.5 px-4 text-[0.83rem] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export const RegistrationRequestRejectModal = ({ request, onClose, onConfirm, isPending }) => {
  const [reason, setReason] = useState('');
  const [noReason, setNoReason] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(request.id, noReason ? '' : reason.trim());
  };

  const btnBaseClass = "inline-flex items-center gap-[5px] rounded-[5px] text-[0.8rem] font-bold cursor-pointer transition-opacity duration-150";

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-[4px] z-[700]" 
        onClick={onClose} 
      />
      <div 
        style={{ animation: 'modalIn 0.2s ease-out' }} 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] bg-[#181818] border border-[#2c2c2c] rounded-[10px] overflow-hidden z-[701] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-center gap-[12px] px-[24px] py-[20px] border-b border-[#2c2c2c]">
          <div className="w-[36px] h-[36px] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={20} color="#ef4444" />
          </div>
          <div className="flex-1">
            <h3 className="text-white text-[1rem] font-extrabold m-0">Reject Application</h3>
            <p className="text-gray-500 text-[0.78rem] m-0 mt-[2px]">{request?.full_name} — {request?.role}</p>
          </div>
          <button 
            onClick={onClose} 
            className="bg-transparent border border-[#2c2c2c] text-[#8a8a8a] rounded-[6px] px-[8px] py-[6px] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-[24px] pt-[20px]">
          <label className="flex items-center gap-[8px] text-white text-[0.82rem] cursor-pointer mb-[12px]">
            <input type="checkbox" checked={noReason} onChange={e => setNoReason(e.target.checked)} className="accent-[#70d64d]" />
            Do not provide a rejection reason
          </label>
          {!noReason && (
            <textarea 
              rows={4} 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Describe why this application is not being selected…" 
              className="w-full bg-[#1f1f1f] border border-[#2c2c2c] rounded-[6px] text-white text-[0.85rem] px-[12px] py-[10px] outline-none resize-y font-inherit box-border" 
              autoFocus 
            />
          )}
          <div className="flex gap-[10px] mt-[20px]">
            <button 
              type="submit" 
              className={`${btnBaseClass} bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] px-[18px] py-[9px] flex-1`} 
              disabled={isPending}
            >
              <X size={14} /> {isPending ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className={`${btnBaseClass} bg-transparent border border-[#23232a] text-[#8a8a8a] px-[18px] py-[9px]`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default RegistrationRequestRejectModal;

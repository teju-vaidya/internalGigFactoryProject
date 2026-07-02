import React from 'react';
import { X, Calendar, Wallet, CheckCircle, FileText, Download, Paperclip } from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ViewReceiptModal({ milestone, payment, onClose }) {
  if (!payment) return null;

  const proofs = payment.milestone_payment_proofs || [];

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-[9998] transition-opacity duration-150" 
      />
      
      {/* Modal Container */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-[#0c0c0e] border border-[#23232a] rounded-[10px] p-6 z-[9999] shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <header className="flex justify-between items-start mb-6 border-b border-[#23232a] pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle size={18} className="text-[#70d64d]" /> Payment Receipt
            </h3>
            <p className="text-xs text-gray-500">Milestone #{milestone.milestone_no}: {milestone.title}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-white border border-[#23232a] rounded-[6px] p-1.5 transition-all duration-150 bg-transparent cursor-pointer" 
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-6">
          {/* Amount Paid banner */}
          <div className="bg-[#121215] border border-[#23232a] rounded-[8px] p-4 text-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Total Amount Paid</span>
            <span className="text-2xl font-extrabold text-[#70d64d] block mt-1">
              ₹{Number(payment.amount).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Details Table */}
          <div className="bg-[#121215] border border-[#23232a] rounded-[8px] divide-y divide-[#23232a] text-xs">
            <div className="p-3.5 flex justify-between items-center">
              <span className="text-gray-500 font-semibold uppercase">Payment Date</span>
              <span className="text-white font-bold flex items-center gap-1.5">
                <Calendar size={12} className="text-gray-400" /> {fmtDate(payment.payment_date || payment.updated_at)}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-gray-500 font-semibold uppercase">Payment Method</span>
              <span className="text-white font-bold capitalize flex items-center gap-1.5">
                <Wallet size={12} className="text-gray-400" /> {payment.payment_method?.replace('_', ' ') || 'Bank Transfer'}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-gray-500 font-semibold uppercase">Transaction Reference</span>
              <span className="text-white font-bold font-mono tracking-wide">{payment.transaction_reference || '—'}</span>
            </div>

            {payment.remarks && (
              <div className="p-3.5 flex flex-col gap-1">
                <span className="text-gray-500 font-semibold uppercase block">Transaction Remarks</span>
                <span className="text-gray-300 italic">"{payment.remarks}"</span>
              </div>
            )}
          </div>

          {/* Proof of Payment attachment */}
          {proofs.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Receipt &amp; Proof Document</span>
              <div className="flex flex-col gap-2">
                {proofs.map((proof) => {
                const isImg =
                    proof.file_type?.startsWith("image/") ||
                    ["png", "jpg", "jpeg", "gif", "webp"].includes(
                      proof.file_name.split(".").pop().toLowerCase(),
                    );
                  return (
                    <div
                      key={proof.id}
                      className="flex flex-col gap-2 bg-[#0c0c0e] border border-[#23232a] p-3 rounded-[8px]"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip size={14} className="text-gray-500 shrink-0" />
                          <span
                            className="text-white text-[0.8rem] font-semibold truncate"
                            title={proof.file_name}
                          >
                            {proof.file_name}
                          </span>
                        </div>
                        <a
                          href={proof.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#202024] hover:bg-[#2d2d34] border border-[#2d2d34] text-gray-300 hover:text-white rounded-[6px] px-3 py-1.5 text-[0.7rem] font-bold cursor-pointer transition-colors no-underline shrink-0"
                        >
                          View File
                        </a>
                      </div>
                      {isImg && (
                        <div className="mt-1 border border-[#23232a] rounded-[6px] overflow-hidden bg-[#000] flex justify-center max-h-[180px]">
                          <img
                            src={proof.file_url}
                            alt={proof.file_name}
                            className="object-contain max-w-full max-h-[180px]"
                          />
                        </div>
                      )}
                    </div>
                  );
              })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t border-[#23232a] mt-6">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full bg-[#1a1a20] hover:bg-[#252530] border border-[#2d2d38] text-white font-bold py-2.5 rounded-[6px] text-xs transition duration-150 cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </>
  );
}

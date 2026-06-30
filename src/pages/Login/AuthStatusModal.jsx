import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Clock, XCircle, RefreshCw, UserPlus, X, CheckCircle } from 'lucide-react';


/* ─── live cooldown hook ─────────────────────────────────────────────── */
function useCooldown(dateStr) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!dateStr) return;
    const tick = () => {
      const diff = new Date(dateStr) - Date.now();
      if (diff <= 0) { setRemaining('Cooldown expired'); return; }
      const d = Math.floor(diff / 864e5);
      const h = Math.floor((diff % 864e5) / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      const s = Math.floor((diff % 6e4) / 1e3);
      if (d > 0) setRemaining(`${d}d ${h}h ${m}m remaining`);
      else if (h > 0) setRemaining(`${h}h ${m}m ${s}s remaining`);
      else setRemaining(`${m}m ${s}s remaining`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dateStr]);

  return remaining;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getActionColor(action) {
  switch (action) {
    case 'SUBMITTED': return '#3b82f6';
    case 'REAPPLIED': return '#8b5cf6';
    case 'APPROVED': return 'var(--accent-lime)';
    case 'REJECTED': return '#ef4444';
    default: return '#71717a';
  }
}

/* ─── main component ─────────────────────────────────────────────────── */
const AuthStatusModal = ({ isOpen, onClose, statusData, email, onRegisterTrigger, onReapplyTrigger }) => {
  const overlayRef = useRef(null);
  const cooldown = useCooldown(statusData?.canReapplyAt);

  // close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // close on backdrop click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen || !statusData) return null;

  const {
    status,
    rejectionReason,
    canReapplyAt,
    applicationData,
    role,
    fullName,
    mobile,
  } = statusData;

  const handleRegisterRedirect = () => {
    onClose();
    if (onRegisterTrigger) {
      onRegisterTrigger(email);
    }
  };

  const handleReapplyRedirect = () => {
    onClose();
    if (onReapplyTrigger) {
      onReapplyTrigger(
        applicationData,
        role || 'gig_expert',
        email || statusData.email,
        fullName || statusData.fullName,
        mobile || statusData.mobile
      );
    }
  };

  /* ── icon and title per status ──────────────────────── */
  const META = {
    user_not_found:      { Icon: AlertTriangle, title: 'Account Not Found' },
    pending_approval:    { Icon: Clock,         title: 'Review in Progress' },
    rejected_cooldown:   { Icon: XCircle,       title: 'Application Not Selected' },
    rejected_can_reapply:{ Icon: RefreshCw,     title: 'Reapply Available' },
  };
  const { Icon, title } = META[status] || META.user_not_found;

  return (
    <>
      {/* overlay */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 bg-black/80 backdrop-blur-[4px] z-[9998] animate-[gf-overlay-in_0.2s_ease-out]"
      />

      {/* modal card */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 pointer-events-none">
        <div className="w-full max-w-[420px] bg-[var(--card-bg)] rounded-[10px] shadow-[0_12px_36px_rgba(0,0,0,0.7)] border border-[var(--input-border)] overflow-hidden relative pointer-events-auto animate-[gf-modal-in_0.25s_cubic-bezier(0.22,1,0.36,1)]">

          {/* lime accent top bar */}
          <div className="h-[3px] bg-[var(--accent-lime)] w-full" />

          {/* close */}
          <button type="button" onClick={onClose} className="absolute top-3.5 right-3.5 bg-transparent border border-[var(--input-border)] rounded-md text-[var(--text-muted)] cursor-pointer py-1.25 px-1.75 flex items-center justify-center transition-all duration-150 leading-none" aria-label="Close">
            <X size={16} />
          </button>

          {/* body */}
          <div className="p-7 flex flex-col items-center text-center">

            {/* icon */}
            <div className="w-[60px] h-[60px] rounded-full bg-[#70d64d]/10 border-[1.5px] border-[#70d64d]/30 flex items-center justify-center text-[var(--accent-lime)] mb-4">
              <Icon size={28} strokeWidth={1.75} />
            </div>

            {/* title + lime underline */}
            <h2 className="text-[var(--text-main)] text-[1.25rem] font-extrabold tracking-[0.3px] mb-2">{title}</h2>
            <div className="w-10 h-[2px] bg-[var(--accent-lime)] rounded-[2px] mb-4" />

            {/* ────── USER NOT FOUND ────── */}
            {status === 'user_not_found' && (
              <>
                <p className="text-[var(--text-muted)] text-[0.85rem] leading-[1.6] mb-4">
                  No account is registered under{' '}
                  <span className="text-[var(--accent-lime)] font-semibold break-all">{email}</span>.
                  {' '}Join GigFactory to unlock premium gig opportunities!
                </p>

                <div className="flex gap-2.5 w-full">
                  <button type="button" className="flex-1 bg-[var(--accent-lime)] text-black border-none rounded-md py-[11px] px-4 text-[0.88rem] font-extrabold cursor-pointer flex items-center gap-1.75 transition-opacity duration-150" onClick={handleRegisterRedirect}>
                    <UserPlus size={15} /> Register Now &amp; Join
                  </button>
                  <button type="button" className="flex-1 bg-transparent text-[var(--text-muted)] border border-[var(--input-border)] rounded-md py-[11px] px-4 text-[0.88rem] font-semibold cursor-pointer flex items-center justify-center gap-1.75 transition-all duration-150" onClick={onClose}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* ────── PENDING APPROVAL ────── */}
            {status === 'pending_approval' && (
              <>
                <span className="inline-block px-3 py-1 rounded-[20px] text-[0.65rem] font-bold tracking-[1.2px] bg-[#70d64d]/10 text-[var(--accent-lime)] border border-[#70d64d]/25 mb-3.5 uppercase">WILL APPROVE SOON</span>

                <p className="text-[var(--text-muted)] text-[0.85rem] leading-[1.6] mb-4">
                  Your registration is currently being reviewed by our team. We&apos;re auditing your
                  work samples and credentials. Once approved, you&apos;ll receive a setup link via
                  email to activate your account.
                </p>

                <div className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md p-[10px_12px] mb-5 flex flex-col gap-2">
                  <InfoRow Icon={CheckCircle} text="Application submitted successfully" />
                  <InfoRow Icon={Clock}       text="Average review time: 1–3 business days" />
                </div>

                <button type="button" className="flex-1 bg-[var(--accent-lime)] text-black border-none rounded-md py-[11px] px-4 text-[0.88rem] font-extrabold cursor-pointer flex items-center gap-1.75 transition-opacity duration-150 w-full justify-center" onClick={onClose}>
                  Got It
                </button>
              </>
            )}

            {/* ────── REJECTED – COOLDOWN ────── */}
            {status === 'rejected_cooldown' && (
              <>
                <p className="text-[var(--text-muted)] text-[0.85rem] leading-[1.6] mb-4">
                  Unfortunately, your registration request was not approved by our administrators.
                  A cooldown period is currently active.
                </p>

                {rejectionReason && <ReasonBox label="REASON FOR NOT SELECTING" text={rejectionReason} />}

                <div className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md p-[14px_12px] text-center mb-4.5">
                  <span className="block text-[0.6rem] font-bold tracking-[1.5px] text-[var(--text-muted)] uppercase mb-2">COOLDOWN IN EFFECT</span>
                  <p className="text-[var(--text-main)] text-[1.4rem] font-extrabold tabular-nums mb-1.5 tracking-[0.5px]">{cooldown}</p>
                  <p className="text-[var(--text-muted)] text-[0.75rem] m-0">
                    You can reapply after:{' '}
                    <strong className="text-[var(--text-main)] font-semibold">{formatDate(canReapplyAt)}</strong>
                  </p>
                </div>

                <button type="button" className="flex-1 bg-transparent text-[var(--text-muted)] border border-[var(--input-border)] rounded-md py-[11px] px-4 text-[0.88rem] font-semibold cursor-pointer flex items-center justify-center gap-1.75 transition-all duration-150 w-full" onClick={onClose}>
                  Close
                </button>
              </>
            )}

            {/* ────── REJECTED – CAN REAPPLY ────── */}
            {status === 'rejected_can_reapply' && (
              <>
                <p className="text-[var(--text-muted)] text-[0.85rem] leading-[1.6] mb-4">
                  Your previous application was not selected, but your cooldown has expired!
                  Review, edit, and resubmit your application below.
                </p>

                {rejectionReason && <ReasonBox label="PREVIOUS REASON FOR NOT SELECTING" text={rejectionReason} />}

                <p className="text-[var(--text-muted)] text-[0.75rem] mb-5">
                  Your previous details have been saved for your convenience.
                </p>

                <div className="flex gap-2.5 w-full">
                  <button type="button" className="flex-1 bg-[var(--accent-lime)] text-black border-none rounded-md py-[11px] px-4 text-[0.88rem] font-extrabold cursor-pointer flex items-center gap-1.75 transition-opacity duration-150" onClick={handleReapplyRedirect}>
                    <RefreshCw size={15} /> Edit &amp; Reapply
                  </button>
                  <button type="button" className="flex-1 bg-transparent text-[var(--text-muted)] border border-[var(--input-border)] rounded-md py-[11px] px-4 text-[0.88rem] font-semibold cursor-pointer flex items-center justify-center gap-1.75 transition-all duration-150" onClick={onClose}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Timeline History */}
            {statusData.history && statusData.history.length > 0 && (
              <div className="w-full text-left mt-6 border-t border-[var(--input-border)] pt-5">
                <h3 className="text-[0.75rem] font-extrabold text-[var(--text-muted)] tracking-[1px] mb-3.5">APPLICATION HISTORY</h3>
                <div className="flex flex-col gap-4 pl-1">
                  {statusData.history.map((log, index) => {
                    const isLast = index === statusData.history.length - 1;
                    return (
                      <div key={log.id || index} className="flex gap-3">
                        <div className="flex flex-col items-center relative">
                          <div 
                            className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" 
                            style={{ backgroundColor: getActionColor(log.action) }} 
                          />
                          {!isLast && <div className="w-[2px] bg-[var(--input-border)] absolute top-3.5 bottom-[-16px]" />}
                        </div>
                        <div className="flex-1 flex flex-col gap-0.5">
                          <div className="flex justify-between items-baseline gap-2.5">
                            <span className="text-[0.82rem] font-bold text-[var(--text-main)]">{log.action}</span>
                            <span className="text-[0.72rem] text-[var(--text-muted)]">{formatDate(log.created_at)}</span>
                          </div>
                          {log.rejection_reason && (
                            <p className="text-[0.78rem] text-[#f87171] mt-1 mb-0 mx-0 bg-[#ef4444]/5 border border-[#ef4444]/10 rounded py-1.5 px-2.5 leading-[1.4]">
                              Reason: {log.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes gf-modal-in {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gf-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};

/* ─── sub-components ─────────────────────────────────────────────────── */
function InfoRow({ Icon, text }) {
  return (
    <div className="flex items-center gap-2 text-left">
      <Icon size={13} className="text-[var(--accent-lime)] shrink-0" />
      <span className="text-[0.8rem] text-[var(--text-muted)]">{text}</span>
    </div>
  );
}

function ReasonBox({ label, text }) {
  return (
    <div className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md p-[10px_12px] text-left mb-3">
      <span className="block text-[0.6rem] font-bold tracking-[1.5px] text-[var(--text-muted)] uppercase mb-1.5">{label}</span>
      <p className="text-[var(--text-main)] text-[0.82rem] leading-[1.5] m-0">{text}</p>
    </div>
  );
}


export default AuthStatusModal;
